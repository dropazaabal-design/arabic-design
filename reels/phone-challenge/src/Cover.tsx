import React from 'react';
import { Phone, TimerRing } from './art/reel';
import { TITLE_FONT, loadFonts } from './fonts';
import { Stage } from './Stage';
import { C } from './theme';

loadFonts();

// One 9:16 cover for Instagram, Facebook Reels, YouTube Shorts and X: the reel's own opening — the
// phone inside a two-minute timer — with the hook in two big lines. Everything that matters sits in
// the central 3:4 (y 240–1680) that Instagram's profile grid shows.
export const COVER = { line1: 'دقيقتان', line2: 'بلا هاتف؟', brand: 'كتاب وبس' };

export const Cover: React.FC = () => (
  <Stage f={0} svg={
    <>
      <TimerRing x={540} y={1110} r={370} p={0.78} />
      <Phone x={540} y={1110} s={0.78} />
    </>
  }>
    <div dir="rtl" lang="ar" style={{ position: 'absolute', left: 40, right: 40, top: 262, textAlign: 'center', fontFamily: TITLE_FONT, fontWeight: 900 }}>
      <div style={{ fontSize: 150, lineHeight: 1.12, color: C.ink }}>{COVER.line1}</div>
      <div style={{ fontSize: 172, lineHeight: 1.16, color: C.red }}>{COVER.line2}</div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1548, display: 'flex', justifyContent: 'center' }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 46, color: C.white, background: C.blue, padding: '0.06em 0.7em 0.16em', borderRadius: 999 }}>{COVER.brand}</div>
    </div>
  </Stage>
);
