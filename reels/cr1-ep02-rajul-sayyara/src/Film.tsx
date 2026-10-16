import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { LONG, SHORT, hookBeats } from './programs';
import { Apply } from './scenes/apply';
import { Back } from './scenes/back';
import { Chance } from './scenes/chance';
import { Hook } from './scenes/hook';
import { Limits } from './scenes/limits';
import { Question } from './scenes/question';
import { Respect } from './scenes/respect';
import { Mirror, Valet } from './scenes/valet';
import { Want } from './scenes/want';
import { Freedom, ReelWealth, Wealth } from './scenes/wealth';
import { type Ratio } from './stage';
import { BookCard, Captions, Guides, Signature, StoryTag, Title } from './text';
import { C, PROFILES } from './theme';
import { life, mix, prog, sec, setFps, timing, type Program, type Timing } from './time';

// The episode (16:9) and the reel (9:16, 4:5): one scene per narration segment. Each cut sits in
// the pause between two segments and the next scene dissolves in over 0.4 s.
type Scene = { seg: string; render: (f: number, T: Timing, r: Ratio) => React.ReactNode; story?: boolean; book?: boolean; continuous?: boolean; tagTo?: (T: Timing) => number };

const LONG_SCENES: Scene[] = [
  { seg: 'L1', story: true, render: (f, _T, r) => <Hook f={f} b={hookBeats('long')} ratio={r} /> },
  { seg: 'L2', continuous: true, render: (f, T, r) => <Question f={f} hb={hookBeats('long')} ratio={r} k={{
    start: T.segStart('L2'), why: T.at('L2', 7, 'ليش'), whyEnd: T.at('L2', 11, 'وإيش'), money: T.at('L2', 11, 'وإيش'),
    back: T.at('L2', 20, 'نرجع'), months: T.at('L2', 21, 'شهرين'), end: T.segEnd('L2') }} /> },
  { seg: 'L3', story: true, render: (f, T, r) => <Want f={f} T={T} ratio={r} /> },
  { seg: 'L4', book: true, render: (f, T, r) => {
    const P = PROFILES[r];
    const name = T.at('L4', 52, 'ويسمّيها'), mirror = T.at('L4', 57, 'نريد');
    const title = prog(f, T.at('L4', 53, 'مفارقة') - sec(0.1), sec(0.5));
    const up = prog(f, mirror - sec(0.3), sec(0.6));
    const gone = prog(f, T.at('L4', 64, 'والناس') - sec(0.2), sec(0.4)); // room for the magnifier
    return <>
      {f < mirror + sec(0.4) && <Valet f={f} ratio={r} k={{
        start: T.segStart('L4'), every: T.at('L4', 18, 'كل'), arrive: T.at('L4', 20, 'توصله'), dream: T.at('L4', 24, 'يحلم'),
        noticed: T.at('L4', 33, 'انتبه'), rarely: T.at('L4', 36, 'نادرًا'), owner: T.at('L4', 40, 'صاحب'), cool: T.atEnd('L4', 42, 'رائع'),
        himself: T.at('L4', 45, 'لو'), people: T.at('L4', 48, 'الناس'), name, end: mirror }} />}
      {f >= mirror - sec(0.4) && <AbsoluteFill style={{ opacity: prog(f, mirror - sec(0.4), sec(0.4)) }}>
        <Mirror f={f} ratio={r} place="hotel" k={{ start: mirror, proud: T.at('L4', 60, 'عشان'), look: T.at('L4', 64, 'والناس'),
          see: T.at('L4', 66, 'مقياس'), end: T.segEnd('L4') }} /></AbsoluteFill>}
      <BookCard o={life(f, T.at('L4', 5, 'كتابه') - sec(0.2), T.at('L4', 12, 'يصفّ'))} size={56} style={{ position: 'absolute', top: 300, right: P.w - P.safe.x1 }} />
      <div style={{ position: 'absolute', left: P.safe.x0, right: P.w - P.safe.x1, top: mix(400, P.safe.y0, up) }}>
        <Title text="«مفارقة الرجل في السيارة»" o={title * (1 - gone)} size={mix(96, 60, up)} />
      </div>
    </>;
  } },
  { seg: 'L5', render: (f, T, r) => <Respect f={f} ratio={r} k={{
    start: T.segStart('L5'), no: T.at('L5', 3, 'لا'), noEnd: T.atEnd('L5', 6, 'حلوة'), think: T.at('L5', 10, 'تظن'), truth: T.at('L5', 14, 'والحقيقة'),
    respect: T.at('L5', 17, 'الاحترام'), from: T.at('L5', 18, 'والاحترام'), v1: T.at('L5', 21, 'التواضع'), v2: T.at('L5', 22, 'واللطف'), v3: T.at('L5', 23, 'والتعاطف'),
    engine: T.at('L5', 28, 'قوة'), end: T.segEnd('L5') }} /> },
  { seg: 'L6', story: true, render: (f, T, r) => <Chance f={f} ratio={r} k={{
    start: T.segStart('L6'), where: T.at('L6', 1, 'وين'), seen: T.at('L6', 8, 'الكل'), pan: T.at('L6', 10, 'وفي'), saad: T.at('L6', 18, 'سيارة'),
    scratch: T.at('L6', 25, 'خدش'), later: T.at('L6', 30, 'بعد'), office: T.at('L6', 30, 'بعد'), chance: T.at('L6', 34, 'فرصة'), less: T.at('L6', 47, 'أقل'),
    want: T.at('L6', 48, 'ماجد'), but: T.at('L6', 54, 'لكن'), chain: T.at('L6', 55, 'القسط'), yes: T.at('L6', 58, 'وسعد'), end: T.segEnd('L6') }} /> },
  { seg: 'L7', render: (f, T, r) => <Wealth f={f} ratio={r} k={{
    start: T.segStart('L7'), rich: T.at('L7', 6, 'الغنى'), wealth: T.at('L7', 9, 'والثروة'), inOut: T.at('L7', 14, 'دخل'), seen: T.at('L7', 16, 'قدام'),
    unspent: T.at('L7', 20, 'ففلوس'), car: T.at('L7', 27, 'السيارة'), carGone: T.at('L7', 30, 'اشتريتها'), watch: T.at('L7', 31, 'والساعة'),
    watchGone: T.at('L7', 34, 'لبستها'), saad: T.at('L7', 35, 'ثروة'), nobody: T.at('L7', 46, 'يلتفت'), end: T.segEnd('L7') }} /> },
  { seg: 'L8', render: (f, T, r) => <Freedom f={f} ratio={r} k={{
    start: T.segStart('L8'), no: T.at('L8', 5, 'ما'), time: T.at('L8', 8, 'اشترت'), quote: T.at('L8', 10, 'هاوسل'), control: T.at('L8', 20, 'تتحكم'),
    morning: T.at('L8', 23, 'إنك'), months: T.at('L8', 32, 'مدخرات'), walk: T.at('L8', 38, 'كانت'), end: T.segEnd('L8') }} /> },
  { seg: 'L9', render: (f, T, r) => <Limits f={f} ratio={r} k={{
    start: T.segStart('L9'), pause: T.at('L9', 1, 'لحظة'), income: T.at('L9', 5, 'فيه'), rent: T.at('L9', 10, 'الإيجار'), food: T.at('L9', 11, 'والأكل'),
    notCar: T.at('L9', 16, 'السيارة'), incomeIs: T.at('L9', 19, 'الدخل'), rich: T.at('L9', 22, 'بسيارة'), richHas: T.at('L9', 24, 'وعندهم'),
    poor: T.at('L9', 28, 'بسيارة'), poorHas: T.at('L9', 30, 'وما'), says: T.at('L9', 34, 'السيارة'), stingy: T.at('L9', 44, 'بخيل'), who: T.at('L9', 48, 'لمين'), end: T.segEnd('L9') }} /> },
  { seg: 'L10', render: (f, T, r) => <Apply f={f} ratio={r} k={{
    start: T.segStart('L10'), nobody: T.at('L10', 7, 'لو'), nobody2: T.at('L10', 9, 'أحد'), yes: T.at('L10', 13, 'إذا'), no: T.at('L10', 19, 'وإذا'),
    audience: T.at('L10', 23, 'لجمهور'), months: T.at('L10', 27, 'وسؤال'), small: T.at('L10', 38, 'ولو'), you: T.at('L10', 44, 'وأنت'), end: T.segEnd('L10') }} /> },
  { seg: 'L11', story: true, render: (f, T, r) => <Back f={f} ratio={r} k={{
    start: T.segStart('L11'), month: T.at('L11', 6, 'كل'), freedom: T.at('L11', 13, 'حرية'), year: T.at('L11', 14, 'وبعد'), parked: T.at('L11', 16, 'وقّف'),
    turn: T.at('L11', 21, 'والتفتوا'), majidToo: T.at('L11', 23, 'وماجد'), imagine: T.at('L11', 27, 'يتخيّل'), smile: T.at('L11', 28, 'وابتسم'),
    title: T.at('L11', 32, 'الثروة'), choose: T.at('L11', 40, 'إنك'), end: T.segEnd('L11') }} /> },
];

