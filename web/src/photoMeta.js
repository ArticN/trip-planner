import { haversine, hasCoords, principals, toMin } from './util.js';

// ── o que o app faz com os metadados das fotos: ligar a foto à atividade do roteiro,
// sugerir uma legenda e montar a ficha técnica

const parseMeta = (p) => { try { return JSON.parse(p.meta || '{}') || {}; } catch { return {}; } };
export const photoMeta = parseMeta;
export const hasPlace = (p) => typeof p?.lat === 'number' && typeof p?.lng === 'number';
const minOf = (taken) => (taken ? Number(taken.slice(11, 13)) * 60 + Number(taken.slice(14, 16)) : null);

// a atividade em que a foto foi tirada, no mesmo dia:
// com GPS, a atividade mais perto (até 600 m), preferindo a do horário; sem GPS, a que estava acontecendo na hora
export function matchActivity(photo, activities) {
  if (!photo.day) return null;
  const list = principals(activities || []).filter((a) => a.day === photo.day && a.kind !== 'free' && a.kind !== 'flight');
  const t = minOf(photo.taken || photo.taken_at);
  const inWindow = (a) => {
    const s = toMin(a.start);
    if (s == null || t == null) return null;
    const e = toMin(a.end) ?? s + 90;
    return t >= s - 20 && t <= (e < s ? e + 1440 : e) + 45 ? 0 : Math.min(Math.abs(t - s), Math.abs(t - e)) / 60;
  };
  if (hasPlace(photo)) {
    let best = null;
    list.filter(hasCoords).forEach((a) => {
      const km = haversine(photo, a);
      if (km > 0.6) return;
      const w = inWindow(a);
      const score = km + (w == null ? 0.15 : w * 0.25);
      if (!best || score < best.score) best = { a, score };
    });
    if (best) return best.a.id;
  }
  if (t == null) return null;
  // com GPS longe de tudo, o horário só vale para atividades sem local marcado
  const now = list.filter((a) => inWindow(a) === 0 && !(hasPlace(photo) && hasCoords(a))).sort((x, y) => (toMin(y.start) ?? 0) - (toMin(x.start) ?? 0));
  // sem GPS, só confia no horário se a atividade não tem local ou se só uma atividade cabe no horário
  return now.length === 1 || (now[0] && !hasCoords(now[0])) ? now[0].id : null;
}

// legenda sugerida: a atividade (ou a cidade mais perto) e a hora
export function autoCaption(p, actById, cities = []) {
  const time = (p.taken_at || '').slice(11, 16);
  const act = p.activity_id && actById[p.activity_id];
  let place = act?.title || '';
  if (!place && hasPlace(p)) {
    const near = cities.filter((c) => hasCoords(c) && c.key !== 'transito').map((c) => ({ c, km: haversine(p, c) })).sort((x, y) => x.km - y.km)[0];
    if (near && near.km < 40) place = near.c.name;
  }
  return [place, time].filter(Boolean).join(' · ');
}

// ficha técnica legível: câmera, lente e exposição
export function techSheet(p) {
  const m = parseMeta(p);
  const make = m.make && m.model && m.model.toLowerCase().startsWith(m.make.toLowerCase()) ? '' : m.make;
  const camera = [make, m.model].filter(Boolean).join(' ').replace(/^samsung /i, 'Samsung ');
  const exp = m.exp ? (m.exp >= 1 ? `${Math.round(m.exp * 10) / 10}s` : `1/${Math.round(1 / m.exp)}s`) : null;
  const focal = m.focal ? `${String(m.focal).replace('.', ',')} mm${m.focal35 ? ` (${m.focal35} mm equiv.)` : ''}` : null;
  return {
    camera: camera || null,
    lens: m.lens || null,
    exposure: [m.f ? `f/${String(m.f).replace('.', ',')}` : null, exp, m.iso ? `ISO ${m.iso}` : null, focal].filter(Boolean).join(' · ') || null,
    original: m.ow && m.oh ? `${m.ow} × ${m.oh} px (${(Math.round((m.ow * m.oh) / 1e5) / 10).toString().replace('.', ',')} MP)` : null,
    altitude: m.alt != null ? `${m.alt} m de altitude` : null,
    noExif: !!m.noexif,
  };
}
