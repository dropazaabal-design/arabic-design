import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, INK, T, W, ease } from './draw';

// Objects, drawn with the same ink line and flat colour + one shade. Unless noted, (0,0) is the bottom centre
// (where the object stands); icons marked "centred" sit on (0,0).
const s = { stroke: INK, strokeWidth: W, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const thin = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const Sh: React.FC<{ w: number }> = ({ w }) => <ellipse cx={0} cy={0} rx={w} ry={w * 0.12} fill={C.shadow} />;

export const Book: React.FC<{ title?: string; c?: string }> = ({ title = 'فن الحرب', c = C.red }) => <g>
  <Sh w={160} />
  <path d="M-120 -10 L-120 -330 L110 -330 L130 -310 L130 -10 Z" fill={C.cream} {...s} />
  <rect x={-140} y={-340} width={240} height={330} rx={10} fill={c} {...s} />
  <rect x={-140} y={-340} width={36} height={330} rx={8} fill={C.redDark} {...s} />
  <rect x={-96} y={-300} width={182} height={70} rx={8} fill={C.cream} {...s} />
  <T x={-5} y={-263} size={title.length > 4 ? 36 : 44}>{title}</T>
  <circle cx={-5} cy={-140} r={52} fill="none" stroke={C.gold} strokeWidth={8} />
  <path d="M-30 -165 L20 -115 M20 -165 L-30 -115" stroke={C.gold} strokeWidth={8} strokeLinecap="round" />
</g>;

export const Scroll: React.FC<{ lines?: number }> = ({ lines = 5 }) => <g>
  <rect x={-150} y={-260} width={300} height={240} fill={C.cream} {...s} />
  {Array.from({ length: lines }, (_, i) => <path key={i} d={`M${-110 + (i % 2) * 20} ${-220 + i * 40} L110 ${-220 + i * 40}`} {...thin} stroke={C.brown} />)}
  <rect x={-170} y={-280} width={340} height={30} rx={15} fill={C.wood} {...s} />
  <rect x={-170} y={-30} width={340} height={30} rx={15} fill={C.wood} {...s} />
</g>;

export const Shop: React.FC<{ open?: boolean; closed?: boolean; c?: string; sign?: string; w?: number }> = ({ open, closed, c = C.blue, sign, w = 360 }) => {
  const h = 380, x0 = -w / 2;
  return <g>
    <Sh w={w * 0.6} />
    <rect x={x0} y={-h} width={w} height={h} fill={C.paper} {...s} />
    <rect x={x0 - 14} y={-h - 40} width={w + 28} height={50} rx={6} fill={c} {...s} />
    {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${x0 - 14 + (i * (w + 28)) / 6} ${-h + 10} q${(w + 28) / 12} 40 ${(w + 28) / 6} 0`} fill={i % 2 ? '#fff' : c} {...s} />)}
    <rect x={x0 + 30} y={-200} width={w * 0.42} height={130} fill={closed ? C.shade : C.sky} {...s} />
    <rect x={x0 + w - 130} y={-230} width={100} height={230} fill={C.wood} {...s} />
    <circle cx={x0 + w - 50} cy={-115} r={7} fill={INK} />
    {sign && <g transform={`translate(${x0 + w / 2} ${-h - 90})`}><rect x={-110} y={-36} width={220} height={66} rx={10} fill="#fff" {...s} /><T y={0} size={40}>{sign}</T></g>}
    {open && <g transform={`translate(${x0 + w - 80} ${-280})`}><rect x={-60} y={-26} width={120} height={52} rx={8} fill={C.green} {...s} /><T y={2} size={32} color="#fff">مفتوح</T></g>}
    {closed && <g>
      <path d={`M${x0 + 10} ${-260} L${x0 + w - 10} ${-120}`} stroke={C.woodDark} strokeWidth={30} strokeLinecap="round" />
      <path d={`M${x0 + 10} ${-120} L${x0 + w - 10} ${-260}`} stroke={C.woodDark} strokeWidth={30} strokeLinecap="round" />
      <g transform={`translate(0 ${-300}) rotate(-6)`}><rect x={-80} y={-28} width={160} height={56} rx={8} fill={C.red} {...s} /><T y={2} size={34} color="#fff">مغلق</T></g>
    </g>}
  </g>;
};

/** centred */
export const Coins: React.FC<{ n?: number }> = ({ n = 3 }) => <g>
  {Array.from({ length: n }, (_, i) => <g key={i}><ellipse cx={0} cy={-i * 18} rx={46} ry={16} fill={C.gold} {...s} /></g>)}
  <path d={`M-18 ${-(n - 1) * 18} L18 ${-(n - 1) * 18}`} stroke={C.yellowDark} strokeWidth={5} />
</g>;

export const MoneyBag: React.FC<{ label?: string }> = ({ label }) => <g>
  <Sh w={70} />
  <path d="M-70 -10 Q-90 -120 -30 -150 L-40 -180 L40 -180 L30 -150 Q90 -120 70 -10 Z" fill={C.cream} {...s} />
  <path d="M-36 -165 L36 -165" {...s} />
  <T y={-80} size={60} color={C.greenDark}>{label ?? '$'}</T>
</g>;

/** centred */
export const Checklist: React.FC<{ items: string[]; at?: number[]; checks?: number[]; w?: number }> = ({ items, at = [], checks = [], w = 360 }) => {
  const f = useCurrentFrame();
  const h = 120 + items.length * 70;
  return <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={14} fill={C.wood} {...s} />
    <rect x={-w / 2 + 22} y={-h / 2 + 34} width={w - 44} height={h - 56} rx={6} fill="#fff" {...s} />
    <rect x={-50} y={-h / 2 - 14} width={100} height={40} rx={8} fill={C.stone} {...s} />
    {items.map((it, i) => (at[i] === undefined || f >= at[i]) && <g key={i} transform={`translate(0 ${-h / 2 + 90 + i * 70})`}>
      <rect x={w / 2 - 82} y={-20} width={40} height={40} rx={6} fill="#fff" {...thin} />
      {checks[i] !== undefined && f >= checks[i] && <path d={`M${w / 2 - 74} 0 L${w / 2 - 64} 12 L${w / 2 - 46} -14`} stroke={C.green} strokeWidth={7} fill="none" strokeLinecap="round" />}
      <text x={w / 2 - 100} y={2} textAnchor="end" dominantBaseline="middle" direction="rtl" fontFamily="Tajawal" fontWeight={800} fontSize={36} fill={INK}>{it}</text>
    </g>)}
  </g>;
};

export const Desk: React.FC = () => <g>
  <Sh w={200} />
  <rect x={-180} y={-190} width={360} height={30} rx={6} fill={C.wood} {...s} />
  <path d="M-160 -160 L-160 0 M160 -160 L160 0" stroke={INK} strokeWidth={14} strokeLinecap="round" />
  <rect x={-120} y={-215} width={110} height={26} fill="#fff" {...thin} transform="rotate(-6 -65 -200)" />
  <rect x={20} y={-225} width={90} height={36} fill={C.sky} {...thin} />
</g>;

/** centred — a big tray of kabsa with steam. */
export const Kabsa: React.FC = () => {
  const f = useCurrentFrame();
  return <g>
    {[-40, 0, 40].map((x, i) => <path key={x} d={`M${x} -90 q-14 -24 0 -48 q14 -24 0 -48`} fill="none" stroke={C.grey} strokeWidth={6} strokeLinecap="round" opacity={0.5 + 0.4 * Math.sin(f / 10 + i)} />)}
    <ellipse cx={0} cy={20} rx={170} ry={48} fill={C.stone} {...s} />
    <path d="M-140 10 Q-120 -80 0 -86 Q120 -80 140 10 Z" fill={C.yellow} {...s} />
    {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${-110 + (i % 8) * 30} ${-20 - Math.floor(i / 8) * 26} l10 -4`} stroke={C.yellowDark} strokeWidth={4} strokeLinecap="round" />)}
    <path d="M-30 -60 Q-60 -120 -10 -130 Q40 -128 30 -80 Q20 -50 -30 -60 Z" fill={C.orange} {...s} />
    <path d="M40 -70 l40 -40 m-6 -10 a12 12 0 1 1 18 14" fill="#fff" {...s} />
    <circle cx={-70} cy={-30} r={8} fill={C.green} {...thin} /><circle cx={80} cy={-24} r={8} fill={C.redDark} {...thin} />
  </g>;
};

