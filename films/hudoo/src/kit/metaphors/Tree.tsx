import React from 'react';
import { INK, LINE, PAL, hash, sketch } from '../style';
import { Frame, Puffs, blob, ease, ink, mix, smooth, useUid, type P } from './util';

// A tree on a small hill: the branches give in the wind, the trunk stays, the roots hold.
// Trunk base (960, 700); crown ≈ x 700..1240, y 130..520; ground line y ≈ 700 at the hill top, 780 at the edges.
// `roots` drops a cut-away below the ground (y 700..1080). Free for captions: top-left (x < 560, y < 560) and
// top-right (x > 1380, y < 560) — wind and leaves cross the right side, so prefer the left.
export const TREE = { base: [960, 700] as P, ground: 780, crown: [960, 300] as P } as const;
const BX = 960, BY = 700;

const groundY = (x: number) => {
  const d = (x - BX) / 620;
  return Math.abs(d) >= 1 ? 780 : 780 - 80 * Math.cos((d * Math.PI) / 2) ** 2;
};

// crown clusters: [dx, dy from the trunk top, radius, fork height on the trunk, how far the wind moves it]
const CLUSTERS: [number, number, number, number, number][] = [
  [-200, -10, 92, 0.78, 0.7], [-130, -150, 100, 0.95, 0.9], [10, -220, 108, 1, 1], [150, -140, 100, 0.95, 0.9],
  [210, -10, 90, 0.78, 0.75], [-40, -60, 110, 0.9, 0.6], [90, -40, 96, 0.88, 0.65],
];
// roots: polylines from the trunk base, in world space
const ROOTS: P[][] = [
  [[BX - 20, BY + 10], [BX - 120, BY + 70], [BX - 260, BY + 110], [BX - 420, BY + 170]],
  [[BX - 10, BY + 20], [BX - 70, BY + 130], [BX - 140, BY + 230], [BX - 170, BY + 320]],
  [[BX, BY + 20], [BX + 10, BY + 140], [BX - 10, BY + 250], [BX + 20, BY + 340]],
  [[BX + 10, BY + 20], [BX + 80, BY + 120], [BX + 170, BY + 210], [BX + 220, BY + 310]],
  [[BX + 20, BY + 10], [BX + 140, BY + 60], [BX + 300, BY + 100], [BX + 450, BY + 150]],
  [[BX - 160, BY + 80], [BX - 220, BY + 170], [BX - 300, BY + 240]],
  [[BX + 150, BY + 70], [BX + 210, BY + 150], [BX + 330, BY + 220]],
  [[BX - 90, BY + 160], [BX - 30, BY + 230], [BX - 60, BY + 300]],
  [[BX + 120, BY + 180], [BX + 80, BY + 260], [BX + 110, BY + 330]],
];

export type TreeProps = { t: number; wind: number; roots: number };

