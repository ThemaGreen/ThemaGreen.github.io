// Albums / Collections — named groups of photos so you can jump straight to a
// set without searching every time. Stored in localStorage (per-device); the
// "queue" is just a built-in album the tour plays through. When a Supabase
// backend + sign-in is added later, these can sync per-account instead.

const KEY = 'galaxy.collections.v1';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}
function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore quota */ }
  return list;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export function listCollections() { return read(); }

export function createCollection(name, assetIds = []) {
  const list = read();
  const col = { id: uid(), name: (name || 'Untitled album').trim(), assetIds: [...new Set(assetIds)], createdAt: Date.now() };
  list.push(col); write(list);
  return col;
}

export function renameCollection(id, name) {
  const list = read().map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c));
  return write(list);
}

export function deleteCollection(id) {
  return write(read().filter((c) => c.id !== id));
}

export function inCollection(id, assetId) {
  const c = read().find((x) => x.id === id);
  return !!c && c.assetIds.includes(assetId);
}

// Toggle a photo's membership; returns the updated list.
export function toggleInCollection(id, assetId) {
  const list = read().map((c) => {
    if (c.id !== id) return c;
    const has = c.assetIds.includes(assetId);
    return { ...c, assetIds: has ? c.assetIds.filter((a) => a !== assetId) : [...c.assetIds, assetId] };
  });
  return write(list);
}

// Convenience: which album ids contain this asset.
export function collectionsOf(assetId) {
  return read().filter((c) => c.assetIds.includes(assetId)).map((c) => c.id);
}
