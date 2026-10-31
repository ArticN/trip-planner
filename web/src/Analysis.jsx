import { useMemo } from 'react';
import { analyze, CATS, MEALS } from './analysis.js';
import { fmtDay, dayNum, dayWeek, money } from './util.js';
import { ColumnChart, Heatmap, inkOn, Meter, RangeBar, RankBars, SegBar, StackBars, Timeline, TipBody } from './charts.jsx';

// ── página de análise: todos os gastos planejados da viagem, para quem quer ver o quadro inteiro
// (feita pensando em quem acompanha de fora, como a família: valores em reais primeiro, na moeda da viagem ao lado).
// Cada seção abre com um gráfico; as tabelas com os números ficam em "Ver em tabela".
export default function Analysis({ data, onBack, onTickets, readOnly = false }) {
  const s = useMemo(() => analyze(data), [data]);
  const { fx, home } = s;
  const one = fx.convert ? home : fx.fmt; // um valor só, na moeda de casa quando há conversão
  const both = (n) => (fx.convert ? <>{home(n)} <small>{fx.fmt(n)}</small></> : fx.fmt(n));
  const k = fx.convert ? fx.rate : 1;
  const cur = fx.convert ? fx.home : fx.cur;
  const pct = (n) => (s.grand ? `${Math.round((n / s.grand) * 100)}%` : '—');
  const perDay = s.days.length ? s.grand / s.days.length : 0;
  const foodDays = new Set(s.meals.filter((m) => m.cost).map((m) => m.a.day)).size;
  const priced = s.dayRows.filter((r) => r.t > 0);
  const top = priced.reduce((b, r) => (r.t > (b?.t || 0) ? r : b), null);
  const low = priced.reduce((b, r) => (r.t < (b?.t ?? Infinity) ? r : b), null);
  const cityLabel = (c) => s.cityName[c] || c;

  // faixa das cidades embaixo das colunas: dias seguidos na mesma cidade viram um trecho
  const band = [];
  s.dayRows.forEach((r, i) => {
    const last = band[band.length - 1];
    if (last && last.city === r.city) last.len += 1;
    else band.push({ city: r.city, start: i, len: 1, name: r.city ? cityLabel(r.city) : '', color: r.city ? s.cityColor[r.city] : 'transparent' });
  });

  const dayIdx = Object.fromEntries(s.days.map((d, i) => [d, i]));
  const tlDays = s.days.map((d) => ({ key: d, label: dayNum(d), weekend: [0, 6].includes(new Date(`${d}T12:00:00`).getDay()) }));
  const stays = s.stayRows.filter((h) => h.check_in && h.check_out).sort((x, y) => x.check_in.localeCompare(y.check_in));

  const mealRows = Object.entries(MEALS).map(([key, label]) => ({ key, label, short: MEAL_SHORT[key] })).filter((r) => s.meals.some((m) => m.meal === r.key && m.cost));
  const mealAt = {};
  s.meals.filter((m) => m.cost).forEach((m) => { (mealAt[`${m.a.day}|${m.meal}`] ||= []).push(m); });

  const missingCount = s.missing.stays.length + s.missing.flights.length;
  const doneChecks = s.checks.filter((c) => c.done).length;

  const nav = [['resumo', 'Resumo'], ['dias', 'Por dia'], ['cidades', 'Por cidade'], ['hospedagem', 'Hospedagem'], ['comida', 'Comida'], ['passeios', 'Passeios'], ['transporte', 'Transporte'], ['compras', 'Compras'], ['reservas', 'Reservas']];

  return (
    <div className="an">
      <div className="an-head">
        <header className="an-top">
          {onBack && <button className="icon-btn" onClick={onBack} title="Voltar ao roteiro" aria-label="Voltar ao roteiro">←</button>}
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
            <b>{one(s.grand)}</b>
            {fx.convert && <span className="muted">{fx.fmt(s.grand)} · câmbio usado: 1 {fx.cur} = {String(fx.rate).replace('.', ',')} {fx.home}</span>}
          </div>
          {missingCount > 0 && (
            <div className="an-warn" role="note">
              <b>O total ainda não está completo.</b> Faltam os preços de
              {s.missing.stays.length > 0 && <> {s.missing.stays.length} {s.missing.stays.length === 1 ? 'hospedagem' : 'hospedagens'}</>}
              {s.missing.stays.length > 0 && s.missing.flights.length > 0 && ' e'}
              {s.missing.flights.length > 0 && <> {s.missing.flights.length} {s.missing.flights.length === 1 ? 'voo' : 'voos'}</>}.
              {!readOnly && ' Preencha em Hospedagens e no campo Custo do voo.'}
              {s.missing.doubts > 0 && <span className="muted"> {s.missing.doubts} itens ainda têm algo a confirmar (🔎).</span>}
            </div>
          )}
          <div className="an-kpis">
            <Kpi v={both(perDay)} l={`por dia, em média (${s.days.length} dias)`} />
            <Kpi v={s.total.stay ? both(s.total.stay / Math.max(1, s.nights)) : '—'} l={`por noite de hotel (${s.nights} noites)`} />
            <Kpi v={foodDays ? both(s.total.food / foodDays) : '—'} l="em comida por dia" />
            <Kpi v={s.quotaUsd.usd ? money(s.quotaUsd.used, 'USD') : '—'} l={`das compras contam na cota de ${money(s.quotaUsd.quota, 'USD')}`} />
          </div>

          <Card title="Para onde vai o dinheiro">
            <SegBar parts={CATS.map((c) => ({ ...c, v: s.total[c.key] }))} fmt={one} label="Divisão do total por categoria" />
            <div className="an-cats">
              {[...CATS].sort((x, y) => (s.total[y.key] > 0) - (s.total[x.key] > 0)).map((c) => (
                <div key={c.key} className={`an-cat${s.total[c.key] ? '' : ' none'}`}>
                  <span className="an-cat-l"><i style={{ background: c.color }} />{c.label}</span>
                  {s.total[c.key] ? (
                    <>
                      <b>{one(s.total[c.key])}</b>
                      <small>{fx.convert ? `${fx.fmt(s.total[c.key])} · ` : ''}{pct(s.total[c.key])}</small>
                    </>
                  ) : <small>sem preço ainda</small>}
                </div>
              ))}
            </div>
            <p className="muted small">Conta só a opção principal de cada refeição ou passeio com mais de uma opção. Hospedagem é dividida pelas noites. O trem ou metrô até cada lugar entra em Transporte. Compras vêm da lista de compras.</p>
          </Card>
        </section>

        <section id="an-dias">
          <h2 className="an-h">Gasto por dia</h2>
          {top && (
            <div className="an-facts">
              <Fact l="dia mais caro" v={one(top.t)} s={fmtDay(top.d)} />
              <Fact l="dia mais barato" v={one(low.t)} s={fmtDay(low.d)} />
              <Fact l="média por dia" v={one(perDay)} s={`${s.days.length} dias`} />
            </div>
          )}
          <Card>
            <ColumnChart
              rows={s.dayRows.map((r) => ({ key: r.d, label: dayNum(r.d), sub: dayWeek(r.d).slice(0, 3), title: fmtDay(r.d), note: r.city ? cityLabel(r.city) : '', parts: r.v, total: r.t }))}
              cats={CATS} fmt={one} k={k} cur={cur} avg={perDay} band={band.filter((b) => b.city)}
            />
            <div className="ch-legend">{CATS.filter((c) => s.total[c.key]).map((c) => <span key={c.key}><i style={{ background: c.color }} />{c.label}</span>)}</div>
          </Card>
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
          <Card>
            <div className="ch-legend">{CATS.filter((c) => s.total[c.key]).map((c) => <span key={c.key}><i style={{ background: c.color }} />{c.label}</span>)}</div>
            <StackBars
              rows={s.cityRows.filter((c) => c.t > 0).map((c) => ({
                key: c.k, label: c.name, dot: c.color, parts: c.v, total: c.t,
                note: [c.nights ? `${c.nights} ${c.nights === 1 ? 'noite' : 'noites'}` : '', c.days && c.k !== '_' ? `${one(c.t / c.days)} por dia` : ''].filter(Boolean).join(' · '),
              }))}
              cats={CATS} fmt={one}
            />
          </Card>
          <details className="an-details">
            <summary>Ver em tabela</summary>
            <table className="tbl an-tbl">
              <thead><tr><td>Cidade</td>{CATS.map((c) => <td key={c.key} className="r">{c.label}</td>)}<td className="r">Total</td></tr></thead>
              <tbody>
                {s.cityRows.filter((c) => c.t > 0).map((c) => (
                  <tr key={c.k}><td>{c.name}</td>{CATS.map((x) => <td key={x.key} className="r">{c.v[x.key] ? fx.fmt(c.v[x.key]) : ''}</td>)}<td className="r"><b>{fx.fmt(c.t)}</b></td></tr>
                ))}
              </tbody>
            </table>
          </details>
        </section>

        <section id="an-hospedagem">
          <h2 className="an-h">Hospedagem</h2>
          <p className="an-lead">{stays.length} {stays.length === 1 ? 'hospedagem' : 'hospedagens'} · {s.nights} noites{s.total.stay ? <> · {one(s.total.stay)}</> : ''}</p>
          <Card>
            <Timeline
              days={tlDays}
              rows={stays.map((h) => ({
                key: h.id ?? h.name, label: h.name, start: dayIdx[h.check_in] ?? 0, len: Math.min(h.nights, s.days.length - (dayIdx[h.check_in] ?? 0)),
                color: s.cityColor[h.city] || 'var(--cat-1)', ink: inkOn(s.cityColor[h.city]), cost: h.cost,
                note: h.cost ? `${one(h.perNight)} por noite` : 'sem preço ainda',
                when: `${fmtDay(h.check_in)} a ${fmtDay(h.check_out)} · ${h.nights} ${h.nights === 1 ? 'noite' : 'noites'}`,
              }))}
              fmt={one}
            />
          </Card>
          <details className="an-details">
            <summary>Ver em tabela</summary>
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
          </details>
        </section>

        <section id="an-comida">
          <h2 className="an-h">Comida</h2>
          <div className="an-kpis">
            {s.mealStats.map((m) => <Kpi key={m.k} v={both(m.avg)} l={`${m.label.toLowerCase()} em média · ${m.n} ${m.n === 1 ? 'refeição' : 'refeições'}`} />)}
          </div>
          {s.foodRange.max > s.foodRange.min && (
            <Card title="Quanto a comida pode custar" sub="Escolhendo sempre a opção mais barata ou a mais cara de cada refeição, contra o plano de hoje.">
              <RangeBar min={s.foodRange.min} max={s.foodRange.max} value={s.total.food} fmt={one} />
            </Card>
          )}
          {mealRows.length > 0 && (
            <Card title="Cada refeição, dia a dia" sub="Quanto mais forte a cor, mais cara a refeição. Toque num quadrado para ver o lugar e o preço.">
              <Heatmap
                rows={mealRows}
                cols={s.days.map((d) => ({ key: d, label: dayNum(d), title: `${dayWeek(d).slice(0, 3)} ${dayNum(d)}` }))}
                color="var(--cat-4)"
                cell={(r, c) => {
                  const l = mealAt[`${c.key}|${r.key}`];
                  if (!l) return null;
                  const v = l.reduce((t, m) => t + m.cost, 0);
                  const names = l.map((m) => clean(m.a.title)).join(' + ');
                  return { v, text: `${names}, ${one(v)}`, body: <TipBody title={names} value={one(v)} sub={`${fmtDay(c.key)} · ${r.label}${l.some((m) => m.reserve) ? ' · com reserva' : ''}`} /> };
                }}
              />
            </Card>
          )}
          <Card title="As refeições mais caras">
            <RankBars rows={s.meals.filter((m) => m.cost).sort((x, y) => y.cost - x.cost).slice(0, 8).map((m) => ({ k: m.a.id, label: clean(m.a.title), sub: `${fmtDay(m.a.day)} · ${MEALS[m.meal]}`, v: m.cost }))} fmt={one} color="var(--cat-4)" />
          </Card>
          <details className="an-details">
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
          <div className="an-facts">
            <Fact l="com entrada paga" v={s.tickets.length} s={s.total.sight ? one(s.total.sight) : ''} />
            <Fact l="de graça" v={s.free.length} />
            {s.tickets[0] && <Fact l="o mais caro" v={one(s.tickets[0].cost)} s={clean(s.tickets[0].title)} />}
          </div>
          <Card title="Os ingressos mais caros">
            <RankBars rows={s.tickets.slice(0, 10).map((a) => ({ k: a.id, label: clean(a.title), sub: fmtDay(a.day), v: a.cost }))} fmt={one} color="var(--cat-5)" />
            {s.tickets.length > 10 && <p className="muted small">E mais {s.tickets.length - 10}, somando {one(s.tickets.slice(10).reduce((t, a) => t + a.cost, 0))}.</p>}
          </Card>
          {s.free.length > 0 && (
            <details className="an-details">
              <summary>Passeios de graça ({s.free.length})</summary>
              <div className="an-chips">{s.free.map((a) => <span key={a.id} className="an-chip">{clean(a.title)}</span>)}</div>
            </details>
          )}
        </section>

        <section id="an-transporte">
          <h2 className="an-h">Transporte</h2>
          {s.modes.length > 0 && (
            <Card title="Por tipo">
              <RankBars rows={s.modes.filter((m) => m.cost).map((m) => ({ k: m.mode, label: m.label, sub: `${m.n} ${m.n === 1 ? 'trecho' : 'trechos'}${m.min ? ` · ${hours(m.min)} a bordo` : ''}`, v: m.cost }))} fmt={one} color="var(--cat-3)" />
            </Card>
          )}
          {s.intercity.length > 0 && (
            <Card title="Viagens entre cidades" sub="Trens e ônibus de uma cidade para outra, os maiores gastos de transporte.">
              <RankBars rows={[...s.intercity].sort((x, y) => y.cost - x.cost).map((a) => ({ k: a.id, label: clean(a.title), sub: fmtDay(a.day), v: a.cost }))} fmt={one} color="var(--cat-3)" />
            </Card>
          )}
        </section>

        <section id="an-compras">
          <h2 className="an-h">Compras</h2>
          {s.quotaUsd.usd > 0 && (
            <Card title="Cota da Receita">
              <div className="an-quota">
                <div className="an-meter-v"><b>{money(s.quotaUsd.used, 'USD')}</b> <span className="muted">de {money(s.quotaUsd.quota, 'USD')}</span></div>
                <Meter value={s.quotaUsd.used} max={s.quotaUsd.quota} over={s.quotaUsd.over > 0} label={`Cota usada: ${money(s.quotaUsd.used, 'USD')} de ${money(s.quotaUsd.quota, 'USD')}`} />
                <div className="small">
                  {s.quotaUsd.over > 0 ? <b className="an-bad">Passa {money(s.quotaUsd.over, 'USD')} (50% de imposto sobre o excedente)</b> : <>Sobram {money(s.quotaUsd.quota - s.quotaUsd.used, 'USD')}</>}
                  {s.quotaUsd.exempt > 0 && <span className="muted"> · {fx.fmt(s.quotaUsd.exempt)} em itens de uso pessoal, fora da cota</span>}
                </div>
              </div>
            </Card>
          )}
          <Card title="Por grupo">
            <RankBars rows={s.buyGroups.map((g) => ({ k: g.g, label: g.g, sub: `${g.n} ${g.n === 1 ? 'item' : 'itens'}`, v: g.v }))} fmt={one} color="var(--cat-6)" empty="Nenhuma compra na lista." />
          </Card>
        </section>

        <section id="an-reservas">
          <h2 className="an-h">Reservas e ingressos</h2>
          {s.checks.length ? (
            <Card>
              <div className="an-quota">
                <div className="an-meter-v"><b>{doneChecks} de {s.checks.length}</b> <span className="muted">reservas da checklist feitas</span></div>
                <Meter value={doneChecks} max={s.checks.length} label={`${doneChecks} de ${s.checks.length} reservas feitas`} />
              </div>
              {onTickets && <button className="ghost" onClick={onTickets}>Ver ingressos e reservas →</button>}
              <details className="an-details">
                <summary>Ver a lista</summary>
                <ul className="an-checks">
                  {s.checks.map((c) => <li key={c.id ?? c.text} className={c.done ? 'ok' : ''}><span aria-hidden="true">{c.done ? '✓' : '○'}</span> {c.text}<span className="sr-only">{c.done ? ' (feito)' : ' (pendente)'}</span></li>)}
                </ul>
              </details>
            </Card>
          ) : <p className="muted">Nenhuma reserva na checklist.</p>}
        </section>
      </main>
    </div>
  );
}

const MEAL_SHORT = { cafe: 'Café', almoco: 'Almoço', jantar: 'Jantar', lanche: 'Lanche' };
const clean = (t) => String(t || '').replace(/^(Jantar|Almoço|Café da manhã|Café)( \(opção\))?:\s*/i, '').replace(/\s*🔎.*$/, '');
const hours = (min) => `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;

function Kpi({ v, l }) {
  return <div className="an-kpi"><b>{v}</b><span>{l}</span></div>;
}

function Fact({ l, v, s }) {
  return <div className="an-fact"><span>{l}</span><b>{v}</b>{s && <small>{s}</small>}</div>;
}

function Card({ title, sub, children }) {
  return (
    <div className="an-card">
      {title && <h3 className="an-card-h">{title}</h3>}
      {sub && <p className="an-card-sub">{sub}</p>}
      {children}
    </div>
  );
}
