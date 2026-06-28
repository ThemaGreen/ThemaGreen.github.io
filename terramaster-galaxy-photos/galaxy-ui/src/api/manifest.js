// Manifest data source — a public, self-hosted gallery.
//
// Reads a JSON list of media (manifest.json) and renders it as galaxies. This
// is the reliable way to publish a Google Photos / Drive album publicly:
// export the media once (or sync it to a folder), host the files + manifest on
// your site, and point VITE_MANIFEST_URL at it. No API keys, no CORS issues.
//
// manifest.json shape:
//   { "items": [
//      { "id":"abc", "name":"beach.jpg", "type":"IMAGE",
//        "src":"media/beach.jpg", "thumb":"media/thumbs/beach.jpg",
//        "date":"2024-07-02T10:00:00Z", "album":"Maui 2024",
//        "people":["Mom","Dad"], "place":"Maui", "labels":["beach"] },
//      { "id":"v1", "name":"clip.mp4", "type":"VIDEO",
//        "src":"media/clip.mp4", "thumb":"media/thumbs/clip.jpg" }
//   ] }

export const isDemo = false;

const MANIFEST_URL = import.meta.env.VITE_MANIFEST_URL || `${import.meta.env.BASE_URL}manifest.json`;

let _cache = null;

function inferType(m) {
  if (m.type) return m.type.toUpperCase();
  return /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(m.src || m.name || '') ? 'VIDEO' : 'IMAGE';
}

function normalize(m, i) {
  return {
    id: m.id || m.src || `item-${i}`,
    provider: 'manifest',
    type: inferType(m),
    originalFileName: m.name || (m.src || '').split('/').pop() || 'media',
    localDateTime: m.date || m.createdTime || null,
    fileCreatedAt: m.date || m.createdTime || null,
    category: m.album || m.category || 'Album',
    people: (m.people || []).map((n) => (typeof n === 'string' ? { id: n, name: n } : n)),
    isFavorite: !!m.favorite,
    labels: m.labels || [],
    thumb: m.thumb || m.src,
    preview: m.preview || m.src,
    src: m.src,
    embed: m.embed || null,
    exifInfo: { dateTimeOriginal: m.date || m.createdTime || null, city: m.place || null, country: m.country || null },
  };
}

async function load() {
  if (_cache) return _cache;
  const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data) ? data : (data.items || []);
  _cache = items.map(normalize);
  return _cache;
}
// Allow auto-sync: callers can force a re-fetch.
export function invalidate() { _cache = null; }

// Public gallery — no auth.
export async function me() { return { id: 'public', name: 'Guest' }; }
export async function login() { return {}; }
export async function logout() {}
export function getToken() { return 'public'; }

export function thumbUrl(a) { return a.thumb; }
export function previewUrl(a) { return a.preview || a.src; }
export function videoUrl(a) { return a.type === 'VIDEO' ? (a.src || '') : ''; }
export const isVideo = (a) => a?.type === 'VIDEO';
export function immichAssetLink() { return null; }

export async function fetchAssets({ max = 5000 } = {}) {
  const all = await load();
  return all.slice(0, max);
}
export async function searchAssets() { const items = await load(); return { items, nextPage: null }; }

export async function fetchPeople() {
  const all = await load();
  const m = new Map();
  all.forEach((a) => a.people.forEach((p) => m.set(p.id, p)));
  return [...m.values()];
}
export async function fetchFriends() { return []; }

export async function search(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  return (await load()).filter((a) =>
    (a.originalFileName || '').toLowerCase().includes(q) ||
    (a.category || '').toLowerCase().includes(q) ||
    (a.exifInfo?.city || '').toLowerCase().includes(q) ||
    (a.labels || []).some((l) => l.toLowerCase().includes(q)) ||
    (a.people || []).some((p) => (p.name || '').toLowerCase().includes(q)));
}

export async function addLabel() { throw new Error('This gallery is read-only.'); }
export async function setVisibility() {}
