#!/bin/sh
# Put a new public/audio/mix.wav into the finished MP4s without re-rendering the picture (video stream copied).
set -e
cd "$(dirname "$0")/.."
for f in export/efhamnafsak-ad-reel-1080x1920-60fps.mp4 export/efhamnafsak-ad-feed-1080x1350-60fps.mp4; do
  ffmpeg -v error -y -i "$f" -i public/audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest -movflags +faststart "$f.new.mp4"
  mv "$f.new.mp4" "$f"
done
