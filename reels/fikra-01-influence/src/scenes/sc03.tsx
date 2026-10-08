import React from 'react';
import { BookCard, PathShortcut } from '../art/doodles';
import { T } from '../copy';
import { Stage } from '../Stage';
import { Headline, Label } from '../text';
import { C } from '../theme';
import { ease, mix, prog, sec, sceneEnd, useEpisodeFrame, wordAt } from '../time';

// sc03 — the book (an original descriptive card, not the cover), mental shortcuts, the idea's name.
export const SC03: React.FC = () => {
  const f = useEpisodeFrame();
  const end = sceneEnd('sc03');
  const b = {
    book: wordAt('s07', 'كتاب'), shortcuts: wordAt('s07', 'اختصارات'), abused: wordAt('s09', 'تستغ'),
    name: wordAt('s10', 'التباين'), principle: wordAt('s10', 'يسم'),
  };
  const card = prog(f, b.book - sec(0.2), sec(0.7), ease.out);
  const pLong = prog(f, b.shortcuts - sec(0.1), sec(1.1), ease.inOut);
  const pShort = prog(f, b.shortcuts + sec(1.0), sec(0.7), ease.inOut);
  const warn = prog(f, b.abused - sec(0.1), sec(0.35), ease.out);
  const clear = prog(f, b.principle - sec(0.1), sec(0.6), ease.inOut);
  const line = prog(f, b.name + sec(0.3), sec(0.7), ease.inOut);
  return (
    <Stage f={f} svg={
      <>
        {clear < 1 && card > 0 && <BookCard x={1340} y={mix(600, 540, card)} s={0.95} o={card * (1 - clear)} rot={mix(4, 1.5, card)} title={T.sc03.title} subtitle={T.sc03.subtitle} author={T.sc03.author} />}
        {clear < 1 && pLong > 0 && <g opacity={1 - clear}><PathShortcut x={620} y={560} s={0.95} pLong={pLong} pShort={pShort} warn={warn} /></g>}
        {line > 0 && <path d="M 1260 640 L 660 640" stroke={C.coverBlue} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} />}
      </>
    }>
      <Label text={T.sc03.shortcut} f={f} at={b.shortcuts + sec(1.0)} until={b.principle} x={620} y={300} size={44} bg={C.blue} />
      <Headline text={T.sc03.principle} f={f} at={b.name - sec(0.1)} until={end} x={960} y={420} size={140} color={C.coverBlue} />
    </Stage>
  );
};
