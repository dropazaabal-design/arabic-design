import React from 'react';

export const P = {
  body: '#F4B860', bodyLight: '#FFD58A', bodyDark: '#D9893B', band: '#2E7BC5', metal: '#A9B8CE',
  eraser: '#E86A92', wood: '#E9D3AE', lead: '#2B2F45', ink: '#F6EBD9', outline: '#1B1F33',
};

export type PencilMood = 'eager' | 'busy' | 'tired' | 'calm' | 'proud';

/**
 * The pencil, drawn tip at (0,0) pointing down, eraser up. Motion carries the
 * feeling: lean, stretch/squash, a bend through the body, a hop; two doodle
 * eyes on the wood only point the look (no face).
 */
export const Pencil: React.FC<{
  x: number; y: number; rot?: number; s?: number; squash?: number; bend?: number; mood?: PencilMood;
  look?: [number, number]; blink?: number; o?: number; len?: number;
}> = ({ x, y, rot = 0, s = 1, squash = 0, bend = 0, mood = 'calm', look = [0, 0], blink = 0, o = 1, len = 300 }) => {
  const sx = 1 + squash * 0.35;
  const sy = 1 - squash * 0.3;
  const w = 64;
  const L = len;
  // the body is a path whose middle can bow sideways
  const b = bend * 40;
  const body = `M ${-w / 2} -70 C ${-w / 2 + b} ${-70 - L * 0.35} ${-w / 2 + b} ${-70 - L * 0.65} ${-w / 2} ${-70 - L} L ${w / 2} ${-70 - L} C ${w / 2 + b} ${-70 - L * 0.65} ${w / 2 + b} ${-70 - L * 0.35} ${w / 2} -70 Z`;
  const eyeY = -70 - L * 0.28;
  const lid = mood === 'tired' ? 0.55 : blink;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * sx} ${s * sy})`} opacity={o}>
      <ellipse cx={0} cy={6} rx={46} ry={9} fill="#000" opacity={0.22} />
      <path d={body} fill={P.body} stroke={P.outline} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M -6 -74 C ${-6 + b} ${-70 - L * 0.35} ${-6 + b} ${-70 - L * 0.65} -6 ${-66 - L}`} fill="none" stroke={P.bodyLight} strokeWidth={14} opacity={0.8} />
      <path d={`M 18 -74 C ${18 + b} ${-70 - L * 0.35} ${18 + b} ${-70 - L * 0.65} 18 ${-66 - L}`} fill="none" stroke={P.bodyDark} strokeWidth={8} opacity={0.7} />
      <rect x={-w / 2 + b * 0.2} y={-70 - L * 0.62} width={w} height={26} fill={P.band} stroke={P.outline} strokeWidth={5} />
      <rect x={-w / 2 - 2} y={-70 - L - 46} width={w + 4} height={48} rx={6} fill={P.metal} stroke={P.outline} strokeWidth={6} />
      <path d={`M ${-w / 2 + 2} ${-70 - L - 30} L ${w / 2 - 2} ${-70 - L - 30} M ${-w / 2 + 2} ${-70 - L - 16} L ${w / 2 - 2} ${-70 - L - 16}`} stroke={P.outline} strokeWidth={4} opacity={0.6} />
      <rect x={-w / 2 + 2} y={-70 - L - 96} width={w - 4} height={54} rx={20} fill={P.eraser} stroke={P.outline} strokeWidth={6} />
      <path d={`M ${-w / 2} -70 L 0 -6 L ${w / 2} -70 Z`} fill={P.wood} stroke={P.outline} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -11 -22 L 0 -2 L 11 -22 Z" fill={P.lead} />
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${side * 13 + b * 0.25} ${eyeY})`}>
          <ellipse rx={11} ry={13} fill={P.ink} stroke={P.outline} strokeWidth={4} />
          <circle cx={look[0] * 4} cy={look[1] * 4 + 1} r={5} fill={P.outline} />
          {lid > 0 && <rect x={-12} y={-14} width={24} height={26 * lid} fill={P.body} />}
          {lid > 0 && <path d={`M -12 ${-14 + 26 * lid} L 12 ${-14 + 26 * lid}`} stroke={P.outline} strokeWidth={4} />}
          {mood === 'busy' && <path d={`M ${-10} -22 L 10 ${-22 + side * 6}`} stroke={P.outline} strokeWidth={4} strokeLinecap="round" />}
          {mood === 'eager' && <path d="M -9 -24 Q 0 -30 9 -24" fill="none" stroke={P.outline} strokeWidth={4} strokeLinecap="round" />}
          {mood === 'proud' && <path d="M -10 2 Q 0 10 10 2" fill="none" stroke={P.outline} strokeWidth={4} strokeLinecap="round" transform="translate(0 10)" />}
        </g>
      ))}
    </g>
  );
};
