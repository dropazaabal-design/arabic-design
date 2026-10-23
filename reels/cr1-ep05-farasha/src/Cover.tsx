import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BODY, TITLE } from './fonts';
import { Butterfly } from './props';
import { React_ } from './scenes/lab';
import { C } from './theme';
import { setFps } from './time';

// The cover: his surprise, the two runs that parted on the sheet in his hand, the butterfly that named it.
// Everything that matters sits inside the 4:5 centre crop (y 285–1635) that profile grids show.
export const Cover: React.FC = () => {
  setFps(60);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <React_ f={200} k={{ start: 0, stop: 60, shock: 120, end: 400 }} cam={{ x: 250, y: -610, z: 1.78 }}
        extra={<g transform="translate(452 -742) rotate(-14)"><Butterfly flap={0.15} s={0.98} /></g>} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 760, background: `linear-gradient(${C.bg} 62%, rgba(230,239,236,0))` }} />
      <div dir="rtl" lang="ar" style={{ position: 'absolute', top: 300, left: 70, right: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 44, color: C.paper, background: C.fly, borderRadius: 999, padding: '2px 34px 8px' }}>تأثير الفراشة</div>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 150, lineHeight: 1.12, color: C.ink, textAlign: 'center' }}>رقم ناقص…</div>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 112, lineHeight: 1.15, color: C.run2, textAlign: 'center' }}>غيّر الطقس كله</div>
      </div>
      <div dir="rtl" lang="ar" style={{ position: 'absolute', top: 1540, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.paper, background: 'rgba(14,22,38,0.82)', borderRadius: 16, padding: '4px 26px 10px' }}>
          فكرة من كتاب <span style={{ color: C.lampOn }}>·</span> كتاب وبس
        </div>
      </div>
    </AbsoluteFill>
  );
};
