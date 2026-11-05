import { Stars } from './Stars.jsx';
import { parseLinks, linkLabel, LinkText, safeUrl } from './Extras.jsx';
import { Fragment, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { Icon } from './icons.jsx';
import WeatherLine from './WeatherLine.jsx';
import FlightPath from './FlightPath.jsx';
import { travelTime, slack, gmapsDirections, parseRoute, rideColor, rideLabel, inkOn, dayStart, isStraightTravel } from './travel.js';
import {
  KINDS, KIND_KEYS, SLOTS, hasCoords, duration, fmtDuration, haversine, fmtKm, fmtDayLong, daysBetween, endDayOf, toMin, directionsUrl, sunTimes, DONE_FILTERS, passDone, nowIn,
} from './util.js';

const MODE_LABEL = { foot: 'a pé', car: 'de carro', transit: 'de transporte' };

// deslocamento com estações: a pé, linha (na cor dela) de uma estação a outra, a pé…
function Legs({ t }) {
  return (
    <>
      {t.legs.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          {l.mode === 'ride'
            ? <span className="ride" title={l.ride.dir || undefined}><i style={{ '--c': rideColor(l.ride), color: inkOn(rideColor(l.ride)) }}>{rideLabel(l.ride)}</i> {l.ride.from.name || 'embarque'} → {l.ride.to.name || 'desembarque'} {l.estimate ? '~' : ''}{fmtDuration(l.min)}</span>
            : <>{l.estimate ? '~' : ''}{fmtDuration(l.min)} a pé</>}
        </Fragment>
      ))}
      {t.legs.length > 1 && <b className="gap-total"> · {t.estimate ? '~' : ''}{fmtDuration(t.min)} no total</b>}
    </>
  );
}

// o intervalo entre duas atividades desenhado como tempo: a altura acompanha os minutos livres,
// e o trecho cheio do eixo é o deslocamento estimado
const PX_PER_MIN = 0.5;

function Gap({ a, b, fromStay = false }) {
  const [t, setT] = useState(null);
  const ok = hasCoords(a) && hasCoords(b) && haversine(a, b) >= 0.05;
  const isMove = isStraightTravel(a, b);
  useEffect(() => {
    let live = true;
    if (ok && !isMove) travelTime(a, b).then((v) => live && setT(v)).catch(() => {});
    return () => { live = false; };
  }, [a.lat, a.lng, b.lat, b.lng, b.transport, b.route, ok, isMove]);
  const free = slack(a, b);
  // antes de um trecho de viagem com estações, o trem é a própria atividade: só conta a caminhada até a estação
  const move = ok && !isMove && t ? (b.kind === 'move' ? t.legs.filter((l) => l.mode !== 'ride').reduce((n, l) => n + l.min, 0) : t.min) : 0;
  const rest = free != null ? free - move : null;
  if (!ok && !(rest >= 30)) return null;
  const tight = !!move && free != null && free < move;
  const h = free > 0 ? Math.min(150, Math.max(20, free * PX_PER_MIN)) : 20;
  const fill = tight ? 100 : free > 0 && move ? Math.min(100, (move / free) * 100) : 0;
  return (
    <div className={`gap${tight ? ' tight' : ''}`} style={{ '--h': `${h}px` }}>
      <span className="gap-axis" aria-hidden="true"><i style={{ height: `${fill}%` }} /></span>
      <span className="gap-txt">
        {fromStay && <span className="gap-from">Da hospedagem · </span>}
        {ok && (isMove || !t
          ? <>{fmtKm(haversine(a, b))} em linha reta</>
          : t.mode === 'route' ? <Legs t={t} /> : <>{fmtKm(t.km)} {MODE_LABEL[t.mode]} · {t.estimate ? '~' : ''}{fmtDuration(t.min)}</>)}
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
    // div clicável (não <button>) porque as anotações podem ter links
    <div className="dayinfo" role="button" tabIndex={0} onClick={open} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(); } }} title="Editar tema e anotações">
      {info.title && <span className="dayinfo-title">{info.title}</span>}
      {info.notes && <span className="dayinfo-notes"><LinkText text={info.notes} /></span>}
    </div>
  );
}

