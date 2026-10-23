import React from 'react';
import { BODY } from '../../fonts';
import { INK, PAL } from '../style';

// Shared bits for the props: RTL Arabic text boxes, the phone-UI themes, small path helpers.

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** A rounded-rectangle path (x,y = top-left). */
export const rrect = (x: number, y: number, w: number, h: number, r: number) => {
  const k = Math.min(r, w / 2, h / 2);
  return `M${x + k} ${y} H${x + w - k} Q${x + w} ${y} ${x + w} ${y + k} V${y + h - k} Q${x + w} ${y + h} ${x + w - k} ${y + h} H${x + k} Q${x} ${y + h} ${x} ${y + h - k} V${y + k} Q${x} ${y} ${x + k} ${y} Z`;
};

/** Points of a rounded rectangle (for sketch(): a hand-drawn rounded box). */
export const rrectPts = (x: number, y: number, w: number, h: number, r: number): [number, number][] => {
  const k = Math.min(r, w / 2, h / 2), out: [number, number][] = [];
  const corners: [number, number, number][] = [[x + w - k, y + k, -90], [x + w - k, y + h - k, 0], [x + k, y + h - k, 90], [x + k, y + k, 180]];
  for (const [cx, cy, a0] of corners) for (let i = 0; i <= 3; i++) {
    const a = ((a0 + i * 30) * Math.PI) / 180;
    out.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k]);
  }
  return out;
};

type ArProps = {
  x?: number; y?: number; w: number; h: number; size: number; color?: string; weight?: number; font?: string;
  align?: 'right' | 'center' | 'left'; v?: 'top' | 'center' | 'bottom'; lh?: number; children: React.ReactNode; style?: React.CSSProperties;
};
/** Arabic text in a foreignObject box (x,y = top-left, w×h), right-to-left, wrapping inside the box. */
export const Ar = ({ x = 0, y = 0, w, h, size, color = INK, weight = 700, font = BODY, align = 'center', v = 'center', lh = 1.5, children, style }: ArProps) => (
  <foreignObject x={x} y={y} width={w} height={h}>
    <div dir="rtl" lang="ar" style={{ width: w, height: h, display: 'flex', flexDirection: 'column', justifyContent: v === 'top' ? 'flex-start' : v === 'bottom' ? 'flex-end' : 'center', textAlign: align, fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight: lh, ...style }}>{children}</div>
  </foreignObject>
);

/** Phone-UI themes (shared by the chat, post and lock screens). */
export const UI = {
  day: { bg: '#E6EBEE', bar: '#F8F9FA', text: INK, soft: '#6B7482', mine: '#CBE6DD', theirs: '#FFFFFF', field: '#FFFFFF', line: '#D3D9DF', edge: INK, accent: PAL.calm, tick: PAL.focus },
  night: { bg: '#151B26', bar: '#202838', text: '#E8EDF2', soft: '#97A1B0', mine: '#2D5952', theirs: '#283143', field: '#283143', line: '#323B4C', edge: '#0E121A', accent: '#5FB3A1', tick: '#7FB3E6' },
} as const;
export type Theme = keyof typeof UI;

const AVATAR = [PAL.provoke, PAL.focus, PAL.plum, PAL.calm, '#5C7389'];
/** A round avatar with the name's first letter (HTML, for the screens). */
export const Avatar = ({ name, size }: { name: string; size: number }) => {
  const first = Array.from(name)[0] ?? '';
  const bg = AVATAR[(first.codePointAt(0) ?? 0) % AVATAR.length];
  return <div style={{ width: size, height: size, flex: 'none', borderRadius: '50%', background: bg, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BODY, fontWeight: 700, fontSize: size * 0.5, lineHeight: 1, border: `2px solid ${INK}`, boxSizing: 'border-box' }}>{first}</div>;
};

/** The status bar (HTML row, RTL: clock on the right, battery and signal on the left). */
export const StatusBar = ({ time, color }: { time: string; color: string }) => (
  <div style={{ height: 30, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', fontFamily: BODY, fontWeight: 700, fontSize: 15, color }}>
    <span dir="ltr">{time}</span>
    <svg width={56} height={14} viewBox="0 0 56 14">
      <rect x={30} y={1.5} width={22} height={11} rx={3} fill="none" stroke={color} strokeWidth={1.6} />
      <rect x={52.6} y={5} width={2} height={4} rx={1} fill={color} />
      <rect x={32.5} y={4} width={13} height={6} rx={1.4} fill={color} />
      {[0, 1, 2, 3].map((k) => <rect key={k} x={k * 5} y={10 - k * 3} width={3.2} height={3 + k * 3} rx={1} fill={color} />)}
    </svg>
  </div>
);
