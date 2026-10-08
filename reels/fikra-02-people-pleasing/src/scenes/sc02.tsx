import React from 'react';
import { Check, Clock, Evening, Gap, MsgBubble, PauseSign, Stamp, eveningX } from '../art/world';
import { ArText } from '../art/doodles';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline, Label } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc02 — what «حاضر» cost: the evening is eaten hour by hour and the project hops to tomorrow,
// then the day after. The promise: the two seconds between «لا» and «حاضر» open into a pause.
// Then the nuance: helping is not the problem; agreeing again and again is.
const X0 = 1700, X1 = 520, EY = 600;   // evening bar (4 pm on the right)

export const SC02: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc02');
  const b = {
    req: wordAt('s05', 'الطلب'), urgent: wordAt('s05', 'عاجل'), evening: wordAt('s05', 'المساء'), booked: wordAt('s05', 'محجوز'),
    yes: wordAt('s06', 'حاضر'), took: wordAt('s06', 'أخذت'), h1: wordAt('s06', 'ساعة'), h2: wordAt('s06', 'ساعتين'), moved: wordAt('s06', 'وتأجل'), again: wordAt('s06', 'مرة'),
    ep: wordAt('s07', 'في'), two: wordAt('s07', 'الثانيتين'), no: wordAt('s07', 'لا'), yes2: wordAt('s07', 'وحاضر'), pause: wordAt('s07', 'وقفة'), small: wordAt('s07', 'صغيرة'),
    help: wordAt('s08', 'والمساعدة'), not: wordAt('s08', 'ليست'), agree: wordAt('s08', 'توافق'), m1: wordAt('s08', 'مرة'), m2: wordAt('s08', 'بعد'), m3: wordAt('s08', 'مرة', 1),
    cant: wordAt('s08', 'تقدر'), want: wordAt('s08', 'تريد'),
  };
  // part A — the evening
  const aIn = prog(f, start, sec(0.5));
  const aOut = prog(f, b.ep - sec(0.3), sec(0.5), ease.in);
  const bar = prog(f, b.req, b.evening + sec(0.4) - b.req, ease.inOut); // drawn through «الطلب لم يكن عاجلًا… وهذا المساء»
  const booked = prog(f, b.booked - sec(0.1), sec(0.4), ease.out);
  const drop = prog(f, b.yes - sec(0.05), sec(0.6), ease.in);
  const helpTo = 18 + prog(f, b.h1 - sec(0.15), sec(0.5), ease.inOut) + prog(f, b.h2 - sec(0.15), sec(0.5), ease.inOut);
  const hop1 = prog(f, b.moved - sec(0.1), sec(0.7), ease.inOut), hop2 = prog(f, b.again - sec(0.1), sec(0.6), ease.inOut);
  const slot = (x: number): [number, number] => [x, 900];
  const [d1x, d1y] = slot(1100), [d2x, d2y] = slot(700);
  const projFrom = Math.max(18, helpTo), projTo = projFrom + 2;
  const cardX = hop1 > 0 ? mix(mix(d1x, d2x, hop2), (eveningX(projFrom, X0, X1) + eveningX(projTo, X0, X1)) / 2, 1 - hop1) : (eveningX(projFrom, X0, X1) + eveningX(Math.min(22, projTo), X0, X1)) / 2;
  const cardY = hop1 > 0 ? mix(EY, d1y, hop1) - Math.sin(hop1 * Math.PI) * 140 - Math.sin(hop2 * Math.PI) * 120 : EY;
  // part B — the two seconds
  const bIn = prog(f, b.ep - sec(0.1), sec(0.5)), bOut = prog(f, b.help - sec(0.3), sec(0.5), ease.in);
  const ghost = prog(f, b.two - sec(0.1), sec(0.4));
  const widen = prog(f, b.pause - sec(0.1), sec(0.8), ease.inOut);
  const noX = mix(1240, 1420, widen), yesX = mix(680, 500, widen);
  // part C — again and again
  const cIn = prog(f, b.help - sec(0.1), sec(0.5));
  const stack = [b.agree, b.m1, b.m2, b.m3, b.m3 + sec(0.25), b.m3 + sec(0.45)];
  return (
    <Stage f={f} svg={
      <>
        {aOut < 1 && (
          <g opacity={aIn * (1 - aOut)}>
            {/* the request, not urgent */}
            <MsgBubble x={1330} y={190} text={T.sc01.ask} size={52} />
            {f >= b.urgent - sec(0.1) && <Stamp x={900} y={190} rot={-8} text={T.sc02.notUrgent} color={C.blue} s={mix(1.6, 1, prog(f, b.urgent - sec(0.1), sec(0.25), ease.out))} o={prog(f, b.urgent - sec(0.1), sec(0.15))} />}
            <Clock x={300} y={280} r={120} minutes={(helpTo - 16) * 60 - 60 + 60} o={bar} />
            <Evening x0={X0} x1={X1} y={EY} p={bar} label={T.sc02.evening} blocks={[
              { from: 18, to: helpTo, label: T.sc02.help, color: C.red, o: helpTo > 18.02 ? 1 : 0 },
            ]} />
            {/* the reserved project card: sits on the bar, then is pushed out to tomorrow, then the day after */}
            {booked > 0 && (
              <g transform={`translate(${cardX} ${cardY}) scale(${mix(1, 0.62, hop1)})`} opacity={booked}>
                <rect x={-230} y={-86} width={460} height={172} rx={20} fill={C.green} stroke={C.ink} strokeWidth={hop1 > 0 ? 5 : 0} />
                <ArText x={0} y={2} size={58} color={C.white}>{T.sc02.project}</ArText>
              </g>
            )}
            {/* day boxes for the postponed project */}
            {hop1 > 0 && [[d1x, d1y, T.sc02.tomorrow], [d2x, d2y, T.sc02.after]].map(([x, y, t], i) => (
              <g key={i} opacity={i === 0 ? hop1 : Math.max(hop2, 0.5 * hop1)}>
                <rect x={(x as number) - 170} y={(y as number) - 80} width={340} height={160} rx={18} fill="none" stroke={C.inkSoft} strokeWidth={5} strokeDasharray="16 12" />
                <ArText x={x as number} y={(y as number) - 112} size={40} color={C.inkSoft}>{t as string}</ArText>
              </g>
            ))}
            {/* «حاضر» drops from the request onto 6 pm */}
            {drop > 0 && helpTo < 18.15 && <MsgBubble x={mix(1330, eveningX(18.5, X0, X1), drop)} y={mix(300, EY, drop)} text={T.sc02.yes} size={60} fill={C.red} color={C.white} stroke={C.red} tail="out" />}
          </g>
        )}
        {bIn > 0 && bOut < 1 && (
          <g opacity={bIn * (1 - bOut)}>
            <Gap x1={yesX + 150} x2={noX - 150} y={330} label={T.sc02.twoSec} p={ghost} />
            {widen > 0 && <PauseSign x={960} y={540} s={widen} />}
          </g>
        )}
        {cIn > 0 && (
          <g opacity={cIn}>
            {/* helping itself: a green block with a check, which steps aside for the pile of «حاضر» */}
            <g opacity={prog(f, b.help - sec(0.1), sec(0.4)) * (1 - prog(f, b.agree - sec(0.4), sec(0.4)))} transform={`translate(960 ${mix(560, 640, prog(f, b.agree - sec(0.4), sec(0.4)))})`}>
              <rect x={-260} y={-90} width={520} height={180} rx={26} fill={C.green} filter="url(#lift)" />
              <ArText x={0} y={2} size={80} color={C.white}>{T.sc02.help}</ArText>
              <Check x={250} y={-80} s={mix(0.4, 1.4, prog(f, b.not - sec(0.1), sec(0.35), ease.out))} color={C.blue} />
            </g>
            {stack.map((at, i) => {
              const p = prog(f, at - sec(0.1), sec(0.35), ease.in);
              return p > 0 ? <MsgBubble key={i} x={960 + i * 14} y={mix(-100, 900 - i * 112, p)} rot={(i % 2 ? 1 : -1) * (2 + i * 1.6)} text={T.sc02.yes} size={58} fill={C.red} color={C.white} stroke={C.ink} tail="out" /> : null;
            })}
          </g>
        )}
      </>
    }>
      {/* part B words, large */}
      {bIn > 0 && bOut < 1 && (
        <div style={{ position: 'absolute', inset: 0, opacity: bIn * (1 - bOut) }}>
          <Headline text={T.sc02.no} f={f} at={b.ep + sec(0.2)} x={noX} y={420} w={300} size={220} color={f >= b.no - sec(0.05) ? C.blue : '#B9C3CF'} />
          <Headline text={T.sc02.yes} f={f} at={b.ep + sec(0.35)} x={yesX} y={420} w={360} size={190} color={f >= b.yes2 - sec(0.05) ? C.red : '#E9B7BC'} />
        </div>
      )}
      {bIn > 0 && bOut < 1 && <Label text={T.sc02.pause} f={f} at={b.small - sec(0.1)} until={b.help - sec(0.3)} x={960} y={800} size={52} bg={C.blue} />}
      <Headline text={T.sc02.helpOk} f={f} at={b.help} x={880} y={130} w={1200} size={84} color={C.ink} />
      <Label text={T.sc02.again} f={f} at={b.m1} x={1430} y={600} size={50} bg={C.ink} />
      <Label text={T.sc02.cant} f={f} at={b.cant - sec(0.1)} x={530} y={560} size={54} bg={C.red} />
      <Label text={T.sc02.dontWant} f={f} at={b.want - sec(0.1)} x={530} y={700} size={54} bg={C.red} />
    </Stage>
  );
};
