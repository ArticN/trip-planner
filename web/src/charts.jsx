import { useEffect, useRef, useState } from 'react';

// ── gráficos da análise, em HTML e CSS (sem biblioteca): barra segmentada, colunas empilhadas por dia,
// barras horizontais (empilhadas ou ranqueadas), linha do tempo das hospedagens, mapa de calor e faixa.
// Toda marca mostra o detalhe ao passar o mouse, focar pelo teclado ou tocar; a tabela de cada seção tem os mesmos números.

// valores redondos para o eixo: 0, 500, 1.000… (passos de 1, 2, 2,5 e 5)
export function niceTicks(max, n = 3) {
  if (!(max > 0)) return [0, 1];
  const raw = max / n;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw);
  const ticks = [0];
  while (ticks[ticks.length - 1] < max - step * 1e-6) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

const compactFmt = {};
export function compact(n, cur) {
  try {
    compactFmt[cur] ||= new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cur, notation: 'compact', maximumFractionDigits: 1 });
    return compactFmt[cur].format(n);
  } catch {
    return String(Math.round(n));
  }
}

// texto em cima de uma cor (hex): branco ou quase preto, o que tiver mais contraste
export function inkOn(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return '#111';
  const lin = (i) => { const c = parseInt(m[1].slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin(0) + 0.7152 * lin(2) + 0.0722 * lin(4);
  return (1.05 / (L + 0.05)) > ((L + 0.05) / 0.05) ? '#fff' : '#111';
}

// tela estreita (celular): alguns gráficos viram de lado
export function useNarrow(q = '(max-width: 640px)') {
  const [on, setOn] = useState(() => typeof matchMedia === 'function' && matchMedia(q).matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return undefined;
    const m = matchMedia(q);
    const f = () => setOn(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [q]);
  return on;
}

// dica flutuante: fica acima da marca, presa dentro do gráfico
export function useTip() {
  const ref = useRef(null);
  const [tip, setTip] = useState(null);
  const show = (el, body) => {
    const w = ref.current;
    if (!w || !el) return;
    const anchor = el.querySelector('[data-anchor]') || el;
    const a = w.getBoundingClientRect();
    const b = anchor.getBoundingClientRect();
    const half = Math.min(120, a.width / 2);
    const x = Math.min(Math.max(b.left + b.width / 2 - a.left, half), a.width - half);
    setTip({ x, y: b.top - a.top, body });
  };
  const hide = () => setTip(null);
  const on = (body) => ({
    onMouseEnter: (e) => show(e.currentTarget, body),
    onFocus: (e) => show(e.currentTarget, body),
    onClick: (e) => show(e.currentTarget, body),
    onMouseLeave: hide,
    onBlur: hide,
  });
  const node = tip && <div className="ch-tip" role="status" style={{ left: tip.x, top: tip.y }}>{tip.body}</div>;
  return { ref, on, node };
}

// conteúdo da dica: o valor em destaque, o nome embaixo, e as partes com um traço da cor
export function TipBody({ title, value, sub, rows }) {
  return (
    <>
      {value != null && <b className="ch-tip-v">{value}</b>}
      <span className="ch-tip-t">{title}</span>
      {sub && <span className="ch-tip-s">{sub}</span>}
      {rows?.length > 0 && (
        <span className="ch-tip-rows">
          {rows.map((r) => <span key={r.label}><i style={{ background: r.color }} />{r.label}<b>{r.value}</b></span>)}
        </span>
      )}
    </>
  );
}

// uma soma dividida em partes, com a fatia escrita dentro quando cabe
export function SegBar({ parts, fmt, label = 'Divisão' }) {
  const tip = useTip();
  const shown = parts.filter((p) => p.v > 0);
  const total = shown.reduce((t, p) => t + p.v, 0) || 1;
  const pct = (v) => Math.round((v / total) * 100);
  return (
    <div className="ch-wrap" ref={tip.ref}>
      <div className="ch-seg" role="img" aria-label={`${label}: ${shown.map((p) => `${p.label} ${pct(p.v)}%`).join(', ')}`}>
        {shown.map((p) => (
          <span key={p.key} tabIndex={0} className="ch-seg-part" style={{ flexGrow: p.v, background: p.color, color: p.ink || '#111' }}
            {...tip.on(<TipBody title={p.label} value={fmt(p.v)} sub={`${pct(p.v)}% do total`} />)}>
            {p.v / total >= 0.07 && `${pct(p.v)}%`}
          </span>
        ))}
      </div>
      <div className="ch-legend">{shown.map((p) => <span key={p.key}><i style={{ background: p.color }} />{p.label}</span>)}</div>
      {tip.node}
    </div>
  );
}

// colunas empilhadas (um dia por coluna), com grade, linha da média, rótulo no maior e a faixa das cidades embaixo
export function ColumnChart({ rows, cats, fmt, k = 1, cur, avg, band, height = 220 }) {
  const tip = useTip();
  const max = Math.max(1, ...rows.map((r) => r.total));
  const ticks = niceTicks(max * k);
  const top = ticks[ticks.length - 1] / k;
  const y = (v) => `${(v / top) * 100}%`;
  const peak = rows.reduce((b, r, i) => (r.total > (rows[b]?.total || 0) ? i : b), 0);
  return (
    <div className="ch-wrap" ref={tip.ref}>
      <div className="ch-plot" style={{ height }}>
        {ticks.map((t) => <div key={t} className="ch-grid" style={{ bottom: y(t / k) }}><span>{compact(t, cur)}</span></div>)}
        {avg > 0 && <div className="ch-avg" style={{ bottom: y(avg) }}><span>média {fmt(avg)}</span></div>}
        <div className="ch-cols" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
          {rows.map((r, i) => (
            <button key={r.key} type="button" className="ch-col" aria-label={`${r.title}: ${fmt(r.total)}`}
              {...tip.on(<TipBody title={r.title} value={fmt(r.total)} sub={r.note} rows={cats.filter((c) => r.parts[c.key]).map((c) => ({ label: c.label, color: c.color, value: fmt(r.parts[c.key]) }))} />)}>
              <span className="ch-col-bar" data-anchor style={{ height: y(r.total) }}>
                {cats.filter((c) => r.parts[c.key]).map((c) => <i key={c.key} style={{ flexGrow: r.parts[c.key], background: c.color }} />)}
              </span>
              {i === peak && r.total > 0 && <small className="ch-cap" style={{ bottom: y(r.total) }}>{compact(r.total * k, cur)}</small>}
            </button>
          ))}
        </div>
      </div>
      <div className="ch-x" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }} aria-hidden="true">
        {rows.map((r) => <span key={r.key}><b>{r.label}</b><small>{r.sub}</small></span>)}
      </div>
      {band?.length > 0 && (
        <div className="ch-band" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
          {band.map((b) => (
            <span key={b.start} style={{ gridColumn: `${b.start + 1} / span ${b.len}` }} title={b.name}>
              <i style={{ background: b.color || 'var(--muted)' }} />
              <small>{b.name}</small>
            </span>
          ))}
        </div>
      )}
      {tip.node}
    </div>
  );
}

// barras horizontais empilhadas na mesma escala (uma por cidade)
export function StackBars({ rows, cats, fmt }) {
  const tip = useTip();
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div className="ch-wrap ch-rows" ref={tip.ref}>
      {rows.map((r) => (
        <div key={r.key} className="ch-row">
          <div className="ch-row-l">
            <span>{r.dot && <i className="ch-dot" style={{ background: r.dot }} />}{r.label}</span>
            {r.note && <small>{r.note}</small>}
          </div>
          <div className="ch-row-t">
            <span className="ch-row-bar" style={{ width: `${(r.total / max) * 100}%` }}>
              {cats.filter((c) => r.parts[c.key]).map((c) => (
                <i key={c.key} tabIndex={0} style={{ flexGrow: r.parts[c.key], background: c.color }}
                  {...tip.on(<TipBody title={`${r.label} · ${c.label}`} value={fmt(r.parts[c.key])} sub={`${Math.round((r.parts[c.key] / r.total) * 100)}% da cidade`} />)} />
              ))}
            </span>
            <b className="ch-row-v">{fmt(r.total)}</b>
          </div>
        </div>
      ))}
      {tip.node}
    </div>
  );
}

