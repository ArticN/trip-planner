import { useEffect, useState } from 'react';
import { Stars } from './Stars.jsx';
import { wikiSummary, wikiCached } from './wiki.js';
import { FileList } from './Attachments.jsx';
import { Icon } from './icons.jsx';
import { parseLinks, linkLabel } from './Extras.jsx';
import { KINDS, hasCoords, duration, fmtDuration, fmtDayLong, endDayOf, directionsUrl } from './util.js';

// painel de detalhes da atividade escolhida no mapa (substitui o balão pequeno do pin)
export default function PinPanel({ a, n, group = null, onAltStep, cityMap, fx, tripTz, onEdit, onToggleDone, onClose, files = [] }) {
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
        <div className="pp-kind" style={{ color: k.color }}><Icon name={a.kind in KINDS ? a.kind : 'sight'} /> {k.label}{n ? ` · #${n}` : ''}{city ? ` · ${city.name}` : ''}</div>
        <button className="icon-btn sm" onClick={onClose} title="Fechar" aria-label="Fechar"><Icon name="x" size={14} /></button>
      </div>
      {group?.alts && onAltStep && (
        <div className="pp-alts">
          <button className="alt-arrow" onClick={() => onAltStep(group, -1)} aria-label="Opção anterior" title="Opção anterior">‹</button>
          <span className="alt-dots" aria-hidden="true">{group.alts.map((x, i) => <i key={x.id} className={i === group.altIndex ? 'on' : ''} />)}</span>
          <span className="alt-count" aria-live="polite">Opção {group.altIndex + 1} de {group.alts.length}{group.altIndex === 0 ? ' · principal' : ''}</span>
          <button className="alt-arrow" onClick={() => onAltStep(group, 1)} aria-label="Próxima opção" title="Próxima opção">›</button>
        </div>
      )}
      <h3 className="pp-title">{a.title}</h3>
      <div className="pp-when">{when}</div>
      {a.location && <div className="pp-loc">{a.location}</div>}
      {a.details && <p className="pp-text">{a.details}</p>}
      {a.notes && <p className="pp-text pp-notes">{a.notes}</p>}
      {(a.rating || a.review) && (
        <p className="pp-text review">
          {a.rating ? <Stars value={a.rating} /> : null}
          {a.review && <span>{a.review}</span>}
        </p>
      )}
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
      <FileList files={files} />
      {WIKI_KINDS.has(a.kind) && <Wiki key={a.id} a={a} />}
      {onEdit && (
        <div className="pp-actions">
          <button onClick={() => onToggleDone(a)}>{a.done ? 'Marcar como não feita' : 'Marcar como feita'}</button>
          <button className="primary" onClick={() => onEdit(a.id)}>Editar</button>
        </div>
      )}
    </aside>
  );
}

const WIKI_KINDS = new Set(['sight', 'shop', 'stay']);

// resumo sob demanda: só busca quando a pessoa pede (e guarda a resposta no aparelho)
function Wiki({ a }) {
  const [st, setSt] = useState({ state: 'idle' });
  const load = () => {
    setSt({ state: 'loading' });
    wikiSummary(a).then((r) => setSt({ state: r ? 'ok' : 'none', r })).catch(() => setSt({ state: 'error' }));
  };
  useEffect(() => {
    // se já foi buscado antes, mostra direto
    if (wikiCached(a)) load();
  }, []);
  if (st.state === 'idle') return <button className="mini pp-wiki-btn" onClick={load}>Sobre este lugar (Wikipédia)</button>;
  if (st.state === 'loading') return <div className="pp-wiki muted small">Procurando na Wikipédia…</div>;
  if (st.state === 'none') return <div className="pp-wiki muted small">Não achei este lugar na Wikipédia.</div>;
  if (st.state === 'error') return <div className="pp-wiki muted small">A Wikipédia não respondeu. <button className="mini" onClick={load}>Tentar de novo</button></div>;
  const { r } = st;
  return (
    <div className="pp-wiki">
      {r.img && <img src={r.img} alt="" loading="lazy" />}
      <div>
        <b>{r.title}</b>
        <p>{r.text}</p>
        <a href={r.url} target="_blank" rel="noreferrer">Ler na Wikipédia{r.lang === 'en' ? ' (inglês)' : ''}</a>
      </div>
    </div>
  );
}
