import React from 'react';
import { INK, LINE, PAL, bowLine, clamp, closedPath, lerp, rand, stroke, wobEllipse, wobRect } from '@mukarram/characters/ink';

// Props for «الضفدع هرب… وأنت؟», in the same ink language as reels/mukarram/src/characters/props.tsx.
// Each has its own small controls (level, time, scroll, lock, count, check…). Arabic words are set by
// the browser (RTL, joined); digits are Western.

type At = { x: number; y: number; s?: number; rot?: number; o?: number };
const T = ({ x, y, s = 1, rot = 0 }: At) => `translate(${x} ${y}) rotate(${rot}) scale(${s})`;
const AR = { fontFamily: 'Cairo', fontWeight: 900 } as const;

/** A red thermometer; level 0..1. Origin = bulb centre. */
export const Thermometer: React.FC<At & { level: number }> = ({ level, ...a }) => {
  const h = 300, top = -h;
  const lv = lerp(-30, top + 26, clamp(level));
  return (
    <g transform={T(a)} opacity={a.o ?? 1}>
      <path d={`M-24 -10 L-24 ${top + 24} Q-24 ${top} 0 ${top} Q24 ${top} 24 ${top + 24} L24 -10`} fill={PAL.white} {...stroke()} />
      <path d={`M-11 -20 L-11 ${lv} L11 ${lv} L11 -20Z`} fill={PAL.red} />
      <circle cx={0} cy={18} r={42} fill={PAL.red} {...stroke()} />
      <circle cx={-12} cy={6} r={9} fill={PAL.white} opacity={0.6} />
      {[0.2, 0.4, 0.6, 0.8].map((k) => <path key={k} d={`M24 ${lerp(-30, top + 26, k)} l 18 0`} {...stroke(LINE * 0.7)} />)}
    </g>
  );
};

/** A phone held in the hand. bar 0..1 = screen-time bar, label = minutes text, scroll = feed offset,
 *  lock 0..1 = screen going dark, glow = light on the face. Origin = phone centre. */
export const Phone: React.FC<At & { bar?: number; label?: string; scroll?: number; lock?: number; tilt?: number }> = ({ bar = 0, label, scroll = 0, lock = 0, ...a }) => {
  const w = 150, h = 280;
  const cards = [0, 1, 2, 3, 4];
  return (
    <g transform={T(a)} opacity={a.o ?? 1}>
      <path d={wobRect(-w / 2, -h / 2, w, h, 26, 401, 1.5)} fill={INK} {...stroke()} />
      <clipPath id="phoneScreen"><rect x={-w / 2 + 12} y={-h / 2 + 22} width={w - 24} height={h - 44} rx={14} /></clipPath>
      <g clipPath="url(#phoneScreen)">
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={PAL.blueSoft} />
        {cards.map((i) => {
          const y = ((i * 70 - scroll) % 350 + 350) % 350 - 140;
          return (
            <g key={i} transform={`translate(0 ${y})`}>
              <rect x={-56} y={0} width={112} height={58} rx={10} fill={PAL.white} {...stroke(4)} />
              <rect x={-48} y={8} width={34} height={34} rx={6} fill={[PAL.red, PAL.blue, FROG_TEAL, PAL.navy, PAL.red][i]} />
              <path d="M-6 16 L44 16 M-6 30 L30 30" {...stroke(5, PAL.stone)} />
            </g>
          );
        })}
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={INK} opacity={clamp(lock)} />
      </g>
      {/* screen-time bar on top of the phone (the thermometer's red, turned sideways) */}
      {bar > 0 && (
        <g transform={`translate(0 ${-h / 2 - 54})`}>
          <path d={wobRect(-w * 0.8, -20, w * 1.6, 40, 20, 402, 1)} fill={PAL.white} {...stroke()} />
          <path d={`M${-w * 0.8 + 10} -9 L${lerp(-w * 0.8 + 10, w * 0.8 - 10, clamp(bar))} -9 L${lerp(-w * 0.8 + 10, w * 0.8 - 10, clamp(bar))} 9 L${-w * 0.8 + 10} 9Z`} fill={PAL.red} />
        </g>
      )}
      {label && <text x={0} y={-h / 2 - 104} textAnchor="middle" direction="rtl" {...AR} fontSize={76} fill={PAL.white} stroke={INK} strokeWidth={10} paintOrder="stroke" strokeLinejoin="round">{label}</text>}
    </g>
  );
};
export const FROG_TEAL = '#4FA89A';

