// Service worker: deixa o app abrir sem internet com a última versão vista dos dados e do mapa.
// - páginas e API (GET): tenta a rede; sem rede, usa a cópia salva
// - arquivos do app (JS/CSS com hash) e fontes: cópia salva primeiro
// - anexos (ingressos, passagens) e fotos do diário: cópia salva primeiro; o app baixa os anexos ao abrir a viagem
//   e as miniaturas das fotos ao abrir o diário
// - tiles do mapa: cópia salva primeiro, atualizando em segundo plano; guarda só os que você já viu
const V = 'v1';
const BUILD = 'dev'; // trocado no build pela marca da versão (vite.config.js): cada versão nova reinstala o service worker
const APP = `app-${V}`;
const API = `api-${V}`;
const TILES = `tiles-${V}`;
const FILES = 'files-v1';
const OFFLINE = 'maps-offline'; // mapas baixados de propósito ("Baixar mapa offline"): nunca são apagados sozinhos
const MAX_TILES = 3000;

// arquivos do app que precisam estar no aparelho mesmo sem nunca terem sido abertos (mapa, telas carregadas
// sob demanda): a lista vem do build (precache.json); o que falhar é guardado depois, quando for usado
async function precache() {
  const c = await caches.open(APP);
  await c.addAll(['/', '/manifest.webmanifest', '/icon.svg']);
  let list = [];
  try { list = await (await fetch('/precache.json', { cache: 'no-store' })).json(); } catch { return []; }
  await Promise.all(list.map(async (u) => { if (!(await c.match(u))) await c.add(u).catch(() => {}); }));
  return list;
}

self.addEventListener('install', (e) => {
  e.waitUntil(precache().catch(() => {}).then(() => self.skipWaiting()));
});

// cada versão nova do app troca os nomes dos arquivos (hash): apaga os das versões anteriores para o
// espaço usado não crescer a cada atualização (o navegador pode apagar TUDO, até os mapas baixados,
// quando o aparelho fica sem espaço). assets.json lista todos os arquivos desta versão, inclusive os
// contornos de estados. Sem internet não apaga nada.
async function pruneOldAssets() {
  let list;
  try { list = await (await fetch('/assets.json', { cache: 'no-store' })).json(); } catch { return; }
  if (!Array.isArray(list) || !list.length) return;
  const keep = new Set(list);
  const c = await caches.open(APP);
  const old = (await c.keys()).filter((req) => { const p = new URL(req.url).pathname; return p.startsWith('/assets/') && !keep.has(p); });
  await Promise.all(old.map((req) => c.delete(req)));
}

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => ![APP, API, TILES, FILES, OFFLINE].includes(k)).map((k) => caches.delete(k))))
    .then(() => pruneOldAssets().catch(() => {}))
    .then(() => self.clients.claim()));
});

const isTile = (url) => /tile\.openstreetmap\.org|tiles\.openfreemap\.org|opentopomap\.org|arcgisonline\.com/.test(url.hostname);
const isFont = (url) => /fonts\.(googleapis|gstatic)\.com/.test(url.hostname);

// com cópia guardada, internet lenta não trava a tela: depois de `wait` ms usa a cópia (a resposta da rede
// ainda atualiza a cópia quando chegar)
async function networkFirst(req, cacheName, wait = 0) {
  const cache = await caches.open(cacheName);
  try {
    const net = fetch(req);
    const hit0 = wait ? await cache.match(req, { ignoreVary: true }) : null;
    if (hit0) {
      net.then((r) => { if (r.ok) cache.put(req, r.clone()); }).catch(() => {});
      const res = await Promise.race([net.then((r) => r.clone()), new Promise((r) => setTimeout(() => r(null), wait))]);
      return res || hit0;
    }
    const res = await net;
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

// o OpenFreeMap troca a versão dos tiles toda semana (/planet/<versão>/z/x/y.pbf);
// a chave sem a versão faz um tile baixado continuar valendo depois da troca
const tileKey = (url) => url.replace(/(tiles\.openfreemap\.org\/planet\/)[^/]+(\/\d+\/\d+\/\d+\.pbf)/, '$1_$2');

async function tile(req) {
  const key = tileKey(req.url);
  const off = await (await caches.open(OFFLINE)).match(key);
  if (off) return off;
  return staleWhileRevalidate(req, TILES, key);
}

async function staleWhileRevalidate(req, cacheName, key = req) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(key);
  const update = fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') { cache.put(key, res.clone()); trimTiles(); }
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
    if (url.pathname === '/api/session' || url.pathname === '/api/setup') return; // login e diagnóstico nunca vêm do cache
    if (req.headers.get('X-TP-Live')) return; // viagens: a cópia offline fica no IndexedDB do app (offline/sync.js)
    if (url.pathname.startsWith('/api/files/') || /^\/api\/(share\/[\w-]+\/)?photos\//.test(url.pathname)) { e.respondWith(cacheFirst(req, FILES)); return; }
    if (url.pathname.startsWith('/api/')) { e.respondWith(networkFirst(req, API, 6000)); return; }
    if (req.mode === 'navigate') { e.respondWith(networkFirst(req, APP, 4000).catch(() => caches.match('/'))); return; }
    if (url.pathname.startsWith('/assets/')) { e.respondWith(cacheFirst(req, APP)); return; }
    e.respondWith(networkFirst(req, APP));
    return;
  }
  if (isTile(url)) { e.respondWith(tile(req)); return; }
  if (isFont(url)) e.respondWith(cacheFirst(req, APP));
});

// apaga os dados guardados (só quando o app pede de propósito; as edições pendentes ficam no IndexedDB, não aqui)
self.addEventListener('message', (e) => {
  if (e.data === 'clear-data') { caches.delete(API); caches.delete(FILES); }
});
