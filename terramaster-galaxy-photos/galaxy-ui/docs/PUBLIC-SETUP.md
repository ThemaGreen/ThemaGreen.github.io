# ⭐ RECOMMENDED for big libraries (4 GB+): app on GitHub Pages, media on Google Drive

GitHub Pages can't host 4 GB (100 MB-per-file limit, ~1 GB repo). Instead keep
the media in a public Drive folder (Google serves it for free) and host only the
tiny app on Pages. New uploads to the folder appear automatically.

### A. Make the Drive folder readable
1. Put all the media in one Google Drive folder. (Google Photos → download → upload
   that folder to Drive, or move it there.)
2. Right-click the folder → Share → **Anyone with the link → Viewer**.
3. Folder **id** = the part after `/folders/` in its URL.

### B. Get a Drive API key
1. https://console.cloud.google.com → new project.
2. APIs & Services → Library → enable **Google Drive API**.
3. Credentials → Create credentials → **API key**. Restrict it: API = Drive only;
   Application restriction = HTTP referrer = `https://themagreen.github.io/*`.

### C. Build the app pointed at the folder
```sh
cd galaxy-ui && npm install
VITE_BASE=/galaxy/ VITE_DEFAULT_SOURCE=drive \
VITE_DRIVE_FOLDER_ID=THE_FOLDER_ID \
VITE_DRIVE_KEY=THE_API_KEY \
npm run build
```
Copy `dist/` into your `themagreen.github.io` repo under `galaxy/` and push.
Open `https://themagreen.github.io/galaxy/` — it lists the folder live. Subfolders
become albums; add photos to Drive and they show up on refresh.

(For shared ❤️ likes, also add the Supabase env from section 4 below and rebuild.)

---

# Alternative: fully self-hosted gallery (manifest)

A public, no-login galaxy of your family photos/videos with shared ❤️ likes.
It reads a `manifest.json` you generate from your downloaded album — so it works
on any static hosting, with no API keys and no CORS problems.

> Why not read the Google Photos share link directly? Google Photos has **no
> public API** to list a shared album by its link, and the page is CORS-locked,
> so a browser can't read it. Exporting once (which you did) is the reliable way.

## 1. Build the galaxy for the subpath
From `galaxy-ui/`:
```sh
VITE_BASE=/galaxy/ VITE_DEFAULT_SOURCE=manifest npm run build
```
This produces `dist/` configured to live at `https://ThemaGreen.com/galaxy/` and
to open straight into the family gallery.

## 2. Turn your downloaded album into gallery data
Point the tool at the folder you unzipped, writing into the same `dist/`:
```sh
# better thumbnails (optional but recommended):
npm i sharp           # image thumbnails
#   and install ffmpeg on your system for video posters
node tools/build-manifest.mjs ~/Downloads/YourAlbum dist
```
It copies media into `dist/media/`, makes thumbnails, reads Google Takeout date
sidecars for correct timelines, and writes `dist/manifest.json`.

## 3. Upload
Copy everything in `dist/` to your site so it's served at `/galaxy/`:
```
ThemaGreen.com/galaxy/index.html
ThemaGreen.com/galaxy/assets/...
ThemaGreen.com/galaxy/manifest.json
ThemaGreen.com/galaxy/media/...
```
Open `https://ThemaGreen.com/galaxy/` — the whole family can view it, no login.

## 4. Shared likes (❤️) across everyone
Likes work per-device out of the box. To make them **shared across the family**,
add a free Supabase backend:

1. Create a project at supabase.com → SQL editor → run:
   ```sql
   create table likes (
     id bigint generated always as identity primary key,
     asset_id text not null, viewer text not null,
     created_at timestamptz default now(),
     unique (asset_id, viewer)
   );
   alter table likes enable row level security;
   create policy "read"   on likes for select using (true);
   create policy "add"    on likes for insert with check (true);
   create policy "remove" on likes for delete using (true);
   ```
2. Project Settings → API → copy the **Project URL** and **anon public key**.
3. Rebuild with them set:
   ```sh
   VITE_BASE=/galaxy/ VITE_DEFAULT_SOURCE=manifest \
   VITE_SUPABASE_URL=https://xxxx.supabase.co \
   VITE_SUPABASE_ANON_KEY=eyJ... \
   npm run build
   ```
Now a heart from anyone is visible to everyone. (First like asks for their name.)

## 5. Auto-sync when new media is added
- **Simple:** re-run steps 2–3 whenever you add to the album (a one-line script
  or a scheduled task on whatever hosts the files).
- **True auto-sync:** keep the source of truth in a Google **Drive** folder set
  to "Anyone with the link", and we switch to the Drive source (lists the folder
  live via an API key) — ask me to wire `VITE_DRIVE_FOLDER_ID` + `VITE_DRIVE_KEY`.

## Notes
- HEIC photos (iPhone) may not thumbnail without `libheif`; convert to JPG first,
  or they'll still display via the original.
- This public build has no Immich and no accounts — it's a read-only family
  gallery with likes. Your NAS/Immich deployment is separate and unaffected.
