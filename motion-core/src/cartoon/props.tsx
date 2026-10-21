/**
 * Baseera cartoon props: objects that characters look at, hold, sit in and react to.
 * Same ink outline as the people. Local origin of each prop is noted on it.
 */
import React from 'react';
import { INK } from './Person';

export type CarKind = 'new' | 'old';

/** Where a seated Person goes in car-local space so their head shows in the front window. */
export const driverSeat = (kind: CarKind) => (kind === 'new' ? { x: 40, y: 27, scale: 0.62 } : { x: 36, y: 12, scale: 0.62 });

/**
 * Side-view car, front toward +x. Origin on the ground at the car's centre. ~540 × 175.
 * `driver` is drawn in car-local space and clipped to the windows, so a seated Person shows
 * through the glass. `shine` 0 … 1 sweeps a highlight across the body.
 */
export const Car: React.FC<{
  kind: CarKind; color: string; shade: string; glass: string;
  x?: number; y?: number; scale?: number; facing?: 1 | -1;
  shine?: number; driver?: React.ReactNode; lights?: number; id: string; wheelTurn?: number;
}> = ({ kind, color, shade, glass, x = 0, y = 0, scale = 1, facing = 1, shine = -1, driver, lights = 0, id, wheelTurn = 0 }) => {
  const isNew = kind === 'new';
  const body = isNew
    ? 'M-262 -40 L-266 -92 Q-262 -104 -240 -106 L-178 -110 Q-140 -160 -96 -166 L36 -168 Q64 -166 92 -140 L118 -112 L236 -100 Q266 -94 268 -70 L266 -40 Q262 -30 250 -30 L-250 -30 Q-262 -30 -262 -40 Z'
    : 'M-250 -40 L-252 -112 Q-250 -122 -236 -124 L-198 -126 L-166 -176 Q-160 -184 -146 -184 L54 -184 Q70 -184 80 -172 L118 -124 L222 -116 Q250 -112 252 -88 L252 -40 Q250 -30 238 -30 L-238 -30 Q-250 -30 -250 -40 Z';
  const win = isNew
    ? 'M-160 -112 Q-130 -152 -94 -156 L-22 -157 L-22 -112 Z M-10 -157 L34 -158 Q56 -156 76 -136 L98 -112 L-10 -112 Z'
    : 'M-182 -126 L-154 -172 L-34 -172 L-34 -126 Z M-22 -172 L50 -172 Q60 -172 68 -162 L100 -126 L-22 -126 Z';
  const wheels = isNew ? [-168, 170] : [-160, 158];
  const r = isNew ? 46 : 42;
  const clip = `${id}-win`, bodyClip = `${id}-body`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}>
      <ellipse cx={0} cy={-2} rx={290} ry={16} fill="#000" opacity={0.28} />
      <clipPath id={clip}><path d={win} /></clipPath>
      <clipPath id={bodyClip}><path d={body} /></clipPath>
      <path d={win} fill="#0C1724" />
      {driver && <g clipPath={`url(#${clip})`}>{driver}</g>}
      <path d={`${body} ${win}`} fillRule="evenodd" fill={color} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      {/* lower body shade and a crease line */}
      <path d={isNew ? 'M-262 -64 L266 -64 L266 -40 Q262 -30 250 -30 L-250 -30 Q-262 -30 -262 -40 Z' : 'M-250 -62 L252 -62 L252 -40 Q250 -30 238 -30 L-238 -30 Q-250 -30 -250 -40 Z'} fill={shade} clipPath={`url(#${bodyClip})`} />
      <path d={isNew ? 'M-250 -84 L250 -80' : 'M-240 -92 L240 -88'} stroke={INK} strokeWidth={2.5} opacity={0.35} />
      {/* glass, its reflection, pillar */}
      <path d={win} fill={glass} opacity={driver ? 0.32 : 0.92} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={isNew ? 'M-120 -150 L-80 -150 L-120 -116 L-150 -116 Z M10 -152 L36 -152 L4 -116 L-8 -116 Z' : 'M-140 -168 L-110 -168 L-138 -130 L-160 -130 Z M-6 -168 L18 -168 L-6 -130 L-16 -130 Z'} fill="#FFFFFF" opacity={0.18} />
      {/* doors and handles */}
      <path d={isNew ? 'M-16 -112 L-16 -36 M108 -110 L104 -40' : 'M-28 -126 L-28 -36 M106 -122 L104 -40'} stroke={INK} strokeWidth={3} opacity={0.6} />
      <rect x={isNew ? -58 : -72} y={isNew ? -96 : -108} width={26} height={7} rx={3.5} fill={shade} stroke={INK} strokeWidth={2.5} />
      <rect x={isNew ? 62 : 58} y={isNew ? -96 : -108} width={26} height={7} rx={3.5} fill={shade} stroke={INK} strokeWidth={2.5} />
      {/* lights */}
      <path d={isNew ? 'M244 -92 L264 -84 L262 -72 L238 -76 Z' : 'M234 -104 L252 -102 L252 -84 L232 -86 Z'} fill={lights > 0 ? '#F4FAFF' : '#DCE8F2'} stroke={INK} strokeWidth={3} />
      {lights > 0 && <path d={isNew ? 'M262 -86 L420 -110 L420 -44 L262 -74 Z' : 'M252 -100 L410 -120 L410 -60 L252 -86 Z'} fill="#EAF6FF" opacity={0.18 * lights} />}
      <path d={isNew ? 'M-264 -92 L-246 -90 L-246 -74 L-264 -76 Z' : 'M-252 -110 L-236 -110 L-236 -90 L-252 -90 Z'} fill="#D2557A" stroke={INK} strokeWidth={3} />
      {/* the old car: a scratch and a dent that were never fixed */}
      {!isNew && <g stroke={INK} strokeWidth={2.4} fill="none" opacity={0.75}>
        <path d="M30 -92 l14 -6 l10 8 l14 -7 l12 6" />
        <path d="M-150 -70 q14 8 28 0" />
      </g>}
      {/* moving highlight */}
      {shine >= 0 && shine <= 1 && <g clipPath={`url(#${bodyClip})`}>
        <path d={`M${-420 + shine * 900} -200 l60 0 l-140 200 l-60 0 Z`} fill="#FFFFFF" opacity={0.55} />
      </g>}
      {/* wheels */}
      {wheels.map((wx) => (
        <g key={wx} transform={`translate(${wx} ${-r + 2})`}>
          <circle r={r + 8} fill={INK} opacity={0.9} />
          <circle r={r} fill="#1E2633" stroke={INK} strokeWidth={4} />
          <g transform={`rotate(${wheelTurn})`}>
            <circle r={r * 0.55} fill={isNew ? '#D7E1EA' : '#8C98A5'} stroke={INK} strokeWidth={3} />
            {[0, 72, 144, 216, 288].map((a) => <path key={a} d={`M0 0 L0 ${-r * 0.5}`} stroke={INK} strokeWidth={3} transform={`rotate(${a})`} />)}
          </g>
        </g>
      ))}
    </g>
  );
};

