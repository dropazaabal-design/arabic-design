import React from 'react';
import { draw } from '../motion';
import { C } from '../theme';
import { G, P } from './doodles';

// The reel's world: one phone, a timer ring, the path a hand would take back to the phone (drawn as
// a moving dot, no hands or faces), a silent bell, a lens, a two-week calendar, and a notebook.

const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** A phone (portrait). `screen` 0 = dark, 1 = lit with an app grid; `flash` brightens it for a moment. */
export const Phone: React.FC<P & { screen?: number; flash?: number }> = ({ screen = 1, flash = 0, ...g }) => (
  <G {...g}>
    <rect x={-180} y={-360} width={360} height={720} rx={54} fill={C.navy} stroke={C.ink} strokeWidth={8} filter="url(#lift)" />
    <rect x={-160} y={-336} width={320} height={672} rx={38} fill={C.navy2} />
    <g opacity={screen}>
      <rect x={-160} y={-336} width={320} height={672} rx={38} fill={C.blueSoft} />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={-118 + (i % 3) * 90} y={-250 + Math.floor(i / 3) * 104} width={56} height={56} rx={16}
          fill={[C.blue, C.green, C.red, C.cardboard, C.aqua, C.navy2][i % 6]} opacity={0.85} />
      ))}
    </g>
    {flash > 0 && <rect x={-160} y={-336} width={320} height={672} rx={38} fill={C.white} opacity={0.6 * flash} />}
    <rect x={-40} y={-326} width={80} height={14} rx={7} fill={C.ink} />
  </G>
);

/** A timer ring: grey track with ticks and a red arc that draws as `p` goes 0→1 (clockwise from the top). */
export const TimerRing: React.FC<P & { r?: number; p: number; color?: string; track?: number }> = ({ r = 400, p, color = C.red, track = 1, ...g }) => (
  <G {...g}>
    <circle r={r} fill="none" stroke={C.line} strokeWidth={22} opacity={track} />
    {Array.from({ length: 60 }).map((_, i) => (
      <path key={i} d={`M 0 ${-r + 30} L 0 ${-r + (i % 5 ? 44 : 60)}`} stroke={C.inkSoft} strokeWidth={i % 5 ? 3 : 6} strokeLinecap="round" transform={`rotate(${i * 6})`} opacity={0.55 * track} />
    ))}
    {p > 0 && <circle r={r} fill="none" stroke={color} strokeWidth={22} strokeLinecap="round" transform="rotate(-90)" {...draw(p)} />}
  </G>
);

/** A notification bell, still and grey; the dashed circle is where a badge would be (none here). */
export const Bell: React.FC<P & { color?: string }> = ({ color = C.inkSoft, ...g }) => (
  <G {...g}>
    <path d="M -56 40 Q -56 -40 0 -52 Q 56 -40 56 40 L 72 62 L -72 62 Z" fill={C.paper} stroke={color} strokeWidth={9} strokeLinejoin="round" />
    <path d="M -18 76 Q 0 98 18 76" fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" />
    <circle cx={0} cy={-60} r={9} fill={color} />
    <circle cx={50} cy={-44} r={24} fill="none" stroke={color} strokeWidth={5} strokeDasharray="8 7" />
  </G>
);

/** A magnifying lens. */
export const Lens: React.FC<P & { r?: number }> = ({ r = 170, ...g }) => (
  <G {...g}>
    <path d={`M ${r * 0.7} ${r * 0.7} L ${r * 1.45} ${r * 1.45}`} stroke={C.ink} strokeWidth={34} strokeLinecap="round" />
    <circle r={r} fill={C.aqua} opacity={0.3} />
    <circle r={r} fill="none" stroke={C.ink} strokeWidth={16} />
    <path d={`M ${-r * 0.55} ${-r * 0.3} Q ${-r * 0.5} ${-r * 0.55} ${-r * 0.25} ${-r * 0.6}`} stroke={C.white} strokeWidth={10} strokeLinecap="round" fill="none" />
  </G>
);

/** A dumbbell (willpower as a test of strength). */
export const Dumbbell: React.FC<P> = (g) => (
  <G {...g}>
    <rect x={-110} y={-10} width={220} height={20} rx={8} fill={C.inkSoft} />
    {[-1, 1].map((s) => (
      <g key={s}>
        <rect x={s * 70 - 16} y={-58} width={32} height={116} rx={10} fill={C.ink} />
        <rect x={s * 104 - 12} y={-40} width={24} height={80} rx={8} fill={C.ink} />
      </g>
    ))}
  </G>
);

/** A red X drawn over something. */
export const Cross: React.FC<P & { size?: number; p: number }> = ({ size = 120, p, ...g }) => p > 0 ? (
  <G {...g}>
    <path d={`M ${-size} ${-size} L ${size} ${size}`} stroke={C.red} strokeWidth={22} strokeLinecap="round" {...draw(Math.min(1, p * 2))} />
    <path d={`M ${size} ${-size} L ${-size} ${size}`} stroke={C.red} strokeWidth={22} strokeLinecap="round" {...draw(Math.max(0, p * 2 - 1))} />
  </G>
) : null;

