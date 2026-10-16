import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import data from './data/short.json';
import { Idea, Walk, Why } from './scenes/idea';
import { OpenBox } from './scenes/open';
import { Dawn, Decide, Home, Hook, Night, Plan, Wear } from './scenes/room';
import { Captions, Signature, Tag, Title } from './text';
import { CAPTION_BOTTOM, C, SAFE } from './theme';
import { life, prog, sec, setFps, timing, type Program, type Timing } from './time';

export const REEL = data as unknown as Program;

// The reel (9:16): eleven shots in one story world. Each cut sits in a pause of the voice and the
// next shot dissolves in over 0.3 s. Beats are keyed to spoken words (`T.at(seg, i, check)`), so
// motion lands on the word it illustrates.
type Shot = { id: string; from: (T: Timing) => number; render: (f: number, T: Timing) => React.ReactNode; kind: 'story' | 'book' };
const mid = (a: number, b: number) => Math.round((a + b) / 2);

const SHOTS: Shot[] = [
  { id: 'hook', kind: 'story', from: () => 0, render: (f, T) => <Hook f={f} k={{ start: 0, month: T.at('R1', 5, 'وصار'), shame: T.at('R1', 7, 'شهر'), box: T.at('R1', 9, 'كرتونه'), end: T.segEnd('R1') }} /> },
  { id: 'plan', kind: 'story', from: (T) => mid(T.segEnd('R1'), T.segStart('R2')), render: (f, T) => <Plan f={f} k={{
    start: mid(T.segEnd('R1'), T.segStart('R2')), belly: T.at('R2', 0, 'كان'), write: T.at('R2', 4, 'فكتب'), text: T.at('R2', 8, 'ساعة'),
    time: T.at('R2', 12, 'الساعة'), proud: T.at('R2', 14, 'ونص'), end: T.segEnd('R2') }} /> },
  { id: 'dawn', kind: 'story', from: (T) => mid(T.segEnd('R2'), T.segStart('R3')), render: (f, T) => <Dawn f={f} k={{
    start: mid(T.segEnd('R2'), T.segStart('R3')), ring: T.at('R3', 2, 'رن'), slap: T.atEnd('R3', 3, 'المنبه') + sec(0.15), up: T.atEnd('R3', 3, 'المنبه') + sec(0.35),
    look: T.at('R3', 4, 'شاف'), imagine: T.at('R3', 6, 'وتخي'), back: T.at('R3', 9, 'ورجع'), end: T.atEnd('R3', 10, 'نام') }} /> },
  { id: 'night', kind: 'story', from: (T) => mid(T.atEnd('R3', 10, 'نام'), T.at('R3', 11, 'وكل')), render: (f, T) => <Night f={f} k={{
    start: mid(T.atEnd('R3', 10, 'نام'), T.at('R3', 11, 'وكل')), strike: T.at('R3', 13, 'يعو'), big: T.at('R3', 15, 'أكبر'), proud: T.at('R3', 17, 'ساعتين'), end: T.segEnd('R3') }} /> },
  { id: 'idea', kind: 'book', from: (T) => mid(T.segEnd('R3'), T.segStart('R4')), render: (f, T) => <Idea f={f} k={{
    start: mid(T.segEnd('R3'), T.segStart('R4')), book: T.at('R4', 3, 'كتاب'), rule: T.at('R4', 9, 'أي'), shrink: T.at('R4', 12, 'ابدأها'), less: T.at('R4', 15, 'أقل'),
    noBook: T.at('R4', 18, 'مو'), page: T.at('R4', 21, 'تقرأ'), noRun: T.at('R4', 23, 'مو'), shoe: T.at('R4', 26, 'تلبس'), end: mid(T.segEnd('R4'), T.segStart('R5')) }} /> },
  { id: 'why', kind: 'book', from: (T) => mid(T.segEnd('R4'), T.segStart('R5')), render: (f, T) => <Why f={f} k={{
    start: mid(T.segEnd('R4'), T.segStart('R5')), exist: T.at('R5', 5, 'توجد'), better: T.at('R5', 7, 'قبل'), end: T.segEnd('R5') }} /> },
  { id: 'decide', kind: 'story', from: (T) => mid(T.segEnd('R5'), T.segStart('R6')), render: (f, T) => <Decide f={f} k={{
    start: mid(T.segEnd('R5'), T.segStart('R6')), strike: T.at('R6', 1, 'شطب'), write: T.at('R6', 3, 'وكتب'), small: T.at('R6', 4, 'ألبس'),
    turn: T.atEnd('R6', 5, 'الحذاء') - sec(0.15), end: mid(T.atEnd('R6', 5, 'الحذاء'), T.at('R6', 6, 'وفتح')) }} /> },
  { id: 'open', kind: 'story', from: (T) => mid(T.atEnd('R6', 5, 'الحذاء'), T.at('R6', 6, 'وفتح')), render: (f, T) => {
    const s = mid(T.atEnd('R6', 5, 'الحذاء'), T.at('R6', 6, 'وفتح')), lid = T.at('R6', 7, 'الكرتون') - sec(0.2);
    return <OpenBox f={f} k={{ start: s, look: s, doubt: s + 2, decide: s + 1, lid, inside: lid + sec(0.55), take: lid + sec(1.05), up: lid + sec(1.45), end: T.at('R6', 9, 'أول') }} />;
  } },
  { id: 'wear', kind: 'story', from: (T) => mid(T.atEnd('R6', 8, 'أخير'), T.at('R6', 9, 'أول')), render: (f, T) => <Wear f={f} k={{
    start: mid(T.atEnd('R6', 8, 'أخير'), T.at('R6', 9, 'أول')), admire: T.at('R6', 11, 'لبسه'), door: mid(T.atEnd('R6', 12, 'وقعد'), T.at('R6', 13, 'ثاني')),
    handle: T.at('R6', 16, 'الباب'), end: T.atEnd('R6', 16, 'الباب') }} /> },
  { id: 'walk', kind: 'story', from: (T) => mid(T.atEnd('R6', 16, 'الباب'), T.at('R6', 17, 'وبعد')), render: (f, T) => <Walk f={f} k={{
    start: mid(T.atEnd('R6', 16, 'الباب'), T.at('R6', 17, 'وبعد')), weeks: T.at('R6', 18, 'كم'), out: T.at('R6', 21, 'يطلع'), noDeal: T.at('R6', 23, 'بدون'), end: T.segEnd('R6') }} /> },
  { id: 'home', kind: 'story', from: (T) => mid(T.segEnd('R6'), T.segStart('R7')), render: (f, T) => <Home f={f} k={{
    start: mid(T.segEnd('R6'), T.segStart('R7')), door: T.at('R7', 3, 'هي'), grab: T.at('R7', 5, 'اختر'), crush: T.at('R7', 8, 'وصغ'),
    drop: T.at('R7', 11, 'تقدر'), question: T.at('R7', 14, 'إيش'), end: T.end }} /> },
];

