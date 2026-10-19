import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import MapView from './MapView.jsx';
import { setTripAccent } from './theme.js';
import AppearanceModal from './Look.jsx';
import Mark from './Mark.jsx';
import DayPanel from './DayPanel.jsx';
import TripPanel, { TripStrip } from './TripPanel.jsx';
import { ChecklistModal, StatsModal, CalendarModal, SearchModal, OfflineMapModal, downloadIcs, parseLinks } from './Extras.jsx';
import { MapSearch, Nearby } from './MapSearch.jsx';
import PinPanel from './PinPanel.jsx';
import { fetchRate, roundRate } from './fx.js';
import { EditModal, StaysModal, BudgetModal, CitiesModal, TripModal, ShareModal, RemindersModal } from './Modals.jsx';
import { useReminders, notifyOn, setNotify } from './reminders.js';
import { useSheet, useIsMobile, SheetHandle, heightOf } from './Sheet.jsx';
import {
  KIND_KEYS, KINDS, findConflicts, sortByTime, rangeDays, daysBetween, dayNum, dayWeek, fmtDay, fmtDayLong, hasCoords, makeFx, haversine, nowIn, passDone,
} from './util.js';


export default function TripView({ tripId, sel, onNavigate, onHome, onTripsChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const mapCenter = useRef(null);
  const [kinds, setKinds] = useState(() => new Set(KIND_KEYS));
  const [doneFilter, setDoneFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [picking, setPicking] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  // celular: o roteiro é um painel deslizante por cima do mapa
  const sheet = useSheet('half');
  const isMobile = useIsMobile();
  const [editPositions, setEditPositions] = useState(false);
  const [showStaysDay, setShowStaysDay] = useState(true);
  const [showStaysTrip, setShowStaysTrip] = useState(false);
  const [labelNumbers, setLabelNumbers] = useState(true);
  const [modal, setModal] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [cityFocus, setCityFocus] = useState(null);
  const [toast, setToast] = useState('');
  // exclusão com "desfazer": some na hora e só é apagada no servidor depois de alguns segundos
  const [undo, setUndo] = useState(null);
  const pendingDel = useRef(null);
  const flushDelete = useCallback(() => {
    const p = pendingDel.current;
    if (!p) return;
    pendingDel.current = null;
    clearTimeout(p.timer);
    p.commit().catch(() => p.onFail());
  }, []);
  useEffect(() => {
    window.addEventListener('pagehide', flushDelete);
    return () => { window.removeEventListener('pagehide', flushDelete); flushDelete(); };
  }, [flushDelete]);
  const [notify, setNotifyState] = useState(notifyOn);
  const nonce = useRef(0);

  const say = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(''), 3200); }, []);

  const reload = useCallback(async () => {
    try { setData(await api.trip(tripId)); setError(''); } catch (e) { setError(String(e.message || e)); }
  }, []);
  useEffect(() => { setData(null); reload(); }, [reload]);

  useReminders(data?.trip, data?.activities, notify);

  // anexos ficam guardados no aparelho (o service worker guarda cada um na primeira vez que é pedido)
  useEffect(() => {
    if (!data?.files?.length || !navigator.onLine || !navigator.serviceWorker?.controller) return;
    let stop = false;
    (async () => {
      const cache = await caches.open('files-v1');
      for (const f of data.files) {
        if (stop) return;
        if (!(await cache.match(api.fileUrl(f.id)))) await fetch(api.fileUrl(f.id)).catch(() => {});
      }
    })().catch(() => {});
    return () => { stop = true; };
  }, [data?.files]);

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
  // a viagem pode ter uma cor própria (Aparência), que vale enquanto ela está aberta
  useEffect(() => { setTripAccent(trip?.accent); return () => setTripAccent(null); }, [trip?.accent]);
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
      missing: list.filter((a) => !hasCoords(a) && a.kind !== 'free').length,
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
    const show = (a) => kinds.has(a.kind) && passDone(a, doneFilter);
    if (sel === 'trip') return (data?.activities || []).filter(show);
    return dayItems.filter(show);
  }, [sel, data, dayItems, kinds, doneFilter]);

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
      if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); setModal('search'); return; }
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
  const saveDayInfo = async (info) => {
    const saved = await api.saveDayNotes(tripId, sel, info);
    setData((d) => ({ ...d, days: [...(d.days || []).filter((x) => x.day !== sel), ...(saved.title || saved.notes ? [saved] : [])] }));
  };
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
      setData((d) => ({ ...d, ideas: d.ideas.filter((x) => x.id !== id), activities: [...d.activities, created], files: (d.files || []).map((f) => (f.idea_id === id ? { ...f, idea_id: null, activity_id: created.id } : f)) }));
      say(`Agendado em ${fmtDay(day)}`);
    } catch { say('Erro ao agendar'); }
  };
  const toIdeas = async () => {
    const { draft } = editing;
    try {
      const idea = await api.unscheduleActivity(draft.id);
      setData((d) => ({ ...d, activities: d.activities.filter((a) => a.id !== draft.id), ideas: [...d.ideas, idea], files: (d.files || []).map((f) => (f.activity_id === draft.id ? { ...f, activity_id: null, idea_id: idea.id } : f)) }));
      setEditing(null);
      say('Movido para as ideias');
    } catch { say('Erro ao mover'); }
  };

  const saveEdit = async () => {
    const { draft: { _pending: pending = [], ...draft }, isNew } = editing;
    const sendPending = async (owner, id) => {
      for (const f of pending) {
        try { const up = await api.uploadFile(owner, id, f); setData((d) => ({ ...d, files: [...(d.files || []), up] })); } catch (e) { say(`Não consegui anexar ${f.name}: ${e.message}`); }
      }
    };
    if (editing.idea) {
      try {
        if (isNew) {
          const created = await api.createIdea(tripId, draft);
          setData((d) => ({ ...d, ideas: [...d.ideas, created] }));
          await sendPending('idea', created.id);
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
        await sendPending('activity', created.id);
      } else {
        const saved = await api.updateActivity(draft.id, draft);
        setData((d) => ({ ...d, activities: d.activities.map((a) => (a.id === saved.id ? saved : a)) }));
      }
      if (draft.day !== sel && sel !== 'trip') say(`Salvo no dia ${fmtDay(draft.day)}`);
      setEditing(null);
    } catch (e) { say('Erro ao salvar'); }
  };

  // ── anexos
  const filesOf = (owner, id) => (data?.files || []).filter((f) => (owner === 'idea' ? f.idea_id === id : f.activity_id === id));
  const addFile = async (owner, id, file) => {
    const up = await api.uploadFile(owner, id, file);
    setData((d) => ({ ...d, files: [...(d.files || []), up] }));
  };
  const removeFile = (f) => softDelete(`${f.name} removido`, 'files', f, async () => {
    await api.deleteFile(f.id);
    if ('caches' in window) caches.open('files-v1').then((c) => c.delete(api.fileUrl(f.id))).catch(() => {});
  });

  const softDelete = (label, key, item, commit) => {
    flushDelete();
    setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== item.id) }));
    if (key === 'activities') setSelectedId((id) => (id === item.id ? null : id));
    const entry = {
      commit,
      onFail: () => { say('Erro ao excluir'); reload(); },
      timer: setTimeout(() => { if (pendingDel.current === entry) { flushDelete(); setUndo(null); } }, 6000),
    };
    pendingDel.current = entry;
    setUndo({
      label,
      run: () => {
        if (pendingDel.current !== entry) return;
        clearTimeout(entry.timer);
        pendingDel.current = null;
        setData((d) => ({ ...d, [key]: [...d[key], item] }));
        setUndo(null);
      },
    });
  };

  const deleteEdit = () => {
    const { draft } = editing;
    const isIdea = !!editing.idea;
    const original = (isIdea ? data.ideas : data.activities).find((x) => x.id === draft.id) || draft;
    setEditing(null);
    if (isIdea) softDelete(`Ideia excluída: ${draft.title}`, 'ideas', original, () => api.deleteIdea(draft.id));
    else softDelete(`Excluída: ${draft.title}`, 'activities', original, () => api.deleteActivity(draft.id));
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
  const quickOpen = (lat, lng, name, address, kind = 'sight') => {
    const base = { title: name || '', kind, city: nearestCity(lat, lng), location: address || '', details: '', cost: null, lat: +lat.toFixed(5), lng: +lng.toFixed(5) };
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

  const pinned = selectedId == null ? null : (data?.activities || []).find((x) => x.id === selectedId && hasCoords(x)) || null;
  const selectFromList = (id) => {
    setSelectedId(id);
    const a = data.activities.find((x) => x.id === id);
    if (hasCoords(a)) setFlyTarget({ lat: a.lat, lng: a.lng, nonce: ++nonce.current });
  };

  const onSearchPick = (type, item) => {
    if (type === 'activity') {
      go(item.day);
      setSelectedId(item.id);
      if (hasCoords(item)) setFlyTarget({ lat: item.lat, lng: item.lng, nonce: ++nonce.current });
      sheet.setDetent('half');
    } else if (type === 'idea') {
      setTimeout(() => openIdea(item), 0);
    } else if (type === 'stay') {
      setTimeout(() => setModal('stays'), 0);
    } else if (type === 'city') {
      go('trip');
      if (hasCoords(item)) focusCity(item);
    } else if (type === 'day') {
      go(item.day);
    }
  };
  const focusCity = (c) => setCityFocus({ lat: c.lat, lng: c.lng, nonce: ++nonce.current });

  const saveStay = async (id, s) => {
    const saved = await api.updateStay(id, s);
    setData((d) => ({ ...d, stays: d.stays.map((x) => (x.id === id ? saved : x)) }));
  };

  // câmbio: digitado à mão desliga a atualização automática; "auto" busca a cotação do dia
  const saveRate = async (r, patch = { rate_auto: 0 }) => {
    setData((d) => ({ ...d, trip: { ...d.trip, rate: r, ...patch } }));
    await api.saveTrip(tripId, { rate: r, ...patch });
  };
  const setRateAuto = async (on) => {
    setData((d) => ({ ...d, trip: { ...d.trip, rate_auto: on ? 1 : 0 } }));
    await api.saveTrip(tripId, { rate_auto: on ? 1 : 0 });
    if (on) refreshRate(true);
  };
  const refreshRate = useCallback(async (force) => {
    const t = data?.trip;
    if (!t || t.currency === t.home_currency || t.rate_auto === 0 || !navigator.onLine) return;
    const today = new Date().toISOString().slice(0, 10);
    if (!force && t.rate_at === today) return;
    try {
      const q = await fetchRate(t.currency, t.home_currency);
      const r = roundRate(q.rate);
      setData((d) => ({ ...d, trip: { ...d.trip, rate: r, rate_at: today } }));
      await api.saveTrip(tripId, { rate: r, rate_at: today });
    } catch { /* fica a cotação anterior */ }
  }, [data?.trip?.id, data?.trip?.rate_auto, data?.trip?.currency, data?.trip?.home_currency]);
  useEffect(() => { refreshRate(false); }, [refreshRate]);

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
  const deleteCheck = (id) => {
    const item = data.checklist.find((x) => x.id === id);
    if (item) softDelete(`Item removido: ${item.text}`, 'checklist', item, () => api.deleteCheck(id));
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

  const patchTrip = async (patch) => {
    setData((d) => ({ ...d, trip: { ...d.trip, ...patch } }));
    try { await api.saveTrip(tripId, patch); } catch { say('Erro ao salvar'); }
  };
  const setCalendar = async (on) => {
    const r = on ? await api.calendar(tripId) : await api.uncalendar(tripId);
    setData((d) => ({ ...d, trip: { ...d.trip, cal_token: r.cal_token } }));
  };
  const setShare = async (on) => {
    try {
      const r = on ? await api.share(tripId) : await api.unshare(tripId);
      setData((d) => ({ ...d, trip: { ...d.trip, share_token: r.share_token } }));
    } catch { say('Não consegui alterar o link'); }
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
        <button className="icon-btn" onClick={() => setModal('search')} title="Buscar na viagem (/)" aria-label="Buscar na viagem">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        </button>
        <button className="ghost hide-sm" onClick={() => setModal('stays')}>Hospedagens</button>
        <button className="ghost hide-sm" onClick={() => setModal('budget')}>Orçamento</button>
        <button className="ghost hide-sm" onClick={() => setModal('checklist')}>Checklist</button>
        <details className="menu">
          <summary aria-label="Mais opções" title="Mais opções"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg></summary>
          <div className="menu-pop" onClick={(e) => e.currentTarget.parentElement.removeAttribute('open')}>
            <button className="only-sm" onClick={() => setModal('stays')}>Hospedagens</button>
            <button className="only-sm" onClick={() => setModal('budget')}>Orçamento</button>
            <button className="only-sm" onClick={() => setModal('checklist')}>Checklist</button>
            <button onClick={() => setModal('look')}>Aparência</button>
            <button onClick={() => setModal('trip')}>Editar viagem</button>
            <button onClick={() => setModal('cities')}>Cidades e locais</button>
            <button onClick={() => setModal('stats')}>Estatísticas</button>
            <button onClick={() => setModal('calendar')}>Calendário</button>
            <button onClick={() => setModal('share')}>Compartilhar roteiro</button>
            <button onClick={() => setModal('offline')}>Mapa offline</button>
            <button onClick={() => setModal('reminders')}>Lembretes</button>
            <button onClick={() => window.print()}>Imprimir ou salvar PDF</button>
            <button onClick={() => downloadIcs(trip, data.activities, cityMap)}>Exportar para agenda (.ics)</button>
            <a href={`/api/trips/${tripId}/export`}>Exportar backup (JSON)</a>
          </div>
        </details>
      </header>

      <div className="main" data-detent={sheet.detent}>
        <aside className="side" ref={sheet.ref}>
          <SheetHandle detent={sheet.detent} handleProps={sheet.handleProps} onKey={() => sheet.setDetent((d) => (d === 'full' ? 'half' : d === 'half' ? 'full' : 'half'))} />
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
                conflictsTotal={conflictsTotal} kinds={kinds} onToggleKind={toggleKind} doneFilter={doneFilter} onDoneFilter={setDoneFilter} fx={fx}
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
                kinds={kinds} onToggleKind={toggleKind} doneFilter={doneFilter} onDoneFilter={setDoneFilter} fx={fx} tripTz={trip.tz} now={sel === today ? now.min : null}
                onPrev={() => step(-1)} onNext={() => step(1)} hasPrev={dayIndex > 0} hasNext={dayIndex < days.length - 1}
                dayInfo={(data.days || []).find((d) => d.day === sel) || null} onSaveDayInfo={saveDayInfo} files={data.files || []}
              />
            )}
          </div>
        </aside>

        <section className="mapwrap">
          <MapView
            centerRef={mapCenter}
            mode={sel === 'trip' ? 'trip' : 'day'}
            items={mapItems}
            stays={data.stays}
            cities={data.cities}
            stayByDay={sel === 'trip' ? null : stayFor(sel)}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); if (isMobile && id) sheet.setDetent('peek'); }}
            padBottom={isMobile && sheet.detent !== 'full' ? heightOf(sheet.detent, window.innerHeight - 56) : 0}
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
            onBackground={() => setSelectedId(null)}
          />
          {pinned && !editPositions && !picking && !quickAdd && (
            <PinPanel
              a={pinned} n={mapItems.find((x) => x.id === pinned.id)?.n} cityMap={cityMap} fx={fx} tripTz={trip.tz} files={filesOf('activity', pinned.id)}
              onEdit={openEdit} onToggleDone={toggleDone} onClose={() => setSelectedId(null)}
            />
          )}
          <div className="map-tools">
            <MapSearch onPick={(lat, lng, name, address) => { setFlyTarget({ lat, lng, nonce: ++nonce.current }); quickOpen(lat, lng, name, address); }} />
            <Nearby
              getOrigin={() => { const a = (data.activities || []).find((x) => x.id === selectedId); return hasCoords(a) ? { ...a, label: a.title } : mapCenter.current?.(); }}
              onPick={(lat, lng, name, address, kind) => { setFlyTarget({ lat, lng, nonce: ++nonce.current }); quickOpen(lat, lng, name, address, kind); }}
            />
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
            <div className="map-route">
              <TripStrip stays={data.stays} cityMap={cityMap} onCity={focusCity} />
              <div className="map-legend">
                <span><i className="ln solid" />Rota entre hospedagens</span>
                <span><i className="ln dashed" />Bate-volta</span>
              </div>
            </div>
          )}
          {isMobile && !picking && !editPositions && sheet.detent !== 'full' && (
            <button className="fab" onClick={() => (sel === 'trip' ? openIdea(null) : openNew())} aria-label={sel === 'trip' ? 'Nova ideia' : 'Nova atividade neste dia'} title={sel === 'trip' ? 'Nova ideia' : 'Nova atividade neste dia'}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
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
          files={editing.isNew ? [] : filesOf(editing.idea ? 'idea' : 'activity', editing.draft.id)}
          onAddFile={(f) => addFile(editing.idea ? 'idea' : 'activity', editing.draft.id, f)} onRemoveFile={removeFile}
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
      {modal === 'calendar' && <CalendarModal days={days} byDay={byDay} cityMap={cityMap} daysInfo={daysInfo} fx={fx} initialDay={sel === 'trip' ? days[0] : sel} onPick={(d, aid) => { setModal(null); go(d); if (aid) setSelectedId(aid); }} onClose={() => setModal(null)} />}
      {modal === 'search' && <SearchModal data={data} cityMap={cityMap} onPick={onSearchPick} onClose={() => setModal(null)} />}
      {modal === 'budget' && <BudgetModal activities={data.activities} stays={data.stays} cityMap={cityMap} days={days} fx={fx} onRate={saveRate} rateAuto={trip.rate_auto !== 0} rateAt={trip.rate_at} onRateAuto={setRateAuto} files={data.files || []} onClose={() => setModal(null)} />}
      {modal === 'look' && <AppearanceModal trip={trip} onTripAccent={(accent) => patchTrip({ accent })} onClose={() => setModal(null)} />}
      {modal === 'reminders' && <RemindersModal trip={trip} onSave={patchTrip} onCalendar={setCalendar} notify={notify} onNotify={async (on) => setNotifyState(await setNotify(on))} onClose={() => setModal(null)} />}
      {modal === 'offline' && <OfflineMapModal cities={data.cities} onClose={() => setModal(null)} />}
      {modal === 'share' && <ShareModal trip={trip} onCreate={() => setShare(true)} onRemove={() => setShare(false)} onClose={() => setModal(null)} />}
      {toast && !undo && <div className="toast">{toast}</div>}
      {undo && (
        <div className="toast undo-toast" role="status">
          <span>{undo.label}</span>
          <button onClick={undo.run}>Desfazer</button>
        </div>
      )}

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
                  <b>{a.title}</b>
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
