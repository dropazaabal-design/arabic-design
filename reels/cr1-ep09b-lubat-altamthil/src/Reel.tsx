import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import WORDS from '../timing/words.json';
import LINES from '../timing/lines.json';
import { BODY, COLORS, TINT } from './config';
import { p } from './motion';
import { SCENES } from './scenes';
import { FPS, sceneStart } from './timing';

const words = WORDS as { line: number; i: number; word: string; start: number; end: number }[];
const X = 12; // crossfade frames between scenes

/** The spoken line, word by word as it is said (each word whole, so its letters stay joined). */
const Caption: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const L = LINES.lines.find((l) => t >= l.start - 0.05 && t <= l.end + 0.25);
  if (!L) return null;
  const ws = words.filter((x) => x.line === L.id);
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: 1420, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: 48, lineHeight: 1.45, textAlign: 'center', color: COLORS.white }}>
        {ws.map((x, k) => {
          const o = p(f, Math.round(x.start * FPS) - 3, 6);
          return <React.Fragment key={k}><span style={{ opacity: 0.25 + 0.75 * o, color: o > 0.5 && t < x.end + 0.05 ? COLORS.green : COLORS.white }}>{x.word.replace(/[«»]/g, '')}</span>{k < ws.length - 1 ? ' ' : ''}</React.Fragment>;
        })}
      </div>
    </div>
  );
};

export const Reel: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: COLORS.navy }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
        <circle cx={150} cy={520} r={340} fill="none" stroke={TINT.line} strokeWidth={2} opacity={0.5} />
        <circle cx={940} cy={1180} r={260} fill="none" stroke={TINT.line} strokeWidth={2} opacity={0.4} />
        {SCENES.map((S, k) => {
          const a = sceneStart(k + 1), b = k + 1 < SCENES.length ? sceneStart(k + 2) : Infinity;
          if (f < a - 1 || f > b + X) return null;
          const o = (k === 0 ? 1 : p(f, a, X)) * (1 - p(f, b, X));
          return <g key={k} opacity={o} transform="translate(540 900) scale(1.15) translate(-540 -900)">{S(f)}</g>; // drawn at 1×, shown 1.15× larger
        })}
      </svg>
      <Caption f={f} />
      {audio && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
