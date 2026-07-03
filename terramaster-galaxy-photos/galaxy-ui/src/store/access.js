// Access tier — decided at the password gate.
//   'family' : entered the password → Wedding + My Immich (no Demo)
//   'guest'  : chose "not a family member" → Demo + My Immich (no Wedding)
// The tier drives which library sources are offered and which one opens first.

const TIER_KEY = 'galaxy.gate.tier';

export function getTier() {
  try { return localStorage.getItem(TIER_KEY) || 'family'; } catch { return 'family'; }
}
export function setTier(t) {
  try { localStorage.setItem(TIER_KEY, t); } catch { /* ignore */ }
}

// The wedding library the build is configured to serve.
export const WEDDING_SOURCE = ['drive', 'manifest'].includes(import.meta.env.VITE_DEFAULT_SOURCE)
  ? import.meta.env.VITE_DEFAULT_SOURCE : 'drive';

// Which source opens first for a tier: family → the wedding; guest → the demo.
export function homeSource(tier = getTier()) {
  return tier === 'guest' ? 'demo' : (import.meta.env.VITE_DEFAULT_SOURCE || 'demo');
}

// The sources each tier may pick between (My Immich is available to everyone;
// it signs into their OWN Immich and shows their own photos, not the wedding).
export function sourcesFor(tier = getTier()) {
  return tier === 'guest'
    ? [{ id: 'demo', label: 'Demo' }, { id: 'live', label: 'My Immich' }]
    : [{ id: WEDDING_SOURCE, label: 'Wedding' }, { id: 'live', label: 'My Immich' }];
}
