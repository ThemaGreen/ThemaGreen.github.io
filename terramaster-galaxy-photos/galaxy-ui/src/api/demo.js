// Self-contained demo data source.
//
// Generates a synthetic photo library (trips across years, with people,
// places and categories) so the galaxy UI is fully explorable WITHOUT a
// running Immich server. Thumbnails are painted procedurally on a <canvas>
// and returned as data: URLs — no network, so the demo works offline and
// renders identically in screenshots and on the NAS.
//
// It exposes the same surface as api/immich.js: fetchAssets, fetchPeople,
// searchAssets, thumbUrl(asset), previewUrl(asset), immichAssetLink(asset).

export const isDemo = true;

// Demo needs no auth — these stubs keep the API shape uniform with live.
export async function me() { return { id: 'demo', name: 'Explorer', email: 'demo@galaxy' }; }
export async function login() { return { name: 'Explorer' }; }
export async function logout() {}
export function getToken() { return 'demo'; }

// ---------------------------------------------------------------------------
// Cast of characters and trips
// ---------------------------------------------------------------------------

const PEOPLE = [
  { id: 'p1', name: 'Maya' },
  { id: 'p2', name: 'Liam' },
  { id: 'p3', name: 'Sofia' },
  { id: 'p4', name: 'Noah' },
  { id: 'p5', name: 'Grandma Rose' },
  { id: 'p6', name: 'Mom' },
  { id: 'p7', name: 'Dad' },
  { id: 'p8', name: 'Ava' },
];
const personById = new Map(PEOPLE.map((p) => [p.id, p]));

// category -> scene painter key
const SCENES = {
  Beaches: 'beach',
  Mountains: 'mountain',
  Cityscapes: 'city',
  Architecture: 'city',
  Forests: 'forest',
  Sunsets: 'sunset',
  'Night Sky': 'night',
  Family: 'portrait',
  Food: 'food',
  Pets: 'pet',
};

const TRIPS = [
  { city: 'Santorini', country: 'Greece',       category: 'Beaches',     year: 2023, month: 7,  people: ['p6', 'p7'],        count: 22 },
  { city: 'Kyoto',     country: 'Japan',         category: 'Architecture',year: 2024, month: 4,  people: ['p1', 'p3'],        count: 24 },
  { city: 'Kyoto',     country: 'Japan',         category: 'Forests',     year: 2024, month: 4,  people: ['p1', 'p3'],        count: 12 },
  { city: 'Banff',     country: 'Canada',        category: 'Mountains',   year: 2022, month: 9,  people: ['p2', 'p4'],        count: 20 },
  { city: 'Banff',     country: 'Canada',        category: 'Forests',     year: 2022, month: 9,  people: ['p2'],              count: 10 },
  { city: 'Reykjavik', country: 'Iceland',       category: 'Night Sky',   year: 2023, month: 11, people: ['p1'],              count: 14 },
  { city: 'Lisbon',    country: 'Portugal',      category: 'Cityscapes',  year: 2025, month: 5,  people: ['p3', 'p8'],        count: 22 },
  { city: 'Maui',      country: 'USA',           category: 'Sunsets',     year: 2024, month: 8,  people: ['p6', 'p7', 'p1'],  count: 18 },
  { city: 'Cape Town', country: 'South Africa',  category: 'Mountains',   year: 2021, month: 2,  people: ['p4', 'p8'],        count: 16 },
  { city: 'New York',  country: 'USA',           category: 'Cityscapes',  year: 2020, month: 12, people: ['p5', 'p6'],        count: 18 },
  { city: 'Tuscany',   country: 'Italy',         category: 'Food',        year: 2023, month: 6,  people: ['p6', 'p7'],        count: 12 },
  { city: 'Queenstown',country: 'New Zealand',   category: 'Mountains',   year: 2025, month: 1,  people: ['p2', 'p4', 'p1'],  count: 20 },
];

