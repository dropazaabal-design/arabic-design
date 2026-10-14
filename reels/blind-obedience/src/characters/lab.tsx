import React from 'react';
import { INK, LINE, PAL, bowLine, clamp, rand, stroke, wobEllipse, wobRect } from '@mukarram/characters/ink';
import { TITLE_FONT } from '../video/fonts';

// Props for the two classic experiments, drawn in the reels/mukarram ink language:
//   Milgram 1963 — the shock generator (30 lever switches, 15 to 450 volts, labelled groups), the partition
//   wall, the learner's room (the "chair", his tea); Asch 1955 — the easel card (one reference line, three
//   comparison lines «أ ب ج»), answer bubbles; and the chalk board for the numbers.

export const C = {
  wall: '#222C3B', wallLow: '#1B2431', floor: '#151C26', floorLine: '#0F151D', rail: '#2E3B50',
  steel: '#5E6B80', panel: '#2D3A4E', panelDeep: '#1E2838', desk: '#3A4A63', deskTop: '#465A78',
  board: '#1F3A33', boardEdge: '#7E6047', chalk: '#E8EEF0', room2: '#2A2F3A', glow: '#CFE0F2',
};
const AR = { fontFamily: TITLE_FONT, fontWeight: 900 } as const;
type At = { x: number; y: number; s?: number; rot?: number; o?: number };
const T = (a: At) => `translate(${a.x} ${a.y}) rotate(${a.rot ?? 0}) scale(${a.s ?? 1})`;

/* ------------------------------ Milgram ------------------------------ */

export const GEN = { w: 780, h: 150, n: 30 };
export const switchX = (i: number) => -GEN.w / 2 + 40 + (i * (GEN.w - 80)) / (GEN.n - 1);
const GROUPS = ['صدمة خفيفة', 'متوسطة', 'قوية', 'قوية جدًا', 'شديدة', 'شديدة جدًا', 'خطر: صدمة بالغة', ''];

/** The shock generator, origin = bottom centre. `down` = how many switches are pressed (fractional = the one
 *  going down); `hot` lights the last pressed lamp; `glow` highlights switch index `focus`. */
export const Generator: React.FC<At & { down: number; focus?: number; glow?: number; labels?: boolean }> = ({ down, focus = -1, glow = 0, labels = true, ...a }) => (
  <g transform={T(a)}>
    <path d={wobRect(-GEN.w / 2, -GEN.h, GEN.w, GEN.h, 12, 601, 1.5)} fill={C.panel} {...stroke()} />
    <path d={wobRect(-GEN.w / 2 + 14, -GEN.h + 14, GEN.w - 28, 34, 6, 602, 1)} fill={C.panelDeep} {...stroke(LINE * 0.5)} />
    <text x={0} y={-GEN.h + 38} textAnchor="middle" {...AR} fontSize={22} fill={C.glow} direction="rtl">مولّد صدمات</text>
    {/* group labels over every four switches (the panel reads left→right in volts, as on the original) */}
    {labels && GROUPS.map((g, k) => {
      const x0 = switchX(k * 4), x1 = switchX(Math.min(GEN.n - 1, k * 4 + 3));
      return (
        <g key={k}>
          <path d={`M${x0 - 8} -82 L${x1 + 8} -82`} {...stroke(3, k >= 6 ? PAL.red : C.steel)} />
          {g ? <text x={(x0 + x1) / 2} y={-88} textAnchor="middle" {...AR} fontSize={k >= 6 ? 12 : 11} fill={k >= 6 ? PAL.red : C.glow} direction="rtl">{g}</text>
            : [-14, 0, 14].map((dx) => <path key={dx} d={`M${(x0 + x1) / 2 + dx - 5} -99 l10 10 m0 -10 l-10 10`} {...stroke(2.5, PAL.red)} />)}
        </g>
      );
    })}
    {Array.from({ length: GEN.n }, (_, i) => {
      const x = switchX(i), v = (i + 1) * 15;
      const d = clamp(down - i);
      const isF = i === focus;
      return (
        <g key={i}>
          {isF && glow > 0 && <circle cx={x} cy={-40} r={26} fill={PAL.red} opacity={0.35 * glow} />}
          <circle cx={x} cy={-66} r={5} fill={d > 0.5 ? PAL.red : '#3D4A60'} {...stroke(2)} />
          <rect x={x - 7} y={-58} width={14} height={34} rx={3} fill={C.panelDeep} {...stroke(2)} />
          <path d={`M${x} -41 L${x} ${-41 - 16 + 32 * d}`} {...stroke(7, v >= 435 ? PAL.red : PAL.stone)} />
          <circle cx={x} cy={-41 - 16 + 32 * d} r={6} fill={v >= 435 ? PAL.red : PAL.white} {...stroke(2)} />
          {labels && <text x={x} y={-10} textAnchor="middle" fontFamily={TITLE_FONT} fontWeight={800} fontSize={v >= 100 ? 10 : 11} fill={v >= 375 ? PAL.red : C.glow} direction="ltr">{v}</text>}
        </g>
      );
    })}
  </g>
);