const SHORT_SCENES: Scene[] = [
  // in portrait the label would sit under the thought bubbles: it shows before they rise
  { seg: 'R1', story: true, tagTo: (T) => T.at('R1', 17, 'يفكر'), render: (f, _T, r) => <Hook f={f} b={hookBeats('short')} ratio={r} /> },
  { seg: 'R2', book: true, render: (f, T, r) => <Mirror f={f} ratio={r} place="parking" k={{
    start: T.segStart('R2'), proud: T.at('R2', 11, 'نريد'), look: T.at('R2', 18, 'والناس'), see: T.at('R2', 19, 'تشوف'), notUs: T.at('R2', 22, 'مو'), end: T.segEnd('R2') }} /> },
  { seg: 'R3', story: true, render: (f, T, r) => <Chance f={f} ratio={r} k={{
    start: T.segStart('R3'), pan: T.at('R3', 2, 'سيارة'), saad: T.at('R3', 8, 'سيارة'), office: T.at('R3', 10, 'ولما'), chance: T.at('R3', 12, 'فرصة'),
    less: T.at('R3', 15, 'أقل'), want: T.at('R3', 18, 'ماجد'), but: T.at('R3', 19, 'ما'), chain: T.at('R3', 21, 'القسط'), yes: T.at('R3', 24, 'وسعد'), end: T.segEnd('R3') }} /> },
  { seg: 'R4', render: (f, T, r) => <ReelWealth f={f} ratio={r} k={{ start: T.segStart('R4'), car: T.at('R4', 9, 'السيارة'), carGone: T.at('R4', 12, 'اشتريتها'), control: T.at('R4', 19, 'تتحكم'), end: T.segEnd('R4') }} /> },
  { seg: 'R5', render: (f, T, r) => <Limits reel f={f} ratio={r} k={{ start: T.segStart('R5'), rich: T.at('R5', 2, 'سيارة'), richHas: T.at('R5', 4, 'دين'), poor: T.at('R5', 7, 'سيارة'),
    poorHas: T.at('R5', 9, 'ثروة'), who: T.at('R5', 11, 'لمين'), end: T.segEnd('R5') }} /> },
  { seg: 'R6', render: (f, T, r) => <Apply f={f} ratio={r} k={{ start: T.segStart('R6'), nobody: T.at('R6', 6, 'لو'), nobody2: T.at('R6', 8, 'أحد'), you: T.at('R6', 12, 'وأنت'), end: T.segEnd('R6') }} /> },
];

