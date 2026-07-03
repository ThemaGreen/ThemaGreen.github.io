// Thin client for the Immich REST API ("live" data source).
//
// In production the requests go to /immich/* which nginx (see nginx.conf)
// reverse-proxies to the Immich server and injects the x-api-key header,
// so the API key never reaches the browser.
//
// In local dev, Vite proxies /immich -> your NAS (see vite.config.js); for
// dev you can also set the key via VITE_IMMICH_API_KEY.

export const isDemo = false;

// --- Server selection --------------------------------------------------------
// Default is the family/NAS endpoint: the '/immich' reverse proxy (same-origin),
// or VITE_IMMICH_URL if the build configures a public address. If the visitor's
// network can't reach that (they're not on the NAS), they can enter their OWN
// Immich server URL at the login screen — it's remembered on their device.
const DEFAULT_BASE = import.meta.env.VITE_IMMICH_URL || '/immich';
const SERVER_KEY = 'galaxy.immich.server';

// Accepts "photos.example.com", "https://photos.example.com/", or a full
// ".../api" URL — normalizes to the API root Immich expects.
export function normalizeServer(v) {
  let s = (v || '').trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s) && !s.startsWith('/')) s = `https://${s}`;
  s = s.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(s) && !/\/api$/i.test(s)) s = `${s}/api`;
  return s;
}
export function getServer() { try { return localStorage.getItem(SERVER_KEY) || ''; } catch { return ''; } }
export function setServer(v) {
  const s = normalizeServer(v);
  try { s ? localStorage.setItem(SERVER_KEY, s) : localStorage.removeItem(SERVER_KEY); } catch { /* ignore */ }
}
export function activeBase() { return getServer() || DEFAULT_BASE; }
export function isRemote() { return /^https?:\/\//i.test(activeBase()); }
const BASE = { toString: () => activeBase() }; // template-literal friendly
const creds = () => (isRemote() ? 'omit' : 'same-origin');

// Quick reachability probe (3s timeout) — used by the login screen to decide
// whether to suggest entering a personal server address.
export async function ping(server) {
  const b = server ? normalizeServer(server) : activeBase();
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 3000);
  try {
    for (const path of ['/server-info/ping', '/server/ping']) {
      try {
        const r = await fetch(`${b}${path}`, { signal: ctl.signal, credentials: creds() });
        if (r.ok) { clearTimeout(t); return true; }
      } catch { /* try next */ }
    }
  } finally { clearTimeout(t); }
  return false;
}

// --- Per-user auth ---------------------------------------------------------
// Each visitor logs into their OWN Immich account. We keep the access token for
// API calls (Authorization header); on the same-origin NAS deployment Immich's
// cookie also authenticates <img>/<video> requests that can't carry a header
// (remote servers use the authenticated media resolver in api/media.js).
const TOKEN_KEY = 'galaxy.immich.token';
export function getToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } }
function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }

function headers() {
  const h = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function login(email, password, server) {
  if (server !== undefined) setServer(server); // '' clears back to the family default
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST', credentials: creds(),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Invalid email or password');
  const data = await res.json();
  if (data.accessToken) setToken(data.accessToken);
  return data;
}

export async function logout() {
  try { await fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: creds(), headers: headers() }); } catch { /* ignore */ }
  setToken('');
}

// Returns the signed-in user, or throws if not authenticated.
export async function me() {
  const res = await fetch(`${BASE}/users/me`, { credentials: creds(), headers: headers() });
  if (!res.ok) throw new Error('not authenticated');
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Immich ${path} -> ${res.status}`);
  return res.json();
}
async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(`Immich ${path} -> ${res.status}`);
  return res.json();
}

// thumb/preview/link take the asset object so the demo and live sources share
// one call site (the demo stores its image inline; Immich derives it from id).
export function thumbUrl(asset) { return `${BASE}/assets/${asset.id}/thumbnail?size=thumbnail`; }
export function previewUrl(asset) { return `${BASE}/assets/${asset.id}/thumbnail?size=preview`; }
export function videoUrl(asset) { return `${BASE}/assets/${asset.id}/video/playback`; }
export const isVideo = (asset) => asset?.type === 'VIDEO';
export function immichAssetLink(asset) {
  if (isRemote()) return `${activeBase().replace(/\/api$/, '')}/photos/${asset.id}`;
  return `${window.location.protocol}//${window.location.hostname}:2283/photos/${asset.id}`;
}

export async function searchAssets({ page = 1, size = 250, personIds, takenAfter, takenBefore } = {}) {
  const body = { page, size, withExif: true, withPeople: true };
  if (personIds?.length) body.personIds = personIds;
  if (takenAfter) body.takenAfter = takenAfter;
  if (takenBefore) body.takenBefore = takenBefore;
  const data = await post('/search/metadata', body);
  return data.assets ?? data; // Immich returns { assets: { items, nextPage, ... } }
}

export async function fetchAssets({ max = 600, ...filters } = {}) {
  const items = [];
  let page = 1;
  while (items.length < max) {
    const res = await searchAssets({ ...filters, page, size: 250 });
    const batch = res.items ?? [];
    items.push(...batch);
    if (!res.nextPage || batch.length === 0) break;
    page = Number(res.nextPage);
  }
  return items.slice(0, max);
}

