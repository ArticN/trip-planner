import L from 'leaflet';
import { getTheme } from './theme.js';

// Mapa-base vetorial do OpenFreeMap (grátis, sem chave): permite escolher o idioma dos rótulos.
const STYLE = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
  // "Detalhado": o estilo mais completo do OpenFreeMap, com ícones de lojas, restaurantes e atrações e prédios
  detail: 'https://tiles.openfreemap.org/styles/liberty',
};
const styleFor = (variant, theme) => (variant === 'detail' ? STYLE.detail : STYLE[theme]);
// nome em português; senão inglês; senão a escrita latina; só então o nome local (kanji etc.)
const NAME = ['coalesce', ['get', 'name:pt'], ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']];
const ATTR = '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

export const osmLayer = () => L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap', className: 'osm-tiles' });

function relabel(gl) {
  for (const layer of gl.getStyle().layers || []) {
    if (layer.type !== 'symbol') continue;
    const field = gl.getLayoutProperty(layer.id, 'text-field');
    if (field && JSON.stringify(field).includes('name')) gl.setLayoutProperty(layer.id, 'text-field', NAME);
  }
}

// Camada "Mapa": carrega o MapLibre só quando é usada; se o estilo não carregar, cai no OpenStreetMap comum.
export function translatedBasemap(variant = 'clean') {
  const group = L.layerGroup();
  let inner = null;
  let onTheme = null;
  // cada vez que a camada entra no mapa ganha um número; se ela sair antes do MapLibre terminar de
  // carregar (trocar de camada rápido, ou o React montar duas vezes no modo dev), o carregamento antigo
  // desiste em vez de criar um mapa solto e deixar a camada presa no OpenStreetMap
  let gen = 0;
  const fallback = (g = gen) => {
    if (g !== gen) return;
    if (inner) group.removeLayer(inner);
    inner = osmLayer();
    group.addLayer(inner);
  };
  group.on('add', async () => {
    if (inner) return;
    const g = ++gen;
    try {
      const [maplibregl, { default: workerUrl }] = await Promise.all([
        import('maplibre-gl'),
        import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'), // o Vite empacota o worker num arquivo só
        import('maplibre-gl/dist/maplibre-gl.css'),
      ]);
      maplibregl.setWorkerUrl(workerUrl);
      await import('@maplibre/maplibre-gl-leaflet');
      if (!L.maplibreGL) throw new Error('plugin do MapLibre não carregou');
      if (g !== gen) return;
      let theme = getTheme();
      let loaded = false;
      inner = L.maplibreGL({
        style: styleFor(variant, theme), attribution: ATTR, maplibregl,
        // mais leve: sem cópias do mundo lado a lado, sem animação de fade dos rótulos,
        // resolução no máximo 2x (telas 3x desenham 2,25x mais pixels sem ganho visível) e cache de tiles menor
        renderWorldCopies: false, fadeDuration: 0, pixelRatio: Math.min(window.devicePixelRatio || 1, 2), maxTileCacheSize: 120,
      });
      group.addLayer(inner);
      const gl = inner.getMaplibreMap();
      gl.on('style.load', () => { loaded = true; relabel(gl); });
      gl.on('error', (e) => { if (!loaded) { console.warn('mapa traduzido indisponível, usando OpenStreetMap', e?.error); fallback(g); } });
      setTimeout(() => { if (!loaded) fallback(g); }, 10000);
      onTheme = () => { const t = getTheme(); if (t !== theme && loaded) { theme = t; if (variant !== 'detail') gl.setStyle(STYLE[t]); } };
      window.addEventListener('themechange', onTheme);
    } catch (e) {
      if (g !== gen) return;
      console.warn('mapa traduzido indisponível, usando OpenStreetMap', e);
      fallback(g);
    }
  });
  group.on('remove', () => { gen++; if (onTheme) window.removeEventListener('themechange', onTheme); onTheme = null; if (inner) group.removeLayer(inner); inner = null; });
  return group;
}