/** The desk the generator stands on (its front hides the participant's legs). Origin = floor centre. */
export const Desk: React.FC<At & { w?: number; top?: number }> = ({ w = 880, top = 330, ...a }) => (
  <g transform={T(a)}>
    <path d={wobRect(-w / 2, -top, w, 34, 8, 611, 1.5)} fill={C.deskTop} {...stroke()} />
    <path d={wobRect(-w / 2 + 20, -top + 30, w - 40, top - 30, 8, 612, 1.5)} fill={C.desk} {...stroke()} />
    <path d={`M${-w / 2 + 60} ${-top + 90} L${w / 2 - 60} ${-top + 90}`} {...stroke(LINE * 0.5, C.panel)} />
  </g>
);

/** The partition wall between the two rooms, origin = floor at its centre line; `shake` in px. */
export const Partition: React.FC<At & { h?: number; shake?: number }> = ({ h = 1700, shake = 0, ...a }) => (
  <g transform={`${T(a)} translate(${shake} 0)`}>
    <path d={`M-30 ${-h} L30 ${-h} L30 0 L-30 0Z`} fill={C.rail} {...stroke()} />
    {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M-30 ${-h + i * 190} L30 ${-h + i * 190 + 20}`} {...stroke(3, C.wallLow)} />)}
  </g>
);

/** Knock marks on the wall (the learner pounding at 300 volts): `k` 0..1 per knock. */
export const Knocks: React.FC<{ x: number; y: number; k: number }> = ({ x, y, k }) => k <= 0 ? null : (
  <g opacity={clamp(1.4 - k)}>
    {[0, 1, 2, 3, 4].map((i) => {
      const an = -0.9 + i * 0.45, r0 = 40 + k * 40;
      return <path key={i} d={`M${x + Math.cos(an) * r0} ${y + Math.sin(an) * r0} l${Math.cos(an) * 60} ${Math.sin(an) * 60}`} {...stroke(LINE * 1.4, PAL.white)} />;
    })}
    <text x={x + 230} y={y - 50} textAnchor="middle" {...AR} fontSize={110} fill={PAL.white} stroke={INK} strokeWidth={14} paintOrder="stroke" direction="rtl">طَق!</text>
  </g>
);

/** The "electric chair" in the learner's room, with its cable (unplugged in the reveal). */
export const LearnerChair: React.FC<At & { unplugged?: number }> = ({ unplugged = 0, ...a }) => (
  <g transform={T(a)}>
    <path d="M-110 -560 L110 -560 L110 -250 L-110 -250Z" fill="#4A3A35" {...stroke()} />
    <path d="M-130 -260 L130 -260 L130 -220 L-130 -220Z" fill="#5B4740" {...stroke()} />
    <path d="M-110 -220 L-120 0 M110 -220 L120 0" {...stroke(LINE * 1.6, '#4A3A35')} />
    <path d={bowLine(120, -300, 380 - 80 * unplugged, -60 + 50 * unplugged, 30)} fill="none" {...stroke(LINE * 1.2, INK)} />
    <g transform={`translate(${380 - 80 * unplugged} ${-60 + 50 * unplugged}) rotate(${unplugged * 70})`}>
      <rect x={-14} y={-10} width={28} height={20} rx={4} fill={C.steel} {...stroke(3)} />
      <path d="M14 -5 L26 -5 M14 5 L26 5" {...stroke(4)} />
    </g>
    {unplugged > 0.5 && <path d={wobRect(440, -120, 50, 80, 6, 621, 1)} fill={PAL.white} {...stroke(4)} />}
  </g>
);

/** A cup of tea with steam (the actor's), origin = bottom centre. */
export const Tea: React.FC<At & { steam?: number }> = ({ steam = 1, ...a }) => (
  <g transform={T(a)}>
    {[-10, 12].map((x, i) => <path key={i} d={`M${x} -66 q-10 -18 0 -36 q10 -18 0 -36`} fill="none" {...stroke(5, C.glow)} opacity={0.6 * steam} />)}
    <path d="M-32 -60 L32 -60 L26 0 L-26 0Z" fill={PAL.white} {...stroke()} />
    <path d="M32 -46 q26 4 22 22 q-4 14 -26 12" fill="none" {...stroke()} />
    <path d="M-28 -50 L28 -50" {...stroke(10, PAL.red)} opacity={0.8} />
  </g>
);

/* ------------------------------ Asch ------------------------------ */

/** The card on its easel: a reference line (left) and three comparison lines «أ ب ج» (right); «ج» matches. */
export const AschCard: React.FC<At & { mark?: 'ب' | 'ج' | null; markP?: number }> = ({ mark = null, markP = 0, ...a }) => (
  <g transform={T(a)}>
    <path d="M-200 220 L-260 760 M200 220 L260 760 M0 220 L0 760" {...stroke(LINE * 1.4, C.boardEdge)} />
    <path d={wobRect(-380, -240, 760, 470, 14, 631, 1.8)} fill={PAL.paper} {...stroke(LINE * 1.2)} />
    <path d={`M-380 ${-240} L-380 230`} {...stroke()} />
    {/* reference line */}
    <path d="M-250 -120 L-250 140" {...stroke(16, INK)} />
    <path d="M-60 -160 L-60 200" {...stroke(2, PAL.stone)} opacity={0.6} />
    {/* comparison lines */}
    {[['أ', 210, 60], ['ب', 330, 180], ['ج', 260, 300]].map(([l, len, x], i) => (
      <g key={i}>
        <path d={`M${x} ${140 - (len as number)} L${x} 140`} {...stroke(16, INK)} />
        <text x={x as number} y={200} textAnchor="middle" {...AR} fontSize={44} fill={INK} direction="rtl">{l}</text>
        {mark === l && markP > 0 && <circle cx={x as number} cy={186} r={36 * markP} fill="none" {...stroke(7, l === 'ج' ? PAL.blue : PAL.red)} />}
      </g>
    ))}
  </g>
);

/** An answer bubble with a letter (red for the wrong «ب», blue for «ج»); origin = tail tip. */
export const Answer: React.FC<{ x: number; y: number; letter: string; p: number; right?: boolean; s?: number }> = ({ x, y, letter, p, right = false, s = 1 }) => {
  if (p <= 0) return null;
  const k = clamp(p);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * (0.6 + 0.4 * k)})`} opacity={clamp(p * 2)}>
      <path d={`M0 0 L-14 -36 L-60 -36 Q-80 -36 -80 -56 L-80 -126 Q-80 -146 -60 -146 L60 -146 Q80 -146 80 -126 L80 -56 Q80 -36 60 -36 L14 -36Z`} fill={right ? PAL.blue : PAL.white} {...stroke(LINE * 0.9)} />
      <text x={0} y={-66} textAnchor="middle" {...AR} fontSize={72} fill={right ? PAL.white : PAL.red} direction="rtl">{letter}</text>
    </g>
  );
};

