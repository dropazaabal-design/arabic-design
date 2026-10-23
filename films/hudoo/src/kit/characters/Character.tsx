import React from 'react';
import { CAST, type Look, type Who } from './cast';
import { EXPRESSIONS, Head, type Expr, type Face } from './face';
import { Hand, type Gesture } from './hands';
import { BONES, joints, mix, type Pose, type V } from './skeleton';

export const INK = '#2A2F3A';
export type CharacterProps = {
  who: Who | Look; p: Pose; x?: number; y?: number; s?: number; facing?: 1 | -1;
  face?: Face | Expr; blink?: number; talk?: number;
  hands?: { R?: Gesture; L?: Gesture };
  /** Something held in a hand: drawn between the palm and the wrapping fingers. `upright` keeps it level (a phone being read). */
  hold?: { R?: React.ReactNode; L?: React.ReactNode }; upright?: { R?: boolean; L?: boolean };
  o?: number;
  /** Draw only these parts (for the SVG export): Head, Torso, LeftArm, RightArm, LeftLeg, RightLeg. */
  only?: string[];
  /** Extra clothing: `torso` is drawn over the shirt and under the near arm (a tie); `head` in the head's own frame (a headset). */
  wear?: { torso?: (j: ReturnType<typeof joints>) => React.ReactNode; head?: React.ReactNode };
};

const LINE = 4.6;
const tube = (pts: V[], color: string, w: number, key: string) => {
  const d = `M${pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L')}`;
  return <g key={key}><path d={d} fill="none" stroke={INK} strokeWidth={w + LINE * 1.9} strokeLinecap="round" strokeLinejoin="round" /><path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" /></g>;
};

/**
 * The character. One rig for the whole cast: legs and arms by IK or angles (skeleton.ts), a torso that turns from
 * front to profile, the round head with its face (face.tsx) and ten hands (hands.tsx). Parts are grouped and named
 * (Head, Eyes…, Torso, LeftArm, RightArm, LeftHand, RightHand, LeftLeg, RightLeg, Props) for the SVG export.
 */
