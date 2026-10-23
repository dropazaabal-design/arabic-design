import React from 'react';
import { Easing, interpolate, staticFile } from 'remotion';
import { BODY, TITLE } from '../../../films/hudoo/src/fonts';
import { Hand } from '../../../films/hudoo/src/kit/characters/hands';

// The ad's look: the navy, blue and white of the product, green for "done" and "next", red only for "urgent".
// No yellow, orange or gold anywhere in the ad's own graphics (the product pages are shown exactly as they are).
export const C = {
  navy: '#0B1D4D', navy2: '#13307A', blue: '#2456D6', blueSoft: '#DCE6FA', sky: '#F1F5FC', grid: '#D7E1F3',
  ink: '#0E1A36', grey: '#5E6B86', white: '#FFFFFF', green: '#15996A', greenSoft: '#D5F0E4', red: '#D2434F', redSoft: '#F8DADD',
  desk: '#E4E9F2', deskEdge: '#C9D2E1', note: '#FFFFFF', noteEdge: '#B8C6E0',
};
export { BODY, TITLE };

export const ease = { inOut: Easing.bezier(0.65, 0, 0.35, 1), out: Easing.bezier(0.22, 1, 0.36, 1), back: Easing.bezier(0.34, 1.5, 0.64, 1) };
/** 0..1 between frames a and a+len. */
export const p = (f: number, a: number, len = 18, e = ease.inOut) => interpolate(f, [a, a + Math.max(1, len)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Page images rendered from the product PDF (public/pages/pNN.png, 1818×2573; drawn in 827-wide page units). */
export const PAGE_W = 827, PAGE_H = 1170;
export const page = (n: number) => staticFile(`pages/p${String(n).padStart(2, '0')}.png`);
export const thumb = (n: number) => staticFile(`thumbs/t-${String(n).padStart(2, '0')}.png`);

/** A real product page at (x, y), `w` wide, with a soft paper shadow. */
export const Page: React.FC<{ n: number; x: number; y: number; w: number; rot?: number; o?: number; shadow?: boolean }> = ({ n, x, y, w, rot = 0, o = 1, shadow = true }) => {
  const h = (w * PAGE_H) / PAGE_W;
  return (
    <g opacity={o} transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
      {shadow && <rect x={x + 6} y={y + 12} width={w} height={h} rx={10} fill={C.navy} opacity={0.16} />}
      <rect x={x} y={y} width={w} height={h} rx={10} fill={C.white} />
      <image href={page(n)} x={x} y={y} width={w} height={h} />
      <rect x={x} y={y} width={w} height={h} rx={10} fill="none" stroke={C.grid} strokeWidth={2} />
    </g>
  );
};

/** A phone (stage units). Children are drawn in screen coordinates (0..sw, 0..sh) and clipped to the screen. */
export const phoneDims = (w: number) => {
  const h = w * 2.06, inset = w * 0.035;
  return { h, inset, sw: w - 2 * inset, sh: h - 2 * inset };
};
export const Phone: React.FC<{ cx: number; cy: number; w: number; children?: React.ReactNode; rot?: number; screenBg?: string; o?: number }> = ({ cx, cy, w, children, rot = 0, screenBg = C.white, o = 1 }) => {
  const { h, inset, sw, sh } = phoneDims(w);
  const x = cx - w / 2, y = cy - h / 2;
  const clip = 'scr' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <g opacity={o} transform={`rotate(${rot} ${cx} ${cy})`}>
      <rect x={x + 10} y={y + 22} width={w} height={h} rx={w * 0.16} fill={C.navy} opacity={0.18} />
      <rect x={x} y={y} width={w} height={h} rx={w * 0.16} fill="#172240" />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} rx={w * 0.155} fill="none" stroke="#3B4A72" strokeWidth={3} />
      <svg x={x + inset} y={y + inset} width={sw} height={sh} viewBox={`0 0 ${sw} ${sh}`}>
        <clipPath id={clip}><rect width={sw} height={sh} rx={w * 0.13} /></clipPath>
        <g clipPath={`url(#${clip})`}>
          <rect width={sw} height={sh} fill={screenBg} />
          {children}
        </g>
      </svg>
      <rect x={cx - w * 0.14} y={y + inset + 14} width={w * 0.28} height={w * 0.06} rx={w * 0.03} fill="#0A1024" />
    </g>
  );
};

/** HTML text block in stage coordinates (right-to-left Arabic). */
export const Txt: React.FC<{ x: number; y: number; w: number; size: number; color?: string; weight?: number; font?: string; align?: 'center' | 'right' | 'left'; o?: number; children: React.ReactNode; lh?: number; style?: React.CSSProperties }> = ({ x, y, w, size, color = C.ink, weight = 800, font = TITLE, align = 'center', o = 1, children, lh = 1.3, style }) => (
  o <= 0.001 ? null : <div dir="rtl" lang="ar" style={{ position: 'absolute', left: x, top: y, width: w, textAlign: align, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: lh, color, opacity: Math.min(1, o), ...style }}>{children}</div>
);

