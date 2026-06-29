// Turns a flat list of assets into graph data (nodes + links) where each
// cluster is a "galaxy": a hub core with photo nodes orbiting it. The
// force-graph then physically floats the galaxies apart.
//
// "Cluster by" mode decides how assets are grouped:
//   time   -> by Year / Month / Day
//   places -> by city
//   things -> by category (Beaches, Mountains, …)
//   people -> one galaxy per recognized person (built separately, since an
//             asset can belong to several people)

import { paletteColor, getPalette } from '../store/palettes.js';

const pad = (n) => String(n).padStart(2, '0');

function timeKey(a, granularity) {
  const d = new Date(a.exifInfo?.dateTimeOriginal || a.localDateTime || a.fileCreatedAt);
  if (Number.isNaN(d.getTime())) return { key: 'unknown', label: 'Unknown date', order: -Infinity };
  switch (granularity) {
    case 'year':
      return { key: `${d.getFullYear()}`, label: `${d.getFullYear()}`, order: d.getFullYear() };
    case 'day':
      return { key: d.toISOString().slice(0, 10),
               label: d.toLocaleDateString(undefined, { dateStyle: 'medium' }), order: d.getTime() };
    case 'month':
    default:
      return { key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
               label: d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' }),
               order: d.getFullYear() * 12 + d.getMonth() };
  }
}

function placeKey(a) {
  const city = a.exifInfo?.city;
  if (!city) return { key: 'unknown-place', label: 'Unknown place' };
  const country = a.exifInfo?.country;
  return { key: city, label: country ? `${city}, ${country}` : city };
}

function typeKey(a) {
  return a.type === 'VIDEO' ? { key: 'video', label: 'Videos' } : { key: 'photo', label: 'Photos' };
}
function cameraKey(a) {
  const c = [a.exifInfo?.make, a.exifInfo?.model].filter(Boolean).join(' ').trim();
  return c ? { key: c, label: c } : { key: 'unknown-cam', label: 'Unknown camera' };
}

// Multi-value groupers (an asset can belong to several): a photo with two
// people appears in both their galaxies. Untagged photos return [] so they
// don't clutter tag-based views.
const multiKey = (arr, prefix) => (Array.isArray(arr) ? arr : []).filter(Boolean).map((v) => ({ key: `${prefix}:${v}`, label: v }));
const peopleKey = (a) => multiKey((a.people || []).map((p) => p.name || p), 'person');
const familyKey = (a) => multiKey(a.family, 'family');
const labelKey  = (a) => multiKey([...(a.labels || []), ...(a.category && a.category !== 'Wedding' && a.category !== 'Drive' && a.category !== 'Album' ? [a.category] : [])], 'label');

function grouperFor(mode, granularity) {
  switch (mode) {
    case 'places': return placeKey;
    case 'things': return labelKey;
    case 'labels': return labelKey;
    case 'people': return peopleKey;
    case 'family': return familyKey;
    case 'type':   return typeKey;
    case 'camera': return cameraKey;
    default:       return (a) => timeKey(a, granularity);
  }
}

export function buildGraph(assets, { mode = 'time', granularity = 'month', thumbOf, palette }) {
  const grouper = grouperFor(mode, granularity);
  const clusters = new Map();
  for (const a of assets) {
    const res = grouper(a);
    const entries = Array.isArray(res) ? res : [res];
    for (const { key, label, order } of entries) {
      if (!key) continue;
      if (!clusters.has(key)) clusters.set(key, { label, order: order ?? null, assets: [] });
      clusters.get(key).assets.push(a);
    }
  }
  return clustersToGraph(clusters, thumbOf, mode, getPalette(palette));
}

// People galaxies: assetsByPerson is Map<personId, { person, assets }>.
export function buildPeopleGraph(assetsByPerson, thumbOf, palette) {
  const clusters = new Map();
  for (const [id, { person, assets }] of assetsByPerson) {
    clusters.set(`person-${id}`, { label: person.name || 'Unnamed', assets, order: null });
  }
  return clustersToGraph(clusters, thumbOf, 'people', getPalette(palette));
}

// Friends galaxies: friends is [{ id, name, palette, assets }]. Each friend's
// galaxy is drawn in *their* chosen palette so you can see everyone's colors.
export function buildFriendsGraph(friends, thumbOf) {
  const nodes = [];
  const links = [];
  friends.forEach((f, i) => {
    const pal = getPalette(f.palette);
    const hubId = `hub:friend-${f.id}`;
    const color = paletteColor(pal, f.id || String(i), i, friends.length, 'friends');
    nodes.push({
      id: hubId, type: 'hub', label: `${f.name} ✦`, count: f.assets.length,
      val: Math.min(22, 6 + Math.sqrt(f.assets.length) * 1.4), color, friend: f,
    });
    for (const a of f.assets) {
      nodes.push({
        id: `${hubId}/${a.id}`, assetId: a.id, type: 'photo', hub: hubId,
        thumb: thumbOf(a), label: a.originalFileName || 'photo', asset: a, color, val: 2,
      });
      links.push({ source: hubId, target: `${hubId}/${a.id}`, hub: hubId });
    }
  });
  return { nodes, links };
}

function clustersToGraph(clusters, thumbOf, mode, palette) {
  const nodes = [];
  const links = [];
  // Order time clusters chronologically; everything else by size (biggest first).
  const ordered = [...clusters.entries()].sort((a, b) => {
    if (a[1].order != null && b[1].order != null) return a[1].order - b[1].order;
    return b[1].assets.length - a[1].assets.length;
  });

  ordered.forEach(([key, { label, assets }], i) => {
    const hubId = `hub:${key}`;
    const color = paletteColor(palette, key, i, ordered.length, mode);
    nodes.push({
      id: hubId,
      type: 'hub',
      label,
      count: assets.length,
      val: Math.min(22, 6 + Math.sqrt(assets.length) * 1.4),
      color,
    });
    for (const a of assets) {
      nodes.push({
        id: `${hubId}/${a.id}`, // unique per galaxy so an asset can appear in several
        assetId: a.id,
        type: 'photo',
        hub: hubId,
        thumb: thumbOf(a),
        label: a.originalFileName || 'photo',
        asset: a,
        color,
        val: 2,
      });
      links.push({ source: hubId, target: `${hubId}/${a.id}`, hub: hubId });
    }
  });
  return { nodes, links };
}
