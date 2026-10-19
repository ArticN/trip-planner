import { useState } from 'react';
import { CHANGELOG, latestVersion, markSeen, seenVersion } from './changelog.js';
import { fmtDay } from './util.js';

// "Novidades": a versão mais recente aberta; as anteriores ficam no histórico
export default function WhatsNew() {
  const [fresh, setFresh] = useState(() => seenVersion() !== latestVersion);
  const [all, setAll] = useState(false);
  const list = all ? CHANGELOG : CHANGELOG.slice(0, 1);
  const dismiss = () => { markSeen(); setFresh(false); };

  return (
    <section className={`whatsnew${fresh ? ' fresh' : ''}`} id="novidades">
      <div className="wn-head">
        <h2 className="home-h">Novidades</h2>
        {fresh && <span className="wn-badge">nova versão</span>}
        <span className="spacer" />
        {fresh && <button className="mini" onClick={dismiss}>Entendi</button>}
      </div>
      {list.map((v) => (
        <article key={v.version} className="wn-entry">
          <div className="wn-meta"><b>v{v.version}</b> · {v.title}<span className="muted"> · {fmtDay(v.date)}</span></div>
          <ul>{v.items.map((it) => <li key={it}>{it}</li>)}</ul>
        </article>
      ))}
      {CHANGELOG.length > 1 && (
        <button className="wn-more" onClick={() => setAll((x) => !x)}>{all ? 'Mostrar só a última versão' : `Ver histórico (${CHANGELOG.length - 1} versões anteriores)`}</button>
      )}
    </section>
  );
}
