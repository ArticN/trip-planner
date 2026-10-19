// tema escuro por padrão; a escolha fica salva no navegador
const KEY = 'trip-planner-theme';

export function getTheme() {
  try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
}

export function applyTheme(t = getTheme()) {
  document.documentElement.dataset.theme = t;
  window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(KEY, next); } catch { /* sem armazenamento: vale só nesta sessão */ }
  applyTheme(next);
  return next;
}