export const Tree: React.FC<TreeProps> = ({ t, wind, roots }) => {
  const id = useUid();
  const r = ease(roots);
  // one gust value for the whole crown: always leaning downwind (+x), breathing in strength
  const gust = wind * (0.62 + 0.38 * Math.sin(t * 1.25 + Math.sin(t * 0.45) * 2));
  const top: P = [BX, BY - 300];
  const clusters = CLUSTERS.map(([dx, dy, rad, fork, give], i) => {
    const flutter = Math.sin(t * 6.5 + i * 1.9) * 7 * wind;
    return { c: [top[0] + dx + gust * 95 * give + flutter, top[1] + dy + gust * 22 * give] as P, rad, fork, i };
  });
  const trunkAt = (k: number): P => [BX, mix(BY, top[1] + 40, k)];
  const hillPts: P[] = Array.from({ length: 41 }, (_, i) => { const x = -40 + i * 50; return [x, groundY(x)]; });
  const hill = smooth(hillPts) + ' L1960 1100 L-40 1100 Z';
  const surface = smooth(hillPts);
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const u = (t * (0.18 + hash(i) * 0.1) + hash(i * 4.1)) % 1;
    return { x: 1180 + u * 900, y: 330 + hash(i * 2.3) * 260 + Math.sin(u * 9 + i) * 40 + u * 120, a: u * 720 + i * 40, o: Math.sin(u * Math.PI) * (wind > 0.25 ? 1 : wind * 4) };
  });

  return (
    <Frame bg={PAL.sky}>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CBD6E8" /><stop offset="1" stopColor="#E9EEF5" /></linearGradient>
        <clipPath id={`${id}cut`}><rect x={-40} y={0} width={2000} height={r > 0 ? mix(690, 1100, r) : 0} /></clipPath>
      </defs>
      <rect width={1920} height={1080} fill={`url(#${id}sky)`} />
      {/* soft clouds drifting downwind */}
      {[[300, 170, 1], [1500, 120, 0.8], [1150, 260, 0.6]].map(([x, y, s], i) => {
        const xx = ((x + t * (8 + 30 * wind) * (i + 1)) % 2300) - 200;
        return <Puffs key={i} c={[[xx, y, 46 * s], [xx + 50 * s, y - 18 * s, 56 * s], [xx + 110 * s, y, 44 * s]]} fill="#F5F7FB" line={LINE.fine} seed={i + 3} />;
      })}
      {/* wind streaks */}
      {wind > 0.02 && Array.from({ length: 6 }, (_, i) => {
        const y = 150 + i * 90 + (i % 2) * 30, x0 = ((t * 520 + i * 410) % 2600) - 500;
        return <path key={i} d={`M${x0} ${y} q140 -26 280 0 t200 -10 q30 -26 0 -40 q-26 -6 -26 18`} fill="none" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={wind * 0.85} />;
      })}
      {/* the ground, and under it the cut-away */}
      <path d={hill} fill="#8DB59E" />
      <g clipPath={`url(#${id}cut)`}>
        <path d={hill} fill="#A3959B" />
        <path d={smooth(hillPts.map(([x, y]): P => [x, y + 90 + Math.sin(x * 0.01) * 10])) + ' L1960 1100 L-40 1100 Z'} fill="#93868D" />
        <path d={smooth(hillPts.map(([x, y]): P => [x, y + 210 + Math.sin(x * 0.007 + 1) * 14])) + ' L1960 1100 L-40 1100 Z'} fill="#82767D" />
        {Array.from({ length: 26 }, (_, i) => {
          const x = hash(i * 3.7) * 1920, y = groundY(x) + 50 + hash(i * 1.3) * 300, s = 10 + hash(i * 5.1) * 16;
          return <path key={i} d={smooth(blob(x, y, s * 1.3, s, i + 80, 8, 0.12), true)} fill={i % 2 ? '#B8AFA6' : '#A79CA3'} {...ink(LINE.far)} />;
        })}
        {ROOTS.map((pts, i) => {
          const d = smooth(pts);
          const w = i < 5 ? 22 : 13;
          const grow = ease((r - 0.2 - (i % 5) * 0.04 - (i >= 5 ? 0.15 : 0)) / 0.6);
          return (
            <g key={i}>
              <path d={d} pathLength={1} fill="none" stroke={INK} strokeWidth={w + 8} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - grow} />
              <path d={d} pathLength={1} fill="none" stroke="#7E716F" strokeWidth={w} strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset={1 - grow} />
            </g>
          );
        })}
        {/* the section line */}
        <path d={surface} fill="none" {...ink(LINE.bold)} />
      </g>
      {/* grass skin on the surface, tufts bending downwind */}
      <path d={surface} fill="none" stroke="#6E9A82" strokeWidth={16} />
      <path d={surface} fill="none" {...ink(LINE.normal)} />
      {Array.from({ length: 24 }, (_, i) => {
        const x = 60 + i * 78 + (hash(i) - 0.5) * 30, y = groundY(x) + 2;
        const bend = gust * 16 + Math.sin(t * 5 + i) * 3 * wind;
        return <path key={i} d={`M${x - 8} ${y} Q${x - 6 + bend * 0.4} ${y - 14} ${x - 4 + bend} ${y - 26} M${x + 2} ${y} Q${x + 4 + bend * 0.4} ${y - 16} ${x + 8 + bend} ${y - 30}`} fill="none" stroke={PAL.plantDark} strokeWidth={4} strokeLinecap="round" />;
      })}
      {/* branches: from the trunk to each cluster, bending with it */}
      {clusters.map(({ c, fork, i }) => {
        const s = trunkAt(fork);
        const d = `M${s[0]} ${s[1]} Q${mix(s[0], c[0], 0.25)} ${mix(s[1], c[1], 0.75)} ${c[0]} ${c[1]}`;
        return <g key={i}><path d={d} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" /><path d={d} fill="none" stroke={PAL.woodDark} strokeWidth={14} strokeLinecap="round" /></g>;
      })}
      {/* the trunk: it does not move */}
      <path d={sketch([[BX - 40, BY + 6], [BX - 30, BY - 120], [BX - 24, top[1] + 30], [BX + 24, top[1] + 30], [BX + 32, BY - 120], [BX + 44, BY + 6]], 7, 1.5, true)} fill={PAL.woodDark} {...ink(LINE.bold)} />
      <path d={`M${BX - 8} ${BY - 40} L${BX - 4} ${BY - 150} M${BX + 12} ${BY - 90} L${BX + 10} ${BY - 210}`} stroke={INK} strokeWidth={LINE.fine} opacity={0.5} strokeLinecap="round" />
      {/* the crown */}
      <Puffs c={clusters.map(({ c, rad }) => [c[0], c[1], rad] as [number, number, number])} fill={PAL.plant} line={LINE.bold} seed={4} />
      {clusters.map(({ c, rad, i }) => <path key={i} d={smooth(blob(c[0] - rad * 0.25, c[1] - rad * 0.3, rad * 0.45, rad * 0.32, i + 40, 9, 0.1), true)} fill="#8DB59E" opacity={0.75} />)}
      {clusters.map(({ c, rad, i }) => <path key={`s${i}`} d={`M${c[0] - rad * 0.5} ${c[1] + rad * 0.55} Q${c[0]} ${c[1] + rad * 0.75} ${c[0] + rad * 0.5} ${c[1] + rad * 0.5}`} fill="none" stroke={PAL.plantDark} strokeWidth={10} strokeLinecap="round" opacity={0.6} />)}
      {/* loose leaves riding the gusts */}
      {leaves.map((l, i) => l.o > 0.02 && (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.a})`} opacity={l.o}>
          <path d="M-14 0 Q0 -10 14 0 Q0 10 -14 0 Z" fill={i % 2 ? PAL.plant : '#8DB59E'} {...ink(2)} />
        </g>
      ))}
    </Frame>
  );
};
