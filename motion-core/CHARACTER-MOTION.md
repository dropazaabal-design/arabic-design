# Baseera Motion Core — Character Motion + Semantic Direction

## What is implemented
- `src/character-rig.ts` — deterministic faceless body pose with articulated arms,
  head, legs, walking gait, thoughtful hesitation, pointing and emphasis.
- `src/semantic-director.ts` — turns **explicitly authored semantic cues** into
  timed `SemanticBeat` objects anchored to existing Whisper word IDs.
- `src/CharacterActor.tsx` — SVG actor with 3 visual treatments (doodle,
  editorial, minimal), two orientations and three movement temperaments.
- `demo/CharacterStory.tsx` — 11-second **two-actor** demonstration using original
  tracked voice and aligned Arabic narration, without changing the published reel.
- `tests/character.test.mjs` — regression tests for pose recovery, gaits, 
  determinism, multiple actors and validation.

## Production model
Aligned words -> deliberately specified story cues -> directStory() ->
compileMotionPlan() -> characterPose() -> CharacterActor (Remotion TSX) ->
MP4/FFmpeg QA.

**Semantic honesty**: directStory() applies known direction types. It is NOT
an autonomous model that understands text or chooses screenplay angles.
A planner/creative director must first specify actor, wordId and direction.
This contract makes future AI integration testable rather than unpredictable.

## Validation
```sh
cd motion-core
npm install
npm test
npm run typecheck
npm run story:render:full
```
GitHub Actions workflow `Baseera Character Motion and Semantic Director`
renders **1080x1920, 30fps**, checks 330 frames and H.264/AAC and uploads
the MP4 plus a 6-frame contact sheet. Do not claim visual parity with Claude
or release readiness solely from a technical pass. A human must review the
actual video, Arabic letter forms, character choreography, scene flow and sound.

## Next after human review
Replace the demonstration's deliberately minimalist actors with polished
reusable silhouette and prop rigs. Then add an optional narrative planner that
proposes cues from text, with explicit review and validation before rendering.
