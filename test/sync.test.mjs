// Fila de edições sem internet: editar offline, reconectar, ids provisórios, falhas, conflitos e backups.
// Roda contra um servidor de mentira em memória (sem rede nem navegador): node --test
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSync } from '../web/src/offline/sync.js';
import { memoryStore } from '../web/src/offline/store.js';
import { classify, diffPatch, remap, tempRefs, conflicts, applyOp, optimistic } from '../web/src/offline/ops.js';

// servidor falso: uma viagem com atividades e checklist; guarda os X-Op-Id como o servidor de verdade
function fakeServer() {
  const db = {
    trip: { id: 1, name: 'Teste', start: '2026-11-06', end: '2026-11-20' },
    activities: [{ id: 10, trip_id: 1, day: '2026-11-06', title: 'Templo', done: 0, notes: null, sort: 0 }],
    checklist: [], stays: [], ideas: [], purchases: [], notes: [], cities: [], pages: [], photos: [], files: [], days: [], shares: [],
  };
  let next = 100;
  const ops = new Map();
  const calls = [];
  const srv = { db, calls, online: true, failNext: null, ops };
  const json = (status, body) => ({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) });
  srv.fetch = async (url, init = {}) => {
    if (!srv.online) throw new TypeError('Failed to fetch');
    const method = init.method || 'GET';
    calls.push(`${method} ${url}`);
    const opId = init.headers?.['X-Op-Id'];
    if (opId && ops.has(opId)) return ops.get(opId);
    let m;
    if (srv.failNext && (!srv.failMethod || srv.failMethod === method)) { const f = srv.failNext; srv.failNext = null; return json(f, { error: 'falha simulada' }); }
    // envio de anexo: corpo cru, dono na URL ou na viagem (X-Check-Id)
    if (method === 'POST' && (m = url.match(/^\/api\/(activities|trips)\/(-?\d+)\/files$/))) {
      const isAct = m[1] === 'activities';
      if (isAct && !db.activities.some((a) => a.id === Number(m[2]))) return json(404, { error: 'não encontrada' });
      const size = typeof init.body === 'string' ? init.body.length : init.body?.size ?? init.body?.length ?? 0;
      const row = { id: next++, trip_id: 1, activity_id: isAct ? Number(m[2]) : null, idea_id: null, check_id: Number(init.headers['X-Check-Id']) || null, name: decodeURIComponent(init.headers['X-File-Name']), type: init.headers['X-File-Type'], size, kind: 'doc' };
      db.files.push(row);
      const r = json(201, row);
      if (opId) ops.set(opId, r);
      return r;
    }
    const body = init.body ? JSON.parse(init.body) : null;
    let res;
    if (method === 'GET' && url === '/api/trips/1') res = json(200, structuredClone(db));
    else if (method === 'GET' && url === '/api/trips') res = json(200, [{ ...db.trip, activity_count: db.activities.length }]);
    else if (method === 'POST' && (m = url.match(/^\/api\/trips\/1\/(\w+)$/))) {
      const row = { ...body, id: next++, trip_id: 1 };
      db[m[1]].push(row);
      res = json(201, row);
    } else if (method === 'PUT' && (m = url.match(/^\/api\/(\w+)\/(-?\d+)$/))) {
      const row = db[m[1]].find((x) => x.id === Number(m[2]));
      if (!row) res = json(404, { error: 'não encontrada' });
      else { Object.assign(row, body); res = json(200, { ...row }); }
    } else if (method === 'DELETE' && (m = url.match(/^\/api\/(\w+)\/(-?\d+)$/))) {
      db[m[1]] = db[m[1]].filter((x) => x.id !== Number(m[2]));
      res = { ok: true, status: 204, json: async () => null, text: async () => '' };
    } else res = json(404, { error: 'rota' });
    if (opId && res.ok) ops.set(opId, res);
    return res;
  };
  return srv;
}

function setup() {
  const srv = fakeServer();
  let t = 1_800_000_000_000;
  const sync = createSync({ store: memoryStore(), fetchImpl: srv.fetch, isOnline: () => srv.online, now: () => t });
  return { srv, sync, tick: (ms) => { t += ms; } };
}

