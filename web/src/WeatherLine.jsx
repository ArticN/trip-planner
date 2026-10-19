import { useEffect, useState } from 'react';
import { weatherFor, wmo } from './weather.js';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
const CLOUD = 'M7 18h10a4 4 0 00.6-7.95A5.5 5.5 0 007 9.5 4.25 4.25 0 007 18z';
export function WxIcon({ k, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`wx-ic ${k}`} {...P}>
      {k === 'sun' && <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>}
      {k === 'partly' && <><path d="M8 3.5v1.2M3.5 8h1.2M4.8 4.8l.9.9M11.2 4.8l-.9.9" /><path d="M5.6 10.6A3 3 0 0110.4 7" /><path d={CLOUD} /></>}
      {k === 'cloud' && <path d={CLOUD} />}
      {k === 'fog' && <path d="M4 9h16M3 13h18M5 17h14" />}
      {k === 'rain' && <><path d="M7 15h10a4 4 0 00.6-7.95A5.5 5.5 0 007 6.5 4.25 4.25 0 007 15z" /><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" /></>}
      {k === 'snow' && <><path d="M7 15h10a4 4 0 00.6-7.95A5.5 5.5 0 007 6.5 4.25 4.25 0 007 15z" /><path d="M8 19h.01M12 20h.01M16 19h.01" /></>}
      {k === 'storm' && <><path d="M7 15h10a4 4 0 00.6-7.95A5.5 5.5 0 007 6.5 4.25 4.25 0 007 15z" /><path d="M12.5 15.5L10.5 19h3l-2 3.5" /></>}
    </svg>
  );
}

// "18° / 9° · Poucas nuvens · 20% de chuva" no cabeçalho do dia
export default function WeatherLine({ lat, lng, day, today }) {
  const [w, setW] = useState(null);
  useEffect(() => {
    let live = true;
    setW(null);
    if (lat == null || lng == null) return undefined;
    weatherFor(lat, lng, day, today).then((v) => live && setW(v)).catch(() => live && setW(null));
    return () => { live = false; };
  }, [lat, lng, day, today]);
  if (!w) return null;
  const d = wmo(w.code);
  const k = w.kind === 'normal' ? (w.rain >= 40 ? 'rain' : 'partly') : d.k;
  const t = (n) => `${Math.round(n)}°`;
  const rain = w.kind === 'forecast' && w.rain != null ? `${w.rain}% de chuva`
    : w.kind === 'normal' ? `chove em ${w.rain}% dos dias`
      : w.mm ? `${w.mm.toFixed(1).replace('.', ',')} mm de chuva` : '';
  const label = w.kind === 'normal' ? 'Costuma fazer' : w.kind === 'past' ? 'Fez' : null;
  return (
    <div className="stay-line wx-line" title={w.kind === 'normal' ? 'Média da mesma semana nos últimos 3 anos (a previsão aparece 16 dias antes)' : 'Previsão Open-Meteo'}>
      <WxIcon k={k} />
      {label && <span className="muted">{label}</span>}
      <b>{t(w.max)}</b><span className="muted">/ {t(w.min)}</span>
      {w.kind !== 'normal' && d.t && <span>· {d.t}</span>}
      {rain && <span>· {rain}</span>}
    </div>
  );
}
