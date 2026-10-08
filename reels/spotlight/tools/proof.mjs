// Baseera proofing of the words the reel actually renders.
// Every string passed to a text component in src/Reel.tsx (colour markup removed)
// becomes one `statement` page of a Baseera design, and `studio check --source`
// compares it letter by letter with the approved on-screen copy in script.json.
// usage: BASEERA_HOME=… node tools/proof.mjs OUTDIR
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const studio = new URL('../../../plugins/arabic-carousel/skills/arabic-carousel/scripts/studio.mjs', import.meta.url).pathname;
const out = process.argv[2] || `${root}out/proof`;
mkdirSync(out, { recursive: true });

const unmark = (t) => t.replace(/\{\$\{C\.\w+\}\|([^}]+)\}/g, '$1').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
const src = readFileSync(root + 'src/Reel.tsx', 'utf8');
const texts = src.slice(src.indexOf('const Texts'), src.indexOf('// Sound'));
const placed = [...texts.matchAll(/<(?:Title|Caption|Words|Pill)\s+text=(?:\{`([^`]+)`\}|\{"([^"]+)"\}|"([^"]+)")|\{\s*text:\s*'([^']+)'/g)]
  .map((m) => unmark(m[1] ?? m[2] ?? m[3] ?? m[4]));
// The Steps items sit in the source after the title that introduces them, which is screen order too.
const approved = JSON.parse(readFileSync(root + 'script.json', 'utf8')).onScreen.map((s) => s.text);
if (placed.length !== approved.length) console.error(`placed ${placed.length} strings, approved ${approved.length}`);

const spec = {
  brief: 'تأثير بقعة الضوء — النصوص كما وُضعت في Remotion',
  brandId: 'kitabwbs-motion',
  intent: { mode: 'carousel', format: 'story', pages: placed.length, destination: 'local' },
  pages: placed.map((t) => ({ composition: 'statement', variant: 'block', content: { title: t } })),
};
writeFileSync(`${out}/placed.spec.json`, JSON.stringify(spec, null, 2));
writeFileSync(`${out}/approved.source.json`, JSON.stringify(approved.map((t) => ({ title: t })), null, 2));
const run = (...a) => JSON.parse(execFileSync('node', [studio, ...a], { encoding: 'utf8', maxBuffer: 64 << 20 }));
run('compose', `${out}/placed.spec.json`, '--out', `${out}/placed.design.json`, '--no-save');
const check = run('check', `${out}/placed.design.json`, '--source', `${out}/approved.source.json`, '--pages', String(placed.length), '--format', 'story');
writeFileSync(`${out}/proof.json`, JSON.stringify(check, null, 2));
const textIssues = check.issues.filter((i) => !/^layout\.|^art\.|^asset\./.test(i.code || ''));
console.log(JSON.stringify({ strings: placed.length, approved: approved.length, passed: placed.length === approved.length && textIssues.every((i) => i.severity !== 'error'), errors: check.errors, warnings: check.warnings, textIssues }, null, 2));
