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
