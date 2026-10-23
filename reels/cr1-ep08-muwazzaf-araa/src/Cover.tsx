import React from 'react';
import { AbsoluteFill } from 'remotion';
import { holdCard } from './shots';
import { Card, Flyer } from './props';
import { EXPRESSIONS, TITLE, hash, pose } from './kit';
import { B } from './look';
import { OFFICE } from './sets';
import { OfficeScene, type Cam } from './stage';
import { arms } from './act';

// The cover (1080×1920; title and character inside the 4:5 band that profile grids show): Naif at his counter,
// a contradicting card in each hand, the box glowing angry, opinions raining.
export const Cover: React.FC = () => {
  const P = OFFICE.naif, f = 0;
  const body = pose({ turn: 0.08, body: 0.08, head: 6, lean: 0 });
  const p = arms(P, f, body, [[0, [360, 1110]]], [[0, [690, 1110]]]);
  const cam: Cam = { x: 530, y: 1000, z: 1.25 };
  return (
    <AbsoluteFill style={{ background: B.navy }}>
      <OfficeScene cam={cam} armsFront st={{ rating: { lit: { angry: 1 } }, queue: 99, queueFlash: 1, chutePuff: 1 }}
        naif={{ f, p, face: { ...EXPRESSIONS.forcedSmile, look: [0, 0], blush: 0.4 }, hands: { R: 'grip', L: 'grip' },
          hold: { R: holdCard(P, p, 'R', <Card text="ليش ما رديت على رسالتي؟" />), L: holdCard(P, p, 'L', <Card text="ليش رديت بسرعة؟ فاضي؟" seed={2} />) }, upright: { R: true, L: true } }}
        front={<g>{Array.from({ length: 22 }, (_, i) => [90 + hash(i * 7) * 900, 470 + hash(i * 3) * 330, i] as const).filter(([x, y]) => Math.hypot(x - 525, (y - 870) * 1.2) > 190).map(([x, y, i]) => <g key={i} transform={`translate(${x} ${y}) rotate(${(hash(i) - 0.5) * 80})`}><Flyer seed={i} s={0.9} /></g>)}</g>} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div dir="rtl" lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 104, lineHeight: 1.05, color: B.white, padding: '0 30px 6px' }}>موظف عند</div>
        <div dir="rtl" lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 104, lineHeight: 1.05, color: B.navy, background: B.white, padding: '8px 40px 20px', borderRadius: 30, border: `6px solid ${B.blue}` }}>آراء الناس</div>
      </div>
    </AbsoluteFill>
  );
};
