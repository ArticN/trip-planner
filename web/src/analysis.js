import { KINDS, principals, altGroups, rangeDays, daysBetween, makeFx, money, SLOTS } from './util.js';
import { parseRoute, RIDE_MODES } from './travel.js';
import { usdRateOf, DEFAULT_QUOTA_USD } from './Shopping.jsx';

// ── análise da viagem: tudo o que foi planejado de gasto, separado por categoria, dia, cidade e refeição.
// Só lê os dados (atividades principais, hospedagens, compras e checklist); não grava nada.

// categorias de gasto, na ordem fixa das cores (--cat-1 … --cat-6)
export const CATS = [
  { key: 'stay', label: 'Hospedagem' },
  { key: 'flight', label: 'Voos' },
  { key: 'transport', label: 'Transporte' },
  { key: 'food', label: 'Comida' },
  { key: 'sight', label: 'Passeios e ingressos' },
  { key: 'shop', label: 'Compras' },
].map((c, i) => ({ ...c, color: `var(--cat-${i + 1})` }));

const zero = () => Object.fromEntries(CATS.map((c) => [c.key, 0]));
const sumOf = (o) => Object.values(o).reduce((t, v) => t + v, 0);
const RESERVA = /reserva|reservar|ingresso|comprar já|comprar antes|tablecheck/i;
const PAID = /comprad[oa]|já pag/i;
const DOUBT = /🔎/;

// categoria de uma atividade (o trem dentro do "como chegar" vai à parte, em transporte)
function catOf(a) {
  if (a.kind === 'stay') return null; // check-in, deixar mala: sem custo próprio
  if (a.kind === 'flight') return 'flight';
  if (a.kind === 'move') return 'transport';
  if (a.kind === 'food') return 'food';
  if (a.kind === 'shop') return 'shop';
  return 'sight';
}

const mealOf = (a) => (['cafe', 'almoco', 'jantar'].includes(a.slot) ? a.slot
  : /caf[eé] da manh/i.test(a.title) ? 'cafe' : /almo[cç]o/i.test(a.title) ? 'almoco' : /jantar/i.test(a.title) ? 'jantar' : 'lanche');
export const MEALS = { cafe: 'Café da manhã', almoco: 'Almoço', jantar: 'Jantar', lanche: 'Café e lanche' };

