import React from 'react';
import { INK, Phone, clamp01 } from './kit';
import { B, NAIF } from './look';

// Full-frame inserts: the phone in his hands (big type, so the joke can be read on a phone), framed in the 4:5 band.

const Thumb: React.FC<{ x: number; y: number; rot: number; down?: number }> = ({ x, y, rot, down = 0 }) => (
  <g transform={`translate(${x} ${y + down * 14}) rotate(${rot})`}>
    <path d="M-40 140 Q-46 40 -18 -10 Q0 -40 22 -18 Q40 4 34 60 Q30 110 40 150 Z" fill={NAIF.skin} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-6 -16 Q12 -28 24 -12 Q14 -2 -2 -4 Z" fill="#FFFFFF" opacity={0.7} />
  </g>
);

export const PHONE_W = 540, PHONE_Y = 872;
/** Screen box of the phone insert (for the caption guard). */
export const PHONE_BOX = { x0: 270, y0: 300, x1: 810, y1: 1445, what: 'phone' };

/** The phone held close: w 470 at the frame's centre, his thumbs at the sides (tapping when `tapL`/`tapR` > 0). */
export const PhoneInsert: React.FC<{ screen: React.ReactNode; tapL?: number; tapR?: number; buzz?: number; t?: number; bg?: string }> = ({ screen, tapL = 0, tapR = 0, buzz = 0, t = 0, bg = B.navy2 }) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
    <rect width={1080} height={1920} fill={bg} />
    <circle cx={540} cy={872} r={640} fill={B.navy3} opacity={0.6} />
    <circle cx={540} cy={872} r={440} fill={B.blue} opacity={0.12} />
    <g transform={`translate(540 ${PHONE_Y})`}><Phone w={PHONE_W} screen={screen} buzz={buzz} t={t} /></g>
    <Thumb x={270} y={1250} rot={18} down={tapR} />
    <Thumb x={810} y={1250} rot={-18} down={tapL} />
  </svg>
);

/** A circular wipe: `inside` shows through a circle of radius r at (cx, cy) in frame coordinates. */
export const Iris: React.FC<{ cx: number; cy: number; r: number; id: string; children: React.ReactNode; ring?: boolean }> = ({ cx, cy, r, id, children, ring = true }) => (
  <>
    <svg width={0} height={0} style={{ position: 'absolute' }}>
      <defs><clipPath id={id}><circle cx={cx} cy={cy} r={Math.max(0.1, r)} /></clipPath></defs>
    </svg>
    <div style={{ position: 'absolute', inset: 0, clipPath: `url(#${id})` }}>{children}</div>
    {ring && r > 1 && r < 2400 && (
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={B.navy} strokeWidth={clamp01(1 - r / 2200) * 18 + 4} />
      </svg>
    )}
  </>
);

/** The monitor «الواقع» full frame: the office wall around it, its 340×250 content scaled up (inside the 4:5 band). */
export const MONITOR_BOX = { x0: 60, y0: 470, x1: 1020, y1: 1176, what: 'monitor' };
export const MonitorInsert: React.FC<{ children: React.ReactNode; pulse?: number }> = ({ children, pulse = 0 }) => {
  const W = 940, H = (W * 250) / 340, x = 70, y = 470;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
      <rect width={1080} height={1920} fill={B.mist} />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 140 - 20} 0 V1920`} stroke={B.blueLight} strokeWidth={8} />)}
      <rect y={1300} width={1080} height={620} fill={B.navy2} />
      <path d={`M540 0 V${y - 30}`} stroke={INK} strokeWidth={10} />
      <rect x={x - 30} y={y - 30} width={W + 60} height={H + 60} rx={36} fill={B.navy} stroke={INK} strokeWidth={8} />
      <svg x={x} y={y} width={W} height={H} viewBox="0 0 340 250">{children}</svg>
      <rect x={x} y={y} width={W} height={H} fill="none" stroke={INK} strokeWidth={5} />
      <rect x={x + 24} y={y + 24} width={230} height={86} rx={22} fill={B.red} opacity={0.92 + pulse * 0.08} />
      <text x={x + 139} y={y + 84} textAnchor="middle" fontFamily="Tajawal, sans-serif" fontWeight={800} fontSize={54} fill={B.white} style={{ direction: 'rtl' }}>الواقع</text>
    </svg>
  );
};
