import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { buildSkybox, buildWorld, buildClusterClouds, spikeTexture, glowTexture } from '../three/cosmos.js';
import { getPalette } from '../store/palettes.js';
import { resolveImage } from '../api/media.js';
import { start as startAmbient, stop as stopAmbient } from '../audio/ambient.js';

// Hyperreal JWST-style deep field: black space, a dense starfield, soft nebula
// clouds, diffraction-spike cluster cores and glowing photo-stars. Zoom in and
// the photo-stars resolve into your actual images. As you zoom in the nebula
// clouds fade and the image gains contrast, so close-ups read crisp.
const GalaxyGraph = forwardRef(function GalaxyGraph(
  { graph, query, onSelect, theme = 'dark', bloom = true, autoOrbit = true, density = 'comfortable', palette = 'nebula', sound = false },
  ref,
) {
  const fgRef = useRef();
  const bloomRef = useRef(null);
  const cosmosRef = useRef(null);
  const cloudsRef = useRef(null);
  const camRef = useRef(null);
  const rafRef = useRef(0);
  const bloomOn = useRef(bloom);
  const texLoader = useMemo(() => { const l = new THREE.TextureLoader(); l.setCrossOrigin('anonymous'); return l; }, []);
  const texCache = useRef(new Map());
  const loadQueue = useRef([]);
  const loadActive = useRef(0);
  const isMobile = useMemo(() => window.matchMedia?.('(max-width: 820px)').matches, []);
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Concurrency-limited thumbnail loader. Rather than firing hundreds of image
  // requests at once (which stalls the page and floods GPU memory), we load a
  // few at a time and fade each sprite in when its texture arrives.
  const MAX_LOADS = isMobile ? 4 : 8;
  const pumpLoads = () => {
    while (loadActive.current < MAX_LOADS && loadQueue.current.length) {
      const { url, sprite } = loadQueue.current.shift();
      if (!sprite.material) { continue; } // disposed
      loadActive.current += 1;
      // Remote Immich media needs an authenticated fetch first (returns a blob
      // object-URL); every other source resolves to the same URL untouched.
      resolveImage(url).then((finalUrl) => texLoader.load(
        finalUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
          texCache.current.set(url, tex);
          if (sprite.material) { sprite.material.map = tex; sprite.material.needsUpdate = true; }
          loadActive.current -= 1; pumpLoads();
        },
        undefined,
        () => { loadActive.current -= 1; pumpLoads(); },
      ));
    }
  };
  const enqueueTexture = (url, sprite) => {
    if (!url) return;
    const cached = texCache.current.get(url);
    if (cached) { sprite.material.map = cached; sprite.material.needsUpdate = true; return; }
    loadQueue.current.push({ url, sprite });
    pumpLoads();
  };

  // Keep the canvas exactly window-sized so fullscreen fills the screen with
  // no black bars. fullscreenchange fires before layout settles, so re-measure
  // on the next frame too.
  useEffect(() => {
    const measure = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    const onFs = () => { measure(); requestAnimationFrame(measure); setTimeout(measure, 80); };
    window.addEventListener('resize', measure);
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    measure();
    return () => {
      window.removeEventListener('resize', measure);
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
    };
  }, []);
  const q = (query || '').trim().toLowerCase();
  const big = density !== 'compact';

  useImperativeHandle(ref, () => ({
    fit: () => fgRef.current?.zoomToFit(700, 120),
    flyTo: (node) => flyTo(node),
    // Glide to a node WITHOUT changing how far you're zoomed in. Keeps the exact
    // current camera→target distance and viewing direction, just re-centres on
    // the new node. Used by auto/tour mode so it never re-zooms on you.
    panTo: (node) => panTo(node),
    setAutoRotate: (on) => { const c = fgRef.current?.controls(); if (c) c.autoRotate = on; },
    // Dolly the camera toward/away from the orbit target. factor<1 = zoom in,
    // factor>1 = zoom out. Gives reliable zoom on touch devices.
    zoomBy: (factor) => {
      const fg = fgRef.current; if (!fg) return;
      const cam = fg.camera(); const t = fg.controls()?.target || { x: 0, y: 0, z: 0 };
      fg.cameraPosition({
        x: t.x + (cam.position.x - t.x) * factor,
        y: t.y + (cam.position.y - t.y) * factor,
        z: t.z + (cam.position.z - t.z) * factor,
      }, t, 280);
    },
  }));

  // One-time: forces, controls, deep-space backdrop, bloom.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // Loosely-coupled galaxies: gentle global repulsion + springy hub→photo
    // links. Dragging a node mostly moves its own cluster, not the universe.
    fg.d3Force('charge')?.strength(-38);
    const link = fg.d3Force('link');
    if (link) link.distance((l) => (l.hub ? 18 : 46)).strength(0.78);

    const c = fg.controls();
    if (c) {
      c.enableDamping = true; c.dampingFactor = 0.12; c.autoRotateSpeed = 0.4;
      // Fluid zoom. A finite max stops the orbit controls drifting out to where
      // float precision breaks and the view "bugs out" / goes blank on zoom-out.
      c.minDistance = 6; c.maxDistance = 6000; c.zoomSpeed = 1.05;
    }

    const scene = fg.scene();
    if (scene && !scene.getObjectByName('cosmos')) {
      const cosmos = new THREE.Group();
      cosmos.name = 'cosmos';
      cosmos.add(buildSkybox()); // far sky — follows camera (never blank)
      const world = buildWorld(); // mid/near stars + galaxies — fixed (parallax)
      const clouds = buildClusterClouds(getPalette(palette)); // palette-tinted
      world.add(clouds);
      cloudsRef.current = clouds;
      cosmos.add(world);
      scene.add(cosmos);
      cosmosRef.current = cosmos;
    }

    // Cinematic colour: filmic tone mapping + a touch of exposure for shine.
    const renderer = fg.renderer();
    if (renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      // Cap the device pixel ratio — phones often report 3x, which quadruples
      // the pixels the GPU must shade for no visible benefit here.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    }
    // Push the far plane way out so the deep field never clips — endless space.
    const cam = fg.camera();
    if (cam) { cam.far = 60000; cam.updateProjectionMatrix(); }
    camRef.current = cam;

    try {
      // strength, radius, threshold — high threshold so only bright star cores
      // bloom (not the whole scene), keeping the deep field mostly black.
      const pass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.7, 0.7);
      fg.postProcessingComposer().addPass(pass);
      bloomRef.current = pass;
    } catch { /* bloom optional */ }

    // Continuous life: parallax drift, star twinkle and hero-star pulse, plus
    // zoom-aware contrast (fade the nebula clouds + ease bloom/exposure as you
    // fly in, so close-ups are crisp and high-contrast instead of cloud-washed).
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    const tmpTarget = new THREE.Vector3();
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const cosmos = cosmosRef.current;
      if (!cosmos) return;
      const sky = cosmos.getObjectByName('skybox');
      const world = cosmos.getObjectByName('world');
      if (sky && camRef.current) sky.position.copy(camRef.current.position);

      // --- zoom factor: 0 = fully zoomed in (close), 1 = far out ---
      const ctrls = fgRef.current?.controls();
      const cam2 = camRef.current;
      let zf = 1;
      if (cam2 && ctrls) {
        tmpTarget.copy(ctrls.target);
        const d = cam2.position.distanceTo(tmpTarget);
        zf = Math.min(1, Math.max(0, (d - 70) / (360 - 70)));
      }
      // Fade the cluster clouds out as you zoom in (kills the "light cast").
      if (cloudsRef.current) cloudsRef.current.children.forEach((o) => {
        if (o.userData.baseOp == null) o.userData.baseOp = o.material.opacity;
        o.material.opacity = o.userData.baseOp * (0.12 + 0.88 * zf);
      });
      // Higher contrast up close: ease exposure down + soften bloom.
      const renderer2 = fgRef.current?.renderer();
      if (renderer2) renderer2.toneMappingExposure = 0.92 + 0.23 * zf;
      const pass = bloomRef.current;
      if (pass) pass.strength = bloomOn.current ? (0.4 + 0.5 * zf) : 0;

      if (reduce) return;
      const t = (performance.now() - start) / 1000;
      if (sky) {
        sky.rotation.y = t * 0.003;
        const far = sky.getObjectByName('far');
        if (far) far.material.opacity = far.userData.baseOpacity * (0.82 + 0.18 * Math.sin(t * 0.6));
      }
      if (world) {
        world.rotation.y = t * 0.006;
        const mid = world.getObjectByName('mid'), near = world.getObjectByName('near');
        if (mid) mid.material.opacity = mid.userData.baseOpacity * (0.78 + 0.22 * Math.sin(t * 0.9));
        if (near) near.material.opacity = near.userData.baseOpacity * (0.8 + 0.2 * Math.sin(t * 1.3 + 1));
        const heroes = world.getObjectByName('heroStars');
        if (heroes) heroes.children.forEach((s) => {
          const k = 1 + 0.12 * Math.sin(t * s.userData.speed + s.userData.phase);
          s.scale.set(s.userData.base * k, s.userData.base * k, 1);
        });
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  useEffect(() => { bloomOn.current = bloom; }, [bloom]);

  useEffect(() => {
    const c = fgRef.current?.controls();
    if (c) c.autoRotate = autoOrbit;
  }, [autoOrbit]);

  // Recolour the drifting clouds when the palette changes.
  useEffect(() => {
    const world = cosmosRef.current?.getObjectByName('world');
    if (!world) return;
    if (cloudsRef.current) {
      world.remove(cloudsRef.current);
      cloudsRef.current.traverse((o) => { o.material?.map?.dispose?.(); o.material?.dispose?.(); });
    }
    const clouds = buildClusterClouds(getPalette(palette));
    world.add(clouds);
    cloudsRef.current = clouds;
  }, [palette]);

  // Ambient theme music (your uploaded mp3). Toggle from a user gesture.
  useEffect(() => {
    if (sound) startAmbient(); else stopAmbient();
  }, [sound]);
  useEffect(() => () => stopAmbient(), []);

  function flyTo(node) {
    if (!node) return;
    const dist = 80;
    const r = Math.hypot(node.x || 1, node.y || 1, node.z || 1);
    const k = 1 + dist / (r || 1);
    fgRef.current?.cameraPosition(
      { x: (node.x || 0) * k, y: (node.y || 0) * k, z: (node.z || 0) * k }, node, 900,
    );
  }

  // Re-centre on a node while preserving the user's current zoom distance and
  // view angle. We take the current camera→target offset vector and re-apply it
  // around the new node, so the framing stays identical — only the subject moves.
  function panTo(node) {
    const fg = fgRef.current;
    if (!fg || !node) return;
    const cam = fg.camera();
    const target = fg.controls()?.target || { x: 0, y: 0, z: 0 };
    const ox = cam.position.x - target.x;
    const oy = cam.position.y - target.y;
    const oz = cam.position.z - target.z;
    const nx = node.x || 0, ny = node.y || 0, nz = node.z || 0;
    fg.cameraPosition({ x: nx + ox, y: ny + oy, z: nz + oz }, { x: nx, y: ny, z: nz }, 900);
  }

  const dim = (label) => q && !(label || '').toLowerCase().includes(q);

  const nodeThreeObject = (node) => {
    const faded = dim(node.label);

    if (node.type === 'hub') {
      const group = new THREE.Group();
      // diffraction-spike star core
      const star = new THREE.Sprite(new THREE.SpriteMaterial({
        map: spikeTexture(node.color), transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, opacity: faded ? 0.15 : 1,
      }));
      const ss = node.val * 3.4;
      star.scale.set(ss, ss, 1);
      group.add(star);
      const label = makeTextSprite(`${node.label}  ·  ${node.count}`, faded);
      label.position.set(0, node.val * 1.4, 0);
      group.add(label);
      return group;
    }

    // photo "star": a coloured glow halo + the thumbnail on top.
    const group = new THREE.Group();
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(node.color || '#9fd8ff'), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: faded ? 0.03 : 0.22,
    }));
    const base = big ? 9 : 6;
    const hs = (faded ? base * 0.5 : base) * 1.7;
    halo.scale.set(hs, hs, 1);
    group.add(halo);

    // Only load a thumbnail if we have a URL. The sprite is created immediately
    // (map fills in later via the throttled queue) so nothing blocks the frame.
    if (node.thumb) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, opacity: faded ? 0.1 : 1 }));
      const s = faded ? base * 0.5 : base;
      sprite.scale.set(s, s, 1);
      group.add(sprite);
      enqueueTexture(node.thumb, sprite);
    }
    return group;
  };

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={graph}
      width={size.w}
      height={size.h}
      backgroundColor={theme === 'light' ? '#0c1230' : '#01020a'}
      showNavInfo={false}
      controlType="orbit"
      nodeThreeObject={nodeThreeObject}
      nodeThreeObjectExtend={false}
      nodeLabel={(n) => (n.type === 'hub' ? `${n.label} · ${n.count} photos` : (n.label || 'photo'))}
      linkColor={() => 'rgba(150,180,255,0.05)'}
      linkWidth={0.25}
      warmupTicks={70}
      cooldownTicks={140}
      onNodeClick={(node) => {
        if (!node || typeof node.x !== 'number') return;
        // Tapping a photo opens it WITHOUT moving the camera — your current
        // zoom/view is preserved. Only tapping a cluster core flies you in.
        if (node.type === 'hub') flyTo(node);
        else onSelect?.(node.asset);
      }}
      onBackgroundClick={() => onSelect?.(null)}
    />
  );
});

function makeTextSprite(text, faded) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = '600 26px Inter, system-ui, sans-serif';
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 24;
  canvas.width = w; canvas.height = 40;
  ctx.font = font;
  ctx.fillStyle = `rgba(6,8,18,${faded ? 0.2 : 0.55})`;
  roundRect(ctx, 0, 0, w, 40, 12); ctx.fill();
  ctx.fillStyle = faded ? 'rgba(236,235,230,0.3)' : '#EAF1FF';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 12, 21);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  sprite.scale.set(w / 6, 40 / 6, 1);
  return sprite;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default GalaxyGraph;
