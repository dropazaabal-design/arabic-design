import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SvgPerson } from '../../../motion-core/src/characters/SvgPerson';
import { blink, face, pose, type FaceName, type PoseName } from '../../../motion-core/src/cartoon';
import { C, SULTAN } from './theme';

// Review sheet for the SVGR rig: poses, expressions, hands holding the shoe, both feet.
const Shoe: React.FC = () => (
  <g transform="rotate(90) translate(-28 6)">
    <path d="M0 -14 C-2 -2 2 6 12 7 L50 7 C58 7 60 0 55 -5 C46 -12 34 -14 26 -16 C20 -22 8 -22 0 -14 Z" fill={C.shoe} stroke={C.ink} strokeWidth={3.5} />
    <path d="M-1 1 L58 1 C59 6 56 10 50 10 L10 10 C2 10 -1 6 -1 1 Z" fill="#F4F7FB" stroke={C.ink} strokeWidth={3} />
  </g>
);

export const SvgLab: React.FC = () => {
  const f = useCurrentFrame();
  const row1: [PoseName, FaceName][] = [['stand', 'calm'], ['proud', 'proud'], ['think', 'thinking'], ['shrug', 'worried']];
  const row2: [PoseName, FaceName][] = [['point', 'determined'], ['phone', 'surprised'], ['scratch', 'embarrassed'], ['cheer', 'grin']];
  const faces: FaceName[] = ['calm', 'smile', 'grin', 'dreamy', 'embarrassed', 'worried', 'sad', 'surprised', 'determined', 'relieved', 'wince', 'thinking'];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {row1.map(([p, e], k) => <SvgPerson key={p} id={`a${k}`} look={SULTAN} pose={pose(p)} face={face(e)} x={150 + k * 260} y={520} scale={1.05} blink={blink(f, k)} handN={p === 'think' ? 'fist' : 'open'} />)}
        {row2.map(([p, e], k) => <SvgPerson key={p} id={`b${k}`} look={SULTAN} pose={pose(p)} face={face(e)} x={150 + k * 260} y={1000} scale={1.05}
          handF={p === 'point' ? 'point' : 'open'} feet={k % 2 ? 'runner' : 'slipper'} farInFront={p === 'phone'} />)}
        {/* holding the shoe in a real grip: palm, shoe, fingers */}
        <SvgPerson id="g1" look={SULTAN} pose={pose('holdUp', { shF: 60, elF: 70, shN: 30, elN: 90 })} face={face('surprised', { gx: 1, gy: -0.5 })} x={220} y={1480} scale={1.15}
          handF="grip" holdF={<Shoe />} handN="grip" holdN={<Shoe />} feet="runner" />
        {faces.map((e, k) => (
          <g key={e} transform={`translate(${470 + (k % 4) * 150} ${1250 + Math.floor(k / 4) * 190}) scale(1.6)`}>
            <g transform="translate(0 330)"><SvgPerson id={`f${k}`} look={SULTAN} pose={pose('stand')} face={face(e)} /></g>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
