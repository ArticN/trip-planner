// busca de lugares numa área (círculo) do mapa: tudo o que o OpenStreetMap tem ali, via Overpass
// (grátis, sem chave). Uma pergunta só traz todas as categorias; os filtros da lista são feitos aqui.

// categorias da lista: o filtro do Overpass (sem o recorte do círculo) e quantos lugares trazer no máximo
export const AREA_CATS = [
  { key: 'food', label: 'Comida', kind: 'food', color: '#e0785a', limit: 300, q: ['nwr["amenity"~"^(restaurant|fast_food|food_court)$"]["name"]'] },
  { key: 'cafe', label: 'Cafés e doces', kind: 'food', color: '#b4875a', limit: 150, q: ['nwr["amenity"~"^(cafe|ice_cream)$"]["name"]', 'nwr["shop"~"^(bakery|pastry|confectionery|tea|coffee)$"]["name"]'] },
  { key: 'sight', label: 'Atrações', kind: 'sight', color: '#5a8de0', limit: 150, q: ['nwr["tourism"~"^(attraction|museum|gallery|viewpoint|zoo|aquarium|theme_park)$"]["name"]', 'nwr["historic"~"^(castle|monument|memorial|ruins|archaeological_site|city_gate)$"]["name"]'] },
  { key: 'temple', label: 'Templos', kind: 'sight', color: '#c05a8d', limit: 150, q: ['nwr["amenity"="place_of_worship"]["name"]'] },
  { key: 'park', label: 'Parques', kind: 'sight', color: '#4fa36b', limit: 100, q: ['nwr["leisure"~"^(park|garden|nature_reserve)$"]["name"]'] },
  { key: 'shop', label: 'Compras', kind: 'shop', color: '#9a6ad6', limit: 200, q: ['nwr["shop"~"^(mall|department_store|gift|books|clothes|anime|games|toys|second_hand|variety_store|electronics|cosmetics|craft|art|music|video_games|fashion_accessories|shoes)$"]["name"]', 'nwr["amenity"="marketplace"]["name"]'] },
  { key: 'night', label: 'Bares e noite', kind: 'food', color: '#d6a53a', limit: 150, q: ['nwr["amenity"~"^(bar|pub|nightclub|karaoke_box)$"]["name"]'] },
];
export const CAT = Object.fromEntries(AREA_CATS.map((c) => [c.key, c]));
export const RADII = [300, 500, 1000, 2000, 5000];

// a pergunta ao Overpass: cada categoria sai com o seu limite (senão restaurantes tomam a lista toda)
export function areaQuery(center, radius) {
  const around = `(around:${Math.round(radius)},${center.lat.toFixed(5)},${center.lng.toFixed(5)})`;
  const parts = AREA_CATS.map((c) => `(${c.q.map((s) => `${s}${around};`).join('')});out center tags ${c.limit};`);
  return `[out:json][timeout:25];${parts.join('')}`;
}

// de que categoria é um lugar, pelas etiquetas do OpenStreetMap
export function catOf(t) {
  const a = t.amenity;
  if (/^(restaurant|fast_food|food_court)$/.test(a)) return 'food';
  if (/^(cafe|ice_cream)$/.test(a) || /^(bakery|pastry|confectionery|tea|coffee)$/.test(t.shop)) return 'cafe';
  if (/^(bar|pub|nightclub|karaoke_box)$/.test(a)) return 'night';
  if (a === 'place_of_worship') return 'temple';
  if (t.tourism || t.historic) return 'sight';
  if (t.leisure) return 'park';
  if (t.shop || a === 'marketplace') return 'shop';
  return null;
}

const TYPE = {
  restaurant: 'Restaurante', fast_food: 'Lanchonete', food_court: 'Praça de alimentação', cafe: 'Café', ice_cream: 'Sorveteria',
  bakery: 'Padaria', pastry: 'Doceria', confectionery: 'Doces', tea: 'Casa de chá', coffee: 'Café em grãos',
  bar: 'Bar', pub: 'Pub', nightclub: 'Balada', karaoke_box: 'Karaokê', marketplace: 'Mercado',
  attraction: 'Atração', museum: 'Museu', gallery: 'Galeria', viewpoint: 'Mirante', zoo: 'Zoológico', aquarium: 'Aquário', theme_park: 'Parque temático',
  castle: 'Castelo', monument: 'Monumento', memorial: 'Memorial', ruins: 'Ruínas', archaeological_site: 'Sítio arqueológico', city_gate: 'Portão histórico',
  park: 'Parque', garden: 'Jardim', nature_reserve: 'Reserva natural',
  mall: 'Shopping', department_store: 'Loja de departamentos', gift: 'Presentes e lembranças', books: 'Livraria', clothes: 'Roupas', anime: 'Anime e mangá',
  games: 'Jogos', video_games: 'Videogames', toys: 'Brinquedos', second_hand: 'Brechó', variety_store: 'Variedades', electronics: 'Eletrônicos',
  cosmetics: 'Cosméticos', craft: 'Artesanato', art: 'Arte', music: 'Música', fashion_accessories: 'Acessórios', shoes: 'Calçados',
};
const RELIGION = { buddhist: 'Templo budista', shinto: 'Santuário xintoísta', christian: 'Igreja', muslim: 'Mesquita', jewish: 'Sinagoga', hindu: 'Templo hindu' };
const CUISINE = {
  japanese: 'japonesa', italian: 'italiana', chinese: 'chinesa', korean: 'coreana', indian: 'indiana', thai: 'tailandesa', french: 'francesa',
  vietnamese: 'vietnamita', mexican: 'mexicana', american: 'americana', burger: 'hambúrguer', coffee_shop: 'café', noodle: 'macarrão',
  seafood: 'frutos do mar', regional: 'regional', vegetarian: 'vegetariana', vegan: 'vegana', chicken: 'frango', steak_house: 'carnes',
  sandwich: 'sanduíche', dessert: 'sobremesa', cake: 'bolos', donut: 'donuts', crepe: 'crepe', fish: 'peixe', meat: 'carnes', beef_bowl: 'gyudon',
};

