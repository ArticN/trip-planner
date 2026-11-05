import { useMemo } from 'react';
import { daysBetween, departureOf, fmtClock, splitMs, tripPhase } from './util.js';
import { useNow, useSecondClock } from './useNow.js';

// first_act da lista de viagens vem como texto JSON (subconsulta no servidor)
export const firstActOf = (trip) => {
  const v = trip?.first_act;
  if (!v) return [];
  if (typeof v === 'object') return [v];
  try { return [JSON.parse(v)]; } catch { return []; }
};

// fase da viagem com relógio de segundos até o pouso do voo de ida; depois volta ao relógio de minutos (useNow)
export function useTripPhase(trip, activities) {
  const dep = useMemo(() => departureOf(trip, activities), [trip.start, trip.tz, activities]);
  const ms = useSecondClock(dep.arriveMs || dep.ms);
  const now = useNow(trip.tz); // vira o dia e faz o "Dia N" andar
  const ph = tripPhase(trip, dep, Math.max(ms, Date.now()));
  const dayN = Math.max(1, daysBetween(trip.start, now.day) + 1);
  return { ...ph, dep, dayN, total: daysBetween(trip.start, trip.end) + 1 };
}

const SEG = [['d', 'dias'], ['h', 'horas'], ['m', 'min'], ['s', 'seg']];
// DD:HH:MM:SS em blocos, com o nome de cada unidade embaixo
export function Clock({ ms }) {
  const p = splitMs(ms);
  return (
    <span className="clock" role="timer" aria-label={`${p.d} dias, ${p.h} horas, ${p.m} minutos e ${p.s} segundos`}>
      {SEG.map(([k, label], i) => (
        <span key={k} className="clock-seg" aria-hidden="true">
          {i > 0 && <i className="clock-sep">:</i>}
          <span><b>{String(p[k]).padStart(2, '0')}</b><small>{label}</small></span>
        </span>
      ))}
    </span>
  );
}

const hhmm = (ms, tz) => {
  try { return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', ...(tz ? { timeZone: tz } : {}) }).format(ms); } catch { return ''; }
};
const zoneName = (ms, tz) => {
  try { return new Intl.DateTimeFormat('pt-BR', { timeZone: tz, timeZoneName: 'shortGeneric' }).formatToParts(ms).find((x) => x.type === 'timeZoneName')?.value || ''; } catch { return ''; }
};
// "para o voo das 19:25 em GRU": hora local de onde sai (aeroporto, ou o nome do fuso)
export function departureText(dep) {
  if (!dep.act) return 'até o primeiro dia';
  const where = dep.act.kind === 'flight' && dep.act.from_code ? ` em ${dep.act.from_code}` : dep.tz ? ` (${zoneName(dep.ms, dep.tz)})` : '';
  const when = `${hhmm(dep.ms, dep.tz)}${where}`;
  return dep.act.kind === 'flight' ? `para o voo das ${when}` : `para a saída, às ${when}`;
}

// selo do cabeçalho do roteiro: componente próprio para só ele re-renderizar a cada segundo
export function CountdownPill({ trip, activities }) {
  const ph = useTripPhase(trip, activities);
  let text;
  if (ph.phase === 'before') text = `Faltam ${fmtClock(ph.left)}`;
  else if (ph.phase === 'flying') text = `Em voo · pousa em ${fmtClock(ph.left)}`;
  else if (ph.phase === 'during') text = `Dia ${ph.dayN} da viagem`;
  else text = 'Viagem concluída';
  return <div className="countdown" title={ph.phase === 'before' ? `DD:HH:MM:SS ${departureText(ph.dep)}` : undefined}>{text}</div>;
}
