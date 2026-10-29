#!/bin/sh
# Render the film (or a frame range) with sound: 1920×1080, 60 fps, H.264 + AAC, BT.709.
#   tools/render.sh out/master.mp4            the whole film
#   tools/render.sh out/clip.mp4 0-1200       a frame range (inclusive)
set -e
cd "$(dirname "$0")/.."
out=$1; range=$2
chrome=${REMOTION_CHROME:-$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}
mkdir -p "$(dirname "$out")"
npx remotion render src/index.ts Film "$out" --codec=h264 --crf=18 --pixel-format=yuv420p --color-space=bt709 \
  --audio-codec=aac --audio-bitrate=192k --concurrency="${CONCURRENCY:-4}" ${chrome:+--browser-executable="$chrome"} \
  ${range:+--frames=$range} --log=warn