/** The long table of Asch's room, origin = floor centre. */
export const Table: React.FC<At & { w: number }> = ({ w, ...a }) => (
  <g transform={T(a)}>
    <path d={wobRect(-w / 2, -300, w, 36, 8, 641, 2)} fill="#5B4A3E" {...stroke()} />
    <path d={wobRect(-w / 2 + 16, -268, w - 32, 268, 8, 642, 2)} fill="#45382F" {...stroke()} />
  </g>
);

/* ------------------------------ the board ------------------------------ */

/** A green chalk board, origin = centre. Children are drawn on it in chalk. */
export const Board: React.FC<At & { w: number; h: number; children?: React.ReactNode }> = ({ w, h, children, ...a }) => (
  <g transform={T(a)}>
    <path d={wobRect(-w / 2 - 30, -h / 2 - 30, w + 60, h + 60, 16, 651, 2)} fill={C.boardEdge} {...stroke()} />
    <path d={wobRect(-w / 2, -h / 2, w, h, 8, 652, 2)} fill={C.board} {...stroke(LINE * 0.8)} />
    {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M${-w / 2 + 40 + rand(i) * w * 0.8} ${-h / 2 + 30 + rand(i + 9) * h * 0.85} l${60 + rand(i + 3) * 80} ${-6}`} {...stroke(3, C.chalk)} opacity={0.08} />)}
    {children}
  </g>
);

/** Chalk text, written in by `p` (clip from the right, the way Arabic is written). */
export const Chalk: React.FC<{ x: number; y: number; text: string; size: number; p: number; color?: string; dir?: 'rtl' | 'ltr' }> = ({ x, y, text, size, p, color = C.chalk, dir = 'rtl' }) => {
  if (p <= 0) return null;
  const w = size * text.length * 0.62 + 40;
  const id = `ck${Math.round(x)}_${Math.round(y)}_${text.length}`;
  return (
    <g>
      <clipPath id={id}><rect x={dir === 'rtl' ? x + w / 2 - w * clamp(p) : x - w / 2} y={y - size * 1.2} width={w * clamp(p)} height={size * 1.6} /></clipPath>
      <text x={x} y={y} textAnchor="middle" {...AR} fontSize={size} fill={color} direction={dir} clipPath={`url(#${id})`}>{text}</text>
    </g>
  );
};

/** Forty little heads (the participants), 8 × 5; the first `red` turn red (went to 450 volts). */
export const HeadGrid: React.FC<{ x: number; y: number; red: number; pop?: number; gap?: number }> = ({ x, y, red, pop = 0, gap = 96 }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: 40 }, (_, i) => {
      const c = i % 8, r = Math.floor(i / 8);
      const cx = (3.5 - c) * gap, cy = (r - 2) * gap;   // right-to-left, top to bottom
      const on = clamp(red - i);
      const s = 1 + (on > 0 && on < 1 ? 0.3 * Math.sin(on * Math.PI) : 0) + pop * 0;
      return (
        <g key={i} transform={`translate(${cx} ${cy}) scale(${s})`}>
          <path d={wobEllipse(0, -8, 26, 28, 660 + i, 0.05, 9)} fill={on > 0.5 ? PAL.red : C.chalk} {...stroke(4)} />
          <path d={`M-30 36 Q0 6 30 36`} fill={on > 0.5 ? PAL.red : C.chalk} {...stroke(4)} />
        </g>
      );
    })}
  </g>
);

