import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import data from './data/short.json';
import { Answer, Meaning, Name } from './scenes/board';
import { Compare, Hook, NumbersShot } from './scenes/insert';
import { Desk, Door, React_, Switch, Window } from './scenes/lab';
import { BookCard, Captions, Signature, Tag, Title } from './text';
import { CAPTION_BOTTOM, CAPTION_TOP, C, SAFE } from './theme';
import { Gate, facesAt, overlaps, reportText, type Box } from './stage';
import { life, prog, sec, setFps, timing, type Program, type Timing } from './time';

export const REEL = data as unknown as Program;

// Twelve shots: the paper (hook), the lab (1961), the board (the meaning and the 1972 talk), the paper
// again, the window. Cuts sit in pauses of the voice and dissolve over 0.3 s; every beat is keyed to a
// spoken word (`T.at(seg, i, check)`), so each action lands on the word it shows.
type Kind = 'scene' | 'paper';
type Shot = { id: string; from: (T: Timing) => number; kind: Kind; render: (f: number, T: Timing) => React.ReactNode; /** 0 = hard cut (a camera move continues across it) */ xf?: number };
const mid = (a: number, b: number) => Math.round((a + b) / 2);
const cut = {
  desk: (T: Timing) => mid(T.segEnd('R1'), T.segStart('R2')),
  numbers: (T: Timing) => T.at('R3', 9, 'والورقة') - sec(0.12),
  switch: (T: Timing) => T.at('R4', 0, 'ضغط') - sec(0.25),
  door: (T: Timing) => T.at('R4', 0, 'ضغط') + sec(0.75),
  compare: (T: Timing) => T.at('R5', 3, 'الخط') - sec(0.12),
  react: (T: Timing) => T.at('R5', 8, 'لين') - sec(0.1),
  meaning: (T: Timing) => T.at('R6', 0, 'في') - sec(0.3),
  name: (T: Timing) => mid(T.segEnd('R6'), T.segStart('R7')),
  answer: (T: Timing) => T.at('R8', 0, 'وجواب') - sec(0.15),
  ghost: (T: Timing) => T.at('R9', 0, 'ثلاث') - sec(0.3),
  window: (T: Timing) => T.at('R9', 6, 'غي') - sec(0.15),
};