/** centred */
export const Clock: React.FC<{ r?: number; h?: number; m?: number; spin?: number }> = ({ r = 80, h = 3, m = 0, spin = 0 }) => {
  const f = useCurrentFrame();
  const ma = ((m / 60) * 360 + spin * f * 6) * (Math.PI / 180), ha = ((h / 12) * 360 + spin * f * 0.5) * (Math.PI / 180);
  return <g>
    <circle r={r + 10} fill={C.red} {...s} />
    <circle r={r} fill="#fff" {...s} />
    {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <path key={i} d={`M${Math.sin(a) * r * 0.8} ${-Math.cos(a) * r * 0.8} L${Math.sin(a) * r * 0.9} ${-Math.cos(a) * r * 0.9}`} {...thin} />; })}
    <path d={`M0 0 L${Math.sin(ha) * r * 0.5} ${-Math.cos(ha) * r * 0.5}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
    <path d={`M0 0 L${Math.sin(ma) * r * 0.75} ${-Math.cos(ma) * r * 0.75}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <circle r={8} fill={INK} />
  </g>;
};

/** centred */
export const Calendar: React.FC<{ top?: string; big: string; c?: string }> = ({ top, big, c = C.red }) => <g>
  <rect x={-110} y={-120} width={220} height={240} rx={16} fill="#fff" {...s} />
  <path d="M-110 -50 L-110 -104 Q-110 -120 -94 -120 L94 -120 Q110 -120 110 -104 L110 -50 Z" fill={c} {...s} />
  {top && <T y={-84} size={38} color="#fff">{top}</T>}
  <T y={36} size={110}>{big}</T>
  <circle cx={-60} cy={-120} r={10} fill={C.grey} {...thin} /><circle cx={60} cy={-120} r={10} fill={C.grey} {...thin} />
</g>;

export const Trophy: React.FC<{ cracked?: boolean }> = ({ cracked }) => <g>
  <Sh w={80} />
  <rect x={-60} y={-40} width={120} height={40} rx={4} fill={C.brown} {...s} />
  <rect x={-18} y={-90} width={36} height={50} fill={C.gold} {...s} />
  <path d="M-80 -230 L80 -230 Q80 -110 0 -96 Q-80 -110 -80 -230 Z" fill={C.gold} {...s} />
  <path d="M-80 -210 Q-130 -210 -120 -160 Q-110 -130 -66 -136 M80 -210 Q130 -210 120 -160 Q110 -130 66 -136" fill="none" {...s} />
  <path d="M-40 -210 Q-44 -150 -20 -120" stroke="#fff" strokeWidth={8} fill="none" opacity={0.6} strokeLinecap="round" />
  {cracked && <path d="M10 -230 L-6 -190 L18 -160 L-4 -120" stroke={INK} strokeWidth={6} fill="none" />}
</g>;

/** centred */
export const Heart: React.FC<{ r?: number; c?: string; broken?: boolean }> = ({ r = 1, c = C.red, broken }) => <g transform={`scale(${r})`}>
  <path d="M0 70 C-120 -10 -90 -110 -30 -100 C-10 -96 0 -80 0 -66 C0 -80 10 -96 30 -100 C90 -110 120 -10 0 70 Z" fill={c} {...s} />
  <path d="M-50 -70 Q-70 -50 -64 -26" stroke="#fff" strokeWidth={8} fill="none" opacity={0.6} strokeLinecap="round" />
  {broken && <path d="M0 -66 L-14 -30 L12 -4 L-8 30 L0 70" stroke="#fff" strokeWidth={12} fill="none" />}
  {broken && <path d="M0 -66 L-14 -30 L12 -4 L-8 30 L0 70" stroke={INK} strokeWidth={5} fill="none" />}
</g>;

/** centred */
export const Ring: React.FC = () => <g>
  <circle cx={0} cy={20} r={56} fill="none" stroke={INK} strokeWidth={26} />
  <circle cx={0} cy={20} r={56} fill="none" stroke={C.gold} strokeWidth={14} />
  <path d="M-26 -50 L0 -80 L26 -50 L0 -30 Z" fill={C.sky} {...s} />
</g>;

/** centred */
export const Question: React.FC<{ c?: string; size?: number }> = ({ c = C.yellow, size = 180 }) =>
  <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontFamily="Tajawal" fontWeight={800} fontSize={size} fill={c} stroke={INK} strokeWidth={size * 0.06} paintOrder="stroke">؟</text>;
export const Bang: React.FC<{ c?: string; size?: number }> = ({ c = C.red, size = 180 }) =>
  <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontFamily="Tajawal" fontWeight={800} fontSize={size} fill={c} stroke={INK} strokeWidth={size * 0.06} paintOrder="stroke">!</text>;

export const Ship: React.FC<{ tilt?: number; sail?: boolean; c?: string }> = ({ tilt = 0, sail = true, c = C.brown }) => <g transform={`rotate(${tilt})`}>
  <path d="M-220 -80 L220 -80 L170 0 L-170 0 Z" fill={c} {...s} />
  <path d="M-200 -50 L200 -50" stroke={C.brownDark} strokeWidth={6} />
  <path d="M0 -80 L0 -400 M-110 -80 L-110 -320" {...s} strokeWidth={10} />
  {sail && <><path d="M8 -390 Q120 -300 8 -200 Z" fill="#fff" {...s} /><path d="M-102 -310 Q-20 -250 -102 -170 Z" fill="#fff" {...s} /></>}
  {!sail && <path d="M0 -300 L60 -250 M-110 -240 L-160 -200" {...s} />}
  <path d="M0 -400 L60 -380 L0 -360" fill={C.red} {...s} />
</g>;

export const Ice: React.FC<{ w?: number }> = ({ w = 1 }) => <g transform={`scale(${w} 1)`}>
  <path d="M-300 0 L-270 -110 L-200 -150 L-170 -60 L-120 -40 L-100 0 Z" fill="#E8F4FA" {...s} />
  <path d="M100 0 L130 -70 L200 -160 L260 -120 L300 0 Z" fill="#E8F4FA" {...s} />
  <path d="M-250 -90 L-220 -120 M170 -110 L220 -130" stroke={C.sky} strokeWidth={6} strokeLinecap="round" />
</g>;

