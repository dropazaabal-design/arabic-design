#!/usr/bin/env bash
# OmniSVG on the story's inputs: text-to-SVG (4 prompts) and image-to-SVG (4 reference drawings), 4 candidates
# each, for every model size whose weights are present. GPU memory is sampled every second.
set -euo pipefail
WORK=${WORK:-/workspace/omni}; TRIAL=${TRIAL:-$WORK/trial}   # TRIAL = this folder (research/omni-gpu-trial), copied to the box
cd "$WORK/OmniSVG"; source "$WORK/env-OmniSVG/bin/activate"
mkdir -p "$WORK/out/svg" "$WORK/logs"
nvidia-smi --query-gpu=timestamp,memory.used,utilization.gpu --format=csv -l 1 > "$WORK/logs/gpu-omnisvg.csv" & GPU=$!
trap 'kill $GPU' EXIT
for size in 4B 8B; do
  [ -d "$WORK/weights/OmniSVG1.1_$size" ] || continue
  for task in text image; do
    in=$([ $task = text ] && echo "$TRIAL/scripts/prompts_svg.txt" || echo "$TRIAL/inputs/svg")
    /usr/bin/time -v -o "$WORK/logs/omnisvg-$size-$task.time" \
      python inference.py --task "$task-to-svg" --input "$in" --output "$WORK/out/svg/$size-$task" \
        --model-size "$size" --num-candidates 4 --save-png --save-all-candidates 2>&1 | tee "$WORK/logs/omnisvg-$size-$task.log"
  done
done
