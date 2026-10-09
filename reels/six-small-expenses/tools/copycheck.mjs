// The words on screen must be exactly the approved text: every Arabic string in src/copy.ts equals
// storyboard.json's onScreen list (which was checked verbatim against brief.md), and nothing else.
// usage: node tools/copycheck.mjs   (exit 1 on any difference)
import { readFileSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const sb = JSON.parse(readFileSync(root + 'storyboard.json', 'utf8'));
const want = sb.scenes.flatMap((scene) => scene.onScreen);
const used = [...readFileSync(root + 'src/copy.ts', 'utf8').matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((s) => /[؀-ۿ]/.test(s));
const missing = want.filter((s) => !used.includes(s)), extra = used.filter((s) => !want.includes(s));
console.log(missing.length || extra.length ? JSON.stringify({ missing, extra }) : `copy matches the approved text (${want.length} strings)`);
process.exit(missing.length || extra.length ? 1 : 0);
