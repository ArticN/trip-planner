import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { preparePhoto } from './photos.js';
import { principals, rangeDays, fmtDay, fmtDayLong, nowIn, daysBetween } from './util.js';

// ── Diário de viagem: um caderno com uma página por dia. Fotos em polaroides presas com fita,
// carimbo (hanko) com a data, o humor do dia como adesivo, o texto em papel pautado e o canhoto
// com o que estava no roteiro. As fotos são reduzidas no aparelho e vão para o dia em que foram tiradas.

export const MOODS = [
  ['incrivel', '🤩', 'Incrível'],
  ['feliz', '😊', 'Feliz'],
  ['tranquilo', '😌', 'Tranquilo'],
  ['cansado', '😴', 'Cansado'],
  ['saudade', '🥹', 'Emocionado'],
  ['chuva', '🌧️', 'Dia de chuva'],
  ['fome', '🍜', 'Comi demais'],
];
const MOOD = Object.fromEntries(MOODS.map(([k, e, l]) => [k, { e, l }]));
const KANJI_WEEK = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// cada polaroide pende um pouco para um lado, sempre o mesmo para a mesma foto
const tilt = (id) => (((id * 7919) % 9) - 4) * 0.7;
const takenKey = (p) => `${p.taken_at || p.created_at || ''}#${String(p.id).padStart(9, '0')}`;
const handFont = () => {
  if (document.getElementById('dj-font')) return;
  const l = document.createElement('link');
  l.id = 'dj-font';
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap';
  document.head.appendChild(l);
};

