import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { nowIn } from './util.js';
import { polys, featureAt, countryAt, countryName, ADMIN1, loadCountries, loadStates } from './geo.js';

// mapa-múndi dos países das suas viagens: o país de cada cidade sai das coordenadas

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

// visão "Meu país": estados/províncias carregados só para o país onde a pessoa mora
const COUNTRIES = Object.keys(ADMIN1).map((a) => ({ a, name: countryName(a) })).sort((x, y) => x.name.localeCompare(y.name, 'pt-BR'));
// palpite pelo idioma do aparelho (pt-BR → Brasil), só para sugerir
const guessCountry = () => {
  const r = (navigator.languages || [navigator.language]).map((l) => l?.split('-')[1]?.toUpperCase()).find((c) => c && ADMIN1[c]);
  return r || null;
};

const bboxOf = (ring) => ring.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);
const ringArea = (r) => Math.abs(r.reduce((a, [x, y], i) => { const [x2, y2] = r[(i + 1) % r.length]; return a + x * y2 - x2 * y; }, 0)) / 2;

// enquadramento do país: a maior massa de terra do contorno do país e o que está perto dela (ilhas e territórios
// distantes, como o Alasca ou Okinawa, ficam de fora), mais as cidades das suas viagens, que nunca ficam fora do quadro
function frameOf(outline, points) {
  const parts = outline.flatMap((f) => polys(f.geometry).map((p) => p[0]));
  if (!parts.length) return null;
  const main = parts.reduce((m, r) => (ringArea(r) > ringArea(m) ? r : m));
  const mb = bboxOf(main);
  const lng0 = (mb[0] + mb[2]) / 2;
  const norm = (x) => (x - lng0 > 180 ? x - 360 : x - lng0 < -180 ? x + 360 : x); // Rússia, Fiji: não quebra em 180°
  const pad = 0.25 * Math.max(mb[2] - mb[0], mb[3] - mb[1]);
  let b = [...mb];
  const grow = (x, y) => { b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]; };
  for (const r of parts) {
    const [x0, y0, x1, y1] = bboxOf(r.map(([x, y]) => [norm(x), y]));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    if (cx >= mb[0] - pad && cx <= mb[2] + pad && cy >= mb[1] - pad && cy <= mb[3] + pad) { grow(x0, y0); grow(x1, y1); }
  }
  for (const p of points) grow(norm(p.lng), p.lat);
  const m = 0.04 * Math.max(b[2] - b[0], b[3] - b[1]);
  b = [b[0] - m, b[1] - m, b[2] + m, b[3] + m];
  const k = Math.cos((((b[1] + b[3]) / 2) * Math.PI) / 180);
  let s = 1000 / ((b[2] - b[0]) * k);
  if ((b[3] - b[1]) * s > 760) s = 760 / (b[3] - b[1]); // país "em pé" (Chile, Japão): limita a altura
  const w = Math.round((b[2] - b[0]) * k * s);
  const h = Math.round((b[3] - b[1]) * s);
  const xy = (lng, lat) => [(norm(lng) - b[0]) * k * s, (b[3] - lat) * s];
  const path = (g) => polys(g).map((p) => p.map((r) => r.map(([x, y], i) => `${i ? 'L' : 'M'}${xy(x, y).map((v) => v.toFixed(1)).join(',')}`).join('') + 'Z').join('')).join('');
  return { w, h, xy, path };
}

// rótulos das cidades: à direita do ponto; se bater em outro, à esquerda; se ainda bater, só o ponto
function placeLabels(dots, fs, w) {
  const boxes = [];
  const hits = (bx) => boxes.some((o) => bx[0] < o[2] && bx[2] > o[0] && bx[1] < o[3] && bx[3] > o[1]);
  return dots.map((d) => {
    const tw = d.name.length * fs * 0.56;
    const gap = fs * 0.55;
    const right = [d.x + gap, d.y - fs * 0.6, d.x + gap + tw, d.y + fs * 0.45];
    const left = [d.x - gap - tw, right[1], d.x - gap, right[3]];
    const pick = [right, left].find((bx) => bx[0] >= 0 && bx[2] <= w && !hits(bx));
    if (!pick) return { ...d, label: null };
    boxes.push(pick);
    return { ...d, label: { x: pick === right ? right[0] : left[2], anchor: pick === right ? 'start' : 'end' } };
  });
}

