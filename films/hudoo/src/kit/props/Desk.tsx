import React from 'react';
import { TITLE } from '../../fonts';
import { INK, LINE, PAL, hash, sketch, sketchRect } from '../style';
import { Ar, clamp01, mix, rrect } from './ui';

/** Laptop screen content is authored at 640×400 (top-left origin) and scaled into the lid. */
export const LAPTOP_SCREEN = { w: 640, h: 400 } as const;

/**
 * A laptop on a table, seen from above-front: origin at the middle of the base's front edge (y=0 is the table).
 * Base 170 px wide, lid 144×96 px. `open` 0 closed … 1 upright; `screen` is drawn into LAPTOP_SCREEN (dark when absent).
 */
export const Laptop = ({ open = 1, screen }: { open?: number; screen?: React.ReactNode }) => {
  const o = clamp01(open), lw = LINE.fine, hy = -34, LH = 96, b = 6;
  const yFree = mix(-8, hy - LH, o);
  const below = yFree > hy;
  const hw = below ? mix(72, 84, (yFree - hy) / 26) : 72;
  const keys = Array.from({ length: 4 }, (_, r) => {
    const y = mix(-29, -15, r / 3), half = mix(66, 74, r / 3), n = 12;
    return Array.from({ length: n }, (_, k) => {
      const x0 = -half + (k / n) * 2 * half;
      return <rect key={`${r}-${k}`} x={x0 + 1} y={y} width={(2 * half) / n - 2} height={3.6} rx={0.8} fill="#6E7884" />;
    });
  });
  const sh = hy - yFree - 2 * b;
  return (
    <g strokeLinejoin="round">
      <path d="M-85 -8 L85 -8 L85 -2 Q85 0 83 0 L-83 0 Q-85 0 -85 -2 Z" fill={PAL.woodDark} stroke={INK} strokeWidth={lw} />
      <path d={sketch([[-72, hy], [72, hy], [85, -8], [-85, -8]], 7, 0.8, true)} fill={PAL.metal} stroke={INK} strokeWidth={lw} />
      {keys}
      <rect x={-18} y={-12.5} width={36} height={3.6} rx={1} fill="#7F8994" />
      {below ? (
        <path d={`M-72 ${hy} L72 ${hy} L${hw} ${yFree} L${-hw} ${yFree} Z`} fill={PAL.metal} stroke={INK} strokeWidth={lw} />
      ) : (
        <g>
          <path d={rrect(-72, yFree, 144, hy - yFree, 5)} fill={INK} stroke={INK} strokeWidth={lw} />
          {sh > 1 && (
            <svg x={-72 + b} y={yFree + b} width={144 - 2 * b} height={sh} viewBox={`0 0 ${LAPTOP_SCREEN.w} ${LAPTOP_SCREEN.h}`} preserveAspectRatio="none">
              {screen ?? <g><rect width={640} height={400} fill={PAL.screen} /><path d="M420 0 H640 V120 L200 400 H40 Z" fill="#FFFFFF" opacity={0.06} /></g>}
            </svg>
          )}
        </g>
      )}
    </g>
  );
};

/**
 * A sheet of paper, origin at its centre, 70×96 px. `lines` grey text lines (no real text), `crumple` 0 flat … 1 a
 * crumpled ball ~40 px across. Deterministic: the creases are seeded, they never boil.
 */
export const Paper = ({ lines = 8, crumple = 0, seed = 1 }: { lines?: number; crumple?: number; seed?: number }) => {
  const c = clamp01(crumple), W = 70, H = 96, N = 32;
  const per = 2 * (W + H);
  const pts: [number, number][] = Array.from({ length: N }, (_, i) => {
    let d = (i / N) * per, x: number, y: number;
    if (d < W) { x = -W / 2 + d; y = -H / 2; } else if ((d -= W) < H) { x = W / 2; y = -H / 2 + d; } else if ((d -= H) < W) { x = W / 2 - d; y = H / 2; } else { d -= W; x = -W / 2; y = H / 2 - d; }
    const a = Math.atan2(y, x), r = 20 * (0.8 + 0.4 * hash(seed * 13 + i));
    return [mix(x, Math.cos(a) * r, c), mix(y, Math.sin(a) * r, c)];
  });
  const creases = Array.from({ length: 7 }, (_, k) => {
    const a = hash(seed * 7 + k) * Math.PI * 2, r = 4 + hash(seed * 5 + k) * 12;
    const x = Math.cos(a) * r, y = Math.sin(a) * r, b = a + 1.6 + hash(k + seed) * 1.5;
    return `M${x} ${y} l${Math.cos(b) * 9} ${Math.sin(b) * 9} l${Math.cos(b + 1.2) * 6} ${Math.sin(b + 1.2) * 6}`;
  });
  return (
    <g strokeLinejoin="round">
      <path d={sketch(pts, seed, 0.6 + c * 2.5, true)} fill="#FBFAF7" stroke={INK} strokeWidth={LINE.fine} />
      {c < 0.6 && (
        <g stroke="#9AA3AE" strokeWidth={2} strokeLinecap="round" opacity={1 - c / 0.6} transform={`scale(${1 - c * 0.6})`}>
          {Array.from({ length: lines }, (_, k) => {
            const y = -H / 2 + 14 + k * ((H - 26) / Math.max(1, lines - 1)), len = k === lines - 1 ? 0.55 : 0.85 + hash(seed + k) * 0.1;
            return <path key={k} d={`M${W / 2 - 9} ${y} L${W / 2 - 9 - (W - 18) * len} ${y}`} />;
          })}
        </g>
      )}
      {c > 0 && (
        <g opacity={Math.min(1, c * 1.5)}>
          {[0, 1, 2].map((k) => <path key={k} d={`M0 0 L${pts[(k * 11 + 3) % N][0] * 0.9} ${pts[(k * 11 + 3) % N][1] * 0.9} L${pts[(k * 11 + 8) % N][0] * 0.9} ${pts[(k * 11 + 8) % N][1] * 0.9} Z`} fill={PAL.paperShade} />)}
          <g fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" opacity={0.55}>{creases.map((d, k) => <path key={k} d={d} />)}</g>
        </g>
      )}
    </g>
  );
};