// Everyday photos around the house, scattered across all the years.
const HOME = [
  { category: 'Pets',   count: 16, people: ['p1', 'p2'] },
  { category: 'Family', count: 22, people: ['p5', 'p6', 'p7', 'p1', 'p2'] },
  { category: 'Food',   count: 12, people: ['p3'] },
];

// ---------------------------------------------------------------------------
// Deterministic RNG so the library is stable between reloads
// ---------------------------------------------------------------------------

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Build the asset list
// ---------------------------------------------------------------------------

let _assets = null;

function makeAsset(n, { category, city, country }, date, peopleIds, rng) {
  const id = `demo-${String(n).padStart(4, '0')}`;
  const people = peopleIds
    .filter(() => rng() < 0.62)
    .map((pid) => personById.get(pid))
    .filter(Boolean);
  const iso = date.toISOString();
  const video = rng() < 0.15;
  return {
    id,
    type: video ? 'VIDEO' : 'IMAGE',
    duration: video ? `0:${String(8 + Math.floor(rng() * 50)).padStart(2, '0')}` : null,
    originalFileName: `${category.replace(/\s+/g, '')}_${id}.jpg`,
    isFavorite: rng() < 0.16,
    visibility: 'private', // 'private' | 'friends' | 'sensitive'
    localDateTime: iso,
    fileCreatedAt: iso,
    fileModifiedAt: iso,
    category,
    people,
    exifInfo: {
      dateTimeOriginal: iso,
      city,
      country: country || null,
      make: ['Apple', 'Google', 'Sony', 'Fujifilm'][Math.floor(rng() * 4)],
      model: ['iPhone 15 Pro', 'Pixel 8', 'A7 IV', 'X-T5'][Math.floor(rng() * 4)],
      exposureTime: '1/250',
      fNumber: 2 + Math.round(rng() * 6),
      iso: [100, 200, 400, 800][Math.floor(rng() * 4)],
    },
    _scene: SCENES[category] || 'portrait',
  };
}

function build() {
  if (_assets) return _assets;
  const rng = mulberry32(20260627);
  const assets = [];
  let n = 0;

  for (const t of TRIPS) {
    const span = 2 + Math.floor(rng() * 6); // trip lasts 2–7 days
    for (let i = 0; i < t.count; i++) {
      const day = 1 + Math.floor(rng() * span);
      const date = new Date(
        t.year, t.month - 1, day,
        7 + Math.floor(rng() * 13), Math.floor(rng() * 60), Math.floor(rng() * 60),
      );
      assets.push(makeAsset(++n, t, date, t.people, rng));
    }
  }

  for (const h of HOME) {
    for (let i = 0; i < h.count; i++) {
      const date = new Date(
        2020 + Math.floor(rng() * 6), Math.floor(rng() * 12), 1 + Math.floor(rng() * 27),
        7 + Math.floor(rng() * 13), Math.floor(rng() * 60), Math.floor(rng() * 60),
      );
      assets.push(makeAsset(++n, { category: h.category, city: 'Home', country: '' }, date, h.people, rng));
    }
  }

  // Newest first, like Immich's default timeline order.
  assets.sort((a, b) => new Date(b.localDateTime) - new Date(a.localDateTime));
  _assets = assets;
  return assets;
}

// ---------------------------------------------------------------------------
// Procedural thumbnails (offline, cached as data: URLs)
// ---------------------------------------------------------------------------

const _imgCache = new Map();

function thumbFor(asset, size) {
  const key = `${asset.id}:${size}`;
  if (_imgCache.has(key)) return _imgCache.get(key);
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  drawScene(ctx, size, size, asset._scene, mulberry32(hashStr(asset.id)));
  const url = c.toDataURL('image/jpeg', 0.85);
  _imgCache.set(key, url);
  return url;
}

function vGrad(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [c, p] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
const hsl = (h, s, l) => `hsl(${h | 0},${s | 0}%,${l | 0}%)`;

function disc(ctx, x, y, r, color) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
}

