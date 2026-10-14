import { EXPRESSIONS, Expression, ExprName, mixExpr } from '@mukarram/characters/face';
import envelope from '../video/envelope.json';
import { ease, prog } from '../video/time';

// Pose/look tracks and idle motion come from reels/mukarram/src/scenes/common.tsx (as in reels/doublethink);
// the mouths are this reel's own: one envelope per on-screen speaker (W worker, C colleague), so a mouth only
// moves on its own lines; the narrator is off screen.
export { idle, poseTrack, vecTrack } from '@mukarram/scenes/common';
export type ShotProps = { f: number; t0: number; t1: number };

export const talkAt = (f: number, who: 'W' | 'C') => {
  const e = (envelope as Record<string, number[]>)[who];
  const v = Math.max(e[f] ?? 0, (e[f - 1] ?? 0) * 0.7, (e[f + 1] ?? 0) * 0.5);
  return v < 0.12 ? 0 : Math.min(1, (v - 0.12) * 1.25);
};

const E = (eyes: Expression['eyes'], brow: [number, number], lift: [number, number], mouth: Expression['mouth'], extra: Partial<Expression> = {}): Expression => ({ eyes, brow, lift, mouth, ...extra });

/** The worker's faces beyond the rig's named set (same contract as reels/doublethink's X). */
export const X = {
  autoSmile: E('happy', [-6, -6], [12, 12], 'grin'),
  cheek: E('happy', [4, 4], [6, 6], 'smile', { sweat: 0.4 }),
  strain: E('squint', [16, 16], [-6, -6], 'wavy', { sweat: 1 }),
  wobble: E('open', [-12, -12], [8, 8], 'wavy', { sweat: 0.7 }),
  hesitant: E('open', [-12, -12], [8, 8], 'wavy', { blush: 0.4 }),
  panic: E('wide', [-14, -14], [22, 22], 'o', { sweat: 1 }),
  gulp: E('closed', [-10, -10], [4, 4], 'flat', { sweat: 0.6 }),
  calm: E('half', [0, 0], [0, 0], 'flat'),
  breathe: E('closed', [-4, -4], [4, 4], 'flat'),
  firm: E('open', [6, 6], [0, 0], 'smile'),
  relieved: E('happy', [-10, -10], [10, 10], 'smile'),
  sincere: E('happy', [-8, -8], [10, 10], 'smile'),
  proud: E('happy', [-6, -6], [10, 10], 'grin'),
  dread: E('open', [-16, -16], [14, 14], 'frown', { sweat: 1 }),
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
