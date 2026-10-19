import { KINDS, KIND_KEYS, fmtDay, daysBetween, hasCoords } from './util.js';

// faixa da viagem: uma fatia por hospedagem, larga na proporção das noites, na cor da cidade
function TripStrip({ stays, cityMap, onCity }) {
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

export default function TripPanel({ trip, cities, cityMap, stays, activities, conflictsTotal, kinds, onToggleKind, fx, onCity, onOpenStays, onOpenBudget, onOpenCities, onEditTrip, onPickDay, daysInfo, checklist = [], onOpen, ideas = [], days = [], onIdea, onSchedule }) {
  const total = activities.reduce((s, a) => s + (a.cost || 0), 0);
  const sights = activities.filter((a) => a.kind === 'sight').length;
  const noCoords = activities.filter((a) => !hasCoords(a) && a.kind !== 'free').length;
  const nights = stays.reduce((s, x) => s + Math.max(0, daysBetween(x.check_in, x.check_out)), 0);

  return (
    <div className="daypanel trip">
      <div className="day-head">
        <div className="day-kicker">Visão geral</div>
        <h2 className="day-title">{trip.name}</h2>
        <button className="link-btn" onClick={onEditTrip}>Editar viagem</button>
        <div className="muted">{fmtDay(trip.start)} → {fmtDay(trip.end)} · {daysBetween(trip.start, trip.end) + 1} dias</div>
        <div className="stats">
          <div><b>{activities.length}</b><span>atividades</span></div>
          <div><b>{sights}</b><span>pontos turísticos</span></div>
          <div><b>{nights}</b><span>noites</span></div>
          <div><b>{total ? fx.fmt(total) : '—'}</b><span>{total ? (fx.fmtHome(total) || 'em custos') : 'custos'}</span></div>
        </div>
        {(conflictsTotal > 0 || noCoords > 0) && (
          <div className="warns">
            {conflictsTotal > 0 && <span className="warn">{conflictsTotal} atividades com horário sobreposto</span>}
            {noCoords > 0 && <span className="warn soft">{noCoords} atividades sem local</span>}
          </div>
        )}
      </div>

      <TripStrip stays={stays} cityMap={cityMap} onCity={onCity} />

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

      <div className="section-title">Dias</div>
      <ul className="days-list">
        {daysInfo.map((d) => (
          <li key={d.day} onClick={() => onPickDay(d.day)}>
            <div className="d-date"><b>{d.num}</b><span>{d.week}</span></div>
            <div className="d-mid">
              <div className="d-cities">{d.cities.length ? `${d.cities.map((k) => cityMap[k]?.emoji).join(' ')} ${d.cities.map((k) => cityMap[k]?.name).join(' · ')}` : d.count ? 'Em trânsito' : 'Sem atividades'}</div>
              <div className="muted small">{d.count} {d.count === 1 ? 'atividade' : 'atividades'}{d.cost ? ` · ${fx.fmt(d.cost)}` : ''}</div>
            </div>
            {d.conflicts > 0 && <span className="tag warn">{d.conflicts} sobrepostas</span>}
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
            {KINDS[k].icon} {KINDS[k].label}
          </button>
        ))}
      </div>

      <div className="day-foot">
        <button onClick={onOpenCities}>Cidades</button>
        <button onClick={onOpenStays}>Hospedagens</button>
        <button onClick={onOpenBudget}>Orçamento</button>
        <button onClick={() => onOpen('checklist')}>Checklist{checklist.length ? ` ${checklist.filter((c) => c.done).length}/${checklist.length}` : ''}</button>
        <button onClick={() => onOpen('stats')}>Estatísticas</button>
        <button onClick={() => onOpen('calendar')}>Calendário</button>
      </div>
    </div>
  );
}
