import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { useTripChanged } from './offline/index.js';
import { openOfflinePanel } from './OfflinePanel.jsx';
import MapView from './MapView.jsx';
import { setTripAccent } from './theme.js';
import AppearanceModal from './Look.jsx';
import Mark from './Mark.jsx';
import DayPanel from './DayPanel.jsx';
import TripPanel from './TripPanel.jsx';
import Metro from './Metro.jsx';
import Analysis from './Analysis.jsx';
import Tickets from './Tickets.jsx';
import Journal from './Journal.jsx';
import Notes from './Notes.jsx';
import { hasPlace, autoCaption } from './photoMeta.js';
import { ChecklistModal, StatsModal, CalendarModal, SearchModal, OfflineMapModal, downloadIcs, parseLinks } from './Extras.jsx';
import { MapSearch, Nearby } from './MapSearch.jsx';
import PinPanel from './PinPanel.jsx';
import PlaceCard from './PlaceCard.jsx';
import { fetchRate, roundRate } from './fx.js';
import { ShoppingModal } from './Shopping.jsx';
import { useTripPlace } from './geo.js';
import { autoLocate, describePoint } from './geocode.js';
import { EditModal, StaysModal, BudgetModal, CitiesModal, TripModal, ShareModal, RemindersModal } from './Modals.jsx';
import { useReminders, notifyOn, setNotify } from './reminders.js';
import { useSheet, useIsMobile, SheetHandle, heightOf } from './Sheet.jsx';
import {
  KIND_KEYS, KINDS, findConflicts, sortByTime, orderBySlots, SLOTS, rangeDays, daysBetween, dayNum, dayWeek, fmtDay, fmtDayLong, hasCoords, makeFx, haversine, nowIn, passDone,
  principals, collapseAlts, altGroups, altKey, newAltKey,
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
  // marcador novo no mapa (busca, "Perto daqui", + No mapa ou tocar e segurar), antes de virar atividade/ideia
  const [preview, setPreview] = useState(null);
  useEffect(() => { if (selectedId != null) setPreview(null); }, [selectedId]);
  // celular: o roteiro é um painel deslizante por cima do mapa
  const sheet = useSheet('half');
  const isMobile = useIsMobile();
  const [editPositions, setEditPositions] = useState(false);
  const [showStaysDay, setShowStaysDay] = useState(true);
  const [showStaysTrip, setShowStaysTrip] = useState(false);
  const [labelNumbers, setLabelNumbers] = useState(true);
  // fotos do diário no mapa (só as que vieram com GPS)
  const [showPhotos, setShowPhotos] = useState(() => { try { return localStorage.getItem('map-photos') !== '0'; } catch { return true; } });
  const togglePhotos = () => setShowPhotos((v) => { try { localStorage.setItem('map-photos', v ? '0' : '1'); } catch { /* vale só agora */ } return !v; });
  const [openPhoto, setOpenPhoto] = useState(null);
  const [modal, setModal] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [cityFocus, setCityFocus] = useState(null);
  const [toast, setToast] = useState('');
  // carrossel de opções no mesmo horário: qual opção cada grupo está mostrando (grupo → id)
  const [altView, setAltView] = useState({});
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
  // edições feitas sem internet foram enviadas (ids definitivos) ou chegou uma versão mais nova: atualiza a tela
  useTripChanged(tripId, reload);

  // das opções no mesmo horário, só a principal conta no orçamento, nas estatísticas, na agenda e no PDF
  const acts = useMemo(() => principals(data?.activities || []), [data]);
  // ida e volta: primeiro e último voo da viagem (o dia mostra cada um num cartão de viagem)
  const travel = useMemo(() => {
    const fl = acts.filter((a) => a.kind === 'flight').sort((x, y) => (x.day + (x.start || '')).localeCompare(y.day + (y.start || '')));
    return { ida: fl[0]?.id, volta: fl.length > 1 ? fl[fl.length - 1].id : null };
  }, [acts]);
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
  // nacional ou internacional (escolhido na viagem ou descoberto pelas cidades e o país onde mora)
  const place = useTripPlace(trip, data?.cities);
  // a viagem pode ter uma cor própria (Aparência), que vale enquanto ela está aberta
  useEffect(() => { setTripAccent(trip?.accent); return () => setTripAccent(null); }, [trip?.accent]);
  const cityMap = useMemo(() => Object.fromEntries((data?.cities || []).map((c) => [c.key, c])), [data]);
  const days = useMemo(() => (trip ? rangeDays(trip.start, trip.end) : []), [trip]);
  const groupDays = (list) => {
    const m = {};
    list.forEach((a) => { (m[a.day] ||= []).push(a); });
    Object.keys(m).forEach((d) => { m[d] = orderBySlots(m[d]); });
    return m;
  };
  const byDay = useMemo(() => groupDays(acts), [acts]);
  // o dia com todas as opções (o painel do dia mostra cada grupo como um carrossel)
  const byDayAll = useMemo(() => groupDays(data?.activities || []), [data]);

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

  const railCity = (day) => (data?.stays || []).find((s) => s.check_in <= day && day < s.check_out)?.city;
  const conflictsTotal = daysInfo.reduce((s, d) => s + d.conflicts, 0);
  const dayIndex = sel === 'trip' ? -1 : days.indexOf(sel);
  const dayItems = useMemo(() => (sel === 'trip' ? [] : collapseAlts(byDayAll[sel] || [], altView).map((a, i) => ({ ...a, n: i + 1 }))), [sel, byDayAll, altView]);
  const dayConflicts = useMemo(() => findConflicts(dayItems), [dayItems]);

  const stayFor = useCallback((day) => {
    const stays = data?.stays || [];
    return stays.find((s) => s.check_in <= day && day < s.check_out) || stays.find((s) => s.check_out === day) || null;
  }, [data]);

  // hospedagem que faz check-out no dia escolhido (dia de troca de cidade)
  const checkoutStay = sel === 'trip' ? null : (data?.stays || []).find((s) => s.check_out === sel && s !== stayFor(sel)) || null;

  const mapItems = useMemo(() => {
    const show = (a) => kinds.has(a.kind) && passDone(a, doneFilter);
    if (sel === 'trip') return acts.filter(show);
    return dayItems.filter(show);
  }, [sel, acts, dayItems, kinds, doneFilter]);
  // as outras opções do carrossel aparecem apagadas no mapa do dia
  const mapAlts = useMemo(() => mapItems.flatMap((a) => (a.alts || []).filter((x) => x.id !== a.id && hasCoords(x)).map((x) => ({ ...x, n: a.n, of: a.alts.length, at: a.alts.indexOf(x) + 1 }))), [mapItems]);

  // ── navegação
  const go = useCallback((target) => {
    setSelectedId(null);
    onNavigate(target);
  }, [onNavigate]);
  const showPhoto = (id) => { setOpenPhoto(id); go('diario'); };

  // a faixa de dias rola sozinha até o dia aberto (em viagens longas o dia de hoje ficava fora da tela)
  const stripRef = useRef(null);
  const loaded = !!data;
  useEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.querySelector('.dchip.on');
    if (!chip) return;
    const s = strip.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    if (c.left >= s.left && c.right <= s.right) return;
    strip.scrollTo({ left: strip.scrollLeft + (c.left - s.left) - (s.width - c.width) / 2 });
  }, [sel, loaded]);

  // menu "Mais opções": fecha com Esc ou tocando fora (antes ficava aberto por cima de outras telas)
  const menuRef = useRef(null);
  useEffect(() => {
    const close = (e) => {
      const m = menuRef.current;
      if (!m?.open) return;
      if (e.type === 'keydown' ? e.key === 'Escape' : !m.contains(e.target)) m.removeAttribute('open');
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, []);
  useEffect(() => { menuRef.current?.removeAttribute('open'); }, [sel]);
  useEffect(() => { if (sel !== 'diario') setOpenPhoto(null); }, [sel]);

  // fotos com GPS: no mapa da viagem todas, no mapa do dia só as do dia (com o caminho feito)
  const geoPhotos = useMemo(() => (data?.photos || []).filter(hasPlace).filter((p) => sel === 'trip' || p.day === sel), [data?.photos, sel]);
  const mapPhotos = useMemo(() => {
    const byId = Object.fromEntries((data?.activities || []).map((a) => [a.id, a]));
    return geoPhotos.map((p) => ({ ...p, label: p.caption || autoCaption(p, byId, data?.cities || []) }));
  }, [geoPhotos, data?.activities, data?.cities]);

  const step = useCallback((delta) => {
    if (sel === 'trip' || sel === 'analise' || sel === 'ingressos' || sel === 'diario' || sel === 'notas') return;
    const i = days.indexOf(sel) + delta;
    if (i >= 0 && i < days.length) go(days[i]);
  }, [sel, days, go]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && picking) { setPicking(false); return; }
      if (e.key === 'Escape' && preview && !editing && !modal) { setPreview(null); return; }
      const tag = document.activeElement?.tagName;
      if (modal || editing || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (sel === 'analise' || sel === 'ingressos' || sel === 'diario' || sel === 'notas') return; // páginas cheias têm os próprios atalhos
      if (e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); setModal('search'); return; }
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, modal, editing, picking, sel, preview]);

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

  const openNew = (slot) => {
    const slotKey = typeof slot === 'string' ? slot : null;
    const meal = SLOTS.find((x) => x.key === slotKey && x.meal);
    const day = sel === 'trip' ? days.find((d) => (byDay[d] || []).length) || days[0] : sel;
    const city = daysInfo.find((d) => d.day === day)?.cities[0] || '';
    setEditing({ draft: { day, city, kind: meal ? 'food' : 'sight', slot: slotKey, title: meal ? meal.label : '', start: null, end: null, location: '', details: '', transport: '', cost: null, lat: null, lng: null, done: 0 }, isNew: true });
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

  // atividade sem posição no mapa: ao salvar, procura sozinha pelo Local (endereço, link do Google
  // Maps ou coordenadas) e pelo nome do lugar perto da cidade
  const locateDraft = async (draft) => {
    if (hasCoords(draft) || ['free', 'move', 'flight'].includes(draft.kind) || navigator.onLine === false) return { draft };
    if (!String(draft.location || '').trim() && !String(draft.title || '').trim()) return { draft };
    const c = cityMap[draft.city || railCity(draft.day)];
    const near = hasCoords(c) ? { lat: c.lat, lng: c.lng } : null;
    if (!near && !String(draft.location || '').trim()) return { draft }; // só o nome, sem cidade: arriscado demais
    setEditing((e) => (e ? { ...e, locating: true } : e));
    try {
      const found = await autoLocate({ title: draft.title, location: draft.location, near });
      return found ? { draft: { ...draft, lat: found.lat, lng: found.lng }, found } : { draft, missed: true };
    } catch { return { draft, missed: true }; } finally { setEditing((e) => (e ? { ...e, locating: false } : e)); }
  };
  const locateNote = ({ found, missed }) => (found
    ? (found.approx ? `Posição aproximada pelo ${found.via}: confira no mapa` : `Posição achada pelo ${found.via}`)
    : missed ? 'Salvo sem posição: não achei no mapa. Cole o link ou as coordenadas do Google Maps em Posição no mapa.' : '');

  const saveEdit = async () => {
    const { draft: { _pending: pending = [], _altOf: altOf = null, ...first }, isNew } = editing;
    const located = await locateDraft(first);
    const { draft } = located;
    const note = locateNote(located);
    const sendPending = async (owner, id) => {
      for (const f of pending) {
        try { addUploaded(await api.uploadFile(owner, id, f, tripId)); } catch (e) { say(`Não consegui anexar ${f.name}: ${e.message}`); }
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
        if (note) say(note);
      } catch { say('Erro ao salvar'); }
      return;
    }
    try {
      if (isNew) {
        // primeira opção extra: a atividade original entra no grupo
        if (altOf != null) await updateActivity(altOf, { alt: draft.alt });
        const created = await api.createActivity(tripId, draft);
        setData((d) => ({ ...d, activities: [...d.activities, created] }));
        setSelectedId(created.id);
        if (created.alt) setAltView((v) => ({ ...v, [altKey(created)]: created.id }));
        await sendPending('activity', created.id);
      } else {
        const saved = await api.updateActivity(draft.id, draft);
        setData((d) => ({ ...d, activities: d.activities.map((a) => (a.id === saved.id ? saved : a)) }));
      }
      if (draft.day !== sel && sel !== 'trip') say(`Salvo no dia ${fmtDay(draft.day)}${note ? `. ${note}` : ''}`);
      else if (note) say(note);
      setEditing(null);
    } catch (e) { say('Erro ao salvar'); }
  };

  // ── anexos
  const filesOf = (owner, id) => (data?.files || []).filter((f) => (owner === 'idea' ? f.idea_id === id : f.activity_id === id));
  // anexo enviado entra na lista; sem internet ele fica no aparelho e sobe sozinho depois (a viagem recarrega)
  function addUploaded(up) {
    if (up?.queued) say(`Sem internet: ${up.name} ficou guardado no aparelho e sobe quando a internet voltar`);
    else if (up) setData((d) => ({ ...d, files: [...(d.files || []), up] }));
  }
  const addFile = async (owner, id, file) => addUploaded(await api.uploadFile(owner, id, file, tripId));
  // página de ingressos (ela mostra os próprios avisos): arquivo de uma atividade, de um item de reserva da
  // checklist ou solto na viagem
  const addTicketFile = async (target, file) => {
    if (target?.check) file.checkId = target.check;
    const up = target?.activity ? await api.uploadFile('activity', target.activity, file, tripId) : await api.uploadFile('trip', tripId, file);
    if (!up.queued) setData((d) => ({ ...d, files: [...(d.files || []), up] }));
    return up;
  };
  const removeTicketFile = async (f) => {
    setData((d) => ({ ...d, files: (d.files || []).filter((x) => x.id !== f.id) }));
    try {
      await api.deleteFile(f.id);
      if ('caches' in window) caches.open('files-v1').then((c) => c.delete(api.fileUrl(f.id))).catch(() => {});
    } catch { reload(); throw new Error('não consegui remover'); }
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

  // ids do painel (um por grupo) → todas as opções, na ordem delas, no lugar do grupo
  const expandAlts = (ids) => {
    const full = byDayAll[sel] || [];
    const groups = altGroups(full);
    const out = [];
    ids.forEach((id) => {
      const a = full.find((x) => x.id === id);
      const g = a?.alt && groups.get(altKey(a));
      if (!g) out.push(id);
      else if (!out.includes(g[0].id)) out.push(...g.map((x) => x.id));
    });
    return out;
  };

  const reorder = (raw) => saveOrder(expandAlts(raw));
  const saveOrder = async (ids) => {
    const pos = Object.fromEntries(ids.map((id, i) => [id, i]));
    setData((d) => ({ ...d, activities: d.activities.map((a) => (a.id in pos && a.day === sel ? { ...a, sort: pos[a.id] } : a)) }));
    try { await api.reorderDay(tripId, sel, ids); } catch { say('Erro ao reordenar'); reload(); }
  };

  // levar uma opção para outro bloco leva o grupo inteiro
  const groupOf = (id) => {
    const a = data.activities.find((x) => x.id === id);
    return (a?.alt && altGroups(data.activities).get(altKey(a))) || (a ? [a] : []);
  };
  const moveSlot = (id, slot) => groupOf(id).forEach((x) => updateActivity(x.id, { slot }));

  // ── carrossel de opções
  const showAlt = (id, fly = true) => {
    const a = data.activities.find((x) => x.id === id);
    if (!a) return;
    if (a.alt) setAltView((v) => ({ ...v, [altKey(a)]: id }));
    setSelectedId(id);
    if (fly && hasCoords(a)) setFlyTarget({ lat: a.lat, lng: a.lng, nonce: ++nonce.current });
  };
  const stepAlt = (a, delta) => {
    const g = a.alts || [];
    if (g.length < 2) return;
    showAlt(g[(a.altIndex + delta + g.length) % g.length].id);
  };
  // a opção mostrada vira a principal (primeira do grupo): é ela que conta no orçamento e na agenda
  const makePrincipal = (a) => {
    const g = a.alts || [];
    const order = [a.id, ...g.filter((x) => x.id !== a.id).map((x) => x.id)];
    let k = 0;
    saveOrder((byDayAll[sel] || []).map((x) => (g.some((y) => y.id === x.id) ? order[k++] : x.id)));
    say(`“${a.title}” é a opção principal`);
  };
  const addAlt = (a) => {
    const key = a.alt || newAltKey();
    setEditing({
      draft: { day: a.day, city: a.city, kind: a.kind, slot: a.slot || a.slotKey || null, start: a.start, end: a.end, title: '', location: '', details: '', transport: '', cost: null, lat: null, lng: null, done: 0, alt: key, _altOf: a.alt ? null : a.id },
      isNew: true,
    });
  };
  const splitAlt = () => setEditing((e) => ({ ...e, draft: { ...e.draft, alt: null } }));

  const sortTime = () => {
    // cada bloco se ordena por dentro; os blocos já seguem a escala do dia
    reorder(SLOTS.flatMap((x) => sortByTime(dayItems.filter((a) => a.slotKey === x.key))).map((a) => a.id));
    say('Ordenado por horário');
  };

  // ── adição rápida: clique no mapa ou resultado da busca → atividade do dia (ou ideia, na visão geral)
  const nearestCity = (lat, lng) => {
    let best = null; let bd = 80;
    (data.cities || []).filter((c) => c.key !== 'transito' && hasCoords(c)).forEach((c) => { const d = haversine(c, { lat, lng }); if (d < bd) { bd = d; best = c.key; } });
    return best || '';
  };
  const quickOpen = (lat, lng, name, address, kind = 'sight', asIdea = sel === 'trip') => {
    const base = { title: name || '', kind, city: nearestCity(lat, lng), location: address || '', details: '', cost: null, lat: +lat.toFixed(5), lng: +lng.toFixed(5) };
    if (asIdea) setEditing({ draft: base, isNew: true, idea: true });
    else setEditing({ draft: { ...base, day: sel, start: null, end: null, transport: '', done: 0 }, isNew: true });
  };
  // põe o marcador novo; sem nome, pergunta ao OpenStreetMap o que tem ali
  const placeAt = (lat, lng, info = {}) => {
    const id = ++nonce.current;
    const p = { lat, lng, title: '', local: '', address: '', kind: 'sight', ...info, nonce: id, loading: !info.title };
    setSelectedId(null);
    setPreview(p);
    if (!info.title) {
      describePoint(lat, lng).then((d) => setPreview((cur) => (cur?.nonce === id ? { ...cur, ...d, loading: false } : cur)));
    }
  };
  const movePreview = (lat, lng) => {
    setPreview((cur) => {
      if (!cur) return cur;
      const keep = cur.title && cur.via !== 'Ponto marcado no mapa';
      const id = keep ? cur.nonce : ++nonce.current;
      if (!keep) describePoint(lat, lng).then((d) => setPreview((c) => (c?.nonce === id ? { ...c, ...d, loading: false } : c)));
      return { ...cur, lat, lng, fly: false, approx: false, nonce: id, ...(keep ? {} : { loading: true }) };
    });
  };
  const addPreview = (type) => {
    const p = preview;
    if (!p) return;
    setPreview(null);
    quickOpen(p.lat, p.lng, p.title, p.address, p.kind || 'sight', type === 'idea');
  };
  const quickAddAt = (lat, lng) => {
    setQuickAdd(false);
    placeAt(lat, lng, { via: 'Ponto marcado no mapa' });
  };

  const onMapPick = (lat, lng) => {
    if (quickAdd) { quickAddAt(lat, lng); return; }
    setEditing((e) => (e ? { ...e, draft: { ...e.draft, lat: +lat.toFixed(5), lng: +lng.toFixed(5) } } : e));
    setPicking(false);
  };

  const onMarkerMove = (id, lat, lng) => updateActivity(id, { lat: +lat.toFixed(5), lng: +lng.toFixed(5) });

  const pinned = selectedId == null ? null : (data?.activities || []).find((x) => x.id === selectedId && hasCoords(x)) || null;
  const selectFromList = (id) => showAlt(id);

  const onSearchPick = (type, item) => {
    if (type === 'activity') {
      go(item.day);
      showAlt(item.id);
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
  // cotação em dólar para a cota de compras ('manual' em usd_rate_at = digitada, não atualiza)
  const refreshUsd = useCallback(async (force) => {
    const t = data?.trip;
    // viagem nacional não tem cota da Receita, então não precisa do dólar
    if (!t || place.domestic || t.currency === 'USD' || t.home_currency === 'USD' || t.usd_rate_at === 'manual' || !navigator.onLine) return;
    const today = new Date().toISOString().slice(0, 10);
    if (!force && t.usd_rate_at === today && t.usd_rate) return;
    try {
      const r = roundRate((await fetchRate(t.currency, 'USD')).rate);
      setData((d) => ({ ...d, trip: { ...d.trip, usd_rate: r, usd_rate_at: today } }));
      await api.saveTrip(tripId, { usd_rate: r, usd_rate_at: today });
    } catch { /* fica a cotação anterior */ }
  }, [data?.trip?.id, data?.trip?.usd_rate_at, data?.trip?.currency, data?.trip?.home_currency, place.domestic]);
  useEffect(() => { if (modal === 'shopping') refreshUsd(false); }, [modal, refreshUsd]);

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
  // página de ingressos: "Comprado" marca o item de reserva da checklist ou cria um ("09/11 Título"), que a página reconhece pelo dia e pelo nome
  const toggleTicket = (e, done) => {
    if (e.check?.id) return updateCheck(e.check.id, { done: done ? 1 : 0 });
    const [, m, d] = (e.day || '').split('-');
    return createCheck({ grp: 'Reservas e ingressos', text: `${d && m ? `${d}/${m} ` : ''}${e.title}`, done: done ? 1 : 0 });
  };
  const deleteCheck = (id) => {
    const item = data.checklist.find((x) => x.id === id);
    if (item) softDelete(`Item removido: ${item.text}`, 'checklist', item, () => api.deleteCheck(id));
  };

  const createPurchase = async (x) => {
    const created = await api.createPurchase(tripId, x);
    setData((d) => ({ ...d, purchases: [...(d.purchases || []), created] }));
  };
  const updatePurchase = async (id, patch) => {
    setData((d) => ({ ...d, purchases: d.purchases.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    try { await api.updatePurchase(id, patch); } catch { say('Erro ao salvar'); reload(); }
  };
  const deletePurchase = (id) => {
    const item = data.purchases.find((x) => x.id === id);
    if (item) softDelete(`Compra removida: ${item.title}`, 'purchases', item, () => api.deletePurchase(id));
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
  // links de visitante (erros sobem para o modal mostrar)
  const createShare = async (link) => {
    const made = await api.createShare(tripId, link);
    setData((d) => ({ ...d, shares: [...(d.shares || []), made] }));
  };
  const updateShare = async (link, patch) => {
    const saved = await api.updateShare(link.id, patch);
    setData((d) => ({ ...d, shares: (d.shares || []).map((x) => (x.id === saved.id ? saved : x)) }));
  };
  const removeShare = async (link) => {
    await api.deleteShare(link.id);
    setData((d) => ({ ...d, shares: (d.shares || []).filter((x) => x.id !== link.id) }));
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

  if (sel === 'analise') return <Analysis data={data} onBack={() => go('trip')} onTickets={() => go('ingressos')} />;
  if (sel === 'ingressos') return <Tickets data={data} onBack={() => go('trip')} onToggle={toggleTicket} onAddFile={addTicketFile} onRemoveFile={removeTicketFile} />;
  if (sel === 'notas') return <Notes data={data} setData={setData} onBack={() => go('trip')} />;
  if (sel === 'diario') return <Journal key={openPhoto || 'album'} data={data} setData={setData} initialPhoto={openPhoto} onBack={() => { setOpenPhoto(null); go('trip'); }} />;

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
        <button className="ghost hide-sm" onClick={() => go('analise')}>Análise</button>
        <button className="ghost hide-sm" onClick={() => go('ingressos')}>Ingressos</button>
        <button className="ghost hide-sm" onClick={() => go('diario')}>Diário</button>
        <button className="ghost hide-sm hide-md" onClick={() => go('notas')}>Notas</button>
        <button className="ghost hide-sm" onClick={() => setModal('checklist')}>Checklist</button>
        <button className="ghost hide-sm" onClick={() => setModal('shopping')}>Compras</button>
        <details className="menu" ref={menuRef}>
          <summary aria-label="Mais opções" title="Mais opções"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg></summary>
          <div className="menu-pop" onClick={(e) => e.currentTarget.parentElement.removeAttribute('open')}>
            <button className="only-sm" onClick={() => setModal('stays')}>Hospedagens</button>
            <button className="only-sm" onClick={() => setModal('budget')}>Orçamento</button>
            <button className="only-sm" onClick={() => go('analise')}>Análise</button>
            <button className="only-sm" onClick={() => go('ingressos')}>Ingressos</button>
            <button className="only-sm" onClick={() => go('diario')}>Diário</button>
            <button className="only-md" onClick={() => go('notas')}>Notas de viagem</button>
            <button className="only-sm" onClick={() => setModal('checklist')}>Checklist</button>
            <button className="only-sm" onClick={() => setModal('shopping')}>Compras</button>
            <button onClick={() => setModal('look')}>Aparência</button>
            <button onClick={() => setModal('trip')}>Editar viagem</button>
            <button onClick={() => setModal('cities')}>Cidades e locais</button>
            <button onClick={() => setModal('stats')}>Estatísticas</button>
            <button onClick={() => setModal('calendar')}>Calendário</button>
            <button onClick={() => setModal('share')}>Compartilhar roteiro</button>
            <button onClick={() => setModal('offline')}>Mapa offline</button>
            <button onClick={openOfflinePanel}>Dados offline e backups</button>
            <button onClick={() => setModal('reminders')}>Lembretes</button>
            <button onClick={() => window.print()}>Imprimir ou salvar PDF</button>
            <button onClick={() => downloadIcs(trip, acts, cityMap)}>Exportar para agenda (.ics)</button>
            <a href={`/api/trips/${tripId}/export`}>Exportar backup (JSON)</a>
          </div>
        </details>
      </header>

      <div className="main" data-detent={sheet.detent}>
        <aside className="side" ref={sheet.ref}>
          <SheetHandle detent={sheet.detent} handleProps={sheet.handleProps} onKey={() => sheet.setDetent((d) => (d === 'full' ? 'half' : d === 'half' ? 'full' : 'half'))} />
          <nav className="strip" aria-label="Dias da viagem" ref={stripRef}>
            <button className={`dchip trip${sel === 'trip' ? ' on' : ''}`} onClick={() => go('trip')}><b>Geral</b></button>
            {daysInfo.map((d, i) => {
              // trilho de metrô sob os dias: cor da cidade onde você dorme; estação quando muda de cidade
              const base = railCity(d.day) || d.cities[0];
              const prev = i > 0 ? railCity(daysInfo[i - 1].day) || daysInfo[i - 1].cities[0] : null;
              const trip = d.cities.find((k) => k !== base && k !== 'transito');
              const dot = base !== prev ? 'station' : trip ? 'branch' : '';
              return (
                <button key={d.day} className={`dchip${sel === d.day ? ' on' : ''}${d.day === today ? ' today' : ''}`} onClick={() => go(d.day)} style={{ '--c': cityMap[base]?.color || 'var(--ctl)', '--t': cityMap[trip]?.color }} title={[fmtDayLong(d.day), cityMap[trip || base]?.name].filter(Boolean).join(' · ')}>
                  <small>{d.week}</small>
                  <b>{d.num}</b>
                  <span className={`rail${dot ? ` ${dot}` : ''}`}><i /></span>
                  {d.conflicts > 0 && <i className="alert" />}
                </button>
              );
            })}
          </nav>
          <div className="side-body">
            {sel === 'trip' ? (
              <TripPanel
                trip={trip} place={place} cities={data.cities} cityMap={cityMap} stays={data.stays} activities={acts}
                conflictsTotal={conflictsTotal} kinds={kinds} onToggleKind={toggleKind} doneFilter={doneFilter} onDoneFilter={setDoneFilter} fx={fx}
                onCity={focusCity} onOpenStays={() => setModal('stays')} onOpenBudget={() => setModal('budget')}
                onOpenCities={() => setModal('cities')} onEditTrip={() => setModal('trip')}
                checklist={data.checklist} onOpen={setModal}
                ideas={data.ideas} days={days} onIdea={openIdea} onSchedule={scheduleIdea}
                onPickDay={go} daysInfo={daysInfo}
              />
            ) : (
              <DayPanel
                day={sel} dayIndex={dayIndex} items={dayItems} cityMap={cityMap} stay={stayFor(sel)} checkout={checkoutStay}
                conflicts={dayConflicts} selectedId={selectedId} onSelect={selectFromList} onEdit={openEdit}
                onToggleDone={toggleDone} onAdd={openNew} onMoveSlot={moveSlot} onReorder={reorder} onSortTime={sortTime}
                onAltStep={stepAlt} onAltAdd={addAlt} onAltMain={makePrincipal}
                kinds={kinds} onToggleKind={toggleKind} doneFilter={doneFilter} onDoneFilter={setDoneFilter} fx={fx} tripTz={trip.tz} now={sel === today ? now.min : null}
                onPrev={() => step(-1)} onNext={() => step(1)} hasPrev={dayIndex > 0} hasNext={dayIndex < days.length - 1}
                dayInfo={(data.days || []).find((d) => d.day === sel) || null} onSaveDayInfo={saveDayInfo} files={data.files || []} travel={travel}
              />
            )}
          </div>
        </aside>

        <section className="mapwrap">
          <MapView
            centerRef={mapCenter}
            mode={sel === 'trip' ? 'trip' : 'day'}
            items={mapItems}
            alts={sel === 'trip' ? [] : mapAlts}
            onAltPick={(id) => showAlt(id, false)}
            stays={data.stays}
            cities={data.cities}
            countries={trip.countries || ''}
            stayByDay={sel === 'trip' ? null : stayFor(sel)}
            checkout={checkoutStay}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); if (isMobile && id) sheet.setDetent('peek'); }}
            padBottom={isMobile && sheet.detent !== 'full' ? heightOf(sheet.detent, window.innerHeight - 56) : 0}
            onEdit={openEdit}
            editPositions={editPositions}
            onMove={onMarkerMove}
            picking={picking || quickAdd}
            preview={preview}
            onPreviewMove={movePreview}
            onHold={(lat, lng) => { if (!editPositions) placeAt(lat, lng, { via: 'Ponto marcado no mapa' }); }}
            onPick={onMapPick}
            ideas={sel === 'trip' ? data.ideas : []}
            onIdea={openIdea}
            flyTarget={flyTarget}
            cityFocus={cityFocus}
            fitKey={sel}
            showStays={sel === 'trip' ? showStaysTrip : showStaysDay}
            labelNumbers={labelNumbers}
            onBackground={() => setSelectedId(null)}
            photos={showPhotos ? mapPhotos : []}
            photoThumb={api.thumbUrl}
            onPhoto={(p) => showPhoto(p.id)}
          />
          {preview && !picking && (
            <PlaceCard place={preview} day={sel === 'trip' ? null : sel} onAdd={addPreview} onClose={() => setPreview(null)} />
          )}
          {pinned && !preview && !editPositions && !picking && !quickAdd && (
            <PinPanel
              a={pinned} n={mapItems.find((x) => x.id === pinned.id)?.n} group={mapItems.find((x) => x.id === pinned.id)} onAltStep={stepAlt} cityMap={cityMap} fx={fx} tripTz={trip.tz} files={filesOf('activity', pinned.id)}
              photos={(data.photos || []).filter((p) => p.activity_id === pinned.id)} photoThumb={api.thumbUrl} onPhoto={showPhoto}
              onEdit={openEdit} onToggleDone={toggleDone} onClose={() => setSelectedId(null)}
            />
          )}
          <div className="map-tools">
            <MapSearch
              getView={() => mapCenter.current?.()}
              onPick={(r) => placeAt(r.lat, r.lng, { title: r.title, local: r.local, address: (r.name || '').split(',').slice(1, 4).join(',').trim(), approx: !!r.approx, via: r.exact ? 'Coordenadas ou link do Google' : 'Resultado da busca', fly: true })}
            />
            <Nearby
              getOrigin={() => { const a = (data.activities || []).find((x) => x.id === selectedId); return hasCoords(a) ? { ...a, label: a.title } : mapCenter.current?.(); }}
              onPick={(lat, lng, name, address, kind) => placeAt(lat, lng, { title: name, address, kind, via: 'Perto daqui', fly: true })}
            />
            <button className={quickAdd ? 'on' : ''} onClick={() => setQuickAdd((v) => !v)} title="Toque no mapa para pôr um marcador ali (ou toque e segure no mapa a qualquer hora)">{quickAdd ? 'Toque no mapa…' : '+ Marcar ponto'}</button>
            {sel !== 'trip' && (
              <button className={labelNumbers ? 'on' : ''} onClick={() => setLabelNumbers((v) => !v)} title="Alternar entre números e ícones">{labelNumbers ? 'Números' : 'Ícones'}</button>
            )}
            {geoPhotos.length > 0 && (
              <button className={showPhotos ? 'on' : ''} onClick={togglePhotos} title={sel === 'trip' ? 'Onde cada foto do diário foi tirada' : 'Onde cada foto do dia foi tirada e o caminho feito'}>Fotos</button>
            )}
            <button className={(sel === 'trip' ? showStaysTrip : showStaysDay) ? 'on' : ''} onClick={() => (sel === 'trip' ? setShowStaysTrip((v) => !v) : setShowStaysDay((v) => !v))}>Hotéis</button>
            {sel !== 'trip' && (
              <button className={editPositions ? 'on warn' : ''} onClick={() => setEditPositions((v) => !v)} title="Arraste os marcadores para corrigir a posição">Mover pontos</button>
            )}
          </div>
          {sel === 'trip' && (
            <div className="map-route">
              <Metro stays={data.stays} cityMap={cityMap} cities={data.cities} daysInfo={daysInfo} onCity={focusCity} />
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
          altInfo={(() => {
            const { draft, isNew } = editing;
            if (editing.idea || !draft.alt) return null;
            const g = data.activities.filter((x) => x.day === draft.day && x.alt === draft.alt).sort((x, y) => x.sort - y.sort || x.id - y.id);
            if (isNew) return { index: Math.max(2, g.length + 1), count: Math.max(2, g.length + 1) };
            return g.length > 1 ? { index: g.findIndex((x) => x.id === draft.id) + 1, count: g.length } : null;
          })()}
          onSplitAlt={splitAlt}
          draft={editing.draft} locating={!!editing.locating} isNew={editing.isNew} isIdea={!!editing.idea} onToIdeas={toIdeas} cities={data.cities} days={days} fxCur={fx.cur}
          onChange={(d) => setEditing((e) => ({ ...e, draft: d }))}
          onSave={saveEdit} onDelete={deleteEdit} onClose={() => setEditing(null)}
          onPickMap={() => setPicking(true)}
        />
      )}
      {modal === 'stays' && <StaysModal stays={data.stays} cities={data.cities} trip={trip} onSave={saveStay} onCreate={createStay} onDelete={deleteStay} onClose={() => setModal(null)} />}
      {modal === 'cities' && <CitiesModal cities={data.cities} onCreate={createCity} onSave={saveCity} onDelete={deleteCity} onClose={() => setModal(null)} />}
      {modal === 'trip' && <TripModal trip={trip} place={place} onSave={saveTrip} onDelete={deleteTrip} onDuplicate={duplicateTrip} onClose={() => setModal(null)} />}
      {modal === 'checklist' && <ChecklistModal domestic={place.domestic} items={data.checklist} onCreate={createCheck} onUpdate={updateCheck} onDelete={deleteCheck} onClose={() => setModal(null)} />}
      {modal === 'shopping' && <ShoppingModal trip={trip} domestic={place.domestic} items={data.purchases || []} days={days} fx={fx} onCreate={createPurchase} onUpdate={updatePurchase} onDelete={deletePurchase} onTrip={patchTrip} onRefreshUsd={() => refreshUsd(true)} onClose={() => setModal(null)} />}
      {modal === 'stats' && <StatsModal activities={acts} stays={data.stays} cityMap={cityMap} days={days} fx={fx} onClose={() => setModal(null)} />}
      {modal === 'calendar' && <CalendarModal days={days} byDay={byDay} cityMap={cityMap} daysInfo={daysInfo} fx={fx} initialDay={sel === 'trip' ? days[0] : sel} onPick={(d, aid) => { setModal(null); go(d); if (aid) setSelectedId(aid); }} onClose={() => setModal(null)} />}
      {modal === 'search' && <SearchModal data={data} cityMap={cityMap} onPick={onSearchPick} onClose={() => setModal(null)} />}
      {modal === 'budget' && <BudgetModal activities={acts} stays={data.stays} cityMap={cityMap} days={days} fx={fx} onRate={saveRate} rateAuto={trip.rate_auto !== 0} rateAt={trip.rate_at} onRateAuto={setRateAuto} files={data.files || []} onClose={() => setModal(null)} />}
      {modal === 'look' && <AppearanceModal trip={trip} onTripAccent={(accent) => patchTrip({ accent })} onClose={() => setModal(null)} />}
      {modal === 'reminders' && <RemindersModal trip={trip} onSave={patchTrip} onCalendar={setCalendar} notify={notify} onNotify={async (on) => setNotifyState(await setNotify(on))} onClose={() => setModal(null)} />}
      {modal === 'offline' && <OfflineMapModal cities={data.cities} onClose={() => setModal(null)} />}
      {modal === 'share' && <ShareModal trip={trip} links={data.shares || []} onCreate={createShare} onUpdate={updateShare} onRemove={removeShare} onClose={() => setModal(null)} />}
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
