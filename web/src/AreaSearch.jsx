import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import { fmtDay } from './util.js';
import { searchPlaces } from './geocode.js';
import { AREA_CATS, CAT, RADII, fetchArea, fmtMeters, fmtRadius, metersBetween, sortPlaces } from './places.js';

// "Explorar área": um círculo no mapa e a lista de tudo o que o OpenStreetMap tem dentro dele
// (restaurantes, cafés, atrações, templos, parques, lojas, bares), como a lista do Google Maps.
// O estado fica aqui num hook para o TripView passar o círculo e os pontos ao MapView.
export function useAreaSearch() {
  const [s, setS] = useState(null); // null = fechado
  const gen = useRef(0);
  const ctl = useRef(null);

  const sRef = useRef(null);
  sRef.current = s;

  const run = async (next) => {
    const my = ++gen.current;
    ctl.current?.abort();
    const cur = sRef.current;
    // mesmo centro e raio menor, e nada ficou de fora da busca anterior: só recorta o que já veio
    if (cur?.res && !cur.busy && !next.force && !cur.res.capped.length && cur.lat === next.lat && cur.lng === next.lng && next.radius <= cur.radius) {
      const res = { ...cur.res, places: cur.res.places.filter((p) => p.d <= next.radius) };
      setS({ ...cur, ...next, res, err: '', active: null });
      return;
    }
    setS((c) => ({ cat: 'all', sort: 'star', ...(c || {}), ...next, busy: true, err: '', active: null, show: 60 }));
    const ac = new AbortController();
    ctl.current = ac;
    try {
      const res = await fetchArea(next, next.radius, { signal: ac.signal });
      if (my === gen.current) setS((cur) => (cur ? { ...cur, res, busy: false } : cur));
    } catch (e) {
      if (e.name === 'AbortError' || my !== gen.current) return;
      setS((cur) => (cur ? { ...cur, busy: false, err: `Não consegui buscar (${e.message}).` } : cur));
    }
  };

  const api = {
    state: s,
    open: (o, radius = 1000) => run({ lat: +o.lat.toFixed(5), lng: +o.lng.toFixed(5), label: o.label || '', radius: s?.radius || radius }),
    move: (lat, lng, label = '') => s && run({ lat: +lat.toFixed(5), lng: +lng.toFixed(5), label, radius: s.radius }),
    radius: (r) => s && run({ lat: s.lat, lng: s.lng, label: s.label, radius: r }),
    retry: () => s && run({ lat: s.lat, lng: s.lng, label: s.label, radius: s.radius, force: Date.now() }),
    set: (patch) => setS((cur) => (cur ? { ...cur, ...patch } : cur)),
    close: () => { gen.current++; ctl.current?.abort(); setS(null); },
  };
  useEffect(() => () => ctl.current?.abort(), []);
  return api;
}

// o que a lista mostra com o filtro e a ordem escolhidos (o mapa mostra os mesmos pontos)
export function visiblePlaces(s) {
  if (!s?.res) return [];
  const list = s.cat === 'all' ? s.res.places : s.res.places.filter((p) => p.cat === s.cat);
  return sortPlaces(list, s.sort, s.radius);
}

const googleUrl = (p) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.local || p.name} ${p.lat},${p.lng}`)}`;

