// API: senha, edição repetida (X-Op-Id), validação e o que o link de visitante mostra. Banco num arquivo temporário.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tp-test-'));
process.env.DB_PATH = path.join(dir, 'test.db');
process.env.APP_PASSWORD = 'senha-de-teste';
delete process.env.TURSO_DATABASE_URL;
delete process.env.VERCEL;

let server;
let base;
let cookie = '';
const call = async (method, url, body, headers = {}) => {
  const res = await fetch(base + url, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* texto */ }
  return { status: res.status, json, headers: res.headers };
};

let tripId;
before(async () => {
  const { app, ready } = await import('../server/app.js');
  await ready;
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server?.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test('sem login a API recusa; senha errada recusa; senha certa entra', async () => {
  assert.equal((await call('GET', '/api/trips')).status, 401);
  assert.equal((await call('POST', '/api/login', { password: 'errada' })).status, 401);
  const res = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'senha-de-teste' }) });
  assert.equal(res.status, 200);
  const set = res.headers.get('set-cookie');
  assert.match(set, /HttpOnly/);
  assert.match(set, /SameSite=Lax/);
  cookie = set.split(';')[0];
  assert.equal((await call('GET', '/api/trips')).status, 200);
  const t = await call('POST', '/api/trips', { name: 'Viagem teste', start: '2026-11-06', end: '2026-11-20' });
  assert.ok(t.status < 300);
  tripId = t.json.trip?.id ?? t.json.id;
  assert.ok(tripId);
});

test('mesma edição enviada duas vezes (X-Op-Id) é salva uma vez só', async () => {
  const op = 'op-teste-0001';
  const a = await call('POST', `/api/trips/${tripId}/activities`, { day: '2026-11-07', title: 'Ramen' }, { 'X-Op-Id': op });
  const b = await call('POST', `/api/trips/${tripId}/activities`, { day: '2026-11-07', title: 'Ramen' }, { 'X-Op-Id': op });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  assert.equal(b.headers.get('x-op-replay'), '1');
  assert.equal(b.json.id, a.json.id);
  const d = await call('GET', `/api/trips/${tripId}`);
  assert.equal(d.json.activities.filter((x) => x.title === 'Ramen').length, 1);
  // exclusão (204) também é lembrada
  const del1 = await call('DELETE', `/api/activities/${a.json.id}`, null, { 'X-Op-Id': 'op-teste-0002' });
  const del2 = await call('DELETE', `/api/activities/${a.json.id}`, null, { 'X-Op-Id': 'op-teste-0002' });
  assert.equal(del1.status, 204);
  assert.equal(del2.status, 204);
});

test('edição recusada não fica marcada como feita (pode ser corrigida e reenviada)', async () => {
  const op = 'op-teste-0003';
  assert.equal((await call('POST', `/api/trips/${tripId}/activities`, { day: '2026-11-07' }, { 'X-Op-Id': op })).status, 400);
  assert.equal((await call('POST', `/api/trips/${tripId}/activities`, { day: '2026-11-07', title: 'Ok' }, { 'X-Op-Id': op })).status, 201);
});

test('validação: datas, números e coordenadas', async () => {
  const bad = [
    { day: 'amanhã', title: 'x' },
    { day: '2026-11-07', title: 'x', cost: 'muito' },
    { day: '2026-11-07', title: 'x', lat: 200, lng: 10 },
    { day: '2026-11-07', title: 'x'.repeat(100001) },
  ];
  for (const b of bad) assert.equal((await call('POST', `/api/trips/${tripId}/activities`, b)).status, 400, JSON.stringify(b).slice(0, 60));
  const ok = await call('POST', `/api/trips/${tripId}/activities`, { day: '2026-11-07', title: 'Templo', cost: '1200', lat: 35.0, lng: 135.7, start: '', notes: null });
  assert.equal(ok.status, 201);
  assert.equal((await call('PUT', `/api/trips/${tripId}`, { start: '06/11/2026' })).status, 400);
  assert.equal((await call('POST', `/api/trips/${tripId}/purchases`, { title: 'Tênis', price: '' })).status, 201);
});

