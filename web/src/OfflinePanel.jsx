// Barra de estado (sem internet, enviando, edições não salvas) e o painel "Dados no aparelho":
// o que está guardado offline, a fila de edições, conflitos e os backups automáticos.
import { useCallback, useEffect, useState } from 'react';
import { Modal } from './Modals.jsx';
import { sync, useSyncStatus } from './offline/index.js';
import { api } from './api.js';
import { cleanBackup } from './offline/sync.js';
import './offline.css';

export const openOfflinePanel = () => window.dispatchEvent(new Event('open-offline-panel'));

const when = (t) => {
  if (!t) return '—';
  const d = new Date(t);
  const today = new Date().toDateString() === d.toDateString();
  const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return today ? `hoje às ${hm}` : `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hm}`;
};
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function download(name, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const fileName = (name, at) => `${String(name || 'viagem').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').toLowerCase()}-${new Date(at || Date.now()).toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;

// anexos das viagens em andamento ou próximas também ficam no aparelho (o service worker guarda cada um)
async function cacheFiles(trips) {
  if (!navigator.serviceWorker?.controller || !('caches' in window)) return;
  const today = new Date().toISOString().slice(0, 10);
  const cache = await caches.open('files-v1');
  for (const t of trips) {
    if (!t.data?.trip || t.data.trip.end < today) continue;
    for (const f of t.data.files || []) {
      if (!navigator.onLine) return;
      if (!(await cache.match(api.fileUrl(f.id)))) await fetch(api.fileUrl(f.id)).catch(() => {});
    }
  }
}

export function SyncBar({ online, authed }) {
  const s = useSyncStatus();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const o = () => setOpen(true);
    window.addEventListener('open-offline-panel', o);
    return () => window.removeEventListener('open-offline-panel', o);
  }, []);

  // com internet: guarda todas as viagens no aparelho (e os anexos das próximas), não só as já abertas
  useEffect(() => {
    if (!online || !authed) return;
    let stop = false;
    const t = setTimeout(async () => {
      try {
        await sync.warmAll();
        if (!stop) await cacheFiles(await sync.savedTrips());
      } catch { /* tenta de novo na próxima vez */ }
    }, 2500);
    return () => { stop = true; clearTimeout(t); };
  }, [online, authed]);

  const slow = online && Object.keys(s.local || {}).length > 0;
  let msg = null;
  let cls = 'offline-bar';
  if (s.failed) { msg = <>{plural(s.failed, 'edição não foi salva', 'edições não foram salvas')}<span className="hide-sm"> no servidor</span> · ver</>; cls += ' bad'; }
  else if (!online) msg = <>Sem internet<span className="hide-sm">: usando a cópia guardada no aparelho</span>{s.pending ? ` · ${plural(s.pending, 'edição esperando', 'edições esperando')}` : <span className="hide-sm"> · pode editar, salva quando voltar</span>}</>;
  else if (s.pending) { msg = s.syncing ? `Enviando ${plural(s.pending, 'edição', 'edições')}…` : <>{plural(s.pending, 'edição esperando', 'edições esperando')} para enviar<span className="hide-sm"> · tentando de novo</span></>; cls += ' info'; }
  else if (s.conflicts) { msg = <>{plural(s.conflicts, 'edição substituiu', 'edições substituíram')} algo mudado em outro aparelho · ver</>; cls += ' info'; }
  else if (slow) { msg = <>Internet lenta<span className="hide-sm">: mostrando a cópia do aparelho</span></>; cls += ' info'; }

  return (
    <>
      {msg && !open && <button type="button" className={cls} role="status" onClick={() => setOpen(true)} title="Dados no aparelho, edições pendentes e backups">{msg}</button>}
      {s.storage === 'memory' && !msg && !open && <button type="button" className="offline-bar bad" onClick={() => setOpen(true)}>Este navegador não deixa guardar a cópia offline · ver</button>}
      {open && <OfflinePanel onClose={() => setOpen(false)} online={online} />}
    </>
  );
}

const FIELD = { title: 'título', notes: 'notas', done: 'feito', day: 'dia', start: 'início', end: 'fim', cost: 'valor', spent: 'gasto', details: 'detalhes', location: 'local', text: 'texto', body: 'texto', name: 'nome', price: 'preço', bought: 'comprado', sort: 'ordem', blocks: 'blocos', review: 'avaliação', rating: 'nota' };
const show = (v) => {
  if (v == null || v === '') return '(vazio)';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
};

export function OfflinePanel({ onClose, online }) {
  const s = useSyncStatus();
  const [pending, setPending] = useState([]);
  const [failed, setFailed] = useState([]);
  const [conf, setConf] = useState([]);
  const [saved, setSaved] = useState([]);
  const [backups, setBackups] = useState([]);
  const [disk, setDisk] = useState(null);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const [p, f, c, t, b] = await Promise.all([sync.pendingList(), sync.failedList(), sync.conflictList(), sync.savedTrips(), sync.listBackups()]);
    setPending(p); setFailed(f); setConf(c); setSaved(t); setBackups(b);
    try {
      const [est, persisted] = await Promise.all([navigator.storage?.estimate?.(), navigator.storage?.persisted?.()]);
      setDisk({ usage: est?.usage, quota: est?.quota, persisted });
    } catch { setDisk(null); }
  }, []);
  useEffect(() => { load(); }, [load, s.pending, s.failed, s.conflicts, s.lastSync]);

  const act = async (key, fn, ok) => {
    setBusy(key); setNote('');
    try { await fn(); if (ok) setNote(ok); } catch (e) { setNote(String(e.message || e)); }
    setBusy(''); load();
  };
  const restore = (b) => act(`r${b.key}`, async () => {
    if (!online) throw new Error('Restaurar precisa de internet (cria uma viagem nova no servidor).');
    if (!window.confirm(`Criar uma cópia de “${b.name}” como estava ${when(b.at)}? A viagem atual não é alterada.`)) return;
    const data = await sync.backupData(b.key);
    const d = await api.importTrip({ ...data, trip: { ...data.trip, name: `${data.trip.name} (backup ${new Date(b.at).toLocaleDateString('pt-BR')})` } });
    onClose();
    window.location.hash = `#/t/${d.trip.id}`;
  });
  const mb = (n) => (n == null ? '—' : `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`);
  const byTrip = backups.reduce((m, b) => { (m[b.tripId] ||= []).push(b); return m; }, {});
  const tripName = (id) => saved.find((t) => t.id === id)?.name || byTrip[id]?.[0]?.name || `Viagem ${id}`;

  return (
    <Modal title="Dados no aparelho" wide onClose={onClose} footer={<><span className="muted small">{note}</span><span className="spacer" /><button onClick={onClose}>Fechar</button></>}>
      <section className="offp">
        <h4>Status</h4>
        <p className={online ? '' : 'warn-txt'}>
          {online ? (s.pending && s.lastError ? 'O aparelho está conectado, mas o servidor não está respondendo agora. As edições ficam guardadas aqui e são enviadas sozinhas.' : 'Com internet.') : 'Sem internet: o app está usando a cópia guardada neste aparelho. Pode editar; as edições ficam guardadas aqui e vão para o servidor quando a internet voltar.'}
          {s.lastSync ? ` Última sincronização ${when(s.lastSync)}.` : ''}
        </p>
        {s.storage === 'memory' && <p className="bad-txt">Este navegador não permitiu guardar dados (modo anônimo ou dados do site bloqueados). Sem isso o app não abre sem internet.</p>}
        {disk && <p className="muted small">Espaço usado pelo app: {mb(disk.usage)}{disk.quota ? ` de ${mb(disk.quota)} disponíveis` : ''}. {disk.persisted ? 'Guardado de forma permanente (o navegador não apaga sozinho).' : 'O navegador pode apagar estes dados se faltar espaço; instalar o app na tela inicial ajuda a mantê-los.'}</p>}
      </section>

      <section className="offp">
        <h4>Viagens guardadas para usar sem internet</h4>
        {saved.length === 0 ? <p className="muted">Nenhuma ainda. Abra o app com internet para guardar.</p> : (
          <ul className="offp-list">
            {saved.map((t) => (
              <li key={t.id}>
                <span><b>{t.name}</b> <span className="muted small">atualizada {when(t.savedAt)}</span></span>
                <button className="sm" onClick={() => download(fileName(t.name, t.savedAt), cleanBackup(t.data))}>Baixar backup</button>
              </li>
            ))}
          </ul>
        )}
        <button disabled={!online || busy === 'warm'} onClick={() => act('warm', () => sync.warmAll({ maxAge: 0 }), 'Viagens atualizadas no aparelho.')}>{busy === 'warm' ? 'Atualizando…' : 'Atualizar agora'}</button>
      </section>

      {(pending.length > 0 || s.pending > 0) && (
        <section className="offp">
          <h4>Esperando internet ({pending.length})</h4>
          <ul className="offp-list">{pending.map((p) => (
            <li key={p.opId}>
              <span>{p.what}<span className="muted small"> · {when(p.at)}{p.lastError ? ` · ${p.lastError}` : ''}</span></span>
              {p.upload && <button className="ghost" disabled={!!busy} onClick={() => act(`u${p.opId}`, () => sync.cancelUpload(p.opId), 'Anexo descartado.')}>Descartar</button>}
            </li>
          ))}</ul>
          <button disabled={!online || s.syncing} onClick={() => act('flush', () => sync.wake())}>{s.syncing ? 'Enviando…' : 'Enviar agora'}</button>
        </section>
      )}

      {failed.length > 0 && (
        <section className="offp">
          <h4 className="bad-txt">Não foram salvas ({failed.length})</h4>
          <p className="muted small">O servidor recusou estas edições (por exemplo, o item foi apagado em outro aparelho). Elas continuam guardadas aqui até você decidir.</p>
          <ul className="offp-list">
            {failed.map((f, i) => (
              <li key={f.opId}>
                <span>{f.what}<span className="muted small"> · {f.error}</span></span>
                <span className="offp-btns">
                  <button className="sm" disabled={!online} onClick={() => act(`t${i}`, () => sync.retryFailed(i))}>Tentar de novo</button>
                  <button className="sm danger" onClick={() => { if (window.confirm('Descartar esta edição? Ela não vai para o servidor.')) act(`d${i}`, () => sync.discardFailed(i)); }}>Descartar</button>
                </span>
              </li>
            ))}
          </ul>
          <button onClick={() => download(fileName('edicoes-nao-salvas'), failed.map(({ what, method, url, body, error, at }) => ({ what, method, url, body, error, at: new Date(at).toISOString() })))}>Baixar estas edições (JSON)</button>
        </section>
      )}

      {conf.length > 0 && (
        <section className="offp">
          <h4>Mudado nos dois aparelhos ({conf.length})</h4>
          <p className="muted small">O mesmo campo foi mudado aqui e em outro aparelho. Ficou a edição deste aparelho; o valor que estava lá aparece abaixo e também está no backup “antes de sincronizar”.</p>
          <ul className="offp-list">
            {conf.map((c, i) => (
              <li key={i}>
                <span>{c.what} <span className="muted small">{when(c.at)}</span>
                  {c.fields.map((f) => <div key={f.field} className="small">{FIELD[f.field] || f.field}: no outro aparelho “{show(f.theirs)}”, ficou “{show(f.ours)}”</div>)}
                </span>
              </li>
            ))}
          </ul>
          <button onClick={() => act('conf', () => sync.dismissConflicts())}>Limpar avisos</button>
        </section>
      )}

      <section className="offp">
        <h4>Backups automáticos</h4>
        <p className="muted small">O app guarda neste aparelho uma versão de cada viagem quando ela muda (no máximo a cada 6 horas) e sempre antes de enviar edições feitas sem internet. Ficam as {20} mais recentes de cada viagem. Restaurar cria uma viagem nova; a atual não é alterada. Fotos e anexos não entram no backup.</p>
        {Object.keys(byTrip).length === 0 && <p className="muted">Nenhum backup ainda.</p>}
        {Object.entries(byTrip).map(([tid, list]) => (
          <details key={tid} className="offp-bk">
            <summary><b>{tripName(Number(tid))}</b> <span className="muted small">{plural(list.length, 'versão', 'versões')}, a última {when(list[0].at)}</span></summary>
            <ul className="offp-list">
              {list.map((b) => (
                <li key={b.key}>
                  <span>{when(b.at)}<span className="muted small"> · {b.reason === 'auto' ? 'automático' : b.reason} · {plural(b.counts.activities, 'atividade', 'atividades')}</span></span>
                  <span className="offp-btns">
                    <button className="sm" onClick={async () => download(fileName(b.name, b.at), await sync.backupData(b.key))}>Baixar</button>
                    <button className="sm" disabled={!online || busy === `r${b.key}`} onClick={() => restore(b)}>Restaurar como cópia</button>
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>
    </Modal>
  );
}
