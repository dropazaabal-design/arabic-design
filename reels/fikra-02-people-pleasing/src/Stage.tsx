import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Grain } from './art/doodles';
import { Boil } from './motion';
import { C, H, W } from './theme';
import { FPS } from './time';

/** One scene's canvas: background, a doodle SVG layer (with the light line boil), then HTML text on top. */
export const Stage: React.FC<{ f: number; dark?: boolean; svg: React.ReactNode; children?: React.ReactNode }> = ({ f, dark = false, svg, children }) => (
  <AbsoluteFill style={{ background: dark ? C.navy : C.light }}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <Boil t={f / FPS} />
        <filter id="lift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx={0} dy={8} stdDeviation={7} floodColor="#000" floodOpacity={dark ? 0.45 : 0.16} /></filter>
      </defs>
      <g filter="url(#boil)">{svg}</g>
    </svg>
    <Grain dark={dark} />
    {children}
  </AbsoluteFill>
);

/** A paper card for objects in dark scenes (editorial collage). */
export const Paper: React.FC<{ x: number; y: number; w: number; h: number; o?: number; rot?: number; fill?: string }> = ({ x, y, w, h, o = 1, rot = 0, fill = C.paper }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o} filter="url(#lift)">
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill={fill} />
  </g>
);
