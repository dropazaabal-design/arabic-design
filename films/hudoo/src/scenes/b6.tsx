import React from 'react';
import { Character } from '../kit/characters/Character';
import { CAST, type Who } from '../kit/characters/cast';
import { EXPRESSIONS, type Expr, type Face } from '../kit/characters/face';
import type { Gesture } from '../kit/characters/hands';
import { POSES } from '../kit/characters/poses';
import { joints, pose, type Pose } from '../kit/characters/skeleton';
import { Bedroom, BEDROOM } from '../kit/places/Bedroom';
import { CoffeeCorner, COFFEE } from '../kit/places/CoffeeCorner';
import { MEETING } from '../kit/places/MeetingRoom';
import { DeskBack, DeskFront, DESK } from '../kit/places/OfficeDesk';
import { NIGHT } from '../kit/places/parts';
import { Wave } from '../kit/metaphors/Wave';
import { Puffs, smooth } from '../kit/metaphors/util';
import { Clock, Folder, IconClock, Lamp, Mug, SpeechBubble, ThoughtCloud } from '../kit/props';
import { Ar } from '../kit/props/ui';
import { INK, PAL, sketch } from '../kit/style';
import { Actor, Cap, CAM0, Paper, Say, Stage, Tag, camMix, ease, faceAt, k, mix, poseAt, toScreen, type Cam, type Ctx } from '../film/engine';
import type { ShotRender } from '../film/Film';
import { ChestSwirl, Floor, MEET_FEET, MEET_S, Meeting, SEAT, WLabel, Arrow, atTable, cam, nod, walkTo, type SeatSpec } from './common';

// Chapter 8's last line (the wave) and chapter 9 «الاستماع والحدود»: shots 101–120.
// The private talk at the coffee corner (102–109), boundaries on paper (110–111), Mona's urgent task at the desk
// (112–115), the next meeting (116–118), then chapter 10 opens (119–120).

type St = { p: Pose; hands?: { R: Gesture; L: Gesture } };
const st = (o: Partial<Pose>, R: Gesture = 'relaxed', L: Gesture = 'relaxed'): St => ({ p: pose(o), hands: { R, L } });
const face = (base: Expr, o: Partial<Face>): Face => ({ ...EXPRESSIONS[base], ...o });
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** World point of a character-space point (feet at x, y; scale s; facing). */
const world = (who: Who, x: number, y: number, s: number, fc: 1 | -1, q: [number, number]): [number, number] => {
  const sc = s * CAST[who].size;
  return [x + fc * sc * q[0], y + sc * q[1]];
};
const wristOf = (who: Who, p: Pose, x: number, y: number, s: number, fc: 1 | -1, side: 'R' | 'L') => {
  const j = joints(p);
  return world(who, x, y, s, fc, side === 'R' ? j.armR.wrist : j.armL.wrist);
};
/** Head centre and top in world space. */
const headOf = (who: Who, p: Pose, x: number, y: number, s: number, fc: 1 | -1) => {
  const c = world(who, x, y, s, fc, joints(p).headC), r = 48 * s * CAST[who].size;
  return { c, top: c[1] - r, r };
};
/** `Say` anchor so the tail tip lands just above a head (Say puts the tip ~30 px under `to` with above = 10). */
const sayTo = (cm: Cam, h: { c: [number, number]; top: number }, dx = 0): [number, number] => {
  const q = toScreen(cm, [h.c[0], h.top]);
  return [q[0] + dx, q[1] - 40];
};

// ——— coffee corner staging: سليم on the left facing right, جاسر on the right facing left, the high table between ———
const SX = COFFEE.left.x, JX = COFFEE.right.x, FY = COFFEE.y, CS = 1.45;
const SAL = {
  stand: st({ turn: 0.5 }),
  rest: st({ turn: 0.55, R: { hand: [62, -160] }, L: { hand: [92, -162] } }), // hands resting on the high table
  two: st({ turn: 0.55, head: -2, R: { sh: -4, el: 10 }, L: { hand: [58, -248] } }, 'relaxed', 'two'),
  open: st({ lean: 2, turn: 0.55, R: { hand: [62, -160] }, L: { hand: [84, -186] } }, 'relaxed', 'cup'),
  open2: st({ lean: 4, turn: 0.55, R: { hand: [62, -160] }, L: { hand: [98, -194] } }, 'relaxed', 'open'),
  chest: st({ head: 7, turn: 0.5, R: { hand: [62, -160] }, L: { hand: [22, -196], bend: -1 } }, 'relaxed', 'open'),
  explain: st({ lean: 3, turn: 0.55, R: { hand: [54, -172] }, L: { hand: [80, -170] } }, 'cup', 'open'),
  forward: st({ lean: 5, turn: 0.6, R: { hand: [52, -168] }, L: { hand: [104, -188] } }, 'cup', 'chop'),
  offer: st({ lean: 3, head: 4, turn: 0.6, R: { hand: [56, -160] }, L: { hand: [106, -176] } }, 'relaxed', 'cup'),
  listen: st({ lean: 6, head: 9, turn: 0.55, breath: 0.2, R: { hand: [66, -158] }, L: { hand: [96, -160] } }),
  tense: st({ lean: -1, head: -2, turn: 0.55, breath: 0.8, R: { hand: [62, -160] }, L: { hand: [90, -164] } }, 'relaxed', 'fist'),
  urge: st({ lean: 2, turn: 0.6, R: { hand: [66, -158] }, L: { hand: [90, -214] } }, 'relaxed', 'point'),
  ack: st({ lean: 3, head: 4, turn: 0.55, R: { hand: [62, -160] }, L: { hand: [98, -172] } }, 'relaxed', 'cup'),
  palm: st({ head: -2, turn: 0.55, R: { hand: [62, -160] }, L: { hand: [80, -226] } }, 'relaxed', 'stop'),
};
const JAS = {
  mug: st({ head: 14, turn: 0.45, R: { sh: -4, el: 10 }, L: { hand: [40, -190] } }, 'relaxed', 'grip'),
  mugUp: st({ head: 0, turn: 0.6, R: { sh: -4, el: 10 }, L: { hand: [42, -190] } }, 'relaxed', 'grip'),
  mugDown: st({ lean: 5, head: 4, turn: 0.6, R: { sh: -4, el: 10 }, L: { hand: [82, -167] } }, 'relaxed', 'grip'),
  rest: st({ turn: 0.55, R: { sh: -4, el: 10 }, L: { hand: [80, -160] } }),
  crossed: st({ head: -4, turn: 0.55, R: { hand: [18, -168], bend: -1 }, L: { hand: [-6, -172], bend: -1 } }, 'fist', 'fist'),
  crossedAway: st({ head: 6, turn: 0.15, R: { hand: [18, -168], bend: -1 }, L: { hand: [-6, -172], bend: -1 } }, 'fist', 'fist'),
  loose: st({ head: 6, turn: 0.5, R: { sh: -4, el: 12 }, L: { sh: 6, el: 16 } }),
  listen: st({ lean: 3, head: 4, turn: 0.55, R: { sh: -4, el: 12 }, L: { hand: [80, -160] } }),
  down: st({ head: 16, turn: 0.4, R: { sh: -4, el: 10 }, L: { sh: 4, el: 12 } }),
  shrug: st({ head: 8, turn: 0.5, R: { sh: -4, el: 10 }, L: { hand: [72, -180] } }, 'relaxed', 'cup'),
  talk1: st({ head: 4, turn: 0.55, R: { sh: -4, el: 10 }, L: { hand: [70, -178] } }, 'relaxed', 'cup'),
  talk2: st({ turn: 0.6, R: { sh: -4, el: 10 }, L: { hand: [86, -196] } }, 'relaxed', 'open'),
  relieved: st({ lean: 2, head: 6, turn: 0.55, R: { sh: -4, el: 10 }, L: { hand: [80, -162] } }),
  offer: st({ lean: 3, turn: 0.6, R: { sh: -4, el: 10 }, L: { hand: [98, -178] } }, 'relaxed', 'cup'),
};
/** Jaser's mug: held upright in the hand (k scales it to a cup's size), and standing on the high table. */
const HeldMug: React.FC<{ t: number }> = ({ t }) => <g transform="scale(0.36) translate(0 19)"><Mug color={PAL.provokeLight} steam={0.7} t={t} /></g>;
const MUG_W = wristOf('jaser', JAS.mugDown.p, JX, FY, CS, -1, 'L');
const MUG_AT: [number, number] = [MUG_W[0], COFFEE.tableTop];
const TableMug: React.FC<{ t: number }> = ({ t }) => <g transform={`translate(${MUG_AT[0]} ${MUG_AT[1]}) scale(0.76)`}><Mug color={PAL.provokeLight} steam={0.8} t={t} /></g>;

const Coffee: React.FC<{ cm: Cam; over?: React.ReactNode; mug?: boolean; t: number; children: React.ReactNode }> = ({ cm, over, mug = true, t, children }) => (
  <Stage cam={cm} over={over}>
    <CoffeeCorner />
    {mug && <TableMug t={t} />}
    {children}
  </Stage>
);
const Salim: React.FC<{ c: Ctx; p: St; f: Face | Expr; x?: number; say?: [number, number]; head?: number }> = ({ c, p, f, x = SX, say, head = 0 }) => (
  <Actor f={c.f} seed={41} who="salim" x={x} y={FY} s={CS} facing={1} pose={{ p: { ...p.p, head: p.p.head + head }, hands: p.hands }} face={f} say={say} />
);
const Jaser: React.FC<{ c: Ctx; p: St; f: Face | Expr; say?: [number, number]; head?: number; hold?: React.ReactNode; hands?: { R?: Gesture; L?: Gesture } }> = ({ c, p, f, say, head = 0, hold, hands }) => (
  <Actor f={c.f} seed={13} who="jaser" x={JX} y={FY} s={CS} facing={-1} pose={{ p: { ...p.p, head: p.p.head + head }, hands: p.hands }} face={f} say={say} hold={hold ? { L: hold } : undefined} upright={{ L: true }} hands={hands} />
);
const sHead = (p: St, x = SX) => headOf('salim', p.p, x, FY, CS, 1);
const jHead = (p: St) => headOf('jaser', p.p, JX, FY, CS, -1);

