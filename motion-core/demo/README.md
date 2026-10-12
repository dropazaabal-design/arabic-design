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
