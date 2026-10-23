import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ReelA } from './a/A';
import { ReelB } from './b/B';
import { ReelC } from './c/C';
import { BODY, TITLE } from './fonts';
import { Figure, pose } from './rig';

// Covers: a frame of the reel without its words, a fade behind the title, the title, the signature.
// Everything that matters sits inside the 4:5 centre crop (y 285–1635) that profile grids show.
type Look = { ink: string; sub: string; fade: string; accent: string };
const Title: React.FC<{ kicker: string; big: string; sub: string; look: Look }> = ({ kicker, big, sub, look }) => (
  <>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 900, background: `linear-gradient(${look.fade} 58%, transparent)` }} />
    <div dir="rtl" lang="ar" style={{ position: 'absolute', top: 310, left: 60, right: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 46, color: '#FFFFFF', background: look.accent, borderRadius: 999, padding: '4px 36px 10px' }}>{kicker}</div>
      <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 138, lineHeight: 1.12, color: look.ink, textShadow: '0 6px 30px rgba(0,0,0,0.45)' }}>{big}</div>
      <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 72, lineHeight: 1.2, color: look.sub }}>{sub}</div>
    </div>
    <div dir="rtl" lang="ar" style={{ position: 'absolute', top: 1546, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 40, color: '#F4F7FB', background: 'rgba(5,7,10,0.72)', borderRadius: 16, padding: '4px 26px 10px' }}>كتاب وبس</div>
    </div>
  </>
);

// A: he is at the top holding up what he reached for; they look up at him in silence. What he does next is the question.
export const CoverA: React.FC = () => (
  <AbsoluteFill>
    <ReelA bare still={Math.round(10.1 * 60)} cam={{ x: 760, y: 210, z: 1.3 }} />
    {/* the ones who laughed, close in the foreground, silent, looking up at him */}
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      {[[70, 1, 3.6, 2330], [300, 1, 3.0, 2250], [1010, -1, 3.4, 2300]].map(([x, facing, s, y]) => (
        <Figure key={x} p={pose({ head: -26, shF: 4, elF: 6, shN: -4, elN: 6 })} x={x} y={y} s={s} facing={facing as 1 | -1} eyes="shock" color="#05070A" eyeColor="#F4F7FB" look={[0.5, -1]} />
      ))}
    </svg>
    <Title kicker="رموه بـ«فاشل»…" big="ضحكوا عليه…" sub="شوف إيش سوّى لما وصل" look={{ ink: '#F4F7FB', sub: '#C9D1DC', fade: '#4F596C', accent: '#D2334A' }} />
  </AbsoluteFill>
);

// B: the offshoot just planted, the old man's hand on the boy's head. The question is the title.
export const CoverB: React.FC = () => (
  <AbsoluteFill>
    <ReelB bare still={Math.round(4.15 * 60)} cam={{ x: 540, y: 1480 - 560 / 2.05, z: 2.05 }} />
    <Title kicker="سأله حفيده:" big="يا جدّي… متى بتاكل منها؟" sub="جوابه أخذ 40 سنة" look={{ ink: '#FBF3F8', sub: '#F3C6D8', fade: '#262955', accent: '#8A3460' }} />
  </AbsoluteFill>
);

// C: the 101st strike has landed and the crack runs through all hundred chips. Why this one broke it is the question.
export const CoverC: React.FC = () => (
  <AbsoluteFill>
    <ReelC bare still={Math.round(10.3 * 60)} cam={{ x: 620, y: 1080, z: 1.25 }} />
    <Title kicker="100 ضربة… وما صار شي" big="الضربة 101" sub="شوف إيش صار" look={{ ink: '#F4F7FB', sub: '#C9FBF4', fade: '#2E3136', accent: '#1F8F89' }} />
  </AbsoluteFill>
);
