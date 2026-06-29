import { useState } from 'react';

// Soft password gate. If VITE_GALLERY_PASSWORD is set at build time, visitors
// must enter it before seeing the gallery. NOTE: this is a deterrent, not real
// security — on a static site the passphrase ships in the page and the Drive
// files are public-link. Good enough for a family album; for true privacy the
// media must not be on a public link.
const PASSWORD = import.meta.env.VITE_GALLERY_PASSWORD;
const KEY = 'galaxy.gate.ok';

export default function Gate({ children }) {
  const [ok, setOk] = useState(() => {
    if (!PASSWORD) return true;
    try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
  });
  const [val, setVal] = useState('');
  const [err, setErr] = useState(false);

  if (ok) return children;

  const submit = (e) => {
    e.preventDefault();
    if (val === PASSWORD) {
      try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
      setOk(true);
    } else { setErr(true); }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand"><span className="spark">✦</span> Galaxy <em>Photos</em></div>
        <p className="login-sub">Amira &amp; Jacob’s Wedding — family gallery</p>
        <label>Password
          <input type="password" value={val} autoFocus
            onChange={(e) => { setVal(e.target.value); setErr(false); }} />
        </label>
        {err && <div className="login-err">Incorrect password.</div>}
        <button className="login-go" type="submit">Enter</button>
        <p className="login-foot">Ask the family for the password.</p>
      </form>
    </div>
  );
}
