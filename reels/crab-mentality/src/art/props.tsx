import React from 'react';
import { C } from '../theme';
import { INK } from './crab';

// ---------------------------------------------------------------------------
// Vessel: the bucket, its cut-away, and the coffee cup it becomes.
// ---------------------------------------------------------------------------
export type VesselShape = { cx: number; rimY: number; rx: number; ry: number; botY: number; botHalf: number };
export const BUCKET: VesselShape = { cx: 540, rimY: 900, rx: 330, ry: 66, botY: 1460, botHalf: 250 };
export const CUP: VesselShape = { cx: 165, rimY: 1130, rx: 100, ry: 24, botY: 1300, botHalf: 76 };
export const lerpShape = (a: VesselShape, b: VesselShape, p: number): VesselShape => ({
  cx: a.cx + (b.cx - a.cx) * p, rimY: a.rimY + (b.rimY - a.rimY) * p, rx: a.rx + (b.rx - a.rx) * p,
  ry: a.ry + (b.ry - a.ry) * p, botY: a.botY + (b.botY - a.botY) * p, botHalf: a.botHalf + (b.botHalf - a.botHalf) * p,
});
const bodyPath = (v: VesselShape) =>
  `M ${v.cx - v.rx} ${v.rimY} A ${v.rx} ${v.ry} 0 0 0 ${v.cx + v.rx} ${v.rimY} L ${v.cx + v.botHalf} ${v.botY} Q ${v.cx} ${v.botY + v.ry * 0.8} ${v.cx - v.botHalf} ${v.botY} Z`;
const band = (v: VesselShape, t: number) => {
  const y = v.rimY + (v.botY - v.rimY) * t;
  const half = v.rx + (v.botHalf - v.rx) * t;
  return `M ${v.cx - half} ${y} Q ${v.cx} ${y + v.ry * 1.25} ${v.cx + half} ${y}`;
};
export const insideClip = (v: VesselShape) =>
  `M -600 -2000 L 1680 -2000 L 1680 ${v.rimY} L ${v.cx + v.rx} ${v.rimY} L ${v.cx + v.botHalf} ${v.botY} L ${v.cx - v.botHalf} ${v.botY} L ${v.cx - v.rx} ${v.rimY} L -600 ${v.rimY} Z`;

export const VesselDefs: React.FC = () => (
  <defs>
    <linearGradient id="metal" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor={C.metalDark} />
      <stop offset="0.38" stopColor={C.metal} />
      <stop offset="0.55" stopColor="#6A7DA2" />
      <stop offset="1" stopColor={C.metalDark} />
    </linearGradient>
    <linearGradient id="interior" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#1A2340" />
      <stop offset="1" stopColor="#0A0F1E" />
    </linearGradient>
    <linearGradient id="ceramic" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stopColor="#D9CDB8" />
      <stop offset="0.45" stopColor={C.paper} />
      <stop offset="1" stopColor="#CFC1A8" />
    </linearGradient>
    <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <line x1="0" y1="0" x2="0" y2="14" stroke={C.ivory} strokeWidth="2.5" opacity="0.16" />
    </pattern>
    <radialGradient id="redGlow" cx="50%" cy="70%" r="60%">
      <stop offset="0" stopColor={C.red} stopOpacity={0.45} />
      <stop offset="1" stopColor={C.red} stopOpacity={0} />
    </radialGradient>
    <linearGradient id="beam" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor="#FFD58A" stopOpacity={0.42} />
      <stop offset="0.7" stopColor="#FFD58A" stopOpacity={0.12} />
      <stop offset="1" stopColor="#FFD58A" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="woodGrad" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor={C.woodLight} />
      <stop offset="1" stopColor={C.wood} />
    </linearGradient>
  </defs>
);

