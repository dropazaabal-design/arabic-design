#!/bin/sh
# Render one format with sound: tools/render.sh Reel|Feed OUT.mp4 [CRF, default 16].
# H.264 High, yuv420p, BT.709, 60 fps, AAC 48 kHz; then the file is rewritten with the index first (faststart).
set -e
cd "$(dirname "$0")/.."
chrome=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | head -1)
mkdir -p "$(dirname "$2")"
tmp="$2.tmp.mp4"
npx remotion render src/index.ts "$1" "$tmp" --codec=h264 --crf="${3:-16}" --pixel-format=yuv420p --color-space=bt709 \
  --audio-codec=aac --audio-bitrate=192k --concurrency=4 ${chrome:+--browser-executable="$chrome"} --log=warn
ffmpeg -v error -y -i "$tmp" -c copy -movflags +faststart "$2"
rm "$tmp"
