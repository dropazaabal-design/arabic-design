import React, { createContext, useContext } from 'react';
import { AbsoluteFill } from 'remotion';
import { blink, breathe, face, pose, track, trackNum, walk, type Face, type FaceName, type Key, type Pose, type PoseName } from '../../../motion-core/src/cartoon';
import { SvgPerson, svgJoints, type SvgHand, type SvgLook } from '../../../motion-core/src/characters/SvgPerson';
import { H, W } from './theme';
import { sec } from './time';

/** Camera: world point (x, y) at the frame centre, zoom z. */
export type Cam = { x: number; y: number; z: number };
export const camMix = (a: Cam, b: Cam, p: number): Cam => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, z: a.z + (b.z - a.z) * p });
export const toScreen = (c: Cam, [wx, wy]: [number, number]): [number, number] => [(wx - c.x) * c.z + W / 2, (wy - c.y) * c.z + H / 2];

// ——— keep-out: where faces are on screen this frame, so text never covers one ———
// Every Actor inside a Frame reports its head box in screen pixels; the text layer, rendered after the
// shots, places titles clear of them and (in the check render) fails the frame if it cannot.
export type Box = [number, number, number, number]; // x0, y0, x1, y1 (screen px)
const CamCtx = createContext<Cam | null>(null);
const registry = { frame: -1, faces: [] as { id: string; box: Box; o: number }[] };
export const facesAt = (f: number) => (registry.frame === f ? registry.faces : []);
const report = (f: number, id: string, box: Box, o: number) => {
  if (registry.frame !== f) { registry.frame = f; registry.faces = []; }
  registry.faces = [...registry.faces.filter((x) => x.id !== id), { id, box, o }];
};
export const overlaps = (a: Box, b: Box, pad = 24) => a[0] < b[2] + pad && b[0] < a[2] + pad && a[1] < b[3] + pad && b[1] < a[3] + pad;

/** A shot: the SVG world through the camera, then screen-space overlays on top. `o` is the shot's own opacity in a dissolve. */
export const Frame: React.FC<{ c: Cam; world: React.ReactNode; overlay?: React.ReactNode; o?: number; bg?: string }> = ({ c, world, overlay, o = 1, bg }) => (
  <AbsoluteFill style={{ opacity: o, background: bg }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(${W / 2} ${H / 2}) scale(${c.z}) translate(${-c.x} ${-c.y})`}><CamCtx.Provider value={c}>{world}</CamCtx.Provider></g>
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
  /** not reported to the keep-out (a face that is not on screen as a face: lying under a blanket, inside a thought bubble) */
  noFace?: boolean;
  wardrobe?: { glasses?: string; tie?: string; moustache?: boolean };
};

/** The character at frame f, driven by its keyframes, with blinking and breathing. */
export const Actor: React.FC<{ f: number; d: Direction }> = ({ f, d }) => {
  let p = track(f, d.pose);
  if (d.add) { p = { ...p }; for (const k in d.add) (p as Record<string, number>)[k] += (d.add as Record<string, number>)[k]; }
  const facing = typeof d.facing === 'object' ? (trackNum(f, d.facing) >= 0 ? 1 : -1) : d.facing ?? 1;
  const cam = useContext(CamCtx);
  if (cam && !d.noFace) {
    // head and hair in character space (bind art: x −62…84, y −432…−282 about the neck at y −286), moved with the neck
    const j = svgJoints(p), s = d.scale ?? 1, x = val(f, d.x), y = val(f, d.y);
    const dx = j.neck[0], dy = j.neck[1] + 286;
    const xs = [-62, 84].map((v) => x + (v + dx) * s * facing), ys = [-432, -282].map((v) => y + (v + dy) * s);
    const [a, b] = [toScreen(cam, [Math.min(...xs), ys[0]]), toScreen(cam, [Math.max(...xs), ys[1]])];
    report(f, d.id, [a[0], a[1], b[0], b[1]], d.o ?? 1);
  }
  const body = (
    <SvgPerson id={d.id} look={d.look} pose={p} face={track(f, d.face)} x={val(f, d.x)} y={val(f, d.y)} scale={d.scale ?? 1} facing={facing}
      blink={blink(f, d.seed, sec(1))} breath={breathe(f, d.seed, sec(1))} handF={d.handF} handN={d.handN} holdF={d.holdF} holdN={d.holdN}
      holdUpright={d.holdUpright} farInFront={d.farInFront} feet={d.feet} wristF={val(f, d.wristF)} wristN={val(f, d.wristN)}
      glasses={d.wardrobe?.glasses} tie={d.wardrobe?.tie} moustache={d.wardrobe?.moustache ?? true} />
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

/**
 * Walking with planted feet: the body moves exactly as far per step as the stance leg sweeps back
 * (two legs of 146 units swinging ±24° → 238 units a cycle), so the feet do not slide on the floor.
 * The cycle length is derived from the distance and time; a walk that would need a silly cadence
 * (faster than 22 frames or slower than 60 a cycle at 60 fps) is a staging error and throws.
 */
export const STRIDE = 2 * 146 * 2 * Math.sin((24 * Math.PI) / 180) / 2; // per cycle, character units
export const plantedWalk = (f: number, from: number, to: number, start: number, frames: number, scale: number) => {
  const steps = Math.abs(to - from) / (STRIDE * scale);
  const cycle = steps > 0 ? frames / steps : 36;
  if (steps > 0 && (cycle < 22 || cycle > 60)) throw new Error(`walk ${from}→${to} in ${frames} frames needs a ${cycle.toFixed(0)}-frame cycle`);
  return walk(f, from, to, start, frames, cycle);
};

// ——— text boxes on screen this frame (titles, captions, scene overlays), checked against the faces ———
const texts = { frame: -1, boxes: [] as { id: string; box: Box }[] };
export const reportText = (f: number, id: string, box: Box) => {
  if (texts.frame !== f) { texts.frame = f; texts.boxes = []; }
  texts.boxes.push({ id, box });
};
export const textsAt = (f: number) => (texts.frame === f ? texts.boxes : []);

/**
 * The keep-out gate, rendered after everything else: any text box over a visible face is a violation.
 * In the check render (`check`) a violation fails the frame; otherwise it is drawn as a red outline in
 * review renders (`show`) and is silent in the final.
 */
export const Gate: React.FC<{ f: number; check?: boolean; show?: boolean }> = ({ f, check = false, show = false }) => {
  const hits = facesAt(f).filter((x) => x.o > 0.5).flatMap((face) => textsAt(f).filter((t) => overlaps(face.box, t.box, 8)).map((t) => ({ face, t })));
  if (hits.length && check) throw new Error(`frame ${f}: text ${hits.map((h) => `${h.t.id}×${h.face.id}`).join(', ')} covers a face`);
  if (!show) return null;
  return <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    {facesAt(f).map((x) => <rect key={x.id} x={x.box[0]} y={x.box[1]} width={x.box[2] - x.box[0]} height={x.box[3] - x.box[1]} fill="none" stroke={hits.some((h) => h.face.id === x.id) ? '#E63946' : '#10B981'} strokeWidth={4} />)}
    {textsAt(f).map((t, k) => <rect key={k} x={t.box[0]} y={t.box[1]} width={t.box[2] - t.box[0]} height={t.box[3] - t.box[1]} fill="none" stroke="#2E7BC5" strokeWidth={3} strokeDasharray="10 8" />)}
  </svg>;
};
