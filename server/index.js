import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as japan from './examples/japan.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || path.join(ROOT, 'data', 'planner.db');
if (DB_PATH !== ':memory:') fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// viagens de exemplo que o usuário pode carregar na tela inicial
const EXAMPLES = { japao: japan };

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

// ── migração: versão antiga (uma única viagem, tabela `trip` chave/valor, custo em `cost_jpy`)
const hasTable = (n) => !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(n);
const legacy = hasTable('trip') && !hasTable('trips');
if (legacy) {
  db.exec('ALTER TABLE cities RENAME TO cities_old; ALTER TABLE stays RENAME TO stays_old; ALTER TABLE activities RENAME TO activities_old;');
}

db.exec(`
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
  CREATE INDEX IF NOT EXISTS idx_act_trip_day ON activities(trip_id, day, sort);
  CREATE INDEX IF NOT EXISTS idx_stays_trip ON stays(trip_id);
`);

// colunas novas em bancos antigos
const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
for (const c of ['notes', 'links']) if (!cols('activities').includes(c)) db.exec(`ALTER TABLE activities ADD COLUMN ${c} TEXT`);
for (const [c, t] of [['check_in_time', 'TEXT'], ['check_out_time', 'TEXT'], ['booking', 'TEXT'], ['cost', 'REAL'], ['link', 'TEXT']]) {
  if (!cols('stays').includes(c)) db.exec(`ALTER TABLE stays ADD COLUMN ${c} ${t}`);
}

const ACT_FIELDS = ['day', 'end_day', 'start', 'end', 'city', 'title', 'kind', 'location', 'details', 'transport', 'cost', 'lat', 'lng', 'sort', 'done', 'notes', 'links'];
const STAY_FIELDS = ['city', 'name', 'address', 'check_in', 'check_out', 'lat', 'lng', 'notes', 'check_in_time', 'check_out_time', 'booking', 'cost', 'link'];
const CITY_FIELDS = ['key', 'name', 'emoji', 'color', 'lat', 'lng'];
const CHECK_FIELDS = ['grp', 'text', 'done', 'sort'];
const TRIP_FIELDS = ['name', 'subtitle', 'emoji', 'start', 'end', 'currency', 'home_currency', 'rate'];

const clean = (v) => (v === '' || v === undefined ? null : v);
const pick = (body, fields) => fields.map((f) => (f in body ? clean(body[f]) : null));
const marks = (fields) => fields.map(() => '?').join(',');

function insertActivity(tripId, row) {
  return db.prepare(`INSERT INTO activities (trip_id,${ACT_FIELDS.join(',')}) VALUES (?,${marks(ACT_FIELDS)})`).run(tripId, ...pick(row, ACT_FIELDS));
}
function insertStay(tripId, row) {
  return db.prepare(`INSERT INTO stays (trip_id,${STAY_FIELDS.join(',')}) VALUES (?,${marks(STAY_FIELDS)})`).run(tripId, ...pick(row, STAY_FIELDS));
}
function insertCheck(tripId, row) {
  return db.prepare(`INSERT INTO checklist (trip_id,${CHECK_FIELDS.join(',')}) VALUES (?,${marks(CHECK_FIELDS)})`).run(tripId, ...pick({ ...row, done: row.done ? 1 : 0 }, CHECK_FIELDS));
}
function insertCity(tripId, row) {
  return db.prepare(`INSERT OR REPLACE INTO cities (trip_id,${CITY_FIELDS.join(',')}) VALUES (?,${marks(CITY_FIELDS)})`).run(tripId, ...pick(row, CITY_FIELDS));
}

