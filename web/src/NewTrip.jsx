import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { Modal } from './Modals.jsx';
import CountryPicker from './CountryPicker.jsx';
import { COUNTRY_INFO, flag, infoOf, currencyName, tzDiff, fmtTzDiff, plugAdvice } from './countries.js';
import { countryName } from './geo.js';
import { fetchRate, roundRate } from './fx.js';
import { loadAirports } from './flights.js';
import { CURRENCIES, daysBetween, fmtDay, localTz, money } from './util.js';

// Nova viagem em 4 passos: para onde (países), quando (datas), o que já criar (cidades, voos, notas e checklist)
// e a revisão. Tudo que dá para deduzir do destino e do país onde você mora vem preenchido: moeda, câmbio,
// fuso, idioma, tomadas, tipo da viagem (nacional ou internacional), nome e bandeira. Funciona sem internet;
// só a cotação do dia e a busca de outras cidades precisam dela.

const STEPS = ['Destino', 'Datas', 'Já criar', 'Revisar'];
const COLORS = ['#8e44ad', '#e67e22', '#2874a6', '#16a085', '#c0392b', '#b7791f', '#2e86c1', '#d35400'];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (day, n) => { const d = new Date(`${day}T12:00:00`); d.setDate(d.getDate() + n); return iso(d); };
const listPt = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);
// palpite do país onde mora pelo idioma do aparelho (pt-BR → Brasil)
const guessHome = () => (navigator.languages || [navigator.language]).map((l) => l?.split('-')[1]?.toUpperCase()).find((c) => c && /^[A-Z]{2}$/.test(c)) || null;

