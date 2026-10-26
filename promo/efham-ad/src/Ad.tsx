import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { COLORS, TINT } from './config';
import { Covers, Doc, DocWords, Finale, Product, Tracks } from './scenes';
import { Shelf } from './shelf';

// One board, two frames. Every scene is laid out on a 1080×1350 board (4:5). The feed is that board; the reel puts it
// at y 285–1635, the band the platform's buttons and captions leave clear, and extends only the background around it.
export const BOARD = { w: 1080, h: 1350, reelTop: 285 };

const Background: React.FC<{ f: number; h: number; top: number }> = ({ f, h, top }) => {
  const drift = (k: number) => Math.sin(f / 240 + k) * 14;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${COLORS.navy} 0%, #0A1C31 55%, ${COLORS.navy} 100%)` }}>
      <svg width={1080} height={h} style={{ position: 'absolute', inset: 0 }}>
        {/* the covers' own motif: thin circles, far behind (they drift slower than anything on the board) */}
        <circle cx={150 + drift(0)} cy={top + 470} r={340} fill="none" stroke={TINT.line} strokeWidth={2} opacity={0.55} />
        <circle cx={930 + drift(2)} cy={top + 1150} r={250} fill="none" stroke={TINT.line} strokeWidth={2} opacity={0.45} />
        {top > 0 && (
          // reel only: the outer bands carry decoration and nothing else
          <g opacity={0.5}>
            <path d={`M-40 ${150 + drift(1)} C 260 ${40 + drift(3)}, 640 ${250 - drift(2)}, 1120 ${110 + drift(4)}`} fill="none" stroke={COLORS.blue} strokeWidth={3} opacity={0.5} />
            <path d={`M-40 ${h - 140 - drift(2)} C 300 ${h - 40}, 700 ${h - 250 + drift(1)}, 1120 ${h - 120}`} fill="none" stroke={COLORS.blue} strokeWidth={3} opacity={0.5} />
            {[0, 1, 2, 3, 4].map((k) => <circle key={k} cx={190 + k * 175} cy={h - 70 + (k % 2) * 16} r={4} fill={TINT.dim} opacity={0.5} />)}
            {[0, 1, 2, 3, 4].map((k) => <circle key={`t${k}`} cx={190 + k * 175} cy={72 + (k % 2) * 16} r={4} fill={TINT.dim} opacity={0.5} />)}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export const Ad: React.FC<{ format: 'reel' | 'feed'; audio?: boolean }> = ({ format, audio = true }) => {
  const f = useCurrentFrame();
  const reel = format === 'reel';
  const H = reel ? 1920 : BOARD.h, top = reel ? BOARD.reelTop : 0;
  const fade = 'linear-gradient(180deg, transparent 0px, #000 36px, #000 calc(100% - 36px), transparent 100%)';
  return (
    <AbsoluteFill style={{ background: COLORS.navy, overflow: 'hidden' }}>
      <Background f={f} h={H} top={top} />
      <div style={{ position: 'absolute', left: 0, top, width: BOARD.w, height: BOARD.h, overflow: 'hidden', ...(reel ? { maskImage: fade, WebkitMaskImage: fade } : {}) }}>
        <Shelf f={f} />
        <Tracks f={f} />
        <Covers f={f} />
        <Product f={f} />
        <Doc f={f} />
        <DocWords f={f} />
        <Finale f={f} />
      </div>
      {audio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
