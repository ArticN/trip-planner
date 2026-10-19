import { useEffect, useState } from 'react';
import { KINDS, KIND_KEYS, TRANSPORTS, hasCoords, yen, brl, fmtDay } from './util.js';

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
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// busca de endereços/locais (OpenStreetMap Nominatim) — roda no navegador, só quando você clica
function GeocodeBox({ initial, onPick }) {
  const [q, setQ] = useState(initial || '');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true); setErr(''); setRes(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=pt-BR&countrycodes=jp&q=${encodeURIComponent(q)}`;
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
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar local no Japão (ex: Kinkaku-ji)" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} />
        <button type="button" onClick={search} disabled={busy}>{busy ? '…' : 'Buscar'}</button>
      </div>
      {err && <div className="warn soft pad">{err}</div>}
      {res && res.length === 0 && <div className="muted small pad">Nada encontrado. Tente outro nome ou em inglês/romaji.</div>}
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

export function EditModal({ draft, isNew, cities, days, onChange, onSave, onDelete, onClose, onPickMap }) {
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
          <input autoFocus value={draft.title || ''} onChange={(e) => set({ title: e.target.value })} placeholder="Ex: Fushimi Inari Taisha" />
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
        <label>Custo (¥)
          <input type="number" min="0" step="100" value={draft.cost_jpy ?? ''} onChange={(e) => set({ cost_jpy: num(e.target.value) })} />
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
            <button type="button" onClick={onPickMap}>📍 Marcar no mapa</button>
            {hasCoords(draft) && <button type="button" onClick={() => set({ lat: null, lng: null })}>Limpar</button>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function StaysModal({ stays, cities, onSave, onClose }) {
  const cityMap = Object.fromEntries(cities.map((c) => [c.key, c]));
  const [rows, setRows] = useState(() => stays.map((s) => ({ ...s })));
  const [dirty, setDirty] = useState(new Set());
  const upd = (id, patch) => { setRows((r) => r.map((s) => (s.id === id ? { ...s, ...patch } : s))); setDirty((d) => new Set(d).add(id)); };
  const num = (v) => (v === '' ? null : Number(v));

  const saveAll = async () => {
    for (const s of rows.filter((x) => dirty.has(x.id))) await onSave(s.id, s);
    onClose();
  };

  return (
    <Modal title="🏨 Hospedagens" onClose={onClose} wide footer={<><span className="spacer" /><button onClick={onClose}>Fechar</button><button className="primary" disabled={!dirty.size} onClick={saveAll}>Salvar alterações</button></>}>
      <div className="stays">
        {rows.map((s) => (
          <div className="stay-card" key={s.id} style={{ '--c': cityMap[s.city]?.color }}>
            <div className="stay-city">{cityMap[s.city]?.emoji} {cityMap[s.city]?.name}</div>
            <div className="form">
              <label className="full">Nome<input value={s.name || ''} onChange={(e) => upd(s.id, { name: e.target.value })} /></label>
              <label className="full">Endereço<input value={s.address || ''} onChange={(e) => upd(s.id, { address: e.target.value })} /></label>
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

export function BudgetModal({ activities, cityMap, days, brlRate, onRate, onClose }) {
  const [rate, setRate] = useState(String(brlRate));
  const r = Number(rate.replace(',', '.')) || 0;
  const withCost = activities.filter((a) => a.cost_jpy > 0);
  const total = withCost.reduce((s, a) => s + a.cost_jpy, 0);
  const byDay = days.map((d) => ({ d, v: withCost.filter((a) => a.day === d).reduce((s, a) => s + a.cost_jpy, 0) })).filter((x) => x.v);
  const byCityObj = {};
  withCost.forEach((a) => { byCityObj[a.city || '—'] = (byCityObj[a.city || '—'] || 0) + a.cost_jpy; });
  const byCity = Object.entries(byCityObj).sort((x, y) => y[1] - x[1]);

  return (
    <Modal title="💴 Orçamento (ingressos e atividades)" onClose={onClose} wide footer={<><span className="spacer" /><button onClick={onClose}>Fechar</button></>}>
      <div className="budget-top">
        <label>1 ¥ =
          <input value={rate} onChange={(e) => setRate(e.target.value)} onBlur={() => r > 0 && onRate(r)} inputMode="decimal" /> R$
        </label>
        <div className="big"><b>{yen(total)}</b><span>{brl(total * r)}</span></div>
      </div>
      <p className="muted small">Só entram os custos que você preencheu nas atividades (ingressos e parques). Refeições, transporte e compras não estão contabilizados. O câmbio é editável, confira o do dia.</p>
      <div className="two-col">
        <div>
          <div className="section-title">Por item</div>
          <table className="tbl">
            <tbody>
              {withCost.sort((a, b) => a.day.localeCompare(b.day)).map((a) => (
                <tr key={a.id}><td>{fmtDay(a.day)}</td><td>{a.title}</td><td className="r">{yen(a.cost_jpy)}</td><td className="r muted">{brl(a.cost_jpy * r)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="section-title">Por cidade</div>
          <table className="tbl">
            <tbody>
              {byCity.map(([k, v]) => (
                <tr key={k}><td>{cityMap[k]?.emoji} {cityMap[k]?.name || k}</td><td className="r">{yen(v)}</td><td className="r muted">{brl(v * r)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="section-title">Por dia</div>
          <table className="tbl">
            <tbody>
              {byDay.map(({ d, v }) => (
                <tr key={d}><td>{fmtDay(d)}</td><td className="r">{yen(v)}</td><td className="r muted">{brl(v * r)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
