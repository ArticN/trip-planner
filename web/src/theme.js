// aparência do app: modo claro/escuro, cor de destaque, papel, letras, cantos e tamanho do texto.
// Tudo vira atributos e variáveis CSS no <html>; a escolha fica salva no navegador.
const KEY = 'trip-planner-look';
const OLD_KEY = 'trip-planner-theme';

// cada cor tem uma versão para o fundo escuro e outra mais fechada para o claro (contraste ≥ 4,5:1 com o papel)
export const ACCENTS = [
  { id: 'ambar', name: 'Âmbar', dark: '#f2b33d', light: '#9a5f0e' },
  { id: 'laca', name: 'Laca', dark: '#f0806c', light: '#b83a26' },
  { id: 'matcha', name: 'Matcha', dark: '#a3d16f', light: '#4a7310' },
  { id: 'mar', name: 'Mar', dark: '#62b0ea', light: '#1a659b' },
  { id: 'jade', name: 'Jade', dark: '#5fd0c0', light: '#0f766e' },
  { id: 'glicinia', name: 'Glicínia', dark: '#b9a3f5', light: '#6a4bbf' },
  { id: 'sakura', name: 'Sakura', dark: '#f59fc6', light: '#b23a72' },
];

export const PAPERS = [
  { id: 'quente', name: 'Papel', hint: 'tons quentes, de caderno', dark: ['#0e0d0c', '#181716'], light: ['#faf7f2', '#ffffff'] },
  { id: 'grafite', name: 'Grafite', hint: 'cinza neutro, sem tinta', dark: ['#0d0e10', '#17181b'], light: ['#f6f7f8', '#ffffff'] },
  { id: 'noite', name: 'Noite', hint: 'azul profundo', dark: ['#0b0f1a', '#131a29'], light: ['#f3f5fa', '#ffffff'] },
];

// pares de letras: "display" é a dos títulos, "text" a do resto
export const TYPES = [
  { id: 'editorial', name: 'Editorial', display: "'Instrument Serif', Georgia, serif", text: "'Instrument Sans', system-ui, sans-serif", css: 'family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif' },
  { id: 'classica', name: 'Clássica', display: "'Fraunces', Georgia, serif", text: "'Source Sans 3', system-ui, sans-serif", css: 'family=Fraunces:opsz,wght@9..144,400&family=Source+Sans+3:wght@400;500;600' },
  { id: 'moderna', name: 'Moderna', display: "'Bricolage Grotesque', system-ui, sans-serif", text: "'Figtree', system-ui, sans-serif", css: 'family=Bricolage+Grotesque:opsz,wght@12..96,400&family=Figtree:wght@400;500;600' },
  { id: 'amigavel', name: 'Amigável', display: "'Nunito', system-ui, sans-serif", text: "'Nunito', system-ui, sans-serif", css: 'family=Nunito:wght@400;500;600;700' },
  { id: 'sistema', name: 'Do aparelho', display: 'ui-serif, Georgia, serif', text: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", css: null },
];

export const CORNERS = [
  { id: 'redondo', name: 'Redondos' },
  { id: 'suave', name: 'Suaves' },
  { id: 'reto', name: 'Retos' },
];

export const SIZES = [
  { id: 'p', name: 'Menor', zoom: 0.92 },
  { id: 'm', name: 'Normal', zoom: 1 },
  { id: 'g', name: 'Maior', zoom: 1.1 },
];

export const DEFAULT_LOOK = { mode: 'dark', accent: 'ambar', paper: 'quente', type: 'editorial', corners: 'redondo', size: 'm' };
const isHex = (c) => /^#[0-9a-f]{6}$/i.test(c || '');

export function getLook() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || 'null') || {};
    const old = localStorage.getItem(OLD_KEY);
    if (!saved.mode && old) saved.mode = old === 'light' ? 'light' : 'dark';
  } catch { /* sem armazenamento: usa o padrão */ }
  const look = { ...DEFAULT_LOOK, ...saved };
  if (!['auto', 'light', 'dark'].includes(look.mode)) look.mode = 'dark';
  if (!isHex(look.accent) && !ACCENTS.some((a) => a.id === look.accent)) look.accent = 'ambar';
  for (const [k, list] of [['paper', PAPERS], ['type', TYPES], ['corners', CORNERS], ['size', SIZES]]) {
    if (!list.some((x) => x.id === look[k])) look[k] = DEFAULT_LOOK[k];
  }
  return look;
}

const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
const resolve = (mode) => (mode === 'auto' ? (media?.matches ? 'light' : 'dark') : mode);

// tema efetivo (claro ou escuro), usado pelo mapa
export function getTheme() { return resolve(getLook().mode); }

// cor própria de uma viagem aberta (vale por cima da cor do app enquanto a viagem estiver na tela)
let tripAccent = null;
export function setTripAccent(c) { tripAccent = isHex(c) ? c : null; applyTheme(); }

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const lum = (c) => {
  const [r, g, b] = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

// cor livre: escurece (no claro) ou clareia (no escuro) até ler bem sobre o papel, 4,5:1 como pede o WCAG
function readable(hex, theme) {
  const bg = theme === 'light' ? [250, 247, 242] : [14, 13, 12];
  const to = theme === 'light' ? [0, 0, 0] : [255, 255, 255];
  const base = rgb(hex);
  for (let k = 0; k <= 1; k += 0.05) {
    const c = base.map((v, i) => v + (to[i] - v) * k);
    if (contrast(c, bg) >= 4.5) return toHex(c);
  }
  return toHex(to);
}

function accentFor(choice, theme) {
  const preset = ACCENTS.find((a) => a.id === choice || a.dark === choice);
  return preset ? preset[theme] : readable(choice, theme);
}
export const accentSwatch = (choice) => ACCENTS.find((a) => a.id === choice)?.dark || choice;

let loadedFonts = '';
function loadFonts(type) {
  if (!type.css || loadedFonts.includes(type.id)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${type.css}&display=swap`;
  document.head.appendChild(link);
  loadedFonts += ` ${type.id}`;
}

// a prévia do painel Aparência mostra cada par de letras com a própria letra
export function loadAllFonts() { TYPES.forEach(loadFonts); }

export function applyTheme(look = getLook()) {
  const t = resolve(look.mode);
  const root = document.documentElement;
  root.dataset.theme = t;
  root.dataset.paper = look.paper;
  root.dataset.corners = look.corners;
  const type = TYPES.find((x) => x.id === look.type) || TYPES[0];
  loadFonts(type);
  root.style.setProperty('--serif', type.display);
  root.style.setProperty('--sans', type.text);
  root.style.setProperty('--accent', accentFor(tripAccent || look.accent, t));
  root.style.setProperty('--zoom', String(SIZES.find((x) => x.id === look.size)?.zoom || 1));
  const paper = PAPERS.find((p) => p.id === look.paper) || PAPERS[0];
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', paper[t][0]);
  window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
}

export function saveLook(patch) {
  const look = { ...getLook(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(look)); } catch { /* vale só nesta sessão */ }
  applyTheme(look);
  return look;
}

export function resetLook() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch { /* nada salvo */ }
  applyTheme({ ...DEFAULT_LOOK });
  return { ...DEFAULT_LOOK };
}

media?.addEventListener?.('change', () => { if (getLook().mode === 'auto') applyTheme(); });

// cor de destaque efetiva, para desenhos fora do CSS (rotas do mapa)
export function accentColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f2b33d';
}
