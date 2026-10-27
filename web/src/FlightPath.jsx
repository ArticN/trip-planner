import { useEffect, useMemo, useState } from 'react';
import airportsUrl from './airports.json?url';
import countriesUrl from './countries.json?url';
import { haversine } from './util.js';

// trajeto do voo num mapa-múndi simplificado: saída, escalas e chegada ligadas por arcos de grande círculo
// (o caminho mais curto sobre a Terra, não a rota real do avião). Tudo embutido no app, funciona offline:
// aeroportos do OurAirports (scripts/airports.mjs) e países do Natural Earth (os mesmos do Meu mapa)

let airportsP = null;
let worldP = null;
const loadAirports = () => (airportsP ||= fetch(airportsUrl).then((r) => r.json()).catch((e) => { airportsP = null; throw e; }));
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

// códigos do trecho: saída, escalas e chegada (só os que parecem código IATA, como GRU)
export function flightCodes(a) {
  const via = String(a.via || '').toUpperCase().split(/[^A-Z]+/);
  return [a.from_code, ...via, a.to_code].map((c) => String(c || '').trim().toUpperCase()).filter((c) => /^[A-Z]{3}$/.test(c))
    .filter((c, i, l) => c !== l[i - 1]);
}

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const vec = (p) => [Math.cos(rad(p.lat)) * Math.cos(rad(p.lng)), Math.cos(rad(p.lat)) * Math.sin(rad(p.lng)), Math.sin(rad(p.lat))];
// pontos do arco de grande círculo entre a e b (interpolação esférica)
function arc(a, b, n = 64) {
  const u = vec(a);
  const v = vec(b);
  const w = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2])));
  if (w < 1e-6) return [[a.lng, a.lat], [b.lng, b.lat]];
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s1 = Math.sin((1 - t) * w) / Math.sin(w);
    const s2 = Math.sin(t * w) / Math.sin(w);
    const x = s1 * u[0] + s2 * v[0];
    const y = s1 * u[1] + s2 * v[1];
    const z = s1 * u[2] + s2 * v[2];
    out.push([deg(Math.atan2(y, x)), deg(Math.atan2(z, Math.hypot(x, y)))]);
  }
  return out;
}

const W = 1000;

export default function FlightPath({ a }) {
  const codes = useMemo(() => flightCodes(a), [a.from_code, a.via, a.to_code]);
  const [airports, setAirports] = useState(null);
  const [world, setWorld] = useState(null);
  const still = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    if (codes.length < 2) return;
    let live = true;
    loadAirports().then((x) => live && setAirports(x)).catch(() => {});
    loadWorld().then((x) => live && setWorld(x)).catch(() => {});
    return () => { live = false; };
  }, [codes.length]);

  const map = useMemo(() => {
    if (!airports) return null;
    const stops = codes.map((c) => (airports[c] ? { code: c, lat: airports[c][0], lng: airports[c][1], city: airports[c][2] } : null));
    const pts = stops.filter(Boolean);
    if (pts.length < 2) return null;

    // trajeto inteiro com a longitude contínua (um voo que cruza o Pacífico não dá a volta no mapa)
    let prev = null;
    const unwrap = (lng) => {
      let x = lng;
      if (prev != null) while (x - prev > 180) x -= 360;
      if (prev != null) while (x - prev < -180) x += 360;
      prev = x;
      return x;
    };
    const legs = [];
    const dots = [];
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) legs.push(arc(pts[i - 1], pts[i]).map(([x, y], j) => [j === 0 ? prev : unwrap(x), y]));
      else unwrap(pts[0].lng);
      dots.push({ ...pts[i], x: prev });
    }

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
      dots: dots.map((d, i) => {
        const [px, py] = xy(d.x, d.lat).split(',').map(Number);
        return { ...d, px, py, end: i === 0 || i === dots.length - 1 };
      }),
      missing: codes.filter((c, i) => !stops[i]),
    };
  }, [airports, world, codes]);

  if (codes.length < 2 || !map) return null;
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
        <span className="fp-note">Trajeto ilustrativo (o arco mais curto entre os aeroportos), não a rota real do avião.</span>
      </figcaption>
    </figure>
  );
}
