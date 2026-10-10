import React from 'react';
import { INK, LINE, PAL, clamp, deg, stroke } from '@mukarram/characters/ink';
import { BUILD, Build, Person, PersonProps, Pose, armJoints, hipHeight } from '@mukarram/characters/rig';

// The reel's one character: an office clerk built on the reels/mukarram rig (same joints, faces, hands),
// with his own silhouette — combed hair with a side part, a light-blue shirt, a red tie, and a blue pencil
// parked behind his ear (it is the pencil he writes and erases with).

export const EMP_BUILD: Build = { ...BUILD, headRX: 88, headRY: 94, torsoW: 150, torsoH: 196, belly: 0.45, shX: 56, shirt: PAL.blueSoft, shoe: INK, seed: 41 };
export const PENCIL_BLUE = PAL.blue;

const Hair: React.FC<{ rx: number; ry: number }> = ({ rx, ry }) => (
  <g>
    <path d={`M${-rx * 1.01} ${-ry * 0.02} C ${-rx * 1.08} ${-ry * 0.92} ${-rx * 0.42} ${-ry * 1.2} ${rx * 0.12} ${-ry * 1.12} C ${rx * 0.8} ${-ry * 1.06} ${rx * 1.08} ${-ry * 0.66} ${rx * 1.0} ${-ry * 0.06}
      C ${rx * 0.9} ${-ry * 0.4} ${rx * 0.58} ${-ry * 0.58} ${rx * 0.02} ${-ry * 0.6} L ${-rx * 0.24} ${-ry * 0.86} C ${-rx * 0.5} ${-ry * 0.62} ${-rx * 0.86} ${-ry * 0.46} ${-rx * 1.01} ${-ry * 0.02} Z`}
      fill={INK} {...stroke(LINE * 0.8)} />
    <path d={`M${-rx * 0.22} ${-ry * 0.84} Q ${-rx * 0.1} ${-ry * 1.0} ${rx * 0.08} ${-ry * 1.08}`} fill="none" {...stroke(LINE * 0.5, PAL.blueSoft)} opacity={0.6} />
  </g>
);

