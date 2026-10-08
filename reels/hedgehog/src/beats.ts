import { TL, sceneStart, segAt, segEnd, segStart } from './time';

// Every beat in frames, anchored to the measured voice.
export const F = {
  s2: sceneStart(2), s3: sceneStart(3), s4: sceneStart(4), s5: sceneStart(5), s6: sceneStart(6), s7: sceneStart(7),
  end: TL.durationInFrames,
};

export const B = {
  // 1 — two hedgehogs shuffle together for warmth, touch, get pricked, jump apart; the book of the story opens
  touch: segAt('s1', 0.58), ouch: segAt('s1', 0.8), book: segStart('s2'),
  // 2 — a cold night; the group huddles, warms, squeezes, pricks
  cold: segStart('s3'), huddle: segAt('s3', 0.45), squeeze: segAt('s4', 0.2), prick: segAt('s4', 0.55),
  // 3 — apart and cold again; in and out; the warm distance
  apart: segStart('s5'), coldBack: segAt('s5', 0.6), in1: segAt('s6', 0.05), out1: segAt('s6', 0.25), settle: segAt('s6', 0.5), found: segAt('s6', 0.75),
  // 4 — the distance meter
  meter: segStart('s7'), warmZone: segAt('s7', 0.35), redZone: segAt('s7', 0.7), back: segEnd('s7'),
  // 5 — the phone and the soft bubble
  room: segStart('s8'), love: segAt('s8', 0.3), peek: segAt('s8', 0.6), bubble: segAt('s8', 0.85), bump: segStart('s9'), space: segAt('s9', 0.55),
  // 6 — two houses, a visit at an agreed time, the gentle fence
  visit: segStart('s10'), walk: segAt('s10', 0.2), clock: segAt('s10', 0.6), door: segAt('s10', 0.85), fence: segStart('s11'), hearts: segAt('s11', 0.3),
  // 7 — the warm distance; save
  close: segStart('s12'), save: segAt('s12', 0.15), s12end: segEnd('s12'),
};
