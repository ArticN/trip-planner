import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { KINDS, esc, hasCoords, haversine, fmtKm } from './util.js';

const WORLD_CENTER = [20, 0];

function bearing(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function pinIcon(label, color, selected, kind) {
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin${selected ? ' sel' : ''}" style="--c:${color}" title="${esc(kind || '')}"><span>${esc(label)}</span></div>`,
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
  picking, onPick, flyTarget, fitKey, cityFocus, showStays, labelNumbers, ideas = [], onIdea,
}) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markersRef = useRef(new Map());
  const cb = useRef({});
  cb.current = { onSelect, onEdit, onMove, onPick, picking, onIdea };
  const lastFit = useRef(null);
  const declutterRef = useRef(null);

  // ── cria o mapa uma vez
  useEffect(() => {
    const map = L.map(elRef.current, { zoomControl: false, preferCanvas: false }).setView(WORLD_CENTER, 2);
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap', className: 'osm-tiles' });
    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '© OpenTopoMap' });
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Esri' });
    osm.addTo(map); // no tema escuro o CSS inverte os tiles (.osm-tiles)
    L.control.layers({ 'Mapa': osm, 'Relevo': topo, 'Satélite': sat }, null, { position: 'topright' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.on('click', (e) => { if (cb.current.picking) cb.current.onPick?.(e.latlng.lat, e.latlng.lng); });
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 50);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(elRef.current);
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const c = mapRef.current?.getContainer();
    if (c) c.classList.toggle('picking', !!picking);
  }, [picking]);

  // ── redesenha camadas quando os dados mudam
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const group = layerRef.current;
    group.clearLayers();
    markersRef.current = new Map();
    const bounds = [];
    const cityMap = Object.fromEntries(cities.map((c) => [c.key, c]));

    const popupFor = (a, n) => {
      const k = KINDS[a.kind] || KINDS.sight;
      const el = document.createElement('div');
      el.className = 'popup';
      const time = a.start ? `${esc(a.start)}${a.end ? '–' + esc(a.end) : ''}` : '';
      el.innerHTML = `
        <div class="popup-kind" style="color:${k.color}">${k.icon} ${esc(k.label)}${n ? ` · #${n}` : ''}</div>
        <div class="popup-title">${esc(a.title)}</div>
        ${time ? `<div class="popup-time">${time}</div>` : ''}
        ${a.location ? `<div class="popup-loc">${esc(a.location)}</div>` : ''}
        ${a.details ? `<div class="popup-det">${esc(a.details.length > 160 ? a.details.slice(0, 160) + '…' : a.details)}</div>` : ''}
        <div class="popup-actions">
          <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}">Abrir no Google Maps ↗</a>
          <button type="button">Editar</button>
        </div>`;
      el.querySelector('button').addEventListener('click', () => cb.current.onEdit?.(a.id));
      return el;
    };

    if (mode === 'day') {
      const pts = items.filter(hasCoords);
      const jit = editPositions ? new Map() : jitterMap(pts);
      pts.forEach((a) => {
        const kcolor = (KINDS[a.kind] || KINDS.sight).color;
        const [dy, dx] = jit.get(a.id) || [0, 0];
        const m = L.marker([a.lat + dy, a.lng + dx], {
          icon: pinIcon(labelNumbers ? a.n : (KINDS[a.kind]?.icon || '•'), kcolor, a.id === selectedId, KINDS[a.kind]?.label),
          draggable: !!editPositions,
          zIndexOffset: a.id === selectedId ? 1000 : 0,
        });
        m.bindPopup(() => popupFor(a, a.n), { minWidth: 220 });
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
          color: isTransit ? '#b4b1ab' : '#f2b33d', weight: isTransit ? 2.5 : 3.5, opacity: 0.85,
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
        L.polyline(routePts, { color: '#f2b33d', weight: 3.5, opacity: 0.9 }).addTo(group);
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
          radius: a.kind === 'sight' ? 6 : 4, color: '#fff', weight: 1.5, fillColor: k.color, fillOpacity: 0.95,
        });
        dot.bindPopup(() => popupFor(a), { minWidth: 220 });
        dot.on('click', () => cb.current.onSelect?.(a.id));
        dot.addTo(detail);
      });
      // nomes de cidade que se sobrepõem: fica o da cidade com mais pontos turísticos
      const declutter = () => {
        const z = map.getZoom();
        detail.eachLayer((l) => { const el = l.getElement?.(); if (el) el.style.display = z >= 9 ? '' : 'none'; });
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
        L.circleMarker([x.lat, x.lng], { radius: 7, color: k.color, weight: 2.5, fillColor: '#000', fillOpacity: 0.35, dashArray: '3 3' })
          .bindTooltip(`Ideia · ${x.title}`)
          .on('click', () => cb.current.onIdea?.(x))
          .addTo(group);
      });
    }

    // enquadra o mapa só quando o contexto muda (dia/modo), não a cada edição
    const key = `${mode}|${fitKey}`;
    if (lastFit.current !== key && bounds.length) {
      lastFit.current = key;
      if (bounds.length === 1) map.setView(bounds[0], 15);
      else map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
    } else if (lastFit.current !== key) {
      lastFit.current = key;
    }

    const sel = markersRef.current.get(selectedId);
    if (sel && !editPositions) sel.openPopup();
  }, [mode, items, stays, cities, stayByDay, selectedId, editPositions, showStays, fitKey, labelNumbers, ideas]);

  useEffect(() => {
    if (flyTarget && mapRef.current) {
      mapRef.current.flyTo([flyTarget.lat, flyTarget.lng], Math.max(mapRef.current.getZoom(), 15), { duration: 0.7 });
    }
  }, [flyTarget?.nonce]);

  useEffect(() => {
    if (cityFocus && mapRef.current) mapRef.current.flyTo([cityFocus.lat, cityFocus.lng], 12, { duration: 0.8 });
  }, [cityFocus?.nonce]);

  return <div ref={elRef} className="map" />;
}
