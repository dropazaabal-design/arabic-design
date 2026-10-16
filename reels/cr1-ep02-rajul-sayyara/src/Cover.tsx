import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TITLE } from './fonts';
import { hookBeats } from './programs';
import { Hook } from './scenes/hook';
import { type Ratio } from './stage';
import { Guides, Signature } from './text';
import { C, PROFILES } from './theme';
import { sec } from './time';

// One still per ratio: the paradox at a glance — Majid proud by his new car while every
// onlooker pictures himself at its wheel — and the title in large type. Same scene as the films.
const LAYOUT: Record<Ratio, { box: React.CSSProperties; size: number; align: 'right' | 'center'; shade: string; sig: number }> = {
  '16x9': { box: { left: 48, top: 64, width: 730 }, size: 84, align: 'right', shade: 'linear-gradient(100deg, rgba(16,24,39,0.82) 0%, rgba(16,24,39,0.55) 38%, rgba(16,24,39,0) 58%)', sig: 38 },
  '9x16': { box: { left: 96, top: 1250, width: 804 }, size: 104, align: 'center', shade: 'linear-gradient(0deg, rgba(16,24,39,0.95) 0%, rgba(16,24,39,0.85) 30%, rgba(16,24,39,0) 52%)', sig: 40 },
  '4x5': { box: { left: 86, top: 900, width: 908 }, size: 92, align: 'center', shade: 'linear-gradient(0deg, rgba(16,24,39,0.95) 0%, rgba(16,24,39,0.85) 26%, rgba(16,24,39,0) 46%)', sig: 36 },
};

export const Cover: React.FC<{ ratio: Ratio; guides?: boolean }> = ({ ratio, guides = false }) => {
  const b = hookBeats(ratio === '16x9' ? 'long' : 'short');
  const L = LAYOUT[ratio];
  return (
    <AbsoluteFill style={{ background: C.night, overflow: 'hidden' }}>
      <Hook f={b.imagine + sec(1.2)} b={b} ratio={ratio} />
      <AbsoluteFill style={{ background: L.shade }} />
      <div dir="rtl" lang="ar" style={{ position: 'absolute', ...L.box, display: 'flex', flexDirection: 'column', alignItems: L.align === 'right' ? 'flex-start' : 'center', gap: 20 }}>
        <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: L.size, lineHeight: 1.2, color: C.light, textAlign: L.align, textShadow: '0 4px 18px rgba(0,0,0,0.45)' }}>
          <div style={{ whiteSpace: 'nowrap' }}>الناس ما يشوفونك</div>
          <div style={{ whiteSpace: 'nowrap' }}>في <span style={{ color: C.mint }}>سيارتك</span></div>
        </div>
        <Signature size={L.sig} o={1} />
      </div>
      {guides && <Guides p={PROFILES[ratio]} />}
    </AbsoluteFill>
  );
};
