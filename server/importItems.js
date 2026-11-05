// Importar atividades e ideias para dentro de uma viagem que já existe (v1.54).
// Diferente do backup (que cria uma viagem nova), aqui a viagem continua a mesma: o id, os links de
// visitante, a agenda .ics, os anexos e as fotos ficam como estão.
//
// Formato aceito (ver docs/funcionalidades/compartilhar-e-backup.md):
//   { "day": "2026-11-13", "activities": [ ... ], "ideas": [ ... ] }
//   ou só a lista de atividades [ ... ], ou uma atividade sozinha { "title": ..., "day": ... }.
//   Item com "id" (da própria viagem) atualiza só os campos enviados; sem "id" cria um item novo;
//   "_delete": true apaga; "_move": "ideas" manda a atividade para as ideias; numa ideia,
//   "_move": "AAAA-MM-DD" agenda a ideia nesse dia. Os anexos acompanham o item que muda de lugar.
//
// Esta parte só monta o plano (o que vai acontecer com cada item), sem tocar no banco: o servidor
// mostra o plano como prévia e, na confirmação, grava tudo num lote só (tudo ou nada).

export const IMPORT_ACT_FIELDS = ['day', 'end_day', 'start', 'end', 'city', 'title', 'kind', 'location', 'details', 'transport', 'cost', 'lat', 'lng', 'done', 'notes', 'links', 'start_tz', 'end_tz', 'ref', 'from_code', 'to_code', 'via', 'spent', 'rating', 'review', 'slot', 'route', 'alt'];
export const IMPORT_IDEA_FIELDS = ['title', 'kind', 'city', 'location', 'details', 'cost', 'lat', 'lng', 'notes', 'links'];
const KINDS = ['sight', 'food', 'move', 'stay', 'shop', 'free', 'flight'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const MAX_ITEMS = 300;
const MAX_TEXT = 100000;
// campos do backup que não são editáveis por aqui (vêm junto quando o JSON sai do "Exportar backup")
// a ordem do dia é refeita pelo horário, então "sort" vindo do backup não vale
const IGNORED = new Set(['id', 'trip_id', '_delete', '_move', 'cost_jpy', 'sort', 'created_at']);

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const empty = (v) => v === null || v === undefined || v === '';
const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const num = (v) => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN);
const pad = (t) => (TIME_RE.test(t) ? t.padStart(5, '0') : t);

// o que veio no arquivo → { day, activities, ideas }
export function readImport(body) {
  if (Array.isArray(body)) return { day: null, activities: body, ideas: [] };
  if (!isObj(body)) return null;
  if (!('activities' in body) && !('ideas' in body)) return body.title || body.id ? { day: null, activities: [body], ideas: [] } : null;
  return {
    day: typeof body.day === 'string' ? body.day : null,
    activities: Array.isArray(body.activities) ? body.activities : [],
    ideas: Array.isArray(body.ideas) ? body.ideas : [],
  };
}

// links aceitam [{ url, label }] ou só os endereços em texto
function cleanLinks(v) {
  if (empty(v)) return null;
  let list = v;
  if (typeof v === 'string') {
    try { list = JSON.parse(v); } catch { list = [v]; }
  }
  if (!Array.isArray(list)) list = [list];
  const out = list.map((l) => (typeof l === 'string' ? { url: l, label: null } : isObj(l) && typeof l.url === 'string' ? { url: l.url, label: typeof l.label === 'string' ? l.label : null } : null))
    .filter((l) => l && l.url.trim())
    .map((l) => ({ url: /^[a-z][a-z0-9+.-]*:/i.test(l.url.trim()) ? l.url.trim() : `https://${l.url.trim()}`, label: l.label?.trim() || null }));
  return out.length ? out : null;
}

