# Terramaster Galaxy Photos

Self-hosted photo explorer for a **TerraMaster F4-425 (TOS 6, Intel N95)** that
clusters your photos into **floating galaxies** — like the map screen in
Scribblenauts — where you pick the filter (similarity, time/date down to the
minute, people, …) and the photos rearrange into clusters you can fly through.

Works from **phone, laptop, or tablet** — it's a web app (installable as a PWA).

## How it works (two layers)

1. **Immich** (the brain) — a self-hosted photo backend that runs in Docker on
   the NAS. It ingests your existing photo folder, reads EXIF, runs **face
   recognition** (people clustering) and **CLIP similarity embeddings**, and
   exposes a REST API.
2. **galaxy-ui** (this repo's custom part) — a small React app using
   `react-force-graph-3d` (WebGL). It reads the Immich API and lays photos out
   as galaxies: one hub per cluster, photo thumbnails orbiting it, physics
   making them drift apart so you can pan/zoom/click to fly in.

```
TerraMaster F4-425 (TOS 6, Docker)
├── immich-server            :2283   ingest + API
├── immich-machine-learning          faces + CLIP embeddings (CPU)
├── postgres + redis                 Immich storage
└── galaxy-ui                :8080   <- this repo, the galaxy view
```

## Filters implemented

| Filter | Status | How |
|--------|--------|-----|
| Time — Year / Month / Day / Minute | ✅ working | Buckets EXIF `dateTimeOriginal` |
| People / person | ✅ working | Immich face clustering (`/people` + per-person search) |
| Similarity | 🔜 roadmap | See below |

### Similarity (roadmap)

Immich computes a CLIP embedding per photo. To cluster by similarity you:
1. Export embeddings (Immich smart-search / DB `smart_search` table).
2. Reduce to 2-D/3-D with **UMAP**, cluster with **HDBSCAN**.
3. Feed cluster ids into `buildGraph` the same way the date grouper does.

A good place to add it: a small sidecar service (Python + `umap-learn` +
`hdbscan`) that writes a `clusters.json` the UI reads, or precompute on a
schedule. `galaxy-ui/src/clustering/layout.js` is structured so a new grouper
drops straight in.

## Deploy on the NAS

1. In **TOS 6**, install the **Docker** app and enable SSH (or use Portainer).
2. Copy this folder to the NAS, e.g. `/Volume1/galaxy/`.
3. `cp .env.example .env` and edit:
   - `PHOTO_LIBRARY` → your existing photos folder (mounted read-only)
   - `UPLOAD_LOCATION`, `DB_DATA_LOCATION` → where Immich keeps its data
   - set a strong `DB_PASSWORD`
4. `docker compose up -d` (first run pulls images + builds the UI).
5. Open `http://<nas-ip>:2283`, create your Immich account, add your photo
   folder as an **External Library**, and let it index (faces/embeddings run in
   the background — give the N95 some time on the first pass).
6. In Immich: **Account → API Keys → New**. Paste it into `.env` as
   `IMMICH_API_KEY`, then `docker compose up -d galaxy-ui`.
7. Open `http://<nas-ip>:8080` — pick a filter, fly around.

### Remote access (off your home network)

Don't port-forward. Use **Tailscale** (TOS has it) or a Cloudflare Tunnel so
your phone reaches the NAS securely from anywhere.

## Local development

```bash
cd galaxy-ui
npm install
# point dev proxy at a running Immich and supply a dev key
VITE_IMMICH_TARGET=http://<nas-ip>:2283 VITE_IMMICH_API_KEY=<key> npm run dev
```

## Phone offload, offline access & backup

Want to store your Android photos/videos on the NAS, free up phone space, keep
the important ones available offline, and protect everything with proper
backups? See **[`docs/nas-photo-architecture.md`](docs/nas-photo-architecture.md)**.
It covers, tailored to this TNAS + Immich setup:

- **Offload** — Immich app auto-backup + safe "delete from device".
- **Offline** — offline favorites (Immich) and an optional **proxy pipeline**
  (`proxies/` + `docker-compose.proxies.yml`) that syncs small copies of *almost
  everything* to the phone via Syncthing.
- **3-2-1 backup** — `backup/immich-backup.sh` (correct Postgres `pg_dump` +
  originals + config to a local USB and offsite) and `backup/RESTORE.md`.

## Performance notes for the N95

- The first index (faces + embeddings) is the heavy part and runs once. CPU-only
  is fine for a personal library; just let it finish overnight.
- The UI caps how many photos it loads per view (600, or 30 people × 60) so the
  WebGL scene stays smooth on integrated graphics. Tune in `src/App.jsx`.
- 8 GB RAM is enough; 16 GB+ helps Postgres + ML run comfortably together.
