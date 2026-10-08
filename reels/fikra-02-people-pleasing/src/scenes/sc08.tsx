import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ArText } from '../art/doodles';
import { ChatBubble, Check, Clock, DayCalendar, PauseSign, Phone, calY } from '../art/world';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline, Label } from '../text';
import { C } from '../theme';
import { TL, ease, mix, prog, sec, useEpisodeFrame, wordAt } from '../time';

// sc08 — the close mirrors the hook: same phone, same calendar, same message. This time it is read,
// a pause, then the reply — and the evening stays with the project. The difference is two seconds,
// marked on the phone between the message and the reply. Then the question of the opening turns into
// the closing line, and the three steps become one path to take into the next request.
const PX = 1340, PY = 540, PS = 0.9;
const CX = 480, CY = 560;                         // a little left of sc01, to leave room for the two seconds
const IN_Y = -200, OUT1 = -70, OUT2 = 40;
const sy = (y: number) => PY + y * PS;
const PATH: Array<[number, number]> = [[1490, 500], [960, 460], [430, 500]];

export const SC08: React.FC = () => {
  const f = useEpisodeFrame();
  const b = {
    arrived: wordAt('s39', 'وصلت'), read: wordAt('s39', 'وقرأتها'), paused: wordAt('s39', 'وتوقفت'), then: wordAt('s39', 'ثم'),
    eve: wordAt('s40', 'المساء'), proj: wordAt('s40', 'لمشروعك'),
    same: wordAt('s41', 'الرسالة'), sameEve: wordAt('s41', 'والمساء'), diff: wordAt('s41', 'والفرق'), two: wordAt('s41', 'ثانيتان'),
    before: wordAt('s42', 'قبل'), sure: wordAt('s42', 'تأكد'),
    next: wordAt('s43', 'الطلب'), s1: wordAt('s43', 'توقف'), s2: wordAt('s43', 'راجع'), s3: wordAt('s43', 'أجب'),
  };
  const end = TL.durationInFrames;
  const outro = end - sec(3);
  const msg = prog(f, b.arrived - sec(0.1), sec(0.4), ease.out);
  const ticks = prog(f, b.read - sec(0.05), sec(0.3));
  const pause = prog(f, b.paused - sec(0.1), sec(0.5)) * (1 - prog(f, b.then - sec(0.05), sec(0.5)));
  const clock = prog(f, b.paused - sec(0.1), sec(0.4), ease.out);
  const r1 = prog(f, b.then, sec(0.3), ease.out), r2 = prog(f, b.then + sec(0.35), sec(0.3), ease.out);
  const glow = Math.max(prog(f, b.eve - sec(0.1), sec(0.4)), prog(f, b.sameEve - sec(0.1), sec(0.3)) * (1 - prog(f, b.sameEve + sec(0.6), sec(0.4))));
  const ring = prog(f, b.same - sec(0.1), sec(0.3)) * (1 - prog(f, b.same + sec(0.9), sec(0.3)));
  const gap = prog(f, b.two - sec(0.15), sec(0.5), ease.out);
  // the closing words over the stage, then one path
  const veil = prog(f, b.before - sec(0.3), sec(0.5), ease.inOut);
  const words = 1 - prog(f, b.s1 - sec(0.45), sec(0.35), ease.in);
  const legs = [prog(f, b.s1 - sec(0.15), sec(0.4), ease.out), prog(f, b.s1 + sec(0.1), b.s2 - b.s1, ease.inOut), prog(f, b.s2 + sec(0.1), b.s3 - b.s2, ease.inOut)];
  const pathOut = prog(f, outro - sec(0.3), sec(0.5), ease.in);
  const nodeIn = (i: number) => prog(f, [b.s1, b.s2, b.s3][i] - sec(0.15), sec(0.35), ease.out);
  return (
    <Stage f={f} svg={
      <>
        <DayCalendar x={CX} y={CY} title={T.sc08.today} blocks={[{ from: 18, to: 20, label: T.sc08.project, color: C.green, glow }]} />
        {f >= b.proj - sec(0.1) && <Check x={CX - 272 - 4} y={CY + calY(19)} s={mix(0.4, 1.5, prog(f, b.proj - sec(0.1), sec(0.35), ease.out))} />}
        <Phone x={PX} y={PY} s={PS} contact={T.sc08.contact} tint={pause} keys={1}>
          <ChatBubble y={IN_Y} side="in" text={T.sc08.ask} p={msg} ticks={ticks} />
          <ChatBubble y={OUT1} side="out" text={T.sc08.reply1} p={r1} size={38} ticks={r1} fill={C.greenSoft} />
          <ChatBubble y={OUT2} side="out" text={T.sc08.reply2} p={r2} size={38} ticks={r2} fill={C.greenSoft} />
          {ring > 0 && <rect x={-236} y={IN_Y - 50} width={480} height={100} rx={32} fill="none" stroke={C.blue} strokeWidth={8} opacity={ring} />}
        </Phone>
        {clock > 0 && <Clock x={PX - 250} y={PY - 430} s={mix(0.1, 0.28, clock)} r={210} minutes={30} frozen={1} ring={1} />}
        {/* the two seconds, between the message and the reply */}
        {gap > 0 && (
          <g opacity={gap}>
            <path d={`M ${PX - 300} ${sy(IN_Y)} L ${PX - 330} ${sy(IN_Y)} L ${PX - 330} ${sy(OUT1)} L ${PX - 300} ${sy(OUT1)}`} fill="none" stroke={C.blue} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - gap} />
          </g>
        )}
      </>
    }>
      <Label text={T.sc08.twoSec} f={f} at={b.two - sec(0.1)} until={b.before - sec(0.3)} x={PX - 345} y={sy((IN_Y + OUT1) / 2) - 32} align="right" size={44} bg={C.blue} />
      {/* the stage steps back; the closing line */}
      <AbsoluteFill style={{ background: C.light, opacity: veil * 0.92 }} />
      {words > 0 && (
        <div style={{ position: 'absolute', inset: 0, opacity: words }}>
          <Headline text={T.sc08.end1} f={f} at={b.before - sec(0.1)} x={960} y={290} w={1600} size={124} color={C.ink} />
          <Headline text={T.sc08.end2} f={f} at={b.sure - sec(0.1)} x={960} y={490} w={1600} size={100} color={C.green} />
        </div>
      )}
      {/* one path for the next request */}
      {legs[0] > 0 && (
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: 1 - pathOut }}>
          {[0, 1].map((i) => (
            <path key={i} d={`M ${PATH[i][0]} ${PATH[i][1]} Q ${(PATH[i][0] + PATH[i + 1][0]) / 2} ${PATH[i][1] - 120} ${PATH[i + 1][0]} ${PATH[i + 1][1]}`} fill="none" stroke={C.blue} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - legs[i + 1]} />
          ))}
          {PATH.map(([x, y], i) => {
            const p = nodeIn(i);
            return p > 0 ? (
              <g key={i} opacity={p} transform={`translate(${x} ${y}) scale(${mix(0.6, 1.25, p)})`}>
                {i === 0 && <PauseSign x={0} y={0} s={0.85} />}
                {i === 1 && (
                  <g>
                    <rect x={-76} y={-80} width={152} height={160} rx={18} fill={C.paper} stroke={C.ink} strokeWidth={6} />
                    <rect x={-76} y={-80} width={152} height={44} rx={18} fill={C.cardboard} />
                    <rect x={-52} y={-8} width={104} height={50} rx={10} fill={C.green} />
                  </g>
                )}
                {i === 2 && <Check x={0} y={0} s={2} />}
                <ArText x={0} y={150} size={70} color={C.ink} weight={900}>{[T.sc08.s1, T.sc08.s2, T.sc08.s3][i]}</ArText>
              </g>
            ) : null;
          })}
        </svg>
      )}
      {/* end card */}
      <Headline text={T.sc08.series} f={f} at={outro} x={960} y={330} w={1400} size={120} color={C.ink} />
      <Label text={T.sc08.brand} f={f} at={outro + sec(0.4)} x={960} y={520} size={60} bg={C.red} />
    </Stage>
  );
};
