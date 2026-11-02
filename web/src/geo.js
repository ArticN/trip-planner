import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import countriesUrl from './countries.json?url';

// países e estados a partir das coordenadas (polígonos do Natural Earth embutidos no app, sem serviço externo)

export const polys = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
const inRing = (x, y, r) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i];
    const [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const inside = (x, y, g) => polys(g).some((p) => inRing(x, y, p[0]) && !p.slice(1).some((h) => inRing(x, y, h)));
// distância aproximada (km) de um ponto a um segmento, para cidades no litoral que caem "no mar" no mapa simplificado
const segKm = (x, y, [ax, ay], [bx, by]) => {
  const k = Math.cos((y * Math.PI) / 180);
  const dx = (bx - ax) * k;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, (((x - ax) * k) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot((ax - x) * k + t * dx, ay - y + t * dy) * 111;
};
// feature que contém o ponto; se nenhuma contém (cidade no litoral que cai "no mar" no mapa simplificado),
// a mais próxima até `maxKm`
export function featureAt(features, lat, lng, maxKm = 60) {
  const hit = features.find((f) => inside(lng, lat, f.geometry));
  if (hit) return hit;
  let best = null;
  let bd = maxKm;
  for (const f of features) {
    for (const p of polys(f.geometry)) {
      for (const r of p) {
        for (let i = 1; i < r.length; i++) {
          const d = segKm(lng, lat, r[i - 1], r[i]);
          if (d < bd) { bd = d; best = f; }
        }
      }
    }
  }
  return best;
}
export const countryAt = (features, lat, lng) => featureAt(features, lat, lng)?.properties.a || null;

// estados/províncias de cada país em arquivos separados (Natural Earth 1:10m, gerados por scripts/admin1.sh)
export const ADMIN1 = Object.fromEntries(Object.entries(import.meta.glob('./admin1/*.json', { query: '?url', import: 'default' }))
  .map(([k, load]) => [k.slice(-7, -5), load]));

const names = (() => { try { return new Intl.DisplayNames(['pt-BR'], { type: 'region' }); } catch { return null; } })();
export const countryName = (a) => (a && names ? names.of(a) : a) || a;

// carregados uma vez só e divididos entre o "Meu mapa" e as viagens
let countriesP = null;
export function loadCountries() {
  countriesP ||= Promise.all([fetch(countriesUrl).then((r) => r.json()), import('topojson-client')])
    .then(([topo, { feature }]) => feature(topo, topo.objects.countries).features)
    .catch((e) => { countriesP = null; throw e; });
  return countriesP;
}
const statesP = {};
export function loadStates(a) {
  if (!ADMIN1[a]) return Promise.resolve([]);
  statesP[a] ||= Promise.all([ADMIN1[a]().then((u) => fetch(u)).then((r) => r.json()), import('topojson-client')])
    .then(([topo, { feature }]) => feature(topo, topo.objects.states).features)
    .catch(() => { delete statesP[a]; return []; });
  return statesP[a];
}

// ── viagem nacional ou internacional
// trips.scope: 'domestic' | 'international' | null (automático). No automático a viagem é nacional quando todas as
// cidades com posição ficam no país onde você mora ("Onde moro", no Meu mapa); sem isso, fica internacional,
// como as viagens eram tratadas antes de existir o tipo.
export const SCOPES = { domestic: 'Nacional', international: 'Internacional' };

// tipo da viagem e por onde ela passa: estados (nacional, ex.: "Amazonas") ou países (internacional, ex.: "Japão").
// Os mapas só carregam se alguma cidade tiver posição.
export function useTripPlace(trip, cities) {
  const [home, setHome] = useState(null);
  const [features, setFeatures] = useState(null);
  const [states, setStates] = useState(null);
  const located = useMemo(() => (cities || []).filter((c) => c.key !== 'transito' && c.lat != null && c.lng != null), [cities]);
  useEffect(() => { api.settings().then((s) => setHome(s.home_country || null)).catch(() => {}); }, []);
  useEffect(() => { if (located.length && !features) loadCountries().then(setFeatures).catch(() => {}); }, [located.length, features]);
  // países escolhidos na criação da viagem (trips.countries) somam com os das cidades; sem cidades, decidem sozinhos
  const chosen = useMemo(() => String(trip?.countries || '').split(',').filter(Boolean), [trip?.countries]);
  const where = useMemo(() => [...chosen, ...(features ? located.map((c) => countryAt(features, c.lat, c.lng)) : [])], [features, located, chosen]);
  const auto = home && where.length ? (where.every((a) => a === home) ? 'domestic' : 'international') : null;
  const scope = trip?.scope || auto || 'international';
  const domestic = scope === 'domestic';
  useEffect(() => { if (domestic && home && located.length) loadStates(home).then(setStates); }, [domestic, home, located.length]);
  const regions = useMemo(() => {
    if (domestic) return states?.length ? [...new Set(located.map((c) => featureAt(states, c.lat, c.lng, 40)?.properties.n).filter(Boolean))] : [];
    return [...new Set(where.filter((a) => a && a !== home))].map(countryName);
  }, [domestic, states, located, where, home]);
  return { scope, auto, home, domestic, regions };
}