export default function WorldMap({ version }) {
  const [features, setFeatures] = useState(null);
  const [places, setPlaces] = useState(null);
  const [prefs, setPrefs] = useState({});
  const [states, setStates] = useState({}); // país → features dos estados (ou [] se não houver arquivo)

  useEffect(() => { api.places().then(setPlaces).catch(() => setPlaces([])); }, [version]);
  useEffect(() => { api.settings().then(setPrefs).catch(() => {}); }, []);
  useEffect(() => {
    if (!places?.length || features) return;
    loadCountries().then(setFeatures).catch(() => {});
  }, [places, features]);

  const home = prefs.home_country && ADMIN1[prefs.home_country] ? prefs.home_country : null;
  const view = home && prefs.map_view === 'country' ? 'country' : 'world';

  const save = (patch) => {
    setPrefs((p) => ({ ...p, ...patch }));
    api.saveSettings(patch).then(setPrefs).catch(() => {});
  };

  const paths = useMemo(() => (features ? features.map((f) => ({ a: f.properties.a, d: pathOf(f.geometry) })) : []), [features]);

  // cada cidade com seu país e se já foi (a viagem já começou)
  const located = useMemo(() => {
    if (!features || !places) return null;
    const today = nowIn().day;
    return places.map((p) => ({ ...p, a: countryAt(features, p.lat, p.lng), been: today >= p.start })).filter((p) => p.a);
  }, [features, places]);

  // o país onde mora também carrega os estados na visão Mundo: viagem nacional aparece por estado (ex.: Amazonas)
  const homeVisited = !!home && !!located?.some((p) => p.a === home);
  useEffect(() => {
    if ((view !== 'country' && !homeVisited) || states[home]) return;
    loadStates(home).then((f) => setStates((m) => ({ ...m, [home]: f })));
  }, [view, home, states, homeVisited]);

  const summary = useMemo(() => {
    if (!located) return null;
    const by = {};
    for (const p of located) {
      const c = (by[p.a] ||= { a: p.a, name: countryName(p.a), been: false, cities: new Set(), trips: new Set() });
      c.been ||= p.been;
      c.cities.add(p.name);
      c.trips.add(p.trip);
    }
    // viagens dentro do país onde mora: o país não conta como destino estrangeiro e a lista mostra os estados
    if (home && by[home]) {
      const st = states[home]?.length ? states[home] : null;
      by[home].home = true;
      by[home].states = st ? [...new Set(located.filter((p) => p.a === home).map((p) => featureAt(st, p.lat, p.lng, 40)?.properties.n).filter(Boolean))] : [];
    }
    return Object.values(by).sort((x, y) => Number(!!y.home) - Number(!!x.home) || Number(y.been) - Number(x.been) || x.name.localeCompare(y.name, 'pt-BR'));
  }, [located, home, states]);

  // visão do país: estados com cidades e os pontos das cidades
  const country = useMemo(() => {
    if (view !== 'country' || !located || !features || !states[home]) return null;
    const outline = features.filter((f) => f.properties.a === home);
    const shapes = states[home].length ? states[home] : outline;
    const here = located.filter((p) => p.a === home);
    const frame = frameOf(outline.length ? outline : shapes, here);
    if (!frame) return null;
    const cities = {};
    for (const p of here) {
      const st = states[home].length ? featureAt(states[home], p.lat, p.lng, 40) : null;
      const c = (cities[p.name] ||= { name: p.name, lat: p.lat, lng: p.lng, been: false, state: st?.properties.n || null, trips: new Set() });
      c.been ||= p.been;
      c.trips.add(p.trip);
    }
    const byState = {};
    for (const c of Object.values(cities)) {
      const k = c.state || countryName(home);
      const g = (byState[k] ||= { name: k, been: false, cities: [] });
      g.been ||= c.been;
      g.cities.push(c.name);
    }
    const fs = frame.w * 0.021;
    const dots = placeLabels(
      Object.values(cities)
        .map((c) => { const [x, y] = frame.xy(c.lng, c.lat); return { ...c, x, y }; })
        .sort((x, y) => Number(y.been) - Number(x.been) || x.name.localeCompare(y.name, 'pt-BR')),
      fs, frame.w,
    );
    return {
      frame, fs, dots,
      shapes: shapes.map((f) => ({ name: f.properties.n || countryName(home), d: frame.path(f.geometry), status: byState[f.properties.n]?.been ? 'been' : byState[f.properties.n] ? 'plan' : '' })),
      groups: Object.values(byState).sort((x, y) => Number(y.been) - Number(x.been) || x.name.localeCompare(y.name, 'pt-BR')),
      hasStates: states[home].length > 0,
    };
  }, [view, home, located, features, states]);

  if (!places?.length || !summary?.length) return null;
  const status = Object.fromEntries(summary.map((c) => [c.a, c.been ? 'been' : 'plan']));
  const abroad = summary.filter((c) => !c.home);
  const been = abroad.filter((c) => c.been);
  const plan = abroad.filter((c) => !c.been);
  const national = summary.find((c) => c.home);
  const cities = new Set(places.map((p) => `${p.name}`)).size;
  const homeName = home ? countryName(home) : null;

  const kpis = view === 'country' && country
    ? (() => {
      const unit = country.hasStates ? ['estado', 'estados'] : null;
      const sb = country.groups.filter((g) => g.been).length;
      const sp = country.groups.length - sb;
      return (
        <>
          {unit && <span><b>{sb}</b> {sb === 1 ? `${unit[0]} visitado` : `${unit[1]} visitados`}</span>}
          {unit && sp > 0 && <span><b>{sp}</b> {sp === 1 ? 'planejado' : 'planejados'}</span>}
          <span><b>{country.dots.length}</b> {country.dots.length === 1 ? 'cidade' : 'cidades'}</span>
        </>
      );
    })()
    : (
      <>
        <span><b>{been.length}</b> {been.length === 1 ? 'país visitado' : 'países visitados'}</span>
        {plan.length > 0 && <span><b>{plan.length}</b> {plan.length === 1 ? 'planejado' : 'planejados'}</span>}
        {national && <span><b>{national.trips.size}</b> {national.trips.size === 1 ? 'viagem nacional' : 'viagens nacionais'}</span>}
        <span><b>{cities}</b> {cities === 1 ? 'cidade' : 'cidades'}</span>
      </>
    );

  return (
    <section className="world">
      <div className="world-head">
        <h2 className="home-h">Meu mapa</h2>
        {home && (
          <div className="seg-tabs mini-seg" role="radiogroup" aria-label="Visão do mapa">
            <button role="radio" aria-checked={view === 'world'} className={view === 'world' ? 'on' : ''} onClick={() => save({ map_view: 'world' })}>Mundo</button>
            <button role="radio" aria-checked={view === 'country'} className={view === 'country' ? 'on' : ''} onClick={() => save({ map_view: 'country' })}>{homeName}</button>
          </div>
        )}
        <div className="world-kpis">{kpis}</div>
      </div>

      {view === 'country' ? (
        country ? (
          <svg className="world-map country-map" viewBox={`0 0 ${country.frame.w} ${country.frame.h}`} style={{ aspectRatio: `${country.frame.w} / ${country.frame.h}` }} role="img"
            aria-label={`Mapa de ${homeName}${country.dots.length ? ` com ${country.dots.map((d) => d.name).join(', ')}` : ''}`}>
            {country.shapes.map((p, i) => <path key={i} d={p.d} className={p.status}><title>{p.name}</title></path>)}
            {country.dots.map((d) => (
              <g key={d.name} className={d.been ? 'been' : 'plan'}>
                <circle cx={d.x} cy={d.y} r={country.fs * 0.32}><title>{`${d.name}${d.state ? ` · ${d.state}` : ''} — ${[...d.trips].join(', ')}`}</title></circle>
                {d.label && <text x={d.label.x} y={d.y} dy="0.35em" textAnchor={d.label.anchor} fontSize={country.fs}>{d.name}</text>}
              </g>
            ))}
          </svg>
        ) : <div className="world-map country-map world-loading" aria-busy="true" />
      ) : (
        <svg className="world-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Mapa-múndi com ${summary.map((c) => c.name).join(', ')}`}>
          {paths.map((p, i) => <path key={i} d={p.d} className={`${status[p.a] || ''}${p.a === home ? ' home' : ''}`} />)}
        </svg>
      )}

      {view === 'country' && country ? (
        country.groups.length ? (
          <ul className="world-list">
            {country.groups.map((g) => (
              <li key={g.name} className={g.been ? 'been' : 'plan'}>
                <i />
                <b>{g.name}</b>
                <span>{g.cities.slice(0, 4).join(', ')}{g.cities.length > 4 ? ` e mais ${g.cities.length - 4}` : ''}</span>
              </li>
            ))}
          </ul>
        ) : <p className="muted small world-empty">Nenhuma cidade das suas viagens fica em {homeName} ainda. Quando tiver, ela aparece aqui no mapa{country.hasStates ? ', com o estado pintado' : ''}.</p>
      ) : view === 'world' && (
        <ul className="world-list">
          {summary.map((c) => (
            <li key={c.a} className={c.been ? 'been' : 'plan'} title={[...c.trips].join(', ')}>
              <i />
              <b>{c.name}{c.home && <small className="muted"> · onde você mora</small>}</b>
              {c.home && c.states.length
                ? <span>{c.states.slice(0, 4).join(', ')}{c.states.length > 4 ? ` e mais ${c.states.length - 4}` : ''}</span>
                : <span>{[...c.cities].slice(0, 4).join(', ')}{c.cities.size > 4 ? ` e mais ${c.cities.size - 4}` : ''}</span>}
            </li>
          ))}
        </ul>
      )}

      <div className="world-foot">
        <div className="world-legend muted small"><span className="been"><i /> Já fui</span>{(view === 'country' && country ? country.dots.some((d) => !d.been) : plan.length > 0) && <span className="plan"><i /> Viagem planejada</span>}</div>
        <HomePicker home={home} onPick={(a) => save(a ? { home_country: a, map_view: 'country' } : { home_country: null, map_view: 'world' })} />
      </div>
    </section>
  );
}

function HomePicker({ home, onPick }) {
  const guess = home ? null : guessCountry();
  return (
    <label className="world-home muted small">
      Onde moro
      <select value={home || ''} onChange={(e) => onPick(e.target.value || null)}>
        <option value="">{home ? 'Nenhum (só o mundo)' : 'Escolher país…'}</option>
        {guess && <option value={guess}>{countryName(guess)}</option>}
        {guess && <option disabled>──────────</option>}
        {COUNTRIES.map((c) => <option key={c.a} value={c.a}>{c.name}</option>)}
      </select>
    </label>
  );
}
