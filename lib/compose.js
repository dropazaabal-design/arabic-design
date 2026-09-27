'use strict';

/**
 * compose.js — a concept becomes a page Canva's importer can swallow whole.
 *
 * Canva's own drawing operations cannot make a gradient, change a typeface, or
 * draw a pattern. Its HTML importer can do all three, because it renders the
 * page itself and hands back real Canva layers: text comes through as editable
 * text, Google Fonts are matched to Canva's own fonts, and everything else is
 * rasterised in place.
 *
 * So the design is authored as HTML and imported. The rules below are not
 * style preferences — each one is a failure that was measured:
 *
 *   - Fonts are LINKED, never embedded. A page carrying three base64 fonts came
 *     to 845KB and the importer refused it outright: "too much content". Linked
 *     from Google Fonts, Canva matches them to its own Tajawal and Amiri, which
 *     is a better result as well as a smaller one.
 *   - Patterns are ONE image, never a repeating background. A 96px tile came
 *     back as roughly two hundred separate rectangles — an import that succeeds
 *     and leaves a design nobody can work with.
 *   - Large assets are published beside the page and referenced by URL, so the
 *     page itself stays a couple of kilobytes.
 *
 * Nothing here needs a browser. Canva does the rendering.
 */

const { pattern } = require('./patterns');
const bidi = require('./bidi');
const numerals = require('./numerals');
const spelling = require('./spelling');
const typography = require('./typography');
const detect = require('./detect');

/** Canva matched every one of these from a Google Fonts link. */
const FONTS = {
  Tajawal: [400, 700],
  Cairo: [400, 700],
  Almarai: [400, 700],
  Amiri: [400, 700],
  'Reem Kufi': [400, 700],
  Alexandria: [400, 700],
  'Readex Pro': [400, 700],
  'Noto Kufi Arabic': [400, 700],
};

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

/**
 * Put the copy through the checks before it is ever drawn.
 *
 * The bidi controls go into the HTML deliberately. The browser does not need
 * them — `dir="rtl"` is enough — but Canva's text elements have no direction
 * property at all, and the importer copies the characters across verbatim. Put
 * them in here and the imported text is already correct; leave them out and
 * every mixed Arabic/Latin line has to be repaired afterwards.
 */
function prepareCopy(text, options = {}) {
  const notes = [];
  let out = String(text == null ? '' : text);

  const spelled = spelling.autofix(out);
  notes.push(...spelled.changes);
  out = spelled.text;

  if (options.numerals) {
    out = numerals.convertNumerals(out, options.numerals, { percent: true }).text;
  }
  return { text: bidi.fixText(out).text, notes };
}

// ---------------------------------------------------------------------------
// Type scale
// ---------------------------------------------------------------------------

/**
 * A scale derived from the canvas, not from a fixed list, so the same concept
 * holds together on a story and on a poster.
 *
 * Every step respects the Arabic minimums: never below 14px, and line heights
 * of 1.6, or 1.8 where the copy carries harakat.
 */