// barras ranqueadas de uma cor só, com o valor na ponta
export function RankBars({ rows, fmt, color, empty = 'Nada com preço ainda.' }) {
  if (!rows.length) return <div className="muted small">{empty}</div>;
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <div className="ch-rows">
      {rows.map((r) => (
        <div key={r.k} className="ch-row" title={`${r.label}: ${fmt(r.v)}`}>
          <div className="ch-row-l">
            <span>{r.label}</span>
            {r.sub && <small>{r.sub}</small>}
          </div>
          <div className="ch-row-t">
            <span className="ch-row-bar" style={{ width: `${(r.v / max) * 100}%` }}><i style={{ flexGrow: 1, background: color }} /></span>
            <b className="ch-row-v">{fmt(r.v)}</b>
          </div>
        </div>
      ))}
    </div>
  );
}

// linha do tempo: uma barra por hospedagem, das noites dentro da viagem
export function Timeline({ rows, days, fmt }) {
  const tip = useTip();
  const cols = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` };
  return (
    <div className="ch-wrap ch-tl" ref={tip.ref}>
      <div className="ch-tl-row ch-tl-head" aria-hidden="true">
        <span />
        <div className="ch-tl-days" style={cols}>{days.map((d) => <small key={d.key} className={d.weekend ? 'we' : ''}>{d.label}</small>)}</div>
      </div>
      {rows.map((r) => (
        <div key={r.key} className="ch-tl-row">
          <div className="ch-row-l">
            <span>{r.label}</span>
            <small>{r.note}</small>
          </div>
          <div className="ch-tl-track" style={cols}>
            {r.len > 0 && (
              <span tabIndex={0} className="ch-tl-bar" style={{ gridColumn: `${r.start + 1} / span ${r.len}`, background: r.color }}
                {...tip.on(<TipBody title={r.label} value={r.cost ? fmt(r.cost) : 'sem preço'} sub={r.when} />)}>
                {r.len >= 2 && <small style={{ color: r.ink || '#111' }}>{r.len}</small>}
              </span>
            )}
          </div>
        </div>
      ))}
      {tip.node}
    </div>
  );
}

// mapa de calor: linhas (refeições) por colunas (dias); mais forte, mais caro. No celular vira de lado (um dia por linha)
export function Heatmap({ rows, cols, cell, color, steps = 5 }) {
  const tip = useTip();
  const narrow = useNarrow();
  const all = rows.flatMap((r) => cols.map((c) => cell(r, c)?.v || 0)).filter((v) => v > 0);
  const max = Math.max(1, ...all);
  const level = (v) => Math.min(steps, Math.max(1, Math.ceil((v / max) * steps)));
  const mix = (n) => `color-mix(in oklab, ${color} ${Math.round(30 + ((100 - 30) * (n - 1)) / (steps - 1))}%, var(--card))`;
  const box = (r, c) => {
    const x = cell(r, c);
    return x?.v > 0
      ? <span key={`${r.key}|${c.key}`} tabIndex={0} className="ch-heat-c" style={{ background: mix(level(x.v)) }} aria-label={`${c.title}, ${r.label}: ${x.text}`} {...tip.on(x.body)} />
      : <span key={`${r.key}|${c.key}`} className="ch-heat-c off" />;
  };
  // de lado: as refeições viram colunas e os dias, linhas
  const [lines, heads] = narrow ? [cols, rows] : [rows, cols];
  const grid = { gridTemplateColumns: `repeat(${heads.length}, minmax(0, 1fr))` };
  return (
    <div className={`ch-wrap ch-heat${narrow ? ' ch-heat-side' : ''}`} ref={tip.ref}>
      <div className="ch-heat-row" aria-hidden="true">
        <span />
        <div className="ch-heat-cells ch-heat-head" style={grid}>{heads.map((h) => <small key={h.key}>{narrow ? h.short || h.label : h.label}</small>)}</div>
      </div>
      {lines.map((l) => (
        <div key={l.key} className="ch-heat-row">
          <span className="ch-heat-l">{narrow ? l.title : l.label}</span>
          <div className="ch-heat-cells" style={grid}>{heads.map((h) => (narrow ? box(h, l) : box(l, h)))}</div>
        </div>
      ))}
      <div className="ch-heat-scale" aria-hidden="true">
        <span>mais barato</span>
        {Array.from({ length: steps }, (_, i) => <i key={i} style={{ background: mix(i + 1) }} />)}
        <span>mais caro</span>
      </div>
      {tip.node}
    </div>
  );
}

// faixa entre o mínimo e o máximo, com o plano marcado
export function RangeBar({ min, max, value, fmt, labels = ['sempre a mais barata', 'o plano', 'sempre a mais cara'] }) {
  const pos = max > min ? ((value - min) / (max - min)) * 100 : 50;
  return (
    <div className="ch-range" role="img" aria-label={`${labels[0]}: ${fmt(min)}; ${labels[1]}: ${fmt(value)}; ${labels[2]}: ${fmt(max)}`}>
      <div className="ch-range-plan" style={{ left: `${pos}%` }}><b>{fmt(value)}</b><small>{labels[1]}</small></div>
      <div className="ch-range-track"><i style={{ left: `${pos}%` }} /></div>
      <div className="ch-range-ends">
        <span><b>{fmt(min)}</b><small>{labels[0]}</small></span>
        <span><b>{fmt(max)}</b><small>{labels[2]}</small></span>
      </div>
    </div>
  );
}

// medidor: quanto de um limite já foi usado
export function Meter({ value, max, label, over = false }) {
  return (
    <div className="an-quota-bar" role="img" aria-label={label}>
      <i style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%` }} className={over ? 'over' : ''} />
    </div>
  );
}
