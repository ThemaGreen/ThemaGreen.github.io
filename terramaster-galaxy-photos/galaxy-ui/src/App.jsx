import { useEffect, useMemo, useRef, useState } from 'react';
import GalaxyGraph from './components/GalaxyGraph.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import Mascot from './components/Mascot.jsx';
import Login from './components/Login.jsx';
import { buildGraph, buildPeopleGraph, buildFriendsGraph } from './clustering/layout.js';
import { getApi } from './api/source.js';
import { useSettings, resolveTheme } from './store/settings.js';
import { getLikes, toggleLike, getViewer, setViewer } from './store/likes.js';

// "Cluster by" — the spatial organizing principle for the galaxies.
const MODES = [
  { id: 'time',    label: 'Time' },
  { id: 'people',  label: 'People' },
  { id: 'places',  label: 'Places' },
  { id: 'things',  label: 'Things' },
  { id: 'friends', label: 'Friends' },
];
const GRANS = [
  { id: 'year',  label: 'Year' },
  { id: 'month', label: 'Month' },
  { id: 'day',   label: 'Day' },
];

const localMatch = (a, q) => (
  (a.originalFileName || '').toLowerCase().includes(q) ||
  (a.exifInfo?.city || '').toLowerCase().includes(q) ||
  (a.exifInfo?.country || '').toLowerCase().includes(q) ||
  (a.category || '').toLowerCase().includes(q) ||
  (a.labels || []).some((l) => l.toLowerCase().includes(q)) ||
  (a.tags || []).some((t) => (t.name || t.value || '').toLowerCase().includes(q)) ||
  (a.people || []).some((p) => (p.name || '').toLowerCase().includes(q))
);