export function AreaPanel({ area, day, getView, known = [], onAdd }) {
  const s = area.state;
  const listRef = useRef(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null);
  const [finding, setFinding] = useState(false);
  const places = useMemo(() => visiblePlaces(s), [s?.res, s?.cat, s?.sort, s?.radius]);
  const counts = useMemo(() => {
    const c = { all: s?.res?.places.length || 0 };
    for (const p of s?.res?.places || []) c[p.cat] = (c[p.cat] || 0) + 1;
    return c;
  }, [s?.res]);
  // lugares que já estão no roteiro (mesmo ponto e começo do nome parecido)
  const inTrip = useMemo(() => {
    const set = new Set();
    const k = (x) => (x || '').toLowerCase().replace(/[^a-z0-9぀-ヿ一-鿿]/g, '').slice(0, 5);
    for (const p of s?.res?.places || []) {
      if (known.some((a) => metersBetween(a, p) < 60 && (k(a.title) === k(p.name) || k(a.title) === k(p.local)))) set.add(p.id);
    }
    return set;
  }, [s?.res, known]);

  // tocar num ponto do mapa: a lista rola até ele
  useEffect(() => {
    if (!s?.active) return;
    const i = places.findIndex((p) => p.id === s.active);
    if (i >= (s.show || 60)) area.set({ show: i + 20 });
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-id="${s.active}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }, [s?.active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s) return null;
  const findCenter = async () => {
    if (!q.trim()) return;
    setFinding(true); setFound(null);
    try {
      const r = await searchPlaces(q, getView?.());
      setFound(r.results.slice(0, 5));
    } catch (e) { setFound({ err: e.message }); } finally { setFinding(false); }
  };
  const pickCenter = (r) => { area.move(r.lat, r.lng, `de ${r.title}`); setFound(null); setQ(''); };
  const shown = places.slice(0, s.show || 60);

  return (
    <aside className="area-panel" aria-label="Explorar área">
      <div className="ap-head">
        <div>
          <h3>Explorar área</h3>
          <div className="muted small">até {fmtRadius(s.radius)} {s.label || 'do ponto marcado'}</div>
        </div>
        <button className="icon-btn sm" onClick={area.close} title="Fechar" aria-label="Fechar"><Icon name="x" size={14} /></button>
      </div>

      <div className="ap-center">
        <input
          value={q} onChange={(e) => { setQ(e.target.value); setFound(null); }} placeholder="Mudar o centro: cidade, bairro, lugar"
          aria-label="Mudar o centro da área" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); findCenter(); } if (e.key === 'Escape') setFound(null); }}
        />
        <button className="mini" onClick={() => { const v = getView?.(); if (v) area.move(v.lat, v.lng, 'do centro do mapa'); }} title="Usar o centro do que está na tela">Centro do mapa</button>
      </div>
      {finding && <div className="muted small ap-pad">Procurando…</div>}
      {found && (
        <ul className="ap-found">
          {found.err && <li className="warn soft">Não consegui buscar ({found.err}).</li>}
          {Array.isArray(found) && !found.length && <li className="muted small">Nada encontrado. Inclua a cidade no nome.</li>}
          {Array.isArray(found) && found.map((r) => (
            <li key={r.key}><button onClick={() => pickCenter(r)}><b>{r.title}</b><span>{r.detail}</span></button></li>
          ))}
        </ul>
      )}
      <div className="muted small ap-pad ap-hint">Arraste o ponto do meio do círculo ou toque e segure no mapa para mudar o centro.</div>

      <div className="ap-row" role="group" aria-label="Raio">
        {RADII.map((r) => (
          <button key={r} className={`ap-chip${r === s.radius ? ' on' : ''}`} aria-pressed={r === s.radius} onClick={() => area.radius(r)}>{fmtRadius(r)}</button>
        ))}
      </div>
      <div className="ap-row ap-cats" role="group" aria-label="Categoria">
        <button className={`ap-chip${s.cat === 'all' ? ' on' : ''}`} aria-pressed={s.cat === 'all'} onClick={() => area.set({ cat: 'all', show: 60 })}>Tudo{s.res ? ` ${counts.all}` : ''}</button>
        {AREA_CATS.map((c) => (
          <button key={c.key} className={`ap-chip${s.cat === c.key ? ' on' : ''}`} style={{ '--c': c.color }} aria-pressed={s.cat === c.key} onClick={() => area.set({ cat: c.key, show: 60 })} disabled={s.res && !counts[c.key]}>
            <i aria-hidden="true" />{c.label}{s.res ? ` ${counts[c.key] || 0}` : ''}
          </button>
        ))}
      </div>
      <div className="ap-sort">
        <span className="muted small">{s.busy ? 'Buscando lugares…' : s.res ? `${places.length} ${places.length === 1 ? 'lugar' : 'lugares'}` : ''}</span>
        <div className="ap-seg" role="group" aria-label="Ordem">
          <button className={s.sort === 'star' ? 'on' : ''} aria-pressed={s.sort === 'star'} onClick={() => area.set({ sort: 'star' })} title="Lugares mais conhecidos primeiro">Destaques</button>
          <button className={s.sort === 'near' ? 'on' : ''} aria-pressed={s.sort === 'near'} onClick={() => area.set({ sort: 'near' })}>Mais perto</button>
        </div>
      </div>

      <div className="ap-list" ref={listRef}>
        {s.err && <div className="warn soft ap-pad">{s.err} <button className="linkish" onClick={area.retry}>Tentar de novo</button></div>}
        {s.busy && !s.res && <ul className="ap-skel" aria-hidden="true">{[0, 1, 2, 3].map((i) => <li key={i}><i /><i /></li>)}</ul>}
        {s.res && !s.busy && places.length === 0 && <div className="muted small ap-pad">Nada {s.cat === 'all' ? '' : `de ${CAT[s.cat].label.toLowerCase()} `}nessa área. Aumente o raio ou mude o centro.</div>}
        {places.length > 0 && (
          <ul className={s.busy ? 'stale' : ''}>
            {shown.map((p) => {
              const on = p.id === s.active;
              return (
                <li key={p.id} data-id={p.id} className={on ? 'on' : ''} style={{ '--c': CAT[p.cat].color }}>
                  <button className="ap-item" onClick={() => area.set({ active: on ? null : p.id })} aria-expanded={on}>
                    <span className="ap-name">
                      <i aria-hidden="true" />
                      <b>{p.name}</b>
                      {p.star && <em className="ap-star" title="Lugar conhecido (tem página na Wikipédia)">Destaque</em>}
                      {inTrip.has(p.id) && <em className="ap-mine">No roteiro</em>}
                    </span>
                    {p.local && <small className="ap-local">{p.local}</small>}
                    <span className="ap-meta">{p.type} · {fmtMeters(p.d)}</span>
                    {p.address && <span className="ap-addr">{p.address}</span>}
                  </button>
                  {on && (
                    <div className="ap-more">
                      {p.hours && <div className="small"><span className="muted">Horário (OSM):</span> {p.hours}</div>}
                      <div className="ap-actions">
                        {day && <button className="primary" onClick={() => onAdd(p, 'activity')}>Adicionar em {fmtDay(day)}</button>}
                        <button className={day ? '' : 'primary'} onClick={() => onAdd(p, 'idea')}>{day ? 'Guardar como ideia' : 'Criar ideia'}</button>
                      </div>
                      <div className="pp-links">
                        <a href={googleUrl(p)} target="_blank" rel="noreferrer">Notas e fotos no Google Maps</a>
                        {p.website && <a href={p.website} target="_blank" rel="noreferrer">Site</a>}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {places.length > shown.length && (
          <button className="ap-showmore" onClick={() => area.set({ show: (s.show || 60) + 60 })}>Mostrar mais ({places.length - shown.length})</button>
        )}
        {s.res?.capped.length > 0 && (
          <div className="muted small ap-pad">Tem mais {s.res.capped.map((k) => CAT[k].label.toLowerCase()).join(', ')} nessa área do que a lista mostra. Diminua o raio para ver todos.</div>
        )}
        {s.res && <div className="muted small ap-pad ap-src">Lugares do OpenStreetMap, que não tem notas: “Destaque” é o lugar conhecido o bastante para ter página na Wikipédia. Para notas e fotos, abra no Google Maps.</div>}
      </div>
    </aside>
  );
}
