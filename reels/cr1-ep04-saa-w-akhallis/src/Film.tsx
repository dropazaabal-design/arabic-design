import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import data from './data/short.json';
import { Door, Floor, Month, Open, Photo } from './scenes/story';
import { Work } from './scenes/work';
import { BookCard, Captions, Signature, Tag, Title } from './text';
import { CAPTION_BOTTOM, CAPTION_TOP, C, SAFE } from './theme';
import { Gate, facesAt, overlaps, reportText, type Box } from './stage';
import { life, prog, sec, setFps, timing, type Program, type Timing } from './time';

export const REEL = data as unknown as Program;

// The reel (9:16): six shots in one living room. Cuts sit in pauses of the voice and dissolve over 0.3 s.
// Beats are keyed to spoken words (`T.at(seg, i, check)`), so each action lands on the word it shows.
type Shot = { id: string; from: (T: Timing) => number; kind: 'story' | 'book'; render: (f: number, T: Timing) => React.ReactNode };
const mid = (a: number, b: number) => Math.round((a + b) / 2);

const SHOTS: Shot[] = [
  { id: 'open', kind: 'story', from: () => 0, render: (f, T) => <Open f={f} k={{ start: 0, seven: T.at('R1', 4, 'سبع'), down: T.at('R1', 5, 'الساعة'),
    open: T.at('R1', 7, 'فتح'), say: T.at('R1', 11, 'وقال'), one: T.at('R1', 12, 'ساعة'), end: T.segEnd('R1') }} /> },
  { id: 'work', kind: 'story', from: (T) => mid(T.segEnd('R1'), T.segStart('R2')), render: (f, T) => <Work f={f} k={{
    start: mid(T.segEnd('R1'), T.segStart('R2')), screw: T.at('R2', 0, 'أول'), crooked: T.at('R2', 3, 'عوج') + sec(0.25), sheet: T.at('R2', 4, 'والتعليمات'),
    turn: T.at('R2', 6, 'رسوم'), panel: T.at('R2', 7, 'والقطعة'), flip: T.atEnd('R2', 11, 'مقلوبة') + sec(0.05),
    spin: T.at('R2', 12, 'الساعة') - sec(0.65), ring: T.at('R2', 14, 'رن'), end: T.segEnd('R2') }} /> },
  { id: 'floor', kind: 'book', from: (T) => mid(T.segEnd('R2'), T.segStart('R3')), render: (f, T) => <Floor f={f} k={{
    start: mid(T.segEnd('R2'), T.segStart('R3')), name: T.at('R3', 9, 'مغالطة'), best: T.at('R3', 11, 'نقد'), pop: T.at('R3', 16, 'كأن') - sec(0.35),
    author: T.at('R4', 0, 'وكانمان'), two: T.at('R4', 9, 'بسنتين'), expert: T.at('R4', 10, 'مع'), eight: T.at('R4', 24, 'وخل'), end: mid(T.segEnd('R4'), T.segStart('R5')) }} /> },
  { id: 'photo', kind: 'book', from: (T) => mid(T.segEnd('R4'), T.segStart('R5')), render: (f, T) => <Photo f={f} k={{
    start: mid(T.segEnd('R4'), T.segStart('R5')), wrong: T.at('R5', 0, 'فلا'), right: T.at('R5', 5, 'اسأل'), last: T.at('R5', 10, 'وكم'), end: T.segEnd('R5') }} /> },
  { id: 'month', kind: 'story', from: (T) => mid(T.segEnd('R5'), T.segStart('R6')), render: (f, T) => <Month f={f} k={{
    start: mid(T.segEnd('R5'), T.segStart('R6')), phone: T.at('R6', 8, 'فتح'), five: T.at('R6', 12, 'خمس'), noon: T.at('R6', 14, 'فبدأ'),
    end: mid(T.atEnd('R6', 16, 'الظهر'), T.at('R6', 17, 'والساعة')) }} /> },
  { id: 'door', kind: 'story', from: (T) => mid(T.atEnd('R6', 16, 'الظهر'), T.at('R6', 17, 'والساعة')), render: (f, T) => {
    const ring = T.at('R6', 19, 'رن'), ask = T.at('R7', 0, 'إيش'), walk = ring + sec(0.55);
    return <Door f={f} k={{ start: mid(T.atEnd('R6', 16, 'الظهر'), T.at('R6', 17, 'والساعة')), ring, ready: T.at('R6', 21, 'والطاولة'),
      walk, handle: Math.min(walk + sec(1.35), ask - sec(1.0)), ask, end: T.end }} />;
  } },
];

