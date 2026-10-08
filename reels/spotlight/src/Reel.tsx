import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { BubbleShape, Card, Chair, Clock, Cup, Dots, Flag, Flower, GhostChair, Lamp, Mic, Notebook, OUT, Scrap, Shirt, Stack, Stool, Window } from './art/stage';
import { B, F } from './beats';
import { BODY_FONT, loadFonts } from './fonts';
import { Pill, Title, Words } from './text';
import { C, H, W } from './theme';
import { FPS, TL, ease, mix, prog, sec } from './time';
import captions from './captions.json';

loadFonts();

// One paper stage, one camera, one spotlight. The spotlight stands for how much
// attention the person *thinks* the others are paying; it is never a camera.

// ---------------------------------------------------------------------------
// Keyframed tracks: [frame, ...values], eased between keys, held outside them.
// ---------------------------------------------------------------------------
type Key = number[];
const keys = (k: Key[]) => {
  k.forEach((x, i) => { if (i && x[0] <= k[i - 1][0]) throw new Error(`keys out of order: ${k[i - 1][0]} → ${x[0]}`); });
  return k;
};
const track = (f: number, k: Key[]): number[] => {
  if (f <= k[0][0]) return k[0].slice(1);
  for (let i = 1; i < k.length; i++) {
    if (f < k[i][0]) {
      const p = prog(f, k[i - 1][0], k[i][0] - k[i - 1][0], ease.inOut);
      return k[i - 1].slice(1).map((v, j) => mix(v, k[i][j + 1], p));
    }
  }
  return k[k.length - 1].slice(1);
};

// ---------------------------------------------------------------------------
// The stage (world units = pixels at zoom 1) and the camera.
// ---------------------------------------------------------------------------
const A = { x: 960, y: 810 }; // the chair of the person in the story
const L = { x: 470, y: 830 };
const R = { x: 1450, y: 830 };
const BA = { x: 960, y: 410, w: 430, h: 150 };
const BL = { x: 470, y: 490, w: 300, h: 130 };
const BR = { x: 1450, y: 490, w: 300, h: 130 };
const LAMP = { x: 960, y: 96 };
const WALL_K = 0.92; // the back wall moves a little less than the props
const FRONT_K = 1.15; // the proscenium a little more

type Cam = { cx: number; cy: number; z: number };
const CAM = keys([
  [0, 960, 570, 1.38],
  [F.s2 - sec(0.3), 960, 570, 1.45],
  [F.s2 + sec(0.9), 960, 540, 1.4],
  [F.s3 - sec(0.2), 960, 540, 1.43],
  [F.s3 + sec(0.8), 960, 520, 1.9], // inside the light
  [B.pull, 960, 525, 1.95],
  [B.pull + sec(2), 960, 560, 1.0], // the room
  [F.s4 + sec(1.2), 960, 540, 1.0],
  [F.s5 - sec(0.1), 960, 540, 1.06],
  [F.s5 + sec(0.8), 960, 560, 1.06],
  [B.bigWord - sec(0.3), 960, 560, 1.08],
  [B.bigWord + sec(0.8), 960, 430, 1.75],
  [B.wide, 960, 432, 1.8],
  [B.wide + sec(1.4), 960, 560, 1.0],
  [F.s6 - sec(0.1), 960, 560, 1.0],
  [F.s6 + sec(1), 960, 560, 1.3],
  [B.chairB - sec(0.2), 960, 560, 1.32],
  [B.chairB + sec(1), 1400, 520, 1.35],
  [F.s7 - sec(0.1), 1400, 520, 1.38],
  [F.s7 + sec(0.9), 720, 590, 1.3],
  [B.swing, 730, 590, 1.32],
  [B.swing + sec(1), 690, 590, 1.32],
  [F.s8 - sec(0.1), 690, 590, 1.32],
  [F.s8 + sec(0.9), 960, 560, 1.3],
  [B.widen, 960, 560, 1.32],
  [B.widen + sec(2.6), 960, 545, 0.96],
]);
const camAt = (f: number): Cam => { const [cx, cy, z] = track(f, CAM); return { cx, cy, z }; };
const view = (c: Cam, k = 1) => {
  const z = 1 + (c.z - 1) * k;
  return `translate(${W / 2} ${H / 2}) scale(${z}) translate(${-(W / 2 + (c.cx - W / 2) * k)} ${-(H / 2 + (c.cy - H / 2) * k)})`;
};
const toScreen = (c: Cam, x: number, y: number) => [W / 2 + (x - c.cx) * c.z, H / 2 + (y - c.cy) * c.z];
/** A point of the main layer expressed in the wall layer, so light and shadow on the wall line up with what casts them. */
const toWall = (c: Cam, x: number, y: number) => {
  const z = 1 + (c.z - 1) * WALL_K;
  return { x: W / 2 + (c.cx - W / 2) * WALL_K + ((x - c.cx) * c.z) / z, y: H / 2 + (c.cy - H / 2) * WALL_K + ((y - c.cy) * c.z) / z, k: c.z / z };
};

