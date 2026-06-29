import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Read VITE_* from the shell AND from .env / .env.production so a single
// .env.production file is enough (no juggling shell variables).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Host under a subpath (e.g. themagreen.github.io/galaxy/) by setting
    // VITE_BASE=/galaxy/ . Defaults to root for the NAS deployment.
    base: env.VITE_BASE || '/',
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
