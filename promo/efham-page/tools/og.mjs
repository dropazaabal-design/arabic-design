// The share image (assets/og-image.jpg, 1200×630) from the covers: node tools/og.mjs
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.join(execSync('npm root -g').toString().trim(), 'x'));
const { chromium } = require('playwright');
const F = path.resolve('../efham-ad/public/fonts');
const face = (fam, w, file) => ['arabic', 'latin'].map((s) => `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(`${F}/${file}-${s}.woff2`).toString('base64')})}`).join('');
const covers = [1, 2, 3, 4, 5, 6].map((n, i) => `<img src="data:image/webp;base64,${fs.readFileSync(`assets/cover-${n}.webp`).toString('base64')}" style="right:${8 + i * 9.4}%;top:${12 + Math.abs(i - 2.5) * 2.4}%;z-index:${i + 1};transform:rotate(${((2.5 - i) * 2).toFixed(1)}deg)">`).join('');
const html = `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><style>${face('Tajawal', 800, 'tajawal-800')}${face('Cairo', '400 700', 'cairo-var')}
body{margin:0;width:1200px;height:630px;background:#071525;color:#F8FAFC;display:grid;grid-template-columns:560px 1fr;overflow:hidden;font-family:Cairo}
.t{padding:70px 64px 0 0}
h1{font:800 66px/1.15 Tajawal;margin:0}
p{font:700 30px/1.5 Cairo;color:rgba(248,250,252,.72);margin:22px 0 0}
.b{position:absolute;bottom:56px;right:64px;display:flex;align-items:center;gap:14px;font:800 30px/1 Tajawal}
.m{width:52px;height:52px;border-radius:14px;background:#2E7BC5;display:grid;place-items:center;font:800 32px/1 Tajawal;padding-bottom:5px;box-sizing:border-box}
.u{color:#10B981;font:700 28px/1 Cairo;margin-right:10px}
.fan{position:relative}
.fan img{position:absolute;width:44%;border-radius:8px;box-shadow:0 20px 40px rgba(0,0,0,.5);transform-origin:50% 90%}
.line{position:absolute;right:24px;top:0;bottom:0;width:4px;background:#2E7BC5}
</style><body><div class="line"></div><div class="t"><h1>بكج افهم نفسك</h1><p>99 خلاصة كتاب في 6 مسارات.<br>كل خلاصة تنتهي بـ3 خطوات تطبيقية.</p></div><div class="fan">${covers}</div>
<div class="b"><span class="m">ف</span>كتاب وبس<span class="u">kitabwbs.com</span></div></body></html>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html, { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: 'assets/og-image.jpg', type: 'jpeg', quality: 88 });
await b.close();
console.log('assets/og-image.jpg');
