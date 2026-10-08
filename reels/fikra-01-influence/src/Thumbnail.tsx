import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Arrow, Headphones, PriceTag } from './art/doodles';
import { BODY_FONT as BODY, TITLE_FONT as TITLE, loadFonts } from './fonts';
import { Stage } from './Stage';
import { C } from './theme';

loadFonts();

// YouTube cover (16:9). The episode's own paradox in one picture: the $40 pair next to the $200 one,
// and the question it raises. Text reads first (right, RTL); YouTube's duration badge sits bottom-right,
// so nothing important goes there; the series mark is top-left.
export const Thumbnail: React.FC = () => (
  <Stage f={0} svg={
    <>
      {/* the $200 pair, set back */}
      <g opacity={0.5}>
        <Headphones x={300} y={430} s={1.15} color={C.coverBlue} fancy />
        <PriceTag x={300} y={720} s={0.95} label="200 دولار" color={C.coverBlue} w={320} />
      </g>
      {/* the comparison that changes the feeling */}
      <Arrow from={[400, 215]} to={[650, 285]} bend={-0.35} p={1} color={C.inkSoft} width={10} />
      {/* the $40 pair, the subject */}
      <Headphones x={760} y={450} s={1.3} color={C.blue} />
      <PriceTag x={760} y={770} s={1.25} label="40 دولارًا" color={C.red} />
    </>
  }>
    <AbsoluteFill>
      <div dir="rtl" lang="ar" style={{ position: 'absolute', right: 96, top: 215, width: 780, textAlign: 'center', fontFamily: TITLE, fontWeight: 900, color: C.ink }}>
        <div style={{ fontSize: 138, lineHeight: 1.15 }}>لماذا تبدو</div>
        <div style={{ fontSize: 236, lineHeight: 1.25, color: C.red }}>أرخص؟</div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 64, lineHeight: 1.5, color: C.inkSoft, marginTop: 10 }}>والسعر لم يتغيّر</div>
      </div>
      <div dir="rtl" lang="ar" style={{ position: 'absolute', left: 96, top: 72, fontFamily: TITLE, fontWeight: 800, fontSize: 46, color: C.white, background: C.coverBlue, padding: '0.06em 0.65em 0.16em', borderRadius: 999 }}>فكرة من كتاب</div>
    </AbsoluteFill>
  </Stage>
);
