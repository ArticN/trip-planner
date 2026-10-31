import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { PLATFORMS, parseVideo, videoOf, embedUrl, pageUrl, coverUrls } from './video.js';
import { preparePhoto } from './photos.js';
import { rangeDays, fmtDay, fmtDayLong, nowIn, daysBetween, principals } from './util.js';
import { matchActivity, autoCaption, techSheet, hasPlace } from './photoMeta.js';

// ── Diário de viagem: um álbum de fotos montado em páginas livres. Cada página pode ter um dia
// (ganha o carimbo com a data e a cor da cidade) e uma sequência de blocos: fotos (em mosaico, grade,
// destaque, polaroides ou tira de filme) e texto (nota, título ou citação). As fotos vão sozinhas para a
// página do dia em que foram tiradas. Também abre só para leitura, no link de visitante.

export const LAYOUTS = [
  ['mosaico', 'Mosaico'],
  ['grade', 'Grade'],
  ['destaque', 'Destaque'],
  ['polaroides', 'Polaroides'],
  ['filme', 'Filme'],
];
export const STYLES = [['nota', 'Nota'], ['titulo', 'Título'], ['citacao', 'Citação']];
const KANJI_WEEK = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const tilt = (id) => (((id * 7919) % 9) - 4) * 0.7; // cada polaroide pende sempre para o mesmo lado
const newId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const takenKey = (p) => `${p.taken_at || p.created_at || ''}#${String(p.id).padStart(9, '0')}`;
const pageKey = (p) => (p.day || '9999') + String(p.sort ?? 0).padStart(6, '0') + String(p.id).padStart(9, '0');
const byPageOrder = (a, b) => pageKey(a).localeCompare(pageKey(b));
const idsOf = (pages) => new Set(pages.flatMap((p) => p.blocks.flatMap((b) => b.ids || [])));
const handFont = () => {
  if (document.getElementById('dj-font')) return;
  const l = document.createElement('link');
  l.id = 'dj-font';
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap';
  document.head.appendChild(l);
};

const blockHasContent = (b) => (b.type === 'photos' ? b.ids.length > 0 : b.type === 'video' ? !!videoOf(b) : !!b.text?.trim());