/** A thought bubble: cloud over (x, y) with dots trailing to `tail`. Content is drawn in a
 * w × h box centred on the cloud and clipped to it. `pop` 0 … 1 grows it from the tail. */
export const Bubble: React.FC<{
  x: number; y: number; w: number; h: number; tail: [number, number]; pop: number; id: string;
  fill?: string; children?: React.ReactNode;
}> = ({ x, y, w, h, tail, pop, id, fill = '#EAF1F7', children }) => {
  if (pop <= 0) return null;
  const n = 11;
  const bumps = Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    return { cx: Math.cos(a) * w * 0.44, cy: Math.sin(a) * h * 0.4, r: Math.min(w, h) * (0.2 + 0.04 * ((k * 5) % 3)) };
  });
  const s = Math.min(1, pop * 1.15) - Math.max(0, pop - 0.87) * 1.15 * 0; // grows, settles
  // dots run from the thinker's head to the cloud's edge, growing toward the cloud
  const dx = x - tail[0], dy = y - tail[1], len = Math.hypot(dx, dy) || 1;
  const edge = len - Math.hypot((dx / len) * w * 0.5, (dy / len) * h * 0.46);
  const dots = [0.18, 0.5, 0.86].map((t) => [tail[0] + (dx / len) * edge * t, tail[1] + (dy / len) * edge * t] as [number, number]);
  return (
    <g opacity={Math.min(1, pop * 2)}>
      {dots.map(([px, py], k) => <circle key={k} cx={px} cy={py} r={(6 + k * 5) * Math.min(1, pop * 2)} fill={fill} stroke={INK} strokeWidth={3.5} />)}
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <clipPath id={`${id}-clip`}><ellipse cx={0} cy={0} rx={w * 0.47} ry={h * 0.43} /></clipPath>
        <g stroke={INK} strokeWidth={4} fill={fill}>
          {bumps.map((b, k) => <circle key={k} cx={b.cx} cy={b.cy} r={b.r} />)}
        </g>
        {bumps.map((b, k) => <circle key={k} cx={b.cx} cy={b.cy} r={b.r - 2.5} fill={fill} />)}
        <ellipse cx={0} cy={0} rx={w * 0.46} ry={h * 0.42} fill={fill} />
        <g clipPath={`url(#${id}-clip)`}>{children}</g>
      </g>
    </g>
  );
};