/** Interior: back wall and the dark opening. */
export const VesselBack: React.FC<{ v: VesselShape; glow?: number; cut?: number }> = ({ v, glow = 0, cut = 0 }) => (
  <g>
    {cut > 0 && <path d={bodyPath(v)} fill="url(#interior)" opacity={cut} />}
    <ellipse cx={v.cx} cy={v.rimY} rx={v.rx} ry={v.ry} fill="#0A0F1E" />
    <ellipse cx={v.cx} cy={v.rimY + v.ry * 0.15} rx={v.rx * 0.92} ry={v.ry * 0.75} fill="url(#redGlow)" opacity={glow} />
    <path d={`M ${v.cx - v.rx} ${v.rimY} A ${v.rx} ${v.ry} 0 0 1 ${v.cx + v.rx} ${v.rimY}`} fill="none" stroke={C.metalLight} strokeWidth={10} />
    <path d={`M ${v.cx - v.rx} ${v.rimY} A ${v.rx} ${v.ry} 0 0 1 ${v.cx + v.rx} ${v.rimY}`} fill="none" stroke={C.ivory} strokeWidth={4} />
  </g>
);

/** Front wall. cut: 0 solid … 1 x-ray; cup: 0 bucket … 1 coffee cup. */
export const VesselFront: React.FC<{ v: VesselShape; cut?: number; cup?: number; dent?: number }> = ({ v, cut = 0, cup = 0, dent = 0 }) => {
  const isCup = cup > 0.5;
  const fillOp = 1 - cut * 0.9;
  return (
    <g>
      {cup > 0 && (
        <path d={`M ${v.cx + v.rx * 0.92} ${v.rimY + (v.botY - v.rimY) * 0.18} C ${v.cx + v.rx * 1.7} ${v.rimY + (v.botY - v.rimY) * 0.1} ${v.cx + v.rx * 1.7} ${v.rimY + (v.botY - v.rimY) * 0.78} ${v.cx + v.botHalf * 1.02} ${v.rimY + (v.botY - v.rimY) * 0.72}`}
          fill="none" stroke={C.ivory} strokeWidth={16} strokeLinecap="round" opacity={cup} />
      )}
      <path d={bodyPath(v)} fill={isCup ? 'url(#ceramic)' : 'url(#metal)'} fillOpacity={fillOp} stroke={C.ivory} strokeWidth={6} strokeLinejoin="round" strokeDasharray={cut > 0.5 ? '18 12' : undefined} />
      {!isCup && <path d={bodyPath(v)} fill="url(#hatch)" opacity={fillOp} />}
      {!isCup && [0.2, 0.62].map((t) => (
        <g key={t} opacity={fillOp}>
          <path d={band(v, t)} fill="none" stroke={C.metalDark} strokeWidth={14} />
          <path d={band(v, t)} fill="none" stroke={C.metalLight} strokeWidth={4} transform="translate(0 -6)" />
        </g>
      ))}
      {isCup && <path d={band(v, 0.25)} fill="none" stroke={C.blue} strokeWidth={18} />}
      {isCup && <path d={band(v, 0.4)} fill="none" stroke={C.amber} strokeWidth={6} />}
      {!isCup && (
        <g opacity={fillOp}>
          {[-1, 1].map((side) => (
            <g key={side}>
              <circle cx={v.cx + side * (v.rx - 26)} cy={v.rimY + 46} r={7} fill={C.metalLight} stroke={C.ivory} strokeWidth={2} />
              <circle cx={v.cx + side * (v.rx + 8)} cy={v.rimY + 16} r={16} fill="none" stroke={C.ivory} strokeWidth={6} />
            </g>
          ))}
          <path d={`M ${v.cx - v.rx * 0.5} ${v.rimY + 210} q 30 ${-14 - dent * 20} 60 0`} fill="none" stroke={C.ivory} strokeWidth={4} opacity={0.5} />
          <path d={`M ${v.cx + v.rx * 0.25} ${v.rimY + 330} l 26 30 M ${v.cx + v.rx * 0.32} ${v.rimY + 322} l 20 24`} stroke={C.ivory} strokeWidth={3} opacity={0.35} />
          <path d={`M ${v.cx - v.rx} ${v.rimY + 6} A ${v.rx} ${v.ry} 0 0 0 ${v.cx + v.rx} ${v.rimY + 6}`} fill="none" stroke="#000" strokeWidth={14} opacity={0.28} transform="translate(0 14)" />
        </g>
      )}
      <path d={`M ${v.cx - v.rx} ${v.rimY} A ${v.rx} ${v.ry} 0 0 0 ${v.cx + v.rx} ${v.rimY}`} fill="none" stroke={isCup ? C.paper : C.metalLight} strokeWidth={16} strokeLinecap="round" />
      <path d={`M ${v.cx - v.rx} ${v.rimY} A ${v.rx} ${v.ry} 0 0 0 ${v.cx + v.rx} ${v.rimY}`} fill="none" stroke={C.ivory} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/** Warm light falling into an open top. */
export const Beam: React.FC<{ cx: number; topY: number; botY: number; wTop: number; wBot: number; o: number }> = ({ cx, topY, botY, wTop, wBot, o }) => (
  <path d={`M ${cx - wTop / 2} ${topY} L ${cx + wTop / 2} ${topY} L ${cx + wBot / 2} ${botY} L ${cx - wBot / 2} ${botY} Z`} fill="url(#beam)" opacity={o} style={{ filter: 'blur(18px)', mixBlendMode: 'screen' }} />
);

export const Glow: React.FC<{ x: number; y: number; r: number; color: string; o: number }> = ({ x, y, r, color, o }) => (
  <circle cx={x} cy={y} r={r} fill={color} opacity={o * 0.18} style={{ filter: `blur(${r / 3}px)` }} />
);

// ---------------------------------------------------------------------------
// Study: desk, lamp, notebook, pencil, steam.
// ---------------------------------------------------------------------------
export const Desk: React.FC<{ y: number; o?: number }> = ({ y, o = 1 }) => (
  <g opacity={o}>
    <rect x={-20} y={y} width={1120} height={60} fill="url(#woodGrad)" stroke={C.ivory} strokeWidth={5} />
    <rect x={-20} y={y + 60} width={1120} height={500} fill={C.woodDark} />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M ${-20 + i * 300} ${y + 18 + (i % 2) * 18} q 120 -12 260 4`} stroke={C.woodDark} strokeWidth={3} fill="none" opacity={0.6} />)}
    <path d={`M -20 ${y + 60} L 1100 ${y + 60}`} stroke="#000" strokeWidth={10} opacity={0.25} />
  </g>
);

export const Lamp: React.FC<{ x: number; y: number; on: number }> = ({ x, y, on }) => (
  <g>
    <path d={`M ${x - 230} ${y + 70} L ${x + 120} ${y + 70} L ${x + 380} ${y + 900} L ${x - 520} ${y + 900} Z`} fill="url(#beam)" opacity={0.55 * on} />
    <path d={`M ${x + 300} ${y - 160} L ${x + 60} ${y - 30}`} stroke={C.ivory} strokeWidth={14} strokeLinecap="round" />
    <path d={`M ${x + 300} ${y - 160} L ${x + 60} ${y - 30}`} stroke={C.inkSoft} strokeWidth={7} strokeLinecap="round" />
    <path d={`M ${x - 110} ${y + 70} C ${x - 100} ${y - 20} ${x + 20} ${y - 60} ${x + 90} ${y - 20} L ${x + 130} ${y + 70} Z`} fill={C.green} {...INK} strokeWidth={6} />
    <ellipse cx={x + 10} cy={y + 72} rx={70} ry={14} fill={C.amber} opacity={0.4 + 0.6 * on} />
  </g>
);

export const Steam: React.FC<{ x: number; y: number; draw: number; t: number }> = ({ x, y, draw, t }) => (
  <g>
    {[-30, 0, 30].map((dx, i) => {
      const w = Math.sin(t / 9 + i) * 8;
      return (
        <path key={i} d={`M ${x + dx} ${y} C ${x + dx - 18 + w} ${y - 34} ${x + dx + 18 - w} ${y - 68} ${x + dx + w} ${y - 104}`}
          fill="none" stroke={C.ivory} strokeWidth={6} strokeLinecap="round" opacity={0.65} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      );
    })}
  </g>
);

/** Arabic notebook: spine on the right, the cover swings open to the right. */
export const Notebook: React.FC<{ x: number; y: number; w: number; h: number; open: number; write: number; cover?: string; tilt?: number; squash?: number }> = ({ x, y, w, h, open, write, cover = C.blue, tilt = 0, squash = 0 }) => {
  const k = Math.cos(Math.PI * Math.min(1, Math.max(0, open)));
  const inside = k < 0;
  const lines = 6;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${1 + squash * 0.05} ${1 - squash * 0.2})`}>
      <rect x={-w - 10} y={-h + 14} width={w + 10} height={h} rx={10} fill="#000" opacity={0.25} />
      <rect x={-w} y={-h} width={w} height={h} rx={8} fill={C.paper} {...INK} />
      {Array.from({ length: lines }).map((_, i) => {
        const p = Math.min(1, Math.max(0, write * lines - i));
        const len = (w - 70) * (i === lines - 1 ? 0.55 : 1);
        return (
          <g key={i}>
            <path d={`M -30 ${-h + 60 + i * ((h - 90) / lines)} L ${-30 - len} ${-h + 60 + i * ((h - 90) / lines)}`} stroke={C.muted} strokeWidth={3} opacity={0.5} />
            {p > 0 && <path d={`M -34 ${-h + 52 + i * ((h - 90) / lines)} q ${-len * 0.25} -8 ${-len * 0.5} 0 t ${-len * 0.5} 0`} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />}
          </g>
        );
      })}
      <rect x={-6} y={-h - 4} width={14} height={h + 8} rx={6} fill={cover} {...INK} strokeWidth={4} />
      <g transform={`scale(${k} 1)`}>
        <rect x={-w} y={-h} width={w} height={h} rx={8} fill={inside ? '#EFE2CB' : cover} {...INK} />
        {!inside && <rect x={-w + 40} y={-h + 50} width={w - 110} height={60} rx={10} fill={C.paper} opacity={0.9} />}
        {!inside && <path d={`M ${-w + 40} ${-h + 150} L ${-80} ${-h + 150}`} stroke={C.paper} strokeWidth={6} opacity={0.5} />}
      </g>
    </g>
  );
};

