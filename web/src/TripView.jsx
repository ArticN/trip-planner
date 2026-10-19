import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import MapView from './MapView.jsx';
import { getTheme, toggleTheme } from './theme.js';
import Mark from './Mark.jsx';
import DayPanel from './DayPanel.jsx';
import TripPanel from './TripPanel.jsx';
import { ChecklistModal, StatsModal, CalendarModal, downloadIcs, parseLinks } from './Extras.jsx';
import { MapSearch } from './MapSearch.jsx';
import { EditModal, StaysModal, BudgetModal, CitiesModal, TripModal } from './Modals.jsx';
import {
  KIND_KEYS, KINDS, findConflicts, sortByTime, rangeDays, daysBetween, dayNum, dayWeek, fmtDay, fmtDayLong, hasCoords, makeFx, haversine, nowIn,
} from './util.js';


export default function TripView({ tripId, sel, onNavigate, onHome, onTripsChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [kinds, setKinds] = useState(() => new Set(KIND_KEYS));
  const [editing, setEditing] = useState(null);
  const [picking, setPicking] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  const [editPositions, setEditPositions] = useState(false);
  const [showStaysDay, setShowStaysDay] = useState(true);
  const [showStaysTrip, setShowStaysTrip] = useState(false);
  const [labelNumbers, setLabelNumbers] = useState(true);
  const [modal, setModal] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [cityFocus, setCityFocus] = useState(null);
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useState(getTheme);
  const nonce = useRef(0);

  const say = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(''), 3200); }, []);

  const reload = useCallback(async () => {
    try { setData(await api.trip(tripId)); setError(''); } catch (e) { setError(String(e.message || e)); }
  }, []);
  useEffect(() => { setData(null); reload(); }, [reload]);

  // durante a viagem, abrir a viagem sem dia na URL vai direto para hoje
  const openedToday = useRef(false);
  useEffect(() => {
    if (!data || openedToday.current) return;
    openedToday.current = true;
    const t = nowIn(data.trip.tz).day;
    if (sel === 'trip' && t >= data.trip.start && t <= data.trip.end) onNavigate(t);
  }, [data]);

  // ── derivados
  const trip = data?.trip;
  const fx = useMemo(() => (trip ? makeFx(trip) : null), [trip]);
  const cityMap = useMemo(() => Object.fromEntries((data?.cities || []).map((c) => [c.key, c])), [data]);
  const days = useMemo(() => (trip ? rangeDays(trip.start, trip.end) : []), [trip]);
  const byDay = useMemo(() => {
    const m = {};
    (data?.activities || []).forEach((a) => { (m[a.day] ||= []).push(a); });
    Object.values(m).forEach((l) => l.sort((x, y) => x.sort - y.sort || x.id - y.id));
    return m;
  }, [data]);

  const daysInfo = useMemo(() => days.map((day) => {
    const list = byDay[day] || [];
    const counts = {};
    list.forEach((a) => { if (a.city && a.city !== 'transito') counts[a.city] = (counts[a.city] || 0) + 1; });
    const cities = Object.entries(counts).sort((x, y) => y[1] - x[1]).map(([k]) => k);
    return {
      day, num: dayNum(day), week: dayWeek(day), cities,
      count: list.length, cost: list.reduce((s, a) => s + (a.cost || 0), 0),
      conflicts: findConflicts(list).size,
    };
  }), [days, byDay]);

  // ordem de visita das cidades (primeira atividade de cada uma), como na barra de rota do Notion
  const routeStops = useMemo(() => {
    const order = [];
    const seen = new Set();
    const add = (k) => { if (k && k !== 'transito' && cityMap[k] && !seen.has(k)) { seen.add(k); order.push(cityMap[k]); } };
    [...(data?.activities || [])].sort((a, b) => a.day.localeCompare(b.day) || a.sort - b.sort).forEach((a) => add(a.city));
    (data?.stays || []).forEach((s) => add(s.city));
    return order;
  }, [data, cityMap]);

  const conflictsTotal = daysInfo.reduce((s, d) => s + d.conflicts, 0);
  const dayIndex = sel === 'trip' ? -1 : days.indexOf(sel);
  const dayItems = useMemo(() => (sel === 'trip' ? [] : (byDay[sel] || []).map((a, i) => ({ ...a, n: i + 1 }))), [sel, byDay]);
  const dayConflicts = useMemo(() => findConflicts(dayItems), [dayItems]);

  const stayFor = useCallback((day) => {
    const stays = data?.stays || [];
    return stays.find((s) => s.check_in <= day && day < s.check_out) || stays.find((s) => s.check_out === day) || null;
  }, [data]);

  const mapItems = useMemo(() => {
    if (sel === 'trip') return (data?.activities || []).filter((a) => kinds.has(a.kind));
    return dayItems.filter((a) => kinds.has(a.kind));
  }, [sel, data, dayItems, kinds]);

  // ── navegação
  const go = useCallback((target) => {
    setSelectedId(null);
    onNavigate(target);
  }, [onNavigate]);

  const step = useCallback((delta) => {
    if (sel === 'trip') return;
    const i = days.indexOf(sel) + delta;
    if (i >= 0 && i < days.length) go(days[i]);
  }, [sel, days, go]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && picking) { setPicking(false); return; }
      const tag = document.activeElement?.tagName;
      if (modal || editing || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, modal, editing, picking]);

  const toggleKind = (k) => setKinds((prev) => {
    const n = new Set(prev);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  });

  // ── edição de dados
  const patchLocal = (id, patch) => setData((d) => ({ ...d, activities: d.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));

  const updateActivity = async (id, patch) => {
    patchLocal(id, patch);
    try { await api.updateActivity(id, patch); } catch (e) { say('Erro ao salvar — recarregando'); reload(); }
  };

  const toggleDone = (a) => updateActivity(a.id, { done: a.done ? 0 : 1 });

  const openEdit = (id) => {
    const a = data.activities.find((x) => x.id === id);
    if (a) setEditing({ draft: { ...a }, isNew: false });
  };

  const openNew = () => {
    const day = sel === 'trip' ? days.find((d) => (byDay[d] || []).length) || days[0] : sel;
    const city = daysInfo.find((d) => d.day === day)?.cities[0] || '';
    setEditing({ draft: { day, city, kind: 'sight', title: '', start: null, end: null, location: '', details: '', transport: '', cost: null, lat: null, lng: null, done: 0 }, isNew: true });
  };

  const openIdea = (idea) => setEditing({ draft: idea ? { ...idea } : { kind: 'sight', title: '', city: '', location: '', details: '', cost: null, lat: null, lng: null }, isNew: !idea, idea: true });

  const scheduleIdea = async (id, day) => {
    try {
      const created = await api.scheduleIdea(id, day);
      setData((d) => ({ ...d, ideas: d.ideas.filter((x) => x.id !== id), activities: [...d.activities, created] }));
      say(`Agendado em ${fmtDay(day)}`);
    } catch { say('Erro ao agendar'); }
  };
  const toIdeas = async () => {
    const { draft } = editing;
    try {
      const idea = await api.unscheduleActivity(draft.id);
      setData((d) => ({ ...d, activities: d.activities.filter((a) => a.id !== draft.id), ideas: [...d.ideas, idea] }));
      setEditing(null);
      say('Movido para as ideias');
    } catch { say('Erro ao mover'); }
  };

  const saveEdit = async () => {
    const { draft, isNew } = editing;
    if (editing.idea) {
      try {
        if (isNew) {
          const created = await api.createIdea(tripId, draft);
          setData((d) => ({ ...d, ideas: [...d.ideas, created] }));
        } else {
          const saved = await api.updateIdea(draft.id, draft);
          setData((d) => ({ ...d, ideas: d.ideas.map((x) => (x.id === saved.id ? saved : x)) }));
        }
        setEditing(null);
      } catch { say('Erro ao salvar'); }
      return;
    }
    try {
      if (isNew) {
        const created = await api.createActivity(tripId, draft);
        setData((d) => ({ ...d, activities: [...d.activities, created] }));
        setSelectedId(created.id);
      } else {
        const saved = await api.updateActivity(draft.id, draft);
        setData((d) => ({ ...d, activities: d.activities.map((a) => (a.id === saved.id ? saved : a)) }));
      }
      if (draft.day !== sel && sel !== 'trip') say(`Salvo no dia ${fmtDay(draft.day)}`);
      setEditing(null);
    } catch (e) { say('Erro ao salvar'); }
  };

  const deleteEdit = async () => {
    const { draft } = editing;
    if (!window.confirm(`Excluir "${draft.title}"?`)) return;
    if (editing.idea) {
      try {
        await api.deleteIdea(draft.id);
        setData((d) => ({ ...d, ideas: d.ideas.filter((x) => x.id !== draft.id) }));
        setEditing(null);
      } catch { say('Erro ao excluir'); }
      return;
    }
    try {
      await api.deleteActivity(draft.id);
      setData((d) => ({ ...d, activities: d.activities.filter((a) => a.id !== draft.id) }));
      setEditing(null);
    } catch (e) { say('Erro ao excluir'); }
  };

  const reorder = async (ids) => {
    const pos = Object.fromEntries(ids.map((id, i) => [id, i]));
    setData((d) => ({ ...d, activities: d.activities.map((a) => (a.id in pos && a.day === sel ? { ...a, sort: pos[a.id] } : a)) }));
    try { await api.reorderDay(tripId, sel, ids); } catch { say('Erro ao reordenar'); reload(); }
  };

  const sortTime = () => {
    const sorted = sortByTime(dayItems);
    reorder(sorted.map((a) => a.id));
    say('Ordenado por horário');
  };

  // ── adição rápida: clique no mapa ou resultado da busca → atividade do dia (ou ideia, na visão geral)
  const nearestCity = (lat, lng) => {
    let best = null; let bd = 80;
    (data.cities || []).filter((c) => c.key !== 'transito' && hasCoords(c)).forEach((c) => { const d = haversine(c, { lat, lng }); if (d < bd) { bd = d; best = c.key; } });
    return best || '';
  };
  const quickOpen = (lat, lng, name, address) => {
    const base = { title: name || '', kind: 'sight', city: nearestCity(lat, lng), location: address || '', details: '', cost: null, lat: +lat.toFixed(5), lng: +lng.toFixed(5) };
    if (sel === 'trip') setEditing({ draft: base, isNew: true, idea: true });
    else setEditing({ draft: { ...base, day: sel, start: null, end: null, transport: '', done: 0 }, isNew: true });
  };
  const quickAddAt = async (lat, lng) => {
    setQuickAdd(false);
    let name = ''; let address = '';
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=pt-BR&lat=${lat}&lon=${lng}`);
      if (r.ok) {
        const j = await r.json();
        name = j.name || '';
        address = (j.display_name || '').split(',').slice(name ? 1 : 0, name ? 3 : 2).join(',').trim();
      }
    } catch { /* sem rede: abre só com a posição */ }
    quickOpen(lat, lng, name, address);
  };

  const onMapPick = (lat, lng) => {
    if (quickAdd) { quickAddAt(lat, lng); return; }
    setEditing((e) => (e ? { ...e, draft: { ...e.draft, lat: +lat.toFixed(5), lng: +lng.toFixed(5) } } : e));
    setPicking(false);
  };

  const onMarkerMove = (id, lat, lng) => updateActivity(id, { lat: +lat.toFixed(5), lng: +lng.toFixed(5) });

  const selectFromList = (id) => {
    setSelectedId(id);
    const a = data.activities.find((x) => x.id === id);
    if (hasCoords(a)) setFlyTarget({ lat: a.lat, lng: a.lng, nonce: ++nonce.current });
  };

  const focusCity = (c) => setCityFocus({ lat: c.lat, lng: c.lng, nonce: ++nonce.current });

  const saveStay = async (id, s) => {
    const saved = await api.updateStay(id, s);
    setData((d) => ({ ...d, stays: d.stays.map((x) => (x.id === id ? saved : x)) }));
  };

  const saveRate = async (r) => {
    setData((d) => ({ ...d, trip: { ...d.trip, rate: r } }));
    await api.saveTrip(tripId, { rate: r });
  };

  const createStay = async (s) => {
    const created = await api.createStay(tripId, s);
    setData((d) => ({ ...d, stays: [...d.stays, created] }));
    return created;
  };
  const deleteStay = async (id) => {
    await api.deleteStay(id);
    setData((d) => ({ ...d, stays: d.stays.filter((x) => x.id !== id) }));
  };

  const createCheck = async (c) => {
    const created = await api.createCheck(tripId, c);
    setData((d) => ({ ...d, checklist: [...d.checklist, created] }));
  };
  const updateCheck = async (id, patch) => {
    setData((d) => ({ ...d, checklist: d.checklist.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    await api.updateCheck(id, patch);
  };
  const deleteCheck = async (id) => {
    await api.deleteCheck(id);
    setData((d) => ({ ...d, checklist: d.checklist.filter((x) => x.id !== id) }));
  };

  const createCity = async (c) => {
    const created = await api.createCity(tripId, c);
    setData((d) => ({ ...d, cities: [...d.cities, created] }));
    return created;
  };
  const saveCity = async (id, c) => {
    const saved = await api.updateCity(id, c);
    setData((d) => ({ ...d, cities: d.cities.map((x) => (x.id === id ? saved : x)) }));
  };
  const deleteCity = async (id) => {
    await api.deleteCity(id);
    reload();
  };

  const saveTrip = async (t) => {
    try {
      const saved = await api.saveTrip(tripId, t);
      setData((d) => ({ ...d, trip: saved }));
      onTripsChanged();
      setModal(null);
    } catch { say('Erro ao salvar a viagem'); }
  };
  const deleteTrip = async () => {
    if (!window.confirm(`Excluir a viagem "${trip.name}" e todas as suas atividades? Não dá pra desfazer (exporte um backup antes se quiser guardar).`)) return;
    await api.deleteTrip(tripId);
    onTripsChanged();
    onHome();
  };
  const duplicateTrip = async () => {
    const d = await api.duplicateTrip(tripId);
    onTripsChanged();
    setModal(null);
    onHome(d.trip.id);
  };

  if (error) return <div className="splash"><h1><Mark size={44} /></h1><p>Não consegui abrir esta viagem.</p><code>{error}</code><div><button onClick={reload}>Tentar de novo</button> <button onClick={() => onHome()}>Voltar às viagens</button></div></div>;
  if (!data) return <div className="splash"><h1><Mark size={44} /></h1><p>Carregando roteiro…</p></div>;

  const now = nowIn(trip.tz);
  const today = now.day;
  const countdown = today < trip.start ? `Faltam ${daysBetween(today, trip.start)} dias`
    : today <= trip.end ? `Dia ${daysBetween(trip.start, today) + 1} da viagem` : 'Viagem concluída';

  const draftHidden = picking;

  return (
    <div className="app">
      <header className="top">
        <button className="icon-btn" onClick={() => onHome()} title="Minhas viagens" aria-label="Minhas viagens">←</button>
        <div className="brand" onClick={() => go('trip')} role="button" tabIndex={0}>
          <span className="logo"><Mark /></span>
          <div>
            <div className="brand-name">{trip.name}</div>
            {trip.subtitle && <div className="brand-sub">{trip.subtitle}</div>}
          </div>
        </div>
        <div className="countdown">{countdown}</div>
        <span className="spacer" />
        <button onClick={() => setModal('stays')}>Hospedagens</button>
        <button onClick={() => setModal('budget')}>Orçamento</button>
        <button className="hide-sm" onClick={() => setModal('checklist')}>Checklist</button>
        <details className="menu">
          <summary>⋯</summary>
          <div className="menu-pop" onClick={(e) => e.currentTarget.parentElement.removeAttribute('open')}>
            <button onClick={() => setTheme(toggleTheme())}>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</button>
            <button onClick={() => setModal('trip')}>Editar viagem</button>
            <button onClick={() => setModal('cities')}>Cidades e locais</button>
            <button onClick={() => setModal('stats')}>Estatísticas</button>
            <button onClick={() => setModal('calendar')}>Calendário</button>
            <button onClick={() => window.print()}>Imprimir ou salvar PDF</button>
            <button onClick={() => downloadIcs(trip, data.activities, cityMap)}>Exportar para agenda (.ics)</button>
            <a href={`/api/trips/${tripId}/export`}>Exportar backup (JSON)</a>
          </div>
        </details>
      </header>

      <div className="main">
        <aside className="side">
          <nav className="strip" aria-label="Dias da viagem">
            <button className={`dchip trip${sel === 'trip' ? ' on' : ''}`} onClick={() => go('trip')}><b>Geral</b></button>
            {daysInfo.map((d) => (
              <button key={d.day} className={`dchip${sel === d.day ? ' on' : ''}${d.day === today ? ' today' : ''}`} onClick={() => go(d.day)} style={{ '--c': cityMap[d.cities[0]]?.color || '#94a3b8' }} title={fmtDayLong(d.day)}>
                <small>{d.week}</small>
                <b>{d.num}</b>
                <i className="cdot" />
                {d.conflicts > 0 && <i className="alert" />}
              </button>
            ))}
          </nav>
          <div className="side-body">
            {sel === 'trip' ? (
              <TripPanel
                trip={trip} cities={data.cities} cityMap={cityMap} stays={data.stays} activities={data.activities}
                conflictsTotal={conflictsTotal} kinds={kinds} onToggleKind={toggleKind} fx={fx}
                onCity={focusCity} onOpenStays={() => setModal('stays')} onOpenBudget={() => setModal('budget')}
                onOpenCities={() => setModal('cities')} onEditTrip={() => setModal('trip')}
                checklist={data.checklist} onOpen={setModal}
                ideas={data.ideas} days={days} onIdea={openIdea} onSchedule={scheduleIdea}
                onPickDay={go} daysInfo={daysInfo}
              />
            ) : (
              <DayPanel
                day={sel} dayIndex={dayIndex} items={dayItems} cityMap={cityMap} stay={stayFor(sel)} checkout={sel === 'trip' ? null : (data.stays || []).find((s) => s.check_out === sel && s !== stayFor(sel)) || null}
                conflicts={dayConflicts} selectedId={selectedId} onSelect={selectFromList} onEdit={openEdit}
                onToggleDone={toggleDone} onAdd={openNew} onReorder={reorder} onSortTime={sortTime}
                kinds={kinds} onToggleKind={toggleKind} fx={fx} tripTz={trip.tz} now={sel === today ? now.min : null}
                onPrev={() => step(-1)} onNext={() => step(1)} hasPrev={dayIndex > 0} hasNext={dayIndex < days.length - 1}
              />
            )}
          </div>
        </aside>

        <section className={`mapwrap${sel === 'trip' && routeStops.length ? ' with-bar' : ''}`}>
          <MapView
            mode={sel === 'trip' ? 'trip' : 'day'}
            items={mapItems}
            stays={data.stays}
            cities={data.cities}
            stayByDay={sel === 'trip' ? null : stayFor(sel)}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onEdit={openEdit}
            editPositions={editPositions}
            onMove={onMarkerMove}
            picking={picking || quickAdd}
            onPick={onMapPick}
            ideas={sel === 'trip' ? data.ideas : []}
            onIdea={openIdea}
            flyTarget={flyTarget}
            cityFocus={cityFocus}
            fitKey={sel}
            showStays={sel === 'trip' ? showStaysTrip : showStaysDay}
            labelNumbers={labelNumbers}
          />
          {sel === 'trip' && routeStops.length > 0 && (
            <div className="route-bar">
              <b>Rota da viagem</b>
              {routeStops.map((c, i) => (
                <span key={c.key} style={{ display: 'contents' }}>
                  {i > 0 && <span className="sep">→</span>}
                  <button className="stop" style={{ '--c': c.color }} onClick={() => focusCity(c)}><i />{c.name}</button>
                </span>
              ))}
            </div>
          )}
          <div className="map-tools">
            <MapSearch onPick={(lat, lng, name, address) => { setFlyTarget({ lat, lng, nonce: ++nonce.current }); quickOpen(lat, lng, name, address); }} />
            <button className={quickAdd ? 'on' : ''} onClick={() => setQuickAdd((v) => !v)} title={sel === 'trip' ? 'Clique no mapa para criar uma ideia ali' : 'Clique no mapa para criar uma atividade ali'}>{quickAdd ? 'Clique no mapa…' : '+ No mapa'}</button>
            {sel !== 'trip' && (
              <button className={labelNumbers ? 'on' : ''} onClick={() => setLabelNumbers((v) => !v)} title="Alternar entre números e ícones">{labelNumbers ? 'Números' : 'Ícones'}</button>
            )}
            <button className={(sel === 'trip' ? showStaysTrip : showStaysDay) ? 'on' : ''} onClick={() => (sel === 'trip' ? setShowStaysTrip((v) => !v) : setShowStaysDay((v) => !v))}>Hotéis</button>
            {sel !== 'trip' && (
              <button className={editPositions ? 'on warn' : ''} onClick={() => setEditPositions((v) => !v)} title="Arraste os marcadores para corrigir a posição">Mover pontos</button>
            )}
          </div>
          {sel === 'trip' && (
            <div className="legend-box">
              <b>Legenda</b>
              <div><span className="ln solid" /> Rota entre hospedagens</div>
              <div><span className="ln dashed" /> Bate-volta</div>
            </div>
          )}
          {picking && (
            <div className="pick-banner">
              Clique no mapa para definir o local
              <button onClick={() => setPicking(false)}>Cancelar</button>
            </div>
          )}
          {editPositions && !picking && <div className="pick-banner soft">Arraste os marcadores — a posição é salva automaticamente</div>}
        </section>
      </div>

      {editing && !draftHidden && (
        <EditModal tripTz={trip.tz}
          draft={editing.draft} isNew={editing.isNew} isIdea={!!editing.idea} onToIdeas={toIdeas} cities={data.cities} days={days} fxCur={fx.cur}
          onChange={(d) => setEditing((e) => ({ ...e, draft: d }))}
          onSave={saveEdit} onDelete={deleteEdit} onClose={() => setEditing(null)}
          onPickMap={() => setPicking(true)}
        />
      )}
      {modal === 'stays' && <StaysModal stays={data.stays} cities={data.cities} trip={trip} onSave={saveStay} onCreate={createStay} onDelete={deleteStay} onClose={() => setModal(null)} />}
      {modal === 'cities' && <CitiesModal cities={data.cities} onCreate={createCity} onSave={saveCity} onDelete={deleteCity} onClose={() => setModal(null)} />}
      {modal === 'trip' && <TripModal trip={trip} onSave={saveTrip} onDelete={deleteTrip} onDuplicate={duplicateTrip} onClose={() => setModal(null)} />}
      {modal === 'checklist' && <ChecklistModal items={data.checklist} onCreate={createCheck} onUpdate={updateCheck} onDelete={deleteCheck} onClose={() => setModal(null)} />}
      {modal === 'stats' && <StatsModal activities={data.activities} stays={data.stays} cityMap={cityMap} days={days} fx={fx} onClose={() => setModal(null)} />}
      {modal === 'calendar' && <CalendarModal days={days} byDay={byDay} cityMap={cityMap} daysInfo={daysInfo} fx={fx} onPick={(d) => { setModal(null); go(d); }} onClose={() => setModal(null)} />}
      {modal === 'budget' && <BudgetModal activities={data.activities} stays={data.stays} cityMap={cityMap} days={days} fx={fx} onRate={saveRate} onClose={() => setModal(null)} />}
      {toast && <div className="toast">{toast}</div>}

      <PrintView days={days} byDay={byDay} cityMap={cityMap} stays={data.stays} trip={trip} fx={fx} checklist={data.checklist} />
    </div>
  );
}

function PrintView({ days, byDay, cityMap, stays, trip, fx, checklist }) {
  return (
    <div className="print-only">
      <h1>{trip.name} — roteiro</h1>
      <h2>Hospedagens</h2>
      <ul>
        {stays.map((s) => <li key={s.id}><b>{s.name}</b> ({cityMap[s.city]?.name || '—'}) · {fmtDay(s.check_in)} → {fmtDay(s.check_out)}{s.address ? ` · ${s.address}` : ''}</li>)}
      </ul>
      {checklist.length > 0 && (
        <>
          <h2>Checklist</h2>
          <ul className="print-check">
            {checklist.map((c) => <li key={c.id}>{c.done ? '[x]' : '[ ]'} {c.text}{c.grp ? <span className="pt"> · {c.grp}</span> : null}</li>)}
          </ul>
        </>
      )}
      {days.map((d) => {
        const list = byDay[d] || [];
        if (!list.length) return null;
        const cost = list.reduce((s, a) => s + (a.cost || 0), 0);
        return (
          <section key={d}>
            <h2>{fmtDayLong(d)}{cost ? ` · ${fx.fmt(cost)}` : ''}</h2>
            <ul>
              {list.map((a) => (
                <li key={a.id}>
                  <span className="pt">{a.start ? `${a.start}${a.end ? '–' + a.end : ''}` : '  —  '}</span>{' '}
                  {KINDS[a.kind]?.icon} <b>{a.title}</b>
                  {a.location ? ` — ${a.location}` : ''}
                  {a.cost ? ` (${fx.fmt(a.cost)})` : ''}
                  {a.notes ? <div className="pt">{a.notes}</div> : null}
                  {parseLinks(a.links).map((l, i) => <div key={i} className="pt">{l.url}</div>)}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
