import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { K } from './art/props';
import { Pencil, PencilMood, PencilTone } from './art/pencil';
import { B, F } from './beats';
import { TITLE_FONT, loadFonts } from './fonts';
import { Caption, Pill, Title } from './text';
import { C, H, SKY, W } from './theme';
import { TL, ease, mix, prog, sec } from './time';

loadFonts();

const OUT = { stroke: K.ink, strokeWidth: 6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
type Pt = [number, number];

// ---------------------------------------------------------------------------
// Light of each part, cross-faded.
// ---------------------------------------------------------------------------
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const PARTS: Array<[number, keyof typeof SKY]> = [
  [0, 'hook'], [F.s2, 'lab'], [F.s3, 'crowd'], [F.s4, 'press'], [F.s5, 'spark'], [F.s6, 'voice'], [F.s7, 'dawn'],
];
const Sky: React.FC = () => {
  const f = useCurrentFrame();
  let top = hex(SKY.hook[0]);
  let bot = hex(SKY.hook[1]);
  for (const [at, name] of PARTS) {
    const p = prog(f, at - 8, name === 'dawn' ? 36 : 16, ease.inOut);
    if (p <= 0) break;
    top = top.map((v, i) => mix(v, hex(SKY[name][0])[i], p));
    bot = bot.map((v, i) => mix(v, hex(SKY[name][1])[i], p));
  }
  const rgb = (c: number[]) => `rgb(${c.map(Math.round).join(',')})`;
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${rgb(top)} 0%, ${rgb(bot)} 100%)` }} />;
};

const Grain: React.FC = () => (
  <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <defs>
      <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={5} /><feColorMatrix values="0 0 0 0 0.97  0 0 0 0 0.93  0 0 0 0 0.86  0 0 0 0.08 0" /></filter>
      <radialGradient id="vig" cx="50%" cy="46%" r="78%"><stop offset="58%" stopColor="#000" stopOpacity={0} /><stop offset="100%" stopColor="#000" stopOpacity={0.45} /></radialGradient>
    </defs>
    <rect width={W} height={H} filter="url(#paper)" />
    <rect width={W} height={H} fill="url(#vig)" />
  </svg>
);

// ---------------------------------------------------------------------------
// Drawing helpers: a path the pencil can trace, point by point.
// ---------------------------------------------------------------------------
const cubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 28): Pt[] => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n;
  const a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, d = t ** 3;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]] as Pt;
});
type Trace = { pts: Pt[]; cum: number[]; d: string };
const trace = (...parts: Pt[][]): Trace => {
  const pts = parts.flat();
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, d: 'M ' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') };
};
const along = (t: Trace, p: number): Pt => {
  const L = t.cum[t.cum.length - 1] * Math.max(0, Math.min(1, p));
  let i = 1;
  while (i < t.cum.length - 1 && t.cum[i] < L) i++;
  const seg = t.cum[i] - t.cum[i - 1] || 1;
  const u = (L - t.cum[i - 1]) / seg;
  return [mix(t.pts[i - 1][0], t.pts[i][0], u), mix(t.pts[i - 1][1], t.pts[i][1], u)];
};
const line = (a: Pt, b: Pt): Pt[] => [a, b];

// The Arabic question mark «؟», drawn as one stroke (its curve bulges left).
const QC: Pt = [540, 780];
const QS = 1.45;
const q = (x: number, y: number): Pt => [QC[0] + x * QS, QC[1] + y * QS];
const Q = trace(cubic(q(70, -120), q(70, -205), q(-92, -212), q(-92, -112)), cubic(q(-92, -112), q(-92, -42), q(0, -46), q(0, 26)), line(q(0, 26), q(0, 74)));
const QDOT = q(0, 140);

// The other way round the wall.
const ROAD_Y = 1330;
const WALL_X = 470;
const ALT = trace(line([960, ROAD_Y], [650, ROAD_Y]), cubic([650, ROAD_Y], [590, ROAD_Y], [560, 1060], [WALL_X, 1060]), cubic([WALL_X, 1060], [380, 1060], [350, ROAD_Y], [290, ROAD_Y]), line([290, ROAD_Y], [120, ROAD_Y]));

// ---------------------------------------------------------------------------
// Asch's cards: a reference line, and three to choose from (أ ب ج).
// ---------------------------------------------------------------------------
const OPTS = [{ x: -110, len: 170, label: 'أ' }, { x: -225, len: 250, label: 'ب' }, { x: -340, len: 330, label: 'ج' }];
const BASE = 160;

const Board: React.FC<{ x: number; y: number; s: number; o: number; draw: number; pick?: number; pickColor?: string; pick2?: number; pick2Color?: string }> = ({ x, y, s, o, draw, pick = -1, pickColor = C.green, pick2 = -1, pick2Color = C.green }) => {
  if (o <= 0) return null;
  const glow = (i: number) => (i === pick ? pickColor : i === pick2 ? pick2Color : null);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      {[1, -1].map((side) => (
        <g key={side}>
          <rect x={side > 0 ? 24 + 10 : -436 + 10} y={-196 + 14} width={412} height={416} rx={22} fill="#000" opacity={0.25} />
          <rect x={side > 0 ? 24 : -436} y={-196} width={412} height={416} rx={22} fill={K.paper} {...OUT} />
        </g>
      ))}
      <path d={`M 230 ${BASE} L 230 ${BASE - 250}`} stroke={K.ink} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      {OPTS.map((op, i) => {
        const c = glow(i);
        return (
          <g key={i}>
            {c && <rect x={op.x - 40} y={BASE - op.len - 22} width={80} height={op.len + 92} rx={18} fill={c} opacity={0.28} />}
            <path d={`M ${op.x} ${BASE} L ${op.x} ${BASE - op.len}`} stroke={c ?? K.ink} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
            <text x={op.x} y={BASE + 44} textAnchor="middle" fontFamily={TITLE_FONT} fontWeight={900} fontSize={46} fill={K.ink} opacity={draw}>{op.label}</text>
          </g>
        );
      })}
    </g>
  );
};

/** A speech bubble with one letter: the answer someone gives out loud. */
const Bubble: React.FC<{ x: number; y: number; letter: string; color: string; p: number; s?: number; o?: number; rot?: number }> = ({ x, y, letter, color, p, s = 1, o = 1, rot = 0 }) => {
  if (p <= 0 || o <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * (0.4 + 0.6 * p)})`} opacity={Math.min(1, p * 2) * o}>
      <path d="M -50 -42 Q -50 -50 -42 -50 L 42 -50 Q 50 -50 50 -42 L 50 30 Q 50 38 42 38 L 12 38 L 0 58 L -12 38 L -42 38 Q -50 38 -50 30 Z" fill={color} {...OUT} strokeWidth={5} />
      <text x={0} y={-4} textAnchor="middle" dominantBaseline="central" fontFamily={TITLE_FONT} fontWeight={900} fontSize={58} fill={K.paper}>{letter}</text>
    </g>
  );
};

