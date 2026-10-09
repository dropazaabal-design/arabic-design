import React from 'react';
import { EXPRESSIONS, Expression, ExprName, Face } from './face';
import { INK, LINE, PAL, clamp, deg, lerp, openPath, rand, stroke, wobEllipse } from './ink';

// A doodle person as separate layers: legs, torso, two two-segment arms with hands, head with face and
// accessories. Every layer moves on its own: limbs by joint angles, the torso by lean and squash, the
// head by tilt and turn, the face by expression/blink/look/talk. Origin = the ground between the feet;
// the hips rise or sink so the lowest foot always touches the ground.

export type Hand = 'mitten' | 'fist' | 'point' | 'open' | 'thumb' | 'pinch';
export type Pose = {
  /** shoulder angle (0 = hanging down, + = outward, 180 = straight up, − = across the body), elbow bend (+ = further outward) */
  armL: [number, number];
  armR: [number, number];
  /** hip angle (+ = toward the facing side), knee bend (+ = foot goes back) */
  legL: [number, number];
  legR: [number, number];
  lean: number;
  tilt: number;
  squash: number;
  handL: Hand;
  handR: Hand;
  /** hip spacing (1 = facing us, ~0.25 = walking sideways) */
  stance?: number;
};

export const POSES = {
  stand: { armL: [8, 6], armR: [8, 6], legL: [-3, 0], legR: [3, 0], lean: 0, tilt: 0, squash: 0, handL: 'mitten', handR: 'mitten' },
  wave: { armL: [8, 6], armR: [140, 30], legL: [-3, 0], legR: [3, 0], lean: 0, tilt: 4, squash: 0, handL: 'mitten', handR: 'open' },
  point: { armL: [8, 6], armR: [78, 4], legL: [-3, 0], legR: [3, 0], lean: 3, tilt: -3, squash: 0, handL: 'mitten', handR: 'point' },
  pointCam: { armL: [10, 4], armR: [40, -70], legL: [-3, 0], legR: [3, 0], lean: 2, tilt: -4, squash: 0, handL: 'mitten', handR: 'point' },
  shrug: { armL: [55, 95], armR: [55, 95], legL: [-3, 0], legR: [3, 0], lean: 0, tilt: 6, squash: -0.03, handL: 'open', handR: 'open' },
  palmsOut: { armL: [38, 70], armR: [38, 70], legL: [-4, 0], legR: [4, 0], lean: 0, tilt: -3, squash: 0, handL: 'open', handR: 'open' },
  handOnChest: { armL: [8, 6], armR: [-6, -128], legL: [-3, 0], legR: [3, 0], lean: 0, tilt: -5, squash: 0, handL: 'mitten', handR: 'open' },
  hipsHands: { armL: [42, -95], armR: [42, -95], legL: [-7, 0], legR: [7, 0], lean: -3, tilt: 0, squash: 0.02, handL: 'fist', handR: 'fist' },
  holdUp: { armL: [8, 6], armR: [118, 18], legL: [-3, 0], legR: [3, 0], lean: 0, tilt: 0, squash: 0, handL: 'mitten', handR: 'pinch' },
  // torso tipped forward 58°: arms at −58/+58 in torso space hang straight down to the ground
  bend: { armL: [-52, 6], armR: [56, 8], legL: [-6, 4], legR: [8, 8], lean: 58, tilt: 18, squash: 0, handL: 'open', handR: 'pinch' },
  thumbsUp: { armL: [8, 6], armR: [32, -100], legL: [-3, 0], legR: [3, 0], lean: 0, tilt: 5, squash: 0, handL: 'mitten', handR: 'thumb' },
  scratch: { armL: [8, 6], armR: [150, 70], legL: [-3, 0], legR: [3, 0], lean: 0, tilt: 8, squash: 0, handL: 'mitten', handR: 'fist' },
  eat: { armL: [8, 6], armR: [20, -135], legL: [-3, 0], legR: [3, 0], lean: 0, tilt: -4, squash: 0, handL: 'mitten', handR: 'fist' },
} satisfies Record<string, Pose>;
export type PoseName = keyof typeof POSES;

