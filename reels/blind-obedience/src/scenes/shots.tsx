import React from 'react';
import { PAL, clamp, stroke } from '@mukarram/characters/ink';
import { Narrator } from '@mukarram/characters/cast';
import { Expression, ExprName } from '@mukarram/characters/face';
import { POSES, Pose, mixPose } from '@mukarram/characters/rig';
import { Shot } from '@mukarram/video/stage';
import { Employee, reach } from '@doublethink/characters/employee';
import { AschCard, Answer, Board, C, Chalk, Desk, GEN, Generator, HeadGrid, Knocks, LearnerChair, Partition, Table, Tea, YearFlip, switchX } from '../characters/lab';
import { Actor, Experimenter, Member } from '../characters/people';
import { TITLE_FONT } from '../video/fonts';
import { TL, ease, keys, prog, sec, segStart, wordAt, wordEnd } from '../video/time';
import { ShotProps, X, idle, talkAt, xTrack } from './common';

export type { ShotProps };

// Three places: Milgram's lab (1963) with the learner's room behind the partition, Asch's room (1955), and a
// chalk board for the numbers. Every number on screen is the source's own (see script.md); the acting is in
// the participant's hands and face, the camera only frames.

type V = [number, number];
const P = (n: keyof typeof POSES): Pose => POSES[n] as Pose;
const k2 = (f: number, t0: number, t1: number, a: number, b: number) => keys(f, [[t0, a], [t1, b]], ease.inOut);

/* ------------------------------ beats ------------------------------ */

const beats = () => {
  const w = wordAt, we = wordEnd, ss = segStart;
  return {
    prod1: w('s01', 'استمر'), coat: w('s02', 'بمعطف'), press: w('s02', 'بتضغط'),
    yale: w('s03', 'ييل'), one: w('s03', 'واحد'), result: w('s04', 'النتيجة'), r26: w('s04', 'ستة'), r40: w('s04', 'أربعين'),
    reach: w('s04', 'وصلوا'), v450: w('s04', 'أربعمية'), volt: w('s04', 'فولت'),
    prod2: ss('s05'), knock: w('s06', 'طرق'), silent: w('s06', 'سكت'), prod4: ss('s07'), choice: w('s07', 'خيار'),
    go: ss('s08') - 14, kept: w('s08', 'وكمّلوا'), good: w('s09', 'الخبر'), actor: w('s09', 'ممثل'), fake: w('s09', 'والصعق'),
    bad: w('s10', 'الخبر'), noOne: w('s10', 'محد'), group: w('s11', 'تكفي'), asch: w('s12', 'تجربة'), all: w('s12', 'والكل'),
    alone: w('s13', 'لوحدهم'), right1: w('s13', 'غلطوا'), amid: w('s13', 'وسط'), walk: w('s13', 'مشوا'), p37: w('s13', 'سبعة'),
    old: w('s14', 'زمان'), y2006: w('s14', 'ألفين'), close: w('s14', 'والنسب'),
    breaks: w('s15', 'يكسر'), oneP: w('s15', 'شخص'), right2: w('s15', 'الصح'), partner: w('s16', 'شريك'), quarter: w('s16', 'للربع'),
    blind: w('s17', 'الامتثال'), pressure: w('s17', 'ضغط'), you: w('s17', 'أنت'),
    room: w('s18', 'بالغرفة'), wouldYou: w('s18', 'بتضغط'), comments: w('s18', 'قلها'), follow: w('s18', 'وتابعنا'), end: TL.durationInFrames,
    icons: TL.durationInFrames - sec(2), s04end: we('s04', 'فولت'),
  };
};
let cache: ReturnType<typeof beats> | null = null;
export const B = () => (cache ??= beats());

/* ------------------------------ overlays ------------------------------ */

