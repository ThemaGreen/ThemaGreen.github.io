#!/usr/bin/env node
// Turn a downloaded Google Photos / Takeout album folder into the gallery's
// data: copies media into <out>/media, makes thumbnails, and writes
// <out>/manifest.json that the galaxy reads.
//
// Usage:
//   node tools/build-manifest.mjs <album-folder> <out-folder>
//   e.g.  node tools/build-manifest.mjs ~/Downloads/FamilyAlbum dist
//
// Thumbnails: uses `sharp` for images and `ffmpeg` for video posters if
// available (npm i sharp ; and ffmpeg on PATH). If neither is present it falls
// back to using the original as its own thumbnail (works, just heavier).
// Dates: reads Google Takeout `*.json` sidecars (photoTakenTime) when present,
// else file mtime.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const pexec = promisify(execFile);
const [, , inDir, outDir = 'dist'] = process.argv;
if (!inDir) { console.error('Usage: node tools/build-manifest.mjs <album-folder> [out-folder]'); process.exit(1); }

const IMG = /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp|tiff?)$/i;
const VID = /\.(mp4|mov|webm|m4v|avi|mkv|3gp)$/i;

let sharp = null;
try { sharp = (await import('sharp')).default; } catch { /* optional */ }
let hasFfmpeg = false;
try { await pexec('ffmpeg', ['-version']); hasFfmpeg = true; } catch { /* optional */ }

async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

async function takenTime(file) {
  for (const s of [`${file}.json`, `${file}.supplemental-metadata.json`, file.replace(/\.[^.]+$/, '.json')]) {
    try {
      const j = JSON.parse(await fs.readFile(s, 'utf8'));
      const ts = j.photoTakenTime?.timestamp || j.creationTime?.timestamp;
      if (ts) return new Date(Number(ts) * 1000).toISOString();
    } catch { /* no sidecar */ }
  }
  try { return (await fs.stat(file)).mtime.toISOString(); } catch { return null; }
}

const mediaDir = path.join(outDir, 'media');
const thumbDir = path.join(mediaDir, 'thumbs');
await fs.mkdir(thumbDir, { recursive: true });

const items = [];
let n = 0;
for await (const file of walk(inDir)) {
  const isImg = IMG.test(file), isVid = VID.test(file);
  if (!isImg && !isVid) continue;
  const id = `m${++n}`;
  const ext = path.extname(file);
  const destName = `${id}${ext}`;
  const album = path.basename(path.dirname(file));
  await fs.copyFile(file, path.join(mediaDir, destName));

  let thumb = `media/${destName}`;
  try {
    if (isImg && sharp) {
      const t = `${id}.jpg`;
      await sharp(file).rotate().resize(480, 480, { fit: 'inside' }).jpeg({ quality: 80 }).toFile(path.join(thumbDir, t));
      thumb = `media/thumbs/${t}`;
    } else if (isVid && hasFfmpeg) {
      const t = `${id}.jpg`;
      await pexec('ffmpeg', ['-y', '-i', file, '-ss', '00:00:01', '-vframes', '1', '-vf', 'scale=480:-1', path.join(thumbDir, t)]);
      thumb = `media/thumbs/${t}`;
    }
  } catch { /* keep original as thumb */ }

  items.push({
    id,
    name: path.basename(file),
    type: isVid ? 'VIDEO' : 'IMAGE',
    src: `media/${destName}`,
    thumb,
    date: await takenTime(file),
    album: album && album !== path.basename(inDir) ? album : 'Family Album',
  });
  if (n % 25 === 0) console.log(`…${n} files`);
}

items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify({ items }, null, 0));
console.log(`\n✅ ${items.length} media → ${path.join(outDir, 'manifest.json')}`);
console.log(`   thumbnails: ${sharp ? 'images ✓' : 'images ✗ (npm i sharp)'} · ${hasFfmpeg ? 'video ✓' : 'video ✗ (install ffmpeg)'}`);
console.log(`   upload the whole "${outDir}" folder to ThemaGreen.com/galaxy/`);