export function analyze(data) {
  const { trip } = data;
  const fx = makeFx(trip);
  const usd = usdRateOf(trip);
  const quota = Number(trip.quota_usd) || DEFAULT_QUOTA_USD;
  const days = rangeDays(trip.start, trip.end);
  const all = data.activities || [];
  const acts = principals(all);
  const groups = altGroups(all);
  const stays = data.stays || [];
  const purchases = data.purchases || [];
  const cityName = Object.fromEntries((data.cities || []).map((c) => [c.key, c.name || c.key]));
  const cityColor = Object.fromEntries((data.cities || []).map((c) => [c.key, c.color]));

  const total = zero();
  const byDay = Object.fromEntries(days.map((d) => [d, zero()]));
  const byCity = {};
  const add = (cat, v, day, city) => {
    if (!(v > 0)) return;
    total[cat] += v;
    if (day && byDay[day]) byDay[day][cat] += v;
    const c = city && city !== 'transito' ? city : '_';
    byCity[c] ||= zero();
    byCity[c][cat] += v;
  };

  // hospedagens: a diária é dividida pelas noites (cada noite cai no dia do check-in em diante)
  const stayRows = stays.map((s) => {
    const nights = s.check_in && s.check_out ? Math.max(1, daysBetween(s.check_in, s.check_out)) : 0;
    const cost = Number(s.cost) || 0;
    if (cost && nights) rangeDays(s.check_in, s.check_out).slice(0, nights).forEach((d) => add('stay', cost / nights, d, s.city));
    else if (cost) add('stay', cost, s.check_in, s.city);
    return { ...s, nights, cost, perNight: cost && nights ? cost / nights : 0 };
  });

  // compras: a lista de compras é o orçamento delas; os itens de loja do roteiro só contam se a lista estiver vazia
  const useShopActs = purchases.length === 0;
  purchases.forEach((p) => add('shop', Number(p.price) || 0, p.day, p.city));

  // atividades e o trem/metrô até cada uma
  const rides = [];
  acts.forEach((a) => {
    const cat = catOf(a);
    if (cat && (cat !== 'shop' || useShopActs)) add(cat, Number(a.cost) || 0, a.day, a.city);
    const r = parseRoute(a);
    if (r) r.rides.forEach((x) => {
      rides.push({ ...x, day: a.day, act: a });
      // no deslocamento, o custo da atividade já é a passagem; nas outras, a passagem soma à parte
      if (a.kind !== 'move' && a.kind !== 'flight') add('transport', x.cost || 0, a.day, a.city);
    });
  });

  // refeições: a principal conta; as outras opções dão a faixa (mais barata e mais cara)
  const meals = acts.filter((a) => a.kind === 'food').map((a) => {
    const opts = (a.alt && groups.get(`${a.day}|${a.alt}`)) || [a];
    const prices = opts.map((o) => Number(o.cost) || 0).filter((v) => v > 0);
    return {
      a, meal: mealOf(a), cost: Number(a.cost) || 0, options: opts,
      min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0,
      reserve: opts.some((o) => RESERVA.test(o.notes || '')),
    };
  });
  const mealStats = Object.keys(MEALS).map((k) => {
    const l = meals.filter((m) => m.meal === k && m.cost > 0);
    const v = l.reduce((t, m) => t + m.cost, 0);
    return { k, label: MEALS[k], n: l.length, total: v, avg: l.length ? v / l.length : 0, max: l.reduce((b, m) => (m.cost > (b?.cost || 0) ? m : b), null) };
  }).filter((x) => x.n);
  const foodRange = meals.reduce((r, m) => ({ min: r.min + m.min, max: r.max + m.max }), { min: 0, max: 0 });

  // passeios e ingressos (pagos e de graça)
  const sights = acts.filter((a) => catOf(a) === 'sight');
  const tickets = sights.filter((a) => a.cost > 0).sort((x, y) => y.cost - x.cost);
  const free = sights.filter((a) => a.cost === 0);

  // transporte: por tipo e as viagens entre cidades
  const modes = {};
  rides.forEach((r) => {
    modes[r.mode] ||= { mode: r.mode, label: RIDE_MODES[r.mode]?.label || r.mode, n: 0, cost: 0, min: 0 };
    modes[r.mode].n += 1; modes[r.mode].cost += r.cost || 0; modes[r.mode].min += r.min || 0;
  });
  const intercity = acts.filter((a) => a.kind === 'move' && a.cost >= 1000).sort((x, y) => x.day.localeCompare(y.day));

  // compras por grupo e a cota da Receita (em dólar)
  const buyGroups = {};
  purchases.forEach((p) => {
    const g = p.grp || 'Outros';
    buyGroups[g] ||= { g, n: 0, v: 0 };
    buyGroups[g].n += 1; buyGroups[g].v += Number(p.price) || 0;
  });
  const counted = purchases.filter((p) => !p.exempt).reduce((t, p) => t + (Number(p.price) || 0), 0);
  const exempt = purchases.filter((p) => p.exempt).reduce((t, p) => t + (Number(p.price) || 0), 0);
  const quotaUsd = { quota, used: usd ? counted * usd : 0, usd, counted, exempt };
  quotaUsd.over = Math.max(0, quotaUsd.used - quota);

  // reservas e ingressos: da checklist e das notas das atividades
  const checks = (data.checklist || []).filter((c) => /reserv|ingress/i.test(`${c.grp} ${c.text}`));
  const paid = acts.filter((a) => PAID.test(a.notes || ''));

  // o que falta para o orçamento ficar completo
  const missing = {
    stays: stayRows.filter((s) => !s.cost),
    flights: acts.filter((a) => a.kind === 'flight' && !(a.cost > 0)),
    food: meals.filter((m) => !m.cost).map((m) => m.a),
    doubts: acts.filter((a) => DOUBT.test(`${a.title} ${a.location || ''} ${a.details || ''} ${a.notes || ''}`)).length,
  };

  const grand = sumOf(total);
  const nights = stayRows.reduce((t, s) => t + s.nights, 0);
  const dayRows = days.map((d) => ({ d, v: byDay[d], t: sumOf(byDay[d]), city: mainCity(acts, d) }));
  const cityRows = Object.entries(byCity).map(([k, v]) => ({
    k, name: k === '_' ? 'Sem cidade / em trânsito' : cityName[k] || k, color: cityColor[k], v, t: sumOf(v),
    nights: stayRows.filter((s) => s.city === k).reduce((t, s) => t + s.nights, 0),
    days: new Set(acts.filter((a) => a.city === k).map((a) => a.day)).size,
  })).sort((x, y) => y.t - x.t);

  return {
    fx, days, total, grand, nights, dayRows, cityRows, stayRows, meals, mealStats, foodRange, tickets, free,
    modes: Object.values(modes).sort((x, y) => y.cost - x.cost), rides, intercity,
    buyGroups: Object.values(buyGroups).sort((x, y) => y.v - x.v), quotaUsd, checks, paid, missing,
    counts: { acts: acts.length, food: meals.length, sights: sights.length, cities: cityRows.filter((c) => c.k !== '_').length },
    home: (n) => (fx.convert ? money(n * fx.rate, fx.home) : money(n, fx.cur)),
    slotLabel: (k) => SLOTS.find((s) => s.key === k)?.label || '',
    kindColor: (k) => (KINDS[k] || KINDS.sight).color,
  };
}

// cidade do dia: a que mais aparece nas atividades
function mainCity(acts, d) {
  const n = {};
  acts.filter((a) => a.day === d && a.city && a.city !== 'transito').forEach((a) => { n[a.city] = (n[a.city] || 0) + 1; });
  return Object.entries(n).sort((x, y) => y[1] - x[1])[0]?.[0] || null;
}
