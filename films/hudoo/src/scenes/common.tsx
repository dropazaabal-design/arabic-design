import React from 'react';
import { BODY, TITLE } from '../fonts';
import { Character } from '../kit/characters/Character';
import type { Who } from '../kit/characters/cast';
import type { Expr, Face } from '../kit/characters/face';
import type { Gesture } from '../kit/characters/hands';
import { pose, walkPhase, type Pose } from '../kit/characters/skeleton';
import { MEETING, MeetingBack, MeetingTableFront } from '../kit/places/MeetingRoom';
import { INK, PAL, hash, sketch } from '../kit/style';
import { Actor, blinkAt, type Cam } from '../film/engine';

// Shared staging for the scenes. Seats: the meeting cast keeps the same chairs all film long.
export const SEAT = MEETING.seats.map((s) => s.x);
export const MEET_FEET = MEETING.feetY, MEET_S = MEETING.scale;
export const MEET_CAST: Who[] = ['mona', 'att1', 'hadi', 'att2', 'jaser', 'salim']; // seat 5 is Salim's own chair
/** Seated at the meeting table, hands resting on the top. */
export const atTable = (o: Partial<Pose> = {}) => pose({ sit: 1, footR: [50, 0], footL: [62, 0], R: { hand: [58, -156] }, L: { hand: [76, -154] }, ...o });

export type SeatSpec = { who: Who; face?: Face | Expr; p?: Pose; hands?: { R?: Gesture; L?: Gesture }; facing?: 1 | -1; say?: [number, number]; hold?: { R?: React.ReactNode; L?: React.ReactNode }; o?: number };
/** The meeting room with people in their seats: back wall, the seated, then the table in front of them. */
export const Meeting: React.FC<{ f: number; seats: (SeatSpec | null)[]; extra?: React.ReactNode; front?: React.ReactNode }> = ({ f, seats, extra, front }) => (
  <g>
    <MeetingBack t={f / 60} />
    {seats.map((s, i) => s && <Actor key={i} f={f} seed={i * 3 + 1} who={s.who} pose={{ p: s.p ?? atTable(), hands: undefined }} hands={s.hands} face={s.face ?? 'listening'} x={SEAT[i]} y={MEET_FEET} s={MEET_S} facing={s.facing ?? 1} say={s.say} hold={s.hold} o={s.o} />)}
    {extra}
    <MeetingTableFront />
    {front}
  </g>
);

/** Screen point of a seated character's head (for bubbles and tags), given a camera. */
export const seatHead = (i: number, cam: Cam): [number, number] => {
  const wx = SEAT[i], wy = MEET_FEET - 330 * MEET_S;
  return [(wx - cam.x) * cam.z + 960, (wy - cam.y) * cam.z + 540];
};

/** A short Arabic word drawn in the world (labels on diagrams). */
export const WLabel: React.FC<{ x: number; y: number; text: string; size?: number; color?: string; o?: number; w?: number; bg?: string }> = ({ x, y, text, size = 46, color = INK, o = 1, w = 520, bg }) => o <= 0 ? null : (
  <foreignObject x={x - w / 2} y={y - size * 0.95} width={w} height={size * 1.9} opacity={o}>
    <div dir="rtl" lang="ar" style={{ fontFamily: TITLE, fontWeight: 800, fontSize: size, color, textAlign: 'center', lineHeight: 1.5 }}>
      <span style={{ background: bg, borderRadius: 18, padding: bg ? '0 18px 6px' : 0 }}>{text}</span>
    </div>
  </foreignObject>
);

/** A soft circle "window" on the chest showing what is felt inside: a rose swirl that turns and bubbles. */
export const ChestSwirl: React.FC<{ x: number; y: number; r: number; t: number; amount: number; color?: string }> = ({ x, y, r, t, amount, color = PAL.warn }) => {
  if (amount <= 0) return null;
  const pts = Array.from({ length: 60 }, (_, i) => {
    const u = i / 59, a = t * 2.6 + u * Math.PI * 4.5, rr = r * (0.15 + 0.7 * u) * amount;
    return `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr * 0.9).toFixed(1)}`;
  }).join(' ');
  return <g>
    <circle cx={x} cy={y} r={r * Math.min(1, amount * 1.4)} fill="#FFFFFF" opacity={0.55} stroke={INK} strokeWidth={3} strokeDasharray="10 8" />
    <path d={pts} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
    {[0, 1, 2, 3].map((k) => { const ph = (t * 1.4 + k * 0.25) % 1; return <circle key={k} cx={x + Math.sin(k * 2.1) * r * 0.45} cy={y + r * 0.5 - ph * r} r={4 + 4 * ph} fill="none" stroke={color} strokeWidth={2.5} opacity={(1 - ph) * amount} />; })}
  </g>;
};

