import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, INK, T, W, ease } from './draw';

// Props this reel adds to the shared kit. Same rules: ink line, flat colour, (0,0) = bottom centre unless "centred".
const s = { stroke: INK, strokeWidth: W, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** A stage spotlight falling on (0,0) from above; `h` is the cone height. */
export const Spotlight: React.FC<{ h?: number; w?: number }> = ({ h = 520, w = 200 }) => {
  const f = useCurrentFrame();
  return <g>
    <path d={`M-40 ${-h} L40 ${-h} L${w} 0 L${-w} 0 Z`} fill={C.yellow} opacity={0.22 + 0.04 * Math.sin(f / 9)} />
    <ellipse cx={0} cy={0} rx={w} ry={w * 0.16} fill={C.yellow} opacity={0.35} />
    <rect x={-50} y={-h - 50} width={100} height={60} rx={14} fill={C.black} {...s} />
  </g>;
};

/** centred — bursts of fireworks that bloom in a loop. */
export const Fireworks: React.FC<{ w?: number }> = ({ w = 360 }) => {
  const f = useCurrentFrame();
  return <g>{[[-w / 2, -40, C.red, 0], [w / 2, -80, C.blue, 14], [0, -150, C.gold, 7]].map(([x, y, c, ph], i) => {
    const k = ((f + (ph as number)) % 40) / 40;
    return <g key={i} transform={`translate(${x} ${y})`} opacity={1 - k}>
      {Array.from({ length: 10 }, (_, j) => { const a = (j / 10) * Math.PI * 2; const r = 20 + k * 80;
        return <path key={j} d={`M${Math.cos(a) * r * 0.5} ${Math.sin(a) * r * 0.5} L${Math.cos(a) * r} ${Math.sin(a) * r}`} stroke={c as string} strokeWidth={8} strokeLinecap="round" />; })}
    </g>;
  })}</g>;
};

/** Prison bars that drop in at `at` over whatever is behind them (w×h, bottom centre). */
export const Bars: React.FC<{ at: number; w?: number; h?: number }> = ({ at, w = 360, h = 520 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const y = ease(f - at, 0, 10, -h - 200, 0);
  return <g transform={`translate(0 ${y})`}>
    <rect x={-w / 2} y={-h} width={w} height={26} fill={C.greyDark} {...s} />
    <rect x={-w / 2} y={-26} width={w} height={26} fill={C.greyDark} {...s} />
    {Array.from({ length: 6 }, (_, i) => <rect key={i} x={-w / 2 + 14 + i * ((w - 40) / 5)} y={-h + 20} width={14} height={h - 40} fill={C.grey} {...s} />)}
  </g>;
};

/** centred */
export const Bulb: React.FC<{ on?: boolean }> = ({ on = true }) => {
  const f = useCurrentFrame();
  return <g>
    {on && Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 - Math.PI / 2; return <path key={i} d={`M${Math.cos(a) * 90} ${Math.sin(a) * 90 - 20} L${Math.cos(a) * (112 + 6 * Math.sin(f / 6))} ${Math.sin(a) * (112 + 6 * Math.sin(f / 6)) - 20}`} stroke={C.yellowDark} strokeWidth={8} strokeLinecap="round" />; })}
    <path d="M-30 40 Q-70 0 -60 -40 Q-50 -90 0 -92 Q50 -90 60 -40 Q70 0 30 40 Z" fill={on ? C.yellow : '#fff'} {...s} />
    <rect x={-30} y={40} width={60} height={40} rx={8} fill={C.grey} {...s} />
    <path d="M-30 54 L30 54 M-30 68 L30 68" stroke={INK} strokeWidth={4} />
  </g>;
};

/** centred — a contract: lines, a signature drawn from `sign`, a red seal. */
export const Contract: React.FC<{ sign?: number; title?: string }> = ({ sign, title = 'اتفاق' }) => {
  const f = useCurrentFrame();
  const k = sign === undefined ? 0 : ease(f - sign, 0, 20);
  return <g>
    <rect x={-130} y={-170} width={260} height={340} rx={10} fill="#fff" {...s} />
    <T y={-125} size={title.length > 8 ? 24 : 40}>{title}</T>
    {[-70, -35, 0, 35].map((y) => <path key={y} d={`M-95 ${y} L95 ${y}`} stroke={C.grey} strokeWidth={6} strokeLinecap="round" />)}
    <path d="M-90 110 q20 -30 40 0 t40 0 t40 -10" fill="none" stroke={C.blue} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
    {k > 0.9 && <g transform="translate(80 120)"><circle r={30} fill={C.red} {...s} /><path d="M-12 0 L-2 10 L14 -10" stroke="#fff" strokeWidth={6} fill="none" /></g>}
  </g>;
};

/** centred */
export const Lock: React.FC<{ c?: string }> = ({ c = C.gold }) => <g>
  <path d="M-50 -20 L-50 -70 Q-50 -120 0 -120 Q50 -120 50 -70 L50 -20" fill="none" stroke={INK} strokeWidth={22} />
  <path d="M-50 -20 L-50 -70 Q-50 -120 0 -120 Q50 -120 50 -70 L50 -20" fill="none" stroke={C.grey} strokeWidth={10} />
  <rect x={-80} y={-30} width={160} height={130} rx={18} fill={c} {...s} />
  <circle cy={20} r={14} fill={INK} /><rect x={-5} y={20} width={10} height={36} fill={INK} />
