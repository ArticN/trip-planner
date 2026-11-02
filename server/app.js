import crypto from 'node:crypto';
import express from 'express';
import { db } from './db.js';
import * as exemplo from './examples/exemplo.js';
import * as japaoSolo from './guides/japao-solo.js';
import { buildIcs } from '../web/src/ics.js';

// viagens de exemplo que o usuário pode carregar na tela inicial
const EXAMPLES = { exemplo };
// guias prontos de notas de viagem (aba Notas → "Carregar guia")
const GUIDES = { [japaoSolo.GUIDE.key]: japaoSolo };

const ACT_FIELDS = ['day', 'end_day', 'start', 'end', 'city', 'title', 'kind', 'location', 'details', 'transport', 'cost', 'lat', 'lng', 'sort', 'done', 'notes', 'links', 'start_tz', 'end_tz', 'ref', 'from_code', 'to_code', 'via', 'spent', 'rating', 'review', 'slot', 'route', 'alt'];
const STAY_FIELDS = ['city', 'name', 'address', 'check_in', 'check_out', 'lat', 'lng', 'notes', 'check_in_time', 'check_out_time', 'booking', 'cost', 'link'];
const CITY_FIELDS = ['key', 'name', 'emoji', 'color', 'lat', 'lng'];
const CHECK_FIELDS = ['grp', 'text', 'done', 'sort'];
const IDEA_FIELDS = ['title', 'kind', 'city', 'location', 'details', 'cost', 'lat', 'lng', 'notes', 'links', 'sort'];
const DAY_FIELDS = ['day', 'title', 'notes'];
const NOTE_FIELDS = ['grp', 'title', 'body', 'tag', 'links', 'pinned', 'sort'];
const NOTE_TAGS = ['consenso', 'opiniao', 'atencao'];
const BUY_FIELDS = ['title', 'store', 'city', 'day', 'price', 'grp', 'bought', 'exempt', 'notes', 'sort'];
const TRIP_FIELDS = ['name', 'subtitle', 'emoji', 'start', 'end', 'currency', 'home_currency', 'rate', 'tz', 'cover', 'rate_auto', 'rate_at', 'remind_min', 'remind_flight_min', 'accent', 'usd_rate', 'usd_rate_at', 'quota_usd', 'scope'];

// objetos (ex.: route com as estações) vão para o banco como JSON
const clean = (v) => (v === '' || v === undefined ? null : v && typeof v === 'object' ? JSON.stringify(v) : v);
const pick = (body, fields) => fields.map((f) => (f in body ? clean(body[f]) : null));
const marks = (fields) => fields.map(() => '?').join(',');
const setList = (fields) => fields.map((f) => `${f} = ?`).join(', ');

// comandos de inserção como [sql, args], para rodar sozinhos ou em lote
const insAct = (tripId, row) => [`INSERT INTO activities (trip_id,${ACT_FIELDS.join(',')}) VALUES (?,${marks(ACT_FIELDS)})`, [tripId, ...pick(row, ACT_FIELDS)]];
const insStay = (tripId, row) => [`INSERT INTO stays (trip_id,${STAY_FIELDS.join(',')}) VALUES (?,${marks(STAY_FIELDS)})`, [tripId, ...pick(row, STAY_FIELDS)]];
const insCheck = (tripId, row) => [`INSERT INTO checklist (trip_id,${CHECK_FIELDS.join(',')}) VALUES (?,${marks(CHECK_FIELDS)})`, [tripId, ...pick({ ...row, done: row.done ? 1 : 0 }, CHECK_FIELDS)]];
const insIdea = (tripId, row) => [`INSERT INTO ideas (trip_id,${IDEA_FIELDS.join(',')}) VALUES (?,${marks(IDEA_FIELDS)})`, [tripId, ...pick({ kind: 'sight', ...row }, IDEA_FIELDS)]];
const insCity = (tripId, row) => [`INSERT OR REPLACE INTO cities (trip_id,${CITY_FIELDS.join(',')}) VALUES (?,${marks(CITY_FIELDS)})`, [tripId, ...pick(row, CITY_FIELDS)]];
const insBuy = (tripId, row) => [`INSERT INTO purchases (trip_id,${BUY_FIELDS.join(',')}) VALUES (?,${marks(BUY_FIELDS)})`, [tripId, ...pick({ ...row, bought: row.bought ? 1 : 0, exempt: row.exempt ? 1 : 0 }, BUY_FIELDS)]];
// nota de viagem: tag só entre as conhecidas; fixada vira 0/1
const insNote = (tripId, row) => [`INSERT INTO notes (trip_id,${NOTE_FIELDS.join(',')}) VALUES (?,${marks(NOTE_FIELDS)})`, [tripId, ...pick({ ...row, tag: NOTE_TAGS.includes(row.tag) ? row.tag : null, pinned: row.pinned ? 1 : 0 }, NOTE_FIELDS)]];
const insDay = (tripId, row) => [`INSERT OR REPLACE INTO days (trip_id,${DAY_FIELDS.join(',')}) VALUES (?,${marks(DAY_FIELDS)})`, [tripId, ...pick(row, DAY_FIELDS)]];
const run1 = ([sql, args]) => db.run(sql, args);

