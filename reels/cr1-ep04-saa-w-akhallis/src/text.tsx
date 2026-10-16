import React from 'react';
import { BODY, TITLE } from './fonts';
import { C, SAFE } from './theme';
import { Caption, ease, mix, prog, sec } from './time';

// Arabic is laid out by the browser, right to left, letters joined. Motion moves whole lines or
// whole words after shaping; letters are never split.

/** A short line of on-screen text that rises in as one unit. Dark ink on the light sets, with a soft halo for the dim ones. */
export const Title: React.FC<{ text: React.ReactNode; o: number; size: number; color?: string; halo?: boolean; card?: boolean; style?: React.CSSProperties }> = ({ text, o, size, color = C.ink, halo = false, card = false, style }) => (
  <div dir="rtl" lang="ar" style={{
    fontFamily: TITLE, fontWeight: 800, fontSize: size, lineHeight: 1.3, color, textAlign: 'center',
    opacity: o, transform: `translateY(${mix(18, 0, o)}px)`, textWrap: 'balance',
    textShadow: halo ? '0 0 18px rgba(244,247,251,0.95), 0 0 4px rgba(244,247,251,0.9)' : undefined,
    ...(card ? { background: 'rgba(244,247,251,0.94)', borderRadius: 28, padding: '0.1em 0.45em 0.2em', border: `4px solid ${C.ink}` } : {}), ...style,
  } as React.CSSProperties}>{text}</div>
);

/** Our own Arabic book card (no cover image). */
export const BookCard: React.FC<{ o: number; size: number; style?: React.CSSProperties }> = ({ o, size, style }) => (
  <div dir="rtl" lang="ar" style={{
    background: C.paper, color: C.ink, borderRadius: size * 0.35, padding: `${size * 0.4}px ${size * 0.8}px ${size * 0.5}px`,
    borderInlineStart: `${size * 0.22}px solid ${C.clock}`, border: `4px solid ${C.ink}`, opacity: o,
    transform: `translateY(${mix(24, 0, o)}px) scale(${mix(0.94, 1, o)})`, boxShadow: '0 14px 34px rgba(14,22,38,0.18)', textAlign: 'right', width: 'max-content', ...style,
  }}>
    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: size * 0.56, color: C.clockDeep, lineHeight: 1.3 }}>فكرة من كتاب</div>
    <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: size, lineHeight: 1.3, whiteSpace: 'nowrap' }}>«التفكير السريع والبطيء»</div>
    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: size * 0.62, lineHeight: 1.35, color: C.ink }}>دانيال كانمان</div>
  </div>
);

/** Series signature: one line, while the last shot keeps going (never a separate end card). */
export const Signature: React.FC<{ o: number; size: number; style?: React.CSSProperties }> = ({ o, size, style }) => (
  <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: size, color: C.ink, opacity: o, whiteSpace: 'nowrap', ...style }}>
    فكرة من كتاب <span style={{ color: C.clockDeep }}>·</span> كتاب وبس
  </div>
);

/** «قصة توضيحية» for our example story, «من الكتاب» for the book's idea (sources are labelled). */
export const Tag: React.FC<{ o: number; size: number; text: string; style?: React.CSSProperties }> = ({ o, size, text, style }) => (
  <div dir="rtl" lang="ar" style={{
    fontFamily: BODY, fontWeight: 700, fontSize: size, color: C.paper, opacity: o, whiteSpace: 'nowrap',
    background: 'rgba(14,22,38,0.8)', borderRadius: 10, padding: '0.05em 0.55em 0.12em', ...style,
  }}>{text}</div>
);

const trim = (t: string) => t.replace(/[.،:]+$/, '');
/** Burned-in captions: one script line at a time, at most two balanced lines, bottom at `bottom`. */
export const Captions: React.FC<{ f: number; caps: Caption[]; bottom: number; size: number }> = ({ f, caps, bottom, size }) => {
  const c = caps.find((x) => f >= sec(x.start) - 2 && f < sec(x.end));
  if (!c) return null;
  const o = Math.min(prog(f, sec(c.start) - 2, 5, ease.out), 1 - prog(f, sec(c.end) - 4, 4, ease.in));
  const width = SAFE.x1 - SAFE.x0;
  return (
    <div style={{ position: 'absolute', left: SAFE.x0, width, top: 0, height: bottom, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div dir="rtl" lang="ar" style={{
        fontFamily: BODY, fontWeight: 700, fontSize: size, lineHeight: 1.45, color: C.paper, textAlign: 'center',
        textWrap: 'balance', opacity: o, padding: '4px 26px 10px', borderRadius: 20, background: 'rgba(14,22,38,0.78)', maxWidth: width,
      } as React.CSSProperties}>{trim(c.text)}</div>
    </div>
  );
};
