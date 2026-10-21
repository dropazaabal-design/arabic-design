import React from 'react';
import { Easing, interpolate } from 'remotion';
import { TITLE, BODY } from '../fonts';
import { Character, type CharacterProps } from '../kit/characters/Character';
import { EXPRESSIONS, mixFace, type Expr, type Face } from '../kit/characters/face';
import type { Gesture } from '../kit/characters/hands';
import { POSES, type PoseName, type Stance } from '../kit/characters/poses';
import { mixPose, type Pose } from '../kit/characters/skeleton';
import { hash, INK, PAL } from '../kit/style';
import LINES from '../../timing/lines.json';
import WORDS from '../../timing/words.json';
import SHOTLIST from '../../narrative/shotlist.json';

export const FPS = 60, W = 1920, H = 1080;
type Word = { line: number; i: number; word: string; start: number; end: number };
const words = WORDS as Word[];
const lines = LINES.lines;

// ——— the timeline: one shot per line (line 86 is two); the cut lands a little before the voice ———
export type ShotTiming = { id: number; line: number; from: number; to: number; speech: [number, number]; words: Word[]; meta: (typeof SHOTLIST)[number] };
export const TIMELINE: ShotTiming[] = (() => {
  const out: ShotTiming[] = [];
  let prevEnd = 0;
  SHOTLIST.forEach((s, k) => {
    const L = lines.find((l) => l.id === s.line)!;
    const lw = words.filter((w) => w.line === s.line);
    const part = s.part as [number, number | null] | null;
    const ws = part ? lw.slice(part[0], part[1] ?? undefined) : lw;
    const sp0 = part && part[0] > 0 ? ws[0].start : L.start;
    const sp1 = part && part[1] != null ? lw[part[1]].start : L.end;
    const lead = k === 0 ? 0 : Math.min(0.22, (sp0 - prevEnd) * 0.6);
    out.push({ id: s.id, line: s.line, from: k === 0 ? 0 : Math.round((sp0 - lead) * FPS), to: 0, speech: [sp0, sp1], words: ws, meta: s });
    prevEnd = sp1;
  });
  out.forEach((s, k) => { s.to = k + 1 < out.length ? out[k + 1].from : LINES.frames; });
  return out;
})();
export const TOTAL_FRAMES = LINES.frames;

// ——— per-shot context ———
export type Ctx = {
  f: number; dur: number; t: number; id: number;
  /** local frame where the first word containing `s` starts (or ends, with end=true); falls back to the speech start */
  at: (s: string, end?: boolean, nth?: number) => number;
  /** local frame of word i (index within the line) */
  w: (i: number) => number;
  sp: [number, number]; // speech start/end, local frames
  p: (from: number, len?: number, e?: (t: number) => number) => number; // 0..1 progress
  words: Word[]; text: string;
};
const norm = (s: string) => s.replace(/[^ء-ي0-9]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
export const makeCtx = (s: ShotTiming, f: number): Ctx => {
  const base = s.from;
  const lf = (sec: number) => Math.round(sec * FPS) - base;
  return {
    f, dur: s.to - s.from, t: f / FPS, id: s.id, words: s.words, text: s.words.map((w) => w.word).join(' '),
    at: (q, end = false, nth = 0) => {
      const m = s.words.filter((w) => norm(w.word).includes(norm(q)));
      const w = m[Math.min(nth, m.length - 1)];
      return w ? lf(end ? w.end : w.start) : lf(s.speech[0]);
    },
    w: (i) => { const w = words.find((x) => x.line === s.line && x.i === i); return w ? lf(w.start) : lf(s.speech[0]); },
    sp: [lf(s.speech[0]), lf(s.speech[1])],
    p: (from, len = 18, e = ease.inOut) => interpolate(f, [from, from + Math.max(1, len)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e }),
  };
};

// ——— easing and keys ———
export const ease = {
  inOut: Easing.bezier(0.65, 0, 0.35, 1), out: Easing.bezier(0.22, 1, 0.36, 1), in: Easing.bezier(0.55, 0, 1, 0.45),
  back: Easing.bezier(0.34, 1.56, 0.64, 1), lin: (t: number) => t,
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Piecewise keys [frame, value]: eased between keys, held outside. */
export const k = (f: number, keys: [number, number][], e = ease.inOut) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return mix(va, vb, e((f - a) / Math.max(1, b - a))); }
  }
  return keys[keys.length - 1][1];
};
/** Damped spring settle from 0 to 1 starting at frame `from` (no overshoot past 4%). */
export const settle = (f: number, from: number, w = 9) => { const t = Math.max(0, (f - from) / FPS); return 1 - (1 + w * t) * Math.exp(-w * t); };

