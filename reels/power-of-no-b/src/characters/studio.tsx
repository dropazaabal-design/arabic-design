import React from 'react';
import { INK, LINE, PAL, bowLine, clamp, rand, stroke, wobEllipse, wobRect } from '@mukarram/characters/ink';
import { TITLE_FONT } from '../video/fonts';

// The photo studio: one exit door with its sign, a digital clock and the handover list beside it, a wheeled
// photo desk, two softboxes, a camera on a tripod and a blue paper backdrop; and the three things that pile up
// on the worker — a cup with a red lid, an equipment bag, a decor plant. Dark graphic world, Baseera blue/red,
// a touch of green only on the plant. All drawn in the shared ink language of reels/mukarram.

export const C = {
  wall: '#1D2737',
  wallLow: '#172030',
  rail: '#2B3A52',
  floor: '#121925',
  floorLine: '#0C121B',
  frame: '#0E141D',
  door: '#2A5C93',
  doorDeep: '#214B79',
  outside: '#16365C',
  cup: '#E9EEF5',
  bag: PAL.navy,
  desk: '#33435C',
  deskTop: '#3F5372',
  soft: '#E6ECF4',
  steel: '#5C6B82',
  glow: '#CFE0F2',
};
export const AR = { fontFamily: TITLE_FONT, fontWeight: 900, direction: 'rtl' as const };

type At = { x: number; y: number; s?: number; rot?: number; o?: number };
const T = (a: At) => `translate(${a.x} ${a.y}) rotate(${a.rot ?? 0}) scale(${a.s ?? 1})`;

/* ------------------------------ the exit ------------------------------ */

export const DOOR = { w: 280, h: 640 };

/** The exit door, origin = bottom centre. `open` 0..1 swings the leaf on its left hinge (the gap shows the
 *  evening outside); `shrink` pulls the whole doorway away (the imagination). */
export const Door: React.FC<At & { open: number; shrink?: number }> = ({ open, shrink = 0, ...a }) => {
  const { w, h } = DOOR;
  const leafW = w * Math.cos(clamp(open) * 1.25);
  return (
    <g transform={T(a)} opacity={a.o ?? 1}>
      <g transform={`translate(0 ${-h * 0.5 * shrink}) scale(${1 - 0.55 * shrink})`}>
        <path d={wobRect(-w / 2 - 26, -h - 26, w + 52, h + 26, 6, 801, 2)} fill={C.frame} {...stroke()} />
        {/* the outside, seen through the gap */}
        <rect x={-w / 2} y={-h} width={w} height={h} fill={C.outside} />
        {[[-60, -520], [40, -470], [90, -560], [-20, -600]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill={C.glow} opacity={0.8} />)}
        <path d={`M${-w / 2} -40 L${w / 2} -60 L${w / 2} 0 L${-w / 2} 0Z`} fill="#0F2742" />
        {/* the leaf */}
        <path d={`M${-w / 2} ${-h} L${-w / 2 + leafW} ${-h + (w - leafW) * 0.12} L${-w / 2 + leafW} ${-(w - leafW) * 0.12} L${-w / 2} 0Z`} fill={C.door} {...stroke()} />
        <path d={`M${-w / 2 + leafW * 0.18} ${-h * 0.86} L${-w / 2 + leafW * 0.82} ${-h * 0.86} L${-w / 2 + leafW * 0.82} ${-h * 0.56} L${-w / 2 + leafW * 0.18} ${-h * 0.56}Z`} fill={C.outside} {...stroke(LINE * 0.7)} opacity={0.9} />
        <path d={`M${-w / 2 + leafW * 0.1} ${-h * 0.4} L${-w / 2 + leafW * 0.9} ${-h * 0.4}`} {...stroke(LINE * 0.6, C.doorDeep)} />
        {/* handle on the free edge */}
        <path d={`M${-w / 2 + leafW - 30} ${-h * 0.47} l-34 0`} {...stroke(LINE * 1.6, C.steel)} />
        <circle cx={-w / 2 + leafW - 28} cy={-h * 0.47} r={10} fill={C.steel} {...stroke(LINE * 0.6)} />
      </g>
    </g>
  );
};

