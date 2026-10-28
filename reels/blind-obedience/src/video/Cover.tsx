import React from 'react';
import { PAL } from '@mukarram/characters/ink';
import { Hook } from '../scenes/shots';
import { TITLE_FONT, loadFonts } from './fonts';

loadFonts();

// Cover (still, 1080×1920): the finger over 450 volts, the last switches red. The headline asks the viewer
// directly and sits inside Instagram's 3:4 grid crop (y 240–1680).
export const Cover: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0 }}>
    <Hook f={40} t0={0} t1={75} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 290, display: 'flex', justifyContent: 'center' }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 108, lineHeight: 1.2, textAlign: 'center', whiteSpace: 'nowrap', color: PAL.ink, background: '#E6ECF4', padding: '0.1em 0.5em 0.22em', borderRadius: 36, border: `8px solid ${PAL.ink}`, boxShadow: `0 12px 0 ${PAL.red}` }}>
        <span style={{ color: PAL.red }}>65%</span> ضغطوا<br />الزر الأخير…<br />وأنت؟
      </div>
    </div>
  </div>
);
