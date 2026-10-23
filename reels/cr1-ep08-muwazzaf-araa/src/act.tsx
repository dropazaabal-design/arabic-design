import React from 'react';
import { EXPRESSIONS, clamp01, ease, faceAt, k, mixPose, pose, type Expr, type Face, type Pose, type V } from './kit';
import { heldScale, type Place } from './naif';
import { CARD_STAMP_DY, STAMP_FOOT, StampTool } from './props';
import { STAMP_HOME, STAMP_S } from './sets';
import { fistOff, grab } from './stage';

// Acting helpers: arms driven by world targets over time, things held in the fist, the stamp's whole move.

/** [frame, fist target in the world (null = the body pose's own arm), blend frames, elbow side (IK bend)]. */
export type ArmKey = [number, V | null, number?, (1 | -1)?];

const valueAt = (keys: ArmKey[], f: number) => {
  let i = -1;
  for (let j = 0; j < keys.length; j++) if (keys[j][0] <= f) i = j;
  if (i <= 0) return { a: keys[0][1], b: keys[0][1], ba: keys[0][3], bb: keys[0][3], t: 1 };
  return { a: keys[i - 1][1], b: keys[i][1], ba: keys[i - 1][3], bb: keys[i][3], t: ease.inOut(clamp01((f - keys[i][0]) / (keys[i][2] ?? 14))) };
};
/** The body pose with each arm reaching its keyed targets (blended through the wrist, never popping). */
export const arms = (P: Place, f: number, body: Pose, R?: ArmKey[], L?: ArmKey[]): Pose => {
  let out = body;
  for (const [side, keys] of [['R', R], ['L', L]] as const) {
    if (!keys?.length) continue;
    const { a, b, ba, bb, t } = valueAt(keys, f);
    const at = (v: V | null, bend?: 1 | -1) => (v ? grab(P, body, side, v, bend).p : body);
    const m = mixPose(at(a, ba), at(b, bb), t);
    out = { ...out, [side]: m[side] };
  }
  return out;
};

/** Something held in a fist (an upright object): `node` is drawn in world units, its grip point at (gx, gy). */
export const inFist = (P: Place, p: Pose, side: 'R' | 'L', node: React.ReactNode, gx = 0, gy = 0) => {
  const o = fistOff(P, p, side), hs = heldScale(P);
  return <g transform={`translate(${o[0]} ${o[1]}) scale(${1 / hs}) translate(${-gx} ${-gy})`}>{node}</g>;
};

/** Faces keyed by frame, with optional gaze override (the eyes lead, the head follows a few frames later). */
export const faces = (f: number, keys: [number, Expr | Face, number?][]) => faceAt(f, keys);
export const look = (e: Expr | Face, l: [number, number]): Face => ({ ...(typeof e === 'string' ? EXPRESSIONS[e] : e), look: l });

/**
 * The stamp, start to finish, from frame t0: reach the pad, lift, over the target, press, lift, back over the pad,
 * put down, let go. `target` is the card's centre (the stamp lands on its stamp zone). Returns the arm pose, whether
 * the stamp is in the hand, and the imprint's progress.
 */
export const STAMP_T = { take: 16, over: 34, press: 42, up: 54, back: 74, put: 84, free: 104 };
export const stampAct = (P: Place, body: Pose, f: number, t0: number, target: V, speed = 1) => {
  const T = Object.fromEntries(Object.entries(STAMP_T).map(([kk, v]) => [kk, v / speed])) as typeof STAMP_T;
  const s = f - t0;
  const land: V = [target[0], target[1] + CARD_STAMP_DY - STAMP_FOOT * STAMP_S + 4];
  const above: V = [land[0], land[1] - 110];
  const hover: V = [STAMP_HOME[0], STAMP_HOME[1] - 50];
  const path: [number, V][] = [[T.take, STAMP_HOME], [T.over, above], [T.press, land], [T.up, above], [T.back, hover], [T.put, STAMP_HOME]];
  let q: V = STAMP_HOME;
  if (s >= T.take) {
    q = path[path.length - 1][1];
    for (let i = 1; i < path.length; i++) if (s <= path[i][0]) {
      const [a, qa] = path[i - 1], [b, qb] = path[i], u = (i === 2 ? ease.in : ease.inOut)((s - a) / (b - a));
      q = [qa[0] + (qb[0] - qa[0]) * u, qa[1] + (qb[1] - qa[1]) * u]; break;
    }
  }
  const holding = s >= T.take && s < T.put;
  const g = grab(P, body, 'L', q, -1);
  const reach = k(s, [[-8, 0], [T.take, 1], [T.put, 1], [T.free, 0]]);
  const p = mixPose(body, g.p, reach);
  const pressed = s >= T.press && s < T.up;
  return {
    p, holding, active: s > -8 && s < T.free, pressed,
    grip: s > T.take - 4 && s < T.put + 4,
    imprint: k(s, [[T.press - 1, 0], [T.press + 8, 1]], ease.lin),
    hit: t0 + T.press,
    stamp: holding ? inFist(P, p, 'L', <g transform={`scale(${STAMP_S})`}><StampTool /></g>) : null,
  };
};

/** Small breathing bob for idle bodies. */
export const breathe = (f: number, seed = 0) => 0.5 + 0.5 * Math.sin(f / 38 + seed);
export { pose, mixPose, k, ease };
