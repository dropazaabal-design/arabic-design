// Writes the cast (every required expression) and the props as standalone SVG files in assets/svg/,
// so Baseera's library can store and reuse them outside this video (same approach as
// reels/crab-mentality/tools/export-assets.tsx). run: npm run assets
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Cleaner, Litterer, Narrator, Passerby, Spitter } from '../src/characters/cast';
import { ExprName } from '../src/characters/face';
import { Monkey, MONKEY_POSES } from '../src/characters/monkey';
import { Banana, Bin, Broom, Bulb, Dustpan, Flag, Peel, PictoSign, SnackBag } from '../src/characters/props';
import { POSES } from '../src/characters/rig';

const out = path.join(process.cwd(), 'assets/svg/');
mkdirSync(out, { recursive: true });
const svg = (w: number, h: number, vb: string, node: React.ReactNode) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${renderToStaticMarkup(<>{node}</>)}</svg>\n`;
const PERSON = (n: React.ReactNode) => svg(400, 700, '-200 -680 400 700', n);

const EXPR: ExprName[] = ['neutral', 'curious', 'surprised', 'skeptical', 'embarrassed', 'satisfied', 'laugh', 'smug', 'tired', 'tender'];
const items: Array<[string, string]> = [
  ...EXPR.map((e): [string, string] => [`narrator-${e}`, PERSON(<Narrator x={0} y={0} expr={e} pose={POSES.stand} />)]),
  ['narrator-point', PERSON(<Narrator x={0} y={0} expr="curious" pose={POSES.pointCam} />)],
  ['narrator-hand-on-chest', PERSON(<Narrator x={0} y={0} expr="tender" pose={POSES.handOnChest} />)],
  ['litterer-smug-shades', PERSON(<Litterer x={0} y={0} expr="smug" shades={1} pose={POSES.stand} />)],
  ['litterer-satisfied', PERSON(<Litterer x={0} y={0} expr="satisfied" pose={POSES.thumbsUp} />)],
  ['cleaner-tired-bend', svg(600, 600, '-300 -560 600 600', <Cleaner x={0} y={0} expr="tired" pose={POSES.bend} />)],
  ['cleaner-satisfied', PERSON(<Cleaner x={0} y={0} expr="satisfied" pose={POSES.stand} />)],
  ['spitter-smug', PERSON(<Spitter x={0} y={0} expr="smug" pose={POSES.hipsHands} />)],
  ['passerby-surprised', PERSON(<Passerby x={0} y={0} expr="surprised" pose={POSES.stand} />)],
  ['monkey-eating', svg(420, 480, '-210 -440 420 480', <Monkey x={0} y={0} expr="chewing" pose={MONKEY_POSES.eat} itemR={<Banana x={0} y={-8} s={0.75} />} />)],
  ['monkey-skeptical', svg(420, 480, '-210 -440 420 480', <Monkey x={0} y={0} expr="skeptical" pose={MONKEY_POSES.sit} />)],
  ['monkey-thumbs-up', svg(420, 480, '-210 -440 420 480', <Monkey x={0} y={0} expr="satisfied" pose={MONKEY_POSES.thumbs} />)],
  ['snack-bag', svg(160, 200, '-80 -100 160 200', <SnackBag x={0} y={0} />)],
  ['snack-bag-winged', svg(400, 260, '-200 -150 400 260', <SnackBag x={0} y={0} wings={1} flap={1} empty />)],
  ['banana', svg(120, 180, '-60 -90 120 180', <Banana x={0} y={0} />)],
  ['banana-peel', svg(200, 160, '-100 -80 200 160', <Peel x={0} y={0} />)],
  ['bin', svg(240, 240, '-120 -220 240 240', <Bin x={0} y={0} />)],
  ['broom', svg(160, 360, '-80 -280 160 360', <Broom x={0} y={0} />)],
  ['dustpan', svg(180, 200, '-90 -180 180 200', <Dustpan x={0} y={0} />)],
  ['flag', svg(160, 260, '-40 -240 160 260', <Flag x={0} y={0} wave={1} />)],
  ['bulb', svg(220, 220, '-110 -120 220 220', <Bulb x={0} y={0} />)],
  ['pictogram-bin-sign', svg(220, 260, '-110 -130 220 260', <PictoSign x={0} y={0} />)],
];
for (const [name, body] of items) writeFileSync(`${out}${name}.svg`, body);
console.log(`${items.length} SVGs → assets/svg/`);
