import { Stars } from './Stars.jsx';
import { parseLinks, linkLabel } from './Extras.jsx';
import { Fragment, useEffect, useState } from 'react';
import { api } from './api.js';
import { Icon } from './icons.jsx';
import WeatherLine from './WeatherLine.jsx';
import { travelTime, slack, gmapsDirections } from './travel.js';
import {
  KINDS, KIND_KEYS, SLOTS, hasCoords, duration, fmtDuration, haversine, fmtKm, fmtDayLong, daysBetween, endDayOf, toMin, directionsUrl, sunTimes, DONE_FILTERS, passDone, nowIn,
} from './util.js';

const MODE_LABEL = { foot: 'a pé', car: 'de carro', transit: 'de transporte' };

// o intervalo entre duas atividades desenhado como tempo: a altura acompanha os minutos livres,
// e o trecho cheio do eixo é o deslocamento estimado
const PX_PER_MIN = 0.5;

function Gap({ a, b }) {
  const [t, setT] = useState(null);
  const ok = hasCoords(a) && hasCoords(b) && haversine(a, b) >= 0.05;
  const isMove = ['move', 'flight'].includes(a.kind) || ['move', 'flight'].includes(b.kind);
  useEffect(() => {
    let live = true;
    if (ok && !isMove) travelTime(a, b).then((v) => live && setT(v)).catch(() => {});
    return () => { live = false; };
  }, [a.lat, a.lng, b.lat, b.lng, b.transport, ok, isMove]);
  const free = slack(a, b);
  const move = ok && !isMove && t ? t.min : 0;
  const rest = free != null ? free - move : null;
  if (!ok && !(rest >= 30)) return null;
  const tight = !!move && free != null && free < move;
  const h = free > 0 ? Math.min(150, Math.max(20, free * PX_PER_MIN)) : 20;
  const fill = tight ? 100 : free > 0 && move ? Math.min(100, (move / free) * 100) : 0;
  return (
    <div className={`gap${tight ? ' tight' : ''}`} style={{ '--h': `${h}px` }}>
      <span className="gap-axis" aria-hidden="true"><i style={{ height: `${fill}%` }} /></span>
      <span className="gap-txt">
        {ok && (isMove || !t
          ? <>{fmtKm(haversine(a, b))} em linha reta</>
          : <>{fmtKm(t.km)} {MODE_LABEL[t.mode]} · {t.estimate ? '~' : ''}{fmtDuration(t.min)}</>)}
        {tight && <b> · {free < 0 ? 'horários se sobrepõem' : free === 0 ? 'sem tempo para chegar' : `só ${free} min entre as duas`}</b>}
        {!tight && rest >= 30 && <span className="gap-free">{ok ? ' · ' : ''}{fmtDuration(rest)} livre</span>}
        {ok && !isMove && t && <>{' · '}<a href={gmapsDirections(a, b, t.mode)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>rota</a></>}
      </span>
    </div>
  );
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
  day, dayIndex, items, cityMap, stay, checkout, conflicts, selectedId, onSelect, onEdit, onToggleDone, onAdd, onMoveSlot,
  onReorder, onSortTime, kinds, onToggleKind, fx, onPrev, onNext, hasPrev, hasNext, tripTz, now = null, dayInfo = null, onSaveDayInfo, doneFilter = 'all', onDoneFilter, files = [],
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
  const visible = items.filter((a) => kinds.has(a.kind) && passDone(a, doneFilter));
  // sol: no primeiro ponto do dia que não seja voo; senão, na hospedagem
  const here = items.find((a) => hasCoords(a) && a.kind !== 'flight') || (hasCoords(stay) ? stay : null);
  const sun = here && tripTz ? sunTimes(day, here.lat, here.lng, tripTz) : null; // sem fuso da viagem o horário sairia errado
  // hoje: o que está acontecendo agora, ou a próxima atividade ainda não feita
  const nowId = now == null ? null : (visible.find((a) => !a.done && a.start && a.end && toMin(a.start) <= now && now < toMin(a.end) && endDayOf(a) === a.day)
    || visible.find((a) => !a.done && a.start && toMin(a.start) >= now))?.id ?? null;
  const nowLabel = (a) => (toMin(a.start) <= now ? 'Agora' : 'Próxima');

  const drop = (targetId) => {
    if (dragId == null || dragId === targetId) return;
    const target = items.find((a) => a.id === targetId);
    const dragged = items.find((a) => a.id === dragId);
    if (target && dragged && target.slotKey !== dragged.slotKey) onMoveSlot?.(dragId, target.slotKey);
    const ids = items.map((a) => a.id).filter((id) => id !== dragId);
    const at = ids.indexOf(targetId);
    ids.splice(at, 0, dragId);
    onReorder(ids);
  };

  // soltar sobre o título de um bloco leva a atividade para o fim dele
  const dropOnSlot = (slotKey) => {
    if (dragId == null) return;
    const dragged = items.find((a) => a.id === dragId);
    if (dragged && dragged.slotKey !== slotKey) onMoveSlot?.(dragId, slotKey);
    const rank = SLOTS.findIndex((x) => x.key === slotKey);
    const ids = items.filter((a) => a.id !== dragId && SLOTS.findIndex((x) => x.key === a.slotKey) <= rank).map((a) => a.id);
    const rest = items.filter((a) => a.id !== dragId && SLOTS.findIndex((x) => x.key === a.slotKey) > rank).map((a) => a.id);
    onReorder([...ids, dragId, ...rest]);
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
        {(() => {
          const c = cityMap[cities[0]];
          const at = c && c.lat != null ? c : here;
          return at ? <WeatherLine lat={at.lat} lng={at.lng} day={day} today={nowIn(tripTz).day} /> : null;
        })()}
        {sun && <div className="stay-line sun-line">Sol nasce às {sun.rise} e se põe às {sun.set}</div>}
        {checkout && (
          <div className="stay-card out">
            <Icon name="checkout" size={20} />
            <div>
              <small>Check-out{checkout.check_out_time ? ` até ${checkout.check_out_time}` : ''}</small>
              <b>{checkout.name}</b>
            </div>
          </div>
        )}
        {stay && (
          <div className={`stay-card ${stay.check_in === day ? 'in' : 'here'}`}>
            <Icon name={stay.check_in === day ? 'checkin' : 'stay'} size={20} />
            <div>
              <small>
                {stay.check_in === day ? `Check-in${stay.check_in_time ? ` a partir das ${stay.check_in_time}` : ''}` : 'Hospedagem'}
                {stay.check_out === day && stay.check_out_time ? ` · saída às ${stay.check_out_time}` : ''}
              </small>
              <b>{stay.name}</b>
              {(stay.booking || stay.link) && (
                <span>
                  {stay.booking ? `Reserva ${stay.booking}` : ''}
                  {stay.booking && stay.link ? ' · ' : ''}
                  {stay.link ? <a href={stay.link} target="_blank" rel="noreferrer">ver reserva</a> : null}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="stats">
          <div><b>{items.length}</b><span>atividades</span></div>
          {hasSpent
            ? <div><b>{fx.fmt(spent)}</b><span title={cost ? `gasto de ${fx.fmt(cost)} previstos` : undefined}>gasto{cost ? ` de ${fx.fmt(cost)} previstos` : ''}</span></div>
            : <div><b>{cost ? fx.fmt(cost) : '—'}</b><span>{cost ? (fx.fmtHome(cost) || 'custo previsto') : 'sem custos'}</span></div>}
          <div><b>{dist ? fmtKm(dist) : '—'}</b><span>em linha reta</span></div>
          <div><b>{doneCount}/{items.length}</b><span>feitas</span></div>
        </div>
        {(conflicts.size > 0 || missing > 0) && (
          <div className="issues-line">
            <Icon name="warn" size={14} />
            {[conflicts.size > 0 && `${conflicts.size} com horário sobreposto`, missing > 0 && `${missing} sem local no mapa`].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      <div className="filters">
        {KIND_KEYS.map((k) => (
          <button key={k} className={`fchip${kinds.has(k) ? ' on' : ''}`} style={{ '--c': KINDS[k].color }} onClick={() => onToggleKind(k)} title={KINDS[k].label}>
            <Icon name={k} size={17} />
          </button>
        ))}
      </div>
      <div className="filters">
        <DoneFilter value={doneFilter} onChange={onDoneFilter} />
        <span className="spacer" />
        <button className="mini" onClick={onSortTime} title="Reordena as atividades com horário">Ordenar por horário</button>
      </div>
      {items.length > 0 && visible.length === 0 && <div className="empty small">Nenhuma atividade com esses filtros.</div>}

      {items.length === 0 && (
        <div className="empty">
          Nada planejado pra esse dia ainda.
          <br />Use <b>＋ Atividade</b> pra começar.
        </div>
      )}

      {nowId != null && (() => {
        // painel de estação: anterior pequena, a atual grande, a seguinte pequena
        const i = visible.findIndex((a) => a.id === nowId);
        const cur = visible[i];
        const before = visible[i - 1];
        const after = visible[i + 1];
        const side = (a, label) => (a ? (
          <button className="nb-side" onClick={() => onSelect(a.id)}>
            <small>{label}{a.start ? ` · ${a.start}` : ''}</small>
            <span>{a.title}</span>
          </button>
        ) : <span className="nb-side empty" />);
        return (
          <div className="now-board" aria-label="Agora">
            {side(before, 'Antes')}
            <button className="nb-cur" style={{ '--c': (KINDS[cur.kind] || KINDS.sight).color }} onClick={() => onSelect(cur.id)}>
              <small>{nowLabel(cur)}{cur.start ? ` · ${cur.start}${cur.end ? `–${cur.end}` : ''}` : ''}</small>
              <b>{cur.title}</b>
              {cur.location && <span>{cur.location}</span>}
            </button>
            {side(after, 'Depois')}
          </div>
        );
      })()}

      <ol className="timeline">
        {SLOTS.map((slot) => {
          const here = visible.filter((a) => a.slotKey === slot.key);
          return (
          <Fragment key={slot.key}>
          <li
            className={`slot-h${here.length ? '' : ' empty'}${slot.meal ? ' meal' : ''}`}
            onDragOver={(e) => { if (dragId != null) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); dropOnSlot(slot.key); setDragId(null); setOverId(null); }}
          >
            <span className="slot-name">{slot.label}</span>
            <span className="slot-n">{here.length ? `${here.length}` : 'livre'}</span>
            <button type="button" className="slot-add" onClick={() => onAdd(slot.key)} title={`Adicionar em: ${slot.label}`} aria-label={`Adicionar em: ${slot.label}`}>+</button>
          </li>
        {here.map((a) => {
          const k = KINDS[a.kind] || KINDS.sight;
          const idx = items.indexOf(a);
          const prev = idx > 0 ? items[idx - 1] : null;
          const dur = duration(a, tripTz);
          const endDay = endDayOf(a);
          const endPlus = a.end && endDay !== a.day ? ` (+${daysBetween(a.day, endDay)}d)` : '';
          const leg = a.from_code || a.to_code || a.ref;
          const cls = ['item', ['flight', 'move'].includes(a.kind) ? 'ticket' : '', a.id === nowId ? 'now' : '', a.id === selectedId ? 'sel' : '', a.done ? 'done' : '', conflicts.has(a.id) ? 'conflict' : '', dragId === a.id ? 'dragging' : '', overId === a.id ? 'over' : ''].join(' ');
          return (
            <li key={a.id}>
              {prev && visible.includes(prev) && <Gap a={prev} b={a} />}
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
                  {(parseLinks(a.links).length > 0 || hasCoords(a) || files.some((f) => f.activity_id === a.id && (f.kind || 'doc') === 'doc')) && (
                    <div className="links">
                      {hasCoords(a) && <a href={directionsUrl(a)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Como chegar</a>}
                      {parseLinks(a.links).map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{linkLabel(l)}</a>)}
                      {files.filter((f) => f.activity_id === a.id && (f.kind || 'doc') === 'doc').map((f) => (
                        <a key={`f${f.id}`} className="file-link" href={api.fileUrl(f.id)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title={f.name}>
                          <Clip />{f.name}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="tags">
                    <span className="tag" style={{ '--c': k.color }}><Icon name={a.kind in KINDS ? a.kind : 'sight'} size={13} /> {k.label}</span>
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
          </Fragment>
          );
        })}
      </ol>

      <div className="day-foot">
        <button className="primary" onClick={onAdd}>＋ Atividade</button>
      </div>
    </div>
  );
}

export function DoneFilter({ value, onChange }) {
  return (
    <div className="seg-tabs mini-seg" role="radiogroup" aria-label="Mostrar">
      {DONE_FILTERS.map(([k, l]) => (
        <button key={k} role="radio" aria-checked={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  );
}

export function Clip() {
  return <svg className="clip" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13.5 7.5l-5.6 5.6a3.4 3.4 0 01-4.8-4.8l5.9-5.9a2.3 2.3 0 013.2 3.2L6.4 11.4a1.1 1.1 0 01-1.6-1.6l5.3-5.3" /></svg>;
}