const Spark: React.FC<{ x: number; y: number; p: number; color?: string }> = ({ x, y, p, color = C.amber }) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={1 - p}>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const r0 = 30 + p * 50, r1 = 60 + p * 80;
        return <path key={i} d={`M ${Math.cos(a) * r0} ${Math.sin(a) * r0} L ${Math.cos(a) * r1} ${Math.sin(a) * r1}`} stroke={color} strokeWidth={9} strokeLinecap="round" />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Who stands where.
// ---------------------------------------------------------------------------
type Actor = { key: string; x: number; y: number; s: number; rot?: number; squash?: number; mood?: PencilMood; look?: Pt; tone: PencilTone; sweat?: number; o?: number; bend?: number };
const HOOK_X = (i: number) => 960 - i * 140;
const HOOK_TONE: PencilTone[] = ['grey', 'green', 'grey', 'coral', 'grey', 'amber', 'grey'];
const SEAT_X = (i: number) => 930 - i * 142;
const ROW_Y = 1440;
const ROW_S = 0.5;
const head = (y: number, s: number) => y - 466 * s;
const loop = (f: number, from: number, len: number) => (f < from ? 0 : ((f - from) % len) / len);
const wrongAt = (i: number) => mix(B.wrongFrom, B.wrongTo, i / 4);
const greyAt = (i: number) => mix(B.greyFrom, B.greyTo, i / 3);
const statAt = (k: number) => mix(B.statFrom, B.statTo, k / 2);
const pileAt = (k: number) => mix(B.pileFrom, B.pileTo, k / 5);
const STAT_X = [825, 635, 445, 255];

