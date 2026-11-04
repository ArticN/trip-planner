import { useEffect, useRef, useState } from 'react';
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