// ---------------------------------------------------------------------------
// The spotlight: where it points, how wide, how dark the rest is, how strong.
// ---------------------------------------------------------------------------
type Spot = { x: number; y: number; r: number; dark: number; beam: number; fy: number };
const SPOT = keys([
  [0, 1300, 590, 300, 0.96, 1, 820], // sweeping in under the title from frame 0
  [sec(1.4), 960, 560, 330, 0.96, 1, 810],
  [B.flare - sec(0.1), 960, 560, 330, 0.96, 1, 810],
  [B.flare + sec(0.5), 960, 545, 300, 0.97, 1.35, 810],
  [B.pull, 960, 545, 300, 0.97, 1.3, 810],
  [B.pull + sec(2), 960, 560, 330, 0.45, 1, 810],
  [F.s4, 960, 560, 330, 0.45, 1, 810],
  [F.s4 + sec(1.2), 960, 420, 290, 0.5, 1.1, 810],
  [B.guess, 960, 420, 290, 0.5, 1.1, 810],
  [B.guess + sec(1), 960, 440, 420, 0.5, 1.4, 810], // their estimate grows
  [B.cardA - sec(0.2), 960, 440, 420, 0.5, 1.4, 810],
  [B.cardA + sec(0.6), 960, 440, 360, 0.24, 1.1, 810],
  [F.s5, 960, 440, 360, 0.24, 1.1, 810],
  [F.s5 + sec(0.8), 960, 560, 330, 0.55, 1, 810],
  [B.bigWord, 960, 560, 330, 0.55, 1, 810],
  [B.bigWord + sec(0.8), 960, 470, 420, 0.85, 1.25, 810],
  [B.wide, 960, 470, 420, 0.85, 1.25, 810],
  [B.wide + sec(1.4), 960, 560, 330, 0.36, 0.95, 810],
  [F.s6, 960, 560, 330, 0.36, 0.95, 810],
  [F.s6 + sec(1), 960, 570, 540, 0.3, 0.7, 810],
  [B.chairB - sec(0.2), 960, 570, 540, 0.3, 0.7, 810],
  [B.chairB + sec(1), 960, 560, 1100, 0.14, 0, 830], // another chair: ordinary light, no spotlight
  [F.s7, 960, 560, 1100, 0.14, 0, 830],
  [F.s7 + sec(0.9), 960, 560, 330, 0.55, 1, 810],
  [B.swing, 960, 560, 330, 0.55, 1, 810],
  [B.swing + sec(1), 470, 590, 330, 0.55, 1, 830], // attention turns to the one in front of you
  [F.s8, 470, 590, 330, 0.55, 1, 830],
  [F.s8 + sec(0.9), 960, 560, 330, 0.6, 1, 810],
  [B.widen, 960, 560, 340, 0.6, 1, 810],
  [B.widen + sec(2.6), 960, 560, 1500, 0.08, 0.4, 810], // calm and wide
]);
const NERVES = keys([[0, 1], [B.pull, 1], [B.pull + sec(2), 0.3], [B.bigWord, 0.3], [B.bigWord + sec(0.8), 0.8], [B.wide, 0.8], [B.wide + sec(1.4), 0.3], [B.calm, 0.3], [B.calm + sec(1.2), 0]]);
const spotAt = (f: number): Spot => {
  const [x, y, r, dark, beam, fy] = track(f, SPOT);
  const [n] = track(f, NERVES);
  const t = f / FPS;
  const follow = (bubbleA(f).x - BA.x) * 0.9; // round the replay loop the light follows the bubble
  return { x: x + follow + n * (12 * Math.sin(t * 1.9) + 7 * Math.sin(t * 3.3 + 1)), y: y + n * 6 * Math.sin(t * 2.3 + 0.5), r, dark, beam, fy };
};
/** How much of the darkness falls on a point (mirrors the gradient below). */
const shadeAt = (s: Spot, x: number, y: number) => {
  const d = Math.hypot(x - s.x, y - s.y) / s.r;
  const k = d < 0.62 ? 0 : d < 0.8 ? ((d - 0.62) / 0.18) * 0.6 : d < 1 ? 0.6 + ((d - 0.8) / 0.2) * 0.4 : 1;
  return s.dark * k;
};
const lampAngle = (s: Spot) => (Math.atan2(-(s.x - LAMP.x), s.y - LAMP.y) * 180) / Math.PI;

// ---------------------------------------------------------------------------
// Things that appear and leave: a pop in, a pop out, any number of times.
// ---------------------------------------------------------------------------
type Life = { o: number; k: number };
const popIn = (f: number, at: number, until: number): Life => {
  if (f < at - 1 || f > until + sec(0.35)) return { o: 0, k: 0.6 };
  const pin = prog(f, at, sec(0.35), ease.back);
  const pout = prog(f, until, sec(0.3), ease.in);
  return { o: Math.min(prog(f, at, sec(0.12)), 1 - pout), k: (0.6 + 0.4 * pin) * (1 - 0.25 * pout) };
};
const showing = (f: number, spans: Array<[number, number]>) => spans.map(([a, b]) => popIn(f, a, b)).reduce((m, p) => (p.o > m.o ? p : m), { o: 0, k: 0.6 });