/** Interpolate two poses (hands switch at the midpoint). */
export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const k = clamp(t);
  const two = (x: [number, number], y: [number, number]): [number, number] => [lerp(x[0], y[0], k), lerp(x[1], y[1], k)];
  return {
    armL: two(a.armL, b.armL), armR: two(a.armR, b.armR), legL: two(a.legL, b.legL), legR: two(a.legR, b.legR),
    lean: lerp(a.lean, b.lean, k), tilt: lerp(a.tilt, b.tilt, k), squash: lerp(a.squash, b.squash, k),
    handL: k < 0.5 ? a.handL : b.handL, handR: k < 0.5 ? a.handR : b.handR,
    stance: lerp(a.stance ?? 1, b.stance ?? 1, k),
  };
};

/** A walk cycle: phase in cycles (1 = two steps). Legs swing, arms counter-swing, the torso rocks. */
export const walkPose = (phase: number, stride = 1, base: Pose = POSES.stand): Pose => {
  const a = Math.sin(phase * Math.PI * 2);
  const lift = (x: number) => Math.max(0, x);
  return {
    ...base,
    legL: [a * 24 * stride, lift(-Math.cos(phase * Math.PI * 2)) * 34 * stride],
    legR: [-a * 24 * stride, lift(Math.cos(phase * Math.PI * 2)) * 34 * stride],
    armL: [base.armL[0] - a * 14 * stride, base.armL[1] + 8],
    armR: [base.armR[0] + a * 14 * stride, base.armR[1] + 8],
    lean: base.lean + 4 * stride,
    tilt: base.tilt + a * 2,
    squash: base.squash + Math.abs(a) * 0.015,
    stance: 0.25,
  };
};

export type Build = {
  headRX: number;
  headRY: number;
  torsoW: number;
  torsoH: number;
  belly: number;
  shX: number;
  hipX: number;
  thigh: number;
  shin: number;
  upper: number;
  fore: number;
  limbW: number;
  skin: string;
  shirt: string;
  shoe: string;
  seed: number;
};

export const BUILD: Build = {
  headRX: 92, headRY: 98, torsoW: 150, torsoH: 210, belly: 0.55, shX: 58, hipX: 26,
  thigh: 82, shin: 78, upper: 86, fore: 80, limbW: 10, skin: PAL.white, shirt: PAL.white, shoe: INK, seed: 1,
};

type Vec = [number, number];
const dirL = (a: number): Vec => [-Math.sin(deg(a)), Math.cos(deg(a))];

/** Joint positions of one arm in torso space (side −1 = screen left, +1 = screen right). */
export const armJoints = (b: Build, side: -1 | 1, [sh, el]: [number, number]) => {
  const s: Vec = [side * b.shX, -b.torsoH + 34];
  const u = dirL(sh), f = dirL(sh + el);
  // the screen-right arm is the mirror image of the screen-left one
  const e: Vec = [s[0] + (side === -1 ? u[0] : -u[0]) * b.upper, s[1] + u[1] * b.upper];
  const w: Vec = [e[0] + (side === -1 ? f[0] : -f[0]) * b.fore, e[1] + f[1] * b.fore];
  return { s, e, w, foreAngle: side === -1 ? sh + el : -(sh + el) };
};

const legJoints = (b: Build, side: -1 | 1, [hp, kn]: [number, number], stance = 1) => {
  const h: Vec = [side * b.hipX * stance, 0];
  const k: Vec = [h[0] + Math.sin(deg(hp)) * b.thigh, Math.cos(deg(hp)) * b.thigh];
  const f: Vec = [k[0] + Math.sin(deg(hp - kn)) * b.shin, k[1] + Math.cos(deg(hp - kn)) * b.shin];
  return { h, k, f };
};

/** Height of the hips above the ground for a pose (lowest foot on the ground). */
export const hipHeight = (b: Build, p: Pose) => Math.max(legJoints(b, -1, p.legL, p.stance).f[1], legJoints(b, 1, p.legR, p.stance).f[1]);

/** Where a hand is, in the character's own space (before position/scale/facing), so props can follow it. */
export const handLocal = (b: Build, p: Pose, side: -1 | 1): Vec => {
  const { w } = armJoints(b, side, side === -1 ? p.armL : p.armR);
  const hy = -hipHeight(b, p);
  const a = deg(p.lean);
  const sq = 1 + p.squash;
  const x = w[0] * (1 - p.squash * 0.5), y = w[1] * sq;
  return [x * Math.cos(a) - y * Math.sin(a), hy + x * Math.sin(a) + y * Math.cos(a)];
};

