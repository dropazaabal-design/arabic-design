import React from 'react';
import { TITLE } from '../../fonts';
import { INK, LINE, hash, sketch } from '../style';
import { Ar, mix, rrectPts } from './ui';

export type BubbleProps = {
  w: number; h: number;
  /** the tail's tip, relative to the bubble centre. */
  tail: [number, number];
  kind?: 'say' | 'think' | 'shout';
  /** a string is set as RTL Arabic text (Cairo; Tajawal for shout); any other node is drawn as SVG at the bubble centre. */
  children?: React.ReactNode;
  /** text size in px (default from the bubble height). */
  size?: number; fill?: string;
};
type P = [number, number];

/**
 * A dialogue bubble: origin at the bubble's centre, a w×h box, the tail's tip at `tail`.
 * `say` a rounded box with a curved tail, `think` a cloud with a trail of small circles, `shout` a jagged burst whose
 * longest spike is the tail.
 */
export const SpeechBubble = ({ w, h, tail, kind = 'say', children, size, fill = '#FFFFFF' }: BubbleProps) => {
  const lw = LINE.normal, m = Math.min(w, h);
  const ang = Math.atan2(tail[1], tail[0]), cs = Math.cos(ang), sn = Math.sin(ang);
  const edge = Math.min(w / 2 / Math.max(1e-6, Math.abs(cs)), h / 2 / Math.max(1e-6, Math.abs(sn)));
  const tip: P = tail;
  let body: React.ReactNode;
  if (kind === 'say') {
    const bw = m * 0.13, bc: P = [cs * edge * 0.72, sn * edge * 0.72], px = -sn, py = cs;
    const b1: P = [bc[0] + px * bw, bc[1] + py * bw], b2: P = [bc[0] - px * bw, bc[1] - py * bw];
    const bend = bw * 0.6;
    const c1: P = [mix(b1[0], tip[0], 0.55) + px * bend, mix(b1[1], tip[1], 0.55) + py * bend];
    const c2: P = [mix(b2[0], tip[0], 0.5) + px * bend, mix(b2[1], tip[1], 0.5) + py * bend];
    const tailD = `M${b1[0]} ${b1[1]} Q${c1[0]} ${c1[1]} ${tip[0]} ${tip[1]} Q${c2[0]} ${c2[1]} ${b2[0]} ${b2[1]} Z`;
    const box = sketch(rrectPts(-w / 2, -h / 2, w, h, m * 0.42), 7, 1.2, true);
    body = <g strokeLinejoin="round">
      <path d={tailD} fill={fill} stroke={INK} strokeWidth={lw * 2} />
      <path d={box} fill={fill} stroke={INK} strokeWidth={lw} />
      <path d={tailD} fill={fill} />
    </g>;
  } else if (kind === 'think') {
    const n = Math.max(8, Math.round((Math.PI * (w + h)) / 2 / (m * 0.32)));
    const pts: P[] = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + 0.2;
      return [Math.cos(a) * w * 0.43, Math.sin(a) * h * 0.4];
    });
    const d = pts.map((p, i) => {
      const q = pts[(i + 1) % n], r = Math.hypot(q[0] - p[0], q[1] - p[1]) * (0.58 + hash(i + 3) * 0.08);
      return `${i ? '' : `M${p[0].toFixed(1)} ${p[1].toFixed(1)} `}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
    }).join(' ') + ' Z';
    const e: P = [cs * edge * 0.95, sn * edge * 0.95];
    body = <g>
      {[[0.25, 0.085], [0.6, 0.06], [1, 0.04]].map(([k, r], i) => (
        <circle key={i} cx={mix(e[0], tip[0], k)} cy={mix(e[1], tip[1], k)} r={m * r} fill={fill} stroke={INK} strokeWidth={lw * 0.8} />
      ))}
      <path d={d} fill={fill} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
    </g>;
  } else {
    const n = 22;
    let best = 0, bd = 9;
    const pts: P[] = Array.from({ length: n * 2 }, (_, i) => {
      const a = (i / (n * 2)) * Math.PI * 2, out = i % 2 === 0;
      const k = out ? 0.6 + hash(i + 11) * 0.1 : 0.46;
      if (out) { const dd = Math.abs(Math.atan2(Math.sin(a - ang), Math.cos(a - ang))); if (dd < bd) { bd = dd; best = i; } }
      return [Math.cos(a) * w * k, Math.sin(a) * h * k];
    });
    pts[best] = tip;
    body = <path d={sketch(pts, 9, 0.6, true)} fill={fill} stroke={INK} strokeWidth={LINE.bold} strokeLinejoin="round" />;
  }
  const isText = typeof children === 'string' || typeof children === 'number';
  const k = kind === 'say' ? 0.86 : kind === 'think' ? 0.72 : 0.7;
  return (
    <g>
      {body}
      {isText
        ? <Ar x={(-w * k) / 2} y={(-h * k) / 2} w={w * k} h={h * k} size={size ?? Math.round(Math.min(40, h * 0.2))} font={kind === 'shout' ? TITLE : undefined} weight={kind === 'shout' ? 800 : 700}>{children}</Ar>
        : children}
    </g>
  );
};

/** A thought cloud: SpeechBubble with kind 'think' (same props, same origin). */
export const ThoughtCloud = (p: Omit<BubbleProps, 'kind'>) => <SpeechBubble {...p} kind="think" />;
