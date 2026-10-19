import { useState } from 'react';
import { DoneFilter } from './DayPanel.jsx';
import { Icon } from './icons.jsx';
import { KINDS, KIND_KEYS, fmtDay, daysBetween, hasCoords, nowIn } from './util.js';

// faixa da viagem: uma fatia por hospedagem, larga na proporção das noites, na cor da cidade
export function TripStrip({ stays, cityMap, onCity }) {
  const parts = stays.map((s) => ({ s, c: cityMap[s.city], n: Math.max(0, daysBetween(s.check_in, s.check_out)) })).filter((p) => p.n > 0);
  if (!parts.length) return null;
  const total = parts.reduce((t, p) => t + p.n, 0);
  return (
    <div className="tripstrip" role="list" aria-label="Noites por cidade">
      {parts.map(({ s, c, n }) => (
        <button key={s.id} role="listitem" className="seg" style={{ flex: n, '--c': c?.color || '#888' }} onClick={() => c && onCity(c)} title={`${c?.name || s.name} · ${n} ${n === 1 ? 'noite' : 'noites'}`}>
          <i />
          <span>{c?.name || s.name}</span>
          <small>{n}</small>
        </button>
      ))}
      <span className="visually-hidden">{total} noites no total</span>
    </div>
  );
}

export default function TripPanel({ trip, cities, cityMap, stays, activities, conflictsTotal, kinds, onToggleKind, doneFilter = 'all', onDoneFilter, fx, onCity, onOpenStays, onOpenBudget, onOpenCities, onEditTrip, onPickDay, daysInfo, checklist = [], onOpen, ideas = [], days = [], onIdea, onSchedule }) {
  const total = activities.reduce((s, a) => s + (a.cost || 0), 0);
  const sights = activities.filter((a) => a.kind === 'sight').length;
  const noCoords = activities.filter((a) => !hasCoords(a) && a.kind !== 'free').length;
  const today = nowIn(trip.tz).day;
  const [issuesOnly, setIssuesOnly] = useState(false);
  const nights = stays.reduce((s, x) => s + Math.max(0, daysBetween(x.check_in, x.check_out)), 0);

  return (
    <div className="daypanel trip">
      <div className="day-head">
        <h2 className="day-title">{trip.name}</h2>
        <div className="muted trip-when">
          {fmtDay(trip.start)} → {fmtDay(trip.end)} · {daysBetween(trip.start, trip.end) + 1} dias
          <button className="link-btn" onClick={onEditTrip}>Editar</button>
        </div>
        <div className="stats">
          <div><b>{activities.length}</b><span>atividades</span></div>
          <div><b>{sights}</b><span>pontos turísticos</span></div>
          <div><b>{nights}</b><span>noites</span></div>
          <div><b>{total ? fx.fmt(total) : '—'}</b><span>{total ? (fx.fmtHome(total) || 'em custos') : 'custos'}</span></div>
        </div>
        {(conflictsTotal > 0 || noCoords > 0) && (
          <button className={`issues-btn${issuesOnly ? ' on' : ''}`} aria-pressed={issuesOnly} onClick={() => setIssuesOnly((v) => !v)}>
            <Icon name="warn" size={14} />
            <span>{[conflictsTotal > 0 && `${conflictsTotal} com horário sobreposto`, noCoords > 0 && `${noCoords} sem local`].filter(Boolean).join(' · ')}</span>
            <b>{issuesOnly ? 'Mostrar todos os dias' : 'Ver em quais dias'}</b>
          </button>
        )}
      </div>

      <div className="only-sm-block"><TripStrip stays={stays} cityMap={cityMap} onCity={onCity} /></div>

      <div className="section-title">Rota</div>
      {stays.length === 0 && (
        <div className="empty small">Cadastre as <button onClick={onOpenStays}>hospedagens</button> para ver a rota entre cidades no mapa.</div>
      )}
      <ol className="route">
        {stays.map((s) => {
          const c = cityMap[s.city];
          const n = Math.max(0, daysBetween(s.check_in, s.check_out));
          return (
            <li key={s.id} onClick={() => c && onCity(c)} style={{ '--c': c?.color }}>
              <span className="dot" />
              <div>
                <div className="r-title">{c?.name} <span className="muted">· {n} {n === 1 ? 'noite' : 'noites'}</span></div>
                <div className="muted">{fmtDay(s.check_in)} → {fmtDay(s.check_out)}</div>
                <div className="muted small">{s.name}</div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="muted small pad">
        {cities.some((c) => c.key !== 'transito' && !stays.some((s) => s.city === c.key)) && 'Bate-voltas: '}{cities.filter((c) => !['transito'].includes(c.key) && !stays.some((s) => s.city === c.key)).map((c) => `${c.emoji} ${c.name}`).join(' · ')}
      </div>

      <div className="section-title">{issuesOnly ? 'Dias para revisar' : 'Dias'}</div>
      <ul className="days-list">
        {(issuesOnly ? daysInfo.filter((d) => d.conflicts || d.missing) : daysInfo).map((d) => (
          <li key={d.day} onClick={() => onPickDay(d.day)} className={[!d.count && 'empty', d.day === today && 'today', d.day < today && 'past'].filter(Boolean).join(' ') || undefined} style={{ '--c': cityMap[d.cities[0]]?.color || 'var(--ctl)' }}>
            <div className="d-date"><b>{d.num}</b><span>{d.day === today ? 'hoje' : d.week}</span></div>
            <i className="d-dot" aria-hidden="true" />
            <div className="d-mid">
              <div className="d-cities">{d.cities.length ? `${d.cities.map((k) => cityMap[k]?.emoji).join(' ')} ${d.cities.map((k) => cityMap[k]?.name).join(' · ')}` : d.count ? 'Em trânsito' : 'Sem atividades'}</div>
              <div className="muted small">{d.count} {d.count === 1 ? 'atividade' : 'atividades'}{d.cost ? ` · ${fx.fmt(d.cost)}` : ''}</div>
              {issuesOnly && (
                <div className="d-issue"><Icon name="warn" size={12} />{[d.conflicts && `${d.conflicts} com horário sobreposto`, d.missing && `${d.missing} sem local`].filter(Boolean).join(' · ')}</div>
              )}
            </div>
            {!issuesOnly && d.conflicts > 0 && (
              <span className="d-issue" title={`${d.conflicts} com horário sobreposto`}><Icon name="warn" size={12} />{d.conflicts}</span>
            )}
          </li>
        ))}
      </ul>

      <div className="section-title ideas-h">
        Ideias{ideas.length ? ` · ${ideas.length}` : ''}
        <button className="mini" onClick={() => onIdea(null)}>+ Ideia</button>
      </div>
      {ideas.length === 0 ? (
        <div className="empty small">Guarde aqui lugares que você quer conhecer e ainda não sabe em que dia. Depois é só escolher o dia.</div>
      ) : (
        <ul className="ideas">
          {ideas.map((x) => (
            <li key={x.id} style={{ '--c': (KINDS[x.kind] || KINDS.sight).color }}>
              <button className="idea-main" onClick={() => onIdea(x)} title="Editar ideia">
                <i className="dot" />
                <span>
                  <b>{x.title}</b>
                  <small>{[cityMap[x.city]?.name, x.location, !hasCoords(x) && 'sem local'].filter(Boolean).join(' · ')}</small>
                </span>
              </button>
              <select aria-label={`Agendar ${x.title}`} value="" onChange={(e) => e.target.value && onSchedule(x.id, e.target.value)}>
                <option value="">Agendar…</option>
                {days.map((d) => <option key={d} value={d}>{fmtDay(d)}</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}

      <div className="section-title">Camadas do mapa</div>
      <div className="filters wrap">
        {KIND_KEYS.map((k) => (
          <button key={k} className={`fchip wide${kinds.has(k) ? ' on' : ''}`} style={{ '--c': KINDS[k].color }} onClick={() => onToggleKind(k)}>
            <Icon name={k} /> {KINDS[k].label}
          </button>
        ))}
      </div>
      <div className="filters"><DoneFilter value={doneFilter} onChange={onDoneFilter} /></div>

      <div className="day-foot">
        <button className="ghost" onClick={onOpenCities}>Cidades</button>
        <button className="ghost" onClick={onOpenStays}>Hospedagens</button>
        <button className="ghost" onClick={onOpenBudget}>Orçamento</button>
        <button className="ghost" onClick={() => onOpen('checklist')}>Checklist{checklist.length ? ` ${checklist.filter((c) => c.done).length}/${checklist.length}` : ''}</button>
        <button className="ghost" onClick={() => onOpen('stats')}>Estatísticas</button>
        <button className="ghost" onClick={() => onOpen('calendar')}>Calendário</button>
      </div>
    </div>
  );
}
