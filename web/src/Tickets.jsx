import { useEffect, useMemo, useState } from 'react';
import { tickets, TICKET_CATS } from './tickets.js';
import { LinkText, linkLabel, parseLinks } from './Extras.jsx';
import { fmtDay, makeFx, money, nowIn } from './util.js';
import { api } from './api.js';
import { FileIcon, fmtSize, prepareFiles } from './Attachments.jsx';
import { Icon } from './icons.jsx';
import { sync, usePendingUploads } from './offline/index.js';
import { makeZip, safeName } from './zip.js';

const isImage = (t) => /^image\/(png|jpeg|gif|webp|avif)$/.test(t || '');
const ACCEPT = 'application/pdf,image/*,.pkpass';
// arquivos de cada item: os da atividade e os do item de reserva da checklist ligado a ela
const filesOf = (e, list) => list.filter((f) => (e.act && f.activity_id === e.act.id) || (e.check?.id != null && f.check_id === e.check.id));
const targetOf = (e) => (e.act ? { activity: e.act.id } : e.check?.id != null ? { check: e.check.id } : null);

// anexos já guardados no aparelho (o service worker guarda cada um quando a viagem abre com internet)
function useCached(files) {
  const [ids, setIds] = useState(() => new Set());
  const key = files.map((f) => f.id).join(',');
  useEffect(() => {
    if (!('caches' in window) || !navigator.serviceWorker?.controller) return undefined;
    let live = true;
    const check = async () => {
      const c = await caches.open('files-v1');
      const hit = new Set();
      for (const f of files) if (await c.match(api.fileUrl(f.id))) hit.add(f.id);
      if (live) setIds(hit);
    };
    check().catch(() => {});
    const t = setTimeout(() => check().catch(() => {}), 4000); // a viagem acabou de abrir: o download ainda pode estar rodando
    return () => { live = false; clearTimeout(t); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return ids;
}

// abre um anexo que ainda só está no aparelho (escolhido sem internet)
async function openLocal(u) {
  const blob = await sync.uploadBlob(u.id);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// conteúdo de um anexo: o que está no servidor vem do cache do service worker (funciona offline);
// o que ainda não subiu vem do IndexedDB
async function blobOf(f, local) {
  if (local) {
    const b = await sync.uploadBlob(f.id);
    if (!b) throw new Error('não está mais no aparelho');
    return b;
  }
  const r = await fetch(api.fileUrl(f.id));
  if (!r.ok) throw new Error(navigator.onLine ? `erro ${r.status}` : 'ainda não foi guardado no aparelho');
  return r.blob();
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // alguns navegadores trocam nome com acento por "download"
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// no celular, a folha de compartilhar do sistema é o caminho para "Salvar em Arquivos", Wallet, Drive…
const touch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
const canShareFiles = (files) => {
  try { return !!navigator.canShare?.({ files }); } catch { return false; }
};
async function shareOrSave(files) {
  if (touch() && canShareFiles(files)) {
    try { await navigator.share({ files }); return 'share'; } catch (x) { if (x?.name === 'AbortError') return 'abort'; }
  }
  for (const f of files) saveBlob(f, f.name);
  return 'save';
}
const asFile = (blob, name, type) => new File([blob], name, { type: type || blob.type || 'application/octet-stream' });

// ── página de ingressos e reservas: o que já foi comprado, o que falta comprar (com quando a venda abre e onde),
// o que só precisa se escolher aquela opção e o que se paga na entrada. Fora do link de compartilhamento,
// "Comprado" marca o item de reserva da checklist (e cria um, se a atividade ainda não tiver).
export default function Tickets({ data, onBack, readOnly = false, onToggle, onAddFile, onRemoveFile }) {
  const { trip } = data;
  const t = useMemo(() => tickets(data), [data]);
  const fx = useMemo(() => makeFx(trip), [trip]);
  const [cat, setCat] = useState('all');
  const today = nowIn(trip.tz).day;
  const canFile = !readOnly && !!onAddFile;
  const allDocs = useMemo(() => (data.files || []).filter((f) => (f.kind || 'doc') === 'doc'), [data.files]);
  const waiting = usePendingUploads(canFile ? trip.id : null);
  const cached = useCached(canFile ? allDocs : []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const docs = (e) => filesOf(e, allDocs);
  const localDocs = (e) => filesOf(e, waiting);

  const upload = async (target, list) => {
    if (!list.length) return;
    setBusy(true); setMsg(null);
    const { ok, errors } = await prepareFiles(list);
    let queued = 0;
    let sent = 0;
    for (const f of ok) {
      f.kind = 'doc';
      try { const up = await onAddFile(target, f); if (up?.queued) queued++; else sent++; } catch (x) { errors.push(`${f.name} (${x.message})`); }
    }
    const parts = [];
    if (sent) parts.push(`${sent === 1 ? 'Arquivo salvo' : `${sent} arquivos salvos`}.`);
    if (queued) parts.push(`Sem internet: ${queued === 1 ? 'o arquivo ficou guardado' : `${queued} arquivos ficaram guardados`} neste aparelho e ${queued === 1 ? 'sobe' : 'sobem'} sozinho${queued === 1 ? '' : 's'} quando a internet voltar.`);
    if (errors.length) parts.push(`Não salvei: ${errors.join(', ')}.`);
    setMsg({ text: parts.join(' '), bad: errors.length > 0 });
    setBusy(false);
  };
  const remove = async (f) => {
    if (!window.confirm(`Remover ${f.name}?`)) return;
    try { await onRemoveFile(f); } catch (x) { setMsg({ text: `Não consegui remover ${f.name}: ${x.message}`, bad: true }); }
  };
  const fileProps = { canFile, busy, docs, localDocs, cached, upload, remove };
  const price = (n) => (fx.convert ? <>{money(n * fx.rate, fx.home)} <small>{fx.fmt(n)}</small></> : fx.fmt(n));
  const show = (l) => (cat === 'all' ? l : l.filter((e) => e.cat === cat));
  const done = t.groups.ok.length;
  const need = done + t.groups.todo.length;
  const cats = Object.keys(TICKET_CATS).filter((k) => t.entries.some((e) => e.cat === k && e.status !== 'gate'));

  const nav = [...(canFile ? [['arquivos', 'Arquivos']] : []), ['falta', 'Falta comprar'], ['opcoes', 'Só se escolher'], ['comprados', 'Comprados'], ['entrada', 'Pagar na entrada']];

  return (
    <div className="an">
      <div className="an-head">
        <header className="an-top">
          {onBack && <button className="icon-btn" onClick={onBack} title="Voltar ao roteiro" aria-label="Voltar ao roteiro">←</button>}
          <div>
            <div className="brand-name">Ingressos e reservas</div>
            <div className="brand-sub">{trip.name} · {fmtDay(trip.start)} a {fmtDay(trip.end)}</div>
          </div>
          <span className="spacer" />
          <button className="ghost hide-sm" onClick={() => window.print()}>Imprimir ou salvar PDF</button>
        </header>
        <nav className="an-nav" aria-label="Seções">
          {nav.map(([id, l]) => <a key={id} href={`#tk-${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`tk-${id}`)?.scrollIntoView({ behavior: 'smooth' }); }}>{l}</a>)}
        </nav>
      </div>

      <main className="an-body">
        <section id="tk-resumo">
          <div className="an-hero">
            <span className="an-eyebrow">Comprados e reservados</span>
            <b>{done} de {need}</b>
            <div className="an-quota-bar" role="img" aria-label={`${done} de ${need} comprados`}><i style={{ width: `${need ? (done / need) * 100 : 0}%` }} /></div>
          </div>
          <div className="an-kpis">
            <Kpi v={t.groups.todo.length} l={`falta comprar ou reservar${t.totals.todo ? ` · ${fx.fmt(t.totals.todo)}` : ''}`} />
            <Kpi v={done} l={`comprados ou reservados${t.totals.ok ? ` · ${fx.fmt(t.totals.ok)}` : ''}`} />
            <Kpi v={t.groups.maybe.length} l="só se escolher aquela opção" />
            <Kpi v={t.groups.gate.length} l={`pagos na entrada${t.totals.gate ? ` · ${fx.fmt(t.totals.gate)}` : ''}`} />
          </div>
          {cats.length > 1 && (
            <div className="tk-filter" role="group" aria-label="Filtrar por tipo">
              {[['all', 'Tudo'], ...cats.map((k) => [k, TICKET_CATS[k]])].map(([k, l]) => (
                <button key={k} className={`chip${cat === k ? ' on' : ''}`} aria-pressed={cat === k} onClick={() => setCat(k)}>{l}</button>
              ))}
            </div>
          )}
        </section>

        {canFile && (
          <TicketFiles entries={t.entries} files={allDocs} waiting={waiting} data={data} msg={msg} {...fileProps} />
        )}

        <section id="tk-falta">
          <h2 className="an-h">Falta comprar ou reservar</h2>
          <List items={show(t.groups.todo)} empty="Nada pendente. Tudo comprado ou reservado." today={today} price={price} readOnly={readOnly} onToggle={onToggle} {...fileProps} />
        </section>

        {t.groups.maybe.length > 0 && (
          <section id="tk-opcoes">
            <h2 className="an-h">Só se escolher essa opção</h2>
            <p className="muted small">Opções do mesmo horário que pedem reserva. Reserve só a que for escolher.</p>
            <List items={show(t.groups.maybe)} empty="Nenhuma neste filtro." today={today} price={price} readOnly={readOnly} onToggle={onToggle} {...fileProps} />
          </section>
        )}

        <section id="tk-comprados">
          <h2 className="an-h">Comprados e reservados</h2>
          <List items={show(t.groups.ok)} empty="Nada marcado como comprado ainda." today={today} price={price} readOnly={readOnly} onToggle={onToggle} {...fileProps} />
        </section>

        <section id="tk-entrada">
          <h2 className="an-h">Pagar na entrada</h2>
          <p className="muted small">Ingressos sem reserva: compra-se na bilheteria, no dia.</p>
          {t.groups.gate.length ? (
            <table className="tbl an-tbl">
              <thead><tr><td>Dia</td><td>Lugar</td><td className="r">Preço</td></tr></thead>
              <tbody>
                {t.groups.gate.map((e) => <tr key={e.id}><td className="muted">{fmtDay(e.day)}</td><td>{e.title}</td><td className="r">{fx.fmt(e.cost)}</td></tr>)}
                <tr className="an-sum"><td colSpan={2}>Total</td><td className="r">{fx.fmt(t.totals.gate)}</td></tr>
              </tbody>
            </table>
          ) : <div className="muted small">Nenhum.</div>}
        </section>
      </main>
    </div>
  );
}

function Kpi({ v, l }) {
  return <div className="an-kpi"><b>{v}</b><span>{l}</span></div>;
}

// todos os ingressos, passagens e vouchers da viagem num lugar só: os de cada atividade e os soltos.
// Ficam guardados no aparelho para abrir sem internet e nunca aparecem no link de visitante.
function TicketFiles({ entries, files, waiting, data, msg, busy, cached, upload, remove }) {
  const [to, setTo] = useState('');
  const trip = data.trip;
  const acts = useMemo(() => new Map((data.activities || []).map((a) => [a.id, a])), [data.activities]);
  const ideas = useMemo(() => new Map((data.ideas || []).map((a) => [a.id, a])), [data.ideas]);
  const checks = useMemo(() => new Map((data.checklist || []).map((c) => [c.id, c])), [data.checklist]);
  const options = entries.filter((e) => targetOf(e));
  // de quem é cada arquivo, para a legenda e para a ordem (por dia)
  const owner = (f) => {
    const a = f.activity_id != null && acts.get(f.activity_id);
    if (a) return { day: a.day, title: a.title };
    const i = f.idea_id != null && ideas.get(f.idea_id);
    if (i) return { day: null, title: `Ideia: ${i.title}` };
    const e = f.check_id != null && entries.find((x) => x.check?.id === f.check_id);
    if (e) return { day: e.day, title: e.title };
    const c = f.check_id != null && checks.get(f.check_id);
    return c ? { day: null, title: c.text } : { day: null, title: null };
  };
  const when = (f) => String(f.created_at || (f.at ? new Date(f.at).toISOString() : ''));
  const rows = [...files.map((f) => ({ f, o: owner(f) })), ...waiting.map((f) => ({ f, o: owner(f), local: true }))]
    .sort((x, y) => (x.o.day || '9').localeCompare(y.o.day || '9') || when(x.f).localeCompare(when(y.f)));
  const pick = (e) => {
    const list = [...(e.target.files || [])];
    e.target.value = '';
    const target = to.startsWith('a') ? { activity: Number(to.slice(1)) } : to.startsWith('c') ? { check: Number(to.slice(1)) } : null;
    upload(target, list);
  };
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null);
  const nameOf = (f, o) => (o.day ? `${o.day} ${f.name}` : f.name);
  const saveOne = async ({ f, o, local }) => {
    setNote(null);
    try {
      const b = await blobOf(f, local);
      await shareOrSave([asFile(b, safeName(nameOf(f, o)), f.type)]);
    } catch (x) { setNote({ text: `Não consegui salvar ${f.name}: ${x.message}`, bad: true }); }
  };
  // todos de uma vez: no celular, pela folha de compartilhar (Salvar em Arquivos); se não der, um .zip só
  const saveAll = async (zip) => {
    setSaving(true);
    setNote(null);
    const used = new Set();
    const got = [];
    const fail = [];
    for (const r of rows) {
      try { got.push(asFile(await blobOf(r.f, r.local), safeName(nameOf(r.f, r.o), used), r.f.type)); } catch (x) { fail.push(`${r.f.name} (${x.message})`); }
    }
    try {
      if (got.length) {
        if (!zip && touch() && canShareFiles(got)) {
          await shareOrSave(got);
        } else {
          const data = await Promise.all(got.map(async (f) => ({ name: f.name, data: new Uint8Array(await f.arrayBuffer()) })));
          saveBlob(new Blob([makeZip(data)], { type: 'application/zip' }), `${safeName(`Ingressos ${trip?.name || ''}`.trim())}.zip`);
        }
      }
      setNote(fail.length ? { text: `Ficaram de fora: ${fail.join(', ')}. Abra a viagem com internet para guardá-los.`, bad: true }
        : { text: `${got.length} ${got.length === 1 ? 'arquivo pronto' : 'arquivos prontos'} para salvar.` });
    } catch (x) { setNote({ text: `Não consegui salvar: ${x.message}`, bad: true }); }
    setSaving(false);
  };
  const shareable = typeof navigator !== 'undefined' && !!navigator.canShare && touch();
  return (
    <section id="tk-arquivos">
      <h2 className="an-h">Arquivos dos ingressos</h2>
      <p className="muted small">PDFs e prints de ingressos, passagens e vouchers, todos aqui. Ficam guardados neste aparelho para abrir sem internet e não aparecem em links de visitante.</p>
      <div className="tk-up">
        <label className="tk-up-to">
          <span className="muted small">De qual item</span>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Nenhum, só guardar aqui</option>
            {options.map((e) => <option key={e.id} value={e.act ? `a${e.act.id}` : `c${e.check.id}`}>{e.day ? `${fmtDay(e.day)} · ` : ''}{e.title}</option>)}
          </select>
        </label>
        <label className={`btn-like${busy ? ' disabled' : ''}`}>
          {busy ? 'Salvando…' : 'Adicionar PDF ou foto'}
          <input type="file" multiple hidden disabled={busy} accept={ACCEPT} onChange={pick} />
        </label>
      </div>
      {msg && <p className={`small tk-msg${msg.bad ? ' bad' : ''}`} role="status">{msg.text}</p>}
      {rows.length > 0 && (
        <div className="tk-save">
          {shareable && <button type="button" className="btn-like" disabled={saving} onClick={() => saveAll(false)}>{saving ? 'Preparando…' : `Salvar todos no celular (${rows.length})`}</button>}
          <button type="button" className={shareable ? 'linkish small' : 'btn-like'} disabled={saving} onClick={() => saveAll(true)}>
            {saving && !shareable ? 'Preparando…' : `Baixar todos em .zip (${rows.length})`}
          </button>
        </div>
      )}
      {note && <p className={`small tk-msg${note.bad ? ' bad' : ''}`} role="status">{note.text}</p>}
      {rows.length > 0 ? (
        <ul className="file-list tk-files">
          {rows.map(({ f, o, local }) => {
            const info = [o.day && fmtDay(o.day), o.title || 'sem item', fmtSize(f.size)].filter(Boolean).join(' · ');
            const inner = (
              <>
                {!local && isImage(f.type) ? <img src={api.fileUrl(f.id)} alt="" loading="lazy" /> : <FileIcon type={f.type} />}
                <span>
                  <b>{f.name}</b>
                  <small>
                    {info}
                    {local ? <em className={`tk-off${f.error ? ' bad' : ''}`}>{f.error ? ` · não subiu: ${f.error}` : ' · só neste aparelho, sobe quando a internet voltar'}</em>
                      : cached.has(f.id) && <em className="tk-off"> · disponível offline</em>}
                  </small>
                </span>
              </>
            );
            return (
              <li key={local ? `u${f.id}` : f.id} className={local ? 'pending' : ''}>
                {local
                  ? <button type="button" className="file-a" onClick={() => openLocal(f)}>{inner}</button>
                  : <a href={api.fileUrl(f.id)} target="_blank" rel="noreferrer">{inner}</a>}
                <button type="button" className="icon-btn sm tk-dl" aria-label={`Salvar ${f.name} no aparelho`} title="Salvar no aparelho"
                  onClick={() => saveOne({ f, o, local })}>⤓</button>
                <button type="button" className="icon-btn sm" aria-label={`Remover ${f.name}`} title="Remover"
                  onClick={() => (local ? window.confirm(`Descartar ${f.name}? Ele ainda não subiu.`) && sync.cancelUpload(f.id) : remove(f))}>
                  <Icon name="x" size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : <div className="muted small tk-empty">Nenhum arquivo ainda. Adicione o PDF ou o print do ingresso aqui, ou pelo 📎 de cada item abaixo.</div>}
    </section>
  );
}

function List({ items, empty, today, price, readOnly, onToggle, canFile, busy, docs, localDocs, upload }) {
  if (!items.length) return <div className="muted small">{empty}</div>;
  return (
    <ul className="tk-list">
      {items.map((e) => {
        const late = e.status === 'todo' && e.day && e.day < today;
        return (
          <li key={e.id} className={`tk-row${e.status === 'ok' ? ' ok' : ''}`}>
            <div className="tk-when">
              <b>{e.day ? fmtDay(e.day) : 'sem data'}</b>
              {e.start && <small>{e.start}</small>}
            </div>
            <div className="tk-main">
              <div className="tk-title">
                {e.title}
                <span className="an-tag">{TICKET_CATS[e.cat]}</span>
                {e.opens && <span className={`an-tag${e.opens > today ? ' tk-soon' : ''}`}>{e.opens > today ? `venda abre em ${fmtDay(e.opens)}` : 'já à venda'}</span>}
                {late && <span className="an-tag tk-late">data passou</span>}
              </div>
              {e.notes && <p className="tk-notes"><LinkText text={e.notes} /></p>}
              {e.check && e.check.text !== e.title && <p className="tk-notes muted">Checklist: {e.check.text}</p>}
              {(parseLinks(e.links).length > 0 || docs(e).length > 0 || (canFile && localDocs(e).length > 0)) && (
                <div className="tk-links">
                  {docs(e).map((f) => <a key={`f${f.id}`} className="file-link" href={api.fileUrl(f.id)} target="_blank" rel="noreferrer" title={f.name}>📎 {f.name}</a>)}
                  {canFile && localDocs(e).map((f) => <button key={`u${f.id}`} type="button" className="file-link linkish" onClick={() => openLocal(f)} title="Só neste aparelho: sobe quando a internet voltar">📎 {f.name} <small className="muted">(no aparelho)</small></button>)}
                  {parseLinks(e.links).map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer">{linkLabel(l)}</a>)}
                </div>
              )}
            </div>
            <div className="tk-side">
              {e.cost > 0 && <span className="tk-price">{price(e.cost)}</span>}
              {canFile && targetOf(e) && (
                <label className={`tk-attach${busy ? ' disabled' : ''}`} title="Anexar o PDF ou o print do ingresso">
                  📎 Anexar
                  <input type="file" multiple hidden disabled={busy} accept={ACCEPT} onChange={(ev) => { const l = [...(ev.target.files || [])]; ev.target.value = ''; upload(targetOf(e), l); }} />
                </label>
              )}
              {readOnly || !onToggle || (e.status === 'ok' && !e.check)
                ? <span className={`tk-state${e.status === 'ok' ? ' ok' : ''}`}>{e.status === 'ok' ? '✓ Comprado' : 'A comprar'}</span>
                : (
                  <label className="tk-check">
                    <input type="checkbox" checked={e.status === 'ok'} onChange={(ev) => onToggle(e, ev.target.checked)} />
                    Comprado
                  </label>
                )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
