import React from 'react';
import { ease, tween } from './clock';

// Screen-space Arabic titles for any reel (HTML, so text stays sharp and shapes correctly): a pill that pops in
// with a GSAP back ease and fades out, and the closing card (like / follow icons + the brand). Pure functions of t
// (seconds), so they render the same at 30 and 60 fps and in any frame order. RTL is set on every text node.

export type PillProps = {
  t: number; from: number; to: number; text: React.ReactNode;
  top: number; left?: number; width?: number; size?: number; weight?: number;
  bg?: string; color?: string; font?: string; pad?: string; radius?: number; align?: 'center' | 'right' | 'left';
};

/** A pill of Arabic text visible from `from` to `to` (seconds): pops in (0.35 s, back.out) and fades out (0.25 s). */
export const Pill: React.FC<PillProps> = ({ t, from, to, text, top, left = 72, width = 828, size = 72, weight = 900, bg = 'rgba(20,16,36,0.86)', color = '#FFFFFF', font = 'Cairo, sans-serif', pad = '10px 36px 22px', radius = 36, align = 'center' }) => {
  if (t < from || t > to + 0.3) return null;
  const pop = tween(t, from, from + 0.35, 0.6, 1, 'back.out(2.2)');
  const op = Math.min(tween(t, from, from + 0.15, 0, 1, 'none'), tween(t, to, to + 0.25, 1, 0, 'none'));
  return (
    <div style={{ position: 'absolute', top, left, width, textAlign: align, opacity: op }}>
      <div style={{ display: 'inline-block', whiteSpace: 'nowrap', transform: `scale(${pop})`, transformOrigin: '50% 50%', direction: 'rtl', fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.35, color, background: bg, padding: pad, borderRadius: radius }}>
        {text}
      </div>
    </div>
  );
};

const Heart: React.FC<{ fill: string }> = ({ fill }) => (
  <svg width={64} height={60} viewBox="0 0 64 60"><path d="M32 56 C10 40 2 30 2 18 C2 8 10 2 18 2 C25 2 29 6 32 11 C35 6 39 2 46 2 C54 2 62 8 62 18 C62 30 54 40 32 56Z" fill={fill} /></svg>
);
const Plus: React.FC<{ fill: string }> = ({ fill }) => (
  <svg width={60} height={60} viewBox="0 0 60 60"><circle cx={30} cy={30} r={28} fill={fill} /><path d="M30 16 V44 M16 30 H44" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" /></svg>
);

/** Closing card: «إعجاب» and «متابعة» chips that pop in one after the other, and the brand wordmark under them. */
export const EndCard: React.FC<{ t: number; from: number; brand?: string; accent: string; top?: number; font?: string; ink?: string; chipBg?: string; brandColor?: string }> = ({ t, from, brand = 'كتاب وبس', accent, top = 1330, font = 'Cairo, sans-serif', ink = '#FFFFFF', chipBg = 'rgba(20,16,36,0.82)', brandColor }) => {
  if (t < from) return null;
  const chip = (k: number) => ({ transform: `scale(${tween(t, from + k * 0.25, from + k * 0.25 + 0.4, 0, 1, 'back.out(2.4)')})`, display: 'inline-flex', alignItems: 'center', gap: 14, margin: '0 12px', padding: '10px 26px 14px', borderRadius: 40, background: chipBg, color: ink, fontFamily: font, fontWeight: 800, fontSize: 44, direction: 'rtl' as const });
  const beat = 1 + 0.12 * Math.max(0, Math.sin(Math.max(0, t - from - 0.8) * Math.PI * 1.6)) * (t > from + 0.8 ? 1 : 0);
  return (
    <div style={{ position: 'absolute', top, left: 72, width: 828, textAlign: 'center' }}>
      <div style={{ direction: 'rtl' }}>
        <span style={chip(0)}><span style={{ transform: `scale(${beat})`, display: 'inline-flex' }}><Heart fill={accent} /></span>إعجاب</span>
        <span style={chip(1)}><Plus fill={accent} />متابعة</span>
      </div>
      <div style={{ marginTop: 26, direction: 'rtl', fontFamily: font, fontWeight: 900, fontSize: 50, color: brandColor ?? ink, opacity: tween(t, from + 0.5, from + 0.9, 0, 0.92, 'none'), letterSpacing: 0 }}>{brand}</div>
    </div>
  );
};

/** Ease helper re-exported for scene code that animates inline styles. */
export const eased = (name: string, p: number) => ease(name)(Math.max(0, Math.min(1, p)));