/** The meeting of yesterday, small, inside سليم's speech bubble: جاسر lifts his finger while سليم presents (`raise` 0..1). */
const MiniMeeting: React.FC<{ raise: number }> = ({ raise }) => (
  <g>
    <rect x={30} y={-78} width={118} height={70} rx={4} fill="#F8F9FB" stroke={INK} strokeWidth={2.6} />
    <path d="M44 -24 L70 -40 L92 -32 L132 -64" stroke={PAL.calm} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Character who="jaser" x={-64} y={66} s={0.3} facing={1} face={raise > 0.4 ? face('smug', { brow: 0.5, open: 0.8 }) : 'smug'}
      p={pose({ sit: 1, lean: mix(-4, -11, raise), head: -6, turn: 0.6, footR: [50, 0], footL: [62, 0], R: { hand: [58, -156] }, L: { hand: [mix(76, 96, raise), mix(-154, -262, raise)] } })} hands={{ R: 'relaxed', L: raise > 0.4 ? 'point' : 'relaxed' }} />
    <rect x={-150} y={14} width={150} height={13} rx={3} fill={PAL.table} stroke={INK} strokeWidth={2.4} />
    <Character who="salim" x={98} y={66} s={0.3} facing={-1} face={raise > 0.5 ? 'surprised' : 'smile'}
      p={pose({ turn: 0.4, R: { hand: [52, -168] }, L: { hand: mix(70, 60, raise) > 0 ? [mix(70, 58, raise), mix(-160, -176, raise)] : [70, -160] } })} hands={{ R: 'cup', L: 'open' }} />
  </g>
);
/** Three dots in a bubble: someone's turn to speak. */
const Dots: React.FC<{ color: string }> = ({ color }) => <g>{[-26, 0, 26].map((x) => <circle key={x} cx={x} cy={0} r={9} fill={color} stroke={INK} strokeWidth={2} />)}</g>;
/** A tiny month sheet with one day circled (the deadline). `ring` 0..1 draws the circle. */
const DeadlineSheet: React.FC<{ ring: number }> = ({ ring }) => (
  <g>
    <rect x={-58} y={-46} width={116} height={96} rx={8} fill="#FBFAF7" stroke={INK} strokeWidth={3} />
    <path d="M-58 -46 H58 V-22 H-58 Z" fill={PAL.warn} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    {[-30, 30].map((x) => <path key={x} d={`M${x} -42 v-12`} stroke={INK} strokeWidth={4} strokeLinecap="round" />)}
    {Array.from({ length: 12 }, (_, i) => <rect key={i} x={-48 + (i % 4) * 25} y={-14 + Math.floor(i / 4) * 21} width={17} height={13} rx={3} fill={i === 6 ? PAL.provokeLight : PAL.paperShade} />)}
    {ring > 0 && <path d={`M${-6 + 15} ${16} m-22 0 a22 17 0 1 0 44 0 a22 17 0 1 0 -44 0`} fill="none" stroke={PAL.warn} strokeWidth={4.5} strokeLinecap="round" pathLength={1} strokeDasharray={`${ring} 1`} />}
  </g>
);

// ——— the office desk: سليم seated at DESK.seat facing right, منى standing at the desk's far end facing left ———
const DY = 860, DS = 1.45, MX = 1690;
const D = {
  read: st({ sit: 1, lean: 9, head: 12, turn: 0.55, footR: [52, 0], footL: [64, 0], R: { hand: [70, -150] }, L: { hand: [104, -150] } }, 'relaxed', 'open'),
  attend: st({ sit: 1, lean: 2, head: -2, turn: 0.75, footR: [52, 0], footL: [64, 0], R: { hand: [70, -150] }, L: { hand: [96, -150] } }),
  type: (f: number) => st({ sit: 1, lean: 10, head: 6, turn: 0.55, footR: [52, 0], footL: [64, 0], R: { hand: [74 + Math.sin(f * 0.9) * 3, -150 + Math.abs(Math.sin(f * 0.9)) * 3] }, L: { hand: [88 - Math.sin(f * 1.1) * 3, -146 + Math.abs(Math.cos(f * 1.1)) * 3] } }),
  toUrgent: st({ sit: 1, lean: 3, head: 0, turn: 0.75, footR: [52, 0], footL: [64, 0], R: { hand: [70, -150] }, L: { hand: [108, -186] } }, 'relaxed', 'cup'),
  pat: st({ sit: 1, lean: 12, head: 10, turn: 0.6, footR: [52, 0], footL: [64, 0], R: { hand: [70, -150] }, L: { hand: [112, -152] } }, 'relaxed', 'open'),
  point: st({ sit: 1, lean: 8, head: -2, turn: 0.7, footR: [52, 0], footL: [64, 0], R: { hand: [70, -150] }, L: { hand: [122, -200] } }, 'relaxed', 'point'),
  scale: (f: number) => st({ sit: 1, lean: 4, head: -2, turn: 0.75, footR: [52, 0], footL: [64, 0], R: { hand: [56, -186 + Math.sin(f * 0.11) * 8] }, L: { hand: [104, -190 - Math.sin(f * 0.11) * 8] } }, 'cup', 'cup'),
  upright: (f: number) => st({ sit: 1, lean: -2, head: -3, turn: 0.75, breath: 0.5 + 0.5 * Math.sin(f / 36), footR: [52, 0], footL: [64, 0], R: { hand: [64, -152] }, L: { hand: [96, -150] } }),
};
const MONA = {
  hold: st({ turn: 0.55, R: { sh: -4, el: 10 }, L: { hand: [30, -170] } }, 'relaxed', 'grip'),
  put: st({ lean: 6, head: 8, turn: 0.6, R: { sh: -4, el: 10 }, L: { hand: [89, -168] } }, 'relaxed', 'grip'),
  stand: st({ turn: 0.55, R: { sh: -4, el: 10 }, L: { sh: 8, el: 26 } }),
  tap: st({ lean: 6, head: 10, turn: 0.6, R: { sh: -4, el: 10 }, L: { hand: [92, -178] } }, 'relaxed', 'point'),
  listen: st({ lean: 2, head: 4, turn: 0.6, R: { sh: -4, el: 10 }, L: { sh: 6, el: 30 } }),
  chin: st({ head: -4, turn: 0.55, R: { hand: [20, -170], bend: -1 }, L: { hand: [30, -238], bend: -1 } }, 'fist', 'relaxed'),
  carry: st({ head: 2, turn: 0.6, R: { sh: -4, el: 10 }, L: { hand: [34, -196] } }, 'relaxed', 'grip'),
};
const URGENT_AT: [number, number] = [wristOf('mona', MONA.put.p, MX, DY, DS, -1, 'L')[0], DESK.deskTop];
const REPORT_AT: [number, number] = [885, DESK.deskTop];
const CAL_AT: [number, number] = [1122, DESK.deskTop];
const CLOCK_AT: [number, number] = [880, 210];

