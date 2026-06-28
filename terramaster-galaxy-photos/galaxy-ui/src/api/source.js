// Chooses the active data source at runtime.
//
//   'demo'     -> api/demo.js     (self-contained synthetic library)
//   'live'     -> api/immich.js   (your Immich library, per-account login)
//   'manifest' -> api/manifest.js (public self-hosted gallery via manifest.json)
//
// Both modules export the same surface, so the rest of the app just calls
// getApi(settings.source).<fn>().

import * as demo from './demo.js';
import * as immich from './immich.js';
import * as manifest from './manifest.js';
import * as drive from './drive.js';

export function getApi(source) {
  if (source === 'live') return immich;
  if (source === 'manifest') return manifest;
  if (source === 'drive') return drive;
  return demo;
}
