import React from 'react';
import { INK } from '../../../motion-core/src/cartoon';
import { C } from './theme';

// Backgrounds, drawn in world units. The 16:9 default framing is x 0…1920, y 0…1080; sets run
// wider so the camera can pan. Ground for the front row is y = 930.

export const GROUND = 930;

export const Sky: React.FC<{ x0?: number; x1?: number; night?: boolean; dim?: number }> = ({ x0 = -800, x1 = 2800, night = false, dim = 0 }) => (
  <g>
    <defs>
      <linearGradient id={night ? 'sky-n' : 'sky-d'} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={night ? '#0B1222' : C.skyTop} />
        <stop offset="0.62" stopColor={night ? '#1B1C3A' : C.skyLow} />
        <stop offset="1" stopColor={night ? '#3A2D52' : C.haze} />
      </linearGradient>
    </defs>
    <rect x={x0} y={-600} width={x1 - x0} height={1500} fill={`url(#${night ? 'sky-n' : 'sky-d'})`} />
    {!night && <circle cx={1500} cy={250} r={120} fill="#F3F7FB" opacity={0.18} />}
    {!night && [[200, 170, 1], [880, 120, 0.8], [1620, 200, 1.1], [2300, 140, 0.9]].map(([x, y, s], k) => (
      <g key={k} transform={`translate(${x} ${y}) scale(${s})`} opacity={0.16} fill="#F4F7FB">
        <ellipse cx={0} cy={0} rx={120} ry={26} /><ellipse cx={-40} cy={-16} rx={60} ry={28} /><ellipse cx={40} cy={-12} rx={50} ry={22} />
      </g>
    ))}
    {night && Array.from({ length: 40 }, (_, k) => <circle key={k} cx={x0 + ((k * 397) % (x1 - x0))} cy={(k * 151) % 520 - 120} r={1.6 + (k % 3)} fill="#E6ECF8" opacity={0.35} />)}
    {dim > 0 && <rect x={x0} y={-600} width={x1 - x0} height={2400} fill={C.night} opacity={dim} />}
  </g>
);

/** Office block with a window grid and a glass entrance. No signage. (x, ground) = bottom-left. */
export const Office: React.FC<{ x: number; w: number; h: number; ground?: number; lit?: number[] }> = ({ x, w, h, ground = 800, lit = [3, 8, 14, 19, 27] }) => {
  const cols = Math.floor((w - 60) / 90), rows = Math.floor((h - 160) / 96);
  const doorX = x + w / 2 - 90;
  return (
    <g>
      <rect x={x} y={ground - h} width={w} height={h} fill={C.building} stroke={INK} strokeWidth={4} />
      <rect x={x} y={ground - h} width={w} height={22} fill={C.buildingLit} stroke={INK} strokeWidth={4} />
      <rect x={x + w - 26} y={ground - h + 22} width={26} height={h - 22} fill="#000" opacity={0.12} />
      {Array.from({ length: rows * cols }, (_, k) => {
        const r = Math.floor(k / cols), c = k % cols;
        return <rect key={k} x={x + 40 + c * 90} y={ground - h + 50 + r * 96} width={60} height={66} rx={4}
          fill={lit.includes(k) ? C.windowLit : C.window} opacity={lit.includes(k) ? 0.85 : 1} stroke={INK} strokeWidth={3} />;
      })}
      {/* entrance: canopy and glass doors */}
      <rect x={doorX - 30} y={ground - 190} width={240} height={18} rx={4} fill={C.curb} stroke={INK} strokeWidth={3.5} />
      <rect x={doorX} y={ground - 172} width={180} height={172} fill="#2B4E6C" stroke={INK} strokeWidth={4} />
      <path d={`M${doorX + 90} ${ground - 172} L${doorX + 90} ${ground}`} stroke={INK} strokeWidth={4} />
      <path d={`M${doorX + 16} ${ground - 150} L${doorX + 60} ${ground - 150} L${doorX + 24} ${ground - 40}`} stroke="#FFFFFF" strokeWidth={6} opacity={0.2} fill="none" />
    </g>
  );
};

