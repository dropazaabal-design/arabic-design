import { TL, sceneStart, segAt, segEnd, segStart } from './time';

// Every beat in frames, anchored to the measured voice.
export const F = {
  s2: sceneStart(2), s3: sceneStart(3), s4: sceneStart(4), s5: sceneStart(5),
  s6: sceneStart(6), s7: sceneStart(7), s8: sceneStart(8), end: TL.durationInFrames,
};

export const B = {
  // 1 — the notebook opens, the list unfolds, quick ticks then slow
  open: 3, unfold: 12,
  // 2 — three ambitions leave the list; «من بكرة»
  sport: segAt('s2', 0.02), read: segAt('s2', 0.2), work: segAt('s2', 0.38), tomorrow: segAt('s2', 0.62),
  // 3 — the wall, the push, days pass, the stop
  wall: segStart('s3'), days: segAt('s3', 0.25), stop: segAt('s3', 0.75),
  tooBig: segStart('s4'), drain: segAt('s4', 0.45),
  // 4 — shrink it
  shrink: segStart('s5'), pages: segAt('s6', 0.15), twoPages: segAt('s6', 0.65),
  exercise: segAt('s7', 0.15), oneShoe: segAt('s7', 0.7),
  // 5 — a time, and the tools ready before it
  setTime: segStart('s8'), tools: segAt('s8', 0.5),
  // 6 — the missed day
  missDay: segStart('s9'), comeBack: segAt('s9', 0.55),
  // 7 — one more step
  easier: segStart('s10'), addStep: segAt('s10', 0.6),
  // 8 — no need for everything today; one clear thing
  notAll: segStart('s11'), clear: segStart('s12'), final: segAt('s12', 0.45), s12end: segEnd('s12'),
};