if (legacy) {
  const kv = Object.fromEntries(db.prepare('SELECT key, value FROM trip').all().map((r) => [r.key, r.value]));
  db.exec('BEGIN');
  const { lastInsertRowid: tid } = db.prepare('INSERT INTO trips (name, subtitle, emoji, start, end, currency, home_currency, rate) VALUES (?,?,?,?,?,?,?,?)')
    .run(kv.name || 'Minha viagem', kv.subtitle || null, '🗾', kv.start, kv.end, 'JPY', 'BRL', Number(kv.brl_rate) || 0.035);
  db.prepare(`INSERT INTO cities (trip_id,${CITY_FIELDS.join(',')}) SELECT ?,${CITY_FIELDS.join(',')} FROM cities_old`).run(tid);
  const sf = STAY_FIELDS.filter((f) => cols('stays_old').includes(f));
  db.prepare(`INSERT INTO stays (trip_id,${sf.join(',')}) SELECT ?,${sf.join(',')} FROM stays_old`).run(tid);
  const oldAct = cols('activities_old');
  const af = ACT_FIELDS.filter((f) => oldAct.includes(f === 'cost' ? 'cost_jpy' : f));
  db.prepare(`INSERT INTO activities (trip_id,${af.join(',')}) SELECT ?,${af.map((f) => (f === 'cost' ? 'cost_jpy' : f)).join(',')} FROM activities_old`).run(tid);
  db.exec('DROP TABLE cities_old; DROP TABLE stays_old; DROP TABLE activities_old; DROP TABLE trip; COMMIT');
}

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

function createTrip(t) {
  const r = db.prepare(`INSERT INTO trips (${TRIP_FIELDS.join(',')}) VALUES (${marks(TRIP_FIELDS)})`).run(...pick({ rate: 1, emoji: '🧳', ...t }, TRIP_FIELDS));
  return Number(r.lastInsertRowid);
}

