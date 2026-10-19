// cotação do dia, de graça e sem chave: Frankfurter (dados do Banco Central Europeu, ~30 moedas);
// para moedas que o BCE não cobre, ExchangeRate-API aberta
export async function fetchRate(from, to) {
  if (!from || !to || from === to) return { rate: 1, date: null, source: '' };
  try {
    const r = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`);
    if (r.ok) {
      const j = await r.json();
      if (j.rates?.[to]) return { rate: j.rates[to], date: j.date, source: 'Banco Central Europeu' };
    }
  } catch { /* tenta a outra fonte */ }
  const r = await fetch(`https://open.er-api.com/v6/latest/${from}`);
  if (!r.ok) throw new Error(`cotação indisponível (${r.status})`);
  const j = await r.json();
  if (!j.rates?.[to]) throw new Error(`sem cotação para ${from}→${to}`);
  return { rate: j.rates[to], date: (j.time_last_update_utc ? new Date(j.time_last_update_utc).toISOString().slice(0, 10) : null), source: 'ExchangeRate-API' };
}

// arredonda para 4 algarismos significativos (0,03512 / 5,437)
export const roundRate = (r) => Number(r.toPrecision(4));
