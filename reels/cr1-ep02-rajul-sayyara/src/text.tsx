import React from 'react';
import { BODY, TITLE } from './fonts';
import { C, Profile } from './theme';
import { Caption, ease, mix, prog, sec } from './time';

// Arabic is laid out by the browser, right to left, letters joined. Motion moves whole lines or
// whole words after shaping; letters are never split.

/** A short line of on-screen text that rises in as one unit. */
export const Title: React.FC<{ text: React.ReactNode; o: number; size: number; color?: string; style?: React.CSSProperties }> = ({ text, o, size, color = C.light, style }) => (
  <div dir="rtl" lang="ar" style={{
    fontFamily: TITLE, fontWeight: 800, fontSize: size, lineHeight: 1.3, color, textAlign: 'center',
    opacity: o, transform: `translateY(${mix(18, 0, o)}px)`, textWrap: 'balance', ...style,
  } as React.CSSProperties}>{text}</div>
);

/** A short label that pops in as a unit. */
export const Pill: React.FC<{ text: string; o: number; color: string; size: number; solid?: boolean; style?: React.CSSProperties }> = ({ text, o, color, size, solid = false, style }) => (
  <div dir="rtl" lang="ar" style={{
    fontFamily: BODY, fontWeight: 700, fontSize: size, lineHeight: 1.4, whiteSpace: 'nowrap',
    color: solid ? C.light : color, background: solid ? color : 'rgba(14,22,38,0.9)', border: `3px solid ${color}`,
    padding: '0.08em 0.7em 0.16em', borderRadius: 999, opacity: o, transform: `scale(${mix(0.88, 1, o)})`, ...style,
  }}>{text}</div>
);

/** Our own Arabic book card (no cover image). */
export const BookCard: React.FC<{ o: number; size: number; style?: React.CSSProperties }> = ({ o, size, style }) => (
  <div dir="rtl" lang="ar" style={{
    background: C.light, color: C.night, borderRadius: size * 0.35, padding: `${size * 0.4}px ${size * 0.8}px ${size * 0.5}px`,
    borderInlineStart: `${size * 0.22}px solid ${C.teal}`, opacity: o, transform: `translateY(${mix(24, 0, o)}px) scale(${mix(0.94, 1, o)})`,
    boxShadow: '0 18px 40px rgba(0,0,0,0.35)', textAlign: 'right', width: 'max-content', ...style,
  }}>
    <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: size * 0.56, color: C.tealDeep, lineHeight: 1.3 }}>فكرة من كتاب</div>
    <div style={{ fontFamily: TITLE, fontWeight: 800, fontSize: size, lineHeight: 1.3, whiteSpace: 'nowrap' }}>«سيكولوجية المال»</div>
    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: size * 0.62, lineHeight: 1.35, color: C.night }}>مورجان هاوسل</div>
  </div>
);

/** Series signature, shown while the scene keeps going (never a separate intro). */
export const Signature: React.FC<{ o: number; size: number; style?: React.CSSProperties }> = ({ o, size, style }) => (
  <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: size, color: C.mist, opacity: o, whiteSpace: 'nowrap', ...style }}>
    فكرة من كتاب <span style={{ color: C.teal }}>·</span> كتاب وبس
  </div>
);

/** «قصة توضيحية» tag for our own example story, «من الكتاب» for the book's (CR1: sources are labelled). */
export const StoryTag: React.FC<{ o: number; size: number; style?: React.CSSProperties; text?: string }> = ({ o, size, style, text = 'قصة توضيحية' }) => (
  <div dir="rtl" lang="ar" style={{
    fontFamily: BODY, fontWeight: 700, fontSize: size, color: C.light, opacity: o, whiteSpace: 'nowrap',
    background: 'rgba(14,22,38,0.78)', border: `2px solid ${C.mist}`, borderRadius: 10, padding: '0.05em 0.55em 0.12em', ...style,
  }}>{text}</div>
);

const trim = (t: string) => t.replace(/[.،:]+$/, '');
/** Burned-in captions for the social versions: one chunk at a time, at most two balanced lines. */
export const Captions: React.FC<{ f: number; caps: Caption[]; p: Profile; bottom: number }> = ({ f, caps, p, bottom }) => {
  const c = caps.find((x) => f >= sec(x.start) - 2 && f < sec(x.end));
  if (!c) return null;
  const o = Math.min(prog(f, sec(c.start) - 2, 5, ease.out), 1 - prog(f, sec(c.end) - 4, 4, ease.in));
  const width = p.safe.x1 - p.safe.x0;
  return (
    <div style={{ position: 'absolute', left: p.safe.x0, width, top: 0, height: bottom, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div dir="rtl" lang="ar" style={{
        fontFamily: BODY, fontWeight: 700, fontSize: p.caption, lineHeight: 1.45, color: C.light, textAlign: 'center',
        textWrap: 'balance', opacity: o, padding: '4px 26px 10px', borderRadius: 20, background: 'rgba(11,18,32,0.74)', maxWidth: width,
      } as React.CSSProperties}>{trim(c.text)}</div>
    </div>
  );
};

/** Review overlay: the profile's safe area. */
export const Guides: React.FC<{ p: Profile }> = ({ p }) => (
  <div style={{ position: 'absolute', left: p.safe.x0, top: p.safe.y0, width: p.safe.x1 - p.safe.x0, height: p.safe.y1 - p.safe.y0, outline: `3px dashed ${C.red}`, pointerEvents: 'none' }} />
);
