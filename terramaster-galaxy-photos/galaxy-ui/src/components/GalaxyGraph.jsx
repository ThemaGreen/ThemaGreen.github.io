import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { buildSkybox, buildWorld, spikeTexture, glowTexture } from '../three/cosmos.js';

// Hyperreal JWST-style deep field: black space, a dense starfield, soft nebula
// clouds, diffraction-spike cluster cores and glowing photo-stars. Zoom in and
// the photo-stars resolve into your actual images.
const GalaxyGraph = forwardRef(function GalaxyGraph(
  { graph, query, onSelect, theme = 'dark', bloom = true, autoOrbit = true, density = 'comfortable' },
  ref,
) {
  const fgRef = useRef();
  const bloomRef = useRef(null);
  const cosmosRef = useRef(null);
  const camRef = useRef(null);
  const rafRef = useRef(0);
  const texLoader = useMemo(() => new THREE.TextureLoader(), []);
  const texCache = useRef(new Map());
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

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
    setAutoRotate: (on) => { const c = fgRef.current?.controls(); if (c) c.autoRotate = on; },
  }));

  // One-time: forces, controls, deep-space backdrop, bloom.
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // Spread galaxies into distinct islands: strong repulsion between clusters,
    // short/strong links so each galaxy's photos stay a tight ball.
    fg.d3Force('charge')?.strength(-80);
    const link = fg.d3Force('link');
    if (link) link.distance(10).strength(1);

    const c = fg.controls();
    if (c) {
      c.enableDamping = true; c.dampingFactor = 0.12; c.autoRotateSpeed = 0.4;
      // Free, fluid zoom — no clamp that fights you / springs back.
      c.minDistance = 1; c.maxDistance = Infinity; c.zoomSpeed = 1.1;
    }

    const scene = fg.scene();
    if (scene && !scene.getObjectByName('cosmos')) {
      const cosmos = new THREE.Group();
      cosmos.name = 'cosmos';
      cosmos.add(buildSkybox()); // far sky — follows camera (never blank)
      cosmos.add(buildWorld());  // mid/near stars + galaxies — fixed (parallax)
      scene.add(cosmos);
      cosmosRef.current = cosmos;
    }

    // Cinematic colour: filmic tone mapping + a touch of exposure for shine.
    const renderer = fg.renderer();
    if (renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
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

    // Continuous life: parallax drift, star twinkle and hero-star pulse.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const cosmos = cosmosRef.current;
      if (!cosmos) return;
      const sky = cosmos.getObjectByName('skybox');
      const world = cosmos.getObjectByName('world');
      // Only the FAR sky follows the camera (so it never goes blank). The world
      // stays put, giving real parallax as you zoom and orbit.
      if (sky && camRef.current) sky.position.copy(camRef.current.position);
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

  useEffect(() => {
    const c = fgRef.current?.controls();
    if (c) c.autoRotate = autoOrbit;
  }, [autoOrbit]);

  useEffect(() => {
    const pass = bloomRef.current;
    if (pass) pass.strength = bloom ? 0.9 : 0;
  }, [bloom]);

  function flyTo(node) {
    if (!node) return;
    const dist = 80;
    const r = Math.hypot(node.x || 1, node.y || 1, node.z || 1);
    const k = 1 + dist / (r || 1);
    fgRef.current?.cameraPosition(
      { x: (node.x || 0) * k, y: (node.y || 0) * k, z: (node.z || 0) * k }, node, 900,
    );
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
      // label
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

    let tex = texCache.current.get(node.thumb);
    if (!tex) {
      tex = texLoader.load(node.thumb);
      tex.colorSpace = THREE.SRGBColorSpace;
      texCache.current.set(node.thumb, tex);
    }
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: faded ? 0.1 : 1 }));
    const s = faded ? base * 0.5 : base;
    sprite.scale.set(s, s, 1);
    group.add(sprite);
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
        flyTo(node);
        if (node.type === 'photo') onSelect?.(node.asset);
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
