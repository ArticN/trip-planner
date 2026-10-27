import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from './Modals.jsx';
import { planTiles, estimateMB, downloadMaps, offlineInfo, clearMaps } from './offlineMap.js';
import { buildIcs } from './ics.js';
import { KINDS, KIND_KEYS, hasCoords, haversine, fmtKm, fmtDay, fmtDayLong, dayNum, dayWeek, daysBetween, actTz, endDayOf, zonedMs, toMin } from './util.js';

// ── links de uma atividade: guardados como JSON [{ label, url }]
export function parseLinks(v) {
  if (!v) return [];
  try { const l = JSON.parse(v); return Array.isArray(l) ? l.filter((x) => x && x.url) : []; } catch { return []; }
}
export const linkLabel = (l) => l.label || l.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

// texto livre com URLs: cada endereço vira um link curto (domínio ou "Google Maps"), sem a URL inteira estourando a caixa
const URL_RE = /https?:\/\/[^\s<>"]+/g;
const urlLabel = (url) => {
  const host = url.replace(/^https?:\/\/(www\.)?/, '').split(/[/?#]/)[0];
  if (/^(maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.)/.test(host) || /^google\.[a-z.]+\/maps/.test(url.replace(/^https?:\/\/(www\.)?/, ''))) {
    return /\/maps\/dir\//.test(url) ? 'rota no Google Maps' : 'abrir no Google Maps';
  }
  return host;
};
export function LinkText({ text }) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const url = m[0].replace(/[.,;:!?)\]]+$/, '');
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<a key={m.index} className="text-link" href={url} target="_blank" rel="noreferrer" title={url} onClick={(e) => e.stopPropagation()}>{urlLabel(url)}</a>);
    last = m.index + url.length;
  }
  if (!out.length) return text;
  out.push(text.slice(last));
  return out;
}

// ── checklist
const DEFAULT_GROUPS = ['Documentos', 'Reservas', 'Mala', 'Outros'];

