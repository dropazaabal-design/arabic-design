import React from 'react';
import { Img } from 'remotion';
import { BODY, COLORS, COVER_RATIO, TINT, TITLE, cover } from './config';

// Pieces shared by the scenes. Board units: the 1080×1350 board every scene is laid out on.

/** A cover of one of the six PDF files, as a card in 2.5D (inside a parent with perspective). */
export type CoverPose = { x: number; y: number; w: number; ry?: number; rz?: number; z?: number; o?: number; lift?: number };
export const Cover3D: React.FC<{ n: number; pose: CoverPose; dim?: number }> = ({ n, pose, dim = 0 }) => {
  const { x, y, w, ry = 0, rz = 0, z = 0, o = 1, lift = 0 } = pose;
  if (o <= 0.002) return null;
  const h = w * COVER_RATIO;
  return (
    <div style={{
      position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: o,
      transform: `translateZ(${z + lift * 60}px) rotateY(${ry}deg) rotateZ(${rz}deg) translateY(${-lift * 14}px)`,
      transformStyle: 'preserve-3d', borderRadius: w * 0.035, overflow: 'hidden',
      boxShadow: `0 ${18 + lift * 18}px ${44 + lift * 30}px rgba(0,0,0,${0.42 + lift * 0.12}), 0 0 0 1.5px ${TINT.line}`,
    }}>
      <Img src={cover(n)} style={{ width: '100%', height: '100%', display: 'block' }} />
      {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: COLORS.navy, opacity: dim }} />}
    </div>
  );
};

/** The 3D stage the covers stand in. */
export const Stage3D: React.FC<{ children: React.ReactNode; origin?: string }> = ({ children, origin = '540px 700px' }) => (
  <div style={{ position: 'absolute', inset: 0, perspective: 1700, perspectiveOrigin: origin, transformStyle: 'preserve-3d' }}>{children}</div>
);

/** Arabic text in a box (board units). */
export const T: React.FC<{ x: number; y: number; w: number; size: number; children: React.ReactNode; color?: string; weight?: number; font?: string; align?: 'center' | 'right' | 'left'; o?: number; lh?: number; dir?: 'rtl' | 'ltr'; style?: React.CSSProperties }> = ({ x, y, w, size, children, color = COLORS.white, weight = 700, font = BODY, align = 'center', o = 1, lh = 1.3, dir = 'rtl', style }) => (
  <div dir={dir} lang={dir === 'rtl' ? 'ar' : 'en'} style={{ position: 'absolute', left: x, top: y, width: w, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: lh, color, textAlign: align, opacity: o, ...style }}>{children}</div>
);

/** A pill label. */
export const Chip: React.FC<{ cx: number; cy: number; children: React.ReactNode; o?: number; s?: number; fill?: string; color?: string; size?: number; border?: string; pad?: number }> = ({ cx, cy, children, o = 1, s = 1, fill = TINT.panel, color = COLORS.white, size = 34, border = TINT.line, pad = 30 }) => (
  <div style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${s})`, opacity: o, whiteSpace: 'nowrap' }}>
    <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: size, lineHeight: 1.2, color, background: fill, border: `2px solid ${border}`, borderRadius: 999, padding: `${size * 0.32}px ${pad}px ${size * 0.4}px` }}>{children}</div>
  </div>
);

/** A document outline with a folded corner (a file, not a book). */
export const FileIcon: React.FC<{ x: number; y: number; w: number; color?: string; fill?: string; sw?: number; o?: number }> = ({ x, y, w, color = COLORS.blue, fill = 'none', sw = 3, o = 1 }) => {
  const h = w * 1.3, c = w * 0.32;
  return (
    <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible', opacity: o }} width={w} height={h}>
      <path d={`M${c} 0 H${w} V${h} H0 V${c} Z`} fill={fill} stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      <path d={`M${c} 0 V${c} H0`} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      {[0.52, 0.66, 0.8].map((k) => <line key={k} x1={w * 0.22} x2={w * 0.78} y1={h * k} y2={h * k} stroke={color} strokeWidth={sw * 0.8} strokeLinecap="round" opacity={0.7} />)}
    </svg>
  );
};

/** The package mark from the covers («ف» in a blue rounded square) with the brand name. */
export const Brand: React.FC<{ cx: number; cy: number; o?: number; s?: number; name: string }> = ({ cx, cy, o = 1, s = 1, name }) => (
  <div dir="rtl" style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${s})`, opacity: o, display: 'flex', alignItems: 'center', gap: 16, whiteSpace: 'nowrap' }}>
    <div style={{ width: 62, height: 62, borderRadius: 16, background: COLORS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: TITLE, fontWeight: 800, fontSize: 40, color: COLORS.white, paddingBottom: 6, boxSizing: 'border-box' }}>ف</div>
    <div lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: 40, color: COLORS.white }}>{name}</div>
  </div>
);

// ——— the stickman (no face, no features) ———
const rad = (d: number) => (d * Math.PI) / 180;
/** End of a limb of length `len` from (x, y), at `a` degrees from straight down (positive toward +x). */
const limb = (x: number, y: number, a: number, len: number): [number, number] => [x + Math.sin(rad(a)) * len, y + Math.cos(rad(a)) * len];
export type StickPose = { lean: number; head: number; armR: [number, number]; armL: [number, number]; legR: [number, number]; legL: [number, number] };
/** A line figure standing at (x, foot) facing +x, 300 units tall. Angles: [upper, lower] in degrees from down. */
export const Stickman: React.FC<{ x: number; foot: number; pose: StickPose; o?: number; color?: string }> = ({ x, foot, pose, o = 1, color = COLORS.white }) => {
  const hip: [number, number] = [x, foot - 136];
  const neck = limb(hip[0], hip[1], 180 + pose.lean, 112);
  const head = limb(neck[0], neck[1], 180 + pose.lean + pose.head, 40);
  const sh: [number, number] = limb(hip[0], hip[1], 180 + pose.lean, 100);
  const arm = (a: [number, number]) => { const e = limb(sh[0], sh[1], a[0], 62); return [e, limb(e[0], e[1], a[1], 58)] as const; };
  const leg = (a: [number, number]) => { const k = limb(hip[0], hip[1], a[0], 70); return [k, limb(k[0], k[1], a[1], 68)] as const; };
  const [eR, hR] = arm(pose.armR), [eL, hL] = arm(pose.armL), [kR, fR] = leg(pose.legR), [kL, fL] = leg(pose.legL);
  const pl = (...pts: (readonly [number, number])[]) => pts.map((q) => q.join(' ')).join(' L');
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: o }} width={1} height={1}>
      <g fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${pl(fL, kL, hip)}`} opacity={0.7} />
        <path d={`M${pl(hL, eL, sh)}`} opacity={0.7} />
        <path d={`M${pl(hip, neck)}`} />
        <path d={`M${pl(fR, kR, hip)}`} />
        <path d={`M${pl(hR, eR, sh)}`} />
        <circle cx={head[0]} cy={head[1]} r={34} fill={COLORS.navy} />
      </g>
    </svg>
  );
};
