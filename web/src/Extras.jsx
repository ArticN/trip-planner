import { useMemo, useState } from 'react';
import { Modal } from './Modals.jsx';
import { KINDS, KIND_KEYS, hasCoords, haversine, fmtKm, fmtDay, dayNum, dayWeek, daysBetween } from './util.js';

// ── links de uma atividade: guardados como JSON [{ label, url }]
export function parseLinks(v) {
  if (!v) return [];
  try { const l = JSON.parse(v); return Array.isArray(l) ? l.filter((x) => x && x.url) : []; } catch { return []; }
}
export const linkLabel = (l) => l.label || l.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

// ── checklist
const DEFAULT_GROUPS = ['Documentos', 'Reservas', 'Mala', 'Outros'];

export function ChecklistModal({ items, onCreate, onUpdate, onDelete, onClose }) {
  const groups = useMemo(() => {
    const g = [...DEFAULT_GROUPS];
    items.forEach((i) => { if (i.grp && !g.includes(i.grp)) g.push(i.grp); });
    return g;
  }, [items]);
  const [text, setText] = useState('');
  const [grp, setGrp] = useState('Documentos');
  const done = items.filter((i) => i.done).length;

  const add = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onCreate({ text: text.trim(), grp });
    setText('');
  };

  return (
    <Modal title="Checklist" onClose={onClose} footer={<><span className="muted">{done} de {items.length} feitos</span><span className="spacer" /><button onClick={onClose}>Fechar</button></>}>
      <form className="row check-add" onSubmit={add}>
        <label>Novo item<input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex: passaporte válido, seguro viagem, adaptador de tomada" autoFocus /></label>
        <label className="grp-sel">Grupo
          <select value={grp} onChange={(e) => setGrp(e.target.value)}>{groups.map((g) => <option key={g}>{g}</option>)}</select>
        </label>
        <button className="primary" type="submit" disabled={!text.trim()}>Adicionar</button>
      </form>
      {items.length === 0 && <div className="empty">Nada na lista ainda. Comece pelos documentos e reservas que você não pode esquecer.</div>}
      {groups.map((g) => {
        const list = items.filter((i) => (i.grp || 'Outros') === g);
        if (!list.length) return null;
        return (
          <div key={g} className="check-group">
            <div className="check-h">{g}<span>{list.filter((i) => i.done).length}/{list.length}</span></div>
            <ul className="check-list">
              {list.map((i) => (
                <li key={i.id} className={i.done ? 'done' : ''}>
                  <label>
                    <input type="checkbox" checked={!!i.done} onChange={() => onUpdate(i.id, { done: !i.done })} />
                    <span>{i.text}</span>
                  </label>
                  <button className="icon-btn sm" title="Remover" aria-label="Remover" onClick={() => onDelete(i.id)}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </Modal>
  );
}

// ── estatísticas
function Bars({ rows, fmt }) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <div className="bars">
      {rows.map((r) => (
        <div key={r.k} className="bar-row" title={`${r.label}: ${fmt(r.v)}`}>
          <span className="bar-l">{r.label}</span>
          <span className="bar-t"><i style={{ width: `${(r.v / max) * 100}%`, background: r.c || 'var(--accent)' }} /></span>
          <span className="bar-v">{fmt(r.v)}</span>
        </div>
      ))}
    </div>
  );
}

export function StatsModal({ activities, stays, cityMap, days, fx, onClose }) {
  const s = useMemo(() => {
    const byDay = {};
    activities.forEach((a) => { (byDay[a.day] ||= []).push(a); });
    let km = 0;
    const kmDay = days.map((d) => {
      const pts = (byDay[d] || []).slice().sort((x, y) => x.sort - y.sort).filter(hasCoords);
      let k = 0;
      // voos ficam de fora: senão um único trecho domina o total
      for (let i = 1; i < pts.length; i++) if (pts[i].kind !== 'flight' && pts[i - 1].kind !== 'flight') k += haversine(pts[i - 1], pts[i]);
      km += k;
      return { k: d, label: `${dayWeek(d)} ${dayNum(d)}`, v: k };
    });
    const costDay = days.map((d) => ({ k: d, label: `${dayWeek(d)} ${dayNum(d)}`, v: (byDay[d] || []).reduce((t, a) => t + (a.cost || 0), 0) }));
    const cityAgg = {};
    activities.forEach((a) => {
      const c = a.city || '—';
      cityAgg[c] ||= { cost: 0, n: 0 };
      cityAgg[c].cost += a.cost || 0; cityAgg[c].n += 1;
    });
    const nights = {};
    stays.forEach((st) => { if (st.check_in && st.check_out) nights[st.city] = (nights[st.city] || 0) + daysBetween(st.check_in, st.check_out); });
    const kindAgg = KIND_KEYS.map((k) => {
      const l = activities.filter((a) => a.kind === k);
      return { k, label: KINDS[k].label, c: KINDS[k].color, n: l.length, v: l.reduce((t, a) => t + (a.cost || 0), 0) };
    }).filter((x) => x.n);
    stays.forEach((st) => { if (st.cost) { const c = st.city || '—'; cityAgg[c] ||= { cost: 0, n: 0 }; cityAgg[c].cost += st.cost; } });
    const staysTotal = stays.reduce((t, st) => t + (st.cost || 0), 0);
    const total = activities.reduce((t, a) => t + (a.cost || 0), 0) + staysTotal;
    const done = activities.filter((a) => a.done).length;
    if (staysTotal) kindAgg.push({ k: 'stays', label: 'Hospedagens (diárias)', c: KINDS.stay.color, n: stays.filter((st) => st.cost).length, v: staysTotal });
    return { km, kmDay, costDay, cityAgg, nights, kindAgg, total, done };
  }, [activities, stays, days]);

  const cities = Object.entries(s.cityAgg).filter(([k]) => k !== 'transito').sort((x, y) => y[1].cost - x[1].cost || y[1].n - x[1].n);
  const perDay = days.length ? s.total / days.length : 0;

  return (
    <Modal title="Estatísticas" onClose={onClose} wide footer={<><span className="spacer" /><button onClick={onClose}>Fechar</button></>}>
      <div className="kpis">
        <div><b>{fx.fmt(s.total)}</b><span>gasto previsto{fx.convert ? ` · ${fx.fmtHome(s.total)}` : ''}</span></div>
        <div><b>{fx.fmt(perDay)}</b><span>por dia, em média</span></div>
        <div><b>{fmtKm(s.km)}</b><span>em linha reta entre atividades, sem voos</span></div>
        <div><b>{s.done}/{activities.length}</b><span>atividades feitas</span></div>
      </div>

      <div className="two-col">
        <div>
          <div className="sub-h">Gasto por dia</div>
          {s.total ? <Bars rows={s.costDay.filter((r) => r.v)} fmt={fx.fmt} /> : <div className="empty">Nenhum custo cadastrado.</div>}
          <div className="sub-h">Distância por dia</div>
          <Bars rows={s.kmDay.filter((r) => r.v > 0.05)} fmt={fmtKm} />
        </div>
        <div>
          <div className="sub-h">Por cidade</div>
          <table className="tbl">
            <thead><tr><td /><td className="r">noites</td><td className="r">ativ.</td><td className="r">gasto</td></tr></thead>
            <tbody>
              {cities.map(([k, v]) => (
                <tr key={k}>
                  <td><i className="dot" style={{ '--c': cityMap[k]?.color || '#888' }} /> {cityMap[k]?.name || k}</td>
                  <td className="r">{s.nights[k] || ''}</td>
                  <td className="r">{v.n}</td>
                  <td className="r">{v.cost ? fx.fmt(v.cost) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="sub-h">Por tipo</div>
          <table className="tbl">
            <tbody>
              {s.kindAgg.map((r) => (
                <tr key={r.k}>
                  <td><i className="dot" style={{ '--c': r.c }} /> {r.label}</td>
                  <td className="r">{r.n}</td>
                  <td className="r">{r.v ? fx.fmt(r.v) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

// ── calendário (grade semanal com os dias da viagem)
export function CalendarModal({ days, byDay, cityMap, daysInfo, fx, onPick, onClose }) {
  const weeks = useMemo(() => {
    if (!days.length) return [];
    const first = new Date(`${days[0]}T12:00:00`);
    const lead = (first.getDay() + 6) % 7; // semana começa na segunda
    const cells = Array(lead).fill(null).concat(days);
    while (cells.length % 7) cells.push(null);
    const w = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    return w;
  }, [days]);
  const info = Object.fromEntries(daysInfo.map((d) => [d.day, d]));

  return (
    <Modal title="Calendário" onClose={onClose} wide footer={<><span className="muted">Clique num dia para abrir o roteiro dele.</span><span className="spacer" /><button onClick={onClose}>Fechar</button></>}>
      <div className="cal">
        {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((d) => <div key={d} className="cal-wd">{d}</div>)}
        {weeks.flat().map((d, i) => {
          if (!d) return <div key={`x${i}`} className="cal-cell empty-cell" />;
          const inf = info[d];
          const c = cityMap[inf?.cities[0]];
          const list = byDay[d] || [];
          return (
            <button key={d} className="cal-cell" style={{ '--c': c?.color || 'var(--ctl)' }} onClick={() => onPick(d)}>
              <span className="cal-top"><b>{dayNum(d)}</b>{dayNum(d) === '01' || i === 0 || d === days[0] ? <small>{fmtDay(d).split(' ').pop()}</small> : null}</span>
              <span className="cal-city">{c?.name || (list.length ? 'Em trânsito' : '')}</span>
              <ul>
                {list.slice(0, 3).map((a) => <li key={a.id}>{a.start ? <em>{a.start}</em> : null}{a.title}</li>)}
              </ul>
              {list.length > 3 && <span className="cal-more">mais {list.length - 3}</span>}
              {inf?.cost ? <span className="cal-cost">{fx.fmt(inf.cost)}</span> : null}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

// ── exporta o roteiro como calendário (.ics), para importar no Google Agenda / Apple Calendário
export function downloadIcs(trip, activities, cityMap) {
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => `\\${m}`);
  const d8 = (d) => d.replace(/-/g, '');
  const t6 = (t) => `${t.replace(':', '')}00`;
  const next = (d) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() + 1); return x.toISOString().slice(0, 10); };
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Trip Planner//PT-BR', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(trip.name)}`];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  activities.forEach((a) => {
    const desc = [a.details, a.notes, ...parseLinks(a.links).map((l) => l.url)].filter(Boolean).join('\n');
    const loc = [a.location, cityMap[a.city]?.name].filter(Boolean).join(', ');
    lines.push('BEGIN:VEVENT', `UID:tp-${trip.id}-${a.id}@trip-planner`, `DTSTAMP:${stamp}`);
    if (a.start) {
      // horário "flutuante" (sem fuso): aparece no horário local de onde o calendário estiver
      lines.push(`DTSTART:${d8(a.day)}T${t6(a.start)}`);
      if (a.end) lines.push(`DTEND:${d8(a.end_day || (a.end < a.start ? next(a.day) : a.day))}T${t6(a.end)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${d8(a.day)}`, `DTEND;VALUE=DATE:${d8(next(a.day))}`);
    }
    lines.push(`SUMMARY:${esc(a.title)}`);
    if (loc) lines.push(`LOCATION:${esc(loc)}`);
    if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
    if (hasCoords(a)) lines.push(`GEO:${a.lat};${a.lng}`);
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  // RFC 5545: linhas com mais de 75 caracteres continuam na seguinte, começando com espaço
  const fold = (l) => (l.length <= 74 ? l : l.match(/.{1,73}/gu).join('\r\n '));
  const blob = new Blob([lines.map(fold).join('\r\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url;
  el.download = `${trip.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'viagem'}.ics`;
  el.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