test('classify: o que pode esperar na fila e o que precisa de internet', () => {
  assert.deepEqual(classify('POST', '/api/trips/3/activities'), { type: 'create', tripId: 3, coll: 'activities' });
  assert.deepEqual(classify('PUT', '/api/checklist/7'), { type: 'update', coll: 'checklist', id: 7 });
  assert.deepEqual(classify('DELETE', '/api/files/7'), { type: 'delete', coll: 'files', id: 7 });
  assert.equal(classify('POST', '/api/trips/3/shares'), null);
  assert.equal(classify('POST', '/api/trips'), null);
  assert.equal(classify('DELETE', '/api/trips/3'), null);
});

test('diffPatch manda só o que mudou, com comparação tolerante', () => {
  const row = { id: 1, title: 'A', done: 0, cost: 10, notes: null, route: '{"a":1}' };
  assert.deepEqual(diffPatch(row, { ...row, done: false, cost: '10', notes: '', route: { a: 1 } }), {});
  assert.deepEqual(diffPatch(row, { ...row, title: 'B' }), { title: 'B' });
});

test('com internet: vai direto e atualiza a cópia do aparelho', async () => {
  const { srv, sync } = setup();
  await sync.getTrip(1);
  const r = await sync.request('PUT', '/api/activities/10', { done: 1 });
  assert.equal(r.done, 1);
  assert.equal(sync.status().pending, 0);
  assert.equal((await sync._snap(1)).data.activities[0].done, 1);
  assert.ok(srv.calls.includes('PUT /api/activities/10'));
});

test('sem internet: abre a cópia, edita, cria e apaga; ao reconectar envia tudo na ordem com ids reais', async () => {
  const { srv, sync } = setup();
  await sync.getTrip(1);
  srv.online = false;

  const local = await sync.getTrip(1);
  assert.equal(local.trip.name, 'Teste');

  await sync.request('PUT', '/api/activities/10', { ...local.activities[0], done: 1, notes: 'ok' });
  const created = await sync.request('POST', '/api/trips/1/activities', { day: '2026-11-07', title: 'Ramen' });
  assert.ok(created.id < 0, 'id provisório');
  await sync.request('PUT', `/api/activities/${created.id}`, { title: 'Ramen Ichiran' });
  const item = await sync.request('POST', '/api/trips/1/checklist', { text: 'Passaporte' });
  await sync.request('DELETE', `/api/checklist/${item.id}`); // criado e apagado sem internet: nada vai ao servidor

  // a cópia local já mostra tudo, mesmo recarregando
  const again = await sync.getTrip(1);
  assert.equal(again.activities.find((a) => a.id === 10).done, 1);
  assert.equal(again.activities.find((a) => a.id === created.id).title, 'Ramen Ichiran');
  assert.equal(again.checklist.length, 0);
  assert.equal(sync.status().pending, 3);

  srv.online = true;
  await sync.wake();
  assert.equal(sync.status().pending, 0);
  assert.equal(sync.status().failed, 0);
  const ramen = srv.db.activities.find((a) => a.title === 'Ramen Ichiran');
  assert.ok(ramen && ramen.id > 0, 'edição do item novo foi para o id real');
  assert.equal(srv.db.activities.find((a) => a.id === 10).notes, 'ok');
  assert.equal(srv.db.checklist.length, 0);
  // a edição offline mandou só os campos mudados
  assert.equal(srv.calls.filter((c) => c.startsWith('POST /api/trips/1/checklist')).length, 0);
  // a cópia do aparelho agora tem os ids definitivos
  const fresh = await sync.getTrip(1);
  assert.ok(fresh.activities.every((a) => a.id > 0));
});

test('resposta perdida: a fila reenvia com o mesmo id e o servidor não duplica', async () => {
  const { srv, sync } = setup();
  await sync.getTrip(1);
  // o servidor recebe, mas a resposta não volta (rede caiu no meio)
  const real = srv.fetch;
  let lost = true;
  const sync2 = createSync({
    store: memoryStore(), isOnline: () => true,
    fetchImpl: async (url, init) => {
      const r = await real(url, init);
      if (lost && init?.method === 'POST') { lost = false; throw new TypeError('Failed to fetch'); }
      return r;
    },
  });
  await sync2.getTrip(1);
  const res = await sync2.request('POST', '/api/trips/1/activities', { day: '2026-11-08', title: 'Museu' });
  assert.ok(res.id < 0, 'ficou na fila');
  await sync2.wake();
  assert.equal(srv.db.activities.filter((a) => a.title === 'Museu').length, 1);
  assert.equal(sync2.status().pending, 0);
  void sync;
});

