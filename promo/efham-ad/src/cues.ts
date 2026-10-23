import { L0, S, w } from './timing';

// Sound effects, each on the frame of the action it belongs to (the same formulas the scenes use).
// [frame, effect (films/hudoo/tools/synth.py), gain, pan −1..1]. No music: light, soft sounds only.
export type Cue = [number, string, number, number];

const n99 = w(4, 0);
const tracks = [w(5, 0), w(5, 1), w(5, 2), w(5, 4), w(5, 5), w(5, 6)];
const act = [w(7, 0), w(7, 2), w(7, 3)];

export const CUES: Cue[] = [
  // 1: the camera pulls back from the bookmark; three soft steps; the hand reaches
  [14, 'whoosh', 0.2, 0],
  [40, 'tap', 0.1, -0.5], [66, 'tap', 0.1, -0.45], [92, 'tap', 0.1, -0.4],
  [138, 'click', 0.14, -0.3],
  // 2: the pile withdraws; the line draws
  [S.s2 + 8, 'swish', 0.16, 0.3], [S.s2 + 16, 'swish', 0.14, -0.2], [S.s2 + 24, 'swish', 0.12, 0.1],
  [S.s2 + 46, 'whoosh', 0.22, 0.2],
  // 3: the covers come out of the line and land; 99 lands; the files label
  [S.s3 + 4, 'whoosh', 0.26, -0.3],
  ...[0, 1, 2, 3, 4, 5].map((i): Cue => [S.s3 + 6 + i * 6 + 32, 'pop', 0.1, (2.5 - i) / 4]),
  [n99 + 40, 'chime', 0.18, 0],
  [S.s3 + 74, 'click', 0.12, 0],
  // 4: the fan files into the grid; one soft click per track as the line reaches it; the pick
  [S.s4 + 4, 'swish', 0.2, 0],
  ...tracks.map((t, i): Cue => [t, 'click', 0.13, [0.4, 0, -0.4][i % 3]]),
  [w(6, 2), 'pop', 0.24, 0],
  // 5: the cover moves and opens; pages turn; the step lifts out
  [S.s5 + 2, 'whoosh', 0.2, 0],
  [S.s5 + 42, 'page', 0.38, 0.3],
  [act[1] + 18 - 44, 'page', 0.34, 0.3],
  [act[2] + 18 - 44, 'page', 0.34, 0.3],
  ...act.map((t, k): Cue => [t - 4, 'click', 0.11, [0.4, 0, -0.4][k]]),
  [act[2] + 12, 'pop', 0.26, 0],
  // the page pulls back to show itself whole before it goes into the phone (scenes.tsx docShots: S.s6 + 8, over 40 frames)
  [S.s6 - 32, 'swish', 0.14, 0.2],
  // 6: the card goes into the phone; tap; the file opens; the terms
  [S.s6 - 6, 'whoosh', 0.18, 0],
  [w(8, 4) - 6, 'tap', 0.32, 0],
  [w(8, 5) + 2, 'swish', 0.16, -0.2],
  [w(8, 6) - 2, 'click', 0.12, 0.3], [w(8, 8) - 2, 'click', 0.12, -0.3],
  // 7: the covers rise; the button; the address
  [S.s7 + 18, 'whoosh', 0.2, 0],
  [L0(10) - 4, 'pop', 0.26, 0],
  [w(10, 2) - 6, 'chime', 0.2, 0],
];