test('link de visitante só com roteiro: sem notas, links, custos, checklist nem tokens', async () => {
  await call('POST', `/api/trips/${tripId}/activities`, { day: '2026-11-08', title: 'Museu', notes: 'código da reserva ABC123', links: JSON.stringify([{ url: 'https://exemplo.com' }]), cost: 50 });
  await call('POST', `/api/trips/${tripId}/checklist`, { text: 'Passaporte' });
  const link = await call('POST', `/api/trips/${tripId}/shares`, { name: 'Família', plan: 1, money: 0, diary: 0 });
  assert.ok(link.status < 300);
  const saved = cookie;
  cookie = ''; // visitante não tem login
  const v = await call('GET', `/api/share/${link.json.token}`);
  cookie = saved;
  assert.equal(v.status, 200);
  const museu = v.json.activities.find((a) => a.title === 'Museu');
  assert.ok(museu);
  assert.equal(museu.notes, undefined);
  assert.equal(museu.links, undefined);
  assert.equal(museu.cost, undefined);
  assert.equal(v.json.checklist, undefined);
  assert.equal(v.json.trip.share_token, undefined);
  assert.equal(v.json.notes, undefined);
  assert.doesNotMatch(JSON.stringify(v.json), /ABC123/);
  // token curto ou errado não abre nada
  assert.equal((await call('GET', '/api/share/curto')).status, 404);
});

test('backup exportado não leva os tokens secretos', async () => {
  await call('POST', `/api/trips/${tripId}/calendar`);
  const e = await call('GET', `/api/trips/${tripId}/export`);
  assert.equal(e.status, 200);
  assert.equal(e.json.trip.cal_token, undefined);
  assert.equal(e.json.trip.share_token, undefined);
  assert.equal(e.json.shares, undefined);
});

test('link curto do Google: só segue endereços do Google', async () => {
  assert.equal((await call('GET', '/api/geo/expand?url=' + encodeURIComponent('https://example.com/x'))).status, 400);
  assert.equal((await call('GET', '/api/geo/expand?url=' + encodeURIComponent('http://maps.app.goo.gl/x'))).status, 400);
  const { isGoogleMapsUrl } = await import('../server/app.js');
  assert.ok(isGoogleMapsUrl('https://maps.app.goo.gl/AbC'));
  assert.ok(isGoogleMapsUrl('https://www.google.com/maps/place/x'));
  assert.ok(isGoogleMapsUrl('https://www.google.co.jp/maps/@1,2'));
  assert.ok(!isGoogleMapsUrl('https://google.com.evil.io/maps'));
  assert.ok(!isGoogleMapsUrl('https://127.0.0.1/'));
});

test('arquivos da página de ingressos: soltos ou de um item da checklist, privados no link de visitante', async () => {
  const up = (url, name, extra = {}) => fetch(base + url, { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent(name), 'X-File-Type': 'application/pdf', ...extra }, body: Buffer.from('%PDF-1.4 QR123') });
  const c = await call('POST', `/api/trips/${tripId}/checklist`, { text: '25/11 Kaiyukan ingresso', grp: 'Reservas e ingressos' });
  const solto = await up(`/api/trips/${tripId}/files`, 'solto.pdf');
  assert.equal(solto.status, 201);
  const ligado = await (await up(`/api/trips/${tripId}/files`, 'kaiyukan.pdf', { 'X-Check-Id': String(c.json.id) })).json();
  assert.equal(ligado.check_id, c.json.id);
  assert.equal((await up(`/api/trips/${tripId}/files`, 'x.pdf', { 'X-Check-Id': '999999' })).status, 404);
  const d = await call('GET', `/api/trips/${tripId}`);
  assert.ok(d.json.files.some((f) => f.name === 'kaiyukan.pdf' && f.check_id === c.json.id));
  assert.equal(d.json.files[0].data, undefined); // a lista não traz o conteúdo

  // visitante (link com tudo liberado) não vê nem baixa os anexos
  const link = await call('POST', `/api/trips/${tripId}/shares`, { name: 'Tudo', plan: 1, money: 1, diary: 1 });
  const saved = cookie;
  cookie = '';
  const v = await call('GET', `/api/share/${link.json.token}`);
  const raw = await call('GET', `/api/files/${ligado.id}`);
  cookie = saved;
  assert.equal(v.json.files, undefined);
  assert.doesNotMatch(JSON.stringify(v.json), /kaiyukan\.pdf/);
  assert.equal(raw.status, 401);

  // apagar o item da checklist deixa o arquivo solto, não apaga
  await call('DELETE', `/api/checklist/${c.json.id}`);
  const d2 = await call('GET', `/api/trips/${tripId}`);
  assert.equal(d2.json.files.find((f) => f.id === ligado.id).check_id, null);
});
