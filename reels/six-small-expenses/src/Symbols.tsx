import React from 'react';
import { C, FRAMES } from './theme';

// The symbols above the title: a wallet with a receipt, and round coins slipping out of it and fading —
// small expenses leaking away. Vector only; no currency signs, no hands, no faces. The coins drift one
// slot along their path every half of the reel, so the last frame meets the first when it loops.
type Pt = [number, number];
const path = (u: number): Pt => [395 - 255 * u, 262 + 70 * u - 22 * Math.sin(Math.PI * u)];
const SLOTS = 4;

const Coin: React.FC<{ at: Pt; s: number; o: number }> = ({ at, s, o }) => (
  <g transform={`translate(${at[0]} ${at[1]}) scale(${s})`} opacity={o}>
    <circle r={30} fill={C.green} />
    <circle r={21} fill="none" stroke={C.greenDark} strokeWidth={5} />
    <path d="M -9 -13 A 16 16 0 0 1 9 -13" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
  </g>
);

export const Symbols: React.FC<{ frame: number }> = ({ frame }) => {
  const drift = ((frame / (FRAMES / 2)) % 1) / SLOTS;                  // one slot per half reel
  const coins = Array.from({ length: SLOTS + 1 }).map((_, i) => (i + 0.35) / SLOTS + drift - 1 / SLOTS)
    .filter((u) => u > 0 && u < 1.05);
  return (
    <svg width={1080} height={350} viewBox="0 0 1080 350" style={{ position: 'absolute', left: 0, top: 0 }}>
      <g transform="translate(66 0)">
      {/* receipt, behind the wallet */}
      <g transform="translate(470 54) rotate(-6)">
        <path d="M 0 22 L 15 8 L 30 22 L 45 8 L 60 22 L 75 8 L 90 22 L 105 8 L 120 22 L 135 8 L 150 22 L 150 200 L 0 200 Z" fill={C.paper} />
        {[52, 80, 108].map((y, i) => <rect key={y} x={22} y={y} width={[96, 78, 104][i]} height={10} rx={5} fill={C.rule} />)}
        <rect x={22} y={140} width={106} height={14} rx={7} fill={C.blue} />
      </g>
      {/* coins slipping out of the wallet's left side */}
      {coins.map((u, i) => <Coin key={i} at={path(Math.min(1, u))} s={1 - 0.45 * Math.min(1, u)} o={Math.max(0, Math.min(1, (1 - u) * 1.6, u * 12))} />)}
      {/* wallet */}
      <rect x={395} y={150} width={300} height={170} rx={30} fill={C.blue} />
      <rect x={395} y={150} width={300} height={44} rx={22} fill={C.blueDark} opacity={0.55} />
      <rect x={612} y={204} width={104} height={70} rx={20} fill={C.blueDark} />
      <circle cx={650} cy={239} r={12} fill={C.paper} />
      </g>
    </svg>
  );
};
