// Edições sem internet, parte "pura" (sem IndexedDB nem rede, testável no Node):
// - classify: quais pedidos ao servidor podem esperar numa fila e o que cada um faz
// - optimistic: a resposta que o app recebe na hora, antes do servidor responder
// - applyOp: aplica uma edição na cópia da viagem guardada no aparelho
// - remap: troca os ids provisórios (de itens criados sem internet) pelos ids reais
// - conflicts: o que mudou no servidor (outro aparelho) no mesmo campo que esta edição muda

// coleções da viagem que o app edita item a item: nome na URL → chave no JSON da viagem
export const COLLS = ['activities', 'stays', 'checklist', 'purchases', 'notes', 'ideas', 'cities', 'pages', 'photos', 'files'];
const CREATE = ['activities', 'stays', 'checklist', 'purchases', 'notes', 'ideas', 'cities', 'pages'];
const UPDATE = ['activities', 'stays', 'checklist', 'purchases', 'notes', 'ideas', 'cities', 'pages', 'photos'];
const DELETE = ['activities', 'stays', 'checklist', 'purchases', 'notes', 'ideas', 'cities', 'pages', 'photos', 'files'];

// ids provisórios: negativos e grandes, nunca colidem com os do banco (positivos)
let seq = 0;
export const tempId = () => -(Date.now() * 1000 + (seq++ % 1000));
export const isTemp = (id) => typeof id === 'number' && id < -1e9;

// o que um pedido faz; null = só funciona com internet (criar viagem, enviar foto, links de visitante…)
export function classify(method, url) {
  const path = url.split('?')[0];
  let m;
  const coll = (list) => `(${list.join('|')})`;
  if (method === 'POST' && (m = path.match(new RegExp(`^/api/trips/(\\d+)/${coll(CREATE)}$`)))) return { type: 'create', tripId: +m[1], coll: m[2] };
  if (method === 'PUT' && (m = path.match(new RegExp(`^/api/${coll(UPDATE)}/(-?\\d+)$`)))) return { type: 'update', coll: m[1], id: +m[2] };
  if (method === 'DELETE' && (m = path.match(new RegExp(`^/api/${coll(DELETE)}/(-?\\d+)$`)))) return { type: 'delete', coll: m[1], id: +m[2] };
  if (method === 'PUT' && (m = path.match(/^\/api\/trips\/(\d+)$/))) return { type: 'trip', tripId: +m[1] };
  if (method === 'PUT' && (m = path.match(/^\/api\/trips\/(\d+)\/daynotes\/(\d{4}-\d{2}-\d{2})$/))) return { type: 'daynotes', tripId: +m[1], day: m[2] };
  if (method === 'PUT' && (m = path.match(/^\/api\/trips\/(\d+)\/days\/reorder$/))) return { type: 'reorder', tripId: +m[1] };
  if (method === 'POST' && (m = path.match(/^\/api\/ideas\/(-?\d+)\/schedule$/))) return { type: 'schedule', coll: 'ideas', id: +m[1] };
  if (method === 'POST' && (m = path.match(/^\/api\/activities\/(-?\d+)\/unschedule$/))) return { type: 'unschedule', coll: 'activities', id: +m[1] };
  return null;
}

// comparação tolerante: '' = null = undefined, true = 1, objeto = o JSON dele (como o banco guarda)
export function norm(v) {
  if (v === '' || v === undefined || v === null) return null;
  if (v === true) return '1';
  if (v === false) return '0';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
const IGNORE = new Set(['id', 'trip_id', 'created_at']);
const same = (a, b) => norm(a) === norm(b);

// só os campos que a edição realmente muda (o app às vezes manda o item inteiro)
export function diffPatch(row, body) {
  if (!row) return { ...body };
  const out = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (IGNORE.has(k) || k.startsWith('_')) continue;
    if (!same(v, row[k])) out[k] = v;
  }
  return out;
}

const find = (data, coll, id) => (data?.[coll] || []).find((x) => x.id === id) || null;
const nextSort = (list, filter = () => true) => list.filter(filter).reduce((m, x) => Math.max(m, Number(x.sort) || 0), -1) + 1;
const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'local';
const bit = (v) => (v ? 1 : 0);

