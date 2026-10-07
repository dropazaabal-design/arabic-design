import { TL, sceneStart, segAt, segEnd, segStart } from './time';

// Every beat in frames, anchored to the measured voice.
export const F = {
  s2: sceneStart(2), s3: sceneStart(3), s4: sceneStart(4), s5: sceneStart(5), s6: sceneStart(6), s7: sceneStart(7),
  end: TL.durationInFrames,
};

export const B = {
  // 1 — the saying: one stands up, one draws, the rest bow; then «ليش العادي يسكت؟»
  rebel: segAt('s1', 0.12), creative: segAt('s1', 0.36), bow: segAt('s1', 0.6), why: segStart('s2'),
  // 2 — Asch's cards; alone, the answer is obvious
  board: segStart('s3'), lines: segAt('s3', 0.4), alone: segStart('s4'), aloneAns: segAt('s4', 0.45),
  // 3 — the group answers wrong, one by one; he gives in; three of four
  group: segStart('s5'), wrongFrom: segAt('s5', 0.18), wrongTo: segAt('s5', 0.8), cave: segEnd('s5'),
  stat: segStart('s6'), statFrom: segAt('s6', 0.12), statTo: segAt('s6', 0.62),
  // 4 — the voices pile on him
  pileFrom: segAt('s7', 0.02), pileTo: segAt('s7', 0.75),
  // 5 — the smart one asks «ليش؟»; the creative one draws another way
  ask: segAt('s8', 0.08), askDraw: segAt('s8', 0.18), alt: segAt('s8', 0.55), altDraw: segAt('s8', 0.62), s8end: segEnd('s8'),
  // 6 — one voice says the right answer; conformity drops
  room: segStart('s9'), greyFrom: segAt('s9', 0.08), greyTo: segAt('s9', 0.4), partner: segAt('s9', 0.62), stand: segAt('s9', 0.86),
  bar: segStart('s10'), drop: segAt('s10', 0.35),
  // 7 — the door
  door: segStart('s11'), open: segAt('s11', 0.3), s11end: segEnd('s11'), sign: segStart('s12'),
};
