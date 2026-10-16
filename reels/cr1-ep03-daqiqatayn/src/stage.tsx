import React from 'react';
import { AbsoluteFill } from 'remotion';
import { blink, breathe, face, pose, track, trackNum, type Face, type FaceName, type Key, type Pose, type PoseName } from '../../../motion-core/src/cartoon';
import { SvgPerson, type SvgHand, type SvgLook } from '../../../motion-core/src/characters/SvgPerson';
import { H, W } from './theme';
import { sec } from './time';

/** Camera: world point (x, y) at the frame centre, zoom z. */
export type Cam = { x: number; y: number; z: number };
export const camMix = (a: Cam, b: Cam, p: number): Cam => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, z: a.z + (b.z - a.z) * p });
export const toScreen = (c: Cam, [wx, wy]: [number, number]): [number, number] => [(wx - c.x) * c.z + W / 2, (wy - c.y) * c.z + H / 2];

/** A shot: the SVG world through the camera, then screen-space overlays on top. */
export const Frame: React.FC<{ c: Cam; world: React.ReactNode; overlay?: React.ReactNode; o?: number; bg?: string }> = ({ c, world, overlay, o = 1, bg }) => (
  <AbsoluteFill style={{ opacity: o, background: bg }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(${W / 2} ${H / 2}) scale(${c.z}) translate(${-c.x} ${-c.y})`}>{world}</g>
    </svg>
    {overlay}
  </AbsoluteFill>
);

/** Keyframes by name, so a scene reads like stage directions. */
export const P = (at: number, name: PoseName, extra: Partial<Pose> = {}, dur?: number): Key<Pose> => ({ at, to: pose(name, extra), dur });
export const F = (at: number, name: FaceName, extra: Partial<Face> = {}, dur?: number): Key<Face> => ({ at, to: face(name, extra), dur });
export const N = (at: number, to: number, dur?: number): Key<number> => ({ at, to, dur });
const val = (f: number, v: Key<number>[] | number | undefined, d = 0) => (v === undefined ? d : typeof v === 'number' ? v : trackNum(f, v));

export type Direction = {
  look: SvgLook; id: string; seed: number;
  pose: Key<Pose>[]; face: Key<Face>[];
  x: Key<number>[] | number; y: Key<number>[] | number; scale?: number; facing?: 1 | -1 | Key<number>[];
  add?: Partial<Pose>; handF?: SvgHand; handN?: SvgHand; holdF?: React.ReactNode; holdN?: React.ReactNode; holdUpright?: boolean | 'F' | 'N';
  farInFront?: boolean; feet?: 'slipper' | 'runner'; wristF?: Key<number>[] | number; wristN?: Key<number>[] | number; o?: number;
};

/** The character at frame f, driven by its keyframes, with blinking and breathing. */
export const Actor: React.FC<{ f: number; d: Direction }> = ({ f, d }) => {
  let p = track(f, d.pose);
  if (d.add) { p = { ...p }; for (const k in d.add) (p as Record<string, number>)[k] += (d.add as Record<string, number>)[k]; }
  const facing = typeof d.facing === 'object' ? (trackNum(f, d.facing) >= 0 ? 1 : -1) : d.facing ?? 1;
  const body = (
    <SvgPerson id={d.id} look={d.look} pose={p} face={track(f, d.face)} x={val(f, d.x)} y={val(f, d.y)} scale={d.scale ?? 1} facing={facing}
      blink={blink(f, d.seed, sec(1))} breath={breathe(f, d.seed, sec(1))} handF={d.handF} handN={d.handN} holdF={d.holdF} holdN={d.holdN}
      holdUpright={d.holdUpright} farInFront={d.farInFront} feet={d.feet} wristF={val(f, d.wristF)} wristN={val(f, d.wristN)} />
  );
  return d.o === undefined || d.o >= 1 ? body : <g opacity={Math.max(0, d.o)}>{body}</g>;
};

/** World point → character space for an upright actor at (x, y), scale s, facing ±1. */
export const toChar = (x: number, y: number, s: number, facing: 1 | -1 = 1) => ([wx, wy]: [number, number]): [number, number] => [((wx - x) / s) * facing, (wy - y) / s];

/**
 * A pose that follows keys, except inside `spans`, where it is computed every frame (a hand tracing a
 * line, a hand on a moving thing). Each span is entered with a blend that lands on its first frame and
 * left from its last frame, so nothing jumps.
 */
export type Span = { from: number; to: number; at: (f: number) => Pose; enter?: number };
export const follow = (f: number, keys: Key<Pose>[], spans: Span[] = []): Pose => {
  const live = spans.find((s) => f >= s.from && f < s.to);
  if (live) return live.at(f);
  const all = [...keys];
  for (const s of spans) {
    all.push({ at: s.from - (s.enter ?? sec(0.35)), to: s.at(s.from), dur: s.enter ?? sec(0.35) });
    all.push({ at: s.to - 0.5, to: s.at(s.to - 1), dur: 0.5 }); // lands on the span's last pose before any key at s.to starts from it
  }
  return track(f, all);
};

/** An actor lying on his back: rotated about the hip, which sits at world (hx, hy). `rot` −90 = flat (head toward −x), 0 = upright. */
export const Lying: React.FC<{ hx: number; hy: number; rot: number; s: number; sit?: number; children: React.ReactNode }> = ({ hx, hy, rot, s, sit = 1, children }) => (
  <g transform={`translate(${hx} ${hy}) rotate(${rot}) translate(0 ${-(-146 + 72 * sit) * s})`}>{children}</g>
);
/** World point → character space for a Lying actor (same hx, hy, rot, s). */
export const lyingChar = (hx: number, hy: number, rot: number, s: number, sit = 1) => ([wx, wy]: [number, number]): [number, number] => {
  const r = (-rot * Math.PI) / 180, dx = wx - hx, dy = wy - hy;
  return [(dx * Math.cos(r) - dy * Math.sin(r)) / s, (dx * Math.sin(r) + dy * Math.cos(r)) / s + (-146 + 72 * sit)];
};
