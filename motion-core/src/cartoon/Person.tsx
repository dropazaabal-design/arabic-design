/**
 * Baseera cartoon person — the drawn half of the character kit.
 *
 * Original flat characters with an ink outline. Expression lives in the face (lids, brows,
 * gaze, mouth, blush, sweat); intention lives in the body (lean, arms, legs). Everything is
 * a pure function of the props, so a scene drives it with rig.ts tracks.
 *
 * Local space: origin between the feet, +x toward the side the character faces, 1 unit = 1 px
 * at scale 1. An adult stands ~450 units tall.
 */
import React from 'react';
import { CALM, REST, type Face, type Pose } from './rig';

export const INK = '#0E1626';

export type Look = {
  skin: string; skinShade: string;
  hair: 'short' | 'wavy' | 'bald' | 'hijab' | 'cap';
  hairColor: string;
  beard?: 'stubble' | 'full';
  glasses?: boolean;
  top: string; topShade: string;
  collar?: 'shirt' | 'sweater' | 'jacket' | 'none';
  bottom: string;
  dress?: boolean;      // long dress over the legs
  shoes: string;
  hijab?: string;       // hijab colour when hair = 'hijab'
  cap?: string;         // cap colour when hair = 'cap'
  build?: number;       // width factor, default 1
};

export type Hand = 'fist' | 'open' | 'point';

export type PersonProps = {
  look: Look;
  pose?: Pose;
  face?: Face;
  x?: number; y?: number; scale?: number;
  facing?: 1 | -1;
  handF?: Hand; handN?: Hand;
  holdF?: React.ReactNode; holdN?: React.ReactNode; // drawn at the hand, upright, in front of the body
  holdMid?: React.ReactNode; // drawn between the two hands (a box carried in front)
  farInFront?: boolean;      // draw the far arm over the torso (phone held up, arms crossed)
  blink?: number;   // 0 … 1 extra lid closure, from rig.blink()
  breath?: number;  // px, from rig.breathe()
  id?: string;      // unique prefix for clip paths when the same look appears twice
};

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (deg: number): [number, number] => [Math.sin(rad(deg)), Math.cos(rad(deg))];

const HIP_Y = -146, SHOULDER_DY = -128, THIGH = 74, SHIN = 72, UPPER = 70, FORE = 64;

/** Joint positions in local space, for scenes that need to attach things to a hand. */
export function joints(p: Pose, build = 1) {
  const sitDrop = 72 * p.sit;
  const hip: [number, number] = [0, HIP_Y + p.bob + sitDrop];
  const lean = rad(p.lean);
  const rot = (x: number, y: number): [number, number] => [
    hip[0] + x * Math.cos(lean) - y * Math.sin(lean),
    hip[1] + x * Math.sin(lean) + y * Math.cos(lean),
  ];
  const w = 46 * build;
  const shF = rot(w * 0.82, SHOULDER_DY + 6), shN = rot(-w, SHOULDER_DY + 8);
  const arm = (s: [number, number], a: number, e: number) => {
    const d1 = dir(a + p.lean), d2 = dir(a + e + p.lean);
    const elbow: [number, number] = [s[0] + d1[0] * UPPER, s[1] + d1[1] * UPPER];
    const hand: [number, number] = [elbow[0] + d2[0] * FORE, elbow[1] + d2[1] * FORE];
    return { shoulder: s, elbow, hand, foreDeg: a + e + p.lean };
  };
  const leg = (x: number, a: number, k: number) => {
    const top: [number, number] = [hip[0] + x, hip[1]];
    const d1 = dir(a), d2 = dir(a + k);
    const knee: [number, number] = [top[0] + d1[0] * THIGH, top[1] + d1[1] * THIGH];
    const foot: [number, number] = [knee[0] + d2[0] * SHIN, knee[1] + d2[1] * SHIN];
    return { top, knee, foot };
  };
  return {
    hip, neck: rot(0, SHOULDER_DY - 4), head: rot(0, SHOULDER_DY - 62), rotDeg: p.lean,
    armF: arm(shF, p.shF, p.elF), armN: arm(shN, p.shN, p.elN),
    legF: leg(16 * build, p.hipF, p.knF), legN: leg(-16 * build, p.hipN, p.knN),
  };
}

