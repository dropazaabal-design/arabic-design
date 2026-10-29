import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C } from '../kit/draw';
import { Mini, Narrator, Person } from '../kit/people';

// Reference sheet of the cast and poses (Studio and QA only).
export const Sheet: React.FC = () => (
  <AbsoluteFill style={{ background: '#fff' }}>
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <Narrator x={180} y={560} s={0.8} pose="idle" expr="happy" />
      <Narrator x={480} y={560} s={0.8} pose="point" expr="smug" />
      <Narrator x={780} y={560} s={0.8} pose="think" expr="think" />
      <Narrator x={1080} y={560} s={0.8} pose="shrug" expr="worried" />
      <Narrator x={1380} y={560} s={0.8} pose="facepalm" expr="sad" />
      <Narrator x={1700} y={560} s={0.8} pose="cheer" expr="surprised" />
      <Person x={150} y={1040} s={0.75} head="hijab" hairColor={C.purple} outfit="dress" top={C.purple} pose="hold" expr="happy" />
      <Person x={400} y={1040} s={0.75} head="hair" top={C.blue} pose="both" expr="angry" />
      <Person x={650} y={1040} s={0.75} head="topknot" outfit="robe" top={C.teal} pose="present" expr="smug" />
      <Person x={900} y={1040} s={0.75} head="roman" outfit="armour" top={C.red} pose="stop" />
      <Person x={1150} y={1040} s={0.75} head="greek" outfit="armour" top={C.red} pose="hips" />
      <Person x={1400} y={1040} s={0.75} head="mongol" outfit="robe" top={C.brown} pose="wave" />
      <Person x={1650} y={1040} s={0.75} head="hair" outfit="suit" top={C.navy} pose="cross" expr="smug" />
      {[0, 1, 2, 3, 4].map((i) => <Mini key={i} x={1780 + (i % 2) * 60} y={700 + i * 60} s={0.6} head={['greek', 'roman', 'mongol', 'persian', 'hijab'][i]} hc={C.pink} />)}
    </svg>
  </AbsoluteFill>
);
