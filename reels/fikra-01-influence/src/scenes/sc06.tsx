import React from 'react';
import { Arrow, Calendar, Case, Laptop, PriceTag, Ruler } from '../art/doodles';
import { T } from '../copy';
import { Paper, Stage } from '../Stage';
import { Headline, Label } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneEnd, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc06 — the same mechanism in a second everyday case, then the correction: not naivety, not every offer a trick.
export const SC06: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc06'), end = sceneEnd('sc06');
  const b = {
    laptop: wordAt('s25', 'حاسوب'), price900: wordAt('s25', 'بتسعمئة'), caseIn: wordAt('s25', 'غطاء'), price60: wordAt('s25', 'بستين'),
    small: wordAt('s26', 'صغيرة'), alone: wordAt('s27', 'وحده'), correction: wordAt('s28', 'تصحيح'), naive: wordAt('s28', 'ساذج'), trick: wordAt('s28', 'خدعة'),
    choose: wordAt('s29', 'نختر'), leave: wordAt('s29', 'لغيرنا'), same: wordAt('s25', 'نفسها'), next: wordAt('s26', 'بجانب'), sixty: wordAt('s27', 'ستين'), judge: wordAt('s29', 'نحكم'),
  };
  const lap = prog(f, b.laptop - sec(0.2), sec(0.6), ease.out);
  const slots = prog(f, start + sec(0.1), sec(0.5), ease.out);
  const link = prog(f, b.same - sec(0.1), sec(0.8), ease.inOut);
  const tag900 = prog(f, b.price900 - sec(0.1), sec(0.4));
  const cs = prog(f, b.caseIn - sec(0.15), sec(0.5), ease.out);
  const tag60 = prog(f, b.price60 - sec(0.1), sec(0.4));
  const shrink = prog(f, b.small - sec(0.2), sec(0.7), ease.inOut);
  const alone = prog(f, b.alone - sec(0.4), sec(0.9), ease.inOut);
  const fix = prog(f, b.correction - sec(0.2), sec(0.6), ease.inOut);
  const pull = prog(f, b.leave - sec(0.1), sec(0.6), ease.inOut);
  const ruler = prog(f, b.judge - sec(0.1), sec(0.8), ease.inOut); // «لا نحكم على الأشياء في فراغ»: there is always a yardstick
  const own = prog(f, b.choose, sec(0.8), ease.inOut); // «نختر… بأنفسنا»: it becomes our own
  const near = prog(f, b.next - sec(0.1), sec(0.6), ease.inOut) * (1 - prog(f, b.alone - sec(0.4), sec(0.9), ease.inOut)); // «بجانب التسعمئة»
  const tagPulse = 1 + 0.15 * Math.sin(prog(f, b.sixty - sec(0.1), sec(0.5)) * Math.PI);
  const caseScale = mix(mix(1, 0.6, shrink), 1.15, alone) * mix(1, 0.7, fix);
  const caseX = mix(600, 960, alone) + 150 * near, caseY = mix(mix(500, 560, shrink), 470, alone) - fix * 95;
  return (
    <Stage f={f} dark svg={
      <>
        {/* the mechanism as a template: something big, then something small next to it */}
        {slots > 0 && lap < 1 && <rect x={950} y={245} width={640} height={470} rx={18} fill="none" stroke={C.coverGray} strokeWidth={5} strokeDasharray="18 14" opacity={slots * (1 - lap) * 0.8} />}
        {slots > 0 && cs < 1 && <rect x={410} y={355} width={380} height={330} rx={18} fill="none" stroke={C.coverGray} strokeWidth={5} strokeDasharray="18 14" opacity={slots * (1 - cs) * 0.8} />}
        {link > 0 && cs < 1 && <g opacity={1 - cs}><Arrow from={[930, 330]} to={[800, 400]} bend={0.25} p={link} color={C.coverGray} width={6} /></g>}
        {lap > 0 && alone < 1 && (
          <g transform={`translate(${mix(0, 900, alone)} 0)`} opacity={lap}>
            <Paper x={1270} y={480} w={640} h={470} rot={-1.2} />
            <Laptop x={1270} y={470} s={mix(1, 1.08, shrink)} />
            {tag900 > 0 && <PriceTag x={1270} y={790} s={tag900} label={T.sc06.laptop} color={C.coverBlue} w={320} />}
          </g>
        )}
        {cs > 0 && (
          <g transform={`translate(${caseX} ${caseY}) scale(${caseScale})`} opacity={cs * mix(1, 0.2, fix)}>
            <Paper x={0} y={20} w={380} h={330} rot={1.5} />
            <Case x={0} y={10} s={1} />
            {tag60 > 0 && <PriceTag x={0} y={290} s={tag60 * 0.95 * tagPulse} label={T.sc06.case60} color={C.red} />}
          </g>
        )}
        {alone > 0 && <g opacity={alone * (1 - fix)}><Paper x={1380} y={470} w={300} h={290} rot={-2} /><Calendar x={1380} y={480} s={1.05} /></g>}
        {pull > 0 && <g opacity={pull}><Arrow from={[1500, 220]} to={[1080, 300]} bend={0.2} p={pull} color={C.red} dashed /></g>}
        {ruler > 0 && <g opacity={ruler * (1 - 0.65 * pull)}><Paper x={960} y={870} w={700} h={150} rot={0.5} /><Ruler x={960} y={870} s={1.05} color={own > 0.5 ? C.green : C.coverGray} p={ruler} /></g>}
      </>
    }>
      <Label text={T.sc06.hypothetical} f={f} at={start} until={b.correction - sec(0.2)} x={1766} y={74} align="right" size={30} bg={C.coverGray} color={C.ink} />
      <Label text={T.sc06.alone} f={f} at={b.alone} until={b.correction - sec(0.2)} x={960} y={890} size={52} bg={C.blue} />
      <Headline text={T.sc06.correction} f={f} at={b.correction - sec(0.1)} until={end} x={960} y={96} size={76} color={C.white} />
      <Label text={T.sc06.notNaive} f={f} at={b.naive} until={end} x={960} y={560} size={56} bg={C.green} />
      <Label text={T.sc06.notTrick} f={f} at={b.trick} until={end} x={960} y={660} size={56} bg={C.blue} />
    </Stage>
  );
};
