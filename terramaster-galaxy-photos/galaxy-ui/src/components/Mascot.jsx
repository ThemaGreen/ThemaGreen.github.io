import { useEffect, useRef, useState } from 'react';

// Stella — the star-photographer mascot.
//
// Uses your artwork at /stella.png (drop a transparent PNG into
// galaxy-ui/public/stella.png). If it's missing, a simple friendly star is
// shown so nothing looks broken.
//
// Interactions: idle bob, subtle tilt toward the cursor, hover wiggle,
// click -> rotating helpful tip, double-click -> happy spin.

const TIPS = [
  "Hi! I'm Stella ✨ Drag anywhere to orbit the galaxies.",
  'Each glowing core is a galaxy — a cluster of your photos.',
  'Try “Cluster by → People” to see everyone’s own galaxy.',
  'Switch to “Places” to travel your photos by city. 🌍',
  'Scroll to zoom. Click a photo-star for its details.',
  'Tap the ☀️ in Settings for light mode.',
  '★ Favorites filters down to the keepers.',
  'Type in the search bar to spotlight matching photos.',
];

export default function Mascot({ onTip }) {
  const ref = useRef(null);
  const artRef = useRef(null);
  const [tip, setTip] = useState(null);
  const [spin, setSpin] = useState(false);
  const [useSvg, setUseSvg] = useState(false);
  const tipIdx = useRef(0);
  const hideTimer = useRef(null);

  // Gentle tilt toward the cursor for a touch of life.
  useEffect(() => {
    const onMove = (e) => {
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

  const say = () => {
    const t = TIPS[tipIdx.current % TIPS.length];
    tipIdx.current += 1;
    setTip(t);
    onTip?.(t);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setTip(null), 5200);
  };
  const cheer = () => { setSpin(true); setTimeout(() => setSpin(false), 800); };

  return (
    <div className="mascot" ref={ref}>
      {tip && <div className="mascot-bubble" role="status" onClick={() => setTip(null)}>{tip}</div>}
      <button
        className={`mascot-btn ${spin ? 'spin' : ''}`}
        onClick={say}
        onDoubleClick={cheer}
        aria-label="Stella — tap for a tip"
        title="Tap me for a tip!"
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
