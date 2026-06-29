// Hyperreal deep-space dressing for the galaxy graph — a JWST-style backdrop:
// a dense multi-colour starfield, soft nebula clouds, and diffraction-spike
// "stars" for the cluster cores. All textures are painted on a canvas so
// there are no external assets.

import * as THREE from 'three';

const _cache = new Map();
const cached = (key, make) => { if (!_cache.has(key)) _cache.set(key, make()); return _cache.get(key); };

// A round soft dot — the building block for background stars and glows.
function dotTexture() {
  return cached('dot', () => {
    const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

// A soft coloured glow halo (sits behind photo sprites so clusters read as
// luminous from afar).
export function glowTexture(color = '#9fd8ff') {
  return cached(`glow:${color}`, () => {
    const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, hexA(color, 0.9));
    g.addColorStop(0.4, hexA(color, 0.35));
    g.addColorStop(1, hexA(color, 0));
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

// A bright star with 8 diffraction spikes (the JWST look).
export function spikeTexture(color = '#ffffff') {
  return cached(`spike:${color}`, () => {
    const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d');
    x.translate(s / 2, s / 2);
    x.globalCompositeOperation = 'lighter';

    // core
    const core = x.createRadialGradient(0, 0, 0, 0, 0, s * 0.16);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(0.5, hexA(color, 0.9));
    core.addColorStop(1, hexA(color, 0));
    x.fillStyle = core; x.beginPath(); x.arc(0, 0, s * 0.16, 0, Math.PI * 2); x.fill();

    // spikes: 4 long (N/S/E/W) + 4 shorter diagonals
    const drawSpike = (angle, len, width, col) => {
      x.save(); x.rotate(angle);
      const g = x.createLinearGradient(0, 0, 0, -len);
      g.addColorStop(0, hexA(col, 0.95));
      g.addColorStop(0.15, hexA(col, 0.5));
      g.addColorStop(1, hexA(col, 0));
      x.fillStyle = g;
      x.beginPath(); x.moveTo(-width, 0); x.lineTo(width, 0); x.lineTo(0, -len); x.closePath(); x.fill();
      x.restore();
    };
    const L = s * 0.48;
    for (let k = 0; k < 4; k++) drawSpike((Math.PI / 2) * k, L, 3.2, '#bcd8ff');     // long, cool
    for (let k = 0; k < 4; k++) drawSpike((Math.PI / 2) * k + Math.PI / 4, L * 0.55, 2.2, color); // diagonal, tinted

    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

// A distant galaxy smudge — bright core fading to a tilted halo.
function galaxyTexture(seed) {
  return cached(`gal:${seed}`, () => {
    const s = 96, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d');
    x.globalCompositeOperation = 'lighter';
    const tints = ['#fff4e0', '#ffe6c2', '#dfe8ff', '#ffd9c0', '#ffffff'];
    const r = mulberry32(seed);
    const hue = tints[(r() * tints.length) | 0];
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, hexA(hue, 0.85));
    g.addColorStop(0.6, hexA(hue, 0.25));
    g.addColorStop(1, hexA(hue, 0));
    x.fillStyle = g; x.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  });
}

// Hundreds of faraway galaxies scattered through the deep field so it stays
// rich and full at every zoom level (JWST-style). Returned as a Points-like
// group of tilted sprites.
export function buildBackgroundGalaxies({ count = 320, radius = 1900 } = {}) {
  const group = new THREE.Group();
  group.name = 'bgGalaxies';
  const r = mulberry32(53);
  for (let i = 0; i < count; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, rr = radius * (0.4 + r() * 0.6);
    const sq = Math.sqrt(1 - u * u);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: galaxyTexture((i % 24) + 1), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.35 + r() * 0.5,
    }));
    sp.position.set(rr * sq * Math.cos(th), rr * sq * Math.sin(th), rr * u);
    const w = 10 + r() * 34, h = w * (0.35 + r() * 0.6); // tilted ellipse
    sp.scale.set(w, h, 1);
    sp.material.rotation = r() * Math.PI;
    group.add(sp);
  }
  group.renderOrder = -8;
  return group;
}

// A billowing nebula cloud built from many additive colour blobs. Saturation
// is kept low for an elegant, muted look; sat/light are tunable.
function nebulaTexture(seed, hues, sat = 42, light = 62) {
  return cached(`neb:${seed}:${hues.join(',')}:${sat}`, () => {
    const s = 512, c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d');
    x.globalCompositeOperation = 'lighter';
    let r = mulberry32(seed);
    for (let i = 0; i < 140; i++) {
      const px = r() * s, py = r() * s, rad = 30 + r() * 150;
      const hue = hues[(r() * hues.length) | 0];
      const g = x.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, `hsla(${hue},${sat}%,${light}%,${0.05 + r() * 0.06})`);
      g.addColorStop(1, `hsla(${hue},${sat}%,${light}%,0)`);
      x.fillStyle = g; x.fillRect(0, 0, s, s);
    }
    // radial edge falloff so the billboard has no hard rectangular border
    x.globalCompositeOperation = 'destination-in';
    const mask = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(0.6, 'rgba(0,0,0,1)');
    mask.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = mask; x.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
}

// Thousands of stars on a big shell around the scene. Two layers (faint dust +
// brighter stars) give depth without needing a custom per-point-size shader.
function starLayer(count, radius, baseSize, seed) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const r = mulberry32(seed);
  const palette = [
    [1, 1, 1], [0.78, 0.86, 1], [0.7, 0.8, 1],   // white / blue-white
    [1, 0.88, 0.72], [1, 0.74, 0.5],             // warm / amber
  ];
  for (let i = 0; i < count; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, rr = radius * (0.55 + r() * 0.45);
    const sq = Math.sqrt(1 - u * u);
    pos[i * 3] = rr * sq * Math.cos(th);
    pos[i * 3 + 1] = rr * sq * Math.sin(th);
    pos[i * 3 + 2] = rr * u;
    const p = palette[(Math.pow(r(), 2) * palette.length) | 0];
    const b = 0.5 + r() * 0.5;
    col[i * 3] = p[0] * b; col[i * 3 + 1] = p[1] * b; col[i * 3 + 2] = p[2] * b;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    map: dotTexture(), vertexColors: true, size: baseSize, sizeAttenuation: true,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.renderOrder = -10; points.frustumCulled = false;
  return points;
}

// Deep parallax starfield: several shells that drift at different speeds so the
// field feels three-dimensional, massive and endless.
// The deep field is split in two so zooming feels right:
//   • SKYBOX  — the far sky; follows the camera so it never runs out (no blank
//     on zoom-out) and reads as "infinitely far".
//   • WORLD   — mid/near stars, distant galaxies and hero-stars at FIXED world
//     positions, so they slide past in parallax as you fly in and out.
export function buildSkybox() {
  const g = new THREE.Group();
  g.name = 'skybox';
  const far = starLayer(4200, 3000, 10, 3); far.name = 'far';
  far.userData.baseOpacity = far.material.opacity;
  g.add(far);
  g.add(buildNebulae());
  g.add(buildGalacticHaze());
  return g;
}

export function buildWorld() {
  const g = new THREE.Group();
  g.name = 'world';
  const core = starLayer(600, 550, 10, 31); core.name = 'core'; // stars among the clusters
  const mid = starLayer(3000, 1700, 7, 7); mid.name = 'mid';
  const near = starLayer(800, 950, 13, 19); near.name = 'near';
  for (const l of [core, mid, near]) l.userData.baseOpacity = l.material.opacity;
  g.add(core, mid, near);
  g.add(buildBackgroundGalaxies({ count: 240, radius: 2600 }));
  g.add(buildHeroStars({ count: 16, radius: 1500 }));
  return g;
}

// Soft colour clouds that hug the cluster region near the origin, so each
// galaxy sits inside drifting nebula. These take their colour from the chosen
// palette (this is what "changes colour" when you switch palettes), kept
// low-saturation and low-opacity for an elegant look.
export function buildClusterClouds(palette) {
  const hues = (palette && palette.hues && palette.hues.length) ? palette.hues : [205, 270, 30];
  const pick = (i) => [hues[i % hues.length], hues[(i + 1) % hues.length], hues[(i + 2) % hues.length]];
  const g = new THREE.Group();
  g.name = 'clusterClouds';
  const defs = [
    { seed: 201, pos: [-130, 60, -40],   scale: 620, op: 0.18 },
    { seed: 202, pos: [170, -50, 90],    scale: 680, op: 0.16 },
    { seed: 203, pos: [40, 150, -130],   scale: 560, op: 0.14 },
    { seed: 204, pos: [-190, -130, 120], scale: 640, op: 0.14 },
    { seed: 205, pos: [120, 120, 30],    scale: 540, op: 0.15 },
  ];
  defs.forEach((d, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: nebulaTexture(d.seed, pick(i), 40, 64), transparent: true, opacity: d.op,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    sp.position.set(...d.pos);
    sp.scale.set(d.scale, d.scale, 1);
    sp.renderOrder = -7;
    g.add(sp);
  });
  return g;
}

// A handful of brilliant foreground stars with full diffraction spikes — the
// unmistakable JWST signature. Returned as a group so it can gently pulse.
export function buildHeroStars({ count = 16, radius = 1000 } = {}) {
  const group = new THREE.Group();
  group.name = 'heroStars';
  const r = mulberry32(101);
  const tints = ['#ffffff', '#cfe0ff', '#bcd8ff', '#ffe9c8', '#ffd9b0'];
  for (let i = 0; i < count; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, rr = radius * (0.6 + r() * 0.5);
    const sq = Math.sqrt(1 - u * u);
    const color = tints[(r() * tints.length) | 0];
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: spikeTexture(color), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.9,
    }));
    sp.position.set(rr * sq * Math.cos(th), rr * sq * Math.sin(th), rr * u);
    const s = 70 + r() * 130;
    sp.scale.set(s, s, 1);
    sp.userData = { base: s, phase: r() * Math.PI * 2, speed: 0.6 + r() };
    group.add(sp);
  }
  return group;
}

// Faint galactic haze band — a soft luminous river across the deep field.
export function buildGalacticHaze() {
  const mat = new THREE.SpriteMaterial({
    map: nebulaTexture(77, [220, 235, 280, 30]), transparent: true, opacity: 0.1,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(5200, 2200, 1);
  sp.position.set(0, -200, -2600);
  sp.material.rotation = 0.4;
  sp.renderOrder = -9;
  sp.name = 'haze';
  return sp;
}

export function buildNebulae() {
  const group = new THREE.Group();
  const defs = [
    { seed: 11, hues: [20, 32, 16], pos: [-1100, 500, -1900], scale: 2000, op: 0.18 },   // amber dust
    { seed: 23, hues: [205, 220, 190], pos: [1300, -400, -2100], scale: 1900, op: 0.16 }, // teal/blue
    { seed: 41, hues: [275, 250, 300], pos: [400, 1000, -2300], scale: 2200, op: 0.13 },  // violet
  ];
  for (const d of defs) {
    const mat = new THREE.SpriteMaterial({
      map: nebulaTexture(d.seed, d.hues), transparent: true, opacity: d.op,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const sp = new THREE.Sprite(mat);
    sp.position.set(...d.pos);
    sp.scale.set(d.scale, d.scale, 1);
    sp.renderOrder = -9;
    group.add(sp);
  }
  return group;
}

// helpers ------------------------------------------------------------------
function hexA(hex, a) {
  const { r, g, b } = toRGB(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function toRGB(hex) {
  if (hex.startsWith('hsl')) { const el = document.createElement('canvas').getContext('2d'); el.fillStyle = hex; hex = el.fillStyle; }
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