/** Phone held upright; origin at its centre. `screen` is drawn inside the 54 × 96 screen. */
export const Phone: React.FC<{ screen?: React.ReactNode; glow?: number; scale?: number; rot?: number }> = ({ screen, glow = 1, scale = 1, rot = 0 }) => (
  <g transform={`rotate(${rot}) scale(${scale})`}>
    <rect x={-32} y={-56} width={64} height={112} rx={12} fill="#1B2433" stroke={INK} strokeWidth={4} />
    <rect x={-27} y={-48} width={54} height={96} rx={6} fill={glow > 0 ? '#DCEBF7' : '#22314A'} opacity={0.4 + 0.6 * glow} />
    {screen}
  </g>
);

/** Car keys on a ring, origin at the ring. */
export const Keys: React.FC<{ color: string; swing?: number }> = ({ color, swing = 0 }) => (
  <g transform={`rotate(${swing})`}>
    <circle cx={0} cy={0} r={11} fill="none" stroke={INK} strokeWidth={4} />
    <rect x={-12} y={8} width={24} height={36} rx={9} fill={color} stroke={INK} strokeWidth={3.5} />
    <circle cx={0} cy={22} r={4} fill="#FFFFFF" opacity={0.7} />
    <path d="M10 6 L10 40 l7 0 l0 -6 l-4 0 l0 -4 l5 0" fill="#C9D4DF" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
  </g>
);

/** A glass savings jar, origin at its base. `level` 0 … 1 fills it with banknotes. Two jars on one frame need distinct `id`s. */
export const Jar: React.FC<{ level: number; note: string; noteShade: string; w?: number; h?: number; label?: React.ReactNode; id?: string }> = ({ level, note, noteShade, w = 150, h = 190, label, id = `jar-${w}-${h}` }) => {
  const fillH = (h - 34) * Math.max(0, Math.min(1, level));
  const rows = Math.ceil(fillH / 18);
  return (
    <g>
      <path d={`M${-w / 2} -12 Q${-w / 2} 0 ${-w / 2 + 14} 0 L${w / 2 - 14} 0 Q${w / 2} 0 ${w / 2} -12 L${w / 2} ${-h + 34} Q${w / 2} ${-h + 22} ${w / 2 - 18} ${-h + 20} L${-w / 2 + 18} ${-h + 20} Q${-w / 2} ${-h + 22} ${-w / 2} ${-h + 34} Z`} fill="#DDEFF7" opacity={0.25} />
      <clipPath id={id}><rect x={-w / 2 + 6} y={-fillH - 6} width={w - 12} height={fillH} /></clipPath>
      <g clipPath={`url(#${id})`}>
        {Array.from({ length: rows }, (_, k) => (
          <g key={k} transform={`translate(${((k * 37) % 30) - 15} ${-12 - k * 18}) rotate(${((k * 53) % 24) - 12})`}>
            <rect x={-48} y={-9} width={96} height={20} rx={4} fill={k % 2 ? note : noteShade} stroke={INK} strokeWidth={2.5} />
          </g>
        ))}
      </g>
      <path d={`M${-w / 2} -12 Q${-w / 2} 0 ${-w / 2 + 14} 0 L${w / 2 - 14} 0 Q${w / 2} 0 ${w / 2} -12 L${w / 2} ${-h + 34} Q${w / 2} ${-h + 22} ${w / 2 - 18} ${-h + 20} L${-w / 2 + 18} ${-h + 20} Q${-w / 2} ${-h + 22} ${-w / 2} ${-h + 34} Z`} fill="none" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <path d={`M${-w / 2 + 16} ${-h + 40} L${-w / 2 + 16} -24`} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
      <rect x={-w / 2 + 10} y={-h} width={w - 20} height={22} rx={6} fill="#3B4C63" stroke={INK} strokeWidth={4} />
      {label}
    </g>
  );
};