const CAPTION_BOTTOM: Record<Ratio, number> = { '16x9': 0, '9x16': 1522, '4x5': 1208 };

const Cut: React.FC<{ prog_: Program; scenes: Scene[]; ratio: Ratio; guides: boolean; overlay: (f: number, T: Timing, cur: { s: Scene; from: number; to: number } | undefined) => React.ReactNode }> = ({ prog_, scenes, ratio, guides, overlay }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  setFps(fps);
  const T = timing(prog_);
  const XF = sec(0.4);
  const cuts = scenes.slice(1).map((s, i) => (s.continuous ? T.segStart(s.seg) - sec(0.2) : Math.round((T.segEnd(scenes[i].seg) + T.segStart(s.seg)) / 2)));
  const span = (i: number): [number, number] => [i === 0 ? 0 : cuts[i - 1], i < cuts.length ? cuts[i] : T.end];
  const live = scenes.map((s, i) => ({ s, i, from: span(i)[0], to: span(i)[1] }))
    .filter(({ i, from, to }) => f >= from - (i ? XF / 2 : 0) && f < to + (i < cuts.length ? XF / 2 : 0));
  const cur = live[live.length - 1];
  return (
    <AbsoluteFill style={{ background: C.night }}>
      {live.map(({ s, i, from }) => (
        <AbsoluteFill key={s.seg} style={{ opacity: i === 0 || s.continuous ? 1 : prog(f, from - XF / 2, XF) }}>{s.render(f, T, ratio)}</AbsoluteFill>
      ))}
      {overlay(f, T, cur)}
      <Audio src={staticFile(prog_.audio)} />
      {guides && <Guides p={PROFILES[ratio]} />}
    </AbsoluteFill>
  );
};

