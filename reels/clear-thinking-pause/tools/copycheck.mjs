// Every on-screen string (src/copy.ts) must appear verbatim in storyboard.json, and every storyboard
// string must be drawn; captions must rejoin to the locked script exactly.
import fs from 'node:fs';
const copySrc = fs.readFileSync('src/copy.ts', 'utf8');
const strings = [...copySrc.matchAll(/'([^']*[؀-ۿ@][^']*)'/g)].map((m) => m[1]);
const sb = JSON.parse(fs.readFileSync('storyboard.json', 'utf8'));
const sbText = [sb.persistent.hook, sb.persistent.handle, ...sb.scenes.flatMap((s) => s.text)];
const joined = sbText.join(' | ');
const errors = [];
for (const s of strings) if (!joined.includes(s)) errors.push(`drawn but not in storyboard: ${s}`);
// storyboard strings must be buildable from drawn strings (words drawn separately are joined with spaces)
const drawnWords = new Set(strings.flatMap((s) => s.split(' ')));
for (const t of sbText) for (const w of t.split(' ')) if (!drawnWords.has(w)) errors.push(`storyboard word not drawn: ${w} (in «${t}»)`);
const script = JSON.parse(fs.readFileSync('script.json', 'utf8'));
const caps = JSON.parse(fs.readFileSync('src/captions.json', 'utf8'));
const locked = script.segments.map((s) => s.text).join(' ');
if (caps.map((c) => c.text).join(' ') !== locked) errors.push('captions do not rejoin to the locked script');
for (const c of caps) if (c.cps > 17) errors.push(`caption over 17 cps: ${c.text} (${c.cps})`);
const latin = strings.filter((s) => /[A-Za-z]/.test(s) && s !== '@kitabwbs');
if (latin.length) errors.push(`Latin text on screen: ${latin}`);
console.log(JSON.stringify({ strings: strings.length, storyboard: sbText.length, captions: caps.length, maxCps: Math.max(...caps.map((c) => c.cps)), errors }, null, 1));
process.exit(errors.length ? 1 : 0);
