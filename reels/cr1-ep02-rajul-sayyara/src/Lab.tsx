import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Box, Bubble, Car, Jar, Keys, Person, Phone, blink, driverSeat, face, pose } from '../../../motion-core/src/cartoon';
import { C, CAST } from './theme';

// Review sheet for the character kit: cast, expressions, poses and props on one frame.
export const Lab: React.FC = () => {
  const f = useCurrentFrame();
  const row1: [keyof typeof CAST, Parameters<typeof pose>[0], Parameters<typeof face>[0]][] = [
    ['majid', 'proud', 'proud'], ['saad', 'stand', 'smile'], ['noura', 'think', 'thinking'],
    ['elder', 'cross', 'calm'], ['young', 'point', 'surprised'], ['valet', 'holdUp', 'dreamy'],
  ];
  const faces: Parameters<typeof face>[0][] = ['calm', 'smile', 'grin', 'proud', 'dreamy', 'embarrassed', 'worried', 'sad', 'surprised', 'determined', 'relieved', 'wince'];
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${C.skyTop}, ${C.skyLow})` }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {row1.map(([who, p, e], k) => (
          <Person key={who} id={`r1-${who}`} look={CAST[who]} pose={pose(p)} face={face(e)} x={170 + k * 300} y={520} scale={0.95}
            facing={k % 2 ? -1 : 1} blink={blink(f, k)} handF={p === 'point' ? 'point' : 'fist'}
            holdF={p === 'holdUp' ? <Keys color={C.teal} /> : undefined} />
        ))}
        {faces.map((e, k) => (
          <g key={e} transform={`translate(${110 + k * 150} 650)`}>
            <Person id={`f-${e}`} look={k % 2 ? CAST.saad : CAST.majid} pose={pose('stand', { headTurn: 0.2 })} face={face(e)} x={0} y={420} scale={0.62} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

export const LabProps: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${C.skyTop}, ${C.skyLow})` }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <rect x={0} y={760} width={1920} height={320} fill={C.asphalt} />
        <Car id="c1" kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass} x={560} y={800} shine={0.45}
          driver={<Person id="drv" look={CAST.majid} pose={pose('seated', { headTurn: 0.4 })} face={face('proud')} {...driverSeat('new')} />} />
        <Car id="c2" kind="old" color={C.oldCar} shade={C.oldCarShade} glass={C.glass} x={1360} y={800} facing={-1}
          driver={<Person id="drv2" look={CAST.saad} pose={pose('seated', { headTurn: 0.3 })} face={face('calm')} {...driverSeat('old')} />} />
        <Person id="sd" look={CAST.saad} pose={pose('carry')} face={face('relieved')} x={1700} y={1040} scale={0.55} holdMid={<g transform="translate(0 -30)"><Box /></g>} />
        <Bubble id="b1" x={360} y={250} w={420} h={300} tail={[600, 520]} pop={1}>
          <Car id="bc" kind="new" color={C.pearl} shade={C.pearlShade} glass={C.glass} y={110} scale={0.62}
            driver={<Person id="bd" look={CAST.noura} pose={pose('seated', { headTurn: 0.4 })} face={face('grin')} {...driverSeat('new')} />} />
        </Bubble>
        <g transform="translate(1250 400)"><Jar level={0.7} note={C.mint} noteShade={C.teal} /></g>
        <g transform="translate(1500 330)"><Phone /></g>
        <Person id="ph" look={CAST.young} pose={pose('phone')} face={face('worried', { gx: 0.6, gy: 0.6 })} x={1000} y={600} scale={0.8} blink={blink(f, 3)} farInFront
          holdF={<Phone scale={0.6} />} />
      </svg>
    </AbsoluteFill>
  );
};
