import React from 'react';
import { INK, LINE, PAL } from '../style';
import { BASE, Glow, LIGHT, NIGHT, NightSky, Poly, Rect, Room, Window, blob } from './parts';

// The hero's bedroom. lamp 0..1 lights the bedside lamp; night darkens the room and puts the moon in the window.
export const BEDROOM = {
  /** Sitting on the bed edge at scale 1.45: Character x, hip y (feet at 860). */
  bedSeat: { x: 930, y: 698 },
  /** Centre of the nightstand's top (things placed on it stand at this y). */
  nightstand: { x: 540, y: 690 },
};

const NS = { x: 470, w: 140, top: 690 };
const BED = { x0: 650, x1: 1560, mat: 706 };

const Wardrobe: React.FC = () => (
  <g>
    <Rect x={110} y={250} w={270} h={BASE - 246} fill={PAL.wood} seed={11} />
    <Rect x={124} y={266} w={118} h={BASE - 290} fill={PAL.wood} sw={LINE.fine} seed={12} />
    <Rect x={248} y={266} w={118} h={BASE - 290} fill={PAL.wood} sw={LINE.fine} seed={13} />
    <Rect x={228} y={520} w={8} h={50} fill={PAL.woodDark} sw={LINE.far} seed={14} />
    <Rect x={254} y={520} w={8} h={50} fill={PAL.woodDark} sw={LINE.far} seed={15} />
  </g>
);

export const Bedroom: React.FC<{ lamp?: number; night?: boolean }> = ({ lamp = 0, night = false }) => {
  const { x0, x1, mat } = BED;
  return (
    <g>
      <Room wall={PAL.wallBlue} floor={PAL.floor} seed={5} />
      <Wardrobe />
      <Window x={1090} y={180} w={330} h={300} id="pl-bed-win" sky={night ? PAL.skyNight : PAL.sky} seed={21}>
        {night ? <NightSky x={1090} y={180} w={330} h={300} moon={[1330, 260]} seed={6} /> : <path d={blob(1250, 470, 240, 60, 7, 10)} fill={PAL.wallSage} />}
      </Window>
      {/* bed, side view: headboard left, mattress, duvet falling over the edge, footboard */}
      <ellipse cx={(x0 + x1) / 2} cy={BASE + 12} rx={(x1 - x0) / 2 + 10} ry={12} fill={INK} opacity={0.1} />
      <Rect x={x0 - 10} y={470} w={48} h={BASE - 466} fill={PAL.woodDark} seed={31} />
      <Rect x={x1 - 34} y={630} w={40} h={BASE - 626} fill={PAL.woodDark} seed={32} />
      <Rect x={x0 + 30} y={mat + 52} w={x1 - x0 - 60} h={40} fill={PAL.wood} seed={33} />
      {[x0 + 50, x1 - 70].map((lx, i) => <Rect key={i} x={lx} y={mat + 92} w={18} h={BASE - mat - 88} fill={PAL.woodDark} sw={LINE.fine} seed={34 + i} />)}
      <Rect x={x0 + 34} y={mat} w={x1 - x0 - 68} h={54} fill={PAL.paper} seed={36} />
      <path d={blob(x0 + 120, mat - 22, 84, 30, 37, 9)} fill={PAL.paper} stroke={INK} strokeWidth={LINE.normal} />
      <Poly pts={[[x0 + 250, mat - 6], [x1 - 36, mat - 10], [x1 - 34, mat + 78], [x0 + 236, mat + 84], [x0 + 228, mat + 30]]} fill="#B3BFD6" seed={38} />
      <path d={`M${x0 + 300} ${mat + 40} Q${x0 + 600} ${mat + 20} ${x1 - 60} ${mat + 44}`} fill="none" stroke={INK} strokeWidth={LINE.far} opacity={0.3} />
      {/* nightstand, lamp, notebook and pen */}
      <Rect x={NS.x} y={NS.top} w={NS.w} h={BASE - NS.top + 4} fill={PAL.wood} seed={41} />
      <Rect x={NS.x + 12} y={NS.top + 24} w={NS.w - 24} h={44} fill={PAL.wood} sw={LINE.fine} seed={42} />
      <circle cx={NS.x + NS.w / 2} cy={NS.top + 46} r={5} fill={PAL.woodDark} stroke={INK} strokeWidth={LINE.far} />
      <Rect x={NS.x - 6} y={NS.top - 8} w={NS.w + 12} h={14} fill={PAL.woodDark} sw={LINE.fine} seed={43} />
      <Poly pts={[[NS.x + 22, NS.top - 8], [NS.x + 58, NS.top - 8], [NS.x + 50, NS.top - 34], [NS.x + 30, NS.top - 34]]} fill={PAL.storm} sw={LINE.fine} seed={44} />
      <Rect x={NS.x + 37} y={NS.top - 96} w={6} h={64} fill={INK} sw={0} seed={45} />
      <Poly pts={[[NS.x - 6, NS.top - 88], [NS.x + 86, NS.top - 88], [NS.x + 68, NS.top - 150], [NS.x + 12, NS.top - 150]]} fill={lamp > 0.05 ? LIGHT : PAL.wallLav} seed={46} />
      <Rect x={NS.x + 76} y={NS.top - 20} w={56} h={12} fill={PAL.plum} sw={LINE.fine} seed={47} />
      <path d={`M${NS.x + 82} ${NS.top - 24} L${NS.x + 128} ${NS.top - 30}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d={`M${NS.x + 82} ${NS.top - 24} L${NS.x + 128} ${NS.top - 30}`} stroke={PAL.focus} strokeWidth={3} strokeLinecap="round" />
      {night && <rect width={1920} height={1080} fill={NIGHT} opacity={0.4 - lamp * 0.1} />}
      <Glow x={NS.x + 40} y={NS.top - 110} r={360} ry={300} color="#E7E6F4" o={lamp * (night ? 0.6 : 0.3)} />
      <Glow x={NS.x + 40} y={NS.top - 118} r={70} o={lamp} />
    </g>
  );
};
