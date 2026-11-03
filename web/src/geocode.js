// achar a posição de um lugar a partir do que a pessoa colou: coordenadas ("35.6586, 139.7454" ou
// 35°39'31.0"N 139°44'43.4"E), link do Google Maps (longo ou curto) ou endereço/nome (OpenStreetMap Nominatim)
import { OSM_LANG, osmName } from './osmName.js';

const okLat = (v) => Number.isFinite(v) && Math.abs(v) <= 90;
const okLng = (v) => Number.isFinite(v) && Math.abs(v) <= 180;
const round = (v) => +v.toFixed(6);
const pair = (lat, lng) => (okLat(lat) && okLng(lng) && !(lat === 0 && lng === 0) ? { lat: round(lat), lng: round(lng) } : null);

// um grau em DMS (35°39'31.0"N) ou decimal com hemisfério (35.6586° N)
const DMS = /(\d{1,3}(?:[.,]\d+)?)\s*[°º]\s*(?:(\d{1,2}(?:[.,]\d+)?)\s*['′’]\s*)?(?:(\d{1,2}(?:[.,]\d+)?)\s*(?:["″”]|''|′′)\s*)?([NSLOEW])/gi;
const dec = (s) => parseFloat(String(s || '0').replace(',', '.'));

// texto que é só coordenada → { lat, lng }; qualquer outra coisa → null
export function parseCoords(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  const m = t.match(/^\(?\s*(-?\d{1,2}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)\s*\)?$/)
    || t.match(/^(-?\d{1,2},\d+)\s*[;\s]\s*(-?\d{1,3},\d+)$/); // vírgula decimal: "-23,5505; -46,6333"
  if (m) return pair(dec(m[1]), dec(m[2]));
  const parts = [...t.matchAll(DMS)];
  if (parts.length === 2 && t.replace(DMS, '').replace(/[\s,;]/g, '') === '') {
    let lat = null;
    let lng = null;
    for (const [, d, mi, s, h] of parts) {
      const v = dec(d) + dec(mi) / 60 + dec(s) / 3600;
      const H = h.toUpperCase();
      if (H === 'N' || H === 'S') lat = H === 'S' ? -v : v;
      else lng = H === 'W' || H === 'O' ? -v : v;
    }
    return lat == null || lng == null ? null : pair(lat, lng);
  }
  return null;
}

const SHORT = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//i;
const GOOGLE = /^https?:\/\/([a-z0-9-]+\.)*google\.[a-z.]+\/(maps|search|url)|^https?:\/\/maps\.google\.[a-z.]+\//i;
export const isShortMapsLink = (s) => SHORT.test(String(s || '').trim());

// link do Google Maps → { lat, lng, name } (o que der para tirar dele), { short: true } para link curto,
// ou null se não for link do Google
export function parseMapsLink(text) {
  const raw = String(text || '').trim().match(/https?:\/\/\S+/)?.[0];
  if (!raw) return null;
  if (isShortMapsLink(raw)) return { short: true, url: raw };
  if (!GOOGLE.test(raw)) return null;
  let url;
  try { url = new URL(raw); } catch { return null; }
  // página de consentimento (Europa) guarda o link de verdade em ?continue=
  if (/consent\./.test(url.hostname) && url.searchParams.get('continue')) return parseMapsLink(url.searchParams.get('continue'));
  const full = decodeURIComponent(url.pathname + url.search + url.hash);
  const name = (() => {
    const p = url.pathname.match(/\/place\/([^/]+)/);
    if (p) return decodeURIComponent(p[1].replace(/\+/g, ' ')).trim();
    const q = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('destination') || '';
    return parseCoords(q) ? '' : q.replace(/\+/g, ' ').trim();
  })();
  // o pino do lugar (!3d…!4d…) é mais exato que o centro da tela (@lat,lng,zoom)
  const pin = [...full.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)].pop();
  let pos = pin && pair(+pin[1], +pin[2]);
  for (const key of ['q', 'query', 'll', 'destination', 'center', 'daddr', 'sll']) {
    if (pos) break;
    pos = parseCoords(url.searchParams.get(key));
  }
  if (!pos) {
    const at = full.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    pos = at && pair(+at[1], +at[2]);
  }
  if (!pos && !name) return null;
  return { ...(pos || {}), name };
}

// versões mais curtas de um endereço para tentar quando o completo não é achado. O OpenStreetMap
// quase nunca tem o número do prédio no Japão, e o Google mistura CEP, "1 Chome−17−5" e o nome do
// prédio em japonês; então tira esses pedaços e fica com bairro, distrito e cidade.
const POSTAL = /〒\s*[0-9０-９]{3}\s*[-−‐ー－]\s*[0-9０-９]{4}|\b\d{3}[-−]\d{4}\b|\b\d{5}-\d{3}\b/g;
const HOUSE = /ch[oō]me|丁目|番地|^[\s\d０-９\-−‐ー－#nº°.]+$|^\s*[\d０-９]+[\s\-−‐ー－]*[\d０-９]|[\d０-９]+\s*[\-−‐ー－]\s*[\d０-９]+\s*[\-−‐ー－]\s*[\d０-９]+/i;
export function simplerQueries(q) {
  const out = [];
  const add = (x) => {
    x = x.replace(/\s{2,}/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '');
    if (x && x.length > 2 && !out.includes(x) && x !== q.trim()) out.push(x);
  };
  const clean = q.replace(POSTAL, ' ');
  // endereço escrito em japonês, sem vírgulas: 東京都目黒区青葉台1丁目17−5 → 東京都 目黒区 青葉台
  if (!clean.includes(',') && /[぀-ヿ一-鿿]/.test(clean)) {
    add(clean.replace(/[0-9０-９一二三四五六七八九十]+\s*(丁目|番地?|号|[-−ー－‐][0-9０-９]).*$/, '').replace(/([都道府県市区町村])(?=[^\s])/g, '$1 '));
  }
  let parts = clean.split(',').map((x) => x.trim()).filter(Boolean);
  // números da rua, quadra e prédio saem: o que sobra é bairro, distrito, cidade, país
  const area = parts.map((x) => {
    if (!HOUSE.test(x)) return x;
    // "2 Chome-21-1 Asakusa" → "Asakusa"; "1 Chome−17−5 メゾン青葉 １０１" → nada
    const rest = x.replace(/^\s*[\d０-９]+\s*ch[oō]me[\s\-−‐]*[\d０-９\-−‐]*/i, '').replace(/^[\s\d０-９\-−‐ー－#.]+/, '')
      .replace(/\S*[぀-ヿ一-鿿]\S*/g, '').replace(/[\s\d０-９]+$/, '').trim();
    return /[a-zà-ú]{3}/i.test(rest) && !HOUSE.test(rest) ? rest : '';
  }).filter(Boolean);
  if (area.length >= 2) add(area.join(', '));
  // ainda nada: tira o pedaço mais específico (o primeiro, ou o último quando o país vem antes)
  const countryFirst = /^(jap[aã]o|japan|日本|brasil|brazil)$/i.test(area[0] || '');
  parts = area.length >= 2 ? area : parts;
  while (parts.length > 2) { parts = countryFirst ? parts.slice(0, -1) : parts.slice(1); add(parts.join(', ')); }
  return out.slice(0, 3);
}

// nome do lugar sem símbolos que atrapalham a busca ("% ARABICA" → "ARABICA")
export const cleanName = (t) => String(t || '').replace(/[%#*@!?¿¡"“”'’()[\]{}|/\\]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

// distância em km entre dois pontos
export function km(a, b) {
  const R = 6371;
  const r = (x) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

async function nominatim(q, suffix) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&${OSM_LANG}&q=${encodeURIComponent(suffix ? `${q} ${suffix}` : q)}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()).map((x) => {
    const { title, local } = osmName(x);
    return { key: `osm${x.place_id}`, lat: +parseFloat(x.lat).toFixed(6), lng: +parseFloat(x.lon).toFixed(6), title, local, detail: x.display_name, name: x.display_name };
  });
}

// busca por nome de loja/lugar (Photon, do OpenStreetMap): aceita nome incompleto e prefere o que está perto
async function photon(q, near) {
  const bias = near ? `&lat=${near.lat}&lon=${near.lng}&location_bias_scale=0.5` : '';
  const r = await fetch(`https://photon.komoot.io/api/?limit=5&q=${encodeURIComponent(q)}${bias}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return ((await r.json()).features || []).map((f) => {
    const p = f.properties || {};
    const [lng, lat] = f.geometry?.coordinates || [];
    const detail = [p.name, p.street && [p.street, p.housenumber].filter(Boolean).join(' '), p.district || p.locality, p.city, p.country].filter(Boolean).join(', ');
    return { key: `ph${p.osm_type}${p.osm_id}`, lat: +(+lat).toFixed(6), lng: +(+lng).toFixed(6), title: p.name || detail.split(',')[0], local: '', detail, name: detail, poi: !!p.osm_value && !['city', 'town', 'village', 'suburb', 'neighbourhood', 'quarter', 'district', 'state', 'country', 'county'].includes(p.osm_value) };
  }).filter((x) => okLat(x.lat) && okLng(x.lng));
}

async function reverseName(lat, lng) {
  if (offline()) return null;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&${OSM_LANG}&lat=${lat}&lon=${lng}`);
    if (!r.ok) return null;
    const j = await r.json();
    return j?.display_name ? { ...osmName(j), detail: j.display_name } : null;
  } catch { return null; }
}

async function expandShort(url) {
  if (offline()) throw new Error('sem internet para abrir o link curto do Google');
  const r = await fetch(`/api/geo/expand?url=${encodeURIComponent(url)}`);
  if (!r.ok) throw new Error(r.status === 401 ? 'entre no app de novo' : `HTTP ${r.status}`);
  return (await r.json()).url || '';
}

// ponto vindo de coordenadas: mostra já, e tenta dar nome com o OpenStreetMap
async function pointResult(pos, name, via) {
  const rev = await reverseName(pos.lat, pos.lng);
  const coords = `${pos.lat}, ${pos.lng}`;
  return [{
    key: `pt${coords}`, ...pos, exact: true,
    title: name || rev?.title || coords,
    local: name ? '' : (rev?.local || ''),
    detail: `${via} · ${coords}`,
    name: name || rev?.detail || '',
  }];
}

// a busca do campo de posição: devolve { results, note }; results = [{ key, lat, lng, title, local, detail, name, approx? }]
export async function findPlace(text, { suffix } = {}) {
  const q = String(text || '').trim();
  if (!q) return { results: [] };

  const pos = parseCoords(q);
  if (pos) return { results: await pointResult(pos, '', 'Coordenadas coladas') };

  let link = parseMapsLink(q);
  if (link?.short) {
    const long = await expandShort(link.url);
    link = parseMapsLink(long);
    if (!link) throw new Error('não consegui ler esse link do Google Maps');
  }
  if (link) {
    if (link.lat != null) return { results: await pointResult(link, link.name, 'Link do Google Maps') };
  }

  const query = link ? link.name : q; // link só com o nome do lugar: busca pelo nome
  if (offline()) throw new Error('sem internet');
  let results = await nominatim(query, suffix);
  if (results.length) return { results };
  for (const s of simplerQueries(query)) {
    await wait(1100); // o OpenStreetMap pede no máximo um pedido por segundo
    results = await nominatim(s, suffix);
    if (results.length) return { results: results.map((r) => ({ ...r, approx: true })), note: `Não achei o endereço exato; estes são para “${s}”. Confira o ponto no mapa ou cole as coordenadas do Google.` };
  }
  return { results: [] };
}

// posição automática ao salvar uma atividade que ainda não está no mapa: tenta o endereço/link/
// coordenadas do campo Local e o nome do lugar perto da cidade. Devolve { lat, lng, via, approx } ou null.
// near = { lat, lng } da cidade da atividade (evita achar uma loja de mesmo nome em outro país).
export async function autoLocate({ title, location, near }) {
  if (offline()) return null;
  const loc = String(location || '').trim();
  const name = cleanName(title);
  const nearOk = (r, maxKm) => !near || km(near, r) <= maxKm;
  const safe = (fn) => fn().catch(() => []);

  // 1. coordenadas ou link do Google no campo Local
  const pos = parseCoords(loc);
  if (pos) return { ...pos, via: 'coordenadas' };
  let link = parseMapsLink(loc);
  if (link?.short) link = parseMapsLink(await expandShort(link.url).catch(() => ''));
  if (link?.lat != null) return { lat: link.lat, lng: link.lng, via: 'link do Google Maps' };

  // 2. endereço completo
  const addr = link?.name || loc;
  if (addr) {
    const full = (await safe(() => nominatim(addr))).find((r) => nearOk(r, 80));
    if (full) return { lat: full.lat, lng: full.lng, via: 'endereço' };
  }
  // 3. nome do lugar perto da cidade (ou perto do bairro do endereço)
  let area = null;
  const simpler = addr ? simplerQueries(addr).slice(0, 2) : []; // bairro ou distrito; a cidade inteira não serve de posição
  if (simpler.length) {
    await wait(1100);
    for (const s of simpler) {
      area = (await safe(() => nominatim(s))).find((r) => nearOk(r, 80));
      if (area) break;
      await wait(1100);
    }
  }
  const center = area || near;
  if (name && center) {
    // "ARABICA Tokyo Nakameguro" → "ARABICA Tokyo" → "ARABICA": o nome da cidade no título às vezes atrapalha
    const words = name.split(' ');
    const tries = [...new Set([name, words.slice(0, 2).join(' '), words[0]])].filter((x) => x.length >= 3).slice(0, 3);
    for (const t of tries) {
      const hit = (await safe(() => photon(t, center))).find((r) => r.poi && km(center, r) <= (area ? 3 : 30));
      if (hit) return { lat: hit.lat, lng: hit.lng, via: 'nome do lugar', title: hit.title };
    }
  }
  // 4. o bairro do endereço, aproximado
  if (area) return { lat: area.lat, lng: area.lng, via: 'bairro do endereço', approx: true };
  return null;
}

