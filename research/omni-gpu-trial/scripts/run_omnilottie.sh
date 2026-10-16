#!/usr/bin/env bash
# OmniLottie on the story's inputs: text (3 prompts), text + image (Naser, the clock) and video (the 10 s test
# shot), 4 candidates each where the script allows it. GPU memory is sampled every second.
set -euo pipefail
WORK=${WORK:-/workspace/omni}; TRIAL=${TRIAL:-$WORK/trial}
cd "$WORK/OmniLottie"; source "$WORK/env-OmniLottie/bin/activate"
W="$WORK/weights/OmniLottie"; O="$WORK/out/lottie"; mkdir -p "$O/imgtext-naser" "$WORK/logs"
nvidia-smi --query-gpu=timestamp,memory.used,utilization.gpu --format=csv -l 1 > "$WORK/logs/gpu-omnilottie.csv" & GPU=$!
trap 'kill $GPU' EXIT
run() { local name=$1; shift; /usr/bin/time -v -o "$WORK/logs/omnilottie-$name.time" python inference.py --sketch_weight "$W" --num_candidates 4 --output_dir "$O/$name" "$@" 2>&1 | tee "$WORK/logs/omnilottie-$name.log"; }
n=0; while IFS= read -r p; do n=$((n+1)); run "text$n" --single_text "$p"; done < "$TRIAL/scripts/prompts_lottie.txt"
run image-naser --single_image "$TRIAL/inputs/svg/naser.png"
run image-clock --single_image "$TRIAL/inputs/svg/clock.png"
run video-testshot --single_video "$TRIAL/inputs/test_shot_540x960.mp4"
# image + an instruction needs the HF-format script (one result per call, so it is called 4 times)
for k in 1 2 3 4; do
  /usr/bin/time -v -o "$WORK/logs/omnilottie-imgtext-naser-$k.time" python inference_hf.py --model_path "$W" --image "$TRIAL/inputs/svg/naser.png" \
    --text "the man raises his right hand to wave, then looks surprised" --output "$O/imgtext-naser/$k.json" 2>&1 | tee "$WORK/logs/omnilottie-imgtext-naser-$k.log"
done