// confere e limpa os campos enviados de um item; devolve { patch, error, warn }
function cleanFields(raw, fields, ctx) {
  const patch = {};
  const warn = [];
  const unknown = Object.keys(raw).filter((k) => !fields.includes(k) && !IGNORED.has(k));
  if (unknown.length) warn.push(`campos ignorados: ${unknown.join(', ')}`);
  for (const f of fields) {
    if (!(f in raw)) continue;
    let v = raw[f];
    if (typeof v === 'string' && v.length > MAX_TEXT) return { error: `${f}: texto grande demais` };
    if (f === 'day' || f === 'end_day') {
      if (empty(v)) { if (f === 'day') return { error: 'day não pode ficar vazio' }; v = null; } else if (typeof v !== 'string' || !DATE_RE.test(v)) return { error: `${f}: data inválida (use AAAA-MM-DD)` };
      if (f === 'day' && (v < ctx.trip.start || v > ctx.trip.end)) return { error: `day ${v} fora da viagem (${ctx.trip.start} a ${ctx.trip.end})` };
    } else if (f === 'start' || f === 'end') {
      if (empty(v)) v = null; else if (typeof v !== 'string' || !TIME_RE.test(v.trim())) return { error: `${f}: horário inválido (use HH:MM)` }; else v = pad(v.trim());
    } else if (['cost', 'spent', 'rating', 'lat', 'lng'].includes(f)) {
      if (empty(v)) v = null;
      else {
        const n = num(v);
        if (!Number.isFinite(n)) return { error: `${f}: precisa ser um número` };
        if (f === 'lat' && Math.abs(n) > 90) return { error: 'lat: latitude fora do mapa' };
        if (f === 'lng' && Math.abs(n) > 180) return { error: 'lng: longitude fora do mapa' };
        v = n;
      }
    } else if (f === 'kind') {
      if (empty(v)) v = 'sight';
      else if (!KINDS.includes(v)) { warn.push(`tipo "${v}" desconhecido, ficou como ponto turístico`); v = 'sight'; }
    } else if (f === 'title') {
      if (typeof v !== 'string' || !v.trim()) return { error: 'title não pode ficar vazio' };
      v = v.trim();
    } else if (f === 'city') {
      if (empty(v)) v = null;
      else {
        const c = ctx.cities.find((x) => x.key === v) || ctx.cities.find((x) => norm(x.name) === norm(v));
        if (c) v = c.key;
        else { warn.push(`cidade "${v}" não existe na viagem, ficou sem cidade`); v = null; }
      }
    } else if (f === 'links') {
      v = cleanLinks(v);
    } else if (f === 'done') {
      v = v ? 1 : 0;
    } else if (f === 'route' || f === 'alt') {
      if (empty(v)) v = null;
      else if (typeof v === 'string') { try { JSON.parse(v); } catch { return { error: `${f}: JSON inválido` }; } }
      else if (typeof v !== 'object') return { error: `${f}: precisa ser um objeto` };
    } else if (empty(v)) v = null;
    else if (typeof v !== 'string' && typeof v !== 'number') return { error: `${f}: precisa ser texto` };
    patch[f] = v;
  }
  if (('lat' in patch) !== ('lng' in patch) || (patch.lat == null) !== (patch.lng == null)) return { error: 'lat e lng vão juntos' };
  return { patch, warn };
}

