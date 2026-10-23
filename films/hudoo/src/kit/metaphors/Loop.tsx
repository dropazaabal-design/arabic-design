import React from 'react';
import { LINE, PAL, hash } from '../style';
import { Frame, Puffs, clamp01, flame, heart, ink, smooth, useUid, type P } from './util';

// The loop: thought → emotion → body → thought. A pulse of light travels the ring; the node it reaches lights up.
// `active` 0 = thought, 1 = emotion, 2 = body, 3 = thought again (fractions travel between them).
// Ring centre (960, 560), radius 300. Each node has a free label slot (LOOP_NODES[i].label) the film fills with Arabic.
const C: P = [960, 560], R = 300, NR = 104;
const ANG = [-90, 30, 150]; // degrees, clockwise in screen space
const at = (deg: number, r = R): P => [C[0] + Math.cos((deg * Math.PI) / 180) * r, C[1] + Math.sin((deg * Math.PI) / 180) * r];

/** Node centres, radius and a label anchor beside each (side tells which way the text should grow). */
export const LOOP_NODES = [
  { id: 'thought', x: 960, y: 260, r: NR, label: { x: 960, y: 105, side: 'top' as const } },
  { id: 'emotion', x: at(30)[0], y: at(30)[1], r: NR, label: { x: at(30)[0] + NR + 40, y: at(30)[1], side: 'right' as const } },
  { id: 'body', x: at(150)[0], y: at(150)[1], r: NR, label: { x: at(150)[0] - NR - 40, y: at(150)[1], side: 'left' as const } },
] as const;
/** The three entry doorways sit on the ring halfway between nodes. */
export const LOOP_ENTRIES = [-30, 90, 210].map((a) => at(a));

const TINT = ['#DCD5EF', '#F3D3DE', '#D3E0F2'];

