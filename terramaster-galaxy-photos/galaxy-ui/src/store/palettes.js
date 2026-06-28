// Color palettes for the galaxies. Each user picks one for their own universe;
// in Friends mode each friend's galaxy is drawn in *their* chosen palette.

export const PALETTES = [
  { id: 'nebula', name: 'Nebula', hues: [190, 210, 260, 300, 30],  swatch: ['#20B8CD', '#6b7bff', '#b06bff', '#ff6bd0', '#ffb86b'] },
  { id: 'aurora', name: 'Aurora', hues: [150, 170, 190, 110, 205], swatch: ['#3ee68f', '#2fd6c0', '#23b8cd', '#7CFC9E', '#4aa8ff'] },
  { id: 'sunset', name: 'Sunset', hues: [12, 28, 340, 300, 45],    swatch: ['#ff6b4a', '#ff9e3d', '#ff5fa2', '#c86bff', '#ffd24a'] },
  { id: 'ice',    name: 'Ice',    hues: [200, 210, 188, 220, 178], swatch: ['#9fd8ff', '#6bb8ff', '#bfefff', '#7c9cff', '#aef0ff'] },
  { id: 'rose',   name: 'Rose',   hues: [330, 312, 350, 285, 20],  swatch: ['#ff6bd0', '#c86bff', '#ff7a9c', '#a06bff', '#ffae8a'] },
  { id: 'solar',  name: 'Solar',  hues: [42, 30, 14, 50, 0],       swatch: ['#ffd24a', '#ff9e3d', '#ff6b4a', '#ffe07a', '#ff4a4a'] },
];

export const PALETTE_BY_ID = Object.fromEntries(PALETTES.map((p) => [p.id, p]));
export const getPalette = (id) => PALETTE_BY_ID[id] || PALETTES[0];

// Color for a cluster, given the active palette.
//   time  -> flows across the palette's hues by recency
//   other -> stable hash of the cluster key onto a palette hue
export function paletteColor(palette, key, i, total, mode) {
  const hues = palette?.hues?.length ? palette.hues : [190, 260, 30];
  if (mode === 'time' && total > 1) {
    const t = i / (total - 1);
    const f = t * (hues.length - 1);
    const a = Math.floor(f), b = Math.min(hues.length - 1, a + 1), m = f - a;
    const h = hues[a] + (hues[b] - hues[a]) * m;
    return `hsl(${((h % 360) + 360) % 360 | 0}, 76%, 62%)`;
  }
  let h = 0;
  for (let k = 0; k < key.length; k++) h = (h * 31 + key.charCodeAt(k)) >>> 0;
  const hue = hues[h % hues.length];
  const light = 56 + (h % 3) * 6;
  return `hsl(${hue}, 72%, ${light}%)`;
}
