#!/usr/bin/env bash
# One rented GPU box, Linux + NVIDIA driver for CUDA 12.x. 48 GB VRAM (L40S) runs all three models;
# 24 GB (RTX 4090) runs OmniSVG 4B and OmniLottie only. Needs ~120 GB disk. Logs everything it does.
set -euo pipefail
WORK=${WORK:-/workspace/omni}
mkdir -p "$WORK"/{logs,licenses,weights}
cd "$WORK"
exec > >(tee -a logs/setup.log) 2>&1
date -u; nvidia-smi; df -h "$WORK"; nproc; free -g

apt-get update && apt-get install -y --no-install-recommends libcairo2 libcairo2-dev ffmpeg git git-lfs
pip install -q uv huggingface-hub

# code, pinned to the commit we test
for r in OmniSVG/OmniSVG OpenVGLab/OmniLottie; do
  d=$(basename "$r"); [ -d "$d" ] || git clone --depth 1 "https://github.com/$r" "$d"
  echo "$r $(git -C "$d" rev-parse HEAD)" >> logs/commits.txt
done

# one venv per project, as each README asks (python 3.10, torch 2.3.0 + cu121)
for d in OmniSVG OmniLottie; do
  uv venv -p 3.10 "env-$d"
  VIRTUAL_ENV="$PWD/env-$d" uv pip install torch==2.3.0+cu121 torchvision==0.18.0+cu121 --index-url https://download.pytorch.org/whl/cu121
  VIRTUAL_ENV="$PWD/env-$d" uv pip install -r "$d/requirements.txt" huggingface-hub
done

# weights (8B only if the card has the memory for it)
VRAM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -1)
MODELS="OmniSVG/OmniSVG1.1_4B OmniLottie/OmniLottie"
[ "$VRAM" -ge 30000 ] && MODELS="$MODELS OmniSVG/OmniSVG1.1_8B"
for m in $MODELS; do
  /usr/bin/time -f "$m download %e s" huggingface-cli download "$m" --local-dir "weights/$(basename "$m")"
  # the licence each weight repo actually declares, kept with the results
  for f in LICENSE LICENSE.md LICENSE.txt README.md; do [ -f "weights/$(basename "$m")/$f" ] && cp "weights/$(basename "$m")/$f" "licenses/$(basename "$m")-$f"; done
done
du -sh weights/*; echo "setup done"; date -u
