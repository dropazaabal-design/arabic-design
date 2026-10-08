import React from 'react';
import { ArText } from '../art/doodles';
import { Check, DayCalendar, MsgBubble, Pill, Scale, Stamp, textW } from '../art/world';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc05 — the correction. Not «لا» to everything, not suspicion of every request. Between an automatic
// «نعم» and an angry «لا» sits a clear reply; that line then becomes the beam of a balance that respects
// your time and the one who asked — until «نعم» after «نعم» tips it. Clarity turns help into a choice:
// tomorrow, relaxed, instead of today, annoyed.
const X = 960, Y = 480, SS = 1.2;                         // the balance
const pan = (tilt: number, side: -1 | 1): [number, number] => {
  const a = (tilt * Math.PI) / 180;
  return [X + side * 300 * Math.cos(a) * SS, Y + (side * 300 * Math.sin(a) - 40) * SS];
};
const NO = [[960, 560, 0], [600, 400, -8], [1320, 400, 6], [460, 700, 5], [1460, 700, -6], [760, 840, -4], [1160, 840, 7], [960, 345, -3]];

/** A white strike drawn across a word. */
const Strike: React.FC<{ x: number; y: number; w: number; p: number; rot?: number }> = ({ x, y, w, p, rot = -6 }) => p > 0 ? (
  <path d={`M ${x + w / 2} ${y} L ${x - w / 2} ${y}`} stroke={C.white} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} transform={`rotate(${rot} ${x} ${y})`} />
) : null;

