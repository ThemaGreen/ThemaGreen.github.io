// Authenticated media loading for REMOTE Immich servers.
//
// Plain <img> tags and texture loaders can't attach an Authorization header, so
// when the visitor is signed into their own (cross-origin) Immich we fetch the
// image with their Bearer token and hand back a blob object-URL instead. On the
// same-origin NAS deployment (and for Drive/demo URLs) the URL passes through
// untouched — the session cookie or public CDN handles it.

import { useEffect, useState } from 'react';
import { getToken, activeBase, isRemote } from './immich.js';

const cache = new Map(); // url -> Promise<objectURL|url>

function needsAuthFetch(url) {
  return !!url && isRemote() && url.startsWith(activeBase());
}

export function resolveImage(url) {
  if (!needsAuthFetch(url)) return Promise.resolve(url);
  if (cache.has(url)) return cache.get(url);
  const p = fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
    .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.blob(); })
    .then((b) => URL.createObjectURL(b))
    .catch(() => url); // fall back to the raw URL (may still work via cookie)
  cache.set(url, p);
  return p;
}

// React hook: give it any media URL, get back one that's safe for <img>/<video poster>.
export function useResolvedSrc(url) {
  const [src, setSrc] = useState(() => (needsAuthFetch(url) ? null : url));
  useEffect(() => {
    let off = false;
    if (!needsAuthFetch(url)) { setSrc(url); return undefined; }
    setSrc(null);
    resolveImage(url).then((u) => { if (!off) setSrc(u); });
    return () => { off = true; };
  }, [url]);
  return src;
}
