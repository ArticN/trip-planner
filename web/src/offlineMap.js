// "Baixar mapa offline": guarda no aparelho os tiles vetoriais do OpenFreeMap em volta das cidades da viagem,
// mais estilo, ícones e fontes, num cache que o service worker consulta antes da rede (web/public/sw.js)
export const OFFLINE_CACHE = 'maps-offline';
const HOST = 'https://tiles.openfreemap.org';
const STYLES = [`${HOST}/styles/positron`, `${HOST}/styles/dark`];
const AVG_KB = 45; // tamanho médio de um tile vetorial urbano
const tileKey = (url) => url.replace(/(tiles\.openfreemap\.org\/planet\/)[^/]+(\/\d+\/\d+\/\d+\.pbf)/, '$1_$2');

const lon2x = (lng, z) => Math.floor(((lng + 180) / 360) * 2 ** z);
const lat2y = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};
function tilesIn(box, z) {
  const out = [];
  const x0 = lon2x(box.w, z); const x1 = lon2x(box.e, z);
  const y0 = lat2y(box.n, z); const y1 = lat2y(box.s, z);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push(`${z}/${x}/${y}`);
  return out;
}
const around = (p, km) => {
  const dLat = km / 111;
  const dLng = km / (111 * Math.cos((p.lat * Math.PI) / 180));
  return { n: p.lat + dLat, s: p.lat - dLat, w: p.lng - dLng, e: p.lng + dLng };
};

// lista de tiles: detalhe (z10–14) num raio em volta de cada cidade; visão geral (z5–9) da região toda
export function planTiles(cities, km) {
  const set = new Set();
  const pts = cities.filter((c) => c.lat != null && c.lng != null);
  pts.forEach((c) => { for (let z = 10; z <= 14; z++) tilesIn(around(c, km), z).forEach((t) => set.add(t)); });
  if (pts.length) {
    const box = { n: Math.max(...pts.map((p) => p.lat)) + 0.5, s: Math.min(...pts.map((p) => p.lat)) - 0.5, w: Math.min(...pts.map((p) => p.lng)) - 0.5, e: Math.max(...pts.map((p) => p.lng)) + 0.5 };
    for (let z = 5; z <= 9; z++) tilesIn(box, z).forEach((t) => set.add(t));
  }
  return [...set];
}
export const estimateMB = (n) => Math.round((n * AVG_KB) / 1024);

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r;
}

export async function downloadMaps(cities, km, onProgress, signal) {
  const cache = await caches.open(OFFLINE_CACHE);
  const put = async (url, res) => cache.put(tileKey(url), res);
  // estilos (claro e escuro), ícones e fontes
  const extra = [];
  const fonts = new Set();
  let template = null;
  for (const s of STYLES) {
    const res = await getJson(s);
    const style = await res.clone().json();
    await put(s, res);
    if (style.sprite) for (const suf of ['.json', '.png', '@2x.json', '@2x.png']) extra.push(`${style.sprite}${suf}`);
    (style.layers || []).forEach((l) => { const f = l.layout?.['text-font']; if (Array.isArray(f) && f.every((x) => typeof x === 'string')) fonts.add(f.join(',')); });
    for (const src of Object.values(style.sources || {})) {
      if (src.type === 'vector' && src.url) {
        const tj = await getJson(src.url);
        const j = await tj.clone().json();
        await put(src.url, tj);
        template = j.tiles?.[0] || template;
      }
    }
    if (style.glyphs) fonts.forEach((f) => ['0-255', '256-511', '8192-8447'].forEach((r) => extra.push(style.glyphs.replace('{fontstack}', encodeURIComponent(f)).replace('{range}', r))));
  }
  if (!template) throw new Error('não achei o endereço dos tiles');
  const urls = [...new Set(extra), ...planTiles(cities, km).map((t) => { const [z, x, y] = t.split('/'); return template.replace('{z}', z).replace('{x}', x).replace('{y}', y); })];
  let done = 0; let bytes = 0; let failed = 0;
  let i = 0;
  const worker = async () => {
    while (i < urls.length) {
      if (signal?.aborted) return;
      const url = urls[i++];
      try {
        const res = await fetch(url, { signal });
        if (res.ok) { const b = await res.clone().arrayBuffer(); bytes += b.byteLength; await put(url, res); } else if (res.status !== 404) failed++;
      } catch (e) { if (signal?.aborted) return; failed++; }
      done++;
      onProgress?.({ done, total: urls.length, bytes, failed });
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  localStorage.setItem('maps-offline-info', JSON.stringify({ at: new Date().toISOString(), cities: cities.map((c) => c.name), km, bytes }));
  return { done, total: urls.length, bytes, failed };
}

export async function offlineInfo() {
  try {
    const keys = await (await caches.open(OFFLINE_CACHE)).keys();
    const info = JSON.parse(localStorage.getItem('maps-offline-info') || 'null');
    return keys.length ? { tiles: keys.length, ...info } : null;
  } catch { return null; }
}
export async function clearMaps() {
  await caches.delete(OFFLINE_CACHE);
  localStorage.removeItem('maps-offline-info');
}
