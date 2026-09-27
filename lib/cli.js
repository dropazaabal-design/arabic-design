#!/usr/bin/env node
'use strict';

/**
 * cli.js — the bridge between a skill and the tested library.
 *
 * A skill must not re-derive BiDi rules in prose. It reads a design with Canva's
 * `read-design`, reshapes it into the input below, pipes it through here, and
 * gets back exactly two things: a batch of Canva operations that are safe to
 * send, and a list of findings only a human can act on.
 *
 *   node lib/cli.js [design.json] [--numerals=arabic-indic] [--no-spelling]
 *
 * Input:
 *   {
 *     "pages": [{
 *       "index": 1, "width": 1080, "height": 1080, "is_responsive": false,
 *       "elements": [{
 *         "locator_id": "PB1-LB2", "type": "text", "text": "...",
 *         "left": 0, "top": 0, "width": 400, "height": 90, "alt_text": "",
 *         "style": { "font_family": "Cairo", "font_size": 24, "line_height": 1.2,
 *                    "font_style": "normal", "font_weight": 400,
 *                    "letter_spacing": 0, "text_transform": null,
 *                    "color": "#111111", "background": "#FFFFFF" }
 *       }]
 *     }]
 *   }
 *
 * Every field is optional. Unknown values become findings, never guesses.
 */

const fs = require('fs');
const bidi = require('./bidi');
const numerals = require('./numerals');
const typography = require('./typography');
const detect = require('./detect');
const spelling = require('./spelling');

/** Operations a responsive page will accept. Everything else is refused. */
const RESPONSIVE_OPS = new Set([
  'update_title', 'replace_text', 'update_fill', 'delete_element', 'find_and_replace_text',
]);

