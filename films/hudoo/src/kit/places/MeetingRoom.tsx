import React from 'react';
import { INK, LINE, PAL, sketch } from '../style';
import { Arabic, BASE, Clock, Door, LIT, Plant, Poly, Rect, Room, Window, blob, city } from './parts';

// The meeting room. Back layer → seated characters → table front.
const SEAT_X = [430, 642, 854, 1066, 1278, 1490];
export const MEETING = {
  /** Character x and facing for the six seats behind the table (left three face right, right three face left). */
  seats: SEAT_X.map((x, i) => ({ x, facing: (i < 3 ? 1 : -1) as 1 | -1 })),
  /** Seated at scale 1.3: hips at y 705 (shoulders and hands clear the table), so pass y = feetY to <Character>. */
  hipY: 705, feetY: 705 + 112 * 1.3, scale: 1.3,
  /** The presenter's spot beside the whiteboard (standing, scale 1.45). */
  standAt: { x: 1700, y: 860 },
  tableTop: 650,
};

const WIN = { x: 470, y: 110, w: 760, h: 440 };
const farCity = city({ x0: WIN.x - 20, x1: WIN.x + WIN.w + 20, base: WIN.y + WIN.h, seed: 3, h: [170, 330], w: [46, 96], lit: 0.1 });
const nearCity = city({ x0: WIN.x - 40, x1: WIN.x + WIN.w + 20, base: WIN.y + WIN.h + 10, seed: 8, h: [70, 210], w: [70, 140], lit: 0.18 });

const Whiteboard: React.FC = () => {
  const x = 1340, y = 200, w = 470, h = 290;
  const bars = [62, 104, 84, 150];
  const ax = x + 50, ay = y + h - 50;
  const line: [number, number][] = bars.map((b, i) => [ax + 38 + i * 56, ay - b - 22]);
  return (
    <g>
      <Rect x={x - 12} y={y - 12} w={w + 24} h={h + 24} fill={PAL.metal} seed={41} />
      <Rect x={x} y={y} w={w} h={h} fill="#F8F9FB" sw={LINE.fine} seed={42} />
      <Rect x={x + 70} y={y + h + 12} w={w - 140} h={12} fill={PAL.metal} sw={LINE.fine} seed={43} />
      {[PAL.focus, PAL.provoke, PAL.calm].map((c, i) => <rect key={c} x={x + 110 + i * 46} y={y + h + 4} width={30} height={9} rx={3} fill={c} />)}
      {/* chart */}
      <Poly pts={[[ax, y + 40], [ax, ay], [ax + 250, ay]]} open sw={LINE.fine} seed={44} />
      {bars.map((b, i) => <Rect key={i} x={ax + 22 + i * 56} y={ay - b} w={34} h={b} fill={PAL.focusLight} stroke={PAL.focus} sw={LINE.fine} seed={45 + i} />)}
      <Poly pts={line} open stroke={PAL.calm} sw={LINE.normal} seed={50} wob={2.2} />
      <path d={`M${line[3][0] - 14} ${line[3][1] - 2} L${line[3][0]} ${line[3][1]} L${line[3][0] - 4} ${line[3][1] + 14}`} fill="none" stroke={PAL.calm} strokeWidth={LINE.normal} strokeLinecap="round" strokeLinejoin="round" />
      {/* the one word, and scribbled notes under it */}
      <Arabic x={x + w - 170} y={y + 26} w={150} h={50} text="الخطة" size={34} color={PAL.focus} align="right" />
      {[0, 1, 2].map((i) => <path key={i} d={sketch([[x + w - 30, y + 106 + i * 32], [x + w - 150 + i * 22, y + 106 + i * 32]], 60 + i, 3.2)} fill="none" stroke={PAL.textSoft} strokeWidth={LINE.fine} strokeLinecap="round" opacity={0.75} />)}
      {[PAL.calmLight, PAL.provokeLight].map((c, i) => <Rect key={c} x={x + w - 150 + i * 70} y={y + 200 + (i % 2) * 8} w={54} h={54} fill={c} sw={LINE.far} seed={70 + i} />)}
    </g>
  );
};

/** A chair back seen from the front, peeking above the table. */
const ChairBack: React.FC<{ x: number; seed: number }> = ({ x, seed }) => (
  <g transform="translate(0 -55)">
    <Poly pts={[[x - 60, 660], [x - 64, 580], [x - 52, 532], [x + 52, 532], [x + 64, 580], [x + 60, 660]]} fill={PAL.chair} seed={seed} />
    <Poly pts={[[x - 44, 640], [x - 46, 580], [x - 36, 550], [x + 36, 550], [x + 46, 580], [x + 44, 640]]} fill={PAL.chairDark} sw={0} seed={seed + 1} o={0.5} />
  </g>
);

