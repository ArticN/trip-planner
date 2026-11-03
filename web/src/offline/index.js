// Instância única da cópia offline + fila de edições, ligada aos eventos do navegador.
import { useEffect, useState } from 'react';
import { openStore } from './store.js';
import { createSync } from './sync.js';

const storePromise = openStore();
let instance = null;

async function boot() {
  const store = await storePromise;
  instance = createSync({ store, onAuthRequired: () => window.dispatchEvent(new Event('auth-required')) });
  await instance.ready;
  // internet voltou, app voltou a ficar visível ou acabou de entrar: envia o que ficou na fila
  window.addEventListener('online', () => instance.wake());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && navigator.onLine) instance.flush(); });
  window.addEventListener('auth-ok', () => instance.wake());
  if (navigator.onLine) instance.flush();
  // pede ao navegador para não apagar os dados guardados quando o aparelho estiver com pouco espaço
  try { navigator.storage?.persist?.(); } catch { /* sem suporte */ }
  return instance;
}
const booting = boot();

export const sync = new Proxy({}, {
  get: (_t, k) => async (...args) => (await booting)[k](...args),
});

export function useSyncStatus() {
  const [s, setS] = useState(() => instance?.status() || { pending: 0, failed: 0, conflicts: 0, syncing: false, local: {} });
  useEffect(() => {
    let off = () => {};
    let live = true;
    booting.then((i) => { if (!live) return; setS(i.status()); off = i.subscribe(setS); });
    return () => { live = false; off(); };
  }, []);
  return s;
}

// recarrega a tela quando a viagem mudou por trás (fila enviada, resposta lenta que chegou)
export function useTripChanged(tripId, fn) {
  useEffect(() => {
    let off = () => {};
    let live = true;
    booting.then((i) => { if (live) off = i.onTripChanged((t) => { if (t === tripId) fn(); }); });
    return () => { live = false; off(); };
  }, [tripId, fn]);
}

export const syncReady = booting;

// anexos escolhidos sem internet que ainda vão subir (aparecem na página de ingressos com o aviso)
export function usePendingUploads(tripId) {
  const s = useSyncStatus();
  const [list, setList] = useState([]);
  useEffect(() => {
    let live = true;
    booting.then((i) => { if (live) setList(i.pendingUploads(tripId)); });
    return () => { live = false; };
  }, [tripId, s.uploads, s.syncing]);
  return list;
}