export const SC05: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc05');
  const b = {
    fix: wordAt('s20', 'تصحيح'), no: wordAt('s20', 'لا'), every: wordAt('s20', 'لكل'), thing: wordAt('s20', 'شيء'), nor: wordAt('s20', 'ولا'),
    req: wordAt('s20', 'طلب'), exploit: wordAt('s20', 'استغلال'),
    sol: wordAt('s21', 'الحل'), clear: wordAt('s21', 'واضح'), yes: wordAt('s21', 'نعم'), auto: wordAt('s21', 'تلقائية'), no2: wordAt('s21', 'لا', 1), angry: wordAt('s21', 'غاضبة'),
    reply: wordAt('s22', 'رد'), yours: wordAt('s22', 'وقتك'), asker: wordAt('s22', 'طلب'),
    when: wordAt('s23', 'فحين'), agree: wordAt('s23', 'توافق'), always: wordAt('s23', 'دائما'), mine: wordAt('s23', 'وقتي'),
    clarity: wordAt('s24', 'والوضوح'), coop: wordAt('s24', 'التعاون'), choice: wordAt('s24', 'اختيارا'), react: wordAt('s24', 'رد'),
    help: wordAt('s25', 'تساعده'), tom: wordAt('s25', 'غدا'), relaxed: wordAt('s25', 'مرتاح'), help2: wordAt('s25', 'تساعده', 1), today: wordAt('s25', 'اليوم'), annoyed: wordAt('s25', 'منزعج'),
  };
  // part A — not «لا» to everything, not suspicion
  const aOut = prog(f, b.sol - sec(0.3), sec(0.4), ease.in);
  const fix = prog(f, b.fix - sec(0.1), sec(0.25), ease.out);
  const up = prog(f, b.no - sec(0.45), sec(0.4), ease.inOut);
  const noGrid = 1 - prog(f, b.req - sec(0.3), sec(0.3));
  const strikeAll = prog(f, b.nor - sec(0.05), sec(0.35), ease.inOut);
  const reqIn = prog(f, b.req - sec(0.1), sec(0.3), ease.out);
  const exploit = prog(f, b.exploit - sec(0.1), sec(0.25), ease.out);
  // part B — the spectrum, whose line becomes the beam
  const bIn = prog(f, b.sol - sec(0.1), sec(0.5), ease.inOut);
  const toBeam = prog(f, b.reply - sec(0.2), sec(0.6), ease.inOut);
  const cOut = prog(f, b.clarity - sec(0.3), sec(0.4), ease.in);
  const barW = mix(1200, 600 * SS, toBeam), barY = mix(560, Y - 40 * SS, toBeam);
  const ends = 1 - prog(f, b.reply - sec(0.3), sec(0.3));
  // part C — the balance, then «نعم» after «نعم»
  const drops = [b.agree, b.agree + sec(0.25), b.always, b.always + sec(0.25)].map((at) => prog(f, at - sec(0.1), sec(0.35), ease.in));
  const tilt = drops.reduce((a, d) => a + d, 0) * 6;
  const L = pan(tilt, -1), R = pan(tilt, 1);
  const clearOnTop = 1 - prog(f, b.when - sec(0.1), sec(0.3));
  // part D — a choice, not a reaction
  const dOut = prog(f, b.help - sec(0.5), sec(0.4), ease.in);
  // part E — tomorrow relaxed, instead of today annoyed
  const eIn = prog(f, b.help - sec(0.3), sec(0.6), ease.out);
  const toTom = prog(f, b.tom - sec(0.15), sec(0.6), ease.inOut);
  const ghost = prog(f, b.today - sec(0.1), sec(0.4));
  return (
    <Stage f={f} dark svg={
      <>
        {aOut < 1 && (
          <g opacity={1 - aOut}>
            {fix > 0 && <Stamp x={960} y={mix(480, 170, up)} rot={-4} text={T.sc05.correction} color={C.aqua} size={64} s={mix(1.7, 1, fix) * mix(1.8, 1, up)} o={Math.min(1, fix * 2)} />}
            {noGrid > 0 && NO.map(([x, y, r], i) => {
              const at = i === 0 ? b.no : b.every + (i - 1) * ((b.thing + sec(0.2) - b.every) / 7);
              const p = prog(f, at - sec(0.05), sec(0.2), ease.out);
              return p > 0 ? <Stamp key={i} x={x} y={y} rot={r} text={T.sc05.no} color={C.red} size={i ? 76 : 110} s={mix(1.5, 1, p)} o={Math.min(p * 2, 1) * noGrid * mix(1, 0.35, strikeAll)} /> : null;
            })}
            {noGrid > 0 && strikeAll > 0 && <path d="M 1560 300 L 360 860" stroke={C.white} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - strikeAll} opacity={noGrid} />}
            {reqIn > 0 && (
              <g opacity={reqIn}>
                <MsgBubble x={860} y={540} s={mix(0.7, 1.3, reqIn)} text="" w={440} size={56} />
                <rect x={860 - 200} y={510} width={400} height={22} rx={11} fill={C.line} />
                <rect x={860 - 40} y={550} width={240} height={22} rx={11} fill={C.line} />
              </g>
            )}
            {exploit > 0 && <Stamp x={1110} y={690} rot={-10} text={T.sc05.exploit} color={C.red} size={72} s={mix(1.6, 1, exploit)} o={Math.min(1, exploit * 2)} />}
            <Strike x={1110} y={690} w={480} p={prog(f, b.exploit + sec(0.45), sec(0.3))} rot={-10} />
          </g>
        )}
        {bIn > 0 && cOut < 1 && (
          <g opacity={bIn * (1 - cOut)}>
            {/* the spectrum line, which becomes the beam */}
            {toBeam < 1 && <path d={`M ${X + barW / 2} ${barY} L ${X - barW / 2} ${barY}`} stroke={C.paper} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - bIn} opacity={1 - toBeam} />}
            {toBeam > 0 && (
              <g opacity={toBeam}>
                <Scale x={X} y={Y} s={SS} tilt={tilt} left="" right="" leftColor={C.green} rightColor={C.aqua} dark />
                {[[L, T.sc05.yourTime, b.yours], [R, T.sc05.request, b.asker]].map(([p, t, at], i) => (
                  <g key={i} opacity={prog(f, (at as number) - sec(0.1), sec(0.3))}><ArText x={(p as number[])[0]} y={(p as number[])[1] + 250 * SS} size={56} color={C.white}>{t as string}</ArText></g>
                ))}
                {drops.map((d, i) => d > 0 ? <Pill key={i} x={R[0] - 80 + (i % 2) * 160} y={mix(R[1] - 460, R[1] + 145 * SS - 30 - Math.floor(i / 2) * 76, d)} text={T.sc05.yes} fill={C.red} size={44} /> : null)}
              </g>
            )}
            {/* the two ends, both struck */}
            {ends > 0 && [[1460, b.yes, b.auto, T.sc05.autoYes], [460, b.no2, b.angry, T.sc05.angryNo]].map(([x, at, end, t], i) => {
              const p = prog(f, (at as number) - sec(0.1), sec(0.3), ease.out);
              return p > 0 ? (
                <g key={i} opacity={ends}>
                  <Pill x={x as number} y={barY} text={t as string} fill={C.red} size={52} s={mix(0.6, 1, p)} o={p} />
                  <Strike x={x as number} y={barY} w={textW(t as string, 52) + 90} p={prog(f, (end as number) + sec(0.2), sec(0.3))} />
                </g>
              ) : null;
            })}
            {/* the clear reply: the middle of the line, then the pivot of the balance */}
            <Pill x={X} y={mix(barY, Y - 150 * SS, toBeam)} text={T.sc05.clear} fill={C.green} size={mix(62, 54, toBeam)}
              o={prog(f, b.clear - sec(0.1), sec(0.3)) * clearOnTop} s={mix(0.6, 1, prog(f, b.clear - sec(0.1), sec(0.35), ease.out))} />
          </g>
        )}
        {cOut > 0 && dOut < 1 && (
          <g opacity={1 - dOut}>
            <Pill x={960} y={290} text={T.sc05.clear} fill={C.green} size={70} o={prog(f, b.clarity - sec(0.1), sec(0.3))} />
            <Check x={960 - textW(T.sc05.clear, 70) / 2 - 130} y={290} s={1.4} o={prog(f, b.coop - sec(0.1), sec(0.3))} />
            <Strike x={680} y={600} w={textW(T.sc05.reaction, 96) + 40} p={prog(f, b.react + sec(0.35), sec(0.3))} rot={-4} />
          </g>
        )}
        {eIn > 0 && (
          <g opacity={eIn} transform={`translate(0 ${(1 - eIn) * 80})`}>
            <DayCalendar x={1320} y={600} s={0.8} title={T.sc05.today} blocks={[
              { from: 18, to: 20, label: T.sc05.project, color: C.green },
              { from: 18, to: 19.3, label: T.sc05.help, color: C.red, dashed: true, o: ghost * 0.85 },
            ]} />
            <DayCalendar x={600} y={600} s={0.8} title={T.sc05.tomorrow} blocks={[
              { from: 17, to: 18, label: T.sc05.help, color: C.blue, o: prog(f, b.tom + sec(0.3), sec(0.15)) },
            ]} />
            {/* the help block leaves today and lands in tomorrow */}
            {f >= b.help - sec(0.1) && toTom < 1 && (
              <g transform={`translate(${mix(960, 566, toTom)} ${mix(220, 502, toTom) - Math.sin(toTom * Math.PI) * 60}) scale(${mix(1, 0.8, toTom) * mix(0.6, 1, prog(f, b.help - sec(0.1), sec(0.3), ease.out))})`} opacity={prog(f, b.help - sec(0.1), sec(0.2)) * (1 - prog(f, b.tom + sec(0.35), sec(0.1)))}>
                <rect x={-230} y={-50} width={460} height={100} rx={16} fill={C.blue} />
                <ArText x={0} y={2} size={44} color={C.white}>{T.sc05.help}</ArText>
              </g>
            )}
            <Strike x={1286} y={600} w={460} p={prog(f, b.annoyed + sec(0.3), sec(0.3))} rot={-8} />
          </g>
        )}
      </>
    }>
      {/* part C headline */}
      <Headline text={T.sc05.less} f={f} at={b.mine - sec(0.1)} until={b.clarity - sec(0.3)} x={960} y={90} w={1500} size={84} color={C.white} />
      {/* part D words */}
      {cOut > 0 && dOut < 1 && (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - dOut }}>
          <Headline text={T.sc05.choice} f={f} at={b.choice - sec(0.1)} x={1250} y={480} w={700} size={150} color={C.green} />
          <Headline text={T.sc05.reaction} f={f} at={b.react - sec(0.1)} x={680} y={530} w={700} size={96} color={C.muted} />
        </div>
      )}
      {/* part E labels */}
      <Headline text={T.sc05.relaxed} f={f} at={b.relaxed - sec(0.1)} x={600} y={110} w={600} size={84} color={C.green} />
      <Headline text={T.sc05.annoyed} f={f} at={b.annoyed - sec(0.1)} x={1320} y={110} w={600} size={84} color={C.red} />
    </Stage>
  );
};
