// Cópia da viagem no aparelho + fila de edições feitas sem internet.
//
// Leitura: o app pede a viagem ao servidor; se não há internet (ou ela está lenta demais), usa a cópia
// guardada no aparelho. Toda resposta boa do servidor atualiza a cópia.
// Escrita: com internet e sem fila, vai direto ao servidor como sempre. Sem internet (ou com a fila
// não vazia, para manter a ordem), a edição entra numa fila guardada no aparelho, a cópia local já mostra
// a mudança e a fila é enviada sozinha quando a internet volta.
// Segurança dos dados:
// - cada edição leva um id (X-Op-Id): se o servidor já recebeu e a resposta se perdeu, ele não repete
// - edição que o servidor recusa (ex.: item apagado em outro aparelho) não some: vai para "não salvas",
//   com opção de tentar de novo, baixar ou descartar
// - mesmo campo mudado em outro aparelho: vale a edição deste, e o valor que estava lá fica registrado
//   em "conflitos" e num backup automático tirado antes de sincronizar
import { classify, optimistic, applyOp, remap, tempRefs, conflicts as findConflicts, diffPatch, tempId, isTemp, describe, COLLS } from './ops.js';

const MAX_BACKUPS = 20; // por viagem
const AUTO_BACKUP_GAP = 6 * 3600e3; // backup automático no máximo a cada 6 h (e só se algo mudou)
const READ_TIMEOUT = 7000; // com cópia local, esperar a rede no máximo isto antes de mostrar a cópia
const WRITE_TIMEOUT = 15000;
const MAX_SERVER_TRIES = 8; // erro do servidor (5xx) repetido: depois disso a edição vai para "não salvas"

