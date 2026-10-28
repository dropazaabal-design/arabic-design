#!/bin/sh
# Render the reel with sound: laid out at 1080×1920, rendered ×2 → 2160×3840 (4K vertical), 60 fps, H.264 + AAC, BT.709.
#   tools/render.sh out/reel-4k.mp4            the whole reel
#   tools/render.sh out/clip.mp4 0-600         a frame range (inclusive)
#   SCALE=1 tools/render.sh out/preview.mp4    a 1080×1920 preview
set -e
cd "$(dirname "$0")/.."
out=$1; range=$2
chrome=${REMOTION_CHROME:-$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}
mkdir -p "$(dirname "$out")"
npx remotion render src/index.ts Film "$out" --scale="${SCALE:-2}" --codec=h264 --crf=18 --pixel-format=yuv420p --color-space=bt709 \
  --audio-codec=aac --audio-bitrate=192k --concurrency="${CONCURRENCY:-4}" ${chrome:+--browser-executable="$chrome"} \
  ${range:+--frames=$range} --log=warn
