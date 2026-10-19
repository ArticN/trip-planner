import { daysBetween, rangeDays } from './util.js';

// a viagem desenhada como uma linha de metrô (inspirada na sinalização de Tóquio):
// cada cidade é uma estação com cor e código de 3 letras; bate-voltas saem como ramais

const plain = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');

// código curto: primeira letra + consoantes seguintes (KYOTO → KYT, NAGOYA → NGY); colisões trocam a última letra
export function cityCodes(cities) {
  const used = new Set();
  const out = {};
  for (const c of cities) {
    const w = plain(c.name) || plain(c.key) || 'XXX';
    const cons = w.slice(1).replace(/[AEIOU]/g, '').replace(/(.)\1+/g, '$1');
    const pool = [...new Set([...cons, ...w.slice(1)])];
    let code = (w[0] + cons + w.slice(1)).slice(0, 3).padEnd(3, 'X');
    for (let i = 0; used.has(code) && i < pool.length; i++) code = code.slice(0, 2) + pool[i];
    used.add(code);
    out[c.key] = code;
  }
  return out;
}

// estações (uma por hospedagem, larga na proporção das noites) e bate-voltas pendurados no dia certo
export function metroLine(stays, cityMap, daysInfo = []) {
  const segs = [...stays]
    .sort((a, b) => a.check_in.localeCompare(b.check_in))
    .map((s) => ({ s, c: cityMap[s.city], n: Math.max(0, daysBetween(s.check_in, s.check_out)) }))
    .filter((x) => x.n > 0 && x.c);
  const stayCities = new Set(segs.map((x) => x.s.city));
  for (const seg of segs) {
    const days = rangeDays(seg.s.check_in, seg.s.check_out).slice(0, seg.n);
    const seen = new Set();
    seg.trips = [];
    days.forEach((day, i) => {
      const info = daysInfo.find((d) => d.day === day);
      (info?.cities || []).forEach((k) => {
        if (stayCities.has(k) || k === 'transito' || seen.has(k) || !cityMap[k]) return;
        seen.add(k);
        seg.trips.push({ c: cityMap[k], day, at: (i + 0.5) / seg.n });
      });
    });
  }
  return segs;
}

export default function Metro({ stays, cityMap, cities, daysInfo, onCity, compact }) {
  const segs = metroLine(stays, cityMap, daysInfo);
  if (!segs.length) return null;
  const codes = cityCodes(cities || Object.values(cityMap));
  return (
    <div className={`metro${compact ? ' compact' : ''}`} role="list" aria-label="Linha da viagem">
      {segs.map(({ s, c, n, trips }) => (
        <div key={s.id} className="mt-seg" role="listitem" style={{ flex: `${n} 1 0`, '--c': c.color }}>
          <span className="mt-line" />
          {trips.map((t, i) => (
            <button key={t.c.key} className={`mt-branch${i % 2 ? ' up' : ''}`} style={{ left: `${t.at * 100}%`, '--b': t.c.color }} onClick={() => onCity?.(t.c)} title={`Bate-volta: ${t.c.name}`}>
              <b>{codes[t.c.key]}</b><i />
            </button>
          ))}
          <button className="mt-stop" onClick={() => onCity?.(c)} title={`${c.name} · ${n} ${n === 1 ? 'noite' : 'noites'}`}>
            <i className="mt-dot" />
            <b>{codes[c.key]}</b>
            <span>{c.name}</span>
            <small>{n} {n === 1 ? 'noite' : 'noites'}</small>
          </button>
        </div>
      ))}
    </div>
  );
}
