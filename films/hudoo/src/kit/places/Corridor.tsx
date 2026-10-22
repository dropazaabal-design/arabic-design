import React from 'react';
import { INK, LINE, PAL } from '../style';
import { BASE, Door, Ghost, Glow, Rect, Room } from './parts';

// Office corridor, flat side view: glass meeting rooms with faint people inside, doors between them.
// pan 0→1 scrolls the wall 1400 px (people walk at y 860).
const MOD = 860; // one glass room + one door
const GT = 210; // glass top

const GlassRoom: React.FC<{ x: number; k: number }> = ({ x, k }) => {
  const w = 600, people = k % 2 ? [[x + 150, 1], [x + 300, 1.05], [x + 450, 0.95]] : [[x + 200, 1], [x + 420, 1.05]];
  return (
    <g>
      <rect x={x} y={GT} width={w} height={BASE - GT} fill="#C9D3DF" />
      <rect x={x} y={BASE - 70} width={w} height={70} fill={PAL.floorBlue} opacity={0.6} />
      {people.map(([px, s], i) => <Ghost key={i} x={px} y={700} s={s} o={0.26} c={PAL.chair} />)}
      <rect x={x + 60} y={690} width={w - 120} height={18} fill={PAL.tableEdge} opacity={0.5} />
      <rect x={x} y={GT} width={w} height={BASE - GT} fill={PAL.focusLight} opacity={0.35} />
      <path d={`M${x + 70} ${BASE} L${x + 230} ${GT} L${x + 280} ${GT} L${x + 120} ${BASE} Z M${x + 330} ${BASE} L${x + 490} ${GT} L${x + 510} ${GT} L${x + 350} ${BASE} Z`} fill="#FFFFFF" opacity={0.18} />
      <rect x={x} y={500} width={w} height={20} fill="#FFFFFF" opacity={0.45} />
      {[1, 2].map((i) => <Rect key={i} x={x + i * 200 - 4} y={GT} w={8} h={BASE - GT} fill={PAL.metal} sw={LINE.far} seed={k * 10 + i} />)}
      <Rect x={x} y={GT - 14} w={w} h={BASE - GT + 14} sw={LINE.normal} seed={k * 10 + 5} />
      <Rect x={x - 6} y={GT - 18} w={w + 12} h={16} fill={PAL.metal} sw={LINE.fine} seed={k * 10 + 6} />
    </g>
  );
};

export const Corridor: React.FC<{ pan?: number }> = ({ pan = 0 }) => {
  const off = pan * 1400;
  return (
    <g>
      <Room wall={PAL.wallGrey} floor={PAL.floorBlue} seed={6} />
      <g transform={`translate(${(-off).toFixed(1)} 0)`}>
        {[0, 1, 2, 3].map((k) => {
          const x = 80 + k * MOD;
          return (
            <g key={k}>
              <GlassRoom x={x} k={k} />
              <Door x={x + 640} w={170} top={300} leaf={PAL.wood} beyond={PAL.wallNight} glass seed={100 + k} />
              <Rect x={x + 660} y={250} w={60} h={22} fill={PAL.paperShade} sw={LINE.far} seed={110 + k} />
            </g>
          );
        })}
      </g>
      {/* ceiling with light panels (they scroll with the wall) */}
      <rect width={1920} height={70} fill={PAL.paperShade} />
      <path d="M0 70 H1920" stroke={INK} strokeWidth={LINE.fine} />
      <g transform={`translate(${(-(off % 430)).toFixed(1)} 0)`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <Glow x={200 + i * 430} y={90} r={160} ry={60} o={0.7} />
            <Rect x={140 + i * 430} y={60} w={120} h={12} fill="#FFFFFF" sw={LINE.far} seed={120 + i} />
          </g>
        ))}
      </g>
    </g>
  );
};
