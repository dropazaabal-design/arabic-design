import React from 'react';
import { INK, LINE, PAL } from '../style';
import { BASE, Glow, LIGHT, Plant, Poly, Rect, Room, Window, blob } from './parts';
import { Curtains } from './HomeLiving';

// The family dining room. Back layer → seated family → table front (with the plates).
const SEAT_X = [640, 860, 1060, 1280];
export const DINING = {
  /** Character x and facing; seated at scale 1.3 with hips at y 705 so shoulders and hands clear the table (pass y = feetY). */
  seats: SEAT_X.map((x, i) => ({ x, facing: (i < 2 ? 1 : -1) as 1 | -1 })),
  hipY: 705, feetY: 705 + 112 * 1.3, scale: 1.3,
  tableTop: 650,
};

const DiningChair: React.FC<{ x: number; seed: number }> = ({ x, seed }) => (
  <g transform="translate(0 -55)">
    <Poly pts={[[x - 54, 670], [x - 56, 540], [x - 46, 516], [x + 46, 516], [x + 56, 540], [x + 54, 670]]} fill={PAL.wood} seed={seed} />
    {[-24, 0, 24].map((dx) => <path key={dx} d={`M${x + dx} 548 V650`} stroke={PAL.woodDark} strokeWidth={LINE.normal} strokeLinecap="round" />)}
  </g>
);

export const DiningBack: React.FC = () => (
  <g>
    <Room wall={PAL.wallSage} floor={PAL.floor} seed={9} />
    <Curtains x={190} y={190} w={320} h={300} c="#B9C7C0" seed={11} />
    <Window x={190} y={190} w={320} h={300} id="pl-din-win" sky={PAL.skyEve} seed={15}>
      <path d={blob(350, 480, 240, 70, 3, 10)} fill={PAL.plant} opacity={0.6} />
    </Window>
    {/* sideboard with a vase, and an abstract picture above it */}
    <Rect x={1540} y={300} w={230} h={170} fill={PAL.paper} seed={21} />
    <Rect x={1556} y={316} w={198} h={138} fill={PAL.calmLight} sw={LINE.fine} seed={22} />
    <circle cx={1620} cy={380} r={36} fill={PAL.rose} stroke={INK} strokeWidth={LINE.fine} />
    <path d="M1580 440 Q1650 360 1740 420" fill="none" stroke={PAL.calm} strokeWidth={10} strokeLinecap="round" />
    <Rect x={1682} y={334} w={44} h={44} fill={PAL.focus} sw={LINE.fine} seed={23} />
    <Rect x={1500} y={620} w={320} h={BASE - 616} fill={PAL.wood} seed={24} />
    <Rect x={1516} y={640} w={140} h={150} fill={PAL.wood} sw={LINE.fine} seed={25} />
    <Rect x={1664} y={640} w={140} h={150} fill={PAL.wood} sw={LINE.fine} seed={26} />
    <Rect x={1490} y={608} w={340} h={14} fill={PAL.woodDark} sw={LINE.fine} seed={27} />
    <Plant x={1600} y={608} s={0.5} seed={29} pot={PAL.focusLight} n={7} />
    {/* pendant lamp over the table */}
    <path d="M960 0 V318" stroke={INK} strokeWidth={LINE.fine} />
    <Glow x={960} y={420} r={300} ry={200} o={0.35} />
    <Poly pts={[[900, 372], [1020, 372], [992, 318], [928, 318]]} fill={PAL.metal} seed={31} />
    <ellipse cx={960} cy={374} rx={48} ry={9} fill={LIGHT} stroke={INK} strokeWidth={LINE.fine} />
    {DINING.seats.map((s, i) => <DiningChair key={i} x={s.x - s.facing * 12} seed={40 + i} />)}
  </g>
);

const L = 520, R = 1400, TOP = 650;
export const DiningTableFront: React.FC<{ food?: boolean }> = ({ food = false }) => (
  <g>
    <ellipse cx={960} cy={952} rx={500} ry={14} fill={INK} opacity={0.08} />
    {[L + 30, R - 54].map((x, i) => <Rect key={x} x={x} y={720} w={24} h={230} fill={PAL.woodDark} sw={LINE.fine} seed={50 + i} />)}
    {/* bowl and glasses stand above the top */}
    <path d={`M${920} ${TOP - 40} Q${922} ${TOP - 4} ${960} ${TOP - 4} Q${998} ${TOP - 4} ${1000} ${TOP - 40} Z`} fill={PAL.calmLight} stroke={INK} strokeWidth={LINE.fine} strokeLinejoin="round" />
    {food && <path d={blob(960, TOP - 44, 36, 14, 61, 8)} fill={PAL.plant} stroke={INK} strokeWidth={LINE.far} />}
    {[750, 1170].map((x, i) => <Rect key={x} x={x - 11} y={TOP - 44} w={22} h={40} fill={PAL.waterLight} sw={LINE.fine} seed={62 + i} o={0.85} />)}
    <Poly pts={[[L - 12, TOP - 16], [R + 12, TOP - 16], [R + 20, TOP + 2], [L - 20, TOP + 2]]} fill={PAL.wood} seed={65} />
    {/* plates, edge-on, one per seat */}
    {SEAT_X.map((x, i) => (
      <g key={x}>
        <ellipse cx={x + 20 * (i < 2 ? 1 : -1)} cy={TOP - 8} rx={46} ry={6} fill="#FFFFFF" stroke={INK} strokeWidth={LINE.far} />
        {food && <path d={blob(x + 20 * (i < 2 ? 1 : -1), TOP - 16, 24, 9, 70 + i, 7)} fill={i % 2 ? PAL.rose : PAL.paperShade} stroke={INK} strokeWidth={LINE.far} />}
      </g>
    ))}
    {/* tablecloth hanging over the front */}
    <Poly pts={[[L - 20, TOP + 2], [R + 20, TOP + 2], [R + 26, 726], [L - 26, 726]]} fill={PAL.paper} seed={66} />
    <path d={`M${L - 22} 712 H${R + 22}`} stroke={PAL.focus} strokeWidth={LINE.normal} opacity={0.5} />
  </g>
);
