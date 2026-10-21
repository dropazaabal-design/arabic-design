/**
 * Rig for SVGR-built characters (src/characters/<name>/Art.tsx, made from art/characters/<name>.svg).
 *
 * The art is drawn in its bind pose; every part turns about its own pivot and sits on the joint the pose
 * computes, so the drawing stays editable in any SVG tool while motion stays here. Poses and faces are the
 * kit's own (cartoon/rig.ts: same angle conventions as Person.tsx), so every named pose and expression,
 * track(), walk() and blink() work unchanged. Far = toward the facing side, drawn behind the torso.
 *
 * A grip is three layers: palm (gripBack), the held object at the hand's anchor, then the curled fingers
 * (gripFront) over it — the object is held, not pasted on top of a fist. 'edge' holds a board the same way
 * (fingers behind, thumb in front); 'pinch' holds something small between thumb and index tip.
 */
import React from 'react';
import { CALM, REST, type Face, type Pose } from '../cartoon/rig';
import { ANCHORS, PARTS, PIVOTS, type PartName } from './sultan/Art';

export const INK = '#0E1626';
export type SvgHand = 'open' | 'fist' | 'point' | 'pinch' | 'grip' | 'edge';
export type SvgLook = {
  skin: string; skinShade: string; hair: string; shirt: string; shirtShade: string;
  pants: string; pantsShade: string; slipper: string; shoe: string; shoeShade: string;
};
export type SvgPersonProps = {
  look: SvgLook; pose?: Pose; face?: Face; x?: number; y?: number; scale?: number; facing?: 1 | -1;
  handF?: SvgHand; handN?: SvgHand; holdF?: React.ReactNode; holdN?: React.ReactNode;
  /** Held objects keep upright instead of turning with the hand (a phone held to read, a lid lifted flat): both, or one side. */
  holdUpright?: boolean | 'F' | 'N';
  farInFront?: boolean; feet?: 'slipper' | 'runner'; blink?: number; breath?: number; id?: string;
  /** Extra wrist bend, degrees, + toward the facing side. */
  wristF?: number; wristN?: number;
  /** Wardrobe that changes who the character is, drawn in the part's own frame: glasses (frame colour),
   * a tie on the shirt (tie colour), and the moustache (on by default). */
  glasses?: string; tie?: string; moustache?: boolean;
};

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (deg: number): [number, number] => [Math.sin(rad(deg)), Math.cos(rad(deg))];
const add = (a: [number, number], b: [number, number], k = 1): [number, number] => [a[0] + b[0] * k, a[1] + b[1] * k];
const UPPER = 70, FORE = 64, THIGH = 74, SHIN = 72;
const P = PIVOTS;
// the bind skeleton, from the art's pivots (torso pivot = hip)
const HIP0 = P.torso[1], NECK_DY = P.head[1] - P.torso[1];
const SH_F: [number, number] = [P.upperArm[0], P.upperArm[1] - HIP0], SH_N: [number, number] = [-46, SH_F[1] + 2];
const LEG_X = P.thigh[0];

/** World joints for a pose (character space, feet at 0). Same maths as Person.joints(). */
export function svgJoints(p: Pose) {
  const hip: [number, number] = [0, HIP0 + p.bob + 72 * p.sit];
  const L = rad(p.lean);
  const rot = (x: number, y: number): [number, number] => [hip[0] + x * Math.cos(L) - y * Math.sin(L), hip[1] + x * Math.sin(L) + y * Math.cos(L)];
  const arm = (s: [number, number], a: number, e: number) => {
    const elbow = add(s, dir(a + p.lean), UPPER);
    return { shoulder: s, elbow, wrist: add(elbow, dir(a + e + p.lean), FORE), upperDeg: a + p.lean, foreDeg: a + e + p.lean };
  };
  const leg = (x: number, a: number, k: number) => {
    const top: [number, number] = [hip[0] + x, hip[1]];
    const knee = add(top, dir(a), THIGH);
    return { top, knee, ankle: add(knee, dir(a + k), SHIN), thighDeg: a, shinDeg: a + k };
  };
  return {
    hip, neck: rot(0, NECK_DY), lean: p.lean,
    armF: arm(rot(SH_F[0], SH_F[1]), p.shF, p.elF), armN: arm(rot(SH_N[0], SH_N[1]), p.shN, p.elN),
    legF: leg(LEG_X, p.hipF, p.knF), legN: leg(-LEG_X, p.hipN, p.knN),
  };
}

