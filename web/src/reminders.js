import { useEffect, useState } from 'react';
import { actTz, zonedMs, principals } from './util.js';

// lembretes neste aparelho enquanto o app está aberto (inclusive em segundo plano no Android);
// com o app fechado quem avisa é a agenda assinada (ver RemindersModal)
const KEY = 'notify-on';
export const notifyOn = () => { try { return localStorage.getItem(KEY) === '1' && 'Notification' in window && Notification.permission === 'granted'; } catch { return false; } };
export async function setNotify(on) {
  if (!on) { try { localStorage.removeItem(KEY); } catch { /* sem storage */ } return false; }
  if (!('Notification' in window)) throw new Error('este navegador não mostra notificações');
  const p = await Notification.requestPermission();
  if (p !== 'granted') throw new Error('permissão de notificação negada');
  try { localStorage.setItem(KEY, '1'); } catch { /* sem storage */ }
  return true;
}

async function show(title, body, tag) {
  const reg = await navigator.serviceWorker?.getRegistration?.();
  if (reg) return reg.showNotification(title, { body, tag, icon: '/icon.svg' });
  return new Notification(title, { body, tag });
}

export function useReminders(trip, activities, enabled) {
  // recalcula a cada hora: atividades de amanhã entram na janela de 24h
  const [hour, setHour] = useState(0);
  useEffect(() => { const t = setInterval(() => setHour((h) => h + 1), 3600000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!enabled || !trip) return undefined;
    const timers = [];
    const now = Date.now();
    let sent = {};
    try { sent = JSON.parse(localStorage.getItem('notified') || '{}'); } catch { /* vazio */ }
    principals(activities || []).forEach((a) => {
      if (!a.start || a.done) return;
      const tz = actTz(a, trip.tz).start;
      const startMs = tz ? zonedMs(a.day, a.start, tz) : new Date(`${a.day}T${a.start}:00`).getTime();
      const before = (a.kind === 'flight' ? trip.remind_flight_min ?? 180 : trip.remind_min ?? 30);
      if (!before) return;
      const at = startMs - before * 60000;
      const tag = `tp-${a.id}-${a.day}-${a.start}`;
      if (sent[tag] || at < now - 5 * 60000 || at - now > 24 * 3600000) return;
      timers.push(setTimeout(() => {
        const mins = Math.max(0, Math.round((startMs - Date.now()) / 60000));
        show(a.title, `${mins >= 60 ? `Em ${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}` : `Em ${mins} min`} · ${a.start}${a.location ? ` · ${a.location}` : ''}`, tag).catch(() => {});
        sent[tag] = Date.now();
        try { localStorage.setItem('notified', JSON.stringify(sent)); } catch { /* sem storage */ }
      }, Math.max(0, at - now)));
    });
    return () => timers.forEach(clearTimeout);
  }, [trip, activities, enabled, hour]);
}