/** A label chip (HTML), centred at (x, y); scales in with o. */
export const Chip: React.FC<{ x: number; y: number; o: number; children: React.ReactNode; bg?: string; color?: string; size?: number; border?: string }> = ({ x, y, o, children, bg = C.navy, color = C.white, size = 46, border }) => (
  o <= 0.001 ? null : (
    <div dir="rtl" lang="ar" style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${mix(0.85, 1, Math.min(1, o))})`, opacity: Math.min(1, o), whiteSpace: 'nowrap', fontFamily: TITLE, fontWeight: 800, fontSize: size, color, background: bg, border, borderRadius: 999, padding: `${size * 0.12}px ${size * 0.6}px ${size * 0.24}px`, boxShadow: '0 6px 18px rgba(11,29,77,0.16)' }}>{children}</div>
  )
);

/** Arabic text inside an SVG (phone screens, sticky notes): a foreignObject with an RTL div. */
export const SvgTxt: React.FC<{ x: number; y: number; w: number; h: number; size: number; color?: string; weight?: number; font?: string; align?: 'center' | 'right'; children: React.ReactNode }> = ({ x, y, w, h, size, color = C.ink, weight = 700, font = BODY, align = 'center', children }) => (
  <foreignObject x={x} y={y} width={w} height={h}>
    <div dir="rtl" lang="ar" style={{ width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start', textAlign: align, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.25, color }}>{children}</div>
  </foreignObject>
);

/** A sticky note with a task written on it, centred at (x, y). */
export const Note: React.FC<{ x: number; y: number; text: string; w?: number; h?: number; rot?: number; o?: number; s?: number; tint?: string; ring?: number }> = ({ x, y, text, w = 250, h = 104, rot = 0, o = 1, s = 1, tint = C.note, ring = 0 }) => (
  o <= 0.001 ? null : (
    <g opacity={Math.min(1, o)} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2 + 4} y={-h / 2 + 8} width={w} height={h} rx={10} fill={C.navy} opacity={0.14} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={tint} stroke={C.noteEdge} strokeWidth={2.5} />
      <rect x={-w / 2} y={-h / 2} width={w} height={14} rx={7} fill={C.blue} opacity={0.85} />
      <SvgTxt x={-w / 2 + 10} y={-h / 2 + 14} w={w - 20} h={h - 18} size={h * 0.3} weight={700}>{text}</SvgTxt>
      {ring > 0 && <path d={`M${-w * 0.62} 0 C${-w * 0.62} ${-h * 1.05}, ${w * 0.62} ${-h * 1.05}, ${w * 0.62} ${-h * 0.05} S${-w * 0.5} ${h * 1.05}, ${-w * 0.6} ${h * 0.1}`} fill="none" stroke={C.green} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={`${ring} 1`} />}
    </g>
  )
);

/** The rig's own hand holding a pen, big, entering from a sleeve (green, like the film's hero). */
export const PenHand: React.FC<{ x: number; y: number; s?: number; rot?: number; o?: number }> = ({ x, y, s = 7, rot = -135, o = 1 }) => (
  <g opacity={o}>
    <path d={`M${x} ${y} L${x + 520} ${y + 520}`} stroke="#2A2F3A" strokeWidth={s * 13 + 10} strokeLinecap="round" />
    <path d={`M${x} ${y} L${x + 520} ${y + 520}`} stroke="#3E8E7E" strokeWidth={s * 13} strokeLinecap="round" />
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s} ${-s})`}>
      <Hand g="pen" skin="#F4E6E1" layer="back" />
      <g transform="translate(12 0)">
        <rect x={-30} y={-3} width={44} height={6} rx={3} fill={C.blue} stroke="#2A2F3A" strokeWidth={1.4} />
        <path d="M14 -3 L22 0 L14 3 Z" fill="#2A2F3A" />
      </g>
      <Hand g="pen" skin="#F4E6E1" layer="front" />
    </g>
  </g>
);

/** The ad's background: light blue paper with the faint grid of the product's cover. Covers the full canvas height. */
export const Backdrop: React.FC<{ h: number; dark?: number }> = ({ h, dark = 0 }) => (
  <svg width={1080} height={h} style={{ position: 'absolute', inset: 0 }}>
    <defs>
      <linearGradient id="bd-dark" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stopColor={C.navy} /><stop offset="1" stopColor={C.navy2} /></linearGradient>
      <pattern id="bd-grid" width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0 H0 V54" fill="none" stroke={C.grid} strokeWidth={1.5} /></pattern>
      <pattern id="bd-grid-d" width="54" height="54" patternUnits="userSpaceOnUse"><path d="M54 0 H0 V54" fill="none" stroke="#24418C" strokeWidth={1.5} /></pattern>
    </defs>
    <rect width={1080} height={h} fill={C.sky} />
    <rect width={1080} height={h} fill="url(#bd-grid)" opacity={0.7} />
    {dark > 0 && <g opacity={dark}><rect width={1080} height={h} fill="url(#bd-dark)" /><rect width={1080} height={h} fill="url(#bd-grid-d)" opacity={0.6} /></g>}
  </svg>
);
