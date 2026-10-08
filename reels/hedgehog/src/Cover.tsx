import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Hedgehog } from './art/hedgehog';
import { Glow, Ground, Moon, Poke, Snow, Stars } from './art/things';
import { BODY_FONT, TITLE_FONT, loadFonts } from './fonts';
import { C, H, W } from './theme';

loadFonts();

/**
 * Reel cover, 1080×1920. Everything that matters sits inside the middle
 * 1080×1440 (y 240–1680), the 3:4 crop the profile grid shows.
 */
export const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: 'linear-gradient(180deg, #0A1430 0%, #1B3157 62%, #3A2E52 100%)' }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <Stars f={20} o={0.8} />
      <Moon x={930} y={300} o={0.9} />
      <Snow f={40} density={0.5} />
      <Glow id="cg" x={540} y={1290} r={430} o={1} />
      <Ground y={1406} color="#D7E7F7" />
      <Hedgehog x={345} y={1400} s={1.12} dir={1} puff={1} eye="wince" warm={0.8} f={0} />
      <Hedgehog x={735} y={1400} s={1.12} dir={-1} tone="sand" puff={1} eye="wince" warm={0.8} f={0} />
      <Poke x={540} y={1150} p={0.25} s={1.6} />
    </svg>
    <div dir="rtl" lang="ar" style={{ position: 'absolute', top: 290, left: 60, right: 60, textAlign: 'center', fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 176, lineHeight: 1.08, color: C.ivory, textShadow: '0 6px 0 rgba(0,0,0,0.35), 0 0 36px rgba(0,0,0,0.4)' }}>
      معضلة<br /><span style={{ color: C.amber }}>القنفذ</span>
    </div>
    <div dir="rtl" lang="ar" style={{ position: 'absolute', top: 735, left: 80, right: 80, display: 'flex', justifyContent: 'center' }}>
      <div style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 72, color: C.paper, background: C.red, padding: '10px 40px 20px', borderRadius: 999, border: `6px solid ${C.ivory}`, boxShadow: '0 8px 0 rgba(0,0,0,0.3)' }}>
        ليش القرب يوخز؟
      </div>
    </div>
    <div dir="rtl" lang="ar" style={{ position: 'absolute', top: 1560, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
      <div style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 40, color: C.ivory, background: 'rgba(27,31,51,0.75)', padding: '8px 28px 12px', borderRadius: 999 }}>كتاب وبس</div>
    </div>
  </AbsoluteFill>
);
