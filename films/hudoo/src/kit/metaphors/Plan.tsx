import React from 'react';
import { INK, LINE, PAL, sketch, sketchRect } from '../style';
import { Frame, Puffs, ease, ink, seg, smooth, type P } from './util';

// A small plan, made before the storm: a note is pinned to the wall and written in pen — no words, only marks:
// a moon (tonight) → an arrow down → a sun (the morning), each with a line of "writing", and a tick.
// `written` 0..0.28 the note arrives and is pinned; 0.3..1 the pen draws. Note centre (1180, 540), 440×440.
// A window on the left (x 140..640, y 200..700) shows a storm far away. Free for captions: y < 170, and x < 700, y > 760.
export const PLAN = { note: [1180, 540] as P, size: 440, window: [140, 200, 500, 500] as const } as const;
const NS = PLAN.size;

const arcPts = (cx: number, cy: number, r: number, a0: number, a1: number, n = 18): P[] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const scribble = (x0: number, x1: number, y: number, seed: number): P[] =>
  Array.from({ length: 22 }, (_, i) => { const u = i / 21; return [x0 + (x1 - x0) * u, y + Math.sin(u * 26 + seed) * 7 + Math.sin(u * 9 + seed * 2) * 3]; });

// pen strokes in note space (0..440), in writing order; Arabic is written right to left, so lines run leftward
const STROKES: P[][] = [
  [...arcPts(370, 95, 34, 240.4, 29.6), ...arcPts(382.7, 82.3, 34, 60.2, 209.8).slice(1)], // crescent moon
  scribble(310, 70, 98, 1),
  [[360, 150], [360, 240]], [[338, 218], [360, 244], [382, 218]], // arrow down
  arcPts(362, 302, 24, 0, 360, 24), // sun
  ...[0, 60, 120, 180, 240, 300].map((a): P[] => { const r = (a * Math.PI) / 180; return [[362 + Math.cos(r) * 34, 302 + Math.sin(r) * 34], [362 + Math.cos(r) * 48, 302 + Math.sin(r) * 48]]; }),
  scribble(300, 110, 304, 4),
  [[96, 380], [116, 400], [156, 352]], // tick
];
const LEN = STROKES.map((s) => s.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - s[i][0], p[1] - s[i][1]), 0));
const TOTAL = LEN.reduce((a, b) => a + b, 0);

/** The visible part of every stroke after `ink` px of writing, and where the pen tip is. */
const written = (len: number) => {
  const out: P[][] = [];
  let left = len, tip: P | null = null;
  STROKES.forEach((s, k) => {
    if (left <= 0) return;
    if (left >= LEN[k]) { out.push(s); left -= LEN[k]; tip = s[s.length - 1]; return; }
    const part: P[] = [s[0]];
    for (let i = 1; i < s.length && left > 0; i++) {
      const d = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
      if (d <= left) { part.push(s[i]); left -= d; } else { const u = left / d; part.push([s[i - 1][0] + (s[i][0] - s[i - 1][0]) * u, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * u]); left = 0; }
    }
    out.push(part); tip = part[part.length - 1];
  });
  return { out, tip: tip as P | null };
};

const Pen: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) => (
  <g transform={`translate(${x} ${y}) rotate(-58)`} opacity={o}>
    <path d="M0 0 L30 -10 L30 10 Z" fill="#E7E3DC" {...ink(LINE.fine)} />
    <path d="M0 0 L9 -3 L9 3 Z" fill={INK} />
    <path d={sketchRect(30, -14, 190, 28, 3, 0.6)} fill={PAL.focus} {...ink()} />
    <path d="M60 -6 L190 -6" stroke="#9DB7E0" strokeWidth={5} strokeLinecap="round" />
    <path d={sketchRect(200, -15, 34, 30, 4, 0.6)} fill={PAL.chairDark} {...ink()} />
  </g>
);

export type PlanProps = { t: number; written: number };

