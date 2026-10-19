import { haversine, toMin } from './util.js';

// tempo de deslocamento entre duas atividades
// - a pé e de carro: rota real pelas ruas (OSRM do FOSSGIS, servidor público do OpenStreetMap)
// - transporte público: não há serviço grátis com horários; estimativa pela distância + link do Google Maps
const OSRM = { foot: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot', car: 'https://routing.openstreetmap.de/routed-car/route/v1/driving' };

export function travelMode(a, b) {
  const t = (b.transport || '').toLowerCase();
  if (t.includes('pé')) return 'foot';
  if (t.includes('táxi') || t.includes('taxi') || t.includes('carro')) return 'car';
  if (/metr|trem|ônibus|onibus|alta velocidade/.test(t)) return 'transit';
  return haversine(a, b) <= 2.5 ? 'foot' : 'transit';
}

// fila: uma consulta por vez, para não sobrecarregar o servidor público
let queue = Promise.resolve();
const enqueue = (fn) => { const p = queue.then(fn, fn); queue = p.catch(() => {}); return p; };

async function osrm(mode, a, b) {
  const key = `rt:${mode}:${a.lat.toFixed(4)},${a.lng.toFixed(4)}:${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;
  try { const c = localStorage.getItem(key); if (c) return JSON.parse(c); } catch { /* sem storage */ }
  const r = await enqueue(() => fetch(`${OSRM[mode]}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`));
  if (!r.ok) throw new Error(`rota ${r.status}`);
  const j = await r.json();
  const route = j.routes?.[0];
  if (!route) throw new Error('sem rota');
  const v = { min: Math.max(1, Math.round(route.duration / 60)), km: route.distance / 1000 };
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* sem storage */ }
  return v;
}

// estimativa de transporte público urbano: ~10 min até embarcar + 25 km/h no trajeto
export const transitEstimate = (km) => Math.round(10 + (km * 1.3 / 25) * 60);

export async function travelTime(a, b) {
  const mode = travelMode(a, b);
  const straight = haversine(a, b);
  if (mode === 'transit') return { mode, km: straight, min: transitEstimate(straight), estimate: true };
  try {
    const r = await osrm(mode, a, b);
    // OSRM a pé usa 5 km/h; carro sem trânsito: soma 20% de folga
    return { mode, km: r.km, min: mode === 'car' ? Math.round(r.min * 1.2) : r.min, estimate: false };
  } catch {
    const km = straight * 1.3;
    return { mode, km, min: Math.round((km / (mode === 'car' ? 25 : 4.5)) * 60), estimate: true };
  }
}

// minutos livres entre o fim de uma atividade e o começo da seguinte (null se faltar horário)
export function slack(a, b) {
  const end = a.end || a.start;
  if (!end || !b.start || (a.end_day && a.end_day !== a.day)) return null;
  return toMin(b.start) - toMin(end);
}

export const gmapsDirections = (a, b, mode) => `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&travelmode=${mode === 'foot' ? 'walking' : mode === 'car' ? 'driving' : 'transit'}`;
