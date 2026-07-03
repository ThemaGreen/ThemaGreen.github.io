import { useState } from 'react';
import { setTier } from '../store/access.js';

// Soft password gate with two doors:
//   • Enter the password  → FAMILY tier (Wedding + My Immich)
//   • "Not a family member?" → GUEST tier (Demo + My Immich)
// NOTE: this is a deterrent, not real security — on a static site the passphrase
// ships in the page and the Drive files are public-link. Good enough for a
// family album; for true privacy the media must not be on a public link.
const PASSWORD = import.meta.env.VITE_GALLERY_PASSWORD;
const KEY = 'galaxy.gate.ok';

// Decide the initial mode once, setting the tier synchronously BEFORE the app
// renders so it opens the right library. Returning family members skip the gate.
function initialMode() {
  if (!PASSWORD) { setTier('family'); return 'family'; }
  try { if (localStorage.getItem(KEY) === '1') { setTier('family'); return 'family'; } } catch { /* ignore */ }
  return null; // show the gate
}

export default function Gate({ children }) {
  const [mode, setMode] = useState(initialMode);
  const [val, setVal] = useState('');
  const [err, setErr] = useState(false);

  if (mode === 'family' || mode === 'guest') return children;

  const submit = (e) => {
    e.preventDefault();
    if (val === PASSWORD) {
      try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
      setTier('family');       // synchronous, before children mount
      setMode('family');
    } else { setErr(true); }
  };

  const enterAsGuest = () => {
    setTier('guest');          // synchronous, before children mount
    setMode('guest');
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

        <div className="gate-alt">
          <span>Not a family member?</span>
          <button type="button" className="gate-guest" onClick={enterAsGuest}>
            Explore the demo or sign into your own Immich →
          </button>
        </div>
      </form>
    </div>
  );
}