const actors = (f: number): Actor[] => {
  const a: Actor[] = [];
  // 1 — the saying, acted by a row
  if (f < F.s2) {
    for (let i = 0; i < 7; i++) {
      const tone = HOOK_TONE[i];
      const sway = Math.sin(f / 9 + i) * 1.5;
      if (tone === 'green') {
        const up = prog(f, B.rebel, 10, ease.back);
        a.push({ key: `h${i}`, tone, x: HOOK_X(i), y: 1330 - Math.sin(prog(f, B.rebel, 12) * Math.PI) * 50, s: 0.74, rot: 9 * up + sway, mood: 'eager', look: [0.4, -0.6] });
      } else if (tone === 'coral') {
        a.push({ key: `h${i}`, tone, x: HOOK_X(i), y: 1330 - Math.sin(prog(f, B.creative, 12) * Math.PI) * 50, s: 0.74, rot: sway, squash: -0.12 * prog(f, B.creative, 6) * (1 - prog(f, B.creative + 8, 8)), mood: 'eager', look: [0, -1] });
      } else {
        const bow = prog(f, B.bow + i * 3, 12, ease.out);
        const isMe = tone === 'amber';
        const worry = isMe ? prog(f, B.why + 4, 10) : 0;
        a.push({ key: `h${i}`, tone, x: HOOK_X(i), y: 1330, s: 0.74, rot: -22 * bow + sway * (1 - bow), squash: 0.06 * bow, mood: bow > 0.5 ? 'tired' : 'calm', look: isMe && worry > 0 ? [Math.sin(f / 7), 0.4] : [-0.3, 0.8 * bow], sweat: isMe ? loop(f, B.why + 8, 36) : 0 });
      }
    }
    return a;
  }
  // 2 — alone with the cards
  if (f < F.s3) {
    const ans = prog(f, B.aloneAns, 10, ease.back);
    a.push({ key: 'me', tone: 'amber', x: 540, y: 1440 - Math.sin(prog(f, B.aloneAns, 12) * Math.PI) * 40, s: 0.62, rot: 0, mood: ans > 0.5 ? 'proud' : 'eager', look: ans > 0.5 ? [-0.4, -0.7] : [0, -1] });
    return a;
  }
  // 3a — the group answers, one by one; he gives in
  if (f < B.stat) {
    const enter = prog(f, B.group - 12, 18, ease.out);
    for (let i = 0; i < 5; i++) a.push({ key: `g${i}`, tone: 'grey', x: mix(1260 + i * 70, SEAT_X(i), enter), y: ROW_Y, s: ROW_S, mood: 'calm', look: [0, -0.8] });
    const cave = prog(f, B.cave - 6, 10, ease.out);
    a.push({ key: 'me', tone: 'amber', x: mix(540, SEAT_X(5), enter), y: ROW_Y, s: mix(0.62, ROW_S, enter), rot: -16 * cave, squash: 0.08 * cave, mood: cave > 0.5 ? 'tired' : 'busy', look: cave > 0.5 ? [0, 1] : [Math.sign(Math.sin(f / 6)) * 0.9, -0.3], sweat: f >= B.wrongFrom ? loop(f, B.wrongFrom, 30) : 0 });
    return a;
  }
  // 3b — three of four
  if (f < F.s4) {
    const inP = prog(f, B.stat - 2, 12, ease.back);
    STAT_X.forEach((x, k) => {
      const bend = k < 3 ? prog(f, statAt(k), 10, ease.out) : 0;
      a.push({ key: `st${k}`, tone: 'amber', x, y: 1330 + (1 - inP) * 120, s: 0.66 * Math.max(0.01, inP), rot: -24 * bend, squash: 0.06 * bend, mood: k === 3 ? 'eager' : bend > 0.5 ? 'tired' : 'calm', look: k === 3 ? [0, -0.8] : [0, 0.9 * bend] });
    });
    return a;
  }
  // 4 — the pile; 5 — the push, the question, the other way
  if (f < F.s6) {
    const landed = Array.from({ length: 6 }).filter((_, k) => f >= pileAt(k) + 8).length;
    const burst = prog(f, B.ask, 8, ease.out);
    const press = (landed / 6) * (1 - burst);
    if (f < B.askDraw) {
      a.push({ key: 'me', tone: 'amber', x: 540, y: 1480 - burst * 30, s: 0.72, squash: 0.42 * press - 0.18 * burst * (1 - prog(f, B.ask + 8, 8)), rot: Math.sin(f / 2.2) * 2 * press, mood: burst > 0 ? 'eager' : press > 0.3 ? 'tired' : 'busy', look: burst > 0 ? [0, -1] : [0, 0.6], sweat: f < B.ask ? loop(f, B.pileFrom + 8, 26) : 0 });
    } else if (f < B.alt - 6) {
      const draw = prog(f, B.askDraw, 26, ease.inOut);
      const [x, y] = along(Q, draw);
      const lift = prog(f, B.askDraw - 6, 8, ease.inOut);
      a.push({ key: 'me', tone: 'amber', x: mix(540, x, lift), y: mix(1480, y, lift), s: 0.58, rot: 18, mood: 'eager', look: [-0.6, 0.6] });
    } else {
      const go = prog(f, B.alt - 6, 12, ease.inOut);
      const draw = prog(f, B.altDraw, 34, ease.inOut);
      const [qx, qy] = along(Q, 1);
      const [x, y] = draw > 0 ? along(ALT, draw) : ([mix(qx, ALT.pts[0][0], go), mix(qy, ALT.pts[0][1], go) - Math.sin(go * Math.PI) * 80] as Pt);
      a.push({ key: 'me', tone: 'amber', x, y, s: 0.55, rot: draw > 0 && draw < 1 ? 20 : 6, mood: draw >= 1 ? 'proud' : 'eager', look: [-0.8, 0.4] });
    }
    return a;
  }
  // 6 — the room again: one green voice; 7 — the door
  const inRoom = prog(f, F.s6 - 4, 10, ease.out);
  const open = prog(f, B.open, 22, ease.inOut);
  for (let i = 0; i < 4; i++) {
    const lift = f >= F.s7 ? prog(f, B.open + 6 + i * 4, 10, ease.back) : 0;
    const droop = f >= F.s7 ? 1 - lift : 0;
    a.push({ key: `g${i}`, tone: 'grey', x: SEAT_X(i), y: ROW_Y + (1 - inRoom) * 60, s: ROW_S, rot: -12 * droop, mood: f >= F.s7 ? (lift > 0.5 ? 'eager' : 'tired') : 'calm', look: f >= F.s7 && lift > 0.5 ? [0.2 * (i - 1.5), -1] : [0, -0.8], o: inRoom });
  }
  const partner = prog(f, B.partner, 10, ease.back);
  a.push({ key: 'green', tone: 'green', x: SEAT_X(4), y: ROW_Y + (1 - inRoom) * 60 - Math.sin(prog(f, B.partner, 12) * Math.PI) * 30, s: ROW_S, rot: 4 * partner, mood: 'eager', look: [0, -0.8], o: inRoom });
  const stand = prog(f, B.stand, 12, ease.back);
  a.push({ key: 'me', tone: 'amber', x: SEAT_X(5), y: ROW_Y + (1 - inRoom) * 60, s: ROW_S, rot: -14 * (1 - stand), squash: 0.06 * (1 - stand), mood: stand > 0.5 ? (open > 0 ? 'proud' : 'eager') : 'tired', look: stand > 0.5 ? [0.6, -0.6] : [0.8, 0.4], sweat: stand < 0.5 && f > B.greyFrom ? loop(f, B.greyFrom, 30) : 0, o: inRoom });
  return a;
};

