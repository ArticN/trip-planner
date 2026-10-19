import { useEffect, useState } from 'react';
import { Modal } from './Modals.jsx';
import { ACCENTS, PAPERS, TYPES, CORNERS, SIZES, getLook, saveLook, resetLook, getTheme, loadAllFonts, accentSwatch } from './theme.js';

const MODES = [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']];

function Check() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>;
}

// bolinhas de cor; "Outra" abre o seletor do sistema
function AccentPicker({ value, onPick, label, extra }) {
  const custom = /^#/.test(value || '') && !ACCENTS.some((a) => a.id === value);
  return (
    <div className="lk-swatches" role="group" aria-label={label}>
      {extra}
      {ACCENTS.map((a) => (
        <button key={a.id} type="button" className="lk-swatch" style={{ '--sw': a.dark }} aria-pressed={value === a.id} title={a.name} onClick={() => onPick(a.id)}>
          <i>{value === a.id && <Check />}</i><span>{a.name}</span>
        </button>
      ))}
      <label className="lk-swatch custom" style={{ '--sw': custom ? value : 'transparent' }} title="Escolher outra cor">
        <i>{custom && <Check />}</i><span>Outra</span>
        <input type="color" value={custom ? value : '#e0785a'} onChange={(e) => onPick(e.target.value)} />
      </label>
    </div>
  );
}

export default function AppearanceModal({ trip, onTripAccent, onClose }) {
  const [look, setLook] = useState(getLook);
  const [theme, setTheme] = useState(getTheme);
  useEffect(() => { loadAllFonts(); }, []);
  useEffect(() => {
    const on = () => setTheme(getTheme());
    window.addEventListener('themechange', on);
    return () => window.removeEventListener('themechange', on);
  }, []);
  const set = (patch) => setLook(saveLook(patch));

  return (
    <Modal
      title="Aparência"
      onClose={onClose}
      footer={<><button onClick={() => setLook(resetLook())}>Voltar ao padrão</button><span className="spacer" /><button className="primary" onClick={onClose}>Pronto</button></>}
    >
      <p className="muted lk-intro">As mudanças aparecem na hora e ficam salvas neste aparelho.</p>

      <section className="lk-row">
        <h4>Tema</h4>
        <div className="seg-tabs lk-seg" role="group" aria-label="Tema">
          {MODES.map(([id, name]) => <button key={id} type="button" className={look.mode === id ? 'on' : ''} aria-pressed={look.mode === id} onClick={() => set({ mode: id })}>{name}</button>)}
        </div>
        {look.mode === 'auto' && <p className="muted small">Segue o modo claro ou escuro do aparelho.</p>}
      </section>

      <section className="lk-row">
        <h4>Cor de destaque <span className="muted small">rota no mapa, hoje, contagens</span></h4>
        <AccentPicker value={look.accent} label="Cor de destaque" onPick={(c) => set({ accent: c })} />
      </section>

      {trip && (
        <section className="lk-row">
          <h4>Cor desta viagem <span className="muted small">vale só em {trip.name} e no link compartilhado</span></h4>
          <AccentPicker
            value={ACCENTS.find((a) => a.dark === trip.accent)?.id || trip.accent || ''}
            label="Cor desta viagem"
            onPick={(c) => onTripAccent(ACCENTS.find((a) => a.id === c)?.dark || c)}
            extra={(
              <button type="button" className="lk-swatch same" style={{ '--sw': accentSwatch(look.accent) }} aria-pressed={!trip.accent} title="A mesma do app" onClick={() => onTripAccent(null)}>
                <i>{!trip.accent && <Check />}</i><span>Do app</span>
              </button>
            )}
          />
        </section>
      )}

      <section className="lk-row">
        <h4>Papel</h4>
        <div className="lk-cards">
          {PAPERS.map((p) => (
            <button key={p.id} type="button" className="lk-card" aria-pressed={look.paper === p.id} onClick={() => set({ paper: p.id })}>
              <span className="lk-paper" style={{ '--p0': p[theme][0], '--p1': p[theme][1] }}><i /><i /><i /></span>
              <b>{p.name}</b>
              <small>{p.hint}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="lk-row">
        <h4>Letras</h4>
        <div className="lk-cards lk-types">
          {TYPES.map((t) => (
            <button key={t.id} type="button" className="lk-card" aria-pressed={look.type === t.id} onClick={() => set({ type: t.id })}>
              <span className="lk-aa" style={{ fontFamily: t.display }}>Kyoto</span>
              <small style={{ fontFamily: t.text }}>{t.name} · 8:30 templo</small>
            </button>
          ))}
        </div>
      </section>

      <section className="lk-row lk-two">
        <div>
          <h4>Cantos</h4>
          <div className="seg-tabs lk-seg" role="group" aria-label="Cantos">
            {CORNERS.map((c) => (
              <button key={c.id} type="button" className={look.corners === c.id ? 'on' : ''} aria-pressed={look.corners === c.id} onClick={() => set({ corners: c.id })}>
                <span className={`lk-corner ${c.id}`} aria-hidden="true" />{c.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h4>Tamanho do texto</h4>
          <div className="seg-tabs lk-seg" role="group" aria-label="Tamanho do texto">
            {SIZES.map((z) => <button key={z.id} type="button" className={look.size === z.id ? 'on' : ''} aria-pressed={look.size === z.id} onClick={() => set({ size: z.id })} style={{ fontSize: `${13 * z.zoom}px` }}>{z.name}</button>)}
          </div>
        </div>
      </section>
    </Modal>
  );
}
