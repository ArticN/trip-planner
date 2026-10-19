// Service worker: deixa o app abrir sem internet com a última versão vista dos dados e do mapa.
// - páginas e API (GET): tenta a rede; sem rede, usa a cópia salva
// - arquivos do app (JS/CSS com hash) e fontes: cópia salva primeiro
// - anexos (ingressos, passagens): cópia salva primeiro; o app baixa todos ao abrir a viagem
// - tiles do mapa: cópia salva primeiro, atualizando em segundo plano; guarda só os que você já viu
const V = 'v1';
const APP = `app-${V}`;
const API = `api-${V}`;
const TILES = `tiles-${V}`;
const FILES = 'files-v1';
const MAX_TILES = 3000;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(APP).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icon.svg'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => ![APP, API, TILES, FILES].includes(k)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const isTile = (url) => /tile\.openstreetmap\.org|tiles\.openfreemap\.org|opentopomap\.org|arcgisonline\.com/.test(url.hostname);
const isFont = (url) => /fonts\.(googleapis|gstatic)\.com/.test(url.hostname);

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreVary: true });
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

let trimming = false;
async function trimTiles() {
  if (trimming) return;
  trimming = true;
  try {
    const cache = await caches.open(TILES);
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);
  } finally { trimming = false; }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const update = fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') { cache.put(req, res.clone()); trimTiles(); }
    return res;
  });
  if (hit) { update.catch(() => {}); return hit; }
  return update;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // edições vão sempre direto para o servidor
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (url.pathname === '/api/session') return; // login nunca vem do cache
    if (url.pathname.startsWith('/api/files/')) { e.respondWith(cacheFirst(req, FILES)); return; }
    if (url.pathname.startsWith('/api/')) { e.respondWith(networkFirst(req, API)); return; }
    if (req.mode === 'navigate') { e.respondWith(networkFirst(req, APP).catch(() => caches.match('/'))); return; }
    if (url.pathname.startsWith('/assets/')) { e.respondWith(cacheFirst(req, APP)); return; }
    e.respondWith(networkFirst(req, APP));
    return;
  }
  if (isTile(url)) { e.respondWith(staleWhileRevalidate(req, TILES)); return; }
  if (isFont(url)) e.respondWith(cacheFirst(req, APP));
});

// ao sair da conta, apaga os dados guardados
self.addEventListener('message', (e) => {
  if (e.data === 'clear-data') { caches.delete(API); caches.delete(FILES); }
});
