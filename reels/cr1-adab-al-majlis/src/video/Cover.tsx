import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Scene } from '../scene/Scene';
import { C, FONT } from '../scene/kit';
import { loadFonts } from './fonts';

loadFonts();

/** The cover: the scene itself at the chosen frame (a still of this composition, package.json "cover"), the title
 *  inside the 3:4 crop (y 240–1680) and the brand under it, over a frame with no card. */
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Scene />
    {/* the plain wall above the arches, over the shot's own title, so only the cover title reads */}
    <AbsoluteFill style={{ background: C.bg, height: 520 }} />
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 300 }}>
      <div style={{ direction: 'rtl', fontFamily: FONT, fontWeight: 900, fontSize: 124, lineHeight: 1.25, color: '#FFFFFF', background: C.ink, padding: '14px 60px 38px', borderRadius: 48, textAlign: 'center', whiteSpace: 'nowrap', border: `6px solid ${C.ink}` }}>
        آداب المجلس
      </div>
      <div style={{ marginTop: 22, direction: 'rtl', fontFamily: FONT, fontWeight: 900, fontSize: 46, color: '#FFFFFF', background: C.brand, padding: '6px 30px 14px', borderRadius: 30 }}>كتاب وبس</div>
    </AbsoluteFill>
  </AbsoluteFill>
);
