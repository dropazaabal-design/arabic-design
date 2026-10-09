import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Cleaner, Litterer, Narrator, Passerby, Spitter } from '../characters/cast';
import { ExprName } from '../characters/face';
import { PAL } from '../characters/ink';
import { Monkey, MONKEY_POSES } from '../characters/monkey';
import { Banana, Bin, Broom, Bulb, Counter, Dustpan, Flag, Peel, PictoSign, Sign, SnackBag } from '../characters/props';
import { POSES, walkPose } from '../characters/rig';
import { loadFonts } from './fonts';
import { Boil, H, W } from './stage';

loadFonts();

// Model sheets (stills, frame 0) for checking and reusing the cast: who they are, their six required
// expressions plus extras, the pose library, and the prop library. Rendered by tools/sheets.mjs.

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: PAL.paper }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><defs><Boil t={0} /></defs><g filter="url(#boil)">{children}</g></svg>
  </AbsoluteFill>
);

export const CastSheet: React.FC = () => (
  <Frame>
    <Narrator x={270} y={860} s={0.95} pose={POSES.wave} expr="satisfied" />
    <Litterer x={760} y={860} s={0.95} pose={POSES.holdUp} expr="smug" shades={1} itemR={<SnackBag x={0} y={-40} s={0.7} />} />
    <Cleaner x={250} y={1640} s={0.9} pose={POSES.bend} expr="tired" itemR={<Dustpan x={0} y={60} s={0.6} />} />
    <Spitter x={590} y={1640} s={0.9} pose={POSES.hipsHands} expr="smug" />
    <Passerby x={900} y={1640} s={0.85} pose={walkPose(0.2)} expr="surprised" />
    <Monkey x={880} y={1260} s={0.7} pose={MONKEY_POSES.eat} expr="chewing" itemR={<Banana x={0} y={-10} s={0.8} />} />
  </Frame>
);

const EXPR: Array<[ExprName, string]> = [
  ['neutral', 'محايد'], ['curious', 'تساؤل'], ['surprised', 'دهشة'], ['skeptical', 'تشكّك'], ['embarrassed', 'حرج'], ['satisfied', 'رضا'],
  ['laugh', 'ضحك'], ['smug', 'غرور'], ['tender', 'حنان'], ['tired', 'تعب'], ['disgusted', 'تقزّز'], ['determined', 'عزم'],
];
export const ExpressionSheet: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Frame>
      {EXPR.map(([e, label], i) => (
        <g key={e}>
          <Narrator frame={f} x={190 + (i % 3) * 350} y={560 + Math.floor(i / 3) * 450} s={0.62} expr={e} pose={POSES.stand} shadow={false} talk={e === 'laugh' ? 0.6 : 0} />
          <text x={190 + (i % 3) * 350} y={600 + Math.floor(i / 3) * 450} textAnchor="middle" fontFamily="Cairo" fontWeight={800} fontSize={34} fill={PAL.ink} direction="rtl">{label}</text>
        </g>
      ))}
    </Frame>
  );
};

export const PropSheet: React.FC = () => (
  <Frame>
    <Banana x={140} y={300} />
    <Peel x={330} y={310} />
    <SnackBag x={540} y={300} />
    <SnackBag x={740} y={300} wings={1} flap={1} />
    <SnackBag x={940} y={300} fold={1} />
    <Bin x={200} y={760} lid={0.8} face={1} />
    <Broom x={420} y={700} />
    <Dustpan x={600} y={760} />
    <Flag x={760} y={760} wave={1} />
    <Counter x={960} y={560} n={3} />
    <Bulb x={960} y={760} />
    <Sign x={300} y={1450} lines={['حافظ على', 'نظافة المكان']} post={260} />
    <PictoSign x={800} y={1180} />
    <Monkey x={800} y={1700} s={0.6} pose={MONKEY_POSES.hatOn} expr="satisfied" hat={<Bin x={0} y={-150} s={0.42} rot={180} />} />
  </Frame>
);
