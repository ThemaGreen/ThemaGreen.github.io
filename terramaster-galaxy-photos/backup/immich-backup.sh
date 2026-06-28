#!/usr/bin/env bash
# 3-2-1 backup for the NAS photo system (Immich DB + originals + config).
# Copy 1 = the live NAS. This script makes Copy 2 (local) and Copy 3 (offsite).
# Schedule nightly (TOS Task Scheduler or cron). Recovery: see RESTORE.md.
#
# Requires: docker, rsync. Offsite step also needs rclone (optional).
set -euo pipefail

# ------------------------------- CONFIG ------------------------------------
# Override any of these via environment variables if your paths differ.
PROJECT_DIR="${PROJECT_DIR:-/Volume1/public/Docker/terramaster-galaxy-photos}"
UPLOAD_LOCATION="${UPLOAD_LOCATION:-/Volume1/public/Docker/galaxy/immich-upload}"
DB_CONTAINER="${DB_CONTAINER:-immich_postgres}"
DB_USER="${DB_USER:-postgres}"

# Your irreplaceable ORIGINALS (space-separated). These are the crown jewels.
MEDIA_DIRS="${MEDIA_DIRS:-/Volume1/Photos /Volume1/My_Photos /Volume1/Green_Family /Volume1/Amiras_ /Volume1/Dads /Volume1/Moms /Volume1/Themas /Volume1/Timothy_Jrs /Volume1/homes}"

# COPY 2 — local backup target (external USB drive or a second NAS share).
LOCAL_BACKUP_DIR="${LOCAL_BACKUP_DIR:-/mnt/usb1/nas-backup}"

# COPY 3 — offsite rclone remote ("" disables). e.g. b2:my-nas-backup or a
# crypt remote for client-side encryption. Configure once with: rclone config
OFFSITE_REMOTE="${OFFSITE_REMOTE:-}"

# Keep this many days of DB dumps locally.
DB_RETENTION_DAYS="${DB_RETENTION_DAYS:-14}"
# ---------------------------------------------------------------------------

stamp="$(date +%Y%m%d-%H%M)"
log() { echo "[$(date '+%F %T')] $*"; }

mkdir -p "$LOCAL_BACKUP_DIR"/{db,upload,media,config}

# 1) Immich database — MUST be a logical dump, NOT a copy of the data folder.
log "Dumping Immich database…"
docker exec -t "$DB_CONTAINER" pg_dumpall --clean --if-exists --username="$DB_USER" \
  | gzip > "$LOCAL_BACKUP_DIR/db/immich-$stamp.sql.gz"

# 2) Immich upload dir (thumbnails, transcodes, directly-uploaded originals).
log "Syncing Immich upload directory…"
rsync -a --delete "$UPLOAD_LOCATION/" "$LOCAL_BACKUP_DIR/upload/"

# 3) Your original photos/videos.
log "Syncing original media…"
for d in $MEDIA_DIRS; do
  if [ ! -d "$d" ]; then log "  skip (missing): $d"; continue; fi
  rsync -a --delete "$d/" "$LOCAL_BACKUP_DIR/media/$(basename "$d")/"
done

# 4) Stack config so the whole system is reproducible.
log "Copying config…"
cp -f "$PROJECT_DIR/docker-compose.yml" "$LOCAL_BACKUP_DIR/config/" 2>/dev/null || true
cp -f "$PROJECT_DIR/.env"               "$LOCAL_BACKUP_DIR/config/" 2>/dev/null || true

# 5) Prune old DB dumps.
find "$LOCAL_BACKUP_DIR/db" -name 'immich-*.sql.gz' -mtime "+$DB_RETENTION_DAYS" -exec rm -f {} \; 2>/dev/null || true

# 6) COPY 3 — replicate everything offsite.
if [ -n "$OFFSITE_REMOTE" ] && command -v rclone >/dev/null 2>&1; then
  log "Replicating offsite to $OFFSITE_REMOTE…"
  rclone sync "$LOCAL_BACKUP_DIR" "$OFFSITE_REMOTE" --fast-list --transfers 8
else
  log "Offsite step skipped (set OFFSITE_REMOTE and install rclone to enable)."
fi

log "Backup complete -> $LOCAL_BACKUP_DIR"