// ── esquema e migrações (roda uma vez por processo)
async function migrate() {
  const hasTable = async (n) => !!(await db.get("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", [n]));
  // versão antiga: uma única viagem, tabela `trip` chave/valor, custo em `cost_jpy`
  const legacy = (await hasTable('trip')) && !(await hasTable('trips'));
  if (legacy) await db.exec('ALTER TABLE cities RENAME TO cities_old; ALTER TABLE stays RENAME TO stays_old; ALTER TABLE activities RENAME TO activities_old;');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, subtitle TEXT, emoji TEXT DEFAULT '🧳',
      start TEXT NOT NULL, end TEXT NOT NULL,
      currency TEXT DEFAULT 'BRL', home_currency TEXT DEFAULT 'BRL', rate REAL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      key TEXT NOT NULL, name TEXT, emoji TEXT, color TEXT, lat REAL, lng REAL,
      UNIQUE (trip_id, key)
    );
    CREATE TABLE IF NOT EXISTS stays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      city TEXT, name TEXT, address TEXT, check_in TEXT, check_out TEXT, lat REAL, lng REAL, notes TEXT
    );
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day TEXT NOT NULL, end_day TEXT, start TEXT, end TEXT,
      city TEXT, title TEXT NOT NULL, kind TEXT DEFAULT 'sight',
      location TEXT, details TEXT, transport TEXT, cost REAL,
      lat REAL, lng REAL, sort INTEGER DEFAULT 0, done INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS checklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      grp TEXT, text TEXT NOT NULL, done INTEGER DEFAULT 0, sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      title TEXT NOT NULL, kind TEXT DEFAULT 'sight', city TEXT, location TEXT, details TEXT,
      cost REAL, lat REAL, lng REAL, notes TEXT, links TEXT, sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day TEXT NOT NULL, title TEXT, notes TEXT,
      UNIQUE (trip_id, day)
    );
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      title TEXT NOT NULL, store TEXT, city TEXT, day TEXT, price REAL, grp TEXT,
      bought INTEGER DEFAULT 0, exempt INTEGER DEFAULT 0, notes TEXT, sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      activity_id INTEGER, idea_id INTEGER,
      name TEXT, type TEXT, size INTEGER, data BLOB, kind TEXT DEFAULT 'doc',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
    -- diário de viagem: as fotos (a foto e uma miniatura, as duas já reduzidas no aparelho); journal é o formato da v1.38,
    -- só lido uma vez para virar páginas do álbum (album_pages)
    CREATE TABLE IF NOT EXISTS journal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day TEXT NOT NULL, text TEXT, mood TEXT,
      UNIQUE (trip_id, day)
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day TEXT, caption TEXT, taken_at TEXT, w INTEGER, h INTEGER, size INTEGER, sort INTEGER DEFAULT 0,
      data BLOB, thumb BLOB, created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_photos_trip ON photos(trip_id, day);
    CREATE INDEX IF NOT EXISTS idx_files_trip ON files(trip_id);
    CREATE INDEX IF NOT EXISTS idx_act_trip_day ON activities(trip_id, day, sort);
    CREATE INDEX IF NOT EXISTS idx_stays_trip ON stays(trip_id);
    -- notas de viagem (v1.43): dicas por assunto, escritas à mão ou vindas de um guia pronto (links em JSON)
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      grp TEXT, title TEXT NOT NULL, body TEXT, tag TEXT, links TEXT,
      pinned INTEGER DEFAULT 0, sort INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_notes_trip ON notes(trip_id);
  `);

  // álbum do diário (v1.39): páginas livres com blocos de foto e de texto (JSON em blocks).
  // Na primeira vez, o diário da v1.38 (texto por dia + fotos por dia) vira uma página por dia.
  const hadAlbum = await hasTable('album_pages');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS album_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day TEXT, title TEXT, blocks TEXT, sort INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_album_trip ON album_pages(trip_id);
  `);
  if (!hadAlbum) {
    const notes = await db.all('SELECT trip_id, day, text FROM journal WHERE text IS NOT NULL');
    const pics = await db.all('SELECT id, trip_id, day FROM photos ORDER BY taken_at, id');
    const pages = new Map();
    const at = (t, d) => { const k = `${t}|${d || ''}`; if (!pages.has(k)) pages.set(k, { trip: t, day: d || null, text: null, ids: [] }); return pages.get(k); };
    notes.forEach((n) => { at(n.trip_id, n.day).text = n.text; });
    pics.forEach((p) => at(p.trip_id, p.day).ids.push(p.id));
    const list = [...pages.values()].map((pg, i) => ['INSERT INTO album_pages (trip_id, day, title, blocks, sort) VALUES (?,?,?,?,?)', [pg.trip, pg.day, pg.day ? null : 'Fotos soltas', JSON.stringify([
      ...(pg.ids.length ? [{ id: `b${i}p`, type: 'photos', layout: 'mosaico', ids: pg.ids }] : []),
      ...(pg.text ? [{ id: `b${i}t`, type: 'text', style: 'nota', text: pg.text }] : []),
    ]), i]]);
    if (list.length) await db.batch(list);
  }

  // colunas novas em bancos antigos
  const cols = async (t) => (await db.all(`PRAGMA table_info(${t})`)).map((c) => c.name);
  const addCols = async (table, list) => {
    const have = await cols(table);
    for (const [c, type] of list) if (!have.includes(c)) await db.exec(`ALTER TABLE ${table} ADD COLUMN ${c} ${type}`);
  };
  await addCols('activities', [['notes', 'TEXT'], ['links', 'TEXT'], ['start_tz', 'TEXT'], ['end_tz', 'TEXT'], ['ref', 'TEXT'], ['from_code', 'TEXT'], ['to_code', 'TEXT'], ['via', 'TEXT'], ['spent', 'REAL'], ['rating', 'INTEGER'], ['review', 'TEXT'], ['slot', 'TEXT'], ['route', 'TEXT'], ['alt', 'TEXT']]);
  await addCols('stays', [['check_in_time', 'TEXT'], ['check_out_time', 'TEXT'], ['booking', 'TEXT'], ['cost', 'REAL'], ['link', 'TEXT']]);
  await addCols('trips', [['tz', 'TEXT'], ['cover', 'TEXT'], ['share_token', 'TEXT'], ['rate_auto', 'INTEGER DEFAULT 1'], ['rate_at', 'TEXT'], ['cal_token', 'TEXT'], ['remind_min', 'INTEGER DEFAULT 30'], ['remind_flight_min', 'INTEGER DEFAULT 180'], ['accent', 'TEXT'], ['usd_rate', 'REAL'], ['usd_rate_at', 'TEXT'], ['quota_usd', 'REAL'], ['scope', 'TEXT'], ['share_money', 'INTEGER DEFAULT 0'], ['share_diary', 'INTEGER DEFAULT 0']]);
  await addCols('files', [['kind', "TEXT DEFAULT 'doc'"]]);
  // metadados das fotos (v1.40): onde foi tirada, a atividade do roteiro e a câmera (JSON)
  await addCols('photos', [['lat', 'REAL'], ['lng', 'REAL'], ['activity_id', 'INTEGER'], ['meta', 'TEXT']]);

  // vários links de visitante (v1.41): cada link tem nome, token e as partes que mostra.
  // Na primeira vez, o link único da viagem (trips.share_token) vira um link com as mesmas opções e o mesmo endereço.
  const hadLinks = await hasTable('share_links');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS share_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE, name TEXT,
      plan INTEGER DEFAULT 1, money INTEGER DEFAULT 0, diary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_share_trip ON share_links(trip_id);
  `);
  if (!hadLinks) {
    await db.exec(`INSERT OR IGNORE INTO share_links (trip_id, token, name, plan, money, diary)
      SELECT id, share_token, 'Link do roteiro', 1, COALESCE(share_money, 0), COALESCE(share_diary, 0) FROM trips WHERE share_token IS NOT NULL`);
  }

  if (legacy) {
    const kv = Object.fromEntries((await db.all('SELECT key, value FROM trip')).map((r) => [r.key, r.value]));
    const { lastInsertRowid: tid } = await db.run('INSERT INTO trips (name, subtitle, emoji, start, end, currency, home_currency, rate) VALUES (?,?,?,?,?,?,?,?)',
      [kv.name || 'Minha viagem', kv.subtitle || null, '🗾', kv.start, kv.end, 'JPY', 'BRL', Number(kv.brl_rate) || 0.035]);
    const oldStay = await cols('stays_old');
    const stayF = STAY_FIELDS.filter((f) => oldStay.includes(f));
    const oldAct = await cols('activities_old');
    const af = ACT_FIELDS.filter((f) => oldAct.includes(f === 'cost' ? 'cost_jpy' : f));
    await db.batch([
      [`INSERT INTO cities (trip_id,${CITY_FIELDS.join(',')}) SELECT ?,${CITY_FIELDS.join(',')} FROM cities_old`, [tid]],
      [`INSERT INTO stays (trip_id,${stayF.join(',')}) SELECT ?,${stayF.join(',')} FROM stays_old`, [tid]],
      [`INSERT INTO activities (trip_id,${af.join(',')}) SELECT ?,${af.map((f) => (f === 'cost' ? 'cost_jpy' : f)).join(',')} FROM activities_old`, [tid]],
      ['DROP TABLE cities_old'], ['DROP TABLE stays_old'], ['DROP TABLE activities_old'], ['DROP TABLE trip'],
    ]);
  }
}
// prepara o banco uma vez; se falhar (ex.: rede instável), tenta de novo na próxima requisição
let preparing = null;
const prepare = () => {
  if (!preparing) {
    preparing = migrate();
    preparing.catch((e) => { console.error('falha ao preparar o banco:', e); preparing = null; });
  }
  return preparing;
};
export const ready = prepare();
// mensagem do erro com a causa de rede (ex.: ENOTFOUND, ECONNRESET), sem dados sensíveis
const describe = (e) => {
  const c = e?.cause;
  const why = c ? [c.code, c.message].filter(Boolean).join(' ') : '';
  return why && !String(e.message).includes(why) ? `${e.message} (${why})` : String(e.message);
};

// Ordena só os itens com horário entre si, mantendo itens sem horário nos seus lugares.
function sortTimedSlots(items) {
  const idx = [];
  const timed = [];
  items.forEach((it, i) => { if (it.start) { idx.push(i); timed.push(it); } });
  timed.sort((x, y) => x.start.localeCompare(y.start));
  const out = items.slice();
  idx.forEach((slot, k) => { out[slot] = timed[k]; });
  return out;
}

const TRANSIT_CITY = { key: 'transito', name: 'Em trânsito', emoji: '✈️', color: '#64748b', lat: null, lng: null };

// viagem nacional ou internacional; vazio = automático (pelas cidades e o país onde mora, ver web/src/geo.js)
const scopeOf = (v) => (v === 'domestic' || v === 'international' ? v : null);

// cria uma viagem completa a partir de { trip, cities, stays, activities } (exemplo ou backup).
// Tudo depois da viagem vai num único lote: no banco remoto é uma ida só.
async function createTripFull(b) {
  const { lastInsertRowid: id } = await db.run(`INSERT INTO trips (${TRIP_FIELDS.join(',')}) VALUES (${marks(TRIP_FIELDS)})`, pick({ rate: 1, emoji: '🧳', ...b.trip, scope: scopeOf(b.trip?.scope) }, TRIP_FIELDS));
  const list = [];
  const cities = [...(b.cities || [])];
  if (!cities.some((c) => c.key === 'transito')) cities.push(TRANSIT_CITY);
  cities.forEach((c) => list.push(insCity(id, c)));
  (b.stays || []).forEach((s) => list.push(insStay(id, s)));
  (b.checklist || []).forEach((c, i) => list.push(insCheck(id, { sort: i, ...c })));
  (b.ideas || []).forEach((x, i) => list.push(insIdea(id, { sort: i, ...x })));
  (b.purchases || []).forEach((x, i) => list.push(insBuy(id, { sort: i, ...x })));
  (b.notes || []).filter((x) => x?.title).forEach((x, i) => list.push(insNote(id, { sort: i, ...x })));
  (b.days || []).filter((d) => d.day && (d.title || d.notes)).forEach((d) => list.push(insDay(id, d)));
  // diário: as fotos não vão no backup, então só os blocos de texto voltam (backup da v1.38: journal vira páginas)
  const pages = Array.isArray(b.pages) ? b.pages : (b.journal || []).filter((d) => d.day && d.text).map((d) => ({ day: d.day, blocks: [{ type: 'text', style: 'nota', text: d.text }] }));
  pages.map((p) => ({ ...p, blocks: cleanBlocks(p.blocks).filter((x) => x.type === 'text' || (x.type === 'video' && x.vid)) })).filter((p) => p.blocks.length)
    .forEach((p, i) => list.push(insPage(id, p, i)));
  const byDay = new Map();
  (b.activities || []).forEach((x) => {
    const row = { ...x, cost: x.cost ?? x.cost_jpy ?? null };
    if (!byDay.has(row.day)) byDay.set(row.day, []);
    byDay.get(row.day).push(row);
  });
  for (const [, items] of [...byDay.entries()].sort()) {
    // backup já traz a ordem (sort); exemplos vêm sem `sort` e são ordenados por horário
    const ordered = items.every((x) => typeof x.sort === 'number') ? items.sort((x, y) => x.sort - y.sort) : sortTimedSlots(items);
    ordered.forEach((x, i) => list.push(insAct(id, { ...x, sort: i, done: x.done ? 1 : 0 })));
  }
  try {
    if (list.length) await db.batch(list);
  } catch (e) {
    await deleteTrip(id);
    throw e;
  }
  return id;
}

// apaga a viagem e tudo dela (sem depender de ON DELETE CASCADE, que nem todo banco remoto liga)
const deleteTrip = (id) => db.batch(['files', 'photos', 'journal', 'album_pages', 'share_links', 'activities', 'stays', 'cities', 'checklist', 'ideas', 'days', 'purchases', 'notes'].map((t) => [`DELETE FROM ${t} WHERE trip_id = ?`, [id]]).concat([['DELETE FROM trips WHERE id = ?', [id]]]));

const PHOTO_META = 'id, day, caption, taken_at, w, h, size, sort, created_at, lat, lng, activity_id, meta';
const parseBlocks = (v) => { try { const b = JSON.parse(v || '[]'); return Array.isArray(b) ? b : []; } catch { return []; } };
const pageOut = (r) => ({ ...r, blocks: parseBlocks(r.blocks) });
// blocos aceitos: fotos (ids + layout) e texto (estilo + texto); o resto é descartado
const LAYOUTS = ['mosaico', 'grade', 'destaque', 'polaroides', 'filme'];
const STYLES = ['nota', 'titulo', 'citacao'];
// vídeo do álbum: o arquivo fica na plataforma; o bloco guarda só a plataforma e o código do vídeo
const VIDEO_IDS = {
  yt: /^[\w-]{11}$/,
  vimeo: /^\d{6,12}(\/[0-9a-f]{6,20})?$/,
  drive: /^[\w-]{20,80}$/,
  ig: /^[\w-]{5,40}$/,
  tiktok: /^\d{10,25}$/,
};
const cleanBlocks = (list) => (Array.isArray(list) ? list : []).slice(0, 200).map((b, i) => {
  const id = String(b?.id || `b${Date.now().toString(36)}${i}`).slice(0, 40);
  if (b?.type === 'photos') return { id, type: 'photos', layout: LAYOUTS.includes(b.layout) ? b.layout : 'mosaico', ids: (Array.isArray(b.ids) ? b.ids : []).map(Number).filter(Number.isInteger).slice(0, 500) };
  if (b?.type === 'text') return { id, type: 'text', style: STYLES.includes(b.style) ? b.style : 'nota', text: String(b.text ?? '').slice(0, 20000) };
  // vídeo do YouTube: só o código do vídeo (11 caracteres); o arquivo fica no YouTube
  if (b?.type === 'video') {
    const src = Object.hasOwn(VIDEO_IDS, b.src) ? b.src : 'yt';
    const vid = VIDEO_IDS[src].test(String(b.vid || '')) ? String(b.vid) : '';
    return { id, type: 'video', src, vid, vertical: !!b.vertical, caption: String(b.caption ?? '').slice(0, 300) };
  }
  return null;
}).filter(Boolean);
const insPage = (tripId, p, sort) => ['INSERT INTO album_pages (trip_id, day, title, blocks, sort) VALUES (?,?,?,?,?)',
  [tripId, /^\d{4}-\d{2}-\d{2}$/.test(String(p.day || '')) ? p.day : null, String(p.title || '').trim().slice(0, 200) || null, JSON.stringify(cleanBlocks(p.blocks)), sort]];
async function getTrip(id) {
  const trip = await db.get('SELECT * FROM trips WHERE id = ?', [id]);
  if (!trip) return null;
  const [cities, stays, activities, checklist, ideas, days, files, purchases, pageRows, photos, notes] = await Promise.all([
    db.all('SELECT * FROM cities WHERE trip_id = ? ORDER BY id', [id]),
    db.all('SELECT * FROM stays WHERE trip_id = ? ORDER BY check_in, id', [id]),
    db.all('SELECT * FROM activities WHERE trip_id = ? ORDER BY day, sort, id', [id]),
    db.all('SELECT * FROM checklist WHERE trip_id = ? ORDER BY sort, id', [id]),
    db.all('SELECT * FROM ideas WHERE trip_id = ? ORDER BY sort, id', [id]),
    db.all('SELECT * FROM days WHERE trip_id = ? ORDER BY day', [id]),
    db.all('SELECT id, activity_id, idea_id, name, type, size, kind, created_at FROM files WHERE trip_id = ? ORDER BY id', [id]),
    db.all('SELECT * FROM purchases WHERE trip_id = ? ORDER BY sort, id', [id]),
    db.all('SELECT id, day, title, blocks, sort FROM album_pages WHERE trip_id = ? ORDER BY sort, id', [id]),
    db.all(`SELECT ${PHOTO_META} FROM photos WHERE trip_id = ? ORDER BY day, sort, taken_at, id`, [id]),
    db.all('SELECT * FROM notes WHERE trip_id = ? ORDER BY sort, id', [id]),
  ]);
  const shares = (await db.all('SELECT * FROM share_links WHERE trip_id = ? ORDER BY id', [id])).map(linkOut);
  return { trip, cities, stays, activities, checklist, ideas, days, files, purchases, pages: pageRows.map(pageOut), photos, notes, shares };
}

const nextSort = async (table, where, args) => (await db.get(`SELECT COALESCE(MAX(sort), -1) AS m FROM ${table} WHERE ${where}`, args)).m + 1;

export const app = express();
app.disable('x-powered-by');
// cabeçalhos básicos de proteção (o front-end na Vercel recebe os mesmos via vercel.json)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '5mb' }));

// rotas async: erros viram 500 em vez de derrubar o processo
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// diagnóstico da instalação, antes do login e sem depender do banco: a tela de configuração
// do front-end usa isto para explicar em português o que falta (banco ou senha)
app.get('/api/setup', h(async (_req, res) => {
  let db = 'ok';
  let detail = '';
  try { await prepare(); } catch (e) {
    detail = describe(e);
    db = /\b401\b|unauthori[sz]ed|forbidden|\b403\b|token/i.test(detail) ? 'token' : 'error';
  }
  res.setHeader('Cache-Control', 'no-store');
  res.json({ db, detail, password: !!process.env.APP_PASSWORD, hosted: !!process.env.VERCEL });
}));

// espera o banco estar pronto (na Vercel cada instância nova passa por aqui uma vez)
app.use('/api', h(async (_req, _res, next) => {
  await prepare().catch((e) => { throw Object.assign(new Error(describe(e)), { publicMessage: `não consegui acessar o banco: ${describe(e)}` }); });
  next();
}));

// ── senha de acesso (opcional): defina APP_PASSWORD para exigir login
const PASSWORD = process.env.APP_PASSWORD || '';
const COOKIE = 'tp_session';
const token = PASSWORD ? crypto.createHmac('sha256', PASSWORD).update('trip-planner-session-v1').digest('hex') : '';
const readCookie = (req) => (req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).find(([k]) => k === COOKIE)?.[1] || '';
const authed = (req) => {
  if (!PASSWORD) return true;
  const got = Buffer.from(readCookie(req));
  const want = Buffer.from(token);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
};
const cookieAttrs = (req, maxAge) => `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`;

// limite de tentativas erradas por IP (na Vercel vale por instância, mas já freia quem tenta adivinhar a senha)
const FAILS = new Map();
const MAX_FAILS = 10;
const LOCK_MS = 15 * 60 * 1000;
const clientIp = (req) => String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

app.get('/api/session', (req, res) => res.json({ required: !!PASSWORD, ok: authed(req) }));
app.post('/api/login', h(async (req, res) => {
  const ip = clientIp(req);
  const now = Date.now();
  const f = FAILS.get(ip);
  if (f && f.until > now && f.n >= MAX_FAILS) {
    res.setHeader('Retry-After', String(Math.ceil((f.until - now) / 1000)));
    return res.status(429).json({ error: 'muitas tentativas erradas; espere alguns minutos' });
  }
  const given = Buffer.from(String(req.body?.password || ''));
  const want = Buffer.from(PASSWORD);
  const ok = PASSWORD && given.length === want.length && crypto.timingSafeEqual(given, want);
  if (!ok) {
    const cur = f && f.until > now ? f : { n: 0 };
    FAILS.set(ip, { n: cur.n + 1, until: now + LOCK_MS });
    if (FAILS.size > 5000) FAILS.clear();
    await new Promise((r) => setTimeout(r, 600)); // atrasa tentativas em sequência
    return res.status(401).json({ error: 'senha incorreta' });
  }
  FAILS.delete(ip);
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${cookieAttrs(req, 60 * 60 * 24 * 180)}`);
  res.json({ ok: true });
}));
app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieAttrs(req, 0)}`);
  res.json({ ok: true });
});
// ── link de compartilhamento: só leitura, sem senha, sem dados privados (notas, links, reservas, gastos, checklist)
// agenda assinada (Google Agenda / Apple Calendário): o app de agenda busca sozinho de tempos em tempos,
// com lembretes antes de cada atividade. Link secreto por viagem, sem senha (agendas não fazem login).
app.get('/api/cal/:token', h(async (req, res) => {
  const t = String(req.params.token || '').replace(/\.ics$/, '');
  const row = t.length >= 16 && (await db.get('SELECT id FROM trips WHERE cal_token = ?', [t]));
  if (!row) return res.status(404).type('text/plain').send('agenda não encontrada');
  const d = await getTrip(row.id);
  const cityMap = Object.fromEntries(d.cities.map((c) => [c.key, c]));
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(buildIcs(d.trip, d.activities, cityMap, { alarm: d.trip.remind_min ?? 30, flightAlarm: d.trip.remind_flight_min ?? 180, feed: true }));
}));

const SHARE_ACT = ['id', 'day', 'end_day', 'start', 'end', 'city', 'title', 'kind', 'location', 'details', 'transport', 'lat', 'lng', 'sort', 'start_tz', 'end_tz', 'from_code', 'to_code', 'via', 'slot', 'route', 'alt'];
const SHARE_ACT_MONEY = ['cost', 'notes', 'links'];
const only = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k] ?? null]));
// o link de visitante: o servidor só manda as partes que aquele link libera (roteiro, gastos, diário)
const shareLink = (t) => (String(t || '').length >= 16 ? db.get('SELECT * FROM share_links WHERE token = ?', [String(t)]) : null);
app.get('/api/share/:token', h(async (req, res) => {
  const link = await shareLink(req.params.token);
  if (!link) return res.status(404).json({ error: 'link inválido ou desativado' });
  const d = await getTrip(link.trip_id);
  const plan = !!link.plan;
  const money = !!link.money;
  const diary = !!link.diary;
  // sem o roteiro, o diário ainda precisa do nome das atividades das fotos (para a legenda automática), e só delas
  const photoActs = new Set(diary ? d.photos.map((p) => p.activity_id).filter(Boolean) : []);
  const acts = plan || money ? d.activities.map((a) => only(a, money ? [...SHARE_ACT, ...SHARE_ACT_MONEY] : SHARE_ACT))
    : d.activities.filter((a) => photoActs.has(a.id)).map((a) => only(a, ['id', 'day', 'start', 'end', 'city', 'title', 'kind']));
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    trip: {
      ...only(d.trip, ['name', 'subtitle', 'emoji', 'start', 'end', 'tz', 'cover', 'currency', 'home_currency', 'rate', 'accent', ...(money ? ['usd_rate', 'quota_usd'] : [])]),
      share_plan: plan ? 1 : 0, share_money: money ? 1 : 0, share_diary: diary ? 1 : 0,
    },
    cities: d.cities.map((c) => only(c, ['key', 'name', 'emoji', 'color', 'lat', 'lng'])),
    stays: plan || money ? d.stays.map((x) => only(x, ['id', 'city', 'name', 'check_in', 'check_out', 'lat', 'lng', ...(money ? ['cost'] : [])])) : [],
    activities: acts,
    days: d.days.map((x) => only(x, ['day', 'title'])),
    // diário liberado: as páginas do álbum e os dados das fotos (as fotos vêm de /api/share/:token/photos)
    ...(diary ? { pages: d.pages, photos: d.photos } : {}),
    // gastos liberados: custos, compras e os itens de reserva da checklist (nunca códigos de reserva nem anexos)
    ...(money ? {
      purchases: d.purchases.map((x) => only(x, ['id', 'title', 'store', 'city', 'day', 'price', 'grp', 'exempt', 'bought'])),
      checklist: d.checklist.filter((c) => /reserv|ingress/i.test(`${c.grp || ''} ${c.text}`)).map((c) => only(c, ['id', 'grp', 'text', 'done'])),
    } : {}),
  });
}));

// fotos do diário para quem tem o link (só em link com o diário liberado e só fotos daquela viagem)
const sharedPhoto = (col) => h(async (req, res) => {
  const t = String(req.params.token || '');
  const p = t.length >= 16 && (await db.get(`SELECT p.${col} AS data FROM photos p JOIN share_links s ON s.trip_id = p.trip_id WHERE s.token = ? AND s.diary = 1 AND p.id = ?`, [t, Number(req.params.pid)]));
  if (!p?.data) return res.status(404).json({ error: 'foto não encontrada' });
  photoHeaders(req, res);
  res.end(Buffer.from(p.data));
});
app.get('/api/share/:token/photos/:pid', sharedPhoto('data'));
app.get('/api/share/:token/photos/:pid/thumb', sharedPhoto('thumb'));

app.use('/api', (req, res, next) => (authed(req) ? next() : res.status(401).json({ error: 'login necessário' })));

// resolve :id → viagem existente (404 se não houver)
app.param('id', (req, _res, next, v) => { req.tripId = Number(v); next(); });
const needTrip = h(async (req, res, next) => ((await db.get('SELECT 1 AS ok FROM trips WHERE id = ?', [req.tripId])) ? next() : res.status(404).json({ error: 'viagem não encontrada' })));

// ── viagens
app.get('/api/trips', h(async (_req, res) => {
  res.json(await db.all(`
    SELECT t.*,
      (SELECT COUNT(*) FROM activities a WHERE a.trip_id = t.id) AS activity_count,
      (SELECT COUNT(*) FROM activities a WHERE a.trip_id = t.id AND a.done = 1) AS done_count
    FROM trips t ORDER BY t.start DESC, t.id DESC`));
}));

app.post('/api/trips', h(async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.start || !b.end) return res.status(400).json({ error: 'name, start e end são obrigatórios' });
  if (b.end < b.start) return res.status(400).json({ error: 'a data final é anterior à inicial' });
  const id = await createTripFull({ trip: b, cities: [], stays: [], activities: [] });
  res.status(201).json(await getTrip(id));
}));

app.get('/api/examples', (_req, res) => {
  res.json(Object.entries(EXAMPLES).map(([key, m]) => ({ key, ...m.EXAMPLE })));
});

app.post('/api/examples/:key', h(async (req, res) => {
  const m = EXAMPLES[req.params.key];
  if (!m) return res.status(404).json({ error: 'exemplo não encontrado' });
  const id = await createTripFull({ trip: m.TRIP, cities: m.CITIES.map((c) => ({ ...c })), stays: m.STAYS, activities: m.ACTIVITIES, checklist: m.CHECKLIST, ideas: m.IDEAS, purchases: m.PURCHASES });
  res.status(201).json(await getTrip(id));
}));

// importa um backup (formato do /export; aceita também o formato da versão antiga com cost_jpy)
app.post('/api/trips/import', h(async (req, res) => {
  const b = req.body || {};
  if (!Array.isArray(b.activities) || !b.trip?.start || !b.trip?.end) return res.status(400).json({ error: 'JSON inválido (faltam trip e activities)' });
  const t = { currency: 'BRL', home_currency: 'BRL', ...b.trip, rate: b.trip.rate ?? b.trip.brl_rate ?? 1 };
  try {
    res.status(201).json(await getTrip(await createTripFull({ ...b, trip: t })));
  } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
}));

app.get('/api/trips/:id', needTrip, h(async (req, res) => res.json(await getTrip(req.tripId))));

app.put('/api/trips/:id', needTrip, h(async (req, res) => {
  const cur = await db.get('SELECT * FROM trips WHERE id = ?', [req.tripId]);
  const row = { ...cur, ...req.body };
  if (row.accent && !/^#[0-9a-f]{6}$/i.test(row.accent)) row.accent = null;
  row.scope = scopeOf(row.scope);
  if (!row.name || !row.start || !row.end || row.end < row.start) return res.status(400).json({ error: 'nome e datas válidas são obrigatórios' });
  await db.run(`UPDATE trips SET ${setList(TRIP_FIELDS)} WHERE id = ?`, [...pick(row, TRIP_FIELDS), req.tripId]);
  res.json(await db.get('SELECT * FROM trips WHERE id = ?', [req.tripId]));
}));

app.delete('/api/trips/:id', needTrip, h(async (req, res) => {
  await deleteTrip(req.tripId);
  res.status(204).end();
}));

app.post('/api/trips/:id/duplicate', needTrip, h(async (req, res) => {
  const d = await getTrip(req.tripId);
  const id = await createTripFull({ ...d, trip: { ...d.trip, name: `${d.trip.name} (cópia)` }, activities: d.activities.map((a) => ({ ...a, done: 0, spent: null, rating: null, review: null })), checklist: d.checklist.map((c) => ({ ...c, done: 0 })), purchases: d.purchases.map((x) => ({ ...x, bought: 0 })), pages: [] });
  res.status(201).json(await getTrip(id));
}));

app.get('/api/trips/:id/export', needTrip, h(async (req, res) => {
  const d = await getTrip(req.tripId);
  const file = `${d.trip.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'viagem'}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
  res.json({ ...d, shares: undefined, trip: { ...d.trip, share_token: undefined, cal_token: undefined } });
}));

