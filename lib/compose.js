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

  // Authored copy: only the rules that are wrong under every reading apply.
  const spelled = spelling.autofix(out, { conservative: true });
  notes.push(...spelled.changes);
  out = spelled.text;

  if (options.numerals) {
    out = numerals.convertNumerals(out, options.numerals, { percent: true }).text;
  }
  // A line with no Arabic in it — a handle, a URL, a brand lockup — is left
  // alone by fixText, which is right for a standalone Latin design and wrong
  // inside an Arabic page: the RTL paragraph swallows it and "@kitabwbs"
  // renders with the sigil thrown to the far edge. Isolate the whole line.
  const directed = bidi.fixText(out).text;
  const isolated = !bidi.hasArabic(out) && bidi.hasLatin(out)
    ? bidi.CONTROLS.LRI + directed + bidi.CONTROLS.PDI
    : directed;

  return { text: isolated, notes };
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
      return `<div class="eyebrow">${esc(block.text)}`
        + (block.sub ? `<div class="eyebrow-sub">${esc(block.sub)}</div>` : '')
        + '</div>';
    case 'title':
      return `<h1>${esc(block.text).replace(/\n/g, '<br>')}</h1>`;
    case 'body':
      // Hard breaks, not measured wrapping. Canva lays the page out in one font
      // and then substitutes its own, so a line that fitted during layout can
      // overflow after substitution — which is exactly what happened to this
      // paragraph. An authored break survives any substitution.
      return `<p>${esc(block.text).replace(/\n/g, '<br>')}</p>`
        + (block.sub ? `<div class="note">${esc(block.sub).replace(/\n/g, '<br>')}</div>` : '');
    case 'cards':
      return `<div class="cards">${block.items.map((item) =>
        `<div class="card"><div class="num">${esc(item.num)}</div>`
        + `<div class="lbl">${esc(item.label)}</div></div>`).join('')}</div>`;
    case 'footer':
      return `<footer><span>${esc(block.start)}</span><span>${esc(block.end)}</span></footer>`;
    case 'topbar':
      return `<div class="topbar">${block.icon || ''}`
        + (block.text ? `<div class="topbar-text">${esc(block.text)}</div>` : '')
        + '</div>';
    case 'list':
      return `<div class="list">${block.items.map((item) =>
        `<div class="item"><div class="badge">${esc(item.num)}</div>`
        + `<div class="item-text"><div class="item-title">${esc(item.title)}</div>`
        + `<div class="item-body">${esc(item.body).replace(/\n/g, '<br>')}</div></div></div>`).join('')}</div>`;
    // Flat rows parted by hairlines — no card, no shadow. A card says "these
    // are separate objects"; a numbered method is one object with steps in it,
    // and the rule between them is the only mark that says so.
    case 'steps':
      return `<div class="steps">${block.items.map((item) =>
        '<div class="step">'
        + `<div class="step-num"${item.color ? ` style="color:${item.color}"` : ''}>${esc(item.num)}</div>`
        + `<div class="step-text"><div class="step-title">${esc(item.title)}</div>`
        + `<div class="step-body">${esc(item.body).replace(/\n/g, '<br>')}</div></div>`
        + (item.icon ? `<div class="step-icon">${item.icon}</div>` : '')
        + '</div>').join('')}</div>`;
    case 'closing':
      return `<div class="closing">${esc(block.text).replace(/\n/g, '<br>')}</div>`;
    case 'question':
      return `<div class="question">${esc(block.text).replace(/\n/g, '<br>')}</div>`;
    case 'brand':
      return `<div class="brand">${esc(block.text)}</div>`;
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
const HEAD_ROLES = new Set(['eyebrow', 'title', 'body']);