/** Short titles, placed clear of every face on screen: the top zone, else the zone above the captions. */
const Titles: React.FC<{ f: number; items: { id: string; text: string; o: number; size: number; color?: string }[] }> = ({ f, items }) => {
  const faces = facesAt(f).filter((x) => x.o > 0.5).map((x) => x.box);
  return <>{items.filter((t) => t.o > 0).map((t) => {
    const width = SAFE.x1 - SAFE.x0;
    const lines = Math.ceil((t.text.length * t.size * 0.52) / (width - 60));
    const h = lines * t.size * 1.3 + 40;
    const zones: Box[] = [[SAFE.x0, SAFE.y0 + 20, SAFE.x1, SAFE.y0 + 20 + h], [SAFE.x0, CAPTION_TOP - 30 - h, SAFE.x1, CAPTION_TOP - 30]];
    const zone = zones.find((z) => !faces.some((b) => overlaps(b, z, 8))) ?? zones[0]; // if none is clear the gate reports it
    reportText(f, t.id, zone);
    return <div key={t.id} style={{ position: 'absolute', left: zone[0], top: zone[1], width, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Title card text={t.text} o={t.o} size={t.size} color={t.color} />
    </div>;
  })}</>;
};

/** Captions, and their band reported to the keep-out (a face must never sit under the captions). */
const CaptionLayer: React.FC<{ f: number }> = ({ f }) => {
  if (REEL.captions.some((c) => f >= sec(c.start) - 2 && f < sec(c.end))) reportText(f, 'captions', [SAFE.x0, CAPTION_TOP, SAFE.x1, CAPTION_BOTTOM]);
  return <Captions f={f} caps={REEL.captions} bottom={CAPTION_BOTTOM} size={50} />;
};

const Labels: React.FC<{ f: number; story: number; book: number }> = ({ f, story, book }) => {
  if (story > 0 || book > 0) reportText(f, 'label', [440, SAFE.y0 - 76, 640, SAFE.y0 - 24]);
  return <div style={{ position: 'absolute', top: SAFE.y0 - 70, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
    {story > 0 && <Tag text="قصة توضيحية" o={story} size={30} />}
    {book > 0 && <Tag text="من الكتاب" o={book} size={30} />}
  </div>;
};

const BookLayer: React.FC<{ f: number; o: number }> = ({ f, o }) => {
  if (o > 0) reportText(f, 'book', [270, SAFE.y0 + 10, 810, SAFE.y0 + 250]);
  return o > 0 ? <div style={{ position: 'absolute', top: SAFE.y0 + 20, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}><BookCard o={o} size={60} /></div> : null;
};

export const Reel: React.FC<{ check?: boolean; show?: boolean }> = ({ check = false, show = false }) => {
  const f = useCurrentFrame();
  setFps(useVideoConfig().fps);
  const T = timing(REEL);
  const XF = sec(0.3);
  const starts = SHOTS.map((s) => s.from(T));
  const live = SHOTS.map((s, i) => ({ s, i, from: starts[i], to: i + 1 < SHOTS.length ? starts[i + 1] : T.end }))
    .filter(({ i, from, to }) => f >= from - (i ? XF / 2 : 0) && f < to + (i + 1 < SHOTS.length ? XF / 2 : 0));
  const cur = live[live.length - 1];
  const tag = (kind: Shot['kind']) => (cur && cur.s.kind === kind ? life(f, Math.max(cur.from, sec(0.5)), cur.to, sec(0.3), sec(0.2)) : 0);
  const ask = T.at('R7', 0, 'إيش');
  const story = cur?.s.id === 'door' ? tag('story') * (1 - prog(f, ask - sec(0.3), sec(0.3))) : tag('story');
  const bookO = life(f, T.at('R3', 0, 'دانيال') - sec(0.15), T.at('R3', 9, 'مغالطة') - sec(0.05), sec(0.3), sec(0.2));
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {live.map(({ s, i, from }) => (
        <AbsoluteFill key={s.id} style={{ opacity: i === 0 ? 1 : prog(f, from - XF / 2, XF) }}>{s.render(f, T)}</AbsoluteFill>
      ))}
      <Labels f={f} story={story} book={tag('book') * (1 - bookO)} />
      <BookLayer f={f} o={bookO} />
      <Titles f={f} items={[
        { id: 'promise', text: 'ساعة وأخلّصها!', o: life(f, T.at('R1', 12, 'ساعة') - sec(0.1), T.segEnd('R1') + sec(0.4)), size: 96 },
        { id: 'fallacy', text: 'مغالطة التخطيط', o: life(f, T.at('R3', 9, 'مغالطة') - sec(0.1), T.at('R3', 11, 'نقد') + sec(0.3)), size: 92, color: C.clockDeep },
        { id: 'ask', text: 'إيش «ساعة وأخلّصها» عندك؟', o: prog(f, ask + sec(0.2), sec(0.4)), size: 78, color: C.clockDeep },
      ]} />
      <Signature o={prog(f, T.atEnd('R7', 7, 'وأخل') - sec(0.3), sec(0.4))} size={36} style={{ position: 'absolute', top: CAPTION_BOTTOM + 40, left: 0, right: 0, textAlign: 'center' }} />
      <CaptionLayer f={f} />
      <Gate f={f} check={check} show={show} />
      <Audio src={staticFile(REEL.audio)} />
    </AbsoluteFill>
  );
};
