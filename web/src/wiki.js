import { haversine } from './util.js';

// resumo da Wikipédia para um lugar do roteiro: tenta português e depois inglês,
// e só aceita a página se ela ficar perto do ponto no mapa (evita homônimos)
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const words = (s) => new Set(norm(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 4));

// "Passeio (tarde) - Uniqlo Ginza + Ginza Six" → "Uniqlo Ginza"
export function placeQuery(title) {
  let t = String(title || '').replace(/\p{Extended_Pictographic}|️/gu, '').trim();
  if (t.includes(' - ')) t = t.split(' - ').slice(1).join(' - ');
  t = t.split(/\s\+\s|\s\/\s|\(/)[0];
  return t.trim();
}

const api = (lang, params) => fetch(`https://${lang}.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', format: 'json', origin: '*', redirects: '1', ...params })}`).then((r) => {
  if (!r.ok) throw new Error(`Wikipédia respondeu ${r.status}`);
  return r.json();
});
const PAGE = { prop: 'extracts|pageimages|coordinates|info', inprop: 'url', exintro: '1', explaintext: '1', exsentences: '3', exlimit: '5', piprop: 'thumbnail', pithumbsize: '320' };
const pagesOf = (j) => Object.values(j?.query?.pages || {}).sort((x, y) => (x.index ?? 0) - (y.index ?? 0));
const near = (p, a) => p.coordinates?.[0] && haversine(a, { lat: p.coordinates[0].lat, lng: p.coordinates[0].lon }) <= 3;
const shape = (p, lang) => ({ title: p.title, text: p.extract, img: p.thumbnail?.source || null, url: p.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(p.title)}`, lang });

async function lookup(a) {
  const q = placeQuery(a.title);
  const geo = a.lat != null && a.lng != null;
  for (const lang of ['pt', 'en']) {
    if (q) {
      const j = await api(lang, { generator: 'search', gsrsearch: q, gsrlimit: '5', ...PAGE });
      const pages = pagesOf(j).filter((p) => p.extract);
      const hit = geo ? pages.find((p) => near(p, a)) : pages.find((p) => [...words(q)].some((w) => words(p.title).has(w)));
      if (hit) return shape(hit, lang);
    }
    if (geo) {
      // sem resultado pelo nome: páginas a até 400 m do ponto com alguma palavra do título em comum
      const j = await api(lang, { generator: 'geosearch', ggscoord: `${a.lat}|${a.lng}`, ggsradius: '400', ggslimit: '10', ...PAGE });
      const want = words(`${q} ${a.location || ''}`);
      const hit = pagesOf(j).find((p) => p.extract && [...words(p.title)].some((w) => want.has(w)));
      if (hit) return shape(hit, lang);
    }
  }
  return null;
}

const keyOf = (a) => `wiki:${placeQuery(a.title)}:${a.lat ?? ''},${a.lng ?? ''}`;
export const wikiCached = (a) => { try { return localStorage.getItem(keyOf(a)) != null; } catch { return false; } };

export async function wikiSummary(a) {
  const key = keyOf(a);
  try { const c = localStorage.getItem(key); if (c) return JSON.parse(c); } catch { /* sem storage */ }
  const res = await lookup(a);
  try { localStorage.setItem(key, JSON.stringify(res)); } catch { /* sem storage */ }
  return res;
}