// ── links de visitante: vários por viagem, cada um com nome e as partes que mostra
const linkOut = (r) => ({ id: r.id, token: r.token, name: r.name, plan: r.plan ? 1 : 0, money: r.money ? 1 : 0, diary: r.diary ? 1 : 0, created_at: r.created_at });
const linkFields = (b, cur = {}) => {
  const f = {
    name: String(b.name ?? cur.name ?? '').trim().slice(0, 80) || 'Link',
    plan: (b.plan ?? cur.plan ?? 1) ? 1 : 0,
    money: (b.money ?? cur.money ?? 0) ? 1 : 0,
    diary: (b.diary ?? cur.diary ?? 0) ? 1 : 0,
  };
  return f.plan || f.money || f.diary ? f : null;
};
const newToken = () => crypto.randomBytes(18).toString('base64url');
app.get('/api/trips/:id/shares', needTrip, h(async (req, res) => {
  res.json((await db.all('SELECT * FROM share_links WHERE trip_id = ? ORDER BY id', [req.tripId])).map(linkOut));
}));
app.post('/api/trips/:id/shares', needTrip, h(async (req, res) => {
  const f = linkFields(req.body || {});
  if (!f) return res.status(400).json({ error: 'escolha ao menos uma parte para mostrar' });
  const r = await db.run('INSERT INTO share_links (trip_id, token, name, plan, money, diary) VALUES (?,?,?,?,?,?)', [req.tripId, newToken(), f.name, f.plan, f.money, f.diary]);
  res.json(linkOut(await db.get('SELECT * FROM share_links WHERE id = ?', [Number(r.lastInsertRowid)])));
}));
const ownLink = async (req, res) => {
  const row = await db.get('SELECT * FROM share_links WHERE id = ?', [Number(req.params.sid)]);
  if (!row) { res.status(404).json({ error: 'link não encontrado' }); return null; }
  return row;
};
app.put('/api/shares/:sid', h(async (req, res) => {
  const row = await ownLink(req, res);
  if (!row) return;
  const f = linkFields(req.body || {}, row);
  if (!f) return res.status(400).json({ error: 'escolha ao menos uma parte para mostrar' });
  // novo endereço: o antigo para de funcionar na hora
  const token = req.body?.renew ? newToken() : row.token;
  await db.run('UPDATE share_links SET name = ?, plan = ?, money = ?, diary = ?, token = ? WHERE id = ?', [f.name, f.plan, f.money, f.diary, token, row.id]);
  res.json(linkOut(await db.get('SELECT * FROM share_links WHERE id = ?', [row.id])));
}));
app.delete('/api/shares/:sid', h(async (req, res) => {
  const row = await ownLink(req, res);
  if (!row) return;
  await db.run('DELETE FROM share_links WHERE id = ?', [row.id]);
  res.json({ ok: true });
}));

