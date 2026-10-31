import { useMemo, useState } from 'react';
import { analyze, CATS, MEALS } from './analysis.js';
import { fmtDay, dayNum, dayWeek, money } from './util.js';

// ── página de análise: todos os gastos planejados da viagem, para quem quer ver o quadro inteiro
// (feita pensando em quem acompanha de fora, como a família: valores em reais primeiro, na moeda da viagem ao lado)
export default function Analysis({ data, onBack, readOnly = false }) {
  const s = useMemo(() => analyze(data), [data]);
  const { fx, home } = s;
  const both = (n) => (fx.convert ? <>{home(n)} <small>{fx.fmt(n)}</small></> : fx.fmt(n));
  const pct = (n) => (s.grand ? `${Math.round((n / s.grand) * 100)}%` : '—');
  const perDay = s.days.length ? s.grand / s.days.length : 0;
  const foodDays = new Set(s.meals.filter((m) => m.cost).map((m) => m.a.day)).size;
  const missingCount = s.missing.stays.length + s.missing.flights.length;

  const nav = [['resumo', 'Resumo'], ['dias', 'Por dia'], ['cidades', 'Por cidade'], ['hospedagem', 'Hospedagem'], ['comida', 'Comida'], ['passeios', 'Passeios'], ['transporte', 'Transporte'], ['compras', 'Compras'], ['reservas', 'Reservas']];

  return (
    <div className="an">
      <div className="an-head">
      <header className="an-top">
        <button className="icon-btn" onClick={onBack} title="Voltar ao roteiro" aria-label="Voltar ao roteiro">←</button>
        <div>
          <div className="brand-name">Análise da viagem</div>
          <div className="brand-sub">{data.trip.name} · {fmtDay(data.trip.start)} a {fmtDay(data.trip.end)}</div>
        </div>
        <span className="spacer" />
        <button className="ghost hide-sm" onClick={() => window.print()}>Imprimir ou salvar PDF</button>
      </header>
      <nav className="an-nav" aria-label="Seções da análise">
        {nav.map(([id, l]) => <a key={id} href={`#an-${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`an-${id}`)?.scrollIntoView({ behavior: 'smooth' }); }}>{l}</a>)}
      </nav>
      </div>

      <main className="an-body">
        <section id="an-resumo">
          <div className="an-hero">
            <span className="an-eyebrow">Total planejado</span>
            <b>{fx.convert ? home(s.grand) : fx.fmt(s.grand)}</b>
            {fx.convert && <span className="muted">{fx.fmt(s.grand)} · câmbio usado: 1 {fx.cur} = {String(fx.rate).replace('.', ',')} {fx.home}</span>}
          </div>
          <div className="an-kpis">
            <Kpi v={both(perDay)} l={`por dia, em média (${s.days.length} dias)`} />
            <Kpi v={s.total.stay ? both(s.total.stay / Math.max(1, s.nights)) : '—'} l={`por noite de hotel (${s.nights} noites)`} />
            <Kpi v={foodDays ? both(s.total.food / foodDays) : '—'} l="em comida por dia" />
            <Kpi v={s.quotaUsd.usd ? money(s.quotaUsd.used, 'USD') : '—'} l={`das compras contam na cota de ${money(s.quotaUsd.quota, 'USD')}`} />
          </div>
          {missingCount > 0 && (
            <div className="an-warn" role="note">
              <b>O total ainda não está completo.</b> Faltam os preços de
              {s.missing.stays.length > 0 && <> {s.missing.stays.length} {s.missing.stays.length === 1 ? 'hospedagem' : 'hospedagens'} ({s.missing.stays.map((x) => x.name).join(', ')})</>}
              {s.missing.stays.length > 0 && s.missing.flights.length > 0 && ' e'}
              {s.missing.flights.length > 0 && <> {s.missing.flights.length} {s.missing.flights.length === 1 ? 'voo' : 'voos'}</>}.
              {!readOnly && ' Preencha em Hospedagens e no voo (campo Custo) para eles entrarem aqui.'}
              {s.missing.doubts > 0 && <> {s.missing.doubts} itens ainda têm algo a confirmar (🔎).</>}
            </div>
          )}

          <h2 className="an-h">Para onde vai o dinheiro</h2>
          <Stack parts={CATS.map((c) => ({ ...c, v: s.total[c.key] }))} total={s.grand} label={(c) => `${c.label}: ${fx.convert ? home(c.v) : fx.fmt(c.v)} (${pct(c.v)})`} tall />
          <table className="tbl an-tbl">
            <thead><tr><td>Categoria</td><td className="r">{fx.convert ? fx.home : ''}</td>{fx.convert && <td className="r">{fx.cur}</td>}<td className="r">%</td></tr></thead>
            <tbody>
              {CATS.map((c) => (
                <tr key={c.key}>
                  <td><i className="dot" style={{ '--c': c.color }} /> {c.label}</td>
                  <td className="r">{s.total[c.key] ? (fx.convert ? home(s.total[c.key]) : fx.fmt(s.total[c.key])) : <span className="muted">sem preço</span>}</td>
                  {fx.convert && <td className="r muted">{s.total[c.key] ? fx.fmt(s.total[c.key]) : ''}</td>}
                  <td className="r">{s.total[c.key] ? pct(s.total[c.key]) : ''}</td>
                </tr>
              ))}
              <tr className="an-sum"><td>Total</td><td className="r">{fx.convert ? home(s.grand) : fx.fmt(s.grand)}</td>{fx.convert && <td className="r muted">{fx.fmt(s.grand)}</td>}<td className="r">100%</td></tr>
            </tbody>
          </table>
          <p className="muted small">Conta só a opção principal de cada refeição ou passeio com mais de uma opção. Hospedagem é dividida pelas noites. O trem ou metrô até cada lugar entra em Transporte. Compras vêm da lista de compras.</p>
        </section>

        <section id="an-dias">
          <h2 className="an-h">Gasto por dia</h2>
          <DayChart s={s} fmt={fx.convert ? home : fx.fmt} />
          <details className="an-details">
            <summary>Ver em tabela</summary>
            <table className="tbl an-tbl">
              <thead><tr><td>Dia</td>{CATS.map((c) => <td key={c.key} className="r">{c.label}</td>)}<td className="r">Total</td></tr></thead>
              <tbody>
                {s.dayRows.map((r) => (
                  <tr key={r.d}><td>{fmtDay(r.d)}</td>{CATS.map((c) => <td key={c.key} className="r">{r.v[c.key] ? fx.fmt(r.v[c.key]) : ''}</td>)}<td className="r"><b>{r.t ? fx.fmt(r.t) : ''}</b></td></tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <section id="an-cidades">
          <h2 className="an-h">Por cidade</h2>
          <div className="an-cities">
            {s.cityRows.map((c) => (
              <div key={c.k} className="an-city">
                <div className="an-city-h"><i className="dot" style={{ '--c': c.color || 'var(--muted)' }} /> <b>{c.name}</b><span className="spacer" /><b>{fx.convert ? home(c.t) : fx.fmt(c.t)}</b></div>
                <Stack parts={CATS.map((x) => ({ ...x, v: c.v[x.key] }))} total={c.t} label={(x) => `${x.label}: ${fx.fmt(x.v)}`} />
                <div className="muted small">
                  {[c.nights ? `${c.nights} ${c.nights === 1 ? 'noite' : 'noites'}` : '', c.days ? `${c.days} ${c.days === 1 ? 'dia' : 'dias'} com atividades` : '', c.days && c.t ? `${fx.convert ? home(c.t / c.days) : fx.fmt(c.t / c.days)} por dia` : ''].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="an-hospedagem">
          <h2 className="an-h">Hospedagem</h2>
          <table className="tbl an-tbl">
            <thead><tr><td>Hotel</td><td>Datas</td><td className="r">Noites</td><td className="r">Por noite</td><td className="r">Total</td></tr></thead>
            <tbody>
              {s.stayRows.map((h) => (
                <tr key={h.id ?? h.name}>
                  <td>{h.name}</td>
                  <td className="muted">{fmtDay(h.check_in)} a {fmtDay(h.check_out)}</td>
                  <td className="r">{h.nights}</td>
                  <td className="r">{h.perNight ? both(h.perNight) : ''}</td>
                  <td className="r">{h.cost ? both(h.cost) : <span className="muted">sem preço</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="an-comida">
          <h2 className="an-h">Comida</h2>
          <div className="an-kpis">
            {s.mealStats.map((m) => <Kpi key={m.k} v={both(m.avg)} l={`${m.label.toLowerCase()} em média · ${m.n} ${m.n === 1 ? 'refeição' : 'refeições'}`} />)}
          </div>
          {s.foodRange.max > s.foodRange.min && (
            <p className="an-note">Escolhendo sempre a opção mais barata de cada refeição, a comida fica em <b>{fx.convert ? home(s.foodRange.min) : fx.fmt(s.foodRange.min)}</b>; sempre a mais cara, em <b>{fx.convert ? home(s.foodRange.max) : fx.fmt(s.foodRange.max)}</b>. O plano atual dá <b>{fx.convert ? home(s.total.food) : fx.fmt(s.total.food)}</b>.</p>
          )}
          <div className="sub-h">As refeições mais caras</div>
          <Bars rows={s.meals.filter((m) => m.cost).sort((x, y) => y.cost - x.cost).slice(0, 8).map((m) => ({ k: m.a.id, label: `${fmtDay(m.a.day)} · ${clean(m.a.title)}`, v: m.cost }))} fmt={fx.convert ? home : fx.fmt} color="var(--cat-4)" />
          <details className="an-details" open>
            <summary>Todas as refeições ({s.meals.length})</summary>
            <table className="tbl an-tbl">
              <thead><tr><td>Dia</td><td>Refeição</td><td>Lugar (principal)</td><td className="r">Preço</td><td className="r">Faixa das opções</td></tr></thead>
              <tbody>
                {s.meals.map((m) => (
                  <tr key={m.a.id}>
                    <td className="muted">{fmtDay(m.a.day)}</td>
                    <td className="muted">{MEALS[m.meal]}</td>
                    <td>{clean(m.a.title)}{m.reserve && <span className="an-tag">reserva</span>}{m.options.length > 1 && <small className="muted"> · {m.options.length} opções</small>}</td>
                    <td className="r">{m.cost ? fx.fmt(m.cost) : <span className="muted">—</span>}</td>
                    <td className="r muted">{m.options.length > 1 && m.max > m.min ? `${fx.fmt(m.min)} a ${fx.fmt(m.max)}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <section id="an-passeios">
          <h2 className="an-h">Passeios e ingressos</h2>
          <p className="muted">{s.tickets.length} com entrada paga, somando {fx.convert ? home(s.total.sight) : fx.fmt(s.total.sight)}; {s.free.length} de graça.</p>
          <Bars rows={s.tickets.slice(0, 12).map((a) => ({ k: a.id, label: `${fmtDay(a.day)} · ${clean(a.title)}`, v: a.cost }))} fmt={fx.convert ? home : fx.fmt} color="var(--cat-5)" />
          {s.free.length > 0 && (
            <>
              <div className="sub-h">De graça</div>
              <div className="an-chips">{s.free.map((a) => <span key={a.id} className="an-chip">{clean(a.title)}</span>)}</div>
            </>
          )}
        </section>

        <section id="an-transporte">
          <h2 className="an-h">Transporte</h2>
          <table className="tbl an-tbl">
            <thead><tr><td>Tipo</td><td className="r">Trechos</td><td className="r">Tempo a bordo</td><td className="r">Custo</td></tr></thead>
            <tbody>
              {s.modes.map((m) => (
                <tr key={m.mode}><td>{m.label}</td><td className="r">{m.n}</td><td className="r">{m.min ? `${Math.floor(m.min / 60)}h${String(m.min % 60).padStart(2, '0')}` : ''}</td><td className="r">{m.cost ? fx.fmt(m.cost) : ''}</td></tr>
              ))}
            </tbody>
          </table>
          {s.intercity.length > 0 && (
            <>
              <div className="sub-h">Viagens mais caras (trens e ônibus entre cidades)</div>
              <Bars rows={s.intercity.map((a) => ({ k: a.id, label: `${fmtDay(a.day)} · ${clean(a.title)}`, v: a.cost }))} fmt={fx.convert ? home : fx.fmt} color="var(--cat-3)" />
            </>
          )}
        </section>

        <section id="an-compras">
          <h2 className="an-h">Compras</h2>
          {s.quotaUsd.usd > 0 && (
            <div className="an-quota">
              <div className="an-quota-bar" role="img" aria-label={`Cota usada: ${money(s.quotaUsd.used, 'USD')} de ${money(s.quotaUsd.quota, 'USD')}`}>
                <i style={{ width: `${Math.min(100, (s.quotaUsd.used / s.quotaUsd.quota) * 100)}%` }} className={s.quotaUsd.over ? 'over' : ''} />
              </div>
              <div className="small">
                <b>{money(s.quotaUsd.used, 'USD')}</b> de {money(s.quotaUsd.quota, 'USD')} da cota da Receita
                {s.quotaUsd.over > 0 ? <> · <b className="an-bad">passa {money(s.quotaUsd.over, 'USD')}</b> (50% de imposto sobre o excedente)</> : <> · sobram {money(s.quotaUsd.quota - s.quotaUsd.used, 'USD')}</>}
                {s.quotaUsd.exempt > 0 && <> · {fx.fmt(s.quotaUsd.exempt)} em itens de uso pessoal, fora da cota</>}
              </div>
            </div>
          )}
          <Bars rows={s.buyGroups.map((g) => ({ k: g.g, label: `${g.g} (${g.n})`, v: g.v }))} fmt={fx.convert ? home : fx.fmt} color="var(--cat-6)" />
        </section>

        <section id="an-reservas">
          <h2 className="an-h">Reservas e ingressos</h2>
          {s.checks.length ? (
            <>
              <p className="muted">{s.checks.filter((c) => c.done).length} de {s.checks.length} já feitos.</p>
              <ul className="an-checks">
                {s.checks.map((c) => <li key={c.id ?? c.text} className={c.done ? 'ok' : ''}><span aria-hidden="true">{c.done ? '✓' : '○'}</span> {c.text}<span className="sr-only">{c.done ? ' (feito)' : ' (pendente)'}</span></li>)}
              </ul>
            </>
          ) : <p className="muted">Nenhuma reserva na checklist.</p>}
        </section>
      </main>
    </div>
  );
}

const clean = (t) => String(t || '').replace(/^(Jantar|Almoço|Café da manhã|Café)( \(opção\))?:\s*/i, '').replace(/\s*🔎.*$/, '');

function Kpi({ v, l }) {
  return <div className="an-kpi"><b>{v}</b><span>{l}</span></div>;
}

// barra empilhada com as categorias (com legenda e rótulo em cada parte no hover)
function Stack({ parts, total, label, tall = false }) {
  const shown = parts.filter((p) => p.v > 0);
  return (
    <div className="an-stack-wrap">
      <div className={`an-stack${tall ? ' tall' : ''}`} role="img" aria-label={shown.map(label).join('; ')}>
        {shown.map((p) => <i key={p.key} style={{ flexGrow: p.v / Math.max(1, total), background: p.color }} title={label(p)} />)}
      </div>
      {tall && (
        <div className="an-legend">
          {shown.map((p) => <span key={p.key}><i className="dot" style={{ '--c': p.color }} /> {p.label} <b>{Math.round((p.v / Math.max(1, total)) * 100)}%</b></span>)}
        </div>
      )}
    </div>
  );
}

function Bars({ rows, fmt, color }) {
  if (!rows.length) return <div className="muted small">Nada com preço ainda.</div>;
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <div className="bars">
      {rows.map((r) => (
        <div key={r.k} className="bar-row" title={`${r.label}: ${fmt(r.v)}`}>
          <span className="bar-l">{r.label}</span>
          <span className="bar-t"><i style={{ width: `${(r.v / max) * 100}%`, background: color }} /></span>
          <span className="bar-v">{fmt(r.v)}</span>
        </div>
      ))}
    </div>
  );
}

// colunas empilhadas por dia; passar o mouse (ou focar) mostra o detalhe do dia
function DayChart({ s, fmt }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...s.dayRows.map((r) => r.t));
  const h = hover != null ? s.dayRows[hover] : null;
  return (
    <div className="an-days">
      <div className="an-legend">{CATS.map((c) => <span key={c.key}><i className="dot" style={{ '--c': c.color }} /> {c.label}</span>)}</div>
      <div className="an-tip" aria-live="polite">
        {h ? (
          <>
            <b>{fmtDay(h.d)}</b> · {fmt(h.t)}
            {CATS.filter((c) => h.v[c.key]).map((c) => <span key={c.key}><i className="dot" style={{ '--c': c.color }} /> {c.label} {fmt(h.v[c.key])}</span>)}
          </>
        ) : <span className="muted">Passe o mouse ou toque num dia para ver o detalhe.</span>}
      </div>
      <div className="an-cols" onMouseLeave={() => setHover(null)}>
        {s.dayRows.map((r, i) => (
          <button key={r.d} className={`an-col${hover === i ? ' on' : ''}`} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => setHover(i)} aria-label={`${fmtDay(r.d)}: ${fmt(r.t)}`}>
            <span className="an-col-bar" style={{ height: `${(r.t / max) * 100}%` }}>
              {CATS.filter((c) => r.v[c.key]).map((c) => <i key={c.key} style={{ flexGrow: r.v[c.key], background: c.color }} />)}
            </span>
            <small>{dayWeek(r.d)}</small>
            <b>{dayNum(r.d)}</b>
          </button>
        ))}
      </div>
    </div>
  );
}