export default function App() {
  const [settings, update, reset] = useSettings();
  const api = useMemo(() => getApi(settings.source), [settings.source]);
  const theme = resolveTheme(settings.theme);

  const [mode, setMode] = useState('time');
  const [granularity, setGranularity] = useState('month');
  const [favOnly, setFavOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [override, setOverride] = useState(null); // search results across the whole library

  const [raw, setRaw] = useState(null);
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [status, setStatus] = useState('Loading your universe…');
  const [busy, setBusy] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [friendsTick, setFriendsTick] = useState(0);
  const [account, setAccount] = useState(undefined); // undefined=checking, null=needs login, obj=signed in
  const galaxyRef = useRef();

  // Validate the session whenever we're in Live mode.
  useEffect(() => {
    let cancelled = false;
    if (settings.source !== 'live') { setAccount(undefined); return undefined; }
    (async () => {
      try { const u = await api.me(); if (!cancelled) setAccount(u); }
      catch { if (!cancelled) setAccount(null); }
    })();
    return () => { cancelled = true; };
  }, [settings.source, api]);

  const needsLogin = settings.source === 'live' && account === null;
  const authReady = settings.source !== 'live' || !!account;

  const addPerson = async () => {
    if (!api.isDemo) {
      alert('To add family/friends for real:\n\n1) Create their account in Immich (Administration → Users), or have them register.\n2) They sign in to the galaxy site with their own account (via your Tailscale/WireGuard address).\n3) You each "Partner share" or share an album — then you appear in each other\'s Friends view.\n\n(Coming next: an in-app friend-request flow.)');
      return;
    }
    const name = (prompt('Add a person to your universe — their name:') || '').trim();
    if (!name) return;
    await api.addFriend?.(name);
    setFriendsTick((t) => t + 1);
  };

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  // Track + toggle true browser fullscreen.
  useEffect(() => {
    const onChange = () => setIsFull(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);
  const toggleFullscreen = () => {
    const el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
    }
  };

  // Fetch the base library when source or mode changes (once authed in Live).
  useEffect(() => {
    if (!authReady) return undefined;
    let cancelled = false;
    setBusy(true);
    setStatus('Loading your universe…');
    (async () => {
      try {
        if (mode === 'friends') {
          const [friends, mine] = await Promise.all([api.fetchFriends(), api.fetchAssets({ max: 60 })]);
          const you = { id: 'you', me: true, name: 'You', palette: settings.palette, assets: mine.slice(0, 30) };
          if (!cancelled) setRaw({ kind: 'friends', friends: [you, ...friends] });
        } else if (mode === 'people') {
          const people = (await api.fetchPeople()).slice(0, 40);
          const byPerson = new Map();
          for (const p of people) {
            const res = await api.searchAssets({ personIds: [p.id], size: 120 });
            const assets = res.items ?? [];
            if (assets.length) byPerson.set(p.id, { person: p, assets });
          }
          if (!cancelled) setRaw({ kind: 'people', byPerson });
        } else {
          const assets = await api.fetchAssets({ max: 600 });
          if (!cancelled) setRaw({ kind: 'assets', assets });
        }
      } catch (e) {
        if (!cancelled) { setRaw(null); setStatus(`Couldn’t reach the library — ${e.message}`); setBusy(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [api, mode, friendsTick, authReady]);

  // Run a real, whole-library search (smart + people + tags) on submit.
  const runSearch = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) { setOverride(null); return; }
    setBusy(true);
    setStatus('Searching the universe…');
    try {
      const items = await api.search(q);
      setOverride(items);
    } catch (err) {
      setOverride([]);
      setStatus(`Search failed — ${err.message}`);
      setBusy(false);
    }
  };

  const clearSearch = () => { setQuery(''); setOverride(null); };

  // Rebuild the graph from the active set (search override or base library).
  useEffect(() => {
    if (!raw && !override) return;
    const q = query.trim().toLowerCase();
    const favPass = (a) => !favOnly || a.isFavorite;
    const textPass = (a) => override ? true : (!q || localMatch(a, q));
    const thumbOf = (a) => a.thumb || api.thumbUrl(a);

    let g, count;
    if (mode === 'friends' && raw?.kind === 'friends') {
      const friends = raw.friends
        .map((f) => ({ ...f, palette: f.me ? settings.palette : f.palette, assets: f.assets.filter((a) => favPass(a) && textPass(a)) }))
        .filter((f) => f.assets.length);
      g = buildFriendsGraph(friends, thumbOf);
      count = friends.reduce((n, f) => n + f.assets.length, 0);
    } else if (mode === 'people') {
      const byPerson = new Map();
      if (override) {
        for (const a of override.filter(favPass)) {
          for (const p of (a.people || [])) {
            if (!byPerson.has(p.id)) byPerson.set(p.id, { person: p, assets: [] });
            byPerson.get(p.id).assets.push(a);
          }
        }
      } else if (raw?.kind === 'people') {
        for (const [id, v] of raw.byPerson) {
          const assets = v.assets.filter((a) => favPass(a) && textPass(a));
          if (assets.length) byPerson.set(id, { person: v.person, assets });
        }
      }
      g = buildPeopleGraph(byPerson, thumbOf, settings.palette);
      count = [...byPerson.values()].reduce((n, v) => n + v.assets.length, 0);
    } else {
      const src = override ?? (raw?.kind === 'assets' ? raw.assets : []);
      const assets = src.filter((a) => favPass(a) && textPass(a));
      g = buildGraph(assets, { mode, granularity, thumbOf, palette: settings.palette });
      count = assets.length;
    }
    setGraph(g);
    setBusy(false);
    const galaxies = g.nodes.filter((n) => n.type === 'hub').length;
    const noun = override ? 'results' : 'photos';
    setStatus(count ? `${count.toLocaleString()} ${noun} · ${galaxies} galaxies` : (override ? 'No matches — try another search' : 'No photos match — try clearing filters'));
  }, [raw, override, query, favOnly, mode, granularity, api, settings.palette]);

  const stats = useMemo(() => ({
    photos: graph.nodes.filter((n) => n.type === 'photo').length,
    galaxies: graph.nodes.filter((n) => n.type === 'hub').length,
  }), [graph]);

  const liveLink = settings.source === 'live' && selected ? api.immichAssetLink(selected) : null;

  if (needsLogin) {
    return <Login api={api} onSuccess={setAccount} onDemo={() => update({ source: 'demo' })} />;
  }

  return (
    <>
      <div className="topbar">
        <div className="brand"><span className="spark">✦</span> Galaxy <em>Photos</em></div>

        <form className="cmd" onSubmit={runSearch}>
          <button type="submit" className="cmd-go" aria-label="Search"><SearchIcon /></button>
          <input
            value={query}
            onChange={(e) => { const v = e.target.value; setQuery(v); if (!v.trim()) setOverride(null); }}
            placeholder="Search a name, place, or label like “wedding”… (Enter)"
            spellCheck={false}
          />
          {query && <button type="button" className="clear" onClick={clearSearch} aria-label="Clear">×</button>}
        </form>

        <div className="controls-row">
          <span className="row-label">Cluster by</span>
          <div className="seg">
            {MODES.map((m) => (
              <button key={m.id} className={`seg-btn ${mode === m.id ? 'active' : ''}`}
                onClick={() => { setSelected(null); setMode(m.id); }}>{m.label}</button>
            ))}
          </div>
          {mode === 'time' && (
            <div className="seg subtle">
              {GRANS.map((g) => (
                <button key={g.id} className={`seg-btn ${granularity === g.id ? 'active' : ''}`}
                  onClick={() => setGranularity(g.id)}>{g.label}</button>
              ))}
            </div>
          )}
          <button className={`chip fav ${favOnly ? 'active' : ''}`} onClick={() => setFavOnly((v) => !v)}>★ Favorites</button>
          {mode === 'friends' && <button className="chip add" onClick={addPerson}>＋ Add person</button>}
        </div>
      </div>

      <div className="topright">
        <button className="iconbtn" title="About & privacy" onClick={() => setShowAbout(true)}><InfoIcon /></button>
        <button className="iconbtn" title="Settings" onClick={() => setShowSettings(true)}><GearIcon /></button>
      </div>

      {showAbout && (
        <div className="modal-backdrop" onClick={() => setShowAbout(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h3>About &amp; privacy</h3>
              <button className="close" onClick={() => setShowAbout(false)} aria-label="Close">×</button>
            </header>
            <div className="modal-body">
              <p>A private family gallery of our shared photos &amp; videos.</p>
              <p>If you’d prefer a photo or video of you not be shown here, or have
                any concern about your media being shown publicly, please reach out
                and I’ll remove it:</p>
              <p className="contact">
                <a href="mailto:themagreen@gmail.com">themagreen@gmail.com</a><br />
                <a href="https://themagreen.com" target="_blank" rel="noreferrer">submit via the form on themagreen.com ↗</a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="statusbar">
        <span className={`pill ${busy ? 'busy' : ''}`}><span className="dot" />{status}</span>
        <span className="hint">drag to orbit · scroll to zoom · click a photo for details</span>
      </div>

      <div className="controls">
        <button className={`iconbtn ${settings.autoOrbit ? 'on' : ''}`} title="Auto-orbit"
          onClick={() => update({ autoOrbit: !settings.autoOrbit })}><OrbitIcon /></button>
        <button className="iconbtn" title="Fit to view" onClick={() => galaxyRef.current?.fit()}><FitIcon /></button>
        <button className={`iconbtn ${isFull ? 'on' : ''}`} title="Fullscreen" onClick={toggleFullscreen}>
          {isFull ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        </button>
      </div>

      {busy && (<div className="overlay"><div className="card"><div className="spinner" />{status}</div></div>)}

      <div className={`detail ${selected ? 'open' : ''}`}>
        <header>
          <h3>{selected?.originalFileName || 'Photo'}</h3>
          <button className="close" onClick={() => setSelected(null)} aria-label="Close">×</button>
        </header>
        {selected && (
          <DetailBody selected={selected} api={api} liveLink={liveLink} onSearchTag={(t) => { setQuery(t); setTimeout(() => runSearch(), 0); }} />
        )}
      </div>

      <SettingsPanel open={showSettings} settings={settings} update={update} reset={reset} stats={stats}
        account={settings.source === 'live' ? account : null}
        onLogout={async () => { await api.logout(); setAccount(null); }}
        onClose={() => setShowSettings(false)} />

      {settings.mascot && <Mascot />}

      <GalaxyGraph ref={galaxyRef} graph={graph} query={query} onSelect={setSelected}
        theme={theme} bloom={settings.bloom} autoOrbit={settings.autoOrbit} density={settings.density} />
    </>
  );
}

const VIS = [
  { id: 'private', label: 'Private' },
  { id: 'friends', label: 'Friends' },
  { id: 'sensitive', label: 'Sensitive' },
];

function DetailBody({ selected, api, liveLink, onSearchTag }) {
  const [label, setLabel] = useState('');
  const [labels, setLabels] = useState(() => (selected.labels || (selected.tags || []).map((t) => t.name || t.value) || []));
  const [saving, setSaving] = useState(false);
  const [vis, setVis] = useState(selected.visibility || 'private');
  const [reveal, setReveal] = useState(false);
  const [likes, setLikes] = useState({ count: 0, mine: false });
  useEffect(() => {
    setLabels(selected.labels || (selected.tags || []).map((t) => t.name || t.value) || []);
    setLabel(''); setVis(selected.visibility || 'private'); setReveal(false);
    let off = false;
    getLikes([selected.id]).then((m) => { if (!off) setLikes(m[selected.id] || { count: 0, mine: false }); });
    return () => { off = true; };
  }, [selected]);

  const heart = async () => {
    if (!getViewer()) {
      const n = (prompt('Your name (so family knows who liked it):') || '').trim();
      if (!n) return;
      setViewer(n);
    }
    const res = await toggleLike(selected.id);
    setLikes(res);
  };

  const addLabel = async (e) => {
    e.preventDefault();
    const name = label.trim();
    if (!name) return;
    setSaving(true);
    try { await api.addLabel(selected.id, name); setLabels((ls) => [...new Set([...ls, name])]); setLabel(''); }
    catch (err) { alert(`Couldn’t add label: ${err.message}`); }
    finally { setSaving(false); }
  };

  const changeVis = async (v) => {
    setVis(v);
    try { await api.setVisibility?.(selected.id, v); selected.visibility = v; }
    catch (err) { alert(`Couldn’t update visibility: ${err.message}`); }
  };

  const blurred = vis === 'sensitive' && !reveal;
  const video = selected.type === 'VIDEO';
  const vUrl = video ? api.videoUrl?.(selected) : '';

  return (
    <div className="body">
      <div className={`photo-wrap ${blurred ? 'sensitive' : ''}`}>
        {video && selected.embed
          ? <iframe className="embed" src={selected.embed} title={selected.originalFileName} allow="autoplay; encrypted-media" allowFullScreen />
          : video && vUrl
            ? <video src={vUrl} poster={api.previewUrl(selected)} controls playsInline preload="metadata" />
            : <img src={api.previewUrl(selected)} alt={selected.originalFileName} loading="lazy" />}
        {video && !vUrl && !selected.embed && <span className="play-badge" title="Video">▶ {selected.duration || 'Video'}</span>}
        {blurred && <button className="reveal" onClick={() => setReveal(true)}>Sensitive · tap to view</button>}
        <button className={`heart ${likes.mine ? 'liked' : ''}`} onClick={heart} title="Like" aria-label="Like">
          <HeartIcon filled={likes.mine} />{likes.count > 0 && <span>{likes.count}</span>}
        </button>
      </div>
      <dl className="meta">
        <dt>Taken</dt><dd>{fmtDate(selected)}</dd>
        {selected.exifInfo?.city && <><dt>Place</dt><dd>{[selected.exifInfo.city, selected.exifInfo.country].filter(Boolean).join(', ')}</dd></>}
        {selected.category && <><dt>Category</dt><dd>{selected.category}</dd></>}
        {selected.people?.length > 0 && <><dt>People</dt><dd>{selected.people.map((p) => p.name).join(', ')}</dd></>}
        {selected.exifInfo?.make && <><dt>Camera</dt><dd>{[selected.exifInfo.make, selected.exifInfo.model].filter(Boolean).join(' ')}</dd></>}
        {selected.isFavorite && <><dt>Favorite</dt><dd>★ Yes</dd></>}
      </dl>

      <div className="labels">
        <div className="labels-title">Labels</div>
        <div className="label-chips">
          {labels.length ? labels.map((l) => (
            <button key={l} className="label-chip" onClick={() => onSearchTag(l)} title={`Search “${l}”`}>{l}</button>
          )) : <span className="muted">No labels yet</span>}
        </div>
        <form className="label-add" onSubmit={addLabel}>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Add a label (e.g. wedding)" />
          <button type="submit" disabled={saving}>{saving ? '…' : 'Add'}</button>
        </form>
      </div>

      <div className="labels">
        <div className="labels-title">Visibility</div>
        <div className="seg small vis">
          {VIS.map((o) => (
            <button key={o.id} className={`seg-btn ${vis === o.id ? 'active' : ''}`} onClick={() => changeVis(o.id)}>{o.label}</button>
          ))}
        </div>
        <p className="note">
          {vis === 'private' && 'Only you can see this — never shared.'}
          {vis === 'friends' && 'Visible to friends you’ve shared with.'}
          {vis === 'sensitive' && 'Shared but blurred until tapped; hidden from your main timeline.'}
        </p>
      </div>

      {liveLink
        ? <a className="open-immich" href={liveLink} target="_blank" rel="noreferrer">Open in Immich ↗</a>
        : <div className="demo-tag">Demo photo · generated locally</div>}
    </div>
  );
}

function fmtDate(a) {
  const d = new Date(a.exifInfo?.dateTimeOriginal || a.localDateTime || a.fileCreatedAt);
  return Number.isNaN(d.getTime()) ? 'Unknown' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const OrbitIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(30 12 12)" />
  </svg>
);
const FitIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" />
  </svg>
);
const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
  </svg>
);
const HeartIcon = ({ filled }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);
const FullscreenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);
const ExitFullscreenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
  </svg>
);
const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