/** The source of what is on screen, in a small pill at the top (credibility before virality). */
const Badge: React.FC<{ text: string; p: number }> = ({ text, p }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', justifyContent: 'center', opacity: clamp(p * 2), transform: `translateY(${(1 - clamp(p)) * -20}px)` }}>
    <div dir="rtl" lang="ar" style={{ fontFamily: TITLE_FONT, fontWeight: 800, fontSize: 40, color: PAL.white, background: 'rgba(15,20,28,0.82)', padding: '4px 26px 10px', borderRadius: 999, border: `4px solid ${PAL.red}` }}>{text}</div>
  </div>
);
/** A big number stamped in (65% / 37%), HTML so it stays crisp. */
const Stamp: React.FC<{ text: string; p: number; top?: number; color?: string }> = ({ text, p, top = 1260, color = PAL.red }) => p <= 0 ? null : (
  <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', opacity: clamp(p * 3), transform: `scale(${1.6 - 0.6 * clamp(p)}) rotate(${-6 + 2 * clamp(p)}deg)` }}>
    <div dir="ltr" style={{ fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 150, lineHeight: 1, color, background: PAL.white, padding: '6px 40px 18px', borderRadius: 28, border: `10px solid ${color}`, boxShadow: '0 12px 0 rgba(0,0,0,0.35)' }}>{text}</div>
  </div>
);
const Icons: React.FC<{ p: number }> = ({ p }) => (
  <div dir="rtl" style={{ position: 'absolute', left: 0, right: 0, top: 1320, display: 'flex', justifyContent: 'center', gap: 40, opacity: clamp(p * 2), transform: `translateY(${(1 - clamp(p)) * 40}px)` }}>
    {[['إعجاب', 'M0 14 C-34 -10 -22 -40 0 -20 C22 -40 34 -10 0 14Z', PAL.red], ['متابعة', 'M-16 -2 L16 -2 M0 -18 L0 14', PAL.blue]].map(([t, d, c], i) => (
      <div key={i} dir="rtl" lang="ar" style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: TITLE_FONT, fontWeight: 900, fontSize: 62, color: PAL.ink, background: '#E6ECF4', padding: '6px 34px 14px', borderRadius: 999, border: `6px solid ${PAL.ink}`, boxShadow: `0 7px 0 ${c}` }}>
        <svg width={58} height={58} viewBox="-29 -29 58 58"><circle r={26} fill={c} stroke={PAL.ink} strokeWidth={4} /><path d={d} fill={i ? 'none' : PAL.white} stroke={PAL.white} strokeWidth={i ? 7 : 0} strokeLinecap="round" /></svg>
        {t}
      </div>
    ))}
  </div>
);
/** Darkened edges for the lonely moments. */
const Vignette: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)', opacity: o }} />
);

/* ------------------------------ Milgram's lab ------------------------------ */

const FLOOR = 1500;
const GX = 470, GY = FLOOR - 330;             // the generator stands on the desk top
const sw = (i: number, d = 0): V => [GX + switchX(i), GY - 41 - 16 + 32 * d];
const PX = 1000, EX = 1230;                     // participant, experimenter
const PART = { x: PX, y: FLOOR, s: 1, facing: 1 as const };

type Lab = { down: number; focus?: number; glow?: number; hand?: V | null; handOpen?: boolean; expr?: ReturnType<typeof xTrack>; look?: V; glance?: V;
  exp?: { pose?: Pose; expr?: Expression | ExprName; look?: V; talk?: number; glint?: number }; knock?: number; shake?: number; lean?: number; sweat?: boolean; tea?: number; unplug?: number; tag?: boolean };