export default function Journal({ data, setData = null, onBack, readOnly = false, token = null, initialPhoto = null }) {
  const { trip } = data;
  const tripId = trip.id;
  const url = useMemo(() => (token
    ? { thumb: (id) => `/api/share/${token}/photos/${id}/thumb`, full: (id) => `/api/share/${token}/photos/${id}` }
    : { thumb: api.thumbUrl, full: api.photoUrl }), [token]);
  const days = useMemo(() => rangeDays(trip.start, trip.end), [trip.start, trip.end]);
  const today = nowIn(trip.tz).day;
  const jp = trip.currency === 'JPY'; // viagem ao Japão: o carimbo ganha a data em kanji
  const cityMap = useMemo(() => Object.fromEntries((data.cities || []).map((c) => [c.key, c])), [data.cities]);
  const themes = useMemo(() => Object.fromEntries((data.days || []).map((d) => [d.day, d.title])), [data.days]);
  const photosById = useMemo(() => Object.fromEntries((data.photos || []).map((p) => [p.id, p])), [data.photos]);
  const pages = useMemo(() => [...(data.pages || [])].sort(byPageOrder), [data.pages]);
  const visible = useMemo(() => pages.map((p) => ({ ...p, blocks: p.blocks.map((b) => (b.type === 'photos' ? { ...b, ids: b.ids.filter((x) => photosById[x]) } : b)) })), [pages, photosById]);
  const albumList = useMemo(() => visible.flatMap((p) => p.blocks.flatMap((b) => b.ids || [])).map((x) => photosById[x]), [visible, photosById]);
  const allList = useMemo(() => [...(data.photos || [])].sort((a, b) => takenKey(a).localeCompare(takenKey(b))), [data.photos]);
  const actById = useMemo(() => Object.fromEntries((data.activities || []).map((a) => [a.id, a])), [data.activities]);
  const caption = useCallback((p) => p.caption || autoCaption(p, actById, data.cities), [actById, data.cities]);

  // vindo do mapa ou da atividade: abre direto na foto, com a lista de todas as fotos em volta
  const [view, setView] = useState(() => (initialPhoto ? 'fotos' : 'album'));
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState([]); // fotos sendo reveladas: { key, url }
  const [open, setOpen] = useState(() => (initialPhoto && photosById[initialPhoto] ? { id: initialPhoto, list: allList } : null)); // { id, list }
  const [toast, setToast] = useState('');
  const [focusBlock, setFocusBlock] = useState(null);
  const say = useCallback((m) => { setToast(m); setTimeout(() => setToast(''), 4200); }, []);

  useEffect(handFont, []);
  // miniaturas guardadas no aparelho: o álbum abre sem internet com tudo o que já foi visto
  useEffect(() => {
    if (!data.photos?.length || !navigator.onLine || !navigator.serviceWorker?.controller) return;
    let stop = false;
    (async () => {
      const cache = await caches.open('files-v1');
      for (const p of data.photos) {
        if (stop) return;
        if (!(await cache.match(url.thumb(p.id)))) await fetch(url.thumb(p.id)).catch(() => {});
      }
    })().catch(() => {});
    return () => { stop = true; };
  }, [data.photos, url]);

  const cityOf = (day) => {
    if (!day) return null;
    const stay = (data.stays || []).find((s) => s.check_in <= day && day < s.check_out);
    if (stay?.city) return cityMap[stay.city];
    const counts = {};
    (data.activities || []).filter((a) => a.day === day && a.city && a.city !== 'transito').forEach((a) => { counts[a.city] = (counts[a.city] || 0) + 1; });
    const k = Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0];
    return k ? cityMap[k] : null;
  };

  // ── edição: a lista de páginas mais recente fica num ref, para os envios em sequência não se atropelarem
  const pagesRef = useRef(data.pages || []);
  pagesRef.current = data.pages || [];
  const commit = (next) => { pagesRef.current = next; setData((d) => ({ ...d, pages: next })); };
  const failSave = () => say('Não consegui salvar a página. Confira a internet.');
  const savePage = (id, patch) => {
    commit(pagesRef.current.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    return api.updatePage(id, patch).catch(failSave);
  };
  // o título salva só quando você para de digitar
  const titleTimers = useRef({});
  const saveTitle = (id, title) => {
    commit(pagesRef.current.map((p) => (p.id === id ? { ...p, title } : p)));
    clearTimeout(titleTimers.current[id]);
    titleTimers.current[id] = setTimeout(() => api.updatePage(id, { title }).catch(failSave), 700);
  };
  const setBlocks = (page, fn) => {
    const cur = pagesRef.current.find((p) => p.id === page.id);
    if (cur) savePage(cur.id, { blocks: fn(cur.blocks) });
  };
  const creating = useRef({});
  const createPage = async (p) => {
    const sort = pagesRef.current.reduce((m, x) => Math.max(m, x.sort ?? 0), -1) + 1;
    const saved = await api.createPage(tripId, { blocks: [], ...p, sort });
    commit([...pagesRef.current, saved]);
    return saved;
  };
  const pageForDay = (day) => {
    const hit = pagesRef.current.filter((p) => (p.day || null) === (day || null)).sort(byPageOrder)[0];
    if (hit) return Promise.resolve(hit);
    const k = day || '-';
    creating.current[k] ||= createPage({ day: day || null, title: day ? null : 'Fotos soltas' }).finally(() => { delete creating.current[k]; });
    return creating.current[k];
  };
  // põe a foto numa página: no bloco escolhido, no último bloco de fotos se ele for o último da página, ou num bloco novo
  const placePhoto = (pageId, photoId, blockId = null) => {
    setBlocks({ id: pageId }, (blocks) => {
      const target = blockId && blocks.find((b) => b.id === blockId);
      if (target) return blocks.map((b) => (b === target ? { ...b, ids: [...b.ids, photoId] } : b));
      const last = blocks[blocks.length - 1];
      if (last?.type === 'photos') return blocks.map((b) => (b === last ? { ...b, ids: [...b.ids, photoId] } : b));
      return [...blocks, { id: newId(), type: 'photos', layout: 'mosaico', ids: [photoId] }];
    });
  };

  // as fotos vão para a página do dia em que foram tiradas (ou para a página/bloco escolhido)
  const addFiles = async (list, target = null) => {
    const files = [...list].filter((f) => /^image\//.test(f.type) || /\.(hei[cf]|jpe?g|png|webp|avif)$/i.test(f.name));
    if (!files.length) return;
    if (view !== 'album') setView('album');
    const failed = [];
    let sent = 0;
    for (const f of files) {
      const key = `${Date.now()}-${Math.random()}`;
      setPending((p) => [...p, { key, url: null }]);
      try {
        const ph = await preparePhoto(f);
        const tday = ph.taken.slice(0, 10);
        const tpage = target && pagesRef.current.find((p) => p.id === target.pageId);
        const day = days.includes(tday) ? tday : tpage?.day || (days.includes(today) ? today : null);
        const prev = URL.createObjectURL(ph.thumb);
        setPending((p) => p.map((x) => (x.key === key ? { ...x, url: prev } : x)));
        // a atividade do roteiro em que a foto foi tirada (pelo horário e, se tiver, pelo GPS)
        const activity = matchActivity({ ...ph, day }, data.activities);
        const saved = await api.uploadPhoto(tripId, { ...ph, day, activity });
        setData((d) => ({ ...d, photos: [...(d.photos || []), saved] }));
        const page = tpage || (await pageForDay(day));
        placePhoto(page.id, saved.id, target?.blockId);
        sent++;
        setTimeout(() => URL.revokeObjectURL(prev), 4000);
      } catch (e) {
        failed.push(`${f.name} (${e.message})`);
      } finally {
        setPending((p) => p.filter((x) => x.key !== key));
      }
    }
    if (failed.length) say(`Não colei ${failed.length === 1 ? 'esta foto' : `${failed.length} fotos`}: ${failed.join(', ')}.`);
    else if (sent > 1) say(`${sent} fotos coladas no álbum.`);
  };

  // apaga do servidor as fotos que não aparecem em mais nenhum bloco
  const dropPhotos = async (ids) => {
    const still = idsOf(pagesRef.current);
    const gone = ids.filter((x) => !still.has(x));
    if (!gone.length) return;
    setData((d) => ({ ...d, photos: d.photos.filter((p) => !gone.includes(p.id)) }));
    for (const x of gone) {
      await api.deletePhoto(x).catch(() => {});
      if ('caches' in window) caches.open('files-v1').then((c) => { c.delete(api.photoUrl(x)); c.delete(api.thumbUrl(x)); }).catch(() => {});
    }
  };
  const removePhoto = (photo) => {
    if (!window.confirm('Tirar esta foto do álbum? Ela é apagada do app (a original continua no seu celular).')) return;
    setOpen(null);
    pagesRef.current.forEach((pg) => { if (pg.blocks.some((b) => b.ids?.includes(photo.id))) setBlocks(pg, (bl) => bl.map((b) => (b.ids ? { ...b, ids: b.ids.filter((x) => x !== photo.id) } : b))); });
    dropPhotos([photo.id]);
  };
  const movePhoto = (photo, pageId) => {
    const from = pagesRef.current.find((pg) => pg.blocks.some((b) => b.ids?.includes(photo.id)));
    if (from?.id === pageId) return;
    if (from) setBlocks(from, (bl) => bl.map((b) => (b.ids ? { ...b, ids: b.ids.filter((x) => x !== photo.id) } : b)));
    placePhoto(pageId, photo.id);
    const dest = pagesRef.current.find((p) => p.id === pageId);
    if (dest?.day && dest.day !== photo.day) {
      setData((d) => ({ ...d, photos: d.photos.map((p) => (p.id === photo.id ? { ...p, day: dest.day } : p)) }));
      api.updatePhoto(photo.id, { day: dest.day }).catch(() => {});
    }
    say('Foto movida.');
  };
  const setPhotoActivity = (photo, activity_id) => {
    setData((d) => ({ ...d, photos: d.photos.map((p) => (p.id === photo.id ? { ...p, activity_id } : p)) }));
    api.updatePhoto(photo.id, { activity_id }).catch(() => say('Não consegui salvar a atividade da foto.'));
  };
  const updateCaption = (photo, caption) => {
    setData((d) => ({ ...d, photos: d.photos.map((p) => (p.id === photo.id ? { ...p, caption } : p)) }));
    api.updatePhoto(photo.id, { caption }).catch(() => say('Não consegui salvar a legenda.'));
  };
  const deletePage = async (page) => {
    const n = page.blocks.reduce((s, b) => s + (b.ids?.length || 0), 0);
    if (!window.confirm(n ? `Apagar esta página e as ${n} fotos dela?` : 'Apagar esta página?')) return;
    const original = pagesRef.current.find((p) => p.id === page.id);
    commit(pagesRef.current.filter((p) => p.id !== page.id));
    const ids = page.blocks.flatMap((b) => b.ids || []);
    try {
      await api.deletePage(page.id);
      const still = idsOf(pagesRef.current);
      setData((d) => ({ ...d, photos: d.photos.filter((p) => !ids.includes(p.id) || still.has(p.id)) }));
    } catch { say('Não consegui apagar a página.'); if (original) commit([...pagesRef.current, original]); }
  };
  const addPage = async () => {
    const used = new Set(pagesRef.current.map((p) => p.day));
    const lastDay = pagesRef.current.map((p) => p.day).filter(Boolean).sort().pop() || '';
    const day = days.find((d) => !used.has(d) && d > lastDay) || days.find((d) => !used.has(d)) || null;
    try {
      const p = await createPage({ day, title: day ? null : 'Nova página' });
      setEditing(true);
      setTimeout(() => document.getElementById(`dj-p${p.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch { say('Não consegui criar a página.'); }
  };

  const hasContent = (p) => p.blocks.some(blockHasContent);
  const shown = readOnly || !editing ? visible.filter((p) => hasContent(p) || (!readOnly && p.title)) : visible;
  const nPhotos = (data.photos || []).length;
  const nCities = new Set(visible.filter(hasContent).map((p) => cityOf(p.day)?.key).filter(Boolean)).size;
  const cover = (albumList.length ? albumList : allList).slice(0, 3);
  const countdown = today < trip.start ? `Faltam ${daysBetween(today, trip.start)} dias para a primeira foto` : today <= trip.end ? `Hoje é o ${daysBetween(trip.start, today) + 1}º dia` : `${fmtDay(trip.start)} a ${fmtDay(trip.end)}`;
  const canEdit = !readOnly && editing;

  // ── livro: fora do modo Editar, o álbum mostra uma página por vez (a capa é a primeira) e vira a página
  const scroller = useRef(null);
  const [sheet, setSheet] = useState(0);
  const [turn, setTurn] = useState(null); // { top, base, anim: 'out' | 'in' }
  const book = view === 'album' && !canEdit && shown.length > 0;
  const total = shown.length + 1;
  const cur = Math.min(sheet, total - 1);
  const goSheet = (to) => {
    const next = Math.max(0, Math.min(total - 1, to));
    if (next === cur || turn) return;
    scroller.current?.scrollTo({ top: 0 });
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setSheet(next); return; }
    // para frente, a página atual vira por cima da próxima; para trás, a anterior volta por cima da atual
    setTurn(next > cur ? { top: cur, base: next, anim: 'out' } : { top: next, base: cur, anim: 'in' });
    setTimeout(() => { setSheet(next); setTurn(null); }, 720);
  };
  const goRef = useRef(goSheet);
  goRef.current = goSheet;
  useEffect(() => {
    if (!book || open) return undefined;
    const k = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goRef.current(cur + 1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goRef.current(cur - 1); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [book, open, cur]);
  const touch = useRef(null);
  const swipe = {
    onTouchStart: (e) => { touch.current = e.target.closest('.dj-film') ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY }; },
    onTouchEnd: (e) => {
      const t = touch.current;
      if (!t) return;
      const dx = e.changedTouches[0].clientX - t.x;
      const dy = e.changedTouches[0].clientY - t.y;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) goSheet(cur + (dx < 0 ? 1 : -1));
    },
  };

  const onDropAll = readOnly ? {} : {
    onDragOver: (e) => { if ([...e.dataTransfer.types].includes('Files')) e.preventDefault(); },
    onDrop: (e) => { if (e.dataTransfer.files?.length) { e.preventDefault(); addFiles(e.dataTransfer.files); } },
  };

  const coverEl = (
    <section className="dj-cover">
      <div className="dj-cover-text">
        <span className="dj-eyebrow">{trip.emoji} álbum de</span>
        <h1>{trip.name}</h1>
        <p className="dj-hand">{countdown}</p>
        <div className="dj-stats">
          <span><b>{nPhotos}</b> {nPhotos === 1 ? 'foto' : 'fotos'}</span>
          <span><b>{shown.length}</b> {shown.length === 1 ? 'página' : 'páginas'}</span>
          <span><b>{nCities}</b> {nCities === 1 ? 'cidade' : 'cidades'}</span>
        </div>
        {book && <button className="dj-open dj-hand" onClick={() => goSheet(1)}>abrir o álbum <span aria-hidden="true">→</span></button>}
      </div>
      <div className="dj-cover-pics" aria-hidden="true">
        {cover.length ? cover.map((p, i) => (
          <figure key={p.id} className={`dj-pol c${i}`} style={{ '--r': `${[-7, 4, -2][i]}deg` }}>
            <img src={url.thumb(p.id)} alt="" />
          </figure>
        )) : (
          <figure className="dj-pol c0 empty" style={{ '--r': '-4deg' }}><span>sua primeira foto<br />aparece aqui</span></figure>
        )}
        <span className="dj-hanko big"><b className="k">{jp ? '旅' : trip.emoji || '✈'}</b></span>
      </div>
    </section>
  );
  const pageEl = (p) => (
    <Page
      key={p.id} page={p} days={days} jp={jp} today={today}
      city={cityOf(p.day)} theme={p.day ? themes[p.day] : null} photosById={photosById} url={url} caption={caption}
      edit={canEdit} focusBlock={focusBlock}
      onOpen={(id) => setOpen({ id, list: albumList })}
      onDay={(day) => savePage(p.id, { day })}
      onTitle={(title) => saveTitle(p.id, title)}
      onBlocks={(fn) => setBlocks(p, fn)}
      onAddPhotos={(files, blockId) => addFiles(files, { pageId: p.id, blockId })}
      onAddText={(at) => { const id = newId(); setFocusBlock(id); setBlocks(p, (bl) => [...bl.slice(0, at), { id, type: 'text', style: 'nota', text: '' }, ...bl.slice(at)]); }}
      onAddVideo={(at) => { const id = newId(); setFocusBlock(id); setBlocks(p, (bl) => [...bl.slice(0, at), { id, type: 'video', src: '', vid: '', vertical: false, caption: '' }, ...bl.slice(at)]); }}
      onAddPhotoBlock={(at) => { const id = newId(); setBlocks(p, (bl) => [...bl.slice(0, at), { id, type: 'photos', layout: 'grade', ids: [] }, ...bl.slice(at)]); return id; }}
      onDropBlockPhotos={dropPhotos}
      onDelete={() => deletePage(p)}
      onFileDrop={(files) => addFiles(files, { pageId: p.id })}
    />
  );
  const sheetEl = (i) => (i === 0 ? coverEl : shown[i - 1] ? pageEl(shown[i - 1]) : null);
  const baseIdx = turn ? turn.base : cur;
  const jump = (i, id) => (book ? goSheet(i) : document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }));

  return (
    <div className={`an dj${canEdit ? ' editing' : ''}${book ? ' booked' : ''}`} ref={scroller} {...onDropAll}>
      <div className="an-head">
        <header className="an-top">
          {onBack && <button className="icon-btn" onClick={onBack} title="Voltar ao roteiro" aria-label="Voltar ao roteiro">←</button>}
          <div className="dj-top-title">
            <div className="brand-name">Diário de viagem</div>
            <div className="brand-sub">{trip.name}</div>
          </div>
          <span className="spacer" />
          <div className="dj-tabs" role="tablist" aria-label="Ver">
            <button role="tab" aria-selected={view === 'album'} className={view === 'album' ? 'on' : ''} onClick={() => setView('album')}>Álbum</button>
            <button role="tab" aria-selected={view === 'fotos'} className={view === 'fotos' ? 'on' : ''} onClick={() => setView('fotos')}>Fotos</button>
          </div>
          {!readOnly && (
            <>
              <button className={`ghost dj-edit-btn${editing ? ' on' : ''}`} onClick={() => setEditing((v) => !v)} aria-pressed={editing}>{editing ? 'Pronto' : 'Editar'}</button>
              <PhotoButton label={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>} capture className="dj-cam" title="Tirar foto" ariaLabel="Tirar foto com a câmera" onFiles={(f) => addFiles(f)} />
              <PhotoButton label="+ Fotos" className="primary" onFiles={(f) => addFiles(f)} title="Cada foto vai para a página do dia em que foi tirada" />
            </>
          )}
        </header>
        {view === 'album' && shown.length > 1 && (
          <nav className="dj-index" aria-label="Páginas do álbum">
            {book && <a href="#capa" className={`cover${cur === 0 ? ' on' : ''}`} onClick={(e) => { e.preventDefault(); goSheet(0); }} title="Capa"><b>✦</b><small>capa</small></a>}
            {shown.map((p, i) => (
              <a key={p.id} href={`#dj-p${p.id}`} className={`${p.day === today ? 'today' : ''}${book && cur === i + 1 ? ' on' : ''}`} style={{ '--c': cityOf(p.day)?.color }}
                onClick={(e) => { e.preventDefault(); jump(i + 1, `dj-p${p.id}`); }}
                aria-current={book && cur === i + 1 ? 'page' : undefined}
                title={p.day ? fmtDayLong(p.day) : p.title || 'Página'}>
                {p.day ? <><b>{Number(p.day.slice(8))}</b><small>{MONTHS[Number(p.day.slice(5, 7)) - 1].toLowerCase()}</small></> : <><b>✦</b><small>extra</small></>}
              </a>
            ))}
          </nav>
        )}
      </div>

      <main className="dj-body">
        {pending.length > 0 && (
          <div className="dj-tray" role="status">
            <span className="dj-hand">revelando {pending.length} {pending.length === 1 ? 'foto' : 'fotos'}…</span>
            <div>{pending.slice(0, 8).map((x) => <i key={x.key} style={x.url ? { backgroundImage: `url(${x.url})` } : undefined} />)}</div>
          </div>
        )}

        {view === 'fotos' ? (
          <AllPhotos list={allList} days={days} url={url} readOnly={readOnly} onOpen={(id) => setOpen({ id, list: allList })} />
        ) : book ? (
          <>
            <div className="dj-book" {...swipe}>
              <div className="dj-sheet base" key={`b${baseIdx}`}>{sheetEl(baseIdx)}</div>
              {turn && <div className={`dj-sheet top ${turn.anim}`} key={`t${turn.top}-${turn.anim}`} aria-hidden="true">{sheetEl(turn.top)}</div>}
            </div>
            <nav className="dj-pager" aria-label="Virar página">
              <button className="icon-btn" onClick={() => goSheet(cur - 1)} disabled={cur === 0} aria-label="Página anterior">‹</button>
              <span>{cur === 0 ? 'capa' : `${cur} de ${shown.length}`}</span>
              <button className="icon-btn" onClick={() => goSheet(cur + 1)} disabled={cur === total - 1} aria-label="Próxima página">›</button>
            </nav>
            {!readOnly && cur === 0 && (
              <p className="dj-hint muted small">Toque em <b>Editar</b> para trocar o layout das fotos, escrever, mudar a ordem ou criar páginas.</p>
            )}
          </>
        ) : (
          <>
            {coverEl}
            {!shown.length && (
              <div className="dj-empty">
                <p className="dj-hand">{readOnly ? 'O álbum ainda está vazio.' : 'O álbum ainda está em branco.'}</p>
                {!readOnly && (
                  <>
                    <p className="muted">Escolha as fotos da viagem: cada uma vai sozinha para a página do dia em que foi tirada. Depois dá para trocar o layout, escrever e criar páginas extras.</p>
                    <div className="dj-empty-actions">
                      <PhotoButton label="Escolher fotos" className="primary" onFiles={(f) => addFiles(f)} />
                      <button onClick={addPage}>Criar página em branco</button>
                    </div>
                  </>
                )}
              </div>
            )}
            {shown.map(pageEl)}
            {canEdit && <button className="dj-newpage" onClick={addPage}><span aria-hidden="true">+</span> Nova página</button>}
          </>
        )}
      </main>

      {open && (
        <Lightbox
          list={open.list.filter(Boolean)} id={open.id} url={url} readOnly={readOnly}
          pages={pages.map((p) => ({ id: p.id, label: p.day ? `${days.indexOf(p.day) + 1}º dia · ${fmtDay(p.day)}${p.title ? ` · ${p.title}` : ''}` : p.title || 'Página extra' }))}
          pageOf={(photoId) => pages.find((pg) => pg.blocks.some((b) => b.ids?.includes(photoId)))?.id}
          onClose={() => setOpen(null)} onGo={(id) => setOpen((o) => ({ ...o, id }))}
          onCaption={updateCaption} onMove={movePhoto} onDelete={removePhoto}
          caption={caption} actById={actById} activities={data.activities || []} onActivity={setPhotoActivity}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

// capture abre direto a câmera traseira no celular (sem ele, o Android oferece câmera e galeria)
function PhotoButton({ label, className = '', capture = false, onFiles, title, ariaLabel }) {
  return (
    <label className={`btn-like dj-add-btn ${className}`} title={title} aria-label={ariaLabel}>
      {label}
      <input type="file" accept="image/*" multiple={!capture} capture={capture ? 'environment' : undefined} hidden onChange={(e) => { const f = [...(e.target.files || [])]; e.target.value = ''; if (f.length) onFiles(f); }} />
    </label>
  );
}

function Hanko({ day, jp }) {
  const [, m, d] = day.split('-').map(Number);
  const w = KANJI_WEEK[new Date(`${day}T12:00:00`).getDay()];
  return (
    <span className="dj-hanko" aria-hidden="true">
      {jp ? <><small>{m}月</small><b>{d}</b><small>日 · {w}</small></> : <><small>{MONTHS[m - 1]}</small><b>{d}</b></>}
    </span>
  );
}

function Page({ page, days, jp, today, city, theme, photosById, url, caption, edit, focusBlock, onOpen, onDay, onTitle, onBlocks, onAddPhotos, onAddText, onAddVideo, onAddPhotoBlock, onDropBlockPhotos, onDelete, onFileDrop }) {
  const [drag, setDrag] = useState(false);
  const idx = page.day ? days.indexOf(page.day) : -1;
  const auto = theme || (city ? `${city.emoji || ''} ${city.name}`.trim() : idx >= 0 ? `${idx + 1}º dia` : 'Página');
  const title = page.title || auto;
  const blocks = edit ? page.blocks : page.blocks.filter(blockHasContent);
  const move = (i, d) => onBlocks((bl) => { const n = [...bl]; const j = i + d; if (j < 0 || j >= n.length) return bl; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const remove = (b) => {
    const n = b.ids?.length || 0;
    if (n && !window.confirm(`Apagar este bloco e as ${n} fotos dele?`)) return;
    onBlocks((bl) => bl.filter((x) => x.id !== b.id));
    if (n) onDropBlockPhotos(b.ids);
  };
  const patch = (b, p) => onBlocks((bl) => bl.map((x) => (x.id === b.id ? { ...x, ...p } : x)));
  const dropProps = {
    onDragOver: (e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); e.stopPropagation(); setDrag(true); } },
    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false); },
    onDrop: (e) => { e.preventDefault(); e.stopPropagation(); setDrag(false); onFileDrop(e.dataTransfer.files); },
  };
  return (
    <section id={`dj-p${page.id}`} className={`dj-page${page.day === today ? ' today' : ''}${drag ? ' drag' : ''}${page.day ? '' : ' extra'}`} style={{ '--c': city?.color }} {...(edit ? dropProps : {})}>
      <header className="dj-page-head">
        {page.day ? <Hanko day={page.day} jp={jp} /> : <span className="dj-hanko extra" aria-hidden="true"><b>✦</b></span>}
        <div className="dj-page-title">
          <span className="dj-tape" aria-hidden="true" />
          {edit ? (
            <input className="dj-title dj-title-input" value={page.title || ''} placeholder={auto} maxLength={200} aria-label="Título da página"
              onChange={(e) => onTitle(e.target.value)} />
          ) : <h2 className="dj-title">{title}</h2>}
          <p className="dj-meta">
            {page.day ? <>{idx + 1}º dia · {fmtDayLong(page.day)}{(page.title || theme) && city ? ` · ${city.name}` : ''}</> : 'Página extra'}
          </p>
        </div>
        {edit && (
          <div className="dj-page-tools">
            <select value={page.day || ''} onChange={(e) => onDay(e.target.value || null)} aria-label="Dia da página">
              <option value="">Sem dia</option>
              {days.map((d, k) => <option key={d} value={d}>{k + 1}º dia · {fmtDay(d)}</option>)}
            </select>
            <button className="ghost danger" onClick={onDelete}>Apagar página</button>
          </div>
        )}
      </header>

      {blocks.map((b, i) => (
        <div key={b.id} className={`dj-block ${b.type}${edit ? ' edit' : ''}`}>
          {edit && i > 0 && <Inserter onPhotos={(files) => { const id = onAddPhotoBlock(i); onAddPhotos(files, id); }} onText={() => onAddText(i)} onVideo={() => onAddVideo(i)} />}
          {edit && (
            <div className="dj-block-bar">
              {b.type === 'video' ? (
                <div className="dj-seg" role="group" aria-label="Formato do vídeo">
                  {[[false, 'Horizontal'], [true, 'Vertical']].map(([k, l]) => (
                    <button key={l} className={!!b.vertical === k ? 'on' : ''} aria-pressed={!!b.vertical === k} onClick={() => patch(b, { vertical: k })}>{l}</button>
                  ))}
                </div>
              ) : (
                <div className="dj-seg" role="group" aria-label={b.type === 'photos' ? 'Layout das fotos' : 'Estilo do texto'}>
                  {(b.type === 'photos' ? LAYOUTS : STYLES).map(([k, l]) => (
                    <button key={k} className={(b.layout || b.style) === k ? 'on' : ''} aria-pressed={(b.layout || b.style) === k}
                      onClick={() => patch(b, b.type === 'photos' ? { layout: k } : { style: k })}>{l}</button>
                  ))}
                </div>
              )}
              <span className="spacer" />
              {b.type === 'photos' && <PhotoButton label="+ fotos" className="sm" onFiles={(f) => onAddPhotos(f, b.id)} />}
              <button className="icon-btn sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir bloco" title="Subir">↑</button>
              <button className="icon-btn sm" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} aria-label="Descer bloco" title="Descer">↓</button>
              <button className="icon-btn sm danger" onClick={() => remove(b)} aria-label="Apagar bloco" title="Apagar bloco">×</button>
            </div>
          )}
          {b.type === 'photos' ? (
            <Photos block={b} photosById={photosById} url={url} caption={caption} edit={edit} onOpen={onOpen} onReorder={(ids) => patch(b, { ids })} />
          ) : b.type === 'video' ? (
            <VideoBlock block={b} edit={edit} autoFocus={focusBlock === b.id} onChange={(p) => patch(b, p)} />
          ) : (
            <TextBlock block={b} edit={edit} autoFocus={focusBlock === b.id} onChange={(text) => patch(b, { text })} />
          )}
        </div>
      ))}
      {edit && (
        <div className="dj-block-end">
          {!page.blocks.length && <p className="muted small">Página em branco. Comece com fotos ou com um texto:</p>}
          <Inserter always onPhotos={(files) => { const id = onAddPhotoBlock(page.blocks.length); onAddPhotos(files, id); }} onText={() => onAddText(page.blocks.length)} onVideo={() => onAddVideo(page.blocks.length)} />
        </div>
      )}
      {drag && <div className="dj-dropping dj-hand">solte para colar nesta página</div>}
    </section>
  );
}

