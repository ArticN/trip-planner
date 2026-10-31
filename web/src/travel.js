import { haversine, toMin } from './util.js';

// tempo de deslocamento entre duas atividades
// - a pé e de carro: rota real pelas ruas (OSRM do FOSSGIS, servidor público do OpenStreetMap), com o desenho do caminho
// - trem e metrô: pelos pontos âncora (estações) do campo route da atividade; sem eles, estimativa pela distância + link do Google Maps
const OSRM = { foot: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot', car: 'https://routing.openstreetmap.de/routed-car/route/v1/driving' };

// route da atividade: como chegar a ela a partir da anterior do dia (ou da hospedagem, na primeira)
// { rides: [{ mode, line, code?, color?, dir?, from: {name, lat, lng}, to: {name, lat, lng}, stops?: [...], min?, cost? }] }
// os trechos a pé entre a origem, as estações e o destino são calculados pelas ruas
export const RIDE_MODES = {
  metro: { label: 'Metrô', color: '#2f7fd8', kmh: 30 },
  train: { label: 'Trem', color: '#3a9b5c', kmh: 45 },
  shinkansen: { label: 'Trem de alta velocidade', color: '#1d5fae', kmh: 200 },
  bus: { label: 'Ônibus', color: '#d08a1c', kmh: 18 },
  tram: { label: 'Bonde', color: '#c0563a', kmh: 15 },
  ferry: { label: 'Balsa', color: '#2a8f9a', kmh: 25 },
};

const isNum = (v) => v != null && v !== '' && Number.isFinite(Number(v));
const station = (s) => (s && isNum(s.lat) && isNum(s.lng) ? { name: String(s.name || '').trim(), lat: Number(s.lat), lng: Number(s.lng) } : null);

// aceita o texto JSON guardado no banco ou o objeto já aberto; descarta trechos sem as duas estações no mapa
export function parseRoute(a) {
  let r = a?.route;
  if (!r) return null;
  if (typeof r === 'string') { try { r = JSON.parse(r); } catch { return null; } }
  const rides = (Array.isArray(r?.rides) ? r.rides : []).map((x) => ({
    ...x,
    mode: RIDE_MODES[x.mode] ? x.mode : 'metro',
    line: String(x.line || '').trim(),
    from: station(x.from),
    to: station(x.to),
    stops: (Array.isArray(x.stops) ? x.stops : []).map(station).filter(Boolean),
    min: Number(x.min) > 0 ? Number(x.min) : null,
    cost: Number(x.cost) > 0 ? Number(x.cost) : null,
  })).filter((x) => x.from && x.to);
  return rides.length ? { rides } : null;
}

export const rideColor = (r) => (/^#[0-9a-f]{3,8}$/i.test(r.color || '') ? r.color : RIDE_MODES[r.mode].color);
export const ridePath = (r) => [r.from, ...r.stops, r.to].map((p) => [p.lat, p.lng]);
export const rideKm = (r) => { let k = 0; const p = [r.from, ...r.stops, r.to]; for (let i = 0; i < p.length - 1; i++) k += haversine(p[i], p[i + 1]); return k; };
// minutos dentro do trem: o informado, ou pela distância e velocidade média do tipo (+3 min de espera)
export const rideMin = (r) => r.min || Math.round(3 + (rideKm(r) * 1.15 / RIDE_MODES[r.mode].kmh) * 60);
export const rideLabel = (r) => [r.code, r.line].filter(Boolean).join(' ') || RIDE_MODES[r.mode].label;

// hospedagem de onde o dia sai: a do check-out (dia de troca de cidade) vem antes da do dia.
// Só quando a primeira atividade tem estações e a primeira estação fica perto dela (a pé);
// assim a chegada do aeroporto não parte de um hotel onde ainda não se chegou
export function dayHome(stays, first) {
  const r = first && parseRoute(first);
  if (!r) return null;
  return stays.find((s) => s && isNum(s.lat) && isNum(s.lng) && haversine(s, r.rides[0].from) <= 5) || null;
}

// ponto de partida do dia: a hospedagem, ou (chegada do aeroporto, hotel sem endereço) a primeira estação
export function dayStart(stays, first) {
  const home = dayHome(stays, first);
  if (home) return { at: home, stay: true };
  const r = first && parseRoute(first);
  return r ? { at: r.rides[0].from, stay: false } : null;
}

// deslocamento desenhado como linha reta: voo, ou trecho de viagem sem as estações cadastradas
export const isStraightTravel = (a, b) => a.kind === 'flight' || b.kind === 'flight' || (b.kind === 'move' && !parseRoute(b));

export function travelMode(a, b) {
  if (parseRoute(b)) return 'route';
  const t = (b.transport || '').toLowerCase();
  if (t.includes('pé')) return 'foot';
  if (t.includes('táxi') || t.includes('taxi') || t.includes('carro')) return 'car';
  if (/metr|trem|ônibus|onibus|alta velocidade/.test(t)) return 'transit';
  return haversine(a, b) <= 2.5 ? 'foot' : 'transit';
}

// fila: uma consulta por vez, para não sobrecarregar o servidor público
let queue = Promise.resolve();
const enqueue = (fn) => { const p = queue.then(fn, fn); queue = p.catch(() => {}); return p; };

// rota pelas ruas, com o caminho ([lat, lng]...) para desenhar no mapa
async function osrm(mode, a, b) {
  const key = `rt2:${mode}:${a.lat.toFixed(4)},${a.lng.toFixed(4)}:${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;
  try { const c = localStorage.getItem(key); if (c) return JSON.parse(c); } catch { /* sem storage */ }
  const r = await enqueue(() => fetch(`${OSRM[mode]}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`));
  if (!r.ok) throw new Error(`rota ${r.status}`);
  const j = await r.json();
  const route = j.routes?.[0];
  if (!route) throw new Error('sem rota');
  // 5 casas (~1 m) bastam e deixam o cache pequeno
  const path = (route.geometry?.coordinates || []).map(([lng, lat]) => [+lat.toFixed(5), +lng.toFixed(5)]);
  const v = { min: Math.max(1, Math.round(route.duration / 60)), km: route.distance / 1000, path };
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* sem storage */ }
  return v;
}

// estimativa de transporte público urbano: ~10 min até embarcar + 25 km/h no trajeto
export const transitEstimate = (km) => Math.round(10 + (km * 1.3 / 25) * 60);

// trecho pelas ruas; se o servidor falhar, linha reta com tempo estimado
async function street(mode, a, b) {
  const straight = haversine(a, b);
  try {
    const r = await osrm(mode, a, b);
    // OSRM a pé usa 5 km/h; carro sem trânsito: soma 20% de folga
    return { mode, km: r.km, min: mode === 'car' ? Math.round(r.min * 1.2) : r.min, path: r.path.length > 1 ? r.path : null, estimate: false };
  } catch {
    const km = straight * 1.3;
    return { mode, km, min: Math.round((km / (mode === 'car' ? 25 : 4.5)) * 60), path: null, estimate: true };
  }
}

// a pé até 40 m não conta (mesma estação, saída do lado)
const NEAR_KM = 0.04;

// trechos do deslocamento: a pé, trem, a pé (baldeação), trem, a pé...
// cada um tem mode, km, min e path (null = desenhar reto)
// guarda a consulta de cada par (o mapa redesenha a cada clique e não deve consultar de novo)
const memo = new Map();
export function travelLegs(a, b) {
  const key = `${a.lat},${a.lng}>${b.lat},${b.lng}|${b.transport || ''}|${typeof b.route === 'string' ? b.route : JSON.stringify(b.route || null)}`;
  if (!memo.has(key)) memo.set(key, legsOf(a, b));
  return memo.get(key);
}

async function legsOf(a, b) {
  const mode = travelMode(a, b);
  if (mode === 'route') {
    const { rides } = parseRoute(b);
    const stops = [a, ...rides.flatMap((r) => [r.from, r.to]), b];
    const legs = [];
    for (let i = 0; i < stops.length - 1; i += 2) {
      const p = stops[i];
      const q = stops[i + 1];
      if (haversine(p, q) >= NEAR_KM) legs.push({ ...(await street('foot', p, q)), from: p, to: q });
      const ride = rides[i / 2];
      if (ride) legs.push({ mode: 'ride', ride, km: rideKm(ride), min: rideMin(ride), path: ridePath(ride), estimate: !ride.min, from: ride.from, to: ride.to });
    }
    return legs;
  }
  if (mode === 'transit') {
    const km = haversine(a, b);
    return [{ mode, km, min: transitEstimate(km), path: null, estimate: true, from: a, to: b }];
  }
  return [{ ...(await street(mode, a, b)), from: a, to: b }];
}

export async function travelTime(a, b) {
  const legs = await travelLegs(a, b);
  const mode = travelMode(a, b);
  return {
    mode, legs,
    km: legs.reduce((s, l) => s + l.km, 0),
    min: legs.reduce((s, l) => s + l.min, 0),
    estimate: legs.some((l) => l.estimate),
  };
}

// minutos livres entre o fim de uma atividade e o começo da seguinte (null se faltar horário)
export function slack(a, b) {
  const end = a.end || a.start;
  if (!end || !b.start || (a.end_day && a.end_day !== a.day)) return null;
  return toMin(b.start) - toMin(end);
}

export const gmapsDirections = (a, b, mode) => `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&travelmode=${mode === 'foot' ? 'walking' : mode === 'car' ? 'driving' : 'transit'}`;

// texto legível sobre a cor da linha (linhas amarelas ou prateadas pedem texto escuro)
export function inkOn(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6 ? '#1a1a1a' : '#fff';
}
