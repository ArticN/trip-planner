import { useEffect, useState } from 'react';
import { KINDS, KIND_KEYS, TRANSPORTS, CURRENCIES, hasCoords, fmtDay } from './util.js';

export function Modal({ title, onClose, children, wide, footer }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// busca de endereços/locais (OpenStreetMap Nominatim) — roda no navegador, só quando você clica
function GeocodeBox({ initial, onPick, placeholder }) {
  const [q, setQ] = useState(initial || '');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true); setErr(''); setRes(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=pt-BR&q=${encodeURIComponent(q)}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setRes(await r.json());
    } catch (e) {
      setErr(`Não consegui buscar (${e.message}). Você ainda pode marcar no mapa ou digitar lat/lng.`);
    } finally { setBusy(false); }
  };

  return (
    <div className="geo">
      <div className="row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder || 'Buscar local (ex: Torre Eiffel, Paris)'} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} />
        <button type="button" onClick={search} disabled={busy}>{busy ? '…' : 'Buscar'}</button>
      </div>
      {err && <div className="warn soft pad">{err}</div>}
      {res && res.length === 0 && <div className="muted small pad">Nada encontrado. Tente outro nome, inclua a cidade ou escreva em inglês.</div>}
      {res && res.length > 0 && (
        <ul className="geo-res">
          {res.map((r) => (
            <li key={r.place_id} onClick={() => { onPick(parseFloat(r.lat), parseFloat(r.lon), r.display_name); setRes(null); }}>
              <b>{r.name || r.display_name.split(',')[0]}</b>
              <span>{r.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EditModal({ draft, isNew, cities, days, fxCur, onChange, onSave, onDelete, onClose, onPickMap }) {
  const set = (patch) => onChange({ ...draft, ...patch });
  const num = (v) => (v === '' || v == null ? null : Number(v));
  const valid = draft.title?.trim() && draft.day;

  return (
    <Modal
      title={isNew ? 'Nova atividade' : 'Editar atividade'}
      onClose={onClose}
      footer={
        <>
          {!isNew && <button className="danger" onClick={onDelete}>Excluir</button>}
          <span className="spacer" />
          <button onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={!valid} onClick={onSave}>Salvar</button>
        </>
      }
    >
      <div className="form">
        <label className="full">Título
          <input autoFocus value={draft.title || ''} onChange={(e) => set({ title: e.target.value })} placeholder="Ex: Museu do Louvre" />
        </label>
        <label>Dia
          <select value={draft.day} onChange={(e) => set({ day: e.target.value })}>
            {days.map((d) => <option key={d} value={d}>{fmtDay(d)}</option>)}
          </select>
        </label>
        <label>Tipo
          <select value={draft.kind || 'sight'} onChange={(e) => set({ kind: e.target.value })}>
            {KIND_KEYS.map((k) => <option key={k} value={k}>{KINDS[k].icon} {KINDS[k].label}</option>)}
          </select>
        </label>
        <label>Início
          <input type="time" value={draft.start || ''} onChange={(e) => set({ start: e.target.value || null })} />
        </label>
        <label>Fim
          <input type="time" value={draft.end || ''} onChange={(e) => set({ end: e.target.value || null })} />
        </label>
        <label>Cidade
          <select value={draft.city || ''} onChange={(e) => set({ city: e.target.value || null })}>
            <option value="">—</option>
            {cities.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.name}</option>)}
          </select>
        </label>
        <label>Transporte
          <select value={draft.transport || ''} onChange={(e) => set({ transport: e.target.value })}>
            {TRANSPORTS.map((t) => <option key={t} value={t}>{t || '—'}</option>)}
          </select>
        </label>
        <label>Custo ({fxCur})
          <input type="number" min="0" step="any" value={draft.cost ?? ''} onChange={(e) => set({ cost: num(e.target.value) })} />
        </label>
        <label>Local (texto)
          <input value={draft.location || ''} onChange={(e) => set({ location: e.target.value })} placeholder="Bairro / endereço" />
        </label>
        <label className="full">Detalhes
          <textarea rows={3} value={draft.details || ''} onChange={(e) => set({ details: e.target.value })} />
        </label>

        <div className="full fieldset">
          <div className="legend">Posição no mapa {hasCoords(draft) ? <span className="ok">● definida</span> : <span className="muted">○ sem posição</span>}</div>
          <GeocodeBox
            initial={draft.title}
            onPick={(lat, lng, name) => set({ lat, lng, location: draft.location || name.split(',').slice(0, 2).join(',') })}
          />
          <div className="row">
            <label>Lat<input type="number" step="0.0001" value={draft.lat ?? ''} onChange={(e) => set({ lat: num(e.target.value) })} /></label>
            <label>Lng<input type="number" step="0.0001" value={draft.lng ?? ''} onChange={(e) => set({ lng: num(e.target.value) })} /></label>
            <button type="button" onClick={onPickMap}>Marcar no mapa</button>
            {hasCoords(draft) && <button type="button" onClick={() => set({ lat: null, lng: null })}>Limpar</button>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function StaysModal({ stays, cities, trip, onSave, onCreate, onDelete, onClose }) {
  const cityMap = Object.fromEntries(cities.map((c) => [c.key, c]));
  const [rows, setRows] = useState(() => stays.map((s) => ({ ...s })));
  const [dirty, setDirty] = useState(new Set());
  const upd = (id, patch) => { setRows((r) => r.map((s) => (s.id === id ? { ...s, ...patch } : s))); setDirty((d) => new Set(d).add(id)); };
  const num = (v) => (v === '' ? null : Number(v));
  const places = cities.filter((c) => c.key !== 'transito');

  const saveAll = async () => {
    for (const s of rows.filter((x) => dirty.has(x.id))) await onSave(s.id, s);
    onClose();
  };
  const add = async () => {
    const last = rows[rows.length - 1];
    const created = await onCreate({ city: last?.city || places[0]?.key || null, name: '', check_in: last?.check_out || trip.start, check_out: last?.check_out || trip.end });
    setRows((r) => [...r, created]);
    setDirty((d) => new Set(d).add(created.id));
  };
  const del = async (s) => {
    if (!window.confirm(`Excluir a hospedagem "${s.name || 'sem nome'}"?`)) return;
    await onDelete(s.id);
    setRows((r) => r.filter((x) => x.id !== s.id));
  };

  return (
    <Modal title="Hospedagens" onClose={onClose} wide footer={<><button onClick={add}>+ Hospedagem</button><span className="spacer" /><button onClick={onClose}>Fechar</button><button className="primary" disabled={!dirty.size} onClick={saveAll}>Salvar alterações</button></>}>
      <div className="stays">
        {rows.length === 0 && <div className="empty">Nenhuma hospedagem ainda. Cadastre onde você vai dormir para ver a rota entre cidades no mapa.</div>}
        {rows.map((s) => (
          <div className="stay-card" key={s.id} style={{ '--c': cityMap[s.city]?.color }}>
            <div className="stay-city">{cityMap[s.city]?.emoji} {cityMap[s.city]?.name || 'Sem cidade'} <button className="link-btn danger-txt" onClick={() => del(s)}>Excluir</button></div>
            <div className="form">
              <label className="full">Nome<input value={s.name || ''} onChange={(e) => upd(s.id, { name: e.target.value })} /></label>
              <label>Cidade
                <select value={s.city || ''} onChange={(e) => upd(s.id, { city: e.target.value || null })}>
                  <option value="">—</option>
                  {places.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.name}</option>)}
                </select>
              </label>
              <label>Endereço<input value={s.address || ''} onChange={(e) => upd(s.id, { address: e.target.value })} /></label>
              <label>Check-in<input type="date" value={s.check_in || ''} onChange={(e) => upd(s.id, { check_in: e.target.value })} /></label>
              <label>Check-out<input type="date" value={s.check_out || ''} onChange={(e) => upd(s.id, { check_out: e.target.value })} /></label>
              <label>Lat<input type="number" step="0.0001" value={s.lat ?? ''} onChange={(e) => upd(s.id, { lat: num(e.target.value) })} /></label>
              <label>Lng<input type="number" step="0.0001" value={s.lng ?? ''} onChange={(e) => upd(s.id, { lng: num(e.target.value) })} /></label>
              <div className="full"><GeocodeBox initial={s.address || s.name} onPick={(lat, lng) => upd(s.id, { lat, lng })} /></div>
              <label className="full">Notas<input value={s.notes || ''} onChange={(e) => upd(s.id, { notes: e.target.value })} /></label>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function BudgetModal({ activities, cityMap, days, fx, onRate, onClose }) {
  const [rate, setRate] = useState(String(fx.rate));
  const r = Number(rate.replace(',', '.')) || 0;
  const home = (n) => (fx.convert && r > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: fx.home }).format(n * r) : '');
  const withCost = activities.filter((a) => a.cost > 0);
  const total = withCost.reduce((s, a) => s + a.cost, 0);
  const byDay = days.map((d) => ({ d, v: withCost.filter((a) => a.day === d).reduce((s, a) => s + a.cost, 0) })).filter((x) => x.v);
  const byCityObj = {};
  withCost.forEach((a) => { byCityObj[a.city || '—'] = (byCityObj[a.city || '—'] || 0) + a.cost; });
  const byCity = Object.entries(byCityObj).sort((x, y) => y[1] - x[1]);

  return (
    <Modal title={`Orçamento (${fx.cur})`} onClose={onClose} wide footer={<><span className="spacer" /><button onClick={onClose}>Fechar</button></>}>
      <div className="budget-top">
        {fx.cur !== fx.home && (
          <label>1 {fx.cur} =
            <input value={rate} onChange={(e) => setRate(e.target.value)} onBlur={() => r > 0 && onRate(r)} inputMode="decimal" /> {fx.home}
          </label>
        )}
        <div className="big"><b>{fx.fmt(total)}</b><span>{home(total)}</span></div>
      </div>
      <p className="muted small">Só entram os custos que você preencheu nas atividades.{fx.cur !== fx.home && ' O câmbio é editável, confira o do dia.'} Moedas e câmbio podem ser alterados em “Editar viagem”.</p>
      {withCost.length === 0 && <div className="empty">Nenhum custo cadastrado ainda. Preencha o campo “Custo” ao editar uma atividade.</div>}
      <div className="two-col">
        <div>
          <div className="section-title">Por item</div>
          <table className="tbl">
            <tbody>
              {withCost.sort((a, b) => a.day.localeCompare(b.day)).map((a) => (
                <tr key={a.id}><td>{fmtDay(a.day)}</td><td>{a.title}</td><td className="r">{fx.fmt(a.cost)}</td><td className="r muted">{home(a.cost)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="section-title">Por cidade</div>
          <table className="tbl">
            <tbody>
              {byCity.map(([k, v]) => (
                <tr key={k}><td>{cityMap[k]?.emoji} {cityMap[k]?.name || k}</td><td className="r">{fx.fmt(v)}</td><td className="r muted">{home(v)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="section-title">Por dia</div>
          <table className="tbl">
            <tbody>
              {byDay.map(({ d, v }) => (
                <tr key={d}><td>{fmtDay(d)}</td><td className="r">{fx.fmt(v)}</td><td className="r muted">{home(v)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

const EMOJIS = ['🧳', '✈️', '🏖️', '🏔️', '🌆', '🗺️', '🚗', '🚆', '🏝️', '🌍', '🗼', '🏕️']; // taste-skill-ignore: user-chosen trip emoji

export function TripModal({ trip, onSave, onDelete, onDuplicate, onClose }) {
  const isNew = !trip.id;
  const [d, setD] = useState(trip);
  const set = (p) => setD((x) => ({ ...x, ...p }));
  const valid = d.name?.trim() && d.start && d.end && d.end >= d.start;
  const sameCur = d.currency === d.home_currency;
  return (
    <Modal
      title={isNew ? 'Nova viagem' : 'Editar viagem'}
      onClose={onClose}
      footer={
        <>
          {!isNew && <button className="danger" onClick={onDelete}>Excluir</button>}
          {!isNew && <button onClick={onDuplicate}>Duplicar</button>}
          <span className="spacer" />
          <button onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={!valid} onClick={() => onSave({ ...d, name: d.name.trim(), rate: sameCur ? 1 : Number(String(d.rate).replace(',', '.')) || 1 })}>{isNew ? 'Criar viagem' : 'Salvar'}</button>
        </>
      }
    >
      <div className="form">
        <label className="full">Nome da viagem
          <input autoFocus value={d.name || ''} onChange={(e) => set({ name: e.target.value })} placeholder="Ex: Portugal 2027" />
        </label>
        <label className="full">Subtítulo (opcional)
          <input value={d.subtitle || ''} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Ex: Lua de mel, mochilão, trabalho…" />
        </label>
        <div className="full emoji-row">
          {EMOJIS.map((e) => <button type="button" key={e} className={d.emoji === e ? 'on' : ''} onClick={() => set({ emoji: e })}>{e}</button>)}
        </div>
        <label>Início<input type="date" value={d.start || ''} onChange={(e) => set({ start: e.target.value, end: d.end && d.end >= e.target.value ? d.end : e.target.value })} /></label>
        <label>Fim<input type="date" min={d.start || undefined} value={d.end || ''} onChange={(e) => set({ end: e.target.value })} /></label>
        <label>Moeda da viagem
          <select value={d.currency} onChange={(e) => set({ currency: e.target.value })}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Sua moeda
          <select value={d.home_currency} onChange={(e) => set({ home_currency: e.target.value })}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        {!sameCur && (
          <label className="full">Câmbio: 1 {d.currency} = quantos {d.home_currency}?
            <input inputMode="decimal" value={d.rate ?? ''} onChange={(e) => set({ rate: e.target.value })} />
          </label>
        )}
        {d.end && d.start && d.end < d.start && <div className="full warn">A data final é anterior à inicial.</div>}
      </div>
    </Modal>
  );
}

export function CitiesModal({ cities, onCreate, onSave, onDelete, onClose }) {
  const [rows, setRows] = useState(() => cities.filter((c) => c.key !== 'transito').map((c) => ({ ...c })));
  const [dirty, setDirty] = useState(new Set());
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const upd = (id, patch) => { setRows((r) => r.map((c) => (c.id === id ? { ...c, ...patch } : c))); setDirty((d) => new Set(d).add(id)); };
  const num = (v) => (v === '' ? null : Number(v));

  // adiciona já com a posição encontrada no mapa (OpenStreetMap), se a busca funcionar
  const add = async () => {
    const n = name.trim();
    if (!n) return;
    setBusy(true); setErr('');
    let pos = {};
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=pt-BR&q=${encodeURIComponent(n)}`);
      const j = r.ok ? await r.json() : [];
      if (j[0]) pos = { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
      else setErr('Não achei a posição no mapa; preencha lat/lng abaixo.');
    } catch { setErr('Sem busca de posição agora; preencha lat/lng abaixo.'); }
    const created = await onCreate({ name: n, ...pos });
    setRows((r) => [...r, created]);
    setName('');
    setBusy(false);
  };
  const del = async (c) => {
    if (!window.confirm(`Excluir "${c.name}"? As atividades dessa cidade ficam sem cidade.`)) return;
    await onDelete(c.id);
    setRows((r) => r.filter((x) => x.id !== c.id));
  };
  const saveAll = async () => {
    for (const c of rows.filter((x) => dirty.has(x.id))) await onSave(c.id, c);
    onClose();
  };

  return (
    <Modal title="Cidades e locais" onClose={onClose} wide footer={<><span className="spacer" /><button onClick={onClose}>Fechar</button><button className="primary" disabled={!dirty.size} onClick={saveAll}>Salvar alterações</button></>}>
      <p className="muted small">As cidades agrupam as atividades de cada dia, colorem o calendário e aparecem no mapa da visão geral.</p>
      <div className="row add-city">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova cidade (ex: Lisboa)" onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <button className="primary" disabled={busy || !name.trim()} onClick={add}>{busy ? '…' : '+ Adicionar'}</button>
      </div>
      {err && <div className="warn soft pad">{err}</div>}
      {rows.length === 0 && <div className="empty">Nenhuma cidade ainda.</div>}
      <div className="city-rows">
        {rows.map((c) => (
          <div className="city-row" key={c.id}>
            <input className="emo" value={c.emoji || ''} maxLength={4} onChange={(e) => upd(c.id, { emoji: e.target.value })} aria-label="Emoji" />
            <input value={c.name || ''} onChange={(e) => upd(c.id, { name: e.target.value })} aria-label="Nome" />
            <input type="color" value={c.color || '#2874a6'} onChange={(e) => upd(c.id, { color: e.target.value })} aria-label="Cor" />
            <input type="number" step="0.0001" placeholder="lat" value={c.lat ?? ''} onChange={(e) => upd(c.id, { lat: num(e.target.value) })} aria-label="Latitude" />
            <input type="number" step="0.0001" placeholder="lng" value={c.lng ?? ''} onChange={(e) => upd(c.id, { lng: num(e.target.value) })} aria-label="Longitude" />
            <button className="icon-btn" onClick={() => del(c)} title="Excluir" aria-label="Excluir"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg></button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
