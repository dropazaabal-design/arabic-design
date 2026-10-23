import React from 'react';
import { BODY_FONT, TITLE_FONT } from './fonts';
import { C, SAFE } from './theme';
import { ease, mix, prog, sec } from './time';

// Arabic is laid out by the browser, right to left, letters joined. Motion is per
// line or per whole word (a word is shaped first, then moved as one unit);
// letters are never split. `{color|words}` colours a whole phrase.
export const Rich: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\{[^}]+\})/).filter(Boolean).map((part, i) => {
      const m = part.match(/^\{([^|]+)\|(.+)\}$/);
      return m ? <span key={i} style={{ color: m[1] }}>{m[2]}</span> : <span key={i}>{part}</span>;
    })}
  </>
);
export const plain = (t: string) => t.replace(/\{[^|]+\|([^}]+)\}/g, '$1');

type Box = { x: number; y: number; w?: number; align?: 'center' | 'right' | 'left' };
const place = ({ x, y, w = 1200, align = 'center' }: Box): React.CSSProperties => ({
  position: 'absolute', top: y, width: w,
  left: align === 'center' ? x - w / 2 : align === 'right' ? x - w : x,
  textAlign: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
});

/** A headline revealed line by line (each line rises in as one unit). */
export const Headline: React.FC<Box & { text: string; f: number; at: number; until?: number; size?: number; color?: string; weight?: number; stagger?: number }> = ({ text, f, at, until = Infinity, size = 96, color = C.ink, weight = 900, stagger = sec(0.18), ...box }) => {
  if (f < at - 1 || f > until + sec(0.4)) return null;
  const out = until === Infinity ? 0 : prog(f, until, sec(0.3), ease.in);
  return (
    <div dir="rtl" lang="ar" style={{ ...place(box), fontFamily: TITLE_FONT, fontWeight: weight, fontSize: size, lineHeight: 1.22, color, opacity: 1 - out }}>
      {text.split('\n').map((line, i) => {
        const p = prog(f, at + i * stagger, sec(0.45), ease.out);
        return <div key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 26}px)` }}><Rich text={line} /></div>;
      })}
    </div>
  );
};

/** Words of one line appear one whole word at a time (kinetic typography without splitting letters). */
export const WordByWord: React.FC<Box & { text: string; f: number; times: number[]; until?: number; size?: number; color?: string }> = ({ text, f, times, until = Infinity, size = 72, color = C.ink, ...box }) => {
  if (f < times[0] - 1 || f > until + sec(0.4)) return null;
  const out = until === Infinity ? 0 : prog(f, until, sec(0.3), ease.in);
  const parts = text.split(' ');
  return (
    <div dir="rtl" lang="ar" style={{ ...place(box), fontFamily: TITLE_FONT, fontWeight: 900, fontSize: size, lineHeight: 1.25, color, opacity: 1 - out }}>
      {parts.map((word, i) => {
        const p = prog(f, times[Math.min(i, times.length - 1)], sec(0.3), ease.out);
        return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 18}px) scale(${mix(0.92, 1, p)})`, marginInlineStart: i ? '0.28em' : 0 }}><Rich text={word} /></span>;
      })}
    </div>
  );
};

/** A small label (pill) that pops in as a unit. */
export const Label: React.FC<Box & { text: string; f: number; at: number; until?: number; size?: number; bg?: string; color?: string; border?: string }> = ({ text, f, at, until = Infinity, size = 40, bg = C.ink, color = C.white, border, ...box }) => {
  if (f < at - 1 || f > until + sec(0.4)) return null;
  const p = prog(f, at, sec(0.3), ease.out);
  const out = until === Infinity ? 0 : prog(f, until, sec(0.3), ease.in);
  return (
    <div style={{ ...place({ w: 900, ...box }), display: 'flex', justifyContent: box.align === 'right' ? 'flex-end' : box.align === 'left' ? 'flex-start' : 'center', opacity: Math.min(p, 1 - out), transform: `scale(${mix(0.85, 1, p)})` }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: size, lineHeight: 1.3, color, background: bg, padding: '0.08em 0.6em 0.18em', borderRadius: 999, whiteSpace: 'nowrap', border: border ? `4px solid ${border}` : undefined }}><Rich text={text} /></div>
    </div>
  );
};

/** Secondary text (Tajawal), still, faded as a block. */
export const Note: React.FC<Box & { text: string; f: number; at: number; until?: number; size?: number; color?: string }> = ({ text, f, at, until = Infinity, size = 38, color = C.inkSoft, ...box }) => {
  if (f < at - 1 || f > until + sec(0.4)) return null;
  const p = prog(f, at, sec(0.4));
  const out = until === Infinity ? 0 : prog(f, until, sec(0.3), ease.in);
  return <div dir="rtl" lang="ar" style={{ ...place(box), fontFamily: BODY_FONT, fontWeight: 700, fontSize: size, lineHeight: 1.35, color, opacity: Math.min(p, 1 - out), whiteSpace: 'pre-line' }}><Rich text={text} /></div>;
};

export const SAFE_TOP = SAFE.top;
