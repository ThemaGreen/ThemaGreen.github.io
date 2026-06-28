// Shared "hearts" for the family gallery.
//
// Two backends:
//   • Supabase (recommended for SHARED likes across everyone) — set
//     VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Needs a `likes` table:
//       create table likes (
//         id bigint generated always as identity primary key,
//         asset_id text not null, viewer text not null,
//         created_at timestamptz default now(),
//         unique (asset_id, viewer)
//       );
//       alter table likes enable row level security;
//       create policy "read"  on likes for select using (true);
//       create policy "add"   on likes for insert with check (true);
//       create policy "remove" on likes for delete using (true);
//   • localStorage (fallback) — per-device only, so likes aren't shared. Good
//     enough to demo the UX; switch to Supabase for the real family site.

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useSupabase = !!(SB_URL && SB_KEY);

const NAME_KEY = 'galaxy.viewer';
const LOCAL_KEY = 'galaxy.likes';

export function getViewer() { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } }
export function setViewer(n) { try { localStorage.setItem(NAME_KEY, n); } catch { /* ignore */ } }

function localAll() { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); } catch { return {}; } }
function saveLocal(o) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(o)); } catch { /* ignore */ } }

function sbHeaders() {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };
}

// Returns { [assetId]: { count, mine, who: [] } }
export async function getLikes(ids) {
  if (!ids?.length) return {};
  const me = getViewer();
  if (useSupabase) {
    try {
      const list = ids.map((i) => `"${i}"`).join(',');
      const res = await fetch(`${SB_URL}/rest/v1/likes?select=asset_id,viewer&asset_id=in.(${encodeURIComponent(list)})`, { headers: sbHeaders() });
      if (res.ok) {
        const rows = await res.json();
        const out = {};
        ids.forEach((id) => { out[id] = { count: 0, mine: false, who: [] }; });
        rows.forEach((r) => {
          const o = out[r.asset_id] || (out[r.asset_id] = { count: 0, mine: false, who: [] });
          o.count += 1; o.who.push(r.viewer); if (r.viewer === me) o.mine = true;
        });
        return out;
      }
    } catch { /* fall through to local */ }
  }
  const all = localAll();
  const out = {};
  ids.forEach((id) => { const w = all[id] || []; out[id] = { count: w.length, mine: w.includes(me), who: w }; });
  return out;
}

export async function toggleLike(id) {
  const me = getViewer() || 'Guest';
  if (useSupabase) {
    try {
      // does my like exist?
      const q = `${SB_URL}/rest/v1/likes?asset_id=eq.${encodeURIComponent(id)}&viewer=eq.${encodeURIComponent(me)}&select=id`;
      const cur = await fetch(q, { headers: sbHeaders() });
      const rows = cur.ok ? await cur.json() : [];
      if (rows.length) {
        await fetch(q, { method: 'DELETE', headers: sbHeaders() });
      } else {
        await fetch(`${SB_URL}/rest/v1/likes`, { method: 'POST', headers: sbHeaders(), body: JSON.stringify({ asset_id: id, viewer: me }) });
      }
      const fresh = await getLikes([id]);
      return fresh[id];
    } catch { /* fall through */ }
  }
  const all = localAll();
  const set = new Set(all[id] || []);
  set.has(me) ? set.delete(me) : set.add(me);
  all[id] = [...set]; saveLocal(all);
  return { count: all[id].length, mine: set.has(me), who: all[id] };
}

export const likesShared = useSupabase;
