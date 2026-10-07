"""Narration with Habibi-TTS, Specialized MAR checkpoint.

habibi-tts 0.1.1's CLI rejects MAR (its dialect assert omits it), although the
Hub ships Specialized/MAR/model_100000.safetensors. This loads that checkpoint
exactly as infer_cli.py loads the other specialized ones.

usage: python voice_habibi.py speak.json ref.wav "<ref transcript>" OUTDIR
"""
import json
import sys
from importlib.resources import files
from pathlib import Path

import soundfile as sf
import torch
from cached_path import cached_path
from f5_tts.infer.utils_infer import load_model, load_vocoder, preprocess_ref_audio_text
from hydra.utils import get_class
from omegaconf import OmegaConf

from habibi_tts.infer.utils_infer import infer_process

speak_file, ref_audio, ref_text, out_dir = sys.argv[1:5]
only = set(sys.argv[5].split(",")) if len(sys.argv) > 5 else None
out = Path(out_dir)
out.mkdir(parents=True, exist_ok=True)

cfg = OmegaConf.load(str(files("f5_tts").joinpath("configs/F5TTS_v1_Base.yaml")))
model_cls = get_class(f"f5_tts.model.{cfg.model.backbone}")
ckpt = str(cached_path("hf://SWivid/Habibi-TTS/Specialized/MAR/model_100000.safetensors"))
vocab = str(cached_path("hf://SWivid/Habibi-TTS/Specialized/MAR/vocab.txt"))
model = load_model(model_cls, cfg.model.arch, ckpt, mel_spec_type=cfg.model.mel_spec.mel_spec_type, vocab_file=vocab, device="cpu")
vocoder = load_vocoder(vocoder_name=cfg.model.mel_spec.mel_spec_type, device="cpu")

known = set(Path(vocab).read_text(encoding="utf-8").splitlines())
ref_audio, ref_text = preprocess_ref_audio_text(ref_audio, ref_text)

for seg in json.loads(Path(speak_file).read_text(encoding="utf-8")):
    name = seg.get("out", seg["id"])
    if only and name not in only:
        continue
    text = seg["speak"]
    unknown = sorted({c for c in text if c not in known and not c.isspace()})
    if unknown:
        print(f"{seg['id']}: not in vocab, dropped by the model: {unknown}", flush=True)
    torch.manual_seed(seg.get("seed", 7))
    wav, sr, _ = infer_process(ref_audio, ref_text, text, model, vocoder, mel_spec_type=cfg.model.mel_spec.mel_spec_type,
                               speed=seg.get("speed", 0.95), device="cpu", dialect_id=None)
    sf.write(out / f"{name}.wav", wav, sr)
    print(f"{name}: {len(wav) / sr:.2f}s", flush=True)
