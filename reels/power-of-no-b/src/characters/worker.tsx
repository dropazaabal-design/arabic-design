import React from 'react';
import { INK, LINE, PAL, stroke, wobEllipse } from '@mukarram/characters/ink';
import { BUILD, Build, Person, PersonProps, Pose, handLocal, hipHeight } from '@mukarram/characters/rig';
import { armIK, toTorso } from '@doublethink/characters/employee';

// The worker: the reels/mukarram rig (same joints, faces, hands) with his own silhouette — a blue knee-length
// coat over the trousers, a red scarf, curly hair; a phone in the breast pocket and a front pocket where the
// cup's lid ends up. The coat's door-side corner can be pulled to a point (caught in the door).

export const W_BUILD: Build = { ...BUILD, headRX: 90, headRY: 96, torsoW: 158, torsoH: 200, belly: 0.4, shX: 58, shirt: PAL.blue, shoe: INK, seed: 61 };
const COAT_DEEP = '#21609F';
export const LID_RED = PAL.red;

const Hair: React.FC<{ rx: number; ry: number }> = ({ rx, ry }) => (
  <g>
    {[-0.78, -0.42, -0.04, 0.36, 0.72].map((k, i) => (
      <path key={i} d={wobEllipse(rx * k, -ry * (0.86 - Math.abs(k) * 0.28), rx * 0.3, ry * 0.26, 70 + i, 0.08, 8)} fill={INK} {...stroke(LINE * 0.6)} />
    ))}
    <path d={`M${-rx * 0.98} ${-ry * 0.2} Q ${-rx * 0.9} ${-ry * 0.82} 0 ${-ry * 0.96} Q ${rx * 0.9} ${-ry * 0.82} ${rx * 0.98} ${-ry * 0.2} Q ${rx * 0.6} ${-ry * 0.56} 0 ${-ry * 0.6} Q ${-rx * 0.6} ${-ry * 0.56} ${-rx * 0.98} ${-ry * 0.2}Z`} fill={INK} />
  </g>
);

/** The phone peeking out of the breast pocket (torso space, pocket mouth at 0,0). */
const PocketPhone: React.FC<{ buzz: number; up: number }> = ({ buzz, up }) => (
  <g transform={`translate(${buzz} ${-up})`}>
    <rect x={-15} y={-30} width={30} height={46} rx={6} fill={INK} {...stroke(LINE * 0.5)} />
    <rect x={-10} y={-25} width={20} height={14} rx={3} fill={buzz ? PAL.blueSoft : '#33445C'} />
  </g>
);

/** The cup's red lid, stuck in the front pocket (torso space, pocket mouth at 0,0). */
export const PocketLid: React.FC = () => (
  <g transform="rotate(-18)">
    <path d="M-30 -2 Q0 -22 30 -2 L30 6 L-30 6Z" fill={LID_RED} {...stroke(LINE * 0.55)} />
    <path d="M-6 -16 L6 -16 L6 -10 L-6 -10Z" fill={LID_RED} {...stroke(LINE * 0.4)} />
  </g>
);

