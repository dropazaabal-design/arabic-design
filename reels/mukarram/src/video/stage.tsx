import React from 'react';
import { AbsoluteFill } from 'remotion';
import { PAL } from '../characters/ink';
import { FPS } from './time';

export const W = 1080;
export const H = 1920;
// Reels/Shorts UI: keep words and faces clear of the top bar, the right-hand buttons and the bottom
// caption/handle band. Key action lives between SAFE.top and SAFE.bottom.
export const SAFE = { top: 250, bottom: 1560, right: 900, x: 72 };

/** Doodle line boil (from reels/save-advice/src/motion.tsx): the displacement pattern changes 8×/s. */
export const Boil: React.FC<{ t: number; id?: string; scale?: number }> = ({ t, id = 'boil', scale = 2.4 }) => (
  <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={1} seed={2 + (Math.floor(t * 8) % 3)} result="n" />
    <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
  </filter>
);

/** Paper grain and a soft vignette over the whole frame (from reels/save-advice/src/art/doodles.tsx). */
const Grain: React.FC = () => (
  <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    <defs>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} /><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.28  0 0 0 0 0.25  0 0 0 0.07 0" /></filter>
      <radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="65%" stopColor="#000" stopOpacity={0} /><stop offset="100%" stopColor="#000" stopOpacity={0.12} /></radialGradient>
    </defs>
    <rect width={W} height={H} filter="url(#grain)" />
    <rect width={W} height={H} fill="url(#vig)" />
  </svg>
);

export type Cam = { cx: number; cy: number; zoom: number; rot?: number; shake?: number };
export type Bounds = [number, number, number, number];

/** Keep the visible window inside the drawn world (no empty edges), whatever the zoom and centre. */
export const clampCam = (c: Cam, b: Bounds): Cam => {
  const hw = W / 2 / c.zoom, hh = H / 2 / c.zoom;
  const fit = (v: number, lo: number, hi: number, half: number) => (hi - lo <= half * 2 ? (lo + hi) / 2 : Math.max(lo + half, Math.min(hi - half, v)));
  return { ...c, cx: fit(c.cx, b[0], b[2], hw), cy: fit(c.cy, b[1], b[3], hh) };
};

/** One shot: paper background, the world under a camera (separate from the characters' own motion),
 *  the line boil, grain on top, then any HTML overlay (titles). */
export const Shot: React.FC<{ f: number; cam: Cam; bounds?: Bounds; bg?: string; children: React.ReactNode; overlay?: React.ReactNode }> = ({ f, cam, bounds = [-200, -200, W + 200, H + 200], bg = PAL.paper, children, overlay }) => {
  const c = clampCam(cam, bounds);
  const sh = c.shake ?? 0;
  const jx = sh ? Math.sin(f * 2.3) * sh : 0, jy = sh ? Math.cos(f * 1.7) * sh : 0;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        <defs><Boil t={f / FPS} /></defs>
        <g transform={`translate(${W / 2 + jx} ${H / 2 + jy}) rotate(${c.rot ?? 0}) scale(${c.zoom}) translate(${-c.cx} ${-c.cy})`}>
          <g filter="url(#boil)">{children}</g>
        </g>
      </svg>
      <Grain />
      {overlay}
    </AbsoluteFill>
  );
};