/** A closed document folder with papers peeking out: origin at its centre, 100×74 px. */
export const Folder = ({ color = '#A9BCD3' }: { color?: string }) => (
  <g strokeLinejoin="round">
    <path d={sketch([[-50, -30], [6, -30], [12, -38], [44, -38], [50, -30], [50, 36], [-50, 36]], 3, 0.8, true)} fill="#8DA2BC" stroke={INK} strokeWidth={LINE.fine} />
    <path d={sketchRect(-42, -34, 80, 50, 4, 0.6)} fill="#FBFAF7" stroke={INK} strokeWidth={1.6} transform="rotate(-3)" />
    <path d={sketchRect(-38, -30, 80, 50, 5, 0.6)} fill="#FBFAF7" stroke={INK} strokeWidth={1.6} transform="rotate(2)" />
    <path d={sketch([[-50, -20], [50, -22], [50, 36], [-50, 36]], 6, 0.8, true)} fill={color} stroke={INK} strokeWidth={LINE.fine} />
    <rect x={-14} y={-6} width={28} height={12} rx={2} fill="#FBFAF7" stroke={INK} strokeWidth={1.4} />
  </g>
);

/** A small desk calendar: origin at the middle of its base (y=0 is the table), 56×54 px. Big `day` digits; optional Arabic `month`. */
export const Calendar = ({ day, month }: { day: number; month?: string }) => (
  <g strokeLinejoin="round">
    <path d="M-24 -50 L24 -50 L30 0 L-30 0 Z" fill={PAL.chairDark} stroke={INK} strokeWidth={LINE.fine} />
    <path d={sketchRect(-28, -52, 56, 52, 9, 0.6)} fill="#FBFAF7" stroke={INK} strokeWidth={LINE.fine} />
    <path d="M-28 -52 H28 V-38 H-28 Z" fill={PAL.focus} stroke={INK} strokeWidth={LINE.fine} />
    {[-14, 14].map((x) => <path key={x} d={`M${x} -48 v-8`} stroke={INK} strokeWidth={3} strokeLinecap="round" />)}
    {month && <Ar x={-28} y={-52} w={56} h={14} size={9} color="#FFFFFF" lh={1}>{month}</Ar>}
    <Ar x={-28} y={-38} w={56} h={38} size={28} font={TITLE} weight={800} lh={1} style={{ paddingTop: 3 }}>{String(day)}</Ar>
  </g>
);

const GLOW = '#EEF5FB';
/**
 * A desk lamp: origin at the middle of its base (y=0 is the table), ~110 px tall, the shade aims down toward +x.
 * `on` 0..1 lights the bulb with a cool-white glow and a light cone onto the table.
 */
export const Lamp = ({ on = 0 }: { on?: number }) => {
  const k = clamp01(on), lw = LINE.fine;
  const arm = 'M0 -8 L-16 -66 L26 -98';
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {k > 0 && <path d="M18 -86 L52 -78 L96 0 L-6 0 Z" fill={GLOW} opacity={0.55 * k} />}
      <path d={arm} fill="none" stroke={INK} strokeWidth={6 + lw * 2} />
      <path d={arm} fill="none" stroke={PAL.metal} strokeWidth={6} />
      <circle cx={-16} cy={-66} r={4.5} fill={PAL.metal} stroke={INK} strokeWidth={lw * 0.8} />
      <path d="M-24 0 Q-24 -10 0 -10 Q24 -10 24 0 Z" fill={PAL.chair} stroke={INK} strokeWidth={lw} />
      <g transform="translate(30 -96) rotate(-28)">
        {k > 0 && [26, 18, 11].map((r) => <circle key={r} cx={0} cy={14} r={r} fill={PAL.screenGlow} opacity={0.22 * k} />)}
        <ellipse cx={0} cy={13} rx={9} ry={5} fill={k > 0 ? GLOW : '#C9D0D8'} stroke={INK} strokeWidth={lw * 0.7} />
        <path d="M-7 -12 Q0 -16 7 -12 L18 12 Q0 18 -18 12 Z" fill={PAL.chair} stroke={INK} strokeWidth={lw} />
        <path d="M-18 12 Q0 18 18 12" fill="none" stroke={k > 0 ? GLOW : INK} strokeWidth={lw} />
        <circle cx={0} cy={-12} r={3.5} fill={PAL.metal} stroke={INK} strokeWidth={lw * 0.7} />
      </g>
    </g>
  );
};
