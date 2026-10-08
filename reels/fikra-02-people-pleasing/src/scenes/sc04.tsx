import React from 'react';
import { ArText } from '../art/doodles';
import { CrackedHeart, DayCalendar, MsgBubble, Note, Pill, Stamp, Tape, along, curve, line, svgPath } from '../art/world';
import { T } from '../copy';
import { Stage } from '../Stage';
import { WordByWord } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc04 — back to the message: two questions race from it to the send button. «هل سينزعج؟» takes the
// short red lane and arrives first; «هل أقدر فعلًا؟» takes the long blue lane through the calendar,
// which is still closed. Then the planner opens (the promise to oneself), and the sentence lands:
// «حاضر» came out before it became a decision — in our message, fear of the reaction came first.
const S: [number, number] = [1600, 290];          // where both lanes leave the message
const F: [number, number] = [290, 440];           // the send button
const RED = curve([[S, [1600, 400], [1540, 440], [1440, 440]], line([1440, 440], F)]);
const BLUE = curve([[S, [1590, 640], [1460, 820], [1240, 820]], line([1240, 820], [600, 820]), [[600, 820], [380, 820], [290, 700], [F[0], F[1] + 70]]]);
const CAL0 = { x: 950, y: 790, s: 0.6 }, CAL1 = { x: 1240, y: 560, s: 0.92 };

