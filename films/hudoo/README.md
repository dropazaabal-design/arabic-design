# «الهدوء الحقيقي ليس كبتًا للمشاعر: كيف تتحكم في استجابتك دون أن تتخلى عن التعبير عن نفسك؟»

An Arabic 2D stickman film for the «كتاب وبس» audience: 11:50.8, 1920×1080, 60 fps, H.264 + AAC.

It is built entirely in code: React and TypeScript in Remotion 4, with SVG drawing and a single articulated rig. There are no raster images and no stock assets. The picture, the voice, the music and the effects were all made here.

## Contents

| Folder or file | What it holds |
|---|---|
| `RESEARCH.md` | The research behind the content, with links: suppression, reappraisal, acceptance and choosing a behaviour, and what the science does not support. |
| `narrative/` | `script.txt` is the locked, fully vowelled script (what the voice reads, with performance notes). `SCRIPT.md` is the reading script with times and pauses. `shotlist.json` is the 160 shots. `lines.json` is the lines as recorded. |
| `timing/` | `lines.json` (each line's start and end), `words.json` (word times), `shots.json` (shot frames and preview frames), `asr.json` (speech-recognition check of the voice). |
| `characters/` | SVGs for the 9 characters, each full figure with separate parts (Head, Torso, arms, legs, each part's pivot in `<desc>`). Salim also has 20 poses, 18 expressions and 3 views, plus the 10 hands. `rig.json` holds the bones and joints. `sheets/*.png` are reference sheets. |
| `CHARACTER_BIBLE.md` | Proportions, joints, lines and colours, the face from three angles, the expressions, poses, hands, light and shadow, and what may change versus what stays fixed. |
| `backgrounds/` | The 9 places as SVG, with the layers that go in front of and behind the characters in `layers/`. |
| `assets/` | `props/` holds the props, phone screens, bubbles and icons. `metaphors/` holds the 10 visual metaphors. All are SVG. |
| `src/kit/` | The source of everything drawn. `characters/` is the rig, face and hands; `places/`, `props/` and `metaphors/` are the rest. `style.ts` holds the palette, the lines and the hand-drawn wobble. |
| `src/film/` | `engine.tsx` holds the timeline (one shot per line), time against words, the pose and face tracks, the camera and the on-screen text. `Film.tsx` is the whole film with its transitions. `Shot.tsx` is a single shot. |
| `src/scenes/` | The 160 shots in 8 batches (`b1.tsx` … `b8.tsx`), plus shared staging helpers in `common.tsx`. |
| `animation/KIT.md` | How a shot is built: the tools, the anchor points of every place and metaphor, the rules, and the check loop. |
| `audio/` | `sfx/bN.json` cues the effects on words. `mix-report.json` is the mix report. `narration.flac` is the recorded narration: `ffmpeg -i audio/narration.flac audio/narration.wav`, then `tools/mix.py` rebuilds the soundtrack without regenerating the voice. |
| `manifest.json` | Each shot linked to its text, frames, plan, code, the components and SVG files it uses, its word-cued motion, its sounds and its preview. |
| `previews/` | `shots/NNN.png` is one picture per shot. `atlas/` is the numbered storyboard atlas (8 pages and a PDF). |
| `qa/` | `REPORT.md` is the quality report. `checks.json` holds the export checks. `clips/` holds the representative clips. `frames/` holds frames at the chapter boundaries. |
| `export/` | The film, the subtitles (`hudoo.ar.srt`) and the project archive. |

## Running it

Requirements: Node 18+, Python 3 with numpy and Pillow, and ffmpeg. `node_modules` is linked to the shared Remotion install in `reels/cr1-ep04-saa-w-akhallis`.

```sh
npx remotion studio src/index.ts       # browse: Film, FilmSilent, Shot001…Shot160, the reference sheets
python3 tools/script.py voice 1.32     # the voice from script.txt (local Piper model; see below)
python3 tools/timing.py                # narration.wav, line and word timing, the SRT
python3 tools/shots.py                 # shot frames
python3 tools/mix.py                   # soundtrack → public/audio/mix.wav (−16 LUFS, −2 dBTP)
tools/render.sh out/master.mp4         # the film (or a frame range: tools/render.sh qa/clips/x.mp4 0-1376)
python3 tools/qa.py export/hudoo.mp4   # checks → qa/checks.json
node tools/shots.mjs key 1-160         # previews/shots
python3 tools/manifest.py && python3 tools/atlas.py
./tools/export-svg.sh                  # all SVG files from the components
node tools/palette.mjs                 # no yellow, orange or gold anywhere
```

## The voice

The narration is a single voice: Piper `ar_JO-kareem-medium`, run locally through sherpa-onnx 1.13.8 at speed 1.32. It cost nothing.

The models come from the sherpa-onnx releases: `tts-models/vits-piper-ar_JO-kareem-medium.tar.bz2`, plus `asr-models/sherpa-onnx-whisper-small.tar.bz2` for the intelligibility check. Unpack them into `$HUDOO_MODELS` (default `~/.cache/hudoo-models`).

ElevenLabs was priced for the same script and not used, because the cost was beyond the authorised budget (see `qa/REPORT.md`).

Because the timing is computed from the recording, replacing the voice means four steps:
1. Put the new `audio/lines/NNN.wav` files in place, one per line.
2. Run `tools/timing.py`.
3. Run `tools/shots.py` and `tools/mix.py`.
4. Render again.

The shots follow the new times by themselves, because every action is cued on a word, not on a fixed second.

## Reusing it for «بصيرة»

The kit is independent of this story:
- The rig, faces and hands in `src/kit/characters/`.
- The places, props and metaphors.
- The engine in `src/film/engine.tsx`.
- The voice and mix tools.

A new film needs four things:
1. A new `narrative/script.txt` and `shotlist.json`.
2. New `src/scenes/bN.tsx` files.
3. A new cast in `src/kit/characters/cast.ts` if needed: a cast entry is just colours and hairstyle.
4. Running the tools above.
