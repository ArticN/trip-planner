import { actTz, endDayOf, hasCoords, zonedMs } from './util.js';

// calendário .ics do roteiro: usado no "Exportar para agenda" (navegador) e na agenda assinada (servidor).
// alarm / flightAlarm: minutos de antecedência do lembrete (0 = sem lembrete)
const parseLinks = (v) => { try { const l = JSON.parse(v || '[]'); return Array.isArray(l) ? l.filter((x) => x && x.url) : []; } catch { return []; } };

export function buildIcs(trip, activities, cityMap, { alarm = 0, flightAlarm = 0, feed = false } = {}) {
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => `\\${m}`);
  const d8 = (d) => d.replace(/-/g, '');
  const t6 = (t) => `${t.replace(':', '')}00`;
  const next = (d) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Trip Planner//PT-BR', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(trip.name)}`];
  if (feed) lines.push('METHOD:PUBLISH', 'REFRESH-INTERVAL;VALUE=DURATION:PT6H', 'X-PUBLISHED-TTL:PT6H');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  activities.forEach((a) => {
    const desc = [a.details, a.notes, ...parseLinks(a.links).map((l) => l.url)].filter(Boolean).join('\n');
    const loc = [a.location, cityMap[a.city]?.name].filter(Boolean).join(', ');
    lines.push('BEGIN:VEVENT', `UID:tp-${trip.id}-${a.id}@trip-planner`, `DTSTAMP:${stamp}`);
    const tz = actTz(a, trip.tz);
    const utc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    if (a.start && tz.start) {
      // com fuso: grava em UTC, e cada agenda mostra no fuso de quem estiver vendo
      lines.push(`DTSTART:${utc(zonedMs(a.day, a.start, tz.start))}`);
      if (a.end) lines.push(`DTEND:${utc(zonedMs(endDayOf(a), a.end, tz.end))}`);
    } else if (a.start) {
      // sem fuso: horário "flutuante", aparece igual em qualquer fuso
      lines.push(`DTSTART:${d8(a.day)}T${t6(a.start)}`);
      if (a.end) lines.push(`DTEND:${d8(endDayOf(a))}T${t6(a.end)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${d8(a.day)}`, `DTEND;VALUE=DATE:${d8(next(a.day))}`);
    }
    lines.push(`SUMMARY:${esc(a.title)}`);
    if (loc) lines.push(`LOCATION:${esc(loc)}`);
    if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
    if (hasCoords(a)) lines.push(`GEO:${a.lat};${a.lng}`);
    // lembrete: só para o que tem horário (voos com mais antecedência)
    const before = a.kind === 'flight' ? flightAlarm : alarm;
    if (a.start && before > 0 && !a.done) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(a.title)}`, `TRIGGER:-PT${before}M`, 'END:VALARM');
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  // RFC 5545: linhas com mais de 75 caracteres continuam na seguinte, começando com espaço
  const fold = (l) => (l.length <= 74 ? l : l.match(/.{1,73}/gu).join('\r\n '));
  return lines.map(fold).join('\r\n') + '\r\n';
}
