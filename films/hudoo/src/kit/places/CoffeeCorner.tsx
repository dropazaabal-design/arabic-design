import React from 'react';
import { INK, LINE, PAL } from '../style';
import { BASE, Plant, Poly, Rect, Room, Window, city, LIT } from './parts';

// Office pantry for a private talk: two people stand either side of a high table.
export const COFFEE = {
  left: { x: 760 },
  right: { x: 1160 },
  /** Standing feet (scale 1.45) and the high table's top, for hands resting on it. */
  y: 860, tableTop: 628,
};

const CT = 624; // counter top
const win = { x: 1220, y: 160, w: 420, h: 380 };
const view = city({ x0: win.x - 20, x1: win.x + win.w + 20, base: win.y + win.h + 10, seed: 57, h: [100, 300], w: [60, 130], lit: 0.12 });

const Cup: React.FC<{ x: number; y: number; c: string; seed: number }> = ({ x, y, c, seed }) => (
  <g>
    <path d={`M${x + 22} ${y - 22} q12 2 10 10 q-2 8 -10 8`} fill="none" stroke={INK} strokeWidth={LINE.far} />
    <Poly pts={[[x, y - 30], [x + 24, y - 30], [x + 21, y], [x + 3, y]]} fill={c} sw={LINE.fine} seed={seed} />
  </g>
);

export const CoffeeCorner: React.FC = () => (
  <g>
    <Room wall={PAL.wallMint} floor={PAL.floorBlue} seed={4} />
    {/* upper cabinets, splash line, counter */}
    {[0, 1, 2].map((i) => <Rect key={i} x={140 + i * 240} y={170} w={236} h={170} fill={PAL.paper} seed={11 + i} />)}
    {[0, 1, 2].map((i) => <Rect key={i} x={240 + i * 240} y={300} w={36} h={8} fill={PAL.metal} sw={LINE.far} seed={14 + i} />)}
    <Rect x={140} y={CT - 120} w={716} h={120} fill={PAL.calmLight} sw={LINE.far} seed={17} o={0.6} />
    {[0, 1, 2].map((i) => <Rect key={i} x={150 + i * 236} y={CT + 16} w={228} h={BASE - CT - 20} fill={PAL.paper} sw={LINE.fine} seed={18 + i} />)}
    {[0, 1, 2].map((i) => <Rect key={i} x={244 + i * 236} y={CT + 36} w={40} h={8} fill={PAL.metal} sw={LINE.far} seed={21 + i} />)}
    <Rect x={128} y={CT} w={740} h={18} fill="#A9B2BD" seed={24} />
    {/* coffee machine (no brand): body, panel, spout, cup on the tray */}
    <Rect x={220} y={430} w={170} h={CT - 430} fill={PAL.chairDark} seed={31} />
    <Rect x={232} y={400} w={146} h={34} fill={PAL.chair} sw={LINE.fine} seed={32} />
    <Rect x={240} y={452} w={130} h={46} fill={PAL.screen} sw={LINE.fine} seed={33} />
    <rect x={252} y={464} width={60} height={22} rx={3} fill={PAL.screenGlow} opacity={0.8} />
    <circle cx={334} cy={475} r={7} fill={PAL.calmLight} /><circle cx={354} cy={475} r={7} fill={PAL.focusLight} />
    <Rect x={238} y={520} w={134} h={80} fill="#3A4454" sw={LINE.fine} seed={34} />
    <Rect x={290} y={520} w={30} h={20} fill={PAL.metal} sw={LINE.fine} seed={35} />
    <Cup x={293} y={592} c={PAL.paper} seed={36} />
    <Rect x={244} y={594} w={122} h={10} fill={PAL.metal} sw={LINE.fine} seed={37} />
    {/* kettle, stacked cups, a bowl of fruit (no yellow) */}
    <Poly pts={[[450, CT], [520, CT], [514, 560], [500, 548], [470, 548], [456, 560]]} fill={PAL.metal} seed={41} />
    <path d="M456 568 L436 556" stroke={INK} strokeWidth={LINE.normal} strokeLinecap="round" />
    <Rect x={478} y={538} w={14} h={10} fill={INK} sw={0} seed={42} />
    <Cup x={580} y={CT} c={PAL.focusLight} seed={43} />
    <Cup x={583} y={CT - 30} c={PAL.calmLight} seed={44} />
    <Cup x={620} y={CT} c={PAL.provokeLight} seed={45} />
    <circle cx={730} cy={602} r={16} fill={PAL.plant} stroke={INK} strokeWidth={LINE.fine} />
    <circle cx={756} cy={600} r={16} fill={PAL.rose} stroke={INK} strokeWidth={LINE.fine} />
    <path d={`M700 606 Q742 ${CT + 6} 784 606 Z`} fill={PAL.paper} stroke={INK} strokeWidth={LINE.fine} strokeLinejoin="round" />
    <Window {...win} id="pl-coffee-win" sky={PAL.sky} cols={2} seed={51}>
      <path d={view.bodies} fill="#B9C1D2" stroke={PAL.textSoft} strokeWidth={LINE.far} strokeOpacity={0.4} />
      <path d={view.lights} fill={LIT} />
    </Window>
    <Plant x={1790} y={BASE + 6} s={1.15} seed={61} pot={PAL.paper} />
    {/* high table between the two */}
    <ellipse cx={960} cy={860} rx={80} ry={8} fill={INK} opacity={0.1} />
    <Rect x={950} y={COFFEE.tableTop + 14} w={20} h={844 - COFFEE.tableTop - 14} fill={PAL.metal} sw={LINE.fine} seed={71} />
    <Rect x={906} y={842} w={108} h={12} fill={PAL.chairDark} sw={LINE.fine} seed={72} />
    <Rect x={856} y={COFFEE.tableTop} w={208} h={16} fill={PAL.paper} seed={73} />
    <Cup x={930} y={COFFEE.tableTop} c={PAL.paper} seed={74} />
  </g>
);
