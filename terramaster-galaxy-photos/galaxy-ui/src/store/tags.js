// Shared, user-applied tags (people / location / family / labels) that STICK
// for everyone. Saved to Supabase if configured (VITE_SUPABASE_URL +
// VITE_SUPABASE_ANON_KEY), else to localStorage (per-device fallback).
//
// Supabase table:
//   create table tags (
//     id bigint generated always as identity primary key,
//     asset_id text not null, kind text not null, value text not null,
//     created_at timestamptz default now(),
//     unique (asset_id, kind, value)
//   );
//   alter table tags enable row level security;
//   create policy "read"   on tags for select using (true);
//   create policy "add"    on tags for insert with check (true);
//   create policy "remove" on tags for delete using (true);

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const tagsShared = !!(SB_URL && SB_KEY);

const LOCAL = 'galaxy.tags';
const hdr = () => ({ apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' });
const localAll = () => { try { return JSON.parse(localStorage.getItem(LOCAL) || '[]'); } catch { return []; } };
const saveLocal = (a) => { try { localStorage.setItem(LOCAL, JSON.stringify(a)); } catch { /* ignore */ } };

// The tag kinds the UI offers, with friendly labels + pre-filled suggestions.
// PEOPLE is pre-seeded with known attendees so you can tag fast; guests can
// still type their own name if they're missing — searching a name (e.g. "Thema")
// then shows only the photos labelled with that person.
export const KINDS = [
  { id: 'person', label: 'People',   seeds: ['Amira', 'Jacob', 'Thema'] },
  { id: 'family', label: 'Family',   seeds: ['Bride’s side', 'Groom’s side', 'Immediate family', 'Extended family'] },
  { id: 'place',  label: 'Location', seeds: ['Saint John, Canada', 'Halifax, Canada', 'New York', 'Carnival Venezia Cruise'] },
  { id: 'label',  label: 'Labels',   seeds: ['ceremony', 'reception', 'speeches', 'first dance', 'candid', 'group photo'] },
];

export async function fetchAllTags() {
  if (tagsShared) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/tags?select=asset_id,kind,value`, { headers: hdr() });
      if (r.ok) return await r.json();
    } catch { /* fall through */ }
  }
  return localAll();
}

export async function addTag(asset_id, kind, value) {
  value = (value || '').trim();
  if (!value) return;
  if (tagsShared) {
    try {
      await fetch(`${SB_URL}/rest/v1/tags`, {
        method: 'POST', headers: { ...hdr(), Prefer: 'resolution=ignore-duplicates' },
        body: JSON.stringify({ asset_id, kind, value }),
      });
      return;
    } catch { /* fall through */ }
  }
  const a = localAll();
  if (!a.some((t) => t.asset_id === asset_id && t.kind === kind && t.value === value)) { a.push({ asset_id, kind, value }); saveLocal(a); }
}

export async function removeTag(asset_id, kind, value) {
  if (tagsShared) {
    try {
      const q = `${SB_URL}/rest/v1/tags?asset_id=eq.${encodeURIComponent(asset_id)}&kind=eq.${encodeURIComponent(kind)}&value=eq.${encodeURIComponent(value)}`;
      await fetch(q, { method: 'DELETE', headers: hdr() });
      return;
    } catch { /* fall through */ }
  }
  saveLocal(localAll().filter((t) => !(t.asset_id === asset_id && t.kind === kind && t.value === value)));
}

// Build { assetId -> { person:[], family:[], place:[], label:[] } } and the set
// of all distinct values per kind (for pre-fill suggestions).
export function indexTags(rows) {
  const byAsset = new Map();
  const suggestions = { person: new Set(), family: new Set(), place: new Set(), label: new Set() };
  for (const t of rows || []) {
    if (!byAsset.has(t.asset_id)) byAsset.set(t.asset_id, { person: [], family: [], place: [], label: [] });
    const rec = byAsset.get(t.asset_id);
    (rec[t.kind] || (rec[t.kind] = [])).push(t.value);
    suggestions[t.kind]?.add(t.value);
  }
  const sugg = {};
  for (const k of KINDS) sugg[k.id] = [...new Set([...(suggestions[k.id] || []), ...k.seeds])].sort();
  return { byAsset, suggestions: sugg };
}