/** Two weeks: 2 rows × 7 days, filled right to left (RTL) as `filled` grows to 14. */
export const TwoWeeks: React.FC<P & { filled: number; dark?: boolean }> = ({ filled, dark = false, ...g }) => (
  <G {...g}>
    {Array.from({ length: 14 }).map((_, i) => {
      const row = Math.floor(i / 7), col = i % 7;
      const x = 3 * 112 - col * 112, y = row * 112;
      const q = clamp(filled - i);
      return (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect x={-48} y={-48} width={96} height={96} rx={18} fill={dark ? C.navy2 : C.paper} stroke={dark ? C.inkSoft : C.line} strokeWidth={4} />
          {q > 0 && <rect x={-48} y={-48} width={96} height={96} rx={18} fill={C.green} opacity={q} transform={`scale(${0.6 + 0.4 * q})`} />}
        </g>
      );
    })}
  </G>
);

/** Mobile internet: wifi arcs over a dot. `cut` draws a red slash and greys it. */
export const Internet: React.FC<P & { cut?: number }> = ({ cut = 0, ...g }) => {
  const col = cut > 0.5 ? C.muted : C.blue;
  return (
    <G {...g}>
      {[150, 104, 58].map((r, i) => (
        <path key={i} d={`M ${-r * 0.8} ${-r * 0.55} Q 0 ${-r * 1.15} ${r * 0.8} ${-r * 0.55}`} fill="none" stroke={col} strokeWidth={24} strokeLinecap="round" />
      ))}
      <circle cx={0} cy={18} r={22} fill={col} />
      {cut > 0 && <path d="M -135 50 L 135 -175" stroke={C.red} strokeWidth={26} strokeLinecap="round" {...draw(cut)} />}
    </G>
  );
};

/** A phone handset (calls). */
export const Call: React.FC<P & { ok?: number }> = ({ ok = 0, ...g }) => (
  <G {...g}>
    <circle r={92} fill={C.paper} stroke={C.line} strokeWidth={6} />
    <path d="M -40 -46 Q -54 -40 -50 -20 Q -36 30 20 52 Q 40 58 46 42 L 52 26 Q 54 16 44 12 L 22 4 Q 12 2 6 10 L 0 18 Q -24 6 -34 -16 L -26 -24 Q -18 -30 -20 -40 L -26 -58 Q -30 -66 -40 -64 Z" fill={C.ink} />
    {ok > 0 && <OkBadge p={ok} />}
  </G>
);

/** A text message (bubble with lines). */
export const Message: React.FC<P & { ok?: number }> = ({ ok = 0, ...g }) => (
  <G {...g}>
    <circle r={92} fill={C.paper} stroke={C.line} strokeWidth={6} />
    <path d="M -54 -40 L 54 -40 Q 64 -40 64 -30 L 64 24 Q 64 34 54 34 L -10 34 L -34 56 L -30 34 L -54 34 Q -64 34 -64 24 L -64 -30 Q -64 -40 -54 -40 Z" fill={C.ink} />
    <rect x={-40} y={-20} width={80} height={10} rx={5} fill={C.paper} />
    <rect x={-40} y={2} width={52} height={10} rx={5} fill={C.paper} />
    {ok > 0 && <OkBadge p={ok} />}
  </G>
);

const OkBadge: React.FC<{ p: number }> = ({ p }) => (
  <g transform={`translate(66 -66) scale(${0.5 + 0.5 * p})`} opacity={p}>
    <circle r={34} fill={C.green} />
    <path d="M -15 0 L -4 11 L 16 -11" fill="none" stroke={C.white} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** A reset arrow (the "reset your brain" promise we do not make). */
export const Reset: React.FC<P> = (g) => (
  <G {...g}>
    <path d="M 70 -40 A 80 80 0 1 0 80 20" fill="none" stroke={C.inkSoft} strokeWidth={22} strokeLinecap="round" />
    <path d="M 40 -78 L 84 -44 L 34 -16 Z" fill={C.inkSoft} />
  </G>
);

/** An open notebook; `lines` 0…1 writes its lines. */
export const Notebook: React.FC<P & { lines?: number }> = ({ lines = 0, ...g }) => (
  <G {...g}>
    <path d="M 0 -150 Q -120 -176 -270 -150 L -270 170 Q -120 146 0 170 Q 120 146 270 170 L 270 -150 Q 120 -176 0 -150 Z" fill={C.paper} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" filter="url(#lift)" />
    <path d="M 0 -150 L 0 170" stroke={C.line} strokeWidth={6} />
    {Array.from({ length: 5 }).map((_, i) => [1, -1].map((s) => {
      const q = clamp(lines * 10 - (i * 2 + (s > 0 ? 0 : 1)));
      return q > 0 ? <path key={`${i}${s}`} d={`M ${s * 236} ${-92 + i * 54} L ${s * (236 - 200 * q)} ${-92 + i * 54}`} stroke={C.blue} strokeWidth={10} strokeLinecap="round" /> : null;
    }))}
  </G>
);

/** A pencil. */
export const Pencil: React.FC<P> = (g) => (
  <G {...g}>
    <rect x={-20} y={-150} width={40} height={230} rx={6} fill={C.green} stroke={C.ink} strokeWidth={6} />
    <path d="M -20 80 L 0 128 L 20 80 Z" fill={C.cardboard} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -6 112 L 0 128 L 6 112 Z" fill={C.ink} />
  </G>
);
