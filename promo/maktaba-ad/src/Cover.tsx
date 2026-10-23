import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Character } from '../../../films/hudoo/src/kit/characters/Character';
import { EXPRESSIONS } from '../../../films/hudoo/src/kit/characters/face';
import { pose } from '../../../films/hudoo/src/kit/characters/skeleton';
import { Backdrop, C, Chip, PAGE_H, PAGE_W, Phone, Txt, page, phoneDims } from './parts';

// The reel's cover (1080×1920; everything that matters inside the central 4:5 band, which profile grids show).
// The hook question, the product open on a phone, the stickman who just found it.
export const Cover: React.FC = () => {
  const P = { cx: 610, cy: 1060, w: 420 };
  const { sw, sh } = phoneDims(P.w);
  return (
    <AbsoluteFill>
      <Backdrop h={1920} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <Phone {...P} rot={4}>
          <rect width={sw} height={sh} fill={C.navy} />
          <image href={page(1)} x={0} y={(sh - sw * PAGE_H / PAGE_W) / 2} width={sw} height={sw * PAGE_H / PAGE_W} />
        </Phone>
        <Character who="salim" x={250} y={1640} s={2.3} facing={1}
          p={pose({ turn: 0.6, body: 0.4, head: -4, R: { sh: -6, el: 8 }, L: { hand: [70, -230] } })} hands={{ R: 'relaxed', L: 'point' }}
          face={{ ...EXPRESSIONS.surprised, mouth: 0.5, look: [0.9, -0.3] }} />
      </svg>
      <Txt x={40} y={330} w={1000} size={104} color={C.navy}>محفوظ…</Txt>
      <Txt x={40} y={450} w={1000} size={104} color={C.blue}>لكنه غائب؟</Txt>
      <Chip x={540} y={1580} o={1} size={50}>50 قاعدة · 50 خريطة</Chip>
    </AbsoluteFill>
  );
};
