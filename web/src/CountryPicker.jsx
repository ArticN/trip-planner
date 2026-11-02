import { useMemo, useState } from 'react';
import { POPULAR, flag, searchCountries } from './countries.js';
import { countryName } from './geo.js';

// escolha de um ou mais países de destino: busca por nome (sem acento), código ou cidade, com atalhos
export default function CountryPicker({ value, onChange, home, autoFocus }) {
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const res = useMemo(() => searchCountries(q).filter((c) => !value.includes(c.a)), [q, value]);
  const add = (a) => { onChange([...value, a]); setQ(''); setHi(0); };
  const shortcuts = [...new Set([home, ...POPULAR])].filter((a) => a && !value.includes(a)).slice(0, 8);
  return (
    <div className="cpick">
      {value.length > 0 && (
        <div className="cpick-sel">
          {value.map((a) => (
            <span key={a} className="cpick-chip">
              {flag(a)} {countryName(a)}{a === home ? ' (onde moro)' : ''}
              <button type="button" aria-label={`Tirar ${countryName(a)}`} onClick={() => onChange(value.filter((x) => x !== a))}>×</button>
            </span>
          ))}
        </div>
      )}
      <input
        autoFocus={autoFocus} value={q} placeholder={value.length ? 'Mais um país (opcional)…' : 'Digite o país ou uma cidade: Japão, Portugal, Paris…'}
        aria-label="Buscar país" onChange={(e) => { setQ(e.target.value); setHi(0); }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => Math.min(h + 1, res.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          if (e.key === 'Enter' && res[hi]) { e.preventDefault(); add(res[hi].a); }
        }}
      />
      {q && (
        <div className="cpick-res" role="listbox">
          {res.length ? res.map((c, i) => (
            <button type="button" role="option" aria-selected={i === hi} key={c.a} className={i === hi ? 'on' : ''} onMouseEnter={() => setHi(i)} onClick={() => add(c.a)}>
              <span className="cpick-flag">{flag(c.a)}</span> {c.name}{c.a === home ? <span className="muted small"> · onde moro</span> : !c.known ? <span className="muted small"> · moeda a escolher</span> : null}
            </button>
          )) : <div className="muted small pad">Nenhum país com esse nome.</div>}
        </div>
      )}
      {!q && shortcuts.length > 0 && (
        <div className="cpick-quick">
          {shortcuts.map((a) => <button type="button" key={a} className="sm" onClick={() => add(a)}>{flag(a)} {a === home ? `${countryName(a)} (nacional)` : countryName(a)}</button>)}
        </div>
      )}
    </div>
  );
}
