// Background track for galaxy mode — plays YOUR file at public/audio/galaxy.mp3,
// boosted through a Web Audio gain node so it's clearly audible. No synthesized
// wind/drone anymore. If the file is missing, it simply stays silent.

let audio = null;
let ctx = null;
let running = false;

const BOOST = 2.4; // gain multiplier (1 = normal max). Raise/lower to taste.

export function isRunning() { return running; }

export function start() {
  if (running) return;
  running = true;
  const BASE = import.meta.env.BASE_URL;
  audio = new Audio(`${BASE}audio/galaxy.mp3`);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 1;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    const src = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    gain.gain.value = BOOST;
    src.connect(gain); gain.connect(ctx.destination);
    ctx.resume?.(); // unlock if the browser suspended it
  } catch {
    audio.volume = 1; // gain boost unsupported — at least play at full volume
  }
  audio.play().catch(() => {});
}

export function stop() {
  running = false;
  if (audio) { try { audio.pause(); } catch { /* ignore */ } audio = null; }
  if (ctx) { try { ctx.close(); } catch { /* ignore */ } ctx = null; }
}
