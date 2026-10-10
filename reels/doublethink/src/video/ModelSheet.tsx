import React from 'react';
import { AbsoluteFill } from 'remotion';
import { POSES } from '@mukarram/characters/rig';
import { Boil, H, W } from '@mukarram/video/stage';
import { Employee } from '../characters/employee';
import { C, Chair, Clock, Crumple, Door, Memo, Notebook, PadSheet, StampMark, StampTool } from '../characters/office';
import { loadFonts } from './fonts';

loadFonts();

// Model sheet (still): the clerk's acting range and the new props, for review; kept as a reference.
export const ModelSheet: React.FC = () => (
  <AbsoluteFill style={{ background: C.wall }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}><defs><Boil t={0} /></defs><g filter="url(#boil)">
      <Employee x={170} y={720} s={0.8} pose={POSES.stand} expr="neutral" />
      <Employee x={430} y={720} s={0.8} pose={POSES.thumbsUp} expr="laugh" talk={0.6} />
      <Employee x={690} y={720} s={0.8} pose={POSES.shrug} expr="embarrassed" />
      <Employee x={940} y={720} s={0.8} pose={POSES.stand} expr="determined" look={[0.8, 0]} />
      <Door x={260} y={1640} st={{ word: 'مفتوح', count: 6, flap: 0.6 }} />
      <Memo kind="on" x={640} y={1000} s={0.7} ok={1} />
      <Memo kind="off" x={860} y={1000} s={0.7} />
      <Notebook x={720} y={1260} word="مفتوح" s={0.9} />
      <Chair x={940} y={1640} />
      <Clock x={680} y={1460} s={0.7} text="3:00" />
      <StampTool x={560} y={1520} color="#2E7BC5" />
      <StampMark x={620} y={1720} word="صحيح" color="#2E7BC5" seal={false} />
      <PadSheet x={880} y={1800} s={0.6} word="مغلق" crease={1} />
      <Crumple x={540} y={1860} word="مفتوح" />
    </g></svg>
  </AbsoluteFill>
);
