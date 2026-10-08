import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ChatBubble, DayCalendar, Phone, calY, textW } from '../art/world';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, useEpisodeFrame, wordAt } from '../time';

// sc01 — the hook: «لا أستطيع اليوم» is typed, erased, and «حاضر» is sent; the sent word flies into
// the evening and becomes the block that squeezes the reserved project time. Then the question.
const PX = 1340, PY = 540, PS = 0.9;            // phone
const CX = 560, CY = 560;                        // calendar
export const toScene = (x: number, y: number): [number, number] => [PX + x * PS, PY + y * PS];

export const SC01: React.FC = () => {
  const f = useEpisodeFrame();
  const b = {
    msg: wordAt('s01', 'رسالة'), w1: wordAt('s02', 'لا'), w2: wordAt('s02', 'أستطيع'), w3: wordAt('s02', 'اليوم'),
    erase: wordAt('s02', 'تمسحها'), send: wordAt('s03', 'وترسل'), yes: wordAt('s03', 'حاضر'),
    angry: wordAt('s04', 'غاضب'), why: wordAt('s04', 'فلماذا'), want: wordAt('s04', 'وأنت'),
  };
  const intro = prog(f, -sec(0.3), sec(0.5));
  // typing: whole words keyed to the spoken words; erasing: one word at a time, backwards
  const typed = [b.w1, b.w2, b.w3].filter((t) => f >= t - sec(0.05)).length;
  const erase = prog(f, b.erase - sec(0.1), sec(0.6), (x) => x);
  const shown = Math.ceil(typed * (1 - erase) - 1e-6);
  const yesTyped = f >= b.send + sec(0.35) && f < b.yes + sec(0.1);
  const sent = prog(f, b.yes + sec(0.05), sec(0.3), ease.out);
  // the sent «حاضر» flies into the evening and becomes the help block
  const fly = prog(f, b.yes + sec(0.3), sec(0.75), ease.inOut);
  const squeeze = prog(f, b.yes + sec(0.85), sec(0.9), ease.inOut);
  const angry = prog(f, b.angry - sec(0.1), sec(0.6), ease.inOut);
  const ask = prog(f, b.why - sec(0.25), sec(0.5), ease.inOut);
  const [bx, by] = toScene(-232 + (textW(T.sc01.yes, 40) + 100) / 2, 20);
  const tx = CX - 42, ty = CY + calY(19);
  const flyX = mix(bx, tx, fly), flyY = mix(by, ty, fly) - Math.sin(fly * Math.PI) * 160;
  return (
    <Stage f={f} svg={
      <g opacity={intro}>
        <DayCalendar x={CX} y={CY} title={T.sc01.today} blocks={[
          { from: mix(18, 20, squeeze), to: mix(20, 20.35, squeeze), label: T.sc01.project, color: squeeze > 0.6 ? C.muted : C.green },
          { from: 18, to: mix(18, 20, squeeze), label: T.sc01.help, color: C.red },
        ]} />
        <Phone x={PX} y={PY} s={PS} contact={T.sc01.contact} words={yesTyped ? [T.sc01.yes] : [...T.sc01.typed]} shown={yesTyped ? 1 : shown}
          caret={f > b.w1 - sec(0.4) && f < b.yes && Math.floor(f / sec(0.4)) % 2 === 0} send={prog(f, b.yes - sec(0.1), sec(0.3))}>
          <ChatBubble y={-180} side="in" text={T.sc01.ask} p={prog(f, b.msg, sec(0.4), ease.out)} />
          <ChatBubble y={20} side="out" text={T.sc01.yes} p={sent} fill={C.redSoft} ticks={sent} />
          {/* the reply, circled in anger at oneself */}
          {angry > 0 && <ellipse cx={-232 + (textW(T.sc01.yes, 40) + 100) / 2} cy={20} rx={170} ry={80} fill="none" stroke={C.red} strokeWidth={8} strokeDasharray="1 1" pathLength={1} strokeDashoffset={1 - angry} transform="rotate(-6 -150 20)" />}
        </Phone>
        {fly > 0 && squeeze < 1 && (
          <g opacity={1 - squeeze} transform={`translate(${flyX} ${flyY}) scale(${mix(1, 1.7, fly)})`}>
            <rect x={-90} y={-38} width={180} height={76} rx={30} fill={C.red} />
            <text x={0} y={2} direction="rtl" textAnchor="middle" dominantBaseline="central" fontFamily="Cairo" fontWeight={900} fontSize={40} fill={C.white}>{T.sc01.yes}</text>
          </g>
        )}
      </g>
    }>
      {/* the question: the stage steps back and the question holds */}
      <AbsoluteFill style={{ background: C.light, opacity: ask * 0.88 }} />
      <Headline text={T.sc01.why1} f={f} at={b.why - sec(0.1)} x={960} y={330} size={130} color={C.ink} />
      <Headline text={T.sc01.why2} f={f} at={b.want - sec(0.1)} x={960} y={520} size={92} color={C.red} />
    </Stage>
  );
};