// ---------------------------------------------------------------------------
// Things in the world besides the pencils.
// ---------------------------------------------------------------------------
const boardAt = (f: number) => {
  if (f < F.s2 || f >= F.s7) return null;
  if (f < F.s3) return { x: 540, y: 780, s: 1, o: prog(f, B.board - 4, 10), draw: prog(f, B.lines, 16, ease.inOut), pick: f >= B.aloneAns ? 1 : -1, pickColor: C.green };
  if (f < F.s4) return { x: 540, y: mix(780, 740, prog(f, B.group - 12, 18, ease.inOut)), s: mix(1, 0.92, prog(f, B.group - 12, 18, ease.inOut)), o: 1 - prog(f, B.stat - 4, 8), draw: 1, pick: f >= wrongAt(0) ? 2 : -1, pickColor: C.red };
  if (f < F.s6) return null;
  return { x: 540, y: 740, s: 0.92, o: prog(f, F.s6 - 4, 10) * (1 - prog(f, B.bar - 2, 8)), draw: 1, pick: f >= greyAt(0) ? 2 : -1, pickColor: C.red, pick2: f >= B.partner ? 1 : -1, pick2Color: C.green };
};

const Bubbles: React.FC<{ f: number }> = ({ f }) => {
  const out: React.ReactNode[] = [];
  const by = head(ROW_Y, ROW_S) - 70;
  if (f >= F.s2 && f < F.s3) {
    out.push(<Bubble key="alone" x={540} y={head(1440, 0.62) - 70} letter="ب" color={C.green} p={prog(f, B.aloneAns, 8, ease.back)} />);
  }
  if (f >= F.s3 && f < B.stat) {
    for (let i = 0; i < 5; i++) out.push(<Bubble key={`w${i}`} x={SEAT_X(i)} y={by} letter="ج" color={C.red} p={prog(f, wrongAt(i), 8, ease.back)} s={0.9} />);
    out.push(<Bubble key="cave" x={SEAT_X(5)} y={by + 16} letter="ج" color={C.red} p={prog(f, B.cave - 4, 8, ease.back)} s={0.75} rot={-8} />);
  }
  if (f >= B.stat && f < F.s4) {
    const inP = prog(f, B.stat - 2, 12);
    STAT_X.forEach((x, k) => {
      const p = k < 3 ? prog(f, statAt(k), 8, ease.back) : prog(f, B.statTo + 10, 8, ease.back);
      out.push(<Bubble key={`st${k}`} x={x + (k < 3 ? -40 : 0)} y={head(1330, 0.66) - 60 + (k < 3 ? 40 : 0)} letter={k < 3 ? 'ج' : 'ب'} color={k < 3 ? C.red : C.green} p={p * inP} s={0.85} />);
    });
  }
  if (f >= F.s6) {
    const fadeGrey = 1 - prog(f, B.bar - 2, 8);
    const fadeAll = 1 - prog(f, B.door, 10);
    for (let i = 0; i < 4; i++) out.push(<Bubble key={`v${i}`} x={SEAT_X(i)} y={by} letter="ج" color={C.red} p={prog(f, greyAt(i), 8, ease.back)} s={0.9} o={fadeGrey} />);
    out.push(<Bubble key="partner" x={SEAT_X(4)} y={by} letter="ب" color={C.green} p={prog(f, B.partner, 8, ease.back)} s={1.0} o={fadeAll} />);
    out.push(<Bubble key="me" x={SEAT_X(5)} y={by} letter="ب" color={C.green} p={prog(f, B.stand, 8, ease.back)} s={1.0} o={fadeAll} />);
  }
  return <g>{out}</g>;
};