export const MeetingBack: React.FC<{ t?: number }> = ({ t = 0 }) => (
  <g>
    <Room wall={PAL.wallBlue} floor={PAL.floorBlue} />
    <Door x={44} w={190} top={300} leaf={PAL.wood} glass seed={11} />
    <Clock x={350} y={190} r={44} t={t} />
    <Window {...WIN} id="pl-meet-win" sky="url(#pl-meet-sky)" cols={3} seed={21}>
      <linearGradient id="pl-meet-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D3DBEA" /><stop offset="1" stopColor={PAL.wallLav} /></linearGradient>
      {[0, 1].map((i) => {
        const span = WIN.w + 420, cx = WIN.x - 210 + ((t * (6 + i * 3) + i * 520) % span);
        return <path key={i} d={blob(cx, WIN.y + 70 + i * 60, 90 - i * 20, 22, 30 + i, 8)} fill="#FFFFFF" opacity={0.7} />;
      })}
      <path d={farCity.bodies} fill="#C4CBDC" stroke={PAL.textSoft} strokeWidth={LINE.far} strokeOpacity={0.35} />
      <path d={farCity.lights} fill={LIT} opacity={0.8} />
      <path d={nearCity.bodies} fill="#AEB7CB" stroke={PAL.textSoft} strokeWidth={LINE.far} strokeOpacity={0.5} />
      <path d={nearCity.lights} fill={LIT} />
    </Window>
    <Whiteboard />
    <Plant x={1866} y={BASE + 6} s={1.15} seed={5} pot={PAL.wallLav} />
    {MEETING.seats.map((s, i) => <ChairBack key={i} x={s.x - s.facing * 12} seed={80 + i} />)}
  </g>
);

const L = 330, R = 1590, TOP = 650;
/** A mug standing on the table top at x. */
const Mug: React.FC<{ x: number; c: string; seed: number }> = ({ x, c, seed }) => (
  <g>
    <path d={`M${x + 28} ${TOP - 34} q16 2 14 14 q-2 10 -14 10`} fill="none" stroke={INK} strokeWidth={LINE.fine} />
    <Rect x={x} y={TOP - 46} w={30} h={42} fill={c} sw={LINE.fine} seed={seed} />
  </g>
);
/** A laptop facing the person behind the table: we see the back of its lid. */
const Laptop: React.FC<{ x: number; seed: number }> = ({ x, seed }) => (
  <g>
    <Poly pts={[[x - 46, TOP - 8], [x + 46, TOP - 8], [x + 40, TOP - 78], [x - 40, TOP - 78]]} fill={PAL.metal} seed={seed} />
    <circle cx={x} cy={TOP - 44} r={6} fill={PAL.paper} opacity={0.6} />
    <Rect x={x - 54} y={TOP - 12} w={108} h={8} fill={PAL.chairDark} sw={LINE.fine} seed={seed + 1} />
  </g>
);

export const MeetingTableFront: React.FC = () => (
  <g>
    <ellipse cx={960} cy={952} rx={700} ry={16} fill={INK} opacity={0.08} />
    {/* recessed modesty panel: hides laps, leaves shins and feet */}
    <Rect x={L + 30} y={690} w={R - L - 60} h={104} fill="#9FAABA" sw={LINE.fine} seed={89} />
    {[L + 40, 930, R - 66].map((x, i) => (
      <g key={x}>
        <Rect x={x} y={696} w={26} h={252} fill={PAL.chairDark} sw={LINE.fine} seed={90 + i} />
        <Rect x={x - 14} y={942} w={54} h={10} fill={PAL.chairDark} sw={LINE.fine} seed={95 + i} />
      </g>
    ))}
    {/* things on the table, standing on its top surface */}
    <Laptop x={536} seed={101} />
    <Laptop x={1384} seed={104} />
    <Mug x={790} c={PAL.focusLight} seed={107} />
    <Mug x={1186} c={PAL.paper} seed={108} />
    <Rect x={960} y={TOP - 40} w={22} h={38} fill={PAL.waterLight} sw={LINE.fine} seed={109} o={0.9} />
    <Poly pts={[[L - 12, TOP - 16], [R + 12, TOP - 16], [R + 20, TOP + 2], [L - 20, TOP + 2]]} fill={PAL.table} seed={110} />
    {/* papers and a notebook, flat on the top */}
    <Poly pts={[[600, TOP - 4], [700, TOP - 4], [688, TOP - 13], [610, TOP - 13]]} fill="#FFFFFF" sw={LINE.far} seed={111} />
    <Poly pts={[[1030, TOP - 3], [1130, TOP - 3], [1122, TOP - 12], [1046, TOP - 12]]} fill="#FFFFFF" sw={LINE.far} seed={112} />
    <Poly pts={[[1050, TOP - 7], [1150, TOP - 7], [1140, TOP - 15], [1060, TOP - 15]]} fill="#FFFFFF" sw={LINE.far} seed={113} />
    <Rect x={420} y={TOP - 13} w={90} h={9} fill={PAL.plum} sw={LINE.far} seed={114} />
    <Rect x={L - 20} y={TOP + 2} w={R - L + 40} h={48} fill={PAL.tableEdge} seed={115} />
    <path d={sketch([[L - 8, TOP + 10], [R + 8, TOP + 10]], 116, 1.2)} stroke="#FFFFFF" strokeWidth={LINE.fine} opacity={0.35} fill="none" />
  </g>
);
