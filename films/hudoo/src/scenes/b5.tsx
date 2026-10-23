import React from 'react';
import { BODY } from '../fonts';
import { CAST } from '../kit/characters/cast';
import { EXPRESSIONS, type Expr, type Face } from '../kit/characters/face';
import { Hand, type Gesture } from '../kit/characters/hands';
import { joints, pose, type Pose } from '../kit/characters/skeleton';
import { Bedroom } from '../kit/places/Bedroom';
import { DESK, DeskBack, DeskFront } from '../kit/places/OfficeDesk';
import { Plan, PLAN, SingleDoor, Storm } from '../kit/metaphors';
import { Puffs } from '../kit/metaphors/util';
import { Chair, Clock, IconBreath, IconEar, IconEye, Mug, Pen, Phone, SpeechBubble } from '../kit/props';
import { INK, PAL, sketch, sketchRect } from '../kit/style';
import { Actor, CAM0, Cap, Paper, Say, Stage, camMix, ease, faceAt, k, mix, poseAt, toScreen, type Cam, type Ctx } from '../film/engine';
import type { ShotRender } from '../film/Film';
import { Arrow, ChestSwirl, WLabel, cam, nod, shake, walkTo } from './common';

// Chapter 7's end (the door, the second night, the plan, the friend) and chapter 8 «التهدئة» at the office desk: shots 81–100.

type P2 = [number, number];
type Hands = { R: Gesture; L: Gesture };
const S = 1.45;
const F = (base: Expr, o: Partial<Face> = {}): Face => ({ ...EXPRESSIONS[base], ...o });
const cl = (v: number) => Math.max(0, Math.min(1, v));
const st = (p: Partial<Pose> | Pose, R: Gesture = 'relaxed', L: Gesture = 'relaxed'): { p: Pose; hands: Hands } => ({ p: pose(p), hands: { R, L } });
const KNEES: Partial<Pose> = { sit: 1, footR: [52, 0], footL: [64, 0] };
/** Seated at the office desk, hands near the keyboard. */
const desk = (o: Partial<Pose> = {}): Partial<Pose> => ({ ...KNEES, R: { hand: [76, -148] }, L: { hand: [90, -146] }, ...o });

// world points of a posed character (for bubbles, breath lines and the chest swirl)
const toW = (x: number, y: number, facing: 1 | -1, q: P2, s = S): P2 => [x + q[0] * s * facing, y + q[1] * s];
const headOf = (p: Pose, x: number, y = 860, facing: 1 | -1 = 1, s = S) => toW(x, y, facing, joints(p).headC, s);
const chestOf = (p: Pose, x: number, y = 860, facing: 1 | -1 = 1, s = S) => {
  const j = joints(p), L = (p.lean * Math.PI) / 180;
  return toW(x, y, facing, [j.hip[0] + Math.sin(L) * 58 + 4, j.hip[1] - Math.cos(L) * 58], s);
};
const noseOf = (p: Pose, x: number, y = 860, facing: 1 | -1 = 1, s = S) => {
  const j = joints(p), a = ((p.lean * 0.6 + p.head) * Math.PI) / 180, lx = 24 * p.turn + 16, ly = 6;
  return toW(x, y, facing, [j.headC[0] + lx * Math.cos(a) - ly * Math.sin(a), j.headC[1] + lx * Math.sin(a) + ly * Math.cos(a)], s);
};

// ——— small props drawn for this batch ———