type Bub = { x: number; y: number; s: number; o: number; amp: number };
const bubbleA = (f: number): Bub => {
  const v = showing(f, [[B.bubble, F.s4 - sec(0.15)], [B.talk, F.s6], [F.s7 + sec(0.3), F.end + sec(1)]]);
  // the replay loop over the notebook (scene 2)
  const amp = prog(f, B.loop, sec(0.8), ease.inOut) * (1 - prog(f, F.s3 - sec(1.1), sec(0.9), ease.inOut));
  const th = ((f - B.loop) / sec(3)) * Math.PI * 2;
  const big = prog(f, B.bigWord, sec(0.8), ease.inOut) * (1 - prog(f, B.wide, sec(1.4), ease.inOut));
  const small = prog(f, B.smaller, sec(0.8), ease.inOut);
  return {
    x: BA.x - amp * 170 * Math.sin(th),
    y: BA.y + amp * 46 * (1 - Math.cos(th)),
    s: v.k * (1 - amp * 0.09 * Math.cos(th)) * (1 + 0.5 * big) * (1 - 0.1 * small),
    o: v.o,
    amp,
  };
};
const bubbleL = (f: number) => showing(f, [[B.pull + sec(1.1), F.s4 - sec(0.15)], [B.talk + sec(0.3), F.s6], [B.reply, F.end + sec(1)]]);
const bubbleR = (f: number) => showing(f, [[B.pull + sec(1.4), F.s4 - sec(0.15)], [B.talk + sec(0.55), F.s6], [B.slipB, B.clock + sec(0.4)], [B.widen + sec(0.8), F.end + sec(1)]]);
const slipOnR = (f: number) => f >= B.slipB - 2 && f < B.clock + sec(0.8);

// The shadow of the slip on the back wall: [scale, alpha]. It grows with the feeling.
const SHADOW = keys([
  [B.bubble, 1, 0], [B.bubble + sec(0.4), 1, 0.5], [B.swell, 1, 0.5], [B.ghosts + sec(1.5), 2.6, 0.62],
  [B.pull, 2.6, 0.62], [B.pull + sec(2), 1.5, 0.32],
  [B.talk + sec(0.4), 1.1, 0.4], [B.bigWord, 1.1, 0.4], [B.bigWord + sec(0.8), 2.1, 0.6], [B.wide, 2.1, 0.6], [B.wide + sec(1.4), 1.1, 0.35],
  [B.feeling, 1.1, 0.35], [B.feeling + sec(1.2), 2.8, 0.5], [F.s6, 2.8, 0.5],
  [F.s7, 1.2, 0.45], [B.replay, 1.2, 0.45], [B.replay + sec(1.4), 2.2, 0.55], [B.widen, 2.2, 0.55], [B.widen + sec(2.6), 1, 0.12],
]);

const bookAt = (f: number) => {
  const land = prog(f, B.notebook, sec(0.7), ease.out);
  const rise = prog(f, F.s6 - sec(0.1), sec(1.1), ease.inOut);
  const back = prog(f, B.chairB - sec(0.35), sec(0.9), ease.inOut);
  const p = rise * (1 - back);
  return { x: 960, y: mix(mix(-320, 662, land), 560, p), s: mix(0.7, 2, p), on: land > 0, lines: p > 0.15 ? 0 : Math.round(prog(f, B.details, sec(1.6)) * 4), p, back };
};
const SCRAPS: Array<{ kind: 'glance' | 'thought' | 'replay' | 'beam'; x: number; y: number; rot: number; at: number }> = [
  { kind: 'glance', x: 105, y: 22, rot: 4, at: B.noticedScrap + sec(0.15) },
  { kind: 'thought', x: -160, y: 20, rot: -7, at: B.assumedScrap + sec(0.1) },
  { kind: 'replay', x: -100, y: 26, rot: 5, at: B.assumedScrap + sec(0.32) },
  { kind: 'beam', x: -40, y: 18, rot: -4, at: B.assumedScrap + sec(0.54) },
];

const SHIRT_IN = F.s4 + sec(0.3);
const shirtAt = (f: number) => {
  const down = prog(f, SHIRT_IN, sec(1.2), ease.out);
  const up = prog(f, F.s5 - sec(0.15), sec(0.8), ease.in);
  const k = f - SHIRT_IN;
  return { y: mix(-420, 400, down) - up * 900, rot: down > 0 ? 7 * Math.sin((k / sec(0.9)) * Math.PI) * Math.exp(-Math.max(0, k) / sec(1.4)) : 0, on: down > 0 && up < 1 };
};
const cardAt = (f: number, at: number) => {
  const down = prog(f, at, sec(0.9), ease.out);
  const up = prog(f, F.s5 - sec(0.15), sec(0.8), ease.in);
  const k = f - at;
  return { y: mix(-420, 480, down) - up * 900, rot: down > 0 ? 6 * Math.sin((k / sec(1)) * Math.PI) * Math.exp(-Math.max(0, k) / sec(1.2)) : 0, on: down > 0 && up < 1 };
};
const CARD_A_X = 1450; // read first, right to left
const CARD_B_X = 470;
const CARD_S = 1.25;

