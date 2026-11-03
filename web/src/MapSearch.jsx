import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import { parseCoords, parseMapsLink, searchPlaces, suggestPlaces } from './geocode.js';

// busca de lugares sobre o mapa: sugestões enquanto digita (perto do que está na tela), Enter busca
// também por endereço; escolher um resultado põe um marcador no mapa para conferir antes de cadastrar
export function MapSearch({ onPick, getView }) {
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [hi, setHi] = useState(-1);
  const inputRef = useRef(null);
  const gen = useRef(0);
  const timer = useRef(null);

  const search = async (text = q) => {
    if (!text.trim()) return;
    clearTimeout(timer.current);
    const my = ++gen.current;
    setBusy(true); setErr(''); setHi(-1);
    try {
      const res = await searchPlaces(text, getView?.());
      if (my === gen.current) setFound({ ...res, full: true });
    } catch (e) {
      if (my === gen.current) setErr(`Não consegui buscar (${e.message}).`);
    } finally { if (my === gen.current) setBusy(false); }
  };
  // sugestões: espera a pessoa parar de digitar
  const type = (text) => {
    setQ(text); setErr(''); setHi(-1);
    clearTimeout(timer.current);
    if (text.trim().length < 3 || parseCoords(text) || parseMapsLink(text)) { setFound(null); return; }
    timer.current = setTimeout(async () => {
      const my = ++gen.current;
      const results = await suggestPlaces(text, getView?.()).catch(() => []);
      if (my === gen.current && results.length) setFound({ results, full: false });
    }, 450);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const close = () => { gen.current++; setFound(null); setErr(''); setBusy(false); setHi(-1); };
  const choose = (r) => { onPick(r); close(); setQ(''); inputRef.current?.blur(); };
  const list = found?.results || [];

  return (
    <div className="map-search">
      <input
        ref={inputRef} value={q} placeholder="Buscar lugar, endereço, link ou coordenadas"
        aria-label="Buscar lugar no mapa" role="combobox" aria-expanded={!!found} aria-autocomplete="list"
        onChange={(e) => type(e.target.value)}
        onPaste={(e) => { const t = e.clipboardData.getData('text'); if (parseCoords(t) || parseMapsLink(t)) { e.preventDefault(); setQ(t.trim()); search(t); } }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && list.length) { e.preventDefault(); setHi((h) => (h + 1) % list.length); }
          else if (e.key === 'ArrowUp' && list.length) { e.preventDefault(); setHi((h) => (h <= 0 ? list.length - 1 : h - 1)); }
          else if (e.key === 'Enter') { e.preventDefault(); if (hi >= 0 && list[hi]) choose(list[hi]); else search(); }
          else if (e.key === 'Escape') { close(); inputRef.current?.blur(); }
        }}
      />
      {busy && <div className="ms-pop muted small">Buscando…</div>}
      {err && <div className="ms-pop warn soft">{err}</div>}
      {found && !busy && (
        <ul className="ms-pop" role="listbox">
          {found.full && list.length === 0 && <li className="muted small">Nada encontrado. Inclua a cidade, cole o link ou as coordenadas do Google Maps, ou toque e segure no mapa para marcar o ponto.</li>}
          {found.note && <li className="muted small">{found.note}</li>}
          {list.map((r, i) => (
            <li key={r.key} role="option" aria-selected={i === hi}>
              <button className={i === hi ? 'hi' : ''} onMouseEnter={() => setHi(i)} onClick={() => choose(r)}>
                <b>{r.exact && <span className="ok">● </span>}{r.title}{r.local && <small> {r.local}</small>}</b>
                <span>{r.detail}</span>
              </button>
            </li>
          ))}
          {!found.full && <li className="muted small ms-more">Enter busca também por endereço</li>}
        </ul>
      )}
    </div>
  );
}