/** Curved arrow drawn progressively (0..1). */
export const Arrow: React.FC<{ from: [number, number]; to: [number, number]; bend?: number; p: number; color?: string; w?: number; seed?: number }> = ({ from, to, bend = 0, p, color = INK, w = 6 }) => {
  if (p <= 0) return null;
  const mx = (from[0] + to[0]) / 2 - (to[1] - from[1]) * bend, my = (from[1] + to[1]) / 2 + (to[0] - from[0]) * bend;
  const q = (u: number): [number, number] => [(1 - u) ** 2 * from[0] + 2 * (1 - u) * u * mx + u * u * to[0], (1 - u) ** 2 * from[1] + 2 * (1 - u) * u * my + u * u * to[1]];
  const n = 24, pts = Array.from({ length: n + 1 }, (_, i) => q((i / n) * p));
  const end = pts[n], prev = pts[n - 1];
  const a = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
  return <g>
    <path d={`M${pts.map((v) => v.map((x) => x.toFixed(1)).join(' ')).join(' L')}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
    {p > 0.9 && <path d={`M${end[0] - Math.cos(a - 0.5) * 22} ${end[1] - Math.sin(a - 0.5) * 22} L${end[0]} ${end[1]} L${end[0] - Math.cos(a + 0.5) * 22} ${end[1] - Math.sin(a + 0.5) * 22}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />}
  </g>;
};

/** A floor line for paper scenes so characters stand on something. */
export const Floor: React.FC<{ y?: number; seed?: number }> = ({ y = 900, seed = 5 }) => (
  <g>
    <rect x={-400} y={y} width={2720} height={700} fill={PAL.paperShade} />
    <path d={sketch([[-400, y], [2320, y]], seed, 2)} stroke={INK} strokeWidth={3} fill="none" opacity={0.5} />
  </g>
);

export { Character, blinkAt, hash, BODY };

/** A camera that never shows past the edges of the 1920×1080 world. */
export const cam = (x: number, y: number, z: number): Cam => ({ x: Math.min(Math.max(x, 960 / z), 1920 - 960 / z), y: Math.min(Math.max(y, 540 / z), 1080 - 540 / z), z });

/**
 * Walk from x0 to x1 between frames f0 and f1. The step phase follows the distance covered, so feet don't slide;
 * facing follows the direction. Returns the x, the facing and the walking pose (stride 44 at scale s).
 */
export const walkTo = (f: number, f0: number, f1: number, x0: number, x1: number, s = 1.45, base: Partial<Pose> = { lean: 4 }) => {
  const u = Math.min(1, Math.max(0, (f - f0) / Math.max(1, f1 - f0)));
  const x = x0 + (x1 - x0) * (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)) * 0.25 + (x1 - x0) * u * 0.75;
  const moving = Math.max(0, Math.min(1, (f - f0) / 8, (f1 - f) / 8));
  const ph = (Math.abs(x - x0) / (44 * s)) * Math.PI;
  return { x, facing: (x1 >= x0 ? 1 : -1) as 1 | -1, p: pose({ ...base, ...walkPhase(ph, 44, moving), lean: (base.lean ?? 4) * moving }), moving };
};
/** Head nods: n dips of `amp` degrees starting at frame a (one dip every 16 frames). */
export const nod = (f: number, a: number, n = 2, amp = 9) => (f < a || f > a + n * 16 ? 0 : Math.sin(((f - a) / 16) * Math.PI) ** 2 * amp);
/** A quick shake that dies away (laughter, a startle, a trembling hand). */
export const shake = (f: number, a: number, len = 50, amp = 3, rate = 0.9) => (f < a || f > a + len ? 0 : Math.sin((f - a) * rate) * amp * (1 - (f - a) / len));
