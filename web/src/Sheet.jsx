import { useEffect, useRef, useState } from 'react';

// celular: o roteiro vira um painel que desliza por cima do mapa (como no Google Maps),
// com três alturas: encolhido (só os dias), meio e cheio. Mapa e roteiro ficam na tela juntos.
export const DETENTS = ['peek', 'half', 'full'];
const PEEK = 118; // px visíveis no encolhido: alça + barra de dias

const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 900px)') : null;
export function useIsMobile() {
  const [m, setM] = useState(() => !!mq?.matches);
  useEffect(() => {
    if (!mq) return undefined;
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

export const heightOf = (d, total) => (d === 'peek' ? PEEK : d === 'half' ? Math.round(total * 0.52) : total - 8);

export function useSheet(initial = 'half') {
  const [detent, setDetent] = useState(initial);
  const ref = useRef(null); // o <aside> que vira painel
  const drag = useRef(null);

  const onPointerDown = (e) => {
    const el = ref.current;
    if (!el) return;
    const total = el.parentElement.clientHeight;
    drag.current = { y: e.clientY, h: el.getBoundingClientRect().height, total, t: e.timeStamp, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    const h = Math.max(PEEK - 30, Math.min(d.total - 8, d.h - dy));
    ref.current.style.transition = 'none';
    ref.current.style.height = `${h}px`;
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const el = ref.current;
    el.style.transition = '';
    el.style.height = '';
    if (!d.moved) { // toque na alça: abre um nível, ou volta ao meio quando já está cheio
      setDetent((cur) => (cur === 'peek' ? 'half' : cur === 'half' ? 'full' : 'half'));
      return;
    }
    const dy = e.clientY - d.y;
    const v = dy / Math.max(1, e.timeStamp - d.t); // px/ms, positivo = para baixo
    const h = d.h - dy;
    let next;
    if (v > 0.5) next = h > heightOf('half', d.total) ? 'half' : 'peek';
    else if (v < -0.5) next = h < heightOf('half', d.total) ? 'half' : 'full';
    else next = DETENTS.reduce((best, k) => (Math.abs(heightOf(k, d.total) - h) < Math.abs(heightOf(best, d.total) - h) ? k : best), 'half');
    setDetent(next);
  };

  const handleProps = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };
  return { detent, setDetent, ref, handleProps };
}

export function SheetHandle({ detent, handleProps, onKey }) {
  const label = detent === 'full' ? 'Diminuir o roteiro' : 'Aumentar o roteiro';
  return (
    <div
      className="sheet-handle"
      role="button"
      tabIndex={0}
      aria-label={label}
      title={label}
      {...handleProps}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onKey(); } }}
    >
      <i />
    </div>
  );
}