/** A wall clock; minutes since 0 drive both hands. */
export const WallClock: React.FC<At & { minutes: number }> = ({ minutes, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobEllipse(0, 0, 92, 92, 411, 0.02, 12)} fill={PAL.white} {...stroke(LINE * 1.2)} />
    {Array.from({ length: 12 }, (_, i) => {
      const r = (i / 12) * Math.PI * 2;
      return <path key={i} d={`M${Math.sin(r) * 70} ${-Math.cos(r) * 70} L${Math.sin(r) * 80} ${-Math.cos(r) * 80}`} {...stroke(LINE * 0.7)} />;
    })}
    <path d={`M0 0 L${Math.sin((minutes / 60) * Math.PI * 2) * 64} ${-Math.cos((minutes / 60) * Math.PI * 2) * 64}`} {...stroke(LINE * 0.9, PAL.red)} />
    <path d={`M0 0 L${Math.sin((minutes / 720) * Math.PI * 2 + 0.5) * 42} ${-Math.cos((minutes / 720) * Math.PI * 2 + 0.5) * 42}`} {...stroke(LINE * 1.3)} />
    <circle cx={0} cy={0} r={8} fill={INK} />
  </g>
);

/** One feed card flying on the conveyor (heart / play / picture). */
export const FeedCard: React.FC<At & { kind: number }> = ({ kind, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobRect(-70, -50, 140, 100, 14, 420 + kind, 2)} fill={PAL.white} {...stroke()} />
    {kind % 3 === 0 && <path d="M0 20 C -40 -6 -26 -36 0 -16 C 26 -36 40 -6 0 20Z" fill={PAL.red} {...stroke(LINE * 0.7)} />}
    {kind % 3 === 1 && <g><circle cx={0} cy={0} r={30} fill={PAL.blue} {...stroke(LINE * 0.7)} /><path d="M-8 -14 L16 0 L-8 14Z" fill={PAL.white} /></g>}
    {kind % 3 === 2 && <g><rect x={-46} y={-30} width={92} height={60} rx={6} fill={PAL.blueSoft} {...stroke(LINE * 0.6)} /><path d="M-40 24 L-10 -6 L10 14 L24 0 L42 24Z" fill={FROG_TEAL} /></g>}
  </g>
);

/** A conveyor belt running out of the phone: speed = px/frame, length = how far it reaches. */
export const Conveyor: React.FC<{ x: number; y: number; len: number; f: number; speed: number; o?: number }> = ({ x, y, len, f, speed, o = 1 }) => {
  if (len <= 4) return null;
  const off = (f * speed) % 60;
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      <path d={wobRect(-len, -18, len, 36, 18, 431, 1.5)} fill={PAL.navy} {...stroke()} />
      {Array.from({ length: Math.ceil(len / 60) + 1 }, (_, i) => {
        const xx = -i * 60 + off;
        return xx < 0 && xx > -len ? <path key={i} d={`M${xx} -14 L${xx} 14`} {...stroke(4, '#5A6A85')} /> : null;
      })}
      {[-len + 30, -30].map((xx) => <circle key={xx} cx={xx} cy={0} r={12} fill={PAL.stone} {...stroke(4)} />)}
    </g>
  );
};

