import React from 'react';
import { INK, LINE, PAL } from '../style';
import { BASE, Ghost, LIT, Plant, Poly, Rect, Room, Window, city } from './parts';

// A work desk in an open office, side view: the character sits at DESK.seat facing right (+1), the monitor faces us.
// DeskBack holds the room, chair, monitor and keyboard (a pointing or typing hand passes in front of them);
// DeskFront holds the desk slab, legs, notes and mug. Pass `screen` to DeskBack (hands in front of it) or to
// DeskFront (screen drawn over everything); it is clipped to DESK.screen.
export const DESK = {
  screen: { x: 1060, y: 360, w: 440, h: 248 },
  /** Seated at scale 1.45, facing +1: Character x, hip y (feet at 860). */
  seat: { x: 700, y: 698 },
  deskTop: 646,
};
const S = DESK.screen, TOP = DESK.deskTop;

const Screen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <g>
    <clipPath id="pl-desk-screen"><rect x={S.x} y={S.y} width={S.w} height={S.h} /></clipPath>
    <g clipPath="url(#pl-desk-screen)">{children}</g>
  </g>
);

/** Default screen: a calm desktop of abstract blocks. */
const Idle: React.FC = () => (
  <g>
    <rect x={S.x} y={S.y} width={S.w} height={S.h} fill={PAL.screenGlow} />
    <rect x={S.x} y={S.y} width={S.w} height={26} fill={PAL.focus} opacity={0.5} />
    <Rect x={S.x + 30} y={S.y + 50} w={230} h={150} fill="#FFFFFF" sw={LINE.far} seed={7} />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M${S.x + 50} ${S.y + 80 + i * 28} h${150 - i * 24}`} stroke={PAL.textSoft} strokeWidth={6} strokeLinecap="round" opacity={0.5} />)}
    <Rect x={S.x + 290} y={S.y + 50} w={120} h={70} fill={PAL.calmLight} sw={LINE.far} seed={8} />
    <Rect x={S.x + 290} y={S.y + 132} w={120} h={68} fill={PAL.focusLight} sw={LINE.far} seed={9} />
  </g>
);

const win = { x: 120, y: 150, w: 420, h: 380 };
const view = city({ x0: win.x - 20, x1: win.x + win.w + 20, base: win.y + win.h + 10, seed: 41, h: [120, 320], w: [60, 120], lit: 0.15 });

export const DeskBack: React.FC<{ screen?: React.ReactNode }> = ({ screen }) => (
  <g>
    <Room wall={PAL.wallGrey} floor={PAL.floorBlue} seed={3} />
    <Window {...win} id="pl-desk-win" sky={PAL.sky} cols={2} seed={11}>
      <path d={view.bodies} fill="#B6BED0" stroke={PAL.textSoft} strokeWidth={LINE.far} strokeOpacity={0.4} />
      <path d={view.lights} fill={LIT} />
    </Window>
    {/* wall shelf with binders */}
    <Rect x={1170} y={250} w={460} h={12} fill={PAL.wood} sw={LINE.fine} seed={21} />
    {[PAL.focus, PAL.chair, PAL.calm, PAL.focusLight, PAL.storm].map((c, i) => <Rect key={c} x={1190 + i * 40} y={160} w={34} h={90} fill={c} sw={LINE.fine} seed={22 + i} />)}
    <Plant x={1540} y={250} s={0.4} seed={27} pot={PAL.paper} n={7} />
    {/* low partition behind the desk, a colleague's head beyond it */}
    <Ghost x={1700} y={600} s={1.2} o={0.22} />
    <Rect x={880} y={540} w={860} h={BASE - 536} fill={PAL.focusLight} seed={31} />
    <Rect x={872} y={530} w={876} h={14} fill={PAL.metal} sw={LINE.fine} seed={32} />
    <Plant x={1830} y={BASE + 6} s={1} seed={33} pot={PAL.wallLav} />
    {/* chair: back behind the sitter, seat under the hips, column and base */}
    <Poly pts={[[600, 690], [596, 560], [610, 520], [640, 520], [652, 560], [648, 690]]} fill={PAL.chair} seed={41} />
    <Rect x={620} y={708} w={150} h={22} fill={PAL.chair} seed={42} />
    <Rect x={686} y={730} w={18} h={96} fill={PAL.chairDark} sw={LINE.fine} seed={43} />
    <Poly pts={[[630, 846], [695, 824], [760, 846]]} open stroke={PAL.chairDark} sw={10} seed={44} />
    <circle cx={630} cy={850} r={8} fill={INK} /><circle cx={760} cy={850} r={8} fill={INK} />
    {/* monitor and keyboard */}
    <Rect x={1268} y={S.y + S.h + 10} w={24} h={TOP - S.y - S.h - 14} fill={PAL.metal} sw={LINE.fine} seed={51} />
    <Poly pts={[[1210, TOP - 2], [1350, TOP - 2], [1336, TOP - 14], [1224, TOP - 14]]} fill={PAL.metal} sw={LINE.fine} seed={52} />
    <Rect x={S.x - 14} y={S.y - 14} w={S.w + 28} h={S.h + 28} fill={PAL.screen} seed={53} />
    <Screen>{screen ?? <Idle />}</Screen>
    <Poly pts={[[850, TOP - 2], [990, TOP - 2], [984, TOP - 12], [858, TOP - 12]]} fill={PAL.paperShade} sw={LINE.fine} seed={54} />
  </g>
);

export const DeskFront: React.FC<{ screen?: React.ReactNode; mug?: boolean }> = ({ screen, mug = true }) => (
  <g>
    {screen && <Screen>{screen}</Screen>}
    <Rect x={S.x + S.w - 30} y={S.y + S.h - 50} w={48} h={48} fill={PAL.calmLight} sw={LINE.far} seed={61} />
    <Rect x={S.x + S.w - 2} y={S.y + S.h - 80} w={40} h={40} fill={PAL.provokeLight} sw={LINE.far} seed={62} />
    {mug && <g>
      <path d={`M1036 ${TOP - 36} q16 2 14 14 q-2 10 -14 10`} fill="none" stroke={INK} strokeWidth={LINE.fine} />
      <Rect x={1008} y={TOP - 46} w={30} h={42} fill={PAL.focusLight} sw={LINE.fine} seed={63} />
    </g>}
    {/* papers on the desk */}
    {[0, 1, 2].map((i) => <Poly key={i} pts={[[1520 - i * 4, TOP - 2 - i * 5], [1620 - i * 4, TOP - 2 - i * 5], [1612, TOP - 8 - i * 5], [1530, TOP - 8 - i * 5]]} fill="#FFFFFF" sw={LINE.far} seed={64 + i} />)}
    <ellipse cx={1200} cy={862} rx={420} ry={12} fill={INK} opacity={0.08} />
    {/* drawer pedestal, legs and the slab */}
    <Rect x={1440} y={TOP + 22} w={170} h={BASE + 30 - TOP - 22} fill={PAL.paperShade} seed={71} />
    {[TOP + 40, TOP + 110].map((y, i) => <Rect key={y} x={1452} y={y} w={146} h={60} fill={PAL.paperShade} sw={LINE.fine} seed={72 + i} />)}
    {[0, 1].map((i) => <Rect key={i} x={1500} y={TOP + 66 + i * 70} w={50} h={8} fill={PAL.metal} sw={LINE.far} seed={74 + i} />)}
    <Rect x={930} y={TOP + 22} w={18} h={BASE + 30 - TOP - 22} fill={PAL.metal} sw={LINE.fine} seed={76} />
    <Rect x={810} y={TOP} w={820} h={22} fill={PAL.paperShade} seed={77} />
  </g>
);
