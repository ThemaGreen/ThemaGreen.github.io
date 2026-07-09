import { useEffect, useMemo, useRef, useState } from 'react';
import GalaxyGraph from './components/GalaxyGraph.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import Mascot from './components/Mascot.jsx';
import Login from './components/Login.jsx';
import { buildGraph, buildPeopleGraph, buildFriendsGraph } from './clustering/layout.js';
import { getApi } from './api/source.js';
import { useSettings, resolveTheme } from './store/settings.js';
import { getLikes, getAllLikes, toggleLike, getViewer, setViewer } from './store/likes.js';
import { setSfxEnabled, playTap, playMove } from './audio/sfx.js';
import { fetchAllTags, addTag, removeTag, indexTags, KINDS } from './store/tags.js';
import { listCollections, createCollection, deleteCollection, toggleInCollection, collectionsOf } from './store/collections.js';
import { homeSource, WEDDING_SOURCE } from './store/access.js';
import { useResolvedSrc } from './api/media.js';

// Merge shared user-tags into an asset so the groupers/filters can use them.
function enrich(a, byAsset) {
  const t = byAsset.get(a.assetId || a.id) || {};
  const tagPeople = (t.person || []).map((n) => ({ id: n, name: n }));
  const people = [...(a.people || []), ...tagPeople.filter((tp) => !(a.people || []).some((p) => (p.name || p) === tp.name))];
  return {
    ...a,
    people,
    family: t.family || [],
    labels: [...new Set([...(a.labels || []), ...(t.label || [])])],
    exifInfo: { ...a.exifInfo, city: (t.place && t.place[0]) || a.exifInfo?.city },
  };
}

// "Cluster by" — the spatial organizing principle for the galaxies.
const ALL_MODES = [
  { id: 'time',    label: 'Time' },
  { id: 'people',  label: 'People' },
  { id: 'family',  label: 'Family' },
  { id: 'places',  label: 'Location' },
  { id: 'things',  label: 'Labels' },
  { id: 'camera',  label: 'Device' },
  { id: 'type',    label: 'Type' },
  { id: 'friends', label: 'Friends' },
];

// Wedding branding applies ONLY while the wedding library is active. Demo and
// My Immich get their own neutral/personal branding (see brandFor below).
const WEDDING_TITLE = import.meta.env.VITE_GALLERY_TITLE || 'Amira & Jacob’s Wedding';
const WEDDING_SUBTITLE = import.meta.env.VITE_GALLERY_SUBTITLE || 'June 18, 2026 · Canada';

