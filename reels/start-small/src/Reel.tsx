import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { CalendarStrip, Icon, K, ListSheet, Stone, Stopwatch } from './art/props';
import { Pencil, PencilMood } from './art/pencil';
import { B, F } from './beats';
import { loadFonts } from './fonts';
import { Pill, Title } from './text';
import { C, H, SKY, W } from './theme';
import { TL, ease, mix, prog, sec } from './time';

loadFonts();

const OUT = { stroke: K.ink, strokeWidth: 6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
type Pt = [number, number];
const lerp = (a: Pt, b: Pt, p: number): Pt => [mix(a[0], b[0], p), mix(a[1], b[1], p)];

// ---------------------------------------------------------------------------
// Light of each part, cross-faded.
// ---------------------------------------------------------------------------
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const PARTS: Array<[number, keyof typeof SKY]> = [
  [0, 'desk'], [F.s3, 'crowd'], [F.s4, 'relief'], [F.s5, 'ready'], [F.s6, 'days'], [F.s7, 'grow'], [F.s8, 'dawn'],
];
const Sky: React.FC = () => {
  const f = useCurrentFrame();
  let top = hex(SKY.desk[0]);
  let bot = hex(SKY.desk[1]);
  for (const [at, name] of PARTS) {
    const p = prog(f, at - 8, name === 'dawn' ? 40 : 18, ease.inOut);
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
// Scene 1–2: the notebook, the list that keeps unfolding, three ambitions.
// ---------------------------------------------------------------------------
const LIST = { x: 540, y: 600, w: 780, rowH: 84 };
const LIST_ITEMS = Array.from({ length: 14 }).map((_, i) => ({
  icon: (['dumbbell', 'book', 'briefcase'] as const)[i % 3],
  color: [C.coral, C.blue, C.violet][i % 3],
}));
const rowY = (i: number) => LIST.y + 20 + i * LIST.rowH + LIST.rowH / 2;
const TICK_X = LIST.x + LIST.w / 2 - 66;
const TICKS = [18, 24, 30, 54];

const listRows = (f: number) => mix(3, 12, prog(f, B.unfold + 6, Math.max(20, F.s2 - B.unfold - 16), ease.inOut));

const Notebook: React.FC<{ f: number }> = ({ f }) => {
  if (f > F.s3 + 10 && f < F.s8 - 10) return null;
  const open = prog(f, B.open, 12, ease.inOut);
  const recede = prog(f, F.s2, 16, ease.inOut);
  const gone = prog(f, F.s3 - 4, 12);
  // scene 8: the ghost of the long list folds into one clear card
  const ghost = f >= F.s8 - 10 ? prog(f, F.s8 - 10, 12) * (1 - prog(f, B.notAll + 34, 10)) : 0;
  const fold = prog(f, B.notAll + 4, 26, ease.inOut);
  if (f >= F.s8 - 10) {
    return (
      <g opacity={ghost * 0.85} transform={`translate(540 ${mix(560, 820, fold)}) scale(${mix(0.8, 0.5, fold)}) translate(-540 -560)`}>
        <ListSheet x={LIST.x} y={LIST.y} w={LIST.w} rowH={LIST.rowH * (1 - fold * 0.85)} rows={12} items={LIST_ITEMS} crowd={1 - fold} />
      </g>
    );
  }
  const k = Math.cos(Math.PI * open);
  const done = TICKS.filter((t) => f >= t + 4).length + (TICKS.find((t) => f < t + 4 && f >= t) !== undefined ? prog(f, TICKS.find((t) => f < t + 4 && f >= t)!, 4) : 0);
  return (
    <g opacity={(1 - gone) * mix(1, 0.3, recede)} transform={`translate(540 ${mix(0, 120, recede)}) scale(${mix(1, 0.62, recede)}) translate(-540 0)`}>
      <ListSheet x={LIST.x} y={LIST.y} w={LIST.w} rowH={LIST.rowH} rows={listRows(f)} items={LIST_ITEMS} done={done} crowd={prog(f, 40, 30)} />
      {open < 1 && (
        <g transform={`translate(${LIST.x + LIST.w / 2} 0) scale(${k} 1) translate(${-(LIST.x + LIST.w / 2)} 0)`}>
          <rect x={LIST.x - LIST.w / 2} y={LIST.y} width={LIST.w} height={3 * LIST.rowH + 40} rx={14} fill={k > 0 ? C.blue : K.paperShade} {...OUT} />
          {k > 0 && <rect x={LIST.x - 160} y={LIST.y + 60} width={320} height={56} rx={12} fill={K.paper} opacity={0.9} />}
        </g>
      )}
    </g>
  );
};

/** The three ambitions as cards: born from rows, then fall into the wall, then shrink. */
const CARD_HOME: Pt[] = [[820, 1240], [540, 1240], [260, 1240]];
const CARD_AT = [B.sport, B.read, B.work];
const CARD_COLOR = [C.coral, C.blue, C.violet];
const CARD_ICON = ['dumbbell', 'book', 'briefcase'] as const;
const WALL: Array<{ x: number; y: number; r: number; c: number }> = [
  { x: 210, y: 1360, r: -4, c: 2 }, { x: 410, y: 1360, r: 3, c: 1 }, { x: 610, y: 1362, r: -2, c: 0 },
  { x: 300, y: 1150, r: 6, c: 0 }, { x: 500, y: 1148, r: -5, c: 2 }, { x: 400, y: 940, r: 2, c: 1 },
  { x: 220, y: 940, r: -8, c: 2 }, { x: 590, y: 950, r: 7, c: 0 }, { x: 320, y: 735, r: -3, c: 1 }, { x: 500, y: 730, r: 5, c: 2 },
  { x: 410, y: 530, r: -6, c: 0 },
];

const Card: React.FC<{ x: number; y: number; s: number; r: number; c: number; o?: number; w?: number; h?: number }> = ({ x, y, s, r, c, o = 1, w = 230, h = 200 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} opacity={o}>
    <rect x={-w / 2 + 8} y={-h / 2 + 12} width={w} height={h} rx={22} fill="#000" opacity={0.25} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={22} fill={CARD_COLOR[c]} {...OUT} />
    <rect x={-w / 2 + 16} y={-h / 2 + 16} width={w - 32} height={h - 32} rx={14} fill={K.paper} opacity={0.92} />
    <Icon kind={CARD_ICON[c]} x={0} y={0} s={1.5} />
  </g>
);

const Cards: React.FC<{ f: number }> = ({ f }) => {
  if (f < B.sport - 2 || f > Math.max(B.pages, B.exercise) + 2) return null;
  const toWall = (i: number) => prog(f, B.wall + i * 3, 12, ease.in);
  const grow = prog(f, B.tooBig, 24, ease.out);
  const shrink = prog(f, B.shrink + 6, 16, ease.inOut);
  const push = f > B.wall + 24 && f < B.stop ? Math.sin(f / 2.3) * 3 : 0;
  const nodes: React.ReactNode[] = [];
  WALL.forEach((w, i) => {
    const extra = i >= 3;
    const fall = toWall(i);
    // the first three are the ambition cards themselves, taking over at the wall
    if (f < B.wall + (extra ? i * 3 : 0)) return;
    if (i >= 8 && grow <= 0) return;
    const start: Pt = extra ? [w.x + (i % 2 ? 300 : -300), -200] : CARD_HOME[2 - i];
    let [x, y] = lerp(start, [w.x, w.y], fall);
    if (i >= 8) { y = mix(-200, w.y, grow); }
    // shrink: the wall collapses; one reading card and one sport card stay, small
    const keep = i === 1 ? 770 : i === 2 ? 310 : 540;
    x = mix(x, keep, shrink);
    y = mix(y, 960, shrink);
    const s = mix(1, 0.62, shrink);
    const o = i === 1 ? 1 - prog(f, B.pages - 8, 8) : i === 2 ? 1 - prog(f, B.exercise - 8, 8) : 1 - prog(f, B.shrink + 14, 4);
    nodes.push(<Card key={`w${i}`} x={x + push} y={y} s={s} r={w.r * fall * (1 - shrink)} c={w.c} o={o} w={extra ? 230 : mix(250, 230, fall)} h={extra ? 200 : mix(260, 200, fall)} />);
  });
  // the three ambitions before they fall
  CARD_HOME.forEach((home, c) => {
    if (f >= B.wall) return;
    const born = prog(f, CARD_AT[c], 12, ease.back);
    const from: Pt = [TICK_X - 200, 700 + c * 60];
    const [x, y] = lerp(from, home, born);
    nodes.push(<Card key={`c${c}`} x={x} y={y} s={0.4 + 0.6 * born} r={0} c={c} o={born} w={250} h={260} />);
  });
  return <g>{nodes}</g>;
};

const TearCalendar: React.FC<{ f: number }> = ({ f }) => {
  if (f < B.tomorrow - 8 || f > F.s3 + 6) return null;
  const inP = prog(f, B.tomorrow - 8, 10, ease.out);
  const tear = prog(f, B.tomorrow + 6, 16, ease.in);
  const out = prog(f, F.s3 - 6, 10);
  return (
    <g transform="translate(540 760)" opacity={inP * (1 - out)}>
      <rect x={-130} y={-120} width={260} height={240} rx={18} fill={K.paper} {...OUT} />
      <rect x={-130} y={-120} width={260} height={56} rx={18} fill={C.red} {...OUT} />
      {[-70, 0, 70].map((dx) => <circle key={dx} cx={dx} cy={-120} r={10} fill={K.muted} {...OUT} strokeWidth={4} />)}
      <circle cx={0} cy={36} r={48} fill={C.amber} {...OUT} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <path key={i} d={`M ${Math.cos(i * 0.785) * 62} ${36 + Math.sin(i * 0.785) * 62} L ${Math.cos(i * 0.785) * 78} ${36 + Math.sin(i * 0.785) * 78}`} {...OUT} strokeWidth={5} />)}
      <g transform={`translate(${tear * 320} ${-tear * 260}) rotate(${tear * 40})`} opacity={1 - tear}>
        <rect x={-130} y={-64} width={260} height={184} rx={8} fill={K.paper} {...OUT} />
        <path d="M -70 20 L 70 20 M -70 60 L 30 60" stroke={K.line} strokeWidth={10} strokeLinecap="round" />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene 3: the days pass, the energy runs out.
// ---------------------------------------------------------------------------
const Battery: React.FC<{ x: number; y: number; level: number }> = ({ x, y, level }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-36} y={-70} width={72} height={140} rx={14} fill={K.paper} {...OUT} />
    <rect x={-16} y={-84} width={32} height={14} rx={4} fill={K.muted} {...OUT} strokeWidth={4} />
    <rect x={-24} y={58 - 116 * level} width={48} height={116 * level} rx={8} fill={level > 0.4 ? C.green : C.red} />
  </g>
);

const Strain: React.FC<{ f: number }> = ({ f }) => {
  if (f < B.days - 6 || f > F.s4 + 10) return null;
  const inDays = prog(f, B.days - 6, 10);
  const out = prog(f, F.s4 - 4, 10);
  const today = Math.min(3, Math.floor(mix(0, 4, prog(f, B.days, Math.max(10, B.stop - B.days)))));
  const drainIn = prog(f, B.drain - 8, 10, ease.back);
  const level = mix(0.9, 0.12, prog(f, B.drain, 30, ease.inOut));
  return (
    <g opacity={1 - out}>
      <g opacity={inDays}><CalendarStrip x={540} y={620} n={4} cell={128} ticks={[0, 0, 0, 0]} today={today} /></g>
      {drainIn > 0 && (
        <g opacity={drainIn} transform={`translate(0 ${(1 - drainIn) * 60})`}>
          <Stopwatch x={760} y={1060} s={0.6} hand={prog(f, B.drain, 40) * 1.8} />
          <Battery x={930} y={1070} level={level} />
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scene 4–5: the small version of each, a time, the tools ready.
// ---------------------------------------------------------------------------
const BookObj: React.FC<{ x: number; y: number; s: number; thick: number; pages: number; mark?: number }> = ({ x, y, s, thick, pages, mark = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {thick > 0.02 && (
      <g opacity={thick}>
        {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={-150} y={50 - i * 22 * thick} width={300} height={30} rx={6} fill={i % 2 ? K.paper : K.paperShade} {...OUT} strokeWidth={4} />)}
        <rect x={-160} y={20 - 6 * 22 * thick} width={320} height={40} rx={10} fill={C.blue} {...OUT} />
        <Icon kind="clock" x={0} y={40 - 6 * 22 * thick} s={0.55} />
      </g>
    )}
    <g opacity={1 - thick}>
      <path d="M -170 -60 Q -85 -86 0 -60 L 0 90 Q -85 64 -170 90 Z" fill={K.paper} {...OUT} />
      <path d="M 170 -60 Q 85 -86 0 -60 L 0 90 Q 85 64 170 90 Z" fill={K.paper} {...OUT} />
      {[0, 1].map((side) => (
        <g key={side} opacity={Math.min(1, Math.max(0, pages - side))}>
          <path d={side === 0 ? 'M -150 -48 Q -85 -70 -16 -48 L -16 78 Q -85 56 -150 78 Z' : 'M 150 -48 Q 85 -70 16 -48 L 16 78 Q 85 56 150 78 Z'} fill={C.amber} opacity={0.35} />
          {[0, 1, 2, 3].map((l) => <path key={l} d={side === 0 ? `M -140 ${-20 + l * 26} L -30 ${-24 + l * 26}` : `M 30 ${-24 + l * 26} L 140 ${-20 + l * 26}`} stroke={K.line} strokeWidth={5} strokeLinecap="round" />)}
        </g>
      ))}
      {mark > 0 && <path d={`M -8 ${-90 + (1 - mark) * -200} L 8 ${-90 + (1 - mark) * -200} L 8 ${-10 + (1 - mark) * -200} L 0 ${-22 + (1 - mark) * -200} L -8 ${-10 + (1 - mark) * -200} Z`} fill={C.red} {...OUT} strokeWidth={4} />}
    </g>
  </g>
);

const Rack: React.FC<{ x: number; y: number; s: number; big: number }> = ({ x, y, s, big }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g opacity={big}>
      <rect x={-150} y={-170} width={300} height={360} rx={16} fill={K.paper} {...OUT} />
      {Array.from({ length: 7 }).map((_, i) => <path key={i} d={`M -110 ${-130 + i * 44} L 110 ${-130 + i * 44}`} stroke={K.line} strokeWidth={8} strokeLinecap="round" />)}
      {[-1, 0, 1].map((i) => <Icon key={i} kind="dumbbell" x={i * 90} y={150} s={0.9} />)}
    </g>
    <g opacity={1 - big}><Icon kind="shoe" x={0} y={20} s={2.2} /></g>
  </g>
);

const Small: React.FC<{ f: number }> = ({ f }) => {
  if (f < B.pages - 8 || f > F.s6 + 6) return null;
  const inBook = prog(f, B.pages - 8, 12, ease.back);
  const toTwo = prog(f, B.twoPages, 14, ease.inOut);
  const inRack = prog(f, B.exercise - 6, 12, ease.back);
  const toShoe = prog(f, B.oneShoe, 14, ease.inOut);
  const toShelf = prog(f, F.s5 - 4, 18, ease.inOut);
  const mark = prog(f, B.tools, 12, ease.out);
  const shoeSlide = prog(f, B.tools + 20, 12, ease.out);
  const out = prog(f, F.s6 - 4, 10);
  const book: Pt = lerp([770, 960], [760, 1240], toShelf);
  const rack: Pt = lerp([310, 960], [320, 1260], toShelf);
  return (
    <g opacity={1 - out}>
      {toShelf > 0 && (
        <g opacity={toShelf}>
          <rect x={120} y={1340} width={840} height={30} rx={10} fill={C.amber} {...OUT} />
          <rect x={600} y={1130} width={330} height={200} rx={18} fill="none" stroke={K.paper} strokeWidth={5} strokeDasharray="16 12" opacity={0.6 * (1 - mark)} />
          <rect x={150} y={1150} width={330} height={180} rx={18} fill="none" stroke={K.paper} strokeWidth={5} strokeDasharray="16 12" opacity={0.6 * (1 - shoeSlide)} />
          <ellipse cx={320} cy={1330} rx={170} ry={16} fill={C.green} opacity={0.6} />
        </g>
      )}
      <g opacity={inBook}><BookObj x={book[0]} y={book[1]} s={mix(1.25, 0.8, toShelf) * mix(0.42, 1, inBook)} thick={1 - toTwo} pages={toTwo * 2} mark={mark} /></g>
      {inRack > 0 && <g opacity={inRack}><Rack x={rack[0]} y={rack[1]} s={mix(1.1, 0.8, toShelf) * mix(0.42, 1, inRack)} big={1 - toShoe} /></g>}
    </g>
  );
};

const Timer: React.FC<{ f: number }> = ({ f }) => {
  if (f < F.s5 - 4 || f > F.s6 + 4) return null;
  const inP = prog(f, F.s5 - 4, 12, ease.back);
  const set = prog(f, B.setTime + 4, 16, ease.inOut);
  const ring = f > B.setTime + 20 ? ((f - B.setTime - 20) % 24) / 24 : 0;
  return <g opacity={inP * (1 - prog(f, F.s6 - 4, 8))}><Stopwatch x={540} y={790} s={1.05 * inP} hand={set * 0.25} ring={ring} /></g>;
};

// ---------------------------------------------------------------------------
// Scene 6–8: the days, the stones, the steps, the road back.
// ---------------------------------------------------------------------------
const DAYS = 6;
const dayX = (i: number) => 540 - (i - (DAYS - 1) / 2) * 134;
const STONE_Y = 1230;
// day 3 is the missed one: it never gets a tick
const tickAt = (i: number) => (i < 3 ? B.missDay + 2 + i * 6 : B.comeBack + (i - 4) * 8);

const stonePos = (f: number, i: number): Pt => {
  const up = prog(f, B.easier, 22, ease.inOut);
  const flat = prog(f, B.clear - 6, 20, ease.inOut);
  const stepY = STONE_Y + 120 - i * 70;
  const roadY = 1420;
  const x = dayX(i);
  return [x, mix(mix(STONE_Y, stepY, up), roadY, flat)];
};

const Days: React.FC<{ f: number }> = ({ f }) => {
  if (f < F.s6 - 4) return null;
  const inP = prog(f, F.s6 - 4, 12, ease.out);
  const stripOut = prog(f, F.s7 - 4, 10);
  const ticks = Array.from({ length: DAYS }).map((_, i) => (i === 3 ? 0 : prog(f, tickAt(i), 6)));
  const extra = prog(f, B.addStep, 12, ease.back);
  const roadEnd: Pt = [180, 1420];
  return (
    <g>
      <g opacity={inP * (1 - stripOut)}><CalendarStrip x={540} y={900} n={DAYS} cell={112} ticks={ticks} missed={[3]} today={f >= B.comeBack ? 4 : -1} /></g>
      {Array.from({ length: DAYS }).map((_, i) => {
        const [x, y] = stonePos(f, i);
        if (i === 3) {
          const fill = prog(f, B.clear + 10, 12);
          return <g key={i} opacity={inP}>
            <path d={`M ${x - 60} ${y + 10} L ${x - 46} ${y - 14} L ${x + 74} ${y - 14} L ${x + 60} ${y + 10} Z`} fill="none" stroke={K.paper} strokeWidth={5} strokeDasharray="12 10" opacity={0.7 * (1 - fill)} />
            {fill > 0 && <Stone x={x} y={y} w={120} p={fill} color={C.amber} />}
          </g>;
        }
        return <Stone key={i} x={x} y={y} w={120} p={ticks[i]} />;
      })}
      {extra > 0 && f < B.clear + 4 && (() => {
        const [x, y] = stonePos(f, DAYS - 1);
        return <g opacity={1 - prog(f, B.clear - 6, 10)}><Stone x={x - 130} y={y - 80} w={120} p={extra} color={C.amber} /><circle cx={x - 130} cy={y - 90} r={90 * extra} fill={C.amber} opacity={0.18 * (1 - prog(f, B.addStep + 12, 12))} /></g>;
      })()}
      {f >= F.s8 && <path d={`M ${dayX(0) + 80} 1430 L ${roadEnd[0] - 40} 1430`} stroke={K.paper} strokeWidth={6} strokeDasharray="20 16" opacity={0.5 * prog(f, B.clear, 12)} />}
    </g>
  );
};

const ClearCard: React.FC<{ f: number }> = ({ f }) => {
  if (f < B.notAll + 20) return null;
  const inP = prog(f, B.notAll + 20, 14, ease.back);
  const tick = prog(f, B.final - 6, 10);
  return (
    <g transform={`translate(${mix(540, 175, prog(f, B.clear - 4, 16, ease.inOut))} ${mix(820, 1330, prog(f, B.clear - 4, 16, ease.inOut))}) scale(${inP * mix(1.3, 0.9, prog(f, B.clear - 4, 16))})`}>
      <circle r={150} fill={C.amber} opacity={0.18 + 0.12 * tick} />
      <rect x={-110} y={-80} width={220} height={160} rx={20} fill={K.paper} {...OUT} />
      <rect x={-80} y={-14} width={110} height={18} rx={9} fill={C.blue} opacity={0.6} />
      <rect x={46} y={-32} width={44} height={44} rx={8} fill={K.paper} {...OUT} strokeWidth={5} />
      {tick > 0 && <path d="M 52 -12 L 64 0 L 86 -28" fill="none" stroke={C.green} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - tick} />}
    </g>
  );
};

// ---------------------------------------------------------------------------
// The pencil through the whole story.
// ---------------------------------------------------------------------------
const pencilAt = (f: number): { x: number; y: number; rot: number; s: number; mood: PencilMood; squash: number; bend: number; look: Pt; o: number } => {
  const base = { rot: 0, s: 0.62, squash: 0, bend: 0, look: [0, 0] as Pt, o: 1 };
  // 1 — ticks the first rows fast, then slows as the list keeps coming
  if (f < F.s2 + 10) {
    let row = 0;
    for (let i = 0; i < TICKS.length; i++) if (f >= TICKS[i] - 5) row = i;
    const hop = TICKS.map((t) => prog(f, t - 5, 5, ease.inOut));
    const ry = rowY(row);
    const prevY = rowY(Math.max(0, row - 1));
    const y = row > 0 ? mix(prevY, ry, hop[row]) : ry;
    const tickSquash = TICKS.some((t) => f >= t && f < t + 4) ? 0.15 : 0;
    const crowd = prog(f, 40, 30);
    return { ...base, x: TICK_X + 10, y: y + 14 - Math.sin(Math.min(1, hop[row]) * Math.PI) * 40, rot: 22 - crowd * 6, s: 0.42, mood: crowd > 0.5 ? 'busy' : 'eager', squash: tickSquash, bend: crowd * 0.5, look: [crowd > 0.5 ? -0.6 : 0, 0.8] };
  }
  // 2 — steps back and watches the three ambitions arrive
  if (f < F.s3) {
    const step = prog(f, F.s2, 14, ease.inOut);
    return { ...base, x: mix(TICK_X + 30, 960, step), y: mix(rowY(3) + 14, 1560, step), mood: 'eager', look: [-0.8, -0.6], s: mix(0.5, 0.55, step) };
  }
  // 3 — pushes the wall, bends, the days pass, stops
  if (f < F.s4) {
    const walk = prog(f, B.wall + 10, 16, ease.inOut);
    const pushing = f > B.wall + 24 && f < B.stop;
    const droop = prog(f, B.stop, 14, ease.inOut);
    return { ...base, x: mix(960, 790, walk) + (pushing ? Math.sin(f / 2.3) * 4 : 0), y: 1440, s: 0.6, rot: pushing ? -14 : mix(-6, 22, droop), bend: pushing ? -0.7 : 0, squash: pushing ? 0.1 : droop * 0.12, mood: droop > 0.4 ? 'tired' : 'busy', look: droop > 0.4 ? [0, 1] : [-1, 0] };
  }
  // 4 — taps the wall small; then hops to the book and taps it down to two
  // pages, then to the big plan and taps it down to one shoe
  if (f < F.s5) {
    const tap = prog(f, B.shrink, 6, ease.out) * (1 - prog(f, B.shrink + 6, 8));
    const goBook = prog(f, B.pages - 10, 14, ease.inOut);
    const goRack = prog(f, B.exercise - 10, 16, ease.inOut);
    const tapBook = prog(f, B.twoPages - 4, 4) * (1 - prog(f, B.twoPages, 8));
    const tapRack = prog(f, B.oneShoe - 4, 4) * (1 - prog(f, B.oneShoe, 8));
    const atBook: Pt = [570 + tapBook * 26, 1010];
    const atRack: Pt = [505 - tapRack * 26, 1010];
    const x = mix(mix(540, atBook[0], goBook), atRack[0], goRack);
    const y = mix(mix(1520, atBook[1], goBook), atRack[1], goRack) - Math.sin(goBook * Math.PI) * 90 - Math.sin(goRack * Math.PI) * 70;
    const rot = mix(mix(tap * -30, -24 - tapBook * 8, goBook), 10 + tapRack * 8, goRack);
    return { ...base, x, y, s: mix(0.55, 0.5, goBook), rot, squash: tap * 0.15 + (tapBook + tapRack) * 0.15, mood: 'calm', look: goRack > 0.5 ? [-1, 0.2] : goBook > 0.5 ? [1, 0.2] : [0, -0.6] };
  }
  // 5 — stands on the shelf; hops to the book as the bookmark drops in, then
  // back to nudge the shoe onto its mat
  if (f < F.s6) {
    const land = prog(f, F.s5 - 4, 18, ease.inOut);
    const go = prog(f, B.tools - 6, 12, ease.inOut);
    const back = prog(f, B.tools + 8, 12, ease.inOut);
    const nudge = prog(f, B.tools + 18, 4) * (1 - prog(f, B.tools + 22, 8));
    const x = mix(mix(mix(505, 560, land), 620, go), 500 - nudge * 20, back);
    const y = mix(mix(1010, 1336, land), 1180, go * (1 - back)) - Math.sin(land * Math.PI) * 80 - Math.sin(go * Math.PI) * 60 - Math.sin(back * Math.PI) * 60;
    return { ...base, x, y, s: 0.5, rot: mix(mix(10, 0, land), -22, go * (1 - back)) + back * 16, squash: nudge * 0.15, mood: 'eager', look: back > 0.5 ? [-1, 0.3] : go > 0.5 ? [1, 0.4] : [0, -0.4] };
  }
  // 6 — hops day to day; is away on the missed day; comes back
  if (f < F.s7) {
    let day = 0;
    for (let i = 0; i < DAYS; i++) if (i !== 3 && f >= tickAt(i) - 4) day = i;
    const away = f >= tickAt(2) + 6 && f < B.comeBack - 4;
    const [x] = stonePos(f, day);
    return { ...base, x: x + 20, y: 860, s: 0.42, rot: -20, o: away ? 0.25 : 1, mood: away ? 'tired' : 'eager', look: [-0.6, 0.6], squash: f >= tickAt(day) && f < tickAt(day) + 4 ? 0.15 : 0 };
  }
  // 7 — climbs the stones as they rise; onto the new step
  if (f < F.s8) {
    const climb = prog(f, B.easier + 6, Math.max(10, B.addStep - B.easier), ease.inOut);
    const i = Math.min(DAYS - 1, Math.floor(climb * (DAYS - 1)));
    const [x, y] = stonePos(f, i);
    const hop = prog(f, B.addStep + 10, 10, ease.inOut);
    const [ex, ey] = stonePos(f, DAYS - 1);
    return { ...base, x: mix(x, ex - 130, hop), y: mix(y - 14, ey - 94, hop) - Math.sin(hop * Math.PI) * 60, s: 0.5, mood: hop >= 1 ? 'proud' : 'eager', look: [-0.8, -0.5] };
  }
  // 8 — walks the road back to the one clear card
  const walk = prog(f, B.clear, Math.max(20, B.final - B.clear), ease.inOut);
  return { ...base, x: mix(dayX(0), 300, walk), y: 1420, s: 0.55, rot: Math.sin(f / 3) * 4 * (walk > 0 && walk < 1 ? 1 : 0), mood: walk >= 1 ? 'proud' : 'calm', look: [-1, 0] };
};

const World: React.FC = () => {
  const f = useCurrentFrame();
  const p = pencilAt(f);
  const k = f < F.s2 ? mix(1, 0.86, prog(f, B.unfold + 10, F.s2 - B.unfold, ease.inOut)) : f < F.s4 ? mix(1, 0.86, prog(f, B.tooBig, 30, ease.inOut)) : 1;
  const cy = f < F.s2 ? 1060 : 1000;
  const cam = f < F.s2 || (f >= F.s3 && f < F.s4) ? `translate(540 ${cy}) scale(${k}) translate(-540 ${-cy})` : '';
  const seed = (Math.floor(f / 4) % 3) + 2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves={1} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={3.5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#boil)" transform={cam}>
        {f >= F.s3 && f < F.s5 + 8 && <path d="M -20 1452 L 1100 1452" stroke={K.paper} strokeWidth={5} opacity={0.35} />}
        <Notebook f={f} />
        <TearCalendar f={f} />
        <Strain f={f} />
        <Cards f={f} />
        <Small f={f} />
        <Timer f={f} />
        <Days f={f} />
        <ClearCard f={f} />
        <Pencil x={p.x} y={p.y} rot={p.rot} s={p.s} squash={p.squash} bend={p.bend} mood={p.mood} look={p.look} o={p.o} />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Words on screen: short, one idea at a time.
// ---------------------------------------------------------------------------
const Texts: React.FC = () => (
  <AbsoluteFill>
    <Title text={`تبدأ بحماس…\n{${C.amber}|وبعدين تتوقف؟}`} from={0} to={F.s2 + 4} size={118} pop />
    <Pill text="رياضة" x={820} y={1420} bg={C.coral} from={B.sport + 4} to={B.wall + 8} size={50} w={260} />
    <Pill text="قراءة" x={540} y={1420} bg={C.blue} from={B.read + 4} to={B.wall + 8} size={50} w={260} />
    <Pill text="شغل" x={260} y={1420} bg={C.violet} from={B.work + 4} to={B.wall + 8} size={50} w={260} />
    <Title text={`كل هذا…\n{${C.amber}|من بكرة}`} from={B.tomorrow} to={F.s3 + 4} size={108} />
    <Title text={`البداية {${C.red}|أكبر}\nمن طاقتك`} from={B.tooBig} to={F.s4 + 4} size={100} />
    <Title text={`{${C.green}|صغّرها}`} from={B.shrink} to={F.s5 + 4} size={140} />
    <Pill text="صفحتين" x={770} y={1180} bg={C.blue} from={B.twoPages + 6} to={F.s5 - 2} size={50} w={300} />
    <Pill text="تمرين بسيط" x={310} y={1200} bg={C.green} from={B.oneShoe + 6} to={F.s5 - 2} size={50} w={340} />
    <Title text={`وقت محدد…\n{${C.amber}|وأدوات جاهزة}`} from={B.setTime} to={F.s6 + 4} size={104} />
    <Title text={`فاتك يوم؟\n{${C.amber}|ارجع بكرة}`} from={B.missDay} to={F.s7 + 4} size={112} />
    <Title text={`سهلت؟ {${C.green}|زِد خطوة}`} from={B.easier} to={F.s8 + 4} size={108} />
    <Title text={`بداية تقدر\n{${C.amber}|تكرّرها}`} from={B.final} to={F.end + 2} size={124} />
    <Pill text="كتاب وبس" x={540} y={1540} bg="rgba(27,31,51,0.75)" from={F.end - sec(1.6)} to={F.end + 10} size={44} w={300} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Sound: the narration, and light effects on the actions.
// ---------------------------------------------------------------------------
const SFX: Array<[string, number, number]> = [
  ['pageflip', B.open, 0.4], ...TICKS.map((t): [string, number, number] => ['tick', t, 0.3]), ['scribble', 40, 0.12],
  ['pop', B.sport, 0.28], ['pop', B.read, 0.28], ['pop', B.work, 0.28], ['pageflip', B.tomorrow + 6, 0.35],
  ...[0, 1, 2, 3, 4, 5].map((i): [string, number, number] => ['thud', B.wall + 10 + i * 3, 0.22]), ['scrape', B.wall + 24, 0.2],
  ['tick', B.days, 0.18], ['tick', B.days + 10, 0.18], ['tick', B.days + 20, 0.18], ['whoosh', B.tooBig, 0.2],
  ['pop', B.shrink + 4, 0.35], ['chime', B.shrink + 14, 0.18], ['pageflip', B.twoPages, 0.35], ['pop', B.oneShoe, 0.3],
  ['click', B.setTime + 4, 0.4], ['ratchet', B.setTime + 8, 0.3], ['tick', B.tools + 10, 0.35], ['thud', B.tools + 20, 0.25],
  ['tick', tickAt(0), 0.3], ['tick', tickAt(1), 0.3], ['tick', tickAt(2), 0.3], ['tick', B.comeBack, 0.4], ['tick', B.comeBack + 8, 0.3],
  ['pop', B.addStep, 0.35], ['chime', B.addStep + 10, 0.2],
  ['pageflip', B.notAll + 6, 0.3], ['whoosh', B.clear, 0.15], ['tick', B.final - 4, 0.4], ['chime', B.final, 0.28],
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