const LabWorld: React.FC<{ f: number; s: Lab }> = ({ f, s }) => {
  const id = idle(f, 41), ide = idle(f, 71), ida = idle(f, 81);
  let pose: Pose = { ...P('stand'), lean: s.lean ?? (s.hand ? -14 : -4) };
  if (s.hand) pose = reach(pose, { ...PART, bob: id.bob }, s.hand, null);
  pose = { ...pose, handL: s.handOpen ? 'open' : 'point' };
  return (
    <g>
      {/* rooms */}
      <rect x={-1200} y={-400} width={3000} height={FLOOR + 400} fill={C.wall} />
      <rect x={-1200} y={-400} width={1160} height={FLOOR + 400} fill={C.room2} />
      <rect x={-1200} y={FLOOR - 360} width={3000} height={360} fill={C.wallLow} />
      <rect x={-1200} y={FLOOR} width={3000} height={900} fill={C.floor} />
      <path d={`M-1200 ${FLOOR} L1800 ${FLOOR}`} {...stroke()} />
      {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${-1200 + i * 230} ${FLOOR + 30} L${-1380 + i * 230} 2400`} stroke={C.floorLine} strokeWidth={6} />)}
      {/* the learner's room: his chair, and him — an actor — with his tea */}
      <LearnerChair x={-560} y={FLOOR} unplugged={s.unplug ?? 0} />
      <Actor x={-330} y={FLOOR} s={1} pose={{ ...P('stand'), armR: [20, -128], handR: 'fist', lean: -4, tilt: 6 }} expr="satisfied" blink={ida.blink} bob={ida.bob} look={[-0.2, 0]} tag={s.tag} />
      <Tea x={-262} y={FLOOR - 400} s={0.9} steam={s.tea ?? 1} />
      <Partition x={-40} y={FLOOR} shake={s.shake ?? 0} />
      <Knocks x={-40} y={FLOOR - 820} k={s.knock ?? 0} />
      {/* the experimenter behind, the participant at the end of the generator */}
      <Experimenter x={EX} y={FLOOR} s={1} pose={s.exp?.pose ?? { ...P('stand'), armL: [30, -100], handL: 'mitten' }} expr={s.exp?.expr ?? 'neutral'} blink={ide.blink} bob={ide.bob}
        look={s.exp?.look ?? [-0.5, 0]} glance={s.exp?.look ?? [-0.5, 0]} talk={s.exp?.talk ?? 0} glint={s.exp?.glint ?? 0} />
      <Desk x={GX + 10} y={FLOOR} w={860} />
      <Generator x={GX} y={GY} down={s.down} focus={s.focus ?? 29} glow={s.glow ?? 0} />
      <Employee x={PX} y={FLOOR} s={1} pose={pose} expr={s.expr ?? 'neutral'} blink={id.blink} bob={id.bob} look={s.look ?? [-0.5, 0.2]} glance={s.glance ?? s.look ?? [-0.5, 0.2]} shadow />
    </g>
  );
};
const LabShot: React.FC<{ f: number; cam: { cx: number; cy: number; zoom: number; shake?: number }; s: Lab; overlay?: React.ReactNode }> = ({ f, cam, s, overlay }) => (
  <Shot f={f} cam={cam} bounds={[-1200, -100, 1800, 2400]} bg={C.wall} overlay={overlay}><LabWorld f={f} s={s} /></Shot>
);
const hover = (f: number, i: number, amp = 6): V => { const p = sw(i); return [p[0] + Math.sin(f * 0.9) * amp * 0.4, p[1] - 38 + Math.sin(f * 1.7) * amp]; };

/** 01 · «من فضلك… استمر.» — close on the end of the panel: every switch down to 435; a finger trembles over 450. */
export const Hook: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const dip = prog(f, b.prod1 + 2, 10, ease.inOut) * (1 - prog(f, b.prod1 + 16, 12));
  const h = hover(f, 29, 7);
  return <LabShot f={f} cam={{ cx: 815, cy: 1095, zoom: k2(f, t0, t1, 3.0, 3.3) }}
    s={{ down: 29, glow: 0.6 + 0.4 * Math.sin(f * 0.3), hand: [h[0], h[1] + 26 * dip], expr: X.strain }} overlay={<Vignette o={0.5} />} />;
};

/** 02 · «لو قالها لك رجل بمعطف رمادي… بتضغط؟» — the room: the grey coat behind him; on «بتضغط؟» he looks at us. */
export const Room: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const toCoat = prog(f, b.coat - 6, 18), toYou = prog(f, b.press - 8, 14);
  const cx = 700 + 380 * toCoat - 260 * toYou, zoom = 1.0 + 0.45 * toCoat + 0.25 * toYou;
  const exprs = xTrack(f, [[t0, X.strain], [b.press - 4, X.hesitant]]);
  return <LabShot f={f} cam={{ cx, cy: 1080 - 40 * toCoat, zoom: k2(f, t0, t1, zoom, zoom + 0.04) }}
    s={{ down: 29, glow: 0.5, hand: hover(f, 29, 4), expr: exprs, look: f >= b.press - 4 ? [0, 0] : [-0.5, 0.2], glance: f >= b.press - 4 ? [0, 0] : [-0.6, 0.3],
      exp: { pose: { ...P('stand'), armL: [30, -100] }, look: [-0.5, 0.1], expr: 'determined' } }}
    overlay={<Badge text="تجربة ميلغرام، 1963" p={prog(f, t0 + 4, 10)} />} />;
};

/** 05 · «وصلوا لآخر زر: أربعمية وخمسين فولت.» — the last switch goes down; «65%». */
export const LastSwitch: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const d = prog(f, b.v450 - 2, 6, ease.in);
  const h = sw(29, d);
  return <LabShot f={f} cam={{ cx: 815, cy: 1095, zoom: k2(f, t0, t1, 3.1, 3.4), shake: f >= b.v450 + 4 && f < b.v450 + 12 ? 6 : 0 }}
    s={{ down: 29 + d, glow: 1, hand: [h[0], h[1] - 20 * (1 - d)], expr: X.strain }}
    overlay={<><Vignette o={0.45} /><Stamp text="65%" p={prog(f, b.volt - 2, 8, ease.back)} /></>} />;
};

/** 06 · «التجربة تتطلّب أن تستمر.» — he turns to the coat; the coat taps the clipboard. */
export const Prod2: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const tap = Math.max(0, Math.sin((f - b.prod2) * 0.5)) * 10 * (f > b.prod2 + 10 && f < b.prod2 + 40 ? 1 : 0);
  return <LabShot f={f} cam={{ cx: 1060, cy: 1060, zoom: k2(f, t0, t1, 1.55, 1.62) }}
    s={{ down: 19, hand: hover(f, 19, 5), expr: xTrack(f, [[t0, X.hesitant], [b.prod2 + 20, X.doubt]]), look: [0.6, -0.1], glance: [0.9, -0.2],
      exp: { pose: { ...P('stand'), armL: [30, -100], armR: [40 + tap, -80], handR: 'point' }, expr: 'determined', look: [-0.6, 0.1], talk: talkAt(f, 'X') } }} />;
};

/** 07 · «الرجل خلف الجدار طرق… ثم سكت.» — the partition shakes twice at 300 volts; then nothing. */
export const Wall: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const k1 = f >= b.knock - 2 ? clamp((f - b.knock + 2) / 18) : 0, k2_ = f >= b.knock + 12 ? clamp((f - b.knock - 12) / 18) : 0;
  const shake = (f >= b.knock - 2 && f < b.knock + 6) || (f >= b.knock + 12 && f < b.knock + 20) ? Math.sin(f * 3) * 6 : 0;
  return <LabShot f={f} cam={{ cx: k2(f, t0, t1, 540, 500), cy: 1060, zoom: 0.9 }}
    s={{ down: 20, hand: hover(f, 19, 3), knock: Math.max(k1, k2_), shake, expr: xTrack(f, [[t0, X.doubt], [b.knock, 'surprised'], [b.silent, X.dread]]), look: [-0.7, -0.2], glance: [-1, -0.2],
      exp: { look: [-0.7, -0.1] } }} overlay={<Vignette o={0.3 * prog(f, b.silent, 10)} />} />;
};

/** 08 · «ليس لديك خيار آخر… يجب أن تستمر.» — the face under the glasses; a glint on «خيار». */
export const Prod4: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  return <LabShot f={f} cam={{ cx: EX - 10, cy: FLOOR - 470, zoom: k2(f, t0, t1, 2.5, 2.75) }}
    s={{ down: 20, hand: hover(f, 19, 3), exp: { pose: { ...P('stand'), armL: [30, -100] }, expr: X.calm, look: [-0.3, 0.05], talk: talkAt(f, 'X'), glint: prog(f, b.choice, 4) * (1 - prog(f, b.choice + 8, 8)) } }}
    overlay={<Vignette o={0.4} />} />;
};

/** 09 · «وكمّلوا.» — the finger goes on: 315, 330, 345. */
export const KeptGoing: React.FC<ShotProps> = ({ f }) => {
  const b = B();
  const n = keys(f, [[b.go, 20], [b.go + 10, 21], [b.go + 20, 21], [b.go + 28, 22], [b.go + 36, 22], [b.go + 42, 23]], ease.in);
  const i = Math.floor(n), d = n - i;
  const h = sw(i, d);
  return <LabShot f={f} cam={{ cx: GX + switchX(21), cy: 1095, zoom: 3.0 }} s={{ down: n, glow: 0.4, focus: i, hand: [h[0], h[1] - 18 * (1 - d)], expr: X.strain }} overlay={<Vignette o={0.55} />} />;
};

/** 10 · «الخبر الطيب: كان ممثل، والصعق مو حقيقي.» — behind the partition: the man is fine, with his tea; unplugged. */
export const Reveal: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  return <LabShot f={f} cam={{ cx: k2(f, t0, t0 + 18, -60, -380), cy: 1130, zoom: 1.5 }}
    s={{ down: 23, tag: f >= b.actor - 2, unplug: prog(f, b.fake, 12, ease.back), tea: 1 }} />;
};

/** 11 · «الخبر السيئ: محد قال لهم.» — the participant alone at the panel, sweating. */
export const Alone: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  return <LabShot f={f} cam={{ cx: PX - 40, cy: FLOOR - 430, zoom: k2(f, t0, t1, 2.2, 2.45) }}
    s={{ down: 23, hand: hover(f, 23, 9), expr: xTrack(f, [[t0, X.dread], [b.noOne, X.strain]]), look: [-0.3, 0.4], glance: [-0.4, 0.6] }} overlay={<Vignette o={0.7} />} />;
};

/** 20 · «لو كنت بالغرفة… كنت بتضغط؟ قلها بصراحة في التعليقات… وتابعنا.» — back to the hovering finger. Open ending. */
export const Question: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const back = prog(f, b.comments, 30, ease.inOut);
  const h = hover(f, 29, 8);
  return <LabShot f={f} cam={{ cx: 815, cy: 1095, zoom: k2(f, t0, t1, 2.8, 3.1) }}
    s={{ down: 29, glow: 0.6 + 0.4 * Math.sin(f * 0.3), hand: [h[0] + 40 * back, h[1] - 60 * back], handOpen: back > 0.5, expr: X.strain }}
    overlay={<><Vignette o={0.5} /><Icons p={prog(f, b.icons, 10, ease.back)} /></>} />;
};

/* ------------------------------ the board ------------------------------ */

const BoardShot: React.FC<{ f: number; t0: number; zoom?: number; children: React.ReactNode; overlay?: React.ReactNode }> = ({ f, t0, zoom = 1.0, children, overlay }) => (
  <Shot f={f} cam={{ cx: 540, cy: 900, zoom: zoom + 0.0012 * (f - t0) }} bounds={[-400, -400, 1480, 2320]} bg={C.wall} overlay={overlay}>
    <rect x={-400} y={-400} width={1880} height={2720} fill={C.wall} />
    <Board x={540} y={900} w={940} h={1180}>{children}</Board>
  </Shot>
);

/** 03 · «طلاب في جامعة ييل توقّعوا: واحد من كل مية بس.» */
export const Predict: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  return <BoardShot f={f} t0={t0} zoom={1.0}>
    <Chalk x={0} y={-400} text="قبل التجربة" size={70} p={prog(f, t0 + 2, 14, ease.linear)} />
    <Chalk x={0} y={-290} text="توقّع طلاب علم النفس في ييل:" size={46} p={prog(f, b.yale - 8, 18, ease.linear)} />
    <Chalk x={0} y={40} text="1%" size={300} p={prog(f, b.one - 2, 14, ease.linear)} dir="ltr" />
    <Chalk x={0} y={240} text="يكملون حتى 450 فولت" size={52} p={prog(f, b.one + 14, 18, ease.linear)} />
  </BoardShot>;
};

/** 04 · «النتيجة؟ ستة وعشرين من أربعين…» — forty heads; twenty-six go red. */
export const Result: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const red = keys(f, [[b.r26, 0], [b.r40 + 18, 26]], ease.inOut);
  return <BoardShot f={f} t0={t0} zoom={1.0} overlay={<Badge text="ميلغرام، 1963 — 40 مشاركًا" p={prog(f, t0 + 2, 10)} />}>
    <Chalk x={0} y={-430} text="النتيجة" size={76} p={prog(f, b.result - 2, 12, ease.linear)} />
    <HeadGrid x={0} y={-20} red={red} />
    <Chalk x={0} y={360} text={`${Math.round(red)} من 40`} size={84} p={prog(f, b.r26, 6, ease.linear)} color={red > 0 ? '#FF8A93' : C.chalk} />
  </BoardShot>;
};

/** 16 · «تقول هذا زمان؟ أعادوا تجربة ميلغرام سنة ألفين وستة… والنسب قريبة.» */
export const Today: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const g = prog(f, b.close - 6, 18);
  return <BoardShot f={f} t0={t0} zoom={1.0} overlay={<Badge text="برغر، 2009 — إعادة جزئية سنة 2006" p={prog(f, t0 + 2, 10)} />}>
    <YearFlip x={0} y={-370} s={1} from="1963" to="2006" flip={prog(f, b.y2006 - 4, 12)} />
    <g transform="translate(0 420)">
      <path d="M-300 0 L300 0" {...stroke(5, C.chalk)} />
      {[[1, '1963', 140, PAL.red], [0.93, '2006', -140, '#FF8A93']].map(([v, l, x, col], i) => (
        <g key={i}>
          <path d={`M${(x as number) - 80} ${-560 * (v as number) * g} L${(x as number) + 80} ${-560 * (v as number) * g} L${(x as number) + 80} 0 L${(x as number) - 80} 0Z`} fill={col as string} {...stroke(5)} />
          <text x={x as number} y={70} textAnchor="middle" fontFamily={TITLE_FONT} fontWeight={900} fontSize={56} fill={C.chalk} direction="ltr">{l}</text>
        </g>
      ))}
      <Chalk x={0} y={160} text="قريبة جدًا" size={60} p={prog(f, b.close + 6, 14, ease.linear)} />
    </g>
  </BoardShot>;
};

/** 18 · «لما كان مع المشارك شريك واحد صادق… نزل الغلط للربع.» — the error bar falls to a quarter. */
export const Quarter: React.FC<ShotProps> = ({ f, t0 }) => {
  const b = B();
  const g = prog(f, t0 + 4, 14), q = prog(f, b.partner, 20, ease.out);
  return <BoardShot f={f} t0={t0} zoom={1.0} overlay={<Badge text="آش، 1955" p={prog(f, t0 + 2, 10)} />}>
    <Chalk x={0} y={-440} text="الإجابات الخاطئة" size={66} p={prog(f, t0 + 2, 14, ease.linear)} />
    <g transform="translate(0 330)">
      <path d="M-330 0 L330 0" {...stroke(5, C.chalk)} />
      <path d={`M60 ${-600 * g} L260 ${-600 * g} L260 0 L60 0Z`} fill={PAL.red} {...stroke(5)} />
      <path d={`M-260 ${-150 * q} L-60 ${-150 * q} L-60 0 L-260 0Z`} fill={PAL.blue} {...stroke(5)} />
      <Chalk x={160} y={80} text="الجماعة ضدك" size={46} p={g} />
      <Chalk x={-160} y={80} text="ومعك شريك" size={46} p={prog(f, b.partner - 4, 12, ease.linear)} />
      <Chalk x={-160} y={-150 * q - 40} text="الربع" size={64} p={prog(f, b.quarter, 10, ease.linear)} color="#9CC7F0" />
    </g>
  </BoardShot>;
};

/* ------------------------------ Asch's room ------------------------------ */

const SEAT = (order: number) => 1000 - order * 131;    // first answer on the right (read right to left)
const PSEAT = 6;                                     // the participant answers second to last, as in Asch
const AY = 1500 - 130;

type AschState = { answers: number; wrongP?: number; partner?: boolean; pAnswer?: 'ب' | 'ج' | null; pP?: number; alone?: boolean; turn?: number; pExpr?: ReturnType<typeof xTrack> };

const AschWorld: React.FC<{ f: number; r: AschState }> = ({ f, r }) => {
  const people = Array.from({ length: 8 }, (_, o) => o);
  return (
    <g>
      <rect x={-400} y={-400} width={1880} height={2720} fill="#1E2A40" />
      <rect x={-400} y={1100} width={1880} height={400} fill="#19233A" />
      <rect x={-400} y={1500} width={1880} height={900} fill={C.floor} />
      <AschCard x={540} y={560} s={0.95} mark={r.pAnswer ?? null} markP={r.pP ?? 0} />
      {people.map((o) => {
        const x = SEAT(o), id = idle(f, 30 + o);
        const look: V = [o === PSEAT ? 0 : (SEAT(PSEAT) - x) / 900 * (r.turn ?? 0), -0.5 * (1 - (r.turn ?? 0))];
        const faded = r.alone && o !== PSEAT;
        if (faded) return null;
        if (o === PSEAT) return <Employee key={o} x={x} y={AY} s={0.62} pose={P('stand')} expr={r.pExpr ?? 'neutral'} blink={id.blink} bob={id.bob} look={[0, -0.4]} glance={[0, -0.6]} earPencil shadow={false} />;
        if (r.partner && o === 5) return <Narrator key={o} x={x} y={AY} s={0.62} pose={P('stand')} expr="satisfied" blink={id.blink} bob={id.bob} look={look} shadow={false} />;
        const k = o < PSEAT ? o : 6;
        return <Member key={o} k={k} x={x} y={AY} s={0.62} pose={P('stand')} expr={(r.turn ?? 0) > 0.5 ? 'skeptical' : 'neutral'} blink={id.blink} bob={id.bob} look={look} glance={look} shadow={false} />;
      })}
      <Table x={540} y={1500} w={1120} />
      {people.map((o) => {
        if (o === PSEAT || (r.alone && o !== PSEAT)) return null;
        const p = clamp(r.answers - o) * (r.wrongP ?? 1);
        const right = !!r.partner && o === 5;
        return <Answer key={o} x={SEAT(o)} y={AY - 300} letter={right ? 'ج' : 'ب'} right={right} p={p} s={0.62} />;
      })}
      {r.pAnswer && <Answer x={SEAT(PSEAT)} y={AY - 300} letter={r.pAnswer} right={r.pAnswer === 'ج'} p={r.pP ?? 0} s={0.75} />}
    </g>
  );
};
const AschShot: React.FC<{ f: number; cam: { cx: number; cy: number; zoom: number }; r: AschState; overlay?: React.ReactNode }> = ({ f, cam, r, overlay }) => (
  <Shot f={f} cam={cam} bounds={[-400, -400, 1480, 2320]} bg="#1E2A40" overlay={overlay}><AschWorld f={f} r={r} /></Shot>
);

/** 12 · «وما تحتاج معطف… تكفي جماعة.» — the room of eight; on «تكفي جماعة» seven heads turn to him. */
export const Group: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  return <AschShot f={f} cam={{ cx: 540, cy: 980, zoom: k2(f, t0, t1, 0.98, 1.08) }} r={{ answers: 0, turn: prog(f, b.group - 4, 12), pExpr: xTrack(f, [[t0, 'neutral'], [b.group, 'surprised']]) }}
    overlay={<Badge text="تجربة آش، 1955" p={prog(f, t0 + 2, 10)} />} />;
};

/** 13 · «تجربة آش: خط واضح، والكل حولك يقول الجواب الغلط.» — seven «ب» bubbles, right to left. */
export const Lines: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const ans = keys(f, [[b.all - 4, 0], [b.all + 50, 6]], ease.linear);
  return <AschShot f={f} cam={{ cx: 540, cy: k2(f, t0, b.all, 640, 940), zoom: k2(f, t0, b.all, 1.35, 1.0) }} r={{ answers: ans, pExpr: xTrack(f, [[t0, 'curious'], [b.all + 20, 'surprised']]) }} />;
};

/** 14 · «لوحدهم ما غلطوا تقريبًا.» — alone with the card, he says «ج». */
export const AloneRight: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  return <AschShot f={f} cam={{ cx: 420, cy: 900, zoom: k2(f, t0, t1, 1.12, 1.2) }} r={{ answers: 0, alone: true, pAnswer: 'ج', pP: prog(f, b.right1 - 4, 8, ease.back), pExpr: xTrack(f, [[t0, 'neutral'], [b.right1, 'satisfied']]) }} />;
};

/** 15 · «وسط الجماعة؟ مشوا مع الغلط في سبعة وثلاثين بالمية من الإجابات.» — with them, he says «ب»; «37%». */
export const Yield: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  return <AschShot f={f} cam={{ cx: k2(f, t0, t1, 360, 300), cy: 1120, zoom: k2(f, t0, t1, 1.55, 1.75) }}
    r={{ answers: 7, turn: 1, pAnswer: 'ب', pP: prog(f, b.walk - 4, 8, ease.back), pExpr: xTrack(f, [[t0, X.doubt], [b.walk - 6, X.hesitant]]) }}
    overlay={<Stamp text="37%" p={prog(f, b.p37 - 2, 8, ease.back)} top={330} />} />;
};

/** 17 · «طيب… وش يكسر الضغط؟ شخص واحد يقول الصح.» — one honest partner says «ج»; so does he. */
export const OnePerson: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  return <AschShot f={f} cam={{ cx: k2(f, t0, b.oneP, 540, 300), cy: k2(f, t0, b.oneP, 960, 1100), zoom: k2(f, t0, b.oneP, 1.0, 1.6) }}
    r={{ answers: keys(f, [[t0, 4], [b.oneP + 4, 6]], ease.linear), turn: 1, partner: true, pAnswer: f >= b.right2 - 6 ? 'ج' : null, pP: prog(f, b.right2 - 6, 8, ease.back),
      pExpr: xTrack(f, [[t0, X.doubt], [b.oneP + 6, 'surprised'], [b.right2 - 4, X.relieved]]) }} />;
};

/** 19 · «الامتثال الأعمى مو غباء… هو ضغط. والسؤال: تكون أنت الشريك؟» — the narrator himself, to us. */
export const YouPartner: React.FC<ShotProps> = ({ f, t0, t1 }) => {
  const b = B();
  const id = idle(f, 11);
  const pose = mixPose(mixPose(P('stand'), P('palmsOut'), prog(f, b.pressure - 8, 8)), P('pointCam'), prog(f, b.you - 6, 6));
  return (
    <Shot f={f} cam={{ cx: 540, cy: 1060, zoom: k2(f, t0, t1, 1.5, 1.62) }} bounds={[-400, -400, 1480, 2320]} bg="#1E2A40">
      <rect x={-400} y={-400} width={1880} height={2720} fill="#1E2A40" />
      <rect x={-400} y={1500} width={1880} height={900} fill={C.floor} />
      <AschCard x={540} y={420} s={0.7} mark="ج" markP={1} />
      <Narrator x={540} y={1500} s={1.15} pose={pose} expr={xTrack(f, [[t0, 'neutral'], [b.pressure - 4, X.sincere], [b.you - 4, 'curious']])} blink={id.blink} bob={id.bob} talk={talkAt(f, 'N')} look={[0, 0]} />
    </Shot>
  );
};