app.post('/api/trips/:id/calendar', needTrip, h(async (req, res) => {
  const t = crypto.randomBytes(18).toString('base64url');
  await db.run('UPDATE trips SET cal_token = ? WHERE id = ?', [t, req.tripId]);
  res.json({ cal_token: t });
}));
app.delete('/api/trips/:id/calendar', needTrip, h(async (req, res) => {
  await db.run('UPDATE trips SET cal_token = NULL WHERE id = ?', [req.tripId]);
  res.json({ cal_token: null });
}));

// cidades de todas as viagens, para o mapa de países
app.get('/api/places', h(async (_req, res) => {
  res.json(await db.all(`
    SELECT c.trip_id, c.key, c.name, c.lat, c.lng, t.name AS trip, t.start, t.end
    FROM cities c JOIN trips t ON t.id = c.trip_id
    WHERE c.lat IS NOT NULL AND c.lng IS NOT NULL AND c.key != 'transito'`));
}));

// preferências gerais do app (ex.: país onde mora e visão do "Meu mapa"), iguais em todos os aparelhos
const SETTINGS = ['home_country', 'map_view'];
app.get('/api/settings', h(async (_req, res) => {
  res.json(Object.fromEntries((await db.all('SELECT key, value FROM settings')).filter((r) => SETTINGS.includes(r.key)).map((r) => [r.key, r.value])));
}));
app.put('/api/settings', h(async (req, res) => {
  const b = req.body || {};
  const keys = SETTINGS.filter((k) => k in b);
  if (keys.length) await db.batch(keys.map((k) => (b[k] == null || b[k] === '' ? ['DELETE FROM settings WHERE key = ?', [k]] : ['INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [k, String(b[k]).slice(0, 40)]])));
  res.json(Object.fromEntries((await db.all('SELECT key, value FROM settings')).filter((r) => SETTINGS.includes(r.key)).map((r) => [r.key, r.value])));
}));

// ── checklist
app.post('/api/trips/:id/checklist', needTrip, h(async (req, res) => {
  const b = req.body || {};
  if (!b.text?.trim()) return res.status(400).json({ error: 'text é obrigatório' });
  const r = await run1(insCheck(req.tripId, { ...b, sort: await nextSort('checklist', 'trip_id = ?', [req.tripId]) }));
  res.status(201).json(await db.get('SELECT * FROM checklist WHERE id = ?', [r.lastInsertRowid]));
}));
app.put('/api/checklist/:cid', h(async (req, res) => {
  const cur = await db.get('SELECT * FROM checklist WHERE id = ?', [Number(req.params.cid)]);
  if (!cur) return res.status(404).json({ error: 'não encontrado' });
  const row = { ...cur, ...req.body, done: (req.body.done ?? cur.done) ? 1 : 0 };
  await db.run(`UPDATE checklist SET ${setList(CHECK_FIELDS)} WHERE id = ?`, [...pick(row, CHECK_FIELDS), cur.id]);
  res.json(await db.get('SELECT * FROM checklist WHERE id = ?', [cur.id]));
}));
app.delete('/api/checklist/:cid', h(async (req, res) => {
  await db.run('DELETE FROM checklist WHERE id = ?', [Number(req.params.cid)]);
  res.status(204).end();
}));

// ── notas de viagem: dicas por assunto, editáveis; um guia pronto pode ser carregado de uma vez
const noteRow = (b, cur = {}) => {
  const row = { ...cur, ...b };
  return {
    ...row,
    title: String(row.title ?? '').trim().slice(0, 200),
    grp: String(row.grp ?? '').trim().slice(0, 80) || null,
    body: String(row.body ?? '').slice(0, 20000) || null,
    links: Array.isArray(row.links) ? row.links.filter((l) => l?.url).slice(0, 20).map((l) => ({ label: String(l.label || '').slice(0, 120), url: String(l.url).slice(0, 2000) })) : row.links,
  };
};
app.get('/api/guides', (_req, res) => {
  res.json(Object.values(GUIDES).map((m) => ({ ...m.GUIDE, count: m.NOTES.length, groups: [...new Set(m.NOTES.map((x) => x.grp))] })));
});
app.post('/api/trips/:id/notes', needTrip, h(async (req, res) => {
  const b = noteRow(req.body || {});
  if (!b.title) return res.status(400).json({ error: 'title é obrigatório' });
  const r = await run1(insNote(req.tripId, { ...b, sort: await nextSort('notes', 'trip_id = ?', [req.tripId]) }));
  res.status(201).json(await db.get('SELECT * FROM notes WHERE id = ?', [r.lastInsertRowid]));
}));
// carrega um guia: entram só as notas que a viagem ainda não tem (mesmo assunto e título), então dá para carregar de novo sem duplicar
app.post('/api/trips/:id/notes/guide/:key', needTrip, h(async (req, res) => {
  const m = Object.hasOwn(GUIDES, req.params.key) ? GUIDES[req.params.key] : null;
  if (!m) return res.status(404).json({ error: 'guia não encontrado' });
  const have = new Set((await db.all('SELECT grp, title FROM notes WHERE trip_id = ?', [req.tripId])).map((x) => `${x.grp || ''}|${x.title}`));
  const start = await nextSort('notes', 'trip_id = ?', [req.tripId]);
  const add = m.NOTES.filter((x) => !have.has(`${x.grp || ''}|${x.title}`));
  if (add.length) await db.batch(add.map((x, i) => insNote(req.tripId, { ...x, sort: start + i })));
  res.status(201).json({ added: add.length, notes: await db.all('SELECT * FROM notes WHERE trip_id = ? ORDER BY sort, id', [req.tripId]) });
}));
app.put('/api/notes/:nid', h(async (req, res) => {
  const cur = await db.get('SELECT * FROM notes WHERE id = ?', [Number(req.params.nid)]);
  if (!cur) return res.status(404).json({ error: 'não encontrado' });
  const row = noteRow(req.body || {}, cur);
  if (!row.title) return res.status(400).json({ error: 'title é obrigatório' });
  const [, args] = insNote(cur.trip_id, row);
  await db.run(`UPDATE notes SET ${setList(NOTE_FIELDS)} WHERE id = ?`, [...args.slice(1), cur.id]);
  res.json(await db.get('SELECT * FROM notes WHERE id = ?', [cur.id]));
}));
app.delete('/api/notes/:nid', h(async (req, res) => {
  await db.run('DELETE FROM notes WHERE id = ?', [Number(req.params.nid)]);
  res.status(204).end();
}));

// ── compras para trazer (cota da Receita)
app.post('/api/trips/:id/purchases', needTrip, h(async (req, res) => {
  const b = req.body || {};
  if (!b.title?.trim()) return res.status(400).json({ error: 'title é obrigatório' });
  const r = await run1(insBuy(req.tripId, { ...b, sort: await nextSort('purchases', 'trip_id = ?', [req.tripId]) }));
  res.status(201).json(await db.get('SELECT * FROM purchases WHERE id = ?', [r.lastInsertRowid]));
}));
app.put('/api/purchases/:pid', h(async (req, res) => {
  const cur = await db.get('SELECT * FROM purchases WHERE id = ?', [Number(req.params.pid)]);
  if (!cur) return res.status(404).json({ error: 'não encontrada' });
  const row = { ...cur, ...req.body };
  row.bought = row.bought ? 1 : 0;
  row.exempt = row.exempt ? 1 : 0;
  if (!String(row.title || '').trim()) return res.status(400).json({ error: 'title é obrigatório' });
  await db.run(`UPDATE purchases SET ${setList(BUY_FIELDS)} WHERE id = ?`, [...pick(row, BUY_FIELDS), cur.id]);
  res.json(await db.get('SELECT * FROM purchases WHERE id = ?', [cur.id]));
}));
app.delete('/api/purchases/:pid', h(async (req, res) => {
  await db.run('DELETE FROM purchases WHERE id = ?', [Number(req.params.pid)]);
  res.status(204).end();
}));

// ── ideias (lugares sem dia definido)
app.post('/api/trips/:id/ideas', needTrip, h(async (req, res) => {
  const b = req.body || {};
  if (!b.title?.trim()) return res.status(400).json({ error: 'title é obrigatório' });
  const r = await run1(insIdea(req.tripId, { ...b, sort: await nextSort('ideas', 'trip_id = ?', [req.tripId]) }));
  res.status(201).json(await db.get('SELECT * FROM ideas WHERE id = ?', [r.lastInsertRowid]));
}));
app.put('/api/ideas/:iid', h(async (req, res) => {
  const cur = await db.get('SELECT * FROM ideas WHERE id = ?', [Number(req.params.iid)]);
  if (!cur) return res.status(404).json({ error: 'não encontrada' });
  const row = { ...cur, ...req.body };
  await db.run(`UPDATE ideas SET ${setList(IDEA_FIELDS)} WHERE id = ?`, [...pick(row, IDEA_FIELDS), cur.id]);
  res.json(await db.get('SELECT * FROM ideas WHERE id = ?', [cur.id]));
}));
app.delete('/api/ideas/:iid', h(async (req, res) => {
  const iid = Number(req.params.iid);
  await db.batch([['DELETE FROM files WHERE idea_id = ?', [iid]], ['DELETE FROM ideas WHERE id = ?', [iid]]]);
  res.status(204).end();
}));
// ideia → atividade no fim do dia escolhido
app.post('/api/ideas/:iid/schedule', h(async (req, res) => {
  const idea = await db.get('SELECT * FROM ideas WHERE id = ?', [Number(req.params.iid)]);
  const day = req.body?.day;
  if (!idea) return res.status(404).json({ error: 'não encontrada' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '')) return res.status(400).json({ error: 'day inválido' });
  const sort = await nextSort('activities', 'trip_id = ? AND day = ?', [idea.trip_id, day]);
  // os anexos acompanham o item (last_insert_rowid é o da atividade recém-criada, no mesmo lote)
  const [ins] = await db.batch([insAct(idea.trip_id, { ...idea, day, sort, done: 0 }), ['UPDATE files SET activity_id = last_insert_rowid(), idea_id = NULL WHERE idea_id = ?', [idea.id]], ['DELETE FROM ideas WHERE id = ?', [idea.id]]]);
  res.status(201).json(await db.get('SELECT * FROM activities WHERE id = ?', [ins.lastInsertRowid]));
}));
// atividade → volta para as ideias
app.post('/api/activities/:aid/unschedule', h(async (req, res) => {
  const a = await db.get('SELECT * FROM activities WHERE id = ?', [Number(req.params.aid)]);
  if (!a) return res.status(404).json({ error: 'não encontrada' });
  const sort = await nextSort('ideas', 'trip_id = ?', [a.trip_id]);
  const [ins] = await db.batch([insIdea(a.trip_id, { ...a, sort }), ['UPDATE files SET idea_id = last_insert_rowid(), activity_id = NULL WHERE activity_id = ?', [a.id]], ['DELETE FROM activities WHERE id = ?', [a.id]]]);
  res.status(201).json(await db.get('SELECT * FROM ideas WHERE id = ?', [ins.lastInsertRowid]));
}));

// ── atividades
app.post('/api/trips/:id/activities', needTrip, h(async (req, res) => {
  const b = req.body || {};
  if (!b.day || !b.title) return res.status(400).json({ error: 'day e title são obrigatórios' });
  const sort = b.sort ?? await nextSort('activities', 'trip_id = ? AND day = ?', [req.tripId, b.day]);
  const r = await run1(insAct(req.tripId, { ...b, sort, done: b.done ? 1 : 0, kind: b.kind || 'sight' }));
  res.status(201).json(await db.get('SELECT * FROM activities WHERE id = ?', [r.lastInsertRowid]));
}));

app.put('/api/activities/:id', h(async (req, res) => {
  const id = Number(req.params.id);
  const cur = await db.get('SELECT * FROM activities WHERE id = ?', [id]);
  if (!cur) return res.status(404).json({ error: 'não encontrada' });
  const row = { ...cur, ...req.body, done: (req.body.done ?? cur.done) ? 1 : 0 };
  if (row.day !== cur.day && !('sort' in req.body)) row.sort = await nextSort('activities', 'trip_id = ? AND day = ?', [cur.trip_id, row.day]);
  await db.run(`UPDATE activities SET ${setList(ACT_FIELDS)} WHERE id = ?`, [...pick(row, ACT_FIELDS), id]);
  res.json(await db.get('SELECT * FROM activities WHERE id = ?', [id]));
}));

app.delete('/api/activities/:id', h(async (req, res) => {
  const id = Number(req.params.id);
  await db.batch([['DELETE FROM files WHERE activity_id = ?', [id]], ['DELETE FROM activities WHERE id = ?', [id]]]);
  res.status(204).end();
}));

// ── anexos (ingressos, passagens, confirmações): guardados no próprio banco.
// Limite de 4 MB por arquivo por causa do teto de 4,5 MB por requisição da Vercel.
const MAX_FILE = 4 * 1024 * 1024;
const INLINE = /^(image\/(png|jpeg|gif|webp|avif)|application\/pdf|text\/plain)$/;
app.post('/api/:kind(activities|ideas)/:oid/files', express.raw({ type: () => true, limit: MAX_FILE }), h(async (req, res) => {
  const isAct = req.params.kind === 'activities';
  const owner = await db.get(`SELECT id, trip_id FROM ${isAct ? 'activities' : 'ideas'} WHERE id = ?`, [Number(req.params.oid)]);
  if (!owner) return res.status(404).json({ error: 'não encontrada' });
  const data = Buffer.isBuffer(req.body) ? req.body : null;
  if (!data?.length) return res.status(400).json({ error: 'arquivo vazio' });
  let name = 'arquivo';
  try { name = decodeURIComponent(String(req.get('x-file-name') || 'arquivo')); } catch { /* nome inválido */ }
  name = name.replace(/[\\/\r\n"]/g, '_').slice(0, 160) || 'arquivo';
  // o corpo vai como octet-stream (para o express.json global não interpretar .json); o tipo real vem em X-File-Type
  const type = String(req.get('x-file-type') || 'application/octet-stream').split(';')[0].trim().toLowerCase().slice(0, 100);
  const kind = req.get('x-file-kind') === 'receipt' ? 'receipt' : 'doc'; // recibo do gasto real ou documento
  const r = await db.run('INSERT INTO files (trip_id, activity_id, idea_id, name, type, size, data, kind) VALUES (?,?,?,?,?,?,?,?)',
    [owner.trip_id, isAct ? owner.id : null, isAct ? null : owner.id, name, type, data.length, data, kind]);
  res.status(201).json(await db.get('SELECT id, activity_id, idea_id, name, type, size, kind, created_at FROM files WHERE id = ?', [r.lastInsertRowid]));
}));
app.get('/api/files/:fid', h(async (req, res) => {
  const f = await db.get('SELECT name, type, data FROM files WHERE id = ?', [Number(req.params.fid)]);
  if (!f) return res.status(404).json({ error: 'arquivo não encontrado' });
  const inline = INLINE.test(f.type || '');
  res.setHeader('Content-Type', inline ? f.type : 'application/octet-stream');
  res.setHeader('Content-Disposition', `${inline && !('download' in req.query) ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.name || 'arquivo')}`);
  // o arquivo nunca muda (id novo a cada envio) e não pode rodar nada na origem do app
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // PDF não abre no Chrome com "sandbox"; os demais tipos em linha (imagem, texto) ficam isolados
  res.setHeader('Content-Security-Policy', `${f.type === 'application/pdf' ? '' : 'sandbox; '}default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'`);
  res.end(Buffer.from(f.data));
}));
app.delete('/api/files/:fid', h(async (req, res) => {
  await db.run('DELETE FROM files WHERE id = ?', [Number(req.params.fid)]);
  res.status(204).end();
}));

// ── diário de viagem
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
// câmera e foto original, como o aparelho leu do EXIF: só campos conhecidos e curtos
const META_KEYS = { make: 's', model: 's', lens: 's', f: 'n', exp: 'n', iso: 'n', focal: 'n', focal35: 'n', alt: 'n', ow: 'n', oh: 'n', noexif: 'n' };
function cleanMeta(raw) {
  let m;
  try { m = JSON.parse(decodeURIComponent(String(raw || ''))); } catch { return null; }
  if (!m || typeof m !== 'object') return null;
  const out = {};
  for (const [k, t] of Object.entries(META_KEYS)) {
    const x = m[k];
    if (t === 's' && typeof x === 'string' && x.trim()) out[k] = x.trim().slice(0, 80);
    if (t === 'n' && typeof x === 'number' && Number.isFinite(x)) out[k] = x;
  }
  return Object.keys(out).length ? JSON.stringify(out) : null;
}
function photoHeaders(req, res) {
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Content-Disposition', `${'download' in req.query ? 'attachment' : 'inline'}; filename="foto-${Number(req.params.pid)}.jpg"`);
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
}
// foto nova: o corpo é a miniatura seguida da foto (X-Thumb-Length diz onde uma acaba), tudo numa requisição
// só para caber no limite de 4,5 MB da Vercel; o aparelho já manda as duas reduzidas em JPEG
app.post('/api/trips/:id/photos', needTrip, express.raw({ type: () => true, limit: MAX_FILE }), h(async (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body : null;
  const tl = Number(req.get('x-thumb-length')) || 0;
  if (!body?.length || tl <= 0 || tl >= body.length) return res.status(400).json({ error: 'foto vazia ou incompleta' });
  const jpeg = (b) => b[0] === 0xff && b[1] === 0xd8;
  const thumb = body.subarray(0, tl);
  const data = body.subarray(tl);
  if (!jpeg(thumb) || !jpeg(data)) return res.status(400).json({ error: 'a foto precisa chegar em JPEG' });
  const day = String(req.get('x-day') || '');
  const taken = String(req.get('x-taken') || '').slice(0, 25) || null;
  const int = (v) => (v !== '' && v != null && Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
  const num = (v, max) => (v !== '' && v != null && Number.isFinite(Number(v)) && Math.abs(Number(v)) <= max ? Number(v) : null);
  const lat = num(req.get('x-lat'), 90);
  const lng = num(req.get('x-lng'), 180);
  const act = int(req.get('x-activity'));
  const activity = act && (await db.get('SELECT id FROM activities WHERE id = ? AND trip_id = ?', [act, req.tripId])) ? act : null;
  const sort = await nextSort('photos', 'trip_id = ? AND day IS ?', [req.tripId, DAY_RE.test(day) ? day : null]);
  const r = await db.run('INSERT INTO photos (trip_id, day, taken_at, w, h, size, sort, data, thumb, lat, lng, activity_id, meta) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [req.tripId, DAY_RE.test(day) ? day : null, taken, int(req.get('x-w')), int(req.get('x-h')), data.length, sort, data, thumb,
      lat != null && lng != null ? lat : null, lat != null && lng != null ? lng : null, activity, cleanMeta(req.get('x-meta'))]);
  res.status(201).json(await db.get(`SELECT ${PHOTO_META} FROM photos WHERE id = ?`, [r.lastInsertRowid]));
}));
const sendPhoto = (col) => h(async (req, res) => {
  const p = await db.get(`SELECT ${col} AS data FROM photos WHERE id = ?`, [Number(req.params.pid)]);
  if (!p?.data) return res.status(404).json({ error: 'foto não encontrada' });
  photoHeaders(req, res);
  res.end(Buffer.from(p.data));
});
// páginas do álbum: body = { day, title, blocks, sort }
app.post('/api/trips/:id/pages', needTrip, h(async (req, res) => {
  const b = req.body || {};
  const sort = Number.isFinite(Number(b.sort)) ? Number(b.sort) : await nextSort('album_pages', 'trip_id = ?', [req.tripId]);
  const r = await run1(insPage(req.tripId, b, sort));
  res.status(201).json(pageOut(await db.get('SELECT id, day, title, blocks, sort FROM album_pages WHERE id = ?', [r.lastInsertRowid])));
}));
// link curto do TikTok (vt.tiktok.com/…, o que o app copia): segue os redirecionamentos para achar o código do vídeo.
// Só para hosts do TikTok, para o servidor não virar um proxy aberto.
const TIKTOK_HOST = /^(?:vt|vm|www|m)\.tiktok\.com$/i;
app.post('/api/video/resolve', h(async (req, res) => {
  let url;
  try { url = new URL(String(req.body?.url || '')); } catch { return res.status(400).json({ error: 'link inválido' }); }
  for (let i = 0; i < 5; i++) {
    if (url.protocol !== 'https:' || !TIKTOK_HOST.test(url.hostname)) break;
    const m = url.pathname.match(/\/video\/(\d{10,25})/);
    if (m) return res.json({ src: 'tiktok', vid: m[1] });
    const r = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(6000) }).catch(() => null);
    const loc = r?.headers.get('location');
    if (!loc) break;
    url = new URL(loc, url);
  }
  res.status(404).json({ error: 'não achei o vídeo nesse link' });
}));

app.put('/api/pages/:pid', h(async (req, res) => {
  const pid = Number(req.params.pid);
  const cur = await db.get('SELECT * FROM album_pages WHERE id = ?', [pid]);
  if (!cur) return res.status(404).json({ error: 'página não encontrada' });
  const b = req.body || {};
  const [, args] = insPage(cur.trip_id, { day: 'day' in b ? b.day : cur.day, title: 'title' in b ? b.title : cur.title, blocks: 'blocks' in b ? b.blocks : parseBlocks(cur.blocks) }, Number.isFinite(Number(b.sort)) ? Number(b.sort) : cur.sort);
  await db.run('UPDATE album_pages SET day = ?, title = ?, blocks = ?, sort = ? WHERE id = ?', [...args.slice(1), pid]);
  res.json(pageOut(await db.get('SELECT id, day, title, blocks, sort FROM album_pages WHERE id = ?', [pid])));
}));
// apagar a página apaga as fotos dela (as que não aparecem em outra página)
app.delete('/api/pages/:pid', h(async (req, res) => {
  const pid = Number(req.params.pid);
  const cur = await db.get('SELECT * FROM album_pages WHERE id = ?', [pid]);
  if (!cur) return res.status(204).end();
  const others = new Set((await db.all('SELECT blocks FROM album_pages WHERE trip_id = ? AND id != ?', [cur.trip_id, pid])).flatMap((r) => parseBlocks(r.blocks).flatMap((x) => x.ids || [])));
  const ids = parseBlocks(cur.blocks).flatMap((x) => x.ids || []).filter((x) => !others.has(x));
  await db.batch([...ids.map((x) => ['DELETE FROM photos WHERE id = ? AND trip_id = ?', [x, cur.trip_id]]), ['DELETE FROM album_pages WHERE id = ?', [pid]]]);
  res.status(204).end();
}));
app.get('/api/photos/:pid', sendPhoto('data'));
app.get('/api/photos/:pid/thumb', sendPhoto('thumb'));
// legenda, dia e ordem: body = { caption?, day?, sort? }
app.put('/api/photos/:pid', h(async (req, res) => {
  const pid = Number(req.params.pid);
  const cur = await db.get(`SELECT ${PHOTO_META} FROM photos WHERE id = ?`, [pid]);
  if (!cur) return res.status(404).json({ error: 'foto não encontrada' });
  const b = req.body || {};
  const row = {
    caption: 'caption' in b ? String(b.caption ?? '').trim().slice(0, 500) || null : cur.caption,
    day: 'day' in b ? (DAY_RE.test(String(b.day)) ? String(b.day) : null) : cur.day,
    sort: Number.isFinite(Number(b.sort)) ? Number(b.sort) : cur.sort,
    activity_id: 'activity_id' in b ? (Number(b.activity_id) || null) : cur.activity_id,
  };
  await db.run('UPDATE photos SET caption = ?, day = ?, sort = ?, activity_id = ? WHERE id = ?', [row.caption, row.day, row.sort, row.activity_id, pid]);
  res.json({ ...cur, ...row });
}));
app.delete('/api/photos/:pid', h(async (req, res) => {
  await db.run('DELETE FROM photos WHERE id = ?', [Number(req.params.pid)]);
  res.status(204).end();
}));

// reordena um dia: body = { day, ids: [..] }
app.put('/api/trips/:id/days/reorder', needTrip, h(async (req, res) => {
  const { day, ids } = req.body || {};
  if (!day || !Array.isArray(ids)) return res.status(400).json({ error: 'day e ids são obrigatórios' });
  if (ids.length) await db.batch(ids.map((aid, i) => ['UPDATE activities SET sort = ? WHERE id = ? AND day = ? AND trip_id = ?', [i, Number(aid), day, req.tripId]]));
  res.json(await db.all('SELECT * FROM activities WHERE trip_id = ? AND day = ? ORDER BY sort, id', [req.tripId, day]));
}));

// tema e anotações de um dia: body = { title, notes }; vazio apaga
app.put('/api/trips/:id/daynotes/:day', needTrip, h(async (req, res) => {
  const day = req.params.day;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return res.status(400).json({ error: 'dia inválido' });
  const row = { day, title: req.body?.title?.trim() || null, notes: req.body?.notes?.trim() || null };
  if (!row.title && !row.notes) {
    await db.run('DELETE FROM days WHERE trip_id = ? AND day = ?', [req.tripId, day]);
    return res.json({ day, title: null, notes: null });
  }
  await run1(insDay(req.tripId, row));
  res.json(await db.get('SELECT * FROM days WHERE trip_id = ? AND day = ?', [req.tripId, day]));
}));

// ── hospedagens
app.post('/api/trips/:id/stays', needTrip, h(async (req, res) => {
  const r = await run1(insStay(req.tripId, req.body || {}));
  res.status(201).json(await db.get('SELECT * FROM stays WHERE id = ?', [r.lastInsertRowid]));
}));

app.put('/api/stays/:id', h(async (req, res) => {
  const id = Number(req.params.id);
  const cur = await db.get('SELECT * FROM stays WHERE id = ?', [id]);
  if (!cur) return res.status(404).json({ error: 'não encontrada' });
  const row = { ...cur, ...req.body };
  await db.run(`UPDATE stays SET ${setList(STAY_FIELDS)} WHERE id = ?`, [...pick(row, STAY_FIELDS), id]);
  res.json(await db.get('SELECT * FROM stays WHERE id = ?', [id]));
}));

app.delete('/api/stays/:id', h(async (req, res) => {
  await db.run('DELETE FROM stays WHERE id = ?', [Number(req.params.id)]);
  res.status(204).end();
}));

// ── cidades / locais da viagem
app.post('/api/trips/:id/cities', needTrip, h(async (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'name é obrigatório' });
  const used = new Set((await db.all('SELECT key FROM cities WHERE trip_id = ?', [req.tripId])).map((c) => c.key));
  const base = b.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'local';
  let key = base;
  for (let i = 2; used.has(key); i++) key = `${base}-${i}`;
  await run1(insCity(req.tripId, { color: '#2874a6', emoji: '📍', ...b, key }));
  res.status(201).json(await db.get('SELECT * FROM cities WHERE trip_id = ? AND key = ?', [req.tripId, key]));
}));

app.put('/api/cities/:id', h(async (req, res) => {
  const id = Number(req.params.id);
  const cur = await db.get('SELECT * FROM cities WHERE id = ?', [id]);
  if (!cur) return res.status(404).json({ error: 'não encontrada' });
  const row = { ...cur, ...req.body, key: cur.key }; // a chave é o vínculo com as atividades, não muda
  await db.run(`UPDATE cities SET ${setList(CITY_FIELDS)} WHERE id = ?`, [...pick(row, CITY_FIELDS), id]);
  res.json(await db.get('SELECT * FROM cities WHERE id = ?', [id]));
}));

app.delete('/api/cities/:id', h(async (req, res) => {
  const cur = await db.get('SELECT * FROM cities WHERE id = ?', [Number(req.params.id)]);
  if (cur) {
    await db.batch([
      ['UPDATE activities SET city = NULL WHERE trip_id = ? AND city = ?', [cur.trip_id, cur.key]],
      ['UPDATE stays SET city = NULL WHERE trip_id = ? AND city = ?', [cur.trip_id, cur.key]],
      ['UPDATE ideas SET city = NULL WHERE trip_id = ? AND city = ?', [cur.trip_id, cur.key]],
      ['DELETE FROM cities WHERE id = ?', [cur.id]],
    ]);
  }
  res.status(204).end();
}));

app.use('/api', (_req, res) => res.status(404).json({ error: 'rota não encontrada' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'arquivo maior que 4 MB' });
  console.error(err);
  res.status(500).json({ error: err.publicMessage || 'erro no servidor' });
});