/** A key ring with two keys, ring at the origin, keys hanging down (~40 units). */
const Keys: React.FC<{ swing?: number }> = ({ swing = 0 }) => (
  <g transform={`rotate(${swing})`}>
    {[[-16, PAL.focus], [12, PAL.calm]].map(([a, col]) => (
      <g key={a as number} transform={`rotate(${a})`}>
        <path d="M0 16 L0 38 M0 30 h5 M0 35 h6" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
        <path d="M0 16 L0 38 M0 30 h5 M0 35 h6" stroke={PAL.metal} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        <circle cx={0} cy={12} r={6.5} fill={col as string} stroke={INK} strokeWidth={2} />
        <circle cx={0} cy={12} r={2} fill={PAL.paper} />
      </g>
    ))}
    <circle r={7} fill="none" stroke={INK} strokeWidth={4} />
    <circle r={7} fill="none" stroke={PAL.metal} strokeWidth={2} />
  </g>
);
const HOOK: P2 = [748, 512];
const KeyHook: React.FC = () => (
  <g>
    <path d={sketchRect(HOOK[0] - 16, HOOK[1] - 30, 32, 22, 5, 0.6)} fill={PAL.wood} stroke={INK} strokeWidth={2.4} />
    <path d={`M${HOOK[0]} ${HOOK[1] - 12} v14 q0 8 -7 6`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    <path d={`M${HOOK[0]} ${HOOK[1] - 12} v14 q0 8 -7 6`} fill="none" stroke={PAL.metal} strokeWidth={2.4} strokeLinecap="round" />
  </g>
);

/** A mint sticky note (hand units, centred), with «صباحًا» written from its right edge as `p` goes 0..1. */
const NOTE = '#CFE7E0';
const StickyNote: React.FC<{ p: number }> = ({ p }) => (
  <g>
    <path d={sketchRect(-21, -18, 42, 36, 5, 0.4)} fill={NOTE} stroke={INK} strokeWidth={1.4} />
    <path d="M-21 -18 h42 v6 h-42 Z" fill="#A9D2C6" />
    {p > 0 && <foreignObject x={-21} y={-13} width={42} height={30}>
      <div dir="rtl" lang="ar" style={{ width: 42, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BODY, fontWeight: 700, fontSize: 11.5, lineHeight: 1, color: '#2C4A7C', clipPath: `inset(0 0 0 ${(1 - cl(p)) * 100}%)` }}>صباحًا</div>
    </foreignObject>}
  </g>
);

/** A phone lying on a table, seen from above-front: (x, y) = middle of its base on the table. */
const PhoneFlat: React.FC<{ x: number; y: number; lit?: number; back?: boolean; note?: number; buzz?: number; t?: number }> = ({ x, y, lit = 0, back = false, note = 0, buzz = 0, t = 0 }) => {
  const dx = buzz * Math.sin(t * Math.PI * 2 * 19) * 3;
  return <g transform={`translate(${x + dx} ${y})`}>
    {lit > 0 && <ellipse cx={0} cy={-16} rx={96} ry={40} fill={PAL.screenGlow} opacity={0.6 * lit} />}
    <ellipse cx={3} cy={3} rx={46} ry={5} fill={INK} opacity={0.2} />
    <path d="M-42 -2 L42 -2 L42 3 Q42 5 40 5 L-40 5 Q-42 5 -42 3 Z" fill="#262C38" stroke={INK} strokeWidth={2} />
    <path d="M-42 -2 L42 -2 L35 -16 L-35 -16 Z" fill={back ? '#4A5568' : '#3B4456'} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
    {!back && <path d="M-36 -4 L36 -4 L30.5 -14 L-30.5 -14 Z" fill={PAL.screen} />}
    {!back && lit > 0 && <path d="M-36 -4 L36 -4 L30.5 -14 L-30.5 -14 Z" fill={PAL.screenGlow} opacity={lit} />}
    {back && <ellipse cx={-24} cy={-10} rx={6} ry={3} fill="#3B4456" stroke={INK} strokeWidth={1.2} />}
    {note > 0 && <path d="M-12 -3 L22 -3 L18 -15 L-9 -15 Z" fill={NOTE} stroke={INK} strokeWidth={1.6} opacity={cl(note)} />}
    {buzz > 0 && [-1, 1].map((s) => <path key={s} d={`M${s * 52} -18 q${s * 8} 9 0 18 M${s * 62} -20 q${s * 10} 11 0 22`} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" opacity={buzz} />)}
  </g>;
};

/** A lock screen with a new notification card (no text: a wine-red avatar and grey lines). Screen units 360×720. */
const Notice: React.FC = () => (
  <g>
    <rect width={360} height={720} fill={PAL.skyNight} />
    <path d="M0 470 Q90 420 180 455 T360 430 V720 H0 Z" fill="#3A4766" />
    <path d="M0 560 Q110 520 210 560 T360 545 V720 H0 Z" fill="#45547A" />
    <circle cx={180} cy={120} r={34} fill="#E8EDF2" /><circle cx={198} cy={108} r={30} fill={PAL.skyNight} />
    <rect x={18} y={236} width={324} height={118} rx={24} fill="#F3F1EC" stroke={INK} strokeWidth={3} />
    <circle cx={296} cy={295} r={30} fill={PAL.provoke} stroke={INK} strokeWidth={3} />
    <path d="M248 272 H130 M248 300 H60 M248 326 H150" stroke="#9AA3AE" strokeWidth={12} strokeLinecap="round" />
  </g>
);

/** Jaser's message on the office monitor: abstract chat blocks, the provoking bubble a jagged wine-red line. */
const ChatBlocks: React.FC<{ jag?: number }> = ({ jag = 1 }) => {
  const { x, y, w, h } = DESK.screen;
  const zig = Array.from({ length: 11 }, (_, i) => `${i ? 'L' : 'M'}${x + w - 48 - i * 22} ${y + 118 + (i % 2 ? -12 : 12) * jag}`).join(' ');
  return <g>
    <rect x={x} y={y} width={w} height={h} fill="#E6EBEE" />
    <rect x={x} y={y} width={w} height={46} fill="#F8F9FA" />
    <path d={`M${x} ${y + 46} h${w}`} stroke="#D3D9DF" strokeWidth={2} />
    <circle cx={x + w - 34} cy={y + 23} r={15} fill={PAL.provoke} stroke={INK} strokeWidth={2} />
    <path d={`M${x + w - 62} ${y + 23} h-80`} stroke={PAL.textSoft} strokeWidth={7} strokeLinecap="round" opacity={0.6} />
    <rect x={x + w - 300} y={y + 72} width={280} height={92} rx={18} fill="#FFFFFF" stroke={INK} strokeWidth={2.4} />
    <path d={zig} stroke={PAL.provoke} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <rect x={x + 20} y={y + 180} width={170} height={48} rx={16} fill="#CBE6DD" stroke={INK} strokeWidth={2.4} />
    <path d={`M${x + 170} ${y + 204} h-120`} stroke={PAL.textSoft} strokeWidth={6} strokeLinecap="round" opacity={0.5} />
  </g>;
};

/** The problem, as a box on the desk: slate, a lid, a jagged mark. (x, y) = middle of its base. */
const TroubleBox: React.FC<{ x: number; y?: number; wob?: number }> = ({ x, y = DESK.deskTop, wob = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${wob} 0 0)`}>
    <ellipse cx={4} cy={0} rx={58} ry={6} fill={INK} opacity={0.15} />
    <path d={sketchRect(-48, -68, 96, 68, 81, 0.8)} fill={PAL.storm} stroke={INK} strokeWidth={3.6} />
    <path d={sketchRect(-53, -80, 106, 16, 82, 0.8)} fill={PAL.chairDark} stroke={INK} strokeWidth={3.6} />
    <path d="M32 -42 L20 -26 L8 -46 L-4 -24 L-16 -44 L-30 -28" fill="none" stroke={PAL.provokeLight} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

/** A wall air conditioner; `on` 0..1 shows the cool air falling in slow waves and a soft hum. */
const AC: P2 = [790, 226];
const AirCon: React.FC<{ on: number; t: number }> = ({ on, t }) => {
  const [x, y] = AC;
  return <g>
    <path d={sketchRect(x - 150, y - 34, 300, 70, 91, 1)} fill="#F7F5F1" stroke={INK} strokeWidth={3.6} />
    {[16, 25].map((d) => <path key={d} d={`M${x - 132} ${y + d} H${x + 132}`} stroke={INK} strokeWidth={2.2} opacity={0.45} />)}
    <circle cx={x + 128} cy={y - 18} r={4.5} fill={PAL.calm} />
    {on > 0 && [0, 1, 2, 3, 4].map((i) => {
      const u = (t * 0.45 + i * 0.2) % 1, xx = x - 110 + i * 55, yy = y + 46 + u * 130;
      return <path key={i} d={`M${xx} ${yy} q10 14 0 28 t0 28`} stroke={PAL.water} strokeWidth={6} fill="none" strokeLinecap="round" opacity={on * Math.sin(u * Math.PI)} />;
    })}
    {on > 0 && [0, 1, 2].map((i) => {
      const u = (t * 0.8 + i / 3) % 1, r = 20 + u * 50;
      return <path key={i} d={`M${x + 160 + r * 0.3} ${y - r * 0.6} q${r * 0.5} ${r * 0.6} 0 ${r * 1.2}`} stroke={PAL.focus} strokeWidth={5} fill="none" strokeLinecap="round" opacity={on * (1 - u)} />;
    })}
  </g>;
};

/** Two footprints (a diagram icon in the kit's style: INK lines, one flat accent). */
const IconFeet = ({ s = 48, accent = PAL.calmLight }: { s?: number; accent?: string }) => (
  <g transform={`scale(${s / 48})`} stroke={INK} strokeWidth={3.2} strokeLinejoin="round">
    {[-1, 1].map((k) => <g key={k} transform={`translate(${k * 9} ${k * 4}) scale(${k} 1)`}>
      <path d="M-5 -4 C-7 -14 5 -15 5 -5 C5 4 4 14 0 17 C-4 15 -5 6 -5 -4 Z" fill={accent} />
      {[[-4, -16], [0, -18], [4, -16]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2} fill={accent} strokeWidth={2} />)}
    </g>)}
  </g>
);

/** The three calming tools as chips at the top right (right to left); `lit` is the one in use, `p` its light-up. */
const TOOLS = [{ name: 'التنفس', icon: <IconBreath s={50} /> }, { name: 'الجسد', icon: <IconFeet s={50} /> }, { name: 'المكان', icon: <IconEye s={50} /> }];
const ToolChips: React.FC<{ lit: number; p: number }> = ({ lit, p }) => (
  <div dir="rtl" style={{ position: 'absolute', top: 24, right: 28, display: 'flex', gap: 14 }}>
    {TOOLS.map((t, i) => {
      const on = i === lit ? cl(p) : 0;
      return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 18px 6px 12px', borderRadius: 999, background: on ? '#FFFFFF' : '#F3F1EC', border: `4px solid ${on > 0.5 ? PAL.calm : 'rgba(42,47,58,0.25)'}`, opacity: 0.72 + 0.28 * on, color: on ? INK : PAL.textSoft, transform: `scale(${1 + 0.08 * on})`, boxShadow: on ? '0 4px 0 rgba(42,47,58,0.18)' : 'none' }}>
        <svg width={60} height={60} viewBox="-30 -30 60 60">{t.icon}</svg>
        <span lang="ar" style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: INK, lineHeight: 1.3 }}>{t.name}</span>
      </div>;
    })}
  </div>
);

/** Breath drawn in through the nose (`p` 0..1 over the inhale), toward −dir. */
const Inhale: React.FC<{ nose: P2; p: number; dir?: 1 | -1; len?: number }> = ({ nose, p, dir = 1, len = 150 }) => {
  if (p <= 0 || p >= 1) return null;
  return <g>{[-1, 0, 1].map((i) => {
    const u = cl(p * 1.3 - Math.abs(i) * 0.15);
    const x0 = nose[0] + dir * (len * (1 - u) + 22), y0 = nose[1] + i * 28 * (1 - u * 0.75);
    return <path key={i} d={`M${x0 + dir * 46} ${y0 + i * 10} Q${x0 + dir * 22} ${y0 + i * 2 - 7} ${x0} ${y0}`} stroke={PAL.water} strokeWidth={7} fill="none" strokeLinecap="round" opacity={Math.sin(u * Math.PI)} />;
  })}</g>;
};
/** The out-breath: one long slow wave from the nose, growing with `p`, fading with `fade`. */
const Exhale: React.FC<{ from: P2; p: number; fade?: number; len?: number; t: number; dir?: 1 | -1 }> = ({ from, p, fade = 0, len = 400, t, dir = 1 }) => {
  if (p <= 0 || fade >= 1) return null;
  const n = 48, L = len * p;
  const pts = Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return `${(from[0] + dir * (18 + u * L)).toFixed(1)} ${(from[1] + 8 + u * 30 + Math.sin((u * L) / 36 - t * 3) * 11 * Math.min(1, u * 4)).toFixed(1)}`; });
  return <path d={`M${pts.join(' L')}`} stroke={PAL.water} strokeWidth={9} fill="none" strokeLinecap="round" opacity={1 - fade} />;
};

/** The office desk with the batch's fixtures: the air conditioner, the problem box, the mug within reach. */
const MUG_X = 885;
const DeskRoom: React.FC<{ c: Ctx; actor: React.ReactNode; screen?: React.ReactNode; back?: React.ReactNode; front?: React.ReactNode; mug?: boolean; ac?: number; box?: number }> = ({ c, actor, screen, back, front, mug = true, ac = 0, box = 0 }) => (
  <g>
    <DeskBack screen={screen} />
    <AirCon on={ac} t={c.t} />
    {back}
    {actor}
    <DeskFront mug={false} />
    <TroubleBox x={1566} wob={box} />
    {mug && <g transform={`translate(${MUG_X} ${DESK.deskTop})`}><Mug steam={0.5} t={c.t} /></g>}
    {front}
  </g>
);
const SAL = { who: 'salim' as const, seed: 41 };

// shot 100's cloud
const CLOUD: [number, number, number][] = [[1180, 420, 110], [1320, 360, 130], [1470, 410, 110], [1260, 490, 100], [1410, 500, 100], [1090, 490, 74], [1560, 490, 74]];

export const SHOTS: Record<number, ShotRender> = {
  // 81 — the feeling knocks; Salim goes to shove the door shut on «تطرده» but stops short and lowers his hands;
  //      the keys jingle toward the door on «وتعطيه», and on «مفاتيح» he takes them off the hook and keeps them.
  81: (c) => {
    const tard = c.at('تطرده'), give = c.at('وتعطيه'), keys = c.at('مفاتيح'), home = c.at('البيت');
    const cm = cam(880, 590, 1.4);
    const kn = Math.min(...[0, tard - 46, give - 34].map((a) => (c.f < a ? 1 : (c.f - a) / 64)));
    const open = k(c.f, [[6, 0], [40, 0.55]]);
    const w0 = tard - 42, w1 = tard - 14;
    const w = walkTo(c.f, w0, w1, 560, 650, S);
    const grab = keys - 2;
    const pz = c.f > w0 && c.f < w1 ? { p: w.p, hands: undefined } : poseAt(c.f, [
      [0, st({ head: 2, turn: 0.7 })],
      [w1, st({ lean: 8, head: 0, turn: 0.85, R: { hand: [86, -214] }, L: { hand: [94, -200] } }, 'stop', 'stop'), 14],
      [tard + 16, st({ lean: 2, head: 6, turn: 0.7, R: { hand: [64, -196] }, L: { hand: [74, -184] } }, 'open', 'open'), 14],
      [tard + 40, st({ head: 4, turn: 0.6 }), 22],
      [grab - 20, st({ head: 8, turn: 0.7, L: { hand: [66, -226] } }, 'relaxed', 'open'), 18],
      [grab, st({ head: 8, turn: 0.7, L: { hand: [66, -224] } }, 'relaxed', 'grip'), 4],
      [grab + 10, st({ head: 4, turn: 0.5, L: { hand: [28, -198], bend: -1 } }, 'relaxed', 'grip'), 22],
    ]);
    const p = { ...pz.p, head: pz.p.head + shake(c.f, tard + 22, 44, 6, 0.45) };
    const held = c.f >= grab;
    const swing = shake(c.f, give, 60, 12, 0.5);
    return <Stage cam={cm} over={<Cap text="لا طرد… ولا تسليم" o={c.p(home - 8, 14)} top={952} size={54} />}>
      <SingleDoor t={c.t} open={open} knock={kn} />
      <KeyHook />
      {!held && <g transform={`translate(${HOOK[0] - 6} ${HOOK[1] + 6}) scale(1.3)`}><Keys swing={swing} /></g>}
      <g opacity={1 - c.p(grab, 14)}><Arrow from={[772, 600]} to={[836, 560]} bend={0.25} p={c.p(give + 4, 26)} color={PAL.warn} /></g>
      <Actor f={c.f} {...SAL} x={c.f < w0 ? 560 : w.x} y={860} s={S} facing={1} pose={{ p, hands: pz.hands }}
        hold={held ? { L: <g transform="rotate(70) scale(0.62)"><Keys swing={-swing * 0.5} /></g> } : undefined}
        face={faceAt(c.f, [[0, F('neutral', { look: [1, 0], brow: 0.2 })], [w0, F('irritated', { look: [1, -0.1] }), 10], [tard + 16, F('calm', { look: [1, 0] }), 16], [give + 6, F('calm', { look: [0.6, 0.6] }), 12], [grab + 22, F('calm', { look: [1, 0.1] }), 16]])} />
    </Stage>;
  },

  // 82 — closer: he tells the door «أسمعك…» on «أسمعك», then sits on a chair beside it on «وسأقرر»; the knocking stops.
  82: (c) => {
    const hear = c.at('أسمعك'), dec = c.at('وسأقرر');
    const cm = cam(860, 560, 1.75), X = 640;
    const pz = poseAt(c.f, [
      [0, st({ head: 6, turn: 0.6, L: { hand: [28, -198], bend: -1 } }, 'relaxed', 'grip')],
      [hear - 16, st({ lean: 7, head: 2, turn: 0.85, R: { hand: [44, -172] }, L: { hand: [30, -200], bend: -1 } }, 'open', 'grip'), 16],
      [dec - 2, st({ ...KNEES, lean: 6, head: 4, turn: 0.75, R: { hand: [54, -128] }, L: { hand: [62, -130] } }, 'relaxed', 'grip'), 26],
      [dec + 50, st({ ...KNEES, lean: 10, head: 9, turn: 0.85, R: { hand: [54, -128] }, L: { hand: [62, -130] } }, 'relaxed', 'grip'), 50],
    ]);
    const hd = headOf(pz.p, X);
    const to = toScreen(cm, [hd[0] + 20, hd[1] - 78]);
    return <Stage cam={cm} over={<>
      <Say text="أسمعك…" to={to} o={c.p(hear - 4, 8) * (1 - c.p(dec - 8, 8))} above={14} size={50} />
      <Say text="سأقرر بعد قليل" to={to} o={c.p(dec, 8)} above={14} size={46} />
    </>}>
      <SingleDoor t={c.t} open={0.55} knock={c.f / 64} />
      <KeyHook />
      <g transform={`translate(${X} 860) scale(${S})`}><Chair facing={1} /></g>
      <Actor f={c.f} {...SAL} x={X} y={860} s={S} facing={1} pose={pz} say={[hear - 2, hear + 34]}
        hold={{ L: <g transform="rotate(70) scale(0.62)"><Keys /></g> }}
        face={faceAt(c.f, [[0, F('listening', { look: [1, 0] })], [dec + 10, F('calm', { look: [1, 0.2] }), 20]])} />
    </Stage>;
  },

  // 83 — the next night: tired on the bed's edge, rubbing his eyes; the phone lights and buzzes on «وصلت»,
  //      he turns to it on «رسالة», and reaches for it on «أخرى».
  83: (c) => {
    const came = c.at('وصلت'), msg = c.at('رسالة'), oth = c.at('أخرى');
    const cm = cam(800, 560, 1.3), X = 720;
    const rub = c.f < 70 ? Math.sin(c.f * 0.22) * 4 : 0;
    const pz = poseAt(c.f, [
      [0, st({ ...KNEES, lean: 12, head: 18, turn: 0.6, R: { hand: [50, -124] }, L: { hand: [36 + rub, -262] } }, 'relaxed', 'open')],
      [70, st({ ...KNEES, lean: 14, head: 22, turn: 0.55, bob: 3, R: { hand: [50, -124] }, L: { hand: [60, -122] } }), 24],
      [msg - 6, st({ ...KNEES, lean: 12, head: 24, turn: 0.95, R: { hand: [50, -124] }, L: { hand: [60, -122] } }), 14],
      [oth - 6, st({ ...KNEES, lean: 20, head: 22, turn: 0.95, R: { hand: [50, -124] }, L: { hand: [90, -134] } }, 'relaxed', 'open'), 26],
    ]);
    return <Stage cam={cm}>
      <Bedroom night lamp={0.6} />
      <PhoneFlat x={585} y={670} lit={c.p(came - 4, 8)} buzz={c.f > came && c.f < came + 60 ? 1 - (c.f - came) / 60 : 0} t={c.t} />
      <Actor f={c.f} {...SAL} x={X} y={860} s={S} facing={-1} pose={pz}
        face={faceAt(c.f, [[0, F('sad', { open: 0.5, brow: -0.3, mouth: -0.1 })], [came + 4, F('surprised', { open: 0.9, open2: 0, browY: 0.4, look: [0.6, 0.5] }), 8], [msg, F('irritated', { open: 0.9, look: [0.8, 0.7] }), 12]])} />
    </Stage>;
  },

  // 84 — close on the hand, seen from above the nightstand: it holds the lit phone, turns it face down on «قلب»,
  //      lays it on the wood on «ووضعه», lets go and withdraws.
  84: (c) => {
    const flipF = c.at('قلب'), putF = c.at('ووضعه');
    const fl = c.p(flipF - 2, 24);
    const sx = Math.cos(fl * Math.PI);
    const down = c.p(putF - 8, 34);
    const rel = c.f > putF + 30;
    const away = c.p(putF + 30, 46, ease.in);
    const P: P2 = [mix(980, 900, down) + Math.sin(c.f / 40) * 4 * (1 - down), mix(500, 560, down)];
    const sc = mix(1.08, 1, down) * (1 + 0.04 * Math.sin(fl * Math.PI));
    const tilt = mix(-6, 4, fl) + mix(0, -2, down);
    const lift = mix(46, 8, down);
    const PW = 230, HS = 8.5;
    const r = (tilt * Math.PI) / 180, rot = (v: P2): P2 => [v[0] * Math.cos(r) - v[1] * Math.sin(r), v[0] * Math.sin(r) + v[1] * Math.cos(r)];
    const edge = rot([(PW / 2) * Math.abs(sx) * sc - 26, 44]);
    const H: P2 = [P[0] + edge[0] + away * 900, P[1] + edge[1] + away * 240];
    const wr = rot([12 * HS, 0]);
    const wrist: P2 = [H[0] + wr[0], H[1] + wr[1]];
    const g: Gesture = rel ? 'open' : 'grip';
    const hand = (layer: 'back' | 'front' | 'all') => <g transform={`translate(${H[0]} ${H[1]}) rotate(${180 + tilt}) scale(${HS} ${-HS}) translate(-12 0)`}><Hand g={g} skin={CAST.salim.skin} layer={layer} /></g>;
    const arm = <g>
      <path d={`M${wrist[0]} ${wrist[1]} L${wrist[0] + 1200} ${wrist[1] + 260}`} stroke={INK} strokeWidth={104} strokeLinecap="round" />
      <path d={`M${wrist[0]} ${wrist[1]} L${wrist[0] + 1200} ${wrist[1] + 260}`} stroke={CAST.salim.shirt} strokeWidth={86} strokeLinecap="round" />
      <path d={`M${wrist[0] + 60} ${wrist[1] + 30} L${wrist[0] + 1200} ${wrist[1] + 290}`} stroke={CAST.salim.shirtShade} strokeWidth={14} strokeLinecap="round" opacity={0.6} />
    </g>;
    const tr = `translate(${P[0]} ${P[1]}) rotate(${tilt}) scale(${Math.max(0.02, Math.abs(sx)) * sc} ${sc})`;
    const phone = <g transform={tr}><Phone w={PW} faceDown={sx < 0} glow={sx < 0 ? 0 : 0.6} screen={<Notice />} buzz={c.f < 40 ? 0.6 * (1 - c.f / 40) : 0} t={c.t} /></g>;
    return <Stage>
      <rect width={1920} height={1080} fill={PAL.wood} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <path key={i} d={sketch([[-20, 80 + i * 130], [1940, 70 + i * 132]], 30 + i, 5)} stroke={PAL.woodDark} strokeWidth={3} fill="none" opacity={0.35} />)}
      <circle cx={170} cy={110} r={150} fill={PAL.storm} stroke={INK} strokeWidth={5} />
      <circle cx={170} cy={110} r={52} fill={INK} opacity={0.75} />
      <g transform="translate(330 900) rotate(-8)"><path d={sketchRect(-260, -150, 520, 340, 4, 1.4)} fill="#56708E" stroke={INK} strokeWidth={5} /><path d={sketchRect(-230, -120, 240, 90, 5, 1)} fill={PAL.paper} stroke={INK} strokeWidth={3.6} /></g>
      <rect width={1920} height={1080} fill="#2E3A78" opacity={0.22} />
      <ellipse cx={300} cy={200} rx={900} ry={700} fill="#EEF2F8" opacity={0.18} />
      <g transform={`translate(${P[0] + lift * 0.6} ${P[1] + lift}) rotate(${tilt}) scale(${Math.max(0.02, Math.abs(sx)) * sc} ${sc})`}><rect x={-PW / 2} y={-PW * 1.05} width={PW} height={PW * 2.1} rx={40} fill={INK} opacity={0.22} /></g>
      {!rel && <>{arm}{hand('back')}{phone}{hand('front')}</>}
      {rel && <>{phone}{arm}{hand('all')}</>}
    </Stage>;
  },

  // 85 — not running away: on the bed's edge he writes «صباحًا» on a sticky note on «كان قرارًا مؤقتًا»,
  //      sticks it on the face-down phone on «غدًا», then sits back and breathes out on «أصفى».
  85: (c) => {
    const esc = c.at('هروب'), dec = c.at('قرار'), rep = c.at('سأرد'), tom = c.at('غدا'), clear = c.at('بعقل'), clr = c.at('أصفى');
    const cm = cam(650, 585, 1.9), X = 720;
    const wp = c.p(dec - 4, rep - dec, ease.lin);
    const writing = c.f > dec - 10 && c.f < rep + 4;
    const Lw: P2 = writing ? [30 + 24 * wp + Math.sin(c.f * 0.9) * 2, -176 + Math.cos(c.f * 1.3) * 2] : [32, -172];
    const stuck = c.f >= tom - 2;
    const pz = poseAt(c.f, [
      [0, st({ ...KNEES, lean: 10, head: 18, turn: 0.9, R: { hand: [52, -124] }, L: { hand: [60, -122] } }, 'grip', 'pen')],
      [esc - 34, st({ ...KNEES, lean: 4, head: 14, turn: 0.75, R: { hand: [74, -160] }, L: { hand: [32, -172] } }, 'grip', 'pen'), 22],
      [dec - 10, st({ ...KNEES, lean: 6, head: 18, turn: 0.75, R: { hand: [74, -160] }, L: { hand: Lw } }, 'grip', 'pen'), 10],
      [rep + 4, st({ ...KNEES, lean: 22, head: 20, turn: 0.95, R: { hand: [92, -142] }, L: { hand: [44, -150] } }, 'grip', 'pen'), 30],
      [tom - 2, st({ ...KNEES, lean: 22, head: 20, turn: 0.95, R: { hand: [93, -136] }, L: { hand: [44, -150] } }, 'open', 'pen'), 6],
      [clear - 8, st({ ...KNEES, lean: -2, head: -2, turn: 0.6, breath: 1, R: { hand: [50, -126] }, L: { hand: [60, -124] } }, 'relaxed', 'pen'), 30],
      [clr, st({ ...KNEES, lean: 3, head: 2, turn: 0.6, breath: 0, R: { hand: [50, -126] }, L: { hand: [60, -124] } }, 'relaxed', 'pen'), 40],
    ]);
    const p = writing && c.f > dec ? { ...pz.p, L: { hand: Lw } } : pz.p;
    return <Stage cam={cm} over={<>
      <Cap text="ليس هروبًا" o={c.p(esc - 2, 12) * (1 - c.p(dec - 14, 10))} top={34} size={60} />
      <Cap text="قرار مؤقت" o={c.p(dec, 12)} top={34} size={60} color={PAL.calm} />
    </>}>
      <Bedroom night lamp={0.6} />
      <PhoneFlat x={585} y={670} back note={stuck ? 1 : 0} />
      <Actor f={c.f} {...SAL} x={X} y={860} s={S} facing={-1} pose={{ p, hands: pz.hands }}
        hold={{ R: stuck ? undefined : <g transform="translate(-4 -16)"><StickyNote p={wp} /></g>, L: <g transform="scale(0.6)"><Pen /></g> }} upright={{ R: true }}
        face={faceAt(c.f, [[0, F('neutral', { look: [0.7, 0.6], brow: 0.15 })], [esc - 30, F('determined', { look: [0.6, 0.9] }), 16], [clear - 4, F('relieved'), 24], [clr + 10, F('calm', { look: [0.3, 0.2] }), 20]])} />
    </Stage>;
  },

  // 86 — at the office, at a quiet hour (the wall clock, a steaming mug): he pulls a plan card close on «تجهز»,
  //      writes it on «خطتك», ticks it on «مسبقًا» and sits back with a small nod.
  86: (c) => {
    const prep = c.at('تجهز'), pre = c.at('مسبقا');
    const cm = cam(840, 520, 1.7);
    const wp = c.p(prep + 6, pre + 4 - prep, ease.lin);
    const writing = c.f > prep && c.f < pre + 14;
    const Lw: P2 = writing ? [112 - 26 * wp + Math.sin(c.f * 0.8) * 2.5, -150 + Math.cos(c.f * 1.1) * 1.5] : [100, -150];
    const pz = poseAt(c.f, [
      [0, st(desk({ lean: 4, head: 6, turn: 0.6, R: { hand: [70, -150] }, L: { hand: [96, -150] } }), 'relaxed', 'pen')],
      [prep - 12, st(desk({ lean: 12, head: 20, turn: 0.8, R: { hand: [72, -150] }, L: { hand: [112, -150] } }), 'relaxed', 'pen'), 16],
      [pre + 16, st(desk({ lean: 2, head: 4, turn: 0.6, R: { hand: [70, -150] }, L: { hand: [94, -150] } }), 'relaxed', 'pen'), 22],
    ]);
    const p = writing && c.f > prep + 4 ? { ...pz.p, L: { hand: Lw } } : pz.p;
    const head = { ...p, head: p.head + nod(c.f, pre + 34, 1, 8) };
    const cx = mix(960, 920, c.p(prep - 10, 20)), cy = DESK.deskTop;
    const l1 = cl(wp * 2), l2 = cl(wp * 2 - 1), tick = c.p(pre - 4, 12);
    return <Stage cam={cm}>
      <DeskBack />
      <g transform="translate(960 330)"><Clock hours={10} minutes={5 + c.t * 2} r={42} /></g>
      <Actor f={c.f} {...SAL} x={DESK.seat.x} y={860} s={S} facing={1} pose={{ p: head, hands: pz.hands }} hold={{ L: <g transform="scale(0.6)"><Pen /></g> }}
        face={faceAt(c.f, [[0, F('calm', { look: [0.6, -0.4] })], [prep - 10, F('calm', { look: [0.6, 0.8], brow: 0.15 }), 12], [pre + 16, F('smile', { mouth: 0.5, look: [0.7, 0.3] }), 16]])} />
      <DeskFront mug={false} />
      <g transform={`translate(1040 ${cy})`}><Mug steam={0.8} t={c.t} /></g>
      <path d={`M${cx - 50} ${cy - 1} L${cx + 50} ${cy - 1} L${cx + 40} ${cy - 30} L${cx - 40} ${cy - 30} Z`} fill="#FBFAF7" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      <path d={`M${cx - 49} ${cy - 1} L${cx + 49} ${cy - 1} L${cx + 47} ${cy - 5} L${cx - 47} ${cy - 5} Z`} fill={PAL.calm} opacity={0.8} />
      {l1 > 0 && <path d={`M${cx + 32} ${cy - 21} l${-60 * l1} 0`} stroke="#2C4A7C" strokeWidth={3} strokeLinecap="round" />}
      {l2 > 0 && <path d={`M${cx + 36} ${cy - 11} l${-50 * l2} 0`} stroke="#2C4A7C" strokeWidth={3} strokeLinecap="round" />}
      {tick > 0 && <path d={`M${cx - 36} ${cy - 15} l5 5 l9 -11`} stroke={PAL.calm} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={tick} />}
    </Stage>;
  },

  // 87 — the plan card fills the frame: «إذا» + phone, jagged message, moon on the words; «فسأؤجل الرد» on «فسأؤجل»,
  //      the arrow on «إلى» and the morning sun on «الصباح».
  87: (c) => {
    const ifF = c.at('إذا'), msg = c.at('وصلتني'), prov = c.at('مستفزة'), night = c.at('ليلا'), then = c.at('فسأؤجل'), to = c.at('إلى'), morn = c.at('الصباح');
    const pop = (a: number) => c.p(a - 2, 16, ease.back);
    const pen = '#2E4C7A';
    const z = 1 + 0.035 * c.p(0, c.dur, ease.lin);
    const txt = (text: string, x: number, y: number, w: number, size: number, color: string, p: number) => (
      <foreignObject x={x - w / 2} y={y - size} width={w} height={size * 2}>
        <div dir="rtl" lang="ar" style={{ width: w, height: size * 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', fontFamily: BODY, fontWeight: 700, fontSize: size, color, lineHeight: 1.2, whiteSpace: 'nowrap', clipPath: `inset(0 0 0 ${(1 - cl(p)) * 100}%)` }}>{text}</div>
      </foreignObject>
    );
    const sun = pop(morn), moon = pop(night);
    return <Stage cam={{ x: 960, y: 540, z }}>
      <Paper seed={87} />
      <g transform="translate(960 545) rotate(-1.2)">
        <path d={`M-700 ${-380 + 14} L700 ${-380 + 14} L708 410 L-692 410 Z`} fill={INK} opacity={0.1} />
        <path d={sketchRect(-720, -400, 1440, 800, 21, 2)} fill={NOTE} stroke={INK} strokeWidth={5} />
        <circle cx={0} cy={-366} r={22} fill={PAL.warn} stroke={INK} strokeWidth={3.6} /><circle cx={-7} cy={-373} r={6} fill="#F1C4D2" />
        {txt('إذا', 470, -150, 360, 130, PAL.provoke, c.p(ifF, 22, ease.lin))}
        <g transform={`translate(170 -150) scale(${pop(msg)})`}><Phone w={100} glow={0.5} screen={<rect width={360} height={720} fill={PAL.screenGlow} />} /></g>
        <g transform={`translate(-80 -190) scale(${pop(prov)})`}>
          <SpeechBubble w={230} h={130} tail={[150, 50]}>
            <path d="M80 0 L56 -22 L32 20 L8 -22 L-16 20 L-40 -22 L-64 14 L-80 -6" fill="none" stroke={PAL.provoke} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          </SpeechBubble>
        </g>
        {moon > 0 && <g transform={`translate(-430 -160) scale(${moon})`}>
          <path d="M20 -62 A64 64 0 1 0 54 44 A52 52 0 1 1 20 -62 Z" fill="#DCE3F2" stroke={pen} strokeWidth={8} strokeLinejoin="round" />
          {[[-110, -40], [70, -80], [90, 40]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 10} v20 M${x - 10} ${y} h20`} stroke={pen} strokeWidth={6} strokeLinecap="round" />)}
        </g>}
        <path d="M-640 30 H640" stroke={INK} strokeWidth={4} strokeDasharray="16 18" opacity={0.35} />
        {txt('فسأؤجل الرد', 330, 220, 720, 104, PAL.calm, c.p(then, to - then - 6, ease.lin))}
        <Arrow from={[40, 230]} to={[-300, 230]} p={c.p(to, 22)} color={pen} w={10} />
        {sun > 0 && <g transform={`translate(-450 230) scale(${sun}) rotate(${c.t * 12})`}>
          <circle r={56} fill="#F4F8FC" stroke={pen} strokeWidth={8} />
          {Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <path key={i} d={`M${Math.cos(a) * 74} ${Math.sin(a) * 74} L${Math.cos(a) * 100} ${Math.sin(a) * 100}`} stroke={pen} strokeWidth={8} strokeLinecap="round" />; })}
        </g>}
      </g>
    </Stage>;
  },

  // 88 — the small plan: the note is pinned and written on «خطة صغيرة تكتب», the storm then rises in the window on
  //      «العاصفة» and rages through «وسط العاصفة» — the note stays where it was pinned. The room dims, lightning flashes.
  88: (c) => {
    const pinF = c.at('خطة'), wr = c.at('تكتب'), stF = c.at('العاصفة'), easy = c.at('أسهل'), big = c.at('قرار');
    const written = k(c.f, [[pinF - 10, 0], [pinF + 34, 0.28], [wr, 0.3], [stF + 6, 0.98], [stF + 16, 1]], ease.lin);
    const inten = k(c.f, [[stF - 4, 0.1], [easy + 20, 0.8], [big + 30, 1]]);
    const flash = inten > 0.6 && (c.t * 0.37) % 1 < 0.035 ? (inten - 0.6) / 0.4 : 0;
    const [wx, wy, ww, wh] = PLAN.window;
    const cm = camMix(CAM0, cam(1000, 560, 1.1), c.p(easy, 150));
    return <Stage cam={cm}>
      <Plan t={c.t} written={written} />
      <svg x={wx} y={wy} width={ww} height={wh}><Storm t={c.t} intensity={inten} /></svg>
      <path d={`M${wx + ww / 2} ${wy} L${wx + ww / 2} ${wy + wh} M${wx} ${wy + wh / 2} L${wx + ww} ${wy + wh / 2}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d={`M${wx + ww / 2} ${wy} L${wx + ww / 2} ${wy + wh} M${wx} ${wy + wh / 2} L${wx + ww} ${wy + wh / 2}`} stroke="#F4F2EE" strokeWidth={8} />
      <path d={sketchRect(wx, wy, ww, wh, 2)} fill="none" stroke={INK} strokeWidth={4} />
      <rect x={-200} y={-200} width={2320} height={1480} fill={PAL.wallNight} opacity={0.2 * inten} />
      <rect x={-200} y={-200} width={2320} height={1480} fill="#EEF0FA" opacity={flash * 0.22} />
    </Stage>;
  },

  // 89 — looking from afar: the camera pulls back from Salim on «تنظر … بعيد»; on «كأنك» he stands and steps back and his
  //      friend Hadi appears in his place (an imagined, lavender-lit figure) holding the same lit phone; Salim's hand goes
  //      to Hadi's shoulder and he advises him on «تنصح»; Hadi looks up on «صديقًا» and nods on «نفسه».
  89: (c) => {
    const look = c.at('تنظر'), far = c.at('بعيد'), as = c.at('كأنك'), fr = c.at('صديقا'), same = c.at('نفسه');
    const cm = camMix(cam(980, 480, 2.1), cam(900, 560, 1.15), c.p(look - 6, far + 30 - look));
    const up0 = as - 6, b0 = as + 12, b1 = as + 44;
    const w = walkTo(c.f, b0, b1, 980, 850, S, { lean: -3 });
    const x = c.f < b0 ? 980 : w.x;
    const pz = c.f > b0 && c.f < b1 ? { p: w.p, hands: undefined } : poseAt(c.f, [
      [0, st({ ...KNEES, lean: 8, head: 16, turn: 0.75, R: { hand: [50, -126] }, L: { hand: [60, -124] } })],
      [look, st({ ...KNEES, lean: 4, head: 0, turn: 0.6, R: { hand: [50, -126] }, L: { hand: [60, -124] } }), 30],
      [up0, st({ head: 4, turn: 0.6 }), 18],
      [b1, st({ lean: 6, head: 8, turn: 0.75, L: { hand: [63, -204] }, R: { hand: [48, -168] } }, 'cup', 'open'), 18],
    ]);
    const ho = c.p(b0 - 4, 30);
    const hadi = poseAt(c.f, [
      [0, st({ ...KNEES, lean: 14, head: 22, turn: 0.8, R: { hand: [50, -126] }, L: { hand: [46, -168] } }, 'relaxed', 'grip')],
      [fr - 8, st({ ...KNEES, lean: 6, head: 4, turn: -0.35, R: { hand: [50, -126] }, L: { hand: [50, -150] } }, 'relaxed', 'grip'), 20],
    ]);
    const hp = { ...hadi.p, head: hadi.p.head + nod(c.f, same - 6, 2, 8) };
    return <Stage cam={cm}>
      <Bedroom night lamp={0.6} />
      <PhoneFlat x={585} y={670} back note={1} />
      {ho > 0 && <g opacity={ho}>
        <ellipse cx={985} cy={640} rx={190} ry={270} fill="#E6E1EF" opacity={0.75} />
        <ellipse cx={985} cy={640} rx={190} ry={270} fill="none" stroke="#9A8FC0" strokeWidth={5} strokeDasharray="18 14" />
        <Actor f={c.f} who="hadi" seed={17} x={980} y={860} s={S} facing={1} pose={{ p: hp, hands: hadi.hands }} o={0.94}
          hold={{ L: <Phone w={28} glow={0.6} screen={<Notice />} /> }} upright={{ L: true }}
          face={faceAt(c.f, [[0, F('anxious', { look: [0.3, 0.8] })], [fr - 6, F('listening', { look: [-1, -0.2] }), 14], [same, F('relieved', { look: [-1, -0.2] }), 20]])} />
      </g>}
      <Actor f={c.f} {...SAL} x={x} y={860} s={S} facing={1} pose={pz} say={[b1 + 6, same + 20]}
        face={faceAt(c.f, [[0, F('thinking', { look: [0.4, 0.7] })], [look, F('thinking', { look: [0.2, -0.3] }), 20], [b1, F('calm', { look: [0.6, 0.5] }), 16]])} />
    </Stage>;
  },

  // 90 — close: he lifts his eyes on «ماذا», a hand goes to his chin on «ستقول», and a calm «؟» appears beside him.
  90: (c) => {
    const q = c.at('ماذا'), say = c.at('ستقول');
    const cm = cam(930, 470, 2.3), X = 850;
    const pz = poseAt(c.f, [[0, st({ head: 8, turn: 0.6 })], [q - 4, st({ head: -10, turn: 0.45 }), 20], [say - 12, st({ head: -10, turn: 0.4, L: { hand: [28, -238], bend: -1 } }, 'relaxed', 'fist'), 18]]);
    const qm = c.p(say, 16, ease.back);
    return <Stage cam={cm}>
      <Bedroom night lamp={0.6} />
      <Actor f={c.f} {...SAL} x={X} y={860} s={S} facing={1} pose={pz}
        face={faceAt(c.f, [[0, F('calm', { look: [0.5, 0.5] })], [q, F('thinking', { look: [0.6, -0.8] }), 16]])} />
      {qm > 0 && <g transform={`translate(1030 ${410 + Math.sin(c.t * 2) * 6}) scale(${qm})`}><WLabel x={0} y={0} text="؟" size={150} color={PAL.focus} /></g>}
    </Stage>;
  },

  // 91 — chapter 8: a rose line climbs on «يشتد الانفعال»; a small box shakes on «تحتاج», opens on «أدوات», and three tools
  //      rise out (breath, feet, eye) on «أدوات بسيطة»; they pulse in turn on «تعيدك إلى اللحظة».
  91: (c) => {
    const up = c.at('يشتد'), emo = c.at('الانفعال'), need = c.at('تحتاج'), tools = c.at('أدوات'), simple = c.at('بسيطة'), back = c.at('تعيدك');
    const N = 14;
    const pts: P2[] = Array.from({ length: N }, (_, i) => { const u = i / (N - 1); return [1330 + u * 500, 860 - u * 420 + (i % 2 ? -1 : 1) * (12 + u * 48)]; });
    const draw = c.p(up - 12, 70, ease.lin);
    const n = Math.max(1, Math.round(draw * (N - 1)));
    const jitter = (i: number) => Math.sin(c.t * 5 + i) * 3 * draw;
    const lid = c.p(tools - 12, 18, ease.back);
    const bs = shake(c.f, need, 30, 4, 1.3);
    const TX = [1010, 760, 510];
    const arr = [tools, tools + 18, simple].map((a) => c.p(a, 26, ease.back));
    const icons = [<IconBreath s={110} />, <IconFeet s={110} />, <IconEye s={110} />];
    const names = ['التنفس', 'الجسد', 'المكان'];
    return <Stage over={<Cap text="أدوات بسيطة" o={c.p(tools, 14)} top={50} size={62} />}>
      <Paper seed={91} />
      <path d={sketch(pts.slice(0, n + 1).map((q, i) => [q[0], q[1] + jitter(i)] as P2), 3, 1)} stroke={PAL.warn} strokeWidth={11} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={draw > 0 ? 0.9 : 0} />
      <WLabel x={1480} y={940} text="الانفعال" size={50} color={PAL.warn} o={c.p(emo, 14)} />
      <g opacity={c.p(10, 16)}>
        <ellipse cx={760 + bs} cy={862} rx={190} ry={16} fill={INK} opacity={0.12} />
        <path d={sketchRect(610 + bs, 712, 300, 148, 11, 1.4)} fill={PAL.chair} stroke={INK} strokeWidth={5} />
        <path d={sketchRect(730 + bs, 770, 60, 22, 12, 0.8)} fill={PAL.metal} stroke={INK} strokeWidth={3.6} />
        {arr.map((a, i) => a > 0 && a < 1 && <path key={i} d={`M${760 + (i - 1) * 40} 700 L${mix(760, TX[i], a)} ${mix(700, 430, a) + 70}`} stroke={PAL.calmLight} strokeWidth={10} strokeLinecap="round" opacity={1 - a} />)}
        <g transform={`translate(${610 + bs} 712) rotate(${-172 * lid})`}>
          <path d={sketchRect(0, -26, 300, 26, 13, 1)} fill={PAL.chairDark} stroke={INK} strokeWidth={5} />
          <path d={sketchRect(110, -46, 80, 22, 14, 0.8)} fill="none" stroke={INK} strokeWidth={6} />
        </g>
      </g>
      {arr.map((a, i) => {
        if (a <= 0) return null;
        const x = mix(760, TX[i], cl(a)), y = mix(700, 430, a), s = mix(0.3, 1, cl(a));
        const pulse = Math.sin(cl((c.f - back - i * 14) / 24) * Math.PI);
        return <g key={i}>
          <g transform={`translate(${x} ${y}) scale(${s * (1 + 0.1 * pulse)})`}>
            <circle r={84} fill="#FFFFFF" stroke={pulse > 0.05 ? PAL.calm : INK} strokeWidth={pulse > 0.05 ? 8 : 5} />
            {icons[i]}
          </g>
          <WLabel x={TX[i]} y={570} text={names[i]} size={48} o={c.p((i < 2 ? tools + i * 18 : simple) + 16, 12)} />
        </g>;
      })}
    </Stage>;
  },

  // 92 — the next morning at his desk, Jaser's message on the screen; tense, fists on the desk. The first tool lights on
  //      «أولها»; on «التنفس» he sits back and lays a hand on his belly, and his eyes half-close on «البطيء».
  92: (c) => {
    const first = c.at('أولها'), br = c.at('التنفس'), slow = c.at('البطيء');
    const pz = poseAt(c.f, [
      [0, st(desk({ lean: 10, head: 8, turn: 0.85, R: { hand: [80, -150] }, L: { hand: [94, -148] } }), 'fist', 'fist')],
      [br - 8, st(desk({ lean: 0, head: 2, turn: 0.6, breath: 0.4, L: { hand: [24, -134], bend: -1 } }), 'relaxed', 'open'), 18],
      [slow, st(desk({ lean: -3, head: -2, turn: 0.55, breath: 1, L: { hand: [24, -136], bend: -1 } }), 'relaxed', 'open'), 30],
    ]);
    const ch = chestOf(pz.p, DESK.seat.x);
    return <Stage cam={cam(960, 545, 1.28)} over={<ToolChips lit={0} p={c.p(first - 4, 14)} />}>
      <DeskRoom c={c} screen={<ChatBlocks />}
        actor={<Actor f={c.f} {...SAL} x={DESK.seat.x} y={860} s={S} facing={1} pose={pz}
          face={faceAt(c.f, [[0, F('irritated', { look: [1, -0.1] })], [br, F('calm', { open: 0.6, brow: 0.1 }), 20], [slow, F('calm', { open: 0.3 }), 20]])} />}
        front={<ChestSwirl x={ch[0]} y={ch[1]} r={30} t={c.t} amount={k(c.f, [[0, 0.95], [slow, 0.85]])} />} />
    </Stage>;
  },

  // 93 — close, eyes closed: on «شهيق» the chest rises and air lines flow into his nose; on «وزفير» one long slow wave
  //      flows out, longer than the in-breath, through «أطول قليلًا من الشهيق».
  93: (c) => {
    const inn = c.at('شهيق'), out = c.at('وزفير');
    const cm = cam(760, 480, 2.3);
    const b = k(c.f, [[inn - 4, 0], [out - 10, 1], [c.dur - 6, 0.05]], ease.inOut);
    const p = pose(desk({ lean: -3 + b * -2, head: -2 - b * 4, turn: 0.6, breath: b, L: { hand: [24 + b * 3, -136], bend: -1 } }));
    const nose = noseOf(p, DESK.seat.x), ch = chestOf(p, DESK.seat.x);
    return <Stage cam={cm} over={<ToolChips lit={0} p={1} />}>
      <DeskRoom c={c} screen={<ChatBlocks />}
        actor={<Actor f={c.f} {...SAL} x={DESK.seat.x} y={860} s={S} facing={1} pose={{ p, hands: { R: 'relaxed', L: 'open' } }} face={F('calm', { open: 0.04, mouth: 0.2, brow: -0.15 })} />}
        front={<>
          <ChestSwirl x={ch[0]} y={ch[1]} r={30} t={c.t} amount={k(c.f, [[0, 0.85], [c.dur, 0.7]])} />
          <Inhale nose={nose} p={c.p(inn, out - inn - 14, ease.lin)} />
          <Exhale from={nose} p={c.p(out, 150, ease.out)} fade={c.p(c.dur - 30, 30)} len={430} t={c.t} />
        </>} />
    </Stage>;
  },

  // 94 — profile and screen: once more; a count dot fills on «مرة» with the in-breath, the second on «ومرةً» with the
  //      out-breath. Jaser's message is still on the screen.
  94: (c) => {
    const one = c.at('مرة'), two = c.at('ومرة');
    const cm = cam(1060, 470, 1.55);
    const b = k(c.f, [[one - 4, 0], [two - 6, 1], [c.dur, 0.1]]);
    const p = pose(desk({ lean: -3, head: -2 - b * 4, turn: 0.6, breath: b, L: { hand: [24 + b * 3, -136], bend: -1 } }));
    const nose = noseOf(p, DESK.seat.x), hd = headOf(p, DESK.seat.x);
    const dots = [one, two].map((a) => c.p(a, 14, ease.back));
    return <Stage cam={cm} over={<ToolChips lit={0} p={1} />}>
      <DeskRoom c={c} screen={<ChatBlocks />}
        actor={<Actor f={c.f} {...SAL} x={DESK.seat.x} y={860} s={S} facing={1} pose={{ p, hands: { R: 'relaxed', L: 'open' } }} face={F('calm', { open: 0.04, mouth: 0.25 })} />}
        front={<>
          <Inhale nose={nose} p={c.p(one, two - one - 4, ease.lin)} len={120} />
          <Exhale from={nose} p={c.p(two, 60, ease.out)} len={320} t={c.t} />
          {[0, 1].map((i) => <g key={i} transform={`translate(${hd[0] + 30 - i * 64} ${hd[1] - 150})`}>
            <circle r={22} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
            <circle r={22 * dots[i]} fill={PAL.calm} />
          </g>)}
        </>} />
    </Stage>;
  },

  // 95 — not magic: a few sparkles fizzle out on «سحرًا»; on «يمحو» his calm breath sweeps over the box on the desk and it
  //      stays, unchanged; it is named «المشكلة» on «المشكلة», and he looks at it and nods.
  95: (c) => {
    const magic = c.at('سحر'), erase = c.at('يمحو'), prob = c.at('المشكلة');
    const cm = cam(1160, 540, 1.55);
    const pz = poseAt(c.f, [[0, st(desk({ lean: -2, head: 0, turn: 0.6, L: { hand: [24, -136], bend: -1 } }), 'relaxed', 'open')], [erase + 10, st(desk({ lean: 2, head: 8, turn: 0.95, L: { hand: [40, -144] } }), 'relaxed', 'relaxed'), 20]]);
    const p = { ...pz.p, head: pz.p.head + nod(c.f, prob + 24, 1, 8) };
    const sw = c.p(erase - 4, 40, ease.inOut);
    const wob = shake(c.f, erase + 26, 26, 2, 0.9);
    return <Stage cam={cm} over={<ToolChips lit={0} p={1} />}>
      <DeskRoom c={c} screen={<ChatBlocks />} box={wob}
        actor={<Actor f={c.f} {...SAL} x={DESK.seat.x} y={860} s={S} facing={1} pose={{ p, hands: pz.hands }}
          face={faceAt(c.f, [[0, F('calm', { open: 0.7, look: [1, 0] })], [erase + 6, F('calm', { look: [1, 0.6] }), 14]])} />}
        front={<>
          {[0, 1, 2, 3, 4].map((i) => {
            const u = cl((c.f - magic - i * 5) / 34);
            if (u <= 0 || u >= 1) return null;
            const x = 820 + i * 46, y = 560 - u * 70 - (i % 2) * 30, r = 16 * Math.sin(u * Math.PI);
            return <path key={i} d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`} fill="#FFFFFF" stroke={PAL.focus} strokeWidth={3} opacity={1 - u * 0.6} />;
          })}
          {sw > 0 && sw < 1 && [0, 1, 2].map((i) => {
            const x = mix(800, 1640, sw) - i * 40, y = 560 + i * 26;
            return <path key={i} d={`M${x - 140} ${y} q35 -16 70 0 t70 0`} stroke={PAL.water} strokeWidth={7} fill="none" strokeLinecap="round" opacity={Math.sin(sw * Math.PI) * 0.9} />;
          })}
          <WLabel x={1566} y={520} text="المشكلة" size={46} bg="#FFFFFF" o={c.p(prob - 2, 12, ease.back)} />
        </>} />
    </Stage>;
  },

  // 96 — the meter by the monitor drops a little on «يخفف … قليلًا»; on «مساحةً» a dashed circle widens around him; on
  //      «لتختار» two paths open on the floor in that space, a jagged one and a straight one. The box stays.
  96: (c) => {
    const ease1 = c.at('يخفف'), room = c.at('مساحة'), pick = c.at('لتختار');
    const cm = cam(980, 600, 1.15);
    const lvl = k(c.f, [[ease1 - 4, 0.8], [ease1 + 70, 0.6]]);
    const R = mix(150, 330, c.p(room - 4, 30, ease.back));
    const pz = poseAt(c.f, [[0, st(desk({ lean: -2, head: -2, turn: 0.6, breath: 0.5 + 0.5 * Math.sin(c.f / 40), L: { hand: [24, -136], bend: -1 } }), 'relaxed', 'open')],
      [pick - 10, st(desk({ lean: 4, head: 14, turn: 0.75, R: { hand: [54, -128] }, L: { hand: [62, -126] } })), 22]]);
    const ch = chestOf(pz.p, DESK.seat.x);
    const pp = c.p(pick, 30, ease.out);
    const zig: P2[] = Array.from({ length: 9 }, (_, i) => [790 + i * 50, 980 + (i % 2 ? -20 : 20)]);
    const zn = Math.max(1, Math.round(pp * 8));
    const mx = 1600, top = 300, H = 220;
    return <Stage cam={cm} over={<ToolChips lit={0} p={1} />}>
      <DeskRoom c={c} screen={<ChatBlocks />}
        back={<g>
          <path d={sketchRect(mx - 28, top, 56, H, 61, 1)} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
          <rect x={mx - 18} y={top + 10 + (H - 20) * (1 - lvl)} width={36} height={(H - 20) * lvl} rx={8} fill={PAL.warn} />
          {[0.25, 0.5, 0.75].map((u) => <path key={u} d={`M${mx - 28} ${top + H * u} h14`} stroke={INK} strokeWidth={3} />)}
          <circle cx={mx} cy={top + H + 30} r={34} fill={PAL.warn} stroke={INK} strokeWidth={4} />
          {c.f > ease1 && c.f < ease1 + 90 && <path d={`M${mx + 54} ${top + 60} v70 m-14 -16 l14 18 l14 -18`} stroke={PAL.calm} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={Math.sin(cl((c.f - ease1) / 90) * Math.PI)} />}
        </g>}
        actor={<Actor f={c.f} {...SAL} x={DESK.seat.x} y={860} s={S} facing={1} pose={pz}
          face={faceAt(c.f, [[0, F('relieved', { open: 0.6 })], [room, F('calm', { look: [0.6, 0.1] }), 16], [pick - 6, F('thinking', { look: [0.7, 0.8] }), 14]])} />}
        front={<>
          <ChestSwirl x={ch[0]} y={ch[1]} r={30} t={c.t} amount={k(c.f, [[ease1, 0.7], [ease1 + 70, 0.5]])} />
          {c.f > room - 6 && <circle cx={ch[0] + 20} cy={ch[1] + 20} r={R} fill={PAL.calmLight} fillOpacity={0.18} stroke={PAL.calm} strokeWidth={6} strokeDasharray="22 16" opacity={c.p(room - 6, 12)} />}
          {pp > 0 && <>
            <path d={sketch(zig.slice(0, zn + 1), 4, 1)} stroke={PAL.warn} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M790 915 L${790 + 400 * pp} 915`} stroke={PAL.calm} strokeWidth={12} strokeLinecap="round" />
            {pp > 0.95 && <path d="M1168 895 L1192 915 L1168 935" stroke={PAL.calm} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          </>}
        </>} />
    </Stage>;
  },

  // 97 — the second tool lights on «ثانيها»; his feet glow on the floor on «قدماك», he sits back into the chair and the
  //      backrest glows on «وظهرك», his hands come to rest flat on the desk and glow on «ويداك».
  97: (c) => {
    const second = c.at('ثانيها'), feet = c.at('قدماك'), back = c.at('وظهرك'), hands = c.at('ويداك');
    const cm = cam(880, 600, 1.2);
    const pz = poseAt(c.f, [
      [0, st(desk({ lean: 6, head: 6, turn: 0.6, R: { hand: [54, -128] }, L: { hand: [62, -126] } }))],
      [feet - 6, st(desk({ lean: 6, head: 22, turn: 0.7, footR: [50, 0], footL: [66, 0], R: { hand: [54, -128] }, L: { hand: [62, -126] } })), 18],
      [back - 8, st(desk({ lean: -6, head: 0, turn: 0.6, breath: 0.6, R: { hand: [54, -128] }, L: { hand: [62, -126] } })), 22],
      [hands - 10, st(desk({ lean: 2, head: 8, turn: 0.7, R: { hand: [80, -150] }, L: { hand: [94, -148] } }), 'open', 'open'), 22],
    ]);
    const ch = chestOf(pz.p, DESK.seat.x);
    const g = (a: number) => c.p(a, 16) * (0.8 + 0.2 * Math.sin((c.f - a) / 9));
    return <Stage cam={cm} over={<ToolChips lit={1} p={c.p(second - 4, 14)} />}>
      <DeskRoom c={c}
        back={<path d="M600 690 L597 560 L611 522 L640 522 L652 560 L648 690 Z" fill={PAL.calm} opacity={0.75 * g(back)} />}
        actor={<Actor f={c.f} {...SAL} x={DESK.seat.x} y={860} s={S} facing={1} pose={pz}
          face={faceAt(c.f, [[0, F('calm', { look: [0.6, 0.3] })], [feet - 6, F('calm', { look: [0.3, 1] }), 14], [back, F('relieved'), 18], [hands, F('calm', { look: [0.8, 0.6] }), 14]])} />}
        front={<>
          <ellipse cx={782} cy={866} rx={74} ry={16} fill={PAL.calm} opacity={0.55 * g(feet)} />
          <ellipse cx={782} cy={866} rx={74 + 16 * g(feet)} ry={20} fill="none" stroke={PAL.calm} strokeWidth={4} opacity={0.7 * g(feet)} />
          <ellipse cx={832} cy={646} rx={60} ry={9} fill={PAL.calm} opacity={0.6 * g(hands)} />
          <ChestSwirl x={ch[0]} y={ch[1]} r={30} t={c.t} amount={k(c.f, [[0, 0.5], [c.dur, 0.38]])} />
        </>} />
    </Stage>;
  },

  // 98 — the third tool lights on «ثالثها»; on «ترى» he turns to look around — an eye, a sight line to the window where a
  //      bird crosses — and on «تسمع» he tilts his head: an ear, the soft clicking from the colleague behind the partition.
  98: (c) => {
    const third = c.at('ثالثها'), see = c.at('ترى'), hear = c.at('تسمع');
    const cm = cam(900, 520, 1.15);
    const pz = poseAt(c.f, [
      [0, st(desk({ lean: 0, head: 2, turn: 0.6 }))],
      [see - 12, st(desk({ lean: -4, head: -6, turn: -0.55 })), 20],
      [see + 40, st(desk({ lean: -4, head: -10, turn: -0.35 })), 30],
      [hear - 10, st(desk({ lean: 0, head: 12, turn: 0.15 })), 20],
    ]);
    const hd = headOf(pz.p, DESK.seat.x);
    const eyeO = c.p(see - 4, 12, ease.back) * (1 - c.p(hear - 10, 10));
    const earO = c.p(hear - 2, 12, ease.back);
    const bird = c.p(see, 110, ease.lin);
    const bx = mix(560, 120, bird), by = 300 - Math.sin(bird * 3) * 20, wing = Math.sin(c.f * 0.5) * 10;
    return <Stage cam={cm} over={<ToolChips lit={2} p={c.p(third - 4, 14)} />}>
      <DeskRoom c={c} ac={0.3}
        back={<>
          {bird > 0 && bird < 1 && <path d={`M${bx - 18} ${by - wing} Q${bx - 8} ${by - 4} ${bx} ${by} Q${bx + 8} ${by - 4} ${bx + 18} ${by - wing}`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />}
          {earO > 0 && [0, 1, 2].map((i) => { const u = (c.t * 0.9 + i / 3) % 1, r = 30 + u * 90; return <path key={i} d={`M${1650 - r * 0.4} ${450 - r * 0.7} q${-r * 0.6} ${r * 0.7} 0 ${r * 1.4}`} stroke={PAL.focus} strokeWidth={6} fill="none" strokeLinecap="round" opacity={earO * (1 - u)} />; })}
        </>}
        actor={<Actor f={c.f} {...SAL} x={DESK.seat.x} y={860} s={S} facing={1} pose={pz}
          face={faceAt(c.f, [[0, F('calm', { look: [1, 0] })], [see - 8, F('listening', { look: [-1, -0.3] }), 14], [see + 40, F('listening', { look: [-0.6, -0.6] }), 20], [hear - 6, F('listening', { open: 0.7, look: [0, 0.3] }), 14]])} />}
        front={<>
          {eyeO > 0 && <>
            <path d={`M${hd[0] - 70} ${hd[1] - 20} L${mix(hd[0] - 70, 340, cl(eyeO))} ${mix(hd[1] - 20, 330, cl(eyeO))}`} stroke={PAL.focus} strokeWidth={5} strokeDasharray="4 14" strokeLinecap="round" opacity={eyeO} />
            <g transform={`translate(${hd[0] - 120} ${hd[1] - 120}) scale(${eyeO})`}><circle r={44} fill="#FFFFFF" stroke={INK} strokeWidth={4} /><IconEye s={62} /></g>
          </>}
          {earO > 0 && <g transform={`translate(${hd[0] - 130} ${hd[1] - 60}) scale(${earO})`}><circle r={44} fill="#FFFFFF" stroke={INK} strokeWidth={4} /><IconEar s={62} /></g>}
        </>} />
    </Stage>;
  },

  // 99 — close: cool air falls from the air conditioner with a hum on «المكيف»; light from the window reaches him on
  //      «وضوء»; he lifts the mug in both hands and its steam rises on «ودفء الكوب بين يديك».
  99: (c) => {
    const ac = c.at('المكيف'), light = c.at('وضوء'), warm = c.at('ودفء');
    const cm = cam(720, 440, 1.7);
    const grab = warm - 34, held = c.f >= grab + 4;
    const pz = poseAt(c.f, [
      [0, st(desk({ lean: 0, head: -2, turn: 0.5, R: { hand: [62, -150] }, L: { hand: [76, -150] } }))],
      [ac, st(desk({ lean: -2, head: -12, turn: 0.4, R: { hand: [62, -150] }, L: { hand: [76, -150] } })), 18],
      [light - 4, st(desk({ lean: -2, head: -4, turn: -0.3, R: { hand: [62, -150] }, L: { hand: [76, -150] } })), 20],
      [grab - 14, st(desk({ lean: 12, head: 10, turn: 0.7, R: { hand: [70, -150] }, L: { hand: [116, -150] } }), 'relaxed', 'grip'), 14],
      [grab + 6, st(desk({ lean: 2, head: 14, turn: 0.75, R: { hand: [40, -170] }, L: { hand: [48, -176] } }), 'grip', 'grip'), 22],
    ]);
    const rays = c.p(light - 4, 24);
    const steam = c.p(warm - 4, 20);
    return <Stage cam={cm} over={<ToolChips lit={2} p={1} />}>
      <DeskRoom c={c} ac={c.p(ac - 4, 14)} mug={!held}
        back={rays > 0 && <g opacity={rays * (0.85 + 0.15 * Math.sin(c.t * 1.5))}>
          {[0, 1, 2].map((i) => <path key={i} d={`M540 ${200 + i * 110} L540 ${260 + i * 110} L${930 + i * 40} ${560 + i * 90} L${980 + i * 40} ${470 + i * 90} Z`} fill="#FFFFFF" opacity={0.35} />)}
        </g>}
        actor={<Actor f={c.f} {...SAL} x={DESK.seat.x} y={860} s={S} facing={1} pose={pz}
          hold={held ? { L: <g transform="translate(6 20) scale(0.62)"><Mug steam={steam} t={c.t} /></g> } : undefined} upright={{ L: true }}
          face={faceAt(c.f, [[0, F('calm', { look: [0.6, 0] })], [ac, F('listening', { look: [0.4, -1] }), 14], [light, F('calm', { look: [-1, -0.2], open: 0.8 }), 14], [warm, F('relieved', { look: [0.6, 0.7] }), 18]])} />}
        front={held && steam > 0 && <ellipse cx={mix(700, 790, 1)} cy={560} rx={70} ry={50} fill="#FFFFFF" opacity={0.18 * steam} />} />
    </Stage>;
  },

  // 100 — firm ground: turned away from the problem cloud, an escape path opens to the left on «هروبًا» and fades on
  //       «المشكلة»; on «عودة … الأرض» the ground under his feet glows and roots spread; he straightens on «ستقف» and turns
  //       to face the cloud, stepping toward it on «تواجهها». The cloud does not shrink.
  100: (c) => {
    const esc = c.at('هروب'), prob = c.at('المشكلة'), ret = c.at('عودة'), grd = c.at('الأرض'), stand = c.at('ستقف'), when = c.at('حين'), face = c.at('تواجهها');
    const turnF = when + 6;
    const fac: 1 | -1 = c.f < turnF ? -1 : 1;
    const w = walkTo(c.f, face + 4, face + 44, 740, 820, 1.6);
    const x = c.f < face + 4 ? 740 : w.x;
    const pz = c.f > face + 4 && c.f < face + 44 ? { p: w.p, hands: undefined } : poseAt(c.f, [
      [0, st({ lean: 8, head: 14, turn: 0.4, bob: 4 })],
      [esc, st({ lean: 4, head: 4, turn: 0.85 }), 16],
      [prob, st({ lean: 6, head: 12, turn: 0.3 }), 18],
      [ret, st({ lean: 6, head: 26, turn: 0.35 }), 20],
      [grd, st({ head: 20, turn: 0.35, footR: [-24, 0], footL: [24, 0] }), 20],
      [stand - 6, st({ head: -2, turn: 0.4, breath: 1, footR: [-24, 0], footL: [24, 0] }), 24],
      [turnF - 10, st({ head: -2, turn: 0, body: 0, footR: [-22, 0], footL: [22, 0] }), 10],
      [turnF, st({ head: -2, turn: 0.5, footR: [-22, 0], footL: [22, 0] }), 14],
    ]);
    const path = c.p(esc, 30) * (1 - c.p(prob - 4, 26));
    const gl = c.p(grd - 4, 30);
    const roots = c.p(grd, 60);
    const t = c.t;
    return <Stage cam={cam(1060, 612, 1.4)}>
      <Paper seed={100} />
      <path d={sketch([[-20, 880], [400, 870], [900, 884], [1400, 872], [1940, 880], [1940, 1100], [-20, 1100]], 7, 3, true)} fill={PAL.floorDark} stroke={INK} strokeWidth={5} />
      {[930, 985, 1040].map((y, i) => <path key={y} d={sketch([[-20, y], [1940, y + (i % 2 ? 6 : -6)]], 20 + i, 4)} stroke={INK} strokeWidth={2.4} opacity={0.18} fill="none" />)}
      {gl > 0 && <ellipse cx={740} cy={884} rx={230 * gl} ry={26} fill={PAL.calm} opacity={0.45 * gl} />}
      {roots > 0 && [-3, -2, -1, 0, 1, 2, 3].map((i) => <path key={i} d={`M${740 + i * 8} 890 Q${740 + i * 40} ${930 + Math.abs(i) * 6} ${740 + i * 80 * roots} ${900 + 140 * roots - Math.abs(i) * 12}`} stroke={PAL.plantDark} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.8} />)}
      {path > 0 && <g opacity={path}>
        <path d="M640 900 Q520 925 440 912" stroke={PAL.textSoft} strokeWidth={8} strokeDasharray="22 18" fill="none" strokeLinecap="round" />
        <path d="M478 890 L436 912 L478 936" stroke={PAL.textSoft} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>}
      <g transform={`translate(${Math.sin(t * 0.5) * 12} ${Math.sin(t * 0.8) * 6})`}>
        <Puffs c={CLOUD} fill={PAL.storm} line={5} seed={13} />
        <path d={`M1160 ${440 + Math.sin(t * 3) * 6} L1215 400 L1265 460 L1320 390 L1375 460 L1430 400 L1485 ${450 + Math.sin(t * 3 + 1) * 6}`} stroke={PAL.provokeLight} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <WLabel x={1320} y={530} text="المشكلة" size={52} color="#FFFFFF" o={c.p(prob - 4, 14)} />
      </g>
      <Actor f={c.f} {...SAL} x={x} y={884} s={1.6} facing={fac} pose={pz}
        face={faceAt(c.f, [[0, F('sad', { look: [0, 0.6] })], [esc, F('anxious', { look: [1, 0.4] }), 12], [prob, F('neutral', { look: [0, 0.6] }), 16], [ret, F('calm', { look: [0, 1] }), 16], [stand, F('calm', { look: [0.3, 0] }), 16], [turnF, F('determined', { look: [1, -0.1] }), 12]])} />
    </Stage>;
  },
};
