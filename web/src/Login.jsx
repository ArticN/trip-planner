import { useState } from 'react';
import { api } from './api.js';
import Mark from './Mark.jsx';

// tela de senha, quando o app está publicado com APP_PASSWORD
export default function Login({ onDone }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await api.login(pw);
      onDone();
    } catch {
      setErr('Senha incorreta.');
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form onSubmit={submit}>
        <span className="logo"><Mark size={40} /></span>
        <h1>Trip Planner</h1>
        <label>Senha
          <input type="password" autoFocus autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        {err && <div className="warn soft pad">{err}</div>}
        <button className="primary" type="submit" disabled={!pw || busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  );
}
