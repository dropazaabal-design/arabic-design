import React from 'react';
import { Arrow, Bowl, Ruler, Thermo } from '../art/doodles';
import { T } from '../copy';
import { Paper, Stage } from '../Stage';
import { Headline, Label } from '../text';
import { C } from '../theme';
import { FPS, ease, mix, prog, sec, sceneEnd, sceneStart, useEpisodeFrame, wordAt } from '../time';

const mixColor = (a: string, b: string, p: number) => {
  const h = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [x, y] = [h(a), h(b)];
  return `rgb(${x.map((v, i) => Math.round(mix(v, y[i], p))).join(',')})`;
};

// sc04 — the mechanism: no fixed ruler, comparison with what came just before; the water
// demonstration shown with gauges (no hands drawn); order makes the reference point.
export const SC04: React.FC = () => {
  const f = useEpisodeFrame();
  const t = f / FPS;
  const start = sceneStart('sc04'), end = sceneEnd('sc04');
  const b = {
    ruler: wordAt('s11', 'بمسطرة'), but: wordAt('s11', 'بل'), compare: wordAt('s11', 'يقارنها'), water: wordAt('s12', 'جرب'), bowls: wordAt('s12', 'ثلاثة'), move: wordAt('s13', 'انقل'), inCold: wordAt('s13', 'البارد'), inHot: wordAt('s13', 'الساخن'), fromCold: wordAt('s13', 'القادمة'), fromHot: wordAt('s13', 'والقادمة'),
    cold: wordAt('s12', 'بارد'), hot: wordAt('s12', 'ساخن'), warm: wordAt('s12', 'فاتر'),
    feelsWarm: wordAt('s13', 'بالدفء'), feelsCold: wordAt('s13', 'بالبرودة'), same: wordAt('s14', 'واحد'),
    order: wordAt('s15', 'الترتيب'), first: wordAt('s15', 'أولا'), ref: wordAt('s15', 'نقطة'), after: wordAt('s15', 'بعده'), useful: wordAt('s16', 'مفيد'),
  };
  const rulerP = prog(f, start + sec(0.1), Math.max(sec(0.6), b.ruler + sec(0.3) - start), ease.inOut); // drawn from the cut, complete on «بمسطرة»
  const cross = prog(f, b.but - sec(0.05), sec(0.5), ease.inOut);
  const cmp = prog(f, b.compare, sec(0.6), ease.inOut);
  const part1Out = prog(f, b.bowls - sec(0.5), sec(0.5), ease.in); // part 1 holds through «جرّب هذا» and leaves for «ثلاثة أوعية»
  const bowl = (at: number) => prog(f, at - sec(0.2), sec(0.5), ease.out);
  const bowlIn = (k: number) => prog(f, b.bowls - sec(0.1) + k * sec(0.3), sec(0.5), ease.out); // the bowls land one by one across «ثلاثة أوعية»
  const travel = prog(f, b.move - sec(0.1), sec(0.9), ease.inOut); // the hands move on «انقل»
  // each felt gauge changes across its own phrase: «اليد القادمة من البارد تشعر بالدفء» / «والقادمة من الساخن تشعر بالبرودة»
  const warmUp = prog(f, b.fromCold, Math.max(sec(0.8), b.feelsWarm + sec(0.4) - b.fromCold), ease.inOut);
  const coolDown = prog(f, b.fromHot, Math.max(sec(0.8), b.feelsCold + sec(0.4) - b.fromHot), ease.inOut);
  const ringC = prog(f, b.inCold - sec(0.1), sec(0.5)) * (1 - prog(f, b.move, sec(0.4)));
  const ringH = prog(f, b.inHot - sec(0.1), sec(0.5)) * (1 - prog(f, b.move, sec(0.4)));
  const slot = (i: number) => prog(f, b.order + sec(0.35) + i * sec(0.2), sec(0.45), ease.out); // «الترتيب»: three places in a row
  const real = prog(f, b.same - sec(0.3), sec(0.5));
  const part2Out = prog(f, b.order - sec(0.2), sec(0.5), ease.in);
  const step = (at: number) => prog(f, at - sec(0.15), sec(0.45), ease.out);
  const steps: Array<[number, number, string]> = [[1460, b.first, T.sc04.first], [960, b.ref, T.sc04.reference], [460, b.after, T.sc04.after]];
  const ok = prog(f, b.useful, sec(0.4), ease.out);
  return (
    <Stage f={f} dark svg={
      <>
        {part1Out < 1 && (
          <g opacity={prog(f, start, sec(0.4)) * (1 - part1Out)}>
            <Paper x={960} y={420} w={780} h={230} rot={-1} />
            <Ruler x={960} y={420} s={1.2} p={rulerP} crossed={cross} />
            {cmp > 0 && (
              <g opacity={cmp}>
                <Paper x={1180} y={780} w={170} h={170} rot={2} fill={C.coverGray} />
                <Paper x={740} y={780} w={170} h={170} rot={-2} fill={C.blue} />
                <Arrow from={[1080, 780]} to={[850, 780]} p={cmp} color={C.white} />
              </g>
            )}
          </g>
        )}
        {part2Out < 1 && f >= b.bowls - sec(0.3) && (
          <g opacity={1 - part2Out}>
            {([[1480, 0, 'cold'], [440, 2, 'hot'], [960, 1, 'warm']] as const).map(([x, k, kind]) => {
              const p = bowlIn(k);
              return p > 0 ? <g key={kind} opacity={p}><Paper x={x} y={660} w={400} h={330} rot={kind === 'warm' ? 0 : kind === 'cold' ? 1.5 : -1.5} /><Bowl x={x} y={650} s={1.05} kind={kind} t={t} /></g> : null;
            })}
            {/* «ضع يدًا في البارد والأخرى في الساخن» */}
            {ringC > 0 && <ellipse cx={1480} cy={660} rx={230} ry={195} fill="none" stroke={C.blue} strokeWidth={7} strokeDasharray="22 14" opacity={ringC} />}
            {ringH > 0 && <ellipse cx={440} cy={660} rx={230} ry={195} fill="none" stroke={C.red} strokeWidth={7} strokeDasharray="22 14" opacity={ringH} />}
            {/* how the water FEELS to each side: dashed gauges travelling into the lukewarm bowl */}
            {bowl(b.cold) > 0 && <Thermo x={mix(1480, 1100, travel)} y={mix(300, 380, travel)} s={0.85} dashed level={mix(0.15, 0.62, warmUp)} color={mixColor(C.blue, C.red, warmUp)} o={bowl(b.cold)} />}
            {bowl(b.hot) > 0 && <Thermo x={mix(440, 820, travel)} y={mix(300, 380, travel)} s={0.85} dashed level={mix(0.85, 0.38, coolDown)} color={mixColor(C.red, C.blue, coolDown)} o={bowl(b.hot)} />}
            {/* what the water IS: one solid thermometer, unchanged */}
            {real > 0 && <Thermo x={960} y={360} s={0.85} level={0.5} color={C.green} o={real} />}
          </g>
        )}
        {part2Out > 0 && steps.map(([x, at], i) => slot(i) > 0 && <rect key={`slot${i}`} x={x - 200} y={435} width={400} height={210} rx={18} fill="none" stroke={C.coverGray} strokeWidth={5} strokeDasharray="18 14" opacity={slot(i) * (1 - step(at)) * 0.8} />)}
        {part2Out > 0 && steps.map(([x, at, _], i) => {
          const p = step(at);
          return p > 0 ? (
            <g key={i} opacity={p}>
              <Paper x={x} y={mix(580, 540, p)} w={400} h={210} rot={i === 1 ? 0 : i ? -1.5 : 1.5} />
              {i < 2 && <Arrow from={[x - 215, 540]} to={[x - 285, 540]} bend={0} p={step(steps[i + 1][1])} color={C.white} />}
            </g>
          ) : null;
        })}
        {ok > 0 && <g transform={`translate(960 830) scale(${mix(0.6, 1, ok)})`} opacity={ok}><circle r={40} fill={C.green} /><path d="M -18 0 L -4 14 L 20 -14" fill="none" stroke={C.white} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" /></g>}
      </>
    }>
      <Headline text={T.sc04.ruler} f={f} at={b.ruler - sec(0.2)} until={b.bowls - sec(0.5)} x={960} y={110} size={88} color={C.white} />
      <Label text={T.sc04.cold} f={f} at={b.cold} until={b.order - sec(0.2)} x={1480} y={840} size={40} bg={C.blue} />
      <Label text={T.sc04.hot} f={f} at={b.hot} until={b.order - sec(0.2)} x={440} y={840} size={40} bg={C.red} />
      <Label text={T.sc04.warm} f={f} at={b.warm} until={b.order - sec(0.2)} x={960} y={840} size={40} bg={C.inkSoft} />
      <Headline text={T.sc04.sameWater} f={f} at={b.same - sec(0.1)} until={b.order - sec(0.2)} x={960} y={110} size={88} color={C.white} />
      {steps.map(([x, at, text], i) => <Headline key={i} text={text} f={f} at={at} until={end} x={x} y={500 - (text.length > 14 ? 26 : 0)} w={360} size={text.length > 14 ? 44 : 50} color={C.ink} />)}
    </Stage>
  );
};
