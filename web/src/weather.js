// Previsão do tempo por dia (Open-Meteo: grátis, sem chave, aceita chamadas direto do navegador).
// - até 16 dias à frente (e até 3 meses atrás): previsão/observado do próprio dia
// - mais longe no futuro: média do mesmo período nos 3 anos anteriores ("como costuma ser")
// - antes disso: o tempo que fez, do arquivo histórico
const DAY = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const shiftYear = (d, n) => `${Number(d.slice(0, 4)) + n}${d.slice(4)}`;
const addDays = (d, n) => iso(new Date(`${d}T12:00:00Z`).getTime() + n * DAY);

const DAILY = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum';
async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
  return r.json();
}

// código WMO → tipo de ícone e descrição
export function wmo(code) {
  if (code == null) return { k: 'cloud', t: '' };
  if (code === 0) return { k: 'sun', t: 'Céu limpo' };
  if (code <= 2) return { k: 'partly', t: 'Poucas nuvens' };
  if (code === 3) return { k: 'cloud', t: 'Nublado' };
  if (code <= 48) return { k: 'fog', t: 'Neblina' };
  if (code <= 57) return { k: 'rain', t: 'Garoa' };
  if (code <= 67) return { k: 'rain', t: 'Chuva' };
  if (code <= 77) return { k: 'snow', t: 'Neve' };
  if (code <= 82) return { k: 'rain', t: 'Pancadas de chuva' };
  if (code <= 86) return { k: 'snow', t: 'Neve' };
  return { k: 'storm', t: 'Tempestade' };
}

async function lookup(lat, lng, day, today) {
  const ll = `latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&timezone=auto`;
  const ahead = (new Date(`${day}T12:00:00Z`) - new Date(`${today}T12:00:00Z`)) / DAY;
  if (ahead <= 15 && ahead >= -90) {
    const j = await get(`https://api.open-meteo.com/v1/forecast?${ll}&daily=${DAILY}&start_date=${day}&end_date=${day}`);
    const d = j.daily;
    return { kind: ahead < 0 ? 'past' : 'forecast', code: d.weather_code[0], max: d.temperature_2m_max[0], min: d.temperature_2m_min[0], rain: d.precipitation_probability_max?.[0] ?? null, mm: d.precipitation_sum?.[0] ?? null };
  }
  if (ahead < 0) {
    const j = await get(`https://archive-api.open-meteo.com/v1/archive?${ll}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&start_date=${day}&end_date=${day}`);
    const d = j.daily;
    return { kind: 'past', code: d.weather_code[0], max: d.temperature_2m_max[0], min: d.temperature_2m_min[0], rain: null, mm: d.precipitation_sum[0] };
  }
  // futuro distante: média da mesma semana nos últimos 3 anos (anos completos no arquivo)
  // os 3 anos mais recentes em que essa data já passou
  const last = Number(today.slice(0, 4)) - (day.slice(5) < today.slice(5) ? 0 : 1);
  const years = [last, last - 1, last - 2];
  const runs = await Promise.all(years.map((y) => {
    const c = shiftYear(day, y - Number(day.slice(0, 4)));
    return get(`https://archive-api.open-meteo.com/v1/archive?${ll}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&start_date=${addDays(c, -3)}&end_date=${addDays(c, 3)}`);
  }));
  const max = []; const min = []; let wet = 0; let n = 0;
  runs.forEach((j) => j.daily.time.forEach((_, i) => {
    if (j.daily.temperature_2m_max[i] == null) return;
    max.push(j.daily.temperature_2m_max[i]); min.push(j.daily.temperature_2m_min[i]);
    n++; if ((j.daily.precipitation_sum[i] || 0) >= 1) wet++;
  }));
  if (!n) return null;
  const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  return { kind: 'normal', code: null, max: avg(max), min: avg(min), rain: Math.round((wet / n) * 100), mm: null };
}

export async function weatherFor(lat, lng, day, today) {
  const key = `wx:${lat.toFixed(2)},${lng.toFixed(2)}:${day}`;
  try {
    const c = JSON.parse(localStorage.getItem(key) || 'null');
    // previsão vale 3 horas; média e histórico não mudam (renova a cada 30 dias)
    if (c && Date.now() - c.at < (c.v?.kind === 'forecast' ? 3 * 3600000 : 30 * DAY)) return c.v;
  } catch { /* sem storage */ }
  const v = await lookup(lat, lng, day, today);
  try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), v })); } catch { /* sem storage */ }
  return v;
}