// cria uma viagem completa a partir de { trip, cities, stays, activities } (exemplo ou backup)
function createTripFull(b) {
  db.exec('BEGIN');
  try {
    const id = createTrip(b.trip);
    const cities = b.cities || [];
    if (!cities.some((c) => c.key === 'transito')) cities.push(TRANSIT_CITY);
    cities.forEach((c) => insertCity(id, c));
    (b.stays || []).forEach((s) => insertStay(id, s));
    (b.checklist || []).forEach((c, i) => insertCheck(id, { sort: i, ...c }));
    const byDay = new Map();
    (b.activities || []).forEach((x) => {
      const row = { ...x, cost: x.cost ?? x.cost_jpy ?? null };
      if (!byDay.has(row.day)) byDay.set(row.day, []);
      byDay.get(row.day).push(row);
    });
    for (const [, list] of [...byDay.entries()].sort()) {
      // backup já traz a ordem (sort); exemplos vêm sem `sort` e são ordenados por horário
      const ordered = list.every((x) => typeof x.sort === 'number') ? list.sort((x, y) => x.sort - y.sort) : sortTimedSlots(list);
      ordered.forEach((x, i) => insertActivity(id, { ...x, sort: i, done: x.done ? 1 : 0 }));
    }
    db.exec('COMMIT');
    return id;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function getTrip(id) {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
  if (!trip) return null;
  return {
    trip,
    cities: db.prepare('SELECT * FROM cities WHERE trip_id = ? ORDER BY id').all(id),
    stays: db.prepare('SELECT * FROM stays WHERE trip_id = ? ORDER BY check_in, id').all(id),
    activities: db.prepare('SELECT * FROM activities WHERE trip_id = ? ORDER BY day, sort, id').all(id),
    checklist: db.prepare('SELECT * FROM checklist WHERE trip_id = ? ORDER BY sort, id').all(id),
  };
}

const app = express();
app.use(express.json({ limit: '5mb' }));

// resolve :id → viagem existente (404 se não houver)
app.param('id', (req, res, next, v) => {
  req.tripId = Number(v);
  next();
});
const needTrip = (req, res, next) => (db.prepare('SELECT 1 FROM trips WHERE id = ?').get(req.tripId) ? next() : res.status(404).json({ error: 'viagem não encontrada' }));

// ── viagens
app.get('/api/trips', (_req, res) => {
  res.json(db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM activities a WHERE a.trip_id = t.id) AS activity_count,
      (SELECT COUNT(*) FROM activities a WHERE a.trip_id = t.id AND a.done = 1) AS done_count
    FROM trips t ORDER BY t.start DESC, t.id DESC`).all());
});

app.post('/api/trips', (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.start || !b.end) return res.status(400).json({ error: 'name, start e end são obrigatórios' });
  if (b.end < b.start) return res.status(400).json({ error: 'a data final é anterior à inicial' });
  const id = createTripFull({ trip: b, cities: [], stays: [], activities: [] });
  res.status(201).json(getTrip(id));
});

app.get('/api/examples', (_req, res) => {
  res.json(Object.entries(EXAMPLES).map(([key, m]) => ({ key, ...m.EXAMPLE })));
});

app.post('/api/examples/:key', (req, res) => {
  const m = EXAMPLES[req.params.key];
  if (!m) return res.status(404).json({ error: 'exemplo não encontrado' });
  const id = createTripFull({ trip: m.TRIP, cities: m.CITIES.map((c) => ({ ...c })), stays: m.STAYS, activities: m.ACTIVITIES });
  res.status(201).json(getTrip(id));
});

// importa um backup (formato do /export; aceita também o formato da versão antiga com cost_jpy)
app.post('/api/trips/import', (req, res) => {
  const b = req.body || {};
  if (!Array.isArray(b.activities) || !b.trip?.start || !b.trip?.end) return res.status(400).json({ error: 'JSON inválido (faltam trip e activities)' });
  const t = { currency: 'BRL', home_currency: 'BRL', ...b.trip, rate: b.trip.rate ?? b.trip.brl_rate ?? 1 };
  try {
    res.status(201).json(getTrip(createTripFull({ ...b, trip: t })));
  } catch (e) { res.status(400).json({ error: String(e.message || e) }); }
});

app.get('/api/trips/:id', needTrip, (req, res) => res.json(getTrip(req.tripId)));

app.put('/api/trips/:id', needTrip, (req, res) => {
  const cur = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.tripId);
  const row = { ...cur, ...req.body };
  if (!row.name || !row.start || !row.end || row.end < row.start) return res.status(400).json({ error: 'nome e datas válidas são obrigatórios' });
  db.prepare(`UPDATE trips SET ${TRIP_FIELDS.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`).run(...pick(row, TRIP_FIELDS), req.tripId);
  res.json(db.prepare('SELECT * FROM trips WHERE id = ?').get(req.tripId));
});

app.delete('/api/trips/:id', needTrip, (req, res) => {
  db.prepare('DELETE FROM trips WHERE id = ?').run(req.tripId);
  res.status(204).end();
});

app.post('/api/trips/:id/duplicate', needTrip, (req, res) => {
  const d = getTrip(req.tripId);
  const id = createTripFull({ ...d, trip: { ...d.trip, name: `${d.trip.name} (cópia)` }, activities: d.activities.map((a) => ({ ...a, done: 0 })), checklist: d.checklist.map((c) => ({ ...c, done: 0 })) });
  res.status(201).json(getTrip(id));
});

app.get('/api/trips/:id/export', needTrip, (req, res) => {
  const d = getTrip(req.tripId);
  const file = `${d.trip.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'viagem'}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
  res.json(d);
});

// ── checklist
app.post('/api/trips/:id/checklist', needTrip, (req, res) => {
  const b = req.body || {};
  if (!b.text?.trim()) return res.status(400).json({ error: 'text é obrigatório' });
  const max = db.prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM checklist WHERE trip_id = ?').get(req.tripId).m;
  const r = insertCheck(req.tripId, { ...b, sort: max + 1 });
  res.status(201).json(db.prepare('SELECT * FROM checklist WHERE id = ?').get(r.lastInsertRowid));
});
app.put('/api/checklist/:cid', (req, res) => {
  const cur = db.prepare('SELECT * FROM checklist WHERE id = ?').get(Number(req.params.cid));
  if (!cur) return res.status(404).json({ error: 'não encontrado' });
  const row = { ...cur, ...req.body, done: (req.body.done ?? cur.done) ? 1 : 0 };
  db.prepare(`UPDATE checklist SET ${CHECK_FIELDS.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`).run(...pick(row, CHECK_FIELDS), cur.id);
  res.json(db.prepare('SELECT * FROM checklist WHERE id = ?').get(cur.id));
});
app.delete('/api/checklist/:cid', (req, res) => {
  db.prepare('DELETE FROM checklist WHERE id = ?').run(Number(req.params.cid));
  res.status(204).end();
});

// ── atividades
app.post('/api/trips/:id/activities', needTrip, (req, res) => {
  const b = req.body || {};
  if (!b.day || !b.title) return res.status(400).json({ error: 'day e title são obrigatórios' });
  const max = db.prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM activities WHERE trip_id = ? AND day = ?').get(req.tripId, b.day).m;
  const r = insertActivity(req.tripId, { ...b, sort: b.sort ?? max + 1, done: b.done ? 1 : 0, kind: b.kind || 'sight' });
  res.status(201).json(db.prepare('SELECT * FROM activities WHERE id = ?').get(r.lastInsertRowid));
});

app.put('/api/activities/:id', (req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'não encontrada' });
  const row = { ...cur, ...req.body, done: (req.body.done ?? cur.done) ? 1 : 0 };
  if (row.day !== cur.day && !('sort' in req.body)) {
    row.sort = db.prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM activities WHERE trip_id = ? AND day = ?').get(cur.trip_id, row.day).m + 1;
  }
  db.prepare(`UPDATE activities SET ${ACT_FIELDS.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`).run(...pick(row, ACT_FIELDS), id);
  res.json(db.prepare('SELECT * FROM activities WHERE id = ?').get(id));
});

app.delete('/api/activities/:id', (req, res) => {
  db.prepare('DELETE FROM activities WHERE id = ?').run(Number(req.params.id));
  res.status(204).end();
});

// reordena um dia: body = { day, ids: [..] }
app.put('/api/trips/:id/days/reorder', needTrip, (req, res) => {
  const { day, ids } = req.body || {};
  if (!day || !Array.isArray(ids)) return res.status(400).json({ error: 'day e ids são obrigatórios' });
  const upd = db.prepare('UPDATE activities SET sort = ? WHERE id = ? AND day = ? AND trip_id = ?');
  ids.forEach((id, i) => upd.run(i, Number(id), day, req.tripId));
  res.json(db.prepare('SELECT * FROM activities WHERE trip_id = ? AND day = ? ORDER BY sort, id').all(req.tripId, day));
});

// ── hospedagens
app.post('/api/trips/:id/stays', needTrip, (req, res) => {
  const r = insertStay(req.tripId, req.body || {});
  res.status(201).json(db.prepare('SELECT * FROM stays WHERE id = ?').get(r.lastInsertRowid));
});

app.put('/api/stays/:id', (req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM stays WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'não encontrada' });
  const row = { ...cur, ...req.body };
  db.prepare(`UPDATE stays SET ${STAY_FIELDS.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`).run(...pick(row, STAY_FIELDS), id);
  res.json(db.prepare('SELECT * FROM stays WHERE id = ?').get(id));
});