const pts = (...ps: [number, number][]) => ps.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

/** A limb as an outlined round stroke: ink underneath, colour on top. */
const Limb: React.FC<{ d: string; w: number; color: string }> = ({ d, w, color }) => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={INK} strokeWidth={w + 7} />
    <path d={d} stroke={color} strokeWidth={w} />
  </g>
);

const HandShape: React.FC<{ at: [number, number]; deg: number; kind: Hand; skin: string; shade: string }> = ({ at, deg, kind, skin, shade }) => (
  <g transform={`translate(${at[0]} ${at[1]}) rotate(${-deg})`}>
    {kind === 'point' && <path d="M0 6 L0 30" stroke={INK} strokeWidth={13} strokeLinecap="round" />}
    {kind === 'point' && <path d="M0 6 L0 30" stroke={skin} strokeWidth={7} strokeLinecap="round" />}
    {kind === 'open'
      ? <ellipse cx={0} cy={6} rx={13} ry={17} fill={skin} stroke={INK} strokeWidth={3.5} />
      : <circle cx={0} cy={4} r={14} fill={skin} stroke={INK} strokeWidth={3.5} />}
    <path d="M-9 0 Q-15 8 -10 14" fill="none" stroke={shade} strokeWidth={3} strokeLinecap="round" />
  </g>
);

const Shoe: React.FC<{ at: [number, number]; color: string; sit: number }> = ({ at, color }) => (
  <path d={`M${at[0] - 14} ${at[1] - 10} Q${at[0] - 16} ${at[1] + 6} ${at[0] - 6} ${at[1] + 7} L${at[0] + 24} ${at[1] + 7} Q${at[0] + 30} ${at[1] - 2} ${at[0] + 12} ${at[1] - 12} Z`}
    fill={color} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
);

