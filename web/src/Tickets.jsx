import { useMemo, useState } from 'react';
import { tickets, TICKET_CATS } from './tickets.js';
import { LinkText, linkLabel, parseLinks } from './Extras.jsx';
import { fmtDay, makeFx, money, nowIn } from './util.js';
import { api } from './api.js';

// ── página de ingressos e reservas: o que já foi comprado, o que falta comprar (com quando a venda abre e onde),
// o que só precisa se escolher aquela opção e o que se paga na entrada. Fora do link de compartilhamento,
// "Comprado" marca o item de reserva da checklist (e cria um, se a atividade ainda não tiver).
export default function Tickets({ data, onBack, readOnly = false, onToggle }) {
  const { trip } = data;
  const t = useMemo(() => tickets(data), [data]);
  const fx = useMemo(() => makeFx(trip), [trip]);
  const [cat, setCat] = useState('all');
  const today = nowIn(trip.tz).day;
  const docs = (e) => (e.act ? (data.files || []).filter((f) => f.activity_id === e.act.id && (f.kind || 'doc') === 'doc') : []);
  const price = (n) => (fx.convert ? <>{money(n * fx.rate, fx.home)} <small>{fx.fmt(n)}</small></> : fx.fmt(n));
  const show = (l) => (cat === 'all' ? l : l.filter((e) => e.cat === cat));
  const done = t.groups.ok.length;
  const need = done + t.groups.todo.length;
  const cats = Object.keys(TICKET_CATS).filter((k) => t.entries.some((e) => e.cat === k && e.status !== 'gate'));

  const nav = [['falta', 'Falta comprar'], ['opcoes', 'Só se escolher'], ['comprados', 'Comprados'], ['entrada', 'Pagar na entrada']];

  return (
    <div className="an">
      <div className="an-head">
        <header className="an-top">
          <button className="icon-btn" onClick={onBack} title="Voltar ao roteiro" aria-label="Voltar ao roteiro">←</button>
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

        <section id="tk-falta">
          <h2 className="an-h">Falta comprar ou reservar</h2>
          <List items={show(t.groups.todo)} empty="Nada pendente. Tudo comprado ou reservado." today={today} price={price} docs={docs} readOnly={readOnly} onToggle={onToggle} />
        </section>

        {t.groups.maybe.length > 0 && (
          <section id="tk-opcoes">
            <h2 className="an-h">Só se escolher essa opção</h2>
            <p className="muted small">Opções do mesmo horário que pedem reserva. Reserve só a que for escolher.</p>
            <List items={show(t.groups.maybe)} empty="Nenhuma neste filtro." today={today} price={price} docs={docs} readOnly={readOnly} onToggle={onToggle} />
          </section>
        )}

        <section id="tk-comprados">
          <h2 className="an-h">Comprados e reservados</h2>
          <List items={show(t.groups.ok)} empty="Nada marcado como comprado ainda." today={today} price={price} docs={docs} readOnly={readOnly} onToggle={onToggle} />
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

function List({ items, empty, today, price, docs, readOnly, onToggle }) {
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
              {(parseLinks(e.links).length > 0 || docs(e).length > 0) && (
                <div className="tk-links">
                  {docs(e).map((f) => <a key={`f${f.id}`} className="file-link" href={api.fileUrl(f.id)} target="_blank" rel="noreferrer" title={f.name}>📎 {f.name}</a>)}
                  {parseLinks(e.links).map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer">{linkLabel(l)}</a>)}
                </div>
              )}
            </div>
            <div className="tk-side">
              {e.cost > 0 && <span className="tk-price">{price(e.cost)}</span>}
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
