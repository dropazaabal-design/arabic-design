import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TITLE, BODY } from './fonts';
import { Character } from './kit/characters/Character';
import { EXPRESSIONS } from './kit/characters/face';
import { POSES } from './kit/characters/poses';
import { pose } from './kit/characters/skeleton';
import { INK, PAL, hash } from './kit/style';
import { ChestSwirl } from './scenes/common';

// The film's cover: its central image (shot 8). Salim stands in water up to the chest, a held smile above the
// surface and the feeling turning under it, with the question «هدوء… أم كبت؟». 16:9 for YouTube, 4:5 for feeds.
const Figure: React.FC<{ x: number; feet: number; s: number; line: number; w: number; h: number }> = ({ x, feet, s, line, w, h }) => {
  const wave = Array.from({ length: 49 }, (_, i) => { const px = -40 + i * ((w + 80) / 48); return `${i ? 'L' : 'M'}${px.toFixed(1)} ${(line + Math.sin(i * 0.8) * 7).toFixed(1)}`; }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0 }}>
      <rect width={w} height={h} fill={PAL.paper} />
      {Array.from({ length: 30 }, (_, i) => <path key={i} d={`M${hash(i + 3) * w} ${hash(i * 7 + 3) * line} q30 ${-3 + hash(i) * 6} 60 0`} stroke={INK} strokeOpacity={0.05} strokeWidth={2} fill="none" />)}
      <Character who="salim" x={x} y={feet} s={s} p={pose({ ...POSES.standFront.p, breath: 0.6 })} face={{ ...EXPRESSIONS.forcedSmile, tight: 0.8, look: [0, 0] }} />
      <path d={`${wave} L${w + 40} ${h + 40} L-40 ${h + 40} Z`} fill={PAL.water} opacity={0.42} />
      <path d={`${wave} L${w + 40} ${h + 40} L-40 ${h + 40} Z`} fill={PAL.waterDeep} opacity={0.18} />
      <path d={wave} stroke={PAL.waterDeep} strokeWidth={8} fill="none" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M${60 + k * (w / 5)} ${line + 70 + (k % 2) * 60} h${70 + (k % 3) * 30}`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.5} />)}
      <ChestSwirl x={x} y={feet - 165 * s} r={34 * s} t={1.3} amount={1} />
    </svg>
  );
};

const Title: React.FC<{ size: number; style: React.CSSProperties }> = ({ size, style }) => (
  <div dir="rtl" lang="ar" style={{ position: 'absolute', fontFamily: TITLE, fontWeight: 800, lineHeight: 1.15, ...style }}>
    <div style={{ fontSize: size, color: INK }}>هدوء…</div>
    <div style={{ fontSize: size * 1.08, color: PAL.provoke }}>أم كبت؟</div>
  </div>
);
const Brand: React.FC<{ style: React.CSSProperties; size: number }> = ({ style, size }) => (
  <div dir="rtl" lang="ar" style={{ position: 'absolute', fontFamily: BODY, fontWeight: 700, fontSize: size, color: PAL.textSoft, ...style }}>كتاب وبس</div>
);

export const CoverWide: React.FC = () => (
  <AbsoluteFill>
    <Figure x={560} feet={1290} s={2.75} line={790} w={1920} h={1080} />
    <Title size={190} style={{ right: 110, top: 190, textAlign: 'right' }} />
    <Brand size={44} style={{ right: 118, top: 66 }} />
  </AbsoluteFill>
);

export const CoverTall: React.FC = () => (
  <AbsoluteFill>
    <Figure x={540} feet={1540} s={3.0} line={1010} w={1080} h={1350} />
    <Title size={150} style={{ right: 0, left: 0, top: 70, textAlign: 'center' }} />
    <Brand size={38} style={{ right: 56, bottom: 40, color: '#FFFFFF' }} />
  </AbsoluteFill>
);
