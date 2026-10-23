import { L0, L1, sceneStart, w } from './timing';

// Light sound effects on visible actions: [frame, effect (films/hudoo/tools/synth.py), gain, pan]. No music.
export type Cue = [number, string, number, number];
export const CUES: Cue[] = [
  [w(1, 3) - 4, 'pop', 0.22, -0.3],                 // «قريته؟»
  [w(1, 10), 'pop', 0.1, 0.3],                      // the sweat drop
  [sceneStart(2), 'whoosh', 0.22, 0],               // curtains and spotlight
  [w(2, 1) - 6, 'swish', 0.16, 0],                  // the mask goes up
  [w(3, 1) - 4, 'ding', 0.16, 0],                   // the idea
  [w(3, 7) - 4, 'pop', 0.2, 0],                     // «تصرّف كأنّك»
  [w(4, 0), 'pop', 0.14, 0.3],                      // the thought bubble
  [w(4, 6), 'chair', 0.3, -0.2],                    // he gets up
  [w(4, 9) - 4, 'stamp', 0.24, 0],                  // the badge goes on
  [w(4, 10) - 4, 'click', 0.18, 0.4],               // the clock
  [sceneStart(5), 'steps', 0.18, 0],                // running
  [w(5, 1) - 6, 'page', 0.2, 0.4], [w(5, 2) - 6, 'page', 0.2, 0.4],
  [w(6, 0), 'rewind', 0.16, 0.4],                   // the days roll to 14
  [w(6, 2) - 6, 'swish', 0.2, -0.2],                // the badge falls off
  ...Array.from({ length: 4 }, (_, k): Cue => [w(7, 6) + k * 14, 'click', 0.1, 0.3]), // ticks filling
  [w(8, 0) - 6, 'swish', 0.16, 0.4], [w(8, 5) - 6, 'swish', 0.16, -0.4],
  [w(9, 1) - 4, 'chime', 0.14, 0.3],                // the future self appears
  [L1(9) + 4, 'pop', 0.2, 0.3],                     // he steps into him
  [L0(10) - 4, 'pop', 0.22, 0],                     // the question
];