const Coat: React.FC<{ b: Build; phone?: { buzz: number; up: number }; lid?: number; tail?: [number, number] | null }> = ({ b, phone, lid = 0, tail }) => {
  const top = -b.torsoH + 6, W = b.torsoW;
  // the skirt of the coat hangs over the thighs; its screen-left corner (the tail) can be pulled into a door
  return (
    <g>
      <path d={`M${-W * 0.42} -4 L${W * 0.42} -4 L${W * 0.5} 118 L${-W * 0.5} 118 Z`} fill={PAL.blue} {...stroke(LINE * 0.8)} />
      {tail && <path d={`M${-W * 0.44} 52 L${-W * 0.5} 118 L${-W * 0.3} 118 L${tail[0]} ${tail[1]} Z`} fill={PAL.blue} {...stroke(LINE * 0.7)} />}
      <path d={`M${W * 0.04} -2 L${W * 0.06} 122`} {...stroke(LINE * 0.5, COAT_DEEP)} />
      {/* lapels and buttons */}
      <path d={`M-30 ${top + 4} L-6 ${top + 70} L-40 ${top + 52}Z`} fill={COAT_DEEP} {...stroke(LINE * 0.6)} />
      <path d={`M30 ${top + 4} L6 ${top + 70} L40 ${top + 52}Z`} fill={COAT_DEEP} {...stroke(LINE * 0.6)} />
      {[0.45, 0.66, 0.86].map((k) => <circle key={k} cx={4} cy={top + b.torsoH * k} r={6} fill={INK} />)}
      {/* breast pocket (screen left) with the phone */}
      <g transform={`translate(${-W * 0.24} ${top + 84})`}>
        {phone && <PocketPhone {...phone} />}
        <path d="M-22 0 L22 0 L20 30 L-20 30Z" fill={COAT_DEEP} {...stroke(LINE * 0.5)} />
      </g>
      {/* front pocket (screen left, low) — the lid lands here */}
      <g transform={`translate(${-W * 0.26} ${-34})`}>
        {lid > 0 && <g opacity={Math.min(1, lid)}><g transform={`translate(0 ${-10})`}><PocketLid /></g></g>}
        <path d="M-30 0 L30 0 L28 40 L-28 40Z" fill={COAT_DEEP} {...stroke(LINE * 0.55)} />
      </g>
      {/* red scarf: a wrap and a tail */}
      <path d={`M${-W * 0.3} ${top + 10} Q0 ${top + 40} ${W * 0.3} ${top + 10} L${W * 0.3} ${top + 32} Q0 ${top + 62} ${-W * 0.3} ${top + 32}Z`} fill={PAL.red} {...stroke(LINE * 0.7)} />
      <path d={`M${W * 0.12} ${top + 40} L${W * 0.22} ${top + 120} L${W * 0.06} ${top + 124} L${W * 0.02} ${top + 46}Z`} fill={PAL.red} {...stroke(LINE * 0.6)} />
    </g>
  );
};

export type WorkerProps = Omit<PersonProps, 'build' | 'torsoDetail' | 'headBack' | 'headFront'> & {
  phone?: { buzz: number; up: number };
  /** the cup's lid in the front pocket (0..1) */
  lid?: number;
  /** the coat's door-side corner pulled to this point (torso space), or null */
  tail?: [number, number] | null;
  /** something clamped under the right arm (torso space; drawn over the coat, under the arm) */
  underArm?: React.ReactNode;
};

export const Worker: React.FC<WorkerProps> = ({ phone = { buzz: 0, up: 0 }, lid = 0, tail = null, underArm, ...p }) => {
  const b = W_BUILD;
  return <Person {...p} build={b} headFront={<Hair rx={b.headRX} ry={b.headRY} />} torsoDetail={<g><Coat b={b} phone={phone} lid={lid} tail={tail} />{underArm}</g>} />;
};

/* ---------------- reaching and holding, for any build ---------------- */

export type Vec = [number, number];
export type At = { x: number; y: number; s: number; facing: 1 | -1; bob?: number };

/** Pose with one or both wrists on world points (doublethink's arm IK, here for any build). */
export const reachB = (b: Build, pose: Pose, at: At, L?: Vec | null, R?: Vec | null, elbow: { L?: 1 | -1; R?: 1 | -1 } = {}): Pose => {
  const out: Pose = { ...pose };
  if (L) out.armL = armIK(b, -1, toTorso(b, pose, at.x, at.y, at.s, at.facing, at.bob ?? 0, L), elbow.L ?? 1);
  if (R) out.armR = armIK(b, 1, toTorso(b, pose, at.x, at.y, at.s, at.facing, at.bob ?? 0, R), elbow.R ?? 1);
  return out;
};

/** Where a wrist is in the world (side −1 = screen left when facing 1). */
export const handAt = (b: Build, pose: Pose, side: -1 | 1, at: At): Vec => {
  const [lx, ly] = handLocal(b, pose, side);
  return [at.x + lx * at.s * at.facing, at.y + (ly - (at.bob ?? 0)) * at.s];
};

/** A torso-space point in the world (for things drawn on the body, e.g. the pocket). */
export const torsoToWorld = (b: Build, pose: Pose, at: At, p: Vec): Vec => {
  const a = (pose.lean * Math.PI) / 180;
  const sx = p[0] * (1 - pose.squash * 0.5), sy = p[1] * (1 + pose.squash);
  return [at.x + (sx * Math.cos(a) - sy * Math.sin(a)) * at.s * at.facing, at.y + (-hipHeight(b, pose) - (at.bob ?? 0) + sx * Math.sin(a) + sy * Math.cos(a)) * at.s];
};