function drawScene(ctx, w, h, scene, rng) {
  const j = (a, b) => a + rng() * (b - a);
  switch (scene) {
    case 'beach': {
      vGrad(ctx, w, h, [[hsl(j(186, 200), 70, 82), 0], [hsl(40, 80, 90), 0.5]]);
      disc(ctx, j(0.2, 0.8) * w, j(0.16, 0.3) * h, w * 0.07, 'rgba(255,236,170,0.95)');
      ctx.fillStyle = hsl(j(184, 196), 55, 52); ctx.fillRect(0, h * 0.58, w, h * 0.2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, h * 0.58, w, h * 0.012);
      ctx.fillStyle = hsl(44, 60, j(78, 86)); ctx.fillRect(0, h * 0.76, w, h * 0.24);
      break;
    }
    case 'mountain': {
      vGrad(ctx, w, h, [[hsl(j(205, 220), 55, 70), 0], [hsl(200, 30, 90), 0.6]]);
      const base = h * 0.82;
      for (let k = 0; k < 3; k++) {
        const px = w * (0.2 + k * 0.3), pw = w * j(0.32, 0.46), ph = h * j(0.42, 0.62);
        ctx.beginPath(); ctx.moveTo(px - pw, base); ctx.lineTo(px, base - ph); ctx.lineTo(px + pw, base);
        ctx.closePath(); ctx.fillStyle = hsl(210, 18, 38 + k * 10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px - pw * 0.22, base - ph * 0.78); ctx.lineTo(px, base - ph);
        ctx.lineTo(px + pw * 0.22, base - ph * 0.78); ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      }
      ctx.fillStyle = hsl(150, 25, 30); ctx.fillRect(0, base, w, h - base);
      break;
    }
    case 'city': {
      vGrad(ctx, w, h, [[hsl(j(255, 280), 45, 28), 0], [hsl(28, 75, 62), 0.85]]);
      const base = h * 0.92;
      for (let x = 0; x < w; x += w * 0.11) {
        const bw = w * 0.09, bh = h * j(0.28, 0.62);
        ctx.fillStyle = hsl(250, 20, j(14, 26)); ctx.fillRect(x, base - bh, bw, bh);
        ctx.fillStyle = 'rgba(255,221,150,0.85)';
        for (let wy = base - bh + 6; wy < base - 6; wy += 12)
          for (let wx = x + 3; wx < x + bw - 4; wx += 9)
            if (rng() > 0.45) ctx.fillRect(wx, wy, 3, 5);
      }
      break;
    }
    case 'forest': {
      vGrad(ctx, w, h, [[hsl(j(80, 110), 40, 60), 0], [hsl(110, 45, 28), 0.9]]);
      const base = h * 0.92;
      for (let k = 0; k < 9; k++) {
        const tx = j(0.04, 0.96) * w, th = h * j(0.3, 0.6), tw = th * 0.42;
        ctx.beginPath(); ctx.moveTo(tx, base - th); ctx.lineTo(tx - tw / 2, base); ctx.lineTo(tx + tw / 2, base);
        ctx.closePath(); ctx.fillStyle = hsl(j(95, 140), 45, j(22, 40)); ctx.fill();
      }
      break;
    }
    case 'sunset': {
      vGrad(ctx, w, h, [[hsl(j(265, 285), 55, 42), 0], [hsl(20, 90, 60), 0.55], [hsl(45, 95, 72), 0.78]]);
      disc(ctx, w * 0.5, h * 0.62, w * 0.14, 'rgba(255,210,120,0.95)');
      ctx.fillStyle = hsl(255, 35, 22); ctx.fillRect(0, h * 0.7, w, h * 0.3);
      ctx.fillStyle = 'rgba(255,180,90,0.25)'; ctx.fillRect(0, h * 0.7, w, h * 0.02);
      break;
    }
    case 'night': {
      vGrad(ctx, w, h, [[hsl(j(230, 250), 60, 14), 0], [hsl(265, 55, 8), 1]]);
      for (let i = 0; i < 90; i++) disc(ctx, rng() * w, rng() * h * 0.85, rng() * 1.4 + 0.3, 'rgba(255,255,255,0.9)');
      // a wash of aurora
      const g = ctx.createLinearGradient(0, h * 0.2, w, h * 0.6);
      g.addColorStop(0, 'rgba(80,230,180,0.0)'); g.addColorStop(0.5, 'rgba(90,230,170,0.35)'); g.addColorStop(1, 'rgba(120,140,255,0.0)');
      ctx.fillStyle = g; ctx.fillRect(0, h * 0.15, w, h * 0.5);
      ctx.fillStyle = hsl(250, 30, 6); ctx.fillRect(0, h * 0.85, w, h * 0.15);
      break;
    }
    case 'food': {
      vGrad(ctx, w, h, [[hsl(28, 35, j(78, 88)), 0], [hsl(26, 30, 70), 1]]);
      disc(ctx, w * 0.5, h * 0.52, w * 0.34, '#fbf7f0');
      disc(ctx, w * 0.5, h * 0.52, w * 0.27, '#fff');
      disc(ctx, w * 0.5, h * 0.52, w * 0.2, hsl(j(8, 40), 70, 58));
      for (let i = 0; i < 6; i++) disc(ctx, w * 0.5 + Math.cos(i) * w * 0.1, h * 0.52 + Math.sin(i) * w * 0.1, w * 0.03, hsl(j(80, 130), 55, 45));
      break;
    }
    case 'pet': {
      vGrad(ctx, w, h, [[hsl(j(30, 45), 45, 80), 0], [hsl(35, 40, 64), 1]]);
      const cx = w * 0.5, cy = h * 0.56, r = w * 0.26, fur = hsl(j(20, 38), 55, j(38, 55));
      disc(ctx, cx, cy, r, fur);                                  // head
      disc(ctx, cx - r * 0.7, cy - r * 0.8, r * 0.4, fur);        // ears
      disc(ctx, cx + r * 0.7, cy - r * 0.8, r * 0.4, fur);
      disc(ctx, cx - r * 0.35, cy - r * 0.1, r * 0.12, '#1b1b1b'); // eyes
      disc(ctx, cx + r * 0.35, cy - r * 0.1, r * 0.12, '#1b1b1b');
      disc(ctx, cx, cy + r * 0.3, r * 0.16, '#1b1b1b');           // nose
      break;
    }
    default: { // portrait / family
      vGrad(ctx, w, h, [[hsl(j(15, 35), 50, 78), 0], [hsl(j(330, 350), 35, 66), 1]]);
      disc(ctx, w * 0.5, h * 0.42, w * 0.2, hsl(28, 45, 78));     // face
      ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.62);             // body
      ctx.arc(w * 0.5, h * 1.05, w * 0.38, Math.PI, 0); ctx.closePath();
      ctx.fillStyle = hsl(j(190, 320), 40, 55); ctx.fill();
      disc(ctx, w * 0.5, h * 0.42, w * 0.2, 'rgba(255,255,255,0)');
      break;
    }
  }
  // soft vignette to make every tile feel photographic
  const r = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.72);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, w, h);
}