/** A part placed so its pivot lands on `at`, turned by `deg` (Person convention: + toward facing). */
const Place: React.FC<{ part: PartName; at: [number, number]; deg?: number; children?: React.ReactNode }> = ({ part, at, deg = 0, children }) => {
  const C = PARTS[part];
  const [px, py] = P[part];
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${(-deg).toFixed(2)}) translate(${-px} ${-py})`}>
      <C />{children}
    </g>
  );
};

// the part under the held object, and for two-layer hands the part drawn over it (fingers round a handle, a thumb on a board's face)
const HAND: Record<SvgHand, PartName> = { open: 'handOpen', fist: 'handFist', point: 'handPoint', pinch: 'handPinch', grip: 'gripBack', edge: 'edgeBack' };
const FRONT: Partial<Record<SvgHand, PartName>> = { grip: 'gripFront', edge: 'edgeFront' };

const Hand: React.FC<{ kind: SvgHand; at: [number, number]; deg: number; hold?: React.ReactNode; upright?: boolean }> = ({ kind, at, deg, hold, upright }) => {
  const part = HAND[kind], front = FRONT[kind];
  const [ax, ay] = ANCHORS[part] ?? P[part];
  // the held object sits at the anchor, in the hand's frame (or counter-rotated to stay upright)
  const held = hold && <g transform={`translate(${ax} ${ay})${upright ? ` rotate(${deg.toFixed(2)})` : ''}`}>{hold}</g>;
  return (
    <Place part={part} at={at} deg={deg}>
      {held}
      {front && React.createElement(PARTS[front])}
    </Place>
  );
};

type Arm = ReturnType<typeof svgJoints>['armF'];
const ArmView: React.FC<{ a: Arm; hand: SvgHand; hold?: React.ReactNode; wrist: number; upright?: boolean }> = ({ a, hand, hold, wrist, upright }) => (
  <g>
    <Place part="upperArm" at={a.shoulder} deg={a.upperDeg} />
    <Place part="forearm" at={a.elbow} deg={a.foreDeg} />
    <Hand kind={hand} at={a.wrist} deg={a.foreDeg + wrist} hold={hold} upright={upright} />
  </g>
);

type Leg = ReturnType<typeof svgJoints>['legF'];
const LegView: React.FC<{ l: Leg; feet: 'slipper' | 'runner' }> = ({ l, feet }) => (
  <g>
    <Place part={feet} at={l.ankle} deg={0} />
    <Place part="shin" at={l.knee} deg={l.shinDeg} />
    <Place part="thigh" at={l.top} deg={l.thighDeg} />
  </g>
);

/** Eyes, mouth, blush and sweat: drawn from the face values, in the head's frame (bind coordinates). */
const Features: React.FC<{ face: Face; blink: number; turn: number; uid: string; skin: string }> = ({ face, blink, turn, uid, skin }) => {
  const fx = (turn - 0.5) * 14; // the art is already three-quarter; a turn slides the features a little
  const lid = Math.min(1, face.lid + blink * (1 - face.lid));
  const eyes = [{ cx: -12, rx: 10.5, ry: 12.5, side: 'n' }, { cx: 28, rx: 8.6, ry: 12, side: 'f' }];
  const mw = 24 * face.wide, c = face.mouth * 8;
  return (
    <g transform={`translate(${fx.toFixed(2)} 0)`}>
      {eyes.map((e) => {
        const cid = `${uid}-eye-${e.side}`;
        const px = face.gx * 3.6 * (e.rx / 10.5), py = face.gy * 4;
        const top = -e.ry + lid * 2 * e.ry, bot = e.ry - face.lidLow * e.ry * 0.95;
        return (
          <g key={e.side} transform={`translate(${e.cx} -356)`}>
            <clipPath id={cid}><ellipse rx={e.rx} ry={e.ry} /></clipPath>
            <ellipse rx={e.rx} ry={e.ry} fill="#FBFCFE" />
            <g clipPath={`url(#${cid})`}>
              <circle cx={px} cy={py} r={6.2 * face.pupil * (e.rx / 10.5)} fill="#3B2A2F" />
              <circle cx={px} cy={py} r={3.4 * face.pupil * (e.rx / 10.5)} fill={INK} />
              <circle cx={px - 2} cy={py - 2.4} r={1.8} fill="#FFFFFF" />
              {face.sparkle > 0 && <path d={`M${px + 2} ${py - 1} l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 Z`} fill="#FFFFFF" opacity={face.sparkle} />}
              <rect x={-e.rx - 2} y={-e.ry - 2} width={e.rx * 2 + 4} height={Math.max(0, top + e.ry + 2)} fill={skin} />
              <rect x={-e.rx - 2} y={bot} width={e.rx * 2 + 4} height={e.ry * 2} fill={skin} />
            </g>
            <ellipse rx={e.rx} ry={e.ry} fill="none" stroke={INK} strokeWidth={2.6} />
            {lid > 0.06 && <path d={`M${-e.rx} ${top} Q0 ${top + 2.5} ${e.rx} ${top}`} stroke={INK} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
          </g>
        );
      })}
      {face.blush > 0 && <g fill="#E07F9B" opacity={face.blush * 0.5}><ellipse cx={-28} cy={-326} rx={10} ry={5.5} /><ellipse cx={46} cy={-328} rx={7} ry={5} /></g>}
      {face.sweat > 0 && <path d="M54 -380 Q46 -364 54 -360 Q62 -364 54 -380 Z" fill="#A8DDF2" stroke={INK} strokeWidth={2} opacity={face.sweat} />}
      <g transform="translate(27 -301)">
        {face.open < 0.06
          ? <path d={`M${-mw / 2} 0 Q0 ${c * 2} ${mw / 2} 0`} fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
          : <g>
            <path d={`M${-mw / 2} 0 Q0 ${c} ${mw / 2} 0 Q0 ${c + face.open * 24} ${-mw / 2} 0 Z`} fill="#5B2335" stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
            {face.mouth > 0.3 && <path d={`M${-mw / 2 + 4} 2 Q0 ${c + 2} ${mw / 2 - 4} 2 L${mw / 2 - 6} 5 Q0 ${c + 6} ${-mw / 2 + 6} 5 Z`} fill="#FFFFFF" />}
          </g>}
      </g>
    </g>
  );
};