/** The voices of the group, landing on him one by one; then thrown off. */
const Pile: React.FC<{ f: number }> = ({ f }) => {
  if (f < F.s4 - 4 || f >= B.alt) return null;
  const top = head(1480, 0.72) - 40;
  const burst = prog(f, B.ask, 16, ease.out);
  return (
    <g>
      {Array.from({ length: 6 }).map((_, k) => {
        const land = prog(f, pileAt(k), 8, ease.in);
        if (land <= 0) return null;
        const slotY = top - k * 88;
        const x0 = 540 + (k % 2 ? 22 : -18);
        const y = mix(-160, slotY, land);
        const fly: Pt = [(k % 2 ? 1 : -1) * (500 + k * 60), -300 - k * 90];
        return <Bubble key={k} x={x0 + fly[0] * burst} y={y + fly[1] * burst} letter="ج" color={C.red} p={1} s={1.15} rot={(k % 2 ? 6 : -7) + burst * (k % 2 ? 90 : -90)} o={1 - prog(f, B.ask + 8, 8)} />;
      })}
    </g>
  );
};

const QMark: React.FC<{ f: number }> = ({ f }) => {
  if (f < B.askDraw || f >= F.s6) return null;
  const draw = prog(f, B.askDraw, 26, ease.inOut);
  const away = prog(f, B.alt - 6, 14, ease.inOut);
  const dot = prog(f, B.askDraw + 26, 8, ease.back);
  return (
    <g transform={`translate(${mix(0, 540 - 540 * 0.55, away)} ${mix(0, 420 - 780 * 0.55, away)}) scale(${mix(1, 0.55, away)})`}>
      <path d={Q.d} fill="none" stroke={C.amber} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      {dot > 0 && <circle cx={QDOT[0]} cy={QDOT[1]} r={26 * dot} fill={C.amber} />}
      <Spark x={QC[0]} y={QC[1] - 60} p={prog(f, B.askDraw + 28, 16)} />
    </g>
  );
};