/** A task sheet (lines + checkbox, check 0..1 draws the tick). */
export const TaskSheet: React.FC<At & { check?: number; seed?: number }> = ({ check = 0, seed = 1, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobRect(-80, -100, 160, 200, 8, 440 + seed, 2)} fill={PAL.white} {...stroke(LINE * 0.9)} />
    {[-50, -20, 10, 40].map((y, i) => <path key={y} d={bowLine(-30, y, 50 - (i % 2) * 24, y, 1)} {...stroke(5, PAL.stone)} />)}
    <path d={wobRect(-62, -62, 24, 24, 4, 450 + seed, 1)} fill={PAL.white} {...stroke(4)} />
    {check > 0 && <path d={`M-58 -50 L${lerp(-58, -50, clamp(check * 2))} ${lerp(-50, -42, clamp(check * 2))} ${check > 0.5 ? `L${lerp(-50, -30, clamp(check * 2 - 1))} ${lerp(-42, -76, clamp(check * 2 - 1))}` : ''}`} fill="none" {...stroke(8, '#2E9E6B')} />}
  </g>
);

/** A pile of n sheets (slightly messy), growing upward from (x, y). Returns nothing for n ≤ 0. */
export const PaperPile: React.FC<{ x: number; y: number; n: number; s?: number; topple?: number }> = ({ x, y, n, s = 1, topple = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => {
      const dx = (rand(i * 7 + 1) - 0.5) * 34 + topple * i * i * 0.6, rot = (rand(i * 13 + 2) - 0.5) * 10 + topple * i * 1.6;
      return <path key={i} transform={`translate(${dx} ${-i * 15}) rotate(${rot})`} d={wobRect(-90, -14, 180, 18, 4, 460 + i, 1.5)} fill={i % 5 === 4 ? '#F7F0DC' : PAL.white} {...stroke(LINE * 0.7)} />;
    })}
  </g>
);

/** A tear-off calendar sheet that says «بكرة». */
export const CalendarSheet: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobRect(-90, -80, 180, 160, 10, 471, 2)} fill={PAL.white} {...stroke()} />
    <path d="M-90 -80 L90 -80 L90 -40 L-90 -40Z" fill={PAL.red} {...stroke()} />
    {[-50, 0, 50].map((xx) => <circle key={xx} cx={xx} cy={-80} r={8} fill={PAL.white} {...stroke(4)} />)}
    <text x={0} y={40} textAnchor="middle" direction="rtl" {...AR} fontSize={62} fill={INK}>بكرة</text>
  </g>
);

export const BeanBag: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={closedPath([[-200, 0], [-230, -90], [-170, -190], [-40, -230], [120, -210], [220, -120], [220, -20], [150, 10]])} fill={PAL.blue} {...stroke()} />
    <path d="M-120 -150 q 60 30 130 0 M40 -190 q 40 40 120 30" fill="none" {...stroke(LINE * 0.6)} opacity={0.5} />
  </g>
);

