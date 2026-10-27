import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { TripModal } from './Modals.jsx';
import { daysBetween, fmtDay, fmtDayLong, nowIn, toMin } from './util.js';
import AppearanceModal from './Look.jsx';
import Mark from './Mark.jsx';
import WhatsNew from './WhatsNew.jsx';
import WorldMap from './WorldMap.jsx';

const coverUrl = (c) => `url("${String(c).replace(/"/g, '%22')}")`;

function status(t, today = nowIn(t.tz).day) {
  if (today < t.start) return { label: `Faltam ${daysBetween(today, t.start)} dias`, cls: 'soon' };
  if (today <= t.end) return { label: `Dia ${daysBetween(t.start, today) + 1} da viagem`, cls: 'now' };
  return { label: 'Concluída', cls: 'past' };
}

export default function Home({ version, onOpen, onChanged }) {
  const [trips, setTrips] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(null);
  const [toast, setToast] = useState('');
  const [look, setLook] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const t = await api.trips();
      setTrips(t); setError('');
    } catch (err) { setError(String(err.message || err)); }
  }, []);
  useEffect(() => { load(); }, [load, version]);

  // destaque: a viagem em andamento ou a próxima
  const featured = (trips || []).filter((t) => nowIn(t.tz).day <= t.end).sort((a, b) => a.start.localeCompare(b.start))[0] || null;
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    setDetail(null);
    if (featured) api.trip(featured.id).then(setDetail).catch(() => {});
  }, [featured?.id, version]);

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 3200); };

  const newTrip = () => {
    const t = new Date();
    const end = new Date(t.getTime() + 6 * 86400000);
    const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setCreating({ name: '', subtitle: '', emoji: '', start: f(t), end: f(end), currency: 'BRL', home_currency: 'BRL', rate: 1 });
  };

  const create = async (t) => {
    try {
      const d = await api.createTrip(t);
      setCreating(null);
      onChanged();
      onOpen(d.trip.id);
    } catch (e) { say('Não consegui criar a viagem'); }
  };


  // roteiro fictício de demonstração (server/examples), oferecido só com a lista vazia
  const loadExample = async () => {
    try {
      const d = await api.loadExample('exemplo');
      onChanged();
      onOpen(d.trip.id);
    } catch (e) { say('Não consegui carregar o exemplo'); }
  };

  const onImport = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const d = await api.importTrip(JSON.parse(await f.text()));
      onChanged();
      onOpen(d.trip.id);
    } catch (err) { say('Não consegui importar: arquivo de backup inválido'); }
  };

  if (error) return <div className="splash"><h1><Mark size={44} /></h1><p>Não consegui falar com o servidor.</p><code>{error}</code><button onClick={load}>Tentar de novo</button></div>;
  if (!trips) return <div className="splash"><h1><Mark size={44} /></h1><p>Carregando…</p></div>;

  const others = trips.filter((t) => t !== featured);
  const upcoming = others.filter((t) => nowIn(t.tz).day <= t.end);
  const past = others.filter((t) => nowIn(t.tz).day > t.end);
  const card = (t) => {
    const st = status(t);
    return (
      <button key={t.id} className={`trip-card${t.cover ? ' has-cover' : ''}`} onClick={() => onOpen(t.id)}>
        {t.cover && <span className="tc-cover" style={{ backgroundImage: coverUrl(t.cover) }} />}
        <span className="tc-name">{t.emoji ? <span className="tc-emoji">{t.emoji}</span> : null}{t.name}</span>
        {t.subtitle && <span className="tc-sub">{t.subtitle}</span>}
        <span className="tc-dates">{fmtDay(t.start)} → {fmtDay(t.end)} · {daysBetween(t.start, t.end) + 1} dias</span>
        <span className="tc-foot">
          <span className={`tc-status ${st.cls}`}>{st.label}</span>
          <span className="muted small">{t.activity_count} {t.activity_count === 1 ? 'atividade' : 'atividades'}</span>
        </span>
      </button>
    );
  };
  return (
    <div className="home">
      <header className="home-top">
        <div className="brand"><span className="logo"><Mark /></span><div><div className="brand-name">Trip Planner</div><div className="brand-sub">mapa, roteiro dia a dia e orçamento</div></div></div>
        <span className="spacer" />
        <button className="icon-btn" onClick={() => setLook(true)} title="Aparência" aria-label="Aparência">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.8-.3-.9-.1-2.2 1.2-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z" /><circle cx="7.5" cy="11" r="1.2" fill="currentColor" /><circle cx="10.5" cy="7" r="1.2" fill="currentColor" /><circle cx="15" cy="7.5" r="1.2" fill="currentColor" /></svg>
        </button>
        <button className="ghost" onClick={() => fileRef.current.click()}>Importar<span className="hide-sm"> backup</span></button>
        <button className="primary" onClick={newTrip}>+ Nova viagem</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
      </header>

      <main className="home-main">
        {trips.length === 0 ? (
          <div className="home-empty">
            <h1>Para onde vamos?</h1>
            <p>Crie uma viagem para montar o roteiro dia a dia, ver tudo no mapa e controlar o orçamento.</p>
            <button className="primary big" onClick={newTrip}>+ Criar minha primeira viagem</button>
            <p className="home-example-link"><button className="link-btn" onClick={loadExample}>ou carregue um roteiro de exemplo</button></p>
          </div>
        ) : (
          <>
            {featured && <Featured trip={featured} detail={detail} onOpen={onOpen} />}
            {upcoming.length > 0 && (
              <>
                <h2 className="home-h">{featured ? 'Próximas viagens' : 'Minhas viagens'}</h2>
                <div className="trip-grid">{upcoming.map(card)}</div>
              </>
            )}
            {past.length > 0 && (
              <>
                <h2 className="home-h">Concluídas</h2>
                <div className="trip-grid">{past.map(card)}</div>
              </>
            )}
          </>
        )}

        <WorldMap version={version} />
        <WhatsNew />
      </main>

      {look && <AppearanceModal onClose={() => setLook(false)} />}
      {creating && <TripModal trip={creating} onSave={create} onClose={() => setCreating(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// cartão grande da viagem em andamento (com a próxima atividade) ou da próxima viagem
function Featured({ trip, detail, onOpen }) {
  const now = nowIn(trip.tz);
  const total = daysBetween(trip.start, trip.end) + 1;
  const going = now.day >= trip.start;
  const dayN = daysBetween(trip.start, now.day) + 1;
  const acts = detail?.activities || [];
  const todays = acts.filter((a) => a.day === now.day).sort((a, b) => a.sort - b.sort);
  const next = todays.find((a) => !a.done && a.start && toMin(a.start) >= now.min) || todays.find((a) => !a.done);
  const check = detail?.checklist || [];
  const checkDone = check.filter((c) => c.done).length;
  const firstDay = acts.filter((a) => a.day === trip.start);
  return (
    <section className={`featured${trip.cover ? ' has-cover' : ''}`} style={trip.cover ? { '--cover': coverUrl(trip.cover) } : undefined}>
      <div className="ft-kicker">{going ? 'Em andamento' : 'Próxima viagem'}</div>
      <h1 className="ft-name">{trip.name}</h1>
      <div className="ft-big">
        {going ? <><b>Dia {dayN}</b><span>de {total}</span></> : <><b>{daysBetween(now.day, trip.start)}</b><span>{daysBetween(now.day, trip.start) === 1 ? 'dia para ir' : 'dias para ir'}</span></>}
      </div>
      <div className="ft-meta">{fmtDay(trip.start)} → {fmtDay(trip.end)} · {total} dias · {trip.activity_count} atividades</div>
      {going && (
        <div className="ft-next">
          {next ? <>A seguir: <b>{next.start ? `${next.start} · ` : ''}{next.title}</b></> : todays.length ? 'Tudo feito por hoje.' : 'Nada planejado para hoje.'}
        </div>
      )}
      {!going && (
        <div className="ft-next">
          {check.length > 0 ? <>Checklist: <b>{checkDone} de {check.length}</b> itens prontos</> : 'Monte o checklist de documentos, reservas e mala.'}
          {firstDay.length > 0 && <> · primeiro dia, {fmtDayLong(trip.start)}: {firstDay.length} {firstDay.length === 1 ? 'atividade' : 'atividades'}</>}
        </div>
      )}
      <div className="ft-actions">
        <button className="primary" onClick={() => onOpen(trip.id)}>{going ? 'Abrir o dia de hoje' : 'Abrir roteiro'}</button>
      </div>
    </section>
  );
}