function analyze(design, options = {}) {
  const opts = { numerals: null, spelling: true, ...options };
  const pages = design.pages || [];

  const auto = [];
  const preview = [];
  const manual = [];
  const blocked = [];
  const designLevel = [];
  const mirror = { candidates: [], readingOrder: [] };

  const allTexts = [];
  const allTextElements = [];
  let backgroundMissing = false;

  for (const page of pages) {
    const elements = page.elements || [];
    const textElements = elements.filter((e) => typeof e.text === 'string' && e.text !== '');
    const responsive = page.is_responsive === true;

    for (const element of textElements) {
      allTexts.push(element.text);
      allTextElements.push({ ...element, page: page.index });

      const style = element.style || {};
      const where = { page: page.index, locator_id: element.locator_id, sample: element.text.slice(0, 40) };

      for (const failure of detect.findGlyphFailures(element.text)) {
        manual.push({ ...failure, ...where });
      }

      if (!bidi.hasArabic(element.text)) continue;

      // ---- text chain: spelling -> numerals -> tatweel -> bidi. bidi is last,
      //      always, because its control characters must wrap the final string.
      let text = element.text;
      const reasons = [];

      if (opts.spelling) {
        const fixed = spelling.autofix(text);
        if (fixed.changed) reasons.push(`إملاء: ${fixed.changes.map((c) => c.rule).join('، ')}`);
        for (const f of fixed.changes) {
          if (f.severity === 'info') manual.push({ ...f, ...where });
        }
        text = fixed.text;
      }

      if (opts.numerals) {
        const converted = numerals.convertNumerals(text, opts.numerals, { percent: opts.numerals !== 'western' });
        if (converted.changed) reasons.push(`توحيد الأرقام إلى ${opts.numerals}`);
        text = converted.text;
      }

      const detatweeled = typography.stripTatweel(text);
      if (detatweeled.changed) reasons.push(`حذف ${detatweeled.removed} محرف تمطيط`);
      text = detatweeled.text;

      const directed = bidi.fixText(text);
      if (directed.changed) reasons.push(directed.changes.map((c) => c.rule).join('، '));
      text = directed.text;

      for (const issue of bidi.findBracketIssues(element.text)) {
        manual.push({
          rule: 'brackets-unbalanced', severity: 'warning', ...where,
          message: `أقواس غير متوازنة ${issue.pair}: ${issue.opened} فتح مقابل ${issue.closed} إغلاق.`,
        });
      }

      if (text !== element.text) {
        // On a responsive page replace_text is reserved for empty elements —
        // find_and_replace_text is the operation that actually lands.
        const op = responsive
          ? { type: 'find_and_replace_text', locator_id: element.locator_id, find_text: element.text, replace_text: text }
          : { type: 'replace_text', locator_id: element.locator_id, text };
        auto.push({ page: page.index, reason: reasons.filter(Boolean).join(' · '), op });
        preview.push({
          page: page.index,
          locator_id: element.locator_id,
          before: element.text,
          after: text,
          afterEscaped: bidi.escapeControls(text),
        });
      }

      // ---- style
      const typo = typography.checkElement({ ...element, page: page.index });
      for (const f of typo.manual) manual.push({ ...f, page: page.index });
      for (const op of typo.auto) {
        if (responsive) {
          blocked.push({
            page: page.index, locator_id: element.locator_id, op,
            reason: 'صفحة responsive — لا تقبل format_text. عدّل هذا يدويًا في Canva.',
          });
        } else {
          auto.push({ page: page.index, reason: 'تنضيد', op });
        }
      }

      // ---- font
      if (style.font_family) {
        const font = detect.checkFont(style.font_family);
        if (font.arabicCapable !== true) {
          manual.push({
            rule: font.arabicCapable === false ? 'font-no-arabic' : 'font-unverified',
            severity: font.arabicCapable === false ? 'error' : 'warning',
            ...where,
            font: style.font_family,
            suggestions: font.suggestions,
            weightMap: typeof style.font_weight === 'number'
              ? font.suggestions.map((f) => `${f}: ${detect.mapWeight(f, style.font_weight)}`)
              : undefined,
            message: `${font.note} البديل المقترح: ${font.suggestions.join('، ')}. تغيير نوع الخط غير ممكن عبر الواجهة — بدّله يدويًا.`,
          });
        }
      } else {
        manual.push({
          rule: 'font-unknown', severity: 'info', ...where,
          message: 'القراءة لم تُرجع اسم الخط. تحقّق بصريًا من دعم العربية.',
        });
      }

      // ---- contrast
      if (style.color && style.background) {
        const contrast = detect.checkContrast({
          color: style.color, background: style.background,
          fontSize: style.font_size, fontWeight: style.font_weight,
        });
        if (!contrast.pass) {
          manual.push({
            rule: 'contrast', severity: 'error', ...where,
            message: `التباين ${contrast.ratio}:1 دون الحد ${contrast.required}:1.`,
          });
        } else if (contrast.advisory) {
          manual.push({ rule: 'contrast-thin', severity: 'warning', ...where, message: contrast.advisory });
        }
      } else if (style.color) {
        backgroundMissing = true;
      }

      // ---- box fit, measured on the NEW text
      if (typeof element.width === 'number' && typeof element.height === 'number' && style.font_size) {
        const fit = detect.estimateOverflow({
          text, fontSize: style.font_size, width: element.width, height: element.height,
          lineHeight: style.line_height || typography.LINE_HEIGHT_DEFAULT,
        });
        if (fit.overflows) {
          const smaller = detect.refitFontSize({
            text, fontSize: style.font_size, width: element.width, height: element.height,
            lineHeight: style.line_height || typography.LINE_HEIGHT_DEFAULT,
          });
          const remedy = smaller
            ? { type: 'format_text', locator_id: element.locator_id, formatting: { font_size: smaller } }
            : { type: 'resize_element', locator_id: element.locator_id, width: Math.ceil(fit.widestWord + 8) };
          if (responsive) {
            blocked.push({ page: page.index, locator_id: element.locator_id, op: remedy, reason: 'صفحة responsive — لا تقبل إعادة القياس.' });
          } else {
            auto.push({
              page: page.index,
              reason: `فيض مقدَّر: ${fit.lines} أسطر × ${fit.neededHeight}px داخل صندوق ${element.height}px (تقدير، أكّده بالمعاينة)`,
              op: remedy,
            });
          }
        }
      }
    }

    // ---- mirroring
    for (const element of elements) {
      if (typeof element.text === 'string' && element.text !== '') continue;
      const verdict = detect.shouldMirror(element);
      if (verdict === false) continue;
      mirror.candidates.push({
        page: page.index,
        locator_id: element.locator_id,
        alt_text: element.alt_text || element.name || '',
        verdict: verdict === true ? 'mirror' : 'ask',
        suggestion: typeof element.left === 'number' && typeof element.width === 'number' && page.width
          ? { type: 'position_element', locator_id: element.locator_id, top: element.top, ...detect.mirrorX(element, page.width) }
          : null,
      });
    }
    mirror.readingOrder.push(
      ...detect.checkReadingOrder(textElements).map((i) => ({ ...i, page: page.index }))
    );
  }

  // ---- design-level
  designLevel.push(...numerals.censusDesign(allTexts));
  designLevel.push(...numerals.checkDates(allTexts));
  designLevel.push(...detect.fontCensus(allTextElements.map((e) => (e.style || {}))));
  designLevel.push(...spelling.checkRegister(allTexts));
  if (backgroundMissing) {
    designLevel.push({
      rule: 'contrast-unverified', severity: 'warning',
      message: 'لون الخلفية غير معروف لبعض العناصر — تحقّق من التباين بصريًا على المعاينة.',
    });
  }

  const census = numerals.censusNumerals(allTexts.join('\n'));

  return {
    summary: {
      pages: pages.length,
      textElements: allTextElements.length,
      arabicElements: allTextElements.filter((e) => bidi.hasArabic(e.text)).length,
      autoOps: auto.length,
      manualFindings: manual.length + designLevel.length,
      blockedByResponsive: blocked.length,
    },
    numerals: census,
    design: designLevel,
    auto,
    preview,
    manual,
    blocked,
    mirror,
  };
}

/** Group operations by page — edit-design takes one page_index per call. */
function batchByPage(auto) {
  const byPage = new Map();
  for (const entry of auto) {
    if (!byPage.has(entry.page)) byPage.set(entry.page, []);
    byPage.get(entry.page).push(entry.op);
  }
  return [...byPage.entries()].map(([page_index, operations]) => ({ page_index, operations }));
}

function main(argv) {
  const args = argv.slice(2);
  const flags = args.filter((a) => a.startsWith('--'));
  const file = args.find((a) => !a.startsWith('--'));

  const numeralFlag = flags.find((f) => f.startsWith('--numerals='));
  const options = {
    numerals: numeralFlag ? numeralFlag.split('=')[1] : null,
    spelling: !flags.includes('--no-spelling'),
  };
  if (options.numerals && !numerals.SYSTEMS[options.numerals]) {
    process.stderr.write(`unknown numeral system: ${options.numerals}\n`);
    process.exit(2);
  }

  const raw = file ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
  const result = analyze(JSON.parse(raw), options);
  result.batches = batchByPage(result.auto);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) main(process.argv);

module.exports = { analyze, batchByPage, RESPONSIVE_OPS };
