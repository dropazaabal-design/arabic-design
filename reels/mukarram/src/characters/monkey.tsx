import React from 'react';
import { EXPRESSIONS, Expression, ExprName, Face } from './face';
import { INK, LINE, PAL, openPath, stroke, wobEllipse } from './ink';
import { BUILD, Build, armJoints } from './rig';

// The monkey: a sitting rig with its own silhouette (pear body, big round ears, light face mask, curly
// tail) but the same face system and arm maths as the people, so it blinks, looks, emotes and holds props.

export type MonkeyPose = {
  armL: [number, number];
  armR: [number, number];
  lean: number;
  tilt: number;
  /** tail wave phase (radians) */
  tail: number;
  /** 0 = sitting still, 1 = a small hop off the ground */
  hop: number;
};

export const MONKEY_POSES = {
  sit: { armL: [14, 10], armR: [14, 10], lean: 0, tilt: 0, tail: 0, hop: 0 },
  eat: { armL: [14, 10], armR: [26, -150], lean: 2, tilt: -6, tail: 0, hop: 0 },
  peel: { armL: [-30, -60], armR: [-26, -70], lean: 4, tilt: 6, tail: 0, hop: 0 },
  tossBack: { armL: [14, 10], armR: [170, 40], lean: -6, tilt: 8, tail: 0, hop: 0 },
  patBelly: { armL: [-10, -70], armR: [-6, -78], lean: -4, tilt: -4, tail: 0, hop: 0 },
  hatOn: { armL: [150, 40], armR: [150, 40], lean: 0, tilt: -6, tail: 0, hop: 0 },
  holdSign: { armL: [70, 20], armR: [70, 20], lean: 0, tilt: 10, tail: 0, hop: 0 },
  scratch: { armL: [14, 10], armR: [160, 80], lean: 0, tilt: 12, tail: 0, hop: 0 },
  drop: { armL: [14, 10], armR: [70, 30], lean: 10, tilt: 6, tail: 0, hop: 0 },
  dust: { armL: [-20, -80], armR: [-24, -84], lean: 0, tilt: -2, tail: 0, hop: 0 },
  thumbs: { armL: [14, 10], armR: [40, -110], lean: 0, tilt: 8, tail: 0, hop: 0 },
} satisfies Record<string, MonkeyPose>;

export const mixMonkey = (a: MonkeyPose, b: MonkeyPose, t: number): MonkeyPose => {
  const k = Math.max(0, Math.min(1, t));
  const L = (x: number, y: number) => x + (y - x) * k;
  return {
    armL: [L(a.armL[0], b.armL[0]), L(a.armL[1], b.armL[1])], armR: [L(a.armR[0], b.armR[0]), L(a.armR[1], b.armR[1])],
    lean: L(a.lean, b.lean), tilt: L(a.tilt, b.tilt), tail: L(a.tail, b.tail), hop: L(a.hop, b.hop),
  };
};

// Arms reuse the person maths with a monkey build (long arms, shoulders on the pear body).
const MB: Build = { ...BUILD, torsoH: 196, shX: 50, upper: 78, fore: 82, limbW: 12, skin: PAL.tanLight, seed: 71 };
const BODY_Y = -18;   // body sits on the ground with a little squash under it

const Tube: React.FC<{ d: string; w: number; fill: string }> = ({ d, w, fill }) => (
  <g fill="none">
    <path d={d} {...stroke(w + LINE * 1.4)} />
    <path d={d} {...stroke(w, fill)} />
  </g>
);

const MArm: React.FC<{ side: -1 | 1; a: [number, number]; item?: React.ReactNode; open?: boolean }> = ({ side, a, item, open }) => {
  const { s, e, w } = armJoints(MB, side, a);
  return (
    <g>
      <Tube d={openPath([s, e, w])} w={18} fill={PAL.tan} />
      <path d={wobEllipse(w[0], w[1] + 4, open ? 17 : 14, open ? 15 : 14, 80 + side, 0.06, 8)} fill={PAL.tanLight} {...stroke(LINE * 0.8)} />
      {item && <g transform={`translate(${w[0]} ${w[1]})`}>{item}</g>}
    </g>
  );
};