function brandFor(source, account) {
  if (source === WEDDING_SOURCE) {
    return { title: WEDDING_TITLE, sub: WEDDING_SUBTITLE, wedding: true };
  }
  if (source === 'live') {
    const first = (account?.name || '').trim().split(/\s+/)[0];
    return { title: first ? `${first}’s Galaxy` : 'My Immich', sub: 'Your personal photos & videos', wedding: false };
  }
  return { title: null, sub: 'Demo universe — a sample library to explore', wedding: false }; // null → “Galaxy Photos” wordmark
}
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
  const [tagRows, setTagRows] = useState([]);
  const [likesMap, setLikesMap] = useState({});
  const [tour, setTour] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [collections, setCollections] = useState(() => listCollections());
  const [activeCollection, setActiveCollection] = useState(null); // album id to filter to
  const [showAlbums, setShowAlbums] = useState(false);
  const galaxyRef = useRef();
  const tourRef = useRef({ order: [], i: -1 });

  // Shared tags (people/family/location/labels) — loaded once, refreshed on edit.
  const refreshTags = async () => { try { setTagRows(await fetchAllTags()); } catch { /* ignore */ } };
  useEffect(() => { refreshTags(); }, []);

  // Hearts → Favorites: load everyone's likes; refresh helper for after a heart.
  const refreshLikes = async () => { try { setLikesMap(await getAllLikes()); } catch { /* ignore */ } };
  useEffect(() => { refreshLikes(); }, []);

  // Audio on/off follows the master "Ambient sound" setting (SFX use your files).
  useEffect(() => { setSfxEnabled(settings.sound); }, [settings.sound]);

  // Select a photo (with tap sound) — used by clicks and the tour.
  const pickPhoto = (asset, moved) => {
    if (asset) (moved ? playMove : playTap)();
    setSelected(asset);
  };

  // Albums: refresh from the store after any change.
  const refreshCollections = () => setCollections(listCollections());
  const activeAlbum = collections.find((c) => c.id === activeCollection) || null;

  // ---- Mobile photo sheet: drag down to dismiss, opacity follows the drag ----
  const [sheetT, setSheetT] = useState(0);      // px the sheet is dragged down
  const sheetDrag = useRef(null);
  useEffect(() => { setSheetT(0); }, [selected]); // reset when a new photo opens
  const isTouchLayout = () => window.matchMedia?.('(max-width: 820px)').matches;
  const startSheetDrag = (e) => {
    if (!isTouchLayout()) return;
    sheetDrag.current = { y: e.clientY, moved: 0 };
    const onMove = (ev) => {
      const d = sheetDrag.current; if (!d) return;
      const dy = ev.clientY - d.y; d.moved = dy;
      setSheetT(Math.max(0, dy));          // only downward
    };
    const onUp = () => {
      const d = sheetDrag.current; sheetDrag.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (d && d.moved > window.innerHeight * 0.16) setSelected(null); // dismiss
      setSheetT(0);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  const sheetStyle = sheetT
    ? { transform: `translateY(${sheetT}px)`, opacity: Math.max(0.25, 1 - sheetT / (window.innerHeight * 0.55)), transition: 'none' }
    : undefined;

  // Close panels with Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setShowSettings(false); setShowAbout(false); setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-tour: hop photo→photo. Default order is cluster-by-cluster (the graph
  // node order); Shuffle jumps around randomly. Each hop flies the camera,
  // opens the photo, and plays your "move" sound.
  const photoNodes = useMemo(() => graph.nodes.filter((n) => n.type === 'photo'), [graph]);
  const step = (dir) => {
    let order = tourRef.current.order;
    if (!order.length) { order = shuffle ? [...photoNodes].sort(() => Math.random() - 0.5) : photoNodes; tourRef.current.order = order; }
    if (!order.length) return;
    const t = tourRef.current;
    t.i = ((t.i + dir) % order.length + order.length) % order.length;
    const node = order[t.i];
    // Auto/tour mode keeps YOUR zoom level — pan to re-centre, don't re-zoom.
    galaxyRef.current?.panTo(node);
    pickPhoto(node.asset, true);
  };
  useEffect(() => {
    if (!tour) return undefined;
    tourRef.current = { order: shuffle ? [...photoNodes].sort(() => Math.random() - 0.5) : photoNodes, i: -1 };
    if (!tourRef.current.order.length) { setTour(false); return undefined; }
    step(1);
    const id = setInterval(() => step(1), 4500);
    return () => clearInterval(id);
  }, [tour, shuffle, photoNodes]);
  const tagIndex = useMemo(() => indexTags(tagRows), [tagRows]);

  // The working asset set, enriched with shared tags.
  const assets = useMemo(
    () => (raw?.kind === 'assets' ? raw.assets.map((a) => enrich(a, tagIndex.byAsset)) : []),
    [raw, tagIndex],
  );

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

  // Switching library: drop the previous source's assets IMMEDIATELY so the
  // graph never mixes one source's assets with another's URL builder (that
  // caused a flood of bogus /immich/assets/demo-… requests mid-switch).
  useEffect(() => {
    setRaw(null); setOverride(null); setSelected(null);
    setGraph({ nodes: [], links: [] });
  }, [settings.source]);

  // Fetch the base library when source or mode changes (once authed in Live).
  useEffect(() => {
    if (!authReady) return undefined;
    let cancelled = false;
    setBusy(true);
    setStatus('Loading your universe…');
    const forSource = settings.source; // tag the payload with its origin
    (async () => {
      try {
        if (mode === 'friends') {
          const [friends, mine] = await Promise.all([api.fetchFriends(), api.fetchAssets({ max: 60 })]);
          const you = { id: 'you', me: true, name: 'You', palette: settings.palette, assets: mine.slice(0, 30) };
          if (!cancelled) setRaw({ kind: 'friends', friends: [you, ...friends], source: forSource });
        } else {
          const list = await api.fetchAssets({ max: 5000 });
          if (!cancelled) setRaw({ kind: 'assets', assets: list, source: forSource });
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
    // Never build with another source's assets (mid-switch, effects can still
    // see the previous library — its URLs would be built with the wrong API).
    if (raw && raw.source && raw.source !== settings.source) return;
    const q = query.trim().toLowerCase();
    const favPass = (a) => !favOnly || (likesMap[a.assetId || a.id]?.count > 0);
    const textPass = (a) => override ? true : (!q || localMatch(a, q));
    const albumIds = activeAlbum ? new Set(activeAlbum.assetIds) : null;
    const albumPass = (a) => !albumIds || albumIds.has(a.assetId || a.id);
    const thumbOf = (a) => a.thumb || api.thumbUrl(a);

    let g, count;
    if (mode === 'friends' && raw?.kind === 'friends') {
      const friends = raw.friends
        .map((f) => ({ ...f, palette: f.me ? settings.palette : f.palette, assets: f.assets.filter((a) => favPass(a) && textPass(a) && albumPass(a)) }))
        .filter((f) => f.assets.length);
      g = buildFriendsGraph(friends, thumbOf);
      count = friends.reduce((n, f) => n + f.assets.length, 0);
    } else {
      const src = override ? override.map((a) => enrich(a, tagIndex.byAsset)) : assets;
      const filtered = src.filter((a) => favPass(a) && textPass(a) && albumPass(a));
      g = buildGraph(filtered, { mode, granularity, thumbOf, palette: settings.palette });
      count = filtered.length;
    }
    setGraph(g);
    setBusy(false);
    const galaxies = g.nodes.filter((n) => n.type === 'hub').length;
    const noun = override ? 'results' : 'photos';
    setStatus(count ? `${count.toLocaleString()} ${noun} · ${galaxies} galaxies` : (override ? 'No matches — try another search' : 'No photos match — try clearing filters'));
  }, [raw, assets, tagIndex, likesMap, override, query, favOnly, mode, granularity, api, settings.palette, settings.source, activeAlbum]);

  const stats = useMemo(() => ({
    photos: graph.nodes.filter((n) => n.type === 'photo').length,
    galaxies: graph.nodes.filter((n) => n.type === 'hub').length,
  }), [graph]);

  // Only offer filters the loaded metadata can actually sort by.
  const visibleModes = useMemo(() => {
    const a = assets;
    const social = settings.source === 'demo' || settings.source === 'live';
    const distinctCam = new Set(a.filter((x) => x.exifInfo?.make).map((x) => `${x.exifInfo.make} ${x.exifInfo.model}`));
    const avail = {
      time: true,
      type: a.some((x) => x.type === 'VIDEO') && a.some((x) => x.type === 'IMAGE'),
      camera: distinctCam.size > 1,
      people: social || a.some((x) => x.people?.length),
      family: a.some((x) => x.family?.length),
      places: a.some((x) => x.exifInfo?.city),
      things: a.some((x) => x.labels?.length),
      friends: social,
    };
    return ALL_MODES.filter((m) => avail[m.id]);
  }, [assets, settings.source]);

  // If the current mode isn't available for this data, fall back to Time.
  useEffect(() => {
    if (visibleModes.length && !visibleModes.some((m) => m.id === mode)) setMode('time');
  }, [visibleModes, mode]);

  const liveLink = settings.source === 'live' && selected ? api.immichAssetLink(selected) : null;

  // Branding follows the ACTIVE library: wedding title only on the wedding,
  // "Galaxy Photos" for the demo, "<Name>'s Galaxy" once signed into Immich.
  const brand = brandFor(settings.source, account);
  useEffect(() => { document.title = brand.title || 'Galaxy Photos'; }, [brand.title]);

  if (needsLogin) {
    return <Login api={api} onSuccess={setAccount} onDemo={() => update({ source: homeSource() })} />;
  }

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <span className="spark">✦</span>{' '}
          {brand.title ? <strong className="brand-title">{brand.title}</strong> : <>Galaxy <em>Photos</em></>}
        </div>
        {brand.sub && <div className="brand-sub">{brand.sub}</div>}

        <form className="cmd" onSubmit={runSearch}>
          <button type="submit" className="cmd-go" aria-label="Search"><SearchIcon /></button>
          <input
            value={query}
            onChange={(e) => { const v = e.target.value; setQuery(v); if (!v.trim()) setOverride(null); }}
            placeholder={brand.wedding
              ? 'Search a name, place, or label like “wedding”… (Enter)'
              : 'Search a name, place, or label… (Enter)'}
            spellCheck={false}
          />
          {query && <button type="button" className="clear" onClick={clearSearch} aria-label="Clear">×</button>}
        </form>

        <div className="controls-row">
          <span className="row-label">Cluster by</span>
          <div className="seg modes">
            {visibleModes.map((m) => (
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

          <div className="album-wrap">
            <button className={`chip album ${activeAlbum ? 'active' : ''}`} onClick={() => setShowAlbums((v) => !v)}>
              ❤ {activeAlbum ? activeAlbum.name : 'Albums'} ▾
            </button>
            {showAlbums && (
              <div className="album-menu" role="menu">
                <button className={`album-item ${!activeAlbum ? 'on' : ''}`} onClick={() => { setActiveCollection(null); setShowAlbums(false); }}>
                  All photos
                </button>
                {collections.map((c) => (
                  <div key={c.id} className={`album-item row ${activeCollection === c.id ? 'on' : ''}`}>
                    <button className="album-pick" onClick={() => { setActiveCollection(c.id); setShowAlbums(false); }}>
                      {c.name} <span className="album-count">{c.assetIds.length}</span>
                    </button>
                    <button className="album-del" title="Delete album"
                      onClick={() => { deleteCollection(c.id); if (activeCollection === c.id) setActiveCollection(null); refreshCollections(); }}>×</button>
                  </div>
                ))}
                <button className="album-new" onClick={() => {
                  const name = (prompt('Name this album:') || '').trim();
                  if (!name) return;
                  const col = createCollection(name); refreshCollections(); setActiveCollection(col.id); setShowAlbums(false);
                }}>＋ New album</button>
              </div>
            )}
          </div>

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
              <h3>About this gallery</h3>
              <button className="close" onClick={() => setShowAbout(false)} aria-label="Close">×</button>
            </header>
            <div className="modal-body">
              {brand.wedding ? (
                <>
                  <p className="lead">Congratulations, Amira &amp; Jacob 💛</p>
                  <p>I built this little universe so the day wouldn’t live buried in a
                    camera roll. Each glowing galaxy is a cluster of our photos and
                    videos — drift through them, zoom into a memory, heart the ones you
                    love, and add names so we can all find each other again later.</p>
                  <p>What I hope you take from it: that an evening together can become a
                    place you can wander back into anytime. Tag yourself, build an album,
                    send it to someone who couldn’t make it. It was genuinely lovely
                    meeting everyone — thank you for letting me be part of it.</p>
                  <p className="sig">— with love, your friendly neighbourhood dev ✦</p>
                  <p>If you’d prefer a photo or video of you not be shown here, or have
                    any concern about your media, please reach out and I’ll remove it:</p>
                </>
              ) : (
                <>
                  <p className="lead">A little universe for photos ✦</p>
                  <p>Galaxy Photos turns a photo library into an explorable 3D galaxy —
                    every cluster is a group of moments. Drift, zoom into a memory,
                    heart what you love, and tag names so they’re easy to find again.</p>
                  <p>{settings.source === 'live'
                    ? 'You’re signed into your own Immich, so everything here is your personal library — private to your account.'
                    : 'You’re exploring the demo — a sample library. Sign into your own Immich (Settings → Source) to see your personal photos this way.'}</p>
                  <p>Questions or ideas? I’d love to hear them:</p>
                </>
              )}
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

      {/* Tour bar (bottom-center) */}
      <div className="tourbar">
        <button className="iconbtn" title="Previous" onClick={() => step(-1)}>‹</button>
        <button className={`iconbtn ${tour ? 'on' : ''}`} title={tour ? 'Pause tour' : 'Play tour'}
          onClick={() => setTour((t) => !t)}>{tour ? '❚❚' : '▶'}</button>
        <button className="iconbtn" title="Next" onClick={() => step(1)}>›</button>
        <button className={`iconbtn ${shuffle ? 'on' : ''}`} title="Shuffle (jump around)" onClick={() => setShuffle((s) => !s)}>⤨</button>
      </div>

      <div className="controls">
        <button className="iconbtn" title="Fit / reset view" onClick={() => galaxyRef.current?.fit()}><FitIcon /></button>
        <button className={`iconbtn ${settings.autoOrbit ? 'on' : ''}`} title="Auto-orbit"
          onClick={() => update({ autoOrbit: !settings.autoOrbit })}><OrbitIcon /></button>
        <button className={`iconbtn ${isFull ? 'on' : ''}`} title="Fullscreen" onClick={toggleFullscreen}>
          {isFull ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        </button>
      </div>

      {busy && (<div className="overlay"><div className="card"><div className="spinner" />{status}</div></div>)}

      <div className={`detail ${selected ? 'open' : ''}`} style={sheetStyle}>
        <header onPointerDown={startSheetDrag} style={{ touchAction: 'none' }}>
          <span className="sheet-grip" aria-hidden="true" />
          <h3>{selected?.originalFileName || 'Photo'}</h3>
          <button className="close" onClick={() => setSelected(null)} aria-label="Close">×</button>
        </header>
        {selected && (
          <DetailBody selected={selected} api={api} liveLink={liveLink}
            suggestions={tagIndex.suggestions}
            onTagsChanged={refreshTags}
            onLiked={refreshLikes}
            collections={collections}
            onCollectionsChanged={refreshCollections}
            onSheetDragStart={startSheetDrag}
            initialWho={(likesMap[selected.assetId || selected.id]?.who) || []}
            onSearchTag={(t) => { setQuery(t); setTimeout(() => runSearch(), 0); }} />
        )}
      </div>

      <SettingsPanel open={showSettings} settings={settings} update={update} reset={reset} stats={stats}
        account={settings.source === 'live' ? account : null}
        onLogout={async () => { await api.logout(); setAccount(null); }}
        onClose={() => setShowSettings(false)} />

      {settings.mascot && <Mascot />}

      <GalaxyGraph ref={galaxyRef} graph={graph} query={query} onSelect={(a) => pickPhoto(a, false)}
        theme={theme} bloom={settings.bloom} autoOrbit={settings.autoOrbit} density={settings.density}
        palette={settings.palette} sound={settings.sound} />
    </>
  );
}

function DetailBody({ selected, api, liveLink, suggestions, onTagsChanged, onSearchTag, onLiked, collections = [], onCollectionsChanged, onSheetDragStart, initialWho = [] }) {
  const assetId = selected.assetId || selected.id;
  const myAlbums = collectionsOf(assetId);
  const toggleAlbum = (id) => { toggleInCollection(id, assetId); onCollectionsChanged?.(); };
  const addNewAlbum = () => {
    const name = (prompt('Name a new album for this photo:') || '').trim();
    if (!name) return;
    createCollection(name, [assetId]); onCollectionsChanged?.();
  };
  const [likes, setLikes] = useState({ count: initialWho.length, mine: false, who: initialWho });
  useEffect(() => {
    let off = false;
    getLikes([selected.id]).then((m) => { if (!off) setLikes(m[selected.id] || { count: 0, mine: false, who: [] }); });
    return () => { off = true; };
  }, [selected]);

  const heart = async () => {
    if (!getViewer()) {
      const n = (prompt('Your name (so family knows who liked it):') || '').trim();
      if (!n) return;
      setViewer(n);
    }
    setLikes(await toggleLike(selected.id));
    onLiked?.();
  };

  const video = selected.type === 'VIDEO';
  const vUrl = video ? api.videoUrl?.(selected) : '';
  // Remote Immich media is fetched with the user's token (blob URL); everything
  // else passes straight through.
  const previewSrc = useResolvedSrc(api.previewUrl(selected));

  return (
    <div className="body">
      <div className="photo-wrap" onPointerDown={onSheetDragStart} style={{ touchAction: 'pan-x' }}>
        {video && selected.embed
          ? <iframe className="embed" src={selected.embed} title={selected.originalFileName} allow="autoplay; encrypted-media" allowFullScreen />
          : video && vUrl
            ? <video src={vUrl} poster={previewSrc || undefined} controls playsInline preload="metadata" />
            : <img src={previewSrc || undefined} alt={selected.originalFileName} loading="lazy" />}
        {video && !vUrl && !selected.embed && <span className="play-badge" title="Video">▶ {selected.duration || 'Video'}</span>}
        <button className={`heart ${likes.mine ? 'liked' : ''}`} onClick={heart} title="Like" aria-label="Like">
          <HeartIcon filled={likes.mine} />{likes.count > 0 && <span>{likes.count}</span>}
        </button>
      </div>
      <dl className="meta">
        <dt>Taken</dt><dd>{fmtDate(selected)}</dd>
        {selected.exifInfo?.make && <><dt>Device</dt><dd>{[selected.exifInfo.make, selected.exifInfo.model].filter(Boolean).join(' ')}</dd></>}
        {video && selected.duration && <><dt>Length</dt><dd>{selected.duration}</dd></>}
        {likes.who?.length > 0 && <><dt>♥ Favorited by</dt><dd>{likes.who.join(', ')}</dd></>}
      </dl>

      <div className="albums-box">
        <div className="labels-title">Albums</div>
        <div className="album-chips">
          {collections.map((c) => (
            <button key={c.id} className={`album-chip ${myAlbums.includes(c.id) ? 'on' : ''}`} onClick={() => toggleAlbum(c.id)}>
              {myAlbums.includes(c.id) ? '✓ ' : '＋ '}{c.name}
            </button>
          ))}
          <button className="album-chip new" onClick={addNewAlbum}>＋ New album</button>
        </div>
      </div>

      <TagEditor selected={selected} suggestions={suggestions} onChange={onTagsChanged} onSearchTag={onSearchTag} />

      {liveLink && <a className="open-immich" href={liveLink} target="_blank" rel="noreferrer">Open in Immich ↗</a>}
    </div>
  );
}

// Editable, shared tags for a photo: People / Family / Location / Labels.
// Pre-filled suggestions (from existing tags + seeds) plus free write-in.
function TagEditor({ selected, suggestions, onChange, onSearchTag }) {
  const seed = () => ({
    person: (selected.people || []).map((p) => p.name || p),
    family: selected.family || [],
    place: selected.exifInfo?.city ? [selected.exifInfo.city] : [],
    label: selected.labels || [],
  });
  const [vals, setVals] = useState(seed);
  const [inputs, setInputs] = useState({ person: '', family: '', place: '', label: '' });
  useEffect(() => { setVals(seed()); setInputs({ person: '', family: '', place: '', label: '' }); }, [selected]);

  const add = async (kind, value) => {
    value = (value || '').trim();
    if (!value || vals[kind].includes(value)) { setInputs((s) => ({ ...s, [kind]: '' })); return; }
    setVals((v) => ({ ...v, [kind]: [...v[kind], value] }));
    setInputs((s) => ({ ...s, [kind]: '' }));
    selected[kind === 'place' ? '_place' : kind] = undefined; // local hint; real source is tags
    try { await addTag(selected.assetId || selected.id, kind, value); onChange?.(); } catch { /* ignore */ }
  };
  const remove = async (kind, value) => {
    setVals((v) => ({ ...v, [kind]: v[kind].filter((x) => x !== value) }));
    try { await removeTag(selected.assetId || selected.id, kind, value); onChange?.(); } catch { /* ignore */ }
  };

  return (
    <div className="tagger">
      {KINDS.map((k) => (
        <div className="labels" key={k.id}>
          <div className="labels-title">{k.label}</div>
          <div className="label-chips">
            {vals[k.id].length ? vals[k.id].map((v) => (
              <span key={v} className="label-chip editable">
                <button className="chip-text" onClick={() => onSearchTag?.(v)} title={`Search “${v}”`}>{v}</button>
                <button className="chip-x" onClick={() => remove(k.id, v)} aria-label="Remove">×</button>
              </span>
            )) : <span className="muted">None yet</span>}
          </div>
          <form className="label-add" onSubmit={(e) => { e.preventDefault(); add(k.id, inputs[k.id]); }}>
            <input list={`sugg-${k.id}`} value={inputs[k.id]}
              onChange={(e) => setInputs((s) => ({ ...s, [k.id]: e.target.value }))}
              placeholder={`Add ${k.label.toLowerCase()}…`} />
            <datalist id={`sugg-${k.id}`}>
              {(suggestions?.[k.id] || []).map((s) => <option key={s} value={s} />)}
            </datalist>
            <button type="submit">Add</button>
          </form>
        </div>
      ))}
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
