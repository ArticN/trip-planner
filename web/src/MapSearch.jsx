import { useRef, useState } from 'react';

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
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=pt-BR&q=${encodeURIComponent(q)}`);
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
          {res.map((r) => (
            <li key={r.place_id}>
              <button onClick={() => { const parts = r.display_name.split(','); onPick(parseFloat(r.lat), parseFloat(r.lon), r.name || parts[0], parts.slice(1, 3).join(',').trim()); close(); setQ(''); }}>
                <b>{r.name || r.display_name.split(',')[0]}</b>
                <span>{r.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