/** A folder lying flat on a desk, seen nearly edge-on: origin at the middle of its bottom edge. */
const FlatFolder: React.FC<{ x: number; y: number; color: string; w?: number }> = ({ x, y, color, w = 110 }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M${-w / 2 + 10} -13 L${w / 2 - 12} -13 L${w / 2 - 16} -18 L${-w / 2 + 14} -18 Z`} fill="#FBFAF7" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
    <path d={`M${-w / 2} 0 L${w / 2} 0 L${w / 2 - 8} -13 L${-w / 2 + 8} -13 Z`} fill={color} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
  </g>
);
/** A folder held up in a hand (upright, a little smaller than the kit's). */
const HeldFolder: React.FC<{ color: string }> = ({ color }) => <g transform="scale(0.42) translate(0 -6)"><Folder color={color} /></g>;
/**
 * A stand-up desk calendar: origin at the middle of its base. `flip` counts pages turned so far (fractional while one
 * turns up over the rings); the last of `pages` reads `label`. `ring` 0..1 circles the label.
 */
const DeskCal: React.FC<{ flip: number; pages: number; label: string; ring?: number }> = ({ flip, pages, label, ring = 0 }) => {
  const W = 132, H = 120, n = Math.min(pages, Math.floor(flip)), u = n >= pages ? 0 : flip - n;
  const sheet = (i: number) => (
    <g>
      <rect x={-W / 2} y={-H} width={W} height={H} rx={6} fill="#FBFAF7" stroke={INK} strokeWidth={2.4} />
      {i >= pages
        ? <Ar x={-W / 2} y={-H + 26} w={W} h={H - 30} size={31} weight={800} lh={1}>{label}</Ar>
        : [0, 1, 2, 3].map((r) => <path key={r} d={`M${-W / 2 + 18} ${-H + 46 + r * 18} h${W - 36 - (r % 2) * 30}`} stroke="#AEB6C0" strokeWidth={5} strokeLinecap="round" />)}
    </g>
  );
  return (
    <g>
      <path d={`M${-W / 2 + 8} ${-H + 8} L${W / 2 - 8} ${-H + 8} L${W / 2 + 6} 0 L${-W / 2 - 6} 0 Z`} fill={PAL.chairDark} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      {sheet(u > 0 ? n + 1 : n)}
      {u > 0 && <g transform={`translate(0 ${-H}) scale(1 ${Math.max(0.02, 1 - u)}) translate(0 ${H})`}>{sheet(n)}</g>}
      <rect x={-W / 2} y={-H} width={W} height={24} rx={5} fill={PAL.focus} stroke={INK} strokeWidth={2.4} />
      {[-34, 0, 34].map((x) => <path key={x} d={`M${x} ${-H + 6} v-14`} stroke={INK} strokeWidth={4} strokeLinecap="round" />)}
      {ring > 0 && <ellipse cx={0} cy={-H / 2 + 12} rx={W / 2 + 12} ry={40} fill="none" stroke={PAL.calm} strokeWidth={5} pathLength={1} strokeDasharray={`${ring} 1`} transform={`rotate(-4 0 ${-H / 2 + 12})`} />}
    </g>
  );
};
const Office: React.FC<{ cm: Cam; over?: React.ReactNode; back?: React.ReactNode; salim: React.ReactNode; front?: React.ReactNode; clock: [number, number]; mug?: boolean; cal?: React.ReactNode; report?: boolean }> = ({ cm, over, back, salim, front, clock, mug = true, cal, report = true }) => (
  <Stage cam={cm} over={over}>
    <DeskBack />
    <g transform={`translate(${CLOCK_AT[0]} ${CLOCK_AT[1]})`}><Clock hours={clock[0]} minutes={clock[1]} r={44} /></g>
    {back}
    {salim}
    <DeskFront mug={mug} />
    {cal !== undefined ? cal : <g transform={`translate(${CAL_AT[0]} ${CAL_AT[1]})`}><DeskCal flip={0} pages={3} label="الخميس" /></g>}
    {report && <FlatFolder x={REPORT_AT[0]} y={REPORT_AT[1]} color={PAL.focus} w={100} />}
    {front}
  </Stage>
);
const DeskSalim: React.FC<{ c: Ctx; p: St; f: Face | Expr; say?: [number, number]; head?: number }> = ({ c, p, f, say, head = 0 }) => (
  <Actor f={c.f} seed={41} who="salim" x={DESK.seat.x} y={DY} s={DS} facing={1} pose={{ p: { ...p.p, head: p.p.head + head }, hands: p.hands }} face={f} say={say} />
);
const Mona: React.FC<{ c: Ctx; p: St; f: Face | Expr; x?: number; say?: [number, number]; head?: number; hold?: React.ReactNode; o?: number; hands?: { R?: Gesture; L?: Gesture } }> = ({ c, p, f, x = MX, say, head = 0, hold, o, hands }) => (
  <Actor f={c.f} seed={29} who="mona" x={x} y={DY} s={DS} facing={-1} pose={{ p: { ...p.p, head: p.p.head + head }, hands: p.hands }} face={f} say={say} hold={hold ? { L: hold } : undefined} upright={{ L: true }} o={o} hands={hands} />
);

// ——— the meeting room (as in shots 1–4): سليم presents by the board, جاسر in seat 4 ———
const STAND = MEETING.standAt;
const presStop = st({ lean: -2, head: 2, turn: 0.55, R: { hand: [36, -150] }, L: { hand: [92, -226] } }, 'relaxed', 'stop');
const presOffer = st({ lean: 2, head: 4, turn: 0.55, R: { hand: [36, -150] }, L: { hand: [100, -178] } }, 'relaxed', 'cup');
const pointBoard = st({ lean: -3, head: -12, turn: 0.85, L: { hand: [104, -318] }, R: { hand: [36, -150] } }, 'relaxed', 'point');
const jaserFinger = { p: pose({ sit: 1, lean: -11, head: -8, turn: 0.6, footR: [50, 0], footL: [62, 0], R: { hand: [58, -156] }, L: { hand: [96, -262] } }), hands: { R: 'relaxed' as const, L: 'point' as const } };
/** The team at the table; `look` 0 toward the board/سليم, 1 toward جاسر. */
const team = (look: number, faces?: (Face | Expr)[]): (SeatSpec | null)[] => {
  const who = ['mona', 'att1', 'hadi', 'att2'] as const;
  return [...who.map((w, i) => ({ who: w, p: atTable({ head: mix(-4, 6, look) + i * 0.5, turn: mix(0.85, 0.6, look) }), face: faces?.[i] ?? face('listening', { look: [mix(0.9, 0.6, look), mix(-0.2, 0.15, look)] }) } as SeatSpec)), null, null];
};

/** A path that rises, dips and rises again, right to left (shot 119): y for any x. */
const PATH: [number, number][] = [[2000, 990], [1680, 905], [1420, 830], [1180, 905], [930, 860], [680, 745], [380, 660], [-80, 610]];
const pathY = (x: number) => {
  for (let i = 1; i < PATH.length; i++) {
    const [x0, y0] = PATH[i - 1], [x1, y1] = PATH[i];
    if (x <= x0 && x >= x1) { const u = (x0 - x) / (x0 - x1); return mix(y0, y1, (1 - Math.cos(u * Math.PI)) / 2); }
  }
  return x > PATH[0][0] ? PATH[0][1] : PATH[PATH.length - 1][1];
};

/** The new notebook: held (cover toward us) or lying flat (`flat`). */
const COVER = '#56708E';
const HeldBook: React.FC = () => (
  <g transform="scale(0.5) translate(-4 0)">
    <rect x={-30} y={-40} width={60} height={80} rx={4} fill={COVER} stroke={INK} strokeWidth={3} />
    <rect x={-18} y={-26} width={34} height={14} rx={2} fill={PAL.paper} stroke={INK} strokeWidth={2} />
    <path d="M22 -40 V40" stroke={INK} strokeWidth={3} />
  </g>
);
const FlatBook: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-38 0 L38 0 L34 -14 L-34 -14 Z" fill="#FBFAF7" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
    <path d="M-40 -12 L40 -12 L36 -18 L-36 -18 Z" fill={COVER} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
    <path d="M-40 0 L40 0 L40 3 L-40 3 Z" fill={COVER} stroke={INK} strokeWidth={2.2} />
  </g>
);

export const SHOTS: Record<number, ShotRender> = {
  // 101 — the feeling is a wave: it rises on «يرتفع», crests on «قمته», sinks back on «ينخفض» and the sea goes calm.
  101: (c) => {
    const up = c.at('يرتفع'), top = c.at('قمته'), down = c.at('ينخفض');
    const phase = k(c.f, [[up - 34, 0], [top + 6, 0.45], [down + 4, 0.6], [down + 150, 1]], ease.lin);
    const words: [string, number, number, string][] = [['يرتفع', 1460, up, PAL.warn], ['قمته', 960, top, PAL.warn], ['ينخفض', 460, down, PAL.calm]];
    return <Stage>
      <Wave t={c.t} phase={ease.inOut(clamp01(phase / 0.45)) * 0.45 * (phase < 0.45 ? 1 : 0) + (phase >= 0.45 ? phase : 0)} size={1} />
      {words.map(([w, x, a, col]) => <WLabel key={w} x={x} y={110} text={w} size={62} color={col} o={c.p(a - 4, 12)} />)}
      {[[1460, 960, top], [960, 460, down]].map(([a, b, at], i) => <path key={i} d={`M${a - 110} 102 h${-(a - b - 220) * c.p(at - 10, 14)}`} stroke={INK} strokeWidth={4} strokeDasharray="10 12" opacity={0.35} />)}
    </Stage>;
  },

  // 102 — the coffee corner in the morning: سليم walks up to جاسر, who looks up from his cup; two fingers on «دقيقتين»; جاسر sets the cup down on «انفراد».
  102: (c) => {
    const look = c.at('سليم'), two = c.at('دقيقتين'), priv = c.at('انفراد');
    const cm = cam(900, 540, 1.15);
    const arrive = 108, down = priv - 2;
    const w = walkTo(c.f, 12, arrive, 400, SX, CS);
    const sp: St = c.f < arrive ? { p: w.p } : poseAt(c.f, [[arrive, { p: walkTo(arrive, 12, arrive, 400, SX, CS).p }], [arrive + 1, SAL.stand, 16], [two - 14, SAL.two, 14], [priv + 18, SAL.rest, 22]]);
    const jp = poseAt(c.f, [[0, JAS.mug], [look - 12, JAS.mugUp, 16], [down - 20, JAS.mugDown, 20], [down + 14, JAS.rest, 20]]);
    const held = c.f < down;
    const sf = faceAt(c.f, [[0, face('determined', { look: [0.8, 0] })], [two - 10, face('calm', { mouth: 0.45, look: [0.9, 0] }), 12]]);
    const jf = faceAt(c.f, [[0, face('neutral', { look: [0.2, 0.9], open: 0.85 })], [look - 6, face('surprised', { open2: 0, look: [0.8, 0] }), 10], [two, face('surprised', { open2: 0.2, browY: 0.7, look: [0.9, 0] }), 10], [priv + 6, face('neutral', { brow: 0.25, look: [0.9, 0] }), 14]]);
    const bub = c.p(two - 4, 10) * (1 - c.p(priv + 34, 12));
    return <Coffee cm={cm} t={c.t} mug={!held} over={<Say text="دقيقتين؟" to={sayTo(cm, sHead(SAL.two))} above={10} o={bub} size={48} />}>
      <Jaser c={c} p={jp} f={jf} head={nod(c.f, priv + 14, 1, 7)} hold={held ? <HeldMug t={c.t} /> : undefined} hands={{ L: held ? 'grip' : c.f < down + 12 ? 'open' : 'relaxed' }} />
      <Actor f={c.f} seed={41} who="salim" x={c.f < arrive ? w.x : SX} y={FY} s={CS} facing={1} pose={sp} face={sf} say={[two - 2, priv + 30]} />
    </Coffee>;
  },

  // 103 — he starts with the facts: جاسر folds his arms; سليم's open hand describes, and his bubble replays yesterday's meeting with the finger on «قاطعتني».
  103: (c) => {
    const what = c.at('بما'), meet = c.at('اجتماع'), cut = c.at('قاطعتني');
    const cm = cam(960, 500, 1.5);
    const sp = poseAt(c.f, [[0, SAL.rest], [what - 14, SAL.open, 18], [cut - 6, SAL.open2, 14], [cut + 60, SAL.open, 24]]);
    const jp = poseAt(c.f, [[0, JAS.rest], [22, JAS.crossed, 20], [cut, JAS.crossedAway, 18], [cut + 80, JAS.crossed, 24]]);
    const jf = faceAt(c.f, [[0, face('smug', { look: [0.9, 0] })], [24, face('contempt', { look: [0.9, 0] }), 14], [cut + 2, face('irritated', { look: [-0.2, 0.4], blush: 0.3 }), 12], [cut + 84, face('irritated', { brow: 0.2, look: [0.7, 0.2], blush: 0.3 }), 18]]);
    const sf = faceAt(c.f, [[0, face('calm', { look: [0.9, 0] })], [what, face('calm', { mouth: 0.25, look: [0.9, 0] })]]);
    const bo = c.p(meet - 10, 14, ease.back);
    const raise = k(c.f, [[cut, 0], [cut + 14, 1]]);
    return <Coffee cm={cm} t={c.t}>
      <Jaser c={c} p={jp} f={jf} />
      <Salim c={c} p={sp} f={sf} say={[c.at('في'), c.sp[1]]} />
      {bo > 0 && <g transform={`translate(568 282) scale(${Math.min(1, bo)})`} opacity={Math.min(1, bo * 2)}>
        <SpeechBubble w={330} h={186} tail={[156, 106]}><MiniMeeting raise={raise} /></SpeechBubble>
      </g>}
    </Coffee>;
  },

  // 104 — then the feeling: his hand on his chest on «شعرت», a blush on «بالإحراج»; جاسر's crossed arms loosen on «أمام الفريق».
  104: (c) => {
    const felt = c.at('شعرت'), emb = c.at('بالإحراج'), front = c.at('أمام');
    const cm = cam(840, 470, 1.95);
    const sp = poseAt(c.f, [[0, SAL.open], [felt - 14, SAL.chest, 18]]);
    const sf = faceAt(c.f, [[0, face('calm', { look: [0.9, 0] })], [felt - 6, face('hurt', { brow: -0.4, mouth: 0, look: [0.8, 0.1] }), 12], [emb, face('embarrassed', { look: [0.4, 0.6], blush: 0.7 }), 16], [front + 10, face('calm', { brow: -0.35, mouth: 0.1, look: [0.9, 0], blush: 0.35 }), 18]]);
    const jp = poseAt(c.f, [[0, JAS.crossed], [front - 10, JAS.loose, 26]]);
    const jf = faceAt(c.f, [[0, face('contempt', { look: [0.9, 0] })], [emb, face('neutral', { brow: -0.2, browY: 0.35, look: [0.9, 0.1] }), 14], [front + 6, face('hurt', { brow: -0.45, mouth: -0.05, look: [0.4, 0.6] }), 18]]);
    return <Coffee cm={cm} t={c.t} over={<Say text="شعرت بالإحراج" to={sayTo(cm, sHead(SAL.chest), -40)} above={10} o={c.p(felt - 4, 10)} size={50} />}>
      <Jaser c={c} p={jp} f={jf} head={nod(c.f, front + 30, 1, 5)} />
      <Salim c={c} p={sp} f={sf} say={[felt, c.sp[1]]} head={k(c.f, [[emb, 0], [emb + 20, 5], [front + 10, 0]])} />
    </Coffee>;
  },

  // 105 — then the need: a step closer on «أريد», a chopping "let me finish" on «أكمل», the open palm handed over on «وبعدها»; the turns appear as two bubbles; جاسر nods on «كاملة».
  105: (c) => {
    const want = c.at('أريد'), fin = c.at('أكمل'), after = c.at('وبعدها'), hear = c.at('أسمع'), full = c.at('كاملة');
    const cm = cam(960, 455, 1.7);
    const s0 = want - 18, s1 = want + 8;
    const w = walkTo(c.f, s0, s1, SX, SX + 40, CS, { lean: 2 });
    const x = c.f < s0 ? SX : w.x;
    const sp = c.f < s0 ? poseAt(c.f, [[0, SAL.chest], [12, SAL.rest, 22]]) : c.f < s1 ? { p: w.p } : poseAt(c.f, [[s1, { p: walkTo(s1, s0, s1, SX, SX + 40, CS, { lean: 2 }).p }], [s1 + 1, SAL.explain, 14], [fin - 6, SAL.forward, 14], [after - 4, SAL.offer, 18]]);
    const sf = faceAt(c.f, [[0, face('calm', { look: [0.9, 0] })], [want, face('determined', { mouth: 0.25, look: [0.9, 0] }), 12], [after, face('calm', { mouth: 0.45, look: [0.9, 0] }), 14]]);
    const jp = poseAt(c.f, [[0, JAS.loose], [fin, JAS.listen, 22]]);
    const jf = faceAt(c.f, [[0, face('listening', { look: [0.9, 0.1] })], [after, face('listening', { browY: 0.4, look: [0.9, 0] }), 12], [full, face('neutral', { mouth: 0.25, look: [0.8, 0.2] }), 14]]);
    const b1 = c.p(fin - 4, 12, ease.back), b2 = c.p(hear - 4, 12, ease.back);
    const sh = sHead(SAL.explain, SX + 40), jh = jHead(JAS.listen);
    return <Coffee cm={cm} t={c.t}>
      <Jaser c={c} p={jp} f={jf} head={nod(c.f, fin + 34, 1, 6) + nod(c.f, full, 2, 8)} />
      <Salim c={c} p={sp} f={sf} x={x} say={[want, c.sp[1]]} />
      {b1 > 0 && <g transform={`translate(${sh.c[0] - 40} 286) scale(${Math.min(1, b1)})`}><SpeechBubble w={170} h={92} tail={[40, 74]}><Dots color={PAL.calm} /></SpeechBubble></g>}
      {b2 > 0 && <g transform={`translate(${jh.c[0] + 30} 286) scale(${Math.min(1, b2)})`}><SpeechBubble w={170} h={92} tail={[-30, 76]}><Dots color={PAL.provokeLight} /></SpeechBubble></g>}
      <Arrow from={[sh.c[0] + 60, 260]} to={[jh.c[0] - 70, 260]} bend={-0.18} p={c.p(after, 26)} color={INK} w={5} />
    </Coffee>;
  },

  // 106 — جاسر's side: he looks down and rubs the back of his neck, «لم أقصد…»; on «موعد التسليم» a calendar with the day circled appears in a small thought.
  106: (c) => {
    const silent = c.at('سكت'), rub = c.at('قليلا'), says = c.at('لم'), tense = c.at('متوترا'), due = c.at('موعد'), hand = c.at('التسليم');
    const cm = cam(1110, 460, 2.0);
    const rubbing = c.f > rub - 4 && c.f < tense;
    const neck = st({ head: 14, turn: 0.4, R: { sh: -4, el: 10 }, L: { hand: [-6 + (rubbing ? Math.sin(c.f * 0.32) * 5 : 0), -244 + (rubbing ? Math.cos(c.f * 0.32) * 3 : 0)], bend: 1 } }, 'relaxed', 'open');
    const jp = poseAt(c.f, [[0, JAS.listen], [silent, JAS.down, 24], [rub - 14, neck, 18], [tense - 8, JAS.shrug, 18], [due + 10, st({ ...JAS.shrug.p, head: -2 }, 'relaxed', 'cup'), 24]]);
    const jf = faceAt(c.f, [[0, face('listening', { look: [0.9, 0] })], [silent + 6, face('embarrassed', { look: [0.2, 0.9] }), 16], [says, face('embarrassed', { look: [0.5, 0.5], blush: 0.9 }), 12], [tense, face('anxious', { look: [0.8, 0.1] }), 14], [due, face('anxious', { look: [0.2, -0.7] }), 12], [hand + 20, face('anxious', { brow: -0.5, look: [0.8, 0] }), 14]]);
    const sf = faceAt(c.f, [[0, face('listening', { look: [0.9, 0.1] })], [says, face('listening', { look: [0.9, 0.15], mouth: 0.2 })]]);
    const say = c.p(says - 4, 10) * (1 - c.p(tense + 34, 12));
    const cl = c.p(due - 8, 14, ease.back);
    return <Coffee cm={cm} t={c.t} over={<Say text="لم أقصد…" to={sayTo(cm, jHead(JAS.down), 10)} above={10} o={say} size={52} />}>
      <Salim c={c} p={SAL.listen} f={sf} head={nod(c.f, hand + 24, 1, 6)} />
      <Jaser c={c} p={jp} f={jf} say={[says, c.sp[1]]} />
      {cl > 0 && <g transform={`translate(1352 300) scale(${Math.min(1, cl)})`} opacity={Math.min(1, cl * 2)}>
        <ThoughtCloud w={230} h={175} tail={[-140, 90]}><g transform="scale(0.95)"><DeadlineSheet ring={c.p(hand, 24)} /></g></ThoughtCloud>
      </g>}
    </Coffee>;
  },

  // 107 — the hard part, close on سليم: his lips press and the swirl stirs on «صعبًا»; on «استمع» he breathes out, leans in and tilts his head.
  107: (c) => {
    const hard = c.at('صعبا'), listen = c.at('استمع');
    const cm = cam(700, 450, 2.6);
    const sp = poseAt(c.f, [[0, SAL.rest], [hard - 10, SAL.tense, 16], [listen - 4, SAL.listen, 26]]);
    const sf = faceAt(c.f, [[0, face('listening', { look: [0.9, 0.05] })], [hard, face('listening', { tight: 0.8, mouth: 0, brow: 0.25, look: [0.9, 0] }), 10], [listen + 4, face('listening', { open: 0.95, mouth: 0.25, look: [0.95, 0.05] }), 20]]);
    const swirl = c.p(hard - 6, 20) * (1 - 0.8 * c.p(listen, 36));
    const jp = poseAt(c.f, [[0, JAS.talk1], [60, JAS.talk2, 30], [130, JAS.talk1, 30]]);
    const chest = world('salim', SX, FY, CS, 1, [10, -186]);
    return <Coffee cm={cm} t={c.t}>
      <Jaser c={c} p={jp} f="anxious" say={[0, c.dur]} />
      <Salim c={c} p={sp} f={sf} head={nod(c.f, listen + 26, 1, 5)} />
      <ChestSwirl x={chest[0]} y={chest[1]} r={38} t={c.t} amount={swirl} />
    </Coffee>;
  },

  // 108 — he doesn't interrupt: his finger half-rises on «يقاطع» and drops; a reply cloud starts to form, and on «يجهز» he lets it come apart; a nod on «يسمع».
  108: (c) => {
    const inter = c.at('يقاطع'), form = c.at('ولم') - 14, prep = c.at('يجهز'), hear = c.at('يسمع');
    const cm = cam(960, 430, 1.55);
    const sp = poseAt(c.f, [[0, SAL.listen], [inter - 4, SAL.urge, 12], [inter + 24, SAL.listen, 18]]);
    const sf = faceAt(c.f, [[0, face('listening', { look: [0.9, 0] })], [inter, face('listening', { open2: 0.22, browY: 0.45, look: [0.9, 0] }), 8], [inter + 22, face('listening', { tight: 0.6, mouth: 0.05, look: [0.9, 0] }), 10], [form + 4, face('thinking', { look: [-0.2, -0.8] }), 12], [prep + 6, face('listening', { look: [0.95, 0.05] }), 16]]);
    const jp = poseAt(c.f, [[0, JAS.talk2], [40, JAS.talk1, 26], [100, JAS.talk2, 26], [150, JAS.talk1, 26]]);
    const grow = c.p(form, 30, ease.out), gone = c.p(prep + 2, 40, ease.inOut);
    const cx = 620, cy = 255;
    const puffs: [number, number, number][] = [[-90, 10, 52], [-40, -30, 60], [25, -38, 62], [85, -8, 52], [55, 38, 50], [-15, 40, 54], [-80, 46, 40]];
    return <Coffee cm={cm} t={c.t}>
      <Jaser c={c} p={jp} f={face('anxious', { brow: -0.4, look: [0.9, 0] })} say={[0, c.dur]} />
      <Salim c={c} p={sp} f={sf} head={nod(c.f, hear, 2, 7)} />
      {grow > 0 && gone < 1 && <g opacity={1 - gone}>
        {[[64, 4, 7], [40, 30, 12]].map(([dx, dy, r], i) => <circle key={i} cx={cx + 110 + dx * 0.4} cy={cy + 80 + dy * 1.6} r={r * grow} fill="#FFFFFF" stroke={INK} strokeWidth={3} />)}
        <Puffs c={puffs.map(([x, y, r], i) => [cx + x * (1 + gone * 0.9) + Math.sin(i * 2.3) * gone * 40, cy + y * (1 + gone * 0.6) - gone * 50, r * grow * (1 - gone * 0.45)] as [number, number, number])} fill="#FFFFFF" line={3} seed={7} />
        <g opacity={clamp01(grow * 1.4 - gone * 2.2)}>
          <path d={sketch([[cx - 80, cy + 10], [cx - 50, cy - 20], [cx - 20, cy + 14], [cx + 12, cy - 22], [cx + 44, cy + 12], [cx + 78, cy - 16]], 5, 2)} stroke={PAL.warn} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={sketch([[cx - 54, cy + 40], [cx + 50, cy + 36]], 6, 3)} stroke={PAL.textSoft} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      </g>}
    </Coffee>;
  },

  // 109 — «فهمت…»: سليم nods with an open hand, then his palm on «أحتاج» with a small clock on «وقتي»; جاسر nods along and opens his palm to him on «العرض».
  109: (c) => {
    const und = c.at('فهمت'), press = c.at('ضغط'), me = c.at('وأنا'), need = c.at('أحتاج'), resp = c.at('يحترم'), time = c.at('وقتي'), show = c.at('العرض');
    const cm = cam(960, 520, 1.4);
    const sp = poseAt(c.f, [[0, SAL.listen], [und - 10, SAL.ack, 18], [me - 6, SAL.chest, 16], [need - 10, SAL.palm, 16], [show + 8, SAL.rest, 24]]);
    const sf = faceAt(c.f, [[0, face('listening', { look: [0.9, 0] })], [und, face('calm', { mouth: 0.45, look: [0.9, 0] }), 12], [need, face('determined', { mouth: 0.3, look: [0.9, 0] }), 12], [show + 10, face('calm', { mouth: 0.6, look: [0.9, 0] }), 14]]);
    const jp = poseAt(c.f, [[0, JAS.listen], [press - 6, JAS.relieved, 20], [show - 6, JAS.offer, 18]]);
    const jf = faceAt(c.f, [[0, face('listening', { look: [0.9, 0] })], [press, face('relieved', { look: [0.8, 0.1] }), 14], [need, face('listening', { browY: 0.35, look: [0.9, 0] }), 12], [resp, face('smile', { mouth: 0.55, look: [0.9, 0] }), 14]]);
    const palmW = wristOf('salim', SAL.palm.p, SX, FY, CS, 1, 'L');
    const ic = c.p(time - 4, 12, ease.back) * (1 - c.p(show + 14, 12));
    return <Coffee cm={cm} t={c.t}>
      <Jaser c={c} p={jp} f={jf} head={nod(c.f, press + 4, 1, 6) + nod(c.f, resp, 2, 8)} />
      <Salim c={c} p={sp} f={sf} say={[und - 2, c.sp[1]]} head={nod(c.f, und + 6, 2, 7)} />
      {ic > 0 && <g transform={`translate(${palmW[0] + 18} ${palmW[1] - 74}) scale(${Math.min(1, ic) * 1.2})`} opacity={Math.min(1, ic * 2)}><IconClock s={60} accent={PAL.calmLight} /></g>}
    </Coffee>;
  },

  // 110 — listening is not backing down: سليم leans in toward the talk, a ghost of him stepping back fades on «تتراجع»; his feet stay on their marks, which light on «موقفك».
  110: (c) => {
    const lis = c.at('الاستماع'), back = c.at('تتراجع'), pos = c.at('موقفك');
    const X = 760, Y = 900, S = 1.75;
    const sp = poseAt(c.f, [[0, st({ turn: 0.5 })], [lis + 4, st({ lean: 8, head: 10, turn: 0.6, breath: 0.3, R: { hand: [28, -150] }, L: { hand: [36, -152] } }), 26], [back + 30, st({ lean: 11, head: 12, turn: 0.65, R: { hand: [28, -150] }, L: { hand: [40, -160] } }), 30]]);
    const ghost = c.p(back - 4, 16) * (1 - c.p(back + 40, 30));
    const lit = c.p(pos - 4, 18);
    const talk = (i: number) => { const u = ((c.t * 0.9 + i / 3) % 1); return { x: 1180 + u * 40 - i * 0, o: Math.sin(u * Math.PI) }; };
    return <Stage over={<Cap text="الاستماع ليس تراجعًا" o={c.p(back + 8, 14)} top={60} size={60} />}>
      <Paper seed={110} />
      <Floor y={Y} />
      <g transform="translate(1500 470)">
        <SpeechBubble w={330} h={170} tail={[150, 150]}>
          <g>{[-36, 0, 36].map((y, i) => <path key={i} d={`M-110 ${y} q27 ${-14 + i * 4} 55 0 t55 0 t55 0 t55 0`} stroke={PAL.textSoft} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.75} />)}</g>
        </SpeechBubble>
      </g>
      {[0, 1, 2].map((i) => { const q = talk(i); return <path key={i} d={`M${q.x + 70} ${400 + i * 70} q-26 -34 0 -68`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" opacity={q.o * 0.35} />; })}
      {[-24, 24].map((dx, i) => <ellipse key={i} cx={X + dx} cy={Y + 6} rx={36} ry={10} fill={lit > 0 ? PAL.calmLight : 'none'} fillOpacity={lit} stroke={PAL.calm} strokeWidth={4} strokeDasharray={lit > 0.5 ? undefined : '10 8'} />)}
      {ghost > 0 && <g opacity={ghost * 0.32}>
        <Actor f={c.f} seed={41} who="salim" x={X - 70} y={Y} s={S} facing={1} pose={{ p: pose({ ...POSES.stepBack.p, turn: 0.5 }), hands: POSES.stepBack.hands }} face="anxious" />
      </g>}
      {ghost > 0 && <path d={`M${X - 60} ${Y - 40} l40 40 m0 -40 l-40 40`} stroke={PAL.warn} strokeWidth={8} strokeLinecap="round" opacity={c.p(back + 14, 10) * (1 - c.p(back + 40, 30))} />}
      <Actor f={c.f} seed={41} who="salim" x={X} y={Y} s={S} facing={1} pose={sp} face={faceAt(c.f, [[0, face('calm', { look: [0.9, -0.1] })], [lis, face('listening', { look: [0.95, -0.15] }), 16], [pos, face('calm', { mouth: 0.45, look: [0.95, -0.1] }), 16]])} />
    </Stage>;
  },

  // 111 — a wall goes up between سليم and a colleague on «جدارًا تبنيه», falls on «بل»; a low fence with a gate draws in on «وصف واضح»; the gate opens on «تقبله» and the fence holds on «لا تقبله».
  111: (c) => {
    const wall = c.at('جدارا'), but = c.at('بل'), desc = c.at('وصف'), yes = c.at('تقبله'), no = c.at('تقبله', false, 1);
    const Y = 900, S = 1.6, LX = 560, RX = 1360;
    const rows = 15, rh = 38;
    const built = clamp01((c.f - wall) / 64) * rows, fall = c.p(but - 4, 30, ease.in);
    const fence = c.p(desc - 4, 36), gate = k(c.f, [[yes - 6, 0], [yes + 14, 1]]);
    const walled = built > 6 && fall < 0.5;
    const lp = poseAt(c.f, [[0, st({ turn: 0.5 })], [wall + 30, st({ ...POSES.armsCrossed.p, turn: 0.2, head: 4 }, 'fist', 'fist'), 20], [but + 20, st({ turn: 0.6 }), 20], [yes - 10, st({ turn: 0.6, L: { hand: [96, -170] } }, 'relaxed', 'cup'), 16], [no - 10, st({ turn: 0.6, L: { hand: [86, -198] } }, 'relaxed', 'stop'), 16]]);
    const rp = poseAt(c.f, [[0, st({ turn: 0.5 })], [wall + 36, st({ ...POSES.armsCrossed.p, turn: 0.15, head: 6 }, 'fist', 'fist'), 20], [but + 26, st({ turn: 0.6 }), 20], [yes + 10, st({ turn: 0.6, lean: 3, L: { hand: [70, -176] } }, 'relaxed', 'open'), 18]]);
    const lf = faceAt(c.f, [[0, face('neutral', { look: [0.9, 0] })], [wall + 30, face('irritated', { look: [0.3, 0.4] }), 16], [but + 20, face('calm', { look: [0.9, 0] }), 16], [yes, face('smile', { look: [0.9, 0] }), 14], [no, face('calm', { mouth: 0.3, look: [0.9, 0] }), 14]]);
    const rf = faceAt(c.f, [[0, face('neutral', { look: [0.9, 0] })], [wall + 36, face('irritated', { look: [0.2, 0.5] }), 16], [but + 26, face('listening', { look: [0.9, 0] }), 16], [yes + 8, face('smile', { look: [0.9, 0] }), 14]]);
    const posts = [700, 820, 1100, 1220];
    return <Stage over={<>
      <Tag text="أقبل" at={[960, 560]} o={c.p(yes + 4, 12)} bg={PAL.calm} size={46} />
      <Tag text="لا أقبل" at={[760, 640]} o={c.p(no + 2, 12)} bg={PAL.warn} size={46} />
    </>}>
      <Paper seed={111} />
      <Floor y={Y} />
      <Actor f={c.f} seed={41} who="salim" x={LX} y={Y} s={S} facing={1} pose={lp} face={lf} />
      <Actor f={c.f} seed={9} who="att3" x={RX} y={Y} s={S} facing={-1} pose={rp} face={rf} />
      {/* the wall: courses laid bottom-up, then sinking away */}
      {built > 0 && fall < 1 && <g opacity={1 - fall}>
        {Array.from({ length: Math.ceil(built) }, (_, r) => {
          const y = Y - (r + 1) * rh + fall * 120, o = clamp01(built - r);
          return <g key={r} opacity={o}>{[0, 1, 2].map((b) => {
            const off = r % 2 ? -40 : 0, x0 = 880 + off + b * 80;
            const xa = Math.max(880, x0), xb = Math.min(1040, x0 + 80);
            return xb > xa ? <rect key={b} x={xa} y={y} width={xb - xa} height={rh} fill={PAL.storm} stroke={INK} strokeWidth={3} /> : null;
          })}</g>;
        })}
      </g>}
      {/* the low fence and its gate */}
      {fence > 0 && <g>
        {[[640, 900], [1020, 1280]].map(([a, b], i) => <g key={i}>
          {[750, 800].map((y) => <path key={y} d={`M${a} ${y} H${mix(a, b, fence)}`} stroke={PAL.calm} strokeWidth={10} strokeLinecap="round" />)}
        </g>)}
        {posts.map((x, i) => <rect key={x} x={x - 9} y={mix(Y, 722, clamp01(fence * 1.6 - i * 0.12))} width={18} height={Y - mix(Y, 722, clamp01(fence * 1.6 - i * 0.12))} rx={4} fill={PAL.calmLight} stroke={INK} strokeWidth={3} />)}
        {[900, 1020].map((x) => <rect key={x} x={x - 10} y={mix(Y, 708, fence)} width={20} height={Y - mix(Y, 708, fence)} rx={4} fill={PAL.calm} stroke={INK} strokeWidth={3} />)}
        <g opacity={clamp01(fence * 2 - 1)} transform={`translate(910 0) scale(${mix(1, 0.12, gate)} 1)`}>
          <path d={`M0 740 H100 V880 H0 Z M0 880 L100 740`} fill="none" stroke={PAL.calm} strokeWidth={9} strokeLinejoin="round" />
        </g>
      </g>}
    </Stage>;
  },

  // 112 — after noon at his desk, over the report; منى comes in on «جاءت», lays a folder on the desk on «بمهمة» and taps it on «عاجلة».
  112: (c) => {
    const come = c.at('جاءت'), task = c.at('بمهمة'), urg = c.at('عاجلة');
    const cm = cam(1180, 520, 1.3);
    const a0 = 8, a1 = come + 26, put = task + 8;
    const w = walkTo(c.f, a0, a1, 2080, MX, DS * 0.97);
    const mp = c.f < a1 ? { p: w.p, hands: { R: 'relaxed' as const, L: 'grip' as const } } : poseAt(c.f, [[a1, { p: walkTo(a1, a0, a1, 2080, MX, DS * 0.97).p, hands: MONA.hold.hands }], [a1 + 1, MONA.hold, 16], [put - 18, MONA.put, 18], [put + 14, MONA.stand, 20], [urg - 12, MONA.tap, 12], [urg + 26, MONA.stand, 20]]);
    const held = c.f < put;
    const sp = poseAt(c.f, [[0, D.read], [come + 6, D.attend, 22]]);
    const sf = faceAt(c.f, [[0, face('neutral', { look: [0.4, 0.8] })], [come + 8, face('listening', { look: [0.95, -0.1] }), 14], [urg, face('surprised', { open2: 0, browY: 0.5, look: [0.95, 0.2] }), 12]]);
    const mf = faceAt(c.f, [[0, face('anxious', { look: [0.9, 0], mouth: 0.1 })], [put, face('anxious', { look: [0.5, 0.6] }), 12], [urg, face('determined', { look: [0.9, 0.1] }), 12]]);
    const tag = toScreen(cm, [URGENT_AT[0], URGENT_AT[1] - 70]);
    return <Office cm={cm} clock={[14, 10]} salim={<DeskSalim c={c} p={sp} f={sf} />}
      over={<Tag text="عاجل" at={tag} o={c.p(urg - 2, 10)} bg={PAL.warn} size={48} />}
      front={<>
        {!held && <FlatFolder x={URGENT_AT[0]} y={URGENT_AT[1]} color={PAL.warn} />}
        <Mona c={c} p={mp} f={mf} x={c.f < a1 ? w.x : MX} say={[task - 6, c.sp[1]]} hold={held ? <HeldFolder color={PAL.warn} /> : undefined} hands={held ? undefined : c.f < put + 10 ? { L: 'open' } : undefined} />
      </>} />;
  },

  // 113 — in the past (faded): «حاضر» with a forced smile and a nod; then the night: the lamp, the clock running to dawn, angry typing on «غاضبًا», the window paling on «الفجر».
  113: (c) => {
    const past = c.at('الماضي'), ok = c.at('حاضر'), up = c.at('يسهر'), mad = c.at('غاضبا'), dawn = c.at('الفجر');
    const nightIn = c.p(up - 18, 24);
    const cm = camMix(cam(1180, 520, 1.3), cam(820, 470, 1.62), c.p(up - 24, 50));
    const sp = c.f < up - 6 ? poseAt(c.f, [[0, D.attend], [ok - 10, st({ ...D.attend.p, head: 2 }), 12]]) : poseAt(c.f, [[up - 6, D.attend], [up + 4, D.type(c.f), 14], [dawn, st({ sit: 1, lean: 14, head: 22, bob: 4, turn: 0.5, footR: [52, 0], footL: [64, 0], R: { hand: [72, -146] }, L: { hand: [86, -144] } }), 26]]);
    const sf = faceAt(c.f, [[0, face('listening', { look: [0.95, -0.1] })], [ok - 6, face('forcedSmile', { look: [0.95, 0] }), 10], [up, face('irritated', { look: [0.9, 0.3] }), 14], [mad, face('angry', { look: [0.9, 0.35], open2: 0 }), 12], [dawn, face('sad', { open: 0.55, look: [0.6, 0.6] }), 18]]);
    const hours = mix(21, 28.5, c.p(up, dawn - up + 10, ease.lin));
    const lamp = c.p(up - 6, 10);
    const mo = 1 - c.p(up - 30, 20);
    const S = 1.62;
    return <Stage cam={cm} over={<>
      <Cap text="في الماضي" o={c.p(past - 4, 12) * (1 - c.p(up - 20, 12))} top={50} size={50} />
      <Say text="حاضر" to={sayTo(cm, headOf('salim', D.attend.p, DESK.seat.x, DY, DS, 1), 20)} above={10} o={c.p(ok - 4, 8) * (1 - c.p(ok + 56, 10))} size={52} />
    </>}>
      <defs><filter id="b6-past"><feColorMatrix type="saturate" values="0.18" /></filter></defs>
      <g filter="url(#b6-past)">
        <DeskBack />
        <g transform={`translate(${CLOCK_AT[0]} ${CLOCK_AT[1]})`}><Clock hours={Math.floor(hours)} minutes={(hours % 1) * 60} r={44} /></g>
        <DeskSalim c={c} p={sp} f={sf} head={nod(c.f, ok + 4, 2, 8)} />
        <DeskFront mug={false} />
        <FlatFolder x={URGENT_AT[0]} y={URGENT_AT[1]} color={PAL.warn} />
        {mo > 0 && <Mona c={c} p={poseAt(c.f, [[0, MONA.tap], [24, MONA.stand, 20]])} f={face('neutral', { look: [0.9, 0.1] })} o={mo} />}
        {/* the window at night, then pale at dawn */}
        {[[120, 204], [336, 204]].map(([x, wd]) => <g key={x}>
          <rect x={x} y={150} width={wd} height={380} fill={PAL.skyNight} opacity={nightIn * 0.75 * (1 - 0.6 * c.p(dawn - 4, 30))} />
          <rect x={x} y={150} width={wd} height={380} fill="#E6D8E6" opacity={0.7 * c.p(dawn - 4, 30)} />
        </g>)}
        <rect x={-200} y={-200} width={2400} height={1500} fill={NIGHT} opacity={nightIn * 0.32 * (1 - 0.4 * c.p(dawn, 30))} />
        <g transform={`translate(1000 ${DESK.deskTop}) scale(${-1.35 * S / S} 1.35)`} opacity={lamp}><Lamp on={lamp} /></g>
        <rect x={-200} y={-200} width={2400} height={1500} fill={PAL.paper} opacity={0.2} />
      </g>
    </Stage>;
  },

  // 114 — this time: an open palm toward the urgent folder on «آخذها», a pat on the report on «سأؤجل التقرير», the calendar flips and he points on «الخميس», then his palms weigh the two on «أيهما أولى».
  114: (c) => {
    const said = c.at('قال'), can = c.at('أستطيع'), take = c.at('آخذها'), post = c.at('سأؤجل'), thu = c.at('الخميس'), which = c.at('أيهما');
    const cm = cam(1150, 500, 1.4);
    const sp = poseAt(c.f, [[0, D.attend], [take - 16, D.toUrgent, 18], [post - 10, D.pat, 16], [thu - 14, D.point, 14], [which - 12, D.scale(c.f), 16]]);
    const sf = faceAt(c.f, [[0, face('calm', { look: [0.95, -0.1] })], [can, face('calm', { mouth: 0.4, look: [0.95, -0.1] }), 12], [post, face('calm', { mouth: 0.2, look: [0.7, 0.5] }), 12], [thu, face('calm', { mouth: 0.35, look: [0.95, 0.1] }), 12], [which, face('calm', { browY: 0.4, mouth: 0.35, look: [0.95, -0.15] }), 12]]);
    const mp = poseAt(c.f, [[0, MONA.stand], [can, MONA.listen, 20], [thu - 4, MONA.chin, 20]]);
    const mf = faceAt(c.f, [[0, face('neutral', { look: [0.9, 0.1] })], [take, face('listening', { look: [0.9, 0.1] }), 12], [thu, face('thinking', { look: [0.6, 0.5] }), 14], [which + 6, face('thinking', { look: [0.95, 0] }), 14]]);
    const flip = c.f < post + 40 ? 0 : clamp01((c.f - (post + 40)) / 18) + clamp01((c.f - (post + 62)) / 16) + clamp01((c.f - (thu - 14)) / 14);
    const wl = wristOf('salim', D.scale(c.f).p, DESK.seat.x, DY, DS, 1, 'L'), wr = wristOf('salim', D.scale(c.f).p, DESK.seat.x, DY, DS, 1, 'R');
    const ic = c.p(which - 2, 12, ease.back);
    return <Office cm={cm} clock={[14, 20]} salim={<DeskSalim c={c} p={sp} f={sf} say={[said, c.sp[1]]} head={nod(c.f, can + 4, 1, 7)} />}
      cal={<g transform={`translate(${CAL_AT[0]} ${CAL_AT[1]})`}><DeskCal flip={flip} pages={3} label="الخميس" ring={c.p(thu + 4, 20)} /></g>}
      front={<>
        <FlatFolder x={URGENT_AT[0]} y={URGENT_AT[1]} color={PAL.warn} />
        <Mona c={c} p={mp} f={mf} head={nod(c.f, take + 6, 1, 6)} />
        {ic > 0 && <g opacity={Math.min(1, ic)}>
          <g transform={`translate(${wl[0] + 14} ${wl[1] - 30}) scale(${0.62 * Math.min(1, ic)})`}><FlatFolder x={0} y={0} color={PAL.warn} w={100} /></g>
          <g transform={`translate(${wr[0] + 10} ${wr[1] - 30}) scale(${0.62 * Math.min(1, ic)})`}><FlatFolder x={0} y={0} color={PAL.focus} w={100} /></g>
        </g>}
      </>} />;
  },

  // 115 — no raised voice, no stubborn no, and he doesn't disappear: منى weighs it, picks up the urgent folder on «يرفض» and nods on «لكنه»; سليم sits upright and nods back.
  115: (c) => {
    const voice = c.at('صوته'), refuse = c.at('يرفض'), but = c.at('لكنه'), gone = c.at('يختف');
    const cm = cam(1240, 470, 1.55);
    const pick = refuse + 8;
    const mp = poseAt(c.f, [[0, MONA.chin], [refuse - 14, MONA.put, 20], [pick + 2, MONA.carry, 22]]);
    const held = c.f >= pick;
    const mf = faceAt(c.f, [[0, face('thinking', { look: [0.6, 0.4] })], [voice, face('thinking', { look: [0.95, 0] }), 14], [refuse, face('neutral', { look: [0.6, 0.6] }), 12], [but, face('smile', { mouth: 0.6, look: [0.95, 0] }), 14]]);
    const sf = faceAt(c.f, [[0, face('calm', { mouth: 0.3, look: [0.95, -0.1] })], [refuse, face('listening', { look: [0.9, 0.2] }), 12], [gone, face('calm', { mouth: 0.55, look: [0.95, -0.1] }), 14]]);
    return <Office cm={cm} clock={[14, 22]} salim={<DeskSalim c={c} p={D.upright(c.f)} f={sf} head={nod(c.f, gone + 4, 1, 7)} />}
      cal={<g transform={`translate(${CAL_AT[0]} ${CAL_AT[1]})`}><DeskCal flip={3} pages={3} label="الخميس" /></g>}
      front={<>
        {!held && <FlatFolder x={URGENT_AT[0]} y={URGENT_AT[1]} color={PAL.warn} />}
        <Mona c={c} p={mp} f={mf} head={nod(c.f, but, 2, 8)} hold={held ? <HeldFolder color={PAL.warn} /> : undefined} say={[but - 4, but + 50]} />
      </>} />;
  },

  // 116 — the next meeting: سليم presents again; جاسر leans back and lifts his finger on «حاول»; سليم lifts his palm, calmly, on «رفع».
  116: (c) => {
    const nxt = c.at('الاجتماع'), tr = c.at('حاول'), ja = c.at('جاسر'), raise = c.at('رفع');
    const cm = cam(1180, 540, 1.4);
    const look = k(c.f, [[ja - 6, 0], [ja + 10, 1], [raise + 4, 1], [raise + 20, 0]]);
    const seats = team(look);
    const jp = poseAt(c.f, [[0, { p: atTable({ lean: -6, head: -4, turn: 0.45 }) }], [tr - 4, jaserFinger, 16]]);
    const jf = faceAt(c.f, [[0, 'smug'], [tr, face('smug', { brow: 0.5, open: 0.8 }), 10], [raise + 6, face('surprised', { open2: 0.1, browY: 0.5 }), 10]]);
    seats[4] = { who: 'jaser', p: jp.p, hands: jp.hands, face: jf, say: [c.at('يقاطعه') - 4, raise + 8] };
    const sp = poseAt(c.f, [[0, 'explain'], [50, st({ lean: 3, head: 2, turn: 0.4, R: { hand: [62, -186] }, L: { hand: [70, -172] } }, 'open', 'cup'), 30], [tr + 10, st({ lean: 1, turn: 0.55, R: { hand: [40, -160] }, L: { hand: [70, -170] } }, 'relaxed', 'open'), 18], [raise - 10, presStop, 14]]);
    const sf = faceAt(c.f, [[0, 'smile'], [tr + 14, face('neutral', { look: [0.9, 0.2] }), 12], [raise, face('calm', { mouth: 0.4, look: [0.9, 0.25] }), 12]]);
    return <Stage cam={cm} over={<Cap text="الاجتماع التالي" o={c.p(nxt - 4, 12) * (1 - c.p(tr, 14))} top={40} size={54} />}>
      <Meeting f={c.f} seats={seats} front={<Actor f={c.f} seed={41} who="salim" pose={sp} face={sf} x={STAND.x} y={STAND.y} s={1.45} facing={-1} say={[0, tr + 6]} />} />
    </Stage>;
  },

  // 117 — «اسمح لي أكمل الفكرة… وبعدها الكلمة لك»: the palm turns into an offer on «لك»; جاسر lowers his finger and sits back on «الكلمة».
  117: (c) => {
    const after = c.at('وبعدها'), word = c.at('الكلمة'), you = c.at('لك');
    const cm = cam(1440, 470, 2.0);
    const seats = team(0.6);
    const jp = poseAt(c.f, [[0, jaserFinger], [word - 12, { p: atTable({ lean: -2, head: 4, turn: 0.45 }) }, 22]]);
    seats[4] = { who: 'jaser', p: jp.p, hands: jp.hands, face: faceAt(c.f, [[0, face('surprised', { open2: 0, browY: 0.5 })], [word, face('neutral', { brow: 0.1, look: [1, -0.25] }), 14], [you, face('smile', { mouth: 0.35, skew: 0.3, look: [1, -0.25] }), 14]]) };
    seats[4].p = { ...seats[4].p!, head: seats[4].p!.head + nod(c.f, you + 6, 1, 7) };
    const sp = poseAt(c.f, [[0, presStop], [you - 16, presOffer, 18]]);
    const sf = faceAt(c.f, [[0, face('calm', { mouth: 0.4, look: [0.9, 0.25] })], [you, face('smile', { look: [0.9, 0.25] }), 14]]);
    const head = headOf('salim', presStop.p, STAND.x, STAND.y, 1.45, -1);
    return <Stage cam={cm} over={<>
      <Say text="اسمح لي أكمل الفكرة" to={sayTo(cm, head)} above={10} o={c.p(4, 10) * (1 - c.p(after - 6, 8))} size={46} />
      <Say text="وبعدها الكلمة لك" to={sayTo(cm, head)} above={10} o={c.p(after - 2, 10)} size={46} />
    </>}>
      <Meeting f={c.f} seats={seats} front={<Actor f={c.f} seed={41} who="salim" pose={sp} face={sf} x={STAND.x} y={STAND.y} s={1.45} facing={-1} say={[0, c.sp[1]]} />} />
    </Stage>;
  },

  // 118 — «وأكمل»: he turns to the board and points; the team's heads follow; a green ring goes round the chart.
  118: (c) => {
    const go = c.at('وأكمل');
    const cm = cam(1260, 480, 1.38);
    const turn = k(c.f, [[go + 4, 0], [go + 26, 1]]);
    const seats = team(0, ['mona', 'att1', 'hadi', 'att2'].map((_, i) => face('listening', { look: [mix(0.7, 1, turn), mix(0.1, -0.5, turn)] })));
    seats.forEach((s, i) => { if (s) s.p = atTable({ head: mix(2, -8, turn) + i, turn: mix(0.7, 0.9, turn) }); });
    seats[4] = { who: 'jaser', p: atTable({ lean: -2, head: mix(2, -8, turn), turn: mix(0.45, 0.8, turn) }), face: face('neutral', { look: [1, mix(-0.2, -0.5, turn)] }) };
    const sp = poseAt(c.f, [[0, presOffer], [go - 4, pointBoard, 18]]);
    const ring = c.p(go + 18, 40);
    return <Stage cam={cm}>
      <Meeting f={c.f} seats={seats} front={<>
        <Actor f={c.f} seed={41} who="salim" pose={sp} face={faceAt(c.f, [[0, face('smile', { look: [0.9, 0.2] })], [go + 6, face('calm', { mouth: 0.5, look: [0.9, -0.6] }), 12]])} x={STAND.x} y={STAND.y} s={1.45} facing={-1} say={[go, c.dur]} />
        {ring > 0 && <ellipse cx={1610} cy={330} rx={70} ry={92} fill="none" stroke={PAL.calm} strokeWidth={7} pathLength={1} strokeDasharray={`${ring} 1`} transform="rotate(-8 1610 330)" />}
      </>} />
    </Stage>;
  },

  // 119 — nobody changes in a day: سليم walks a path that rises, dips and rises again, tired in the dip on «واحد», determined on the climb from «ولا أحد»; calendar pages keep falling.
  119: (c) => {
    const one = c.at('واحد'), none = c.at('ولا');
    const S = 1.5;
    const w = walkTo(c.f, 8, c.dur - 6, 1660, 600, S, { lean: 4 });
    const y = pathY(w.x), slope = (pathY(w.x - 20) - pathY(w.x + 20)) / 40; // > 0 when the path climbs ahead (to the left)
    const tired = c.p(c.at('يوم') - 20, 30) * (1 - c.p(none - 6, 24));
    const p = pose({ ...w.p, lean: w.p.lean - slope * 22 + tired * 6, head: tired * 14 - (1 - tired) * 2, bob: w.p.bob + tired * 4, turn: 0.55 });
    const fc = faceAt(c.f, [[0, face('neutral', { look: [0.9, 0.2] })], [one - 30, face('sad', { open: 0.7, mouth: -0.3, look: [0.6, 0.7] }), 20], [none, face('determined', { look: [0.9, -0.2] }), 16], [c.at('واحد', false, 1), face('determined', { mouth: 0.3, look: [0.9, -0.3] }), 16]]);
    const pts = Array.from({ length: 101 }, (_, i) => [2000 - i * 21, pathY(2000 - i * 21)] as [number, number]);
    const walked = pts.filter(([x]) => x >= w.x);
    const page = c.f / 30, n = Math.floor(page), u = page - n;
    return <Stage>
      <Paper seed={119} />
      <path d={`${smooth(pts)} L-120 1200 L2040 1200 Z`} fill={PAL.paperShade} />
      <path d={smooth(pts)} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="14 14" opacity={0.35} />
      <path d={smooth([...walked, [w.x, y]])} fill="none" stroke={PAL.calm} strokeWidth={12} strokeLinecap="round" />
      {/* the tear-off calendar: one page falls each "day" */}
      <g transform="translate(300 90)">
        <rect x={-110} y={0} width={220} height={190} rx={10} fill="#FBFAF7" stroke={INK} strokeWidth={4} />
        {[0, 1, 2].map((r) => <path key={r} d={`M-70 ${86 + r * 30} h${140 - r * 40}`} stroke="#AEB6C0" strokeWidth={8} strokeLinecap="round" />)}
        <g transform={`translate(${u * 60} ${u * u * 420}) rotate(${u * 40} 0 40)`} opacity={1 - u}>
          <rect x={-110} y={0} width={220} height={190} rx={10} fill="#FBFAF7" stroke={INK} strokeWidth={4} />
          {[0, 1, 2].map((r) => <path key={r} d={`M-70 ${86 + r * 30} h${140 - ((r + n) % 3) * 30}`} stroke="#AEB6C0" strokeWidth={8} strokeLinecap="round" />)}
        </g>
        <rect x={-110} y={0} width={220} height={46} rx={10} fill={PAL.focus} stroke={INK} strokeWidth={4} />
        {[-60, 0, 60].map((x) => <path key={x} d={`M${x} 10 v-22`} stroke={INK} strokeWidth={6} strokeLinecap="round" />)}
      </g>
      <Actor f={c.f} seed={41} who="salim" x={w.x} y={y} s={S} facing={-1} pose={{ p }} face={fc} />
    </Stage>;
  },

  // 120 — evening in his room: he carries a new notebook to the bedside and lays it on the nightstand on «دفتر», then stands back, calm.
  120: (c) => {
    const start = c.at('بدأ'), book = c.at('دفتر'), bed = c.at('السرير');
    const X0 = 1010, X1 = 735, a0 = start - 10, a1 = book - 30;
    const w = walkTo(c.f, a0, a1, X0, X1, 1.45);
    const carry = st({ head: 12, turn: 0.45, R: { sh: -4, el: 10 }, L: { hand: [40, -186] } }, 'relaxed', 'grip');
    const place = st({ lean: 16, head: 16, turn: 0.5, R: { sh: -4, el: 12 }, L: { hand: [103, -132] } }, 'relaxed', 'grip');
    const down = book + 8;
    const p = c.f < a0 ? carry : c.f < a1 ? { p: { ...w.p, L: carry.p.L, head: 6 }, hands: carry.hands } : poseAt(c.f, [[a1, { p: { ...walkTo(a1, a0, a1, X0, X1, 1.45).p, L: carry.p.L, head: 6 }, hands: carry.hands }], [a1 + 2, carry, 12], [down - 18, place, 18], [down + 16, st({ head: 10, turn: 0.4, R: { sh: -4, el: 10 }, L: { sh: 8, el: 20 } }), 24], [bed, st({ head: 4, turn: 0.3, breath: 0.6, R: { sh: -4, el: 10 }, L: { sh: 6, el: 14 } }), 30]]);
    const held = c.f < down;
    const at = wristOf('salim', place.p, X1, 860, 1.45, -1, 'L');
    const fc = faceAt(c.f, [[0, face('calm', { look: [0.5, 0.8] })], [a0 + 10, face('calm', { look: [0.8, 0.2] }), 12], [down - 10, face('calm', { look: [0.6, 0.8] }), 12], [bed, face('relieved', { mouth: 0.55 }), 18]]);
    return <Stage>
      <Bedroom night lamp={0} />
      {!held && <FlatBook x={at[0] - 8} y={BEDROOM.nightstand.y - 8} />}
      <Actor f={c.f} seed={41} who="salim" x={c.f < a0 ? X0 : c.f < a1 ? w.x : X1} y={860} s={1.45} facing={-1} pose={p} face={fc} hold={held ? { L: <HeldBook /> } : undefined} upright={{ L: true }} hands={held ? undefined : c.f < down + 12 ? { L: 'open' } : undefined} />
    </Stage>;
  },
};
