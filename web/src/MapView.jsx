import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KINDS, esc, hasCoords, haversine, fmtKm } from './util.js';
import { translatedBasemap, osmLayer } from './basemap.js';
import { accentColor } from './theme.js';
import { iconSvg } from './icons.jsx';

const WORLD_CENTER = [20, 0];
const BASE_KEY = 'trip-planner-basemap';

const BASES = [
  { key: 'map', name: 'Mapa', hint: 'nomes em português', icon: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /> },
  { key: 'local', name: 'Nomes locais', hint: 'como nas placas', icon: <path d="M4 6h16M4 12h10M4 18h7M17 14l3 6M20 14l-3 6" /> },
  { key: 'topo', name: 'Relevo', hint: 'trilhas e montanhas', icon: <path d="m3 19 6-10 4 6 2-3 6 7H3z" /> },
  { key: 'sat', name: 'Satélite', hint: 'foto aérea', icon: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16" /></> },
];

function LayerIcon({ children, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

function BasePicker({ value, onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  const cur = BASES.find((b) => b.key === value) || BASES[0];
  return (
    <div className="base-pick" ref={ref}>
      <button className="base-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`Tipo de mapa: ${cur.name}`} title="Tipo de mapa">
        <LayerIcon><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 13 9 5 9-5" /></LayerIcon>
      </button>
      {open && (
        <div className="base-pop" role="menu" aria-label="Tipo de mapa">
          {BASES.map((b) => (
            <button key={b.key} role="menuitemradio" aria-checked={b.key === value} className={b.key === value ? 'on' : ''} onClick={() => { onPick(b.key); setOpen(false); }}>
              <span className="base-ic"><LayerIcon size={20}>{b.icon}</LayerIcon></span>
              <span><b>{b.name}</b><small>{b.hint}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// região da viagem (cidades, hospedagens e atividades), com um tamanho mínimo de ~60 km
function regionOf(cities, stays, items) {
  // voos ficam de fora: o aeroporto de origem (ex.: Guarulhos) não faz parte da região da viagem
  const pts = [...cities.filter((c) => c.key !== 'transito'), ...stays, ...items.filter((a) => a.kind !== 'flight')].filter(hasCoords);
  if (!pts.length) return null;
  let b = L.latLngBounds(pts.map((p) => [p.lat, p.lng]));
  const c = b.getCenter();
  const min = 0.3;
  if (b.getNorth() - b.getSouth() < min * 2 || b.getEast() - b.getWest() < min * 2) {
    b = b.extend([c.lat - min, c.lng - min]).extend([c.lat + min, c.lng + min]);
  }
  return b;
}

function bearing(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function pinIcon(label, color, selected, kind) {
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin${selected ? ' sel' : ''}" style="--c:${color}" title="${esc(kind || '')}"><span>${label}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 36],
    popupAnchor: [0, -38],
  });
}

function labelIcon(html, cls) {
  return L.divIcon({ className: `lbl-wrap ${cls || ''}`, html, iconSize: null });
}

// espalha marcadores que caem exatamente no mesmo ponto
function jitterMap(items) {
  const groups = new Map();
  items.forEach((it) => {
    const k = `${it.lat.toFixed(4)},${it.lng.toFixed(4)}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it.id);
  });
  const off = new Map();
  groups.forEach((ids) => {
    if (ids.length < 2) return;
    ids.forEach((id, i) => {
      const ang = (i / ids.length) * Math.PI * 2;
      off.set(id, [Math.sin(ang) * 0.00022, Math.cos(ang) * 0.00028]);
    });
  });
  return off;
}

export default function MapView({
  mode, items, stays, cities, stayByDay, selectedId, onSelect, onEdit, editPositions, onMove,
  picking, onPick, flyTarget, fitKey, cityFocus, showStays, labelNumbers, ideas = [], onIdea, centerRef, onBackground,
}) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markersRef = useRef(new Map());
  const cb = useRef({});
  cb.current = { onSelect, onEdit, onMove, onPick, picking, onIdea, onBackground };
  const lastFit = useRef(null);
  const declutterRef = useRef(null);
  // tipo de mapa: botão próprio (o controle do Leaflet ficava atrás da barra da rota)
  const basesRef = useRef({});
  const [baseKey, setBaseKey] = useState(() => { try { return localStorage.getItem(BASE_KEY) || 'map'; } catch { return 'map'; } });
  const pickBase = (k) => {
    const map = mapRef.current;
    const bases = basesRef.current;
    if (!map || !bases[k]) return;
    Object.values(bases).forEach((l) => { if (map.hasLayer(l)) map.removeLayer(l); });
    bases[k].addTo(map);
    setBaseKey(k);
    try { localStorage.setItem(BASE_KEY, k); } catch { /* vale só agora */ }
  };
  // a rota usa a cor de destaque escolhida em Aparência: redesenha quando ela muda
  const [look, setLook] = useState(0);
  useEffect(() => {
    const on = () => setLook((n) => n + 1);
    window.addEventListener('themechange', on);
    return () => window.removeEventListener('themechange', on);
  }, []);

  // ── cria o mapa uma vez
  useEffect(() => {
    // pontos e linhas em canvas (um só desenho) em vez de um elemento por ponto
    const map = L.map(elRef.current, { zoomControl: false, preferCanvas: true, maxBoundsViscosity: 0.7 });
    // já abre na região da viagem: o mapa nunca carrega o mundo inteiro
    const region = regionOf(cities, stays, cities.length ? [] : items);
    if (region) map.fitBounds(region, { animate: false, padding: [40, 40] }); else map.setView(WORLD_CENTER, 2);
    elRef.current._leaflet_map = map; // usado nos testes
    const base = translatedBasemap(); // rótulos em português/inglês em vez de kanji etc.
    const osm = osmLayer();
    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '© OpenTopoMap' });
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Esri' });
    // no tema escuro o CSS inverte os tiles do OpenStreetMap (.osm-tiles)
    basesRef.current = { map: base, local: osm, topo, sat };
    (basesRef.current[baseKey] || base).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.on('click', (e) => { if (cb.current.picking) cb.current.onPick?.(e.latlng.lat, e.latlng.lng); else cb.current.onBackground?.(); });
    mapRef.current = map;
    if (centerRef) centerRef.current = () => { const c = map.getCenter(); return { lat: c.lat, lng: c.lng, zoom: map.getZoom() }; };
    setTimeout(() => map.invalidateSize(), 50);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(elRef.current);
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const c = mapRef.current?.getContainer();
    if (c) c.classList.toggle('picking', !!picking);
  }, [picking]);

  // "recorte": dá para navegar só em volta da região da viagem e não afastar até o mundo inteiro,
  // então o mapa-base só baixa e desenha os trechos dessa área
  const regionKey = cities.filter(hasCoords).map((c) => `${c.lat.toFixed(2)},${c.lng.toFixed(2)}`).join('|');
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const region = regionOf(cities, stays, cities.length ? [] : items);
    if (!region) { map.setMaxBounds(null); map.setMinZoom(0); return; }
    map.setMaxBounds(region.pad(1.2));
    map.setMinZoom(Math.max(2, map.getBoundsZoom(region.pad(0.8)) - 1));
  }, [regionKey]);

  // ── redesenha camadas quando os dados mudam
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const group = layerRef.current;
    group.clearLayers();
    markersRef.current = new Map();
    const bounds = [];
    const cityMap = Object.fromEntries(cities.map((c) => [c.key, c]));
    const route = accentColor();

    if (mode === 'day') {
      const pts = items.filter(hasCoords);
      const jit = editPositions ? new Map() : jitterMap(pts);
      pts.forEach((a) => {
        const kcolor = (KINDS[a.kind] || KINDS.sight).color;
        const [dy, dx] = jit.get(a.id) || [0, 0];
        const m = L.marker([a.lat + dy, a.lng + dx], {
          icon: pinIcon(labelNumbers ? esc(a.n) : iconSvg(KINDS[a.kind] ? a.kind : 'sight', 15, 2.2), kcolor, a.id === selectedId, KINDS[a.kind]?.label),
          draggable: !!editPositions,
          zIndexOffset: a.id === selectedId ? 1000 : 0,
        });
        m.on('click', () => cb.current.onSelect?.(a.id));
        m.on('dragend', () => { const p = m.getLatLng(); cb.current.onMove?.(a.id, p.lat, p.lng); });
        m.addTo(group);
        markersRef.current.set(a.id, m);
        bounds.push([a.lat, a.lng]);
      });
      // trajeto
      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i];
        const q = pts[i + 1];
        const isTransit = p.kind === 'move' || q.kind === 'move' || p.kind === 'flight' || q.kind === 'flight';
        const km = haversine(p, q);
        if (km < 0.03) continue;
        L.polyline([[p.lat, p.lng], [q.lat, q.lng]], {
          color: isTransit ? '#b4b1ab' : route, weight: isTransit ? 2.5 : 3.5, opacity: 0.85,
          dashArray: isTransit ? '2 8' : null, lineCap: 'round',
        }).bindTooltip(`${fmtKm(km)} em linha reta`, { sticky: true }).addTo(group);
        if (km > 0.15) {
          const mid = { lat: (p.lat + q.lat) / 2, lng: (p.lng + q.lng) / 2 };
          L.marker([mid.lat, mid.lng], {
            interactive: false, keyboard: false,
            icon: L.divIcon({ className: 'arrow-wrap', html: `<div class="arrow" style="transform:rotate(${bearing(p, q)}deg)">▲</div>`, iconSize: [14, 14], iconAnchor: [7, 7] }),
          }).addTo(group);
        }
      }
      // hospedagem do dia
      const st = showStays && stayByDay ? stayByDay : null;
      if (st && hasCoords(st)) {
        L.marker([st.lat, st.lng], { icon: labelIcon('H', 'stay-lbl') }).bindTooltip(st.name).addTo(group);
        bounds.push([st.lat, st.lng]);
      }
      if (declutterRef.current) { map.off('zoomend', declutterRef.current); declutterRef.current = null; }
    } else {
      // ── visão geral da viagem
      const stayCities = [];
      stays.forEach((s) => { if (!stayCities.length || stayCities[stayCities.length - 1] !== s.city) stayCities.push(s.city); });
      const routePts = stayCities.map((k) => cityMap[k]).filter(hasCoords).map((c) => [c.lat, c.lng]);
      if (routePts.length > 1) {
        L.polyline(routePts, { color: route, weight: 3.5, opacity: 0.9 }).addTo(group);
        for (let i = 0; i < routePts.length - 1; i++) {
          const p = { lat: routePts[i][0], lng: routePts[i][1] };
          const q = { lat: routePts[i + 1][0], lng: routePts[i + 1][1] };
          L.marker([(p.lat + q.lat) / 2, (p.lng + q.lng) / 2], {
            interactive: false,
            icon: L.divIcon({ className: 'arrow-wrap', html: `<div class="arrow big" style="transform:rotate(${bearing(p, q)}deg)">▲</div>`, iconSize: [18, 18], iconAnchor: [9, 9] }),
          }).addTo(group);
        }
      }
      // bate-voltas (cidades sem hospedagem própria)
      const seen = new Set();
      items.forEach((a) => {
        const stay = stays.find((s) => s.check_in <= a.day && a.day < s.check_out);
        if (!stay || !a.city || a.city === stay.city || a.city === 'transito') return;
        const key = `${stay.city}>${a.city}`;
        if (seen.has(key)) return;
        seen.add(key);
        const from = cityMap[stay.city];
        const to = cityMap[a.city];
        if (hasCoords(from) && hasCoords(to)) L.polyline([[from.lat, from.lng], [to.lat, to.lng]], { color: '#b4b1ab', weight: 2.5, opacity: 0.8, dashArray: '6 8' }).addTo(group);
      });
      const cityMarkers = [];
      cities.filter((c) => c.key !== 'transito' && hasCoords(c)).forEach((c) => {
        const n = items.filter((a) => a.city === c.key && a.kind === 'sight').length;
        const m = L.marker([c.lat, c.lng], {
          icon: labelIcon(`<span class="city-dot" style="--c:${esc(c.color)}"><i>${esc(c.emoji)}</i></span><span class="city-name">${esc(c.name)}${n ? ` <b>${n}</b>` : ''}</span>`, 'city-lbl'),
          zIndexOffset: 500,
        });
        m.on('click', () => map.flyTo([c.lat, c.lng], 12, { duration: 0.8 }));
        m.addTo(group);
        cityMarkers.push({ m, n });
        bounds.push([c.lat, c.lng]);
      });
      // pontos das atividades só aparecem de perto; de longe ficam só as cidades
      const detail = L.layerGroup().addTo(group);
      items.filter(hasCoords).forEach((a) => {
        const k = KINDS[a.kind] || KINDS.sight;
        const dot = L.circleMarker([a.lat, a.lng], {
          radius: a.kind === 'sight' ? 6 : 4, color: '#fff', weight: 1.5, fillColor: k.color, fillOpacity: 0.95, bubblingMouseEvents: false,
        });
        dot.on('click', () => cb.current.onSelect?.(a.id));
        dot.addTo(detail);
      });
      // nomes de cidade que se sobrepõem: fica o da cidade com mais pontos turísticos
      const declutter = () => {
        const z = map.getZoom();
        if (z >= 9) { if (!group.hasLayer(detail)) group.addLayer(detail); } else group.removeLayer(detail);
        const kept = [];
        [...cityMarkers].sort((x, y) => y.n - x.n).forEach(({ m }) => {
          const el = m.getElement()?.querySelector('.city-name');
          if (!el) return;
          el.style.visibility = '';
          const r = el.getBoundingClientRect();
          const hit = kept.some((k) => r.left < k.right + 4 && r.right > k.left - 4 && r.top < k.bottom + 2 && r.bottom > k.top - 2);
          if (hit) el.style.visibility = 'hidden'; else kept.push(r);
        });
      };
      if (declutterRef.current) map.off('zoomend', declutterRef.current);
      declutterRef.current = declutter;
      map.on('zoomend', declutter);
      setTimeout(declutter, 0);
      if (showStays) {
        stays.filter(hasCoords).forEach((s) => {
          L.marker([s.lat, s.lng], { icon: labelIcon('H', 'stay-lbl') }).bindTooltip(`${s.name} · ${s.check_in.slice(8)}/${s.check_in.slice(5, 7)}–${s.check_out.slice(8)}/${s.check_out.slice(5, 7)}`).addTo(group);
        });
      }
      // ideias (sem dia): anel vazado, clique abre a ideia
      ideas.filter(hasCoords).forEach((x) => {
        const k = KINDS[x.kind] || KINDS.sight;
        L.circleMarker([x.lat, x.lng], { radius: 7, color: k.color, weight: 2.5, fillColor: '#000', fillOpacity: 0.35, dashArray: '3 3', bubblingMouseEvents: false })
          .bindTooltip(`Ideia · ${x.title}`)
          .on('click', () => cb.current.onIdea?.(x))
          .addTo(group);
      });
    }

    // enquadra o mapa só quando o contexto muda (dia/modo), não a cada edição
    const key = `${mode}|${fitKey}`;
    if (lastFit.current !== key && bounds.length) {
      const first = lastFit.current == null;
      lastFit.current = key;
      if (bounds.length === 1) map.setView(bounds[0], 15, { animate: !first });
      else map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: !first });
    } else if (lastFit.current !== key) {
      lastFit.current = key;
    }

  }, [mode, items, stays, cities, stayByDay, selectedId, editPositions, showStays, fitKey, labelNumbers, ideas, look]);

  useEffect(() => {
    if (flyTarget && mapRef.current) {
      mapRef.current.flyTo([flyTarget.lat, flyTarget.lng], Math.max(mapRef.current.getZoom(), 15), { duration: 0.7 });
    }
  }, [flyTarget?.nonce]);

  useEffect(() => {
    if (cityFocus && mapRef.current) mapRef.current.flyTo([cityFocus.lat, cityFocus.lng], 12, { duration: 0.8 });
  }, [cityFocus?.nonce]);

  return (
    <>
      <div ref={elRef} className="map" />
      <BasePicker value={baseKey} onPick={pickBase} />
    </>
  );
}
