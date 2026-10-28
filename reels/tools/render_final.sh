#!/usr/bin/env bash
# Final render of one reel: Remotion (60 or 30 fps from timeline.json, settings from the reel's remotion.config.ts),
# then the PIPELINE.md §11 re-encode (tv range, bt709, CRF 18, faststart, audio copied). Writes
# output/render-time.json with the measured seconds of each step.
# usage: bash reels/tools/render_final.sh reels/<slug>
set -euo pipefail
cd "$1"
mkdir -p out output
t0=$(date +%s)
npx remotion render src/video/index.ts Reel out/render-raw.mp4 --audio-codec=aac --audio-bitrate=192k --log=error
t1=$(date +%s)
ffmpeg -v error -y -i out/render-raw.mp4 -vf "scale=in_range=pc:out_range=tv,format=yuv420p" -c:v libx264 -preset slow -crf 18 \
  -profile:v high -movflags +faststart -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a copy output/final_reel.mp4
t2=$(date +%s)
frames=$(python3 -c "import json;print(json.load(open('timeline.json'))['durationInFrames'])")
printf '{"frames": %s, "renderSeconds": %s, "encodeSeconds": %s, "secondsPerFrame": %s, "finished": "%s"}\n' "$frames" $((t1 - t0)) $((t2 - t1)) \
  "$(python3 -c "print(round($((t1 - t0)) / $frames, 3))")" "$(date -u +%FT%TZ)" > output/render-time.json
cat output/render-time.json
