#!/bin/bash
# usage: tools/normalize-voice.sh IN.wav OUT.wav [TEMPO]
# Applies one static gain so the segment measures -16 LUFS integrated (same level
# for every segment, no pumping). No trimming: a silence gate clipped soft
# consonants at the edges (the final «ك» of «يساعدك»), and Habibi pads very little.
# TEMPO (default 1) is a pitch-preserving speed-up (ffmpeg atempo); MAXPAUSE
# (seconds, optional) shortens any silence inside the segment to that length.
# The voice profile names the values its identity uses (Nadeem: post).
set -euo pipefail
in=$1; out=$2; tempo=${3:-1}; maxpause=${4:-}
af="atempo=${tempo}"
[ -n "$maxpause" ] && af="silenceremove=stop_periods=-1:stop_duration=${maxpause}:stop_threshold=-42dB:stop_silence=${maxpause},${af}"
tmp=$(mktemp --suffix=.wav)
ffmpeg -loglevel error -y -i "$in" -af "$af" -ar 48000 -ac 1 "$tmp"
lufs=$(ffmpeg -hide_banner -i "$tmp" -af ebur128=framelog=quiet -f null - 2>&1 | awk '/Integrated loudness/{f=1} f&&/I:/{print $2; exit}')
gain=$(python3 -c "print(round(-16 - ($lufs), 2))")
ffmpeg -loglevel error -y -i "$tmp" -af "volume=${gain}dB,alimiter=limit=0.89:level=false" -ar 48000 -ac 1 "$out"
rm -f "$tmp"
echo "$(basename "$out") ${lufs} LUFS -> gain ${gain} dB"