export type MonkeyProps = {
  x: number;
  y: number;
  s?: number;
  facing?: 1 | -1;
  pose?: MonkeyPose;
  expr?: Expression | ExprName;
  blink?: number;
  look?: [number, number];
  glance?: [number, number];
  talk?: number;
  itemL?: React.ReactNode;
  itemR?: React.ReactNode;
  /** drawn on top of the head (e.g. the bin worn as a hat) */
  hat?: React.ReactNode;
};

export const Monkey: React.FC<MonkeyProps> = ({ x, y, s = 1, facing = 1, pose = MONKEY_POSES.sit, expr = 'neutral', blink = 0, look = [0, 0], glance = [0, 0], talk = 0, itemL, itemR, hat }) => {
  const e = typeof expr === 'string' ? EXPRESSIONS[expr] : expr;
  const tail = pose.tail;
  const tailD = openPath([[-50, -40], [-110, -30 + Math.sin(tail) * 8], [-150, -80 + Math.sin(tail + 1) * 14], [-130, -130 + Math.sin(tail + 2) * 12], [-100, -118], [-112, -96]]);
  const lift = Math.sin(Math.min(1, pose.hop) * Math.PI) * 60;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * facing} ${s})`}>
      <ellipse cx={0} cy={4} rx={110 * (1 - lift / 200)} ry={14} fill={PAL.shadow} />
      <g transform={`translate(0 ${-lift})`}>
        <Tube d={tailD} w={14} fill={PAL.tan} />
        <g transform={`translate(0 ${BODY_Y}) rotate(${pose.lean})`}>
          {/* sitting legs */}
          <path d={wobEllipse(-52, -12, 50, 30, 72, 0.04, 9)} fill={PAL.tan} {...stroke()} />
          <path d={wobEllipse(52, -12, 50, 30, 73, 0.04, 9)} fill={PAL.tan} {...stroke()} />
          <path d={wobEllipse(-82, 6, 30, 16, 74, 0.05, 8)} fill={PAL.tanLight} {...stroke(LINE * 0.9)} />
          <path d={wobEllipse(82, 6, 30, 16, 75, 0.05, 8)} fill={PAL.tanLight} {...stroke(LINE * 0.9)} />
          {/* body */}
          <path d={openPath([[0, -196], [52, -170], [74, -96], [62, -26], [0, -6], [-62, -26], [-74, -96], [-52, -170], [0, -196]]) + 'Z'} fill={PAL.tan} {...stroke()} />
          <path d={wobEllipse(0, -84, 40, 54, 76, 0.04, 9)} fill={PAL.tanLight} {...stroke(LINE * 0.7)} />
          <MArm side={-1} a={pose.armL} item={itemL} open={!!itemL} />
          <MArm side={1} a={pose.armR} item={itemR} open={!!itemR} />
          {/* head */}
          <g transform={`translate(0 -262) rotate(${pose.tilt})`}>
            {[-1, 1].map((k) => (
              <g key={k}>
                <path d={wobEllipse(k * 84, -2, 34, 32, 77 + k, 0.04, 8)} fill={PAL.tan} {...stroke()} />
                <path d={wobEllipse(k * 86, 0, 18, 17, 79 + k, 0.05, 8)} fill={PAL.tanLight} />
              </g>
            ))}
            <path d={wobEllipse(0, 0, 80, 74, 81, 0.025, 12)} fill={PAL.tan} {...stroke()} />
            {[-1, 0, 1].map((k) => <path key={k} d={`M${k * 9} -72 q ${k * 8} -22 ${k * 16 + 8} -28`} fill="none" {...stroke(LINE * 0.8)} />)}
            <g transform={`translate(${look[0] * 12} ${look[1] * 6})`}>
              <path d={openPath([[0, -36], [30, -48], [52, -18], [44, 22], [40, 52], [0, 62], [-40, 52], [-44, 22], [-52, -18], [-30, -48], [0, -36]]) + 'Z'} fill={PAL.tanLight} {...stroke(LINE * 0.75)} />
              <circle cx={-7} cy={22} r={3.5} fill={INK} />
              <circle cx={7} cy={22} r={3.5} fill={INK} />
            </g>
            <g transform="translate(0 2)">
              <Face rx={70} ry={64} expr={e} blink={blink} look={look} talk={talk} glance={glance} mouthY={0.66} />
            </g>
            {hat}
          </g>
        </g>
      </g>
    </g>
  );
};