export const Pencil: React.FC<{ x: number; y: number; rot: number; s?: number }> = ({ x, y, rot, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-9} y={-150} width={18} height={130} fill={C.amber} {...INK} strokeWidth={4} />
    <rect x={-9} y={-170} width={18} height={22} rx={4} fill={C.pink} {...INK} strokeWidth={4} />
    <path d="M -9 -20 L 0 6 L 9 -20 Z" fill="#E9D6B8" {...INK} strokeWidth={4} />
    <path d="M -3 -2 L 0 6 L 3 -2 Z" fill={C.ink} />
  </g>
);

// ---------------------------------------------------------------------------
// Workshop: crates, awning, sign.
// ---------------------------------------------------------------------------
export const Crate: React.FC<{ x: number; y: number; w: number; h: number; rot?: number; o?: number }> = ({ x, y, w, h, rot = 0, o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o}>
    <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill="url(#woodGrad)" {...INK} strokeWidth={6} />
    <path d={`M ${-w / 2 + 14} ${-h + 14} L ${w / 2 - 14} -14 M ${w / 2 - 14} ${-h + 14} L ${-w / 2 + 14} -14`} stroke={C.woodDark} strokeWidth={8} />
    <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill="none" {...INK} strokeWidth={6} />
    <path d={`M ${-w / 2} ${-h / 2} L ${w / 2} ${-h / 2}`} stroke={C.ivory} strokeWidth={4} opacity={0.4} />
  </g>
);

