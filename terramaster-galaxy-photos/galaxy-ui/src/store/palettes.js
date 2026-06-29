// Color palettes for the galaxies. The chosen palette tints the nebula CLOUDS
// drifting around your photos (and, more subtly, the cluster cores). Saturation
// is kept low for an elegant, muted look.

export const PALETTES = [
  { id: 'nebula', name: 'Nebula', hues: [205, 230, 270, 310, 30],  swatch: ['#5aa6b8', '#6f7fc0', '#9c7ec0', '#c07ea6', '#c9a273'] },
  { id: 'aurora', name: 'Aurora', hues: [150, 175, 195, 120, 210], swatch: ['#5cab8a', '#4fa9a0', '#4f96a8', '#7cbf90', '#5f93c0'] },
  { id: 'sunset', name: 'Sunset', hues: [16, 30, 345, 300, 45],    swatch: ['#c07a5e', '#c79256', '#c06f8e', '#9c7ec0', '#cbb06a'] },
  { id: 'ice',    name: 'Ice',    hues: [200, 212, 188, 222, 178], swatch: ['#86b2cc', '#7aa6cc', '#9ec6d8', '#8a9cc0', '#9ec8cc' ] },
  { id: 'rose',   name: 'Rose',   hues: [330, 312, 350, 285, 20],  swatch: ['#c07ea6', '#a87ec0', '#c07e90', '#967ec0', '#c89e86'] },
  { id: 'mono',   name: 'Moonlit',hues: [220, 225, 215, 230, 210], swatch: ['#8893a8', '#7e8aa6', '#94a0b4', '#7886a4', '#9aa4b8'] },
];

export const PALETTE_BY_ID = Object.fromEntries(PALETTES.map((p) => [p.id, p]));
export const getPalette = (id) => PALETTE_BY_ID[id] || PALETTES[0];

// Cluster-core color (kept muted). time flows across the palette's hues by
// recency; categorical modes hash the cluster key onto a palette hue.
export function paletteColor(palette, key, i, total, mode) {
  const hues = palette?.hues?.length ? palette.hues : [205, 270, 30];
  if (mode === 'time' && total > 1) {
    const t = i / (total - 1);
    const f = t * (hues.length - 1);
    const a = Math.floor(f), b = Math.min(hues.length - 1, a + 1), m = f - a;
    const h = hues[a] + (hues[b] - hues[a]) * m;
    return `hsl(${((h % 360) + 360) % 360 | 0}, 55%, 64%)`;
  }
  let h = 0;
  for (let k = 0; k < key.length; k++) h = (h * 31 + key.charCodeAt(k)) >>> 0;
  const hue = hues[h % hues.length];
  const light = 60 + (h % 3) * 5;
  return `hsl(${hue}, 52%, ${light}%)`;
}
