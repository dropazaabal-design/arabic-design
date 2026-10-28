import { EXPRESSIONS, Expression, ExprName, mixExpr } from '@mukarram/characters/face';
import envelope from '../video/envelope.json';
import { ease, prog } from '../video/time';

// Pose/look tracks and idle motion are reused from reels/mukarram/src/scenes/common.tsx (as reels/boiling-frog
// does); the mouth envelope is this reel's own, and the expression track also takes custom expressions.
export { idle, poseTrack, vecTrack } from '@mukarram/scenes/common';
export type ShotProps = { f: number; t0: number; t1: number };

export const talkAt = (f: number) => {
  const e = envelope as number[];
  const v = Math.max(e[f] ?? 0, (e[f - 1] ?? 0) * 0.7, (e[f + 1] ?? 0) * 0.5);
  return v < 0.12 ? 0 : Math.min(1, (v - 0.12) * 1.25);
};

const E = (eyes: Expression['eyes'], brow: [number, number], lift: [number, number], mouth: Expression['mouth'], extra: Partial<Expression> = {}): Expression => ({ eyes, brow, lift, mouth, ...extra });

/** The clerk's extra faces (beyond the rig's named set). */
export const X = {
  strain: E('squint', [16, 16], [-6, -6], 'wavy', { sweat: 1 }),
  dazed: E('half', [-10, -10], [4, 4], 'wavy'),
  hesitant: E('open', [-12, -12], [8, 8], 'wavy', { blush: 0.4 }),
  sincere: E('happy', [-8, -8], [10, 10], 'smile'),
  proud: E('happy', [-6, -6], [10, 10], 'grin'),
  doubt: E('open', [12, 12], [-2, -2], 'wavy', { sweat: 0.8 }),
  calm: E('half', [0, 0], [0, 0], 'flat'),
  knowing: E('half', [8, -10], [0, 14], 'smirk'),
  blow: E('half', [4, 4], [0, 0], 'pucker'),
  bonk: E('closed', [-14, -14], [6, 6], 'o'),
} satisfies Record<string, Expression>;

type XK = ExprName | Expression;
const XP = (e: XK): Expression => (typeof e === 'string' ? EXPRESSIONS[e] : e);

/** An expression track: [frame, expression] keys (names or custom); switches blend over 4 frames. */
export const xTrack = (f: number, keys: Array<[number, XK]>): Expression => {
  let cur = XP(keys[0][1]);
  for (let i = 1; i < keys.length; i++) {
    const [at, e] = keys[i];
    if (f < at) break;
    cur = mixExpr(cur, XP(e), prog(f, at, 4, ease.linear));
  }
  return cur;
};
