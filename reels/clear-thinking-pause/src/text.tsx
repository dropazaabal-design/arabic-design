import React from 'react';
import { BODY_FONT, TITLE_FONT } from './fonts';
import captions from './captions.json';
import { C, CAPTION, W } from './theme';
import { ease, mix, prog, sec } from './time';

// Arabic is laid out by the browser, right to left, letters joined. Motion moves whole lines or
// whole words (shaped first, then moved as one unit); letters are never split.

let ctx: CanvasRenderingContext2D | null = null;
const widths = new Map<string, number>();
/** Advance width of a run in a loaded font (cached only once the font is really loaded). */
export const measure = (text: string, font: string) => {
  const key = `${font}|${text}`;
  const hit = widths.get(key);
  if (hit !== undefined) return hit;
  ctx ??= document.createElement('canvas').getContext('2d')!;
  ctx.font = font;
  ctx.direction = 'rtl';
  const w = ctx.measureText(text).width;
  if (document.fonts.check(font, text)) widths.set(key, w);
  return w;
};

/** A short label (pill) that pops in as a unit. */
export const Pill: React.FC<{ text: string; o: number; color: string; size?: number; solid?: boolean; style?: React.CSSProperties }> = ({ text, o, color, size = 40, solid = true, style }) => (
  <div dir="rtl" lang="ar" style={{
    fontFamily: TITLE_FONT, fontWeight: 800, fontSize: size, lineHeight: 1.3, whiteSpace: 'nowrap',
    color: solid ? C.white : color, background: solid ? color : 'rgba(22,24,28,0.9)', border: solid ? undefined : `3px solid ${color}`,
    padding: '0.1em 0.62em 0.2em', borderRadius: 999, opacity: o, transform: `scale(${mix(0.86, 1, o)})`,
    boxShadow: '0 10px 28px rgba(0,0,0,0.35)', ...style,
  }}>{text}</div>
);

type Cap = { seg: string; text: string; start: number; end: number };
const shown = (captions as Cap[]).filter((c) => c.seg !== 's01'); // s01 is the hook itself, already on screen
const trim = (t: string) => t.replace(/[.،:]+$/, '');

/** Burned-in captions: one chunk at a time, one or two balanced lines, bottom-anchored. */
export const Captions: React.FC<{ f: number }> = ({ f }) => {
  const c = shown.find((x) => f >= sec(x.start) - 2 && f < sec(x.end));
  if (!c) return null;
  const o = Math.min(prog(f, sec(c.start) - 2, 4, ease.out), 1 - prog(f, sec(c.end) - 3, 3, ease.in));
  return (
    <div style={{ position: 'absolute', left: (W - CAPTION.width) / 2, width: CAPTION.width, bottom: 1920 - CAPTION.bottom, display: 'flex', justifyContent: 'center' }}>
      <div dir="rtl" lang="ar" style={{
        fontFamily: BODY_FONT, fontWeight: 700, fontSize: CAPTION.size, lineHeight: 1.42, color: C.white, textAlign: 'center',
        textWrap: 'balance', opacity: o, padding: '6px 22px 10px', borderRadius: 18, background: 'rgba(14,15,18,0.62)',
      } as React.CSSProperties}>{trim(c.text)}</div>
    </div>
  );
};
export { TITLE_FONT, BODY_FONT };