/** centred */
export const Cloud: React.FC<{ storm?: boolean; w?: number }> = ({ storm, w = 1 }) => {
  const f = useCurrentFrame();
  return <g transform={`scale(${w})`}>
    {storm && Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${-90 + i * 36} ${50 + ((f * 6 + i * 23) % 80)} l-8 22`} stroke={C.water} strokeWidth={6} strokeLinecap="round" />)}
    <path d="M-120 40 Q-170 40 -160 -10 Q-150 -50 -100 -40 Q-90 -100 -20 -96 Q40 -130 80 -70 Q150 -80 150 -10 Q160 40 110 40 Z" fill={storm ? C.stone : '#fff'} {...s} />
    {storm && <path d="M10 40 L-20 100 L10 100 L-14 160" stroke={C.yellow} strokeWidth={10} fill="none" strokeLinejoin="round" />}
  </g>;
};
/** centred */
export const Sun: React.FC<{ r?: number }> = ({ r = 60 }) => {
  const f = useCurrentFrame();
  return <g transform={`rotate(${f * 0.4})`}>
    {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return <path key={i} d={`M${Math.cos(a) * (r + 18)} ${Math.sin(a) * (r + 18)} L${Math.cos(a) * (r + 46)} ${Math.sin(a) * (r + 46)}`} stroke={C.yellowDark} strokeWidth={10} strokeLinecap="round" />; })}
    <circle r={r} fill={C.yellow} {...s} />
  </g>;
};

/** Two cliffs with a narrow pass between them, ground at 0; the gap is centred at x=0. */
export const Pass: React.FC<{ gap?: number }> = ({ gap = 120 }) => <g>
  <path d={`M-700 0 L-640 -420 L-520 -520 L-380 -460 L-260 -540 L${-gap / 2 - 20} -380 L${-gap / 2} 0 Z`} fill={C.stone} {...s} />
  <path d={`M700 0 L660 -380 L520 -500 L380 -430 L260 -520 L${gap / 2 + 20} -360 L${gap / 2} 0 Z`} fill={C.stone} {...s} />
  <path d="M-560 -420 L-500 -360 L-420 -400 M520 -400 L460 -340 L380 -380" fill="none" stroke={C.stoneDark} strokeWidth={8} strokeLinecap="round" />
  <path d={`M-700 0 L700 0`} {...s} />
</g>;

export const Cup: React.FC<{ c?: string }> = ({ c = C.red }) => {
  const f = useCurrentFrame();
  return <g>
    <path d={`M-10 -110 q-12 -20 0 -40 q12 -20 0 -40`} fill="none" stroke={C.grey} strokeWidth={5} strokeLinecap="round" opacity={0.6 + 0.3 * Math.sin(f / 8)} />
    <path d="M-40 -90 L40 -90 L32 -6 Q30 0 22 0 L-22 0 Q-30 0 -32 -6 Z" fill={c} {...s} />
    <path d="M40 -70 Q66 -70 62 -46 Q58 -26 36 -30" fill="none" {...s} />
  </g>;
};

export const Table: React.FC<{ w?: number; c?: string }> = ({ w = 260, c = C.wood }) => <g>
  <Sh w={w * 0.6} />
  <rect x={-w / 2} y={-170} width={w} height={26} rx={8} fill={c} {...s} />
  <path d={`M${-w / 2 + 30} -144 L${-w / 2 + 30} 0 M${w / 2 - 30} -144 L${w / 2 - 30} 0`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
</g>;

/** centred — a balance with something in each pan. tip: -1..1 (positive drops the right pan). */
export const Scale: React.FC<{ tip?: number; left?: React.ReactNode; right?: React.ReactNode }> = ({ tip = 0, left, right }) => {
  const a = tip * 14, rad = (a * Math.PI) / 180;
  const lx = -170 * Math.cos(rad), ly = -170 * Math.sin(rad) - 150, rx = 170 * Math.cos(rad), ry = 170 * Math.sin(rad) - 150;
  return <g>
    <path d="M-80 180 L80 180 L40 150 L-40 150 Z" fill={C.brown} {...s} />
    <path d="M0 150 L0 -150" stroke={INK} strokeWidth={14} strokeLinecap="round" />
    <path d={`M${lx} ${ly} L${rx} ${ry}`} stroke={INK} strokeWidth={12} strokeLinecap="round" />
    {[[lx, ly, left], [rx, ry, right]].map(([x, y, n], i) => <g key={i} transform={`translate(${x} ${y})`}>
      <path d="M0 0 L-60 90 M0 0 L60 90" {...thin} />
      <path d="M-80 90 L80 90 Q70 130 0 130 Q-70 130 -80 90 Z" fill={C.gold} {...s} />
      <g transform="translate(0 80)">{n as React.ReactNode}</g>
    </g>)}
    <circle cy={-150} r={14} fill={C.gold} {...s} />
  </g>;
};

export const Sofa: React.FC<{ c?: string }> = ({ c = C.purple }) => <g>
  <Sh w={220} />
  <rect x={-200} y={-200} width={400} height={110} rx={30} fill={c} {...s} />
  <rect x={-220} y={-120} width={440} height={90} rx={24} fill={c} {...s} />
  <rect x={-240} y={-160} width={60} height={140} rx={24} fill={c} {...s} />
  <rect x={180} y={-160} width={60} height={140} rx={24} fill={c} {...s} />
  <path d="M-190 -30 L-190 0 M190 -30 L190 0" stroke={INK} strokeWidth={12} strokeLinecap="round" />
</g>;

export const GymBag: React.FC = () => <g>
  <Sh w={110} />
  <path d="M-60 -110 Q0 -190 60 -110" fill="none" stroke={INK} strokeWidth={12} />
  <rect x={-120} y={-120} width={240} height={120} rx={50} fill={C.teal} {...s} />
  <path d="M-80 -60 L80 -60" stroke={INK} strokeWidth={5} strokeDasharray="12 10" />
</g>;
/** centred */
export const Dumbbell: React.FC = () => <g>
  <rect x={-90} y={-8} width={180} height={16} rx={6} fill={C.grey} {...s} />
  {[-1, 1].map((k) => <g key={k}><rect x={k * 90 - 18} y={-46} width={36} height={92} rx={8} fill={C.black} {...s} /><rect x={k * 60 - 12} y={-34} width={24} height={68} rx={6} fill={C.black} {...s} /></g>)}
</g>;

export const WoodHorse: React.FC = () => <g>
  <Sh w={220} />
  <rect x={-220} y={-80} width={440} height={36} rx={6} fill={C.woodDark} {...s} />
  {[-170, -60, 60, 170].map((x) => <g key={x}><circle cx={x} cy={-34} r={34} fill={C.wood} {...s} /><circle cx={x} cy={-34} r={8} fill={INK} /></g>)}
  {[-130, -50, 70, 150].map((x) => <rect key={x} x={x - 18} y={-250} width={36} height={180} fill={C.wood} {...s} />)}
  <path d="M-180 -390 Q-190 -250 -160 -230 L180 -230 Q200 -280 170 -390 Z" fill={C.wood} {...s} />
  <path d="M120 -380 L170 -560 L250 -600 L290 -540 L220 -500 L200 -380 Z" fill={C.wood} {...s} />
  <path d="M175 -560 L160 -620 L200 -580" fill={C.wood} {...s} />
  <circle cx={242} cy={-560} r={8} fill={INK} />
  <path d="M130 -480 Q90 -470 110 -420 M150 -520 Q110 -500 120 -460" stroke={C.brownDark} strokeWidth={10} fill="none" strokeLinecap="round" />
  <path d="M-120 -340 L60 -340 M-120 -290 L120 -290" stroke={C.woodDark} strokeWidth={5} />
  <rect x={-40} y={-370} width={80} height={60} fill={C.woodDark} {...thin} />
</g>;

/** City wall with two towers and a gate, gate centred at x=0. `flag` raises a white flag. */
export const CityGate: React.FC<{ flag?: number; c?: string }> = ({ flag, c = C.stone }) => {
  const f = useCurrentFrame();
  const fy = flag === undefined ? null : ease(f - flag, 0, 30, 0, 1);
  return <g>
    <Sh w={380} />
    <rect x={-340} y={-300} width={680} height={300} fill={c} {...s} />
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={-340 + i * 80} y={-336} width={44} height={40} fill={c} {...s} />)}
    {[-1, 1].map((k) => <g key={k}><rect x={k * 340 - 70} y={-420} width={140} height={420} fill={c} {...s} />
      {[0, 1, 2].map((i) => <rect key={i} x={k * 340 - 70 + i * 52} y={-454} width={36} height={38} fill={c} {...s} />)}
      <rect x={k * 340 - 14} y={-340} width={28} height={50} rx={12} fill={INK} /></g>)}
    <path d="M-90 0 L-90 -150 Q0 -240 90 -150 L90 0 Z" fill={C.woodDark} {...s} />
    <path d="M-30 -10 L-30 -190 M30 -10 L30 -190" stroke={INK} strokeWidth={5} />
    {[-240, -160, 160, 240].map((x) => <path key={x} d={`M${x} -240 l20 -10 M${x} -120 l-16 8`} stroke={C.stoneDark} strokeWidth={6} strokeLinecap="round" />)}
    {fy !== null && <g transform={`translate(0 ${-300 - 200 * fy})`}>
      <path d="M0 0 L0 220" stroke={INK} strokeWidth={8} />
      <path d={`M0 0 Q60 ${-10 + Math.sin(f / 6) * 10} 120 10 L120 90 Q60 ${70 + Math.sin(f / 6) * 10} 0 80 Z`} fill="#fff" {...s} />
    </g>}
  </g>;
};

/** centred */
export const Mirror: React.FC = () => <g>
  <ellipse rx={90} ry={120} fill={C.wood} {...s} />
  <ellipse rx={70} ry={100} fill={C.sky} {...s} />
  <path d="M-40 -50 L-10 -80 M-40 -10 L20 -70" stroke="#fff" strokeWidth={10} strokeLinecap="round" />
  <path d="M0 120 L0 200 M-50 200 L50 200" stroke={INK} strokeWidth={14} strokeLinecap="round" />
</g>;
/** centred */
export const Spyglass: React.FC = () => <g transform="rotate(-20)">
  <rect x={-140} y={-26} width={120} height={52} rx={8} fill={C.brown} {...s} />
  <rect x={-30} y={-36} width={110} height={72} rx={8} fill={C.gold} {...s} />
  <rect x={70} y={-46} width={70} height={92} rx={10} fill={C.brown} {...s} />
  <ellipse cx={140} cy={0} rx={10} ry={42} fill={C.sky} {...s} />
</g>;
/** centred */
export const Binoculars: React.FC = () => <g>
  {[-1, 1].map((k) => <g key={k}><rect x={k * 55 - 40} y={-70} width={80} height={130} rx={30} fill={C.black} {...s} /><circle cx={k * 55} cy={60} r={36} fill={C.sky} {...s} /></g>)}
  <rect x={-20} y={-30} width={40} height={40} fill={C.grey} {...s} />
</g>;

/** centred — a counter that runs up from `from` to `to` between frames a..b. */
export const Meter: React.FC<{ a: number; b: number; from?: number; to: number; unit?: string; c?: string }> = ({ a, b, from = 0, to, unit = '', c = C.black }) => {
  const f = useCurrentFrame();
  const v = Math.round(ease(f, a, b, from, to, (x) => x));
  return <g>
    <rect x={-190} y={-90} width={380} height={180} rx={24} fill={c} {...s} />
    <rect x={-160} y={-60} width={320} height={110} rx={10} fill="#0F2A1A" {...s} />
    <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontFamily="Tajawal" fontWeight={800} fontSize={84} fill="#5CFF8A" direction="rtl">{v.toLocaleString('en-US')}{unit}</text>
  </g>;
};

export const Temple: React.FC<{ crack?: number }> = ({ crack }) => {
  const f = useCurrentFrame();
  const k = crack === undefined ? 0 : ease(f - crack, 0, 30);
  return <g>
    <Sh w={260} />
    <rect x={-240} y={-40} width={480} height={40} fill="#fff" {...s} />
    <rect x={-220} y={-70} width={440} height={30} fill="#fff" {...s} />
    {[-170, -85, 0, 85, 170].map((x, i) => <g key={x} transform={`rotate(${k * (i - 2) * 3} ${x} -70)`}><rect x={x - 22} y={-300} width={44} height={230} fill="#fff" {...s} />
      <path d={`M${x - 8} -290 L${x - 8} -80 M${x + 8} -290 L${x + 8} -80`} stroke={C.shade} strokeWidth={4} /></g>)}
    <path d={`M-250 -300 L250 -300 L0 ${-430 + k * 30} Z`} fill="#fff" {...s} transform={`rotate(${k * -4})`} />
    {k > 0.2 && <path d="M-60 -330 L-30 -380 L-50 -400" stroke={INK} strokeWidth={5} fill="none" />}
  </g>;
};

export const House: React.FC<{ c?: string; roof?: string }> = ({ c = C.cream, roof = C.red }) => <g>
  <Sh w={200} />
  <rect x={-160} y={-230} width={320} height={230} fill={c} {...s} />
  <path d="M-200 -220 L0 -380 L200 -220 Z" fill={roof} {...s} />
  <rect x={-40} y={-120} width={80} height={120} fill={C.wood} {...s} />
  <rect x={-130} y={-190} width={70} height={60} fill={C.sky} {...s} />
  <rect x={60} y={-190} width={70} height={60} fill={C.sky} {...s} />
  <path d="M-95 -190 L-95 -130 M95 -190 L95 -130" {...thin} />
</g>;

export const Briefcase: React.FC<{ c?: string; label?: string }> = ({ c = C.brown, label }) => <g>
  <path d="M-30 -130 L-30 -150 Q-30 -160 -20 -160 L20 -160 Q30 -160 30 -150 L30 -130" fill="none" {...s} />
  <rect x={-100} y={-130} width={200} height={130} rx={14} fill={c} {...s} />
  <path d="M-100 -80 L100 -80" {...thin} />
  <rect x={-16} y={-92} width={32} height={24} rx={4} fill={C.gold} {...thin} />
  {label && <g transform="translate(0 -36) rotate(-8)"><rect x={-70} y={-22} width={140} height={44} rx={4} fill="#fff" stroke={C.red} strokeWidth={5} /><T size={30} color={C.red}>{label}</T></g>}
</g>;

/** Two bars growing (left, right) from 0 to their heights between a..b. Base at 0. */
export const Bars: React.FC<{ a: number; b: number; h1: number; h2: number; l1: string; l2: string; c1?: string; c2?: string }> = ({ a, b, h1, h2, l1, l2, c1 = C.green, c2 = C.red }) => {
  const f = useCurrentFrame();
  const k1 = ease(f, a, a + 20), k2 = ease(f, b, b + 30);
  return <g>
    <path d="M-260 0 L260 0" {...s} />
    <rect x={60} y={-h1 * k1} width={140} height={h1 * k1} fill={c1} {...s} />
    <rect x={-200} y={-h2 * k2} width={140} height={h2 * k2} fill={c2} {...s} />
    <T x={130} y={50} size={38}>{l1}</T><T x={-130} y={50} size={38}>{l2}</T>
  </g>;
};

/** centred */
export const Ear: React.FC = () => <g>
  <path d="M-30 80 Q-80 60 -60 -10 Q-50 -90 20 -90 Q90 -86 80 -10 Q74 40 30 60 Q10 70 10 100 Q6 130 -30 80 Z" fill="#fff" {...s} />
  <path d="M-10 20 Q-20 -40 20 -40 Q50 -36 40 0" fill="none" {...thin} />
</g>;

/** centred */
export const Notebook: React.FC = () => <g>
  <rect x={-80} y={-100} width={160} height={200} rx={10} fill={C.yellow} {...s} />
  {[-50, -10, 30, 70].map((y) => <path key={y} d={`M-50 ${y} L50 ${y}`} {...thin} />)}
  {[-70, -30, 10, 50].map((y) => <circle key={y} cx={-80} cy={y} r={9} fill="#fff" {...thin} />)}
</g>;

/** A horse with a rider standing in (Mini drawn by the caller via children). */
export const Horse: React.FC<{ c?: string; children?: React.ReactNode; gallop?: boolean }> = ({ c = C.brown, children, gallop }) => {
  const f = useCurrentFrame();
  const g = gallop ? Math.sin(f / 4) * 14 : 0;
  return <g>
    <Sh w={170} />
    <path d={`M-120 -150 L${-140 + g} 0 M-80 -150 L${-70 - g} 0 M80 -150 L${100 + g} 0 M120 -150 L${130 - g} 0`} stroke={INK} strokeWidth={24} strokeLinecap="round" />
    <path d={`M-120 -150 L${-140 + g} 0 M-80 -150 L${-70 - g} 0 M80 -150 L${100 + g} 0 M120 -150 L${130 - g} 0`} stroke={c} strokeWidth={13} strokeLinecap="round" />
    <path d="M-170 -240 Q-180 -150 -120 -140 L130 -140 Q180 -160 170 -240 Q0 -270 -170 -240 Z" fill={c} {...s} />
    <path d="M130 -230 L190 -330 L250 -310 L270 -260 L210 -250 L170 -200 Z" fill={c} {...s} />
    <path d="M-170 -230 Q-230 -200 -220 -120" fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
    <path d="M-170 -230 Q-230 -200 -220 -120" fill="none" stroke={C.black} strokeWidth={12} strokeLinecap="round" />
    <circle cx={228} cy={-300} r={7} fill={INK} />
    <g transform="translate(0 -170)">{children}</g>
  </g>;
};

/** centred */
export const Flag: React.FC<{ c?: string; label?: string }> = ({ c = C.red, label }) => {
  const f = useCurrentFrame();
  const w = Math.sin(f / 7) * 10;
  return <g>
    <path d="M0 120 L0 -140" stroke={INK} strokeWidth={10} strokeLinecap="round" />
    <path d={`M0 -140 Q60 ${-160 + w} 140 -140 L140 -50 Q60 ${-70 + w} 0 -50 Z`} fill={c} {...s} />
    {label && <T x={70} y={-95} size={34} color="#fff">{label}</T>}
  </g>;
};

/** centred */
export const Crumpled: React.FC = () => <path d="M-70 -50 L-30 -80 L10 -60 L60 -76 L80 -20 L60 30 L76 66 L20 80 L-20 60 L-70 76 L-80 20 L-60 -10 Z M-30 -80 L-10 -20 L60 30 M-80 20 L-10 -20 L20 80" fill="#fff" {...s} />;
/** centred */
export const ChainCut: React.FC = () => <g>
  <rect x={-150} y={-30} width={100} height={60} rx={30} fill="none" stroke={INK} strokeWidth={20} /><rect x={-150} y={-30} width={100} height={60} rx={30} fill="none" stroke={C.grey} strokeWidth={10} />
  <rect x={50} y={-30} width={100} height={60} rx={30} fill="none" stroke={INK} strokeWidth={20} /><rect x={50} y={-30} width={100} height={60} rx={30} fill="none" stroke={C.grey} strokeWidth={10} />
  <path d="M-40 -10 L-10 10 M40 -10 L10 10" stroke={C.grey} strokeWidth={12} strokeLinecap="round" />
  <path d="M-20 -60 L20 60" stroke={C.red} strokeWidth={10} strokeLinecap="round" strokeDasharray="10 14" />
</g>;
/** centred */
export const Swords: React.FC = () => <g>
  {[-1, 1].map((k) => <g key={k} transform={`rotate(${k * 40})`}>
    <path d="M0 -120 L14 -100 L14 60 L-14 60 L-14 -100 Z" fill="#E6EEF2" {...s} />
    <rect x={-40} y={60} width={80} height={18} rx={6} fill={C.gold} {...s} />
    <rect x={-10} y={78} width={20} height={50} fill={C.brown} {...s} />
  </g>)}
</g>;

export const Castle: React.FC<{ c?: string; w?: number }> = ({ c = C.stone, w = 1 }) => <g transform={`scale(${w} 1)`}>
  <Sh w={240} />
  <rect x={-200} y={-220} width={400} height={220} fill={c} {...s} />
  {[-1, 0, 1].map((k) => <g key={k}><rect x={k * 160 - 50} y={-340} width={100} height={340} fill={c} {...s} />
    {[0, 1].map((i) => <rect key={i} x={k * 160 - 50 + i * 64} y={-372} width={36} height={34} fill={c} {...s} />)}</g>)}
  <path d="M-40 0 L-40 -90 Q0 -140 40 -90 L40 0 Z" fill={C.woodDark} {...s} />
  <path d="M0 -340 L0 -440" stroke={INK} strokeWidth={6} /><path d="M0 -440 L60 -420 L0 -400" fill={C.red} {...s} />
</g>;

/** centred — a phone; children drawn on the screen (screen area ±110 × ±200). */
export const Phone: React.FC<{ children?: React.ReactNode; c?: string }> = ({ children, c = C.black }) => <g>
  <rect x={-130} y={-240} width={260} height={480} rx={36} fill={c} {...s} />
  <rect x={-110} y={-200} width={220} height={400} rx={10} fill="#fff" {...thin} />
  <rect x={-30} y={-226} width={60} height={10} rx={5} fill={C.grey} />
  {children}
</g>;

export const Car: React.FC<{ c?: string }> = ({ c = C.blue }) => {
  const f = useCurrentFrame();
  return <g>
    <Sh w={160} />
    <path d="M-170 -40 L-170 -100 Q-160 -120 -120 -124 L-70 -190 L80 -190 L130 -124 Q170 -120 175 -90 L175 -40 Z" fill={c} {...s} />
    <path d="M-50 -176 L-90 -128 L0 -128 L0 -176 Z M20 -176 L20 -128 L110 -128 L70 -176 Z" fill={C.sky} {...thin} />
    {[-100, 110].map((x) => <g key={x} transform={`translate(${x} -40) rotate(${f * 8})`}><circle r={40} fill={C.black} {...s} /><circle r={14} fill={C.grey} /><path d="M0 -14 L0 14" stroke={INK} strokeWidth={4} /></g>)}
  </g>;
};

/** centred — a pie with a highlighted slice (0..1). */
export const Pie: React.FC<{ slice: number; r?: number; c?: string; label?: string }> = ({ slice, r = 110, c = C.red, label }) => {
  const a = slice * Math.PI * 2;
  const x = Math.sin(a) * r, y = -Math.cos(a) * r;
  return <g>
    <circle r={r} fill={C.shade} {...s} />
    <path d={`M0 0 L0 ${-r} A${r} ${r} 0 ${slice > 0.5 ? 1 : 0} 1 ${x} ${y} Z`} fill={c} {...s} />
    {label && <T y={r + 50} size={44}>{label}</T>}
  </g>;
};

/** centred */
export const Handshake: React.FC = () => <g>
  <path d="M-260 20 L-120 20 L-60 -20 L20 -10 L60 40 L20 50 L-40 30 L-120 60 L-260 60 Z" fill={C.navy} {...s} />
  <path d="M260 20 L120 20 L60 -20 L-10 -10 L-40 30 L0 70 L50 50 L120 60 L260 60 Z" fill={C.green} {...s} />
  <path d="M-60 -20 Q-10 -40 30 0 Q60 30 30 60 Q0 74 -40 40" fill="#fff" {...s} />
</g>;

/** centred */
export const Crown: React.FC<{ c?: string }> = ({ c = C.gold }) => <g>
  <path d="M-90 50 L-100 -50 L-50 0 L0 -70 L50 0 L100 -50 L90 50 Z" fill={c} {...s} />
  <rect x={-90} y={40} width={180} height={30} rx={6} fill={c} {...s} />
  {[-60, 0, 60].map((x) => <circle key={x} cx={x} cy={56} r={8} fill={C.red} {...thin} />)}
</g>;

/** centred */
export const Shield: React.FC<{ c?: string; label?: string }> = ({ c = C.blue, label }) => <g>
  <path d="M0 -130 L110 -90 Q110 60 0 130 Q-110 60 -110 -90 Z" fill={c} {...s} />
  <path d="M0 -100 L80 -70 Q80 40 0 96" fill="none" stroke="#fff" strokeWidth={8} opacity={0.5} />
  {label && <T y={0} size={40} color="#fff">{label}</T>}
</g>;

export const Box: React.FC<{ label?: string; c?: string; w?: number; h?: number }> = ({ label, c = C.wood, w = 160, h = 120 }) => <g>
  <rect x={-w / 2} y={-h} width={w} height={h} fill={c} {...s} />
  <path d={`M${-w / 2} ${-h + 30} L${w / 2} ${-h + 30} M0 ${-h} L0 ${-h + 30}`} {...thin} />
  {label && <T y={-h / 2 + 12} size={30}>{label}</T>}
</g>;

/** centred */
export const Letter: React.FC<{ label?: string }> = ({ label }) => <g>
  <rect x={-90} y={-60} width={180} height={120} rx={8} fill="#fff" {...s} />
  <path d="M-90 -60 L0 10 L90 -60" fill="none" {...s} />
  {label && <g transform="translate(0 90)"><T size={36}>{label}</T></g>}
</g>;

export const Suitcase: React.FC<{ c?: string }> = ({ c = C.teal }) => <g>
  <Sh w={90} />
  <path d="M-30 -200 L-30 -230 L30 -230 L30 -200" fill="none" {...s} />
  <rect x={-80} y={-200} width={160} height={180} rx={16} fill={c} {...s} />
  <path d="M-40 -200 L-40 -20 M40 -200 L40 -20" {...thin} />
  <circle cx={-50} cy={-10} r={12} fill={INK} /><circle cx={50} cy={-10} r={12} fill={INK} />
</g>;

/** A long stone wall over a hill, base at 0, centred. */
export const LongWall: React.FC<{ w?: number }> = ({ w = 1400 }) => <g>
  <path d={`M${-w / 2} 0 Q0 -120 ${w / 2} 0 Z`} fill={C.green} {...s} />
  <path d={`M${-w / 2} -40 Q0 -260 ${w / 2} -40 L${w / 2} 20 Q0 -170 ${-w / 2} 20 Z`} fill={C.stone} {...s} />
  {Array.from({ length: 14 }, (_, i) => { const x = -w / 2 + (i + 0.5) * (w / 14); const y = -40 - 220 * (1 - (2 * x / w) ** 2) * 0.5; return <rect key={i} x={x - 22} y={y - 50} width={44} height={40} fill={C.stone} {...s} />; })}
  {Array.from({ length: 6 }, (_, i) => { const x = -w / 2 + (i + 1) * (w / 7); const y = -10 - 220 * (1 - (2 * x / w) ** 2) * 0.5; return <path key={i} d={`M${x - 40} ${y} l60 0`} stroke={C.stoneDark} strokeWidth={5} />; })}
</g>;

/** centred — a heart monitor with a calm beating line. */
export const Monitor: React.FC = () => {
  const f = useCurrentFrame();
  const off = (f * 4) % 120;
  const pts = Array.from({ length: 12 }, (_, i) => { const x = -170 + i * 30; const k = (i * 30 + off) % 120; return `${x} ${k > 40 && k < 60 ? -60 : k >= 60 && k < 70 ? 40 : 0}`; }).join(' L');
  return <g>
    <rect x={-200} y={-140} width={400} height={260} rx={20} fill={C.black} {...s} />
    <rect x={-180} y={-120} width={360} height={200} rx={8} fill="#0F2A1A" />
    <path d={`M${pts}`} stroke="#5CFF8A" strokeWidth={6} fill="none" strokeLinejoin="round" />
    <circle cx={150} cy={95} r={10} fill="#5CFF8A" />
  </g>;
};
/** centred */
export const Balloons: React.FC = () => {
  const f = useCurrentFrame();
  return <g>{[[-60, C.red], [0, C.yellow], [60, C.blue]].map(([x, c], i) => <g key={i} transform={`translate(${x} ${Math.sin(f / 20 + i) * 8})`}>
    <path d={`M0 40 Q${10 - i * 10} 120 ${-(x as number) * 0.5} 200`} stroke={INK} strokeWidth={3} fill="none" />
    <ellipse cx={0} cy={-20} rx={44} ry={56} fill={c as string} {...s} />
  </g>)}</g>;
};

// food
/** centred */ export const Egg: React.FC = () => <g><ellipse rx={50} ry={64} fill="#fff" {...s} /><path d="M-24 -30 Q-30 -10 -24 6" stroke={C.shade} strokeWidth={8} fill="none" strokeLinecap="round" /></g>;
export const Bag: React.FC<{ label: string; c?: string }> = ({ label, c = '#fff' }) => <g>
  <path d="M-70 0 L-80 -170 L-60 -200 L60 -200 L80 -170 L70 0 Z" fill={c} {...s} />
  <path d="M-60 -200 L-40 -180 L-20 -200 L0 -180 L20 -200 L40 -180 L60 -200" fill="none" {...thin} />
  <T y={-90} size={36}>{label}</T>
</g>;
/** centred */ export const Butter: React.FC = () => <g><path d="M-90 20 L-60 -30 L90 -30 L60 20 Z" fill={C.yellow} {...s} /><rect x={-90} y={20} width={150} height={40} fill={C.yellowDark} {...s} /><path d="M60 20 L90 -30 L90 10 L60 60 Z" fill={C.yellow} {...s} /></g>;
export const Milk: React.FC = () => <g><path d="M-60 0 L-60 -180 L-30 -230 L30 -230 L60 -180 L60 0 Z" fill="#fff" {...s} /><path d="M-60 -180 L60 -180" {...thin} /><rect x={-60} y={-130} width={120} height={70} fill={C.blue} {...thin} /><T y={-95} size={32} color="#fff">حليب</T></g>;
/** centred */ export const Cake: React.FC = () => <g>
  <rect x={-100} y={-40} width={200} height={90} rx={10} fill={C.cream} {...s} />
  <path d="M-100 -20 Q-80 10 -60 -20 Q-40 10 -20 -20 Q0 10 20 -20 Q40 10 60 -20 Q80 10 100 -20 L100 -40 L-100 -40 Z" fill={C.pink} {...s} />
  <path d="M0 -40 L0 -90" stroke={INK} strokeWidth={10} /><path d="M0 -96 q-12 -14 0 -30 q12 16 0 30" fill={C.orange} {...thin} />
</g>;
/** centred */ export const Cookie: React.FC = () => <g><circle r={64} fill={C.wood} {...s} />{[[-24, -20], [20, -30], [10, 20], [-20, 26], [34, 10]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill={C.brownDark} />)}</g>;
/** centred */ export const Pancakes: React.FC = () => <g>{[0, 1, 2].map((i) => <ellipse key={i} cx={0} cy={30 - i * 26} rx={100} ry={26} fill={C.wood} {...s} />)}<path d="M-50 -36 Q0 -60 50 -36 Q40 -10 0 -20 Q-40 -10 -50 -36 Z" fill={C.yellowDark} {...thin} /></g>;
/** centred */ export const Bread: React.FC = () => <g><path d="M-110 40 Q-130 -60 -60 -70 Q0 -110 60 -70 Q130 -60 110 40 Z" fill={C.wood} {...s} />{[-50, 0, 50].map((x) => <path key={x} d={`M${x - 16} -50 L${x + 16} -20`} stroke={C.woodDark} strokeWidth={8} strokeLinecap="round" />)}</g>;

// signals
/** centred */ export const Drum: React.FC = () => <g><path d="M-90 -50 L-90 60 Q0 100 90 60 L90 -50" fill={C.red} {...s} /><ellipse cx={0} cy={-50} rx={90} ry={30} fill={C.cream} {...s} />{[-60, -20, 20, 60].map((x) => <path key={x} d={`M${x} -24 L${x + 20} 72`} stroke="#fff" strokeWidth={5} />)}<path d="M40 -120 L-20 -60 M-40 -130 L20 -64" stroke={C.brown} strokeWidth={12} strokeLinecap="round" /></g>;
/** centred */ export const Horn: React.FC = () => <path d="M-120 30 Q-40 20 60 -60 L90 -30 Q40 60 -110 60 Z" fill={C.gold} {...s} />;

/** centred — falcon perched (dive=0) or diving (dive=1). */
export const Falcon: React.FC<{ dive?: boolean }> = ({ dive }) => {
  const f = useCurrentFrame();
  return <g transform={dive ? 'rotate(50)' : ''}>
    {dive && [0, 1, 2].map((i) => <path key={i} d={`M${-220 - i * 30} ${-40 + i * 40} L${-120 - i * 30} ${-40 + i * 40}`} stroke={C.grey} strokeWidth={6} strokeLinecap="round" />)}
    <path d={dive ? 'M-100 -30 Q0 -60 90 0 Q0 30 -100 30 Z' : 'M-40 -80 Q30 -100 50 -20 Q60 60 0 90 Q-50 60 -40 -80 Z'} fill={C.brown} {...s} />
    {dive ? <path d="M-60 -20 L-10 -120 L30 -10 Z M-60 20 L-10 110 L30 10 Z" fill={C.brownDark} {...s} />
      : <path d={`M-20 -40 Q-90 ${0 + Math.sin(f / 30) * 4} -50 80 Q-20 40 -20 -40 Z`} fill={C.brownDark} {...s} />}
    <circle cx={dive ? 90 : 10} cy={dive ? -4 : -110} r={dive ? 30 : 42} fill={C.cream} {...s} />
    <path d={dive ? 'M116 -10 L140 0 L116 8' : 'M40 -114 L66 -104 L42 -94'} fill={C.gold} {...thin} />
    <circle cx={dive ? 96 : 22} cy={dive ? -10 : -118} r={6} fill={INK} />
    {!dive && <path d="M-20 90 L-20 110 M20 88 L20 110" stroke={C.gold} strokeWidth={8} strokeLinecap="round" />}
  </g>;
};

/** centred — a bow drawn by `pull` (0..1); `loose` frame sends the arrow away. */
export const Bow: React.FC<{ pull: number; loose?: number }> = ({ pull, loose }) => {
  const f = useCurrentFrame();
  const fly = loose !== undefined && f >= loose ? ease(f - loose, 0, 14, 0, 900) : 0;
  const px = -40 - pull * 120;
  return <g>
    <path d="M40 -200 Q160 0 40 200" fill="none" stroke={INK} strokeWidth={20} strokeLinecap="round" /><path d="M40 -200 Q160 0 40 200" fill="none" stroke={C.wood} strokeWidth={10} strokeLinecap="round" />
    <path d={`M40 -200 L${fly ? 40 : px} 0 L40 200`} fill="none" stroke={INK} strokeWidth={3} />
    <g transform={`translate(${fly ? fly - 40 : px} 0)`}><path d="M0 0 L240 0" stroke={C.brown} strokeWidth={8} /><path d="M240 -16 L272 0 L240 16 Z" fill={C.grey} {...thin} /><path d="M0 0 L-20 -16 M0 0 L-20 16 M16 0 L-4 -16 M16 0 L-4 16" stroke={C.red} strokeWidth={6} /></g>
  </g>;
};
/** centred */ export const Target: React.FC = () => <g>{[90, 66, 42, 18].map((r, i) => <circle key={r} r={r} fill={i % 2 ? '#fff' : C.red} {...s} />)}</g>;
/** centred */ export const Cobweb: React.FC = () => <g stroke={C.grey} strokeWidth={3} fill="none">{[0, 30, 60, 90].map((a) => <path key={a} d={`M0 0 L${Math.cos((a * Math.PI) / 180) * 120} ${Math.sin((a * Math.PI) / 180) * 120}`} />)}{[40, 80, 120].map((r) => <path key={r} d={`M${r} 0 Q${r * 0.8} ${r * 0.3} ${r * 0.87} ${r * 0.5} Q${r * 0.5} ${r * 0.6} ${r * 0.5} ${r * 0.87} Q${r * 0.2} ${r * 0.8} 0 ${r}`} />)}</g>;

// icons
/** centred */ export const Eye: React.FC<{ closed?: boolean }> = ({ closed }) => <g><path d="M-110 0 Q0 -90 110 0 Q0 90 -110 0 Z" fill="#fff" {...s} />{closed ? <path d="M-100 0 Q0 60 100 0" fill="none" {...s} /> : <><circle r={40} fill={C.blue} {...s} /><circle r={16} fill={INK} /></>}</g>;
/** centred */ export const Wind: React.FC = () => { const f = useCurrentFrame(); return <g transform={`translate(${Math.sin(f / 10) * 10} 0)`} fill="none" stroke={C.sky} strokeWidth={16} strokeLinecap="round"><path d="M-110 -40 L50 -40 Q100 -40 90 -80 Q80 -110 50 -96" /><path d="M-130 10 L90 10 Q140 10 130 50 Q120 80 90 70" /><path d="M-90 60 L10 60" /></g>; };
export const Tree: React.FC<{ c?: string; h?: number }> = ({ c = C.green, h = 1 }) => <g transform={`scale(${h})`}><Sh w={60} /><rect x={-18} y={-120} width={36} height={120} fill={C.brown} {...s} /><path d="M0 -360 L100 -180 L60 -180 L120 -100 L-120 -100 L-60 -180 L-100 -180 Z" fill={c} {...s} /></g>;
/** centred */ export const Fire: React.FC<{ s?: number }> = ({ s: k = 1 }) => { const f = useCurrentFrame(); const w = Math.sin(f / 4) * 6; return <g transform={`scale(${k})`}><path d={`M0 100 Q-100 90 -90 0 Q-80 -60 -30 -100 Q-30 -40 0 -40 Q-10 -110 ${30 + w} -150 Q50 -80 80 -50 Q110 0 90 50 Q70 100 0 100 Z`} fill={C.orange} {...s} /><path d={`M0 90 Q-50 80 -40 30 Q-30 0 0 -20 Q${10 + w} 20 40 30 Q50 80 0 90 Z`} fill={C.yellow} {...thin} /></g>; };
export const Mountain: React.FC = () => <g><Sh w={200} /><path d="M-220 0 L-60 -300 L0 -220 L60 -320 L220 0 Z" fill={C.stone} {...s} /><path d="M-60 -300 L-90 -240 L-60 -250 L-30 -230 Z M60 -320 L30 -250 L60 -260 L90 -250 Z" fill="#fff" {...thin} /></g>;
/** centred */ export const Battery: React.FC<{ level: number }> = ({ level }) => <g><rect x={-120} y={-60} width={240} height={120} rx={16} fill="#fff" {...s} /><rect x={120} y={-24} width={20} height={48} rx={4} fill={INK} /><rect x={-104} y={-44} width={208 * Math.max(0.02, level)} height={88} rx={8} fill={level > 0.5 ? C.green : level > 0.2 ? C.yellow : C.red} /></g>;
/** centred */ export const Rocket: React.FC = () => <g transform="rotate(30)"><path d="M0 -120 Q50 -60 40 60 L-40 60 Q-50 -60 0 -120 Z" fill="#fff" {...s} /><circle cy={-30} r={20} fill={C.sky} {...s} /><path d="M-40 20 L-80 80 L-40 60 M40 20 L80 80 L40 60" fill={C.red} {...s} /><path d="M-24 64 Q0 140 24 64 Z" fill={C.orange} {...thin} /></g>;
/** centred */ export const Steam: React.FC = () => { const f = useCurrentFrame(); return <g>{[-1, 1].map((k) => <path key={k} d={`M${k * 60} 0 q${k * 20} -30 0 -60 q${-k * 20} -30 0 -60`} fill="none" stroke={C.grey} strokeWidth={10} strokeLinecap="round" opacity={0.5 + 0.4 * Math.sin(f / 5 + k)} />)}</g>; };
/** centred */ export const Mask: React.FC<{ c?: string }> = ({ c = C.gold }) => <g><path d="M-100 -40 Q0 -70 100 -40 Q110 30 40 40 Q0 10 -40 40 Q-110 30 -100 -40 Z" fill={c} {...s} /><ellipse cx={-45} cy={-10} rx={22} ry={14} fill={INK} /><ellipse cx={45} cy={-10} rx={22} ry={14} fill={INK} /></g>;
/** centred */ export const Magnifier: React.FC = () => <g><path d="M50 50 L130 130" stroke={INK} strokeWidth={30} strokeLinecap="round" /><path d="M50 50 L130 130" stroke={C.brown} strokeWidth={18} strokeLinecap="round" /><circle r={80} fill={C.sky} fillOpacity={0.5} {...s} strokeWidth={14} /></g>;
/** centred */ export const Ticket: React.FC<{ label: string }> = ({ label }) => <g><path d="M-170 -80 L170 -80 L170 -30 Q140 0 170 30 L170 80 L-170 80 L-170 30 Q-140 0 -170 -30 Z" fill={C.yellow} {...s} /><path d="M90 -70 L90 70" stroke={INK} strokeWidth={4} strokeDasharray="10 8" /><T x={-30} y={0} size={44}>{label}</T><path d="M110 0 l40 0 m-14 -14 l14 14 l-14 14" stroke={INK} strokeWidth={6} fill="none" /></g>;
export const Plane: React.FC<{ c?: string }> = ({ c = '#fff' }) => <g><path d="M-260 -10 Q-250 -50 -180 -50 L200 -50 Q260 -40 270 -10 Q260 20 200 20 L-200 20 Q-250 20 -260 -10 Z" fill={c} {...s} /><path d="M-40 -10 L-120 120 L-60 120 L60 -10 Z M-40 -40 L-100 -140 L-50 -140 L30 -40 Z" fill={C.blue} {...s} /><path d="M180 -50 L230 -130 L260 -130 L250 -40" fill={C.blue} {...s} />{[-150, -100, -50, 0, 50, 100, 150].map((x) => <circle key={x} cx={x} cy={-20} r={10} fill={C.sky} {...thin} />)}</g>;
/** centred */ export const Smoke: React.FC = () => { const f = useCurrentFrame(); return <g>{Array.from({ length: 6 }, (_, i) => { const t = ((f / 60 + i / 6) % 1); return <circle key={i} cx={Math.sin(t * 6 + i) * 30 + t * 120} cy={-t * 420} r={40 + t * 70} fill={C.grey} fillOpacity={0.55 * (1 - t)} stroke={INK} strokeOpacity={0.4 * (1 - t)} strokeWidth={4} />; })}</g>; };
export const Bush: React.FC = () => <g><Sh w={160} /><path d="M-160 0 Q-200 -80 -120 -110 Q-110 -190 -20 -170 Q40 -230 100 -160 Q190 -170 180 -80 Q220 -20 160 0 Z" fill={C.green} {...s} /><path d="M-80 -90 Q-60 -110 -40 -90 M40 -110 Q60 -130 80 -110" stroke={C.greenDark} strokeWidth={6} fill="none" /></g>;
/** centred — a small bird; `fly` frame makes it rise and flap. */
export const Bird: React.FC<{ fly?: number; dx?: number }> = ({ fly, dx = 1 }) => { const f = useCurrentFrame(); const t = fly !== undefined && f >= fly ? f - fly : 0; const flap = t ? Math.sin(t / 2) * 20 : 0; return <g transform={`translate(${t * 6 * dx} ${-t * 9})`}><path d={`M-40 ${-flap} Q-20 -10 0 0 Q20 -10 40 ${-flap}`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" /></g>; };
export const Door: React.FC<{ open?: number; c?: string }> = ({ open = 0, c = C.wood }) => <g><rect x={-80} y={-260} width={160} height={260} fill={INK} /><path d={`M-80 -260 L${-80 + 160 * (1 - open * 0.7)} ${-260 - open * 20} L${-80 + 160 * (1 - open * 0.7)} ${open * 20} L-80 0 Z`} fill={c} {...s} /><circle cx={-80 + 160 * (1 - open * 0.7) - 22} cy={-130} r={8} fill={C.gold} {...thin} /><rect x={-100} y={-280} width={200} height={280} fill="none" {...s} /></g>;
/** centred */ export const Key: React.FC = () => <g><circle cx={-70} r={40} fill={C.gold} {...s} /><circle cx={-70} r={14} fill="#fff" {...thin} /><path d="M-30 -12 L100 -12 L100 30 L80 30 L80 12 L60 12 L60 30 L40 30 L40 12 L-30 12 Z" fill={C.gold} {...s} /></g>;
export const Office: React.FC = () => <g><Sh w={200} /><rect x={-160} y={-520} width={320} height={520} fill={C.sky} {...s} />{Array.from({ length: 12 }, (_, i) => <rect key={i} x={-130 + (i % 3) * 95} y={-490 + Math.floor(i / 3) * 110} width={70} height={70} fill="#fff" {...thin} />)}<rect x={-40} y={-100} width={80} height={100} fill={C.navy} {...s} /></g>;
/** centred — a stack of papers that leans (tilt) */
export const Papers: React.FC<{ n?: number; tilt?: number }> = ({ n = 8, tilt = 0 }) => <g>{Array.from({ length: n }, (_, i) => <rect key={i} x={-90 + Math.sin(i * 2.1) * 12 + i * tilt * 6} y={-i * 24 - 24} width={180} height={24} fill={i % 3 ? '#fff' : C.cream} {...thin} transform={`rotate(${Math.sin(i * 1.3) * 4 + i * tilt} 0 ${-i * 24})`} />)}</g>;
/** centred */ export const Timer: React.FC<{ label: string }> = ({ label }) => <g><circle r={110} fill="#fff" {...s} strokeWidth={10} /><rect x={-24} y={-150} width={48} height={30} rx={6} fill={INK} /><T y={6} size={label.length > 4 ? 44 : 64}>{label}</T></g>;
/** centred */ export const RuleBook: React.FC<{ title?: string }> = ({ title = 'القواعد' }) => <g><rect x={-120} y={-150} width={240} height={300} rx={12} fill={C.navy} {...s} /><rect x={-90} y={-110} width={180} height={60} rx={6} fill="#fff" {...thin} /><T y={-80} size={40}>{title}</T>{[0, 40, 80].map((y) => <path key={y} d={`M-80 ${y} L80 ${y}`} stroke="#fff" strokeWidth={6} opacity={0.6} />)}</g>;
/** centred — a chat on a phone screen: list of [text, side(1 = them), time?] appearing at frames. */
export const Chat: React.FC<{ msgs: Array<{ t: string; me?: boolean; time?: string; at: number }> }> = ({ msgs }) => {
  const f = useCurrentFrame();
  return <Phone>{msgs.map((m, i) => f >= m.at && <g key={i} transform={`translate(${m.me ? 18 : -18} ${-150 + i * 90})`}>
    <rect x={-80} y={-30} width={160} height={60} rx={20} fill={m.me ? C.green : C.shade} {...thin} />
    <T y={0} size={26} color={m.me ? '#fff' : INK}>{m.t}</T>
    {m.time && <T x={m.me ? -60 : 60} y={42} size={20} color={C.greyDark} weight={700}>{m.time}</T>}
  </g>)}</Phone>;
};
export const Boat: React.FC = () => <g><path d="M-200 -70 L200 -70 L150 0 L-150 0 Z" fill={C.wood} {...s} /><path d="M-180 -50 L180 -50" stroke={C.woodDark} strokeWidth={6} /></g>;
/** centred */ export const Waves: React.FC<{ w?: number; c?: string }> = ({ w = 900, c = C.water }) => { const f = useCurrentFrame(); const o = (f * 2) % 120; return <g><path d={`M${-w / 2} 0 ${Array.from({ length: Math.ceil(w / 120) + 2 }, (_, i) => `q30 -30 60 0 q30 30 60 0`).join(' ')} L${w / 2 + 240} 200 L${-w / 2} 200 Z`} transform={`translate(${-o} 0)`} fill={c} {...s} /></g>; };
export const Jersey: React.FC<{ c: string; n?: string }> = ({ c, n = '10' }) => <g><path d="M-100 -260 L-40 -280 Q0 -250 40 -280 L100 -260 L150 -190 L110 -160 L90 -190 L90 0 L-90 0 L-90 -190 L-110 -160 L-150 -190 Z" fill={c} {...s} /><T y={-110} size={80} color="#fff">{n}</T></g>;
/** centred — a match with a flame */ export const Match: React.FC = () => <g transform="rotate(-30)"><rect x={-8} y={-10} width={16} height={180} rx={4} fill={C.wood} {...thin} /><ellipse cy={-16} rx={14} ry={20} fill={C.redDark} {...thin} /><g transform="translate(0 -60) scale(0.35)"><Fire /></g></g>;
/** centred */ export const Scissors: React.FC = () => <g><path d="M-20 -10 L120 -60 M-20 10 L120 60" stroke={C.grey} strokeWidth={18} strokeLinecap="round" /><circle cx={-60} cy={-30} r={30} fill="none" stroke={C.red} strokeWidth={14} /><circle cx={-60} cy={30} r={30} fill="none" stroke={C.red} strokeWidth={14} /></g>;
/** centred */ export const Thermo: React.FC<{ level: number }> = ({ level }) => <g><rect x={-30} y={-200} width={60} height={300} rx={30} fill="#fff" {...s} /><circle cy={130} r={50} fill={level > 0.5 ? C.red : C.blue} {...s} /><rect x={-14} y={100 - 280 * level} width={28} height={280 * level} fill={level > 0.5 ? C.red : C.blue} /></g>;
export const Vase: React.FC<{ broken?: boolean }> = ({ broken }) => broken
  ? <g><path d="M-120 0 L-90 -40 L-50 -20 L-60 0 Z M-20 0 L0 -60 L40 -40 L30 0 Z M70 0 L90 -30 L130 -10 L120 0 Z" fill={C.blue} {...s} /></g>
  : <g><Sh w={70} /><path d="M-40 0 Q-90 -100 -40 -180 L-40 -220 L40 -220 L40 -180 Q90 -100 40 0 Z" fill={C.blue} {...s} /><path d="M-60 -100 Q0 -80 60 -100" stroke="#fff" strokeWidth={8} fill="none" /></g>;
/** centred — a badge that flips colour (converted source) */ export const Badge: React.FC<{ c?: string; label?: string }> = ({ c = C.red, label }) => <g><path d="M0 -90 L70 -60 L70 20 Q70 70 0 100 Q-70 70 -70 20 L-70 -60 Z" fill={c} {...s} /><path d="M0 -50 L12 -14 L50 -14 L20 8 L32 46 L0 24 L-32 46 L-20 8 L-50 -14 L-12 -14 Z" fill="#fff" {...thin} />{label && <T y={140} size={36}>{label}</T>}</g>;
/** centred — little stair of two steps with icons */
export const Stairs: React.FC = () => <g><path d="M-260 100 L-260 20 L-20 20 L-20 -80 L240 -80 L240 100 Z" fill={C.shade} {...s} /></g>;
/** centred — map card */ export const MapIcon: React.FC = () => <g><path d="M-120 -90 L-40 -110 L40 -90 L120 -110 L120 90 L40 110 L-40 90 L-120 110 Z" fill={C.cream} {...s} /><path d="M-40 -110 L-40 90 M40 -90 L40 110" {...thin} /><path d="M-90 40 Q-40 -40 10 20 T90 -50" stroke={C.red} strokeWidth={6} strokeDasharray="12 10" fill="none" /><path d="M76 -66 l28 28 m0 -28 l-28 28" stroke={C.red} strokeWidth={8} strokeLinecap="round" /></g>;
/** centred — dark forest band with eyes peeking (eyes from frame `eyes`) */
export const Forest: React.FC<{ eyes?: number; w?: number }> = ({ eyes, w = 1800 }) => { const f = useCurrentFrame(); return <g>
  {Array.from({ length: 16 }, (_, i) => <g key={i} transform={`translate(${-w / 2 + i * (w / 15)} ${(i % 2) * 30})`}><Tree c={i % 2 ? C.greenDark : '#2F5E3A'} h={1.3 + (i % 3) * 0.2} /></g>)}
  {eyes !== undefined && f >= eyes && [[-500, -160], [-140, -200], [300, -150], [620, -190]].map(([x, y], i) => <g key={i} opacity={ease(f - eyes - i * 8, 0, 10)}><ellipse cx={x - 14} cy={y} rx={9} ry={12} fill={C.yellow} {...thin} /><ellipse cx={x + 14} cy={y} rx={9} ry={12} fill={C.yellow} {...thin} /></g>)}
</g>; };
/** centred — a little road map: straight road with rocks vs curved road; draws the curve from `curve`. */
export const Roads: React.FC<{ curve: number }> = ({ curve }) => { const f = useCurrentFrame(); const k = ease(f - curve, 0, 40); return <g>
  <path d="M-560 120 L560 120" stroke={C.stone} strokeWidth={60} strokeLinecap="round" /><path d="M-560 120 L560 120" stroke="#fff" strokeWidth={6} strokeDasharray="30 30" />
  {[-200, 60, 300].map((x, i) => <path key={x} d={`M${x - 60} 150 L${x - 40} 80 L${x} 60 L${x + 40} 70 L${x + 60} 150 Z`} fill={C.stoneDark} {...s} />)}
  <path d="M-560 120 C-400 -260, 300 -260, 560 120" stroke={C.green} strokeWidth={22} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} />
  <g transform="translate(600 120)"><Flag c={C.green} /></g>
</g>; };
