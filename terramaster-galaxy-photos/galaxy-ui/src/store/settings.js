// Persistent app settings (the demo's little "database"): saved to
// localStorage so choices survive reloads. In live mode Immich/Postgres is
// the real database; this only holds UI + connection preferences.

import { useCallback, useEffect, useState } from 'react';

const KEY = 'galaxy.settings.v1';

export const DEFAULTS = {
  theme: 'dark',        // 'dark' | 'light' | 'auto'
  // 'demo' | 'live' | 'manifest'. The public ThemaGreen build sets
  // VITE_DEFAULT_SOURCE=manifest so visitors land straight in the family gallery.
  source: import.meta.env.VITE_DEFAULT_SOURCE || 'demo',
  bloom: true,          // glowing cores
  autoOrbit: true,      // gentle camera rotation
  density: 'comfortable', // 'comfortable' | 'compact' -> sprite size
  mascot: true,         // show Stella
  palette: 'nebula',    // galaxy color palette (see store/palettes.js)
};

export function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
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
  const reset = useCallback(() => setSettings({ ...DEFAULTS }), []);
  return [settings, update, reset];
}