/** «خروج» over the door, lit red. */
export const ExitSign: React.FC<At & { lit?: number }> = ({ lit = 1, ...a }) => (
  <g transform={T(a)}>
    <path d={wobRect(-120, -46, 240, 92, 14, 811, 1.5)} fill={lit > 0.5 ? PAL.red : '#5A2228'} {...stroke()} />
    <text x={0} y={18} textAnchor="middle" {...AR} fontSize={56} fill={PAL.white} opacity={0.4 + 0.6 * lit}>خروج</text>
    <path d="M-104 -24 l-10 24 l10 24" fill="none" {...stroke(LINE * 0.6, PAL.white)} opacity={0.4 + 0.6 * lit} />
  </g>
);

/** Digital wall clock with Western digits («5:04»); `flip` 0..1 drops the new minute in. */
export const DigitalClock: React.FC<At & { text: string; flip?: number }> = ({ text, flip = 1, ...a }) => (
  <g transform={T(a)}>
    <path d={wobRect(-130, -62, 260, 124, 18, 821, 1.5)} fill={INK} {...stroke(LINE * 1.1)} />
    <rect x={-112} y={-46} width={224} height={92} rx={10} fill="#2A0F14" />
    <g transform={`translate(0 ${(1 - flip) * -16})`} opacity={0.3 + 0.7 * flip}>
      <text x={0} y={30} textAnchor="middle" fontFamily={TITLE_FONT} fontWeight={900} fontSize={84} fill={PAL.red} direction="ltr">{text}</text>
    </g>
  </g>
);

/** The handover list on a clipboard: «التسليم» and three pictured lines (cup, bag, plant). */
export const Clipboard: React.FC<At & { check?: number }> = ({ check = 0, ...a }) => (
  <g transform={T(a)}>
    <path d={wobRect(-92, -120, 184, 250, 12, 831, 1.5)} fill={C.desk} {...stroke()} />
    <path d={wobRect(-76, -96, 152, 212, 6, 832, 1.2)} fill={C.soft} {...stroke(LINE * 0.6)} />
    <path d={wobRect(-34, -134, 68, 34, 8, 833, 1)} fill={C.steel} {...stroke(LINE * 0.7)} />
    <text x={0} y={-58} textAnchor="middle" {...AR} fontSize={34} fill={INK}>التسليم</text>
    {[0, 1, 2].map((i) => {
      const y = -20 + i * 46;
      return (
        <g key={i}>
          <rect x={34} y={y - 14} width={26} height={26} rx={4} fill="none" {...stroke(LINE * 0.5)} />
          {check > i && <path d={`M38 ${y} l7 8 l12 -16`} fill="none" {...stroke(LINE * 0.6, PAL.blue)} />}
          {i === 0 && <path d={`M-10 ${y - 12} L10 ${y - 12} L7 ${y + 12} L-7 ${y + 12}Z`} fill={C.cup} {...stroke(LINE * 0.4)} />}
          {i === 1 && <path d={wobRect(-14, y - 10, 28, 22, 4, 834, 1)} fill={C.bag} {...stroke(LINE * 0.4)} />}
          {i === 2 && <g><path d={`M-8 ${y + 2} L8 ${y + 2} L6 ${y + 13} L-6 ${y + 13}Z`} fill={PAL.red} {...stroke(LINE * 0.35)} /><path d={`M0 ${y + 2} q-12 -10 -6 -16 M0 ${y + 2} q10 -12 6 -16`} fill="none" {...stroke(LINE * 0.45, PAL.leafDeep)} /></g>}
          <path d={`M-26 ${y} L-62 ${y}`} {...stroke(LINE * 0.5, PAL.stone)} />
        </g>
      );
    })}
  </g>
);

/* ------------------------------ the studio ------------------------------ */