const Brow: React.FC<{ part: 'browNear' | 'browFar'; face: Face; turn: number }> = ({ part, face, turn }) => {
  const [px, py] = P[part];
  const sign = part === 'browNear' ? -1 : 1; // inner end of the near brow points toward the face centre
  return (
    <g transform={`translate(${((turn - 0.5) * 14).toFixed(2)} ${(-face.browY * 7).toFixed(2)}) rotate(${(sign * face.brow * 18).toFixed(2)} ${px} ${py})`}>
      {React.createElement(PARTS[part])}
    </g>
  );
};

export const SvgPerson: React.FC<SvgPersonProps> = ({
  look, pose = REST, face = CALM, x = 0, y = 0, scale = 1, facing = 1, handF = 'fist', handN = 'fist', holdF, holdN, holdUpright = false,
  farInFront = false, feet = 'slipper', blink = 0, breath = 0, id = 'sp', wristF = 0, wristN = 0, glasses, tie, moustache = true,
}) => {
  const j = svgJoints(pose);
  const vars = {
    '--skin': look.skin, '--skin-shade': look.skinShade, '--hair': look.hair, '--shirt': look.shirt, '--shirt-shade': look.shirtShade,
    '--pants': look.pants, '--pants-shade': look.pantsShade, '--slipper': look.slipper, '--shoe': look.shoe, '--shoe-shade': look.shoeShade,
  } as React.CSSProperties;
  const up = (s: 'F' | 'N') => holdUpright === true || holdUpright === s;
  const farArm = <ArmView a={j.armF} hand={handF} hold={holdF} wrist={wristF} upright={up('F')} />;
  const [hx, hy] = P.head;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`} style={vars} data-character={id}>
      <ellipse cx={0} cy={2} rx={64} ry={9} fill="#0E1626" opacity={0.14} />
      <LegView l={j.legF} feet={feet} />
      <LegView l={j.legN} feet={feet} />
      {!farInFront && farArm}
      <g transform={`translate(${j.hip[0].toFixed(2)} ${(j.hip[1] - breath * 0.4).toFixed(2)}) rotate(${j.lean.toFixed(2)}) translate(${-P.torso[0]} ${-P.torso[1]})`}>
        {React.createElement(PARTS.torso)}
        {tie && <g>
          <path d="M-14 -288 L-2 -272 L-6 -262 Z M16 -288 L4 -272 L8 -262 Z" fill="#F4F7FB" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
          <path d="M-5 -278 L7 -278 L5 -266 L-3 -266 Z" fill={tie} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
          <path d="M-3 -266 L5 -266 L9 -206 L1 -196 L-7 -206 Z" fill={tie} stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
        </g>}
      </g>
      <g transform={`translate(${j.neck[0].toFixed(2)} ${(j.neck[1] - breath).toFixed(2)}) rotate(${(j.lean + pose.headTilt).toFixed(2)}) translate(${-hx} ${-hy})`}>
        {React.createElement(PARTS.head)}
        <g transform={`translate(${((pose.headTurn - 0.5) * 6).toFixed(2)} 0)`}>{React.createElement(PARTS.hair)}</g>
        <g transform={`translate(${((pose.headTurn - 0.5) * 16).toFixed(2)} 0)`}>{React.createElement(PARTS.nose)}{moustache && React.createElement(PARTS.moustache)}</g>
        {/* eyes and mouth after the moustache, so an expression is never covered */}
        <Features face={face} blink={blink} turn={pose.headTurn} uid={id} skin={look.skin} />
        <Brow part="browNear" face={face} turn={pose.headTurn} />
        <Brow part="browFar" face={face} turn={pose.headTurn} />
        {glasses && <g transform={`translate(${((pose.headTurn - 0.5) * 14).toFixed(2)} 0)`} fill="rgba(220,236,240,0.16)" stroke={glasses} strokeWidth={3.6} strokeLinejoin="round">
          <rect x={-29} y={-373} width={33} height={33} rx={10} />
          <rect x={14} y={-372} width={28} height={32} rx={9} />
          <path d="M4 -359 Q9 -363 14 -359 M-29 -360 L-52 -356" fill="none" strokeLinecap="round" />
        </g>}
      </g>
      {farInFront && farArm}
      <ArmView a={j.armN} hand={handN} hold={holdN} wrist={wristN} upright={up('N')} />
    </g>
  );
};

/** Where a hand's anchor ends up in character space (for things that must meet the hand, e.g. a lid). */
export function anchorAt(p: Pose, side: 'F' | 'N', hand: SvgHand, wrist = 0): [number, number] {
  const j = svgJoints(p);
  const a = side === 'F' ? j.armF : j.armN;
  const part = HAND[hand];
  const [ax, ay] = ANCHORS[part] ?? P[part];
  const [px, py] = P[part];
  const d = rad(-(a.foreDeg + wrist));
  const dx = ax - px, dy = ay - py;
  return [a.wrist[0] + dx * Math.cos(d) - dy * Math.sin(d), a.wrist[1] + dx * Math.sin(d) + dy * Math.cos(d)];
}

/**
 * Two-joint reach: shoulder and elbow angles that put a hand's anchor (grip point) on `target`
 * (character space, unscaled, facing +x). `bend` +1 keeps the elbow low and back, −1 lifts it.
 * Out-of-reach targets give the straight arm toward them.
 */
export function reach(p: Pose, side: 'F' | 'N', target: [number, number], hand: SvgHand = 'grip', bend: 1 | -1 = 1): Pose {
  const part = HAND[hand];
  const [ax, ay] = ANCHORS[part] ?? P[part];
  const [px, py] = P[part];
  const grip = Math.hypot(ax - px, ay - py); // the anchor sits this far down the hand, along the forearm
  let q = { ...p };
  for (let k = 0; k < 3; k++) {
    const j = svgJoints(q);
    const s = (side === 'F' ? j.armF : j.armN).shoulder;
    const fore = (side === 'F' ? j.armF : j.armN).foreDeg;
    const wrist: [number, number] = [target[0] - grip * Math.sin(rad(fore)), target[1] - grip * Math.cos(rad(fore))];
    const dx = wrist[0] - s[0], dy = wrist[1] - s[1];
    const d = Math.min(UPPER + FORE - 0.5, Math.max(Math.abs(UPPER - FORE) + 0.5, Math.hypot(dx, dy)));
    const theta = (Math.atan2(dx, dy) * 180) / Math.PI; // dir() convention: 0 = down, + toward facing
    const alpha = (Math.acos((UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d)) * 180) / Math.PI;
    const upperAbs = theta + bend * alpha;
    const elbow = add(s, dir(upperAbs), UPPER);
    const foreAbs = (Math.atan2(wrist[0] - elbow[0], wrist[1] - elbow[1]) * 180) / Math.PI;
    const sh = upperAbs - q.lean, el = foreAbs - upperAbs;
    q = side === 'F' ? { ...q, shF: sh, elF: el } : { ...q, shN: sh, elN: el };
  }
  return q;
}