// "Restaurante · ramen", "Santuário xintoísta", "Museu"
export function typeLabel(t) {
  if (t.amenity === 'place_of_worship') return RELIGION[t.religion] || 'Templo';
  const v = t.amenity || t.tourism || t.historic || t.leisure || t.shop;
  const base = TYPE[v] || (v ? v.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : 'Lugar');
  const cuisine = (t.cuisine || '').split(';')[0].trim();
  return cuisine && /restaurant|fast_food|cafe|bar|pub/.test(v) ? `${base} · ${CUISINE[cuisine] || cuisine.replace(/_/g, ' ')}` : base;
}

// endereço com o que tiver: rua e número, quadra (Japão: block_number-housenumber), bairro e cidade
export function addressOf(t) {
  if (t['addr:full']) return t['addr:full'];
  const num = t['addr:housenumber'];
  const street = t['addr:street'] ? [t['addr:street'], num].filter(Boolean).join(' ') : '';
  const block = !street && t['addr:block_number'] ? [t['addr:block_number'], num].filter(Boolean).join('-') : '';
  const area = t['addr:neighbourhood'] || t['addr:quarter'] || t['addr:suburb'] || '';
  const city = t['addr:city'] || '';
  const first = street || (block && area ? `${area} ${block}` : block);
  return [first, area && !first.includes(area) ? area : '', city].filter(Boolean).join(', ');
}

export function metersBetween(a, b) {
  const k = Math.PI / 180;
  const x = (b.lng - a.lng) * k * Math.cos(((a.lat + b.lat) / 2) * k);
  const y = (b.lat - a.lat) * k;
  return Math.sqrt(x * x + y * y) * 6371000;
}
export const fmtMeters = (m) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`);
export const fmtRadius = (m) => (m < 1000 ? `${m} m` : `${m / 1000} km`);

// pontos de "destaque": o OpenStreetMap não tem notas como o Google, então conta o que indica um lugar
// conhecido (tem página na Wikipédia/Wikidata, é atração turística) e um cadastro caprichado (site, horário)
export function highlightScore(t) {
  let s = 0;
  if (t.wikidata || t.wikipedia) s += 3;
  if (/^(attraction|museum|viewpoint|theme_park|zoo|aquarium)$/.test(t.tourism)) s += 1;
  if (t.heritage || t['heritage:operator']) s += 1;
  if (t.website || t['contact:website']) s += 0.5;
  if (t.opening_hours) s += 0.3;
  if (t['name:en']) s += 0.3;
  return s;
}

// resposta do Overpass → lista de lugares dentro do círculo, sem repetidos, com a categoria e a distância
export function parseArea(json, center, radius) {
  const seen = new Set();
  const count = {};
  const out = [];
  for (const e of json?.elements || []) {
    const t = e.tags || {};
    const lat = e.lat ?? e.center?.lat;
    const lng = e.lon ?? e.center?.lon;
    const id = `${e.type}${e.id}`;
    if (lat == null || lng == null || seen.has(id)) continue;
    seen.add(id);
    const cat = catOf(t);
    if (!cat) continue;
    count[cat] = (count[cat] || 0) + 1;
    const local = t.name || '';
    const name = t['name:pt'] || t['name:en'] || t['name:ja-Latn'] || t['name:ja_rm'] || local;
    if (!name) continue;
    const d = metersBetween(center, { lat, lng });
    if (d > radius * 1.02) continue; // parques grandes: o centro pode cair fora do círculo
    const score = highlightScore(t);
    out.push({
      id, cat, name, local: local && local !== name ? local : '',
      lat: +lat.toFixed(6), lng: +lng.toFixed(6), d, score, star: score >= 3,
      type: typeLabel(t), address: addressOf(t),
      hours: t.opening_hours || '', website: t.website || t['contact:website'] || '',
    });
  }
  // a categoria que bateu o limite tem mais lugares do que a lista mostra
  const capped = AREA_CATS.filter((c) => (count[c.key] || 0) >= c.limit).map((c) => c.key);
  return { places: out, capped };
}

// ordem da lista: "destaques" (mais conhecidos primeiro, perto desempata) ou "perto" (só distância)
export function sortPlaces(list, by, radius) {
  const r = Math.max(radius || 1000, 300);
  const rank = (p) => p.score - (p.d / r) * 1.5;
  return [...list].sort(by === 'near' ? (a, b) => a.d - b.d : (a, b) => rank(b) - rank(a) || a.d - b.d);
}

const SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

// busca os lugares da área; tenta o segundo servidor quando o primeiro está cheio ou fora do ar
export async function fetchArea(center, radius, { signal } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('sem internet');
  const body = new URLSearchParams({ data: areaQuery(center, radius) });
  let last = null;
  for (const url of SERVERS) {
    try {
      const r = await fetch(url, { method: 'POST', body, signal });
      if (r.ok) return parseArea(await r.json(), center, radius);
      last = new Error(r.status === 429 ? 'muitas buscas seguidas, espere alguns segundos' : r.status === 504 ? 'o servidor do OpenStreetMap está ocupado, tente de novo' : `HTTP ${r.status}`);
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      last = e;
    }
  }
  throw last || new Error('falhou');
}