export const Palm: React.FC<{ x: number; y: number; s?: number; sway?: number }> = ({ x, y, s = 1, sway = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-10 0 Q-4 -150 6 -300 L20 -300 Q10 -150 12 0 Z" fill="#6A5F6B" stroke={INK} strokeWidth={4} />
    {[0, 1, 2, 3, 4].map((k) => <path key={k} d={`M-8 ${-40 - k * 52} L14 ${-46 - k * 52}`} stroke={INK} strokeWidth={2.5} opacity={0.45} />)}
    <g transform={`translate(13 -300) rotate(${sway})`}>
      {[-150, -110, -70, -30, 10, 50].map((a, k) => (
        <path key={k} transform={`rotate(${a})`} d="M0 0 Q60 -36 128 -8 Q70 -10 0 6 Z" fill={k % 2 ? '#2E7D72' : '#3B9886'} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      ))}
    </g>
  </g>
);

/** Sidewalk, curb and asphalt with slanted bay lines. */
export const Lot: React.FC<{ x0?: number; x1?: number; bays?: number[] }> = ({ x0 = -800, x1 = 2800, bays = [-260, 330, 920, 1510, 2100] }) => (
  <g>
    <rect x={x0} y={800} width={x1 - x0} height={40} fill={C.sidewalk} />
    <rect x={x0} y={836} width={x1 - x0} height={14} fill={C.curb} stroke={INK} strokeWidth={3} />
    <rect x={x0} y={850} width={x1 - x0} height={600} fill={C.asphalt} />
    {bays.map((bx) => <path key={bx} d={`M${bx} 860 L${bx - 70} 1080`} stroke={C.asphaltLine} strokeWidth={8} opacity={0.4} />)}
  </g>
);

/** The whole office car park, morning. */
export const ParkingSet: React.FC<{ dim?: number; sway?: number }> = ({ dim = 0, sway = 0 }) => (
  <g>
    <Sky dim={dim * 0.6} />
    <Office x={-700} w={760} h={560} lit={[1, 6, 9]} />
    <Office x={720} w={980} h={640} />
    <Office x={2000} w={700} h={520} lit={[2, 5]} />
    <Palm x={160} y={812} s={0.95} sway={sway} />
    <Palm x={1830} y={812} s={1.05} sway={-sway} />
    <Lot />
    {dim > 0 && <rect x={-800} y={-600} width={3600} height={2400} fill={C.night} opacity={dim} />}
  </g>
);

/** Hotel entrance at night: columns, canopy with cool lights, a plum carpet. */
export const HotelSet: React.FC<{ glow?: number }> = ({ glow = 1 }) => (
  <g>
    <Sky night />
    <rect x={260} y={170} width={1400} height={700} fill="#1E2342" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 24 }, (_, k) => <rect key={k} x={320 + (k % 12) * 112} y={210 + Math.floor(k / 12) * 110} width={70} height={80} rx={6}
      fill={k % 5 === 1 ? '#C9DDF2' : '#2C3361'} opacity={k % 5 === 1 ? 0.8 : 1} stroke={INK} strokeWidth={3} />)}
    {[460, 760, 1160, 1460].map((cx) => <g key={cx}>
      <rect x={cx - 26} y={480} width={52} height={390} fill="#D8DEEE" stroke={INK} strokeWidth={4} />
      <rect x={cx - 36} y={470} width={72} height={20} fill="#BFC6DA" stroke={INK} strokeWidth={3.5} />
    </g>)}
    <path d="M380 470 L1540 470 L1600 420 L320 420 Z" fill="#3E2E5E" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    {[520, 700, 880, 1040, 1220, 1400].map((lx) => <g key={lx}>
      <circle cx={lx} cy={478} r={9} fill="#F2F7FF" />
      <path d={`M${lx} 486 L${lx - 70} 870 L${lx + 70} 870 Z`} fill="#E8F0FF" opacity={0.06 * glow} />
    </g>)}
    <rect x={820} y={560} width={280} height={310} fill="#2B3966" stroke={INK} strokeWidth={4} />
    <path d="M960 560 L960 870" stroke={INK} strokeWidth={4} />
    <rect x={-800} y={870} width={3600} height={600} fill="#161B30" />
    <path d="M760 870 L1160 870 L1260 1080 L660 1080 Z" fill={C.plum} stroke={INK} strokeWidth={4} />
  </g>
);

