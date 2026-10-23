#!/bin/bash
# usage: tools/normalize-voice.sh IN.wav OUT.wav
# Applies one static gain so the segment measures -16 LUFS integrated (same level
# for every segment, no pumping). No trimming: a silence gate clipped soft
# consonants at the edges (the final «ك» of «يساعدك»), and Habibi pads very little.
set -euo pipefail
in=$1; out=$2
tmp=$(mktemp --suffix=.wav)
ffmpeg -loglevel error -y -i "$in" -ar 48000 -ac 1 "$tmp"
lufs=$(ffmpeg -hide_banner -i "$tmp" -af ebur128=framelog=quiet -f null - 2>&1 | awk '/Integrated loudness/{f=1} f&&/I:/{print $2; exit}')
gain=$(python3 -c "print(round(-16 - ($lufs), 2))")
ffmpeg -loglevel error -y -i "$tmp" -af "volume=${gain}dB,alimiter=limit=0.89:level=false" -ar 48000 -ac 1 "$out"
rm -f "$tmp"
echo "$(basename "$out") ${lufs} LUFS -> gain ${gain} dB"
