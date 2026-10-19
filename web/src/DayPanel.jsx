import { Stars } from './Stars.jsx';
import { parseLinks, linkLabel } from './Extras.jsx';
import { useEffect, useState } from 'react';
import {
  KINDS, KIND_KEYS, hasCoords, duration, fmtDuration, haversine, fmtKm, fmtDayLong, daysBetween, endDayOf, toMin, directionsUrl, sunTimes,
} from './util.js';

function Gap({ a, b }) {
  if (!hasCoords(a) || !hasCoords(b)) return null;
  const km = haversine(a, b);
  if (km < 0.05) return null;
  const walk = km <= 2.5 ? ` · ~${Math.max(1, Math.round((km / 4.5) * 60))} min a pé` : '';
  return <div className="gap">↓ {fmtKm(km)} em linha reta{walk}</div>;
}

// tema do dia (ex.: "Templos de Higashiyama") e anotações livres
function DayInfo({ info, onSave }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const open = () => { setTitle(info?.title || ''); setNotes(info?.notes || ''); setEditing(true); };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await onSave({ title, notes }); setEditing(false); } finally { setBusy(false); }
  };
  if (editing) {
    return (
      <form className="dayinfo-form" onSubmit={save}>
        <input autoFocus placeholder="Tema do dia (ex.: templos e Gion)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        <textarea rows={3} placeholder="Anotações do dia: lembretes, plano B se chover…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="dayinfo-actions">
          <button type="button" className="mini" onClick={() => setEditing(false)}>Cancelar</button>
          <button className="mini primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </form>
    );
  }
  if (!info?.title && !info?.notes) return <button className="dayinfo-add" onClick={open}>+ Tema e anotações do dia</button>;
  return (
    <button className="dayinfo" onClick={open} title="Editar tema e anotações">
      {info.title && <span className="dayinfo-title">{info.title}</span>}
      {info.notes && <span className="dayinfo-notes">{info.notes}</span>}
    </button>
  );
}

export default function DayPanel({
  day, dayIndex, items, cityMap, stay, checkout, conflicts, selectedId, onSelect, onEdit, onToggleDone, onAdd,
  onReorder, onSortTime, kinds, onToggleKind, fx, onPrev, onNext, hasPrev, hasNext, tripTz, now = null, dayInfo = null, onSaveDayInfo,
}) {
  // atividade escolhida (no mapa ou na busca) fica visível na lista
  useEffect(() => {
    if (selectedId != null) document.querySelector('.daypanel .item.sel')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId, day]);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  const cities = [...new Set(items.map((a) => a.city).filter((c) => c && c !== 'transito'))];
  const cost = items.reduce((s, a) => s + (a.cost || 0), 0);
  const spent = items.reduce((s, a) => s + (a.spent || 0), 0);
  const hasSpent = items.some((a) => a.spent != null);
  const geo = items.filter((a) => hasCoords(a) && a.kind !== 'flight');
  let dist = 0;
  for (let i = 0; i < geo.length - 1; i++) dist += haversine(geo[i], geo[i + 1]);
  const doneCount = items.filter((a) => a.done).length;
  const missing = items.filter((a) => !hasCoords(a) && a.kind !== 'free').length;
  const visible = items.filter((a) => kinds.has(a.kind));
  // sol: no primeiro ponto do dia que não seja voo; senão, na hospedagem
  const here = items.find((a) => hasCoords(a) && a.kind !== 'flight') || (hasCoords(stay) ? stay : null);
  const sun = here && tripTz ? sunTimes(day, here.lat, here.lng, tripTz) : null; // sem fuso da viagem o horário sairia errado
  // hoje: o que está acontecendo agora, ou a próxima atividade ainda não feita
  const nowId = now == null ? null : (visible.find((a) => !a.done && a.start && a.end && toMin(a.start) <= now && now < toMin(a.end) && endDayOf(a) === a.day)
    || visible.find((a) => !a.done && a.start && toMin(a.start) >= now))?.id ?? null;
  const nowLabel = (a) => (toMin(a.start) <= now ? 'Agora' : 'Próxima');

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
        {onSaveDayInfo && <DayInfo key={day} info={dayInfo} onSave={onSaveDayInfo} />}
        <div className="chips">
          {cities.map((k) => (
            <span key={k} className="chip" style={{ '--c': cityMap[k]?.color }}>{cityMap[k]?.emoji} {cityMap[k]?.name || k}</span>
          ))}
        </div>
        {sun && <div className="stay-line sun-line">Sol nasce às {sun.rise} e se põe às {sun.set}</div>}
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
          {hasSpent
            ? <div><b>{fx.fmt(spent)}</b><span>gasto{cost ? ` de ${fx.fmt(cost)} previstos` : ''}</span></div>
            : <div><b>{cost ? fx.fmt(cost) : '—'}</b><span>{cost ? (fx.fmtHome(cost) || 'custo previsto') : 'sem custos'}</span></div>}
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
          const dur = duration(a, tripTz);
          const endDay = endDayOf(a);
          const endPlus = a.end && endDay !== a.day ? ` (+${daysBetween(a.day, endDay)}d)` : '';
          const leg = a.from_code || a.to_code || a.ref;
          const cls = ['item', a.id === nowId ? 'now' : '', a.id === selectedId ? 'sel' : '', a.done ? 'done' : '', conflicts.has(a.id) ? 'conflict' : '', dragId === a.id ? 'dragging' : '', overId === a.id ? 'over' : ''].join(' ');
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
                    {a.id === nowId && <span className="now-badge">{nowLabel(a)}</span>}
                  </div>
                  {leg && (
                    <div className="leg">
                      {a.from_code && <b>{a.from_code}</b>} {a.start}
                      {(a.to_code || a.end) && <> → {a.to_code && <b>{a.to_code}</b>} {a.end}{endPlus}</>}
                      {a.ref && <span className="muted"> · {a.ref}</span>}
                      {a.start_tz && a.end_tz && a.start_tz !== a.end_tz && <span className="muted"> · horários locais</span>}
                    </div>
                  )}
                  {a.location && <div className="loc">{a.location}</div>}
                  {a.details && <div className="det">{a.details}</div>}
                  {a.notes && <div className="note">{a.notes}</div>}
                  {(a.rating || a.review) && (
                    <div className="review">
                      {a.rating ? <Stars value={a.rating} /> : null}
                      {a.review && <span>{a.review}</span>}
                    </div>
                  )}
                  {(parseLinks(a.links).length > 0 || hasCoords(a)) && (
                    <div className="links">
                      {hasCoords(a) && <a href={directionsUrl(a)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Como chegar</a>}
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
