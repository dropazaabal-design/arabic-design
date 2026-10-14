import React from 'react';
import { INK, LINE, stroke, wobEllipse, wobRect } from '@mukarram/characters/ink';

// This reel's own palette: a dusk-blue study that warms to lamp-yellow when the idea lands (Scene.tsx mixes them).
export const C = {
  wallDusk: '#2F4A66',
  wallWarm: '#E9B872',
  wallLineDusk: '#3C5C7C',
  wallLineWarm: '#F2C98D',
  floor: '#8A5A3C',
  floorLine: '#6E4630',
  desk: '#D98E4A',
  deskDeep: '#B06A2E',
  sky: '#F4A36B',
  skyHigh: '#7E8FC4',
  paper: '#FFF8EA',
  paperFold: '#E9DCC2',
  idea: '#FFC845',
  ideaDeep: '#F29E1F',
  shirt: '#5FB3A1',
  hair: '#2A2230',
  text: '#FFF8EA',
};

export const mixHex = (a: string, b: string, p: number) => {
  const n = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * Math.max(0, Math.min(1, p))).toString(16).padStart(2, '0')).join('');
};

/** Back wall, floor, skirting, a framed doodle; `warm` 0..1 shifts dusk → lamp light. */
export const Room: React.FC<{ warm: number }> = ({ warm }) => (
  <g>
    <rect x={-700} y={-600} width={2500} height={2150} fill={mixHex(C.wallDusk, C.wallWarm, warm)} />
    {Array.from({ length: 14 }, (_, i) => (
      <path key={i} d={`M${-600 + i * 170} -600 L${-600 + i * 170} 1550`} {...stroke(10, mixHex(C.wallLineDusk, C.wallLineWarm, warm))} opacity={0.5} />
    ))}
    <rect x={-700} y={1530} width={2500} height={1000} fill={C.floor} />
    <path d={`M-700 1530 L1800 1530`} {...stroke(LINE * 1.4)} />
    {[1640, 1800, 2000].map((y, i) => <path key={i} d={`M-700 ${y} L1800 ${y}`} {...stroke(6, C.floorLine)} opacity={0.6} />)}
    {/* a small framed doodle on the wall (left) */}
    <path d={wobRect(-40, 560, 200, 160, 10, 3)} fill={C.paper} {...stroke(LINE)} />
    <path d="M-10 690 L40 620 L80 670 L110 640 L140 690" fill="none" {...stroke(LINE * 0.8, C.deskDeep)} />
  </g>
);

/** The window with a dusk sky, its sill (the bird stands on it at y = 830). */
export const Window: React.FC<{ warm: number }> = ({ warm }) => (
  <g>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.skyHigh} />
        <stop offset="1" stopColor={mixHex(C.sky, '#FFD9A0', warm)} />
      </linearGradient>
    </defs>
    <path d={wobRect(690, 360, 340, 470, 12, 7)} fill="url(#sky)" {...stroke(LINE * 1.2)} />
    <circle cx={950} cy={460} r={34} fill="#FFF1C9" opacity={0.85} />
    <path d="M860 360 L860 830 M690 590 L1030 590" {...stroke(LINE)} />
    <path d={wobRect(660, 826, 400, 34, 8, 12)} fill={C.paper} {...stroke(LINE)} />
  </g>
);

/** The desk (drawn over the character's legs). */
export const Desk: React.FC = () => (
  <g>
    <path d={wobRect(250, 1290, 640, 44, 10, 21)} fill={C.desk} {...stroke(LINE)} />
    <path d="M300 1334 L300 1530 M840 1334 L840 1530" {...stroke(LINE * 2.2)} />
    <path d={wobRect(290, 1334, 560, 70, 6, 22)} fill={C.deskDeep} {...stroke(LINE)} />
  </g>
);

/** The desk lamp (drawn behind the character and what he holds); `glow` 0..1 when the room warms. */
export const Lamp: React.FC<{ glow: number }> = ({ glow }) => (
  <g>
    <ellipse cx={790} cy={1286} rx={52} ry={12} fill={INK} />
    <path d="M790 1282 L760 1150 L820 1080" fill="none" {...stroke(LINE * 1.3)} />
    <path d="M780 1060 L870 1050 L860 1120 Z" fill={C.idea} {...stroke(LINE)} />
    <ellipse cx={838} cy={1150} rx={70 + 30 * glow} ry={26 + 10 * glow} fill={C.idea} opacity={0.18 + 0.25 * glow} />
  </g>
);

/** The sheet: flat paper (p = 0) → paper plane (p = 1), in its own space (nose at +x). Paths from paths.morph. */
export const SHEET = 'M-70 -48 L70 -48 L70 48 L-70 48 Z';
export const PLANE = 'M78 0 L-62 -36 L-30 -2 L-62 30 Z';
export const PLANE_FOLD = 'M78 0 L-30 -2';

/** Hair for the thinker (in head space; curls on top). */
export const Curls: React.FC<{ rx: number; ry: number }> = ({ rx, ry }) => (
  <g>
    {[-0.75, -0.4, 0, 0.4, 0.75].map((k, i) => (
      <path key={i} d={wobEllipse(k * rx * 0.95, -ry * (0.78 - Math.abs(k) * 0.28), rx * 0.34, ry * 0.3, 60 + i, 0.06, 9)} fill={C.hair} {...stroke(LINE * 0.7)} />
    ))}
  </g>
);

/** The lightbulb drawn on the paper (paper space, centred), as separate strokes for DrawPath. */
export const BULB = [
  'M0 -34 C-26 -34 -38 -14 -34 4 C-31 16 -18 22 -16 34 L16 34 C18 22 31 16 34 4 C38 -14 26 -34 0 -34',
  'M-14 42 L14 42 M-11 50 L11 50',
  'M-8 34 L-8 10 Q0 0 8 10 L8 34',
];
export const RAYS = 'M-50 -44 L-60 -54 M0 -50 L0 -64 M50 -44 L60 -54 M-56 2 L-70 2 M56 2 L70 2';
/** The thought cloud's outline and the scribbled question mark inside it (world space, above the head). */
export const CLOUD = 'M300 840 C260 840 250 790 290 776 C280 730 340 712 366 740 C384 700 450 702 462 744 C500 724 548 756 528 796 C560 812 540 860 500 852 C484 884 420 884 404 858 C380 884 316 880 300 840';
export const QMARK = 'M394 770 C396 748 440 748 440 772 C440 790 416 790 416 810 M416 832 L416 834';
