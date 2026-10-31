import { OSM_LANG, osmName } from './osmName.js';
import { Star } from './Stars.jsx';
import { useEffect, useState } from 'react';
import { parseLinks, linkLabel } from './Extras.jsx';
import { AttachmentsField } from './Attachments.jsx';
import { RIDE_MODES } from './travel.js';
import { SCOPES } from './geo.js';
import { KINDS, KIND_KEYS, SLOTS, TRANSPORTS, CURRENCIES, TIMEZONES, localTz, hasCoords, fmtDay } from './util.js';

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
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&${OSM_LANG}&q=${encodeURIComponent(q)}`;
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
          {res.map((r) => {
            const { title, local } = osmName(r);
            return (
              <li key={r.place_id} onClick={() => { onPick(parseFloat(r.lat), parseFloat(r.lon), r.display_name); setRes(null); }}>
                <b>{title}{local && <small> {local}</small>}</b>
                <span>{r.display_name}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// estação de embarque ou desembarque: nome + busca da posição no mapa
function StationInput({ label, value, onChange }) {
  const v = value || {};
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const placed = v.lat != null && v.lng != null && v.lat !== '' && v.lng !== '';
  const search = async () => {
    const q = (v.name || '').trim();
    if (!q) return;
    setBusy(true); setErr(''); setRes(null);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&${OSM_LANG}&q=${encodeURIComponent(/station|esta|駅/i.test(q) ? q : `${q} station`)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setRes(await r.json());
    } catch (e) { setErr(`Não consegui buscar (${e.message}). Digite lat/lng abaixo.`); } finally { setBusy(false); }
  };
  return (
    <div className="station-in">
      <div className="legend small">{label} {placed ? <span className="ok">● no mapa</span> : <span className="muted">○ sem posição</span>}</div>
      <div className="row">
        <input value={v.name || ''} onChange={(e) => onChange({ ...v, name: e.target.value })} placeholder="Nome da estação (ex: Shiodome)" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} />
        <button type="button" onClick={search} disabled={busy}>{busy ? '…' : 'Buscar'}</button>
      </div>
      {err && <div className="warn soft pad">{err}</div>}
      {res && res.length === 0 && <div className="muted small pad">Nada encontrado. Tente o nome em inglês, com a cidade.</div>}
      {res && res.length > 0 && (
        <ul className="geo-res">
          {res.map((r) => {
            const { title, local } = osmName(r);
            return (
              <li key={r.place_id} onClick={() => { onChange({ ...v, name: v.name || title, lat: +parseFloat(r.lat).toFixed(5), lng: +parseFloat(r.lon).toFixed(5) }); setRes(null); }}>
                <b>{title}{local && <small> {local}</small>}</b>
                <span>{r.display_name}</span>
              </li>
            );
          })}
        </ul>
      )}
      <details className="coords">
        <summary>Digitar latitude e longitude</summary>
        <div className="row">
          <label>Lat<input type="number" step="0.0001" value={v.lat ?? ''} onChange={(e) => onChange({ ...v, lat: e.target.value === '' ? null : Number(e.target.value) })} /></label>
          <label>Lng<input type="number" step="0.0001" value={v.lng ?? ''} onChange={(e) => onChange({ ...v, lng: e.target.value === '' ? null : Number(e.target.value) })} /></label>
        </div>
      </details>
    </div>
  );
}

// trechos de trem/metrô para chegar à atividade (guardados como JSON no campo route).
// os trechos a pé entre a atividade anterior, as estações e esta são calculados sozinhos
function RouteField({ value, onChange, fxCur }) {
  let raw = value;
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = null; } }
  const rides = Array.isArray(raw?.rides) ? raw.rides : [];
  const put = (list) => onChange(list.length ? { ...raw, rides: list } : null);
  const upd = (i, patch) => put(rides.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const add = () => {
    const last = rides[rides.length - 1];
    // baldeação: o novo trecho começa na estação onde o anterior termina
    put([...rides, { mode: last?.mode || 'metro', line: '', from: last?.to ? { ...last.to } : { name: '' }, to: { name: '' } }]);
  };
  return (
    <details className="full fieldset route-field" open={rides.length > 0}>
      <summary className="legend">Trem ou metrô até aqui {rides.length > 0 && <span className="ok">● {rides.length} {rides.length > 1 ? 'trechos' : 'trecho'}</span>}</summary>
      <div className="muted small">Cadastre as estações de embarque e desembarque. O mapa desenha a linha entre elas e o caminho a pé desde a atividade anterior (ou da hospedagem, na primeira do dia) até a estação, e da estação até aqui. Com mais de um trecho, a troca de linha é a pé entre as estações.</div>
      {rides.map((r, i) => (
        <div key={i} className="ride-edit">
          <div className="form">
            <label>Tipo
              <select value={r.mode || 'metro'} onChange={(e) => upd(i, { mode: e.target.value })}>
                {Object.entries(RIDE_MODES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </select>
            </label>
            <label>Linha<input value={r.line || ''} onChange={(e) => upd(i, { line: e.target.value })} placeholder="Ex: Toei Oedo, JR Yamanote" /></label>
            <label>Sigla<input value={r.code || ''} onChange={(e) => upd(i, { code: e.target.value })} placeholder="Ex: E, JY" maxLength={6} /></label>
            <label>Cor da linha<input type="color" value={/^#[0-9a-f]{6}$/i.test(r.color || '') ? r.color : (RIDE_MODES[r.mode] || RIDE_MODES.metro).color} onChange={(e) => upd(i, { color: e.target.value })} /></label>
            <div className="full"><StationInput label="Embarque" value={r.from} onChange={(from) => upd(i, { from })} /></div>
            <div className="full"><StationInput label="Desembarque" value={r.to} onChange={(to) => upd(i, { to })} /></div>
            <label>Sentido<input value={r.dir || ''} onChange={(e) => upd(i, { dir: e.target.value })} placeholder="Ex: sentido Tochomae" /></label>
            <label>Minutos no trem<input type="number" min="0" value={r.min ?? ''} onChange={(e) => upd(i, { min: e.target.value === '' ? null : Number(e.target.value) })} placeholder="estimado se vazio" /></label>
            <label>Valor ({fxCur})<input type="number" min="0" step="any" value={r.cost ?? ''} onChange={(e) => upd(i, { cost: e.target.value === '' ? null : Number(e.target.value) })} /></label>
          </div>
          {r.stops?.length > 0 && <div className="muted small">{r.stops.length} {r.stops.length > 1 ? 'estações intermediárias' : 'estação intermediária'} no traçado</div>}
          <div className="row"><button type="button" className="mini" onClick={() => put(rides.filter((_, k) => k !== i))}>Remover trecho</button></div>
        </div>
      ))}
      <div className="row"><button type="button" onClick={add}>{rides.length ? '+ Baldeação (outro trecho)' : '+ Trecho de trem ou metrô'}</button></div>
    </details>
  );
}

// links (comprovantes, ingressos, sites), guardados como JSON
function LinksField({ value, onChange }) {
  const links = parseLinks(value);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const save = (l) => onChange(l.length ? JSON.stringify(l) : null);
  const add = () => {
    let u = url.trim();
    if (!u) return;
    if (!/^[a-z]+:/i.test(u)) u = `https://${u}`;
    save([...links, { url: u, label: label.trim() || null }]);
    setUrl(''); setLabel('');
  };
  return (
    <div className="full fieldset">
      <div className="legend">Links e comprovantes</div>
      {links.length > 0 && (
        <ul className="link-list">
          {links.map((l, i) => (
            <li key={i}>
              <a href={l.url} target="_blank" rel="noreferrer">{linkLabel(l)}</a>
              <button type="button" className="icon-btn sm" aria-label="Remover link" onClick={() => save(links.filter((_, j) => j !== i))}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="row">
        <label>Endereço<input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (reserva, ingresso, Google Drive)" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} /></label>
        <label>Nome (opcional)<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: ingresso" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} /></label>
        <button type="button" onClick={add} disabled={!url.trim()}>Adicionar</button>
      </div>
    </div>
  );
}

// campo de fuso com sugestões (vazio = fuso da viagem)
function TzInput({ value, onChange, placeholder }) {
  return (
    <>
      <input list="tz-list" value={value || ''} onChange={(e) => onChange(e.target.value.trim() || null)} placeholder={placeholder} />
      <datalist id="tz-list">{TIMEZONES.map((t) => <option key={t} value={t} />)}</datalist>
    </>
  );
}

export function EditModal({ draft, isNew, isIdea, altInfo = null, onSplitAlt, onToIdeas, cities, days, fxCur, tripTz, onChange, onSave, onDelete, onClose, onPickMap, files = [], onAddFile, onRemoveFile }) {
  const set = (patch) => onChange({ ...draft, ...patch });
  const num = (v) => (v === '' || v == null ? null : Number(v));
  const valid = draft.title?.trim() && (isIdea || draft.day);

  return (
    <Modal
      title={isIdea ? (isNew ? 'Nova ideia' : 'Editar ideia') : isNew ? (altInfo ? 'Nova opção para este horário' : 'Nova atividade') : 'Editar atividade'}
      onClose={onClose}
      footer={
        <>
          {!isNew && <button className="danger" onClick={onDelete}>Excluir</button>}
          {!isNew && !isIdea && <button onClick={onToIdeas} title="Tira do dia e guarda na lista de ideias">Mover para ideias</button>}
          <span className="spacer" />
          <button onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={!valid} onClick={onSave}>Salvar</button>
        </>
      }
    >
      <div className="form">
        {altInfo && (
          <div className="full alt-note">
            <span>Opção {altInfo.index} de {altInfo.count} neste horário{altInfo.index === 1 && !isNew ? ' · principal' : ''}</span>
            {!isNew && <button type="button" className="mini" onClick={onSplitAlt} title="Vira uma atividade separada, fora do carrossel">Separar das outras opções</button>}
          </div>
        )}
        <label className="full">Título
          <input autoFocus value={draft.title || ''} onChange={(e) => set({ title: e.target.value })} placeholder="Ex: Museu do Louvre" />
        </label>
        {!isIdea && <label>Dia
          <select value={draft.day} onChange={(e) => set({ day: e.target.value })}>
            {days.map((d) => <option key={d} value={d}>{fmtDay(d)}</option>)}
          </select>
        </label>}
        {!isIdea && (
          <label>Bloco do dia
            <select value={draft.slot || ''} onChange={(e) => set({ slot: e.target.value || null })}>
              <option value="">Automático (pelo horário)</option>
              {SLOTS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
            </select>
          </label>
        )}
        <label>Tipo
          <select value={draft.kind || 'sight'} onChange={(e) => set({ kind: e.target.value })}>
            {KIND_KEYS.map((k) => <option key={k} value={k}>{KINDS[k].label}</option>)}
          </select>
        </label>
        {!isIdea && <label>Início
          <input type="time" value={draft.start || ''} onChange={(e) => set({ start: e.target.value || null })} />
        </label>}
        {!isIdea && <label>Fim
          <input type="time" value={draft.end || ''} onChange={(e) => set({ end: e.target.value || null })} />
        </label>}
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
        <label>{isIdea ? 'Custo' : 'Custo previsto'} ({fxCur})
          <input type="number" min="0" step="any" value={draft.cost ?? ''} onChange={(e) => set({ cost: num(e.target.value) })} />
        </label>
        {!isIdea && (
          <label>Gasto real ({fxCur})
            <input type="number" min="0" step="any" value={draft.spent ?? ''} onChange={(e) => set({ spent: num(e.target.value) })} placeholder="quanto saiu de fato" />
          </label>
        )}
        {!isIdea && (draft.spent != null || files.some((f) => f.kind === 'receipt') || (draft._pending || []).some((f) => f.kind === 'receipt')) && (
          <AttachmentsField
            kind="receipt" files={files} onAdd={onAddFile} onRemove={onRemoveFile}
            pending={draft._pending || []} onPending={isNew ? (p) => set({ _pending: p }) : undefined}
          />
        )}
        <label>Endereço
          <input value={draft.location || ''} onChange={(e) => set({ location: e.target.value })} placeholder="Rua, número, bairro (vale só o texto, sem precisar de mapa)" />
        </label>
        <label className="full">Detalhes
          <textarea rows={3} value={draft.details || ''} onChange={(e) => set({ details: e.target.value })} />
        </label>
        {!isIdea && !['flight', 'move'].includes(draft.kind) && <RouteField value={draft.route} onChange={(route) => set({ route })} fxCur={fxCur} />}
        {!isIdea && (draft.kind === 'flight' || draft.kind === 'move' || draft.from_code || draft.ref) && (
          <div className="full fieldset">
            <div className="legend">Trecho (voo, trem, ônibus)</div>
            <div className="form">
              <label>Nº do voo / trem<input value={draft.ref || ''} onChange={(e) => set({ ref: e.target.value })} placeholder="Ex: LX 93" /></label>
              <label>Chega no dia
                <select value={draft.end_day || ''} onChange={(e) => set({ end_day: e.target.value || null })}>
                  <option value="">mesmo dia</option>
                  {days.filter((d) => d > draft.day).map((d) => <option key={d} value={d}>{fmtDay(d)}</option>)}
                </select>
              </label>
              <label>Saída (código)<input value={draft.from_code || ''} onChange={(e) => set({ from_code: e.target.value.toUpperCase() })} placeholder="GRU, Tóquio…" /></label>
              <label>Chegada (código)<input value={draft.to_code || ''} onChange={(e) => set({ to_code: e.target.value.toUpperCase() })} placeholder="NRT, Kyoto…" /></label>
              {draft.kind === 'flight' && (
                <label className="full">Escalas (códigos dos aeroportos)<input value={draft.via || ''} onChange={(e) => set({ via: e.target.value.toUpperCase() || null })} placeholder="Ex: ZRH ou ICN, ADD (na ordem do voo)" /></label>
              )}
              <label>Fuso da saída<TzInput value={draft.start_tz} onChange={(v) => set({ start_tz: v })} placeholder={tripTz || 'fuso da viagem'} /></label>
              <label>Fuso da chegada<TzInput value={draft.end_tz} onChange={(v) => set({ end_tz: v })} placeholder={tripTz || 'fuso da viagem'} /></label>
            </div>
            <div className="muted small">Digite os horários no fuso local de cada ponta, como estão no bilhete. A duração é calculada com os fusos.</div>
          </div>
        )}
        <label className="full">Notas e reservas
          <textarea rows={2} value={draft.notes || ''} onChange={(e) => set({ notes: e.target.value })} placeholder="Código de reserva, horário de check-in, o que levar…" />
        </label>
        <LinksField value={draft.links} onChange={(links) => set({ links })} />
        <AttachmentsField
          files={files} onAdd={onAddFile} onRemove={onRemoveFile}
          pending={draft._pending || []} onPending={isNew ? (p) => set({ _pending: p }) : undefined}
        />
        {!isIdea && (
          <fieldset className="full after-visit">
            <legend>Depois de visitar</legend>
            <div className="stars-input" role="radiogroup" aria-label="Avaliação">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={draft.rating === n} aria-label={`${n} de 5`}
                  className={n <= (draft.rating || 0) ? 'on' : ''} onClick={() => set({ rating: draft.rating === n ? null : n })}><Star size={24} /></button>
              ))}
              <span className="muted small">{draft.rating ? `${draft.rating} de 5` : 'sem nota'}</span>
            </div>
            <textarea rows={2} value={draft.review || ''} onChange={(e) => set({ review: e.target.value })} placeholder="Como foi? Valeu a pena, dicas para a próxima vez…" />
          </fieldset>
        )}

        <div className="full fieldset">
          <div className="legend">Posição no mapa {hasCoords(draft) ? <span className="ok">● definida</span> : <span className="muted">○ sem posição</span>}</div>
          <GeocodeBox
            key={draft.location || draft.title}
            initial={draft.location || draft.title}
            placeholder="Buscar pelo endereço ou nome do lugar"
            onPick={(lat, lng, name) => set({ lat, lng, location: draft.location || name.split(',').slice(0, 3).join(',').trim() })}
          />
          <div className="row">
            <button type="button" onClick={onPickMap}>Marcar no mapa</button>
            {hasCoords(draft) && <button type="button" onClick={() => set({ lat: null, lng: null })}>Limpar posição</button>}
          </div>
          <details className="coords">
            <summary>Digitar latitude e longitude</summary>
            <div className="row">
              <label>Lat<input type="number" step="0.0001" value={draft.lat ?? ''} onChange={(e) => set({ lat: num(e.target.value) })} /></label>
              <label>Lng<input type="number" step="0.0001" value={draft.lng ?? ''} onChange={(e) => set({ lng: num(e.target.value) })} /></label>
            </div>
          </details>
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
          <div className="stay-edit" key={s.id} style={{ '--c': cityMap[s.city]?.color }}>
            <div className="stay-edit-city">{cityMap[s.city]?.emoji} {cityMap[s.city]?.name || 'Sem cidade'} <button className="link-btn danger-txt" onClick={() => del(s)}>Excluir</button></div>
            <div className="form">
              <label className="full">Nome<input value={s.name || ''} onChange={(e) => upd(s.id, { name: e.target.value })} /></label>
              <label>Cidade
                <select value={s.city || ''} onChange={(e) => upd(s.id, { city: e.target.value || null })}>
                  <option value="">—</option>
                  {places.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.name}</option>)}
                </select>
              </label>
              <label>Endereço<input value={s.address || ''} onChange={(e) => upd(s.id, { address: e.target.value })} /></label>
              <label>Check-in
                <span className="pair"><input type="date" value={s.check_in || ''} onChange={(e) => upd(s.id, { check_in: e.target.value })} /><input type="time" aria-label="Horário do check-in" value={s.check_in_time || ''} onChange={(e) => upd(s.id, { check_in_time: e.target.value || null })} /></span>
              </label>
              <label>Check-out
                <span className="pair"><input type="date" value={s.check_out || ''} onChange={(e) => upd(s.id, { check_out: e.target.value })} /><input type="time" aria-label="Horário do check-out" value={s.check_out_time || ''} onChange={(e) => upd(s.id, { check_out_time: e.target.value || null })} /></span>
              </label>
              <label>Nº da reserva<input value={s.booking || ''} onChange={(e) => upd(s.id, { booking: e.target.value })} /></label>
              <label>Preço total ({trip.currency || 'BRL'})<input type="number" min="0" step="any" value={s.cost ?? ''} onChange={(e) => upd(s.id, { cost: num(e.target.value) })} /></label>
              <label className="full">Link da reserva<input value={s.link || ''} onChange={(e) => upd(s.id, { link: e.target.value })} placeholder="https://…" /></label>
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

export function BudgetModal({ activities, stays = [], cityMap, days, fx, onRate, rateAuto, rateAt, onRateAuto, onClose, files = [] }) {
  const receiptOf = (id) => files.filter((f) => f.activity_id === id && f.kind === 'receipt');
  const [rate, setRate] = useState(String(fx.rate));
  useEffect(() => setRate(String(fx.rate)), [fx.rate]);
  const r = Number(rate.replace(',', '.')) || 0;
  const home = (n) => (fx.convert && r > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: fx.home }).format(n * r) : '');
  const withCost = activities.filter((a) => a.cost > 0 || a.spent != null);
  // gasto real: só nas atividades em que você anotou quanto saiu; compara com o previsto delas
  const tracked = activities.filter((a) => a.spent != null);
  const spentTotal = tracked.reduce((t, a) => t + a.spent, 0);
  const trackedPlan = tracked.reduce((t, a) => t + (a.cost || 0), 0);
  const diff = spentTotal - trackedPlan;
  const staysCost = stays.filter((s) => s.cost > 0);
  const staysTotal = staysCost.reduce((t, s) => t + s.cost, 0);
  const total = withCost.reduce((s, a) => s + (a.cost || 0), 0) + staysTotal;
  const byDay = days.map((d) => ({ d, v: withCost.filter((a) => a.day === d).reduce((s, a) => s + (a.cost || 0), 0) })).filter((x) => x.v);
  const byCityObj = {};
  withCost.forEach((a) => { byCityObj[a.city || '—'] = (byCityObj[a.city || '—'] || 0) + (a.cost || 0); });
  staysCost.forEach((s) => { byCityObj[s.city || '—'] = (byCityObj[s.city || '—'] || 0) + s.cost; });
  const byCity = Object.entries(byCityObj).sort((x, y) => y[1] - x[1]);

  return (
    <Modal title={`Orçamento (${fx.cur})`} onClose={onClose} wide footer={<><span className="spacer" /><button onClick={onClose}>Fechar</button></>}>
      <div className="budget-top">
        {fx.cur !== fx.home && (
          <div className="rate-box">
            <label>1 {fx.cur} =
              <input value={rate} onChange={(e) => setRate(e.target.value)} onBlur={() => r > 0 && r !== fx.rate && onRate(r)} inputMode="decimal" /> {fx.home}
            </label>
            <label className="check-line">
              <input type="checkbox" checked={!!rateAuto} onChange={(e) => onRateAuto(e.target.checked)} />
              Atualizar sozinho com a cotação do dia{rateAuto && rateAt ? ` (atualizada em ${rateAt.slice(8)}/${rateAt.slice(5, 7)})` : ''}
            </label>
          </div>
        )}
        <div className="big"><b>{fx.fmt(total)}</b><span>previsto{home(total) ? ` · ${home(total)}` : ''}</span></div>
      </div>
      {tracked.length > 0 && (
        <div className="spent-box">
          <div><b>{fx.fmt(spentTotal)}</b><span>gasto real em {tracked.length} {tracked.length === 1 ? 'item' : 'itens'}</span></div>
          <div><b>{fx.fmt(trackedPlan)}</b><span>previsto nesses itens</span></div>
          <div className={diff > 0 ? 'over' : 'under'}><b>{diff > 0 ? '+' : diff < 0 ? '−' : ''}{fx.fmt(Math.abs(diff))}</b><span>{diff > 0 ? 'acima do previsto' : diff < 0 ? 'abaixo do previsto' : 'igual ao previsto'}</span></div>
        </div>
      )}
      <p className="muted small">Só entram os custos que você preencheu nas atividades e hospedagens. Anote o “Gasto real” ao editar uma atividade para comparar com o previsto.{fx.cur !== fx.home && ' Com a atualização automática, o câmbio é a cotação comercial do dia; digitar um valor desliga a atualização.'} Moedas e câmbio podem ser alterados em “Editar viagem”.</p>
      {withCost.length === 0 && <div className="empty">Nenhum custo cadastrado ainda. Preencha o campo “Custo” ao editar uma atividade.</div>}
      <div className="two-col">
        <div>
          <div className="section-title">Por item</div>
          <table className="tbl">
            <tbody>
              {withCost.sort((a, b) => a.day.localeCompare(b.day)).map((a) => (
                <tr key={a.id}><td>{fmtDay(a.day)}</td><td>{a.title}</td><td className="r">{a.cost ? fx.fmt(a.cost) : '—'}{a.spent != null && <div className={`spent-cell ${a.spent > (a.cost || 0) ? 'over' : 'under'}`}>gasto {fx.fmt(a.spent)}</div>}{receiptOf(a.id).map((f) => <a key={f.id} className="receipt-link" href={`/api/files/${f.id}`} target="_blank" rel="noreferrer">recibo</a>)}</td><td className="r muted">{a.cost ? home(a.cost) : ''}</td></tr>
              ))}
              {staysCost.map((s) => (
                <tr key={`s${s.id}`}><td>{fmtDay(s.check_in)}</td><td>Hospedagem · {s.name}</td><td className="r">{fx.fmt(s.cost)}</td><td className="r muted">{home(s.cost)}</td></tr>
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

// foto de capa: a imagem escolhida é reduzida no próprio aparelho (cerca de 100 KB) e guardada com a viagem
async function shrinkImage(file, maxW = 1200, maxH = 800) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = url; });
    const k = Math.min(1, maxW / img.width, maxH / img.height);
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.78);
  } finally { URL.revokeObjectURL(url); }
}

