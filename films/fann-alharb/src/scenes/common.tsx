import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, INK, Label, Pop, T, W, ease } from '../kit/draw';
import { TITLE } from '../fonts';

/** The chapter name, steady at the top while the scene changes under it. */
export const Title: React.FC<{ text: string; sub?: string }> = ({ text, sub }) => (
  <g>
    <text x={960} y={78} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={800} fontSize={52} fill={INK}>{text}</text>
    {sub && <text x={960} y={134} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={800} fontSize={42}
      fill={C.yellow} stroke={INK} strokeWidth={7} paintOrder="stroke">{sub}</text>}
  </g>
);

const PHASES = ['تستعد', 'تتحرك', 'ترى'];
/** Three-phase strip: which phase we are in. */
export const PhaseStrip: React.FC<{ n: number; y?: number; at: number }> = ({ n, y = 830, at }) => {
  const f = useCurrentFrame();
  return <g>{PHASES.map((p, i) => {
    const on = i === n, x = 1360 - i * 400;
    const k = ease(f - at - i * 6, 0, 12);
    return <g key={p} opacity={k} transform={`translate(${x} ${y}) scale(${on ? 1 : 0.8})`}>
      <circle r={70} fill={on ? C.yellow : '#fff'} stroke={INK} strokeWidth={W} />
      <text x={0} y={6} textAnchor="middle" dominantBaseline="middle" fontFamily={TITLE} fontWeight={800} fontSize={64} fill={INK}>{i + 1}</text>
      <T y={120} size={44} color={on ? INK : C.grey}>{p}</T>
      {i < 2 && <path d={`M-100 0 L-300 0`} stroke={on || i < n ? INK : C.shade} strokeWidth={8} strokeDasharray="4 18" strokeLinecap="round" />}
    </g>;
  })}</g>;
};

/** Phase card: big yellow «المرحلة …» with its question. */
export const PhaseCard: React.FC<{ n: number; name: string; q: string; at: number }> = ({ n, name, q, at }) => (
  <g>
    <Label x={960} y={330} text={name} size={150} at={at} />
    <Pop at={at + 12} x={960} y={500}><T size={84}>{q}</T></Pop>
    <PhaseStrip n={n} at={at + 20} />
  </g>
);

/** Chapter card: the chapter number in a yellow disc and its rule underneath. */
export const ChapterCard: React.FC<{ num: number; name: string; at: number }> = ({ num, name, at }) => (
  <g>
    <Pop at={at} x={960} y={390}>
      <circle r={150} fill={C.yellow} stroke={INK} strokeWidth={10} />
      <text x={0} y={14} textAnchor="middle" dominantBaseline="middle" fontFamily={TITLE} fontWeight={800} fontSize={200} fill={INK}>{num}</text>
    </Pop>
    <Pop at={at + 6} x={960} y={640} from="up"><T size={56} color={C.greyDark}>{`الفصل ${['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر', 'الحادي عشر', 'الثاني عشر', 'الثالث عشر'][num]}`}</T></Pop>
    <Pop at={at + 12} x={960} y={750} from="up"><T size={92}>{name}</T></Pop>
  </g>
);