// A spelling-mistake squiggle, drawn right to left.
const SQUIGGLE = `M 130 46 q -10 -9 -20 0${' t -20 0'.repeat(12)}`;

// ---------------------------------------------------------------------------
// Drawing.
// ---------------------------------------------------------------------------
const Wall: React.FC<{ f: number; cam: Cam; sp: Spot; a: Bub }> = ({ f, cam, sp, a }) => {
  const [g, alpha] = track(f, SHADOW);
  const light = Math.min(1, sp.beam) * (1 - shadeAt(sp, a.x, a.y) / Math.max(0.01, sp.dark));
  const pool = toWall(cam, sp.x, sp.y - 0.8 * sp.r);
  const sh = toWall(cam, a.x, a.y - 20 * (g - 1));
  return (
    <g>
      <rect x={-1000} y={-1000} width={3920} height={1742} fill="url(#wall)" />
      {Array.from({ length: 33 }).map((_, i) => <path key={i} d={`M ${-960 + i * 120} -400 L ${-960 + i * 120} 640`} stroke="#33428A" strokeWidth={3} opacity={0.45} />)}
      <rect x={-1000} y={640} width={3920} height={102} fill="#18214A" />
      <path d="M -1000 640 L 2920 640" stroke={C.ink} strokeWidth={5} />
      <Window x={300} y={280} />
      <Clock x={1450} y={250} t={9 + 12 * prog(f, B.clock, sec(2.2), ease.inOut)} />
      <ellipse cx={pool.x} cy={pool.y} rx={1.6 * sp.r * pool.k} ry={0.85 * sp.r * pool.k} fill="url(#wallPool)" />
      {a.o > 0 && alpha > 0 && (
        <g transform={`translate(${sh.x} ${sh.y}) scale(${a.s * g * sh.k})`} opacity={alpha * a.o * light}>
          <BubbleShape w={BA.w} h={BA.h} fill="#050816" stroke="none" />
        </g>
      )}
    </g>
  );
};

const Floor: React.FC = () => (
  <g>
    <rect x={-1000} y={740} width={3920} height={300} fill="#4A3346" />
    {Array.from({ length: 17 }).map((_, i) => <path key={i} d={`M ${960 + (i - 8) * 110} 740 L ${960 + (i - 8) * 260} 1010`} stroke="#3A2737" strokeWidth={4} />)}
    <path d="M -1000 740 L 2920 740" stroke={C.ink} strokeWidth={5} />
    <rect x={-1000} y={1010} width={3920} height={40} fill="#2A1E2A" stroke={C.ink} strokeWidth={5} />
    <rect x={-1000} y={1050} width={3920} height={1000} fill="#0B0814" />
  </g>
);

const BubbleA: React.FC<{ f: number; a: Bub }> = ({ f, a }) => {
  if (a.o <= 0.001) return null;
  const fix = prog(f, B.correct + sec(0.15), sec(0.4), ease.inOut);
  return (
    <g transform={`translate(${a.x} ${a.y}) scale(${a.s})`} opacity={a.o}>
      <BubbleShape w={BA.w} h={BA.h} />
      <path d={SQUIGGLE} fill="none" stroke={C.red} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - prog(f, B.squiggle, sec(0.45))} opacity={1 - fix} />
      <path d="M 130 46 L -130 46" stroke={C.green} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - fix} />
    </g>
  );
};