function CoverField({ value, onChange }) {
  const [err, setErr] = useState('');
  const isLink = value && !value.startsWith('data:');
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try { setErr(''); onChange(await shrinkImage(f)); } catch { setErr('Não consegui abrir essa imagem.'); }
  };
  return (
    <div className="full cover-field">
      <span className="cover-label">Foto de capa (opcional)</span>
      {value && <div className="cover-preview" style={{ backgroundImage: `url("${value.replace(/"/g, '%22')}")` }} />}
      <div className="cover-actions">
        <label className="btn-like">Escolher foto<input type="file" accept="image/*" hidden onChange={onFile} /></label>
        {value && <button type="button" onClick={() => onChange(null)}>Remover</button>}
      </div>
      <input value={isLink ? value : ''} onChange={(e) => onChange(e.target.value.trim() || null)} placeholder="…ou cole o link de uma imagem (https://…)" />
      {err && <div className="warn">{err}</div>}
    </div>
  );
}

export function TripModal({ trip, place, onSave, onDelete, onDuplicate, onClose }) {
  const isNew = !trip.id;
  const [d, setD] = useState(trip);
  const set = (p) => setD((x) => ({ ...x, ...p }));
  const valid = d.name?.trim() && d.start && d.end && d.end >= d.start;
  // nacional: uma moeda só (a de casa), sem câmbio
  const domestic = (d.scope || place?.auto) === 'domestic';
  const sameCur = domestic || d.currency === d.home_currency;
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
          <button className="primary" disabled={!valid} onClick={() => { const rate = sameCur ? 1 : Number(String(d.rate).replace(',', '.')) || 1; onSave({ ...d, name: d.name.trim(), rate, ...(domestic ? { currency: d.home_currency } : {}), ...(trip.id && rate !== Number(trip.rate) ? { rate_auto: 0 } : {}) }); }}>{isNew ? 'Criar viagem' : 'Salvar'}</button>
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
        <label className="full">Tipo de viagem
          <select value={d.scope || ''} onChange={(e) => set({ scope: e.target.value || null })}>
            <option value="">Automático{place?.auto ? ` (${SCOPES[place.auto].toLowerCase()})` : ''}</option>
            <option value="domestic">Nacional</option>
            <option value="international">Internacional</option>
          </select>
          <small className="muted">{d.scope
            ? (d.scope === 'domestic' ? 'Sem cota da Receita nem câmbio: tudo na sua moeda.' : 'Com cota da Receita nas Compras e câmbio entre as moedas.')
            : place?.auto ? `Pelas cidades da viagem e o país onde você mora${place.regions.length ? ` (${place.regions.slice(0, 3).join(', ')})` : ''}.`
              : 'Nacional quando todas as cidades ficam no país de “Onde moro” (no Meu mapa da tela inicial); até lá, conta como internacional.'}</small>
        </label>
        {domestic ? (
          <label>Moeda
            <select value={d.home_currency} onChange={(e) => set({ home_currency: e.target.value, currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        ) : (
          <>
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
          </>
        )}
        {!sameCur && (
          <label className="full">Câmbio: 1 {d.currency} = quantos {d.home_currency}?
            <input inputMode="decimal" value={d.rate ?? ''} onChange={(e) => set({ rate: e.target.value })} />
          </label>
        )}
        <CoverField value={d.cover} onChange={(cover) => set({ cover })} />
        <label className="full">Fuso horário do destino
          <TzInput value={d.tz} onChange={(v) => set({ tz: v })} placeholder={`Ex: Asia/Tokyo (seu fuso: ${localTz() || '—'})`} />
        </label>
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

// link de só leitura para mandar a quem viaja junto (sem notas, links, reservas, gastos e checklist);
// com "mostrar gastos e ingressos" ligado, o link ganha a análise de gastos e a página de ingressos
// links de visitante: vários por viagem, cada um com nome e as partes que mostra
// (ex.: "Família" com roteiro, gastos e diário; "Amigos" só com o diário)
const SHARE_PARTS = [
  ['plan', 'Roteiro e mapa', 'Atividades, mapa e hospedagens (sem notas, links, códigos de reserva nem custos).'],
  ['money', 'Gastos e ingressos', 'Análise de gastos, compras, custos e notas das atividades e os itens de reserva do checklist. Códigos de reserva e anexos continuam escondidos.'],
  ['diary', 'Diário de viagem', 'O álbum com fotos, legendas, textos e vídeos. Dá para baixar as fotos. A ficha da foto mostra onde ela foi tirada.'],
];
export const SHARE_PRESETS = [
  { name: 'Família', plan: 1, money: 1, diary: 1 },
  { name: 'Amigos', plan: 0, money: 0, diary: 1 },
  { name: 'Roteiro', plan: 1, money: 0, diary: 0 },
];

export function ShareModal({ trip, links = [], onCreate, onUpdate, onRemove, onClose }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = (fn) => async () => { setBusy(true); setErr(''); try { await fn(); } catch (e) { setErr(e.message || 'Não deu certo'); } finally { setBusy(false); } };
  const free = SHARE_PRESETS.filter((p) => !links.some((l) => l.name === p.name));
  return (
    <Modal title="Compartilhar roteiro" onClose={onClose} footer={<><span className="spacer" /><button onClick={onClose}>Fechar</button></>}>
      <p className="muted">Cada link mostra só as partes que você escolher, sem precisar da senha e sem poder editar. Crie um para cada grupo de pessoas: dá para mudar o que cada um mostra ou desativar um sem afetar os outros.</p>
      {links.map((l) => <ShareLinkCard key={l.id} trip={trip} link={l} busy={busy} run={run} onUpdate={onUpdate} onRemove={onRemove} />)}
      <div className="share-new">
        <b>{links.length ? 'Novo link' : 'Criar um link'}</b>
        <div className="share-new-btns">
          {free.map((p) => (
            <button key={p.name} disabled={busy} onClick={run(() => onCreate(p))}>
              + {p.name} <span className="muted small">({SHARE_PARTS.filter(([k]) => p[k]).map(([, l]) => l.split(' ')[0].toLowerCase()).join(', ')})</span>
            </button>
          ))}
          <button disabled={busy} onClick={run(() => onCreate({ name: `Link ${links.length + 1}`, plan: 1, money: 0, diary: 0 }))}>+ Outro</button>
        </div>
      </div>
      {err && <p className="error">{err}</p>}
    </Modal>
  );
}

function ShareLinkCard({ trip, link, busy, run, onUpdate, onRemove }) {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(link.name || '');
  useEffect(() => { setName(link.name || ''); }, [link.name]);
  const url = `${window.location.origin}/#/s/${link.token}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* sem permissão: o campo fica selecionável */ }
  };
  const count = SHARE_PARTS.filter(([k]) => link[k]).length;
  return (
    <section className="share-card">
      <div className="share-card-head">
        <input className="share-name" value={name} maxLength={80} aria-label="Nome do link" placeholder="Nome do link"
          onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== link.name && run(() => onUpdate(link, { name }))()} />
        <button className="ghost danger sm" disabled={busy} onClick={() => window.confirm(`Desativar o link "${link.name}"? Quem tem esse link perde o acesso na hora.`) && run(() => onRemove(link))()}>Desativar</button>
      </div>
      <div className="share-link">
        <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label={`Endereço do link ${link.name}`} />
        <button className="primary" onClick={copy}>{copied ? 'Copiado' : 'Copiar'}</button>
      </div>
      <div className="share-parts">
        {SHARE_PARTS.map(([k, label, hint]) => (
          <label key={k} className="check-line" title={hint}>
            <input type="checkbox" checked={!!link[k]} disabled={busy || (link[k] && count === 1)}
              onChange={(e) => run(() => onUpdate(link, { [k]: e.target.checked ? 1 : 0 }))()} />
            <span><b>{label}</b><span className="muted small share-hint">{hint}</span></span>
          </label>
        ))}
      </div>
      <div className="share-actions">
        {navigator.share && <button className="sm" onClick={() => navigator.share({ title: trip.name, url }).catch(() => {})}>Enviar…</button>}
        <a className="btn-like sm" href={url} target="_blank" rel="noreferrer">Abrir como visitante</a>
        <span className="spacer" />
        <button className="ghost sm" disabled={busy} title="Cria um endereço novo para este link; o antigo para de funcionar"
          onClick={() => window.confirm('Trocar o endereço deste link? O endereço antigo para de funcionar e você precisa mandar o novo.') && run(() => onUpdate(link, { renew: true }))()}>Trocar endereço</button>
      </div>
    </section>
  );
}

// lembretes: na agenda do celular (assinatura .ics, funciona com o app fechado) e neste aparelho com o app aberto
export function RemindersModal({ trip, onSave, onCalendar, notify, onNotify, onClose }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const https = trip.cal_token ? `${window.location.origin}/api/cal/${trip.cal_token}.ics` : '';
  const webcal = https.replace(/^https?:/, 'webcal:');
  const run = (fn) => async () => { setBusy(true); setErr(''); try { await fn(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  return (
    <Modal title="Lembretes" onClose={onClose} footer={<><span className="spacer" /><button onClick={onClose}>Fechar</button></>}>
      <div className="form">
        <label>Antes de cada atividade
          <select value={trip.remind_min ?? 30} onChange={(e) => onSave({ remind_min: Number(e.target.value) })}>
            {[[0, 'sem lembrete'], [10, '10 min'], [15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '1 hora'], [90, '1h30']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>Antes de voos
          <select value={trip.remind_flight_min ?? 180} onChange={(e) => onSave({ remind_flight_min: Number(e.target.value) })}>
            {[[0, 'sem lembrete'], [60, '1 hora'], [120, '2 horas'], [180, '3 horas'], [240, '4 horas'], [1440, '1 dia']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      <div className="section-title">Na agenda do celular</div>
      <p className="muted small">Funciona mesmo com o app fechado: o roteiro vira uma agenda que o celular atualiza sozinho (a cada poucas horas), com os lembretes acima. Mudanças no roteiro chegam na agenda na próxima atualização.</p>
      {https ? (
        <>
          <div className="share-link">
            <input readOnly value={https} onFocus={(e) => e.target.select()} aria-label="Link da agenda" />
            <button onClick={async () => { try { await navigator.clipboard.writeText(https); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* campo selecionável */ } }}>{copied ? 'Copiado' : 'Copiar'}</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <a className="btn-like primary" href={webcal}>Adicionar no iPhone / Mac</a>
            <a className="btn-like" href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noreferrer">Adicionar no Google Agenda</a>
            <span className="spacer" />
            <button className="danger" disabled={busy} onClick={run(() => onCalendar(false))}>Desativar</button>
          </div>
          <ul className="muted small tips">
            <li>iPhone: em Ajustes › Calendário › Contas › (esta agenda), deixe “Remover Alertas” desligado para os lembretes tocarem.</li>
            <li>Google Agenda ignora os lembretes do arquivo: depois de adicionar, abra as configurações da agenda e escolha as notificações padrão.</li>
            <li>O link dá acesso ao roteiro com notas: não compartilhe. Desativar invalida o link.</li>
          </ul>
        </>
      ) : (
        <button className="primary" disabled={busy} onClick={run(() => onCalendar(true))}>Criar agenda com lembretes</button>
      )}

      <div className="section-title">Neste aparelho, com o app aberto</div>
      <label className="check-line">
        <input type="checkbox" checked={notify} disabled={busy} onChange={(e) => run(() => onNotify(e.target.checked))()} />
        Mostrar notificação antes de cada atividade enquanto o app estiver aberto
      </label>
      {err && <div className="warn">{err}</div>}
    </Modal>
  );
}