/** A softbox on a stand, origin = floor. `on` 0..1 lights it (and its soft cone). */
export const Softbox: React.FC<At & { on: number; flip?: boolean }> = ({ on, flip = false, ...a }) => (
  <g transform={`${T(a)} scale(${flip ? -1 : 1} 1)`}>
    {on > 0 && <path d="M-40 -760 L-360 -40 L240 -40 L80 -760Z" fill={C.glow} opacity={0.07 * on} />}
    <path d="M0 0 L-70 0 M0 0 L70 0 M0 0 L0 -620" {...stroke(LINE * 1.1, C.steel)} />
    <path d={bowLine(-70, 0, 0, -120, 2)} {...stroke(LINE * 0.9, C.steel)} />
    <path d={bowLine(70, 0, 0, -120, -2)} {...stroke(LINE * 0.9, C.steel)} />
    <g transform="translate(0 -700) rotate(14)">
      <path d="M-110 -90 L110 -90 L60 40 L-60 40Z" fill={INK} {...stroke()} />
      <path d={wobRect(-104, -84, 208, 30, 6, 841, 1)} fill={on > 0.5 ? C.soft : '#3A4458'} {...stroke(LINE * 0.7)} />
    </g>
  </g>
);

/** A camera on a tripod, origin = floor, lens pointing screen-right. */
export const Tripod: React.FC<At> = (a) => (
  <g transform={T(a)}>
    <path d="M0 -480 L-90 0 M0 -480 L90 0 M0 -480 L10 0" {...stroke(LINE * 1.1, C.steel)} />
    <path d={wobRect(-70, -580, 120, 92, 12, 851, 1.5)} fill={INK} {...stroke()} />
    <path d={wobRect(46, -566, 70, 64, 10, 852, 1.2)} fill="#2B3A52" {...stroke()} />
    <circle cx={116} cy={-534} r={22} fill={PAL.blue} {...stroke(LINE * 0.7)} />
    <rect x={-40} y={-604} width={40} height={22} rx={4} fill={INK} {...stroke(LINE * 0.6)} />
  </g>
);

/** The blue paper backdrop on its roll, origin = floor centre. */
export const Backdrop: React.FC<At & { w: number }> = ({ w, ...a }) => (
  <g transform={T(a)}>
    <path d={`M${-w / 2} -880 L${w / 2} -880 L${w / 2} -60 Q${w / 2} 60 ${w / 2 + 40} 90 L${-w / 2 - 40} 90 Q${-w / 2} 60 ${-w / 2} -60Z`} fill={PAL.blue} {...stroke()} />
    <path d={`M${-w / 2 - 30} -900 L${w / 2 + 30} -900`} {...stroke(LINE * 3.4, INK)} />
    <path d={`M${-w / 2 - 30} -900 L${w / 2 + 30} -900`} {...stroke(LINE * 2, C.steel)} />
    <path d={`M${-w / 2} -880 L${w / 2} -880 L${w / 2} -840 L${-w / 2} -840Z`} fill="#21609F" />
  </g>
);

/** The wheeled photo desk (a product table), origin = floor centre; `roll` turns the casters. */
export const PhotoDesk: React.FC<At & { roll?: number }> = ({ roll = 0, ...a }) => (
  <g transform={T(a)}>
    <path d="M-200 -300 L-180 -40 M200 -300 L180 -40" {...stroke(LINE * 1.6, C.steel)} />
    <path d={wobRect(-230, -330, 460, 46, 10, 861, 1.5)} fill={C.deskTop} {...stroke()} />
    <path d={wobRect(-196, -150, 392, 26, 6, 862, 1)} fill={C.desk} {...stroke(LINE * 0.7)} />
    {[-180, 180].map((x) => (
      <g key={x} transform={`translate(${x} -22)`}>
        <circle r={22} fill={INK} {...stroke(LINE * 0.6)} />
        <path d={`M0 0 L${Math.cos(roll) * 16} ${Math.sin(roll) * 16}`} {...stroke(LINE * 0.6, C.steel)} />
      </g>
    ))}
    {/* the product on the desk: a red vase and a small blue box */}
    <path d="M-60 -330 Q-90 -380 -70 -430 L-40 -430 Q-20 -380 -50 -330Z" fill={PAL.red} {...stroke(LINE * 0.8)} />
    <path d={wobRect(20, -400, 90, 70, 8, 863, 1.2)} fill={PAL.blue} {...stroke(LINE * 0.8)} />
  </g>
);

/* ------------------------------ the load ------------------------------ */