function typeScale(height, copy = '') {
  const base = Math.max(typography.MIN_ARABIC_FONT_SIZE, Math.round(height / 56));
  const lead = bidi.hasHarakat(copy)
    ? typography.LINE_HEIGHT_HARAKAT
    : typography.LINE_HEIGHT_DEFAULT;

  // The floor is absolute, so it is applied to every step and not only to the
  // base: on a small canvas a ratio below 1 walks a label straight under it.
  const step = (ratio) => Math.max(
    typography.MIN_ARABIC_FONT_SIZE,
    Math.round(base * ratio)
  );

  return {
    eyebrow: step(1.05),
    title: step(5.3),
    body: step(1.65),
    num: step(2.1),
    label: step(0.95),
    footer: step(1),
    lead,
    // Display type carries its leading in the glyph box, so it can be tighter —
    // but never so tight that a damma or a descender is cut, which is what
    // happened when the footer inherited `normal` and came back at 1.17.
    displayLead: 1.22,
    titleLead: 1.18,
  };
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

/** Contrast is checked at compose time; a failing pair never reaches a page. */
function checkPalette(palette, scale) {
  const issues = [];
  const pairs = [
    ['title', palette.ink, scale.title, 700],
    ['body', palette.body || palette.ink, scale.body, 400],
    ['label', palette.muted || palette.ink, scale.label, 400],
    ['accent', palette.accent, scale.num, 700],
  ];
  for (const [role, color, size, weight] of pairs) {
    if (!color) continue;
    const res = detect.checkContrast({ color, background: palette.bg, fontSize: size, fontWeight: weight });
    if (!res.pass) {
      issues.push({
        rule: 'palette-contrast', severity: 'error', role,
        message: `${role}: ${color} على ${palette.bg} = ${res.ratio}:1، دون الحد ${res.required}:1.`,
      });
    } else if (res.advisory) {
      issues.push({ rule: 'palette-contrast-thin', severity: 'warning', role, message: res.advisory });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Compose
// ---------------------------------------------------------------------------

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function fontLink(fonts) {
  const families = [...new Set(fonts.filter((f) => FONTS[f]))]
    .map((f) => `family=${f.replace(/ /g, '+')}:wght@400;700`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

function blockHtml(block, scale, palette) {
  switch (block.role) {
    case 'eyebrow':
      return `<div class="eyebrow">${esc(block.text)}</div>`;
    case 'title':
      return `<h1>${esc(block.text).replace(/\n/g, '<br>')}</h1>`;
    case 'body':
      // Hard breaks, not measured wrapping. Canva lays the page out in one font
      // and then substitutes its own, so a line that fitted during layout can
      // overflow after substitution — which is exactly what happened to this
      // paragraph. An authored break survives any substitution.
      return `<p>${esc(block.text).replace(/\n/g, '<br>')}</p>`;
    case 'cards':
      return `<div class="cards">${block.items.map((item) =>
        `<div class="card"><div class="num">${esc(item.num)}</div>`
        + `<div class="lbl">${esc(item.label)}</div></div>`).join('')}</div>`;
    case 'footer':
      return `<footer><span>${esc(block.start)}</span><span>${esc(block.end)}</span></footer>`;
    default:
      throw new Error(`unknown block role: ${block.role}`);
  }
}

/**
 * @param {object} spec  size, palette, fonts, pattern, blocks — see the skill.
 * @returns {{html, assets, scale, issues, notes}}
 *   assets are published beside the page and referenced by URL, which is what
 *   keeps the page small enough to import.
 */
/**
 * The eyebrow, title and body read as one unit, so they are grouped: with each
 * a direct child of a space-between column the paragraph drifts into the middle
 * of the page, far from the heading it belongs to.
 */
function groupHtml(blocks, scale, palette) {
  const lead = blocks.filter((b) => ['eyebrow', 'title', 'body'].includes(b.role));
  const rest = blocks.filter((b) => !['eyebrow', 'title', 'body'].includes(b.role));
  const head = lead.length
    ? `<div class="head">${lead.map((b) => blockHtml(b, scale, palette)).join('\n')}</div>`
    : '';
  return [head, ...rest.map((b) => blockHtml(b, scale, palette))].filter(Boolean).join('\n');
}

function compose(spec, options = {}) {
  const { width, height } = spec.size;
  const palette = spec.palette;
  const fonts = spec.fonts || { display: 'Tajawal', body: 'Amiri' };

  const notes = [];
  const blocks = spec.blocks.map((block) => {
    const copy = (text) => {
      const prepared = prepareCopy(text, options);
      notes.push(...prepared.notes);
      return prepared.text;
    };
    if (block.role === 'cards') {
      return { ...block, items: block.items.map((i) => ({ num: copy(i.num), label: copy(i.label) })) };
    }
    if (block.role === 'footer') {
      return { ...block, start: copy(block.start), end: copy(block.end) };
    }
    return { ...block, text: copy(block.text) };
  });

  const allCopy = JSON.stringify(blocks);
  const scale = typeScale(height, allCopy);
  const issues = checkPalette(palette, scale);

    // The pattern is inlined, not published beside the page. raw.githubusercontent
  // serves everything as text/plain, which the importer accepts for the PAGE but
  // which stops a browser drawing an SVG at all — the first run came back with
  // no pattern for exactly that reason. A data URI has no content type to get
  // wrong, and the whole page still lands around 40KB.
  const svgPattern = spec.pattern && spec.pattern.kind && spec.pattern.kind !== 'none'
    ? pattern(spec.pattern.kind, width, height, {
      cell: spec.pattern.cell,
      stroke: spec.pattern.stroke || palette.accent,
    })
    : null;
  const patternUrl = svgPattern ? `data:image/svg+xml,${encodeURIComponent(svgPattern)}` : null;
  const assets = [];

  const pad = Math.round(width * 0.07);

  const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link href="${fontLink([fonts.display, fonts.body])}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
.page{width:${width}px;height:${height}px;position:relative;overflow:hidden;
 padding:${pad}px;display:flex;flex-direction:column;justify-content:space-between;
 font-family:'${fonts.display}',sans-serif;background:${palette.bg};color:${palette.ink}}
.glow{position:absolute;inset:0;background:${spec.glow || 'none'}}
${patternUrl ? `.pat{position:absolute;inset:0;background-image:url("${patternUrl}");`
    + `background-size:cover;background-repeat:no-repeat;opacity:${spec.pattern.opacity ?? 0.12};`
    + `-webkit-mask-image:radial-gradient(circle at 50% 40%,#000 22%,transparent 80%);`
    + `mask-image:radial-gradient(circle at 50% 40%,#000 22%,transparent 80%)}` : ''}
.eyebrow{position:relative;font-size:${scale.eyebrow}px;line-height:${scale.lead};
 font-weight:700;color:${palette.accent}}
h1{position:relative;font-size:${scale.title}px;line-height:${scale.titleLead};font-weight:700;
 margin-top:${Math.round(scale.eyebrow)}px;color:${palette.ink}}
.head{position:relative}
p{margin-top:${Math.round(scale.body * 0.9)}px;position:relative;font-family:'${fonts.body}',serif;font-size:${scale.body}px;
 line-height:${scale.lead};color:${palette.body || palette.ink};max-width:${Math.round(width * 0.56)}px}
.cards{position:relative;display:flex;gap:${Math.round(pad * 0.27)}px}
.card{flex:1;border:1px solid ${palette.accent}55;border-radius:${Math.round(width * 0.019)}px;
 padding:${Math.round(pad * 0.35)}px ${Math.round(pad * 0.3)}px}
.num{font-size:${scale.num}px;line-height:${scale.displayLead};font-weight:700;color:${palette.accent}}
.lbl{font-size:${scale.label}px;line-height:${scale.lead};color:${palette.muted || palette.ink};
 margin-top:${Math.round(scale.label * 0.45)}px}
footer{position:relative;display:flex;justify-content:space-between;
 font-size:${scale.footer}px;line-height:${scale.lead};color:${palette.muted || palette.ink}}
</style></head><body>
<div class="page" data-document-role="page" data-label="${esc(spec.title || '')}">
${spec.glow ? '<div class="glow"></div>' : ''}${patternUrl ? '<div class="pat"></div>' : ''}
${groupHtml(blocks, scale, palette)}
</div></body></html>`;

  return { html, assets, scale, issues, notes };
}

// ---------------------------------------------------------------------------
// Import lint
// ---------------------------------------------------------------------------

/** Every rule here is a failure that was measured against the real importer. */
const MAX_PAGE_BYTES = 120 * 1024;

function lintForImport(html) {
  const problems = [];
  const bytes = Buffer.byteLength(html, 'utf8');

  if (bytes > MAX_PAGE_BYTES) {
    problems.push({
      rule: 'page-too-large', severity: 'error', bytes,
      message: `الصفحة ${Math.round(bytes / 1024)}KB. المستورِد رفض صفحة بـ 845KB برسالة `
        + '«محتوى أكثر من اللازم». انشر الأصول الكبيرة بجانب الصفحة وأشر إليها برابط.',
    });
  }
  if (/@font-face|data:font\//.test(html)) {
    problems.push({
      rule: 'embedded-font', severity: 'error',
      message: 'خط مضمَّن. اربطه من Google Fonts — Canva يطابقه بخطّه الحقيقي، والصفحة تبقى صغيرة.',
    });
  }
  if (/background-repeat\s*:\s*repeat|background\s*:[^;]*\brepeat\b/.test(html)) {
    problems.push({
      rule: 'tiled-background', severity: 'error',
      message: 'خلفية متكرّرة. بلاطة 96px عادت من المستورِد نحو مئتي مستطيل منفصل — '
        + 'استعمل صورة واحدة بحجم الصفحة مع background-size:cover.',
    });
  }
  const pages = (html.match(/data-document-role="page"/g) || []).length;
  if (pages === 0) {
    problems.push({
      rule: 'no-page-role', severity: 'error',
      message: 'لا يوجد data-document-role="page" — لن يعرف المستورِد أين تبدأ الصفحة.',
    });
  }
  if (!/dir="rtl"/.test(html)) {
    problems.push({ rule: 'no-rtl', severity: 'warning', message: 'الصفحة بلا dir="rtl".' });
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Publishing target
// ---------------------------------------------------------------------------

/**
 * Where the page goes so Canva can fetch it.
 *
 * The importer only takes a public HTTPS URL, and raw.githubusercontent serves
 * one directly — it hands back text/plain and the importer accepts that, so no
 * proxy and no third-party file host sits in the path. The content stays on
 * the account the user already has.
 *
 * The path carries a content hash, which makes every publish a fresh URL and
 * sidesteps CDN caching entirely.
 */
const PUBLISH_DIR = 'p';

function contentHash(text) {
  // FNV-1a: short, dependency-free, and only needs to avoid collisions here.
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(7, '0');
}

function publishTarget({ owner, repo, branch = 'main', html, assets = [] }) {
  const stamp = contentHash(html + assets.map((a) => a.content).join(''));
  const dir = `${PUBLISH_DIR}/${stamp}`;
  const raw = (path) => `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

  return {
    dir,
    page: { path: `${dir}/index.html`, url: raw(`${dir}/index.html`) },
    assets: assets.map((a) => ({ ...a, path: `${dir}/${a.name}`, url: raw(`${dir}/${a.name}`) })),
  };
}

module.exports = {
  FONTS,
  MAX_PAGE_BYTES,
  prepareCopy,
  typeScale,
  checkPalette,
  compose,
  lintForImport,
  publishTarget,
  contentHash,
};