export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  setFps(useVideoConfig().fps);
  const T = timing(REEL);
  const XF = sec(0.3);
  const starts = SHOTS.map((s) => s.from(T));
  const live = SHOTS.map((s, i) => ({ s, i, from: starts[i], to: i + 1 < SHOTS.length ? starts[i + 1] : T.end }))
    .filter(({ i, from, to }) => f >= from - (i ? XF / 2 : 0) && f < to + (i + 1 < SHOTS.length ? XF / 2 : 0));
  const cur = live[live.length - 1];
  const tagO = (kind: Shot['kind']) => (cur && cur.s.kind === kind ? life(f, Math.max(cur.from, kind === 'story' ? sec(0.5) : cur.from), cur.to, sec(0.3), sec(0.2)) : 0);
  // a story tag through the story, then off before the question; the book tag through the book's idea
  const story = cur?.s.id === 'home' ? tagO('story') * (1 - prog(f, T.at('R7', 14, 'إيش') - sec(0.3), sec(0.3))) : tagO('story');
  const book = tagO('book');
  const end = T.at('R7', 14, 'إيش');
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {live.map(({ s, i, from }) => (
        <AbsoluteFill key={s.id} style={{ opacity: i === 0 ? 1 : prog(f, from - XF / 2, XF) }}>{s.render(f, T)}</AbsoluteFill>
      ))}
      <div style={{ position: 'absolute', top: SAFE.y0 - 70, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        {story > 0 && <Tag text="قصة توضيحية" o={story} size={30} />}
        {book > 0 && <Tag text="من الكتاب" o={book} size={30} />}
      </div>
      {/* the closing lines: short, big, over the last shot (no separate end card) */}
      {([
        ['الدقيقتين هي الباب', life(f, T.at('R7', 3, 'هي') - sec(0.15), T.at('R7', 5, 'اختر')), 92, C.ink],
        ['صغّرها لين ما تقدر تقول لا', life(f, T.at('R7', 8, 'وصغ') - sec(0.1), end - sec(0.1)), 76, C.ink],
        ['إيش نسخة الدقيقتين من عادتك؟', prog(f, end - sec(0.1), sec(0.45)), 88, C.shoeShade],
      ] as const).map(([text, o, size, color]) => o > 0 && (
        <div key={text} style={{ position: 'absolute', top: SAFE.y0 + 30, left: SAFE.x0, width: SAFE.x1 - SAFE.x0 }}><Title card text={text} o={o} size={size} color={color} /></div>
      ))}
      <Signature o={prog(f, T.atEnd('R7', 18, 'عادتك') - sec(0.4), sec(0.4))} size={36} style={{ position: 'absolute', top: CAPTION_BOTTOM + 40, left: 0, right: 0, textAlign: 'center' }} />
      <Captions f={f} caps={REEL.captions} bottom={CAPTION_BOTTOM} size={50} />
      <Audio src={staticFile(REEL.audio)} />
    </AbsoluteFill>
  );
};
