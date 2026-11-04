import { Component, lazy, Suspense } from 'react';
import Mark from './Mark.jsx';

// telas grandes (diário, análise, ingressos, notas, nova viagem, link de visitante) só são baixadas
// quando abertas: o app abre mais rápido no celular. Sem internet elas já estão no aparelho
// (o service worker guarda todos os arquivos do app quando instala cada versão).
// Se o arquivo sumiu porque saiu uma versão nova do app enquanto esta aba estava aberta,
// recarrega (no máximo uma vez por minuto) para pegar a versão nova em vez de mostrar tela branca.
const KEY = 'tp-chunk-reload';
function load(loader) {
  return loader().catch((err) => {
    let last = Date.now();
    try { last = Number(sessionStorage.getItem(KEY)) || 0; } catch { /* sem storage: não recarrega */ }
    if (navigator.onLine && Date.now() - last > 60000) {
      try { sessionStorage.setItem(KEY, String(Date.now())); } catch { /* sem storage */ }
      window.location.reload();
      return new Promise(() => {});
    }
    throw err;
  });
}

export const Splash = ({ text = 'Carregando…' }) => <div className="splash"><h1><Mark size={44} /></h1><p>{text}</p></div>;

// se mesmo assim a tela não carregar (sem internet e o arquivo não está no aparelho), mostra um aviso
// com saída em vez de derrubar o app inteiro
class LoadError extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.quiet) return null;
    return (
      <div className="splash">
        <h1><Mark size={44} /></h1>
        <p>{navigator.onLine ? 'Não consegui abrir esta tela.' : 'Esta tela ainda não está no aparelho. Abra com internet uma vez para ela funcionar offline.'}</p>
        <div><button onClick={() => window.location.reload()}>Tentar de novo</button> <button onClick={() => { window.location.hash = '#/'; this.setState({ failed: false }); }}>Voltar às viagens</button></div>
      </div>
    );
  }
}

// text: aviso enquanto baixa (null = nada, para janelas que abrem por cima da tela)
export function lazyPage(loader, text) {
  const C = lazy(() => load(loader));
  function Page(props) {
    return (
      <LoadError quiet={text === null}>
        <Suspense fallback={text === null ? null : <Splash text={text} />}><C {...props} /></Suspense>
      </LoadError>
    );
  }
  return Page;
}
