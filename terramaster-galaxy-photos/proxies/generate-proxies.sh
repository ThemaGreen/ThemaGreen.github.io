#!/usr/bin/env bash
# Generate small, offline-friendly proxies that mirror your photo folders.
# Originals are read-only and never modified. Idempotent: skips work already done.
set -euo pipefail

# Paths here are CONTAINER paths (see docker-compose.proxies.yml: /Volume1 -> /src).
SRC_DIRS="${SRC_DIRS:-/src/Photos /src/My_Photos /src/homes}"
OUT_DIR="${OUT_DIR:-/out}"
PHOTO_LONG_EDGE="${PHOTO_LONG_EDGE:-2048}"   # px (long side)
PHOTO_QUALITY="${PHOTO_QUALITY:-72}"          # jpeg quality
VIDEO_HEIGHT="${VIDEO_HEIGHT:-720}"           # output height in px
VIDEO_CRF="${VIDEO_CRF:-30}"                  # higher = smaller/lower quality

photo_exts=" jpg jpeg png heic heif webp tif tiff "
video_exts=" mp4 mov m4v avi mkv 3gp webm "

# Pick the ImageMagick entrypoint (v7 = magick, v6 = convert).
if command -v magick >/dev/null 2>&1; then IM=magick; else IM=convert; fi

made=0
for src in $SRC_DIRS; do
  [ -d "$src" ] || continue
  base="$(basename "$src")"
  find "$src" -type f | while read -r f; do
    rel="${f#"$src"/}"
    ext=" $(printf '%s' "${f##*.}" | tr 'A-Z' 'a-z') "
    case "$photo_exts" in
      *"$ext"*)
        out="$OUT_DIR/$base/${rel%.*}.jpg"
        [ -f "$out" ] && continue
        mkdir -p "$(dirname "$out")"
        "$IM" "$f" -auto-orient -resize "${PHOTO_LONG_EDGE}x${PHOTO_LONG_EDGE}>" \
              -quality "$PHOTO_QUALITY" "$out" 2>/dev/null \
          && echo "photo  $rel" || echo "FAIL   $rel"
        continue;;
    esac
    case "$video_exts" in
      *"$ext"*)
        out="$OUT_DIR/$base/${rel%.*}.mp4"
        [ -f "$out" ] && continue
        mkdir -p "$(dirname "$out")"
        ffmpeg -nostdin -y -i "$f" -vf "scale=-2:${VIDEO_HEIGHT}" \
               -c:v libx264 -crf "$VIDEO_CRF" -preset veryfast \
               -c:a aac -b:a 96k "$out" </dev/null >/dev/null 2>&1 \
          && echo "video  $rel" || echo "FAIL   $rel"
        continue;;
    esac
  done
done
echo "Proxies updated -> $OUT_DIR"
