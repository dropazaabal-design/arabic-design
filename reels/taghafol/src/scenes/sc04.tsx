import React from 'react';
import { Pill } from '../art/world';
import { Cross, Eye, Lens, Note, Sight } from '../art/taghafol';
import { T } from '../copy';
import { Stage } from '../Stage';
import { C } from '../theme';
import { FPS, at, ease, life, mix, prog, sceneStart, sec, useEpisodeFrame } from '../time';
import { Title } from './shared';

// sc04 — «هو فطِن لما يكون حوله، لكن متغافل، ليس يحقّق في كل ما يقع». The title recalls who «هو» is
// (the answer heard in the cold open). Notes keep arriving from the right and pass under the eye; each is
// seen (a line of sight, a tick) and none is stopped. A magnifier comes down over one, and is crossed out.
const EYE: [number, number] = [540, 740];
const LANE = 1090, SPEED = 300, GAP = 0.8, FIRST = 26.2;                   // px/s; a note every 0.8 s (source s)
const COLORS = [C.blue, C.cardboard, C.green, C.red, C.aqua];

export const SC04: React.FC = () => {
  const f = useEpisodeFrame();
  const t = (f - at(28.3)) / FPS + 28.3;                                   // source second now
  const sharp = prog(f, at(28.84), sec(0.35));
  const over = prog(f, at(32.5), sec(0.35));
  const lid = mix(0, 0.42, prog(f, at(32.5), sec(0.6), ease.inOut));
  const lens = life(f, at(34.0), at(36.6), sec(0.4), sec(0.4));
  const cross = prog(f, at(35.12), sec(0.45), ease.inOut);
  const notes = Array.from({ length: 14 }).map((_, i) => {
    const x = 1250 - SPEED * (t - (FIRST + GAP * i));
    return { i, x, lit: Math.max(0, Math.min(1, (620 - x) / 60)) };
  }).filter((n) => n.x > -160 && n.x < 1260);
  return (
    <Stage f={f} svg={
      <>
        <path d={`M 40 ${LANE + 80} L 1040 ${LANE + 80}`} stroke={C.line} strokeWidth={8} strokeLinecap="round" strokeDasharray="2 22" />
        {notes.map((n) => <Sight key={n.i} from={[EYE[0], EYE[1] + 60]} to={[n.x, LANE - 60]} o={n.x > 380 && n.x < 640 ? Math.min(1, (640 - n.x) / 40, (n.x - 380) / 60) : 0} />)}
        {notes.map((n) => <Note key={n.i} x={n.x} y={LANE} color={COLORS[n.i % COLORS.length]} lit={n.lit} tick={n.lit} rot={[3, -2, 2, -3][n.i % 4]} />)}
        <Eye id="sc04" x={EYE[0]} y={EYE[1]} s={mix(0.7, 0.75, prog(f, sceneStart('sc04'), sec(0.4)))} lid={lid} />
        {lens > 0 && (
          <g opacity={lens}>
            <Lens x={560} y={mix(900, LANE, lens)} r={115} s={mix(0.7, 1, lens)} />
            <Cross x={560} y={LANE} p={cross} size={120} />
          </g>
        )}
        {sharp > 0 && <Pill text={T.sc04.sharp} x={860} y={EYE[1]} size={54} fill={C.blue} s={mix(0.8, 1, sharp)} o={sharp} />}
        {over > 0 && <Pill text={T.sc04.overlook} x={220} y={EYE[1]} size={54} fill={C.green} s={mix(0.8, 1, over)} o={over} />}
      </>
    }>
      <Title text={T.sc04.title} f={f} at={sceneStart('sc04')} />
    </Stage>
  );
};