/** The cup (origin = bottom centre, ~110 tall), white with a blue sleeve; `lid` false once it pops off. */
export const Cup: React.FC<At & { lid?: boolean; tremble?: number; steam?: number }> = ({ lid = true, tremble = 0, steam = 0, ...a }) => (
  <g transform={`${T(a)} rotate(${tremble})`}>
    <path d="M-34 -100 L34 -100 L26 0 L-26 0Z" fill={C.cup} {...stroke()} />
    <path d="M-31 -66 L31 -66 L28 -30 L-28 -30Z" fill={PAL.blue} {...stroke(LINE * 0.7)} />
    {lid && <g transform="translate(0 -100)"><path d="M-40 0 Q0 -26 40 0 L40 8 L-40 8Z" fill={PAL.red} {...stroke(LINE * 0.8)} /><path d="M-8 -18 L8 -18 L8 -11 L-8 -11Z" fill={PAL.red} {...stroke(LINE * 0.5)} /></g>}
    {!lid && <path d="M-34 -100 Q0 -88 34 -100" fill="none" {...stroke(LINE * 0.6, '#6B4B3A')} />}
    {steam > 0 && [-12, 10].map((x, i) => <path key={i} d={`M${x} -118 q-10 -20 0 -40 q10 -20 0 -40`} fill="none" {...stroke(LINE * 0.6, C.glow)} opacity={steam * 0.6} />)}
  </g>
);

/** The lid on its own (the same drawing as on the cup), centre at 0,0. */
export const Lid: React.FC<At> = (a) => (
  <g transform={T(a)}>
    <path d="M-40 0 Q0 -26 40 0 L40 8 L-40 8Z" fill={PAL.red} {...stroke(LINE * 0.8)} />
    <path d="M-8 -18 L8 -18 L8 -11 L-8 -11Z" fill={PAL.red} {...stroke(LINE * 0.5)} />
  </g>
);

/** The equipment bag, origin = the top of its handle (where the hand is). Heavy: it hangs and swings. */
export const Bag: React.FC<At & { swing?: number }> = ({ swing = 0, ...a }) => (
  <g transform={`${T(a)} rotate(${swing})`}>
    <path d="M-40 40 Q-40 -8 0 -8 Q40 -8 40 40" fill="none" {...stroke(LINE * 1.5)} />
    <path d={wobRect(-110, 34, 220, 150, 20, 871, 2)} fill={C.bag} {...stroke()} />
    <path d="M-110 92 L110 92" {...stroke(LINE * 2.2, PAL.red)} />
    <path d={wobRect(-60, 120, 120, 50, 10, 872, 1.2)} fill="#2C3D5C" {...stroke(LINE * 0.7)} />
    <circle cx={-70} cy={60} r={6} fill={C.steel} />
    <circle cx={70} cy={60} r={6} fill={C.steel} />
  </g>
);

/** The decor plant, origin = bottom of the red pot; `tilt` leans it, `rustle` shakes the leaves. */
export const Plant: React.FC<At & { tilt?: number; rustle?: number; seed?: number }> = ({ tilt = 0, rustle = 0, seed = 0, ...a }) => (
  <g transform={`${T(a)} rotate(${tilt})`}>
    {[[-60, -330, -30], [-20, -380, -8], [30, -350, 18], [70, -300, 34], [-90, -260, -44], [0, -300, 4], [50, -250, 26]].map(([x, y, r], i) => {
      const sh = Math.sin(seed * 0.9 + i * 1.7) * rustle * 8;
      return (
        <g key={i} transform={`rotate(${r + sh} 0 -110)`}>
          <path d={`M0 -110 Q${x * 0.4} ${(y - 110) / 2} ${x * 0.15} ${y}`} fill="none" {...stroke(LINE * 0.7, PAL.leafDeep)} />
          <path d={wobEllipse(x * 0.15, y + 30, 26, 64, 880 + i, 0.06, 9)} fill={i % 2 ? PAL.leaf : PAL.leafDeep} {...stroke(LINE * 0.7)} />
        </g>
      );
    })}
    <path d="M-62 -120 L62 -120 L48 0 L-48 0Z" fill={PAL.red} {...stroke()} />
    <path d="M-70 -136 L70 -136 L66 -116 L-66 -116Z" fill={PAL.red} {...stroke(LINE * 0.8)} />
  </g>
);

