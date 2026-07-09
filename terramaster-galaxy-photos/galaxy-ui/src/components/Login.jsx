import { useEffect, useState } from 'react';

// Per-account sign-in for "My Immich" mode. Each person signs into their OWN
// Immich account and only sees their own photos/videos (and anything shared
// with them) — this is not the wedding gallery.
//
// Server fallback: we first probe the family/NAS endpoint. If it isn't
// reachable from the visitor's network (they're not on the NAS), the form
// surfaces a "server address" field so they can point at their own Immich
// (e.g. https://photos.example.com) — remembered on their device.
export default function Login({ api, onSuccess, onDemo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState(() => api.getServer?.() || '');
  const [showServer, setShowServer] = useState(() => !!(api.getServer?.()));
  const [probing, setProbing] = useState(true);
  const [nasOk, setNasOk] = useState(null); // null=checking, true/false=result
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Probe the default (family/NAS) endpoint once; if it's unreachable, open the
  // server field so visitors can enter their own Immich address.
  useEffect(() => {
    let off = false;
    if (!api.ping) { setProbing(false); return undefined; }
    (async () => {
      const ok = await api.ping().catch(() => false);
      if (off) return;
      setNasOk(ok); setProbing(false);
      if (!ok) setShowServer(true);
    })();
    return () => { off = true; };
  }, [api]);

  // A bare Immich ACCOUNT id (a UUID from Immich's own settings) can't locate a
  // server — catch it early with a helpful message instead of a DNS error.
  const looksLikeAccountUuid = (v) =>
    /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(v.trim());

  const submit = async (e) => {
    e.preventDefault();
    const srv = server.trim();
    if (srv && looksLikeAccountUuid(srv)) {
      setErr('That looks like an Immich account ID — it can’t locate your server. '
        + 'Enter your server address (https://…) or the GX-… user ID from this app’s Settings.');
      return;
    }
    setBusy(true); setErr('');
    try {
      await api.login(email.trim(), password, srv);
      const user = await api.me();
      onSuccess(user);
    } catch {
      setErr(srv
        ? 'Sign-in failed — check the server address, email and password.'
        : 'Invalid email or password.');
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="spark">✦</span> My <em>Immich</em>
        </div>
        <p className="login-sub">Sign in to see your own photos &amp; videos</p>

        {!probing && nasOk === false && !server && (
          <div className="login-note">
            The family server isn’t reachable from your network — enter your own
            Immich address or a GX-… user ID below. (The ID comes from THIS app’s
            Settings on a device that’s already signed in — not your Immich account ID.)
          </div>
        )}

        {showServer ? (
          <label>Server address or user ID
            <input type="text" value={server} placeholder="https://photos.example.com — or GX-… ID"
              onChange={(e) => { setServer(e.target.value); setErr(''); }}
              autoCapitalize="none" autoCorrect="off" spellCheck={false} />
          </label>
        ) : (
          <button type="button" className="login-alt" onClick={() => setShowServer(true)}>
            Using your own Immich? Enter its address or your user ID →
          </button>
        )}

        <label>Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {err && <div className="login-err">{err}</div>}
        <button className="login-go" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        {onDemo && <button className="login-demo" type="button" onClick={onDemo}>← Back</button>}
        <p className="login-foot">Your Immich account stays private to you.</p>
      </form>
    </div>
  );
}
