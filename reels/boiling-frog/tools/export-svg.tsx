// Writes this reel's new characters and props as standalone SVG files in assets/svg/ (no text except the
// «بكرة» sheet), so Baseera's library can reuse them. Same approach as reels/mukarram/tools/export-svg.tsx.
// run: npm run assets
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { POSES } from '@mukarram/characters/rig';
import { Frog } from '../src/characters/frog';
import { Human } from '../src/characters/human';
import { BeanBag, CalendarSheet, FeedCard, PaperPile, Phone, TaskSheet, Thermometer, ThoughtBubble, WallClock } from '../src/characters/props';

const out = path.join(process.cwd(), 'assets/svg/');
mkdirSync(out, { recursive: true });
const svg = (w: number, h: number, vb: string, node: React.ReactNode) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${renderToStaticMarkup(<>{node}</>)}</svg>\n`;
const FROG = (n: React.ReactNode) => svg(360, 360, '-180 -330 360 360', n);
const MAN = (n: React.ReactNode) => svg(400, 700, '-200 -680 400 700', n);

const items: Array<[string, string]> = [
  ['frog-sitting-happy', FROG(<Frog x={0} y={0} eyes="happy" mouth="smile" />)],
  ['frog-surprised', FROG(<Frog x={0} y={0} eyes="wide" mouth="o" brow={1} throat={0.6} />)],
  ['frog-crouch-anticipation', FROG(<Frog x={0} y={0} eyes="open" mouth="flat" brow={-1} pose={{ crouch: 1 }} />)],
  ['frog-jump-stretch', svg(360, 520, '-180 -470 360 520', <Frog x={0} y={0} eyes="wide" mouth="o" pose={{ stretch: 1, armL: 150, armR: 150 }} />)],
  ['frog-knowing-towel', FROG(<Frog x={0} y={0} eyes="half" mouth="smirk" brow={-1} towel />)],
  ['frog-pointing', FROG(<Frog x={0} y={0} eyes="open" mouth="grin" brow={1} towel pose={{ armR: 110 }} />)],
  ['frog-swim-ring', FROG(<Frog x={0} y={0} eyes="happy" mouth="smile" ring />)],
  ['human-satisfied', MAN(<Human x={0} y={0} expr="satisfied" pose={POSES.stand} />)],
  ['human-surprised', MAN(<Human x={0} y={0} expr="surprised" pose={POSES.shrug} />)],
  ['human-embarrassed', MAN(<Human x={0} y={0} expr="embarrassed" pose={POSES.stand} />)],
  ['human-determined', MAN(<Human x={0} y={0} expr="determined" pose={POSES.stand} />)],
  ['human-sheet-done', MAN(<Human x={0} y={0} expr="laugh" pose={{ ...POSES.stand, armR: [150, 30], handR: 'pinch' }} itemR={<TaskSheet x={0} y={-80} s={0.72} check={1} />} />)],
  ['thermometer', svg(160, 420, '-80 -360 160 420', <Thermometer x={0} y={0} level={0.6} />)],
  ['phone', svg(260, 420, '-130 -250 260 420', <Phone x={0} y={0} bar={0.4} scroll={40} />)],
  ['wall-clock', svg(220, 220, '-110 -110 220 220', <WallClock x={0} y={0} minutes={20} />)],
  ['task-sheet-checked', svg(200, 240, '-100 -120 200 240', <TaskSheet x={0} y={0} check={1} />)],
  ['paper-pile', svg(260, 360, '-130 -330 260 360', <PaperPile x={0} y={0} n={18} />)],
  ['calendar-bukra', svg(220, 200, '-110 -100 220 200', <CalendarSheet x={0} y={0} />)],
  ['feed-card', svg(180, 140, '-90 -70 180 140', <FeedCard x={0} y={0} kind={0} />)],
  ['bean-bag', svg(500, 280, '-250 -250 500 280', <BeanBag x={0} y={0} />)],
  ['thought-bubble', svg(300, 300, '-110 -130 300 300', <ThoughtBubble x={0} y={0} pop={1} />)],
];
for (const [name, body] of items) writeFileSync(`${out}${name}.svg`, body);
console.log(`${items.length} SVGs → assets/svg/`);