</g>;

/** centred — a megaphone with sound lines. */
export const Megaphone: React.FC = () => {
  const f = useCurrentFrame();
  return <g>
    <path d="M-110 -30 L-30 -30 L80 -100 L80 100 L-30 30 L-110 30 Z" fill={C.red} {...s} />
    <rect x={-140} y={-36} width={40} height={72} rx={8} fill={C.grey} {...s} />
    <path d="M-60 30 L-50 90 L-20 90 L-30 30" fill={C.greyDark} {...s} />
    {[0, 1, 2].map((i) => <path key={i} d={`M${110 + i * 30} -60 Q${140 + i * 30} 0 ${110 + i * 30} 60`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" opacity={(Math.sin(f / 5 - i) + 1) / 2} />)}
  </g>;
};

/** A plant in a pot that grows from `at` (bottom centre). */
export const Plant: React.FC<{ at?: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const g = at === undefined ? 1 : ease(f - at, 0, 40, 0.3, 1);
  return <g>
    <ellipse cx={0} cy={0} rx={90} ry={11} fill={C.shadow} />
    <g transform={`translate(0 -110) scale(${g})`}>
      <path d="M0 0 L0 -200" stroke={C.greenDark} strokeWidth={12} strokeLinecap="round" />
      {[[-1, -60], [1, -110], [-1, -160], [1, -200]].map(([k, y], i) => <path key={i} d={`M0 ${y} Q${k * 70} ${y - 40} ${k * 110} ${y - 10} Q${k * 60} ${y + 20} 0 ${y}`} fill={C.green} {...s} />)}
    </g>
    <path d="M-80 -120 L80 -120 L60 0 L-60 0 Z" fill={C.orange} {...s} />
    <rect x={-92} y={-140} width={184} height={30} rx={8} fill={C.orange} {...s} />
  </g>;
};

/** centred */
export const Flask: React.FC = () => <g>
  <path d="M-30 -130 L-30 -50 L-100 80 Q-108 100 -86 100 L86 100 Q108 100 100 80 L30 -50 L30 -130 Z" fill="#fff" {...s} />
  <path d="M-70 30 L70 30 L100 80 Q108 100 86 100 L-86 100 Q-108 100 -100 80 Z" fill={C.teal} />
  <path d="M-30 -130 L-30 -50 L-100 80 Q-108 100 -86 100 L86 100 Q108 100 100 80 L30 -50 L30 -130 Z" fill="none" {...s} />
  <rect x={-44} y={-150} width={88} height={24} rx={8} fill={C.grey} {...s} />
  {[[-20, 60], [30, 70], [0, 45]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={8} fill="#fff" opacity={0.8} />)}
</g>;

/** centred — a warning triangle. */
export const Warning: React.FC = () => <g>
  <path d="M0 -130 L130 100 L-130 100 Z" fill={C.yellow} {...s} strokeWidth={10} />
  <rect x={-12} y={-50} width={24} height={90} rx={10} fill={INK} /><circle cy={70} r={14} fill={INK} />
</g>;

/** centred — a row of stars (credit). */
export const Stars: React.FC<{ n?: number }> = ({ n = 3 }) => <g>{Array.from({ length: n }, (_, i) => {
  const x = (i - (n - 1) / 2) * 90;
  const pts = Array.from({ length: 10 }, (_, j) => { const a = (j / 10) * Math.PI * 2 - Math.PI / 2; const r = j % 2 ? 18 : 40; return `${x + Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
  return <polygon key={i} points={pts} fill={C.gold} {...s} />;
})}</g>;

/** centred — a trust meter: n bars that light one by one at the given frames. */
export const TrustBars: React.FC<{ at: number[] }> = ({ at }) => {
  const f = useCurrentFrame();
  return <g>{at.map((a, i) => <rect key={i} x={150 - i * 90} y={-40 - i * 40} width={70} height={80 + i * 40} rx={10}
    fill={f >= a ? [C.red, C.orange, C.accent, C.green, C.greenDark][i % 5] : '#fff'} {...s} />)}</g>;
};

/** A villa with a party (bottom centre). */
export const Chateau: React.FC = () => <g>
  <ellipse cx={0} cy={0} rx={300} ry={30} fill={C.shadow} />
  <rect x={-260} y={-220} width={520} height={220} fill={C.cream} {...s} />
  <path d="M-280 -210 L0 -330 L280 -210 Z" fill={C.blueDark} {...s} />
  <path d="M-80 -330 Q0 -420 80 -330" fill={C.blueDark} {...s} />
  {[-200, -110, 110, 200].map((x) => <rect key={x} x={x - 26} y={-180} width={52} height={80} rx={26} fill={C.sky} {...s} />)}
  <path d="M-46 0 L-46 -110 Q0 -150 46 -110 L46 0 Z" fill={C.woodDark} {...s} />
</g>;
