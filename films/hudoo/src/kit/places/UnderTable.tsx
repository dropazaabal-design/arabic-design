import React from 'react';
import { INK, LINE, PAL, sketch } from '../style';
import { Poly, Rect } from './parts';

// Insert under the meeting table: the dark underside across the top, two legs, chair seats and knees at the edges.
// The centre stays clear for the big hand gripping the pen (drawn separately).
const SHADE = '#8E99AB', SHADE_DEEP = '#6F7A8E', UNDER = '#3E4757';

/**
 * A seated leg from under the table, drawn like the characters' limbs (a colour tube over an ink tube):
 * the thigh comes in from the frame edge on a chair seat, bends at the knee, the shin drops to a shoe. dir = 1 from the left.
 */
const Leg: React.FC<{ x: number; y: number; dir: 1 | -1; pants: string; seed: number }> = ({ x, y, dir, pants, seed }) => {
  const k = (dx: number) => x + dx * dir;
  const d = sketch([[k(-320), y], [k(0), y + 4], [k(24), y + 330]], seed, 2);
  return (
    <g>
      {/* chair: seat cushion under the thigh, gas column, star base */}
      <Rect x={Math.min(k(-300), k(-60))} y={y + 44} w={240} h={40} fill={PAL.chair} seed={seed + 3} />
      <Rect x={k(-190) - 13} y={y + 84} w={26} h={300} fill={PAL.chairDark} sw={LINE.fine} seed={seed + 4} />
      <Poly pts={[[k(-300), y + 400], [k(-190), y + 376], [k(-80), y + 400]]} open stroke={PAL.chairDark} sw={12} seed={seed + 5} />
      <path d={d} fill="none" stroke={INK} strokeWidth={92} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={pants} strokeWidth={82} strokeLinecap="round" strokeLinejoin="round" />
      <Poly pts={[[k(-14), y + 356], [k(96), y + 352], [k(122), y + 392], [k(-20), y + 396]]} fill="#22262E" sw={LINE.fine} seed={seed + 2} />
    </g>
  );
};

export const UnderTable: React.FC = () => (
  <g>
    <linearGradient id="pl-under-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={SHADE_DEEP} /><stop offset="0.75" stopColor={SHADE} /><stop offset="1" stopColor={PAL.floorBlue} /></linearGradient>
    <rect width={1920} height={1080} fill="url(#pl-under-bg)" />
    {/* the floor far under the table, and a strip of light from the room beyond */}
    <rect y={900} width={1920} height={180} fill={PAL.floorBlue} opacity={0.75} />
    <path d={sketch([[0, 900], [1920, 900]], 3, 2)} stroke={INK} strokeWidth={LINE.far} opacity={0.25} fill="none" />
    {/* chairs and knees at the edges */}
    <Leg x={170} y={430} dir={1} pants="#2E3E52" seed={13} />
    <Leg x={1750} y={450} dir={-1} pants="#3A3138" seed={23} />
    {/* two table legs */}
    <Rect x={392} y={150} w={46} h={790} fill={PAL.chairDark} seed={31} />
    <Rect x={370} y={930} w={90} h={18} fill={PAL.chairDark} sw={LINE.fine} seed={32} />
    <Rect x={1484} y={150} w={46} h={790} fill={PAL.chairDark} seed={33} />
    <Rect x={1462} y={930} w={90} h={18} fill={PAL.chairDark} sw={LINE.fine} seed={34} />
    {/* the underside of the top, a cross rail and its shadow */}
    <rect y={160} width={1920} height={70} fill={INK} opacity={0.18} />
    <Rect x={-20} y={-20} w={1960} h={180} fill={UNDER} seed={41} />
    <Rect x={180} y={150} w={1560} h={26} fill="#4A5465" sw={LINE.fine} seed={42} />
    <path d={sketch([[0, 60], [1920, 60]], 43, 2)} stroke="#FFFFFF" strokeWidth={LINE.far} opacity={0.08} fill="none" />
    <path d={sketch([[0, 110], [1920, 110]], 44, 2)} stroke="#FFFFFF" strokeWidth={LINE.far} opacity={0.08} fill="none" />
  </g>
);
