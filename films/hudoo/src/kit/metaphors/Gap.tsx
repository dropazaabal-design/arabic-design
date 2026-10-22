import React from 'react';
import { Character } from '../characters/Character';
import { POSES } from '../characters/poses';
import { INK, LINE, PAL, hash } from '../style';
import { Frame, ease, flame, ink, mix, seg, smooth, useUid, type P } from './util';

// The space between feeling and action: two stepping stones on calm water — a flame (what you feel) on the left,
// footprints (what you do) on the right. As `open` grows they move apart and a calm stone rises between them,
// wide enough for سليم to stand on. Stone tops at y = 760; water line y = 640.
// Free for captions: the top band (y < 230) and a label slot over each stone (gapLayout(open).*).
const TOP = 760, WATER = 640;

/** Where things are for a given `open`: centres of the stone tops, and label anchors above each. */
export const gapLayout = (open: number) => {
  const g = mix(165, 640, ease(open));
  const left: P = [960 - g, TOP], right: P = [960 + g, TOP], mid: P = [960, TOP + 10];
  return { left, right, mid, midWidth: mix(0, 420, ease(seg(open, 0.15, 0.9))), labels: { left: [left[0], 470] as P, right: [right[0], 470] as P, mid: [960, 300] as P } };
};

const Stone: React.FC<{ x: number; y: number; rx: number; seed: number; top?: string; side?: string }> = ({ x, y, rx, seed, top = '#B7C0CA', side = '#7E8894' }) => {
  const ry = rx * 0.38, h = 54;
  const lump = (hash(seed) - 0.5) * 8;
  return (
    <g>
      <ellipse cx={x} cy={y + h + 18} rx={rx * 1.08} ry={ry * 0.9} fill={PAL.waterDeep} opacity={0.3} />
      <path d={`M${x - rx} ${y} L${x - rx + 6} ${y + h - 10} Q${x - rx + 20} ${y + h + ry} ${x} ${y + h + ry + lump} Q${x + rx - 20} ${y + h + ry} ${x + rx - 6} ${y + h - 10} L${x + rx} ${y} Z`} fill={side} {...ink(LINE.normal)} />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={top} {...ink(LINE.normal)} />
      <path d={`M${x - rx * 0.6} ${y - ry * 0.35} Q${x - rx * 0.2} ${y - ry * 0.7} ${x + rx * 0.2} ${y - ry * 0.6}`} fill="none" stroke="#D3DAE2" strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

/** A footprint printed on the stone's top face, toes pointing away from us: a step to take. */
const Foot: React.FC<{ x: number; y: number; flip?: boolean; tilt?: number }> = ({ x, y, flip, tilt = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -0.95 : 0.95} 0.6) rotate(${tilt}) translate(0 60)`}>
    <path d="M-4 0 C-26 0 -30 -30 -26 -56 C-22 -86 -26 -104 -6 -112 C16 -118 26 -96 22 -70 C18 -44 22 -24 16 -10 C12 -2 6 0 -4 0 Z" fill={PAL.chair} {...ink(LINE.normal)} />
    {[[-20, -128, 9], [-5, -134, 7], [8, -131, 6.5], [19, -124, 6], [27, -113, 5.5]].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={PAL.chair} {...ink(LINE.fine)} />)}
  </g>
);

export type GapProps = { t: number; open: number };

export const Gap: React.FC<GapProps> = ({ t, open }) => {
  const id = useUid();
  const o = ease(open);
  const { left, right, mid, midWidth } = gapLayout(open);
  const rise = ease(seg(open, 0.15, 0.7));
  const fig = ease(seg(open, 0.66, 0.92));
  return (
    <Frame bg={PAL.sky}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DCE4EF" /><stop offset="1" stopColor="#EEF2F6" /></linearGradient>
        <linearGradient id={`${id}sea`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFDCE6" /><stop offset="1" stopColor="#7FB3C8" /></linearGradient>
        <radialGradient id={`${id}calm`}><stop offset="0" stopColor={PAL.calmLight} stopOpacity="0.95" /><stop offset="1" stopColor={PAL.calmLight} stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={1920} height={WATER} fill={`url(#${id}sky)`} />
      <path d={smooth([[-20, WATER - 60], [300, WATER - 110], [640, WATER - 70], [1000, WATER - 100], [1380, WATER - 60], [1700, WATER - 100], [1940, WATER - 70]]) + ` L1940 ${WATER} L-20 ${WATER} Z`} fill="#B9C9C0" {...ink(LINE.far)} />
      <rect y={WATER} width={1920} height={1080 - WATER} fill={`url(#${id}sea)`} />
      <path d={`M0 ${WATER} L1920 ${WATER}`} {...ink(LINE.far)} />
      {Array.from({ length: 16 }, (_, i) => {
        const y = WATER + 30 + (i % 8) * 50, x = ((hash(i * 3.3) * 1920 + t * (10 + (i % 5) * 4)) % 2000) - 40;
        return <path key={i} d={`M${x} ${y} L${x + 60 + (i % 4) * 30} ${y}`} stroke="#E4EFF4" strokeWidth={4} strokeLinecap="round" opacity={0.8} />;
      })}
      {/* the calm between them */}
      {o > 0.02 && <ellipse cx={960} cy={TOP + 20} rx={180 + midWidth * 0.9} ry={90 + midWidth * 0.2} fill={`url(#${id}calm)`} opacity={o} />}
      {midWidth > 4 && (
        <g transform={`translate(0 ${(1 - rise) * 80})`} opacity={Math.min(1, rise * 2)}>
          <Stone x={mid[0]} y={mid[1]} rx={midWidth / 2} seed={3} top="#D6EBE5" side="#8FB8AC" />
          {[0, 1].map((k) => {
            const u = (t * 0.35 + k / 2) % 1;
            return <ellipse key={k} cx={mid[0]} cy={mid[1] + 70} rx={midWidth / 2 + 30 + u * 120} ry={22 + u * 26} fill="none" stroke="#E9F3F6" strokeWidth={3} opacity={(1 - u) * 0.8 * rise} />;
          })}
        </g>
      )}
      {/* feeling: a stone with a flame */}
      <Stone x={left[0]} y={left[1]} rx={150} seed={1} />
      <g>
        <path d={flame(left[0], left[1] + 6, 110, 170, Math.sin(t * 3) * 10)} fill={PAL.warn} {...ink(LINE.bold)} />
        <path d={flame(left[0], left[1] + 6, 62, 100, Math.sin(t * 3 + 0.8) * 7)} fill="#F1B9CB" />
        <path d={flame(left[0], left[1] + 6, 30, 46, Math.sin(t * 3 + 1.6) * 3)} fill={PAL.flameCore} />
      </g>
      {/* action: a stone with footprints, a step waiting */}
      <Stone x={right[0]} y={right[1]} rx={150} seed={2} />
      <Foot x={right[0] - 44} y={right[1] + 14} flip tilt={-6} />
      <Foot x={right[0] + 44} y={right[1] - 14} tilt={-6} />
      {/* سليم stands in the space between */}
      {fig > 0.01 && (
        <g opacity={fig} transform={`translate(0 ${(1 - fig) * 20})`}>
          <Character who="salim" p={POSES.standFront.p} hands={POSES.standFront.hands} x={mid[0]} y={mid[1] + 4} s={1.05} face="calm" blink={0} />
        </g>
      )}
    </Frame>
  );
};
