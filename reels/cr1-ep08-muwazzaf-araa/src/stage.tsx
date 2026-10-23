import React from 'react';
import { joints, mix, pose as mkPose, type Pose, type V } from './kit';
import { Naif, toLocal, toWorld, type NaifProps, type Place } from './naif';
import { OFFICE, OfficeBack, OfficeCounter, OfficeItems, OfficeLight, ROOM, RoomBack, RoomChair, RoomDesk, RoomItems, type OfficeState, type RoomState } from './sets';

// The camera and the layer order of the two places. The frame is 1080×1920; a camera {x, y, z} puts world point
// (x, y) at the frame's centre (540, 960), which is also the centre of the 4:5 band.
export type Cam = { x: number; y: number; z: number };
export const WIDE: Cam = { x: 540, y: 960, z: 1 };
export const camMix = (a: Cam, b: Cam, t: number): Cam => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), z: mix(a.z, b.z, t) });
export const toScreen = (c: Cam, q: V): V => [(q[0] - c.x) * c.z + 540, (q[1] - c.y) * c.z + 960];

export const World: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
    <g transform={`translate(540 960) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>{children}</g>
  </svg>
);

/**
 * A held object sits in the fist, not at the wrist: `grab` returns the arm pose whose fist closes on world point `q`,
 * and the offset (in the held object's upright frame) that puts the object's grip point inside that fist.
 */
export const FIST = 10; // hand units from the wrist to the middle of a closed fist
export const grab = (P: Place, base: Pose, side: 'R' | 'L', q: V, bend?: 1 | -1) => {
  const at = (target: V) => mkPose({ ...base, [side]: { hand: toLocal(P, target), bend } } as Partial<Pose>);
  let p = at(q);
  for (let i = 0; i < 2; i++) {
    const a = joints(p)[side === 'R' ? 'armR' : 'armL'];
    const d: V = [a.wrist[0] - a.elbow[0], a.wrist[1] - a.elbow[1]], n = Math.hypot(d[0], d[1]) || 1;
    const off: V = [(d[0] / n) * FIST * 1.45 * P.s * (P.facing ?? 1), (d[1] / n) * FIST * 1.45 * P.s];
    p = at([q[0] - off[0], q[1] - off[1]]);
  }
  const a = joints(p)[side === 'R' ? 'armR' : 'armL'];
  const d: V = [a.wrist[0] - a.elbow[0], a.wrist[1] - a.elbow[1]], n = Math.hypot(d[0], d[1]) || 1;
  return { p, off: [(d[0] / n) * FIST * (P.facing ?? 1), (d[1] / n) * FIST] as V, wrist: toWorld(P, a.wrist) };
};
/** The fist's world position for a pose (where a held object's grip point is). */
export const fistAt = (P: Place, p: Pose, side: 'R' | 'L'): V => {
  const a = joints(p)[side === 'R' ? 'armR' : 'armL'];
  const d: V = [a.wrist[0] - a.elbow[0], a.wrist[1] - a.elbow[1]], n = Math.hypot(d[0], d[1]) || 1;
  const w = toWorld(P, a.wrist);
  return [w[0] + (d[0] / n) * FIST * 1.45 * P.s * (P.facing ?? 1), w[1] + (d[1] / n) * FIST * 1.45 * P.s];
};
export const fistOff = (P: Place, p: Pose, side: 'R' | 'L'): V => {
  const a = joints(p)[side === 'R' ? 'armR' : 'armL'];
  const d: V = [a.wrist[0] - a.elbow[0], a.wrist[1] - a.elbow[1]], n = Math.hypot(d[0], d[1]) || 1;
  return [(d[0] / n) * FIST * (P.facing ?? 1), (d[1] / n) * FIST];
};

type Actor = Omit<NaifProps, 'x' | 'y' | 's' | 'facing' | 'only'>;
const BEHIND = ['RightArm', 'RightLeg', 'LeftLeg', 'Torso', 'Head'];

/**
 * The office, in layers: wall → Naif (all but his near arm) → counter → things on it → `cards` → his near arm, cut at
 * the counter's edge (so a hand below the counter top is hidden behind it, and a hand above it is in front).
 */
export const OfficeScene: React.FC<{ cam: Cam; st: OfficeState; naif?: Actor | null; cards?: React.ReactNode; front?: React.ReactNode; place?: Place; armsFront?: boolean }> = ({ cam, st, naif, cards, front, place, armsFront }) => {
  const P = place ?? OFFICE.naif;
  // facing the camera, both arms come in front of the body (a card held out on each side)
  const behind = armsFront ? BEHIND.filter((x) => x !== 'RightArm') : BEHIND, ahead = armsFront ? ['RightArm', 'LeftArm'] : ['LeftArm'];
  return (
    <World cam={cam}>
      <OfficeBack st={st} />
      {naif && <Naif {...naif} {...P} office only={behind} />}
      <OfficeCounter st={st} />
      <OfficeItems st={st} />
      {cards}
      <defs><clipPath id="counter-cut"><rect x={-900} y={-900} width={2900} height={OFFICE.counterY + 900 + 2} /></clipPath></defs>
      {naif && <g clipPath="url(#counter-cut)"><Naif {...naif} {...P} office only={ahead} /></g>}
      {front}
      <OfficeLight dim={st.dim} />
    </World>
  );
};

/** His real room: wall → chair → Naif → desk → laptop and phone → his near arm (over the keyboard) → `front`. */
export const RoomScene: React.FC<{ cam: Cam; st: RoomState; naif?: Actor | null; front?: React.ReactNode }> = ({ cam, st, naif, front }) => {
  const P = ROOM.naif;
  return (
    <World cam={cam}>
      <RoomBack st={st} />
      <RoomChair />
      {naif && <Naif {...naif} {...P} only={BEHIND} />}
      <RoomDesk st={st} />
      <RoomItems st={st} />
      {naif && <Naif {...naif} {...P} only={['LeftArm']} />}
      {front}
    </World>
  );
};
