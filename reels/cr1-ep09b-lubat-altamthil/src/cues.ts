import { L1, sceneStart, w } from './timing';

// Light sound effects on visible actions: [frame, effect (films/hudoo/tools/synth.py), gain, pan]. No music.
export type Cue = [number, string, number, number];
export const CUES: Cue[] = [
  [w(1, 3) - 4, 'swish', 0.18, 0],                  // the mask turns into a face
  [w(2, 5) - 6, 'pop', 0.14, -0.3],                 // the praise bubble
  [w(2, 9) - 4, 'pop', 0.2, 0.3],                   // «إيه قريته»
  [w(3, 2), 'erase', 0.08, -0.2],                   // the cobweb
  [w(4, 2) - 4, 'swish', 0.16, -0.3],               // the friend turns
  [w(4, 4) - 6, 'pop', 0.22, -0.2],                 // the question
  [w(4, 6), 'pop', 0.1, 0.3],                       // the sweat drop
  [w(5, 4) - 6, 'whoosh', 0.16, 0],                 // night falls
  [w(5, 5), 'click', 0.08, -0.4], [w(5, 5) + 30, 'click', 0.08, -0.4], [w(5, 5) + 60, 'click', 0.08, -0.4],
  [w(6, 1) - 6, 'page', 0.2, 0.3], [w(6, 3) - 6, 'page', 0.2, 0.3], [w(6, 5) - 6, 'stamp', 0.2, 0.3],
  [w(7, 3) - 6, 'chair', 0.26, 0.3],                // he stands up
  [w(7, 5), 'laugh', 0.08, -0.3],                   // the friends react
  [w(8, 6) - 4, 'swish', 0.18, 0],                  // the mask comes down
  [sceneStart(9), 'steps', 0.14, 0],
  [w(9, 3) - 4, 'pen', 0.14, 0],                    // the strike-through
  [w(9, 5) - 4, 'tap', 0.2, -0.4],                  // the mask splits
  [w(10, 3) - 4, 'chime', 0.14, 0.3],               // the future self appears
  [w(11, 0), 'steps', 0.14, 0],
  [w(11, 4) - 6, 'pop', 0.16, 0.3], [w(11, 5) - 6, 'pop', 0.16, 0], [w(11, 6) - 6, 'pop', 0.16, -0.3],
  [w(12, 5) - 4, 'whoosh', 0.12, 0],                // the mask fades
  [w(12, 7) - 4, 'ding', 0.18, 0.3],                // he becomes him
  [L1(12) + 30, 'click', 0.06, 0],
];
