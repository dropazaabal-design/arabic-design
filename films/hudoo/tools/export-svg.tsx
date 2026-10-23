// Writes real, editable SVG files from the same components the film renders (no rasters inside).
// usage: ./tools/export-svg.sh   (bundles this file with esbuild and runs it)
//   characters/<who>/full-<pose>.svg      every cast member standing; Salim in all poses
//   characters/<who>/parts/<Part>.svg      Head, Torso, LeftArm, RightArm, LeftLeg, RightLeg (bind pose)
//   characters/salim/expressions/<e>.svg   the expression library (head only)
//   characters/salim/views/<view>.svg      front, three-quarter, profile
//   characters/hands/<gesture>.svg         the ten hands
//   characters/rig.json                    bone lengths and the joint pivots of the bind pose
//   assets/*.svg, backgrounds/*.svg         props, metaphors and places at their default props
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CAST, type Who } from '../src/kit/characters/cast';
import { Character } from '../src/kit/characters/Character';
import { EXPRESSIONS, Head, type Expr } from '../src/kit/characters/face';
import { GESTURES, Hand } from '../src/kit/characters/hands';
import { POSES, type PoseName } from '../src/kit/characters/poses';
import { BONES, joints, REST } from '../src/kit/characters/skeleton';
import * as PLACES from './export-places';

const out = (p: string, el: React.ReactElement, vb: string, meta = '') => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  // HTML inside <foreignObject> needs the XHTML namespace to render in a standalone .svg file
  const body = renderToStaticMarkup(el).replace(/(<foreignObject[^>]*>)<([a-z]+)/g, '$1<$2 xmlns="http://www.w3.org/1999/xhtml"');
  fs.writeFileSync(p, `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" viewBox="${vb}">${meta}${body}</svg>\n`);
};
const CH = '-150 -380 300 400';
const root = path.resolve('.');
let n = 0;
for (const who of Object.keys(CAST) as Who[]) {
  out(`${root}/characters/${who}/full-stand.svg`, <Character who={who} p={POSES.stand.p} hands={POSES.stand.hands} face={who === 'jaser' ? 'smug' : 'calm'} />, CH); n++;
  for (const part of ['Head', 'Torso', 'LeftArm', 'RightArm', 'LeftLeg', 'RightLeg']) {
    const j = joints(REST);
    const pivot: Record<string, [number, number]> = { Head: j.neck, Torso: j.hip, LeftArm: j.shL, RightArm: j.shR, LeftLeg: j.legL.top, RightLeg: j.legR.top };
    out(`${root}/characters/${who}/parts/${part}.svg`, <Character who={who} p={REST} only={[part]} />, CH, `<desc>pivot ${pivot[part].map((v) => v.toFixed(1)).join(',')}</desc>`); n++;
  }
}
for (const name of Object.keys(POSES) as PoseName[]) { out(`${root}/characters/salim/poses/${name}.svg`, <Character who="salim" p={POSES[name].p} hands={POSES[name].hands} face="calm" />, CH); n++; }
for (const e of Object.keys(EXPRESSIONS) as Expr[]) { out(`${root}/characters/salim/expressions/${e}.svg`, <Head r={48} turn={0.25} face={EXPRESSIONS[e]} look={CAST.salim} line={4.6} />, '-60 -66 120 126'); n++; }
for (const [name, t] of [['front', 0], ['three-quarter', 0.5], ['profile', 1]] as const) { out(`${root}/characters/salim/views/${name}.svg`, <Head r={48} turn={t} face={EXPRESSIONS.neutral} look={CAST.salim} line={4.6} />, '-60 -66 120 126'); n++; }
for (const g of GESTURES) { out(`${root}/characters/hands/${g}.svg`, <Hand g={g} skin={CAST.salim.skin} />, '-6 -18 36 32'); n++; }
fs.writeFileSync(`${root}/characters/rig.json`, JSON.stringify({ bones: BONES, bindPose: REST, joints: joints(REST), parts: ['Head', 'Eyes', 'Eyebrows', 'Mouth', 'Torso', 'LeftArm', 'RightArm', 'LeftHand', 'RightHand', 'LeftLeg', 'RightLeg', 'Props'] }, null, 1));
for (const [name, el, folder, vb] of PLACES.items()) { out(`${root}/${folder}/${name}.svg`, el, vb); n++; }
console.log(`${n} svg files`);
