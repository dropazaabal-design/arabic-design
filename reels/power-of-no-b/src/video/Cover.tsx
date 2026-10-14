import React from 'react';
import { PAL } from '@mukarram/characters/ink';
import { Shot } from '@mukarram/video/stage';
import { C } from '../characters/studio';
import { B, BOUNDS, World, worker } from '../scenes/world';
import { TITLE_FONT, loadFonts } from './fonts';

loadFonts();

// Cover (still, 1080×1920): the worst moment of the pile — cup under his chin, the plant tipping, the bag
// swinging, the clock at 5:03 behind him. The headline sits inside Instagram's 3:4 grid crop (y 240–1680).
export const Cover: React.FC = () => {
  const f = B().tilt + 9;
  const x = worker(f).at.x;
  const title = (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 280, display: 'flex', justifyContent: 'center' }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 100, lineHeight: 1.22, whiteSpace: 'nowrap', minWidth: 620, textAlign: 'center', color: PAL.ink, background: C.soft, padding: '0.1em 0.5em 0.22em', borderRadius: 36, border: `8px solid ${PAL.ink}`, boxShadow: `0 12px 0 ${PAL.red}` }}>
        قال نعم…<br />حتى اختفى<br />تحت <span style={{ color: PAL.red }}>الطلبات!</span>
      </div>
    </div>
  );
  return (
    <Shot f={f} cam={{ cx: x + 40, cy: 1080, zoom: 1.62 }} bounds={BOUNDS} bg={C.wall} overlay={title}>
      <World f={f} />
    </Shot>
  );
};
