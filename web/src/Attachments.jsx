import { useState } from 'react';
import { api } from './api.js';

// anexos de uma atividade ou ideia: ingressos, passagens, vouchers, confirmações
export const MAX_FILE = 4 * 1024 * 1024; // teto do servidor (limite de requisição da Vercel)

export const fmtSize = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const isImage = (t) => /^image\/(png|jpeg|gif|webp|avif)$/.test(t || '');

// foto grande demais: reduz para caber, mantendo resolução de sobra para QR code e código de barras
async function fitImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = url; });
    for (const [side, q] of [[2600, 0.9], [2000, 0.85], [1600, 0.8]]) {
      const k = Math.min(1, side / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', q));
      if (blob && blob.size <= MAX_FILE) return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
    }
    return null;
  } finally { URL.revokeObjectURL(url); }
}

// prepara a lista escolhida: reduz fotos grandes e recusa o que não cabe
export async function prepareFiles(list) {
  const ok = [];
  const errors = [];
  for (const f of list) {
    if (f.size <= MAX_FILE) { ok.push(f); continue; }
    const small = f.type.startsWith('image/') ? await fitImage(f).catch(() => null) : null;
    if (small) ok.push(small); else errors.push(`${f.name} passa de 4 MB`);
  }
  return { ok, errors };
}

export function FileIcon({ type }) {
  const label = type === 'application/pdf' ? 'PDF' : isImage(type) ? 'IMG' : 'ARQ';
  return <span className={`file-ic ${label.toLowerCase()}`} aria-hidden="true">{label}</span>;
}

// lista para leitura (painel do pin, roteiro compartilhado não usa)
export function FileList({ files: all }) {
  const files = (all || []).filter((f) => (f.kind || 'doc') === 'doc');
  if (!files.length) return null;
  return (
    <ul className="file-list">
      {files.map((f) => (
        <li key={f.id}>
          <a href={api.fileUrl(f.id)} target="_blank" rel="noreferrer">
            {isImage(f.type) ? <img src={api.fileUrl(f.id)} alt="" loading="lazy" /> : <FileIcon type={f.type} />}
            <span><b>{f.name}</b><small>{fmtSize(f.size)}</small></span>
          </a>
        </li>
      ))}
    </ul>
  );
}

// campo do editor: anexa na hora (item já salvo) ou guarda para enviar ao salvar (item novo)
export function AttachmentsField({ files: allFiles = [], pending: allPending = [], onAdd, onRemove, onPending, kind = 'doc' }) {
  const isReceipt = kind === 'receipt';
  const files = allFiles.filter((f) => (f.kind || 'doc') === kind);
  const pending = allPending.filter((f) => (f.kind || 'doc') === kind);
  const others = allPending.filter((f) => (f.kind || 'doc') !== kind);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (e) => {
    const list = [...(e.target.files || [])];
    e.target.value = '';
    if (!list.length) return;
    setBusy(true); setErr('');
    try {
      const { ok, errors } = await prepareFiles(list);
      ok.forEach((f) => { f.kind = kind; });
      if (onPending) onPending([...others, ...pending, ...ok]);
      else for (const f of ok) await onAdd(f);
      if (errors.length) setErr(`Não anexei: ${errors.join(', ')}.`);
    } catch (x) { setErr(`Não consegui enviar: ${x.message}`); } finally { setBusy(false); }
  };
  return (
    <div className={`full fieldset attach${isReceipt ? ' receipt' : ''}`}>
      <div className="legend">{isReceipt ? <>Recibo <span className="muted small">foto ou PDF do comprovante do gasto real</span></> : <>Anexos <span className="muted small">ingressos, passagens, vouchers (até 4 MB cada)</span></>}</div>
      {(files.length > 0 || pending.length > 0) && (
        <ul className="file-list edit">
          {files.map((f) => (
            <li key={f.id}>
              <a href={api.fileUrl(f.id)} target="_blank" rel="noreferrer">
                {isImage(f.type) ? <img src={api.fileUrl(f.id)} alt="" loading="lazy" /> : <FileIcon type={f.type} />}
                <span><b>{f.name}</b><small>{fmtSize(f.size)}</small></span>
              </a>
              <button type="button" className="icon-btn sm" onClick={() => onRemove(f)} aria-label={`Remover ${f.name}`} title="Remover">×</button>
            </li>
          ))}
          {pending.map((f, i) => (
            <li key={`p${i}`} className="pending">
              <span className="file-a"><FileIcon type={f.type} /><span><b>{f.name}</b><small>{fmtSize(f.size)} · envia ao salvar</small></span></span>
              <button type="button" className="icon-btn sm" onClick={() => onPending([...others, ...pending.filter((_, j) => j !== i)])} aria-label={`Remover ${f.name}`} title="Remover">×</button>
            </li>
          ))}
        </ul>
      )}
      <label className={`btn-like${busy ? ' disabled' : ''}`}>
        {busy ? 'Enviando…' : isReceipt ? 'Foto do recibo' : 'Anexar arquivo'}
        <input type="file" multiple hidden disabled={busy} onChange={pick} accept={isReceipt ? 'image/*,application/pdf' : 'image/*,application/pdf,.pkpass,.txt,.eml,.html,.doc,.docx'} />
      </label>
      {err && <div className="warn">{err}</div>}
    </div>
  );
}
