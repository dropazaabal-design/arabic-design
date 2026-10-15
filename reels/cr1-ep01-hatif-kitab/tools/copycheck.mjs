// On-screen copy: Arabic only (no Latin letters), Western digits only, captions rejoin to the locked
// scripts word for word, and no caption faster than 17 characters a second.
import fs from 'node:fs';
const errors = [];
const strings = [];
for (const f of ['src/Episode.tsx', 'src/Reel.tsx', 'src/text.tsx', 'src/art.tsx']) {
  const src = fs.readFileSync(f, 'utf8');
  // JSX text and string literals that carry Arabic
  for (const m of src.matchAll(/(?:'([^'\n]*[؀-ۿ][^'\n]*)'|>([^<>{}\n]*[؀-ۿ][^<>{}\n]*)<|"([^"\n]*[؀-ۿ][^"\n]*)")/g)) strings.push((m[1] ?? m[2] ?? m[3]).trim());
}
for (const s of strings) {
  if (/[A-Za-z]/.test(s)) errors.push(`Latin on screen: ${s}`);
  if (/[٠-٩۰-۹]/.test(s)) errors.push(`non-Western digits on screen: ${s}`);
}
const lines = (file) => fs.readFileSync(file, 'utf8').split(/^## /m).slice(1).flatMap((s) => s.trim().split('\n').slice(1));
for (const [prog, file] of [['long', 'script-long.md'], ['short', 'script-short.md']]) {
  const data = JSON.parse(fs.readFileSync(`src/data/${prog}.json`, 'utf8'));
  const want = lines(file).join(' ');
  if (data.captions.map((c) => c.text).join(' ') !== want) errors.push(`${prog}: captions do not rejoin to ${file}`);
  for (const c of data.captions) if (c.text.length / (c.end - c.start) > 17) errors.push(`${prog}: caption over 17 cps: ${c.text}`);
  for (const c of data.captions) if (/[A-Za-z٠-٩]/.test(c.text)) errors.push(`${prog}: caption has Latin or non-Western digits: ${c.text}`);
}
console.log(JSON.stringify({ strings: strings.length, distinct: [...new Set(strings)].length, errors }, null, 1));
process.exit(errors.length ? 1 : 0);
