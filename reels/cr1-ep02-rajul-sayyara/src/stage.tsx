import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
  Person, blink, breathe, face, pose, track, trackNum,
  type Face, type FaceName, type Key, type Look, type Pose, type PoseName, type Hand,
} from '../../../motion-core/src/cartoon';
import { sec } from './time';

export type Ratio = '16x9' | '9x16' | '4x5';
export const SIZE: Record<Ratio, [number, number]> = { '16x9': [1920, 1080], '9x16': [1080, 1920], '4x5': [1080, 1350] };

/** Camera: world point (x, y) at the frame centre, zoom z. */
export type Cam = { x: number; y: number; z: number };
export const cam = (f: number, keys: Key<Cam>[]) => track(f, keys);
export const toScreen = (c: Cam, ratio: Ratio, [wx, wy]: [number, number]): [number, number] => {
  const [W, H] = SIZE[ratio];
  return [(wx - c.x) * c.z + W / 2, (wy - c.y) * c.z + H / 2];
};

/** A scene: the SVG world through the camera, then screen-space overlays (text) on top. */
export const Frame: React.FC<{ ratio: Ratio; c: Cam; world: React.ReactNode; overlay?: React.ReactNode; o?: number }> = ({ ratio, c, world, overlay, o = 1 }) => {
  const [W, H] = SIZE[ratio];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        <g transform={`translate(${W / 2} ${H / 2}) scale(${c.z}) translate(${-c.x} ${-c.y})`}>{world}</g>
      </svg>
      {overlay}
    </AbsoluteFill>
  );
};

/** Keyframes by name, so scenes read like stage directions. */
export const P = (at: number, name: PoseName, extra: Partial<Pose> = {}, dur?: number): Key<Pose> => ({ at, to: pose(name, extra), dur });
export const F = (at: number, name: FaceName, extra: Partial<Face> = {}, dur?: number): Key<Face> => ({ at, to: face(name, extra), dur });
export const N = (at: number, to: number, dur?: number): Key<number> => ({ at, to, dur });

export type Direction = {
  look: Look; id: string; seed: number;
  pose: Key<Pose>[]; face: Key<Face>[];
  x: Key<number>[] | number; y: Key<number>[] | number;
  scale?: number; facing?: 1 | -1 | Key<number>[];
  add?: Partial<Pose>; handF?: Hand; handN?: Hand;
  holdF?: React.ReactNode; holdN?: React.ReactNode; holdMid?: React.ReactNode; farInFront?: boolean; o?: number;
};

const val = (f: number, v: Key<number>[] | number) => (typeof v === 'number' ? v : trackNum(f, v));

/** A character at frame f, driven by its keyframes, with blinking and breathing. */
export const Actor: React.FC<{ f: number; d: Direction }> = ({ f, d }) => {
  let p = track(f, d.pose);
  if (d.add) { p = { ...p }; for (const k in d.add) (p as Record<string, number>)[k] += (d.add as Record<string, number>)[k]; }
  const facing = typeof d.facing === 'object' ? (trackNum(f, d.facing) >= 0 ? 1 : -1) : d.facing ?? 1;
  const person = (
    <Person id={d.id} look={d.look} pose={p} face={track(f, d.face)} x={val(f, d.x)} y={val(f, d.y)} scale={d.scale ?? 1}
      facing={facing} blink={blink(f, d.seed, sec(1))} breath={breathe(f, d.seed, sec(1))}
      handF={d.handF} handN={d.handN} holdF={d.holdF} holdN={d.holdN} holdMid={d.holdMid} farInFront={d.farInFront} />
  );
  return d.o === undefined || d.o >= 1 ? person : <g opacity={Math.max(0, d.o)}>{person}</g>;
};

/** Diagram scenes: 16:9 frames the 1920 × 1080 stage; the portrait ratios frame a column of
 * world x 140 … 940, y 0 … 1000, placed in each profile's safe area above the captions. */
export const STAGE_CAM: Record<Ratio, Cam> = { '16x9': { x: 960, y: 540, z: 1 }, '9x16': { x: 582, y: 685, z: 1 }, '4x5': { x: 540, y: 617, z: 0.9 } };
/** Pick by ratio; 4:5 falls back to the 9:16 value. */
export const by = <T,>(r: Ratio, wide: T, tall: T, feed?: T): T => (r === '16x9' ? wide : r === '4x5' && feed !== undefined ? feed : tall);
/** Ease a camera between two framings. */
export const camMix = (a: Cam, b: Cam, p: number): Cam => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, z: a.z + (b.z - a.z) * p });
