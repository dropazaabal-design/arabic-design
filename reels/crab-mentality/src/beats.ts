import { TL, sceneStart, segAt, segEnd, segStart, sec } from './time';

// Every beat in frames, anchored to the measured voice. Scenes read these;
// nothing below is a hand-typed second.
export const F = {
  s2: sceneStart(2), s3: sceneStart(3), s4: sceneStart(4), s5: sceneStart(5),
  s6: sceneStart(6), s7: sceneStart(7), s8: sceneStart(8), end: TL.durationInFrames,
};

const grab = Math.max(sec(1.25), Math.min(sec(1.9), segAt('s1', 0.5)));
export const B = {
  // 1 — one attempt: climb, hold, grab, strain, yank, reaction
  climbEnd: grab - 10,
  grab,
  strain: grab + 5,
  yank: grab + 16,
  yankEnd: grab + 26,
  slip: grab + 40,
  // 2 — the open top, the pull from inside, the name
  open: segStart('s2'),
  inside: segAt('s2', 0.48),
  name: segStart('s3'),
  // 3 — the metaphor
  imagine: segStart('s4'),
  pullAll: segAt('s4', 0.55),
  metaphor: segStart('s5'),
  toCup: segAt('s5', 0.5),
  // 4 — learning
  learn: segStart('s6'),
  doubt: segStart('s7'),
  slam: segAt('s7', 0.78),
  // 5 — project
  build: segStart('s8'),
  shrink: segStart('s9'),
  crush: segAt('s9', 0.45),
  // 6 — advice vs discouragement
  warn: segStart('s10'),
  advise: segStart('s11'),
  fix: segAt('s11', 0.35),
  stop: segStart('s12'),
  // 7 — three steps build the way
  how: segStart('s13'),
  st1: segStart('s14'),
  st2: segStart('s15'),
  st3: segStart('s16'),
  watch: segStart('s17'),
  // 8 — out
  stumble: segStart('s18'),
  adjust: segAt('s18', 0.45),
  goOn: segAt('s18', 0.8),
  out: segStart('s19'),
  final: segAt('s19', 0.5),
  s19end: segEnd('s19'),
};