// aeroporto com posição mais perto de um ponto (para voos nacionais até a primeira cidade)
function nearestAirport(airports, lat, lng) {
  let best = null;
  let bd = Infinity;
  for (const [code, [la, ln]] of Object.entries(airports || {})) {
    const d = (la - lat) ** 2 + ((ln - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bd) { bd = d; best = code; }
  }
  return best;
}

// notas "Sobre o destino": moeda, fuso, idioma, tomadas, emergência e trânsito de cada país
export function countryNotes(a, { home, homeTz, day }) {
  const i = infoOf(a);
  const h = home ? infoOf(home) : null;
  const grp = `Sobre ${i.name}`;
  const out = [];
  if (i.cur) out.push({ grp, title: 'Moeda', tag: 'consenso', body: `${currencyName(i.cur)} (${i.cur}). Com internet, o câmbio da viagem se atualiza sozinho com a cotação do dia; no Orçamento dá para fixar um valor.` });
  if (i.tz) {
    const diff = homeTz ? tzDiff(homeTz, i.tz, day) : null;
    out.push({ grp, title: 'Fuso horário', tag: 'consenso', body: `${i.tz.replace(/_/g, ' ')}${diff != null ? `: ${fmtTzDiff(diff)} do seu horário nas datas da viagem` : ''}.${i.tzNote ? ` ${i.tzNote}` : ''}` });
  }
  if (i.lang) out.push({ grp, title: 'Idioma', tag: 'consenso', body: `${i.lang}. Baixe o idioma no tradutor do celular para usar sem internet.` });
  const plug = plugAdvice(i, h);
  if (plug) out.push({ grp, title: 'Tomadas e voltagem', tag: plug.need ? 'atencao' : 'consenso', body: `${plug.text} Confira na etiqueta se o carregador aceita 100–240 V (quase todos de celular e notebook aceitam).` });
  if (i.sos) out.push({ grp, title: 'Emergência', tag: 'atencao', body: `${i.sos}. Anote também o endereço da hospedagem e o telefone do seguro viagem.`, pinned: 1 });
  if (i.drive === 'E' && h?.drive !== 'E') out.push({ grp, title: 'Trânsito pela esquerda', tag: 'atencao', body: 'Os carros andam pela esquerda (mão inglesa). Ao atravessar a rua, olhe primeiro para a direita.' });
  if (out.length) out.push({ grp, title: 'Confira antes de ir', tag: 'opiniao', body: 'Estas notas foram criadas automaticamente a partir do país. Regras de entrada (passaporte, visto, vacinas) mudam: confirme no site do consulado.' });
  return out;
}

// checklist inicial conforme o tipo da viagem
export function starterChecklist({ domestic, cur, needAdapter }) {
  if (domestic) {
    return [
      { grp: 'Documentos', text: 'Documento com foto' },
      { grp: 'Reservas', text: 'Hospedagem confirmada' },
      { grp: 'Reservas', text: 'Transporte de ida e volta' },
      { grp: 'Mala', text: 'Carregadores e bateria externa' },
    ];
  }
  return [
    { grp: 'Documentos', text: 'Passaporte válido (confira a validade mínima exigida)' },
    { grp: 'Documentos', text: 'Visto ou autorização de entrada, se o país pedir' },
    { grp: 'Documentos', text: 'Seguro viagem' },
    { grp: 'Dinheiro', text: 'Cartão internacional liberado no banco' },
    ...(cur ? [{ grp: 'Dinheiro', text: `Um pouco de dinheiro em ${cur}` }] : []),
    ...(needAdapter ? [{ grp: 'Mala', text: 'Adaptador de tomada' }] : []),
    { grp: 'Mala', text: 'Carregadores e bateria externa' },
    { grp: 'Outros', text: 'Chip ou eSIM de internet' },
  ];
}


export default function NewTripWizard({ onCreate, onClose }) {
  const today = iso(new Date());
  const [step, setStep] = useState(0);
  const [home, setHome] = useState(null);
  const [homeSaved, setHomeSaved] = useState(null);
  const [homeAir, setHomeAir] = useState('');
  const [countries, setCountries] = useState([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [picked, setPicked] = useState([]); // cidades escolhidas: { name, lat, lng, emoji, a }
  const [extra, setExtra] = useState('');
  const [extraMsg, setExtraMsg] = useState('');
  const [flights, setFlights] = useState(true);
  const [codes, setCodes] = useState({});
  const [withNotes, setWithNotes] = useState(true);
  const [withCheck, setWithCheck] = useState(true);
  const [edit, setEdit] = useState({}); // o que a pessoa mudou na revisão (nome, moedas, câmbio, fuso…)
  const [quote, setQuote] = useState(null);
  const [airports, setAirports] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const bodyRef = useRef(null);

  useEffect(() => {
    api.settings().then((s) => {
      const h = s.home_country || guessHome();
      setHome(h); setHomeSaved(s.home_country || null);
      setHomeAir(s.home_airport || COUNTRY_INFO[h]?.air || '');
    }).catch(() => { const h = guessHome(); setHome(h); setHomeAir(COUNTRY_INFO[h]?.air || ''); });
    loadAirports().then(setAirports).catch(() => {});
  }, []);
  useEffect(() => { bodyRef.current?.closest('.modal-body')?.scrollTo?.(0, 0); }, [step]);

  const homeInfo = home ? infoOf(home) : null;
  const dest = countries.map(infoOf);
  const domestic = countries.length > 0 && !!home && countries.every((a) => a === home);
  const abroad = countries.filter((a) => a !== home);
  // o destino principal é o primeiro país de fora com dados prontos (moeda, fuso); sem nenhum, o primeiro escolhido
  const abroadInfo = abroad.map(infoOf);
  const main = abroadInfo.find((i) => i.cur) || abroadInfo[0] || infoOf(countries[0]);
  // seu fuso: o do aparelho (mais exato em países com vários fusos); se o aparelho estiver em UTC, o do país onde mora
  const devTz = localTz();
  const homeTz = (devTz && !/^(UTC|Etc\/)/.test(devTz) ? devTz : null) || homeInfo?.tz || devTz || null;
  // cidades sugeridas dos países escolhidos (as duas primeiras do primeiro país já vêm marcadas)
  const suggestions = dest.flatMap((i) => i.cities.map((c) => ({ ...c, a: i.a })));
  useEffect(() => {
    setPicked((p) => {
      const keep = p.filter((c) => countries.includes(c.a) || c.custom);
      const first = dest.find((i) => i.cities.length);
      if (keep.length || !first) return keep;
      return first.cities.slice(0, 2).map((c) => ({ ...c, a: first.a }));
    });
  }, [countries.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // aeroportos dos voos: casa → primeiro destino; volta do último país (ou da última cidade, se nacional)
  const firstCity = picked[0];
  const lastCity = picked[picked.length - 1];
  const destOf = (city, info) => (domestic || !info?.air) && city && airports ? nearestAirport(airports, city.lat, city.lng) : info?.air || '';
  const autoCodes = {
    from: homeAir || homeInfo?.air || '',
    to: destOf(firstCity, main),
    back: destOf(lastCity, infoOf(abroad[abroad.length - 1] || countries[0])),
  };
  const fc = { ...autoCodes, ...codes };
  const apName = (c) => (airports?.[c]?.[2] || c).replace(/\s*\(.*\)$/, '');
  // dois aeroportos da mesma cidade (GRU e CGH, em São Paulo): não é um voo, é a cidade onde você já está
  const sameArea = (x, y) => {
    const a = airports?.[x];
    const b = airports?.[y];
    return !!(a && b) && (a[0] - b[0]) ** 2 + ((a[1] - b[1]) * Math.cos((a[0] * Math.PI) / 180)) ** 2 < 0.8 ** 2; // ~90 km
  };

  const year = (start || today).slice(0, 4);
  const autoName = domestic
    ? `${listPt(picked.slice(0, 2).map((c) => c.name)) || countryName(home)} ${year}`
    : `${abroad.length > 3 ? `${abroad.slice(0, 3).map(countryName).join(', ')} e mais` : listPt(abroad.map(countryName))} ${year}`;
  const homeCur = homeInfo?.cur || 'BRL';
  const auto = {
    name: countries.length ? autoName : '',
    emoji: domestic ? '🧳' : flag(abroad[0]) || '🌍',
    currency: domestic ? homeCur : main?.cur || homeCur,
    home_currency: homeCur,
    tz: (domestic ? homeTz : main?.tz || abroadInfo.find((i) => i.tz)?.tz) || homeTz || '',
  };
  const f = { ...auto, ...edit };
  const sameCur = f.currency === f.home_currency;
  // as conhecidas primeiro; depois todas as que o navegador conhece (para países sem dados prontos)
  const curList = useMemo(() => { let all = []; try { all = Intl.supportedValuesOf('currency'); } catch { /* navegador antigo */ } return [...new Set([f.currency, f.home_currency, ...CURRENCIES, ...all])].filter(Boolean); }, [f.currency, f.home_currency]);

  // cotação do dia (só com internet; sem ela a viagem busca sozinha quando a conexão voltar)
  useEffect(() => {
    setQuote(null);
    if (step < 3 || sameCur || !navigator.onLine) return;
    let off = false;
    fetchRate(f.currency, f.home_currency).then((q) => { if (!off) setQuote({ ...q, rate: roundRate(q.rate), cur: f.currency, home: f.home_currency }); }).catch(() => { if (!off) setQuote({ error: true }); });
    return () => { off = true; };
  }, [step, f.currency, f.home_currency, sameCur]);
  const typedRate = edit.rate != null && edit.rate !== '' ? Number(String(edit.rate).replace(',', '.')) : null;
  const rate = sameCur ? 1 : typedRate || quote?.rate || null;

  const needAdapter = !domestic && dest.some((i) => plugAdvice(i, homeInfo)?.need);
  const notes = withNotes && !domestic ? abroad.flatMap((a) => countryNotes(a, { home, homeTz, day: start })) : [];
  const checklist = withCheck ? starterChecklist({ domestic, cur: sameCur ? null : f.currency, needAdapter }) : [];
  const flightActs = flights && fc.from && fc.to && start && end ? [
    { day: start, title: `Voo de ida ${apName(fc.from)} → ${apName(fc.to)}`, from: fc.from, to: fc.to, tzA: homeTz, tzB: f.tz },
    ...(fc.back ? [{ day: end, title: `Voo de volta ${apName(fc.back)} → ${apName(fc.from)}`, from: fc.back, to: fc.from, tzA: f.tz, tzB: homeTz }] : []),
  ].filter((x) => x.from !== x.to && !sameArea(x.from, x.to)).map((x) => ({
    day: x.day, title: x.title, kind: 'flight', city: 'transito', transport: '✈️ Avião',
    location: `${apName(x.from)} (${x.from}) → ${apName(x.to)} (${x.to})`, from_code: x.from, to_code: x.to,
    start_tz: x.tzA || null, end_tz: x.tzB || null,
    lat: airports?.[x.from]?.[0] ?? null, lng: airports?.[x.from]?.[1] ?? null,
    details: 'Criado na Nova viagem: preencha horário, companhia, número do voo e escalas.',
  })) : [];

  const nDays = start && end && end >= start ? daysBetween(start, end) + 1 : 0;
  const canNext = [countries.length > 0, nDays > 0, true, !!f.name?.trim() && (sameCur || rate > 0 || !navigator.onLine || quote?.error)][step];

  const addCustom = async () => {
    const n = extra.trim();
    if (!n) return;
    setExtraMsg('');
    const local = suggestions.find((c) => c.name.toLowerCase() === n.toLowerCase());
    if (local) { if (!picked.some((p) => p.name === local.name)) setPicked((p) => [...p, local]); setExtra(''); return; }
    let pos = {};
    if (navigator.onLine) {
      try {
        const cc = countries.map((a) => a.toLowerCase()).join(',');
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=pt-BR&q=${encodeURIComponent(n)}${cc ? `&countrycodes=${cc}` : ''}`);
        const j = r.ok ? await r.json() : [];
        if (j[0]) pos = { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
      } catch { /* sem busca agora */ }
    }
    if (pos.lat == null) setExtraMsg('Adicionada sem posição no mapa: dá para marcar depois em Cidades.');
    setPicked((p) => [...p, { name: n, emoji: '📍', lat: pos.lat ?? null, lng: pos.lng ?? null, custom: true }]);
    setExtra('');
  };

  const finish = async () => {
    setBusy(true); setErr('');
    try {
      if (home && home !== homeSaved) await api.saveSettings({ home_country: home }).catch(() => {});
      if (flights && fc.from) await api.saveSettings({ home_airport: fc.from }).catch(() => {});
      await onCreate({
        trip: {
          name: f.name.trim(), subtitle: f.subtitle || null, emoji: f.emoji, start, end,
          currency: f.currency, home_currency: f.home_currency, rate: rate || 1,
          // câmbio digitado fica fixo; o resto atualiza sozinho (sem cotação, a viagem busca quando houver internet)
          rate_auto: typedRate ? 0 : 1, rate_at: !typedRate && quote?.rate && !sameCur ? today : null,
          tz: f.tz || null, scope: null, countries: countries.join(','),
        },
        cities: picked.map((c, i) => ({ name: c.name, emoji: c.emoji, color: COLORS[i % COLORS.length], lat: c.lat, lng: c.lng })),
        activities: flightActs, notes, checklist,
      });
    } catch (e) {
      // nada se perde: o que foi preenchido continua aqui para tentar de novo
      setErr(!navigator.onLine || /fetch|network/i.test(e.message || '') ? 'Sem conexão com o servidor: a viagem ainda não foi criada. O que você preencheu continua aqui; tente de novo quando a internet voltar.' : `Não consegui criar a viagem (${e.message || 'erro'}). Tente de novo.`);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Nova viagem" onClose={onClose}
      footer={
        <>
          {step > 0 && <button onClick={() => setStep(step - 1)}>Voltar</button>}
          <span className="spacer" />
          <span className="muted small wiz-count">Passo {step + 1} de {STEPS.length}</span>
          {step < 3
            ? <button className="primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continuar</button>
            : <button className="primary" disabled={!canNext || busy} onClick={finish}>{busy ? 'Criando…' : 'Criar viagem'}</button>}
        </>
      }
    >
      <div ref={bodyRef}>
        <ol className="wiz-steps" aria-label="Passos">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? 'on' : i < step ? 'done' : ''}>
              <button type="button" disabled={i > step} onClick={() => setStep(i)}><span>{i + 1}</span>{s}</button>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="wiz-pane">
            <h4 className="wiz-q">Para onde você vai?</h4>
            <p className="muted small">Escolha um ou mais países. Moeda, fuso, idioma, tomadas e cidades vêm daqui.</p>
            <CountryPicker value={countries} onChange={setCountries} home={home} autoFocus />
            {countries.length > 0 && (
              <div className={`wiz-kind ${domestic ? 'dom' : 'intl'}`}>
                <b>{domestic ? 'Viagem nacional' : 'Viagem internacional'}</b>
                <span className="muted small">{domestic ? 'Tudo na sua moeda, sem câmbio nem cota de compras.' : `Câmbio ${sameCur ? 'não precisa (mesma moeda)' : `${main.cur || '?'} → ${homeCur}`} e cota da Receita nas Compras.`}</span>
              </div>
            )}
            {dest.some((i) => !i.known) && <p className="muted small">{listPt(dest.filter((i) => !i.known).map((i) => i.name))}: o app ainda não tem os dados prontos desse país; escolha a moeda no último passo.</p>}
            <label className="wiz-home">Onde moro
              <select value={home || ''} onChange={(e) => { const h = e.target.value || null; setHome(h); setHomeAir(COUNTRY_INFO[h]?.air || ''); }}>
                <option value="">Não informar</option>
                {Object.keys(COUNTRY_INFO).map((a) => ({ a, n: countryName(a) })).sort((x, y) => x.n.localeCompare(y.n, 'pt-BR')).map(({ a, n }) => <option key={a} value={a}>{flag(a)} {n}</option>)}
                {home && !COUNTRY_INFO[home] && <option value={home}>{countryName(home)}</option>}
              </select>
              <small className="muted">Define a sua moeda, de onde saem os voos e se a viagem é nacional. Fica salvo para as próximas.</small>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="wiz-pane">
            <h4 className="wiz-q">Quando?</h4>
            <div className="form">
              <label>Ida<input type="date" value={start} min={undefined} onChange={(e) => { const v = e.target.value; setStart(v); if (!end || end < v) setEnd(addDays(v, 6)); }} /></label>
              <label>Volta<input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} /></label>
            </div>
            {start && (
              <div className="cpick-quick">
                {[[3, 'Fim de semana'], [7, '1 semana'], [10, '10 dias'], [15, '15 dias'], [21, '3 semanas']].map(([n, l]) => (
                  <button type="button" key={n} className={`sm${nDays === n ? ' on' : ''}`} onClick={() => setEnd(addDays(start, n - 1))}>{l}</button>
                ))}
              </div>
            )}
            {nDays > 0 && <p className="muted">{fmtDay(start)} → {fmtDay(end)} · <b>{nDays} dias</b>{start < today ? ' (no passado: bom para registrar uma viagem já feita)' : ''}</p>}
            {start && end && end < start && <div className="warn">A volta é antes da ida.</div>}
          </div>
        )}

        {step === 2 && (
          <div className="wiz-pane">
            <h4 className="wiz-q">O que já deixar pronto?</h4>
            <div className="wiz-block">
              <b>Cidades</b>
              <p className="muted small">Viram as cores do calendário e os pontos do mapa. Dá para mudar depois.</p>
              <div className="wiz-cities">
                {suggestions.map((c) => {
                  const on = picked.some((p) => p.name === c.name);
                  return <button type="button" key={`${c.a}${c.name}`} className={`sm${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x.name !== c.name) : [...p, c]))}>{c.emoji} {c.name}</button>;
                })}
                {picked.filter((c) => c.custom).map((c) => <button type="button" key={`x${c.name}`} className="sm on" aria-pressed onClick={() => setPicked((p) => p.filter((x) => x !== c))}>{c.emoji} {c.name}</button>)}
              </div>
              <div className="row add-city">
                <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Outra cidade…" onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }} />
                <button type="button" disabled={!extra.trim()} onClick={addCustom}>+ Adicionar</button>
              </div>
              {extraMsg && <div className="muted small">{extraMsg}</div>}
            </div>

            <label className="check-line wiz-opt"><input type="checkbox" checked={flights} onChange={(e) => setFlights(e.target.checked)} /><span><b>Voos de ida e volta</b> <span className="muted small">no primeiro e no último dia, com o trajeto no mapa</span></span></label>
            {flights && (
              <div className="wiz-air">
                <label>Saída<input value={fc.from} maxLength={3} onChange={(e) => setCodes((c) => ({ ...c, from: e.target.value.toUpperCase() }))} aria-label="Aeroporto de saída" /><small className="muted">{fc.from ? apName(fc.from) : 'código do aeroporto'}</small></label>
                <label>Chegada<input value={fc.to} maxLength={3} onChange={(e) => setCodes((c) => ({ ...c, to: e.target.value.toUpperCase() }))} aria-label="Aeroporto de chegada" /><small className="muted">{fc.to ? apName(fc.to) : 'código do aeroporto'}</small></label>
                <label>Volta de<input value={fc.back} maxLength={3} onChange={(e) => setCodes((c) => ({ ...c, back: e.target.value.toUpperCase() }))} aria-label="Aeroporto da volta" /><small className="muted">{fc.back ? apName(fc.back) : 'sem voo de volta'}</small></label>
              </div>
            )}
            {!domestic && <label className="check-line wiz-opt"><input type="checkbox" checked={withNotes} onChange={(e) => setWithNotes(e.target.checked)} /><span><b>Notas sobre o destino</b> <span className="muted small">moeda, fuso, idioma, tomadas{needAdapter ? ' (precisa de adaptador)' : ''}, emergência</span></span></label>}
            <label className="check-line wiz-opt"><input type="checkbox" checked={withCheck} onChange={(e) => setWithCheck(e.target.checked)} /><span><b>Checklist básica</b> <span className="muted small">{domestic ? 'documento, reservas, carregadores' : 'passaporte, visto, seguro, cartão, chip'}</span></span></label>
          </div>
        )}

        {step === 3 && (
          <div className="wiz-pane">
            <h4 className="wiz-q">Tudo certo?</h4>
            <div className="form">
              <label className="full">Nome da viagem
                <div className="wiz-name">
                  <input className="emo" value={f.emoji} maxLength={8} onChange={(e) => setEdit((x) => ({ ...x, emoji: e.target.value }))} aria-label="Emoji" />
                  <input value={f.name} onChange={(e) => setEdit((x) => ({ ...x, name: e.target.value }))} />
                </div>
              </label>
              <label className="full">Subtítulo (opcional)<input value={f.subtitle || ''} onChange={(e) => setEdit((x) => ({ ...x, subtitle: e.target.value }))} placeholder="Ex: Lua de mel, mochilão, trabalho…" /></label>
              {domestic ? (
                <label>Moeda<select value={f.home_currency} onChange={(e) => setEdit((x) => ({ ...x, home_currency: e.target.value, currency: e.target.value }))}>{curList.map((c) => <option key={c}>{c}</option>)}</select></label>
              ) : (
                <>
                  <label>Moeda do destino<select value={f.currency} onChange={(e) => setEdit((x) => ({ ...x, currency: e.target.value, rate: undefined }))}>{curList.map((c) => <option key={c} value={c}>{c} · {currencyName(c)}</option>)}</select></label>
                  <label>Sua moeda<select value={f.home_currency} onChange={(e) => setEdit((x) => ({ ...x, home_currency: e.target.value, rate: undefined }))}>{curList.map((c) => <option key={c} value={c}>{c} · {currencyName(c)}</option>)}</select></label>
                </>
              )}
              {!domestic && abroadInfo.some((i) => !i.cur) && (
                <div className="full warn soft">Sem dados prontos de {listPt(abroadInfo.filter((i) => !i.cur).map((i) => i.name))}: confira se a moeda do destino está certa.</div>
              )}
              {!sameCur && (
                <label className="full">Câmbio: 1 {f.currency} = quantos {f.home_currency}?
                  <input inputMode="decimal" value={edit.rate ?? (quote?.rate ?? '')} onChange={(e) => setEdit((x) => ({ ...x, rate: e.target.value }))} placeholder={navigator.onLine ? 'buscando a cotação…' : 'sem internet'} />
                  <small className="muted">{typedRate ? 'Valor seu: fica fixo (dá para voltar ao automático no Orçamento).'
                    : quote?.rate ? `Cotação de ${quote.date ? fmtDay(quote.date) : 'hoje'} (${quote.source}): ${money(100, f.currency)} ≈ ${money(100 * quote.rate, f.home_currency)}. Atualiza sozinha todo dia.`
                      : quote?.error || !navigator.onLine ? 'Sem cotação agora: a viagem busca sozinha quando houver internet, ou digite um valor.' : 'Buscando a cotação do dia…'}</small>
                </label>
              )}
              <label className="full">Fuso horário do destino
                <input value={f.tz} onChange={(e) => setEdit((x) => ({ ...x, tz: e.target.value.trim() }))} placeholder="Ex: Asia/Tokyo" />
                {f.tz && homeTz && f.tz !== homeTz && <small className="muted">{fmtTzDiff(tzDiff(homeTz, f.tz, start))} do seu horário.{main?.tzNote && !domestic ? ` ${main.tzNote}` : ''}</small>}
              </label>
            </div>
            <div className="wiz-summary">
              <div className="section-title">Vai ser criado</div>
              <ul>
                <li>{fmtDay(start)} → {fmtDay(end)}, {nDays} dias · viagem {domestic ? 'nacional' : 'internacional'}{countries.length ? ` (${countries.map((a) => `${flag(a)} ${countryName(a)}`).join(', ')})` : ''}</li>
                {picked.length > 0 && <li>{picked.length} {picked.length === 1 ? 'cidade' : 'cidades'}: {listPt(picked.map((c) => c.name))}</li>}
                {flightActs.map((a) => <li key={a.day + a.title}>{a.title} ({fmtDay(a.day)})</li>)}
                {notes.length > 0 && <li>{notes.length} notas sobre o destino</li>}
                {checklist.length > 0 && <li>Checklist com {checklist.length} itens</li>}
              </ul>
              <p className="muted small">Tudo isso dá para editar ou apagar depois.</p>
            </div>
            {err && <div className="warn">{err}</div>}
          </div>
        )}
      </div>
    </Modal>
  );
}
