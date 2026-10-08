import React from 'react';
import { ArText } from '../art/doodles';
import { ChatBubble, Check, Clock, DayCalendar, MsgBubble, Phone, Stamp, calY } from '../art/world';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline, Label } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc06 — the replay, built as a decision in front of the viewer (no row of boxes). The first scene
// rewinds; the same message arrives. 1) The pause: the clock stops, the screen turns aqua, nothing is
// typed, and the clock pins itself to the phone. 2) The calendar is opened before the keyboard (the
// keyboard drops away): the evening is booked; tomorrow has half an hour. 3) The reply is typed and
// each sent line settles something on the calendar. Then the variants: «سأراجع…», and the long story
// that folds into one clear sentence.
const PX = 1340, PY = 540, PS = 0.9;                  // phone (as in sc01)
const CX = 560, CY = 540, CS = 0.92;                  // calendar, open
const SMALL = { x: 250, y: 850, s: 0.38 };            // calendar, closed and put aside
const TOM = { x: 300, y: 790, rot: -5 };              // tomorrow's card
const IN_Y = -200, OUT1 = -70, OUT2 = 50;             // chat rows (screen coordinates)

export const SC06: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc06');
  const b = {
    rew: wordAt('s26', 'فلنعد'), msg: wordAt('s26', 'ممكن'),
    first: wordAt('s27', 'أولا'), stop: wordAt('s27', 'توقف'), dont: wordAt('s27', 'لا'), urgent: wordAt('s27', 'عاجل'), bear: wordAt('s27', 'يحتمل'), minute: wordAt('s27', 'دقيقة'),
    second: wordAt('s28', 'ثانيا'), review: wordAt('s28', 'راجع'), open: wordAt('s28', 'افتح'), keys: wordAt('s28', 'لوحة'), eve: wordAt('s28', 'المساء'), booked: wordAt('s28', 'محجوز'),
    want: wordAt('s29', 'هل'), when: wordAt('s29', 'ومتى'),
    third: wordAt('s30', 'ثالثا'), answer: wordAt('s30', 'أجب'),
    r1: [wordAt('s31', 'لا'), wordAt('s31', 'أستطيع'), wordAt('s31', 'اليوم')], r2: [wordAt('s31', 'أقدر'), wordAt('s31', 'غدا'), wordAt('s31', 'نصف'), wordAt('s31', 'ساعة')],
    duty: wordAt('s32', 'واجبا'),
    unsure: wordAt('s33', 'وإن'), later: wordAt('s33', 'سأراجع'),
    story: wordAt('s34', 'قصة'), sentence: wordAt('s34', 'جملة'), clear: wordAt('s34', 'واضحة'),
  };
  const send1 = b.r1[2] + sec(0.45), send2 = b.r2[3] + sec(0.4);
  // 0 — rewind the first scene
  const rew = prog(f, b.rew - sec(0.1), sec(1.0), ease.inOut);                  // 0 = sc01's end, 1 = before the message
  const rewSign = prog(f, b.rew - sec(0.2), sec(0.25)) * (1 - prog(f, b.rew + sec(1.0), sec(0.3)));
  const closeCal = prog(f, b.rew + sec(0.9), sec(0.5), ease.inOut);
  const shrinkCal = prog(f, b.first - sec(0.2), sec(0.7), ease.inOut);       // closed, it waits until the pause takes the stage
  // 1 — the pause
  const msg = Math.max(1 - prog(f, b.rew + sec(0.4), sec(0.4)), prog(f, b.msg, sec(0.4), ease.out));
  const tint = prog(f, b.stop - sec(0.1), sec(0.6)) * (1 - prog(f, b.answer - sec(0.1), sec(0.6)));
  const clockIn = prog(f, b.stop - sec(0.15), sec(0.45), ease.out);
  const pin = prog(f, b.second - sec(0.1), sec(0.8), ease.inOut);               // the clock pins itself to the phone
  const clock = { x: mix(640, PX - 250, pin), y: mix(520, PY - 430, pin), s: mix(mix(0.5, 1, clockIn), 0.28, pin) };
  // 2 — the calendar before the keyboard
  const grow = prog(f, b.open - sec(0.1), sec(0.6), ease.inOut);
  const cover = grow > 0 ? 1 - prog(f, b.open + sec(0.35), sec(0.5), ease.inOut) : closeCal;
  const calX = grow > 0 ? mix(SMALL.x, CX, grow) : mix(CX, SMALL.x, shrinkCal), calY0 = grow > 0 ? mix(SMALL.y, CY, grow) : mix(560, SMALL.y, shrinkCal);
  const calS = grow > 0 ? mix(SMALL.s, CS, grow) : mix(1, SMALL.s, shrinkCal);
  const keys = 1 - prog(f, b.keys - sec(0.1), sec(0.5), ease.in) + prog(f, b.answer - sec(0.1), sec(0.5), ease.out);
  const glow = prog(f, b.booked - sec(0.1), sec(0.4)) * (0.55 + 0.45 * Math.sin((f - b.booked) / sec(0.3)));
  const tom = prog(f, b.when - sec(0.1), sec(0.5), ease.out);
  // 3 — the reply, each line settling something on the calendar
  const sent1 = prog(f, send1, sec(0.3), ease.out), sent2 = prog(f, send2, sec(0.3), ease.out);
  const typing1 = f < send1 ? b.r1.filter((t) => f >= t - sec(0.05)).length : 0;
  const typing2 = f >= send1 && f < send2 ? b.r2.filter((t) => f >= t - sec(0.05)).length : 0;
  const words = f < send1 ? [...T.sc06.reply1] : [...T.sc06.reply2];
  const shown = f < send1 ? typing1 : typing2;
  const caret = (f > b.dont - sec(0.1) && f < b.second) || (f > b.answer && f < send2);
  const send = f < send1 + sec(0.5) ? prog(f, send1 - sec(0.1), sec(0.3)) : prog(f, send2 - sec(0.1), sec(0.3));
  // the variants
  const dim = 1 - 0.75 * prog(f, b.unsure - sec(0.1), sec(0.4)) * (1 - prog(f, b.clear - sec(0.1), sec(0.5)));
  const alt = prog(f, b.later - sec(0.1), sec(0.35), ease.out) * (1 - prog(f, b.story - sec(0.3), sec(0.3)));
  const unroll = prog(f, b.story - sec(0.1), sec(1.1), ease.inOut), fold = prog(f, b.sentence - sec(0.1), sec(0.5), ease.inOut);
  const pulse = 1 + 0.06 * Math.sin(prog(f, b.clear - sec(0.1), sec(0.6)) * Math.PI);
  const calBlocks = [
    { from: mix(18, 20, 1 - rew), to: mix(20, 20.35, 1 - rew), label: T.sc06.project, color: rew < 0.4 ? C.muted : C.green, glow: Math.max(glow, sent1) },
    { from: 18, to: mix(18, 20, 1 - rew), label: T.sc06.help, color: C.red },
  ];
  // the step headline: one at a time, top left, each replacing the last
  const step = (text: string, at: number, until: number, color: string) => <Headline text={text} f={f} at={at} until={until} x={CX} y={58} w={900} size={96} color={color} />;
  return (
    <Stage f={f} svg={
      <>
        {/* the calendar: sc01's squeezed evening rewinds, closes and is put aside; it opens again in step 2 */}
        <g opacity={dim}>
          <DayCalendar x={calX} y={calY0} s={calS} title={T.sc06.today} cover={T.sc06.cover} closed={cover} blocks={calBlocks} />
          {sent1 > 0 && <Check x={CX + CS * -272 - 6} y={CY + CS * calY(19)} s={mix(0.4, 1.4, sent1)} />}
          {/* tomorrow: half an hour, dashed until the reply offers it */}
          {tom > 0 && (
            <g opacity={tom} transform={`translate(${mix(CX, TOM.x, tom)} ${mix(CY, TOM.y, tom)}) rotate(${TOM.rot * tom}) scale(${mix(0.4, 1, tom)})`}>
              <rect x={-180} y={-125} width={360} height={250} rx={18} fill={C.paper} stroke={C.ink} strokeWidth={5} filter="url(#lift)" />
              <rect x={-180} y={-125} width={360} height={74} rx={18} fill={C.cardboard} />
              <rect x={-180} y={-75} width={360} height={24} fill={C.cardboard} />
              <ArText x={0} y={-90} size={42} color={C.ink}>{T.sc06.tomorrow}</ArText>
              <rect x={-150} y={-20} width={300} height={104} rx={16} fill={sent2 > 0 ? C.blue : C.blueSoft} stroke={sent2 > 0 ? 'none' : C.blue} strokeWidth={4} strokeDasharray="14 10" />
              <ArText x={0} y={33} size={46} color={sent2 > 0 ? C.white : C.blue}>{T.sc06.half}</ArText>
            </g>
          )}
        </g>
        <Phone x={PX} y={PY} s={PS} contact={T.sc06.contact} words={words} shown={shown} caret={caret && Math.floor(f / sec(0.4)) % 2 === 0} send={send} keys={Math.min(1, keys)} tint={tint}>
          <ChatBubble y={IN_Y} side="in" text={T.sc06.ask} p={msg} />
          <ChatBubble y={OUT1} side="out" text={T.sc06.yes} p={1 - prog(f, b.rew - sec(0.1), sec(0.4))} fill={C.redSoft} ticks={1} />
          <g transform={`translate(-232 ${OUT1}) scale(${f >= send2 ? pulse : 1}) translate(232 ${-OUT1})`}>
            <ChatBubble y={OUT1} side="out" text={T.sc06.reply1.join(' ')} p={sent1} size={38} ticks={sent1} />
          </g>
          <g transform={`translate(-232 ${OUT2}) scale(${f >= send2 ? pulse : 1}) translate(232 ${-OUT2})`}>
            <ChatBubble y={OUT2} side="out" text={T.sc06.reply2.join(' ')} p={sent2} size={38} ticks={sent2} dashed />
          </g>
        </Phone>
        {/* step 1: the clock stops (big), then pins itself to the phone's corner */}
        {clockIn > 0 && (
          <Clock x={clock.x} y={clock.y} s={clock.s} r={210} minutes={30 + prog(f, b.bear, b.second - b.bear)} frozen={1} ring={prog(f, b.bear - sec(0.1), b.second - b.bear, (x) => x)} />
        )}
        {f >= b.urgent - sec(0.1) && <Stamp x={1500} y={440} rot={-8} text={T.sc06.notUrgent} color={C.blue} size={46} s={mix(1.6, 1, prog(f, b.urgent - sec(0.1), sec(0.25), ease.out))} o={prog(f, b.urgent - sec(0.1), sec(0.15)) * (1 - prog(f, b.second, sec(0.4)))} />}
        {/* rewind sign */}
        {rewSign > 0 && (
          <g opacity={rewSign} transform="translate(960 540)">
            <circle r={150} fill={C.ink} opacity={0.85} />
            <path d="M 10 -60 L -70 0 L 10 60 Z M 90 -60 L 10 0 L 90 60 Z" fill={C.white} />
          </g>
        )}
        {/* the variant for when you don't know yet */}
        {alt > 0 && <MsgBubble x={CX} y={420} s={mix(0.7, 1, alt)} o={alt} text={T.sc06.later} size={50} tail="out" fill={C.white} stroke={C.inkSoft} dashed />}
        {/* the long story, which folds into one sentence */}
        {unroll > 0 && fold < 1 && (
          <g opacity={1 - fold} transform={`translate(${CX} 210) scale(1 ${1 - fold})`}>
            <rect x={-320} y={0} width={640} height={720 * unroll} rx={10} fill={C.paper} stroke={C.ink} strokeWidth={5} filter="url(#lift)" />
            <ArText x={0} y={64} size={50} color={C.ink}>{T.sc06.long}</ArText>
            {Array.from({ length: 11 }).map((_, i) => 140 + i * 52 < 720 * unroll - 30 && <rect key={i} x={-260 + (i % 3) * 30} y={130 + i * 52} width={520 - (i % 3) * 60} height={18} rx={9} fill={C.line} />)}
          </g>
        )}
      </>
    }>
      {step(T.sc06.step1, b.stop - sec(0.1), b.second - sec(0.2), C.ink)}
      {step(T.sc06.step2, b.review - sec(0.1), b.third - sec(0.2), C.blue)}
      {step(T.sc06.step3, b.answer - sec(0.1), Infinity, C.green)}
      <Label text={T.sc06.want} f={f} at={b.want - sec(0.1)} until={b.when - sec(0.3)} x={CX} y={918} size={46} bg={C.ink} />
      <Label text={T.sc06.when} f={f} at={b.when - sec(0.1)} until={b.third - sec(0.2)} x={CX} y={918} size={46} bg={C.blue} />
      <Label text={T.sc06.optional} f={f} at={b.duty - sec(0.1)} x={975} y={PY + OUT2 * PS - 34} size={40} bg={C.white} color={C.blue} border={C.blue} />
    </Stage>
  );
};
