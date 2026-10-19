import { KINDS, KIND_KEYS, fmtDay, daysBetween, yen, brl, hasCoords } from './util.js';

export default function TripPanel({ trip, cities, cityMap, stays, activities, conflictsTotal, kinds, onToggleKind, brlRate, onCity, onOpenStays, onOpenBudget, onPickDay, daysInfo }) {
  const total = activities.reduce((s, a) => s + (a.cost_jpy || 0), 0);
  const sights = activities.filter((a) => a.kind === 'sight').length;
  const noCoords = activities.filter((a) => !hasCoords(a) && a.kind !== 'free').length;
  const nights = stays.reduce((s, x) => s + Math.max(0, daysBetween(x.check_in, x.check_out)), 0);

  return (
    <div className="daypanel trip">
      <div className="day-head">
        <div className="day-kicker">Visão geral</div>
        <h2 className="day-title">{trip.name}</h2>
        <div className="muted">{fmtDay(trip.start)} → {fmtDay(trip.end)} · {daysBetween(trip.start, trip.end) + 1} dias</div>
        <div className="stats">
          <div><b>{activities.length}</b><span>atividades</span></div>
          <div><b>{sights}</b><span>pontos turísticos</span></div>
          <div><b>{nights}</b><span>noites no Japão</span></div>
          <div><b>{total ? yen(total) : '—'}</b><span>{total ? brl(total * brlRate) : 'ingressos'}</span></div>
        </div>
        {(conflictsTotal > 0 || noCoords > 0) && (
          <div className="warns">
            {conflictsTotal > 0 && <span className="warn">⚠️ {conflictsTotal} atividades com horário sobreposto</span>}
            {noCoords > 0 && <span className="warn soft">📍 {noCoords} atividades sem local</span>}
          </div>
        )}
      </div>

      <div className="section-title">Rota</div>
      <ol className="route">
        {stays.map((s) => {
          const c = cityMap[s.city];
          const n = Math.max(0, daysBetween(s.check_in, s.check_out));
          return (
            <li key={s.id} onClick={() => c && onCity(c)} style={{ '--c': c?.color }}>
              <span className="dot">{c?.emoji}</span>
              <div>
                <div className="r-title">{c?.name} <span className="muted">· {n} {n === 1 ? 'noite' : 'noites'}</span></div>
                <div className="muted">{fmtDay(s.check_in)} → {fmtDay(s.check_out)}</div>
                <div className="muted small">🏨 {s.name}</div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="muted small pad">
        Bate-voltas: {cities.filter((c) => !['transito'].includes(c.key) && !stays.some((s) => s.city === c.key)).map((c) => `${c.emoji} ${c.name}`).join(' · ')}
      </div>

      <div className="section-title">Dias</div>
      <ul className="days-list">
        {daysInfo.map((d) => (
          <li key={d.day} onClick={() => onPickDay(d.day)}>
            <div className="d-date"><b>{d.num}</b><span>{d.week}</span></div>
            <div className="d-mid">
              <div className="d-cities">{d.cities.length ? `${d.cities.map((k) => cityMap[k]?.emoji).join(' ')} ${d.cities.map((k) => cityMap[k]?.name).join(' · ')}` : d.count ? '✈️ Em trânsito' : 'Sem atividades'}</div>
              <div className="muted small">{d.count} {d.count === 1 ? 'atividade' : 'atividades'}{d.cost ? ` · ${yen(d.cost)}` : ''}</div>
            </div>
            {d.conflicts > 0 && <span className="tag warn">⚠️ {d.conflicts}</span>}
          </li>
        ))}
      </ul>

      <div className="section-title">Camadas do mapa</div>
      <div className="filters wrap">
        {KIND_KEYS.map((k) => (
          <button key={k} className={`fchip wide${kinds.has(k) ? ' on' : ''}`} style={{ '--c': KINDS[k].color }} onClick={() => onToggleKind(k)}>
            {KINDS[k].icon} {KINDS[k].label}
          </button>
        ))}
      </div>

      <div className="day-foot">
        <button onClick={onOpenStays}>🏨 Hospedagens</button>
        <button onClick={onOpenBudget}>💴 Orçamento</button>
      </div>
    </div>
  );
}