// lugares próximos (OpenStreetMap via Overpass) em volta da atividade selecionada ou do centro do mapa
const NEARBY = {
  sight: { label: 'Atrações', kind: 'sight', q: 'nwr["tourism"~"^(attraction|museum|viewpoint|gallery|zoo|theme_park)$"]{A};nwr["historic"~"^(castle|monument|memorial|ruins)$"]["name"]{A};nwr["amenity"="place_of_worship"]["name"]["wikidata"]{A};nwr["leisure"~"^(park|garden)$"]["name"]["wikidata"]{A};' },
  food: { label: 'Comida', kind: 'food', q: 'nwr["amenity"~"^(restaurant|cafe|fast_food|food_court|bar)$"]["name"]{A};' },
  shop: { label: 'Compras', kind: 'shop', q: 'nwr["shop"~"^(mall|department_store|gift|books|clothes|convenience|supermarket)$"]["name"]{A};nwr["amenity"="marketplace"]{A};' },
};
const R = 900; // metros
const dist = (a, b) => {
  const k = Math.PI / 180;
  const x = (b.lng - a.lng) * k * Math.cos(((a.lat + b.lat) / 2) * k);
  const y = (b.lat - a.lat) * k;
  return Math.sqrt(x * x + y * y) * 6371000;
};
const fmtM = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`);

export function Nearby({ getOrigin, onPick }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState('sight');
  const [res, setRes] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = async (c) => {
    const o = getOrigin();
    if (!o) return;
    setCat(c); setOrigin(o); setBusy(true); setErr(''); setRes(null);
    const around = `(around:${R},${o.lat.toFixed(5)},${o.lng.toFixed(5)})`;
    const query = `[out:json][timeout:20];(${NEARBY[c].q.replaceAll('{A}', around)});out center tags 80;`;
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: new URLSearchParams({ data: query }) });
      if (!r.ok) throw new Error(r.status === 429 ? 'muitas buscas seguidas, espere alguns segundos' : `HTTP ${r.status}`);
      const j = await r.json();
      const seen = new Set();
      const list = j.elements
        .map((e) => ({ id: `${e.type}${e.id}`, name: e.tags?.['name:pt'] || e.tags?.name, lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon, t: e.tags || {} }))
        .filter((p) => p.name && p.lat != null && !seen.has(p.name) && seen.add(p.name))
        .map((p) => ({ ...p, d: dist(o, p), sub: [p.t.cuisine?.split(';')[0]?.replace(/_/g, ' '), p.t['addr:street']].filter(Boolean).join(' · ') }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 25);
      setRes(list);
    } catch (e) {
      setErr(`Não consegui buscar (${e.message}).`);
    } finally { setBusy(false); }
  };
  const toggle = () => { if (open) { setOpen(false); return; } setOpen(true); load(cat); };

  return (
    <div className="map-search nearby">
      <button className={open ? 'on' : ''} onClick={toggle} title="Lugares próximos da atividade selecionada (ou do centro do mapa)">Perto daqui</button>
      {open && (
        <div className="ms-pop nearby-pop">
          <div className="nearby-head">
            {Object.entries(NEARBY).map(([k, v]) => (
              <button key={k} className={`mini${k === cat ? ' on' : ''}`} onClick={() => load(k)} disabled={busy}>{v.label}</button>
            ))}
            <button className="mini" onClick={() => setOpen(false)} title="Fechar" aria-label="Fechar"><Icon name="x" size={14} /></button>
          </div>
          {origin && <div className="muted small nearby-origin">até {fmtM(R)} {origin.label ? `de ${origin.label}` : 'do centro do mapa'}</div>}
          {busy && <div className="muted small">Buscando…</div>}
          {err && <div className="warn soft">{err}</div>}
          {res && res.length === 0 && <div className="muted small">Nada por perto. Aproxime o mapa de outro ponto e tente de novo.</div>}
          {res && res.length > 0 && (
            <ul>
              {res.map((p) => (
                <li key={p.id}>
                  <button onClick={() => { onPick(p.lat, p.lng, p.name, p.t['addr:street'] || '', NEARBY[cat].kind); setOpen(false); }}>
                    <b>{p.name}</b>
                    <span>{fmtM(p.d)}{p.sub ? ` · ${p.sub}` : ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