function groupHtml(blocks, scale, palette) {
  // Grouped IN PLACE. Hoisting the head to the front drew the title above the
  // top bar, which the measurement caught: head bottom 168, topbar bottom 508.
  const out = [];
  let run = [];
  const flush = () => {
    if (!run.length) return;
    out.push(`<div class="head">${run.map((b) => blockHtml(b, scale, palette)).join('\n')}</div>`);
    run = [];
  };
  for (const block of blocks) {
    if (HEAD_ROLES.has(block.role)) { run.push(block); continue; }
    flush();
    out.push(blockHtml(block, scale, palette));
  }
  flush();
  return out.join('\n');
}

function compose(spec, options = {}) {
  const { width, height } = spec.size;
  const palette = spec.palette;
  const fonts = spec.fonts || { display: 'Tajawal', body: 'Amiri' };

  const notes = [];

  // One page or many. The importer makes a Canva page out of every element
  // carrying data-document-role="page", which is the only honest answer when
  // the copy does not fit one frame: six cards, a closing, a question and a
  // brand line measured 2618px against a 1920px canvas.
  const sets = spec.pages || [{ blocks: spec.blocks, label: spec.title }];
  const prepare = (block) => {
    const copy = (text) => {
      if (text == null) return text;
      const prepared = prepareCopy(text, options);
      notes.push(...prepared.notes);
      return prepared.text;
    };
    if (block.role === 'cards') {
      return { ...block, items: block.items.map((i) => ({ num: copy(i.num), label: copy(i.label) })) };
    }
    if (block.role === 'list' || block.role === 'steps') {
      return { ...block, items: block.items.map((i) => ({ ...i, num: copy(i.num), title: copy(i.title), body: copy(i.body) })) };
    }
    if (block.role === 'eyebrow' || block.role === 'body') {
      return { ...block, text: copy(block.text), sub: copy(block.sub) };
    }
    if (block.role === 'footer') {
      return { ...block, start: copy(block.start), end: copy(block.end) };
    }
    return { ...block, text: copy(block.text) };
  };

  const pageSets = sets.map((set) => ({ ...set, blocks: set.blocks.map(prepare) }));
  const blocks = pageSets.flatMap((set) => set.blocks);

  const allCopy = JSON.stringify(blocks);
  const scale = typeScale(height, allCopy);

  // A design with eight blocks on it cannot use a scale derived from the canvas
  // alone, so explicit sizes win — but the Arabic floor is not negotiable, and
  // a size below it is raised and reported rather than silently obeyed.
  const clamped = [];
  for (const [key, value] of Object.entries(spec.sizes || {})) {
    if (typeof value !== 'number') continue;
    if (key.endsWith('Lead') || key === 'lead') { scale[key] = value; continue; }
    scale[key] = Math.max(typography.MIN_ARABIC_FONT_SIZE, Math.round(value));
    if (scale[key] !== Math.round(value)) clamped.push({ key, asked: value, used: scale[key] });
  }
  const issues = checkPalette(palette, scale);
  for (const c of clamped) {
    issues.push({
      rule: 'size-below-minimum', severity: 'warning', role: c.key,
      message: `${c.key}: طُلب ${c.asked}px ورُفع إلى ${c.used}px — الحد الأدنى للعربية.`,
    });
  }

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

  // 7% of the width unless the brief names a margin. A platform safe area is
  // measured from the canvas edge, so it is stated as the whole margin here and
  // `safeArea` carries only what it adds on top.
  const pad = spec.pad ?? Math.round(width * 0.07);
  const safe = spec.safeArea || {};
  const bar = blocks.find((b) => b.role === 'topbar');
  const flow = spec.flow === 'stack' ? 'flex-start' : 'space-between';

  const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link href="${fontLink([fonts.display, fonts.body])}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
.page{width:${width}px;height:${height}px;position:relative;overflow:hidden;
 padding:${(safe.top || 0) + pad}px ${pad}px ${(safe.bottom || 0) + pad}px;
 display:flex;flex-direction:column;justify-content:${flow};
 font-family:'${fonts.display}',sans-serif;background:${palette.bg};color:${palette.ink}}
/* Only the page that HAS a bar lets it bleed to the edges. The CSS is written
   once for every page, so keying this off "any page has a bar" stripped the
   padding from the frames that do not — their copy sat on the top edge. */
.page.has-bar{padding:0 0 ${(safe.bottom || 0) + pad}px}
.page.has-bar > *:not(.topbar):not(.glow):not(.pat){margin-inline:${pad}px}
.topbar{width:${width}px;height:${bar ? bar.height || Math.round(height * 0.18) : 0}px;
 background:${bar ? bar.bg || palette.ink : 'none'};display:flex;flex-direction:column;
 align-items:center;justify-content:center;gap:${Math.round(pad * 0.3)}px;
 padding-top:${safe.top || 0}px;position:relative;flex:none;
 border-bottom:${bar ? bar.rule || 8 : 0}px solid ${palette.accent}}
.topbar-text{font-size:${scale.eyebrow}px;line-height:${scale.lead};
 color:${(bar && bar.color) || palette.bg};font-weight:700}
.list{position:relative;display:flex;flex-direction:column;gap:${spec.gap ?? 14}px}
.item{background:${palette.card || '#FFFFFF'};border-radius:${spec.radius ?? 20}px;
 padding:${Math.round(pad * 0.42)}px ${Math.round(pad * 0.45)}px;
 box-shadow:0 1px 3px rgba(15,23,42,.08);display:flex;gap:${Math.round(pad * 0.32)}px;
 align-items:flex-start}
.badge{flex:none;width:${spec.badge ?? 48}px;height:${spec.badge ?? 48}px;
 border-radius:${Math.round((spec.badge ?? 48) * 0.3)}px;background:${palette.accent};
 color:${palette.card || '#FFFFFF'};display:flex;align-items:center;justify-content:center;
 font-size:${scale.badge || Math.round((spec.badge ?? 48) * 0.55)}px;font-weight:700;
 line-height:1.2}
.item-text{flex:1;min-width:0}
.item-title{font-size:${scale.itemTitle || scale.body}px;line-height:${scale.lead};
 font-weight:700;color:${palette.accent}}
.item-body{font-size:${scale.itemBody || scale.label}px;line-height:${scale.lead};
 color:${palette.body || palette.ink};margin-top:${Math.round((scale.itemBody || 24) * 0.25)}px}
.steps{position:relative;display:flex;flex-direction:column}
.step{display:flex;align-items:center;gap:${Math.round(pad * 0.3)}px;
 padding:${spec.stepPad ?? Math.round(pad * 0.22)}px 0;
 border-top:1px solid ${spec.divider || `${palette.muted || palette.ink}33`}}
.step:first-child{border-top:0;padding-top:0}
.step-num{flex:none;min-width:${Math.round((scale.stepNum || scale.num) * 1.5)}px;text-align:center;
 font-size:${scale.stepNum || scale.num}px;line-height:${scale.displayLead};font-weight:700;
 color:${palette.accent};font-variant-numeric:tabular-nums}
.step-text{flex:1;min-width:0}
.step-title{font-size:${scale.stepTitle || scale.body}px;line-height:${scale.lead};
 font-weight:700;color:${palette.ink}}
.step-body{font-size:${scale.stepBody || scale.label}px;line-height:${scale.lead};
 color:${palette.body || palette.ink};margin-top:${Math.round((scale.stepBody || 24) * 0.18)}px}
.step-icon{flex:none;display:flex;align-items:center;justify-content:center}
.closing{position:relative;text-align:center;font-size:${scale.closing || scale.body}px;
 line-height:${scale.lead};font-weight:700;color:${palette.closing || palette.accent}${spec.closingFill
    ? `;background:${spec.closingFill};padding:${Math.round(pad * 0.3)}px ${Math.round(pad * 0.25)}px;`
      + `border-radius:${spec.radius ?? 20}px` : ''}}
/* A 10×10 swatch of the page's own background, in the corner. Export the page
   and sample it: any value but this one means the background was re-rendered. */
.check{position:absolute;left:0;bottom:0;width:10px;height:10px;background:${spec.checkSquare}}
.question{position:relative;text-align:center;font-size:${scale.question || scale.body}px;
 line-height:${scale.lead};font-weight:700;color:${palette.ink}}
.brand{position:relative;text-align:${spec.brandAlign || 'center'};font-size:${scale.brand || scale.footer}px;
 line-height:${scale.lead};color:${palette.muted || palette.ink}}
.glow{position:absolute;inset:0;background:${spec.glow || 'none'}}
${patternUrl ? `.pat{position:absolute;inset:0;background-image:url("${patternUrl}");`
    + `background-size:cover;background-repeat:no-repeat;opacity:${spec.pattern.opacity ?? 0.12};`
    + `-webkit-mask-image:radial-gradient(circle at 50% 40%,#000 22%,transparent 80%);`
    + `mask-image:radial-gradient(circle at 50% 40%,#000 22%,transparent 80%)}` : ''}
/* A brand lockup is not part of the headline unit, so it keeps its own edge
   even when the head is centred. */
.eyebrow{position:relative;font-size:${scale.eyebrow}px;line-height:${scale.lead};
 font-weight:700;color:${palette.accent}${spec.eyebrowAlign ? `;text-align:${spec.eyebrowAlign}` : ''}}
.eyebrow-sub{font-size:${scale.eyebrowSub || Math.round(scale.eyebrow * 0.62)}px;
 line-height:${scale.lead};font-weight:400;color:${palette.muted || palette.ink}}
h1{position:relative;font-size:${scale.title}px;line-height:${scale.titleLead};font-weight:700;
 margin-top:${Math.round(scale.eyebrow)}px;color:${palette.ink};
 text-align:${spec.titleAlign || 'start'}}
/* The head reads as one unit, so the title's alignment governs the paragraph
   and the note under it; a centred headline over start-aligned copy reads as
   two decisions rather than one. */
.head{position:relative;text-align:${spec.titleAlign || 'start'}}
.note{position:relative;margin-top:${Math.round((scale.note || scale.label) * 0.7)}px;
 font-size:${scale.note || scale.label}px;line-height:${scale.lead};color:${palette.muted || palette.ink}}
p{margin-top:${Math.round(scale.body * 0.9)}px;position:relative;font-family:'${fonts.body}',serif;font-size:${scale.body}px;
 line-height:${scale.lead};color:${palette.body || palette.ink};max-width:${Math.round(width * 0.56)}px${
  spec.titleAlign === 'center' ? ';margin-inline:auto' : ''}}
.cards{position:relative;display:flex;gap:${Math.round(pad * 0.27)}px}
.card{flex:1;border:1px solid ${palette.accent}55;border-radius:${Math.round(width * 0.019)}px;
 padding:${Math.round(pad * 0.35)}px ${Math.round(pad * 0.3)}px}
.num{font-size:${scale.num}px;line-height:${scale.displayLead};font-weight:700;color:${palette.accent}}
.lbl{font-size:${scale.label}px;line-height:${scale.lead};color:${palette.muted || palette.ink};
 margin-top:${Math.round(scale.label * 0.45)}px}
footer{position:relative;display:flex;justify-content:space-between;
 font-size:${scale.footer}px;line-height:${scale.lead};color:${palette.muted || palette.ink}}
</style></head><body>
${pageSets.map((set) => `<div class="page${set.blocks.some((b) => b.role === 'topbar') ? ' has-bar' : ''}" data-document-role="page" `
    + `data-label="${esc(set.label || spec.title || '')}">`
    + `${spec.glow ? '<div class="glow"></div>' : ''}${patternUrl ? '<div class="pat"></div>' : ''}`
    + `${spec.checkSquare ? '<div class="check"></div>' : ''}`
    + `\n${groupHtml(set.blocks, scale, palette)}\n</div>`).join('\n')}
</body></html>`;

  return { html, assets, scale, issues, notes, pages: pageSets.length };
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
