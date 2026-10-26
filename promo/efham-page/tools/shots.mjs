// Review screenshots of index.html: node tools/shots.mjs OUTDIR
// Google Fonts requests are answered with the same families from local files, so the shots don't depend on the network.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(path.join(execSync('npm root -g').toString().trim(), 'x'));
const { chromium } = require('playwright');
const out = process.argv[2] || 'review';
fs.mkdirSync(out, { recursive: true });
const F = path.resolve('../efham-ad/public/fonts');
const face = (fam, w, file) => ['arabic', 'latin'].map((s) => `@font-face{font-family:'${fam}';font-weight:${w};font-display:block;src:url(data:font/woff2;base64,${fs.readFileSync(`${F}/${file}-${s}.woff2`).toString('base64')}) format('woff2')}`).join('');
const css = face('Tajawal', '500 700', 'tajawal-700') + face('Tajawal', 800, 'tajawal-800') + face('Cairo', '400 700', 'cairo-var');
const url = 'file://' + path.resolve('index.html');

const browser = await chromium.launch();
for (const [name, vp, scale] of [['mobile', { width: 390, height: 844 }, 2], ['desktop', { width: 1440, height: 900 }, 1]]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: scale });
  await page.route('**/fonts.googleapis.com/**', (r) => r.fulfill({ contentType: 'text/css', body: css }));
  await page.route('**/googletagmanager.com/**', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200); // the opening finishes
  await page.screenshot({ path: `${out}/${name}-hero.png` });
  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });
  // the path half drawn, and the pay bar on phones
  await page.evaluate(() => document.querySelector('#inside').scrollIntoView());
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}-inside.png` });
  // pick another track
  await page.evaluate(() => document.querySelector('#tracks').scrollIntoView());
  await page.click('#tab-3');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${name}-track3.png` });
  // keyboard: focus ring on a tab
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/${name}-keys.png` });
  // a real page, bigger
  await page.evaluate(() => document.querySelector('#inside').scrollIntoView());
  await page.click('.pages .p2');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${name}-zoom.png` });
  await page.keyboard.press('Escape');
  const errs = await page.evaluate(() => [document.querySelectorAll('[role=tab][aria-selected=true]').length, document.querySelector('#track-4').hidden]);
  console.log(name, 'selected tabs', errs[0], 'panel 4 hidden after ArrowDown:', errs[1]);
  await page.close();
}
// reduced motion: everything visible at once, the path fully drawn
const rm = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
await rm.route('**/fonts.googleapis.com/**', (r) => r.fulfill({ contentType: 'text/css', body: css }));
await rm.route('**/googletagmanager.com/**', (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
await rm.goto(url);
await rm.evaluate(() => document.fonts.ready);
await rm.waitForTimeout(300);
await rm.screenshot({ path: `${out}/reduced-hero.png` });
await browser.close();
console.log('shots in', out);
