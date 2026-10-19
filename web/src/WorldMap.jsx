import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { nowIn } from './util.js';
import countriesUrl from './countries.json?url';

// mapa-múndi dos países das suas viagens: o país de cada cidade sai das coordenadas
// (polígonos do Natural Earth 1:50m embutidos no app, sem serviço externo)

const polys = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
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
export function countryAt(features, lat, lng) {
  const hit = features.find((f) => inside(lng, lat, f.geometry));
  if (hit) return hit.properties.a || null;
  let best = null;
  let bd = 60;
  for (const f of features) {
    for (const p of polys(f.geometry)) {
      for (const r of p) {
        for (let i = 1; i < r.length; i++) {
          const d = segKm(lng, lat, r[i - 1], r[i]);
          if (d < bd) { bd = d; best = f.properties.a || null; }
        }
      }
    }
  }
  return best;
}

// projeção equirretangular cortada nos polos; anéis que cruzam 180° são "desenrolados"
const TOP = 84;
const BOTTOM = -58;
const W = 1000;
const H = Math.round(((TOP - BOTTOM) / 360) * W);
const px = (lng, lat) => `${(((lng + 180) / 360) * W).toFixed(1)},${(((TOP - lat) / 360) * W).toFixed(1)}`;
function pathOf(g) {
  let d = '';
  for (const p of polys(g)) {
    for (const r of p) {
      let prev = null;
      let off = 0;
      r.forEach(([lng, lat], i) => {
        if (prev != null && Math.abs(lng + off - prev) > 180) off += prev > lng + off ? 360 : -360;
        const x = lng + off;
        d += `${i ? 'L' : 'M'}${px(x, lat)}`;
        prev = x;
      });
      d += 'Z';
    }
  }
  return d;
}

const names = (() => { try { return new Intl.DisplayNames(['pt-BR'], { type: 'region' }); } catch { return null; } })();
const countryName = (a) => (a && names ? names.of(a) : a) || a;

export default function WorldMap({ version }) {
  const [features, setFeatures] = useState(null);
  const [places, setPlaces] = useState(null);

  useEffect(() => { api.places().then(setPlaces).catch(() => setPlaces([])); }, [version]);
  useEffect(() => {
    if (!places?.length || features) return;
    Promise.all([fetch(countriesUrl).then((r) => r.json()), import('topojson-client')])
      .then(([topo, { feature }]) => setFeatures(feature(topo, topo.objects.countries).features))
      .catch(() => {});
  }, [places, features]);

  const paths = useMemo(() => (features ? features.map((f) => ({ a: f.properties.a, d: pathOf(f.geometry) })) : []), [features]);

  const summary = useMemo(() => {
    if (!features || !places) return null;
    const by = {};
    for (const p of places) {
      const a = countryAt(features, p.lat, p.lng);
      if (!a) continue;
      const been = nowIn().day >= p.start;
      const c = (by[a] ||= { a, name: countryName(a), been: false, cities: new Set(), trips: new Set() });
      c.been ||= been;
      c.cities.add(p.name);
      c.trips.add(p.trip);
    }
    return Object.values(by).sort((x, y) => Number(y.been) - Number(x.been) || x.name.localeCompare(y.name, 'pt-BR'));
  }, [features, places]);

  if (!places?.length || !summary?.length) return null;
  const status = Object.fromEntries(summary.map((c) => [c.a, c.been ? 'been' : 'plan']));
  const been = summary.filter((c) => c.been);
  const plan = summary.filter((c) => !c.been);
  const cities = new Set(places.map((p) => `${p.name}`)).size;

  return (
    <section className="world">
      <div className="world-head">
        <h2 className="home-h">Meu mapa</h2>
        <div className="world-kpis">
          <span><b>{been.length}</b> {been.length === 1 ? 'país visitado' : 'países visitados'}</span>
          {plan.length > 0 && <span><b>{plan.length}</b> {plan.length === 1 ? 'planejado' : 'planejados'}</span>}
          <span><b>{cities}</b> {cities === 1 ? 'cidade' : 'cidades'}</span>
        </div>
      </div>
      <svg className="world-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Mapa-múndi com ${summary.map((c) => c.name).join(', ')}`}>
        {paths.map((p, i) => <path key={i} d={p.d} className={status[p.a] || ''} />)}
      </svg>
      <ul className="world-list">
        {summary.map((c) => (
          <li key={c.a} className={c.been ? 'been' : 'plan'} title={[...c.trips].join(', ')}>
            <i />
            <b>{c.name}</b>
            <span>{[...c.cities].slice(0, 4).join(', ')}{c.cities.size > 4 ? ` e mais ${c.cities.size - 4}` : ''}</span>
          </li>
        ))}
      </ul>
      <div className="world-legend muted small"><span className="been"><i /> Já fui</span>{plan.length > 0 && <span className="plan"><i /> Viagem planejada</span>}</div>
    </section>
  );
}
