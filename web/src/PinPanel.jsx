import { parseLinks, linkLabel } from './Extras.jsx';
import { KINDS, hasCoords, duration, fmtDuration, fmtDayLong, endDayOf, directionsUrl } from './util.js';

// painel de detalhes da atividade escolhida no mapa (substitui o balão pequeno do pin)
export default function PinPanel({ a, n, cityMap, fx, tripTz, onEdit, onToggleDone, onClose }) {
  const k = KINDS[a.kind] || KINDS.sight;
  const city = cityMap[a.city];
  const dur = duration(a, tripTz);
  const end = endDayOf(a);
  const links = parseLinks(a.links);
  const when = [
    fmtDayLong(a.day),
    a.start ? `${a.start}${a.end ? `–${a.end}` : ''}${end !== a.day ? ` (chega ${fmtDayLong(end)})` : ''}` : null,
    dur != null ? fmtDuration(dur) : null,
  ].filter(Boolean).join(' · ');

  return (
    <aside className="pin-panel" aria-label="Detalhes da atividade">
      <div className="pp-top">
        <div className="pp-kind" style={{ color: k.color }}>{k.icon} {k.label}{n ? ` · #${n}` : ''}{city ? ` · ${city.name}` : ''}</div>
        <button className="icon-btn sm" onClick={onClose} title="Fechar" aria-label="Fechar">×</button>
      </div>
      <h3 className="pp-title">{a.title}</h3>
      <div className="pp-when">{when}</div>
      {a.location && <div className="pp-loc">{a.location}</div>}
      {a.details && <p className="pp-text">{a.details}</p>}
      {a.notes && <p className="pp-text pp-notes">{a.notes}</p>}
      {(a.cost != null || a.spent != null) && (
        <div className="pp-money">
          {a.cost != null && <span>Previsto <b>{fx.fmt(a.cost)}</b></span>}
          {a.spent != null && <span>Gasto <b>{fx.fmt(a.spent)}</b></span>}
        </div>
      )}
      {(links.length > 0 || hasCoords(a)) && (
        <div className="pp-links">
          {hasCoords(a) && <a href={directionsUrl(a)} target="_blank" rel="noreferrer">Como chegar</a>}
          {hasCoords(a) && <a href={`https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}`} target="_blank" rel="noreferrer">Google Maps</a>}
          {links.map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer">{linkLabel(l)}</a>)}
        </div>
      )}
      <div className="pp-actions">
        <button onClick={() => onToggleDone(a)}>{a.done ? 'Marcar como não feita' : 'Marcar como feita'}</button>
        <button className="primary" onClick={() => onEdit(a.id)}>Editar</button>
      </div>
    </aside>
  );
}
