// CR1 §7: yellow, orange and gold are banned in designed elements. Every colour literal in src/
// is checked: hue 20°–70° with saturation ≥ 0.25 and lightness 0.2–0.85 fails.
import fs from 'node:fs';
const files = fs.readdirSync('src').filter((f) => /\.(ts|tsx)$/.test(f)).map((f) => `src/${f}`);
const bad = [], seen = new Set();
for (const f of files) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/#[0-9a-fA-F]{6}\b/g)) {
    const hex = m[0].toUpperCase();
    if (seen.has(hex)) continue;
    seen.add(hex);
    const [r, g, b] = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d) h = mx === r ? 60 * (((g - b) / d) % 6) : mx === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
    if (h >= 20 && h <= 70 && s >= 0.25 && l >= 0.2 && l <= 0.85) bad.push(`${hex} in ${f} (h=${h.toFixed(0)} s=${s.toFixed(2)})`);
  }
}
console.log(JSON.stringify({ colours: seen.size, banned: bad }));
process.exit(bad.length ? 1 : 0);
