import { useEffect, useRef, useState } from 'react';

// Stella — the star-photographer mascot.
//
// Uses your artwork at /stella.png (drop a transparent PNG into
// galaxy-ui/public/stella.png). If it's missing, a friendly star is shown.
//
// Interactions: idle bob, subtle tilt toward the cursor, tap → rotating tip,
// double-tap → happy spin, and you can DRAG her anywhere on screen — on drop
// she plays one of several reaction animations (spin / bounce / wobble / flip).

const TIPS = [
  "Hi! I'm Stella ✨ Welcome to Amira & Jacob’s wedding gallery.",
  'Drag to orbit the galaxies · scroll to zoom in.',
  'Psst — you can drag me anywhere on screen. Try it!',
  'Each glowing core is a galaxy of photos — tap one to explore.',
  'Tap a photo to see it big, with the date and details.',
  'Tap the ❤️ on a photo so the family sees what you love.',
  'Open a photo to add tags: People, Family, Location, Labels.',
  'Search a name like “Thema” to find every photo they’re tagged in.',
  'Make an Album so you don’t have to search the same thing twice.',
];

const REACTIONS = ['react-spin', 'react-bounce', 'react-wobble', 'react-flip'];

export default function Mascot({ onTip }) {
  const ref = useRef(null);
  const artRef = useRef(null);
  const [tip, setTip] = useState(null);
  const [reaction, setReaction] = useState(null);
  const [useSvg, setUseSvg] = useState(false);
  const [pos, setPos] = useState(null);   // {x,y} once dragged, else null (CSS default)
  const [dragging, setDragging] = useState(false);
  const tipIdx = useRef(0);
  const hideTimer = useRef(null);
  const reactTimer = useRef(null);
  const drag = useRef(null);   // { offX, offY, moved, downAt }

  // Gentle tilt toward the cursor for a touch of life (paused while dragging).
  useEffect(() => {
    const onMove = (e) => {
      if (drag.current) return;
      const el = ref.current, art = artRef.current;
      if (!el || !art) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;
      art.style.setProperty('--tilt', `${dx * 9}deg`);
      art.style.setProperty('--lift', `${dy * 5}px`);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const react = () => {
    const r = REACTIONS[(Math.random() * REACTIONS.length) | 0];
    setReaction(null);
    // next frame so the class re-triggers even if it's the same one
    requestAnimationFrame(() => setReaction(r));
    clearTimeout(reactTimer.current);
    reactTimer.current = setTimeout(() => setReaction(null), 1100);
  };

  const say = () => {
    const t = TIPS[tipIdx.current % TIPS.length];
    tipIdx.current += 1;
    setTip(t);
    onTip?.(t);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTip(null), 5200);
  };

  // ---- drag handling ----
  const onPointerDown = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    drag.current = { offX: e.clientX - r.left, offY: e.clientY - r.top, moved: 0, downAt: Date.now() };
    el.setPointerCapture?.(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e) => {
    const d = drag.current; if (!d) return;
    d.moved += Math.abs(e.movementX) + Math.abs(e.movementY);
    const size = ref.current?.offsetWidth || 96;
    const x = Math.max(4, Math.min(window.innerWidth - size - 4, e.clientX - d.offX));
    const y = Math.max(4, Math.min(window.innerHeight - size - 4, e.clientY - d.offY));
    setPos({ x, y });
  };
  const onPointerUp = (e) => {
    const d = drag.current; drag.current = null;
    setDragging(false);
    ref.current?.releasePointerCapture?.(e.pointerId);
    if (!d) return;
    if (d.moved < 6 && Date.now() - d.downAt < 350) {
      say();           // treated as a tap
    } else {
      react();         // dropped after a drag → celebrate
    }
  };

  const style = pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined;

  return (
    <div
      className={`mascot ${dragging ? 'dragging' : ''} ${pos ? 'placed' : ''}`}
      ref={ref}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {tip && <div className="mascot-bubble" role="status" onClick={() => setTip(null)}>{tip}</div>}
      <button
        className={`mascot-btn ${reaction || ''}`}
        onDoubleClick={react}
        aria-label="Stella — tap for a tip, drag to move"
        title="Tap me for a tip — or drag me anywhere!"
      >
        <span className="mascot-art" ref={artRef}>
          {useSvg
            ? <FriendlyStar />
            : <img className="mascot-img" src={`${import.meta.env.BASE_URL}stella.png`} alt="Stella" onError={() => setUseSvg(true)} draggable={false} />}
        </span>
      </button>
    </div>
  );
}

// Plain, friendly fallback (only if /stella.png is absent).
function FriendlyStar() {
  return (
    <svg viewBox="0 0 100 100" width="96" height="96" aria-hidden="true">
      <defs>
        <radialGradient id="fs-fill" cx="50%" cy="38%" r="68%">
          <stop offset="0%" stopColor="#FFE9A8" /><stop offset="55%" stopColor="#FFC95B" /><stop offset="100%" stopColor="#F2A33C" />
        </radialGradient>
      </defs>
      <path fill="url(#fs-fill)" stroke="#E0875F" strokeWidth="1.5" strokeLinejoin="round"
        d="M50 8 L60 38 L92 38 L66 57 L76 88 L50 69 L24 88 L34 57 L8 38 L40 38 Z" />
      <circle cx="42" cy="50" r="3.2" fill="#3a2a1a" /><circle cx="58" cy="50" r="3.2" fill="#3a2a1a" />
      <path d="M44 58 Q50 63 56 58" fill="none" stroke="#3a2a1a" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
