import React from 'react';
import { AbsoluteFill } from 'remotion';
import { PAL } from '@mukarram/characters/ink';
import { POSES } from '@mukarram/characters/rig';
import { Boil, H, W } from '@mukarram/video/stage';
import { Frog } from '../characters/frog';
import { Human } from '../characters/human';
import { CalendarSheet, PaperPile, Phone, TaskSheet, Thermometer, ThoughtBubble, WallClock } from '../characters/props';
import { loadFonts } from './fonts';

loadFonts();

// Model sheet (still) for the frog's acting range, the human, and the new props. Rendered for review and
// kept as a reusable reference.
export const FrogSheet: React.FC = () => (
  <AbsoluteFill style={{ background: '#1D3A5C' }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><defs><Boil t={0} /></defs><g filter="url(#boil)">
      <Frog x={200} y={400} s={0.7} eyes="happy" mouth="smile" ring />
      <Frog x={540} y={400} s={0.7} eyes="wide" mouth="o" throat={0.8} pose={{ crouch: 1 }} brow={1} />
      <Frog x={880} y={420} s={0.7} eyes="open" mouth="grin" pose={{ stretch: 1, armL: 150, armR: 150 }} />
      <Frog x={200} y={820} s={0.7} eyes="half" mouth="smirk" brow={-1} towel pose={{ armR: 100 }} />
      <Frog x={540} y={820} s={0.7} eyes="open" mouth="smile" tongue={0.8} glance={[1, -0.5]} />
      <Frog x={880} y={820} s={0.7} eyes="closed" mouth="flat" pose={{ crouch: 0.6, stretch: 0 }} blush={1} />
      <Human x={260} y={1500} s={0.85} pose={{ ...POSES.stand, armR: [-10, -120], handR: 'fist' }} expr="satisfied" itemR={<Phone x={0} y={-20} s={0.55} bar={0.4} />} />
      <Human x={760} y={1500} s={0.85} pose={POSES.shrug} expr="embarrassed" />
      <PaperPile x={760} y={1500} n={14} />
      <Thermometer x={100} y={1840} s={0.5} level={0.6} />
      <WallClock x={980} y={1100} s={0.6} minutes={20} />
      <CalendarSheet x={980} y={1300} s={0.6} />
      <TaskSheet x={980} y={1520} s={0.6} check={1} />
      <ThoughtBubble x={560} y={1010} pop={1} s={0.6} />
      <Phone x={520} y={1760} s={0.6} label="60 دقيقة" bar={1} />
    </g></svg>
  </AbsoluteFill>
);
export const PALETTE = PAL;