/** The blue pencil (eraser end at the top), in its own space: centre at 0,0, length 120. */
export const Pencil: React.FC<{ x?: number; y?: number; rot?: number; s?: number }> = ({ x = 0, y = 0, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-9 -50 L9 -50 L9 40 L0 62 L-9 40 Z" fill={PENCIL_BLUE} {...stroke(LINE * 0.6)} />
    <path d="M-9 40 L0 62 L9 40 Z" fill={PAL.paper} {...stroke(LINE * 0.5)} />
    <path d="M-2.5 56 L0 62 L2.5 56 Z" fill={INK} />
    <path d="M-9 -50 L-9 -66 Q0 -74 9 -66 L9 -50 Z" fill={PAL.redSoft} {...stroke(LINE * 0.6)} />
    <path d="M-9 -50 L9 -50" {...stroke(LINE * 0.9, PAL.stone)} />
  </g>
);

const Collar: React.FC<{ b: Build }> = ({ b }) => {
  const top = -b.torsoH + 6;
  return (
    <g>
      {/* the tie: knot, blade, a short shadow line */}
      <path d={`M-13 ${top + 18} L13 ${top + 18} L9 ${top + 38} L-9 ${top + 38} Z`} fill={PAL.red} {...stroke(LINE * 0.7)} />
      <path d={`M-9 ${top + 38} L9 ${top + 38} L17 ${top + 128} L0 ${top + 150} L-17 ${top + 128} Z`} fill={PAL.red} {...stroke(LINE * 0.7)} />
      <path d={`M-4 ${top + 60} L3 ${top + 120}`} {...stroke(LINE * 0.45, '#B8202D')} opacity={0.6} />
      {/* collar points */}
      <path d={`M-40 ${top + 2} L-6 ${top + 22} L-24 ${top + 44} Z`} fill={PAL.white} {...stroke(LINE * 0.7)} />
      <path d={`M40 ${top + 2} L6 ${top + 22} L24 ${top + 44} Z`} fill={PAL.white} {...stroke(LINE * 0.7)} />
      {/* shirt pocket (screen left) */}
      <path d={`M${-b.torsoW * 0.36} ${top + 70} L${-b.torsoW * 0.14} ${top + 70} L${-b.torsoW * 0.14} ${top + 108} Q${-b.torsoW * 0.25} ${top + 116} ${-b.torsoW * 0.36} ${top + 108} Z`} fill="none" {...stroke(LINE * 0.55)} />
    </g>
  );
};

export type EmployeeProps = Omit<PersonProps, 'build' | 'torsoDetail' | 'headBack' | 'headFront'> & {
  /** pencil behind the ear (false once it is in his hand) */
  earPencil?: boolean;
  /** something tucked in the shirt pocket, drawn in torso space at the pocket */
  pocket?: React.ReactNode;
};

export const Employee: React.FC<EmployeeProps> = ({ earPencil = true, pocket, ...p }) => {
  const b = EMP_BUILD;
  return (
    <Person {...p} build={b}
      headBack={earPencil ? <Pencil x={b.headRX * 0.92} y={-b.headRY * 0.18} rot={28} s={0.62} /> : undefined}
      headFront={<Hair rx={b.headRX} ry={b.headRY} />}
      torsoDetail={<g><Collar b={b} />{pocket && <g transform={`translate(${-b.torsoW * 0.25} ${-b.torsoH + 78})`}>{pocket}</g>}</g>} />
  );
};

/* ---------------- reaching: put a hand on a point in the world ---------------- */

type Vec = [number, number];

/** A world point in the character's torso space (inverse of the rig's transforms). */
export const toTorso = (b: Build, pose: Pose, x: number, y: number, s: number, facing: 1 | -1, bob: number, w: Vec): Vec => {
  const hy = hipHeight(b, pose);
  const lx = (w[0] - x) / (s * facing);
  const ly = (w[1] - y) / s + hy + bob;
  const a = -deg(pose.lean);
  const rx = lx * Math.cos(a) - ly * Math.sin(a);
  const ry = lx * Math.sin(a) + ly * Math.cos(a);
  return [rx / (1 - pose.squash * 0.5), ry / (1 + pose.squash)];
};

/** Two-bone IK for one arm: shoulder/elbow angles (rig convention) that put the wrist on `t` (torso space).
 *  `elbow` +1 bends the elbow down/out, −1 the other way. Out-of-reach targets get the straight arm. */
export const armIK = (b: Build, side: -1 | 1, t: Vec, elbow: 1 | -1 = 1): [number, number] => {
  const s0 = armJoints(b, side, [0, 0]).s;
  const m = side === -1 ? 1 : -1;
  const X = (t[0] - s0[0]) * m, Y = t[1] - s0[1];
  const L = clamp(Math.hypot(X, Y), Math.abs(b.upper - b.fore) + 2, b.upper + b.fore - 1);
  const base = Math.atan2(-X, Y);
  const alpha = Math.acos(clamp((b.upper * b.upper + L * L - b.fore * b.fore) / (2 * b.upper * L), -1, 1));
  const pick = (sg: number) => {
    const sh = base + sg * alpha;
    const ex = -Math.sin(sh) * b.upper, ey = Math.cos(sh) * b.upper;
    const fa = Math.atan2(-(X - ex), Y - ey);
    return { sh, el: fa - sh, ey };
  };
  const a1 = pick(1), a2 = pick(-1);
  const lower = a1.ey >= a2.ey ? a1 : a2, upper = a1.ey >= a2.ey ? a2 : a1;
  const r = elbow === 1 ? lower : upper;
  const d = (v: number) => (v * 180) / Math.PI;
  let el = d(r.el);
  while (el > 180) el -= 360;
  while (el < -180) el += 360;
  return [d(r.sh), el];
};

/** Pose with one or both wrists placed on world points (the rest of the pose unchanged). */
export const reach = (pose: Pose, at: { x: number; y: number; s: number; facing: 1 | -1; bob?: number }, L?: Vec | null, R?: Vec | null, elbow: { L?: 1 | -1; R?: 1 | -1 } = {}): Pose => {
  const b = EMP_BUILD;
  const out: Pose = { ...pose };
  if (L) out.armL = armIK(b, -1, toTorso(b, pose, at.x, at.y, at.s, at.facing, at.bob ?? 0, L), elbow.L ?? 1);
  if (R) out.armR = armIK(b, 1, toTorso(b, pose, at.x, at.y, at.s, at.facing, at.bob ?? 0, R), elbow.R ?? 1);
  return out;
};
