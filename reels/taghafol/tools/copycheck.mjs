// The words on screen must be exactly the storyboard's: same strings, scene by scene.
// usage: node tools/copycheck.mjs   (exit 1 on any difference)
import { readFileSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const sb = JSON.parse(readFileSync(root + 'storyboard.json', 'utf8'));
const src = readFileSync(root + 'src/copy.ts', 'utf8');
let bad = 0;
for (const scene of sb.scenes) {
  const block = new RegExp(`${scene.sceneId}: \\{([^}]*)\\}`).exec(src)?.[1] ?? '';
  const used = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const want = scene.onScreen;
  const missing = want.filter((s) => !used.includes(s)), extra = used.filter((s) => !want.includes(s));
  if (missing.length || extra.length) { bad++; console.log(scene.sceneId, { missing, extra }); }
}
console.log(bad ? `copy differs in ${bad} scene(s)` : `copy matches the storyboard (${sb.scenes.length} scenes)`);
process.exit(bad ? 1 : 0);
