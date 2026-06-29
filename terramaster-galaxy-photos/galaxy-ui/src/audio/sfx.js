// Short sound effects from your own files. Drop them in galaxy-ui/public/audio/:
//   tap.mp3   — when you open a photo/video
//   move.mp3  — when you jump to another photo/video (tour / next / prev)
// Missing files just no-op (play() rejects silently). Gated by the master
// "Ambient sound" setting.

const BASE = import.meta.env.BASE_URL;
const cache = {};
let enabled = false;

export function setSfxEnabled(v) { enabled = !!v; }

function ping(name, vol) {
  if (!enabled) return;
  try {
    if (!cache[name]) { const a = new Audio(`${BASE}audio/${name}`); a.preload = 'auto'; cache[name] = a; }
    const node = cache[name].cloneNode(); // clone so rapid taps overlap
    node.volume = vol;
    node.play().catch(() => {});
  } catch { /* ignore */ }
}

export function playTap() { ping('tap.mp3', 0.5); }
export function playMove() { ping('move.mp3', 0.6); }
