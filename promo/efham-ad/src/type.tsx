import React from 'react';
import { COLORS, TITLE } from './config';
import { ease, mix, p } from './motion';

// Arabic set word by word. A word is never split into letters, so its letters stay joined; each word rises into
// place on its own beat, and a highlighted word gets a line drawn under it after it lands.
type WordsProps = {
  f: number; text: string; at: number; // first frame of the first word
  top: number; size: number; left?: number; width?: number;
  weight?: number; font?: string; color?: string; stagger?: number;
  out?: number; // first frame of the exit (words leave in reading order)
  hi?: Record<number, string>; // word index → colour; those words are underlined
  align?: 'center' | 'right'; lh?: number;
};
export const Words: React.FC<WordsProps> = ({ f, text, at, top, size, left = 90, width = 900, weight = 800, font = TITLE, color = COLORS.white, stagger = 5, out, hi = {}, align = 'center', lh = 1.25 }) => {
  const list = text.split(' ');
  return (
    <div dir="rtl" lang="ar" style={{ position: 'absolute', top, left, width, textAlign: align, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: lh, color }}>
      {list.map((word, k) => {
        const t = p(f, at + k * stagger, 22, ease.out);
        const x = out === undefined ? 0 : p(f, out + k * 3, 14, ease.in);
        const o = t * (1 - x);
        if (o <= 0.001) return <React.Fragment key={k}><span style={{ display: 'inline-block', opacity: 0 }}>{word}</span>{k < list.length - 1 ? ' ' : ''}</React.Fragment>;
        const u = p(f, at + k * stagger + 14, 20, ease.inOut) * (1 - x);
        return (
          <React.Fragment key={k}>
            <span style={{ display: 'inline-block', position: 'relative', opacity: o, transform: `translateY(${mix(size * 0.42, 0, t) - x * size * 0.3}px)`, color: hi[k] ?? color }}>
              {word}
              {hi[k] && (
                <svg style={{ position: 'absolute', left: 0, right: 0, bottom: -size * 0.08, width: '100%', height: size * 0.22, overflow: 'visible' }} viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M100 6 Q50 1 0 6" fill="none" stroke={hi[k]} strokeWidth={3.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - u} style={{ strokeWidth: size * 0.07 }} />
                </svg>
              )}
            </span>
            {k < list.length - 1 ? ' ' : ''}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** A number that counts up to `to` with weight (Western digits), then rests. */
export const countUp = (f: number, at: number, to: number, len = 42) => Math.round(to * p(f, at, len, ease.out));