// ---------------------------------------------------------------------------
// Public API (mirrors api/immich.js)
// ---------------------------------------------------------------------------

export function thumbUrl(asset) { return thumbFor(asset, 192); }
export function previewUrl(asset) { return thumbFor(asset, 640); }
export function videoUrl() { return ''; } // demo has no real video files
export const isVideo = (asset) => asset?.type === 'VIDEO';
export function immichAssetLink() { return null; } // no external app in demo

export async function searchAssets({ page = 1, size = 250, personIds } = {}) {
  let items = build();
  if (personIds?.length) items = items.filter((a) => a.people.some((p) => personIds.includes(p.id)));
  const start = (page - 1) * size;
  const slice = items.slice(start, start + size);
  return { items: slice, nextPage: start + size < items.length ? page + 1 : null, total: items.length };
}

export async function fetchAssets({ max = 600 } = {}) {
  return build().slice(0, max);
}

export async function fetchPeople() {
  const assets = build();
  return PEOPLE.map((p) => ({
    ...p,
    assetCount: assets.filter((a) => a.people.some((x) => x.id === p.id)).length,
  }));
}

// Local "smart-ish" search over the demo library: matches filename, place,
// category/label and people names.
export async function search(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  return build().filter((a) =>
    (a.originalFileName || '').toLowerCase().includes(q) ||
    (a.exifInfo?.city || '').toLowerCase().includes(q) ||
    (a.exifInfo?.country || '').toLowerCase().includes(q) ||
    (a.category || '').toLowerCase().includes(q) ||
    (a.labels || []).some((l) => l.toLowerCase().includes(q)) ||
    (a.people || []).some((p) => (p.name || '').toLowerCase().includes(q)));
}