export function ChecklistModal({ domestic = false, items, onCreate, onUpdate, onDelete, onClose }) {
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
        <label>Novo item<input value={text} onChange={(e) => setText(e.target.value)} placeholder={domestic ? 'Ex: documento com foto, carregador, protetor solar' : 'Ex: passaporte válido, seguro viagem, adaptador de tomada'} autoFocus /></label>
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
// coloca atividades com horário em colunas lado a lado quando se sobrepõem
function layoutDay(list) {
  const timed = list.filter((a) => a.start).map((a) => {
    const s = toMin(a.start);
    const e = a.end && endDayOf(a) === a.day ? Math.max(toMin(a.end), s + 20) : a.end ? 24 * 60 : s + 60;
    return { a, s, e };
  }).sort((x, y) => x.s - y.s || y.e - x.e);
  const lanesEnd = [];
  timed.forEach((t) => {
    let lane = lanesEnd.findIndex((end) => end <= t.s);
    if (lane < 0) { lane = lanesEnd.length; lanesEnd.push(0); }
    lanesEnd[lane] = t.e;
    t.lane = lane;
  });
  // número de colunas de cada grupo que se sobrepõe
  timed.forEach((t) => { t.cols = Math.max(...timed.filter((o) => o.s < t.e && t.s < o.e).map((o) => o.lane)) + 1; });
  return timed;
}

const WD = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

export function CalendarModal({ days, byDay, cityMap, daysInfo, fx, onPick, onClose, initialDay }) {
  const [view, setView] = useState(() => (window.innerWidth < 700 ? 'agenda' : 'month'));
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
  const [week, setWeek] = useState(() => Math.max(0, weeks.findIndex((w) => w.includes(initialDay))));
  const info = Object.fromEntries(daysInfo.map((d) => [d.day, d]));
  const cityOf = (d) => cityMap[info[d]?.cities[0]];

  const tabs = (
    <div className="seg-tabs" role="tablist">
      {[['month', 'Mês'], ['week', 'Semana'], ['agenda', 'Agenda']].map(([k, l]) => (
        <button key={k} role="tab" aria-selected={view === k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>
      ))}
    </div>
  );

  let body = null;
  if (view === 'month') {
    body = (
      <div className="cal">
        {WD.map((d) => <div key={d} className="cal-wd">{d}</div>)}
        {weeks.flat().map((d, i) => {
          if (!d) return <div key={`x${i}`} className="cal-cell empty-cell" />;
          const inf = info[d];
          const c = cityOf(d);
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
    );
  } else if (view === 'week') {
    const wdays = weeks[week] || [];
    const laid = Object.fromEntries(wdays.filter(Boolean).map((d) => [d, layoutDay(byDay[d] || [])]));
    const all = Object.values(laid).flat();
    const from = Math.min(8 * 60, ...all.map((t) => Math.floor(t.s / 60) * 60));
    const to = Math.max(22 * 60, ...all.map((t) => Math.ceil(t.e / 60) * 60));
    const PX = 0.8; // pixels por minuto
    const hours = [];
    for (let m = from; m < to; m += 60) hours.push(m);
    body = (
      <>
        <div className="wk-nav">
          <button className="icon-btn" onClick={() => setWeek((w) => w - 1)} disabled={week === 0} aria-label="Semana anterior">‹</button>
          <b>{fmtDay(wdays.find(Boolean))} a {fmtDay([...wdays].reverse().find(Boolean))}</b>
          <button className="icon-btn" onClick={() => setWeek((w) => w + 1)} disabled={week >= weeks.length - 1} aria-label="Próxima semana">›</button>
        </div>
        <div className="wk">
          <div className="wk-head wk-gutter" />
          {wdays.map((d, i) => (
            <button key={i} className="wk-head" disabled={!d} onClick={() => d && onPick(d)} style={{ '--c': cityOf(d)?.color || 'var(--ctl)' }}>
              <span>{WD[i]}</span> <b>{d ? dayNum(d) : ''}</b>
              {d && <small>{cityOf(d)?.name || ''}</small>}
            </button>
          ))}
          <div className="wk-gutter wk-untimed-label">sem horário</div>
          {wdays.map((d, i) => (
            <div key={i} className="wk-untimed">
              {d && (byDay[d] || []).filter((a) => !a.start).map((a) => (
                <button key={a.id} className="wk-chip" style={{ '--k': (KINDS[a.kind] || KINDS.sight).color }} onClick={() => onPick(d, a.id)}>{a.title}</button>
              ))}
            </div>
          ))}
          <div className="wk-gutter wk-hours" style={{ height: (to - from) * PX }}>
            {hours.map((m) => <span key={m} style={{ top: (m - from) * PX }}>{String(m / 60).padStart(2, '0')}h</span>)}
          </div>
          {wdays.map((d, i) => (
            <div key={i} className={`wk-col${d ? '' : ' off'}`} style={{ height: (to - from) * PX, backgroundSize: `100% ${60 * PX}px` }}>
              {d && laid[d].map((t) => (
                <button
                  key={t.a.id} className={`wk-ev${t.a.done ? ' done' : ''}`}
                  style={{ '--k': (KINDS[t.a.kind] || KINDS.sight).color, top: (t.s - from) * PX, height: Math.max(18, (t.e - t.s) * PX - 2), left: `${(t.lane / t.cols) * 100}%`, width: `${100 / t.cols}%` }}
                  onClick={() => onPick(d, t.a.id)} title={`${t.a.start}${t.a.end ? `–${t.a.end}` : ''} · ${t.a.title}`}
                >
                  <em>{t.a.start}</em> {t.a.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  } else {
    body = (
      <div className="agenda">
        {days.map((d) => {
          const list = byDay[d] || [];
          const c = cityOf(d);
          return (
            <section key={d} className="ag-day">
              <button className="ag-head" onClick={() => onPick(d)} style={{ '--c': c?.color || 'var(--ctl)' }}>
                <b>{fmtDayLong(d)}</b>{c && <span>{c.name}</span>}
              </button>
              {list.length === 0 && <div className="muted small ag-empty">Nada planejado.</div>}
              {list.map((a) => (
                <button key={a.id} className={`ag-item${a.done ? ' done' : ''}`} onClick={() => onPick(d, a.id)}>
                  <span className="ag-time">{a.start || '—'}{a.end ? <small>{a.end}</small> : null}</span>
                  <span className="ag-dot" style={{ '--k': (KINDS[a.kind] || KINDS.sight).color }} />
                  <span className="ag-title">{a.title}{a.location ? <small>{a.location}</small> : null}</span>
                </button>
              ))}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <Modal title="Calendário" onClose={onClose} wide footer={<><span className="muted hide-sm">Clique num dia ou atividade para abrir no roteiro.</span><span className="spacer" /><button onClick={onClose}>Fechar</button></>}>
      {tabs}
      {body}
    </Modal>
  );
}

// ── exporta o roteiro como calendário (.ics), para importar no Google Agenda / Apple Calendário
export function downloadIcs(trip, activities, cityMap) {
  const text = buildIcs(trip, activities, cityMap, { alarm: trip.remind_min ?? 30, flightAlarm: trip.remind_flight_min ?? 180 });
  const blob = new Blob([text], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const el = document.createElement('a');
  el.href = url;
  el.download = `${trip.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'viagem'}.ics`;
  el.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── busca geral na viagem: atividades, ideias, hospedagens, cidades e temas dos dias
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function SearchModal({ data, cityMap, onPick, onClose }) {
  const [q, setQ] = useState('');
  const [cur, setCur] = useState(0);
  const terms = norm(q).split(/\s+/).filter(Boolean);
  const hit = (...fields) => { const t = norm(fields.join(' ')); return terms.every((w) => t.includes(w)); };

  const results = [];
  if (terms.length) {
    data.activities.filter((a) => hit(a.title, a.location, a.details, a.notes, a.review, a.ref, a.from_code, a.to_code, cityMap[a.city]?.name))
      .sort((x, y) => x.day.localeCompare(y.day) || (x.start || '').localeCompare(y.start || ''))
      .forEach((a) => results.push({ key: `a${a.id}`, type: 'activity', item: a, title: a.title, sub: [fmtDay(a.day), a.start, cityMap[a.city]?.name, a.location].filter(Boolean).join(' · ') }));
    (data.ideas || []).filter((x) => hit(x.title, x.location, x.details, x.notes, cityMap[x.city]?.name))
      .forEach((x) => results.push({ key: `i${x.id}`, type: 'idea', item: x, title: x.title, sub: ['Ideia', cityMap[x.city]?.name, x.location].filter(Boolean).join(' · ') }));
    (data.stays || []).filter((s) => hit(s.name, s.address, s.notes, s.booking, cityMap[s.city]?.name))
      .forEach((s) => results.push({ key: `s${s.id}`, type: 'stay', item: s, title: s.name || 'Hospedagem', sub: ['Hospedagem', `${fmtDay(s.check_in)} → ${fmtDay(s.check_out)}`].join(' · ') }));
    (data.cities || []).filter((c) => c.key !== 'transito' && hit(c.name))
      .forEach((c) => results.push({ key: `c${c.id}`, type: 'city', item: c, title: c.name, sub: 'Cidade' }));
    (data.days || []).filter((d) => hit(d.title, d.notes))
      .forEach((d) => results.push({ key: `d${d.day}`, type: 'day', item: d, title: d.title || 'Anotações do dia', sub: `Dia · ${fmtDay(d.day)}` }));
  }
  const shown = results.slice(0, 60);
  const pick = (r) => { onPick(r.type, r.item); onClose(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCur((c) => Math.min(c + 1, shown.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCur((c) => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && shown[cur]) pick(shown[cur]);
  };

  return (
    <Modal title="Buscar na viagem" onClose={onClose}>
      <input className="search-input" autoFocus value={q} onChange={(e) => { setQ(e.target.value); setCur(0); }} onKeyDown={onKey}
        placeholder="Atividade, lugar, hotel, cidade, código do voo…" aria-label="Buscar" />
      {terms.length > 0 && shown.length === 0 && <div className="empty">Nada encontrado.</div>}
      {shown.length > 0 && (
        <ul className="search-results">
          {shown.map((r, i) => (
            <li key={r.key}>
              <button className={i === cur ? 'cur' : ''} onMouseEnter={() => setCur(i)} onClick={() => pick(r)}>
                <b>{r.title}</b><span>{r.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {results.length > shown.length && <div className="muted small">Mostrando {shown.length} de {results.length}. Refine a busca.</div>}
      {!terms.length && <div className="muted small search-hint">Dica: aperte “/” em qualquer tela da viagem para abrir a busca.</div>}
    </Modal>
  );
}

// ── baixar o mapa das cidades para usar sem internet
export function OfflineMapModal({ cities, onClose }) {
  const list = cities.filter((c) => c.key !== 'transito' && c.lat != null && c.lng != null);
  const [pick, setPick] = useState(() => new Set(list.map((c) => c.key)));
  const [km, setKm] = useState(8);
  const [prog, setProg] = useState(null);
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');
  const ctl = useRef(null);
  useEffect(() => { offlineInfo().then(setInfo); return () => ctl.current?.abort(); }, []);
  const chosen = list.filter((c) => pick.has(c.key));
  const n = useMemo(() => planTiles(chosen, km).length, [chosen.length, km]);
  const busy = prog && !prog.finished;
  const start = async () => {
    setErr(''); ctl.current = new AbortController();
    setProg({ done: 0, total: 1, bytes: 0, failed: 0 });
    try {
      const r = await downloadMaps(chosen, km, (p) => setProg(p), ctl.current.signal);
      setProg({ ...r, finished: true });
      setInfo(await offlineInfo());
    } catch (e) { setErr(`Não consegui baixar: ${e.message}`); setProg(null); }
  };
  const mb = (b) => `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return (
    <Modal title="Mapa offline" onClose={onClose} footer={<><span className="spacer" />{busy ? <button onClick={() => { ctl.current?.abort(); setProg(null); }}>Cancelar</button> : <button onClick={onClose}>Fechar</button>}</>}>
      <p className="muted">Guarda no aparelho o mapa em volta das cidades escolhidas, para navegar no mapa sem internet. Faça isso no Wi-Fi antes de viajar.</p>
      <div className="off-cities">
        {list.map((c) => (
          <label key={c.key} className="check-line">
            <input type="checkbox" checked={pick.has(c.key)} disabled={busy} onChange={(e) => setPick((s) => { const x = new Set(s); e.target.checked ? x.add(c.key) : x.delete(c.key); return x; })} />
            {c.name}
          </label>
        ))}
      </div>
      <label className="off-radius">Raio em volta de cada cidade
        <select value={km} disabled={busy} onChange={(e) => setKm(Number(e.target.value))}>
          {[4, 8, 12, 20].map((k) => <option key={k} value={k}>{k} km</option>)}
        </select>
      </label>
      <p className="small muted">{n} trechos de mapa, cerca de {estimateMB(n)} MB.</p>
      {prog && (
        <div className="off-prog">
          <div className="bar-t"><i style={{ width: `${Math.round((prog.done / prog.total) * 100)}%`, background: 'var(--accent)' }} /></div>
          <span className="small">{prog.finished ? `Pronto: ${prog.done} itens, ${mb(prog.bytes)}${prog.failed ? ` (${prog.failed} falharam; tente de novo)` : ''}.` : `Baixando ${prog.done} de ${prog.total} · ${mb(prog.bytes)}`}</span>
        </div>
      )}
      {err && <div className="warn">{err}</div>}
      <div className="row" style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="primary" disabled={busy || !chosen.length} onClick={start}>{info ? 'Baixar de novo' : 'Baixar mapa'}</button>
        {info && !busy && <button className="danger" onClick={async () => { await clearMaps(); setInfo(null); setProg(null); }}>Apagar mapas baixados</button>}
      </div>
      {info && !busy && <p className="small muted" style={{ marginTop: 10 }}>Já guardado: {info.cities?.join(', ') || 'mapa'}{info.km ? ` (${info.km} km)` : ''}{info.at ? `, em ${new Date(info.at).toLocaleDateString('pt-BR')}` : ''}.</p>}
    </Modal>
  );
}