const Props: React.FC<{ f: number; t: number; a: Bub }> = ({ f, t, a }) => {
  const nb = bookAt(f);
  const sh = shirtAt(f);
  const cards = [{ x: CARD_A_X, c: cardAt(f, B.cardA), color: C.red, beam: mix(0.3, 1, prog(f, B.higher, sec(0.8))) }, { x: CARD_B_X, c: cardAt(f, B.cardB), color: C.blue, beam: 0.12 }];
  const l = bubbleL(f);
  const r = bubbleR(f);
  const slip = slipOnR(f);
  const fl = prog(f, B.apology, sec(1.1), ease.inOut);
  const flag = popIn(f, B.goal, F.end + sec(1));
  const gl = prog(f, B.glance, sec(0.35), ease.back) * (1 - prog(f, F.s6 - sec(0.3), sec(0.3)));
  const ring = prog(f, B.replay, sec(0.4)) * (1 - prog(f, B.calm, sec(0.6)));
  return (
    <g>
      <Stack x={300} y={935} />
      <Chair x={L.x} y={L.y} s={0.96} />
      <Chair x={R.x} y={R.y} s={0.96} />
      <Chair x={A.x} y={A.y} />
      <Stool x={1215} y={900} />
      <Cup x={1185} y={832} s={0.55} color={C.green} t={t} />
      <Cup x={1250} y={836} s={0.5} color={C.coral} t={t} />
      <Mic x={1660} y={940} s={0.85} />

      {/* the notebook: dropped onto the seat in scene 2, lifted and opened into two columns in scene 6 */}
      {nb.on && (
        <g>
          {nb.p > 0 && [-1, 1].map((d) => <path key={d} d={`M ${nb.x + d * 170 * nb.s} ${nb.y - 62 * nb.s} L ${nb.x + d * 200 * nb.s} -600`} stroke={C.muted} strokeWidth={2.5} opacity={nb.p} />)}
          <Notebook x={nb.x} y={nb.y} s={nb.s} lines={nb.lines} />
          {SCRAPS.map((s, i) => {
            const p = prog(f, s.at, sec(0.45), ease.back);
            if (p <= 0 || nb.back >= 1) return null;
            return <Scrap key={i} kind={s.kind} x={nb.x + s.x * nb.s} y={nb.y + (s.y - (1 - p) * 140) * nb.s} rot={s.rot} s={0.38 * nb.s} o={Math.min(1, p * 3) * (1 - nb.back)} />;
          })}
        </g>
      )}

      {fl > 0 && <Flower x={mix(880, 500, fl)} y={mix(640, 660, fl) - 130 * Math.sin(fl * Math.PI)} s={1.25} o={prog(f, B.apology, sec(0.15))} />}
      {flag.o > 0 && <Flag x={725} y={835} s={1.35 * flag.k} o={flag.o} />}

      {/* the shirt and the two cards hang from the flies on strings */}
      {sh.on && (
        <g transform={`rotate(${sh.rot} 960 ${sh.y - 250})`}>
          <path d={`M 960 ${sh.y - 250} L 960 -900`} stroke={C.muted} strokeWidth={3} />
          <Shirt x={960} y={sh.y} pic={prog(f, B.picture, sec(0.35), ease.back)} />
        </g>
      )}
      {cards.map(({ x, c, color, beam }, i) => c.on && (
        <g key={i} transform={`rotate(${c.rot} ${x} ${c.y - 150 * CARD_S})`}>
          {[-1, 1].map((d) => <path key={d} d={`M ${x + d * 150 * CARD_S} ${c.y - 150 * CARD_S} L ${x + d * 150 * CARD_S} ${c.y - 1100}`} stroke={C.muted} strokeWidth={3} />)}
          <Card x={x} y={c.y} s={CARD_S} beam={beam} color={color} />
        </g>
      ))}

      {/* the replay loop (scene 2) and the urge to replay once more (scene 8) */}
      {a.amp > 0.01 && (
        <g opacity={a.amp * 0.9} fill="none" stroke={C.warm} strokeWidth={6} strokeLinecap="round">
          <ellipse cx={960} cy={456} rx={300} ry={70} strokeDasharray="24 18" strokeDashoffset={-t * 120} />
          <path d="M 642 440 L 660 466 L 678 440" />
          <path d="M 1242 472 L 1260 446 L 1278 472" />
        </g>
      )}
      {ring > 0 && (
        <g transform={`translate(${a.x} ${a.y})`} opacity={ring} fill="none" stroke={C.red} strokeWidth={7} strokeLinecap="round">
          <ellipse rx={300} ry={132} strokeDasharray="30 22" strokeDashoffset={-t * 160} />
          <path d="M 282 -16 L 300 12 L 318 -16" />
        </g>
      )}

      {/* the others: their own talk, their own things */}
      {l.o > 0 && (
        <g transform={`translate(${BL.x} ${BL.y}) scale(${l.k})`} opacity={l.o}>
          <BubbleShape w={BL.w} h={BL.h} />
          {f < F.s4 ? <Cup x={0} y={36} s={0.5} color={C.coral} t={t} /> : <Dots t={t} />}
        </g>
      )}
      {r.o > 0 && (
        <g transform={`translate(${BR.x} ${BR.y}) scale(${r.k})`} opacity={r.o}>
          <BubbleShape w={slip ? BA.w : BR.w} h={slip ? BA.h : BR.h} />
          {slip ? <path d={SQUIGGLE} fill="none" stroke={C.red} strokeWidth={5} strokeLinecap="round" /> : <Dots t={t + 1.3} />}
        </g>
      )}
      <BubbleA f={f} a={a} />

      {/* someone may glance: a small, real look — next to the big feeling */}
      {gl > 0 && (
        <g opacity={Math.min(1, gl)}>
          <path d="M 622 452 Q 690 392 742 414" fill="none" stroke={C.blueLight} strokeWidth={5} strokeDasharray="12 10" strokeLinecap="round" />
          <Scrap kind="glance" x={668} y={350} rot={-6} s={0.75 * Math.min(1.1, gl)} />
        </g>
      )}
    </g>
  );
};

