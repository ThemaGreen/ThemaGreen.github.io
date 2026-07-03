import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Read VITE_* from .env / .env.production. We look in BOTH this folder
// (galaxy-ui/) and its parent (terramaster-galaxy-photos/), so the env file
// works in either place — local values win if both exist. The matching VITE_*
// vars are then injected into the client bundle via `define`, which is what
// makes import.meta.env.VITE_DRIVE_KEY etc. actually reach the app.
export default defineConfig(({ mode }) => {
  const here = loadEnv(mode, process.cwd(), '');
  const parent = loadEnv(mode, resolve(process.cwd(), '..'), '');
  const env = { ...parent, ...here };

  const define = {};
  for (const k of Object.keys(env)) {
    if (k.startsWith('VITE_')) define[`import.meta.env.${k}`] = JSON.stringify(env[k]);
  }

  return {
    // Deploys at themagreen.com/galaxy/, so a production build defaults to base
    // '/galaxy/'. Override with VITE_BASE=/ for a root deploy. Dev stays at '/'.
    base: env.VITE_BASE || (mode === 'production' ? '/galaxy/' : '/'),
    define,
    plugins: [react()],
    // Force a single Three.js instance (react-force-graph-3d bundles its own).
    resolve: { dedupe: ['three'] },
    server: {
      proxy: {
        '/immich': {
          target: env.VITE_IMMICH_TARGET || 'http://localhost:2283',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/immich/, ''),
        },
      },
    },
  };
});
