import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import MapView from './MapView.jsx';
import DayPanel from './DayPanel.jsx';
import TripPanel from './TripPanel.jsx';
import { EditModal, StaysModal, BudgetModal, CitiesModal, TripModal } from './Modals.jsx';
import {
  KIND_KEYS, KINDS, findConflicts, sortByTime, rangeDays, daysBetween, dayNum, dayWeek, fmtDay, fmtDayLong, hasCoords, makeFx,
} from './util.js';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function TripView({ tripId, sel, onNavigate, onHome, onTripsChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [kinds, setKinds] = useState(() => new Set(KIND_KEYS));
  const [editing, setEditing] = useState(null);
  const [picking, setPicking] = useState(false);
  const [editPositions, setEditPositions] = useState(false);
  const [showStaysDay, setShowStaysDay] = useState(true);
  const [showStaysTrip, setShowStaysTrip] = useState(false);
  const [labelNumbers, setLabelNumbers] = useState(true);
  const [modal, setModal] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [cityFocus, setCityFocus] = useState(null);
  const [toast, setToast] = useState('');
  const nonce = useRef(0);

  const say = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(''), 3200); }, []);

  const reload = useCallback(async () => {
    try { setData(await api.trip(tripId)); setError(''); } catch (e) { setError(String(e.message || e)); }
  }, []);
  useEffect(() => { setData(null); reload(); }, [reload]);

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

  const saveEdit = async () => {
    const { draft, isNew } = editing;
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

  const onMapPick = (lat, lng) => {
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

  if (error) return <div className="splash"><h1>🧳</h1><p>Não consegui abrir esta viagem.</p><code>{error}</code><div><button onClick={reload}>Tentar de novo</button> <button onClick={() => onHome()}>Voltar às viagens</button></div></div>;
  if (!data) return <div className="splash"><h1>🧳</h1><p>Carregando roteiro…</p></div>;

  const today = todayStr();
  const countdown = today < trip.start ? `Faltam ${daysBetween(today, trip.start)} dias`
    : today <= trip.end ? `Dia ${daysBetween(trip.start, today) + 1} da viagem` : 'Viagem concluída';

  const draftHidden = picking;

  return (
    <div className="app">
      <header className="top">
        <button className="icon-btn" onClick={() => onHome()} title="Minhas viagens" aria-label="Minhas viagens">←</button>
        <div className="brand" onClick={() => go('trip')} role="button" tabIndex={0}>
          <span className="logo">{trip.emoji || '🧳'}</span>
          <div>
            <div className="brand-name">{trip.name}</div>
            {trip.subtitle && <div className="brand-sub">{trip.subtitle}</div>}
          </div>
        </div>
        <div className="countdown">⏳ {countdown}</div>
        <span className="spacer" />
        <button onClick={() => setModal('stays')}>🏨 <span className="hide-sm">Hospedagens</span></button>
        <button onClick={() => setModal('budget')}>💰 <span className="hide-sm">Orçamento</span></button>
        <details className="menu">
          <summary>⋯</summary>
          <div className="menu-pop" onClick={(e) => e.currentTarget.parentElement.removeAttribute('open')}>
            <button onClick={() => setModal('trip')}>✎ Editar viagem</button>
            <button onClick={() => setModal('cities')}>📍 Cidades e locais</button>
            <button onClick={() => window.print()}>🖨️ Imprimir roteiro</button>
            <a href={`/api/trips/${tripId}/export`}>⬇️ Exportar backup (JSON)</a>
          </div>
        </details>
      </header>

      <div className="main">
        <aside className="side">
          <nav className="strip" aria-label="Dias da viagem">
            <button className={`dchip trip${sel === 'trip' ? ' on' : ''}`} onClick={() => go('trip')}>🗾<span>Viagem</span></button>
            {daysInfo.map((d) => (
              <button key={d.day} className={`dchip${sel === d.day ? ' on' : ''}${d.day === today ? ' today' : ''}`} onClick={() => go(d.day)} style={{ '--c': cityMap[d.cities[0]]?.color || '#94a3b8' }} title={fmtDayLong(d.day)}>
                <small>{d.week}</small>
                <b>{d.num}</b>
                <span>{cityMap[d.cities[0]]?.emoji || '·'}</span>
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
                onPickDay={go} daysInfo={daysInfo}
              />
            ) : (
              <DayPanel
                day={sel} dayIndex={dayIndex} items={dayItems} cityMap={cityMap} stay={stayFor(sel)}
                conflicts={dayConflicts} selectedId={selectedId} onSelect={selectFromList} onEdit={openEdit}
                onToggleDone={toggleDone} onAdd={openNew} onReorder={reorder} onSortTime={sortTime}
                kinds={kinds} onToggleKind={toggleKind} fx={fx}
                onPrev={() => step(-1)} onNext={() => step(1)} hasPrev={dayIndex > 0} hasNext={dayIndex < days.length - 1}
              />
            )}
          </div>
        </aside>

        <section className="mapwrap">
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
            picking={picking}
            onPick={onMapPick}
            flyTarget={flyTarget}
            cityFocus={cityFocus}
            fitKey={sel}
            showStays={sel === 'trip' ? showStaysTrip : showStaysDay}
            labelNumbers={labelNumbers}
          />
          <div className="map-tools">
            {sel !== 'trip' && (
              <button className={labelNumbers ? 'on' : ''} onClick={() => setLabelNumbers((v) => !v)} title="Alternar entre números e ícones">{labelNumbers ? '① Números' : '⛩️ Ícones'}</button>
            )}
            <button className={(sel === 'trip' ? showStaysTrip : showStaysDay) ? 'on' : ''} onClick={() => (sel === 'trip' ? setShowStaysTrip((v) => !v) : setShowStaysDay((v) => !v))}>🏨 Hotéis</button>
            {sel !== 'trip' && (
              <button className={editPositions ? 'on warn' : ''} onClick={() => setEditPositions((v) => !v)} title="Arraste os marcadores para corrigir a posição">✋ Mover pontos</button>
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
              📍 Clique no mapa para definir o local
              <button onClick={() => setPicking(false)}>Cancelar</button>
            </div>
          )}
          {editPositions && !picking && <div className="pick-banner soft">✋ Arraste os marcadores — a posição é salva automaticamente</div>}
        </section>
      </div>

      {editing && !draftHidden && (
        <EditModal
          draft={editing.draft} isNew={editing.isNew} cities={data.cities} days={days} fxCur={fx.cur}
          onChange={(d) => setEditing((e) => ({ ...e, draft: d }))}
          onSave={saveEdit} onDelete={deleteEdit} onClose={() => setEditing(null)}
          onPickMap={() => setPicking(true)}
        />
      )}
      {modal === 'stays' && <StaysModal stays={data.stays} cities={data.cities} trip={trip} onSave={saveStay} onCreate={createStay} onDelete={deleteStay} onClose={() => setModal(null)} />}
      {modal === 'cities' && <CitiesModal cities={data.cities} onCreate={createCity} onSave={saveCity} onDelete={deleteCity} onClose={() => setModal(null)} />}
      {modal === 'trip' && <TripModal trip={trip} onSave={saveTrip} onDelete={deleteTrip} onDuplicate={duplicateTrip} onClose={() => setModal(null)} />}
      {modal === 'budget' && <BudgetModal activities={data.activities} cityMap={cityMap} days={days} fx={fx} onRate={saveRate} onClose={() => setModal(null)} />}
      {toast && <div className="toast">{toast}</div>}

      <PrintView days={days} byDay={byDay} cityMap={cityMap} stays={data.stays} trip={trip} fx={fx} />
    </div>
  );
}

function PrintView({ days, byDay, cityMap, stays, trip, fx }) {
  return (
    <div className="print-only">
      <h1>{trip.name} — roteiro</h1>
      <h2>Hospedagens</h2>
      <ul>
        {stays.map((s) => <li key={s.id}><b>{s.name}</b> ({cityMap[s.city]?.name || '—'}) · {fmtDay(s.check_in)} → {fmtDay(s.check_out)}{s.address ? ` · ${s.address}` : ''}</li>)}
      </ul>
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
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