const Ghosts: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  const out = 1 - prog(f, B.loop, sec(0.6));
  const ch = prog(f, B.ghostChairs, sec(0.5)) * out;
  if (ch <= 0) return null;
  return (
    <g>
      <GhostChair x={L.x} y={L.y} s={0.96} o={ch * 0.8} />
      <GhostChair x={R.x} y={R.y} s={0.96} o={ch * 0.8} />
      {[BL, BR].map((b, i) => {
        const p = prog(f, B.ghosts + i * sec(0.35), sec(0.4), ease.back);
        if (p <= 0) return null;
        return (
          <g key={i} transform={`translate(${b.x} ${b.y + Math.sin(t * 1.3 + i) * 6}) scale(${0.6 + 0.4 * p})`} opacity={Math.min(1, p) * out * 0.85}>
            <BubbleShape w={b.w} h={b.h} fill="rgba(159,179,207,0.06)" stroke={C.muted} dashed />
            <Dots t={t + i} color={C.muted} />
          </g>
        );
      })}
    </g>
  );
};

const Curtains: React.FC<{ t: number }> = ({ t }) => {
  const sway = Math.sin(t * 0.8) * 5;
  const side = (
    <g>
      <path d={`M -700 -300 L 205 -300 Q ${150 + sway} 300 122 650 Q ${196 + sway} 770 246 1120 L -700 1120 Z`} fill={C.curtain} {...OUT} />
      {[40, 100, 160].map((x, i) => <path key={i} d={`M ${x} -300 Q ${x - 20 + sway * 0.6} 300 ${x - 30 + i * 10} 640`} fill="none" stroke={C.curtainDark} strokeWidth={10} strokeLinecap="round" />)}
      <ellipse cx={128} cy={656} rx={26} ry={18} fill={C.amber} {...OUT} strokeWidth={4} />
    </g>
  );
  let edge = '';
  for (let x = 2620; x > -700; x -= 160) edge += ` Q ${x - 80} 150 ${x - 160} 70`;
  return (
    <g>
      {side}
      <g transform={`translate(${W} 0) scale(-1 1)`}>{side}</g>
      <path d={`M -700 -300 L 2620 -300 L 2620 70${edge} Z`} fill={C.curtain} {...OUT} />
      <path d={`M 2620 70${edge}`} fill="none" stroke={C.amber} strokeWidth={6} transform="translate(0 -14)" />
    </g>
  );
};

const World: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cam = camAt(f);
  const sp = spotAt(f);
  const a = bubbleA(f);
  const rot = lampAngle(sp);
  const ax = LAMP.x - 34 * Math.sin((rot * Math.PI) / 180);
  const ay = LAMP.y + 34 * Math.cos((rot * Math.PI) / 180);
  const seed = 2 + (Math.floor(t * 8) % 3); // the doodle line boils 8 times a second, whatever the fps
  const beam = Math.min(1, sp.beam);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves={1} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={2.6 / cam.z} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="lift" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx={0} dy={8} stdDeviation={6} floodColor="#000" floodOpacity={0.35} />
        </filter>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A2552" /><stop offset="1" stopColor="#2A3A74" /></linearGradient>
        <radialGradient id="wallPool"><stop offset="0" stopColor={C.warm} stopOpacity={0.42 * beam} /><stop offset="0.6" stopColor={C.warm} stopOpacity={0.18 * beam} /><stop offset="1" stopColor={C.warm} stopOpacity={0} /></radialGradient>
        <radialGradient id="floorPool"><stop offset="0" stopColor={C.warm} stopOpacity={0.5} /><stop offset="1" stopColor={C.warm} stopOpacity={0} /></radialGradient>
        <radialGradient id="hole">
          <stop offset="0" stopColor="#000" stopOpacity={1} />
          <stop offset="0.62" stopColor="#000" stopOpacity={1} />
          <stop offset="0.8" stopColor="#000" stopOpacity={0.4} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="wallHole"><stop offset="0" stopColor="#000" stopOpacity={0.85 * beam} /><stop offset="0.55" stopColor="#000" stopOpacity={0.6 * beam} /><stop offset="1" stopColor="#000" stopOpacity={0} /></radialGradient>
        <mask id="veil" maskUnits="userSpaceOnUse" x={-1000} y={-1000} width={3920} height={3080}>
          <rect x={-1000} y={-1000} width={3920} height={3080} fill="#fff" />
          <ellipse cx={sp.x} cy={Math.min(sp.y - 0.8 * sp.r, 600)} rx={1.6 * sp.r} ry={0.85 * sp.r} fill="url(#wallHole)" />
          <circle cx={sp.x} cy={sp.y} r={sp.r} fill="url(#hole)" />
        </mask>
        <linearGradient id="beam" gradientUnits="userSpaceOnUse" x1={ax} y1={ay} x2={sp.x} y2={sp.fy}>
          <stop offset="0" stopColor={C.warm} stopOpacity={0.42} />
          <stop offset="1" stopColor={C.warm} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <g transform={view(cam, WALL_K)}><Wall f={f} cam={cam} sp={sp} a={a} /></g>
      <g transform={view(cam)}>
        <Floor />
        <ellipse cx={sp.x} cy={sp.fy} rx={sp.r * 0.95} ry={sp.r * 0.22} fill="url(#floorPool)" opacity={beam} />
        <g filter="url(#boil)"><Props f={f} t={t} a={a} /></g>
        <rect x={-1000} y={-1000} width={3920} height={3080} fill="#050816" opacity={sp.dark} mask="url(#veil)" />
      </g>
      {/* the night window keeps its own faint light in the dark */}
      <g transform={view(cam, WALL_K)} opacity={sp.dark * 0.8}><Window x={300} y={280} /></g>
      <g transform={view(cam)}>
        {sp.beam > 0.01 && <path d={`M ${ax - 20} ${ay} L ${sp.x - 0.9 * sp.r} ${sp.fy} L ${sp.x + 0.9 * sp.r} ${sp.fy} L ${ax + 20} ${ay} Z`} fill="url(#beam)" opacity={Math.min(1, 0.5 * sp.beam)} />}
        <Lamp x={LAMP.x} y={LAMP.y} rot={rot} on={beam} />
        <g filter="url(#boil)"><Ghosts f={f} t={t} /></g>
      </g>
      <g transform={view(cam, FRONT_K)}><Curtains t={t} /></g>
    </svg>
  );
};

