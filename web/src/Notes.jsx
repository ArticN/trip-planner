import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { LinkText, linkLabel, parseLinks } from './Extras.jsx';
import { LinksField } from './Modals.jsx';
import { fmtDay } from './util.js';

// ── Notas de viagem: dicas por assunto (transporte, dinheiro, etiqueta…), cada uma com uma marca de confiança
// (consenso, opinião ou atenção) e as fontes. Dá para escrever as suas e carregar um guia pronto, que entra como
// notas comuns, editáveis. Vêm junto com a viagem, então também abrem sem internet no aparelho que já abriu a viagem.

export const NOTE_TAGS = {
  consenso: { label: 'Consenso', hint: 'Quase todo guia e relato concorda' },
  opiniao: { label: 'Opinião', hint: 'Dica de alguns viajantes, questão de gosto' },
  atencao: { label: 'Atenção', hint: 'Regra, mudança recente ou algo que dá problema se esquecer' },
};
const OTHER = 'Outras notas';
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// texto da nota: linhas com "- " viram lista; o resto, parágrafos; endereços viram links
function NoteBody({ text }) {
  if (!text) return null;
  const out = [];
  let list = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (/^[-•]\s+/.test(line)) {
      if (!list) { list = []; out.push(<ul key={`u${i}`}>{list}</ul>); }
      list.push(<li key={i}><LinkText text={line.replace(/^[-•]\s+/, '')} /></li>);
    } else {
      list = null;
      if (line) out.push(<p key={i}><LinkText text={line} /></p>);
    }
  });
  return <div className="nt-body">{out}</div>;
}

