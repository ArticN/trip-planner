import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRIP, CITIES, STAYS, ACTIVITIES } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.DB_PATH || path.join(ROOT, 'data', 'planner.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS trip (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS cities (
    key TEXT PRIMARY KEY, name TEXT, emoji TEXT, color TEXT, lat REAL, lng REAL
  );
  CREATE TABLE IF NOT EXISTS stays (
    id INTEGER PRIMARY KEY AUTOINCREMENT, city TEXT, name TEXT, address TEXT,
    check_in TEXT, check_out TEXT, lat REAL, lng REAL, notes TEXT
  );
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL, end_day TEXT, start TEXT, end TEXT,
    city TEXT, title TEXT NOT NULL, kind TEXT DEFAULT 'sight',
    location TEXT, details TEXT, transport TEXT, cost_jpy REAL,
    lat REAL, lng REAL, sort INTEGER DEFAULT 0, done INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_act_day ON activities(day, sort);
`);

const ACT_FIELDS = ['day', 'end_day', 'start', 'end', 'city', 'title', 'kind', 'location', 'details', 'transport', 'cost_jpy', 'lat', 'lng', 'sort', 'done'];
const STAY_FIELDS = ['city', 'name', 'address', 'check_in', 'check_out', 'lat', 'lng', 'notes'];

const clean = (v) => (v === '' || v === undefined ? null : v);

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

function seed() {
  const ins = db.prepare('INSERT OR REPLACE INTO trip (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(TRIP)) ins.run(k, String(v));

  db.exec('DELETE FROM cities; DELETE FROM stays; DELETE FROM activities;');
  const insCity = db.prepare('INSERT INTO cities (key,name,emoji,color,lat,lng) VALUES (?,?,?,?,?,?)');
  CITIES.forEach((c) => insCity.run(c.key, c.name, c.emoji, c.color, c.lat, c.lng));

  const insStay = db.prepare(`INSERT INTO stays (${STAY_FIELDS.join(',')}) VALUES (${STAY_FIELDS.map(() => '?').join(',')})`);
  STAYS.forEach((s) => insStay.run(...STAY_FIELDS.map((f) => clean(s[f]) ?? null)));

  const byDay = new Map();
  ACTIVITIES.forEach((x) => {
    if (!byDay.has(x.day)) byDay.set(x.day, []);
    byDay.get(x.day).push(x);
  });
  const insAct = db.prepare(`INSERT INTO activities (${ACT_FIELDS.join(',')}) VALUES (${ACT_FIELDS.map(() => '?').join(',')})`);
  for (const [, list] of [...byDay.entries()].sort()) {
    sortTimedSlots(list).forEach((x, i) => {
      const row = { ...x, sort: i, done: 0 };
      insAct.run(...ACT_FIELDS.map((f) => clean(row[f]) ?? null));
    });
  }
}

if (db.prepare('SELECT COUNT(*) AS n FROM activities').get().n === 0) seed();

function getTrip() {
  const trip = Object.fromEntries(db.prepare('SELECT key, value FROM trip').all().map((r) => [r.key, r.value]));
  return {
    trip,
    cities: db.prepare('SELECT * FROM cities').all(),
    stays: db.prepare('SELECT * FROM stays ORDER BY check_in').all(),
    activities: db.prepare('SELECT * FROM activities ORDER BY day, sort, id').all(),
  };
}

const pick = (body, fields) => fields.map((f) => (f in body ? clean(body[f]) : null));

const app = express();
app.use(express.json({ limit: '5mb' }));

app.get('/api/trip', (_req, res) => res.json(getTrip()));

app.put('/api/trip', (req, res) => {
  const ins = db.prepare('INSERT OR REPLACE INTO trip (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(req.body || {})) ins.run(k, String(v));
  res.json(getTrip().trip);
});

// ── atividades
app.post('/api/activities', (req, res) => {
  const b = req.body || {};
  if (!b.day || !b.title) return res.status(400).json({ error: 'day e title são obrigatórios' });
  const max = db.prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM activities WHERE day = ?').get(b.day).m;
  const row = { ...b, sort: b.sort ?? max + 1, done: b.done ? 1 : 0, kind: b.kind || 'sight' };
  const r = db.prepare(`INSERT INTO activities (${ACT_FIELDS.join(',')}) VALUES (${ACT_FIELDS.map(() => '?').join(',')})`).run(...pick(row, ACT_FIELDS));
  res.status(201).json(db.prepare('SELECT * FROM activities WHERE id = ?').get(r.lastInsertRowid));
});

app.put('/api/activities/:id', (req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'não encontrada' });
  const row = { ...cur, ...req.body, done: (req.body.done ?? cur.done) ? 1 : 0 };
  if (row.day !== cur.day && !('sort' in req.body)) {
    row.sort = db.prepare('SELECT COALESCE(MAX(sort), -1) AS m FROM activities WHERE day = ?').get(row.day).m + 1;
  }
  db.prepare(`UPDATE activities SET ${ACT_FIELDS.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`).run(...pick(row, ACT_FIELDS), id);
  res.json(db.prepare('SELECT * FROM activities WHERE id = ?').get(id));
});

app.delete('/api/activities/:id', (req, res) => {
  db.prepare('DELETE FROM activities WHERE id = ?').run(Number(req.params.id));
  res.status(204).end();
});

// reordena um dia: body = { day, ids: [..] }
app.put('/api/days/reorder', (req, res) => {
  const { day, ids } = req.body || {};
  if (!day || !Array.isArray(ids)) return res.status(400).json({ error: 'day e ids são obrigatórios' });
  const upd = db.prepare('UPDATE activities SET sort = ? WHERE id = ? AND day = ?');
  ids.forEach((id, i) => upd.run(i, Number(id), day));
  res.json(db.prepare('SELECT * FROM activities WHERE day = ? ORDER BY sort, id').all(day));
});

// ── hospedagens
app.put('/api/stays/:id', (req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM stays WHERE id = ?').get(id);
  if (!cur) return res.status(404).json({ error: 'não encontrada' });
  const row = { ...cur, ...req.body };
  db.prepare(`UPDATE stays SET ${STAY_FIELDS.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`).run(...pick(row, STAY_FIELDS), id);
  res.json(db.prepare('SELECT * FROM stays WHERE id = ?').get(id));
});

// ── exportar / importar / resetar
app.get('/api/export', (_req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="japan-planner-backup.json"');
  res.json(getTrip());
});

app.post('/api/import', (req, res) => {
  const b = req.body || {};
  if (!Array.isArray(b.activities)) return res.status(400).json({ error: 'JSON inválido (sem activities)' });
  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM activities; DELETE FROM stays; DELETE FROM cities;');
    const insAct = db.prepare(`INSERT INTO activities (${ACT_FIELDS.join(',')}) VALUES (${ACT_FIELDS.map(() => '?').join(',')})`);
    b.activities.forEach((x) => insAct.run(...pick(x, ACT_FIELDS)));
    const insStay = db.prepare(`INSERT INTO stays (${STAY_FIELDS.join(',')}) VALUES (${STAY_FIELDS.map(() => '?').join(',')})`);
    (b.stays || []).forEach((x) => insStay.run(...pick(x, STAY_FIELDS)));
    const insCity = db.prepare('INSERT INTO cities (key,name,emoji,color,lat,lng) VALUES (?,?,?,?,?,?)');
    (b.cities || CITIES).forEach((c) => insCity.run(c.key, c.name, c.emoji, c.color, c.lat, c.lng));
    const insTrip = db.prepare('INSERT OR REPLACE INTO trip (key, value) VALUES (?, ?)');
    Object.entries(b.trip || {}).forEach(([k, v]) => insTrip.run(k, String(v)));
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    return res.status(400).json({ error: String(e.message || e) });
  }
  res.json(getTrip());
});

app.post('/api/reset', (_req, res) => { seed(); res.json(getTrip()); });

// ── front-end estático (build do Vite)
const DIST = path.join(ROOT, 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
} else {
  app.get('/', (_req, res) => res.send('Front-end não compilado. Rode: npm run build (ou npm run dev:web).'));
}

app.listen(PORT, () => console.log(`Japan Planner rodando em http://localhost:${PORT}`));