/** Office interior: wall, window with a skyline, two desks and the door that will open. */
export const OfficeSet: React.FC<{ door?: number; doorGlow?: number }> = ({ door = 0, doorGlow = 0 }) => (
  <g>
    <rect x={-400} y={-200} width={2800} height={1100} fill="#24384F" />
    <rect x={-400} y={830} width={2800} height={400} fill="#1C2B3D" />
    <rect x={-400} y={822} width={2800} height={14} fill="#33495F" stroke={INK} strokeWidth={3} />
    {/* window */}
    <rect x={160} y={160} width={620} height={420} rx={10} fill="#5E8DB0" stroke={INK} strokeWidth={5} />
    {[[200, 360, 90], [300, 300, 80], [390, 400, 70], [470, 330, 110], [590, 380, 80], [680, 290, 70]].map(([x, top, w], k) => (
      <rect key={k} x={x} y={top} width={w} height={580 - top} fill={k % 2 ? '#3A6487' : '#2E5578'} stroke={INK} strokeWidth={3} />
    ))}
    <path d="M470 160 L470 580 M160 370 L780 370" stroke="#24384F" strokeWidth={14} />
    <rect x={160} y={160} width={620} height={420} rx={10} fill="none" stroke={INK} strokeWidth={5} />
    {/* the door of opportunity */}
    <g transform="translate(1380 830)">
      <rect x={-130} y={-480} width={260} height={480} fill={door > 0 ? '#E3F6F2' : '#2A4560'} stroke={INK} strokeWidth={5} />
      {doorGlow > 0 && <rect x={-130} y={-480} width={260} height={480} fill={C.mint} opacity={0.35 * doorGlow} />}
      {doorGlow > 0 && <path d="M-130 0 L-330 140 L330 140 L130 0 Z" fill={C.mint} opacity={0.16 * doorGlow} />}
      <g transform={`translate(-130 0) scale(${1 - 0.82 * door} 1)`}>
        <rect x={0} y={-480} width={260} height={480} fill="#3B5D7C" stroke={INK} strokeWidth={5} />
        <circle cx={226} cy={-240} r={11} fill="#C6D3E0" stroke={INK} strokeWidth={3} />
      </g>
    </g>
    {/* desks */}
    {[520, 1000].map((dx) => <g key={dx} transform={`translate(${dx} 830)`}>
      <rect x={-170} y={-170} width={340} height={22} rx={6} fill="#4B6684" stroke={INK} strokeWidth={4} />
      <rect x={-150} y={-148} width={18} height={148} fill="#3A526B" stroke={INK} strokeWidth={3.5} />
      <rect x={132} y={-148} width={18} height={148} fill="#3A526B" stroke={INK} strokeWidth={3.5} />
      <rect x={-70} y={-290} width={150} height={100} rx={8} fill="#1A2638" stroke={INK} strokeWidth={4} />
      <rect x={-60} y={-281} width={130} height={80} rx={4} fill="#3F6A8F" />
      <rect x={-6} y={-190} width={22} height={22} fill="#2A3A50" stroke={INK} strokeWidth={3} />
    </g>)}
    <g transform="translate(1720 830)">
      <path d="M-34 0 L-44 -90 L44 -90 L34 0 Z" fill="#4E3468" stroke={INK} strokeWidth={4} />
      {[-40, -10, 20, 45].map((a, k) => <path key={k} transform={`translate(0 -90) rotate(${a})`} d="M0 0 Q-20 -70 0 -130 Q20 -70 0 0 Z" fill={k % 2 ? '#2E7D72' : '#3B9886'} stroke={INK} strokeWidth={3} />)}
    </g>
  </g>
);

/** Abstract stage for diagrams: dark gradient and a faint dot grid. */
export const StageSet: React.FC = () => (
  <g>
    <defs>
      <radialGradient id="stage-g" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0" stopColor={C.stage} />
        <stop offset="1" stopColor={C.stageLow} />
      </radialGradient>
      <pattern id="dots" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx={24} cy={24} r={2.2} fill="#2A4058" /></pattern>
    </defs>
    <rect x={-800} y={-600} width={3600} height={2400} fill="url(#stage-g)" />
    <rect x={-800} y={-600} width={3600} height={2400} fill="url(#dots)" opacity={0.7} />
  </g>
);
