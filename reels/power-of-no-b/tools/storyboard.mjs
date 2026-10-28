// Resolve storyboard.json's word anchors on the measured timeline (same rules as src/video/shots.ts)
// and write storyboard.md. With --frames, print each shot's [start, middle, end-1] frames instead.
// usage: node tools/storyboard.mjs [--frames]   (adapted from reels/doublethink/tools/storyboard.mjs)
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const sb = JSON.parse(readFileSync(root + 'storyboard.json', 'utf8'));
const tl = JSON.parse(readFileSync(root + 'timeline.json', 'utf8'));
const words = JSON.parse(readFileSync(root + 'src/video/words.json', 'utf8'));
const fps = tl.fps;
const sec = (s) => Math.round(s * fps);
const clean = (x) => x.replace(/[«»،.:؟…!؛]/g, '').replace(/[ً-ْـ]/g, '');
const wordAt = (seg, w, n = 0) => {
  const hit = words.filter((x) => x.seg === seg && clean(x.w).startsWith(clean(w)))[n];
  if (!hit) throw new Error(`no word ${w} in ${seg}`);
  return sec(hit.start);
};
const resolve = (a) => (a.at !== undefined ? sec(a.at) : (a.word ? wordAt(a.seg, a.word, a.n ?? 0) : sec(tl.segments.find((s) => s.id === a.seg).start)) + sec(a.off ?? 0));
const shots = sb.shots.map((s, i, all) => ({ ...s, t0: resolve(s.anchor), t1: i + 1 < all.length ? resolve(all[i + 1].anchor) : tl.durationInFrames }));

if (process.argv.includes('--frames')) {
  console.log(JSON.stringify(shots.map((s) => [s.id, s.t0, Math.round((s.t0 + s.t1) / 2), s.t1 - 1])));
  process.exit(0);
}

const t = (f) => (f / fps).toFixed(2);
const lens = shots.map((s) => (s.t1 - s.t0) / fps);
let md = `# Storyboard — «بس طلب صغير!» (بصيرة 06 — النسخة B)\n\n`;
md += `${shots.length} لقطة، ${(tl.durationInFrames / fps).toFixed(2)} ث (${tl.durationInFrames} إطارًا، ${fps} إطارًا/ث). `;
md += `الأزمنة مقيسة: كل لقطة تبدأ على كلمة منطوقة في التسجيل (\`storyboard.json\` ← \`src/video/words.json\`). `;
md += `طول اللقطة: أقصر ${Math.min(...lens).toFixed(2)} ث، أطول ${Math.max(...lens).toFixed(2)} ث، متوسط ${(lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(2)} ث. كل الانتقالات قطع مباشر.\n\n`;
md += `${sb.world}\n\n`;
md += `**أحجام اللقطات:** ${[...new Set(shots.map((s) => s.size))].join('، ')}.\n\n`;
for (const s of shots) {
  md += `## ${s.id} · ${t(s.t0)}–${t(s.t1)} ث (${((s.t1 - s.t0) / fps).toFixed(2)} ث) · ${s.size} · \`${s.component}\`\n\n`;
  md += `| | |\n|---|---|\n`;
  md += `| الصوت | ${s.audio} |\n| الدافع | ${s.motive} |\n| الفعل والتماس | ${s.action} |\n| عبء الغرض | ${s.load} |\n| تعبير الوجه | ${s.face} |\n`;
  md += `| الباب والساعة | ${s.doorClock} |\n| الإيقاع والصوت | ${s.rhythm} |\n| سبب القطع | ${s.cut} |\n\n`;
}
writeFileSync(root + 'storyboard.md', md);
console.log(`storyboard.md: ${shots.length} shots, ${t(tl.durationInFrames)} s`);
