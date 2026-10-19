import { parseLinks, linkLabel } from './Extras.jsx';
import { useState } from 'react';
import {
  KINDS, KIND_KEYS, hasCoords, duration, fmtDuration, haversine, fmtKm, fmtDayLong, daysBetween,
} from './util.js';

function Gap({ a, b }) {
  if (!hasCoords(a) || !hasCoords(b)) return null;
  const km = haversine(a, b);
  if (km < 0.05) return null;
  const walk = km <= 2.5 ? ` · ~${Math.max(1, Math.round((km / 4.5) * 60))} min a pé` : '';
  return <div className="gap">↓ {fmtKm(km)} em linha reta{walk}</div>;
}

export default function DayPanel({
  day, dayIndex, items, cityMap, stay, checkout, conflicts, selectedId, onSelect, onEdit, onToggleDone, onAdd,
  onReorder, onSortTime, kinds, onToggleKind, fx, onPrev, onNext, hasPrev, hasNext,
}) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  const cities = [...new Set(items.map((a) => a.city).filter((c) => c && c !== 'transito'))];
  const cost = items.reduce((s, a) => s + (a.cost || 0), 0);
  const geo = items.filter((a) => hasCoords(a) && a.kind !== 'flight');
  let dist = 0;
  for (let i = 0; i < geo.length - 1; i++) dist += haversine(geo[i], geo[i + 1]);
  const doneCount = items.filter((a) => a.done).length;
  const missing = items.filter((a) => !hasCoords(a) && a.kind !== 'free').length;
  const visible = items.filter((a) => kinds.has(a.kind));

  const drop = (targetId) => {
    if (dragId == null || dragId === targetId) return;
    const ids = items.map((a) => a.id).filter((id) => id !== dragId);
    const at = ids.indexOf(targetId);
    ids.splice(at, 0, dragId);
    onReorder(ids);
  };

  return (
    <div className="daypanel">
      <div className="day-head">
        <div className="day-nav">
          <button className="icon-btn" onClick={onPrev} disabled={!hasPrev} title="Dia anterior (←)">‹</button>
          <div>
            <div className="day-kicker">Dia {dayIndex + 1}</div>
            <h2 className="day-title">{fmtDayLong(day)}</h2>
          </div>
          <button className="icon-btn" onClick={onNext} disabled={!hasNext} title="Próximo dia (→)">›</button>
        </div>
        <div className="chips">
          {cities.map((k) => (
            <span key={k} className="chip" style={{ '--c': cityMap[k]?.color }}>{cityMap[k]?.emoji} {cityMap[k]?.name || k}</span>
          ))}
        </div>
        {checkout && <div className="stay-line">Check-out · {checkout.name}{checkout.check_out_time ? ` às ${checkout.check_out_time}` : ''}</div>}
        {stay && (
          <div className="stay-line">
            {stay.check_in === day ? 'Check-in' : 'Hospedagem'} · {stay.name}
            {stay.check_in === day && stay.check_in_time ? ` a partir das ${stay.check_in_time}` : ''}
            {stay.check_out === day && stay.check_out_time ? ` · saída às ${stay.check_out_time}` : ''}
            {stay.booking ? ` · reserva ${stay.booking}` : ''}
            {stay.link ? <> · <a href={stay.link} target="_blank" rel="noreferrer">ver reserva</a></> : null}
          </div>
        )}
        <div className="stats">
          <div><b>{items.length}</b><span>atividades</span></div>
          <div><b>{cost ? fx.fmt(cost) : '—'}</b><span>{cost ? (fx.fmtHome(cost) || 'custo do dia') : 'sem custos'}</span></div>
          <div><b>{dist ? fmtKm(dist) : '—'}</b><span>em linha reta</span></div>
          <div><b>{doneCount}/{items.length}</b><span>feitas</span></div>
        </div>
        {(conflicts.size > 0 || missing > 0) && (
          <div className="warns">
            {conflicts.size > 0 && <span className="warn">{conflicts.size} atividades com horário sobreposto</span>}
            {missing > 0 && <span className="warn soft">{missing} sem local no mapa</span>}
          </div>
        )}
      </div>

      <div className="filters">
        {KIND_KEYS.map((k) => (
          <button key={k} className={`fchip${kinds.has(k) ? ' on' : ''}`} style={{ '--c': KINDS[k].color }} onClick={() => onToggleKind(k)} title={KINDS[k].label}>
            {KINDS[k].icon}
          </button>
        ))}
        <span className="spacer" />
        <button className="mini" onClick={onSortTime} title="Reordena as atividades com horário">Ordenar por horário</button>
      </div>

      {items.length === 0 && (
        <div className="empty">
          Nada planejado pra esse dia ainda.
          <br />Use <b>＋ Atividade</b> pra começar.
        </div>
      )}

      <ol className="timeline">
        {visible.map((a) => {
          const k = KINDS[a.kind] || KINDS.sight;
          const idx = items.indexOf(a);
          const prev = idx > 0 ? items[idx - 1] : null;
          const dur = duration(a);
          const endPlus = a.end_day && a.end_day !== a.day ? ` (+${daysBetween(a.day, a.end_day)}d)` : '';
          const cls = ['item', a.id === selectedId ? 'sel' : '', a.done ? 'done' : '', conflicts.has(a.id) ? 'conflict' : '', dragId === a.id ? 'dragging' : '', overId === a.id ? 'over' : ''].join(' ');
          return (
            <li key={a.id}>
              {prev && kinds.has(prev.kind) && <Gap a={prev} b={a} />}
              <div
                className={cls}
                draggable
                onDragStart={(e) => { setDragId(a.id); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => { e.preventDefault(); if (overId !== a.id) setOverId(a.id); }}
                onDragLeave={() => setOverId((o) => (o === a.id ? null : o))}
                onDrop={(e) => { e.preventDefault(); drop(a.id); setDragId(null); setOverId(null); }}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                onClick={() => onSelect(a.id)}
              >
                <div className="time">
                  {a.start ? (
                    <>
                      <b>{a.start}</b>
                      {a.end && <span>{a.end}{endPlus}</span>}
                    </>
                  ) : (
                    <span className="notime">—</span>
                  )}
                </div>
                <div className="pin-mini" style={{ '--c': k.color }} title={k.label}>{idx + 1}</div>
                <div className="body">
                  <div className="title-row">
                    <span className="title">{a.title}</span>
                  </div>
                  {a.location && <div className="loc">{a.location}</div>}
                  {a.details && <div className="det">{a.details}</div>}
                  {a.notes && <div className="note">{a.notes}</div>}
                  {parseLinks(a.links).length > 0 && (
                    <div className="links">
                      {parseLinks(a.links).map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{linkLabel(l)}</a>)}
                    </div>
                  )}
                  <div className="tags">
                    <span className="tag" style={{ '--c': k.color }}>{k.icon} {k.label}</span>
                    {dur != null && <span className="tag">⏱ {fmtDuration(dur)}</span>}
                    {a.transport && <span className="tag">{a.transport}</span>}
                    {a.cost > 0 && <span className="tag cost">{fx.fmt(a.cost)}</span>}
                    {!hasCoords(a) && a.kind !== 'free' && <span className="tag warn">sem local</span>}
                    {conflicts.has(a.id) && <span className="tag warn">sobreposto</span>}
                  </div>
                </div>
                <div className="actions">
                  <button className={`check${a.done ? ' on' : ''}`} title="Marcar como feito" onClick={(e) => { e.stopPropagation(); onToggleDone(a); }}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.5" /></svg></button>
                  <button className="icon-btn sm" title="Editar" onClick={(e) => { e.stopPropagation(); onEdit(a.id); }}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 13.5l.7-3L11 2.7a1.4 1.4 0 012 2L5.5 12.8z" /></svg></button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="day-foot">
        <button className="primary" onClick={onAdd}>＋ Atividade</button>
      </div>
    </div>
  );
}
