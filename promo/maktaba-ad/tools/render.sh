#!/bin/sh
# Render one format with sound: tools/render.sh Reel|Feed out/file.mp4 [CRF, default 16]. H.264 + AAC, 60 fps, BT.709.
set -e
cd "$(dirname "$0")/.."
chrome=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | head -1)
mkdir -p "$(dirname "$2")"
npx remotion render src/index.ts "$1" "$2" --codec=h264 --crf="${3:-16}" --pixel-format=yuv420p --color-space=bt709 \
  --audio-codec=aac --audio-bitrate=192k --concurrency=4 ${chrome:+--browser-executable="$chrome"} --log=warn
