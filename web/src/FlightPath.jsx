import { useEffect, useMemo, useState } from 'react';
import countriesUrl from './countries.json?url';
import { haversine } from './util.js';
import { loadAirports, flightRoute, rad } from './flights.js';

// trajeto do voo num mapa-múndi simplificado: saída, escalas e chegada ligadas por arcos de grande círculo
// (o caminho mais curto sobre a Terra, não a rota real do avião). Tudo embutido no app, funciona offline:
// aeroportos do OurAirports (scripts/airports.mjs) e países do Natural Earth (os mesmos do Meu mapa)

let worldP = null;
const loadWorld = () => (worldP ||= Promise.all([fetch(countriesUrl).then((r) => r.json()), import('topojson-client')])
  .then(([topo, { feature }]) => feature(topo, topo.objects.countries).features.flatMap(rings))
  .catch((e) => { worldP = null; throw e; }));

// cada anel de cada país, com a longitude "desenrolada" (sem saltar de 180° para -180°) e a caixa dele
function rings(f) {
  const g = f.geometry;
  const ps = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return ps.map((p) => {
    let prev = null;
    let off = 0;
    const r = p[0].map(([lng, lat]) => {
      if (prev != null && Math.abs(lng + off - prev) > 180) off += prev > lng + off ? 360 : -360;
      prev = lng + off;
      return [prev, lat];
    });
    const b = r.reduce((m, [x, y]) => [Math.min(m[0], x), Math.min(m[1], y), Math.max(m[2], x), Math.max(m[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);
    return { r, b };
  });
}

const W = 1000;

export default function FlightPath({ a }) {
  const [airports, setAirports] = useState(null);
  const [world, setWorld] = useState(null);
  const still = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    let live = true;
    loadAirports().then((x) => live && setAirports(x)).catch(() => {});
    loadWorld().then((x) => live && setWorld(x)).catch(() => {});
    return () => { live = false; };
  }, []);

  const map = useMemo(() => {
    if (!airports) return null;
    const fr = flightRoute(a, airports);
    if (!fr) return null;
    const { legs, dots } = fr;
    const pts = dots;

    // enquadramento: o trajeto com uma margem, nem estreito nem alto demais
    const all = legs.flat();
    let [x0, y0, x1, y1] = all.reduce((m, [x, y]) => [Math.min(m[0], x), Math.min(m[1], y), Math.max(m[2], x), Math.max(m[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);
    const pad = Math.max(6, 0.14 * Math.max(x1 - x0, y1 - y0));
    x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
    const k = Math.max(0.45, Math.cos(rad(Math.max(-70, Math.min(70, (y0 + y1) / 2)))));
    const ratio = () => (y1 - y0) / ((x1 - x0) * k);
    if (ratio() < 0.42) { const d = ((x1 - x0) * k * 0.42 - (y1 - y0)) / 2; y0 -= d; y1 += d; }
    if (ratio() > 0.62) { const d = ((y1 - y0) / 0.62 / k - (x1 - x0)) / 2; x0 -= d; x1 += d; }
    if (y1 > 85) { y0 -= y1 - 85; y1 = 85; }
    if (y0 < -80) { y1 += -80 - y0; y0 = -80; }
    const s = W / ((x1 - x0) * k);
    const H = Math.round((y1 - y0) * s);
    const xy = (x, y) => `${((x - x0) * k * s).toFixed(1)},${((y1 - y) * s).toFixed(1)}`;
    const line = (l) => l.map(([x, y], i) => `${i ? 'L' : 'M'}${xy(x, y)}`).join('');
    // contorno dos países mais leve: pula vértices a menos de ~1,5 unidade do anterior no desenho
    const thin = (l) => {
      const min = 1.5 / s;
      let last = null;
      return l.filter(([x, y], i) => {
        if (i && i < l.length - 1 && Math.abs(x - last[0]) * k < min && Math.abs(y - last[1]) < min) return false;
        last = [x, y];
        return true;
      });
    };

    // países que aparecem no quadro (repetidos 360° para a esquerda ou a direita quando o quadro passa de 180°)
    let land = '';
    if (world) {
      for (const off of [-360, 0, 360]) {
        for (const { r, b } of world) {
          if (b[2] + off < x0 || b[0] + off > x1 || b[3] < y0 || b[1] > y1) continue;
          land += `${line(thin(r.map(([x, y]) => [x + off, y])))}Z`;
        }
      }
    }

    const km = pts.slice(1).reduce((t, p, i) => t + haversine(pts[i], p), 0);
    return {
      H, land, km,
      legs: legs.map(line),
      route: line(all),
      dots: dots.map((d) => {
        const [px, py] = xy(d.x, d.lat).split(',').map(Number);
        return { ...d, px, py };
      }),
      missing: fr.missing,
      guessed: fr.guessed,
    };
  }, [airports, world, a.from_code, a.via, a.to_code, a.location, a.title]);

  if (!map) return null;
  const fs = 44;
  const names = map.dots.map((d) => d.code).join(' → ');
  return (
    <figure className="flight-path" aria-label={`Trajeto ilustrativo do voo: ${names}`}>
      <svg viewBox={`0 0 ${W} ${map.H}`} style={{ aspectRatio: `${W} / ${map.H}` }} role="img" aria-label={`Mapa com o trajeto ${names}`}>
        <path className="fp-land" d={map.land} />
        {map.legs.map((d, i) => <path key={i} className="fp-arc" d={d} />)}
        {map.dots.map((d) => (
          <g key={`${d.code}${d.px}`} className={d.end ? 'fp-end' : 'fp-via'}>
            <circle cx={d.px} cy={d.py} r={d.end ? 12 : 9}><title>{`${d.code} · ${d.city}`}</title></circle>
            <text x={d.px} y={d.py - 22} textAnchor={d.px < 80 ? 'start' : d.px > W - 80 ? 'end' : 'middle'} fontSize={fs}>{d.code}</text>
          </g>
        ))}
        <g className="fp-plane">
          <path d="M22 0 L-12 -17 L-6 0 L-12 17 Z" />
          {still
            ? <animateMotion dur="1s" fill="freeze" keyPoints="0.5;0.5" keyTimes="0;1" calcMode="linear" rotate="auto" path={map.route} />
            : <animateMotion dur={`${Math.min(14, 5 + map.dots.length * 2)}s`} repeatCount="indefinite" rotate="auto" path={map.route} />}
        </g>
      </svg>
      <figcaption className="muted small">
        {map.dots.map((d) => d.city).join(' → ')} · ~{Math.round(map.km).toLocaleString('pt-BR')} km em linha reta
        {map.missing.length > 0 && <> · {map.missing.join(', ')} fora da lista de aeroportos</>}
        {map.guessed && <> · escala lida do texto do voo</>}
        <span className="fp-note">Trajeto ilustrativo (o arco mais curto entre os aeroportos), não a rota real do avião.</span>
      </figcaption>
    </figure>
  );
}
