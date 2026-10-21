// Baseera studio text check (letters, hamza, ة/ه, ى/ي, digits, punctuation) on every on-screen string
// in storyboard.json, 20 per batch (studio's page limit). Writes review/arabic-copy-check.json.
// usage: node tools/arabic-check.mjs [STUDIO_MJS]   (BASEERA_HOME may point at a scratch home)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const studio = process.argv[2] || path.join(root, '../../plugins/arabic-carousel/skills/arabic-carousel/scripts/studio.mjs');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'fikra-check-'));
const sb = JSON.parse(fs.readFileSync(path.join(root, 'storyboard.json'), 'utf8'));
const caps = fs.existsSync(path.join(root, 'src/captions.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'src/captions.json'), 'utf8')).map((c) => c.text) : [];
const all = [...new Set([...sb.scenes.flatMap((s) => s.onScreen), ...caps])];   // burned captions are on screen too
const run = (...a) => JSON.parse(execFileSync('node', [studio, ...a], { encoding: 'utf8', maxBuffer: 64 << 20 }));
let errors = 0, warnings = 0;
const textIssues = [];
for (let k = 0; k < all.length; k += 20) {
  const lines = all.slice(k, k + 20), tag = `b${k / 20}`;
  fs.writeFileSync(`${out}/${tag}.spec.json`, JSON.stringify({ brief: 'ريل حفظت النصيحة — نصوص الشاشة', brandId: 'kitabwbs-motion', intent: { mode: 'carousel', format: 'story', pages: lines.length, destination: 'local' }, pages: lines.map((l) => ({ composition: 'statement', variant: 'block', content: { title: l } })) }));
  fs.writeFileSync(`${out}/${tag}.src.json`, JSON.stringify(lines.map((l) => ({ title: l }))));
  run('compose', `${out}/${tag}.spec.json`, '--out', `${out}/${tag}.d.json`, '--no-save');
  const c = run('check', `${out}/${tag}.d.json`, '--source', `${out}/${tag}.src.json`, '--pages', String(lines.length), '--format', 'story');
  // layout/art/asset findings belong to the carousel stand-in, not to the video text
  const text = c.issues.filter((i) => !/^layout\.|^art\.|^asset\./.test(i.code || ''));
  errors += text.filter((i) => i.severity === 'error').length;
  warnings += text.filter((i) => i.severity === 'warning').length;
  textIssues.push(...text.map((i) => [i.severity, i.code, i.message]));
}
const res = { tool: 'Baseera studio check (letters, hamza, ة/ه, ى/ي, digits, punctuation) on every on-screen string', strings: all.length, errors, warnings, textIssues };
fs.writeFileSync(path.join(root, 'review/arabic-copy-check.json'), JSON.stringify(res, null, 1) + '\n');
console.log(JSON.stringify({ strings: all.length, errors, warnings }));
process.exit(errors ? 1 : 0);
