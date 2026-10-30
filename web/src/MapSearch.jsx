import { useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import { OSM_LANG, osmName } from './osmName.js';

// busca de lugares sobre o mapa (OpenStreetMap Nominatim); escolher um resultado abre o cadastro já preenchido
export function MapSearch({ onPick }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true); setErr(''); setRes(null);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&${OSM_LANG}&q=${encodeURIComponent(q)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setRes(await r.json());
    } catch (e) {
      setErr(`Não consegui buscar (${e.message}).`);
    } finally { setBusy(false); }
  };
  const close = () => { setRes(null); setErr(''); };

  return (
    <div className="map-search">
      <input
        ref={inputRef} value={q} placeholder="Buscar lugar para adicionar"
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') search(); if (e.key === 'Escape') { close(); inputRef.current?.blur(); } }}
      />
      {busy && <div className="ms-pop muted small">Buscando…</div>}
      {err && <div className="ms-pop warn soft">{err}</div>}
      {res && (
        <ul className="ms-pop">
          {res.length === 0 && <li className="muted small">Nada encontrado. Inclua a cidade no nome.</li>}
          {res.map((r) => {
            const { title, local } = osmName(r);
            return (
              <li key={r.place_id}>
                <button onClick={() => { const parts = r.display_name.split(','); onPick(parseFloat(r.lat), parseFloat(r.lon), title, parts.slice(1, 3).join(',').trim()); close(); setQ(''); }}>
                  <b>{title}{local && <small> {local}</small>}</b>
                  <span>{r.display_name}</span>
                </button>
              </li>
            );
          })}
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
