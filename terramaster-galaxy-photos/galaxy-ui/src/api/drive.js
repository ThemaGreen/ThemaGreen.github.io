// Live Google Drive data source.
//
// Reads a PUBLIC Drive folder ("Anyone with the link can view") and renders its
// photos/videos as galaxies. Google hosts and serves all the media + thumbnails
// (so there's no file-size limit and zero bandwidth cost to your site), and new
// uploads to the folder appear automatically on the next load — true auto-sync.
//
// Config (build-time env):
//   VITE_DRIVE_FOLDER_ID = the shared folder's id (from its URL)
//   VITE_DRIVE_KEY       = a Google API key with the Drive API enabled
// The API key only needs read access to public files; restrict it to the Drive
// API + your site's referrer.

export const isDemo = false;

// Accept either a raw folder id or a pasted folder URL.
function parseFolderId(v) {
  if (!v) return v;
  const m = String(v).match(/\/folders\/([^/?#]+)/) || String(v).match(/[?&]id=([^&]+)/);
  return m ? m[1] : String(v).trim();
}
const FOLDER = parseFolderId(import.meta.env.VITE_DRIVE_FOLDER_ID);
const KEY = import.meta.env.VITE_DRIVE_KEY;

// Public display URLs (no API key needed to *show* public files).
// Images use the direct googleusercontent CDN (no redirect, fast, CORS-enabled
// so they work as WebGL textures). Videos use Drive's poster + preview iframe.
const imgUrl = (id, w) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;
const vidThumb = (id, w) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`;
const embedOf = (id) => `https://drive.google.com/file/d/${id}/preview`;

function fmtDuration(ms) {
  const s = Math.round(Number(ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

let _cache = null;

function driveDate(f) {
  const t = f.imageMediaMetadata?.time; // "YYYY:MM:DD HH:MM:SS"
  if (t && /^\d{4}:\d\d:\d\d/.test(t)) {
    const [d, time] = t.split(' ');
    return `${d.replace(/:/g, '-')}T${time || '00:00:00'}`;
  }
  return f.createdTime || null;
}

function toAsset(f, album) {
  const isVid = (f.mimeType || '').startsWith('video/');
  const date = driveDate(f);
  const im = f.imageMediaMetadata || {};
  const vm = f.videoMediaMetadata || {};
  return {
    id: f.id,
    provider: 'drive',
    type: isVid ? 'VIDEO' : 'IMAGE',
    originalFileName: f.name || 'media',
    localDateTime: date,
    fileCreatedAt: f.createdTime || date,
    category: album || 'Wedding',
    people: [],
    isFavorite: false,
    labels: [],
    duration: isVid && vm.durationMillis ? fmtDuration(vm.durationMillis) : null,
    thumb: isVid ? vidThumb(f.id, 500) : imgUrl(f.id, 500),
    preview: isVid ? vidThumb(f.id, 1280) : imgUrl(f.id, 1600),
    src: isVid ? '' : imgUrl(f.id, 1600),
    embed: isVid ? embedOf(f.id) : null,
    exifInfo: {
      dateTimeOriginal: date,
      make: im.cameraMake || null,
      model: im.cameraModel || null,
      city: null,
      country: import.meta.env.VITE_GALLERY_PLACE || null,
    },
  };
}

async function listFolder(folderId) {
  const out = [];
  let pageToken = '';
  do {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const fields = encodeURIComponent('nextPageToken,files(id,name,mimeType,createdTime,imageMediaMetadata(time,cameraMake,cameraModel),videoMediaMetadata(durationMillis))');
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${KEY}&fields=${fields}&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Drive ${res.status} — check folder sharing & API key`);
    const data = await res.json();
    out.push(...(data.files || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return out;
}

async function buildLibrary() {
  if (!FOLDER || !KEY) throw new Error('Drive not configured (set VITE_DRIVE_FOLDER_ID and VITE_DRIVE_KEY)');
  const FOLDER_MIME = 'application/vnd.google-apps.folder';
  const assets = [];
  // breadth-first through subfolders; each subfolder becomes an "album".
  const queue = [{ id: FOLDER, name: '' }];
  const seen = new Set();
  while (queue.length) {
    const { id, name } = queue.shift();
    if (seen.has(id)) continue; seen.add(id);
    const files = await listFolder(id);
    for (const f of files) {
      if (f.mimeType === FOLDER_MIME) queue.push({ id: f.id, name: f.name });
      else if ((f.mimeType || '').startsWith('image/') || (f.mimeType || '').startsWith('video/')) {
        assets.push(toAsset(f, name || 'Family Album'));
      }
    }
  }
  assets.sort((a, b) => new Date(b.localDateTime || 0) - new Date(a.localDateTime || 0));
  return assets;
}

async function load() {
  if (_cache) return _cache;
  _cache = await buildLibrary();
  return _cache;
}
export function invalidate() { _cache = null; } // re-pull to pick up new uploads

// Public gallery — no auth.
export async function me() { return { id: 'public', name: 'Guest' }; }
export async function login() { return {}; }
export async function logout() {}
export function getToken() { return 'public'; }

export function thumbUrl(a) { return a.thumb; }
export function previewUrl(a) { return a.preview; }
export function videoUrl(a) { return a.type === 'VIDEO' ? (a.src || '') : ''; }
export const isVideo = (a) => a?.type === 'VIDEO';
export function immichAssetLink() { return null; }

export async function fetchAssets({ max = 5000 } = {}) { return (await load()).slice(0, max); }
export async function searchAssets() { return { items: await load(), nextPage: null }; }
export async function fetchPeople() { return []; }
export async function fetchFriends() { return []; }

export async function search(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  return (await load()).filter((a) =>
    (a.originalFileName || '').toLowerCase().includes(q) ||
    (a.category || '').toLowerCase().includes(q));
}

export async function addLabel() { throw new Error('This gallery is read-only.'); }
export async function setVisibility() {}
