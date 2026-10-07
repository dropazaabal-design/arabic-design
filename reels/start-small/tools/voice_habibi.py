"""Narration with Habibi-TTS, one Specialized checkpoint for every segment.

usage: python voice_habibi.py speak.json ref.wav "<ref transcript>" OUTDIR [--dialect MSA] [--only id,id]

Every segment uses the same reference clip, checkpoint, speed and seed unless a
segment overrides `seed`/`speed`, so the voice stays one voice across files.
habibi-tts 0.1.1's CLI refuses MAR; this loads Specialized/<DIALECT> directly,
the way infer_cli.py loads the others.
"""
import argparse
import json
from importlib.resources import files
from pathlib import Path

import soundfile as sf
import torch
from cached_path import cached_path
from f5_tts.infer.utils_infer import load_model, load_vocoder, preprocess_ref_audio_text
from hydra.utils import get_class
from omegaconf import OmegaConf

from habibi_tts.infer.utils_infer import infer_process

PUNCT = {"،": ",", "؛": ",", "؟": "?"}
STEPS = {"MSA": 200000, "SAU": 200000, "UAE": 100000, "ALG": 100000, "IRQ": 100000, "EGY": 100000, "MAR": 100000}

ap = argparse.ArgumentParser()
ap.add_argument("speak_file")
ap.add_argument("ref_audio")
ap.add_argument("ref_text")
ap.add_argument("out_dir")
ap.add_argument("--dialect", default="MSA", choices=sorted(STEPS))
ap.add_argument("--only", default="")
ap.add_argument("--speed", type=float, default=1.0)
ap.add_argument("--seed", type=int, default=7)
args = ap.parse_args()
only = set(filter(None, args.only.split(",")))
out = Path(args.out_dir)
out.mkdir(parents=True, exist_ok=True)

cfg = OmegaConf.load(str(files("f5_tts").joinpath("configs/F5TTS_v1_Base.yaml")))
model_cls = get_class(f"f5_tts.model.{cfg.model.backbone}")
base = f"hf://SWivid/Habibi-TTS/Specialized/{args.dialect}"
ckpt = str(cached_path(f"{base}/model_{STEPS[args.dialect]}.safetensors"))
vocab = str(cached_path(f"{base}/vocab.txt"))
mel = cfg.model.mel_spec.mel_spec_type
model = load_model(model_cls, cfg.model.arch, ckpt, mel_spec_type=mel, vocab_file=vocab, device="cpu")
vocoder = load_vocoder(vocoder_name=mel, device="cpu")

known = set(Path(vocab).read_text(encoding="utf-8").splitlines())
ref_audio, ref_text = preprocess_ref_audio_text(args.ref_audio, args.ref_text)

for seg in json.loads(Path(args.speak_file).read_text(encoding="utf-8")):
    name = seg.get("out", seg["id"])
    if only and name not in only and seg["id"] not in only:
        continue
    # Arabic punctuation the checkpoint never saw becomes the ASCII mark it did see,
    # so commas and questions still shape the pauses; marks it cannot read are removed.
    text = "".join(c if c in known or c.isspace() else PUNCT.get(c, "") for c in seg["speak"])
    unknown = sorted({c for c in seg["speak"] if c not in known and not c.isspace() and c not in PUNCT})
    if unknown:
        print(f"{name}: removed (not in the {args.dialect} vocab): {unknown}", flush=True)
    torch.manual_seed(seg.get("seed", args.seed))
    wav, sr, _ = infer_process(ref_audio, ref_text, text, model, vocoder, mel_spec_type=mel,
                               speed=seg.get("speed", args.speed), device="cpu", dialect_id=None)
    sf.write(out / f"{name}.wav", wav, sr)
    print(f"{name}: {len(wav) / sr:.2f}s", flush=True)
