export const KINDS = {
  sight: { label: 'Pontos turísticos', color: '#c0392b' },
  food: { label: 'Comida e café', color: '#d68910' },
  move: { label: 'Deslocamento', color: '#2874a6' },
  stay: { label: 'Hospedagem', color: '#7d3c98' },
  shop: { label: 'Compras', color: '#138d75' },
  free: { label: 'Tempo livre', color: '#7f8c8d' },
  flight: { label: 'Voo', color: '#34495e' },
};
export const KIND_KEYS = Object.keys(KINDS);

export const TRANSPORTS = ['', '🚶 A pé', '🚇 Metrô', '🚃 Trem', '🚄 Trem de alta velocidade', '🚌 Ônibus', '🚕 Táxi', '✈️ Avião']; // taste-skill-ignore: data

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const hasCoords = (a) => a && typeof a.lat === 'number' && typeof a.lng === 'number';

export function toMin(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// ── fusos horários (IANA, ex: Asia/Tokyo)
export const TIMEZONES = (() => { try { return Intl.supportedValuesOf('timeZone'); } catch { return []; } })();
export const localTz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return null; } };
const tzFmt = {};
// minutos que o fuso está à frente do UTC no instante `ms`
function tzOffset(tz, ms) {
  tzFmt[tz] ||= new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const p = Object.fromEntries(tzFmt[tz].formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - Math.floor(ms / 60000) * 60000) / 60000;
}
// dia + hora "de parede" num fuso → instante UTC (ms). Sem fuso, trata como UTC.
export function zonedMs(day, time, tz) {
  const [y, m, d] = day.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  if (!tz) return guess;
  try {
    let ms = guess - tzOffset(tz, guess) * 60000;
    ms = guess - tzOffset(tz, ms) * 60000; // ajuste perto da troca de horário de verão
    return ms;
  } catch { return guess; }
}
const nextDay = (d) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
// dia e minuto atuais no fuso da viagem (sem fuso: o do aparelho)
export function nowIn(tz) {
  const opt = { hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
  let p;
  try { p = Object.fromEntries(new Intl.DateTimeFormat('en-US', tz ? { ...opt, timeZone: tz } : opt).formatToParts(new Date()).map((x) => [x.type, x.value])); } catch { p = Object.fromEntries(new Intl.DateTimeFormat('en-US', opt).formatToParts(new Date()).map((x) => [x.type, x.value])); }
  return { day: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}
// link de rota no Google Maps até a atividade
export const directionsUrl = (a) => `https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}`;

// fusos de início e fim de uma atividade (o do transporte, se houver; senão o da viagem)
export const actTz = (a, tripTz) => ({ start: a.start_tz || tripTz || null, end: a.end_tz || a.start_tz || tripTz || null });
// dia em que a atividade termina
export const endDayOf = (a) => a.end_day || (a.end && a.start && a.end < a.start ? nextDay(a.day) : a.day);

// duração em minutos. Considera dia de chegada e fusos diferentes (voos); se fim < início no mesmo dia, assume virada de dia.
export function duration(a, tripTz) {
  if (!a.start || !a.end) return null;
  const tz = actTz(a, tripTz);
  const min = (zonedMs(endDayOf(a), a.end, tz.end) - zonedMs(a.day, a.start, tz.start)) / 60000;
  return min >= 0 ? Math.round(min) : null;
}

export function fmtDuration(min) {
  if (min == null) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function haversine(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function fmtKm(km) {
  if (km < 1) return `${Math.round(km * 10) * 100} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

const dayFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
const dayLongFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const parseDay = (d) => new Date(`${d}T12:00:00`);
export const fmtDay = (d) => dayFmt.format(parseDay(d)).replace('.', '');
export const fmtDayLong = (d) => dayLongFmt.format(parseDay(d));
export const dayNum = (d) => String(parseDay(d).getDate()).padStart(2, '0');
export const dayWeek = (d) => parseDay(d).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

export function daysBetween(a, b) {
  return Math.round((parseDay(b) - parseDay(a)) / 86400000);
}

export function rangeDays(start, end) {
  const out = [];
  const d = parseDay(start);
  const last = parseDay(end);
  while (d <= last) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export const CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'ARS', 'CLP', 'CAD', 'AUD', 'CHF', 'MXN', 'KRW', 'CNY', 'THB'];

const fmtCache = {};
export function money(n, cur) {
  try {
    fmtCache[cur] ||= new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cur });
    return fmtCache[cur].format(n);
  } catch {
    return `${cur} ${n.toFixed(2)}`;
  }
}

// moeda da viagem + conversão opcional para a moeda de casa (rate = 1 moeda da viagem em moeda de casa)
export function makeFx(trip) {
  const cur = trip.currency || 'BRL';
  const home = trip.home_currency || cur;
  const rate = Number(trip.rate) || 0;
  const convert = cur !== home && rate > 0;
  return {
    cur, home, rate, convert,
    fmt: (n) => money(n, cur),
    fmtHome: (n) => (convert ? money(n * rate, home) : ''),
  };
}

// ids com conflito de horário (ignora "tempo livre")
export function findConflicts(items) {
  const timed = items
    .filter((a) => a.kind !== 'free' && a.start && a.end && !(a.end_day && a.end_day !== a.day))
    .map((a) => ({ id: a.id, s: toMin(a.start), e: toMin(a.end) < toMin(a.start) ? toMin(a.end) + 1440 : toMin(a.end) }));
  const bad = new Set();
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      if (timed[i].s < timed[j].e && timed[j].s < timed[i].e) {
        bad.add(timed[i].id);
        bad.add(timed[j].id);
      }
    }
  }
  return bad;
}

// reordena só os itens com horário, mantendo os sem horário nos seus lugares
export function sortByTime(items) {
  const slots = [];
  const timed = [];
  items.forEach((it, i) => { if (it.start) { slots.push(i); timed.push(it); } });
  timed.sort((x, y) => x.start.localeCompare(y.start));
  const out = items.slice();
  slots.forEach((slot, k) => { out[slot] = timed[k]; });
  return out;
}

// nascer e pôr do sol (algoritmo da NOAA, precisão de ~1 min) para um dia "AAAA-MM-DD" num ponto.
// Devolve horários "HH:MM" no fuso informado, ou null em dias de sol da meia-noite / noite polar.
export function sunTimes(day, lat, lng, tz) {
  const rad = Math.PI / 180;
  const [y, m, d] = day.split('-').map(Number);
  const noonUtc = Date.UTC(y, m - 1, d, 12);
  const jd = noonUtc / 86400000 + 2440587.5;
  const n = jd - 2451545.0 + 0.0008;
  const jStar = n - lng / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit = 2451545.0 + jStar + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lambda * rad);
  const decl = Math.asin(Math.sin(lambda * rad) * Math.sin(23.4397 * rad));
  const cosH = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
  if (cosH < -1 || cosH > 1) return null;
  const h = Math.acos(cosH) / rad / 360;
  const fmt = (j) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz || undefined }).format(new Date((j - 2440587.5) * 86400000));
  return { rise: fmt(jTransit - h), set: fmt(jTransit + h) };
}

// filtro "mostrar": todas, só as que faltam ou só as feitas
export const DONE_FILTERS = [['all', 'Todas'], ['todo', 'A fazer'], ['done', 'Feitas']];
export const passDone = (a, f) => f === 'all' || (f === 'done' ? !!a.done : !a.done);

// blocos do dia, na ordem da escala: manhã, café, depois do café, almoço, depois do almoço, jantar, depois do jantar
export const SLOTS = [
  { key: 'manha', label: 'Manhã', hint: 'antes do café', meal: false },
  { key: 'cafe', label: 'Café da manhã', hint: '', meal: true },
  { key: 'pos_cafe', label: 'Depois do café', hint: '', meal: false },
  { key: 'almoco', label: 'Almoço', hint: '', meal: true },
  { key: 'pos_almoco', label: 'Depois do almoço', hint: '', meal: false },
  { key: 'jantar', label: 'Jantar', hint: '', meal: true },
  { key: 'pos_jantar', label: 'Depois do jantar', hint: '', meal: false },
];
const SLOT_RANK = Object.fromEntries(SLOTS.map((x, i) => [x.key, i]));
const AFTER = { cafe: 'pos_cafe', almoco: 'pos_almoco', jantar: 'pos_jantar' };

// refeição reconhecida pelo título (dados antigos não têm bloco gravado)
function mealOf(a) {
  if (a.kind !== 'food') return null;
  const t = a.title || '';
  if (/caf[eé] da manh|breakfast|desjejum/i.test(t)) return 'cafe';
  if (/almo[cç]o|lunch/i.test(t)) return 'almoco';
  if (/jantar|dinner/i.test(t)) return 'jantar';
  return null;
}

// ordena o dia pelos blocos: o bloco escolhido vale; sem ele vem da refeição, do horário ou do item anterior
export function orderBySlots(list) {
  const base = list.slice().sort((x, y) => x.sort - y.sort || x.id - y.id);
  const valid = (k) => (k && k in SLOT_RANK ? k : null);
  const meals = base.filter((a) => a.start && (valid(a.slot) ? SLOTS[SLOT_RANK[a.slot]].meal : mealOf(a))).map((a) => ({ at: a.start, key: valid(a.slot) || mealOf(a) }));
  let prev = 'manha';
  const out = base.map((a) => {
    let key = valid(a.slot) || mealOf(a);
    if (!key && a.start) {
      const before = meals.filter((m) => m.at <= a.start).sort((x, y) => x.at.localeCompare(y.at)).pop();
      if (before) key = AFTER[before.key];
      else key = a.start < '08:00' ? 'manha' : a.start < '12:00' ? 'pos_cafe' : a.start < '19:00' ? 'pos_almoco' : 'pos_jantar';
    }
    prev = key || prev;
    return { ...a, slotKey: prev };
  });
  return out.sort((x, y) => SLOT_RANK[x.slotKey] - SLOT_RANK[y.slotKey]);
}

// ── opções no mesmo horário (carrossel): atividades do mesmo dia com a mesma chave `alt`.
// A primeira na ordem do dia é a principal: é ela que conta no orçamento, na agenda, nos lembretes e no PDF.
const bySort = (x, y) => (x.sort ?? 0) - (y.sort ?? 0) || x.id - y.id;
export const newAltKey = () => `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// chave → opções em ordem (só grupos com 2 ou mais)
export function altGroups(list) {
  const m = new Map();
  list.filter((a) => a.alt).slice().sort(bySort).forEach((a) => {
    const k = `${a.day}|${a.alt}`;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(a);
  });
  for (const [k, g] of m) if (g.length < 2) m.delete(k);
  return m;
}
export const altKey = (a) => `${a.day}|${a.alt}`;

// tira as opções que não são a principal
export function principals(list) {
  const extra = new Set();
  altGroups(list).forEach((g) => g.slice(1).forEach((a) => extra.add(a.id)));
  return extra.size ? list.filter((a) => !extra.has(a.id)) : list;
}

// o dia (já ordenado) com cada grupo virando um item só, no lugar da primeira opção:
// mostra a opção escolhida em `view` (chave → id) e leva `alts` (todas) e `altIndex`
export function collapseAlts(list, view = {}) {
  const groups = altGroups(list);
  if (!groups.size) return list;
  const done = new Set();
  const out = [];
  list.forEach((a) => {
    const g = a.alt && groups.get(altKey(a));
    if (!g) { out.push(a); return; }
    const k = altKey(a);
    if (done.has(k)) return;
    done.add(k);
    const i = Math.max(0, g.findIndex((x) => x.id === view[k]));
    const shown = list.find((x) => x.id === g[i].id);
    out.push({ ...shown, slotKey: a.slotKey, alts: g, altIndex: i });
  });
  return out;
}
