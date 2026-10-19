import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { TripModal } from './Modals.jsx';
import { daysBetween, fmtDay } from './util.js';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function status(t, today) {
  if (today < t.start) return { label: `Faltam ${daysBetween(today, t.start)} dias`, cls: 'soon' };
  if (today <= t.end) return { label: `Dia ${daysBetween(t.start, today) + 1} da viagem`, cls: 'now' };
  return { label: 'Concluída', cls: 'past' };
}

export default function Home({ version, onOpen, onChanged }) {
  const [trips, setTrips] = useState(null);
  const [examples, setExamples] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(null);
  const [toast, setToast] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [t, e] = await Promise.all([api.trips(), api.examples()]);
      setTrips(t); setExamples(e); setError('');
    } catch (err) { setError(String(err.message || err)); }
  }, []);
  useEffect(() => { load(); }, [load, version]);

  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 3200); };

  const newTrip = () => {
    const t = new Date();
    const end = new Date(t.getTime() + 6 * 86400000);
    const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setCreating({ name: '', subtitle: '', emoji: '🧳', start: f(t), end: f(end), currency: 'BRL', home_currency: 'BRL', rate: 1 });
  };

  const create = async (t) => {
    try {
      const d = await api.createTrip(t);
      setCreating(null);
      onChanged();
      onOpen(d.trip.id);
    } catch (e) { say('Não consegui criar a viagem'); }
  };

  const loadExample = async (key) => {
    try { const d = await api.loadExample(key); onChanged(); onOpen(d.trip.id); } catch { say('Erro ao carregar o exemplo'); }
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

  if (error) return <div className="splash"><h1>🧳</h1><p>Não consegui falar com o servidor.</p><code>{error}</code><button onClick={load}>Tentar de novo</button></div>;
  if (!trips) return <div className="splash"><h1>🧳</h1><p>Carregando…</p></div>;

  const today = todayStr();
  return (
    <div className="home">
      <header className="home-top">
        <div className="brand"><span className="logo">🧳</span><div><div className="brand-name">Trip Planner</div><div className="brand-sub">mapa, roteiro dia a dia e orçamento</div></div></div>
        <span className="spacer" />
        <button onClick={() => fileRef.current.click()}>⬆️ <span className="hide-sm">Importar backup</span></button>
        <button className="primary" onClick={newTrip}>+ Nova viagem</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
      </header>

      <main className="home-main">
        {trips.length === 0 ? (
          <div className="home-empty">
            <h1>Para onde vamos?</h1>
            <p>Crie uma viagem para montar o roteiro dia a dia, ver tudo no mapa e controlar o orçamento.</p>
            <button className="primary big" onClick={newTrip}>+ Criar minha primeira viagem</button>
          </div>
        ) : (
          <>
            <h2 className="home-h">Minhas viagens</h2>
            <div className="trip-grid">
              {trips.map((t) => {
                const st = status(t, today);
                return (
                  <button key={t.id} className="trip-card" onClick={() => onOpen(t.id)}>
                    <span className="tc-emoji">{t.emoji || '🧳'}</span>
                    <span className="tc-name">{t.name}</span>
                    {t.subtitle && <span className="tc-sub">{t.subtitle}</span>}
                    <span className="tc-dates">{fmtDay(t.start)} → {fmtDay(t.end)} · {daysBetween(t.start, t.end) + 1} dias</span>
                    <span className="tc-foot">
                      <span className={`tc-status ${st.cls}`}>{st.label}</span>
                      <span className="muted small">{t.activity_count} {t.activity_count === 1 ? 'atividade' : 'atividades'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {examples.length > 0 && (
          <section className="home-examples">
            <h3>Quer ver como funciona?</h3>
            {examples.map((x) => (
              <div className="example" key={x.key}>
                <div><b>{x.title}</b><div className="muted small">{x.description}</div></div>
                <button onClick={() => loadExample(x.key)}>Carregar exemplo</button>
              </div>
            ))}
          </section>
        )}
      </main>

      {creating && <TripModal trip={creating} onSave={create} onClose={() => setCreating(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
