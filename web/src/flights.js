import airportsUrl from './airports.json?url';

// voos: aeroportos de saída, escalas e chegada e o arco de grande círculo entre eles (o caminho mais curto
// sobre a Terra, não a rota real do avião). Aeroportos do OurAirports embutidos no app (scripts/airports.mjs)

let airportsP = null;
export const loadAirports = () => (airportsP ||= fetch(airportsUrl).then((r) => r.json()).catch((e) => { airportsP = null; throw e; }));

// cidades que costumam ser escala, pelo nome em português ou inglês → aeroporto principal
// (para ler "Guarulhos (GRU) → Zurique → Narita (NRT)" sem precisar preencher o campo Escalas)
const HUBS = {
  zurique: 'ZRH', zurich: 'ZRH', frankfurt: 'FRA', munique: 'MUC', munich: 'MUC', paris: 'CDG', londres: 'LHR', london: 'LHR',
  amsterda: 'AMS', amsterdam: 'AMS', lisboa: 'LIS', lisbon: 'LIS', madri: 'MAD', madrid: 'MAD', roma: 'FCO', rome: 'FCO',
  milao: 'MXP', milan: 'MXP', viena: 'VIE', vienna: 'VIE', genebra: 'GVA', geneva: 'GVA', bruxelas: 'BRU', brussels: 'BRU',
  copenhague: 'CPH', copenhagen: 'CPH', helsinque: 'HEL', helsinki: 'HEL', istambul: 'IST', istanbul: 'IST', atenas: 'ATH', athens: 'ATH',
  dubai: 'DXB', doha: 'DOH', 'abu dhabi': 'AUH', 'adis abeba': 'ADD', 'addis abeba': 'ADD', 'addis ababa': 'ADD', joanesburgo: 'JNB', johannesburg: 'JNB',
  seul: 'ICN', seoul: 'ICN', pequim: 'PEK', beijing: 'PEK', xangai: 'PVG', shanghai: 'PVG', 'hong kong': 'HKG', taipei: 'TPE',
  singapura: 'SIN', singapore: 'SIN', bangcoc: 'BKK', bangkok: 'BKK', toquio: 'NRT', tokyo: 'NRT', narita: 'NRT', haneda: 'HND', osaka: 'KIX',
  'nova york': 'JFK', 'nova iorque': 'JFK', 'new york': 'JFK', newark: 'EWR', miami: 'MIA', atlanta: 'ATL', houston: 'IAH', dallas: 'DFW',
  chicago: 'ORD', 'los angeles': 'LAX', 'sao francisco': 'SFO', 'san francisco': 'SFO', toronto: 'YYZ', 'cidade do mexico': 'MEX', 'mexico city': 'MEX',
  panama: 'PTY', 'cidade do panama': 'PTY', bogota: 'BOG', lima: 'LIM', santiago: 'SCL', 'buenos aires': 'EZE',
  guarulhos: 'GRU', 'sao paulo': 'GRU', 'rio de janeiro': 'GIG', galeao: 'GIG',
};
const norm = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/^\s*(aeroporto( internacional)? de|airport)\s+/, '').replace(/\s+/g, ' ').trim();
// código de um pedaço do texto: "(ZRH)", "ZRH" ou o nome da cidade
function codeOf(part, airports) {
  const m = part.match(/\(([A-Z]{3})\)/) || part.match(/\b([A-Z]{3})\b/);
  if (m && airports[m[1]]) return m[1];
  return HUBS[norm(part)] || null;
}

// códigos do trecho: saída, escalas e chegada. As escalas vêm do campo Escalas; sem ele, do texto
// do voo (local ou título com setas, como "Guarulhos (GRU) → Zurique → Narita (NRT)")
export function flightCodes(a, airports) {
  const own = (c) => String(c || '').trim().toUpperCase();
  let from = own(a.from_code);
  let to = own(a.to_code);
  let via = String(a.via || '').toUpperCase().split(/[^A-Z]+/);
  let guessed = false;
  if (!a.via || !airports[from] || !airports[to]) {
    for (const t of [a.location, a.title]) {
      const parts = String(t || '').split(/\s*(?:→|->)\s*/).filter(Boolean);
      if (parts.length < 2) continue;
      const codes = parts.map((x) => codeOf(x, airports));
      if (!airports[from] && codes[0]) from = codes[0];
      if (!airports[to] && codes[codes.length - 1]) to = codes[codes.length - 1];
      if (!a.via && parts.length > 2) { via = codes.slice(1, -1).filter(Boolean); guessed = via.length > 0; }
      break;
    }
  }
  const codes = [from, ...via, to].filter((c) => /^[A-Z]{3}$/.test(c)).filter((c, i, l) => c !== l[i - 1]);
  return { codes, guessed };
}

export const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const vec = (p) => [Math.cos(rad(p.lat)) * Math.cos(rad(p.lng)), Math.cos(rad(p.lat)) * Math.sin(rad(p.lng)), Math.sin(rad(p.lat))];
// pontos do arco de grande círculo entre a e b (interpolação esférica)
export function arc(a, b, n = 64) {
  const u = vec(a);
  const v = vec(b);
  const w = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2])));
  if (w < 1e-6) return [[a.lng, a.lat], [b.lng, b.lat]];
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s1 = Math.sin((1 - t) * w) / Math.sin(w);
    const s2 = Math.sin(t * w) / Math.sin(w);
    const x = s1 * u[0] + s2 * v[0];
    const y = s1 * u[1] + s2 * v[1];
    const z = s1 * u[2] + s2 * v[2];
    out.push([deg(Math.atan2(y, x)), deg(Math.atan2(z, Math.hypot(x, y)))]);
  }
  return out;
}

// trajeto pronto para desenhar: os aeroportos e os arcos entre eles, com a longitude contínua
// (um voo que cruza o Pacífico não dá a volta no mapa: a longitude passa de 180° em vez de pular para -180°)
export function flightRoute(a, airports) {
  if (!airports) return null;
  const { codes, guessed } = flightCodes(a, airports);
  const stops = codes.map((c) => (airports[c] ? { code: c, lat: airports[c][0], lng: airports[c][1], city: airports[c][2] } : null));
  const pts = stops.filter(Boolean);
  if (pts.length < 2) return null;
  let prev = null;
  const unwrap = (lng) => {
    let x = lng;
    if (prev != null) while (x - prev > 180) x -= 360;
    if (prev != null) while (x - prev < -180) x += 360;
    prev = x;
    return x;
  };
  const legs = [];
  const dots = [];
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) legs.push(arc(pts[i - 1], pts[i]).map(([x, y], j) => [j === 0 ? prev : unwrap(x), y]));
    else unwrap(pts[0].lng);
    dots.push({ ...pts[i], x: prev, end: i === 0 || i === pts.length - 1 });
  }
  return { dots, legs, guessed, missing: codes.filter((c, i) => !stops[i]) };
}