function Head({ look, face, turn, blink, uid }: { look: Look; face: Face; turn: number; blink: number; uid: string }) {
  const fx = turn * 13; // features slide toward the facing side
  const eyes: { cx: number; s: number; side: 'n' | 'f' }[] = [
    { cx: -21 + fx, s: 1 - 0.1 * turn, side: 'n' },
    { cx: 19 + fx, s: 1 - 0.22 * turn, side: 'f' },
  ];
  const lid = Math.min(1, face.lid + blink * (1 - face.lid));
  const mw = 25 * face.wide;
  const c = face.mouth * 9;
  const hijab = look.hair === 'hijab';
  return (
    <g>
      {hijab && <path d="M-70 -6 C-74 -62 -38 -86 0 -86 C40 -86 76 -60 70 -4 C68 40 62 70 46 92 L-46 92 C-62 70 -68 40 -70 -6 Z" fill={look.hijab} stroke={INK} strokeWidth={4} />}
      {!hijab && turn < 0.85 && <ellipse cx={-53 + turn * 6} cy={6} rx={9} ry={13} fill={look.skin} stroke={INK} strokeWidth={3.5} />}
      <ellipse cx={0} cy={0} rx={hijab ? 47 : 55} ry={hijab ? 55 : 61} fill={look.skin} stroke={INK} strokeWidth={4} />
      {/* soft shade on the side away from the light */}
      <path d={hijab ? 'M-46 -4 C-46 32 -24 54 0 55 C-20 46 -34 26 -36 -4 Z' : 'M-54 0 C-54 38 -28 60 0 61 C-22 52 -40 30 -42 0 Z'} fill={look.skinShade} opacity={0.55} />
      {hijab && <path d="M-49 -20 C-44 -58 44 -58 49 -20" fill="none" stroke={INK} strokeWidth={3} opacity={0.35} />}
      {look.hair === 'short' && <path d={`M-56 -2 C-62 -52 -28 -72 2 -70 C36 -70 64 -50 56 -6 C50 -26 40 -34 ${24 + fx * 0.4} -38 C6 -42 -12 -36 -26 -34 C-40 -30 -50 -18 -56 -2 Z`} fill={look.hairColor} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />}
      {look.hair === 'wavy' && <path d="M-57 4 C-66 -40 -40 -76 -2 -72 C40 -76 68 -44 57 0 C54 -18 46 -26 38 -28 C34 -38 22 -42 12 -36 C2 -44 -14 -42 -20 -34 C-32 -38 -44 -30 -46 -18 C-52 -14 -55 -6 -57 4 Z" fill={look.hairColor} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />}
      {look.hair === 'bald' && <g fill={look.hairColor} stroke={INK} strokeWidth={3}>
        <path d="M-56 4 C-60 -24 -52 -38 -42 -44 C-46 -28 -46 -10 -46 6 Z" />
        <path d="M56 4 C60 -24 52 -38 42 -44 C46 -28 46 -10 46 6 Z" />
      </g>}
      {look.hair === 'cap' && <g stroke={INK} strokeWidth={3.5} strokeLinejoin="round">
        <path d="M-56 -14 C-58 -60 -26 -74 2 -74 C34 -74 60 -58 56 -14 Z" fill={look.cap} />
        <path d={`M${10 + fx} -18 L${78 + fx} -12 Q${80 + fx} -2 ${66 + fx} -2 L${4 + fx} -6 Z`} fill={look.cap} />
        <path d="M-56 -14 L56 -14" stroke={INK} strokeWidth={5} />
      </g>}
      {look.beard === 'stubble' && <path d={`M-52 10 C-50 52 -22 66 ${fx * 0.5} 66 C24 66 50 52 52 10 C44 34 26 44 ${fx * 0.5} 44 C-24 44 -44 34 -52 10 Z`} fill={look.hairColor} opacity={0.32} />}
      {look.beard === 'full' && <path d={`M-54 4 C-54 58 -26 80 ${fx * 0.5} 80 C26 80 54 58 54 4 C46 30 30 38 ${fx * 0.5} 36 C-30 38 -46 30 -54 4 Z`} fill={look.hairColor} stroke={INK} strokeWidth={3} />}
      {/* eyes */}
      {eyes.map((e) => {
        const cid = `${uid}-eye-${e.side}`;
        const ry = 12.5, rx = 10.5 * e.s;
        const px = face.gx * 3.8 * e.s, py = face.gy * 4.2;
        const top = -ry + lid * 2 * ry, bot = ry - face.lidLow * ry * 0.95;
        return (
          <g key={e.side} transform={`translate(${e.cx} -4)`}>
            <clipPath id={cid}><ellipse cx={0} cy={0} rx={rx} ry={ry} /></clipPath>
            <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="#FBFCFE" />
            <g clipPath={`url(#${cid})`}>
              <circle cx={px} cy={py} r={6.4 * face.pupil} fill={INK} />
              <circle cx={px - 2.2} cy={py - 2.4} r={1.9} fill="#FFFFFF" />
              {face.sparkle > 0 && <path d={`M${px + 2} ${py - 1} l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5 Z`} fill="#FFFFFF" opacity={face.sparkle} />}
              <rect x={-rx - 2} y={-ry - 2} width={rx * 2 + 4} height={Math.max(0, top + ry + 2)} fill={look.skin} />
              <rect x={-rx - 2} y={bot} width={rx * 2 + 4} height={ry * 2} fill={look.skin} />
            </g>
            <ellipse cx={0} cy={0} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={2.6} />
            {lid > 0.06 && <path d={`M${-rx} ${top} Q0 ${top + 2.5} ${rx} ${top}`} stroke={INK} strokeWidth={3.2} fill="none" strokeLinecap="round" />}
            {/* brow: inner end is +x for the near eye, −x for the far one */}
            <g transform={`translate(0 ${-24 - face.browY * 7}) rotate(${(e.side === 'n' ? -1 : 1) * face.brow * 20})`}>
              <path d={`M${-12 * e.s} 0 L${12 * e.s} 0`} stroke={hijab ? INK : look.hairColor === '#FFFFFF' ? INK : look.hairColor} strokeWidth={6} strokeLinecap="round" />
            </g>
          </g>
        );
      })}
      {look.glasses && <g fill="none" stroke={INK} strokeWidth={3.2}>
        <circle cx={eyes[0].cx} cy={-4} r={16} /><circle cx={eyes[1].cx} cy={-4} r={16 * eyes[1].s} />
        <path d={`M${eyes[0].cx + 16} -6 Q${(eyes[0].cx + eyes[1].cx) / 2} -11 ${eyes[1].cx - 16 * eyes[1].s} -6`} />
      </g>}
      {/* nose */}
      <path d={`M${3 + fx * 1.4} 6 Q${11 + fx * 1.4} 15 ${2 + fx * 1.4} 18`} fill="none" stroke={look.skinShade} strokeWidth={3.4} strokeLinecap="round" />
      {/* blush, sweat */}
      {face.blush > 0 && <g fill="#E07F9B" opacity={face.blush * 0.5}>
        <ellipse cx={-31 + fx} cy={16} rx={10} ry={5.5} /><ellipse cx={31 + fx} cy={16} rx={8} ry={5} />
      </g>}
      {face.sweat > 0 && <path d={`M${44 + fx} -40 Q${36 + fx} -24 ${44 + fx} -20 Q${52 + fx} -24 ${44 + fx} -40 Z`} fill="#A8DDF2" stroke={INK} strokeWidth={2} opacity={face.sweat} />}
      {/* mouth */}
      <g transform={`translate(${fx * 0.9} 33)`}>
        {face.open < 0.06
          ? <path d={`M${-mw / 2} 0 Q0 ${c * 2} ${mw / 2} 0`} fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
          : <g>
            <path d={`M${-mw / 2} 0 Q0 ${c} ${mw / 2} 0 Q0 ${c + face.open * 26} ${-mw / 2} 0 Z`} fill="#5B2335" stroke={INK} strokeWidth={3.4} strokeLinejoin="round" />
            {face.mouth > 0.3 && <path d={`M${-mw / 2 + 4} 2 Q0 ${c + 2} ${mw / 2 - 4} 2 L${mw / 2 - 6} 5 Q0 ${c + 6} ${-mw / 2 + 6} 5 Z`} fill="#FFFFFF" />}
          </g>}
      </g>
    </g>
  );
}