export const Awning: React.FC<{ x: number; y: number; w: number; rot?: number; o?: number; crack?: number }> = ({ x, y, w, rot = 0, o = 1, crack = 0 }) => {
  const n = 6;
  const sw = w / n;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o}>
      <path d={`M ${-w / 2 - 20} 0 L ${-w / 2 + 30} -90 L ${w / 2 - 30} -90 L ${w / 2 + 20} 0 Z`} fill={C.paper} {...INK} strokeWidth={6} />
      {Array.from({ length: n }).map((_, i) => (
        i % 2 === 0 ? <path key={i} d={`M ${-w / 2 - 20 + i * (sw + 40 / n)} 0 L ${-w / 2 + 30 + i * ((w - 60) / n)} -90 L ${-w / 2 + 30 + (i + 1) * ((w - 60) / n)} -90 L ${-w / 2 - 20 + (i + 1) * (sw + 40 / n)} 0 Z`} fill={C.green} /> : null
      ))}
      {Array.from({ length: n }).map((_, i) => (
        <path key={`s${i}`} d={`M ${-w / 2 - 20 + i * (sw + 40 / n)} 0 a ${(sw + 40 / n) / 2} 26 0 0 0 ${sw + 40 / n} 0`} fill={i % 2 === 0 ? C.green : C.paper} {...INK} strokeWidth={5} />
      ))}
      <path d={`M ${-w / 2 - 20} 0 L ${-w / 2 + 30} -90 L ${w / 2 - 30} -90 L ${w / 2 + 20} 0`} fill="none" {...INK} strokeWidth={6} />
      {crack > 0 && <path d={`M -20 -90 l 18 30 l -16 22 l 20 34`} fill="none" stroke={C.ink} strokeWidth={6} opacity={crack} />}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Ladder, tools, blocks, book, checklist, bubbles, small effects.
