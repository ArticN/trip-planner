export const KINDS = {
  sight: { label: 'Pontos turísticos', icon: '📍', color: '#c0392b' }, // taste-skill-ignore: kind icons are data
  food: { label: 'Comida e café', icon: '🍜', color: '#d68910' }, // taste-skill-ignore: kind icons are data
  move: { label: 'Deslocamento', icon: '🚆', color: '#2874a6' }, // taste-skill-ignore: kind icons are data
  stay: { label: 'Hospedagem', icon: '🏨', color: '#7d3c98' }, // taste-skill-ignore: kind icons are data
  shop: { label: 'Compras', icon: '🛍️', color: '#138d75' }, // taste-skill-ignore: kind icons are data
  free: { label: 'Tempo livre', icon: '⏳', color: '#7f8c8d' }, // taste-skill-ignore: kind icons are data
  flight: { label: 'Voo', icon: '✈️', color: '#34495e' }, // taste-skill-ignore: kind icons are data
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

// duração em minutos (fim no mesmo dia; se fim < início, assume virada de dia)
export function duration(a) {
  const s = toMin(a.start);
  const e = toMin(a.end);
  if (s == null || e == null) return null;
  if (a.end_day && a.end_day !== a.day) return null;
  return e >= s ? e - s : e + 1440 - s;
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
