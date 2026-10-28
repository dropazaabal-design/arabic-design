import React from 'react';
import { PAL } from '@mukarram/characters/ink';
import { BothHands } from '../scenes/shots';
import { B } from '../scenes/world';
import { TITLE_FONT, loadFonts } from './fonts';

loadFonts();

// Cover (still, 1080×1920): the climax freeze — one hand keeps «ملغي» on the meeting door, the other holds the
// chair to attend, 3:00 on the clock. The title sits inside Instagram's 3:4 grid crop (y 240–1680).
export const Cover: React.FC = () => {
  const f = B().freeze + 3;
  const title = (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 268, display: 'flex', justifyContent: 'center' }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 122, lineHeight: 1.18, color: PAL.white, background: '#1B2C44', padding: '0.06em 0.45em 0.18em', borderRadius: 34, border: `8px solid ${PAL.ink}`, boxShadow: '0 10px 0 rgba(0,0,0,0.25)', whiteSpace: 'nowrap' }}>
        التفكير <span style={{ color: PAL.red }}>المزدوج</span>
      </div>
    </div>
  );
  return <BothHands f={f} t0={f - 60} t1={f + 60} cam={{ cx: -2385, cy: 1060, zoom: 1.26 }} overlay={title} />;
};
