import React from 'react';
import { BODY } from '../../fonts';
import { INK, PAL, sketch } from '../style';
import { clamp01 } from './ui';

const COVER = '#56708E', COVER_IN = '#475E78', RULE = '#AFC4DB', HAND = '#2C4A7C';
type P = [number, number];

/**
 * A paper notebook seen from above-front, opening like an Arabic notebook (spine on the right of the closed cover).
 * Origin: the spine, at the pages' vertical centre. Open spread is w wide (default 220) × ≈0.66·w tall; the closed
 * notebook covers the LEFT half (x −w/2..0). Everything scales with w.
 * `open` 0 closed … 1 open; `lines` are written on the right page, one per ruled line (long lines are set smaller to fit; ≤ 24 characters keeps the full size);
 * `written` 0..1 writes them in order, each line revealed from its right end (handwriting runs right to left).
 */
export const Notebook = ({ open = 1, lines = [], written = 1, w = 220 }: { open?: number; lines?: string[]; written?: number; w?: number }) => {
  const pw = w / 2, ph = w * 0.66, m = w * 0.018, th = ph * 0.014, lw = w * 0.012, wob = w * 0.004;
  const o = clamp01(open);
  // the right page outline: a gentle trapezoid whose spine edge curls down into the gutter
  const page = (dy: number): P[] => [
    [0, -ph / 2 + ph * 0.03 + dy], [pw * 0.1, -ph / 2 - ph * 0.008 + dy], [pw * 0.5, -ph / 2 + dy], [pw * 0.965, -ph / 2 + dy],
    [pw, ph / 2 + dy], [pw * 0.5, ph / 2 + ph * 0.004 + dy], [pw * 0.1, ph / 2 + ph * 0.01 + dy], [0, ph / 2 + ph * 0.02 + dy],
  ];
  const board: P[] = [[0, -ph / 2 - m], [pw * 0.965 + m, -ph / 2 - m], [pw + m, ph / 2 + m + 2 * th], [0, ph / 2 + m + 2 * th]];
  const flipX = (pts: P[]): P[] => pts.map(([x, y]) => [-x, y]);
  const ls = ph * 0.074, y0 = -ph / 2 + ph * 0.13, nRules = 11;
  const rules = (side: 1 | -1) => (
    <g stroke={RULE} strokeWidth={lw * 0.5}>
      {Array.from({ length: nRules }, (_, i) => <path key={i} d={`M${side * pw * 0.07} ${y0 + i * ls} H${side * pw * 0.93}`} />)}
      <path d={`M${side === 1 ? pw * 0.86 : -pw * 0.14} ${-ph / 2 + ph * 0.04} V${ph / 2 - ph * 0.03}`} stroke={PAL.warn} opacity={0.55} />
    </g>
  );
  const pages = (side: 1 | -1, seed: number) => (
    <g>
      <path d={sketch(side === 1 ? board : flipX(board), seed, wob, true)} fill={side === 1 ? COVER_IN : COVER_IN} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
      {[2, 1].map((k) => <path key={k} d={sketch(side === 1 ? page(k * th) : flipX(page(k * th)), seed + k, wob, true)} fill={PAL.paperShade} stroke={INK} strokeWidth={lw * 0.6} strokeLinejoin="round" />)}
      <path d={sketch(side === 1 ? page(0) : flipX(page(0)), seed + 5, wob, true)} fill="#FBFAF7" stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
      <path d={`M0 ${-ph / 2 + ph * 0.03} L${side * pw * 0.09} ${-ph / 2 + ph * 0.02} L${side * pw * 0.09} ${ph / 2} L0 ${ph / 2 + ph * 0.02} Z`} fill={PAL.paperShade} opacity={0.6} />
      {rules(side)}
    </g>
  );
  // handwriting: share `written` across the lines by length, reveal each from its right end
  const lens = lines.map((l) => Math.max(1, Array.from(l).length));
  const total = lens.reduce((a, b) => a + b, 0);
  let before = 0;
  const fs = ls * 0.72;
  const text = lines.length > 0 && (
    <foreignObject x={pw * 0.05} y={y0 - ls * 1.6} width={pw * 0.8} height={ls * (nRules + 1)}>
      <div dir="rtl" lang="ar" style={{ position: 'relative', width: pw * 0.8, height: ls * (nRules + 1), fontFamily: BODY, fontWeight: 600, fontSize: fs, lineHeight: `${ls}px`, color: HAND }}>
        {lines.map((l, i) => {
          const p = clamp01((clamp01(written) * total - before) / lens[i]);
          before += lens[i];
          if (p <= 0) return null;
          // ponytail: width estimated from the character count (~0.5 em per Arabic letter in Cairo), not measured
          const size = Math.min(fs, (pw * 0.78) / (lens[i] * 0.5));
          return (
            <div key={i} style={{ fontSize: size, position: 'absolute', right: (i % 3) * w * 0.004, top: (i + 1) * ls - ls * 0.08, width: '100%', textAlign: 'right', whiteSpace: 'nowrap', transform: `rotate(${(((i * 37) % 7) - 3) * 0.35}deg)`, transformOrigin: 'right center' }}>
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ visibility: 'hidden' }}>{l}</span>
                <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${p * 100}%`, overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', right: 0, top: 0 }}>{l}</span>
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </foreignObject>
  );
  return (
    <g>
      {pages(-1, 11)}
      {o < 0.5 ? (
        <g transform={`scale(${1 - 2 * o} 1)`}>
          <path d={sketch(flipX(board), 3, wob, true)} fill={COVER} stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
          <path d={sketch(flipX(board.map(([x, y]) => [x * 0.94, y + (y > 0 ? -th * 2 : 0)])), 4, wob, true)} fill="none" stroke="#FFFFFF" strokeWidth={lw * 0.6} opacity={0.18} />
          <rect x={-pw * 0.66} y={-ph * 0.3} width={pw * 0.4} height={ph * 0.16} rx={ph * 0.02} fill={PAL.paper} stroke={INK} strokeWidth={lw * 0.7} />
          <path d={`M${-pw * 0.84} ${-ph / 2 - m} L${-pw * 0.87} ${ph / 2 + m + 2 * th}`} stroke={INK} strokeWidth={lw * 1.6} />
        </g>
      ) : (
        <g transform={`scale(${2 * o - 1} 1)`}>
          {pages(1, 21)}
          {text}
        </g>
      )}
    </g>
  );
};
