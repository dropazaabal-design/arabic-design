// Reuses Baseera's starter illustrations (plugins/arabic-carousel/.../assets/starter).
// Their parts carry data-token / data-token-stroke; each token takes the reel's colour.
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const starter = new URL('../../../plugins/arabic-carousel/skills/arabic-carousel/assets/starter/', import.meta.url).pathname;
const TOKENS = { accent: '#2E7BC5', text: '#F5F1E8', muted: '#8FA3BF', bg: '#101827', onAccent: '#F5F1E8' };

for (const name of ['notebook-pencil', 'lightbulb', 'steps-flag']) {
  let svg = readFileSync(`${starter}${name}.svg`, 'utf8');
  svg = svg.replace(/<([a-z]+)([^>]*?)\/?>/g, (tag, el, attrs) => {
    const fillTok = attrs.match(/data-token="(\w+)"/);
    const strokeTok = attrs.match(/data-token-stroke="(\w+)"/);
    let out = tag;
    if (fillTok && TOKENS[fillTok[1]]) out = out.replace(/fill="#[0-9A-Fa-f]{3,8}"/, `fill="${TOKENS[fillTok[1]]}"`);
    if (strokeTok && TOKENS[strokeTok[1]]) out = out.replace(/stroke="#[0-9A-Fa-f]{3,8}"/, `stroke="${TOKENS[strokeTok[1]]}"`);
    return out;
  });
  writeFileSync(`${root}public/assets/${name}.svg`, svg);
  console.log(name, 'reused from Baseera starter');
}
