# Baseera Motion A+C — first audio-linked Remotion smoke

This is **not a replacement** for the existing reel. It reuses the tracked
`reels/clear-thinking-pause/public/voice/voice.wav`, its Cairo font and
`src/words.json`, without modifying those files.

- Demo composition: 11 seconds / 330 frames / 1080 × 1920 / 30 fps.
- Real voice and word anchors: existing Whisper alignment.
- Reusable character rig: `SemanticCharacter`.
- Real SVG path drawing: `@remotion/paths`.
- Word-linked GSAP title: `@remotion/gsap`.
- Arabic word captions: `@remotion/captions` data conversion plus TSX renderer.

Run from `motion-core`: `npm install && npm test && npm run typecheck && npm run smoke:render`.

The automated render uses scale 0.5 for CI speed (540 × 960). A full-resolution
quality review is a separate acceptance step. **No visual or audiovisual parity
is claimed until the CI render and a human review succeed.**


## Full-HD validation gate (proposed PR)

From `motion-core`, run `npm run smoke:render:full` to render the same
11-second word-synchronized scene at the actual **1080×1920 resolution**.
The dedicated workflow `Baseera Motion Full HD validation` checks the
video H.264 and audio AAC tracks, 330 video frames at 30fps, approximate
11-second container duration, and error-free full-media decoding.

It also produces `demo/output/contact-sheet.png`, a 3×2 overview of
frames sampled every two seconds. Review the uploaded MP4 and contact
sheet for animation cohesion, Arabic shaping, legibility and transitions.
Passing automated tests **does not certify creative quality**, visual
rhythm or perceived speech synchrony.