const HandShape: React.FC<{ kind: Hand; r: number; skin: string; lw: number }> = ({ kind, r, skin, lw }) => {
  const st = stroke(lw);
  switch (kind) {
    case 'fist':
      return <circle cx={0} cy={r * 0.6} r={r * 0.85} fill={skin} {...st} />;
    case 'point':
      return (<g><path d={`M0 ${r * 0.8} L0 ${r * 2.6}`} {...stroke(lw * 1.25)} /><circle cx={0} cy={r * 0.6} r={r * 0.82} fill={skin} {...st} /></g>);
    case 'thumb':
      return (<g><circle cx={0} cy={r * 0.6} r={r * 0.85} fill={skin} {...st} /><path d={`M${-r * 0.2} ${r * 0.1} L${-r * 0.2} ${-r * 1.3}`} {...stroke(lw * 1.3)} /></g>);
    case 'open':
      return (
        <g>
          {[-0.55, 0, 0.55].map((dx, i) => <path key={i} d={`M${dx * r} ${r * 1.0} L${dx * r * 1.5} ${r * 2.05}`} {...stroke(lw)} />)}
          <path d={`M${r * 0.75} ${r * 0.5} L${r * 1.55} ${r * 0.9}`} {...stroke(lw)} />
          <ellipse cx={0} cy={r * 0.75} rx={r * 0.9} ry={r * 0.78} fill={skin} {...st} />
        </g>
      );
    case 'pinch':
      return (<g><ellipse cx={0} cy={r * 0.7} rx={r * 0.8} ry={r * 0.9} fill={skin} {...st} /><path d={`M${r * 0.5} ${r * 0.3} Q${r * 1.2} ${r * 0.9} ${r * 0.45} ${r * 1.35}`} fill="none" {...stroke(lw)} /></g>);
    case 'mitten':
    default:
      return (<g><ellipse cx={0} cy={r * 0.75} rx={r * 0.85} ry={r * 0.95} fill={skin} {...st} /><path d={`M${r * 0.7} ${r * 0.35} Q${r * 1.35} ${r * 0.5} ${r * 0.9} ${r * 0.95}`} fill="none" {...stroke(lw * 0.9)} /></g>);
  }
};

const Arm: React.FC<{ b: Build; side: -1 | 1; a: [number, number]; hand: Hand; item?: React.ReactNode; sleeve?: string }> = ({ b, side, a, hand, item, sleeve }) => {
  const { s, e, w, foreAngle } = armJoints(b, side, a);
  const d = openPath([s, [lerp(s[0], e[0], 0.5) + side * 2, lerp(s[1], e[1], 0.5)], e, w]);
  return (
    <g>
      {sleeve && <path d={openPath([s, [lerp(s[0], e[0], 0.45), lerp(s[1], e[1], 0.45)]])} {...stroke(b.limbW * 3.2, INK)} fill="none" />}
      {sleeve && <path d={openPath([s, [lerp(s[0], e[0], 0.45), lerp(s[1], e[1], 0.45)]])} {...stroke(b.limbW * 3.2 - LINE * 1.4, sleeve)} fill="none" />}
      <path d={d} fill="none" {...stroke(b.limbW)} />
      <g transform={`translate(${w[0]} ${w[1]}) rotate(${foreAngle})`}>
        <HandShape kind={hand} r={b.limbW * 1.75} skin={b.skin} lw={LINE * 0.8} />
      </g>
      {item && <g transform={`translate(${w[0]} ${w[1]})`}>{item}</g>}
    </g>
  );
};

const Leg: React.FC<{ b: Build; side: -1 | 1; a: [number, number]; stance?: number }> = ({ b, side, a, stance = 1 }) => {
  const { h, k, f } = legJoints(b, side, a, stance);
  return (
    <g>
      <path d={openPath([h, k, f])} fill="none" {...stroke(b.limbW)} />
      <path d={wobEllipse(f[0] + 9, f[1] - 4, b.limbW * 2.1, b.limbW * 1.15, b.seed + side * 7, 0.05, 8)} fill={b.shoe} {...stroke(LINE * 0.8)} />
    </g>
  );
};

