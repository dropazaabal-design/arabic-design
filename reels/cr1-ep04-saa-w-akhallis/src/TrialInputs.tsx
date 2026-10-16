import React from 'react';
import { AbsoluteFill } from 'remotion';
import { pose, face } from '../../../motion-core/src/cartoon';
import { SvgPerson } from '../../../motion-core/src/characters/SvgPerson';
import { Screwdriver, WallClock } from './props';
import { kneel } from './scenes/work';
import { NASER } from './theme';

// Reference inputs for the OmniSVG / OmniLottie GPU trial (research/omni-gpu-trial): the story's character
// and objects drawn by the current pipeline, alone on white, 1024 × 1024.
export type TrialInput = 'naser' | 'naserKneel' | 'clock' | 'screwdriver';
export const TrialInputs: React.FC<{ which: TrialInput }> = ({ which }) => (
  <AbsoluteFill style={{ background: '#FFFFFF' }}>
    <svg width={1024} height={1024} viewBox="0 0 1024 1024">
      {which === 'naser' && <SvgPerson id="ti" look={NASER} pose={pose('stand', { headTurn: 0.6 })} face={face('smile', { gx: 0.3 })} x={512} y={960} scale={2.1} handF="open" handN="open" />}
      {which === 'naserKneel' && <SvgPerson id="ti" look={NASER} pose={kneel({ lean: 14, headTilt: 6, shF: 70, elF: 40, shN: 40, elN: 60 })} face={face('determined', { gx: 1, gy: 0.6 })}
        x={430} y={960 + 72 * 2.1} scale={2.1} handF="grip" holdF={<Screwdriver />} holdUpright handN="pinch" />}
      {which === 'clock' && <g transform="translate(512 512) scale(2.6)"><WallClock min={16 * 60} /></g>}
      {which === 'screwdriver' && <g transform="translate(512 470) rotate(-35) scale(4)"><Screwdriver /></g>}
    </svg>
  </AbsoluteFill>
);
