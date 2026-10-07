"""Speak as «نديم — صوت كتاب وبس» (kitabwbs_nadeem).

Everything that makes the voice — engine, model, reference clip, direction
presets, seed, pauses — is read from profile.json beside this file, so every
reel loads the same identity instead of choosing a voice again.

usage:
  python speak.py LINES.json OUTDIR [--direction B] [--only s1,s2]
LINES.json: [{"id": "s1", "text": "…", "direction": "A"?, "seed": 7?}, …]
Each line is generated sentence by sentence and joined with the profile's
pauses (longer after a question or an ellipsis than after a comma).
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

HERE = Path(__file__).resolve().parent
profile = json.loads((HERE / "profile.json").read_text(encoding="utf-8"))

ap = argparse.ArgumentParser()
ap.add_argument("lines")
ap.add_argument("out_dir")
ap.add_argument("--direction", default=profile.get("selected", {}).get("direction") or "A")
ap.add_argument("--only", default="")
args = ap.parse_args()

ref = HERE / profile["reference"]["file"]
digest = hashlib.sha256(ref.read_bytes()).hexdigest()
if digest != profile["reference"]["sha256"]:
    raise SystemExit(f"reference.wav changed ({digest[:12]}…): this would be a different voice")

from chatterbox.mtl_tts import ChatterboxMultilingualTTS  # noqa: E402

model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
model.prepare_conditionals(str(ref), exaggeration=profile["directions"][args.direction]["exaggeration"])
sr = model.sr
pauses = profile["pauses"]

# Split after . ? ! … ؟ keeping the mark; commas stay inside the sentence.
SPLIT = re.compile(r"(?<=[.!?؟…])\s+")


def pause_after(sentence: str) -> float:
    end = sentence.strip()[-1:]
    return pauses["question"] if end in "?؟" else pauses["ellipsis"] if end == "…" else pauses["full_stop"]


only = set(filter(None, args.only.split(",")))
out = Path(args.out_dir)
out.mkdir(parents=True, exist_ok=True)
for line in json.loads(Path(args.lines).read_text(encoding="utf-8")):
    if only and line["id"] not in only:
        continue
    d = profile["directions"][line.get("direction", args.direction)]
    parts = [p for p in SPLIT.split(line["text"].strip()) if p]
    audio = []
    for i, part in enumerate(parts):
        torch.manual_seed(line.get("seed", profile["seed"]) + i)
        wav = model.generate(part, language_id=profile["language_id"], exaggeration=d["exaggeration"],
                             cfg_weight=d["cfg_weight"], temperature=d["temperature"]).squeeze(0).numpy()
        audio.append(wav)
        if i < len(parts) - 1:
            audio.append(np.zeros(int(sr * pause_after(part)), dtype=wav.dtype))
    full = np.concatenate(audio)
    sf.write(out / f"{line.get('out', line['id'])}.wav", full, sr)
    print(f"{line.get('out', line['id'])}: {len(full) / sr:.2f}s ({len(parts)} sentences, direction {line.get('direction', args.direction)})", flush=True)
