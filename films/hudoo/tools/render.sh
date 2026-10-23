#!/bin/sh
# Render the film or a part of it with sound, 1920×1080 60 fps H.264 + AAC, BT.709 (sRGB primaries).
#   tools/render.sh out/master.mp4                 the whole film (master quality, CRF 16)
#   tools/render.sh qa/clips/meeting.mp4 0-1376    a frame range (inclusive)
# The soundtrack (public/audio/mix.wav) is rebuilt first by tools/mix.py.
set -e
cd "$(dirname "$0")/.."
out=$1; range=$2
chrome=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | head -1)
mkdir -p "$(dirname "$out")"
npx remotion render src/index.ts Film "$out" --codec=h264 --crf=16 --pixel-format=yuv420p --color-space=bt709 \
  --audio-codec=aac --audio-bitrate=192k --concurrency="${CONCURRENCY:-50%}" ${chrome:+--browser-executable="$chrome"} \
  ${range:+--frames=$range} --log=warn