/** The torso as a bean: narrow shoulders, rounder belly. */
const torsoPath = (b: Build) => {
  const W = b.torsoW, H = b.torsoH, bl = b.belly;
  const pts: Vec[] = [
    [0, -H - 6], [W * 0.36, -H + 8], [W * 0.46, -H * 0.62], [W * (0.44 + bl * 0.1), -H * 0.25], [W * 0.38, 0], [0, 10],
    [-W * 0.38, 0], [-W * (0.44 + bl * 0.1), -H * 0.25], [-W * 0.46, -H * 0.62], [-W * 0.36, -H + 8],
  ];
  return openPath([...pts, pts[0]]) + 'Z';
};

export type PersonProps = {
  x: number;
  y: number;
  s?: number;
  facing?: 1 | -1;
  build?: Partial<Build>;
  pose?: Pose;
  expr?: Expression | ExprName;
  blink?: number;
  look?: [number, number];
  glance?: [number, number];
  talk?: number;
  /** breathing / idle bounce in px (applied to the upper body) */
  bob?: number;
  opacity?: number;
  /** drawn on the torso (clothes details), in torso space */
  torsoDetail?: React.ReactNode;
  /** drawn on the head, behind / in front of the face, in head space (centre = 0,0) */
  headBack?: React.ReactNode;
  headFront?: React.ReactNode;
  /** props carried by the hands, drawn at the wrist */
  itemL?: React.ReactNode;
  itemR?: React.ReactNode;
  sleeves?: boolean;
  shadow?: boolean;
};

export const Person: React.FC<PersonProps> = ({
  x, y, s = 1, facing = 1, build = {}, pose = POSES.stand as Pose, expr = 'neutral', blink = 0, look = [0, 0], glance = [0, 0], talk = 0, bob = 0,
  opacity = 1, torsoDetail, headBack, headFront, itemL, itemR, sleeves = true, shadow = true,
}) => {
  const b = { ...BUILD, ...build };
  const e = typeof expr === 'string' ? EXPRESSIONS[expr] : expr;
  const hy = hipHeight(b, pose);
  const sq = 1 + pose.squash;
  const headY = -b.torsoH - b.headRY * 0.62;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`} opacity={opacity}>
      {shadow && <ellipse cx={0} cy={4} rx={b.torsoW * 0.62} ry={14} fill={PAL.shadow} />}
      <g transform={`translate(0 ${-hy})`}>
        <Leg b={b} side={-1} a={pose.legL} stance={pose.stance} />
        <Leg b={b} side={1} a={pose.legR} stance={pose.stance} />
        <g transform={`translate(0 ${-bob}) rotate(${pose.lean}) scale(${1 - pose.squash * 0.5} ${sq})`}>
          <path d={torsoPath(b)} fill={b.shirt} {...stroke()} />
          {torsoDetail}
          <Arm b={b} side={-1} a={pose.armL} hand={pose.handL} item={itemL} sleeve={sleeves ? b.shirt : undefined} />
          <Arm b={b} side={1} a={pose.armR} hand={pose.handR} item={itemR} sleeve={sleeves ? b.shirt : undefined} />
          <g transform={`translate(0 ${headY}) rotate(${pose.tilt})`}>
            {headBack}
            <path d={wobEllipse(0, 0, b.headRX, b.headRY, b.seed, 0.02, 12)} fill={b.skin} {...stroke()} />
            <Face rx={b.headRX} ry={b.headRY} expr={e} blink={blink} look={look} talk={talk} glance={glance} />
            {headFront}
          </g>
        </g>
      </g>
    </g>
  );
};

/** Deterministic blinks: one every 2.6–4.2 s per character seed, each 5 frames long (returns 0..1). */
export const blinkAt = (frame: number, fps: number, seed = 1) => {
  let t = 0, k = 0;
  while (t < frame + fps * 5) {
    const gap = Math.round(fps * (2.6 + rand(seed * 17 + k) * 1.6));
    t += gap;
    const d = frame - t;
    if (d >= 0 && d < 5) return [0.5, 1, 1, 0.6, 0.2][d];
    k++;
    if (t > frame) break;
  }
  return 0;
};

/** Idle breathing: a slow 0..1 wave for squash/bob. */
export const breath = (frame: number, fps: number, seed = 1) => Math.sin((frame / fps) * Math.PI * 2 * 0.28 + seed);