const AltWay: React.FC<{ f: number }> = ({ f }) => {
  if (f < B.alt - 4 || f >= F.s6) return null;
  const inP = prog(f, B.alt - 4, 12);
  const draw = prog(f, B.altDraw, 34, ease.inOut);
  return (
    <g opacity={inP}>
      <path d={`M 1000 ${ROAD_Y} L 80 ${ROAD_Y}`} stroke={K.paper} strokeWidth={8} strokeDasharray="26 20" opacity={0.45} />
      {Array.from({ length: 4 }).map((_, r) => Array.from({ length: 2 }).map((__, c) => (
        <rect key={`${r}-${c}`} x={WALL_X - 40 + (r % 2 ? 20 : 0) * 0 + c * 40} y={ROAD_Y - 46 - r * 46} width={40} height={46} fill={r % 2 === c % 2 ? '#B5533C' : '#C8664B'} {...OUT} strokeWidth={4} />
      )))}
      <path d={`M ${WALL_X - 30} ${ROAD_Y - 200} L ${WALL_X + 30} ${ROAD_Y - 140} M ${WALL_X + 30} ${ROAD_Y - 200} L ${WALL_X - 30} ${ROAD_Y - 140}`} stroke={C.red} strokeWidth={12} strokeLinecap="round" opacity={inP} />
      <path d={ALT.d} fill="none" stroke={C.green} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      <Spark x={120} y={ROAD_Y - 30} p={prog(f, B.altDraw + 34, 16)} color={C.green} />
    </g>
  );
};

const Bar: React.FC<{ f: number }> = ({ f }) => {
  if (f < B.bar - 2 || f >= F.s7) return null;
  const inP = prog(f, B.bar - 2, 12, ease.out);
  const drop = prog(f, B.drop, 22, ease.inOut);
  const full = 330;
  const h = mix(full, 50, drop) * inP;
  const col = drop > 0.5 ? C.green : C.red;
  return (
    <g opacity={1 - prog(f, F.s7 - 6, 8)}>
      <path d={`M 360 1000 L 720 1000`} stroke={K.paper} strokeWidth={6} opacity={0.6} />
      <rect x={440} y={1000 - full} width={200} height={full} rx={14} fill="none" stroke={K.paper} strokeWidth={5} strokeDasharray="16 12" opacity={0.55 * inP} />
      <rect x={440} y={1000 - h} width={200} height={h} rx={14} fill={col} {...OUT} />
    </g>
  );
};