export const Person: React.FC<PersonProps> = ({
  look, pose = REST, face = CALM, x = 0, y = 0, scale = 1, facing = 1,
  handF = 'fist', handN = 'fist', holdF, holdN, holdMid, farInFront = false, blink = 0, breath = 0, id = 'p',
}) => {
  const build = look.build ?? 1;
  const j = joints(pose, build);
  const w = 46 * build;
  const legW = 36 * build, armW = 26 * build;
  const legPath = (l: ReturnType<typeof joints>['legF']) => pts(l.top, l.knee, l.foot);
  const armPath = (a: ReturnType<typeof joints>['armF']) => pts(a.shoulder, a.elbow, a.hand);
  const chest = 1 + pose.chest * 0.06;
  const skirt = look.dress;
  const hipY = j.hip[1];
  // the hem follows the feet a little when walking
  const hemF = j.legF.foot[0], hemN = j.legN.foot[0];
  const hemL = Math.min(hemF, hemN, -40 * build) - 10, hemR = Math.max(hemF, hemN, 40 * build) + 10;
  const farArm = (
    <g>
      <Limb d={armPath(j.armF)} w={armW} color={look.topShade} />
      <HandShape at={j.armF.hand} deg={j.armF.foreDeg} kind={handF} skin={look.skin} shade={look.skinShade} />
    </g>
  );

  return (
    <g transform={`translate(${x} ${y - breath * 0.3}) scale(${scale * facing} ${scale})`}>
      {/* far leg, near leg */}
      {!skirt && <>
        <Limb d={legPath(j.legF)} w={legW} color={shadeOf(look.bottom)} />
        <Shoe at={j.legF.foot} color={look.shoes} sit={pose.sit} />
        <Limb d={legPath(j.legN)} w={legW} color={look.bottom} />
        <Shoe at={j.legN.foot} color={look.shoes} sit={pose.sit} />
      </>}
      {skirt && <>
        <Shoe at={j.legF.foot} color={look.shoes} sit={pose.sit} />
        <Shoe at={j.legN.foot} color={look.shoes} sit={pose.sit} />
        <path d={pose.sit > 0.5
          ? `M${-w} ${hipY - 4} L${w} ${hipY - 4} L${j.legF.knee[0] + 20} ${j.legF.knee[1] - 16} L${j.legF.foot[0] + 18} ${j.legF.foot[1] - 14} L${j.legN.foot[0] - 22} ${j.legN.foot[1] - 14} L${j.legN.knee[0] - 20} ${j.legN.knee[1] + 10} Z`
          : `M${-w * 0.95} ${hipY - 4} L${w * 0.95} ${hipY - 4} Q${w * 1.25} ${hipY + 90} ${hemR} ${-12} L${hemL} ${-12} Q${-w * 1.25} ${hipY + 90} ${-w * 0.95} ${hipY - 4} Z`}
          fill={look.bottom} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </>}
      {/* far arm behind the torso, unless it reaches across the front */}
      {!farInFront && farArm}
      {/* torso */}
      <g transform={`translate(${j.hip[0]} ${j.hip[1]}) rotate(${pose.lean}) scale(${chest} 1)`}>
        <path d={`M${-w} ${SHOULDER_DY + 4} Q${-w - 8} -60 ${-w * 0.88} 0 L${w * 0.88} 0 Q${w + 6} -60 ${w * 0.92} ${SHOULDER_DY + 4} Q0 ${SHOULDER_DY - 10} ${-w} ${SHOULDER_DY + 4} Z`}
          fill={look.top} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M${w * 0.3} ${SHOULDER_DY + 2} Q${w * 0.95} -60 ${w * 0.84} -2 L${w * 0.88} 0 Q${w + 6} -60 ${w * 0.92} ${SHOULDER_DY + 4} Z`} fill={look.topShade} opacity={0.7} />
        {look.collar === 'shirt' && <path d={`M-16 ${SHOULDER_DY - 2} L0 ${SHOULDER_DY + 22} L16 ${SHOULDER_DY - 2} L8 ${SHOULDER_DY + 8} L0 ${SHOULDER_DY + 2} L-8 ${SHOULDER_DY + 8} Z`} fill="#F2F5F8" stroke={INK} strokeWidth={3} strokeLinejoin="round" />}
        {look.collar === 'sweater' && <path d={`M${-w * 0.84} -10 L${w * 0.84} -10`} stroke={look.topShade} strokeWidth={6} />}
        {look.collar === 'jacket' && <path d={`M-18 ${SHOULDER_DY} L-4 ${SHOULDER_DY + 60} M18 ${SHOULDER_DY} L4 ${SHOULDER_DY + 60}`} stroke={INK} strokeWidth={3} fill="none" />}
        {!skirt && <path d={`M${-w * 0.88} -6 L${w * 0.88} -6`} stroke={INK} strokeWidth={3} opacity={0.5} />}
      </g>
      {/* neck and head */}
      {look.hair !== 'hijab' && <path d={pts([j.neck[0], j.neck[1] + 6], [j.head[0], j.head[1] + 40])} stroke={look.skinShade} strokeWidth={26} strokeLinecap="round" />}
      <g transform={`translate(${j.head[0]} ${j.head[1]}) rotate(${pose.headTilt + pose.lean * 0.3})`}>
        <Head look={look} face={face} turn={pose.headTurn} blink={blink} uid={id} />
      </g>
      {farInFront && farArm}
      {holdMid && <g transform={`translate(${(j.armF.hand[0] + j.armN.hand[0]) / 2} ${(j.armF.hand[1] + j.armN.hand[1]) / 2})`}>{holdMid}</g>}
      {/* near arm in front */}
      <Limb d={armPath(j.armN)} w={armW} color={look.top} />
      <HandShape at={j.armN.hand} deg={j.armN.foreDeg} kind={handN} skin={look.skin} shade={look.skinShade} />
      {holdF && <g transform={`translate(${j.armF.hand[0]} ${j.armF.hand[1]})`}>{holdF}</g>}
      {holdN && <g transform={`translate(${j.armN.hand[0]} ${j.armN.hand[1]})`}>{holdN}</g>}
    </g>
  );
};

/** A darker tone of a #RRGGBB colour, for far limbs. */
export function shadeOf(hex: string, k = 0.82): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) * k).toString(16).padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}
