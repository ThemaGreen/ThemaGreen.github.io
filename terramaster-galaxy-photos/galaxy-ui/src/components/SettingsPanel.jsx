import { PALETTES } from '../store/palettes.js';

// Slide-in settings panel: appearance, data source, galaxy look, about.

const THEMES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'auto', label: 'Auto' },
];

function Row({ label, hint, children }) {
  return (
    <div className="set-row">
      <div className="set-label">{label}{hint && <span className="set-hint">{hint}</span>}</div>
      <div className="set-control">{children}</div>
    </div>
  );
}

function Seg({ value, options, onChange }) {
  return (
    <div className="seg small">
      {options.map((o) => (
        <button key={o.id} className={`seg-btn ${value === o.id ? 'active' : ''}`} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="knob" />
    </button>
  );
}

export default function SettingsPanel({ open, settings, update, reset, onClose, stats, account, onLogout }) {
  return (
    <div className={`settings ${open ? 'open' : ''}`} role="dialog" aria-label="Settings">
      <header>
        <h3>Settings</h3>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
      </header>
      <div className="body">
        <section>
          <h4>Appearance</h4>
          <Row label="Theme">
            <Seg value={settings.theme} options={THEMES} onChange={(v) => update({ theme: v })} />
          </Row>
          <Row label="Star mascot" hint="Stella, your guide">
            <Toggle on={settings.mascot} onChange={(v) => update({ mascot: v })} />
          </Row>
          <div className="set-row col">
            <div className="set-label">Galaxy palette<span className="set-hint">your universe’s colors</span></div>
            <div className="palette-grid">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  className={`palette-opt ${settings.palette === p.id ? 'active' : ''}`}
                  onClick={() => update({ palette: p.id })}
                  title={p.name}
                >
                  <span className="palette-swatch">
                    {p.swatch.map((c, i) => <span key={i} style={{ background: c }} />)}
                  </span>
                  <span className="palette-name">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h4>Data source</h4>
          <Row label="Library">
            <Seg
              value={settings.source}
              options={[{ id: 'demo', label: 'Demo' }, { id: 'live', label: 'My Immich' }]}
              onChange={(v) => update({ source: v })}
            />
          </Row>
          <p className="note">
            {settings.source === 'demo'
              ? 'Exploring a built-in sample library — no server needed.'
              : 'Signed in to your own Immich account — you only see your media and what friends shared with you.'}
          </p>
          {settings.source === 'live' && account && (
            <div className="account-row">
              <span className="account-who">● {account.name || account.email}</span>
              <button className="ghost-btn slim" onClick={onLogout}>Sign out</button>
            </div>
          )}
        </section>

        <section>
          <h4>Galaxy</h4>
          <Row label="Glow (bloom)">
            <Toggle on={settings.bloom} onChange={(v) => update({ bloom: v })} />
          </Row>
          <Row label="Auto-orbit">
            <Toggle on={settings.autoOrbit} onChange={(v) => update({ autoOrbit: v })} />
          </Row>
          <Row label="Photo size">
            <Seg
              value={settings.density}
              options={[{ id: 'comfortable', label: 'Large' }, { id: 'compact', label: 'Small' }]}
              onChange={(v) => update({ density: v })}
            />
          </Row>
        </section>

        <section>
          <h4>About</h4>
          <dl className="meta">
            <dt>Photos</dt><dd>{stats?.photos?.toLocaleString() ?? '—'}</dd>
            <dt>Galaxies</dt><dd>{stats?.galaxies ?? '—'}</dd>
            <dt>Mode</dt><dd>{settings.source === 'demo' ? 'Demo library' : 'Immich (live)'}</dd>
          </dl>
          <button className="ghost-btn" onClick={reset}>Reset to defaults</button>
        </section>
      </div>
    </div>
  );
}