// a resposta provisória (o mesmo formato que o servidor devolveria)
export function optimistic(op, data) {
  const { kind, body = {} } = op;
  const tripId = op.tripId;
  switch (kind.type) {
    case 'create': {
      const list = data?.[kind.coll] || [];
      const row = { ...body, id: op.tempId, trip_id: tripId };
      if (kind.coll === 'activities') {
        Object.assign(row, { kind: body.kind || 'sight', done: bit(body.done) });
        if (row.sort == null) row.sort = nextSort(list, (a) => a.day === body.day);
      } else if (kind.coll === 'cities') {
        const used = new Set(list.map((c) => c.key));
        let key = slug(body.name);
        for (let i = 2; used.has(key); i++) key = `${slug(body.name)}-${i}`;
        Object.assign(row, { color: '#2874a6', emoji: '📍', ...body, id: op.tempId, trip_id: tripId, key });
      } else {
        if (kind.coll === 'checklist') row.done = bit(body.done);
        if (kind.coll === 'purchases') Object.assign(row, { bought: bit(body.bought), exempt: bit(body.exempt) });
        if (kind.coll === 'notes') row.pinned = bit(body.pinned);
        if (kind.coll === 'ideas') row.kind = body.kind || 'sight';
        if (row.sort == null) row.sort = nextSort(list);
      }
      if (kind.coll === 'pages') return { id: row.id, day: body.day || null, title: body.title || null, blocks: body.blocks || [], sort: row.sort };
      return row;
    }
    case 'update': {
      const cur = find(data, kind.coll, kind.id);
      const row = { ...(cur || { id: kind.id }), ...body, id: cur?.id ?? kind.id };
      if (kind.coll === 'cities' && cur) row.key = cur.key; // a chave liga a cidade às atividades e não muda
      return row;
    }
    case 'delete': return null;
    case 'trip': return { ...(data?.trip || {}), ...body };
    case 'daynotes': return { day: kind.day, title: String(body.title || '').trim() || null, notes: String(body.notes || '').trim() || null };
    case 'reorder': {
      const pos = new Map((body.ids || []).map((id, i) => [Number(id), i]));
      return (data?.activities || []).filter((a) => a.day === body.day).map((a) => (pos.has(a.id) ? { ...a, sort: pos.get(a.id) } : a)).sort((a, b) => a.sort - b.sort);
    }
    case 'schedule': {
      const idea = find(data, 'ideas', kind.id) || {};
      const sort = nextSort(data?.activities || [], (a) => a.day === body.day);
      const { id: _i, sort: _s, ...rest } = idea;
      return { ...rest, id: op.tempId, trip_id: tripId, day: body.day, sort, done: 0 };
    }
    case 'unschedule': {
      const a = find(data, 'activities', kind.id) || {};
      const fields = ['title', 'kind', 'city', 'location', 'details', 'cost', 'lat', 'lng', 'notes', 'links'];
      return { ...Object.fromEntries(fields.map((f) => [f, a[f] ?? null])), id: op.tempId, trip_id: tripId, sort: nextSort(data?.ideas || []) };
    }
    default: return null;
  }
}

// aplica uma edição (com a resposta, provisória ou do servidor) na cópia da viagem; devolve uma cópia nova
export function applyOp(data, op, result) {
  if (!data) return data;
  const { kind } = op;
  const d = { ...data };
  const list = (k) => [...(d[k] || [])];
  switch (kind.type) {
    case 'create':
      if (result) d[kind.coll] = [...list(kind.coll).filter((x) => x.id !== result.id), result];
      break;
    case 'update':
      d[kind.coll] = list(kind.coll).map((x) => (x.id === kind.id ? { ...x, ...(result || op.body) } : x));
      break;
    case 'delete':
      d[kind.coll] = list(kind.coll).filter((x) => x.id !== kind.id);
      if (kind.coll === 'activities') d.files = list('files').filter((f) => f.activity_id !== kind.id);
      if (kind.coll === 'ideas') d.files = list('files').filter((f) => f.idea_id !== kind.id);
      if (kind.coll === 'checklist') d.files = list('files').map((f) => (f.check_id === kind.id ? { ...f, check_id: null } : f));
      break;
    case 'trip':
      d.trip = { ...d.trip, ...(result || op.body) };
      break;
    case 'daynotes': {
      const r = result || optimistic(op, data);
      d.days = [...list('days').filter((x) => x.day !== kind.day), ...(r.title || r.notes ? [r] : [])];
      break;
    }
    case 'reorder': {
      const pos = new Map((op.body.ids || []).map((id, i) => [Number(id), i]));
      d.activities = list('activities').map((a) => (a.day === op.body.day && pos.has(a.id) ? { ...a, sort: pos.get(a.id) } : a));
      break;
    }
    case 'schedule':
      if (!result) break;
      d.ideas = list('ideas').filter((x) => x.id !== kind.id);
      d.activities = [...list('activities').filter((x) => x.id !== result.id), result];
      d.files = list('files').map((f) => (f.idea_id === kind.id ? { ...f, idea_id: null, activity_id: result.id } : f));
      break;
    case 'unschedule':
      if (!result) break;
      d.activities = list('activities').filter((x) => x.id !== kind.id);
      d.ideas = [...list('ideas').filter((x) => x.id !== result.id), result];
      d.files = list('files').map((f) => (f.activity_id === kind.id ? { ...f, activity_id: null, idea_id: result.id } : f));
      break;
    default:
  }
  return d;
}