// Monta o plano. current = { trip, cities, activities, ideas } da viagem; defDay = dia escolhido na tela
// para as atividades novas que vêm sem "day".
export function planImport(input, current, defDay = null) {
  const src = readImport(input);
  if (!src) return { error: 'JSON sem atividades: mande { "activities": [...] }, uma lista ou uma atividade' };
  const total = src.activities.length + src.ideas.length;
  if (!total) return { error: 'o arquivo não tem nenhuma atividade nem ideia' };
  if (total > MAX_ITEMS) return { error: `itens demais (${total}); o limite é ${MAX_ITEMS} por importação` };
  const day0 = defDay || src.day;
  if (day0 && (!DATE_RE.test(day0) || day0 < current.trip.start || day0 > current.trip.end)) return { error: `dia ${day0} fora da viagem` };

  const ctx = { trip: current.trip, cities: current.cities || [] };
  const acts = new Map((current.activities || []).map((a) => [a.id, a]));
  const ideas = new Map((current.ideas || []).map((x) => [x.id, x]));
  const touched = new Set(); // "a:12" / "i:3": o mesmo item duas vezes no arquivo é erro
  const seenNew = new Set(); // duplicados dentro do próprio arquivo
  const items = [];

  // itens que este arquivo apaga, move ou tira do dia não contam como "já existe" para os novos
  const gone = new Set();
  src.activities.forEach((r) => { if (isObj(r) && !empty(r.id) && (r._delete === true || r._move === 'ideas' || (!empty(r.day) && acts.get(Number(r.id))?.day !== r.day))) gone.add(Number(r.id)); });
  const goneIdeas = new Set(src.ideas.filter((r) => isObj(r) && !empty(r.id) && (r._delete === true || !empty(r._move))).map((r) => Number(r.id)));
  const dupAct = (day, title, start) => [...acts.values()].find((a) => !gone.has(a.id) && a.day === day && norm(a.title) === norm(title) && (!start || !a.start || pad(a.start) === start));
  const push = (it) => { items.push(it); return it; };

  src.activities.forEach((raw, i) => {
    const pos = `atividade ${i + 1}`;
    if (!isObj(raw)) return push({ type: 'activity', action: 'error', pos, reason: 'não é um objeto' });
    const id = empty(raw.id) ? null : Number(raw.id);
    if (id != null) {
      const cur = acts.get(id);
      if (!cur) return push({ type: 'activity', action: 'error', pos, id, title: raw.title, reason: `id ${raw.id} não é uma atividade desta viagem` });
      if (touched.has(`a:${id}`)) return push({ type: 'activity', action: 'error', pos, id, title: cur.title, reason: 'a mesma atividade aparece duas vezes' });
      touched.add(`a:${id}`);
      if (raw._delete === true) return push({ type: 'activity', action: 'delete', pos, id, title: cur.title, day: cur.day });
      const { patch, error, warn } = cleanFields(raw, IMPORT_ACT_FIELDS, ctx);
      if (error) return push({ type: 'activity', action: 'error', pos, id, title: cur.title, reason: error });
      if (raw._move === 'ideas') return push({ type: 'activity', action: 'to_idea', pos, id, title: patch.title || cur.title, day: cur.day, row: { ...cur, ...patch }, warn });
      if (!empty(raw._move)) return push({ type: 'activity', action: 'error', pos, id, title: cur.title, reason: '"_move" numa atividade só aceita "ideas"' });
      const changed = Object.keys(patch).filter((k) => String(patch[k] == null ? '' : typeof patch[k] === 'object' ? JSON.stringify(patch[k]) : patch[k]) !== String(cur[k] == null ? '' : cur[k]));
      if (!changed.length) return push({ type: 'activity', action: 'same', pos, id, title: cur.title, day: cur.day });
      return push({ type: 'activity', action: 'update', pos, id, title: patch.title || cur.title, day: patch.day || cur.day, fromDay: cur.day, patch, changed, warn });
    }
    if (raw._delete || raw._move) return push({ type: 'activity', action: 'error', pos, title: raw.title, reason: '"_delete" e "_move" precisam do "id" da atividade' });
    const base = { ...raw };
    if (empty(base.day)) { if (day0) base.day = day0; else delete base.day; }
    const { patch, error, warn } = cleanFields(base, IMPORT_ACT_FIELDS, ctx);
    if (error) return push({ type: 'activity', action: 'error', pos, title: raw.title, reason: error });
    if (!patch.title) return push({ type: 'activity', action: 'error', pos, reason: 'falta "title"' });
    if (!patch.day) return push({ type: 'activity', action: 'error', pos, title: patch.title, reason: 'sem "day": escolha o dia na tela ou ponha "day" no item' });
    const key = `${patch.day}|${norm(patch.title)}|${patch.start || ''}`;
    const dup = dupAct(patch.day, patch.title, patch.start);
    if (dup) return push({ type: 'activity', action: 'skip', pos, title: patch.title, day: patch.day, reason: `já existe nesse dia${dup.start ? ` (${dup.start})` : ''}` });
    if (seenNew.has(key)) return push({ type: 'activity', action: 'skip', pos, title: patch.title, day: patch.day, reason: 'repetida no arquivo' });
    seenNew.add(key);
    return push({ type: 'activity', action: 'create', pos, title: patch.title, day: patch.day, row: { kind: 'sight', ...patch }, warn });
  });

  src.ideas.forEach((raw, i) => {
    const pos = `ideia ${i + 1}`;
    if (!isObj(raw)) return push({ type: 'idea', action: 'error', pos, reason: 'não é um objeto' });
    const id = empty(raw.id) ? null : Number(raw.id);
    if (id != null) {
      const cur = ideas.get(id);
      if (!cur) return push({ type: 'idea', action: 'error', pos, id, title: raw.title, reason: `id ${raw.id} não é uma ideia desta viagem` });
      if (touched.has(`i:${id}`)) return push({ type: 'idea', action: 'error', pos, id, title: cur.title, reason: 'a mesma ideia aparece duas vezes' });
      touched.add(`i:${id}`);
      if (raw._delete === true) return push({ type: 'idea', action: 'delete', pos, id, title: cur.title });
      if (!empty(raw._move)) {
        // ideia → atividade no dia; aceita também os campos de atividade (horário, transporte…)
        const { patch, error, warn } = cleanFields({ ...raw, day: raw._move }, IMPORT_ACT_FIELDS, ctx);
        if (error) return push({ type: 'idea', action: 'error', pos, id, title: cur.title, reason: error.startsWith('day') ? `"_move": ${error.replace(/^day:? ?/, '')}` : error });
        return push({ type: 'idea', action: 'to_activity', pos, id, title: patch.title || cur.title, day: patch.day, row: { ...cur, ...patch }, warn });
      }
      const { patch, error, warn } = cleanFields(raw, IMPORT_IDEA_FIELDS, ctx);
      if (error) return push({ type: 'idea', action: 'error', pos, id, title: cur.title, reason: error });
      const changed = Object.keys(patch).filter((k) => String(patch[k] == null ? '' : typeof patch[k] === 'object' ? JSON.stringify(patch[k]) : patch[k]) !== String(cur[k] == null ? '' : cur[k]));
      if (!changed.length) return push({ type: 'idea', action: 'same', pos, id, title: cur.title });
      return push({ type: 'idea', action: 'update', pos, id, title: patch.title || cur.title, patch, changed, warn });
    }
    if (raw._delete || raw._move) return push({ type: 'idea', action: 'error', pos, title: raw.title, reason: '"_delete" e "_move" precisam do "id" da ideia' });
    const { patch, error, warn } = cleanFields(raw, IMPORT_IDEA_FIELDS, ctx);
    if (error) return push({ type: 'idea', action: 'error', pos, title: raw.title, reason: error });
    if (!patch.title) return push({ type: 'idea', action: 'error', pos, reason: 'falta "title"' });
    const key = `idea|${norm(patch.title)}`;
    if ([...ideas.values()].some((x) => !goneIdeas.has(x.id) && norm(x.title) === norm(patch.title))) return push({ type: 'idea', action: 'skip', pos, title: patch.title, reason: 'já existe nas ideias' });
    if (seenNew.has(key)) return push({ type: 'idea', action: 'skip', pos, title: patch.title, reason: 'repetida no arquivo' });
    seenNew.add(key);
    return push({ type: 'idea', action: 'create', pos, title: patch.title, row: { kind: 'sight', ...patch }, warn });
  });

  const count = (a) => items.filter((x) => x.action === a).length;
  const summary = { create: count('create'), update: count('update'), delete: count('delete'), move: count('to_idea') + count('to_activity'), skip: count('skip'), same: count('same'), error: count('error') };
  return { items, summary };
}

// Ordem nova de um dia: os itens que ficam, na ordem atual, e os que chegam entram pelo horário
// (antes do primeiro com horário mais tarde); sem horário vão para o fim. Devolve a lista de "refs".
export function orderDay(existing, incoming) {
  const out = existing.map((a) => ({ ref: a.ref, start: a.start ? pad(a.start) : null }));
  for (const n of incoming) {
    const s = n.start ? pad(n.start) : null;
    const at = s ? out.findIndex((x) => x.start && x.start > s) : -1;
    if (at < 0) out.push({ ref: n.ref, start: s });
    else out.splice(at, 0, { ref: n.ref, start: s });
  }
  return out.map((x) => x.ref);
}
