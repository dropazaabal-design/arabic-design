import React from 'react';
import { INK, PAL } from '../style';
import { clamp01 } from './ui';

/**
 * A ballpoint pen lying along +x: grip point (where the fingers hold it) at 0,0, writing tip toward +x (x≈+15),
 * clicker end toward −x (x≈−31); ~46 px long, ~6 px thick at scale 1. `click` 0..1 presses the plunger and pushes the tip out.
 */
export const Pen = ({ click = 0, color = PAL.focus }: { click?: number; color?: string }) => {
  const k = clamp01(click), lw = 1.5;
  return (
    <g strokeLinejoin="round">
      <rect x={-36 + 3 * k} y={-1.8} width={7} height={3.6} rx={1.5} fill={PAL.metal} stroke={INK} strokeWidth={lw} />
      <path d="M-31 -3.2 H5 Q8 -3.2 9.5 -2 L12.5 -0.9 V0.9 L9.5 2 Q8 3.2 5 3.2 H-31 Q-32.6 3.2 -32.6 0 Q-32.6 -3.2 -31 -3.2 Z" fill={color} stroke={INK} strokeWidth={lw} />
      <path d="M-4 -3.2 V3.2 M-1.5 -3.2 V3.2 M1 -3.2 V3.2" stroke={INK} strokeWidth={0.9} opacity={0.45} />
      <path d="M-30 -3.2 V-5.6 H-13 Q-11 -5.6 -11 -4.2" fill="none" stroke={INK} strokeWidth={lw} strokeLinecap="round" />
      <path d="M-29 -1.6 H-14" stroke="#FFFFFF" strokeWidth={1} strokeLinecap="round" opacity={0.45} />
      <path d={`M12.5 -0.8 L${14.6 + 1.6 * k} 0 L12.5 0.8 Z`} fill={INK} stroke={INK} strokeWidth={0.8} />
    </g>
  );
};