export default function Journal({ data, setData, onBack }) {
  const { trip } = data;
  const tripId = trip.id;
  const days = useMemo(() => rangeDays(trip.start, trip.end), [trip.start, trip.end]);
  const today = nowIn(trip.tz).day;
  const jp = trip.currency === 'JPY'; // viagem ao Japão: o carimbo ganha a data em kanji
  const cityMap = useMemo(() => Object.fromEntries((data.cities || []).map((c) => [c.key, c])), [data.cities]);
  const acts = useMemo(() => principals(data.activities || []), [data.activities]);
  const journal = useMemo(() => Object.fromEntries((data.journal || []).map((j) => [j.day, j])), [data.journal]);
  const themes = useMemo(() => Object.fromEntries((data.days || []).map((d) => [d.day, d.title])), [data.days]);
  const photosByDay = useMemo(() => {
    const m = {};
    [...(data.photos || [])].sort((a, b) => takenKey(a).localeCompare(takenKey(b))).forEach((p) => {
      const k = p.day && days.includes(p.day) ? p.day : 'sem-dia';
      (m[k] ||= []).push(p);
    });
    return m;
  }, [data.photos, days]);
  const ordered = useMemo(() => [...days, 'sem-dia'].flatMap((d) => photosByDay[d] || []), [days, photosByDay]);

  const [onlyFilled, setOnlyFilled] = useState(false);
  const [pending, setPending] = useState([]); // fotos sendo reveladas: { key, day, url }
  const [open, setOpen] = useState(null); // id da foto aberta
  const [toast, setToast] = useState('');
  const [dragDay, setDragDay] = useState(null);
  const say = useCallback((m) => { setToast(m); setTimeout(() => setToast(''), 4200); }, []);

  useEffect(handFont, []);
  // miniaturas guardadas no aparelho: o diário abre sem internet com tudo o que já foi visto
  useEffect(() => {
    if (!data.photos?.length || !navigator.onLine || !navigator.serviceWorker?.controller) return;
    let stop = false;
    (async () => {
      const cache = await caches.open('files-v1');
      for (const p of data.photos) {
        if (stop) return;
        if (!(await cache.match(api.thumbUrl(p.id)))) await fetch(api.thumbUrl(p.id)).catch(() => {});
      }
    })().catch(() => {});
    return () => { stop = true; };
  }, [data.photos]);

  const cityOf = (day) => {
    const stay = (data.stays || []).find((s) => s.check_in <= day && day < s.check_out);
    if (stay?.city) return cityMap[stay.city];
    const counts = {};
    acts.filter((a) => a.day === day && a.city && a.city !== 'transito').forEach((a) => { counts[a.city] = (counts[a.city] || 0) + 1; });
    const k = Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0];
    return k ? cityMap[k] : null;
  };

  // as fotos vão para o dia em que foram tiradas; fora das datas da viagem, para o dia escolhido
  const addFiles = async (list, hint) => {
    const files = [...list].filter((f) => /^image\//.test(f.type) || /\.(hei[cf]|jpe?g|png|webp|avif)$/i.test(f.name));
    if (!files.length) return;
    const failed = [];
    let sent = 0;
    for (const f of files) {
      const key = `${Date.now()}-${Math.random()}`;
      setPending((p) => [...p, { key, day: hint || 'sem-dia', url: null }]);
      try {
        const ph = await preparePhoto(f);
        const tday = ph.taken.slice(0, 10);
        const day = days.includes(tday) ? tday : hint || (days.includes(today) ? today : null);
        const url = URL.createObjectURL(ph.thumb);
        setPending((p) => p.map((x) => (x.key === key ? { ...x, day: day || 'sem-dia', url } : x)));
        const saved = await api.uploadPhoto(tripId, { ...ph, day });
        setData((d) => ({ ...d, photos: [...(d.photos || []), saved] }));
        sent++;
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      } catch (e) {
        failed.push(`${f.name} (${e.message})`);
      } finally {
        setPending((p) => p.filter((x) => x.key !== key));
      }
    }
    if (failed.length) say(`Não colei ${failed.length === 1 ? 'esta foto' : `${failed.length} fotos`}: ${failed.join(', ')}.`);
    else if (sent > 1) say(`${sent} fotos coladas no diário.`);
  };

  const saveEntry = async (day, patch) => {
    const cur = journal[day] || { day, text: null, mood: null };
    const next = { ...cur, ...patch };
    setData((d) => ({ ...d, journal: [...(d.journal || []).filter((j) => j.day !== day), next].filter((j) => j.text || j.mood) }));
    try { await api.saveJournal(tripId, day, { text: next.text || '', mood: next.mood || '' }); } catch { say('Não consegui salvar o diário. Confira a internet.'); }
  };

  const updatePhoto = async (p, patch) => {
    setData((d) => ({ ...d, photos: d.photos.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) }));
    try { await api.updatePhoto(p.id, patch); } catch { say('Não consegui salvar a foto.'); }
  };
  const removePhoto = async (p) => {
    if (!window.confirm('Tirar esta foto do diário? Ela é apagada do app (a original continua no seu celular).')) return;
    setOpen(null);
    setData((d) => ({ ...d, photos: d.photos.filter((x) => x.id !== p.id) }));
    try {
      await api.deletePhoto(p.id);
      if ('caches' in window) caches.open('files-v1').then((c) => { c.delete(api.photoUrl(p.id)); c.delete(api.thumbUrl(p.id)); }).catch(() => {});
    } catch { say('Não consegui apagar a foto.'); setData((d) => ({ ...d, photos: [...d.photos, p] })); }
  };

  const filled = (day) => (photosByDay[day]?.length || 0) > 0 || !!journal[day]?.text || !!journal[day]?.mood || pending.some((x) => x.day === day);
  const shown = onlyFilled ? days.filter(filled) : days;
  const nPhotos = (data.photos || []).length;
  const nWritten = days.filter((d) => journal[d]?.text).length;
  const nCities = new Set(days.filter(filled).map((d) => cityOf(d)?.key).filter(Boolean)).size;
  const cover = ordered.slice(0, 3);
  const countdown = today < trip.start ? `Faltam ${daysBetween(today, trip.start)} dias para a primeira página` : today <= trip.end ? `Hoje é o ${daysBetween(trip.start, today) + 1}º dia` : 'Viagem concluída';

  const drop = (day) => ({
    onDragOver: (e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); e.stopPropagation(); setDragDay(day); } },
    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragDay((d) => (d === day ? null : d)); },
    onDrop: (e) => { e.preventDefault(); e.stopPropagation(); setDragDay(null); addFiles(e.dataTransfer.files, day === 'sem-dia' ? null : day); },
  });

  return (
    <div className="an dj" {...drop(null)}>
      <div className="an-head">
        <header className="an-top">
          <button className="icon-btn" onClick={onBack} title="Voltar ao roteiro" aria-label="Voltar ao roteiro">←</button>
          <div>
            <div className="brand-name">Diário de viagem</div>
            <div className="brand-sub">{trip.name} · {fmtDay(trip.start)} a {fmtDay(trip.end)}</div>
          </div>
          <span className="spacer" />
          <PhotoButton label="Câmera" capture className="dj-cam" onFiles={(f) => addFiles(f, days.includes(today) ? today : null)} />
          <PhotoButton label="Adicionar fotos" className="primary" onFiles={(f) => addFiles(f, days.includes(today) ? today : null)} />
        </header>
        <nav className="dj-index" aria-label="Páginas do diário">
          {days.map((d, i) => (
            <a key={d} href={`#dj-${d}`} className={`${filled(d) ? 'on' : ''}${d === today ? ' today' : ''}`} style={{ '--c': cityOf(d)?.color }}
              onClick={(e) => { e.preventDefault(); if (onlyFilled && !filled(d)) setOnlyFilled(false); setTimeout(() => document.getElementById(`dj-${d}`)?.scrollIntoView({ behavior: 'smooth' }), 0); }}
              title={fmtDayLong(d)}>
              <b>{Number(d.slice(8))}</b><small>{i + 1}º</small>
            </a>
          ))}
        </nav>
      </div>

      <main className="dj-body">
        <section className="dj-cover">
          <div className="dj-cover-text">
            <span className="dj-eyebrow">{trip.emoji} caderno de</span>
            <h1>{trip.name}</h1>
            <p className="dj-hand">{countdown}</p>
            <div className="dj-stats">
              <span><b>{nPhotos}</b> {nPhotos === 1 ? 'foto' : 'fotos'}</span>
              <span><b>{nWritten}</b> {nWritten === 1 ? 'dia escrito' : 'dias escritos'}</span>
              <span><b>{nCities}</b> {nCities === 1 ? 'cidade' : 'cidades'}</span>
            </div>
            <label className="dj-toggle">
              <input type="checkbox" checked={onlyFilled} onChange={(e) => setOnlyFilled(e.target.checked)} /> Só os dias com lembranças
            </label>
          </div>
          <div className="dj-cover-pics" aria-hidden="true">
            {cover.length ? cover.map((p, i) => (
              <figure key={p.id} className={`dj-pol c${i}`} style={{ '--r': `${[-7, 4, -2][i]}deg` }}>
                <img src={api.thumbUrl(p.id)} alt="" />
              </figure>
            )) : (
              <figure className="dj-pol c0 empty" style={{ '--r': '-4deg' }}><span>sua primeira foto<br />aparece aqui</span></figure>
            )}
            <Hanko big jp={jp} day={trip.start} label="旅" />
          </div>
        </section>

        {onlyFilled && !shown.length && <p className="dj-empty dj-hand">Ainda nenhuma página preenchida. Cole uma foto ou escreva sobre um dia.</p>}

        {shown.map((day) => (
          <DayPage
            key={day} day={day} index={days.indexOf(day)} jp={jp} isToday={day === today} future={day > today}
            city={cityOf(day)} theme={themes[day]} entry={journal[day]} photos={photosByDay[day] || []}
            pending={pending.filter((x) => x.day === day)} acts={acts.filter((a) => a.day === day && a.kind !== 'free')}
            dragging={dragDay === day} dropProps={drop(day)}
            onFiles={(f) => addFiles(f, day)} onSave={(patch) => saveEntry(day, patch)} onOpen={setOpen}
          />
        ))}

        {(photosByDay['sem-dia']?.length > 0 || pending.some((x) => x.day === 'sem-dia')) && (
          <section className="dj-page loose" {...drop('sem-dia')}>
            <header className="dj-page-head"><div><h2 className="dj-title">Fotos soltas</h2><p className="dj-meta">Tiradas fora das datas da viagem. Abra uma foto para escolher o dia dela.</p></div></header>
            <Polaroids photos={photosByDay['sem-dia'] || []} pending={pending.filter((x) => x.day === 'sem-dia')} onOpen={setOpen} />
          </section>
        )}
      </main>

      {open != null && (
        <Lightbox
          list={ordered} id={open} days={days} onClose={() => setOpen(null)} onGo={setOpen}
          onCaption={(p, caption) => updatePhoto(p, { caption })} onDay={(p, day) => updatePhoto(p, { day })} onDelete={removePhoto}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

// capture abre direto a câmera traseira no celular (sem ele, o Android oferece câmera e galeria)
function PhotoButton({ label, className = '', capture = false, onFiles }) {
  return (
    <label className={`btn-like dj-add-btn ${className}`}>
      {label}
      <input type="file" accept="image/*" multiple={!capture} capture={capture ? 'environment' : undefined} hidden onChange={(e) => { const f = [...(e.target.files || [])]; e.target.value = ''; onFiles(f); }} />
    </label>
  );
}

function Hanko({ day, jp, big = false, label }) {
  const [, m, d] = day.split('-').map(Number);
  const w = KANJI_WEEK[new Date(`${day}T12:00:00`).getDay()];
  return (
    <span className={`dj-hanko${big ? ' big' : ''}`} aria-hidden="true">
      {label ? <b className="k">{label}</b> : jp ? (
        <><small>{m}月</small><b>{d}</b><small>日 · {w}</small></>
      ) : (
        <><small>{MONTHS[m - 1]}</small><b>{d}</b></>
      )}
    </span>
  );
}

function DayPage({ day, index, jp, isToday, future, city, theme, entry, photos, pending, acts, dragging, dropProps, onFiles, onSave, onOpen }) {
  const empty = !photos.length && !pending.length && !entry?.text && !entry?.mood;
  const [moodOpen, setMoodOpen] = useState(false);
  const mood = entry?.mood && MOOD[entry.mood];
  return (
    <section id={`dj-${day}`} className={`dj-page${empty ? ' blank' : ''}${isToday ? ' today' : ''}${dragging ? ' drag' : ''}`} style={{ '--c': city?.color }} {...dropProps}>
      <header className="dj-page-head">
        <Hanko day={day} jp={jp} />
        <div className="dj-page-title">
          <span className="dj-tape" aria-hidden="true" />
          <h2 className="dj-title">{theme || (city ? `${city.emoji || ''} ${city.name}`.trim() : `${index + 1}º dia`)}</h2>
          <p className="dj-meta">{index + 1}º dia · {fmtDayLong(day)}{theme && city ? ` · ${city.name}` : ''}{isToday ? ' · hoje' : ''}</p>
        </div>
        <div className="dj-mood-wrap">
          <button className={`dj-sticker${mood ? '' : ' none'}`} onClick={() => setMoodOpen((o) => !o)} aria-expanded={moodOpen} title="Como foi o dia?" aria-label={mood ? `Humor: ${mood.l}. Trocar` : 'Como foi o dia?'}>
            {mood ? <><span className="e">{mood.e}</span><span className="l">{mood.l}</span></> : <span className="l">como foi?</span>}
          </button>
          {moodOpen && (
            <div className="dj-moods" role="group" aria-label="Humor do dia">
              {MOODS.map(([k, e, l]) => (
                <button key={k} className={entry?.mood === k ? 'on' : ''} aria-pressed={entry?.mood === k} title={l} onClick={() => { onSave({ mood: entry?.mood === k ? null : k }); setMoodOpen(false); }}>
                  <span>{e}</span><small>{l}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <Polaroids photos={photos} pending={pending} onOpen={onOpen} add={<AddPolaroid onFiles={onFiles} future={future} />} />

      <div className="dj-lower">
        <Note text={entry?.text || ''} onSave={(text) => onSave({ text })} placeholder={future ? 'Expectativas para este dia…' : 'O que aconteceu hoje? Cheiros, sabores, quem você conheceu…'} />
        {acts.length > 0 && <Stub acts={acts} />}
      </div>
      {dragging && <div className="dj-dropping dj-hand">solte para colar neste dia</div>}
    </section>
  );
}

function Polaroids({ photos, pending, onOpen, add = null }) {
  return (
    <div className="dj-pols">
      {photos.map((p) => (
        <figure key={p.id} className="dj-pol" style={{ '--r': `${tilt(p.id)}deg` }}>
          <button onClick={() => onOpen(p.id)} aria-label={p.caption ? `Abrir foto: ${p.caption}` : 'Abrir foto'}>
            <img src={api.thumbUrl(p.id)} alt={p.caption || ''} loading="lazy" />
          </button>
          <figcaption>{p.caption || (p.taken_at ? p.taken_at.slice(11, 16) : '')}</figcaption>
        </figure>
      ))}
      {pending.map((x) => (
        <figure key={x.key} className="dj-pol developing" style={{ '--r': '1deg' }}>
          <div className="dj-dev">{x.url ? <img src={x.url} alt="" /> : null}</div>
          <figcaption>revelando…</figcaption>
        </figure>
      ))}
      {add}
    </div>
  );
}

function AddPolaroid({ onFiles, future }) {
  return (
    <label className="dj-pol add" style={{ '--r': '-1.5deg' }}>
      <span className="plus" aria-hidden="true">+</span>
      <span className="dj-hand">{future ? 'cole uma foto aqui' : 'colar fotos'}</span>
      <input type="file" accept="image/*" multiple hidden onChange={(e) => { const f = [...(e.target.files || [])]; e.target.value = ''; onFiles(f); }} />
    </label>
  );
}

// texto do dia em papel pautado; salva sozinho enquanto você escreve
function Note({ text, onSave, placeholder }) {
  const [v, setV] = useState(text);
  const timer = useRef(null);
  const last = useRef(text);
  useEffect(() => { if (text !== last.current) { setV(text); last.current = text; } }, [text]);
  const flush = (val) => { clearTimeout(timer.current); if (val !== last.current) { last.current = val; onSave(val); } };
  useEffect(() => () => clearTimeout(timer.current), []);
  const ref = useRef(null);
  useEffect(() => { const t = ref.current; if (t) { t.style.height = 'auto'; t.style.height = `${Math.max(t.scrollHeight, 96)}px`; } }, [v]);
  return (
    <div className="dj-note">
      <textarea
        ref={ref} value={v} placeholder={placeholder} aria-label="Anotações do dia" rows={3}
        onChange={(e) => { const val = e.target.value; setV(val); clearTimeout(timer.current); timer.current = setTimeout(() => flush(val), 900); }}
        onBlur={() => flush(v)}
      />
    </div>
  );
}

// canhoto de ingresso com o que estava no roteiro do dia
function Stub({ acts }) {
  const list = acts.slice(0, 6);
  return (
    <aside className="dj-stub" aria-label="No roteiro deste dia">
      <div className="dj-stub-h">no roteiro</div>
      <ul>
        {list.map((a) => <li key={a.id} className={a.done ? 'done' : ''}><span aria-hidden="true">{a.done ? '✓' : '·'}</span>{a.title}</li>)}
      </ul>
      {acts.length > list.length && <div className="dj-stub-more">+{acts.length - list.length}</div>}
    </aside>
  );
}

function Lightbox({ list, id, days, onClose, onGo, onCaption, onDay, onDelete }) {
  const i = list.findIndex((p) => p.id === id);
  const p = list[i];
  const [cap, setCap] = useState(p?.caption || '');
  useEffect(() => { setCap(p?.caption || ''); }, [p?.id]);
  useEffect(() => {
    const k = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') { if (e.key === 'Escape') onClose(); return; }
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && i > 0) onGo(list[i - 1].id);
      if (e.key === 'ArrowRight' && i < list.length - 1) onGo(list[i + 1].id);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [i, list]);
  if (!p) return null;
  const saveCap = () => { if ((p.caption || '') !== cap.trim()) onCaption(p, cap.trim()); };
  return (
    <div className="dj-lb" role="dialog" aria-modal="true" aria-label="Foto do diário" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <button className="dj-lb-x icon-btn" onClick={onClose} aria-label="Fechar">×</button>
      {i > 0 && <button className="dj-lb-nav prev icon-btn" onClick={() => onGo(list[i - 1].id)} aria-label="Foto anterior">‹</button>}
      {i < list.length - 1 && <button className="dj-lb-nav next icon-btn" onClick={() => onGo(list[i + 1].id)} aria-label="Próxima foto">›</button>}
      <figure className="dj-lb-pol">
        <img src={api.photoUrl(p.id)} alt={p.caption || ''} style={{ backgroundImage: `url(${api.thumbUrl(p.id)})` }} />
        <input className="dj-lb-cap" value={cap} placeholder="escreva uma legenda…" maxLength={500} aria-label="Legenda"
          onChange={(e) => setCap(e.target.value)} onBlur={saveCap} onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }} />
      </figure>
      <div className="dj-lb-bar">
        <span className="muted small">{i + 1} de {list.length}{p.taken_at ? ` · tirada ${fmtDay(p.taken_at.slice(0, 10))} às ${p.taken_at.slice(11, 16)}` : ''}</span>
        <span className="spacer" />
        <select value={p.day && days.includes(p.day) ? p.day : ''} onChange={(e) => onDay(p, e.target.value || null)} aria-label="Dia da foto">
          <option value="">Sem dia</option>
          {days.map((d, k) => <option key={d} value={d}>{k + 1}º dia · {fmtDay(d)}</option>)}
        </select>
        <a className="btn-like" href={`${api.photoUrl(p.id)}?download`} download>Baixar</a>
        <button className="danger" onClick={() => onDelete(p)}>Excluir</button>
      </div>
    </div>
  );
}