/** Two chalk bars (1963, 2006) that grow to nearly the same height; no numbers. */
export const Bars: React.FC<{ x: number; y: number; a: number; b: number; la: string; lb: string; h?: number; colorB?: string }> = ({ x, y, a, b, la, lb, h = 520, colorB = PAL.red }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-280 0 L280 0" {...stroke(5, C.chalk)} />
    {[[a, la, 130, PAL.red], [b, lb, -130, colorB]].map(([v, l, bx, col], i) => (
      <g key={i}>
        <path d={wobRect((bx as number) - 70, -h * (v as number), 140, h * (v as number) + 0.1, 6, 670 + i, 1.5)} fill={col as string} {...stroke(5)} opacity={0.92} />
        <text x={bx as number} y={60} textAnchor="middle" fontFamily={TITLE_FONT} fontWeight={900} fontSize={54} fill={C.chalk} direction="ltr">{l}</text>
      </g>
    ))}
  </g>
);

/** A small flip calendar (year), origin = centre; `flip` 0..1 turns from `from` to `to`. */
export const YearFlip: React.FC<At & { from: string; to: string; flip: number }> = ({ from, to, flip, ...a }) => (
  <g transform={T(a)}>
    <path d={wobRect(-170, -110, 340, 220, 18, 681, 1.5)} fill={PAL.white} {...stroke(LINE * 1.2)} />
    <path d="M-170 -60 L170 -60" {...stroke()} />
    <rect x={-168} y={-108} width={336} height={46} rx={14} fill={PAL.red} />
    <g transform={`translate(0 20) scale(1 ${Math.abs(Math.cos(clamp(flip) * Math.PI))})`}>
      <text x={0} y={40} textAnchor="middle" fontFamily={TITLE_FONT} fontWeight={900} fontSize={116} fill={INK} direction="ltr">{flip < 0.5 ? from : to}</text>
    </g>
  </g>
);