// ---------------------------------------------------------------------------
export const Ladder: React.FC<{
  x: number; y: number; h: number; rot?: number; rungs?: number; total?: number; color?: string;
  broken?: number | null; fix?: number; o?: number; width?: number;
}> = ({ x, y, h, rot = 0, rungs = 99, total = 4, color = C.green, broken = null, fix = 1, o = 1, width = 120 }) => {
  const half = width / 2;
  const rungY = (i: number) => -h * ((i + 0.7) / (total + 0.4));
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={o}>
      {[-half, half].map((rx) => (
        <g key={rx}>
          <path d={`M ${rx} 0 L ${rx} ${-h}`} stroke={C.ivory} strokeWidth={24} strokeLinecap="round" />
          <path d={`M ${rx} 0 L ${rx} ${-h}`} stroke={color} strokeWidth={15} strokeLinecap="round" />
        </g>
      ))}
      {Array.from({ length: total }).map((_, i) => {
        const vis = Math.max(0, Math.min(1, rungs - i));
        if (vis <= 0) return null;
        const ry = rungY(i);
        if (broken === i && fix < 1) {
          return (
            <g key={i} opacity={vis}>
              <path d={`M ${-half} ${ry} L -8 ${ry + 26 * (1 - fix)}`} stroke={C.ivory} strokeWidth={20} strokeLinecap="round" />
              <path d={`M ${-half} ${ry} L -8 ${ry + 26 * (1 - fix)}`} stroke={C.amberDeep} strokeWidth={12} strokeLinecap="round" />
              <path d={`M ${half} ${ry} L 8 ${ry + 34 * (1 - fix)}`} stroke={C.ivory} strokeWidth={20} strokeLinecap="round" />
              <path d={`M ${half} ${ry} L 8 ${ry + 34 * (1 - fix)}`} stroke={C.amberDeep} strokeWidth={12} strokeLinecap="round" />
            </g>
          );
        }
        return (
          <g key={i} opacity={vis}>
            <path d={`M ${-half} ${ry} L ${half} ${ry}`} stroke={C.ivory} strokeWidth={22} strokeLinecap="round" />
            <path d={`M ${-half} ${ry} L ${half} ${ry}`} stroke={broken === i ? C.amber : color} strokeWidth={13} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};
export const ladderRungY = (h: number, total: number, i: number) => -h * ((i + 0.7) / (total + 0.4));

export const Wrench: React.FC<{ x: number; y: number; rot: number; s?: number; o?: number; color?: string }> = ({ x, y, rot, s = 1, o = 1, color = C.green }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <path d="M -11 0 L -11 124 Q 0 140 11 124 L 11 0 Z" fill={color} {...INK} />
    <path d="M -36 -30 C -42 8 -20 20 0 20 C 20 20 42 8 36 -30 L 17 -13 L 17 -36 L -17 -36 L -17 -13 Z" fill={color} {...INK} />
    <circle cx={0} cy={104} r={6} fill={C.ivory} opacity={0.7} />
  </g>
);

export const Lock: React.FC<{ x: number; y: number; s?: number; o?: number; shut?: number }> = ({ x, y, s = 1, o = 1, shut = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d={`M -34 ${-6 - (1 - shut) * 30} L -34 ${-40 - (1 - shut) * 30} C -34 ${-84 - (1 - shut) * 30} 34 ${-84 - (1 - shut) * 30} 34 ${-40 - (1 - shut) * 30} L 34 -6`} fill="none" stroke={C.ivory} strokeWidth={14} strokeLinecap="round" />
    <rect x={-56} y={-10} width={112} height={92} rx={18} fill={C.blue} {...INK} strokeWidth={6} />
    <circle cx={0} cy={28} r={11} fill={C.ivory} />
    <path d="M 0 30 L 0 56" stroke={C.ivory} strokeWidth={8} strokeLinecap="round" />
  </g>
);

/** A step of the way out: a block with depth and an emblem of what built it. */
export const Block: React.FC<{ x: number; y: number; w: number; h: number; color: string; emblem: 'lock' | 'tool' | 'check'; o?: number; rot?: number; s?: number; glow?: number }> = ({ x, y, w, h, color, emblem, o = 1, rot = 0, s = 1, glow = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    {glow > 0 && <rect x={-w / 2 - 18} y={-h - 40} width={w + 36} height={h + 58} rx={30} fill={color} opacity={0.25 * glow} />}
    <path d={`M ${-w / 2} ${-h} L ${-w / 2 + 26} ${-h - 26} L ${w / 2 + 26} ${-h - 26} L ${w / 2} ${-h} Z`} fill={color} {...INK} strokeWidth={5} opacity={0.85} />
    <path d={`M ${w / 2} ${-h} L ${w / 2 + 26} ${-h - 26} L ${w / 2 + 26} -26 L ${w / 2} 0 Z`} fill="#000" opacity={0.25} />
    <path d={`M ${w / 2} ${-h} L ${w / 2 + 26} ${-h - 26} L ${w / 2 + 26} -26 L ${w / 2} 0 Z`} fill="none" {...INK} strokeWidth={5} />
    <rect x={-w / 2} y={-h} width={w} height={h} rx={6} fill={color} {...INK} strokeWidth={6} />
    <g transform={`translate(0 ${-h / 2}) scale(${Math.min(w, h) / 200})`}>
      {emblem === 'lock' && <Lock x={0} y={-20} s={0.7} />}
      {emblem === 'tool' && <Wrench x={0} y={-50} rot={35} s={0.7} color={C.paper} />}
      {emblem === 'check' && <path d="M -46 0 L -12 34 L 50 -36" fill="none" stroke={C.paper} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  </g>
);

/** The experience: an old book on a stand, glowing when it opens. */
export const WiseBook: React.FC<{ x: number; y: number; open: number; glow: number; s?: number }> = ({ x, y, open, glow, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={0} cy={-150} r={190} fill={C.amber} opacity={0.22 * glow} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <path key={i} d={`M 0 -150 L ${Math.cos((i / 8) * Math.PI * 2) * 240} ${-150 + Math.sin((i / 8) * Math.PI * 2) * 240}`} stroke={C.amber} strokeWidth={6} strokeLinecap="round" opacity={0.5 * glow} strokeDasharray="10 26" />
    ))}
    <path d="M -90 0 L 90 0 L 60 -60 L -60 -60 Z" fill={C.woodDark} {...INK} strokeWidth={6} />
    <g transform="translate(0 -70)">
      <path d={`M 0 0 C -60 ${-20 - open * 20} -130 ${-10 - open * 10} -160 ${-30 - open * 10} L -160 ${-150 - open * 10} C -120 ${-140 - open * 20} -50 ${-150 - open * 20} 0 ${-120 - open * 10} Z`} fill={C.paper} {...INK} />
      <path d={`M 0 0 C 60 ${-20 - open * 20} 130 ${-10 - open * 10} 160 ${-30 - open * 10} L 160 ${-150 - open * 10} C 120 ${-140 - open * 20} 50 ${-150 - open * 20} 0 ${-120 - open * 10} Z`} fill={C.paper} {...INK} />
      {[0, 1, 2].map((i) => <path key={i} d={`M -30 ${-40 - i * 26} L -130 ${-48 - i * 26}`} stroke={C.muted} strokeWidth={4} opacity={0.7} />)}
      {[0, 1, 2].map((i) => <path key={`r${i}`} d={`M 30 ${-40 - i * 26} L 130 ${-48 - i * 26}`} stroke={C.muted} strokeWidth={4} opacity={0.7} />)}
      <path d="M 0 0 L 0 -120" stroke={C.woodDark} strokeWidth={6} />
      <path d="M -170 -24 L -170 -150 M 170 -24 L 170 -150" stroke={C.redDeep} strokeWidth={10} strokeLinecap="round" opacity={0.9} />
    </g>
  </g>
);

export const Checklist: React.FC<{ x: number; y: number; ticks: number; s?: number; rot?: number; o?: number }> = ({ x, y, ticks, s = 1, rot = 0, o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <rect x={-130} y={-170} width={260} height={340} rx={14} fill={C.paper} {...INK} strokeWidth={6} />
    <rect x={-50} y={-188} width={100} height={36} rx={10} fill={C.metal} {...INK} strokeWidth={4} />
    {[0, 1, 2].map((i) => {
      const p = Math.min(1, Math.max(0, ticks * 3 - i));
      const yy = -90 + i * 90;
      return (
        <g key={i}>
          <rect x={60} y={yy - 26} width={44} height={44} rx={8} fill="none" stroke={C.ink} strokeWidth={5} />
          <path d={`M 40 ${yy} L -100 ${yy}`} stroke={C.muted} strokeWidth={8} strokeLinecap="round" opacity={0.6} />
          <path d={`M 64 ${yy - 6} L 80 ${yy + 12} L 112 ${yy - 30}`} fill="none" stroke={C.green} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
        </g>
      );
    })}
  </g>
);

export const BubbleShape: React.FC<{ x: number; y: number; w: number; h: number; tail?: 'down' | 'left' | 'right' | 'none'; fill?: string; tailX?: number; scale?: number; rot?: number; o?: number }> = ({ x, y, w, h, tail = 'down', fill = C.red, tailX = 0, scale = 1, rot = 0, o = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={o}>
    <rect x={-w / 2 + 10} y={-h / 2 + 14} width={w} height={h} rx={Math.min(h * 0.42, 60)} fill="#000" opacity={0.25} />
    {tail === 'down' && <path d={`M ${tailX - 30} ${h / 2 - 6} L ${tailX + 10} ${h / 2 + 54} L ${tailX + 34} ${h / 2 - 6}`} fill={fill} stroke={C.ivory} strokeWidth={6} strokeLinejoin="round" />}
    {tail === 'left' && <path d={`M ${-w / 2 + 6} ${-20} L ${-w / 2 - 60} ${30} L ${-w / 2 + 6} ${26}`} fill={fill} stroke={C.ivory} strokeWidth={6} strokeLinejoin="round" />}
    {tail === 'right' && <path d={`M ${w / 2 - 6} ${-20} L ${w / 2 + 60} ${30} L ${w / 2 - 6} ${26}`} fill={fill} stroke={C.ivory} strokeWidth={6} strokeLinejoin="round" />}
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={Math.min(h * 0.42, 60)} fill={fill} stroke={C.ivory} strokeWidth={6} />
  </g>
);

export const MotionLines: React.FC<{ x: number; y: number; p: number; dir?: 1 | -1; color?: string }> = ({ x, y, p, dir = 1, color = C.ivory }) => (
  <g opacity={Math.max(0, 1 - p)}>
    {[-70, -25, 25, 70].map((dx, i) => (
      <path key={i} d={`M ${x + dx} ${y - dir * (10 + p * 60)} l ${dx * 0.12} ${-dir * 46}`} stroke={color} strokeWidth={7} strokeLinecap="round" />
    ))}
  </g>
);

export const Sparkle: React.FC<{ x: number; y: number; p: number; color?: string; s?: number }> = ({ x, y, p, color = C.amber, s = 1 }) => {
  if (p <= 0 || p >= 1) return null;
  const k = Math.sin(p * Math.PI) * s;
  return (
    <g transform={`translate(${x} ${y}) scale(${k}) rotate(${p * 90})`}>
      <path d="M 0 -40 L 9 -9 L 40 0 L 9 9 L 0 40 L -9 9 L -40 0 L -9 -9 Z" fill={color} stroke={C.ivory} strokeWidth={3} />
    </g>
  );
};

export const Dust: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <g opacity={1 - p}>
      {[-1, -0.4, 0.4, 1].map((d, i) => (
        <circle key={i} cx={x + d * (40 + p * 90)} cy={y - p * 30 - (i % 2) * 14} r={12 + p * 16} fill={C.ivory} opacity={0.35} />
      ))}
    </g>
  );
};

export const Scratch: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => (
  <g opacity={Math.min(1, p * 3) * (1 - Math.max(0, p - 0.7) / 0.3)}>
    {[-14, 0, 14].map((dx) => <path key={dx} d={`M ${x + dx} ${y} l ${dx * 0.2} ${40 * Math.min(1, p * 2)}`} stroke={C.ivory} strokeWidth={4} strokeLinecap="round" />)}
  </g>
);
