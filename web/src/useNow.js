import { useEffect, useState } from 'react';
import { nowIn } from './util.js';

// dia e minuto no fuso da viagem, atualizados a cada minuto e quando o app volta a aparecer
// (no celular o app fica dias aberto no fundo: sem isso o "Agora" e o "hoje" ficavam parados)
// devolve também o fuso usado, para quem compara dias saber se a hora já está no fuso certo
export function useNow(tz) {
  const [now, setNow] = useState(() => ({ ...nowIn(tz), tz }));
  useEffect(() => {
    const tick = () => setNow((cur) => {
      const n = nowIn(tz);
      return n.day === cur.day && n.min === cur.min && cur.tz === tz ? cur : { ...n, tz };
    });
    tick();
    let t = null;
    const schedule = () => { t = setTimeout(() => { tick(); schedule(); }, 60000 - (Date.now() % 60000) + 50); };
    schedule();
    const onVis = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', tick);
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', tick); };
  }, [tz]);
  return now;
}

// relógio de segundos (Date.now) que só anda enquanto falta algo para `untilMs` e o app está visível.
// Quem usa deve ser um componente pequeno: ele re-renderiza a cada segundo até o instante chegar.
export function useSecondClock(untilMs) {
  const [t, setT] = useState(Date.now);
  const live = untilMs != null && t < untilMs;
  useEffect(() => {
    if (!live) return undefined;
    let id = null;
    const tick = () => setT(Date.now());
    const loop = () => { id = setTimeout(() => { tick(); loop(); }, 1000 - (Date.now() % 1000) + 20); };
    const onVis = () => {
      clearTimeout(id);
      if (document.visibilityState === 'visible') { tick(); loop(); }
    };
    tick();
    if (document.visibilityState !== 'hidden') loop();
    document.addEventListener('visibilitychange', onVis);
    return () => { clearTimeout(id); document.removeEventListener('visibilitychange', onVis); };
  }, [live]);
  return t;
}
