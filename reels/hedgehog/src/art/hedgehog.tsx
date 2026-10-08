import React from 'react';

export const HH = {
  quill: '#5B3A29', quillTip: '#E9D3AE', body: '#B07A52', bodyLight: '#D9A77A', belly: '#F1D9B5',
  nose: '#1B1F33', outline: '#1B1F33', blush: '#F28C6B', cold: '#7DB6FF',
};

export type HedgehogTone = 'brown' | 'sand' | 'rose';
const TONES: Record<HedgehogTone, { quill: string; body: string; light: string }> = {
  brown: { quill: HH.quill, body: HH.body, light: HH.bodyLight },
  sand: { quill: '#7A5236', body: '#C9935F', light: '#E6BC8C' },
  rose: { quill: '#6B3A3A', body: '#C0806A', light: '#E0A890' },
};

/**
 * A doodle hedgehog seen from the side, feet at (0,0), facing right when dir = 1.
 * puff raises the quills (the poke), shiver shakes it with cold, curl rolls it
 * into a ball, warm adds a blush and relaxes the eye.
 */
export const Hedgehog: React.FC<{
  x: number; y: number; s?: number; dir?: 1 | -1; puff?: number; shiver?: number; curl?: number; warm?: number;
  eye?: 'open' | 'closed' | 'happy' | 'wince'; look?: number; hop?: number; tone?: HedgehogTone; o?: number; f?: number; squash?: number;
}> = ({ x, y, s = 1, dir = 1, puff = 0, shiver = 0, curl = 0, warm = 0, eye = 'open', look = 0, hop = 0, tone = 'brown', o = 1, f = 0, squash = 0 }) => {
  const T = TONES[tone];
  const jx = shiver ? Math.sin(f * 2.7) * 4 * shiver : 0;
  const jy = shiver ? Math.cos(f * 3.1) * 1.5 * shiver : 0;
  const rx = 128 - curl * 30;
  const ry = 86 + curl * 18;
  const cy = -ry - 8;
  const N = 15;
  const quills = Array.from({ length: N }).map((_, k) => {
    // back arc, from the tail (left) over the top to behind the head
    const t = k / (N - 1);
    const a = Math.PI * (1.02 + t * (0.8 + curl * 0.15));
    const d = 0.11;
    const base = (aa: number): [number, number] => [Math.cos(aa) * rx, cy + Math.sin(aa) * ry];
    const len = (46 + (k % 2) * 10) * (1 + puff * 0.55) * (1 - Math.abs(t - 0.5) * 0.5);
    const [b1x, b1y] = base(a - d);
    const [b2x, b2y] = base(a + d);
    const tipA = a - 0.12 - puff * 0.05;
    const tip: [number, number] = [Math.cos(tipA) * (rx + len), cy + Math.sin(tipA) * (ry + len)];
    return { b1x, b1y, b2x, b2y, tip };
  });
  const headX = rx * 0.78;
  const eyeX = headX + 8 + look * 4;
  const eyeY = cy - 6;
  return (
    <g transform={`translate(${x + jx} ${y + jy - hop}) scale(${s * dir * (1 + squash * 0.18)} ${s * (1 - squash * 0.15)})`} opacity={o}>
      <ellipse cx={0} cy={4} rx={rx * 0.95} ry={12} fill="#000" opacity={0.22} />
      {warm > 0 && <ellipse cx={0} cy={cy} rx={rx + 70} ry={ry + 70} fill={HH.blush} opacity={0.12 * warm} />}
      {quills.map((q, k) => (
        <path key={k} d={`M ${q.b1x} ${q.b1y} L ${q.tip[0]} ${q.tip[1]} L ${q.b2x} ${q.b2y} Z`} fill={T.quill} stroke={HH.outline} strokeWidth={4} strokeLinejoin="round" />
      ))}
      {quills.filter((_, k) => k % 2 === 0).map((q, k) => (
        <circle key={`t${k}`} cx={q.tip[0]} cy={q.tip[1]} r={4} fill={HH.quillTip} opacity={0.9} />
      ))}
      {/* feet */}
      {[-50, 40].map((fx, k) => <ellipse key={k} cx={fx} cy={-6} rx={20} ry={12} fill={T.body} stroke={HH.outline} strokeWidth={4} />)}
      {/* body and belly */}
      <ellipse cx={0} cy={cy} rx={rx} ry={ry} fill={T.body} stroke={HH.outline} strokeWidth={6} />
      <path d={`M ${-rx * 0.5} ${cy + ry * 0.55} Q ${rx * 0.2} ${cy + ry * 1.05} ${rx * 0.95} ${cy + ry * 0.25}`} fill="none" stroke={HH.belly} strokeWidth={22} strokeLinecap="round" opacity={0.85} />
      <path d={`M ${-rx * 0.6} ${cy - ry * 0.35} Q ${-rx * 0.1} ${cy - ry * 0.75} ${rx * 0.35} ${cy - ry * 0.55}`} fill="none" stroke={T.light} strokeWidth={12} strokeLinecap="round" opacity={0.6} />
      {/* snout */}
      <path d={`M ${headX - 10} ${cy - 18} Q ${headX + 60} ${cy - 6} ${headX + 74} ${cy + 18} Q ${headX + 40} ${cy + 34} ${headX - 6} ${cy + 26} Z`} fill={HH.belly} stroke={HH.outline} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={headX + 74} cy={cy + 16} r={11} fill={HH.nose} />
      {/* ear */}
      <ellipse cx={headX - 26} cy={cy - 34} rx={14} ry={11} fill={T.light} stroke={HH.outline} strokeWidth={4} />
      {/* eye: the only face mark, plus a blush when warm */}
      {eye === 'open' && <circle cx={eyeX} cy={eyeY} r={8} fill={HH.outline} />}
      {eye === 'open' && <circle cx={eyeX + 2} cy={eyeY - 3} r={2.5} fill="#fff" />}
      {eye === 'closed' && <path d={`M ${eyeX - 9} ${eyeY} L ${eyeX + 9} ${eyeY}`} stroke={HH.outline} strokeWidth={5} strokeLinecap="round" />}
      {eye === 'happy' && <path d={`M ${eyeX - 9} ${eyeY + 3} Q ${eyeX} ${eyeY - 8} ${eyeX + 9} ${eyeY + 3}`} fill="none" stroke={HH.outline} strokeWidth={5} strokeLinecap="round" />}
      {eye === 'wince' && <path d={`M ${eyeX - 9} ${eyeY - 6} L ${eyeX + 6} ${eyeY} L ${eyeX - 9} ${eyeY + 6}`} fill="none" stroke={HH.outline} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />}
      {warm > 0.2 && <ellipse cx={eyeX + 18} cy={eyeY + 20} rx={12} ry={7} fill={HH.blush} opacity={0.7 * warm} />}
      {shiver > 0.3 && <path d={`M ${headX + 92} ${cy - 30} q 10 -8 0 -16 q -10 -8 0 -16`} fill="none" stroke={HH.cold} strokeWidth={4} strokeLinecap="round" opacity={0.8 * shiver} />}
    </g>
  );
};