/** A giant frown mask (the imagination): origin = centre; `r` radius. */
export const FrownMask: React.FC<At & { r: number; tint?: string; seed?: number }> = ({ r, tint = '#3A1E28', seed = 1, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobEllipse(0, 0, r, r * 1.08, 900 + seed, 0.03, 12)} fill={tint} {...stroke(LINE * 1.6)} />
    <path d={`M${-r * 0.62} ${-r * 0.34} L${-r * 0.16} ${-r * 0.12}`} {...stroke(LINE * 3, PAL.red)} />
    <path d={`M${r * 0.62} ${-r * 0.34} L${r * 0.16} ${-r * 0.12}`} {...stroke(LINE * 3, PAL.red)} />
    <path d={wobEllipse(-r * 0.36, r * 0.06, r * 0.13, r * 0.09, 910 + seed, 0.05, 8)} fill={INK} />
    <path d={wobEllipse(r * 0.36, r * 0.06, r * 0.13, r * 0.09, 920 + seed, 0.05, 8)} fill={INK} />
    <path d={`M${-r * 0.5} ${r * 0.62} Q0 ${r * 0.22} ${r * 0.5} ${r * 0.62}`} fill="none" {...stroke(LINE * 3, INK)} />
  </g>
);

/** A thought bubble (origin = the tail tip), body centred at (dx, dy) with radii rx, ry; children inside. */
export const Thought: React.FC<{ x: number; y: number; dx: number; dy: number; rx: number; ry: number; p: number; children?: React.ReactNode }> = ({ x, y, dx, dy, rx, ry, p, children }) => {
  if (p <= 0) return null;
  const k = clamp(p);
  return (
    <g transform={`translate(${x} ${y})`} opacity={clamp(p * 2)}>
      {[0.18, 0.36].map((t, i) => <path key={i} d={wobEllipse(dx * t, dy * t, 14 + i * 10, 12 + i * 8, 930 + i, 0.06, 8)} fill={C.soft} {...stroke(LINE * 0.6)} />)}
      <g transform={`translate(${dx} ${dy}) scale(${0.6 + 0.4 * k})`}>
        {Array.from({ length: 9 }, (_, i) => {
          const an = (i / 9) * Math.PI * 2;
          return <path key={i} d={wobEllipse(Math.cos(an) * rx * 0.86, Math.sin(an) * ry * 0.86, rx * 0.34, ry * 0.34, 940 + i, 0.05, 8)} fill={C.soft} {...stroke(LINE * 0.7)} />;
        })}
        <path d={wobEllipse(0, 0, rx, ry, 950, 0.02, 12)} fill={C.soft} />
        {children}
      </g>
    </g>
  );
};

/** A tiny frown (inside the thought bubble). */
export const TinyFrown: React.FC<{ x: number; y: number; r?: number; seed?: number }> = ({ x, y, r = 34, seed = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={wobEllipse(0, 0, r, r * 1.05, 960 + seed, 0.04, 10)} fill={PAL.white} {...stroke(LINE * 0.7)} />
    <path d={`M${-r * 0.5} ${-r * 0.3} L${-r * 0.12} ${-r * 0.12} M${r * 0.5} ${-r * 0.3} L${r * 0.12} ${-r * 0.12}`} {...stroke(LINE * 0.6)} />
    <circle cx={-r * 0.3} cy={r * 0.04} r={r * 0.09} fill={INK} />
    <circle cx={r * 0.3} cy={r * 0.04} r={r * 0.09} fill={INK} />
    <path d={`M${-r * 0.36} ${r * 0.5} Q0 ${r * 0.24} ${r * 0.36} ${r * 0.5}`} fill="none" {...stroke(LINE * 0.6)} />
  </g>
);

/** Little shake lines (strain, buzz) around a point. */
export const ShakeLines: React.FC<{ x: number; y: number; r: number; o: number; seed?: number }> = ({ x, y, r, o, seed = 0 }) => (
  <g opacity={o}>
    {[0, 1, 2, 3].map((i) => {
      const an = (i / 4) * Math.PI * 2 + 0.6 + rand(seed + i) * 0.4;
      const cx = x + Math.cos(an) * r, cy = y + Math.sin(an) * r;
      return <path key={i} d={`M${cx} ${cy} l${Math.cos(an) * 24} ${Math.sin(an) * 24}`} {...stroke(LINE * 0.7, C.glow)} />;
    })}
  </g>
);
