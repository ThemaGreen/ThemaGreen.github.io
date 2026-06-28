import { useState } from 'react';

// Per-account sign-in for Live (Immich) mode. Each person logs into their own
// account, so the app only ever shows what *they* own or were shared.
export default function Login({ api, onSuccess, onDemo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await api.login(email.trim(), password);
      const user = await api.me();
      onSuccess(user);
    } catch {
      setErr('Invalid email or password.');
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand"><span className="spark">✦</span> Galaxy <em>Photos</em></div>
        <p className="login-sub">Sign in to your own universe</p>
        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {err && <div className="login-err">{err}</div>}
        <button className="login-go" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <button className="login-demo" type="button" onClick={onDemo}>Explore the demo instead</button>
        <p className="login-foot">Use your account on this NAS’s Immich. Don’t have one? Ask the owner to create it.</p>
      </form>
    </div>
  );
}