export default function Notes({ data, setData, onBack }) {
  const { trip } = data;
  const notes = data.notes || [];
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('all');
  const [editing, setEditing] = useState(null); // { draft } (id ausente = nota nova)
  const [guides, setGuides] = useState([]);
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState('');
  const [undo, setUndo] = useState(null);
  const pending = useRef(null);

  useEffect(() => { api.guides().then(setGuides).catch(() => {}); }, []);
  const say = (m) => { setToast(m); setTimeout(() => setToast(''), 3500); };
  const setNotes = (fn) => setData((d) => ({ ...d, notes: fn(d.notes || []) }));

  const groups = useMemo(() => {
    const g = [];
    notes.forEach((n) => { const k = n.grp || OTHER; if (!g.includes(k)) g.push(k); });
    return g;
  }, [notes]);

  const shown = useMemo(() => {
    const f = fold(q.trim());
    return notes.filter((n) => (tag === 'all' || (tag === 'pinned' ? n.pinned : n.tag === tag))
      && (!f || fold(`${n.title} ${n.body} ${n.grp}`).includes(f)));
  }, [notes, q, tag]);
  const pinned = shown.filter((n) => n.pinned);
  const counts = useMemo(() => Object.fromEntries(Object.keys(NOTE_TAGS).map((k) => [k, notes.filter((n) => n.tag === k).length])), [notes]);

  // ── edição
  const save = async (draft) => {
    const body = { ...draft, title: draft.title.trim(), grp: draft.grp?.trim() || null };
    try {
      if (draft.id) {
        setNotes((l) => l.map((x) => (x.id === draft.id ? { ...x, ...body } : x)));
        const saved = await api.updateNote(draft.id, body);
        setNotes((l) => l.map((x) => (x.id === saved.id ? saved : x)));
      } else {
        const created = await api.createNote(trip.id, body);
        setNotes((l) => [...l, created]);
        setTimeout(() => document.getElementById(`nt-${created.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      }
      setEditing(null);
    } catch (e) {
      say(navigator.onLine ? `Não consegui salvar: ${e.message}` : 'Sem internet: a nota não foi salva');
    }
  };
  const togglePin = async (n) => {
    setNotes((l) => l.map((x) => (x.id === n.id ? { ...x, pinned: n.pinned ? 0 : 1 } : x)));
    try { await api.updateNote(n.id, { pinned: n.pinned ? 0 : 1 }); } catch { setNotes((l) => l.map((x) => (x.id === n.id ? n : x))); say('Não consegui salvar'); }
  };
  // exclusão com "Desfazer": só apaga no servidor depois de alguns segundos
  const flush = () => {
    const p = pending.current;
    if (!p) return;
    clearTimeout(p.timer);
    pending.current = null;
    api.deleteNote(p.note.id).catch(() => { setNotes((l) => [...l, p.note]); say('Não consegui excluir'); });
  };
  useEffect(() => () => flush(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const remove = (n) => {
    flush();
    setEditing(null);
    setNotes((l) => l.filter((x) => x.id !== n.id));
    const entry = { note: n, timer: setTimeout(() => { flush(); setUndo(null); }, 6000) };
    pending.current = entry;
    setUndo({
      label: `Nota excluída: ${n.title}`,
      run: () => {
        if (pending.current !== entry) return;
        clearTimeout(entry.timer);
        pending.current = null;
        setNotes((l) => [...l, n].sort((a, b) => a.sort - b.sort || a.id - b.id));
        setUndo(null);
      },
    });
  };
  const loadGuide = async (g) => {
    setBusy(g.key);
    try {
      const r = await api.loadGuide(trip.id, g.key);
      setNotes(() => r.notes);
      say(r.added ? `${r.added} notas adicionadas do guia “${g.title}”` : 'Você já tem todas as notas deste guia');
    } catch (e) {
      say(navigator.onLine ? `Não consegui carregar o guia: ${e.message}` : 'Sem internet: o guia precisa de conexão para carregar');
    } finally { setBusy(''); }
  };
  const newNote = (grp = '') => { setQ(''); setTag('all'); setEditing({ draft: { title: '', grp, tag: null, body: '', links: null, pinned: 0 } }); };

  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const card = (n) => (editing?.draft.id === n.id
    ? <NoteEditor key={n.id} draft={editing.draft} groups={groups} onSave={save} onCancel={() => setEditing(null)} onDelete={() => remove(n)} />
    : <NoteCard key={n.id} n={n} onEdit={() => setEditing({ draft: { ...n } })} onPin={() => togglePin(n)} />);

  return (
    <div className="an nt">
      <div className="an-head">
        <header className="an-top">
          {onBack && <button className="icon-btn" onClick={onBack} title="Voltar ao roteiro" aria-label="Voltar ao roteiro">←</button>}
          <div>
            <div className="brand-name">Notas de viagem</div>
            <div className="brand-sub">{trip.name} · {fmtDay(trip.start)} a {fmtDay(trip.end)}</div>
          </div>
          <span className="spacer" />
          <button className="ghost hide-sm" onClick={() => window.print()}>Imprimir ou salvar PDF</button>
          <button className="primary" onClick={() => newNote()}>Nova nota</button>
        </header>
        {groups.length > 1 && (
          <nav className="an-nav" aria-label="Assuntos">
            {pinned.length > 0 && <a href="#nt-fixadas" onClick={(e) => { e.preventDefault(); jump('nt-fixadas'); }}>Fixadas</a>}
            {groups.map((g) => <a key={g} href={`#nt-${slug(g)}`} onClick={(e) => { e.preventDefault(); jump(`nt-${slug(g)}`); }}>{g}</a>)}
          </nav>
        )}
      </div>

      <main className="an-body">
        {editing && !editing.draft.id && (
          <section className="nt-new">
            <NoteEditor draft={editing.draft} groups={groups} onSave={save} onCancel={() => setEditing(null)} />
          </section>
        )}

        {notes.length === 0 && !editing ? (
          <section>
            <h2 className="an-h">O que levar na cabeça</h2>
            <p className="an-lead">Junte aqui as dicas que você não quer esquecer: como funciona o transporte, onde sacar dinheiro, regras de etiqueta, números de emergência. Escreva as suas ou comece por um guia pronto, que vira notas normais para editar.</p>
            <div className="nt-guides">
              {guides.map((g) => <GuideCard key={g.key} g={g} busy={busy === g.key} onLoad={() => loadGuide(g)} />)}
            </div>
            <button onClick={() => newNote()}>Escrever a primeira nota</button>
          </section>
        ) : notes.length > 0 && (
          <>
            <section className="nt-tools">
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nas notas (ex.: Suica, lixo, templo)" aria-label="Buscar nas notas" />
              <div className="tk-filter" role="group" aria-label="Filtrar">
                {[['all', `Todas · ${notes.length}`], ...Object.entries(NOTE_TAGS).filter(([k]) => counts[k]).map(([k, t]) => [k, `${t.label} · ${counts[k]}`]), ...(notes.some((n) => n.pinned) ? [['pinned', 'Fixadas']] : [])].map(([k, l]) => (
                  <button key={k} className={`chip${tag === k ? ' on' : ''}`} aria-pressed={tag === k} title={NOTE_TAGS[k]?.hint} onClick={() => setTag(k)}>{l}</button>
                ))}
              </div>
              {shown.length === 0 && <div className="muted small">Nenhuma nota com esse filtro.</div>}
            </section>

            {pinned.length > 0 && tag !== 'pinned' && (
              <section id="nt-fixadas">
                <h2 className="an-h">Fixadas</h2>
                <div className="nt-list">{pinned.map(card)}</div>
              </section>
            )}

            {groups.map((g) => {
              const list = shown.filter((n) => (n.grp || OTHER) === g && !(n.pinned && tag !== 'pinned'));
              if (!list.length) return null;
              return (
                <section key={g} id={`nt-${slug(g)}`}>
                  <div className="nt-h">
                    <h2 className="an-h">{g}</h2>
                    <button className="ghost sm" onClick={() => newNote(g === OTHER ? '' : g)} aria-label={`Nova nota em ${g}`}>+ Nota</button>
                  </div>
                  <div className="nt-list">{list.map(card)}</div>
                </section>
              );
            })}

            {guides.length > 0 && (
              <section className="nt-foot">
                <h2 className="an-h">Guias prontos</h2>
                <p className="muted small">Carregar de novo só traz as notas que faltam, comparando assunto e título: as que você apagou voltam, e as que você só editou o texto não se repetem.</p>
                <div className="nt-guides">
                  {guides.map((g) => <GuideCard key={g.key} g={g} busy={busy === g.key} onLoad={() => loadGuide(g)} again />)}
                </div>
                <p className="muted small">As marcas: <b>Consenso</b> é o que quase todo guia e relato repete; <b>Opinião</b> é dica de alguns viajantes; <b>Atenção</b> é regra, mudança recente ou algo que dá problema se esquecer. Preços e horários mudam: confira nas fontes.</p>
              </section>
            )}
          </>
        )}
      </main>

      {toast && !undo && <div className="toast">{toast}</div>}
      {undo && (
        <div className="toast undo-toast" role="status">
          <span>{undo.label}</span>
          <button onClick={undo.run}>Desfazer</button>
        </div>
      )}
    </div>
  );
}

function GuideCard({ g, busy, onLoad, again = false }) {
  return (
    <div className="an-card nt-guide">
      <h3 className="an-card-h">{g.title}</h3>
      <p className="an-card-sub">{g.count} notas · atualizado em {fmtDay(g.updated)}</p>
      <p className="small">{g.description}</p>
      <button className={again ? '' : 'primary'} onClick={onLoad} disabled={busy}>{busy ? 'Carregando…' : again ? 'Carregar o que falta' : 'Carregar este guia'}</button>
    </div>
  );
}

function NoteCard({ n, onEdit, onPin }) {
  const links = parseLinks(n.links);
  const t = NOTE_TAGS[n.tag];
  return (
    <article id={`nt-${n.id}`} className={`nt-card${n.tag ? ` t-${n.tag}` : ''}`}>
      <header className="nt-card-h">
        <h3>{n.title}</h3>
        {t && <span className={`nt-tag t-${n.tag}`} title={t.hint}>{t.label}</span>}
        <span className="spacer" />
        <button className={`icon-btn sm nt-pin${n.pinned ? ' on' : ''}`} onClick={onPin} aria-pressed={!!n.pinned} title={n.pinned ? 'Desafixar' : 'Fixar no topo'} aria-label={n.pinned ? 'Desafixar' : 'Fixar no topo'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={n.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>
        </button>
        <button className="icon-btn sm" onClick={onEdit} title="Editar" aria-label={`Editar ${n.title}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>
        </button>
      </header>
      <NoteBody text={n.body} />
      {links.length > 0 && (
        <div className="nt-src">
          <span>Fontes</span>
          {links.map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer">{linkLabel(l)}</a>)}
        </div>
      )}
    </article>
  );
}

function NoteEditor({ draft: initial, groups, onSave, onCancel, onDelete }) {
  const [d, setD] = useState(initial);
  const set = (p) => setD((x) => ({ ...x, ...p }));
  const submit = (e) => { e.preventDefault(); if (d.title.trim()) onSave(d); };
  return (
    <form className="nt-card nt-edit" onSubmit={submit}>
      <div className="form">
        <label className="full">Título<input value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex: Onde sacar dinheiro" autoFocus /></label>
        <label>Assunto
          <input value={d.grp || ''} onChange={(e) => set({ grp: e.target.value })} list="nt-groups" placeholder="Ex: Transporte" />
          <datalist id="nt-groups">{groups.filter((g) => g !== OTHER).map((g) => <option key={g} value={g} />)}</datalist>
        </label>
        <label>Marca
          <select value={d.tag || ''} onChange={(e) => set({ tag: e.target.value || null })}>
            <option value="">Nenhuma</option>
            {Object.entries(NOTE_TAGS).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
          </select>
        </label>
        <label className="full">Texto
          <textarea rows={8} value={d.body || ''} onChange={(e) => set({ body: e.target.value })} placeholder={'Escreva a dica. Comece a linha com "- " para fazer uma lista.'} />
        </label>
        <LinksField value={d.links} onChange={(links) => set({ links })} />
        <label className="nt-pin-field"><input type="checkbox" checked={!!d.pinned} onChange={(e) => set({ pinned: e.target.checked ? 1 : 0 })} /> Fixar no topo</label>
      </div>
      <div className="nt-edit-actions">
        {onDelete && <button type="button" className="danger" onClick={onDelete}>Excluir</button>}
        <span className="spacer" />
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary" disabled={!d.title.trim()}>Salvar</button>
      </div>
    </form>
  );
}