export const DeskTable: React.FC<At & { w?: number }> = ({ w = 620, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={wobRect(-w / 2, 0, w, 40, 8, 481, 2)} fill={PAL.wood} {...stroke()} />
    <path d={`M${-w / 2 + 40} 40 L${-w / 2 + 40} 330 M${w / 2 - 40} 40 L${w / 2 - 40} 330`} {...stroke(LINE * 2.2, PAL.woodDeep)} />
  </g>
);

/** A window; night 0..1 darkens the sky outside and adds a moon. */
export const Window: React.FC<At & { night?: number; w?: number; h?: number; children?: React.ReactNode }> = ({ night = 0, w = 300, h = 360, children, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <clipPath id={`win${Math.round(a.x)}`}><rect x={-w / 2} y={-h / 2} width={w} height={h} /></clipPath>
    <g clipPath={`url(#win${Math.round(a.x)})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#BFDDF2" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#1D3352" opacity={clamp(night)} />
      <circle cx={w * 0.22} cy={-h * 0.22} r={34} fill={night > 0.5 ? '#F3EBD2' : '#FFF6D8'} opacity={0.4 + night * 0.6} />
      {children}
    </g>
    <path d={wobRect(-w / 2, -h / 2, w, h, 6, 491, 2)} fill="none" {...stroke(LINE * 1.6, PAL.woodDeep)} />
    <path d={`M0 ${-h / 2} L0 ${h / 2} M${-w / 2} 0 L${w / 2} 0`} {...stroke(LINE * 1.2, PAL.woodDeep)} />
  </g>
);

export const Fly: React.FC<{ x: number; y: number; f: number; o?: number }> = ({ x, y, f, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <ellipse cx={-10} cy={-10} rx={12} ry={7 + Math.abs(Math.sin(f * 2.2)) * 6} fill={PAL.white} opacity={0.8} {...stroke(3)} />
    <ellipse cx={10} cy={-10} rx={12} ry={7 + Math.abs(Math.sin(f * 2.2 + 1)) * 6} fill={PAL.white} opacity={0.8} {...stroke(3)} />
    <circle cx={0} cy={0} r={9} fill={INK} />
  </g>
);

export const LilyPad: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d="M0 0 L90 -16 A 96 34 0 1 1 64 22 Z" fill="#6DBE8C" {...stroke()} />
    <path d="M0 0 L-60 -6 M0 0 L-30 20 M0 0 L30 22" {...stroke(LINE * 0.5, '#3E8E5E')} />
  </g>
);

export const Rock: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d={closedPath([[-170, 0], [-160, -60], [-90, -110], [10, -120], [110, -96], [170, -40], [170, 0]])} fill={PAL.stone} {...stroke()} />
    <path d="M-80 -70 q 30 -16 60 0 M50 -70 q 20 -10 40 4" fill="none" {...stroke(LINE * 0.6)} opacity={0.5} />
  </g>
);

export const Reeds: React.FC<At & { f: number }> = ({ f, ...a }) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    {[-40, -10, 22, 50].map((xx, i) => (
      <g key={xx} transform={`rotate(${Math.sin(f / 22 + i) * 3} ${xx} 0)`}>
        <path d={`M${xx} 0 Q${xx - 8} -120 ${xx + 4} -${200 + i * 26}`} fill="none" {...stroke(LINE * 1.1, '#3E8E5E')} />
        {i % 2 === 0 && <path d={wobRect(xx - 10, -(200 + i * 26) - 10, 20, 64, 10, 500 + i, 1)} fill={PAL.woodDeep} {...stroke(LINE * 0.6)} />}
      </g>
    ))}
  </g>
);

/** Ripples on water (t cycles 0..1). */
export const Ripple: React.FC<{ x: number; y: number; t: number; r?: number }> = ({ x, y, t, r = 140 }) => (
  <ellipse cx={x} cy={y} rx={r * (0.4 + t)} ry={r * 0.18 * (0.4 + t)} fill="none" {...stroke(5, PAL.white)} opacity={0.6 * (1 - t)} />
);

/** A thought bubble with a big «؟» (pop 0..1). */
export const ThoughtBubble: React.FC<At & { pop: number }> = ({ pop, ...a }) => {
  if (pop <= 0) return null;
  return (
    <g transform={`${T(a)} scale(${0.4 + 0.6 * clamp(pop)})`} opacity={clamp(pop * 2)}>
      <circle cx={-70} cy={110} r={14} fill={PAL.white} {...stroke(4)} />
      <circle cx={-44} cy={70} r={22} fill={PAL.white} {...stroke(5)} />
      <path d={wobEllipse(30, -20, 110, 84, 511, 0.08, 12)} fill={PAL.white} {...stroke()} />
      <text x={30} y={20} textAnchor="middle" {...AR} fontSize={120} fill={PAL.red}>؟</text>
    </g>
  );
};

export const Pen: React.FC<At> = (a) => (
  <g transform={T(a)} opacity={a.o ?? 1}>
    <path d="M-6 -70 L6 -70 L6 20 L0 36 L-6 20Z" fill={PAL.blue} {...stroke(LINE * 0.7)} />
  </g>
);