export const SC04: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc04');
  const b = {
    back: wordAt('s13', 'فلنرجع'), race: wordAt('s13', 'يتسابق'),
    q1: wordAt('s14', 'هل'), q2: wordAt('s14', 'هل', 1),
    fast: wordAt('s15', 'سريع'), dis: wordAt('s15', 'خيبة'), hope: wordAt('s15', 'أمله'), opinion: wordAt('s15', 'يتغير'), arrive: wordAt('s15', 'فيصل'), open: wordAt('s15', 'تفتح'),
    table: wordAt('s16', 'والجدول'),
    needs: wordAt('s17', 'فيحتاج'), look: wordAt('s17', 'تنظر'), time: wordAt('s17', 'وقتك'), promised: wordAt('s17', 'وعدت'),
    fear: wordAt('s18', 'الخوف'), review: wordAt('s18', 'مراجعة'), out: wordAt('s18', 'تخرج'), yes: wordAt('s18', 'حاضر'),
    w2: wordAt('s18', 'قبل'), w3: wordAt('s18', 'أن'), w4: wordAt('s18', 'تصبح'), w5: wordAt('s18', 'قرارك'),
    reason: wordAt('s19', 'السبب'), ours: wordAt('s19', 'رسالتنا'),
  };
  const intro = prog(f, start, sec(0.5));
  const msg = prog(f, b.back - sec(0.1), sec(0.5), ease.out);
  const lanes = prog(f, b.race - sec(0.1), sec(1.1), ease.inOut);
  const race = 1 - prog(f, b.needs - sec(0.2), sec(0.5), ease.in);     // the race layer gives way to the planner
  // the red question: steps onto its lane, dashes, hesitates at the imagined disappointment, then reaches «send»
  const uR = mix(0, 0.26, prog(f, b.q1 - sec(0.05), sec(0.5), ease.out))
    + 0.27 * prog(f, b.fast - sec(0.05), sec(0.5), ease.out)
    + 0.47 * prog(f, b.arrive - sec(0.55), sec(0.55), ease.in);
  const inR = prog(f, b.q1 - sec(0.1), sec(0.3)) * (1 - prog(f, b.arrive, sec(0.15)));
  const sent = prog(f, b.arrive, sec(0.3), ease.out);
  // the blue question: slow, and it stops at the closed calendar
  const uB = mix(0, 0.15, prog(f, b.q2 - sec(0.05), sec(0.5), ease.out))
    + 0.16 * prog(f, b.fast, b.open - b.fast, ease.inOut)
    + 0.17 * prog(f, b.needs - sec(0.1), sec(0.7), ease.inOut);
  const inB = prog(f, b.q2 - sec(0.1), sec(0.3)) * (1 - prog(f, b.needs + sec(0.3), sec(0.3)));
  const [rx, ry] = along(RED, uR), [bx, by] = along(BLUE, uB);
  // the planner: closed and small on the blue lane, then it grows and opens
  const grow = prog(f, b.needs - sec(0.1), sec(0.8), ease.inOut);
  const cal = { x: mix(CAL0.x, CAL1.x, grow), y: mix(CAL0.y, CAL1.y, grow), s: mix(CAL0.s, CAL1.s, grow) };
  const cover = 1 - prog(f, b.look - sec(0.1), sec(0.6), ease.inOut);
  const glow = prog(f, b.time - sec(0.1), sec(0.4)) * (0.6 + 0.4 * Math.sin((f - b.time) / sec(0.25)));
  const heart = prog(f, b.dis - sec(0.1), sec(0.35), ease.out) * race;
  const shake = f > b.opinion && f < b.opinion + sec(0.5) ? Math.sin((f - b.opinion) / 2) * 6 : 0;
  const pop = prog(f, b.out - sec(0.05), sec(0.35), ease.out);
  const bubbleS = mix(1, 1.6, pop) * (1 + 0.06 * Math.sin(prog(f, b.fear, sec(0.5)) * Math.PI));
  return (
    <Stage f={f} svg={
      <g opacity={intro}>
        {/* lanes */}
        <g opacity={race}>
          <path d={svgPath(RED)} fill="none" stroke={C.red} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lanes} opacity={0.85} />
          <path d={svgPath(BLUE)} fill="none" stroke={C.blue} strokeWidth={16} strokeLinecap="round" strokeDasharray="2 30" opacity={lanes * 0.9} />
          <circle cx={S[0]} cy={S[1]} r={16} fill={C.ink} opacity={lanes} />
        </g>
        {/* the closed calendar sits on the blue lane; it grows and opens when the second question gets its moment */}
        <DayCalendar x={cal.x} y={cal.y} s={cal.s} o={prog(f, b.race, sec(0.6))} title={T.sc04.today} cover={T.sc04.cover} closed={cover}
          blocks={[{ from: 18, to: 20, label: T.sc04.project, color: C.green, glow: glow }]} />
        {f >= b.table - sec(0.1) && (
          <g opacity={prog(f, b.table - sec(0.1), sec(0.2)) * (1 - prog(f, b.look - sec(0.2), sec(0.3)))}>
            <Tape x={cal.x} y={cal.y} w={380} rot={-12} />
            <g transform={`translate(${cal.x} ${cal.y + 4}) rotate(-12) scale(${mix(1.5, 1, prog(f, b.table - sec(0.1), sec(0.25), ease.out))})`}>
              <ArText size={40} color={C.ink} weight={900}>{T.sc04.unopened}</ArText>
            </g>
          </g>
        )}
        {/* the message, where the race starts */}
        <g opacity={msg * race}>
          <MsgBubble x={1400} y={190} s={mix(0.8, 1, msg)} text={T.sc04.ask} size={54} />
        </g>
        {/* the imagined reaction on the red lane */}
        {heart > 0 && <CrackedHeart x={720} y={300} s={mix(0.6, 1.5, heart)} rot={shake} crack={prog(f, b.hope - sec(0.1), sec(0.4))} o={heart} />}
        {/* the send button at the end of both lanes */}
        <g transform={`translate(${F[0]} ${F[1]}) scale(${1 - 0.2 * Math.sin(prog(f, b.arrive - sec(0.1), sec(0.3)) * Math.PI)})`} opacity={lanes * (1 - prog(f, b.reason - sec(0.4), sec(0.4)))}>
          <circle r={64} fill={sent > 0 ? C.blue : C.inkSoft} filter="url(#lift)" />
          <path d="M 26 0 L -22 -26 L -11 0 L -22 26 Z" fill={C.white} transform="scale(-1 1)" />
        </g>
        {/* the runners: the questions themselves */}
        {inB > 0 && <Pill x={bx} y={by} text={T.sc04.q2} fill={C.blue} s={mix(0.6, 1, inB)} o={inB} size={54} />}
        {inR > 0 && <Pill x={rx} y={ry} text={T.sc04.q1} fill={C.red} s={mix(0.6, 1, inR)} o={inR} size={54} rot={uR > 0.3 && uR < 0.99 ? -3 : 0} />}
        {/* the answer that arrived first */}
        {sent > 0 && <MsgBubble x={mix(F[0] + 40, 420, pop)} y={mix(290, 300, pop)} s={mix(0.5, 1, sent) * bubbleS} text={T.sc04.yes} size={60} fill={C.red} color={C.white} stroke={C.red} tail="out" />}
        {/* what the planner holds: a promise made to oneself */}
        {f >= b.promised - sec(0.15) && (
          <Note x={780} y={mix(560, 720, prog(f, b.promised - sec(0.15), sec(0.45), ease.out))} rot={-5} w={440} h={230} size={50}
            lines={[T.sc04.promise1, T.sc04.promise2]} o={prog(f, b.promised - sec(0.15), sec(0.3))} />
        )}
        {/* in our message, the reason was the first question */}
        {f >= b.reason - sec(0.1) && <Pill x={400} y={490} text={T.sc04.q1} fill={C.red} size={50} o={prog(f, b.reason - sec(0.1), sec(0.3))} s={mix(0.7, 1, prog(f, b.reason - sec(0.1), sec(0.3), ease.out))} />}
        {f >= b.ours - sec(0.1) && <Stamp x={400} y={630} rot={-7} text={T.sc04.ours} color={C.ink} size={48} s={mix(1.6, 1, prog(f, b.ours - sec(0.1), sec(0.25), ease.out))} o={prog(f, b.ours - sec(0.1), sec(0.15))} />}
      </g>
    }>
      <WordByWord text={T.sc04.before} f={f} times={[b.yes - sec(0.05), b.w2, b.w3, b.w4, b.w5]} x={960} y={50} w={1700} size={92} color={C.ink} />
    </Stage>
  );
};