/** A banknote with no currency marks, origin at centre. */
export const Note: React.FC<{ color: string; shade: string; rot?: number; scale?: number }> = ({ color, shade, rot = 0, scale = 1 }) => (
  <g transform={`rotate(${rot}) scale(${scale})`}>
    <rect x={-60} y={-30} width={120} height={60} rx={8} fill={color} stroke={INK} strokeWidth={3.5} />
    <rect x={-50} y={-21} width={100} height={42} rx={5} fill="none" stroke={shade} strokeWidth={3} />
    <circle cx={0} cy={0} r={13} fill={shade} />
  </g>
);

/** A month page. `mark` circles one day; `days` is the month length. Origin at top-left. */
export const Calendar: React.FC<{ w: number; head: string; mark?: number; markColor: string; markO?: number; font: string; days?: number; title?: string }> = ({ w, head, mark, markColor, markO = 1, font, days = 30, title }) => {
  const cell = w / 7, h = cell * 5 + 56;
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} rx={14} fill="#F2F6FA" stroke={INK} strokeWidth={4} />
      <path d={`M0 14 Q0 0 14 0 L${w - 14} 0 Q${w} 0 ${w} 14 L${w} 46 L0 46 Z`} fill={head} stroke={INK} strokeWidth={4} />
      {title && <text x={w / 2} y={33} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={24} fill="#FFFFFF" direction="rtl">{title}</text>}
      {Array.from({ length: days }, (_, k) => {
        // right-to-left week rows
        const col = 6 - (k % 7), row = Math.floor(k / 7);
        const cx = col * cell + cell / 2, cy = 56 + row * cell + cell / 2;
        return (
          <g key={k}>
            <text x={cx} y={cy + 7} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={cell * 0.38} fill="#33465C">{k + 1}</text>
            {mark === k + 1 && <circle cx={cx} cy={cy} r={cell * 0.42} fill="none" stroke={markColor} strokeWidth={5} opacity={markO} />}
          </g>
        );
      })}
    </g>
  );
};

/** A cardboard box carried with both hands; origin at its top centre. */
export const Box: React.FC<{ w?: number; h?: number; color?: string; shade?: string; contents?: React.ReactNode }> = ({ w = 150, h = 100, color = '#9E8678', shade = '#7F685C', contents }) => (
  <g>
    {contents}
    <rect x={-w / 2} y={0} width={w} height={h} rx={6} fill={color} stroke={INK} strokeWidth={4} />
    <path d={`M${-w / 2} 0 L${-w / 2 - 18} -14 L${-w / 2 + 30} -14 L${-w / 2 + 40} 0`} fill={shade} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    <path d={`M${w / 2} 0 L${w / 2 + 18} -14 L${w / 2 - 30} -14 L${w / 2 - 40} 0`} fill={shade} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    <path d={`M${-w / 2 + 12} ${h * 0.45} L${w / 2 - 12} ${h * 0.45}`} stroke={shade} strokeWidth={4} />
  </g>
);