const SHOTS: Shot[] = [
  { id: 'hook', kind: 'paper', from: () => 0, render: (f, T) => <Hook f={f} k={{ start: 0, same: T.at('R1', 0, 'نفس'), again: T.at('R1', 2, 'ونفس'),
    diverge: T.at('R1', 4, 'وطلع'), apart: T.at('R1', 7, 'تمام'), end: cut.desk(T) }} /> },
  { id: 'desk', kind: 'scene', from: cut.desk, render: (f, T) => <Desk f={f} k={{ start: cut.desk(T), busy: T.at('R2', 5, 'يحاكي'),
    push: T.at('R3', 0, 'أراد') - sec(0.6), take: T.at('R3', 0, 'أراد') + sec(0.2), copy: T.at('R3', 5, 'فنقل'), end: cut.numbers(T) }} /> },
  { id: 'numbers', kind: 'paper', from: cut.numbers, render: (f, T) => <NumbersShot f={f} k={{ start: cut.numbers(T), drop: T.at('R3', 11, 'لثلاث') - sec(0.25), end: cut.switch(T) }} /> },
  { id: 'switch', kind: 'scene', from: cut.switch, render: (f, T) => <Switch f={f} k={{ start: cut.switch(T), press: T.at('R4', 0, 'ضغط') + sec(0.08), end: cut.door(T) }} /> },
  { id: 'door', kind: 'scene', from: cut.door, render: (f, T) => {
    const out = T.atEnd('R4', 4, 'قهوة') + sec(0.15), back = T.at('R5', 0, 'رجع') - sec(0.1);
    return <Door f={f} k={{ start: cut.door(T), turn: cut.door(T) + sec(0.05), out, hourFrom: out + sec(0.45), back, inside: back + sec(0.35),
      sip: T.at('R5', 1, 'بعد') + sec(0.25), end: cut.compare(T) }} />;
  } },
  { id: 'compare', kind: 'paper', from: cut.compare, render: (f, T) => <Compare f={f} k={{ start: cut.compare(T), together: T.at('R5', 4, 'مشوا'),
    apart: T.at('R5', 6, 'وبعدين'), end: cut.react(T) }} /> },
  { id: 'react', kind: 'scene', from: cut.react, render: (f, T) => <React_ f={f} k={{ start: cut.react(T), stop: T.at('R5', 10, 'بقي'),
    shock: T.at('R5', 12, 'شبه'), end: cut.meaning(T) }} /> },
  { id: 'meaning', kind: 'scene', from: cut.meaning, render: (f, T) => <Meaning f={f} k={{ start: cut.meaning(T), weather: T.at('R6', 0, 'في'),
    grow: T.at('R6', 4, 'الفرق'), double: T.at('R6', 6, 'يكبر'), why: T.at('R6', 9, 'وعشان'), limit: T.at('R6', 17, 'أسبوعين'), end: cut.name(T) }} /> },
  { id: 'name', kind: 'scene', from: cut.name, render: (f, T) => <Name f={f} k={{ start: cut.name(T), draw: T.at('R7', 0, 'ومنها'), title: T.at('R7', 3, 'تأثير'),
    lift: T.at('R7', 5, 'هل') - sec(0.35), brazil: T.at('R7', 8, 'البرازيل'), launch: T.at('R7', 9, 'تطلق'), storm: T.at('R7', 10, 'إعصار'),
    texas: T.at('R7', 12, 'تكساس'), end: cut.answer(T) }} /> },
  { id: 'answer', kind: 'scene', xf: 0, from: cut.answer, render: (f, T) => <Answer f={f} k={{ start: cut.answer(T), answer: T.at('R8', 0, 'وجواب'),
    storm: T.at('R8', 2, 'الرفرفة'), calm: T.at('R8', 8, 'تقدر'), unknown: T.at('R8', 12, 'يعني'), end: cut.ghost(T) }} /> },
  { id: 'ghost', kind: 'paper', from: cut.ghost, render: (f, T) => <NumbersShot f={f} k={{ start: cut.ghost(T), drop: 0, ghost: T.at('R9', 0, 'ثلاث'), end: cut.window(T) }} /> },
  { id: 'window', kind: 'scene', from: cut.window, render: (f, T) => <Window f={f} k={{ start: cut.window(T), look: cut.window(T) + sec(0.2),
    turn: T.at('R10', 0, 'إيش') - sec(0.1), end: T.end }} /> },
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
// the closing question is on screen as a title, so its caption line is not shown twice (it stays in the SRT)
const SHOWN = REEL.captions.filter((c) => c.seg !== 'R10');
const CaptionLayer: React.FC<{ f: number }> = ({ f }) => {
  if (SHOWN.some((c) => f >= sec(c.start) - 2 && f < sec(c.end))) reportText(f, 'captions', [SAFE.x0, CAPTION_TOP, SAFE.x1, CAPTION_BOTTOM]);
  return <Captions f={f} caps={SHOWN} bottom={CAPTION_BOTTOM} size={54} />;
};

/** The top line: «مشهد تمثيلي» on drawn re-enactments, and the year chip where the story jumps. */
const Labels: React.FC<{ f: number; scene: number; year: { text: string; o: number } }> = ({ f, scene, year }) => {
  if (scene > 0 || year.o > 0) reportText(f, 'label', [300, SAFE.y0 - 80, 780, SAFE.y0 - 20]);
  return <div style={{ position: 'absolute', top: SAFE.y0 - 74, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14 }}>
    {scene > 0 && <Tag text="مشهد تمثيلي" o={scene} size={30} />}
    {year.o > 0 && <Tag text={year.text} o={year.o} size={30} style={{ background: 'rgba(31,122,114,0.92)' }} />}
  </div>;
};

const BookLayer: React.FC<{ f: number; o: number }> = ({ f, o }) => {
  if (o > 0) reportText(f, 'book', [250, SAFE.y0 + 10, 830, SAFE.y0 + 250]);
  return o > 0 ? <div style={{ position: 'absolute', top: SAFE.y0 + 20, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}><BookCard o={o} size={58} /></div> : null;
};

export const Reel: React.FC<{ check?: boolean; show?: boolean }> = ({ check = false, show = false }) => {
  const f = useCurrentFrame();
  setFps(useVideoConfig().fps);
  const T = timing(REEL);
  const XF = sec(0.3);
  const starts = SHOTS.map((s) => s.from(T));
  const xf = (i: number) => (i < SHOTS.length && SHOTS[i].xf !== undefined ? SHOTS[i].xf! : XF);
  const live = SHOTS.map((s, i) => ({ s, i, from: starts[i], to: i + 1 < SHOTS.length ? starts[i + 1] : T.end }))
    .filter(({ i, from, to }) => f >= from - (i ? xf(i) / 2 : 0) && f < to + (i + 1 < SHOTS.length ? xf(i + 1) / 2 : 0));
  const cur = live[live.length - 1];
  const scene = cur && cur.s.kind === 'scene' ? life(f, Math.max(cur.from, sec(0.5)), cur.to, sec(0.3), sec(0.2)) : 0;
  const ask = T.at('R10', 0, 'إيش');
  const y1961 = life(f, cut.desk(T) + sec(0.2), T.at('R3', 0, 'أراد'), sec(0.3), sec(0.3));
  const y1972 = life(f, T.at('R7', 3, 'تأثير') - sec(0.2), cut.answer(T), sec(0.3), sec(0.3));
  const bookO = life(f, T.at('R2', 0, 'إدوارد') + sec(0.1), T.at('R2', 7, 'على'), sec(0.3), sec(0.25));
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {live.map(({ s, i, from }) => (
        <AbsoluteFill key={s.id} style={{ opacity: i === 0 ? 1 : xf(i) === 0 ? (f >= from ? 1 : 0) : prog(f, from - xf(i) / 2, xf(i)) }}>{s.render(f, T)}</AbsoluteFill>
      ))}
      <Labels f={f} scene={scene * (1 - prog(f, ask - sec(0.3), sec(0.3)))} year={y1972 > 0 ? { text: '1972 · عنوان محاضرة', o: y1972 } : { text: '1961', o: y1961 }} />
      <BookLayer f={f} o={bookO} />
      <Titles f={f} items={[
        { id: 'name', text: 'تأثير الفراشة', o: life(f, T.at('R7', 3, 'تأثير') - sec(0.1), T.at('R7', 6, 'رفرفة') + sec(0.2)), size: 104, color: C.tealDeep },
        { id: 'ask', text: 'إيش أصغر تفصيلة غيّرت يومك؟', o: prog(f, ask + sec(0.2), sec(0.4)), size: 76, color: C.tealDeep },
      ]} />
      <Signature o={prog(f, T.atEnd('R10', 4, 'يومك') - sec(0.2), sec(0.4))} size={36} style={{ position: 'absolute', top: CAPTION_BOTTOM + 40, left: 0, right: 0, textAlign: 'center' }} />
      <CaptionLayer f={f} />
      <Gate f={f} check={check} show={show} />
      <Audio src={staticFile(REEL.audio)} />
    </AbsoluteFill>
  );
};
