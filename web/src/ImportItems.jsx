// Importar atividades e ideias de um JSON para dentro desta viagem (v1.54). A viagem continua a mesma:
// links de visitante, agenda .ics, anexos e fotos não mudam. O servidor confere tudo e mostra uma prévia
// antes de gravar (server/importItems.js tem o formato).
import { useRef, useState } from 'react';
import { api } from './api.js';
import { Modal } from './Modals.jsx';
import { fmtDay } from './util.js';

const ACTION = {
  create: 'Nova', update: 'Atualiza', delete: 'Apaga', to_idea: 'Vai para as ideias', to_activity: 'Vai para o roteiro',
  skip: 'Já existe', same: 'Sem mudança', error: 'Erro',
};
const EXAMPLE = `{
  "day": "AAAA-MM-DD",
  "activities": [
    { "start": "10:30", "end": "13:00", "title": "Nome do lugar", "kind": "sight",
      "location": "Endereço", "lat": 35.47, "lng": 138.62,
      "notes": "observações", "links": ["https://…"] }
  ]
}`;

export default function ImportItemsModal({ tripId, days, initialDay, onDone, onClose }) {
  const [text, setText] = useState('');
  const [day, setDay] = useState(initialDay && days.includes(initialDay) ? initialDay : '');
  const [plan, setPlan] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const parse = () => {
    try { return JSON.parse(text); } catch { setErr('O texto não é um JSON válido.'); return null; }
  };
  const run = async (preview) => {
    const data = parse();
    if (data == null) return;
    setBusy(true); setErr('');
    try {
      const r = await api.importItems(tripId, data, day, preview);
      if (preview) setPlan(r);
      else { onDone(r); }
    } catch (e) {
      // o servidor responde 400 com o plano quando algum item tem erro: mostra a prévia com os erros
      const m = String(e.message || e).match(/\{.*\}$/s);
      let body = null;
      try { body = m ? JSON.parse(m[0]) : null; } catch { /* sem corpo */ }
      if (body?.items) setPlan(body);
      setErr(body?.error || (body?.items ? 'Algum item tem erro: corrija o JSON e confira de novo.' : String(e.message || e)));
    } finally { setBusy(false); }
  };
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) { setText(await f.text()); setPlan(null); setErr(''); }
  };

  const s = plan?.summary;
  const writes = s ? s.create + s.update + s.delete + s.move : 0;
  return (
    <Modal
      title="Importar atividades"
      wide
      onClose={onClose}
      footer={
        <>
          {s && <span className="muted small">{writes} {writes === 1 ? 'mudança' : 'mudanças'}{s.skip ? ` · ${s.skip} já existe${s.skip === 1 ? '' : 'm'}` : ''}{s.error ? ` · ${s.error} com erro` : ''}</span>}
          <span className="spacer" />
          <button onClick={onClose}>Cancelar</button>
          {!plan || s.error ? (
            <button className="primary" disabled={!text.trim() || busy} onClick={() => run(true)}>{busy ? 'Conferindo…' : 'Conferir'}</button>
          ) : (
            <button className="primary" disabled={!writes || busy} onClick={() => run(false)}>{busy ? 'Importando…' : `Importar ${writes}`}</button>
          )}
        </>
      }
    >
      <div className="form">
        <p className="full muted small">
          Adiciona ou atualiza itens nesta viagem sem criar outra: os links compartilhados, a agenda e os anexos continuam iguais.
          Item com <code>id</code> (do backup desta viagem) atualiza só os campos enviados; sem <code>id</code> entra como novo, pelo horário.
          Use <code>"_delete": true</code> para apagar e <code>"_move": "ideas"</code> para mandar uma atividade para as ideias.
        </p>
        <label>Dia das atividades sem "day"
          <select value={day} onChange={(e) => { setDay(e.target.value); setPlan(null); }}>
            <option value="">Usar o "day" de cada item</option>
            {days.map((d) => <option key={d} value={d}>{fmtDay(d)}</option>)}
          </select>
        </label>
        <label>Arquivo
          <button type="button" onClick={() => fileRef.current.click()}>Escolher arquivo .json</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
        </label>
        <label className="full">JSON
          <textarea rows={plan ? 5 : 10} value={text} spellCheck={false} placeholder={EXAMPLE} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
            onChange={(e) => { setText(e.target.value); setPlan(null); setErr(''); }} />
        </label>
        {err && <p className="full" role="alert" style={{ color: 'var(--danger, #c0392b)' }}>{err}</p>}
        {plan?.items && (
          <ul className="full import-plan" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {plan.items.map((x, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', opacity: x.action === 'same' || x.action === 'skip' ? 0.6 : 1 }}>
                <b style={{ minWidth: 92, color: x.action === 'error' ? 'var(--danger, #c0392b)' : undefined }}>{ACTION[x.action] || x.action}</b>
                <span>{x.title || x.pos}</span>
                {x.day && <span className="muted small">{fmtDay(x.day)}{x.row?.start ? ` ${x.row.start}` : ''}</span>}
                {x.type === 'idea' && x.action !== 'to_activity' && <span className="muted small">ideia</span>}
                {x.changed && <span className="muted small">{x.changed.join(', ')}</span>}
                {x.reason && <span className="muted small">{x.reason}</span>}
                {x.warn?.length > 0 && <span className="muted small">{x.warn.join('; ')}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
