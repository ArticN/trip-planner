import { useState } from 'react';
import { Icon } from './icons.jsx';
import { fmtDay } from './util.js';

// cartão do marcador novo: o que é o ponto, como acertar a posição e onde cadastrar
export default function PlaceCard({ place, day, onAdd, onClose }) {
  const [copied, setCopied] = useState(false);
  const coords = `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(coords); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* sem permissão: as coordenadas estão à vista */ }
  };
  return (
    <aside className="pin-panel place-card" aria-label="Ponto marcado no mapa">
      <div className="pp-top">
        <div className="pp-kind"><span className="pc-dot" aria-hidden="true" /> {place.via || 'Ponto no mapa'}</div>
        <button className="icon-btn sm" onClick={onClose} title="Tirar o marcador" aria-label="Tirar o marcador"><Icon name="x" size={14} /></button>
      </div>
      <h3 className="pp-title">{place.loading ? 'Procurando o nome…' : (place.title || 'Ponto sem nome')}{place.local && <small className="muted"> {place.local}</small>}</h3>
      {place.address && <div className="pp-loc">{place.address}</div>}
      {place.approx && <div className="warn soft pad small">Posição aproximada (bairro). Arraste o marcador até o lugar certo.</div>}
      <div className="muted small pc-coords">
        {coords} · <button className="linkish" onClick={copy}>{copied ? 'copiado' : 'copiar'}</button>
      </div>
      <div className="muted small">Arraste o marcador para acertar a posição.</div>
      <div className="pc-actions">
        {day && <button className="primary" onClick={() => onAdd('activity')}>Criar atividade em {fmtDay(day)}</button>}
        <button className={day ? '' : 'primary'} onClick={() => onAdd('idea')}>{day ? 'Guardar como ideia' : 'Criar ideia'}</button>
      </div>
      <div className="pp-links">
        <a href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`} target="_blank" rel="noreferrer">Conferir no Google Maps</a>
      </div>
    </aside>
  );
}
