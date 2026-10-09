import React from 'react';
import { C } from './theme';

/** Draw a path on: pathLength 1, dash offset from 1 to 0. */
export const draw = (p: number) => ({ pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - Math.max(0, Math.min(1, p)) });

export const STROKE = { stroke: C.ink, strokeWidth: 6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

/** Doodle line wobble: a light displacement whose pattern changes 8 times a second, whatever the fps. */
export const Boil: React.FC<{ t: number; id?: string; scale?: number }> = ({ t, id = 'boil', scale = 2.2 }) => (
  <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={1} seed={2 + (Math.floor(t * 8) % 3)} result="n" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
  </filter>
);
