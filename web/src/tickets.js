import { principals } from './util.js';

// ── ingressos e reservas: junta o que o roteiro pede para comprar ou reservar (pelas notas das atividades)
// com os itens de reserva da checklist, e separa em comprado, falta comprar, só se escolher a opção e pagar na entrada.

// "assento reservado" é o tipo de assento, não uma reserva feita: só "já reservado" conta
const BOUGHT = /\bcomprad[oa]\b|já reservad[oa]|já pag[oa]|\bpago\b/i;
const NEEDS = /reserv|ingresso com hor|comprar já|comprar antes|tablecheck|klook/i;
const WHERE = /ONDE COMPRAR/; // em maiúsculas: a instrução de compra, não "decida onde comprar o quê"
const NO_NEED = /sem reserva[.;:]|não precisa reservar/i; // "Sem reserva, vá nos vagões livres" não conta
const CHECK_GRP = /reserv|ingress/i;
const STOP = new Set(['reservar', 'reserva', 'comprar', 'comprado', 'comprados', 'ingresso', 'ingressos', 'assento', 'horário', 'pessoa', 'opção', 'escolher', 'esta', 'este', 'esse', 'essa', 'para', 'com', 'dos', 'das', 'uma', 'levar', 'jantar', 'almoço', 'café', 'site', 'antes', 'depois', 'trecho', 'trechos', 'volta', 'ida']);

export const TICKET_CATS = { transport: 'Transporte', ticket: 'Ingresso', food: 'Restaurante', stay: 'Hospedagem', other: 'Outro' };

const catOf = (a) => (a.kind === 'move' || a.kind === 'flight' ? 'transport'
  : a.kind === 'food' ? 'food' : a.kind === 'stay' ? 'stay' : 'ticket');

const words = (s) => new Set((String(s || '').toLowerCase().match(/[a-zà-ÿ]{3,}/g) || []).filter((w) => !STOP.has(w)));

// "09/11 Ushihachi…", "13 ou 14/11 …", "26 a 28/11 …" → o primeiro dia, no ano da viagem
function checkDay(text, trip) {
  const m = String(text).match(/^\s*(\d{1,2})(?:\s*(?:ou|a|e|-)\s*\d{1,2})?\/(\d{1,2})/);
  if (!m) return null;
  const year = (trip.start || '').slice(0, 4);
  const d = `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return d >= trip.start && d <= trip.end ? d : null;
}

// "abre 1 mês antes" nas notas → a data em que a venda abre
function opensOn(notes, day) {
  const m = String(notes || '').match(/abre (\d+) m[eê]s(?:es)? antes/i);
  if (!m || !day) return null;
  const d = new Date(`${day}T12:00:00`);
  d.setMonth(d.getMonth() - Number(m[1]));
  return d.toISOString().slice(0, 10);
}

export function tickets(data) {
  const { trip } = data;
  const all = data.activities || [];
  const main = new Set(principals(all).map((a) => a.id));
  const entries = [];

  const entryOf = (a, status) => ({
    id: `a${a.id}`, act: a, day: a.day, start: a.start, title: a.title, cat: catOf(a), cost: Number(a.cost) || 0,
    status, notes: a.notes || '', links: a.links || null, opens: status === 'todo' ? opensOn(a.notes, a.day) : null, check: null,
  });

  all.forEach((a) => {
    const notes = a.notes || '';
    const bought = BOUGHT.test(notes);
    const needs = a.kind !== 'shop' && (WHERE.test(notes) || (!NO_NEED.test(notes) && NEEDS.test(notes)));
    const optional = !main.has(a.id);
    let status = null;
    if (bought) status = 'ok';
    else if (needs) status = optional ? 'maybe' : 'todo';
    else if (!optional && catOf(a) === 'ticket' && a.kind !== 'shop' && a.cost > 0) status = 'gate';
    if (status) entries.push(entryOf(a, status));
  });

  // itens de reserva da checklist: marcam a atividade do mesmo dia com mais palavras em comum; os que sobram entram sozinhos
  (data.checklist || []).filter((c) => CHECK_GRP.test(`${c.grp || ''} ${c.text}`)).forEach((c) => {
    const day = checkDay(c.text, trip);
    const w = words(c.text);
    const score = (title) => [...words(title)].filter((x) => w.has(x)).length;
    const best = (l) => {
      const top = Math.max(0, ...l.map((x) => x.n));
      return l.filter((x) => x.n > 0 && x.n >= Math.min(2, top));
    };
    // primeiro entre o que já é ingresso ou reserva; senão, qualquer atividade do dia (ela passa a entrar na lista)
    let hits = best(entries.filter((e) => e.day === day && e.act && e.status !== 'gate' && !e.check).map((e) => ({ e, n: score(e.title) })));
    if (!hits.length) {
      const l = all.filter((a) => a.day === day && !entries.some((e) => e.act?.id === a.id)).map((a) => ({ a, n: score(a.title) }));
      const top = Math.max(0, ...l.map((x) => x.n));
      hits = l.filter((x) => x.n > 0 && x.n === top) // aqui só o mais parecido, para não puxar atividades soltas
        .map(({ a, n }) => { const e = entryOf(a, main.has(a.id) ? 'todo' : 'maybe'); entries.push(e); return { e, n }; });
    }
    if (hits.length) {
      hits.forEach(({ e }) => {
        e.check = c;
        if (c.done) e.status = 'ok';
        else if (e.status === 'ok' && !BOUGHT.test(e.notes)) e.status = 'todo';
      });
      return;
    }
    entries.push({
      id: `c${c.id ?? c.text}`, act: null, day, start: null, title: c.text.replace(/^\s*[\d/\s]+(?:ou|a|e)?\s*[\d/]*\s*/, '') || c.text,
      cat: /hotel|hosped/i.test(c.text) ? 'stay' : 'other', cost: 0, status: c.done ? 'ok' : 'todo', notes: '', links: null, opens: null, check: c,
    });
  });

  const order = (x, y) => (x.day || '9').localeCompare(y.day || '9') || (x.start || '99').localeCompare(y.start || '99');
  entries.sort(order);
  const pick = (s) => entries.filter((e) => e.status === s);
  const sum = (l) => l.reduce((t, e) => t + e.cost, 0);
  const groups = { todo: pick('todo'), ok: pick('ok'), maybe: pick('maybe'), gate: pick('gate') };
  return { entries, groups, totals: Object.fromEntries(Object.entries(groups).map(([k, l]) => [k, sum(l)])) };
}
