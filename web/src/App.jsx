import { useCallback, useEffect, useState } from 'react';
import Home from './Home.jsx';
import TripView from './TripView.jsx';
import Login from './Login.jsx';
import Setup, { NoPasswordBar } from './Setup.jsx';
import { lazyPage } from './lazyPage.jsx';
import { api } from './api.js';
import { SyncBar } from './OfflinePanel.jsx';

const ShareView = lazyPage(() => import('./ShareView.jsx'), 'Carregando roteiro…');

// rotas por hash: #/ (viagens) · #/t/<id> (visão geral) · #/t/<id>/<aaaa-mm-dd> (dia) · #/t/<id>/analise · #/t/<id>/ingressos · #/t/<id>/diario · #/t/<id>/notas
function parseHash() {
  const m = window.location.hash.replace(/^#\/?/, '').match(/^t\/(\d+)(?:\/(\d{4}-\d{2}-\d{2}|analise|ingressos|diario|notas))?$/);
  return m ? { tripId: Number(m[1]), sel: m[2] || 'trip' } : { tripId: null, sel: 'trip' };
}

const shareToken = () => window.location.hash.match(/^#\/s\/([\w-]{16,})/)?.[1] || null;

export default function App() {
  const [share] = useState(shareToken);
  if (share) return <ShareView key={share} token={share} />;
  return <Planner />;
}

function Planner() {
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

  // instalação nova sem banco ou sem senha: explica o que falta em vez de mostrar erro técnico
  const [setup, setSetup] = useState(null);
  useEffect(() => {
    fetch('/api/setup').then((r) => (r.ok ? r.json() : null)).then(setSetup).catch(() => {});
  }, []);

  useEffect(() => {
    // sem internet (ou internet lenta) abre com a cópia do aparelho; se a sessão tiver expirado, o servidor pede login depois
    const slow = setTimeout(() => setAuth((a) => (a === 'checking' ? 'ok' : a)), 6000);
    api.session().then((s) => setAuth(s.ok ? 'ok' : 'login')).catch(() => setAuth((a) => (a === 'checking' ? 'ok' : a))).finally(() => clearTimeout(slow));
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

  if (setup && setup.db !== 'ok') return <Setup info={setup} />;
  if (auth === 'checking') return null;
  if (auth === 'login') return <Login onDone={() => { setAuth('ok'); refresh(); window.dispatchEvent(new Event('auth-ok')); }} />;
  // sem internet, enviando edições, edições não salvas: a barra abre o painel "Dados no aparelho"
  const banner = <SyncBar online={online} authed={auth === 'ok'} />;
  if (route.tripId == null) return <>{banner}{setup?.hosted && !setup.password && <NoPasswordBar />}<Home version={version} onOpen={openTrip} onChanged={refresh} /></>;
  return <>{banner}<TripView key={route.tripId} tripId={route.tripId} sel={route.sel} onNavigate={navigate} onHome={goHome} onTripsChanged={refresh} /></>;
}
