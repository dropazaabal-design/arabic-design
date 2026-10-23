#!/bin/sh
# Final file from the master: two-pass H.264 (High, yuv420p, BT.709, 60 fps) sized to stay under GitHub's 100 MB limit,
# AAC 160 kb/s, faststart. usage: tools/export.sh out/master.mp4 export/hudoo.mp4 [target MB, default 92]
set -e
in=$1; out=$2; mb=${3:-92}
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
vk=$(python3 -c "print(int($mb*8*1024/$dur - 160))")
tmp=$(mktemp -d)
common="-c:v libx264 -preset slow -tune animation -profile:v high -pix_fmt yuv420p -r 60 -b:v ${vk}k -maxrate $((vk*3))k -bufsize $((vk*4))k -colorspace bt709 -color_primaries bt709 -color_trc bt709"
ffmpeg -v error -y -i "$in" $common -pass 1 -passlogfile "$tmp/p" -an -f null /dev/null
ffmpeg -v error -y -i "$in" $common -pass 2 -passlogfile "$tmp/p" -c:a aac -b:a 160k -movflags +faststart "$out"
rm -rf "$tmp"
ls -l "$out"
