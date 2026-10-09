import React from 'react';
import { Drawer, SaveButton } from './art/saved';
import { GENERIC_TABS, LABELED_TABS } from './scenes/shared';
import { TITLE_FONT, loadFonts } from './fonts';
import { Stage } from './Stage';
import { C } from './theme';

loadFonts();

// One 9:16 cover for Instagram, Facebook Reels, YouTube Shorts and X: the reel's opening idea in one
// picture — the save button over a drawer that is already full — with the hook in two big lines.
// Everything that matters sits in the central 3:4 (y 240–1680) that Instagram's grid shows.
export const COVER = { line1: 'حفظت…', line2: 'ولم تطبّق؟', brand: 'كتاب وبس' };

export const Cover: React.FC = () => (
  <Stage f={0} svg={
    <>
      <Drawer open={1} tabs={[...GENERIC_TABS.map((t) => ({ ...t, dust: 0.6 })), ...LABELED_TABS]} />
      <SaveButton x={540} y={810} s={1.15} fill={1} />
    </>
  }>
    <div dir="rtl" lang="ar" style={{ position: 'absolute', left: 40, right: 40, top: 262, textAlign: 'center', fontFamily: TITLE_FONT, fontWeight: 900 }}>
      <div style={{ fontSize: 150, lineHeight: 1.12, color: C.ink }}>{COVER.line1}</div>
      <div style={{ fontSize: 160, lineHeight: 1.16, color: C.red }}>{COVER.line2}</div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1548, display: 'flex', justifyContent: 'center' }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 46, color: C.white, background: C.blue, padding: '0.06em 0.7em 0.16em', borderRadius: 999 }}>{COVER.brand}</div>
    </div>
  </Stage>
);
