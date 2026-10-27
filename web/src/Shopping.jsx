import { useMemo, useState } from 'react';
import { Modal } from './Modals.jsx';
import { money, fmtDay } from './util.js';

// ── compras para trazer: total na moeda da viagem, em dólar (a cota da Receita é em US$) e na moeda de casa.
// Viagem nacional não passa pela Receita: só a lista e os totais, sem cota, dólar nem imposto.
export const BUY_GROUPS = ['Café e cozinha', 'Figures e anime', 'Roupas e tênis', 'Eletrônicos', 'Lembranças', 'Outros'];
export const DEFAULT_QUOTA_USD = 1000;
const TAX = 0.5; // imposto de importação sobre o que passa da cota

// "12.800", "12800", "1.234,50" e "1234.5" viram número
export function parseAmount(v) {
  let s = String(v ?? '').replace(/[^\d.,-]/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// 1 unidade da moeda da viagem em dólar: direto quando uma das moedas já é o dólar
export function usdRateOf(trip) {
  if (trip.currency === 'USD') return 1;
  if (trip.home_currency === 'USD' && trip.rate > 0) return Number(trip.rate);
  return Number(trip.usd_rate) || 0;
}

const EMPTY = { title: '', store: '', price: '', grp: BUY_GROUPS[0], day: '', bought: false, exempt: false, notes: '' };

export function ShoppingModal({ trip, domestic = false, items, days, fx, onCreate, onUpdate, onDelete, onTrip, onRefreshUsd, onClose }) {
  const usd = usdRateOf(trip);
  const quota = Number(trip.quota_usd) || DEFAULT_QUOTA_USD;
  const toUsd = (n) => n * usd;
  const fmtUsd = (n) => money(n, 'USD');
  const [draft, setDraft] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [usdIn, setUsdIn] = useState(String(trip.usd_rate || ''));
  const [quotaIn, setQuotaIn] = useState(String(quota));
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const groups = useMemo(() => {
    const g = [...BUY_GROUPS];
    items.forEach((i) => { if (i.grp && !g.includes(i.grp)) g.push(i.grp); });
    return g;
  }, [items]);

  const s = useMemo(() => {
    const counted = items.filter((i) => !i.exempt);
    const sum = (l) => l.reduce((t, i) => t + (i.price || 0), 0);
    const bought = sum(counted.filter((i) => i.bought));
    const planned = sum(counted.filter((i) => !i.bought));
    // na nacional não há cota: os totais contam tudo, inclusive o que estava marcado "fora da cota"
    return { bought, planned, exempt: sum(items.filter((i) => i.exempt)), all: bought + planned, n: items.length, nBought: items.filter((i) => i.bought).length, anyBought: sum(items.filter((i) => i.bought)), any: sum(items) };
  }, [items]);

  const boughtUsd = toUsd(s.bought);
  const allUsd = toUsd(s.all);
  const left = quota - boughtUsd;
  const over = Math.max(0, allUsd - quota);
  const pct = (v) => `${Math.min(100, (v / Math.max(quota, allUsd, 1)) * 100)}%`;
  const scale = Math.max(quota, allUsd, 1);

  const price = parseAmount(draft.price);
  const valid = draft.title.trim() && price != null;
  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    const row = { ...draft, title: draft.title.trim(), store: draft.store.trim(), price, bought: draft.bought ? 1 : 0, exempt: draft.exempt ? 1 : 0 };
    if (editId) await onUpdate(editId, row);
    else await onCreate(row);
    setDraft((d) => ({ ...EMPTY, grp: d.grp, day: d.day }));
    setEditId(null);
  };
  const edit = (i) => {
    setEditId(i.id);
    setDraft({ title: i.title || '', store: i.store || '', price: i.price ?? '', grp: i.grp || 'Outros', day: i.day || '', bought: !!i.bought, exempt: !!i.exempt, notes: i.notes || '' });
  };
  const cancel = () => { setEditId(null); setDraft((d) => ({ ...EMPTY, grp: d.grp })); };

  const saveUsd = () => {
    const r = parseAmount(usdIn);
    // digitada à mão, a cotação para de se atualizar sozinha (usd_rate_at = 'manual')
    if (r > 0 && r !== Number(trip.usd_rate)) onTrip({ usd_rate: r, usd_rate_at: 'manual' });
  };
  const saveQuota = () => {
    const q = parseAmount(quotaIn);
    if (q > 0 && q !== quota) onTrip({ quota_usd: q });
  };
  const usdAuto = trip.usd_rate_at !== 'manual';
  const needUsd = trip.currency !== 'USD' && trip.home_currency !== 'USD';

  const conv = (n) => [usd && !domestic ? fmtUsd(toUsd(n)) : null, fx.convert ? fx.fmtHome(n) : null].filter(Boolean).join(' · ');

  return (
    <Modal title="Compras" onClose={onClose} wide footer={<><span className="muted">{s.nBought} de {s.n} compradas</span><span className="spacer" /><button onClick={onClose}>Fechar</button></>}>
      {domestic ? (
        <div className="quota">
          <div className="quota-top">
            <div><b>{fx.fmt(s.anyBought)}</b><span>comprado</span></div>
            <div className="quota-left"><b>{fx.fmt(s.any)}</b><span>com o previsto</span></div>
          </div>
        </div>
      ) : (
      <div className={`quota${left < 0 ? ' over' : ''}`}>
        <div className="quota-top">
          <div>
            <b>{usd ? fmtUsd(boughtUsd) : '—'}</b>
            <span>comprado de {fmtUsd(quota)} da cota</span>
          </div>
          <div className="quota-left">
            {!usd ? <span>Informe a cotação em dólar abaixo</span>
              : left >= 0 ? <><b>{fmtUsd(left)}</b><span>livres{usd ? ` · ${fx.fmt(left / usd)}` : ''}</span></>
                : <><b>{fmtUsd(-left)}</b><span>acima da cota</span></>}
          </div>
        </div>
        <div className="quota-bar" role="img" aria-label={`Comprado ${fmtUsd(boughtUsd)}, previsto ${fmtUsd(allUsd)}, cota ${fmtUsd(quota)}`}>
          <i className="b" style={{ width: pct(boughtUsd) }} />
          <i className="p" style={{ left: pct(boughtUsd), width: `${Math.min(100, (toUsd(s.planned) / scale) * 100)}%` }} />
          <em style={{ left: `${(quota / scale) * 100}%` }} />
        </div>
        <div className="quota-legend">
          <span><i className="b" />Comprado {fx.fmt(s.bought)}{fx.convert ? ` · ${fx.fmtHome(s.bought)}` : ''}</span>
          <span><i className="p" />Com o previsto {fx.fmt(s.all)}{usd ? ` · ${fmtUsd(allUsd)}` : ''}</span>
          {s.exempt > 0 && <span>Fora da cota {fx.fmt(s.exempt)}</span>}
        </div>
        {over > 0 && usd > 0 && <p className="quota-warn">Com o previsto você passa {fmtUsd(over)} da cota. O imposto seria cerca de {fmtUsd(over * TAX)}{fx.convert ? ` (${fx.fmtHome((over * TAX) / usd)})` : ''}, 50% do que passar.</p>}
      </div>
      )}

      <form className="buy-form form" onSubmit={submit}>
        <label className="full">Item<input value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex: chaleira Hario Buono, figure da SEGA, tênis Onitsuka" autoFocus /></label>
        <label>Loja<input value={draft.store} onChange={(e) => set('store', e.target.value)} placeholder="Ex: Kappabashi, Pokémon Center" /></label>
        <label>Preço ({fx.cur})
          <input value={draft.price} onChange={(e) => set('price', e.target.value)} inputMode="decimal" placeholder={fx.cur === 'JPY' ? '12.800' : '0,00'} />
          {price > 0 && <small className="muted">{conv(price)}</small>}
        </label>
        <label>Grupo<select value={draft.grp} onChange={(e) => set('grp', e.target.value)}>{groups.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Dia
          <select value={draft.day} onChange={(e) => set('day', e.target.value)}>
            <option value="">Sem dia</option>
            {days.map((d) => <option key={d} value={d}>{fmtDay(d)}</option>)}
          </select>
        </label>
        <div className="full buy-flags">
          <label className="check-line"><input type="checkbox" checked={draft.bought} onChange={(e) => set('bought', e.target.checked)} />Já comprei</label>
          {!domestic && <label className="check-line"><input type="checkbox" checked={draft.exempt} onChange={(e) => set('exempt', e.target.checked)} />Fora da cota (uso pessoal, como roupa que você vai usar)</label>}
          <span className="spacer" />
          {editId && <button type="button" onClick={cancel}>Cancelar</button>}
          <button className="primary" type="submit" disabled={!valid}>{editId ? 'Salvar' : 'Adicionar'}</button>
        </div>
      </form>

      {items.length === 0 && <div className="empty">Nenhuma compra ainda. {domestic ? 'Anote o que pretende comprar para ver o total.' : 'Anote o que pretende trazer para ver quanto da cota já está comprometido.'}</div>}
      {groups.map((g) => {
        const list = items.filter((i) => (i.grp || 'Outros') === g);
        if (!list.length) return null;
        const sub = list.reduce((t, i) => t + (i.price || 0), 0);
        return (
          <div key={g} className="check-group">
            <div className="check-h">{g}<span>{fx.fmt(sub)}{usd && !domestic ? ` · ${fmtUsd(toUsd(sub))}` : ''}</span></div>
            <ul className="check-list buy-list">
              {list.map((i) => (
                <li key={i.id} className={`${i.bought ? 'got' : ''}${editId === i.id ? ' editing' : ''}`}>
                  <input type="checkbox" checked={!!i.bought} onChange={() => onUpdate(i.id, { bought: i.bought ? 0 : 1 })} aria-label={i.bought ? 'Marcar como não comprado' : 'Marcar como comprado'} title="Comprado" />
                  <button type="button" className="buy-main" onClick={() => edit(i)} title="Editar">
                    <span className="buy-t">{i.title}</span>
                    <span className="buy-s">{[i.store, i.day ? fmtDay(i.day) : null, i.exempt && !domestic ? 'fora da cota' : null, i.bought ? null : 'previsto'].filter(Boolean).join(' · ')}</span>
                  </button>
                  <span className="buy-v"><b>{i.price != null ? fx.fmt(i.price) : '—'}</b>{i.price ? <small>{conv(i.price)}</small> : null}</span>
                  <button className="icon-btn sm" title="Remover" aria-label="Remover" onClick={() => onDelete(i.id)}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {!domestic && <>
      <div className="buy-settings">
        {needUsd && (
          <div className="rate-box">
            <label>1 {fx.cur} =
              <input value={usdIn} onChange={(e) => setUsdIn(e.target.value)} onBlur={saveUsd} inputMode="decimal" /> USD
            </label>
            <label className="check-line">
              <input type="checkbox" checked={usdAuto} onChange={(e) => { onTrip({ usd_rate_at: e.target.checked ? null : 'manual' }); if (e.target.checked) onRefreshUsd(); }} />
              Atualizar sozinho com a cotação do dia{usdAuto && trip.usd_rate_at ? ` (atualizada em ${trip.usd_rate_at.slice(8)}/${trip.usd_rate_at.slice(5, 7)})` : ''}
            </label>
          </div>
        )}
        <label className="quota-in">Cota de isenção (US$)<input value={quotaIn} onChange={(e) => setQuotaIn(e.target.value)} onBlur={saveQuota} inputMode="decimal" /></label>
      </div>
      <p className="muted small buy-note">
        A Receita Federal isenta até US$ 1.000 por pessoa em compras trazidas na bagagem de viagem aérea ou marítima. O que passar paga 50% de imposto sobre o excedente e precisa ser declarado (e-DBV). Roupas e objetos de uso pessoal que você vai usar ficam fora da conta, e o free shop da chegada tem cota própria de US$ 1.000.
      </p>
      </>}
    </Modal>
  );
}