export async function fetchPeople() {
  const data = await get('/people?withHidden=false');
  return data.people ?? data;
}

export async function fetchTags() {
  try { const d = await get('/tags'); return Array.isArray(d) ? d : (d.tags ?? []); }
  catch { return []; }
}

// "Real" search across the whole library:
//   • CLIP smart search (semantic — "wedding", "beach at sunset", "red car")
//   • people whose name matches  → all their photos
//   • tags/labels whose name matches → all tagged photos
// Results are merged & de-duplicated.
export async function search(query) {
  const q = (query || '').trim();
  if (!q) return [];
  const byId = new Map();
  const add = (items) => { for (const a of (items || [])) byId.set(a.id, a); };

  // Semantic (CLIP) search
  try {
    const smart = await post('/search/smart', { query: q, size: 250, withExif: true, withPeople: true });
    add(smart.assets?.items ?? smart.items);
  } catch { /* smart search needs the ML container; ignore if unavailable */ }

  // People by name
  try {
    const ppl = await fetchPeople();
    const ql = q.toLowerCase();
    for (const p of (ppl || []).filter((p) => (p.name || '').toLowerCase().includes(ql))) {
      const res = await searchAssets({ personIds: [p.id], size: 250 });
      add(res.items);
    }
  } catch { /* ignore */ }

  // Tags / labels by name
  try {
    const tags = await fetchTags();
    const ql = q.toLowerCase();
    for (const t of (tags || []).filter((t) => (t.name || t.value || '').toLowerCase().includes(ql))) {
      const res = await post('/search/metadata', { tagIds: [t.id], size: 250, withExif: true });
      add(res.assets?.items ?? res.items);
    }
  } catch { /* ignore */ }

  return [...byId.values()];
}

// --- Social (Option A): friends come from Immich's shared albums / partners.
// Real privacy is enforced by Immich server-side; this only reads what has
// actually been shared with you.

const PALETTE_IDS = ['nebula', 'aurora', 'sunset', 'ice', 'rose', 'solar'];
function paletteForKey(key = '') {
  let h = 0; for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE_IDS[h % PALETTE_IDS.length];
}

// Friends' galaxies = albums shared *with you*. Each becomes one galaxy.
// (A friend's own palette choice needs a shared store to sync; until then we
// give each friend a stable palette derived from their id.)
export async function fetchFriends() {
  const friends = [];
  try {
    const albums = await get('/albums?shared=true');
    for (const al of (albums || [])) {
      let full; try { full = await get(`/albums/${al.id}`); } catch { full = al; }
      const assets = (full.assets || []).slice(0, 80);
      if (!assets.length) continue;
      const owner = full.owner?.name || full.ownerName || al.albumName || 'Friend';
      friends.push({
        id: al.id,
        name: full.albumName ? `${owner} · ${full.albumName}` : owner,
        palette: paletteForKey(full.ownerId || al.id),
        assets,
      });
    }
  } catch { /* none shared yet */ }
  return friends;
}

// Ensure a dedicated "shared with friends" album exists.
async function sharedAlbumId() {
  const name = 'Galaxy · Shared with Friends';
  try {
    const albums = await get('/albums');
    const found = (albums || []).find((a) => a.albumName === name);
    if (found) return found.id;
  } catch { /* ignore */ }
  const created = await post('/albums', { albumName: name });
  return created.id;
}

// Per-photo visibility, enforced by Immich:
//   private   -> not in any shared album, not archived
//   friends   -> added to the shared-with-friends album
//   sensitive -> archived (hidden from the main timeline) too
export async function setVisibility(assetId, v) {
  const bulk = (body) => fetch(`${BASE}/assets`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) });
  if (v === 'friends') {
    const id = await sharedAlbumId();
    await fetch(`${BASE}/albums/${id}/assets`, { method: 'PUT', headers: headers(), body: JSON.stringify({ ids: [assetId] }) });
    await bulk({ ids: [assetId], isArchived: false });
  } else if (v === 'sensitive') {
    await bulk({ ids: [assetId], isArchived: true });
  } else { // private
    await bulk({ ids: [assetId], isArchived: false });
  }
  return v;
}

// Add a label (Immich tag) to an asset, creating the tag if needed.
export async function addLabel(assetId, name) {
  const label = (name || '').trim();
  if (!label) return;
  // upsert tag
  let tag;
  try { tag = await post('/tags', { name: label }); }
  catch {
    const tags = await fetchTags();
    tag = (tags || []).find((t) => (t.name || t.value || '').toLowerCase() === label.toLowerCase());
  }
  if (!tag?.id) throw new Error('could not create label');
  // attach asset to tag
  const res = await fetch(`${BASE}/tags/${tag.id}/assets`, {
    method: 'PUT', headers: headers(), body: JSON.stringify({ ids: [assetId] }),
  });
  if (!res.ok) throw new Error(`label -> ${res.status}`);
  return tag;
}
