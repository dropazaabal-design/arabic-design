import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, FONT } from '../scene/kit';
import { B, Sh19 } from '../scene/shots';
import { loadFonts } from './fonts';

loadFonts();

/** The cover: the moment the podium's boom reaches for him at the bench (the choice), the question on top. Rendered at
 *  1080×1920; publish/cover-1080x1350.jpg is its centred 4:5 crop (y 285–1635), so the text sits inside both. */
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Sh19 t={0} T={B.explain + 0.45} t0={B.but2 - 0.25} cam={{ cx: 385, cy: 1108, zoom: 1.8 }} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(6,20,17,0.85) 0%, rgba(6,20,17,0.55) 30%, rgba(6,20,17,0) 48%)' }} />
    <div style={{ position: 'absolute', top: 330, left: 0, width: 1080, textAlign: 'center', direction: 'rtl', fontFamily: FONT, fontWeight: 900, fontSize: 96, lineHeight: 1.3, color: C.porc, textShadow: '0 6px 30px rgba(0,0,0,0.5)' }}>
      هل <span style={{ color: C.teal2 }}>تبني</span> حياتك…<br />أم <span style={{ color: C.berry2 }}>تبرّرها</span>؟
    </div>
    <div style={{ position: 'absolute', top: 610, left: 0, width: 1080, textAlign: 'center', direction: 'rtl', fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.teal2 }}>كتاب وبس</div>
  </AbsoluteFill>
);
