import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C, INK, Pop, W, ease } from '../kit/draw';
import { BODY, NUM, TITLE } from '../fonts';
import timing from '../timing.json';

// Vertical frame, 1080×1920 logical (rendered ×2 = 2160×3840).
// Safe zones: top 0–110 (platform header), scene 290–1340, captions 1390–1530, bottom 1560+ (platform buttons).
export const CX = 540;
export const FLOOR = 1310;

/** Thin progress line at the very top: how much of the reel has played. */
export const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <rect x={1080 * (1 - f / timing.frames)} y={0} width={1080 * (f / timing.frames)} height={10} fill={C.accent} />;
};

/** Law chip and title at the top; stays while the scene changes under it. */
export const Header: React.FC<{ chip?: string; title: string }> = ({ chip, title }) => (
  <g>
    {chip && <g transform="translate(540 170)">
      <rect x={-150} y={-34} width={300} height={68} rx={34} fill={C.accent} stroke={INK} strokeWidth={5} />
      <text x={0} y={4} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={BODY} fontWeight={700} fontSize={36} fill="#fff">{chip}</text>
    </g>}
    <text x={540} y={chip ? 262 : 200} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={800} fontSize={56} fill={INK}>{title}</text>
  </g>
);

const ORD = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
const UNIT = ['', 'الحادي', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع'];
const TENS = ['', '', 'العشرون', 'الثلاثون', 'الأربعون'];
/** «الأول» … «الثامن والأربعون». */
const ordinal = (n: number) => n <= 10 ? ORD[n] : n < 20 ? `${UNIT[n % 10]} عشر` : n % 10 ? `${UNIT[n % 10]} و${TENS[Math.floor(n / 10)]}` : TENS[n / 10];
/** Law card: the number in a blue disc, «القانون …», and the law in one or two lines. */
export const LawCard: React.FC<{ num: number; lines: string[]; at: number }> = ({ num, lines, at }) => (
  <g>
    <Pop at={at} x={540} y={640}>
      <circle r={190} fill={C.accent} stroke={INK} strokeWidth={12} />
      <text x={0} y={22} textAnchor="middle" dominantBaseline="middle" fontFamily={NUM} fontWeight={900} fontSize={280} fill="#fff">{num}</text>
    </Pop>
    <Pop at={at + 6} x={540} y={930} from="up"><text textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={800} fontSize={60} fill={C.greyDark}>{`القانون ${ordinal(num)}`}</text></Pop>
    {lines.map((l, i) => <Pop key={i} at={at + 12 + i * 8} x={540} y={1060 + i * 100} from="up">
      <text textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={900} fontSize={Math.min(72, Math.floor(1500 / l.length))} fill={INK}>{l}</text>
    </Pop>)}
  </g>
);

/** A row card: icon on the right, text on the left (RTL reading), optional tick/cross state. */
export const Row: React.FC<{ at: number; y: number; icon: React.ReactNode; text: string; mark?: 'tick' | 'cross'; markAt?: number; tone?: string }> = ({ at, y, icon, text, mark, markAt, tone }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = ease(f - at, 0, 12);
  const m = markAt ?? at + 10;
  return <g transform={`translate(${(1 - k) * 160} ${y})`} opacity={k}>
    <rect x={70} y={-82} width={940} height={164} rx={30} fill={tone ?? C.paper} stroke={INK} strokeWidth={W} />
    <g transform="translate(900 0)"><circle r={64} fill="#fff" stroke={INK} strokeWidth={W} /><g transform="scale(0.55)">{icon}</g></g>
    <text x={800} y={4} textAnchor="start" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={800} fontSize={Math.min(54, Math.floor(900 / text.length))} fill={INK}>{text}</text>
    {mark && f >= m && <g transform="translate(150 0)" opacity={ease(f - m, 0, 6)}>
      <circle r={44} fill={mark === 'tick' ? C.green : C.red} stroke={INK} strokeWidth={W} />
      {mark === 'tick' ? <path d="M-20 0 L-6 16 L22 -16" stroke="#fff" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M-16 -16 L16 16 M16 -16 L-16 16" stroke="#fff" strokeWidth={10} strokeLinecap="round" />}
    </g>}
  </g>;
};

// Captions: the narration's own words, grouped into short lines; the word being spoken is lit.
type Word = { t: string; a: number; b: number };
const GROUPS: Word[][] = (() => {
  const out: Word[][] = [];
  for (const c of timing.chunks as unknown as Array<{ start: number; words: Array<[string, number, number]> }>) {
    let g: Word[] = [];
    for (const [t, a, b] of c.words) {
      g.push({ t, a: (c.start + a) * timing.fps, b: (c.start + b) * timing.fps });
      const len = g.reduce((n, w) => n + w.t.length + 1, 0);
      if (g.length >= 5 || len > 26 || (/[.،,!?؟…:؛»]$/.test(t) && g.length >= 2)) { out.push(g); g = []; }
    }
    if (g.length) out.push(g);
  }
  return out;
})();

export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  let gi = -1;
  for (let i = 0; i < GROUPS.length; i++) {
    const end = i + 1 < GROUPS.length ? Math.min(GROUPS[i + 1][0].a, GROUPS[i][GROUPS[i].length - 1].b + 24) : GROUPS[i][GROUPS[i].length - 1].b + 24;
    if (f >= GROUPS[i][0].a - 2 && f < end) { gi = i; break; }
  }
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const k = ease(f - (g[0].a - 2), 0, 6);
  return <g transform={`translate(540 1460) scale(${0.94 + 0.06 * k})`} opacity={k}>
    <rect x={-500} y={-62} width={1000} height={124} rx={30} fill="#fff" opacity={0.92} />
    <text x={0} y={6} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={BODY} fontWeight={700} fontSize={60}
      stroke={INK} strokeWidth={0} paintOrder="stroke">
      {g.map((w, i) => {
        const on = f >= w.a && f < (i + 1 < g.length ? g[i + 1].a : w.b + 12);
        return <tspan key={i} fill={on ? C.accent : INK}>{w.t + (i + 1 < g.length ? ' ' : '')}</tspan>;
      })}
    </text>
  </g>;
};

/** The series note on screen, word for word (reels/qawanin-alquwwa/SERIES.md): «للتعلّم والفهم — بعض القوانين تخالف الإسلام والأخلاق». */
export const Disclaimer: React.FC<{ at: number; y?: number }> = ({ at, y = 880 }) => (
  <Pop at={at} x={540} y={y} from="up">
    <rect x={-470} y={-170} width={940} height={340} rx={40} fill="#fff" stroke={C.accent} strokeWidth={10} />
    <text x={0} y={-62} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={900} fontSize={76} fill={C.accent}>للتعلّم والفهم —</text>
    <text x={0} y={62} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={800} fontSize={44} fill={INK}>بعض القوانين تخالف الإسلام والأخلاق</text>
  </Pop>
);

/** The law-specific warning (SERIES.md rule 6), for laws that involve deception, injustice or taking others' rights. */
export const Alert: React.FC<{ at: number; text: string; y?: number }> = ({ at, text, y = 470 }) => (
  <Pop at={at} x={540} y={y} from="up">
    <rect x={-470} y={-120} width={940} height={240} rx={36} fill="#fff" stroke={C.red} strokeWidth={10} />
    <text x={0} y={-44} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={900} fontSize={64} fill={C.red}>تنبيه خاص</text>
    <text x={0} y={52} textAnchor="middle" dominantBaseline="middle" direction="rtl" fontFamily={TITLE} fontWeight={800} fontSize={text.length > 22 ? 42 : 50} fill={INK}>{text}</text>
  </Pop>
);

/** The 48 laws as a grid read from the right: earlier parts cream, this part's laws lit blue one by one from `lit`. */
export const Grid48: React.FC<{ at: number; lit: number; from: number; to: number; y?: number }> = ({ at, lit, from, to, y = 890 }) => {
  const f = useCurrentFrame();
  return <g>{Array.from({ length: 48 }, (_, i) => {
    if (f < at + i / 2) return null;
    const mine = i + 1 >= from && i + 1 <= to;
    const on = mine && f >= lit + (i + 1 - from) * 4;
    return <g key={i}>
      <rect x={980 - (i % 12) * 80 - 32} y={y + Math.floor(i / 12) * 80 - 32} width={64} height={64} rx={12}
        fill={on ? C.accent : i + 1 < from ? C.cream : C.shade} stroke={INK} strokeWidth={on ? 6 : 3} />
      {(on || i + 1 < from) && <text x={980 - (i % 12) * 80} y={y + Math.floor(i / 12) * 80 + 3} textAnchor="middle" dominantBaseline="middle"
        fontFamily={NUM} fontWeight={900} fontSize={32} fill={on ? '#fff' : C.greyDark}>{i + 1}</text>}
    </g>;
  })}</g>;
};