const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// backup sem segredos: sem tokens de link de visitante e de agenda (o mesmo que o "Exportar backup")
export function cleanBackup(data) {
  if (!data?.trip) return data;
  const { shares: _s, ...rest } = data;
  const { share_token: _t, cal_token: _c, ...trip } = rest.trip;
  return { ...rest, trip };
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function createSync({ store, fetchImpl = (...a) => fetch(...a), isOnline = () => navigator.onLine, onAuthRequired = () => {}, now = () => Date.now() }) {
  let state = { outbox: [], idmap: {}, failed: [], conflicts: [] };
  const snaps = new Map(); // tripId → { savedAt, data } (espelho em memória do que está no aparelho)
  let flushing = null;
  let lastSync = null;
  let lastError = '';
  let local = {}; // tripId → hora da cópia mostrada por falta de internet
  const statusFns = new Set();
  const tripFns = new Set();

  const ready = (async () => {
    const [outbox, idmap, failed, conflicts] = await Promise.all(['outbox', 'idmap', 'failed', 'conflicts'].map((k) => store.get(k).catch(() => undefined)));
    state = { outbox: outbox || [], idmap: idmap || {}, failed: failed || [], conflicts: conflicts || [] };
  })();

  // outra aba pode ter mexido na fila: relê antes de mexer
  async function reload() {
    const [outbox, idmap, failed, conflicts] = await Promise.all(['outbox', 'idmap', 'failed', 'conflicts'].map((k) => store.get(k)));
    state = { outbox: outbox || [], idmap: idmap || {}, failed: failed || [], conflicts: conflicts || [] };
  }
  const save = () => Promise.all(['outbox', 'idmap', 'failed', 'conflicts'].map((k) => store.set(k, state[k])));

  const status = () => ({
    pending: state.outbox.length,
    failed: state.failed.length,
    conflicts: state.conflicts.length,
    syncing: !!flushing,
    lastSync,
    lastError,
    local: { ...local },
    storage: store.kind,
  });
  const emit = () => { const s = status(); statusFns.forEach((f) => { try { f(s); } catch { /* ok */ } }); };
  const changed = (tripId) => tripFns.forEach((f) => { try { f(tripId); } catch { /* ok */ } });

  // ── rede
  async function raw(method, url, body, { opId, timeout } = {}) {
    const ctl = new AbortController();
    const timer = timeout ? setTimeout(() => ctl.abort(), timeout) : null;
    let res;
    try {
      res = await fetchImpl(url, {
        method,
        keepalive: method === 'DELETE', // exclusão adiada ainda chega ao servidor se a página fechar
        signal: ctl.signal,
        // X-TP-Live: o service worker não responde com a cópia dele (a cópia é esta, no IndexedDB)
        headers: { 'X-TP-Live': '1', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(opId ? { 'X-Op-Id': opId } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      const err = new Error(ctl.signal.aborted ? 'a internet está lenta demais' : 'sem conexão com o servidor');
      err.network = true;
      err.timeout = ctl.signal.aborted;
      throw err;
    } finally { if (timer) clearTimeout(timer); }
    if (res.status === 401 && !url.startsWith('/api/login')) onAuthRequired();
    if (!res.ok) {
      let msg = await res.text().catch(() => '');
      try { msg = JSON.parse(msg).error || msg; } catch { /* texto puro */ }
      throw new HttpError(res.status, `${method} ${url} → ${res.status} ${msg}`.trim());
    }
    return res.status === 204 ? null : res.json();
  }

  // ── cópia da viagem no aparelho
  async function getSnap(tripId) {
    if (snaps.has(tripId)) return snaps.get(tripId);
    const s = await store.get(`trip:${tripId}`);
    if (s) snaps.set(tripId, s);
    return s || null;
  }
  async function putSnap(tripId, data) {
    const s = { savedAt: now(), data };
    snaps.set(tripId, s);
    await store.set(`trip:${tripId}`, s);
    return s;
  }
  async function allSnapIds() {
    return (await store.keys('trip:')).map((k) => Number(k.slice(5))).filter(Number.isFinite);
  }
  // em qual viagem está o item (as rotas de item não levam o id da viagem)
  async function tripOf(coll, id) {
    for (const t of await allSnapIds()) {
      const s = await getSnap(t);
      if ((s?.data?.[coll] || []).some((x) => x.id === id)) return t;
    }
    return null;
  }
  // edições ainda na fila aplicadas por cima de uma cópia (ex.: a que acabou de vir do servidor)
  function reapply(tripId, data) {
    let d = data;
    for (const op of state.outbox) {
      if (op.tripId !== tripId) continue;
      const r = remap(op, state.idmap);
      d = applyOp(d, r, optimistic(r, d));
    }
    return d;
  }
  const hasPending = (tripId) => state.outbox.some((op) => op.tripId === tripId);

  // ── backups automáticos no aparelho
  async function backupKeys(tripId) {
    return (await store.keys(`bk:${tripId}:`)).sort();
  }
  async function addBackup(tripId, data, reason = 'auto') {
    if (!data?.trip) return false;
    const clean = cleanBackup(data);
    const h = hash(JSON.stringify(clean));
    const keys = await backupKeys(tripId);
    const last = keys.length ? await store.get(keys[keys.length - 1]) : null;
    if (last?.hash === h) return false;
    if (reason === 'auto' && last && now() - last.at < AUTO_BACKUP_GAP) return false;
    const at = now();
    await store.set(`bk:${tripId}:${String(at).padStart(15, '0')}`, { tripId, at, reason, hash: h, name: clean.trip.name, data: clean });
    for (const k of keys.slice(0, Math.max(0, keys.length + 1 - MAX_BACKUPS))) await store.del(k);
    return true;
  }

  async function freshSnapshot(tripId, data) {
    await putSnap(tripId, reapply(tripId, data));
    delete local[tripId];
    addBackup(tripId, data).catch(() => {});
  }

  // ── leitura
  async function getTrip(tripId) {
    await ready;
    const saved = await getSnap(tripId);
    if (hasPending(tripId) && isOnline()) await Promise.race([flush(), sleep(READ_TIMEOUT)]);
    if (hasPending(tripId) && saved) { local[tripId] = saved.savedAt; emit(); return snaps.get(tripId).data; }
    const p = raw('GET', `/api/trips/${tripId}`, null, { timeout: 60000 });
    try {
      const fresh = await (saved ? Promise.race([p, sleep(READ_TIMEOUT).then(() => { const e = new Error('lenta'); e.network = true; e.slow = true; throw e; })]) : p);
      await freshSnapshot(tripId, fresh);
      emit();
      return snaps.get(tripId).data;
    } catch (e) {
      if (!e.network || !saved) {
        if (e.network) throw new Error('Sem internet, e esta viagem ainda não foi guardada neste aparelho. Abra-a uma vez com internet.');
        throw e;
      }
      // sem internet ou internet lenta: mostra a cópia; se a resposta ainda chegar, atualiza a tela
      if (e.slow) p.then(async (fresh) => { if (!hasPending(tripId)) { await freshSnapshot(tripId, fresh); emit(); changed(tripId); } }).catch(() => {});
      else p.catch(() => {});
      local[tripId] = saved.savedAt;
      emit();
      return saved.data;
    }
  }

  async function getTrips() {
    await ready;
    const saved = await store.get('trips');
    const fromSnaps = async () => {
      const list = [];
      for (const t of await allSnapIds()) {
        const s = await getSnap(t);
        if (s?.data?.trip) list.push({ ...s.data.trip, activity_count: (s.data.activities || []).length });
      }
      return list.sort((a, b) => String(a.start).localeCompare(String(b.start)));
    };
    try {
      const p = raw('GET', '/api/trips', null, { timeout: 60000 });
      const list = await (saved ? Promise.race([p, sleep(READ_TIMEOUT).then(() => { const e = new Error('lenta'); e.network = true; throw e; })]) : p);
      await store.set('trips', { savedAt: now(), list });
      return list;
    } catch (e) {
      if (!e.network) throw e;
      const list = saved?.list || (await fromSnaps());
      if (!list.length && !saved) throw new Error('Sem internet, e as viagens ainda não foram guardadas neste aparelho.');
      return list;
    }
  }

  // ── escrita
  async function request(method, url, body) {
    await ready;
    const kind = classify(method, url);
    if (!kind) {
      try { return await raw(method, url, body, { opId: method === 'GET' ? undefined : uid(), timeout: method === 'GET' ? undefined : 60000 }); } catch (e) {
        if (e.network) throw new Error('Isso precisa de internet. Tente de novo quando estiver conectado.');
        throw e;
      }
    }
    await reload();
    const tripId = kind.tripId ?? (await tripOf(kind.coll, isTemp(kind.id) ? kind.id : kind.id));
    const snap = tripId != null ? await getSnap(tripId) : null;
    const data = snap?.data;
    const row = kind.id != null ? (data?.[kind.coll] || []).find((x) => x.id === kind.id) : null;
    let op = { opId: uid(), method, url, body, kind, tripId, at: now(), tries: 0, label: row?.title || row?.text || row?.name || body?.title || body?.text || body?.name || '' };
    op = remap(op, state.idmap); // a tela pode ainda ter um id provisório que já virou real

    const direct = !state.outbox.length && isOnline();
    if (direct) {
      try {
        const res = await raw(op.method, op.url, op.body, { opId: op.opId, timeout: WRITE_TIMEOUT });
        if (tripId != null && data) await putSnap(tripId, applyOp(snaps.get(tripId).data, op.kind.type === 'update' ? { ...op, body: res || op.body } : op, res));
        lastError = '';
        return res;
      } catch (e) {
        if (!e.network) throw e;
        // caiu a rede no meio: vai para a fila com o mesmo id (se o servidor já tinha recebido, não repete)
      }
    }

    // ── fila
    if (kind.type === 'delete' && isTemp(op.kind.id)) {
      // item criado sem internet e apagado antes de sincronizar: some da fila, nada vai ao servidor
      const id = op.kind.id;
      state.outbox = state.outbox
        .filter((o) => o.tempId !== id && !tempRefs(o).includes(id) || o.kind.type === 'reorder')
        .map((o) => (o.kind.type === 'reorder' ? { ...o, body: { ...o.body, ids: o.body.ids.filter((x) => Number(x) !== id) } } : o));
      await save();
      if (data) await putSnap(tripId, applyOp(data, op, null));
      emit();
      return null;
    }
    if (kind.type === 'update' || kind.type === 'trip') {
      const cur = kind.type === 'trip' ? data?.trip : row;
      const patch = diffPatch(cur, body || {});
      if (cur && !Object.keys(patch).length) return optimistic(op, data); // nada mudou de fato
      op.body = patch;
      op.base = cur ? Object.fromEntries(Object.keys(patch).map((k) => [k, cur[k] ?? null])) : null;
    }
    if (['create', 'schedule', 'unschedule'].includes(kind.type)) op.tempId = tempId();
    const result = optimistic(op, data);
    state.outbox.push(op);
    await save();
    if (data) await putSnap(tripId, applyOp(data, op, result));
    emit();
    schedule(1500);
    return result;
  }

  // anexos e fotos enviados com internet: entram na cópia do aparelho na hora
  async function noteCreated(coll, tripId, row) {
    if (tripId == null || !row) return;
    const s = await getSnap(tripId);
    if (s) await putSnap(tripId, applyOp(s.data, { kind: { type: 'create', coll } }, row));
  }

  // ── envio da fila
  function failOp(op, error) {
    state.failed.push({ ...op, error: String(error).slice(0, 300), failedAt: now() });
  }

  async function run() {
    await reload();
    if (!state.outbox.length || !isOnline()) return;
    emit();
    const touched = new Set();
    // a versão do servidor antes de enviar: para achar conflitos e guardar num backup
    const server = {};
    for (const t of new Set(state.outbox.filter((o) => o.tripId != null).map((o) => o.tripId))) {
      try {
        server[t] = await raw('GET', `/api/trips/${t}`, null, { timeout: 20000 });
        await addBackup(t, server[t], 'antes de sincronizar');
      } catch (e) {
        if (e.network) { lastError = e.message; return; }
        if (e.status === 401) return;
        if (e.status === 404) server[t] = null; // a viagem foi apagada no servidor: cada edição dela vai falhar e ficar guardada
      }
    }
    while (state.outbox.length) {
      const op = state.outbox[0];
      if (op.nextAt && op.nextAt > now()) break;
      const r = remap(op, state.idmap);
      if (tempRefs(r).length) {
        state.outbox.shift();
        failOp(op, 'depende de um item criado sem internet que não pôde ser salvo');
        await save();
        continue;
      }
      if (server[op.tripId]) {
        const cs = findConflicts(r, server[op.tripId]);
        if (cs.length) state.conflicts.push({ at: now(), tripId: op.tripId, what: describe(op), coll: op.kind.coll || 'trip', id: r.kind.id ?? null, fields: cs });
      }
      try {
        const res = await raw(r.method, r.url, r.body, { opId: op.opId, timeout: 20000 });
        if (op.tempId != null && res?.id != null) state.idmap[op.tempId] = res.id;
        state.outbox.shift();
        if (op.tripId != null) touched.add(op.tripId);
        lastError = '';
        await save();
      } catch (e) {
        if (e.status === 401) { lastError = 'é preciso entrar de novo para enviar as edições'; break; }
        const retry = e.network || e.status >= 500 || [408, 409, 425, 429].includes(e.status);
        if (retry) {
          op.tries = (op.tries || 0) + (e.network ? 0 : 1);
          op.lastError = e.message;
          lastError = e.message;
          if (op.tries >= MAX_SERVER_TRIES) { state.outbox.shift(); failOp(op, e.message); await save(); continue; }
          op.nextAt = now() + Math.min(2 ** Math.max(op.tries, 1) * 2000, 120000);
          await save();
          break;
        }
        state.outbox.shift();
        failOp(op, e.message);
        await save();
      }
    }
    if (!state.outbox.length) lastSync = now();
    for (const t of touched) {
      try { await freshSnapshot(t, await raw('GET', `/api/trips/${t}`, null, { timeout: 20000 })); } catch { /* fica a cópia local */ }
      changed(t);
    }
  }

  function flush() {
    if (flushing) return flushing;
    const go = () => run().catch((e) => { lastError = String(e.message || e); });
    flushing = (globalThis.navigator?.locks ? navigator.locks.request('tp-sync', go) : go()).finally(() => { flushing = null; emit(); if (state.outbox.length) schedule(nextDelay()); });
    emit();
    return flushing;
  }
  const nextDelay = () => {
    const t = state.outbox[0]?.nextAt;
    return Math.max(3000, t ? t - now() : 15000);
  };
  let timer = null;
  function schedule(ms) {
    clearTimeout(timer);
    timer = setTimeout(() => { if (isOnline()) flush(); else schedule(15000); }, ms);
    timer?.unref?.(); // (Node, nos testes) não segura o processo aberto
  }
  // internet voltou: tenta já, sem esperar o intervalo de espera
  function wake() {
    state.outbox.forEach((o) => { o.nextAt = 0; });
    return flush();
  }

  // ── pendências, "não salvas" e conflitos
  async function retryFailed(i) {
    await reload();
    const op = state.failed[i];
    if (!op) return;
    state.failed.splice(i, 1);
    const { error: _e, failedAt: _f, ...rest } = op;
    state.outbox.push({ ...rest, tries: 0, nextAt: 0, opId: uid() });
    await save(); emit();
    return flush();
  }
  async function discardFailed(i) {
    await reload();
    const op = state.failed.splice(i, 1)[0];
    await save(); emit();
    // a cópia local ainda mostra a edição descartada: busca de novo a versão do servidor
    if (op?.tripId != null && isOnline() && !hasPending(op.tripId)) {
      try { await freshSnapshot(op.tripId, await raw('GET', `/api/trips/${op.tripId}`, null, { timeout: 20000 })); changed(op.tripId); } catch { /* depois */ }
    }
  }
  async function dismissConflicts() { await reload(); state.conflicts = []; await save(); emit(); }

  async function listBackups() {
    const keys = (await store.keys('bk:')).sort().reverse();
    const out = [];
    for (const k of keys) {
      const b = await store.get(k);
      if (b) out.push({ key: k, tripId: b.tripId, at: b.at, reason: b.reason, name: b.name, size: JSON.stringify(b.data).length, counts: { activities: b.data?.activities?.length || 0 } });
    }
    return out;
  }
  const backupData = async (key) => (await store.get(key))?.data || null;
  async function savedTrips() {
    const out = [];
    for (const t of await allSnapIds()) {
      const s = await getSnap(t);
      if (s?.data?.trip) out.push({ id: t, name: s.data.trip.name, savedAt: s.savedAt, start: s.data.trip.start, end: s.data.trip.end, data: s.data });
    }
    return out;
  }
  async function forgetTrip(tripId) {
    snaps.delete(tripId);
    await store.del(`trip:${tripId}`);
  }

  // guarda no aparelho todas as viagens (não só as abertas), para abrirem sem internet
  async function warmAll({ maxAge = 15 * 60e3 } = {}) {
    if (!isOnline()) return [];
    const list = await getTrips().catch(() => []);
    const today = new Date().toISOString().slice(0, 10);
    // primeiro a viagem em andamento e as próximas
    const order = [...list].sort((a, b) => (a.end >= today) - (b.end >= today) || String(a.start).localeCompare(String(b.start))).reverse();
    for (const t of order) {
      const s = await getSnap(t.id);
      if (s && now() - s.savedAt < maxAge) continue;
      await getTrip(t.id).catch(() => {});
    }
    return order;
  }

  return {
    ready, request, getTrip, getTrips, flush, wake, noteCreated,
    status, subscribe: (f) => { statusFns.add(f); return () => statusFns.delete(f); },
    onTripChanged: (f) => { tripFns.add(f); return () => tripFns.delete(f); },
    pendingList: () => state.outbox.map((op) => ({ ...op, what: describe(op) })),
    failedList: () => state.failed.map((op) => ({ ...op, what: describe(op) })),
    conflictList: () => state.conflicts,
    retryFailed, discardFailed, dismissConflicts,
    listBackups, backupData, addBackup, savedTrips, forgetTrip, warmAll,
    _state: () => state, _snap: getSnap, _raw: raw,
  };
}

export { COLLS };
