import { STAMP_T } from './act';
import { K, T } from './shots';
import { L0, L1, w } from './timing';

// The sound effects, keyed to the same frames as the picture. [frame, effect, gain, pan]. No music.
// Effects are synthesised (films/hudoo/tools/synth.py plus a few in tools/mix.py); none repeats back to back.
const hit = (t0: number, speed = 1) => t0 + Math.round(STAMP_T.press / speed);
export const CUES: [number, string, number, number][] = [
  [8, 'ding', 0.32, 0.1], [30 + 10, 'tap', 0.32, 0.2],
  [T.into - 14, 'whoosh', 0.3, 0],
  [w(3, 8), 'buzzlet', 0.22, -0.5],
  [T.monitor, 'click', 0.2, -0.3], [w(4, 6), 'pop', 0.22, 0.3],
  [T.card1 + 6, 'thunk', 0.42, 0.45], [T.card1 + 24, 'page', 0.3, 0.35], [hit(K.card1Stamp0), 'stamp', 0.55, 0.25],
  [w(6, 0), 'type', 0.22, 0], [w(6, 2), 'erase', 0.22, 0], [w(6, 3) - 4, 'type', 0.18, 0.05], [w(6, 5), 'tick', 0.16, 0], [w(6, 6), 'click', 0.16, 0],
  [w(7, 1), 'spin', 0.24, -0.2],
  [w(7, 4), 'erase', 0.2, 0], [w(7, 5), 'swish', 0.3, 0],
  [T.wince + 10, 'beep', 0.34, -0.45],
  [T.card2 + 6, 'thunk', 0.38, 0.45], [T.card2 + 24, 'page', 0.26, 0.4], [T.card2 + 30, 'page', 0.16, 0.3],
  [T.policy + 2, 'pen', 0.32, 0.3], [K.policyToss, 'swish', 0.28, -0.4], [K.policyToss + 22, 'tap', 0.2, -0.7], [hit(K.policyStamp0, 1.3), 'stamp', 0.6, 0.3],
  [L1(10) + 10, 'buzz', 0.28, -0.5], [L1(10) + 32, 'buzz', 0.34, -0.5],
  [T.flood + 4, 'bang', 0.3, 0.4], [T.flood + 6, 'rumble', 0.32, 0.2], ...[14, 30, 46, 62, 80, 100, 122].map((d, i): [number, string, number, number] => [T.flood + d, 'page', 0.14 + (i % 3) * 0.03, (i % 2 ? -0.4 : 0.4)]),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i): [number, string, number, number] => [T.flood + 8 + i * 24, 'tap', 0.18, 0.2]),
  [w(12, 0), 'flip', 0.36, 0], [w(12, 0) + 18, 'chime', 0.2, 0],
  ...[0, 1, 2, 3, 4].map((i): [number, string, number, number] => [w(12, 2) + i * 16, 'page', 0.18, (i % 2 ? 0.3 : -0.3)]), [w(12, 6), 'rumble', 0.2, 0],
  [L1(12) + 16, 'tap', 0.2, 0.2], [L1(12) + 44, 'tap', 0.18, 0.2],
  [T.out, 'rewind', 0.26, 0],
  [L0(13), 'vibrate', 0.42, -0.2], [w(13, 3), 'tap', 0.16, -0.2],
  [T.msg + 6, 'pop', 0.28, 0], [w(13, 7), 'pop', 0.22, 0],
  [T.beat + 12, 'tick', 0.2, 0.5], [T.beat + 48, 'tick', 0.2, 0.5], [T.beat + 84, 'tick', 0.18, 0.5],
  [K.cA, 'thunk', 0.34, 0.45], [K.cB, 'thunk', 0.3, 0.45], [K.catchA, 'page', 0.24, 0.3], [K.catchB, 'page', 0.22, -0.3], [hit(K.aStamp0, 1.25), 'stamp', 0.6, 0.3],
  [w(17, 1) - 8, 'click', 0.18, 0], [w(17, 1) + 2, 'swish', 0.28, 0], [w(17, 3) - 4, 'pop', 0.26, -0.2],
  [T.fix + 12, 'type', 0.16, 0.2], [K.fixClick, 'click', 0.3, 0.2], [K.fixClick + 34, 'chime', 0.18, 0.2],
  [K.binDrop + 6, 'page', 0.26, -0.4], [K.binDrop + 12, 'tap', 0.18, -0.4],
  [K.buzz0, 'buzz', 0.3, -0.6], [K.buzz0 + 30, 'buzz', 0.3, -0.6], [K.put, 'clink', 0.4, -0.6], [K.put + 14, 'muffled', 0.22, -0.6],
  [K.back + 30, 'ding', 0.26, -0.5],
];
export const LEAD = 0;
void L0;