// ——— poses and faces over time ———
type PoseKey = [number, PoseName | Stance | Pose, number?];
const asStance = (v: PoseName | Stance | Pose): { p: Pose; hands?: Stance['hands'] } => (typeof v === 'string' ? POSES[v] : 'p' in v ? v : { p: v });
/** Pose track: each key blends in from the previous over its duration (default 16 frames, eased). Hands switch at the blend midpoint. */
export const poseAt = (f: number, keys: PoseKey[]) => {
  let cur = asStance(keys[0][1]);
  let p = cur.p, hands = cur.hands;
  for (const [at, v, d = 16] of keys.slice(1)) {
    if (f < at) break;
    const nx = asStance(v);
    const t = ease.inOut(Math.min(1, (f - at) / d));
    p = mixPose(p, nx.p, t);
    if (t > 0.5 && nx.hands) hands = nx.hands;
    cur = nx;
  }
  return { p, hands };
};
type FaceKey = [number, Expr | Face, number?];
export const faceAt = (f: number, keys: FaceKey[]) => {
  const as = (v: Expr | Face) => (typeof v === 'string' ? EXPRESSIONS[v] : v);
  let fc = as(keys[0][1]);
  for (const [at, v, d = 12] of keys.slice(1)) {
    if (f < at) break;
    fc = mixFace(fc, as(v), ease.inOut(Math.min(1, (f - at) / d)));
  }
  return fc;
};
/** Natural blinks: about every 3–4 s per character, 7 frames long, seeded so characters don't blink together. */
export const blinkAt = (f: number, seed: number) => {
  const period = 190 + Math.floor(hash(seed) * 70);
  const ph = (f + Math.floor(hash(seed * 3.1) * period)) % period;
  return ph < 7 ? Math.sin((ph / 7) * Math.PI) : 0;
};
/** Mouth movement while a character speaks between frames a and b. */
export const talkAt = (f: number, a: number, b: number, seed = 1) => {
  if (f < a || f > b) return 0;
  const env = Math.min(1, (f - a) / 4, (b - f) / 4);
  return env * (0.18 + 0.42 * Math.abs(Math.sin(f * 0.47 + seed) * Math.cos(f * 0.21 + seed * 2)));
};

/** A character on stage with its blink and talk handled. */
export const Actor: React.FC<Omit<CharacterProps, 'p' | 'hands'> & { f: number; pose: { p: Pose; hands?: { R: Gesture; L: Gesture } }; seed?: number; say?: [number, number]; hands?: CharacterProps['hands'] }> = ({ f, pose, seed = 1, say, hands, ...rest }) => (
  <Character {...rest} p={pose.p} hands={hands ?? pose.hands} blink={blinkAt(f, seed)} talk={say ? talkAt(f, say[0], say[1], seed) : 0} />
);