const Grain: React.FC = () => (
  <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <defs>
      <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={5} /><feColorMatrix values="0 0 0 0 0.97  0 0 0 0 0.93  0 0 0 0 0.86  0 0 0 0.07 0" /></filter>
      <radialGradient id="vig" cx="50%" cy="48%" r="75%"><stop offset="60%" stopColor="#000" stopOpacity={0} /><stop offset="100%" stopColor="#000" stopOpacity={0.4} /></radialGradient>
    </defs>
    <rect width={W} height={H} filter="url(#paper)" />
    <rect width={W} height={H} fill="url(#vig)" />
  </svg>
);

// ---------------------------------------------------------------------------
// Words: titles and labels (the approved copy), captions (the locked script).
// Labels ride their props through the same camera, so they sit on the paper.
// ---------------------------------------------------------------------------
const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const list = captions as Array<{ text: string; start: number; end: number }>;
  const until = (i: number) => (list[i + 1] ? Math.max(list[i].end, Math.min(list[i + 1].start - 0.05, list[i].end + 0.6)) : list[i].end + 0.6);
  const i = list.findIndex((c, k) => t >= c.start - 0.05 && t < until(k));
  if (i < 0) return null;
  return (
    <div style={{ position: 'absolute', bottom: 40, left: 120, right: 120, display: 'flex', justifyContent: 'center', opacity: prog(f, sec(list[i].start - 0.05), sec(0.15)) }}>
      <div dir="rtl" lang="ar" style={{ fontFamily: BODY_FONT, fontWeight: 700, fontSize: 54, lineHeight: 1.3, color: C.ivory, background: 'rgba(8,12,30,0.8)', padding: '8px 34px 14px', borderRadius: 24, textAlign: 'center', maxWidth: 1500 }}>
        {list[i].text}
      </div>
    </div>
  );
};

