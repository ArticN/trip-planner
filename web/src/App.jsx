import { useCallback, useEffect, useState } from 'react';
import Home from './Home.jsx';
import TripView from './TripView.jsx';
import Login from './Login.jsx';
import { api } from './api.js';

// rotas por hash: #/ (viagens) · #/t/<id> (visão geral) · #/t/<id>/<aaaa-mm-dd> (dia)
function parseHash() {
  const m = window.location.hash.replace(/^#\/?/, '').match(/^t\/(\d+)(?:\/(\d{4}-\d{2}-\d{2}))?$/);
  return m ? { tripId: Number(m[1]), sel: m[2] || 'trip' } : { tripId: null, sel: 'trip' };
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [version, setVersion] = useState(0); // muda quando a lista de viagens precisa recarregar
  const [auth, setAuth] = useState('checking'); // checking | ok | login
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    api.session().then((s) => setAuth(s.ok ? 'ok' : 'login')).catch(() => setAuth('ok'));
    const need = () => setAuth('login');
    window.addEventListener('auth-required', need);
    return () => window.removeEventListener('auth-required', need);
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const openTrip = useCallback((id) => { window.location.hash = `#/t/${id}`; }, []);
  const goHome = useCallback((openId) => { if (openId) openTrip(openId); else window.location.hash = '#/'; }, [openTrip]);
  const navigate = useCallback((sel) => {
    window.history.replaceState(null, '', `#/t/${route.tripId}${sel === 'trip' ? '' : `/${sel}`}`);
    setRoute((r) => ({ ...r, sel }));
  }, [route.tripId]);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  if (auth === 'checking') return null;
  if (auth === 'login') return <Login onDone={() => { setAuth('ok'); refresh(); }} />;
  const banner = !online && <div className="offline-bar" role="status" title="Sem internet: vendo a última versão salva; edições não são salvas">Sem internet<span className="hide-sm">: vendo a última versão salva; edições não são salvas</span></div>;
  if (route.tripId == null) return <>{banner}<Home version={version} onOpen={openTrip} onChanged={refresh} /></>;
  return <>{banner}<TripView key={route.tripId} tripId={route.tripId} sel={route.sel} onNavigate={navigate} onHome={goHome} onTripsChanged={refresh} /></>;
}
