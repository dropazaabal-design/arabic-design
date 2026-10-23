import React from 'react';
import { Character, INK, blinkAt, joints, talkAt, type Expr, type Face, type Gesture, type Pose, type V } from './kit';
import { B, NAIF } from './look';

// Naif, drawn by the shared rig. In the office inside his head he wears a headset and a tie; everything else about
// him (proportions, colours, hair) never changes.

/** The headset, in the head's own frame (radius 48): band over the top, the cup on the visible ear, a boom to the mouth. */
const Headset: React.FC<{ turn: number }> = ({ turn }) => {
  const r = 48, a = Math.min(1, Math.abs(turn)), s = turn < 0 ? -1 : 1, fx = r * 0.5 * turn;
  const cups: number[] = a < 0.2 ? [-r * 1.0, r * 1.0] : [fx - s * r * 0.8];
  const far = a < 0.2 ? r * 1.0 : s * r * 0.92;
  const near = cups[0];
  return (
    <g>
      <path d={`M${near} ${-6} Q${(near + far) / 2} ${-r * 1.62} ${far} ${a < 0.2 ? -6 : -r * 0.42}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${near} ${-6} Q${(near + far) / 2} ${-r * 1.62} ${far} ${a < 0.2 ? -6 : -r * 0.42}`} fill="none" stroke={B.navy3} strokeWidth={4.5} strokeLinecap="round" />
      <path d={`M${near} ${8} Q${near + s * 4} ${r * 0.62} ${fx + s * r * 0.02} ${r * 0.6}`} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <circle cx={fx + s * r * 0.04} cy={r * 0.6} r={4.5} fill={B.navy} stroke={INK} strokeWidth={2} />
      {cups.map((x, i) => <g key={i}><ellipse cx={x} cy={2} rx={10} ry={13} fill={B.navy} stroke={INK} strokeWidth={3} /><ellipse cx={x} cy={2} rx={5} ry={7} fill={B.blue} /></g>)}
    </g>
  );
};

/** The tie, in character space, hanging from the collar along the torso. */
const Tie = (j: ReturnType<typeof joints>) => {
  const n = j.neck, h = j.hip;
  const len = Math.hypot(h[0] - n[0], h[1] - n[1]), d: V = [(h[0] - n[0]) / len, (h[1] - n[1]) / len], q: V = [-d[1], d[0]];
  const at = (t: number, w: number): string => `${(n[0] + d[0] * t + q[0] * w).toFixed(1)} ${(n[1] + d[1] * t + q[1] * w).toFixed(1)}`;
  return (
    <g strokeLinejoin="round">
      <path d={`M${at(14, -5)} L${at(56, -9)} L${at(66, 0)} L${at(56, 9)} L${at(14, 5)} Z`} fill={B.navy} stroke={INK} strokeWidth={2.4} />
      <path d={`M${at(30, -6.5)} L${at(36, 7)} M${at(44, -8)} L${at(50, 8.5)}`} stroke={B.blue} strokeWidth={2.4} />
      <path d={`M${at(4, -7)} L${at(4, 7)} L${at(15, 5)} L${at(15, -5)} Z`} fill={B.navy} stroke={INK} strokeWidth={2.4} />
    </g>
  );
};

export type NaifProps = {
  f: number; x: number; y: number; s: number; p: Pose; facing?: 1 | -1;
  hands?: { R?: Gesture; L?: Gesture }; face?: Face | Expr; office?: boolean;
  hold?: { R?: React.ReactNode; L?: React.ReactNode }; upright?: { R?: boolean; L?: boolean };
  only?: string[]; say?: [number, number]; o?: number; blink?: number;
};
export const Naif: React.FC<NaifProps> = ({ f, office, say, blink, ...rest }) => (
  <Character who={NAIF} {...rest} blink={blink ?? blinkAt(f, 7)} talk={say ? talkAt(f, say[0], say[1], 7) : 0}
    wear={office ? { torso: Tie, head: <Headset turn={rest.p.turn} /> } : undefined} />
);

// ——— world ↔ character space ———
export type Place = { x: number; y: number; s: number; facing?: 1 | -1 };
export const toWorld = (P: Place, q: V): V => [P.x + q[0] * P.s * (P.facing ?? 1), P.y + q[1] * P.s];
export const toLocal = (P: Place, q: V): V => [(q[0] - P.x) / (P.s * (P.facing ?? 1)), (q[1] - P.y) / P.s];
/** Where a hand (its wrist, where held objects are anchored) is in the world. */
export const handAt = (P: Place, p: Pose, side: 'R' | 'L'): V => toWorld(P, joints(p)[side === 'R' ? 'armR' : 'armL'].wrist);
export const headAt = (P: Place, p: Pose): V => toWorld(P, joints(p).headC);
/** Held objects are drawn at the hand's scale: 1.45 × the character's. */
export const heldScale = (P: Place) => 1.45 * P.s;