const Thought: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <Puffs c={[[x - 30, y + 4, 26], [x - 4, y - 18, 32], [x + 28, y - 4, 28], [x + 6, y + 14, 26]]} fill="#FFFFFF" line={LINE.normal} seed={3} />
    <circle cx={x - 40} cy={y + 46} r={9} fill="#FFFFFF" {...ink(LINE.fine)} />
    <circle cx={x - 56} cy={y + 64} r={5.5} fill="#FFFFFF" {...ink(LINE.fine)} />
  </g>
);
const Emotion: React.FC<{ x: number; y: number; t: number; lit: number }> = ({ x, y, t, lit }) => {
  const f = 1 + lit * 0.15 + Math.sin(t * 9) * 0.04;
  return (
    <g>
      <path d={flame(x, y + 50, 74 * f, 112 * f, Math.sin(t * 5) * 8)} fill={PAL.warn} {...ink(LINE.normal)} />
      <path d={flame(x, y + 50, 40 * f, 64 * f, Math.sin(t * 5 + 1) * 5)} fill="#F1B9CB" />
      <path d={flame(x, y + 50, 18 * f, 30 * f, 0)} fill={PAL.flameCore} />
    </g>
  );
};
const Body: React.FC<{ x: number; y: number; t: number; lit: number }> = ({ x, y, t, lit }) => {
  const beat = 1 + (0.08 + lit * 0.14) * Math.max(0, Math.sin(t * 9));
  return (
    <g>
      {/* raised, tight shoulders */}
      <path d={`M${x - 58} ${y + 66} L${x - 54} ${y + 10} Q${x - 48} ${y - 8} ${x - 24} ${y - 12} L${x + 24} ${y - 12} Q${x + 48} ${y - 8} ${x + 54} ${y + 10} L${x + 58} ${y + 66} Z`} fill={PAL.calm} {...ink(LINE.normal)} />
      <circle cx={x} cy={y - 42} r={26} fill="#F4E6E1" {...ink(LINE.normal)} />
      <path d={heart(x + 8, y + 26, 36 * beat)} fill={PAL.warn} {...ink(LINE.fine)} />
      {/* tension marks over each shoulder */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M${x + s * 52} ${y - 26} L${x + s * 66} ${y - 40}`} {...ink(4)} />
          <path d={`M${x + s * 64} ${y - 10} L${x + s * 82} ${y - 18}`} {...ink(4)} />
        </g>
      ))}
    </g>
  );
};

/** A small upright doorway sitting on the ring, with an arrow coming in from outside. */
const Entry: React.FC<{ deg: number; s: number }> = ({ deg, s }) => {
  const [x, y] = at(deg);
  const o = at(deg, R + 120), i = at(deg, R + 52);
  const ang = Math.atan2(i[1] - o[1], i[0] - o[0]);
  const hd = (k: number) => `${i[0] - Math.cos(ang + k) * 18} ${i[1] - Math.sin(ang + k) * 18}`;
  return (
    <g opacity={Math.min(1, s * 1.5)}>
      <path d={`M${o[0]} ${o[1]} L${i[0]} ${i[1]} M${hd(0.6)} L${i[0]} ${i[1]} L${hd(-0.6)}`} fill="none" {...ink(6)} />
      <g transform={`translate(${x} ${y}) scale(${1.45 * s})`}>
        <path d="M-24 26 L-24 -10 Q-24 -34 0 -34 Q24 -34 24 -10 L24 26 Z" fill={PAL.calmLight} {...ink(LINE.normal)} />
        <path d="M-12 26 L-12 -4 Q-12 -20 0 -20 Q12 -20 12 -4 L12 26" fill="#FFFFFF" opacity={0.9} />
      </g>
    </g>
  );
};

export type LoopProps = {
  t: number;
  /** 0..3: which node is lit; fractions are the pulse travelling between nodes */
  active: number;
  /** labels are drawn by the film, not here: pass nothing */
  nodes?: [string, string, string];
  /** 0..1 shows three small doorways on the ring: more than one way in */
  entries?: number;
};

export const Loop: React.FC<LoopProps> = ({ t, active, entries = 0 }) => {
  const id = useUid();
  const a = ((active % 3) + 3) % 3;
  const lit = [0, 1, 2].map((i) => { const d = Math.min(Math.abs(a - i), Math.abs(a - i - 3), Math.abs(a - i + 3)); return clamp01(1 - d * 2.2); });
  const th = -90 + active * 120;
  const gap = ((NR + 34) / R) * (180 / Math.PI);
  const arc = (a0: number, a1: number, n = 24): P[] => Array.from({ length: n + 1 }, (_, i) => {
    const d = a0 + ((a1 - a0) * i) / n;
    return at(d, R + (hash(i + a0) - 0.5) * 2.2);
  });
  return (
    <Frame bg={PAL.paper}>
      <defs>
        <radialGradient id={`${id}glow`}><stop offset="0" stopColor="#FFFFFF" stopOpacity="1" /><stop offset="0.35" stopColor="#D3E0F2" stopOpacity="0.9" /><stop offset="1" stopColor="#D3E0F2" stopOpacity="0" /></radialGradient>
      </defs>
      {/* the track */}
      <circle cx={C[0]} cy={C[1]} r={R} fill="none" stroke="#E4E0D8" strokeWidth={30} />
      {/* arrows between nodes */}
      {ANG.map((a0, i) => {
        const pts = arc(a0 + gap, a0 + 120 - gap);
        const end = pts[pts.length - 1], prev = pts[pts.length - 3];
        const ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
        const hd = (s: number) => [end[0] - Math.cos(ang + s) * 30, end[1] - Math.sin(ang + s) * 30];
        const [l, r] = [hd(0.5), hd(-0.5)];
        return (
          <g key={i}>
            <path d={smooth(pts)} fill="none" {...ink(6)} />
            <path d={`M${l[0]} ${l[1]} L${end[0]} ${end[1]} L${r[0]} ${r[1]}`} fill="none" {...ink(6)} />
          </g>
        );
      })}
      {/* the pulse and its tail */}
      {Array.from({ length: 14 }, (_, i) => {
        const p = at(th - (14 - i) * 3);
        return <circle key={i} cx={p[0]} cy={p[1]} r={4 + i * 0.9} fill="#9DB7E0" opacity={(i / 14) * 0.8} />;
      })}
      <circle cx={at(th)[0]} cy={at(th)[1]} r={62} fill={`url(#${id}glow)`} />
      <circle cx={at(th)[0]} cy={at(th)[1]} r={15} fill="#FFFFFF" {...ink(LINE.fine)} />
      {/* doorways: the loop can be entered at more than one point */}
      {entries > 0 && [-30, 90, 210].map((d, k) => {
        const s = clamp01(entries * 3 - k);
        return s > 0 && <Entry key={k} deg={d} s={s * (0.85 + 0.15 * Math.sin(Math.PI * s))} />;
      })}
      {/* nodes */}
      {LOOP_NODES.map((n, i) => {
        const L = lit[i], s = 1 + L * 0.07;
        return (
          <g key={n.id} transform={`translate(${n.x} ${n.y}) scale(${s}) translate(${-n.x} ${-n.y})`}>
            {L > 0 && <circle cx={n.x} cy={n.y} r={NR + 20} fill={TINT[i]} opacity={L} />}
            <circle cx={n.x} cy={n.y} r={NR} fill={L > 0 ? '#FFFFFF' : '#FBFAF7'} {...ink(LINE.bold)} />
            {i === 0 && <Thought x={n.x} y={n.y} />}
            {i === 1 && <Emotion x={n.x} y={n.y - 4} t={t} lit={L} />}
            {i === 2 && <Body x={n.x} y={n.y + 8} t={t} lit={L} />}
          </g>
        );
      })}
    </Frame>
  );
};