// troca ids provisórios já salvos pelos reais, na URL e no corpo
const ID_KEYS = ['id', 'activity_id', 'idea_id'];
export function remap(op, idMap) {
  const real = (id) => (isTemp(id) && idMap[id] != null ? idMap[id] : id);
  const url = op.url.replace(/\/(-\d{10,})(?=\/|$|\?)/g, (s, id) => `/${real(Number(id))}`);
  let body = op.body;
  if (body && typeof body === 'object') {
    body = { ...body };
    ID_KEYS.forEach((k) => { if (k in body) body[k] = real(body[k]); });
    if (Array.isArray(body.ids)) body.ids = body.ids.map((x) => real(Number(x)));
  }
  const kind = { ...op.kind };
  if ('id' in kind) kind.id = real(kind.id);
  return { ...op, url, body, kind };
}

// ids provisórios que o pedido ainda usa (se algum não tem id real, o pedido depende de um item que não foi salvo)
export function tempRefs(op) {
  const out = [];
  op.url.replace(/\/(-\d{10,})(?=\/|$|\?)/g, (s, id) => { out.push(Number(id)); return s; });
  if (op.body && typeof op.body === 'object') {
    ID_KEYS.forEach((k) => { if (isTemp(op.body[k])) out.push(op.body[k]); });
    (op.body.ids || []).forEach((x) => { if (isTemp(Number(x))) out.push(Number(x)); });
  }
  return out;
}

// campos que esta edição muda e que outro aparelho também mudou desde a cópia que o aparelho tinha
export function conflicts(op, server) {
  if (op.kind.type !== 'update' && op.kind.type !== 'trip') return [];
  const row = op.kind.type === 'trip' ? server?.trip : find(server, op.kind.coll, op.kind.id);
  if (!row || !op.base) return [];
  return Object.keys(op.body || {}).filter((k) => k in op.base && !same(row[k], op.base[k]) && !same(row[k], op.body[k]))
    .map((k) => ({ field: k, theirs: row[k] ?? null, ours: op.body[k] ?? null, base: op.base[k] ?? null }));
}

// nome legível do item que a edição mexe (para a lista de pendências e de conflitos)
const COLL_LABEL = { activities: 'Atividade', stays: 'Hospedagem', checklist: 'Checklist', purchases: 'Compra', notes: 'Nota', ideas: 'Ideia', cities: 'Cidade', pages: 'Página do diário', photos: 'Foto', files: 'Anexo' };
export function describe(op) {
  const t = op.kind.type;
  const name = op.label ? `: ${op.label}` : '';
  if (t === 'create') return `${COLL_LABEL[op.kind.coll]} nova${name}`;
  if (t === 'update') return `${COLL_LABEL[op.kind.coll]} editada${name}`;
  if (t === 'delete') return `${COLL_LABEL[op.kind.coll]} excluída${name}`;
  if (t === 'trip') return 'Dados da viagem';
  if (t === 'daynotes') return `Anotações do dia ${op.kind.day.split('-').reverse().slice(0, 2).join('/')}`;
  if (t === 'reorder') return `Ordem do dia ${String(op.body?.day || '').split('-').reverse().slice(0, 2).join('/')}`;
  if (t === 'schedule') return `Ideia agendada${name}`;
  if (t === 'unschedule') return `Atividade movida para ideias${name}`;
  return op.url;
}