export const Character: React.FC<CharacterProps> = ({ who, p, x = 0, y = 0, s = 1, facing = 1, face = 'neutral', blink = 0, talk = 0, hands, hold, upright, o = 1, only, wear }) => {
  const show = (part: string) => !only || only.includes(part);
  const look: Look = typeof who === 'string' ? CAST[who] : who;
  const j = joints(p);
  const fc: Face = typeof face === 'string' ? EXPRESSIONS[face] : face;
  const sc = s * look.size;
  const b = look.build;
  const lean = (p.lean * Math.PI) / 180;
  const rot = (dx: number, dy: number): V => [j.hip[0] + dx * Math.cos(lean) - dy * Math.sin(lean), j.hip[1] + dx * Math.sin(lean) + dy * Math.cos(lean)];

  // torso: a soft trapezoid from the shoulders to just below the hip; it narrows as the body turns to profile
  const top = -(BONES.torso + 4 + (p.breath ?? 0) * 3);
  const tw = mix(40, 24, p.body) * b, bw = mix(31, 22, p.body) * b;
  const pts = { tl: rot(-tw, top + 6), tr: rot(tw * 0.92, top + 6), br: rot(bw, 16), bl: rot(-bw, 16), t: rot(0, top - 3), bm: rot(0, 20) };
  const torso = `M${pts.tl[0]} ${pts.tl[1]} Q${pts.t[0]} ${pts.t[1] - 6} ${pts.tr[0]} ${pts.tr[1]} Q${pts.tr[0] + 6} ${(pts.tr[1] + pts.br[1]) / 2} ${pts.br[0]} ${pts.br[1]} Q${pts.bm[0]} ${pts.bm[1] + 3} ${pts.bl[0]} ${pts.bl[1]} Q${pts.tl[0] - 6} ${(pts.tl[1] + pts.bl[1]) / 2} ${pts.tl[0]} ${pts.tl[1]} Z`;
  const shade = `M${pts.tl[0]} ${pts.tl[1]} Q${pts.tl[0] - 6} ${(pts.tl[1] + pts.bl[1]) / 2} ${pts.bl[0]} ${pts.bl[1]} L${mix(pts.bl[0], pts.br[0], 0.3)} ${mix(pts.bl[1], pts.br[1], 0.3)} Q${mix(pts.tl[0], pts.tr[0], 0.22) - 4} ${(pts.tl[1] + pts.bl[1]) / 2} ${mix(pts.tl[0], pts.tr[0], 0.3)} ${mix(pts.tl[1], pts.tr[1], 0.3)} Z`;
  const neck = j.neck;
  const collar = look.collar === 'v'
    ? <path d={`M${neck[0] - 9} ${neck[1] + 2} L${neck[0] + 2} ${neck[1] + 16} L${neck[0] + 11} ${neck[1] + 2}`} fill={look.skin} stroke={INK} strokeWidth={LINE * 0.6} strokeLinejoin="round" />
    : look.collar === 'shirt'
      ? <path d={`M${neck[0] - 12} ${neck[1] + 1} L${neck[0] - 2} ${neck[1] + 12} L${neck[0] - 4} ${neck[1] + 1} M${neck[0] + 12} ${neck[1] + 1} L${neck[0] + 2} ${neck[1] + 12} L${neck[0] + 4} ${neck[1] + 1}`} fill="#FFFFFF" stroke={INK} strokeWidth={LINE * 0.55} strokeLinejoin="round" />
      : <path d={`M${neck[0] - 10} ${neck[1] + 2} Q${neck[0]} ${neck[1] + 10} ${neck[0] + 10} ${neck[1] + 2}`} fill="none" stroke={look.shirtShade} strokeWidth={LINE * 0.8} strokeLinecap="round" />;

  const shoe = (a: V, k: string) => {
    const len = mix(10, 26, p.body), h = 10;
    return <path key={k} d={`M${a[0] - len * 0.35} ${a[1] + 2} Q${a[0] - len * 0.4} ${a[1] - h} ${a[0] + len * 0.2} ${a[1] - h * 0.7} Q${a[0] + len} ${a[1] - h * 0.5} ${a[0] + len * 0.85} ${a[1] + 2} Z`} fill={look.shoe} stroke={INK} strokeWidth={LINE * 0.6} strokeLinejoin="round" />;
  };
  const leg = (l: typeof j.legR, side: 'Right' | 'Left') => (
    <g id={`${side}Leg`} key={side}>
      {look.robe
        ? tube([[mix(l.knee[0], l.ankle[0], 0.55), mix(l.knee[1], l.ankle[1], 0.55)], l.ankle], look.pants, 12, 'shin')
        : tube([l.top, l.knee, l.ankle], look.pants, 15 * b, 'leg')}
      {shoe(l.ankle, 'shoe')}
    </g>
  );
  const robe = look.robe && (() => {
    const hemY = Math.max(j.legR.ankle[1], j.legL.ankle[1]) - 26;
    const kneeX = (j.legR.knee[0] + j.legL.knee[0]) / 2, kneeY = (j.legR.knee[1] + j.legL.knee[1]) / 2;
    const seated = p.sit > 0.5;
    const spread = Math.abs(j.legL.ankle[0] - j.legR.ankle[0]) * 0.5 + 26;
    const d = seated
      ? `M${j.hip[0] - 30} ${j.hip[1] - 20} L${j.hip[0] + 26} ${j.hip[1] - 20} L${kneeX + 18} ${kneeY - 10} Q${kneeX + 26} ${kneeY + 30} ${kneeX + 10} ${kneeY + 46} L${kneeX - 22} ${kneeY + 46} L${kneeX - 14} ${kneeY + 18} L${j.hip[0] - 34} ${j.hip[1] + 18} Z`
      : `M${j.hip[0] - 28} ${j.hip[1] - 22} L${j.hip[0] + 28} ${j.hip[1] - 22} Q${j.hip[0] + spread} ${(j.hip[1] + hemY) / 2} ${j.hip[0] + spread} ${hemY} L${j.hip[0] - spread} ${hemY} Q${j.hip[0] - spread} ${(j.hip[1] + hemY) / 2} ${j.hip[0] - 28} ${j.hip[1] - 22} Z`;
    return <path d={d} fill={look.robe} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />;
  })();

  const arm = (a: typeof j.armR, side: 'Right' | 'Left', key: 'R' | 'L') => {
    const g = hands?.[key] ?? 'relaxed';
    const ang = (Math.atan2(a.wrist[1] - a.elbow[1], a.wrist[0] - a.elbow[0]) * 180) / Math.PI + ((key === 'R' ? p.R.wrist : p.L.wrist) ?? 0);
    const flip = key === 'R' ? -1 : 1;
    const held = hold?.[key];
    const up = upright?.[key];
    return (
      <g id={`${side}Arm`} key={side}>
        {tube([a.shoulder, a.elbow, a.wrist], look.shirt, 13 * b, 'arm')}
        <g id={`${side}Hand`} transform={`translate(${a.wrist[0]} ${a.wrist[1]}) rotate(${ang}) scale(1.45 ${1.45 * flip})`}>
          <Hand g={g} skin={look.skin} layer="back" />
          {held && <g id="Props" transform={up ? `scale(1 ${flip}) rotate(${-ang - p.lean * 0}) scale(${facing} 1) translate(0 0)` : 'translate(12 0)'}>{held}</g>}
          <Hand g={g} skin={look.skin} layer="front" />
        </g>
      </g>
    );
  };

  return (
    <g transform={`translate(${x} ${y}) scale(${sc * facing} ${sc})`} opacity={o}>
      {show('RightArm') && arm(j.armR, 'Right', 'R')}
      {!look.robe && show('RightLeg') && leg(j.legR, 'Right')}
      {!look.robe && show('LeftLeg') && leg(j.legL, 'Left')}
      {look.robe && <>{show('RightLeg') && leg(j.legR, 'Right')}{show('LeftLeg') && leg(j.legL, 'Left')}{show('Torso') && robe}</>}
      {show('Torso') && <g id="Torso">
        <path d={`M${neck[0]} ${neck[1] + 6} L${j.headC[0]} ${j.headC[1] + 30}`} stroke={INK} strokeWidth={13} strokeLinecap="round" />
        <path d={`M${neck[0]} ${neck[1] + 6} L${j.headC[0]} ${j.headC[1] + 30}`} stroke={look.skin} strokeWidth={8} strokeLinecap="round" />
        <path d={torso} fill={look.shirt} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
        {p.body > 0.2 && <path d={shade} fill={look.shirtShade} opacity={0.55} />}
        {collar}
        {wear?.torso?.(j)}
      </g>}
      {show('Head') && <g id="Head" transform={`translate(${j.headC[0]} ${j.headC[1]}) rotate(${p.lean * 0.6 + p.head})`}>
        <Head r={BONES.headR} turn={p.turn} face={fc} look={look} blink={blink} talk={talk} line={LINE} />
        {wear?.head}
      </g>}
      {show('LeftArm') && arm(j.armL, 'Left', 'L')}
    </g>
  );
};