const Door: React.FC<{ f: number }> = ({ f }) => {
  if (f < F.s7 - 4) return null;
  const inP = prog(f, F.s7 - 4, 12, ease.out);
  const open = prog(f, B.open, 22, ease.inOut);
  const [x0, x1, y0, y1] = [390, 690, 600, 1040];
  return (
    <g opacity={inP}>
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFE3A3" stopOpacity={0.75} /><stop offset="100%" stopColor="#FFE3A3" stopOpacity={0} /></linearGradient>
      </defs>
      <path d={`M ${x0} ${y1} L ${x1} ${y1} L ${mix(x1, 990, open)} 1500 L ${mix(x0, 90, open)} 1500 Z`} fill="url(#beam)" opacity={open} />
      <rect x={x0 - 18} y={y0 - 18} width={x1 - x0 + 36} height={y1 - y0 + 18} rx={10} fill="#5B3A2E" {...OUT} />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#FFE3A3" />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={C.amber} opacity={0.5 * open} />
      <g transform={`translate(${x1} 0) scale(${mix(1, 0.12, open)} 1) translate(${-x1} 0)`}>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={C.violet} {...OUT} />
        <rect x={x0 + 34} y={y0 + 40} width={x1 - x0 - 68} height={150} rx={8} fill="none" stroke={K.ink} strokeWidth={5} opacity={0.5} />
        <rect x={x0 + 34} y={y0 + 230} width={x1 - x0 - 68} height={170} rx={8} fill="none" stroke={K.ink} strokeWidth={5} opacity={0.5} />
        <circle cx={x0 + 40} cy={(y0 + y1) / 2 + 20} r={14} fill={C.amber} {...OUT} strokeWidth={4} />
      </g>
    </g>
  );
};

const HookFx: React.FC<{ f: number }> = ({ f }) => (
  f < F.s2 ? <g>
    <Spark x={HOOK_X(1)} y={head(1330, 0.74) - 30} p={prog(f, B.rebel + 2, 16)} color={C.green} />
    <Spark x={HOOK_X(3)} y={head(1330, 0.74) - 30} p={prog(f, B.creative + 2, 16)} color={C.coral} />
  </g> : null
);

const Ground: React.FC<{ f: number }> = ({ f }) => {
  const y = f < F.s2 ? 1336 : f < F.s4 ? (f < B.stat ? ROW_Y + 6 : 1336) : f < F.s6 ? 1486 : ROW_Y + 6;
  if (f >= F.s5 && f < F.s6) return null;
  return <path d={`M -20 ${y} L 1100 ${y}`} stroke={K.paper} strokeWidth={5} opacity={0.3} />;
};

const camera = (f: number) => {
  if (f < F.s2) {
    const z = prog(f, B.why, 22, ease.inOut);
    const cx = mix(540, HOOK_X(5), z), cy = mix(960, 1130, z), k = 1 + 0.45 * z;
    return `translate(540 960) scale(${k}) translate(${-cx} ${-cy})`;
  }
  if (f >= F.s4 && f < F.s5) {
    const k = mix(1, 1.08, prog(f, B.pileFrom, F.s5 - B.pileFrom));
    return `translate(540 1200) scale(${k}) translate(-540 -1200)`;
  }
  return '';
};

