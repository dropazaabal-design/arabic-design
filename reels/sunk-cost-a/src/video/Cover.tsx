import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Scene } from '../scene/Scene';
import { C, FONT } from '../scene/kit';
import { loadFonts } from './fonts';

loadFonts();

/** The cover: the scene itself at the chosen frame (rendered as a still of this composition, package.json "cover"),
 *  with the title inside the 3:4 crop (y 240–1680) and the brand under it. */
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <Scene />
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 300 }}>
      <div style={{ direction: 'rtl', fontFamily: FONT, fontWeight: 900, fontSize: 104, lineHeight: 1.25, color: '#FFFFFF', background: 'rgba(20,16,36,0.9)', padding: '12px 48px 34px', borderRadius: 44, textAlign: 'center', whiteSpace: 'nowrap' }}>
        لماذا تتمسك<br />بالخسارة؟
      </div>
      <div style={{ marginTop: 22, direction: 'rtl', fontFamily: FONT, fontWeight: 900, fontSize: 44, color: '#FFFFFF', background: C.velvet, padding: '6px 30px 14px', borderRadius: 30 }}>كتاب وبس</div>
    </AbsoluteFill>
  </AbsoluteFill>
);