// "+" entre os blocos: foto ou texto
function Inserter({ onPhotos, onText, onVideo, always = false }) {
  return (
    <div className={`dj-insert${always ? ' always' : ''}`}>
      <label className="btn-like sm">
        + Fotos
        <input type="file" accept="image/*" multiple hidden onChange={(e) => { const f = [...(e.target.files || [])]; e.target.value = ''; if (f.length) onPhotos(f); }} />
      </label>
      <button className="sm" onClick={onText}>+ Texto</button>
      {onVideo && <button className="sm" onClick={onVideo} title="Vídeo do YouTube">+ Vídeo</button>}
    </div>
  );
}

function Photos({ block, photosById, url, caption, edit, onOpen, onReorder }) {
  const list = block.ids.map((x) => photosById[x]).filter(Boolean);
  if (!list.length) return edit ? <div className="dj-noph muted small">Bloco sem fotos ainda. Use “+ fotos”.</div> : null;
  const layout = block.layout || 'mosaico';
  const shift = (i, d) => { const n = list.map((p) => p.id); const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onReorder(n); };
  const tools = (i) => edit && (
    <span className="dj-ph-tools">
      <button onClick={(e) => { e.stopPropagation(); shift(i, -1); }} disabled={i === 0} aria-label="Mover para trás">‹</button>
      <button onClick={(e) => { e.stopPropagation(); shift(i, 1); }} disabled={i === list.length - 1} aria-label="Mover para frente">›</button>
    </span>
  );
  if (layout === 'polaroides') {
    return (
      <div className="dj-pols">
        {list.map((p, i) => (
          <figure key={p.id} className="dj-pol" style={{ '--r': `${tilt(p.id)}deg` }}>
            <button onClick={() => onOpen(p.id)} aria-label={p.caption ? `Abrir foto: ${p.caption}` : 'Abrir foto'}><img src={url.thumb(p.id)} alt={p.caption || ''} loading="lazy" /></button>
            <figcaption>{caption(p)}</figcaption>
            {tools(i)}
          </figure>
        ))}
      </div>
    );
  }
  if (layout === 'destaque') {
    return (
      <div className="dj-feature">
        {list.map((p, i) => (
          <figure key={p.id}>
            <button onClick={() => onOpen(p.id)} aria-label="Abrir foto"><img src={url.full(p.id)} alt={p.caption || ''} loading="lazy" style={p.w && p.h ? { aspectRatio: `${p.w} / ${p.h}` } : undefined} /></button>
            {caption(p) && <figcaption>{caption(p)}</figcaption>}
            {tools(i)}
          </figure>
        ))}
      </div>
    );
  }
  const cls = layout === 'filme' ? 'dj-film' : layout === 'grade' ? 'dj-grid' : `dj-mosaic n${Math.min(list.length, 5)}`;
  return (
    <div className={cls}>
      {list.map((p, i) => (
        <figure key={p.id} className={p.w && p.h && p.w < p.h ? 'tall' : 'wide'}>
          <button onClick={() => onOpen(p.id)} aria-label={p.caption ? `Abrir foto: ${p.caption}` : 'Abrir foto'}>
            <img src={layout === 'mosaico' && i === 0 ? url.full(p.id) : url.thumb(p.id)} alt={p.caption || ''} loading="lazy" />
          </button>
          {p.caption && <figcaption>{p.caption}</figcaption>}
          {tools(i)}
        </figure>
      ))}
    </div>
  );
}