test('servidor recusa (item apagado em outro aparelho): a edição vai para "não salvas", não some', async () => {
  const { srv, sync } = setup();
  await sync.getTrip(1);
  srv.online = false;
  await sync.request('PUT', '/api/activities/10', { notes: 'nota importante' });
  srv.db.activities = []; // apagada em outro aparelho
  srv.online = true;
  await sync.wake();
  assert.equal(sync.status().pending, 0);
  assert.equal(sync.status().failed, 1);
  const [f] = sync.failedList();
  assert.equal(f.body.notes, 'nota importante');
  await sync.discardFailed(0);
  assert.equal(sync.status().failed, 0);
});

test('erro do servidor (5xx) ou queda de rede: mantém na fila e tenta depois', async () => {
  const { srv, sync, tick } = setup();
  await sync.getTrip(1);
  srv.online = false;
  await sync.request('PUT', '/api/activities/10', { title: 'Templo 2' });
  srv.online = true;
  srv.failNext = 503;
  srv.failMethod = 'PUT';
  await sync.wake();
  assert.equal(sync.status().pending, 1, 'continua na fila');
  tick(60_000);
  await sync.flush();
  assert.equal(sync.status().pending, 0);
  assert.equal(srv.db.activities[0].title, 'Templo 2');
});

test('sessão expirada (401): pausa a fila sem perder nada e retoma depois do login', async () => {
  const { srv, sync } = setup();
  await sync.getTrip(1);
  srv.online = false;
  await sync.request('PUT', '/api/activities/10', { title: 'X' });
  srv.online = true;
  srv.failNext = 401;
  await sync.wake();
  assert.equal(sync.status().pending, 1, 'continua na fila');
  assert.equal(sync.status().failed, 0);
  await sync.wake();
  assert.equal(sync.status().pending, 0);
  assert.equal(srv.db.activities[0].title, 'X');
});

test('mesmo campo mudado em outro aparelho: vale a edição deste e o valor de lá fica registrado + backup', async () => {
  const { srv, sync } = setup();
  await sync.getTrip(1);
  srv.online = false;
  await sync.request('PUT', '/api/activities/10', { title: 'Templo (aqui)' });
  srv.db.activities[0].title = 'Templo (lá)'; // outro aparelho mudou o mesmo campo
  srv.online = true;
  await sync.wake();
  assert.equal(srv.db.activities[0].title, 'Templo (aqui)');
  const [c] = sync.conflictList();
  assert.equal(c.fields[0].theirs, 'Templo (lá)');
  const bks = await sync.listBackups();
  assert.ok(bks.some((b) => b.reason === 'antes de sincronizar'));
  const data = await sync.backupData(bks.find((b) => b.reason === 'antes de sincronizar').key);
  assert.equal(data.activities[0].title, 'Templo (lá)');
});

test('backups automáticos: sem tokens, só quando muda e no máximo a cada 6 h, até 20 por viagem', async () => {
  const { srv, sync, tick } = setup();
  srv.db.trip.share_token = 'segredo-segredo-123';
  srv.db.trip.cal_token = 'agenda-agenda-agenda';
  await sync.getTrip(1);
  let list = await sync.listBackups();
  assert.equal(list.length, 1);
  const d = await sync.backupData(list[0].key);
  assert.equal(d.trip.share_token, undefined);
  assert.equal(d.trip.cal_token, undefined);
  assert.equal(d.shares, undefined);
  srv.db.activities[0].title = 'Mudou';
  await sync.getTrip(1);
  assert.equal((await sync.listBackups()).length, 1, 'menos de 6 h: não tira outro');
  for (let i = 0; i < 25; i++) { tick(7 * 3600e3); srv.db.activities[0].title = `v${i}`; await sync.getTrip(1); }
  list = await sync.listBackups();
  assert.equal(list.length, 20);
});

test('viagem nunca aberta neste aparelho e sem internet: mensagem clara', async () => {
  const { srv, sync } = setup();
  srv.online = false;
  await assert.rejects(sync.getTrip(1), /ainda não foi guardada/);
});

test('lista de viagens sem internet vem das cópias guardadas', async () => {
  const { srv, sync } = setup();
  await sync.getTrip(1);
  srv.online = false;
  const list = await sync.getTrips();
  assert.equal(list[0].name, 'Teste');
});

test('pedido que precisa de internet (ex.: criar link de visitante) explica o motivo', async () => {
  const { srv, sync } = setup();
  srv.online = false;
  await assert.rejects(sync.request('POST', '/api/trips/1/shares', { name: 'x' }), /precisa de internet/);
});

