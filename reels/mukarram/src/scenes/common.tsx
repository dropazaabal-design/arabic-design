import React from 'react';
import { EXPRESSIONS, Expression, ExprName, mixExpr } from '../characters/face';
import { PAL, bowLine, stroke, wobEllipse, wobRect } from '../characters/ink';
import { POSES, Pose, PoseName, blinkAt, breath, mixPose } from '../characters/rig';
import envelope from '../video/envelope.json';
import { FPS, ease, prog, sec } from '../video/time';

export type ShotProps = { f: number; t0: number; t1: number };

/** Mouth opening from the measured voice envelope (frame-accurate, a little smoothing so lips don't buzz). */
export const talkAt = (f: number) => {
  const e = envelope as number[];
  const v = Math.max(e[f] ?? 0, (e[f - 1] ?? 0) * 0.7, (e[f + 1] ?? 0) * 0.5);
  return v < 0.12 ? 0 : Math.min(1, (v - 0.12) * 1.25);
};

/** A pose track: [frame, pose] keys; each change eases over `dur` frames. */
export const poseTrack = (f: number, keys: Array<[number, Pose | PoseName]>, dur = sec(0.28), easing = ease.inOut): Pose => {
  const P = (p: Pose | PoseName) => (typeof p === 'string' ? POSES[p] : p);
  let cur = P(keys[0][1]);
  for (let i = 1; i < keys.length; i++) {
    const [at, p] = keys[i];
    if (f < at) break;
    cur = mixPose(cur, P(p), prog(f, at, dur, easing));
  }
  return cur;
};

/** An expression track: [frame, expression] keys; switches blend over 4 frames. */
export const exprTrack = (f: number, keys: Array<[number, ExprName]>): Expression => {
  let cur: Expression = EXPRESSIONS[keys[0][1]];
  for (let i = 1; i < keys.length; i++) {
    const [at, e] = keys[i];
    if (f < at) break;
    cur = mixExpr(cur, EXPRESSIONS[e], prog(f, at, 4, ease.linear));
  }
  return cur;
};

/** [frame, value] pairs for a 2-vector (look, glance). */
export const vecTrack = (f: number, keys: Array<[number, [number, number]]>, dur = sec(0.25)): [number, number] => {
  let cur = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [at, v] = keys[i];
    if (f < at) break;
    const p = prog(f, at, dur, ease.inOut);
    cur = [cur[0] + (v[0] - cur[0]) * p, cur[1] + (v[1] - cur[1]) * p];
  }
  return cur;
};

export const idle = (f: number, seed: number) => ({ blink: blinkAt(f, FPS, seed), bob: breath(f, FPS, seed) * 2.5 });

/* ---------- the narrator's corner (used by every mic shot) ---------- */

const LINE1 = 6, LINE2 = 8;

export const StudioBack: React.FC<{ glow?: number }> = ({ glow = 0 }) => (
  <g>
    <rect x={-400} y={-400} width={1900} height={2800} fill={PAL.paper} />
    <path d={wobRect(110, 300, 860, 1060, 60, 201, 4)} fill={PAL.blueSoft} {...stroke()} />
    {glow > 0 && <circle cx={540} cy={760} r={460} fill={PAL.glow} opacity={0.7 * glow} />}
    {/* shelf with a plant and two books */}
    <path d={bowLine(150, 520, 420, 520, 2)} {...stroke(LINE2)} />
    <path d={wobRect(180, 420, 34, 100, 4, 202, 1)} fill={PAL.red} {...stroke(LINE1)} />
    <path d={wobRect(220, 440, 30, 80, 4, 203, 1)} fill={PAL.navy} {...stroke(LINE1)} />
    <path d="M330 520 L320 460 L380 460 L370 520Z" fill={PAL.wood} {...stroke(LINE1)} />
    <path d="M350 460 q -30 -50 -10 -90 M350 460 q 10 -60 40 -80 M350 460 q -40 -30 -60 -40" fill="none" {...stroke(LINE1, PAL.leafDeep)} />
    {/* a framed doodle of a bin with a tick (the reel's motif, no words) */}
    <path d={wobRect(700, 380, 200, 170, 8, 204, 2)} fill={PAL.white} {...stroke(LINE1)} />
    <path d="M760 430 L840 430 L830 520 L770 520Z" fill={PAL.blue} {...stroke(LINE1 * 0.8)} />
    <path d="M770 405 l 14 14 l 30 -30" fill="none" {...stroke(LINE1, PAL.leafDeep)} />
    <path d={wobEllipse(540, 1420, 700, 60, 205, 0.02, 12)} fill={PAL.paperDeep} />
  </g>
);