app.delete('/api/stays/:id', (req, res) => {
  db.prepare('DELETE FROM stays WHERE id = ?').run(Number(req.params.id));
  res.status(204).end();
});

// ── cidades / locais da viagem
app.post('/api/trips/:id/cities', needTrip, (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'name é obrigatório' });
  const used = new Set(db.prepare('SELECT key FROM cities WHERE trip_id = ?').all(req.tripId).map((c) => c.key));
  const base = b.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'local';
  let key = base;
  for (let i = 2; used.has(key); i++) key = `${base}-${i}`;
  insertCity(req.tripId, { color: '#2874a6', emoji: '📍', ...b, key });
  res.status(201).json(db.prepare('SELECT * FROM cities WHERE trip_id = ? AND key = ?').get(req.tripId, key));
});

app.put('/api/cities/:id', (req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM cities WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'não encontrada' });
  const row = { ...cur, ...req.body, key: cur.key }; // a chave é o vínculo com as atividades, não muda
  db.prepare(`UPDATE cities SET ${CITY_FIELDS.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`).run(...pick(row, CITY_FIELDS), id);
  res.json(db.prepare('SELECT * FROM cities WHERE id = ?').get(id));
});

app.delete('/api/cities/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM cities WHERE id = ?').get(Number(req.params.id));
  if (cur) {
    db.prepare('UPDATE activities SET city = NULL WHERE trip_id = ? AND city = ?').run(cur.trip_id, cur.key);
    db.prepare('UPDATE stays SET city = NULL WHERE trip_id = ? AND city = ?').run(cur.trip_id, cur.key);
    db.prepare('DELETE FROM cities WHERE id = ?').run(cur.id);
  }
  res.status(204).end();
});

// ── front-end estático (build do Vite)
const DIST = path.join(ROOT, 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else {
  app.get('/', (_req, res) => res.send('Front-end não compilado. Rode: npm run build (ou npm run dev:web).'));
}

app.listen(PORT, () => console.log(`Trip Planner rodando em http://localhost:${PORT}`));