// Labels are kept in-memory for the demo so search picks them up immediately.
export async function addLabel(assetId, name) {
  const label = (name || '').trim();
  if (!label) return;
  const a = build().find((x) => x.id === assetId);
  if (a) { a.labels = a.labels || []; if (!a.labels.includes(label)) a.labels.push(label); }
  return { id: label, name: label };
}

// Per-photo visibility (demo: just a flag).
export async function setVisibility(assetId, v) {
  const a = build().find((x) => x.id === assetId);
  if (a) a.visibility = v;
  return v;
}

// Sample friends, each with their OWN chosen palette and a shared galaxy, so
// the social experience + everyone's colors are visible in the demo.
const FRIENDS = [
  { id: 'f1', name: 'Ava',  palette: 'aurora', cats: ['Beaches', 'Forests'],      count: 9 },
  { id: 'f2', name: 'Theo', palette: 'sunset', cats: ['Cityscapes', 'Sunsets'],   count: 8 },
  { id: 'f3', name: 'Mina', palette: 'rose',   cats: ['Family', 'Food'],          count: 7 },
  { id: 'f4', name: 'Kai',  palette: 'ice',    cats: ['Mountains', 'Night Sky'],  count: 8 },
];
let _friends = null;
export async function fetchFriends() {
  if (_friends) return _friends;
  const rng = mulberry32(909);
  let n = 0;
  _friends = FRIENDS.map((f, fi) => {
    const assets = [];
    for (let i = 0; i < f.count; i++) {
      const cat = f.cats[i % f.cats.length];
      const date = new Date(2021 + Math.floor(rng() * 5), Math.floor(rng() * 12), 1 + Math.floor(rng() * 27),
        9 + Math.floor(rng() * 10), Math.floor(rng() * 60), 0);
      const a = makeAsset(90000 + fi * 100 + (n++), { category: cat, city: `${f.name}’s trip`, country: '' }, date, [], rng);
      a.visibility = 'friends';
      assets.push(a);
    }
    return { id: f.id, name: f.name, palette: f.palette, assets };
  });
  return _friends;
}

// Add a new friend to the demo universe (simulates the social flow locally).
export async function addFriend(name) {
  await fetchFriends();
  const palettes = ['nebula', 'aurora', 'sunset', 'ice', 'rose', 'solar'];
  const cats = ['Beaches', 'Mountains', 'Cityscapes', 'Forests', 'Sunsets', 'Family', 'Food', 'Night Sky'];
  const rng = mulberry32((Date.now() % 100000) + _friends.length);
  const assets = [];
  const cnt = 6 + Math.floor(rng() * 6);
  for (let i = 0; i < cnt; i++) {
    const cat = cats[Math.floor(rng() * cats.length)];
    const date = new Date(2021 + Math.floor(rng() * 5), Math.floor(rng() * 12), 1 + Math.floor(rng() * 27), 10, 0, 0);
    const a = makeAsset(990000 + _friends.length * 100 + i, { category: cat, city: `${name}’s trip`, country: '' }, date, [], rng);
    a.visibility = 'friends';
    assets.push(a);
  }
  const f = { id: `f${Date.now()}`, name, palette: palettes[Math.floor(rng() * palettes.length)], assets };
  _friends.push(f);
  return f;
}