const Texts: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const sp = spotAt(f);
  const lit = (x: number, y: number) => 1 - 0.85 * shadeAt(sp, x, y);
  const at = (x: number, y: number, w: number, size: number, s = 1) => { const [sx, sy] = toScreen(cam, x, y); return { x: sx, y: sy, w: w * s * cam.z, size: size * s * cam.z }; };
  const a = bubbleA(f);
  const fix = prog(f, B.correct + sec(0.15), sec(0.4), ease.inOut);
  const r = bubbleR(f);
  const slips = [
    { x: a.x, y: a.y - 6 - 14 * fix, s: a.s, o: a.o * (1 - fix) * lit(a.x, a.y) },
    { x: BR.x, y: BR.y - 6, s: r.k, o: slipOnR(f) ? r.o * lit(BR.x, BR.y) : 0 },
  ].filter((b) => b.o > 0.01);
  const fixed = { ...at(a.x, a.y - 6 + 14 * (1 - fix), 400, 62, a.s), o: a.o * fix * lit(a.x, a.y) };
  const cards = [cardAt(f, B.cardA), cardAt(f, B.cardB)].map((c, i) => {
    const x = i ? CARD_B_X : CARD_A_X;
    const rr = (c.rot * Math.PI) / 180;
    return { ...at(x - 35 * CARD_S * Math.sin(rr), c.y - 150 * CARD_S + 35 * CARD_S * Math.cos(rr), 400, 42, CARD_S), rot: c.rot, o: c.on ? 1 : 0 };
  });
  const nb = bookAt(f);
  const col = (side: 1 | -1, from: number) => ({ ...at(nb.x + side * 105 * nb.s, nb.y - 36 * nb.s, 180, 27, nb.s), o: prog(f, from, sec(0.3)) * (1 - prog(f, B.chairB - sec(0.4), sec(0.3))) });
  const seen = col(1, B.noticed);
  const guessed = col(-1, B.assumed);
  return (
    <AbsoluteFill>
      {/* the hook: fully on screen for the first 3 s while the spotlight sweeps under it */}
      <Title text={`تحس إن الكل {${C.warm}|يراقبك؟}`} from={0} to={B.hookEnd} size={108} top={56} plate pop />
      {slips.map((b, i) => { const p = at(b.x, b.y, 400, 62, b.s); return <Words text="صباح الخير" key={i} x={p.x} y={p.y} w={p.w} size={p.size} o={b.o} color={C.ink} />; })}
      <Title text={`تأثير {${C.warm}|بقعة الضوء}`} from={B.name} to={F.s3 - 2} size={112} top={56} plate />
      <Title text={`تقديرك {${C.warm}|لانتباههم}`} from={B.estimate} to={B.estimateEnd} size={100} top={56} plate />
      <Pill text="جيلوفيتش وزملاؤه، 2000" x={960} y={34} bg="rgba(27,31,51,0.9)" from={B.source} to={F.s5 - 2} size={40} w={640} />
      <Words text="ما توقّعوه" x={cards[0].x} y={cards[0].y} w={cards[0].w} size={cards[0].size} rot={cards[0].rot} o={cards[0].o} color={C.paper} />
      <Words text="ما تذكّره الآخرون" x={cards[1].x} y={cards[1].y} w={cards[1].w} size={cards[1].size} rot={cards[1].rot} o={cards[1].o} color={C.paper} />
      <Words text="لاحظت" x={seen.x} y={seen.y} w={seen.w} size={seen.size} o={seen.o} color={C.blue} />
      <Words text="افترضت" x={guessed.x} y={guessed.y} w={guessed.w} size={guessed.size} o={guessed.o} color={C.violet} />
      <Words text="مساء الخير" x={fixed.x} y={fixed.y} w={fixed.w} size={fixed.size} o={fixed.o} color={C.ink} />
      <Title text={`وسّع الصورة… {${C.warm}|وكمّل}`} from={B.closing} to={F.end + sec(1)} size={108} top={56} plate />
      <Pill text="كتاب وبس" x={960} y={948} bg="rgba(27,31,51,0.85)" from={B.sign} to={F.end + sec(1)} size={44} w={320} />
      <Captions />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Sound: each recorded line at its place, and light paper and light effects. No music.
// ---------------------------------------------------------------------------
const SFX: Array<[string, number, number]> = [
  ['whoosh', 2, 0.1], ['pop', B.bubble, 0.22], ['scribble', B.squiggle, 0.14], ['whoosh', B.ghostChairs, 0.07], ['pop', B.ghosts, 0.1], ['pop', B.ghosts + sec(0.35), 0.09],
  ['pageflip', B.notebook + sec(0.5), 0.3], ['thud', B.flare, 0.16], ['click', B.flare, 0.28], ['scribble', B.details, 0.12], ['chime', B.name + sec(0.2), 0.13],
  ['whoosh', B.pull, 0.18], ['pop', B.pull + sec(1.1), 0.12], ['pop', B.pull + sec(1.4), 0.1],
  ['whoosh', F.s4, 0.12], ['snap', B.picture, 0.26], ['click', B.guess, 0.18], ['pop', B.cardA + sec(0.3), 0.16], ['pop', B.cardB + sec(0.3), 0.14],
  ['whoosh', F.s5 - sec(0.1), 0.12], ['pop', B.talk, 0.12], ['whoosh', B.bigWord, 0.14], ['whoosh', B.wide, 0.12], ['click', B.glance, 0.18],
  ['pageflip', F.s6, 0.3], ['pop', B.noticed, 0.12], ...SCRAPS.map((s): [string, number, number] => ['click', s.at + sec(0.2), 0.2]), ['pop', B.assumed, 0.12],
  ['whoosh', B.chairB, 0.12], ['pop', B.slipB, 0.16], ['ratchet', B.clock, 0.1],
  ['pop', F.s7 + sec(0.3), 0.16], ['whoosh', B.apology, 0.09], ['chime', B.apology + sec(1), 0.1], ['scribble', B.correct, 0.13], ['chime', B.correct + sec(0.45), 0.12],
  ['pop', B.reply, 0.14], ['whoosh', B.swing, 0.12], ['pop', B.goal, 0.14],
  ['ratchet', B.replay, 0.08], ['whoosh', B.widen, 0.1], ['chime', B.closing, 0.12], ['chime', B.sign, 0.08],
];

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: C.navy }}>
    <World />
    <Grain />
    <Texts />
    {TL.segments.map((s) => (
      <Sequence key={s.id} from={sec(s.fileStart)} layout="none"><Audio src={staticFile(s.file)} /></Sequence>
    ))}
    {SFX.filter(([, at]) => Number.isFinite(at) && at >= 0 && at < TL.durationInFrames).map(([name, at, vol], i) => (
      <Sequence key={i} from={at} durationInFrames={sec(1.6)} layout="none"><Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} /></Sequence>
    ))}
  </AbsoluteFill>
);
