// Second proofing pass with Baseera: the words placed in src/Reel.tsx, laid out
// as a Baseera design (one `statement` page per scene), are checked letter by
// letter against the approved on-screen copy in script.json (`studio check --source`).
// usage: node tools/proof.mjs OUTDIR   (BASEERA_HOME selects the store)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const studio = new URL('../../../plugins/arabic-carousel/skills/arabic-carousel/scripts/studio.mjs', import.meta.url).pathname;
const out = process.argv[2];
mkdirSync(out, { recursive: true });

const src = readFileSync(root + 'src/Reel.tsx', 'utf8');
const plain = (t) => t.replace(/\*/g, '');
// Every Arabic string the reel renders, in source order, with the component that renders it.
const placed = [...src.matchAll(/<(Title|Caption|Words|Pill)\s+text="([^"]+)"|\{\s*n:\s*'\d',\s*text:\s*'([^']+)'/g)]
  .map((m) => ({ kind: m[1] || 'Step', text: plain(m[2] || m[3]) }));
const take = (kind) => { const i = placed.findIndex((p) => p.kind === kind); if (i < 0) throw new Error(`missing ${kind}`); return placed.splice(i, 1)[0].text; };

const steps = [take('Step'), take('Step'), take('Step')];
const pages = [
  { title: take('Title'), lines: [] },
  { title: take('Title'), lines: [] },
  { title: take('Title'), lines: [take('Caption')] },
  { title: take('Title'), lines: [take('Words')] },
  { title: take('Title'), lines: [take('Words')] },
  { title: take('Title'), lines: [take('Pill'), take('Pill')] },
  { title: steps[0], lines: [steps[1], steps[2], take('Caption')] },
  { title: take('Title'), lines: [take('Caption')] },
];
if (placed.length) throw new Error(`unassigned strings: ${JSON.stringify(placed)}`);

const approved = JSON.parse(readFileSync(root + 'script.json', 'utf8')).onScreen.map((s) => {
  const lines = s.steps ? [s.steps[1], s.steps[2], s.subtitle] : [s.subtitle, s.bubble, s.right, s.left, s.signature].filter(Boolean);
  const page = { title: s.steps ? s.steps[0] : s.title };
  if (lines.length) page.subtitle = lines.join('\n');
  return page;
});

const spec = {
  brief: 'عقلية السلطعون — نصوص الريل كما وُضعت في Remotion',
  intent: { mode: 'carousel', format: 'story', pages: pages.length, destination: 'local' },
  paletteId: 'midnight',
  fonts: { heading: 'cairo', body: 'tajawal' },
  pages: pages.map((p) => ({ composition: 'statement', variant: 'block', content: { title: p.title, subtitle: p.lines.join('\n') } })),
};
writeFileSync(`${out}/placed.spec.json`, JSON.stringify(spec, null, 2));
writeFileSync(`${out}/approved.source.json`, JSON.stringify(approved, null, 2));

const run = (...a) => JSON.parse(execFileSync('node', [studio, ...a], { encoding: 'utf8', maxBuffer: 64 << 20 }));
run('compose', `${out}/placed.spec.json`, '--out', `${out}/placed.design.json`, '--no-save');
const check = run('check', `${out}/placed.design.json`, '--source', `${out}/approved.source.json`, '--pages', String(pages.length), '--format', 'story');
writeFileSync(`${out}/proof.json`, JSON.stringify(check, null, 2));
const textIssues = check.issues.filter((i) => !/^layout\.|^art\.|^asset\./.test(i.code || ''));
console.log(JSON.stringify({ passed: textIssues.every((i) => i.severity !== 'error'), errors: check.errors, warnings: check.warnings, textIssues }, null, 2));
