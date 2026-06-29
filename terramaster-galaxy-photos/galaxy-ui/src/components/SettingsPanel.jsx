import { PALETTES } from '../store/palettes.js';

// Slide-in / bottom-sheet settings panel: appearance, data source, galaxy look.
// The "Wedding" source is whatever the build is configured to serve
// (Drive/manifest); "My Immich" switches to the personal live login.
const ENV_SOURCE = import.meta.env.VITE_DEFAULT_SOURCE;
const WEDDING_SOURCE = ['drive', 'manifest'].includes(ENV_SOURCE) ? ENV_SOURCE : 'drive';

const THEMES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'auto', label: 'Auto' },
];

const SOURCES = [
  { id: 'demo', label: 'Demo' },
  { id: WEDDING_SOURCE, label: 'Wedding' },
  { id: 'live', label: 'My Immich' },
];

const MENU_STYLES = [
  { id: 'sheet', label: 'Bottom' },
  { id: 'drawer', label: 'Side' },
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
  const sourceVal = SOURCES.some((s) => s.id === settings.source) ? settings.source : 'demo';
  return (
    <div className={`settings menu-${settings.menuStyle || 'sheet'} ${open ? 'open' : ''}`} role="dialog" aria-label="Settings">
      <header>
        <span className="sheet-grip" aria-hidden="true" />
        <h3>Settings</h3>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
      </header>
      <div className="body">
        <section>
          <h4>Library</h4>
          <Row label="Source" hint="demo · the wedding · your Immich">
            <Seg value={sourceVal} options={SOURCES} onChange={(v) => update({ source: v })} />
          </Row>
          {settings.source === 'live' && account && (
            <div className="account-row">
              <span className="account-who">● {account.name || account.email}</span>
              <button className="ghost-btn slim" onClick={onLogout}>Sign out</button>
            </div>
          )}
          <p className="note">
            {settings.source === 'demo' ? 'A built-in sample library — no server needed.'
              : settings.source === 'live' ? 'Your own Immich account — only your media and what was shared with you.'
                : 'The shared wedding gallery.'}
          </p>
        </section>

        <section>
          <h4>Appearance</h4>
          <Row label="Theme">
            <Seg value={settings.theme} options={THEMES} onChange={(v) => update({ theme: v })} />
          </Row>
          <Row label="Menus open from" hint="on phones / tablets">
            <Seg value={settings.menuStyle || 'sheet'} options={MENU_STYLES} onChange={(v) => update({ menuStyle: v })} />
          </Row>
          <Row label="Star mascot" hint="Stella — drag her anywhere">
            <Toggle on={settings.mascot} onChange={(v) => update({ mascot: v })} />
          </Row>
          <Row label="Theme music" hint="plays your gallery track">
            <Toggle on={settings.sound} onChange={(v) => update({ sound: v })} />
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
          </dl>
          <button className="ghost-btn" onClick={reset}>Reset to defaults</button>
        </section>
      </div>
    </div>
  );
}
