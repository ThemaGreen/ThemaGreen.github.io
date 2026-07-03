// Persistent app settings (the demo's little "database"): saved to
// localStorage so choices survive reloads. In live mode Immich/Postgres is
// the real database; this only holds UI + connection preferences.

import { useCallback, useEffect, useState } from 'react';

const KEY = 'galaxy.settings.v1';

import { homeSource } from './access.js';

export const DEFAULTS = {
  theme: 'dark',        // 'dark' | 'light' | 'auto'
  source: 'demo',       // overridden per access tier in loadSettings()
  bloom: true,          // glowing cores
  autoOrbit: true,      // gentle camera rotation
  density: 'comfortable', // 'comfortable' | 'compact' -> sprite size
  mascot: true,         // show Stella
  palette: 'nebula',    // galaxy/cloud color palette (see store/palettes.js)
  sound: false,         // theme music (your uploaded mp3)
  menuStyle: 'sheet',   // how panels open on phones: 'sheet' (bottom) | 'drawer' (side)
};

export function loadSettings() {
  // homeSource() must be read HERE (lazily) — after the gate has set the access
  // tier — never at module-import time, or guests would get the family source.
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* ignore */ }
  // Always open in the tier's home library (family → wedding, guest → demo),
  // regardless of what was selected last session. Other prefs persist.
  return { ...DEFAULTS, ...stored, source: homeSource() };
}

export function resolveTheme(theme) {
  if (theme === 'auto') {
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return theme;
}

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore quota */ }
  }, [settings]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings({ ...DEFAULTS, source: homeSource() }), []);
  return [settings, update, reset];
}
