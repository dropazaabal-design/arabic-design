import React from 'react';
import { Arrow, Calendar, Case, Laptop, PriceTag, Ruler } from '../art/doodles';
import { T } from '../copy';
import { Paper, Stage } from '../Stage';
import { Label } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneEnd, sceneStart, useEpisodeFrame, wordAt } from '../time';

// sc06 — the same mechanism in a second everyday case, then the correction: not naivety, not every offer a trick.
export const SC06: React.FC = () => {
  const f = useEpisodeFrame();
  const start = sceneStart('sc06'), end = sceneEnd('sc06');
  const b = {
    laptop: wordAt('s25', 'حاسوب'), price900: wordAt('s25', 'بتسعمئة'), caseIn: wordAt('s25', 'غطاء'), price60: wordAt('s25', 'بستين'),
    small: wordAt('s26', 'صغيرة'), alone: wordAt('s27', 'وحدها'), correction: wordAt('s28', 'تصحيح'), naive: wordAt('s28', 'ساذج'), trick: wordAt('s28', 'خدعة'),
    leave: wordAt('s29', 'نترك'), choose: wordAt('s29', 'تختار'),
  };
  const lap = prog(f, b.laptop - sec(0.2), sec(0.6), ease.out);
  const tag900 = prog(f, b.price900 - sec(0.1), sec(0.4));
  const cs = prog(f, b.caseIn - sec(0.15), sec(0.5), ease.out);
  const tag60 = prog(f, b.price60 - sec(0.1), sec(0.4));
  const shrink = prog(f, b.small - sec(0.2), sec(0.7), ease.inOut);
  const alone = prog(f, b.alone - sec(0.4), sec(0.9), ease.inOut);
  const fix = prog(f, b.correction - sec(0.2), sec(0.6), ease.inOut);
  const pull = prog(f, b.leave - sec(0.1), sec(0.6), ease.inOut);
  const own = prog(f, b.choose, sec(0.8), ease.inOut);
  const caseScale = mix(mix(1, 0.6, shrink), 1.15, alone) * mix(1, 0.7, fix);
  const caseX = mix(600, 960, alone), caseY = mix(mix(500, 560, shrink), 470, alone) - fix * 120;
  return (
    <Stage f={f} dark svg={
      <>
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
            {tag60 > 0 && <PriceTag x={0} y={290} s={tag60 * 0.95} label={T.sc06.case60} color={C.red} />}
          </g>
        )}
        {alone > 0 && <g opacity={alone * (1 - fix)}><Paper x={1380} y={470} w={300} h={290} rot={-2} /><Calendar x={1380} y={480} s={1.05} /></g>}
        {pull > 0 && <g opacity={pull * (1 - own)}><Arrow from={[1500, 220]} to={[1080, 300]} bend={0.2} p={pull} color={C.red} dashed /></g>}
        {own > 0 && <g><Paper x={960} y={870} w={700} h={150} rot={0.5} /><Ruler x={960} y={870} s={1.05} color={C.green} p={own} /></g>}
      </>
    }>
      <Label text={T.sc06.hypothetical} f={f} at={start} until={b.correction - sec(0.2)} x={1766} y={74} align="right" size={30} bg={C.coverGray} color={C.ink} />
      <Label text={T.sc06.alone} f={f} at={b.alone} until={b.correction - sec(0.2)} x={960} y={890} size={52} bg={C.blue} />
      <Label text={T.sc06.notNaive} f={f} at={b.naive} until={end} x={960} y={560} size={56} bg={C.green} />
      <Label text={T.sc06.notTrick} f={f} at={b.trick} until={end} x={960} y={660} size={56} bg={C.blue} />
    </Stage>
  );
};