test('remap, tempRefs e conflicts', () => {
  const op = { url: '/api/activities/-1800000000000000', body: { activity_id: -1800000000000000, ids: [5, -1800000000000000] }, kind: { type: 'update', coll: 'activities', id: -1800000000000000 } };
  assert.deepEqual(tempRefs(op).length, 3);
  const r = remap(op, { '-1800000000000000': 42 });
  assert.equal(r.url, '/api/activities/42');
  assert.deepEqual(r.body.ids, [5, 42]);
  assert.equal(tempRefs(r).length, 0);
  const c = conflicts({ kind: { type: 'update', coll: 'activities', id: 1 }, body: { title: 'B' }, base: { title: 'A' } }, { activities: [{ id: 1, title: 'C' }] });
  assert.equal(c.length, 1);
  assert.equal(conflicts({ kind: { type: 'update', coll: 'activities', id: 1 }, body: { title: 'B' }, base: { title: 'A' } }, { activities: [{ id: 1, title: 'A' }] }).length, 0);
});

test('applyOp: agendar ideia leva os anexos junto', () => {
  const data = { ideas: [{ id: 1, title: 'Onsen' }], activities: [], files: [{ id: 9, idea_id: 1, activity_id: null }] };
  const op = { kind: { type: 'schedule', coll: 'ideas', id: 1 }, body: { day: '2026-11-09' }, tempId: -1800000000000001, tripId: 1 };
  const res = optimistic(op, data);
  const d = applyOp(data, op, res);
  assert.equal(d.ideas.length, 0);
  assert.equal(d.activities[0].title, 'Onsen');
  assert.equal(d.files[0].activity_id, res.id);
});

test('anexo escolhido sem internet fica no aparelho e sobe depois, até de atividade criada offline', async () => {
  const { srv, sync } = setup();
  await sync.getTrip(1);
  srv.online = false;
  const act = await sync.request('POST', '/api/trips/1/activities', { day: '2026-11-25', title: 'Kaiyukan' });
  const item = await sync.request('POST', '/api/trips/1/checklist', { text: '25/11 Kaiyukan ingresso' });
  const headers = { 'X-File-Name': encodeURIComponent('kaiyukan.pdf'), 'X-File-Type': 'application/pdf', 'X-File-Kind': 'doc' };
  const up = await sync.queueUpload({ tripId: 1, url: `/api/activities/${act.id}/files`, blob: 'PDF-1', name: 'kaiyukan.pdf', type: 'application/pdf', headers, activity_id: act.id });
  await sync.queueUpload({ tripId: 1, url: '/api/trips/1/files', blob: 'PDF-2', name: 'solto.pdf', type: 'application/pdf', headers: { ...headers, 'X-File-Name': 'solto.pdf' }, check_id: item.id });
  assert.equal(sync.pendingUploads(1).length, 2);
  assert.equal(sync.pendingUploads(1)[0].id, up.id);
  assert.equal(await sync.uploadBlob(up.id), 'PDF-1');
  assert.equal(sync.status().uploads, 2);
  assert.equal(sync.status().pending, 4); // 2 edições + 2 anexos

  srv.online = true;
  await sync.wake();
  assert.equal(sync.status().pending, 0);
  const real = srv.db.activities.find((a) => a.title === 'Kaiyukan');
  const check = srv.db.checklist.find((c) => c.text.includes('Kaiyukan'));
  assert.deepEqual(srv.db.files.map((f) => [f.name, f.activity_id, f.check_id]), [['kaiyukan.pdf', real.id, null], ['solto.pdf', null, check.id]]);
  assert.equal((await sync.getTrip(1)).files.length, 2);
  // reenviar não duplica (mesmo X-Op-Id)
  await sync.wake();
  assert.equal(srv.db.files.length, 2);
});

test('anexo descartado antes de subir não vai ao servidor', async () => {
  const { srv, sync } = setup();
  await sync.getTrip(1);
  srv.online = false;
  const up = await sync.queueUpload({ tripId: 1, url: '/api/activities/10/files', blob: 'x', name: 'a.pdf', type: 'application/pdf', headers: { 'X-File-Name': 'a.pdf', 'X-File-Type': 'application/pdf' } });
  await sync.cancelUpload(up.id);
  srv.online = true;
  await sync.wake();
  assert.equal(srv.db.files.length, 0);
  assert.equal(sync.status().pending, 0);
});