// vídeo: o arquivo fica no YouTube, Vimeo, Google Drive, Instagram ou TikTok (resolução cheia, sem ocupar o banco do app);
// o álbum mostra a capa e só carrega o player quando você toca no ▶
function VideoBlock({ block, edit, autoFocus, onChange }) {
  const [playing, setPlaying] = useState(false);
  const [link, setLink] = useState('');
  const [msg, setMsg] = useState(null); // { bad, text }
  const [cap, setCap] = useState(block.caption || '');
  const ref = useRef(null);
  const v = videoOf(block);
  const key = v ? `${v.src}:${v.vid}` : '';
  useEffect(() => { setCap(block.caption || ''); }, [block.caption]);
  useEffect(() => { if (autoFocus && edit && !v) ref.current?.focus(); }, [autoFocus, edit, key]);
  useEffect(() => { setPlaying(false); }, [key, edit]);
  const take = async (text) => {
    setLink(text);
    let r = parseVideo(text);
    if (r?.short) {
      setMsg({ text: 'Abrindo o link do TikTok…' });
      r = await api.resolveVideo(r.short).then((x) => ({ ...x, vertical: true })).catch(() => null);
      if (!r) { setMsg({ bad: true, text: 'Não consegui abrir esse link do TikTok. Abra o vídeo no navegador e copie o endereço completo.' }); return; }
    }
    if (!r) { setMsg(text.trim() ? { bad: true, text: 'Não reconheci esse link. Use um link do YouTube, Vimeo, Google Drive, Instagram ou TikTok.' } : null); return; }
    setMsg(null);
    setLink('');
    onChange({ src: r.src, vid: r.vid, vertical: !!r.vertical });
  };
  if (edit && !v) {
    return (
      <div className="dj-video-new">
        <input ref={ref} type="url" inputMode="url" value={link} placeholder="Cole o link do vídeo" aria-label="Link do vídeo"
          onChange={(e) => take(e.target.value)} />
        <p className={`small ${msg?.bad ? 'dj-warn' : 'muted'}`}>
          {msg?.text || <>Vale <b>YouTube</b> (pode ser “Não listado”), <b>Vimeo</b>, <b>Google Drive</b> (compartilhado com “qualquer pessoa com o link”), <b>Instagram</b> e <b>TikTok</b> (conta pública). No app, toque em Compartilhar › Copiar link e cole aqui.</>}
        </p>
      </div>
    );
  }
  if (!v) return null;
  const pf = PLATFORMS[v.src];
  const covers = coverUrls(v, block.vertical);
  return (
    <figure className={`dj-video ${block.vertical ? 'vertical' : 'wide'} ${v.src}`}>
      <div className="dj-video-frame">
        {playing ? (
          <iframe src={embedUrl(v)} title={block.caption || `Vídeo do ${pf.name}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        ) : (
          <button className={`dj-video-cover${covers.length ? '' : ' plain'}`} onClick={() => setPlaying(true)} aria-label={`Assistir${block.caption ? `: ${block.caption}` : ' o vídeo'} (${pf.name})`}
            style={{ '--pf': pf.color, ...(covers.length ? { backgroundImage: covers.map((u) => `url(${u})`).join(', ') } : {}) }}>
            <span className="dj-video-play" aria-hidden="true">▶</span>
            <span className="dj-video-pf">{pf.name}</span>
          </button>
        )}
      </div>
      {edit ? (
        <div className="dj-video-edit">
          <input value={cap} maxLength={300} placeholder="Legenda (opcional)" aria-label="Legenda do vídeo"
            onChange={(e) => setCap(e.target.value)} onBlur={() => cap !== (block.caption || '') && onChange({ caption: cap })} />
          <button className="sm ghost" onClick={() => onChange({ src: '', vid: '' })}>Trocar vídeo</button>
          <a className="small" href={pageUrl(v)} target="_blank" rel="noreferrer">abrir no {pf.name}</a>
        </div>
      ) : block.caption ? <figcaption>{block.caption}</figcaption> : null}
    </figure>
  );
}

// texto: nota manuscrita em papel pautado, título grande ou citação; salva sozinho enquanto você escreve
function TextBlock({ block, edit, autoFocus, onChange }) {
  const [v, setV] = useState(block.text || '');
  const last = useRef(block.text || '');
  const timer = useRef(null);
  const ref = useRef(null);
  useEffect(() => { if ((block.text || '') !== last.current) { setV(block.text || ''); last.current = block.text || ''; } }, [block.text]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { const t = ref.current; if (t) { t.style.height = 'auto'; t.style.height = `${Math.max(t.scrollHeight, 40)}px`; } }, [v, block.style, edit]);
  useEffect(() => { if (autoFocus && edit) ref.current?.focus(); }, [autoFocus, edit]);
  const flush = (val) => { clearTimeout(timer.current); if (val !== last.current) { last.current = val; onChange(val); } };
  const style = block.style || 'nota';
  if (!edit) return <div className={`dj-text ${style}`}>{block.text}</div>;
  return (
    <textarea
      ref={ref} className={`dj-text ${style}`} value={v} rows={1} aria-label="Texto"
      placeholder={style === 'titulo' ? 'Um título…' : style === 'citacao' ? 'Uma frase para lembrar…' : 'Escreva o que quiser lembrar…'}
      onChange={(e) => { const val = e.target.value; setV(val); clearTimeout(timer.current); timer.current = setTimeout(() => flush(val), 800); }}
      onBlur={() => flush(v)}
    />
  );
}

// todas as fotos por dia, como no rolo da câmera
function AllPhotos({ list, days, url, readOnly, onOpen }) {
  const groups = useMemo(() => {
    const m = new Map();
    list.forEach((p) => { const k = p.day && days.includes(p.day) ? p.day : ''; if (!m.has(k)) m.set(k, []); m.get(k).push(p); });
    return [...m.entries()].sort(([a], [b]) => (a || '9999').localeCompare(b || '9999'));
  }, [list, days]);
  if (!list.length) return <p className="dj-empty dj-hand">Nenhuma foto ainda.</p>;
  const noPlace = list.filter((p) => !hasPlace(p)).length;
  return (
    <div className="dj-roll">
      {!readOnly && noPlace > 0 && (
        <p className="dj-noplace">
          <b>{noPlace === list.length ? 'Nenhuma foto tem localização.' : `${noPlace} de ${list.length} fotos estão sem localização.`}</b>{' '}
          Elas não aparecem no mapa. No celular, ligue a localização na câmera (no Galaxy: Câmera › Configurações › Marcas de localização) e envie a foto original, sem editar nem passar pelo WhatsApp, que apaga esses dados.
        </p>
      )}
      {groups.map(([day, ps]) => (
        <section key={day || 'sem'}>
          <h3>{day ? <>{fmtDayLong(day)} <span className="muted">· {days.indexOf(day) + 1}º dia</span></> : 'Fora das datas da viagem'} <span className="muted">· {ps.length}</span></h3>
          <div className="dj-roll-grid">
            {ps.map((p) => (
              <button key={p.id} onClick={() => onOpen(p.id)} aria-label={p.caption || 'Abrir foto'}>
                <img src={url.thumb(p.id)} alt={p.caption || ''} loading="lazy" />
                {hasPlace(p) && <span className="dj-pin" aria-label="com localização" title="Com localização">●</span>}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Lightbox({ list, id, url, readOnly, pages, pageOf, onClose, onGo, onCaption, onMove, onDelete, caption, actById, activities, onActivity }) {
  const i = list.findIndex((p) => p.id === id);
  const p = list[i];
  const [cap, setCap] = useState(p?.caption || '');
  const [info, setInfo] = useState(() => { try { return localStorage.getItem('dj-info') === '1'; } catch { return false; } });
  const touch = useRef(null);
  useEffect(() => { setCap(p?.caption || ''); }, [p?.id]);
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'ArrowLeft' && i > 0) onGo(list[i - 1].id);
      if (e.key === 'ArrowRight' && i < list.length - 1) onGo(list[i + 1].id);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [i, list]);
  if (!p) return null;
  const saveCap = () => { if ((p.caption || '') !== cap.trim()) onCaption(p, cap.trim()); };
  const page = pageOf(p.id);
  const autoCap = caption({ ...p, caption: '' });
  const act = p.activity_id && actById[p.activity_id];
  const sheet = techSheet(p);
  const dayActs = principals(activities).filter((a) => a.day === p.day && a.kind !== 'free');
  const toggleInfo = () => setInfo((v) => { try { localStorage.setItem('dj-info', v ? '0' : '1'); } catch { /* só agora */ } return !v; });
  // deslizar o dedo para os lados troca de foto
  const swipe = {
    onTouchStart: (e) => { touch.current = e.touches[0].clientX; },
    onTouchEnd: (e) => {
      const dx = e.changedTouches[0].clientX - (touch.current ?? e.changedTouches[0].clientX);
      if (dx < -60 && i < list.length - 1) onGo(list[i + 1].id);
      if (dx > 60 && i > 0) onGo(list[i - 1].id);
    },
  };
  return (
    <div className={`dj-lb${info ? ' info-on' : ''}`} role="dialog" aria-modal="true" aria-label="Foto do álbum" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} {...swipe}>
      <button className="dj-lb-x icon-btn" onClick={onClose} aria-label="Fechar">×</button>
      {i > 0 && <button className="dj-lb-nav prev icon-btn" onClick={() => onGo(list[i - 1].id)} aria-label="Foto anterior">‹</button>}
      {i < list.length - 1 && <button className="dj-lb-nav next icon-btn" onClick={() => onGo(list[i + 1].id)} aria-label="Próxima foto">›</button>}
      <figure className="dj-lb-pol">
        <img src={url.full(p.id)} alt={p.caption || ''} style={{ backgroundImage: `url(${url.thumb(p.id)})` }} />
        {readOnly ? (caption(p) ? <figcaption className="dj-lb-cap">{caption(p)}</figcaption> : null) : (
          <input className="dj-lb-cap" value={cap} placeholder={autoCap || 'escreva uma legenda…'} maxLength={500} aria-label="Legenda"
            onChange={(e) => setCap(e.target.value)} onBlur={saveCap} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
        )}
      </figure>
      <div className="dj-lb-bar">
        <span className="muted small">{i + 1} de {list.length}{p.taken_at ? ` · ${fmtDay(p.taken_at.slice(0, 10))} às ${p.taken_at.slice(11, 16)}` : ''}</span>
        <span className="spacer" />
        <button className={`dj-info-btn${info ? ' on' : ''}`} onClick={toggleInfo} aria-pressed={info} title="Informações da foto">ⓘ Info</button>
        {!readOnly && pages.length > 1 && (
          <select value={page || ''} onChange={(e) => e.target.value && onMove(p, Number(e.target.value))} aria-label="Página do álbum">
            {!page && <option value="">Em nenhuma página</option>}
            {pages.map((pg) => <option key={pg.id} value={pg.id}>{pg.label}</option>)}
          </select>
        )}
        <a className="btn-like" href={`${url.full(p.id)}?download`} download>Baixar</a>
        {!readOnly && <button className="danger" onClick={() => onDelete(p)}>Excluir</button>}
      </div>
      {info && (
        <aside className="dj-info" aria-label="Informações da foto">
          <dl>
            <dt>Onde</dt>
            <dd>
              {hasPlace(p) ? (
                <>{p.lat.toFixed(5)}, {p.lng.toFixed(5)}{sheet.altitude ? ` · ${sheet.altitude}` : ''} · <a href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`} target="_blank" rel="noreferrer">ver no mapa</a></>
              ) : <span className="dj-warn">Sem localização: a foto não aparece no mapa.</span>}
            </dd>
            <dt>Atividade</dt>
            <dd>
              {readOnly ? (act ? act.title : '—') : (
                <select value={p.activity_id || ''} onChange={(e) => onActivity(p, Number(e.target.value) || null)} aria-label="Atividade do roteiro">
                  <option value="">Nenhuma</option>
                  {act && !dayActs.some((a) => a.id === act.id) && <option value={act.id}>{act.title}</option>}
                  {dayActs.map((a) => <option key={a.id} value={a.id}>{a.start ? `${a.start} · ` : ''}{a.title}</option>)}
                </select>
              )}
            </dd>
            {p.taken_at && <><dt>Quando</dt><dd>{fmtDayLong(p.taken_at.slice(0, 10))}, {p.taken_at.slice(11, 16)}{sheet.noExif ? ' (data do arquivo; a foto não tinha a data gravada)' : ''}</dd></>}
            {sheet.camera && <><dt>Câmera</dt><dd>{sheet.camera}</dd></>}
            {sheet.lens && <><dt>Lente</dt><dd>{sheet.lens}</dd></>}
            {sheet.exposure && <><dt>Exposição</dt><dd>{sheet.exposure}</dd></>}
            {sheet.original && <><dt>Original</dt><dd>{sheet.original} · no app: {p.w} × {p.h}</dd></>}
          </dl>
        </aside>
      )}
    </div>
  );
}