export const Plan: React.FC<PlanProps> = ({ t, written: w }) => {
  const arrive = ease(seg(w, 0, 0.18)), pin = ease(seg(w, 0.15, 0.28));
  const { out, tip } = written(seg(w, 0.3, 0.97) * TOTAL);
  const [nx, ny] = PLAN.note;
  const rot = -3 + (1 - arrive) * 14;
  const tx = (1 - arrive) * 260, ty = (1 - arrive) * 520;
  const penO = w > 0.28 && w < 1 ? Math.min(1, seg(w, 0.28, 0.32) * 1) * (1 - seg(w, 0.97, 1)) : 0;
  const [wx, wy, ww, wh] = PLAN.window;
  // the far storm, drifting a little
  const d = Math.sin(t * 0.2) * 10;
  return (
    <Frame bg={PAL.wallSage}>
      {/* window with a storm far off */}
      <path d={sketchRect(wx - 24, wy - 24, ww + 48, wh + 48, 2)} fill="#F4F2EE" {...ink(LINE.bold)} />
      <rect x={wx} y={wy} width={ww} height={wh} fill={PAL.wallBlue} />
      <path d={sketch([[wx, wy + 360], [wx + 120, wy + 320], [wx + 260, wy + 350], [wx + 380, wy + 300], [wx + ww, wy + 340], [wx + ww, wy + wh], [wx, wy + wh]], 5, 2, true)} fill="#A9C2B4" {...ink(LINE.far)} />
      <path d={sketch([[wx, wy + 420], [wx + 200, wy + 400], [wx + ww, wy + 430], [wx + ww, wy + wh], [wx, wy + wh]], 6, 2, true)} fill="#8DB59E" {...ink(LINE.far)} />
      <Puffs c={[[wx + 330 + d, wy + 120, 34], [wx + 370 + d, wy + 98, 44], [wx + 420 + d, wy + 118, 34]]} fill={PAL.storm} line={LINE.fine} seed={9} />
      {[0, 1, 2, 3, 4].map((i) => {
        const y = wy + 150 + ((t * 120 + i * 37) % 80);
        return <path key={i} d={`M${wx + 330 + i * 20 + d} ${y} l6 14`} stroke={PAL.storm} strokeWidth={3} strokeLinecap="round" />;
      })}
      <path d={`M${wx + ww / 2} ${wy} L${wx + ww / 2} ${wy + wh} M${wx} ${wy + wh / 2} L${wx + ww} ${wy + wh / 2}`} {...ink(14)} />
      <path d={`M${wx + ww / 2} ${wy} L${wx + ww / 2} ${wy + wh} M${wx} ${wy + wh / 2} L${wx + ww} ${wy + wh / 2}`} stroke="#F4F2EE" strokeWidth={8} />
      <path d={sketchRect(wx - 44, wy + wh + 18, ww + 88, 26, 7)} fill="#F4F2EE" {...ink()} />
      {/* the note */}
      <g transform={`translate(${nx + tx} ${ny + ty}) rotate(${rot}) translate(${-NS / 2} ${-NS / 2})`}>
        <path d={`M12 ${NS + 6} L${NS + 10} ${NS - 4} L${NS + 6} 20 Z`} fill={INK} opacity={0.12} />
        <path d={sketch([[0, 0], [NS, 0], [NS, NS - 46], [NS - 46, NS], [0, NS]], 21, 1.2, true)} fill="#CFE7E0" {...ink(LINE.normal)} />
        <path d={`M${NS} ${NS - 46} L${NS - 40} ${NS - 40} L${NS - 46} ${NS} Z`} fill="#A9D2C6" {...ink(LINE.fine)} />
        {out.map((s, i) => s.length > 1 && <path key={i} d={s.length > 3 ? smooth(s) : `M${s.map((p) => p.join(' ')).join(' L')}`} fill="none" stroke="#2E4C7A" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />)}
        {/* the pin */}
        {pin > 0 && (
          <g transform={`translate(${NS / 2} 26) translate(0 ${(1 - pin) * -90}) scale(${1 + (1 - pin) * 0.5})`} opacity={pin}>
            <ellipse cx={8} cy={10} rx={20} ry={8} fill={INK} opacity={0.18 * pin} />
            <circle cx={0} cy={0} r={22} fill={PAL.warn} {...ink(LINE.normal)} />
            <circle cx={-7} cy={-7} r={6} fill="#F1C4D2" />
          </g>
        )}
        {tip && penO > 0 && <Pen x={tip[0]} y={tip[1]} o={penO} />}
      </g>
    </Frame>
  );
};