const World: React.FC = () => {
  const f = useCurrentFrame();
  const board = boardAt(f);
  const seed = (Math.floor(f / 4) % 3) + 2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves={1} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={3.5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#boil)" transform={camera(f)}>
        <Ground f={f} />
        <Door f={f} />
        {board && <Board {...board} />}
        <Bar f={f} />
        <AltWay f={f} />
        <QMark f={f} />
        <HookFx f={f} />
        {actors(f).map(({ key, ...p }) => <Pencil key={key} {...p} />)}
        <Bubbles f={f} />
        <Pile f={f} />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Words on screen (the approved copy in script.json, proofed by Baseera).
// ---------------------------------------------------------------------------
const Texts: React.FC = () => (
  <AbsoluteFill>
    <Title text={`الذكي يتمرّد…\nالمبدع يطالب…\n{${C.amber}|والعادي يسكت}`} from={0} to={F.s2 - 2} size={100} pop />
    <Caption text="تجربة سولومون آش، 1951" from={B.board} to={F.s3 - 2} top={250} size={54} color={C.muted} />
    <Pill text="لوحدهم: أقل من 1% خطأ" x={540} y={1500} bg={C.green} from={B.alone + 4} to={F.s3 - 2} size={50} w={700} />
    <Title text={`{${C.amber}|3 من كل 4} وافقوا`} from={B.stat} to={F.s4 + 2} size={108} />
    <Title text={`مو غباء…\n{${C.red}|ضغط}`} from={F.s4} to={F.s5 + 2} size={118} />
    <Pill text="الذكي: ليش؟" x={540} y={1090} bg={C.blue} from={B.askDraw + 14} to={B.alt} size={54} w={520} />
    <Pill text="المبدع: بديل" x={540} y={1450} bg={C.green} from={B.altDraw + 16} to={F.s6} size={54} w={520} />
    <Title text={`صوت {${C.green}|واحد}`} from={B.partner - 2} to={F.s7 + 2} size={120} />
    <Pill text="من الثلث… إلى 5%" x={540} y={460} bg={C.violet} from={B.bar + 4} to={F.s7} size={54} w={560} />
    <Title text={`صوتك\n{${C.amber}|يفتح الباب}`} from={B.door} to={F.end + 2} size={120} />
    <Pill text="كتاب وبس" x={540} y={1550} bg="rgba(27,31,51,0.75)" from={B.sign - 3} to={F.end + 10} size={44} w={300} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Sound: the narration, and light effects on the actions.
// ---------------------------------------------------------------------------
const SFX: Array<[string, number, number]> = [
  ['pop', B.rebel, 0.3], ['chime', B.creative, 0.14], ['whoosh', B.bow, 0.16], ['click', B.why + 4, 0.2],
  ['pageflip', B.board, 0.35], ['scribble', B.lines, 0.14], ['pop', B.aloneAns, 0.32], ['chime', B.aloneAns + 4, 0.16],
  ['whoosh', B.group - 12, 0.2], ...[0, 1, 2, 3, 4].map((i): [string, number, number] => ['pop', Math.round(wrongAt(i)), 0.22]), ['thud', B.cave - 4, 0.22],
  ...[0, 1, 2].map((k): [string, number, number] => ['thud', Math.round(statAt(k)), 0.16]), ['chime', B.statTo + 10, 0.14],
  ...[0, 1, 2, 3, 4, 5].map((k): [string, number, number] => ['thud', Math.round(pileAt(k)) + 8, 0.24]),
  ['snap', B.ask, 0.35], ['whoosh', B.ask + 2, 0.2], ['scribble', B.askDraw, 0.22], ['pop', B.askDraw + 26, 0.25], ['scribble', B.altDraw, 0.22], ['chime', B.altDraw + 34, 0.2],
  ...[0, 1, 2, 3].map((i): [string, number, number] => ['pop', Math.round(greyAt(i)), 0.2]), ['chime', B.partner, 0.3], ['pop', B.stand, 0.3],
  ['whoosh', B.drop, 0.2], ['click', B.drop + 22, 0.25],
  ['scrape', B.open, 0.18], ['chime', B.open + 10, 0.26],
];

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    <Sky />
    <World />
    <Grain />
    <Texts />
    {TL.segments.filter((s) => s.measured).map((s) => (
      <Sequence key={s.id} from={sec(s.start)} layout="none"><Audio src={staticFile(`voice/${s.id}.wav`)} /></Sequence>
    ))}
    {SFX.filter(([, at]) => Number.isFinite(at) && at >= 0 && at < TL.durationInFrames).map(([name, at, vol], i) => (
      <Sequence key={i} from={at} durationInFrames={sec(1.6)} layout="none"><Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} /></Sequence>
    ))}
  </AbsoluteFill>
);