// ——— camera and stage ———
export type Cam = { x: number; y: number; z: number };
export const CAM0: Cam = { x: 960, y: 540, z: 1 };
export const camMix = (a: Cam, b: Cam, t: number): Cam => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), z: mix(a.z, b.z, t) });
export const toScreen = (c: Cam, q: [number, number]): [number, number] => [(q[0] - c.x) * c.z + W / 2, (q[1] - c.y) * c.z + H / 2];
/** The world is drawn in 1920×1080 units; the camera picks the part shown. `over` is HTML (captions, bubbles) above it. */
export const Stage: React.FC<{ cam?: Cam; bg?: string; children?: React.ReactNode; over?: React.ReactNode }> = ({ cam = CAM0, bg = PAL.paper, children, over }) => (
  <div style={{ position: 'absolute', inset: 0, background: bg, overflow: 'hidden' }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(${W / 2} ${H / 2}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>{children}</g>
    </svg>
    {over}
  </div>
);

/** Paper background for explanatory scenes: a calm field with a faint grain of hand strokes (static). */
export const Paper: React.FC<{ tint?: string; seed?: number }> = ({ tint = PAL.paper, seed = 3 }) => (
  <g>
    <rect x={-400} y={-400} width={2720} height={1880} fill={tint} />
    {Array.from({ length: 26 }, (_, i) => {
      const x = hash(seed + i) * 1920, y = hash(seed * 7 + i) * 1080, l = 40 + hash(i * 3 + seed) * 90;
      return <path key={i} d={`M${x} ${y} q${l / 2} ${-4 + hash(i) * 8} ${l} 0`} stroke={INK} strokeOpacity={0.05} strokeWidth={2} fill="none" />;
    })}
  </g>
);

// ——— words on screen (short, large, right-to-left) ———
export const Cap: React.FC<{ text: string; o: number; top?: number; size?: number; color?: string; x?: number; w?: number; pill?: boolean; weight?: number }> = ({ text, o, top = 70, size = 66, color = INK, x, w = 1500, pill = true, weight = 800 }) => {
  if (o <= 0.001) return null;
  const left = x !== undefined ? x - w / 2 : (W - w) / 2;
  return <div style={{ position: 'absolute', top, left, width: w, display: 'flex', justifyContent: 'center', opacity: Math.min(1, o), transform: `translateY(${mix(18, 0, Math.min(1, o))}px)` }}>
    <div dir="rtl" lang="ar" style={{ fontFamily: TITLE, fontWeight: weight, fontSize: size, lineHeight: 1.3, color, padding: pill ? '6px 34px 14px' : 0, borderRadius: 28, background: pill ? 'rgba(243,241,236,0.88)' : 'none', textAlign: 'center' }}>{text}</div>
  </div>;
};
/** A label chip pinned to a world point (screen coordinates passed in). */
export const Tag: React.FC<{ text: string; at: [number, number]; o: number; color?: string; bg?: string; size?: number }> = ({ text, at, o, color = '#FFFFFF', bg = PAL.calm, size = 40 }) => {
  if (o <= 0.001) return null;
  return <div dir="rtl" lang="ar" style={{ position: 'absolute', left: at[0], top: at[1], transform: `translate(-50%, -50%) scale(${mix(0.6, 1, Math.min(1, o))})`, opacity: Math.min(1, o), fontFamily: BODY, fontWeight: 800, fontSize: size, color, background: bg, borderRadius: 999, padding: '2px 26px 8px', whiteSpace: 'nowrap', boxShadow: '0 4px 0 rgba(42,47,58,0.18)' }}>{text}</div>;
};
/** Dialogue or thought attached to a speaker: tail points at `to` (screen). */
export const Say: React.FC<{ text: string; to: [number, number]; o: number; above?: number; size?: number; think?: boolean; w?: number }> = ({ text, to, o, above = 150, size = 46, think = false, w }) => {
  if (o <= 0.001) return null;
  const top = to[1] - above;
  return <div style={{ position: 'absolute', left: to[0], top, transform: `translate(-50%, -100%) scale(${mix(0.7, 1, Math.min(1, o))})`, transformOrigin: '50% 100%', opacity: Math.min(1, o) }}>
    <div dir="rtl" lang="ar" style={{ fontFamily: BODY, fontWeight: 700, fontSize: size, lineHeight: 1.35, color: INK, background: '#FFFFFF', border: `4px solid ${INK}`, borderRadius: think ? 60 : 30, padding: '10px 30px 16px', maxWidth: w ?? 900, width: w, textAlign: 'center', boxShadow: '0 5px 0 rgba(42,47,58,0.15)' }}>{text}</div>
    {think
      ? <><div style={{ position: 'absolute', left: '50%', bottom: -30, width: 22, height: 22, borderRadius: 99, background: '#FFF', border: `4px solid ${INK}` }} /><div style={{ position: 'absolute', left: 'calc(50% + 14px)', bottom: -60, width: 13, height: 13, borderRadius: 99, background: '#FFF', border: `3px solid ${INK}` }} /></>
      : <svg width={60} height={50} style={{ position: 'absolute', left: 'calc(50% - 30px)', bottom: -44 }}><path d="M8 2 L30 46 L44 2" fill="#FFFFFF" stroke={INK} strokeWidth={4} strokeLinejoin="round" /><rect x={10} y={0} width={32} height={6} fill="#FFFFFF" /></svg>}
  </div>;
};
