import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Host under a subpath (e.g. ThemaGreen.com/galaxy/) by building with
  // VITE_BASE=/galaxy/ . Defaults to root for the NAS deployment.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  // Force a single Three.js instance. react-force-graph-3d bundles its own
  // copy of three; without deduping, our UnrealBloomPass (a different three
  // build) gets added to the force-graph's composer and throws
  // "determinantAffine is not a function" / "Multiple instances of Three.js".
  resolve: {
    dedupe: ['three'],
  },
  server: {
    // In local dev, proxy /api and /immich to a running Immich instance.
    // Set VITE_IMMICH_TARGET to your NAS, e.g. http://192.168.1.50:2283
    proxy: {
      '/immich': {
        target: process.env.VITE_IMMICH_TARGET || 'http://localhost:2283',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/immich/, ''),
      },
    },
  },
});