/** Source labels, top corner: our example story, or the book's own story. */
const Labels: React.FC<{ f: number; T: Timing; cur?: { s: Scene; from: number; to: number }; ratio: Ratio; storyFrom: number; bookTo: number }> = ({ f, T, cur, ratio, storyFrom, bookTo }) => {
  const P = PROFILES[ratio];
  const pos: React.CSSProperties = ratio === '16x9' ? { position: 'absolute', top: P.safe.y0, right: P.w - P.safe.x1 } : { position: 'absolute', top: P.safe.y0, left: 0, right: 0, display: 'flex', justifyContent: 'center' };
  const story = cur?.s.story ? life(f, Math.max(cur.from, storyFrom), cur.s.tagTo ? cur.s.tagTo(T) : cur.to) : 0;
  const book = cur?.s.book ? life(f, cur.from, Math.min(cur.to, bookTo)) : 0;
  return <>
    {story > 0 && <div style={pos}><StoryTag o={story} size={28} /></div>}
    {book > 0 && <div style={pos}><StoryTag text="من الكتاب" o={book} size={28} /></div>}
  </>;
};

/** Closing card: the book and the series signature, after the last word. */
const EndCard: React.FC<{ o: number; ratio: Ratio }> = ({ o, ratio }) => {
  const P = PROFILES[ratio];
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ background: `rgba(16,24,39,${0.97 * o})`, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40 }}>
      <BookCard o={o} size={ratio === '16x9' ? 64 : 58} />
      <Signature o={o} size={ratio === '16x9' ? 40 : 38} />
      <div style={{ height: ratio === '16x9' ? 0 : P.h - CAPTION_BOTTOM[ratio] }} />
    </AbsoluteFill>
  );
};

export const Episode: React.FC<{ guides?: boolean }> = ({ guides = false }) => (
  <Cut prog_={LONG} scenes={LONG_SCENES} ratio="16x9" guides={guides} overlay={(f, T, cur) => {
    const P = PROFILES['16x9'];
    const closing = prog(f, T.at('L11', 32, 'الثروة') - sec(0.1), sec(0.6));
    const choose = prog(f, T.at('L11', 40, 'إنك'), sec(0.5));
    const endO = prog(f, T.segEnd('L11') + sec(0.6), sec(0.8));
    return <>
      <Signature o={life(f, sec(0.6), T.at('L1', 16, 'بس'))} size={30} style={{ position: 'absolute', top: P.safe.y0, left: P.safe.x0 }} />
      <Labels f={f} T={T} cur={cur} ratio="16x9" storyFrom={T.at('L1', 14, 'انتبهوا')} bookTo={T.at('L4', 52, 'ويسمّيها')} />
      <div style={{ position: 'absolute', left: P.safe.x0, right: P.w - P.safe.x1, top: 150, opacity: 1 - endO }}>
        <Title text="الثروة الحقيقية ما تلفت الانتباه" o={closing} size={84} />
        <Title text="تعطيك شيء أغلى: إنك تختار" o={choose} size={56} color={C.mint} style={{ marginTop: 18 }} />
      </div>
      <EndCard o={endO} ratio="16x9" />
    </>;
  }} />
);

export const Reel: React.FC<{ ratio: Ratio; guides?: boolean }> = ({ ratio, guides = false }) => (
  <Cut prog_={SHORT} scenes={SHORT_SCENES} ratio={ratio} guides={guides} overlay={(f, T, cur) => {
    const P = PROFILES[ratio];
    const title = life(f, T.at('R2', 7, 'مفارقة') - sec(0.1), T.at('R2', 18, 'والناس'));
    const endO = prog(f, T.segEnd('R6') + sec(0.5), sec(0.7));
    return <>
      <Labels f={f} T={T} cur={cur} ratio={ratio} storyFrom={T.at('R1', 11, 'التفتوا')} bookTo={T.at('R2', 11, 'نريد')} />
      <BookCard o={life(f, T.at('R2', 0, 'مورجان') - sec(0.2), T.at('R2', 7, 'مفارقة'))} size={54} style={{ position: 'absolute', top: P.safe.y0 + 90, left: '50%', transform: 'translateX(-50%)' }} />
      <div style={{ position: 'absolute', left: P.safe.x0, right: P.w - P.safe.x1, top: P.safe.y0 + 80 }}>
        <Title text="«مفارقة الرجل في السيارة»" o={title} size={P.title * 0.9} />
      </div>
      <EndCard o={endO} ratio={ratio} />
      {endO < 1 && <Captions f={f} caps={SHORT.captions} p={P} bottom={CAPTION_BOTTOM[ratio]} />}
    </>;
  }} />
);
