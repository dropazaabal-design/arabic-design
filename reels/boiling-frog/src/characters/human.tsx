import React from 'react';
import { INK, LINE, PAL, stroke } from '@mukarram/characters/ink';
import { BUILD, Build, Person, PersonProps } from '@mukarram/characters/rig';

// The reel's one recurring human: built on the reels/mukarram rig (same joints, faces, hands), with
// his own silhouette — a curly-haired guy in a red t-shirt with a navy collar band and blue slippers.

export const HUMAN_BUILD: Build = { ...BUILD, headRX: 90, headRY: 94, torsoW: 160, torsoH: 206, belly: 0.6, shX: 60, shirt: PAL.red, shoe: PAL.blue, seed: 61 };

const Curls: React.FC<{ rx: number; ry: number }> = ({ rx, ry }) => (
  <g>
    {[-0.7, -0.35, 0, 0.35, 0.7].map((k, i) => {
      const x = k * rx, y = -ry * (0.86 - Math.abs(k) * 0.28);
      return <circle key={i} cx={x} cy={y} r={rx * 0.24} fill={INK} />;
    })}
    {[-0.55, -0.15, 0.25, 0.6].map((k, i) => <path key={i} d={`M${k * rx} ${-ry * 1.0} q 10 -14 20 0`} fill="none" {...stroke(LINE * 0.6, PAL.white)} opacity={0.5} />)}
  </g>
);

export const Human: React.FC<Omit<PersonProps, 'build' | 'torsoDetail' | 'headBack'>> = (p) => {
  const b = HUMAN_BUILD;
  return (
    <Person {...p} build={b}
      headBack={<Curls rx={b.headRX} ry={b.headRY} />}
      torsoDetail={<path d={`M${-b.torsoW * 0.26} ${-b.torsoH + 12} Q0 ${-b.torsoH + 46} ${b.torsoW * 0.26} ${-b.torsoH + 12}`} fill="none" {...stroke(LINE * 1.4, PAL.navy)} />} />
  );
};
