# NAS Photo System — offload, offline access, and backup

Tailored to **TerraMaster F4‑425 / TOS 6** running **Immich** (already deployed
by this project's `docker-compose.yml`). Goal: keep originals on the NAS, free
space on your Android phone, keep the photos you care about available offline,
and make sure nothing is lost if the NAS dies.

## The one hard rule

**Anything you want available offline must physically exist on the phone.**
There is no way around this. So the design is about *controlling what and at what
resolution* you keep locally — not pretending bytes can be offline without being
stored. Three layers solve it:

| Layer | Lives where | Purpose |
|-------|-------------|---------|
| Originals | NAS only | Full‑res archive, never on phone except on demand |
| Proxies (optional) | NAS → synced to phone | Small copies so you can browse *almost everything* offline |
| Offline favorites | Phone (Immich download) | Full‑res copies of albums you explicitly pick |

## 1. Offload: Android → NAS (free up the phone)

You already have Immich, so you don't need PhotoSync/FolderSync — the **Immich
mobile app** does upload *and* safe deletion:

1. Install **Immich** (Play Store) and point it at `http://<nas-ip>:2283`
   (or your Tailscale address for off‑network use).
2. **Settings → Backup**: enable background backup; select the albums to back up
   (Camera, Screenshots, etc.). Turn on **Foreground + Background** backup, and
   restrict to **Wi‑Fi + charging** if you like.
3. Wait until the album shows **fully backed up** (green check / count matches).
4. **Library → cloud/device view → select backed‑up assets → "Delete from
   device."** This removes the phone copies but keeps them on the NAS.

> Verify before deleting: open Immich on the *web* and confirm the photos are
> there. Only then delete from the phone. This is your offload step — photos and
> videos both. Videos are large, so this is where you reclaim the most space.

## 2. Offline access (the honest version)

Immich's offline support today = **cached thumbnails for things you've browsed +
assets you explicitly download**. It is *not* a full offline gallery of your
whole library. Practical use:

- In the Immich app, open an album → **⋯ → Download** to keep it offline at full
  resolution. Do this for the albums you actually need without a network (trips,
  family, work).
- Everything else is browsable when you're online; recently‑viewed items stay
  cached for a while.

That covers the 80/20. For the *"I want to scroll basically my entire library
offline but not fill my phone"* case, use proxies → Section 3.

## 3. Proxies: near‑complete offline gallery, small footprint (optional/advanced)

Idea: the NAS generates **compressed copies** (e.g. 2048px JPEGs, 720p videos)
into a `mobile-gallery/` tree that mirrors your folders, and a sync app keeps
that tree on the phone. Your stock gallery then shows *almost everything*
offline at "good enough" quality; you only fetch an original when you need to
zoom/print/edit.

This repo ships the pipeline:

- `proxies/generate-proxies.sh` — builds proxies (ImageMagick for photos,
  ffmpeg for video), skipping anything already done. Idempotent; safe to re‑run.
- `proxies/Dockerfile` — a tiny container with ImageMagick + ffmpeg so you don't
  install anything on TOS.
- `docker-compose.proxies.yml` — runs the proxy generator on demand **and** a
  **Syncthing** container to sync `mobile-gallery/` to your phone.

Setup:

```bash
# 1. Generate proxies (re-run anytime / on a schedule)
docker-compose -f docker-compose.proxies.yml run --rm proxy-gen

# 2. Start Syncthing, open http://<nas-ip>:8384, and pair your phone's
#    Syncthing app to the shared "mobile-gallery" folder (receive-only on phone)
docker-compose -f docker-compose.proxies.yml up -d syncthing
```

On the phone, install **Syncthing** (or **Möbius Sync** on iOS), accept the
`mobile-gallery` folder as **Receive Only**, and point your gallery app at it.
Tune sizes via env vars in `docker-compose.proxies.yml` (`PHOTO_LONG_EDGE`,
`VIDEO_HEIGHT`, `VIDEO_CRF`). Roughly: 2048px/q72 photos ≈ 300–800 KB each;
a 5‑minute 720p/crf30 clip ≈ 40–80 MB. A 50k‑photo library lands around
20–40 GB of proxies — a fraction of the originals.

Schedule it (TOS Control Panel → Task Scheduler, or cron):

```
# nightly at 02:30 — regenerate proxies for new originals
30 2 * * *  docker-compose -f /Volume1/public/Docker/terramaster-galaxy-photos/docker-compose.proxies.yml run --rm proxy-gen
```

## 4. Backup: 3‑2‑1 for the NAS itself

**RAID is availability, not backup.** It does nothing against accidental
deletion, a bad sync, corruption, theft, or a TOS reinitialize. You need real
copies. The rule: **3** copies, on **2** media types, **1** offsite.

| Copy | What | How |
|------|------|-----|
| 1 (live) | Originals + Immich data on the NAS | your working set |
| 2 (local) | External USB drive or 2nd NAS | `backup/immich-backup.sh` (rsync) |
| 3 (offsite) | Cloud bucket or remote NAS | same script via `rclone` |

What must be backed up (and the gotcha):

- **Original photos/videos** — irreplaceable. (`MEDIA_DIRS` in the script.)
- **Immich Postgres database** — holds faces, albums, places, all metadata.
  **This must be a `pg_dump`, not a file copy of the DB folder** — copying the
  live Postgres data directory produces a corrupt, unrestorable backup. The
  script does the dump correctly.
- **Immich upload dir** — thumbnails (regenerable) + transcodes + any
  non‑external uploads.
- **Config** — `docker-compose.yml` + `.env`, so the whole stack is reproducible.

Run it: see `backup/immich-backup.sh` (config block at top) and schedule nightly.
Recovery steps: see `backup/RESTORE.md`.

Also turn on **Btrfs snapshots** in TOS (Control Panel → Snapshot) for your photo
shares and the Docker data folder — instant rollback for "oops I deleted that,"
which backups handle slower.

## Putting it together

```
Android (Immich app: backup + delete-from-device; offline favorites)
   │  uploads originals
   ▼
TerraMaster F4-425  ── Immich (master library, faces, similarity)
   │                    │
   │ proxy-gen ─────────┼──► mobile-gallery/  ──Syncthing──► phone (offline browse, small)
   │                    │
   └─ immich-backup.sh ─┴──► USB drive (copy 2)  ──rclone──► cloud/remote NAS (copy 3)
                              + nightly pg_dump of the Immich database
```