export default function DayPanel({
  day, dayIndex, items, cityMap, stay, checkout, conflicts, selectedId, onSelect, onEdit, onToggleDone, onAdd, onMoveSlot,
  onReorder, onSortTime, onAltStep, onAltAdd, onAltMain, kinds, onToggleKind, fx, onPrev, onNext, hasPrev, hasNext, tripTz, now = null, dayInfo = null, onSaveDayInfo, doneFilter = 'all', onDoneFilter, files = [], travel = {},
}) {
  // atividade escolhida (no mapa ou na busca) fica visível na lista
  useEffect(() => {
    if (selectedId != null) document.querySelector('.daypanel .item.sel')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId, day]);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  // no celular, deslizar o ingresso para o lado troca a opção do carrossel
  const touch = useRef(null);
  const swipe = (a) => a.alts && {
    onTouchStart: (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; },
    onTouchEnd: (e) => {
      const s = touch.current; touch.current = null;
      if (!s) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - s.x;
      if (Math.abs(dx) > 50 && Math.abs(t.clientY - s.y) < 40) onAltStep(a, dx < 0 ? 1 : -1);
    },
  };

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

  const renderItem = (a) => {
          const k = KINDS[a.kind] || KINDS.sight;
          const idx = items.indexOf(a);
          const prev = idx > 0 ? items[idx - 1] : null;
          const dur = duration(a, tripTz);
          const endDay = endDayOf(a);
          const endPlus = a.end && endDay !== a.day ? ` (+${daysBetween(a.day, endDay)}d)` : '';
          const leg = a.from_code || a.to_code || a.ref;
          const cls = ['item', ['flight', 'move'].includes(a.kind) ? 'ticket' : '', a.alts ? 'has-alts' : '', a.id === nowId ? 'now' : '', a.id === selectedId ? 'sel' : '', a.done ? 'done' : '', conflicts.has(a.id) ? 'conflict' : '', dragId === a.id ? 'dragging' : '', overId === a.id ? 'over' : ''].join(' ');
          return (
            <li key={a.id}>
              {prev && visible.includes(prev) && prev.kind !== 'flight' && a.kind !== 'flight' && <Gap a={prev} b={a} />}
              {!prev && dayStart([checkout, stay], a) && <Gap a={dayStart([checkout, stay], a).at} b={a} fromStay={dayStart([checkout, stay], a).stay} />}
              <div
                className={cls}
                draggable={a.kind !== 'flight'}
                onDragStart={(e) => { setDragId(a.id); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => { e.preventDefault(); if (overId !== a.id) setOverId(a.id); }}
                onDragLeave={() => setOverId((o) => (o === a.id ? null : o))}
                onDrop={(e) => { e.preventDefault(); drop(a.id); setDragId(null); setOverId(null); }}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                onClick={() => onSelect(a.id)}
                {...swipe(a)}
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
                <div className="body" key={a.id}>
                  {a.alts && <AltBar a={a} onStep={onAltStep} onMain={onAltMain} />}
                  <div className="title-row">
                    <span className="title">{a.title}</span>
                    {a.id === nowId && <span className="now-badge">{nowLabel(a)}</span>}
                  </div>
                  {leg && (
                    <div className="leg">
                      {a.from_code && <b>{a.from_code}</b>} {a.start}
                      {(a.to_code || a.end) && <> → {a.to_code && <b>{a.to_code}</b>} {a.end}{endPlus}</>}
                      {a.via && <span className="muted"> · {/[^A-Z]+[A-Z]/i.test(a.via.trim()) ? 'escalas' : 'escala'} em {a.via}</span>}
                      {a.ref && <span className="muted"> · {a.ref}</span>}
                      {a.start_tz && a.end_tz && a.start_tz !== a.end_tz && <span className="muted"> · horários locais</span>}
                    </div>
                  )}
                  {a.kind === 'flight' && <FlightPath a={a} />}
                  {a.location && <div className="loc">{a.location}</div>}
                  {a.details && <div className="det"><LinkText text={a.details} /></div>}
                  {a.notes && <div className="note"><LinkText text={a.notes} /></div>}
                  {(a.rating || a.review) && (
                    <div className="review">
                      {a.rating ? <Stars value={a.rating} /> : null}
                      {a.review && <span><LinkText text={a.review} /></span>}
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
                  {onAltAdd && !['flight', 'move'].includes(a.kind) && (
                    <button className="icon-btn sm alt-add" title="Outra opção para este horário" aria-label="Adicionar outra opção para este horário" onClick={(e) => { e.stopPropagation(); onAltAdd(a); }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1.5" y="4" width="10" height="10" rx="1.5" /><path d="M4.5 1.5H13A1.5 1.5 0 0114.5 3v8.5M6.5 6.5v5M4 9h5" /></svg>
                    </button>
                  )}
                  <button className="icon-btn sm" title="Editar" onClick={(e) => { e.stopPropagation(); onEdit(a.id); }}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 13.5l.7-3L11 2.7a1.4 1.4 0 012 2L5.5 12.8z" /></svg></button>
                </div>
              </div>
            </li>
          );
  };

  // o primeiro voo da viagem (ida) e o último (volta) saem dos blocos do dia (manhã, jantar…)
  // e ganham um cartão de viagem próprio: a ida no topo do dia, a volta no fim
  const ida = visible.find((a) => a.id === travel.ida);
  const volta = visible.find((a) => a.id === travel.volta && a.id !== travel.ida);
  const inSlots = visible.filter((a) => a !== ida && a !== volta);
  const travelBox = (a, isVolta) => a && (
    <section className={`travel-box${isVolta ? ' volta' : ''}`} aria-label={isVolta ? 'Volta' : 'Ida'}>
      <div className="travel-h">
        <Icon name="flight" size={16} />
        <b>{isVolta ? 'Volta' : 'Ida'}</b>
        <span>{isVolta ? 'fim da viagem' : 'começo da viagem'}</span>
      </div>
      <ol className="timeline">{renderItem(a)}</ol>
    </section>
  );
  // dia só de ida ou volta: os blocos vazios ficam escondidos
  const onlyTravel = (ida || volta) && inSlots.length === 0;

  // hoje: painel de estação no topo do dia (anterior pequena, a atual grande, a seguinte pequena)
  const nowBoard = (() => {
    if (nowId == null) return null;
    const i = visible.findIndex((a) => a.id === nowId);
    const cur = visible[i];
    const before = visible[i - 1];
    const after = visible[i + 1];
    const side = (a, label) => (a ? (
      <button className="nb-side" onClick={() => onSelect(a.id)} aria-label={`${label}: ${a.start ? `${a.start}, ` : ''}${a.title}`}>
        <small>{a.start || label}</small>
        <span>{a.title}</span>
      </button>
    ) : <span className="nb-side empty" />);
    const started = toMin(cur.start) <= now;
    // quanto falta: para acabar a atual ou para começar a próxima
    const left = started ? (cur.end ? toMin(cur.end) - now : null) : toMin(cur.start) - now;
    const when = left != null && left > 0 ? `${started ? 'termina' : 'começa'} em ${fmtDuration(left)}` : '';
    return (
      <div className="now-board" aria-label="Agora">
        {side(before, 'Antes')}
        <div className="nb-cur" style={{ '--c': (KINDS[cur.kind] || KINDS.sight).color }}>
          <button onClick={() => onSelect(cur.id)}>
            <small>{nowLabel(cur)}{cur.start ? ` · ${cur.start}${cur.end ? `–${cur.end}` : ''}` : ''}</small>
            <b>{cur.title}</b>
            {cur.location && <span>{cur.location}</span>}
          </button>
          {(when || hasCoords(cur)) && (
            <div className="nb-foot">
              {when && <span>{when}</span>}
              {hasCoords(cur) && <a href={directionsUrl(cur)} target="_blank" rel="noreferrer">Como chegar</a>}
            </div>
          )}
        </div>
        {side(after, 'Depois')}
      </div>
    );
  })();

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
        {nowBoard}
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
                  {safeUrl(stay.link) ? <a href={safeUrl(stay.link)} target="_blank" rel="noreferrer">ver reserva</a> : null}
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

      {travelBox(ida, false)}
      {!onlyTravel && (
      <ol className="timeline">
        {SLOTS.map((slot) => {
          const here = inSlots.filter((a) => a.slotKey === slot.key);
          return (
          <Fragment key={slot.key}>
          <li
            className={`slot-h${here.length ? '' : ' vazio'}${slot.meal ? ' meal' : ''}`}
            onDragOver={(e) => { if (dragId != null) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); dropOnSlot(slot.key); setDragId(null); setOverId(null); }}
          >
            <span className="slot-name">{slot.label}</span>
            <span className="slot-n">{here.length ? `${here.length}` : 'livre'}</span>
            <button type="button" className="slot-add" onClick={() => onAdd(slot.key)} title={`Adicionar em: ${slot.label}`} aria-label={`Adicionar em: ${slot.label}`}>+</button>
          </li>
        {here.map(renderItem)}
          </Fragment>
          );
        })}
      </ol>
      )}
      {travelBox(volta, true)}

      <div className="day-foot">
        <button className="primary" onClick={onAdd}>＋ Atividade</button>
      </div>
    </div>
  );
}

// carrossel das opções no mesmo horário: setas trocam a opção mostrada (e o ponto no mapa)
function AltBar({ a, onStep, onMain }) {
  const n = a.alts.length;
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  return (
    <div className="alt-bar" onClick={(e) => e.stopPropagation()}>
      <button type="button" className="alt-arrow" onClick={stop(() => onStep(a, -1))} aria-label="Opção anterior" title="Opção anterior">‹</button>
      <span className="alt-dots" aria-hidden="true">{a.alts.map((x, i) => <i key={x.id} className={i === a.altIndex ? 'on' : ''} />)}</span>
      <span className="alt-count" aria-live="polite">Opção {a.altIndex + 1} de {n}</span>
      <button type="button" className="alt-arrow" onClick={stop(() => onStep(a, 1))} aria-label="Próxima opção" title="Próxima opção">›</button>
      <span className="spacer" />
      {a.altIndex === 0
        ? <span className="alt-main" title="A principal é a que conta no orçamento e na agenda">principal</span>
        : <button type="button" className="mini alt-make" onClick={stop(() => onMain(a))} title="Passa a contar no orçamento e na agenda">Tornar principal</button>}
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
