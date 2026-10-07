#!/usr/bin/env node
'use strict';

/**
 * cli.js — the bridge between a skill and the tested library.
 *
 * Two commands, because fitting text to a box is a measurement, not a guess:
 *
 *   plan    payload.json    text + style operations only
 *   reflow  measured.json   overlap and container-escape, on real geometry
 *
 * Canva grows text boxes by itself. Send the text and style edits with
 * finalize: "keep_open", and the edit-design response hands back the document
 * with the heights that actually resulted. `reflow` reads those. Nothing here
 * predicts a layout — the estimator that used to live in this flow fired on 14
 * of 14 elements in a real design and would have shrunk every one of them.
 *
 * Input for both is the same normalised shape; `lib/from-read.js` produces it
 * from a read-design or edit-design response.
 *
 *   {
 *     "pages": [{
 *       "index": 1, "width": 1080, "height": 1350,
 *       "is_responsive": false, "is_editable": true,
 *       "elements": [{
 *         "locator_id": "PB1-LB2", "type": "text", "text": "...",
 *         "left": 0, "top": 0, "width": 400, "height": 128.17, "alt_text": "",
 *         "style": { "font_family": "Cairo", "font_size": 24, "line_height": 1.2,
 *                    "font_style": "normal", "font_weight": 400, "text_align": "start",
 *                    "letter_spacing": 0, "color": "#111", "background": "#FFF" }
 *       }]
 *     }]
 *   }
 */

const fs = require('fs');
const bidi = require('./bidi');
const numerals = require('./numerals');
const typography = require('./typography');
const detect = require('./detect');
const spelling = require('./spelling');
const composer = require('./compose');
const recipes = require('./recipes');
const speech = require('./speech');
const video = require('./video');
const copy = require('./copy');
const { parseOutline, withBreaks } = require('./outline');
const verbatim = require('./verbatim');

/** Operations a responsive page will accept. Everything else is refused. */
const hasRect = (e) => ['left', 'top', 'width', 'height']
  .every((k) => typeof e[k] === 'number' && Number.isFinite(e[k]));

const RESPONSIVE_OPS = new Set([
  'update_title', 'replace_text', 'update_fill', 'delete_element', 'find_and_replace_text',
]);

/** A finding firing on more than this share of elements is describing the design. */
const FOLD_RATIO = 0.6;
const FOLD_MIN = 3;

// ---------------------------------------------------------------------------
// Pass 1 — text and style
// ---------------------------------------------------------------------------

/** How many times `word` occurs in `text`. */
const occurrences = (text, word) => (word ? text.split(word).length - 1 : 0);

/**
 * Canva keeps a box's direction and its styles through find_and_replace_text,
 * and resets both through replace_text: an identical rewrite turned a
 * right-to-left paragraph left-to-right, and a two-colour title came back in
 * one colour (both measured 2026-09-29). So a change is sent as the words that
 * differ, each replaced where it stands — or null when that cannot be said
 * word for word, or a changed word is not unique in the box.
 */
function wordEdits(before, after) {
  const from = before.trim().split(/\s+/);
  const to = after.trim().split(/\s+/);
  if (from.length !== to.length) return null;
  const edits = [];
  for (let i = 0; i < from.length; i++) {
    if (from[i] === to[i]) continue;
    if (occurrences(before, from[i]) !== 1) return null;
    edits.push({ find: from[i], replace: to[i] });
  }
  return edits.length ? edits : null;
}

function plan(design, options = {}) {
  const opts = { numerals: null, spelling: true, align: null, expect: null, ...options };
  const pages = design.pages || [];

  // The lines the brief asked Canva to draw, when given: a word the generator
  // changed is put back from the creator's own text before anything else runs.
  const drift = opts.expect
    ? verbatim.compare(opts.expect, pages.flatMap((p) => p.elements || []))
    : { restore: [], missing: [] };

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
    const locked = page.is_editable === false;

    /** Route one operation to `auto`, or to `blocked` when the page refuses it. */
    const queue = (reason, op, locator_id) => {
      const refusal = locked
        ? 'الصفحة غير قابلة للتحرير (is_editable: false) — لن تُطبَّق أي عملية عليها.'
        : responsive && !RESPONSIVE_OPS.has(op.type)
          ? `صفحة responsive — لا تقبل ${op.type}. عدّل هذا يدويًا في Canva.`
          : null;
      if (refusal) blocked.push({ page: page.index, locator_id, op, reason: refusal });
      else auto.push({ page: page.index, reason, op });
    };

    for (const element of textElements) {
      allTexts.push(element.text);
      allTextElements.push({ ...element, page: page.index });

      const style = element.style || {};
      const where = { page: page.index, locator_id: element.locator_id, sample: element.text.slice(0, 40) };

      for (const failure of detect.findGlyphFailures(element.text)) {
        manual.push({ ...failure, ...where });
      }

      // A card holding nothing but "3" has no Arabic letters, so the old gate
      // skipped it — and a design whose other digits were being unified ended up
      // mixing systems, exactly the fault censusDesign then reported and nothing
      // could fix. Digits earn an element a place in the chain on their own.
      const arabic = bidi.hasArabic(element.text);
      const convertible = opts.numerals && numerals.ANY_DIGIT_RE.test(element.text);
      const restores = drift.restore.filter((r) => r.locator_id === element.locator_id);
      // A handle stored the way it is seen — Canva's generator writes them so.
      const flipped = !restores.length && bidi.stripBidiControls(element.text).match(bidi.VISUAL_HANDLE_RE);
      if (flipped) {
        const seen = flipped[0].trim();
        const logical = `${seen.slice(-1)}${seen.slice(0, -1)}`;
        manual.push({
          rule: 'visual-order-handle', severity: 'warning', ...where, found: seen,
          suggestion: { type: 'find_and_replace_text', locator_id: element.locator_id, find_text: seen, replace_text: `\u200e${logical}` },
          message: `«${seen}» مخزّن بالترتيب الذي يُرى به، فيُقرأ صحيحًا في صندوق ويُقلب في غيره. صيغته المنطقية «${logical}»؛ `
            + 'العملية جاهزة وتثبّته بعلامة LRM في أي صندوق. طبّقها بعد النظر في المصغّرة.',
        });
      }

      // A Latin line is anchored too — see bidi.anchorLatinLine.
      if (!arabic && !convertible && !restores.length && !bidi.hasLatin(element.text)) continue;

      // ---- text chain: the creator's words -> spelling -> numerals -> tatweel
      //      -> bidi. bidi is last, always, because its control characters must
      //      wrap the final string.
      let text = element.text;
      const reasons = [];

      for (const r of restores) {
        if (occurrences(text, r.find) === 1) {
          text = text.replace(r.find, r.replace);
          reasons.push(`نصّ صاحبه: «${r.find}» ← «${r.replace}»`);
        } else {
          manual.push({
            rule: 'copy-drift', severity: 'warning', ...where, found: r.find, suggestion: r.replace,
            message: `«${r.find}» مكرّرة في هذا العنصر، فلم تُعَد آليًا. صاحب النص كتبها «${r.replace}».`,
          });
        }
      }

      if (opts.spelling && arabic) {
        const fixed = spelling.autofix(text);
        if (fixed.changed) reasons.push(`إملاء: ${[...new Set(fixed.changes.map((c) => c.rule))].join('، ')}`);
        for (const f of fixed.changes) {
          if (f.severity === 'info' || f.reportOnly) manual.push({ ...f, ...where });
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

      const anchored = bidi.anchorText(text);
      if (anchored.changed) reasons.push([...new Set(anchored.changes.map((c) => c.rule))].join('، '));
      text = anchored.text;

      for (const issue of bidi.findBracketIssues(element.text)) {
        manual.push({
          rule: 'brackets-unbalanced', severity: 'warning', ...where,
          message: `أقواس غير متوازنة ${issue.pair}: ${issue.opened} فتح مقابل ${issue.closed} إغلاق.`,
        });
      }

      let rewritten = false;
      if (text !== element.text) {
        const reason = reasons.filter(Boolean).join(' · ');
        const edits = wordEdits(element.text, text);
        const show = () => preview.push({
          page: page.index, locator_id: element.locator_id,
          before: element.text, after: text, afterEscaped: bidi.escapeControls(text),
        });
        if (edits) {
          for (const edit of edits) {
            queue(reason, {
              type: 'find_and_replace_text', locator_id: element.locator_id,
              find_text: edit.find, replace_text: edit.replace,
            }, element.locator_id);
          }
          show();
        } else if (element.style_runs > 1) {
          manual.push({
            rule: 'multi-style-edit', severity: 'warning', ...where,
            before: element.text, after: bidi.stripBidiControls(text),
            message: 'التصحيح لا يُقسَم كلمةً بكلمة، واستبدال النص كاملًا يوحّد تنسيقاته (مقيس). طبّقه يدويًا في Canva.',
          });
        } else if (responsive) {
          queue(reason, {
            type: 'find_and_replace_text', locator_id: element.locator_id, find_text: element.text, replace_text: text,
          }, element.locator_id);
          show();
        } else {
          queue(reason, { type: 'replace_text', locator_id: element.locator_id, text }, element.locator_id);
          // A whole rewrite leaves the box left-to-right (measured), where `end`
          // is the right edge. A centred box stays centred.
          if (style.text_align !== 'center' && arabic) {
            queue('إعادة الكتابة تقلب الصندوق يساريّ الاتجاه (مقيس) — end يعيده إلى اليمين', {
              type: 'format_text', locator_id: element.locator_id, formatting: { text_align: 'end' },
            }, element.locator_id);
            rewritten = true;
          }
          show();
        }
      }

      if (!arabic) continue;   // a bare numeral needs no typography, font or contrast pass

      // ---- style
      const typo = typography.checkElement({ ...element, page: page.index }, { align: rewritten ? false : opts.align });
      for (const f of typo.manual) manual.push({ ...f, page: page.index });
      for (const op of typo.auto) queue('تنضيد', op, element.locator_id);

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
    for (const orphan of detect.findLatinOrphans(textElements)) {
      manual.push({ ...orphan, page: page.index });
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
  designLevel.push(spelling.PROOFREADING_NOTE);
  for (const m of drift.missing) {
    designLevel.push({
      rule: 'copy-missing', severity: 'warning', scope: 'design', word: m.word, line: m.line,
      candidates: m.candidates, suggestion: m.suggestion,
      message: `«${m.word}» من سطرك «${m.line}» غائبة عن التصميم`
        + (m.candidates ? ` (أقرب ما فيه: ${m.candidates.join('، ')}).` : '.')
        + (m.suggestion
          ? ` العملية جاهزة في suggestion: تضعها بجوار «${m.suggestion.find_text}» — طبّقها بعد النظر، فقد يضيق السطر.`
          : ' أعدها يدويًا: موضعها قرار تخطيط.'),
    });
  }
  if (backgroundMissing) {
    designLevel.push({
      rule: 'contrast-unverified', severity: 'warning',
      message: 'لون الخلفية غير معروف لبعض العناصر — تحقّق من التباين بصريًا على المعاينة.',
    });
  }

  const arabicCount = allTextElements.filter((e) => bidi.hasArabic(e.text)).length;
  const folded = foldNoise(manual, arabicCount);
  designLevel.push(...folded.design);

  return {
    summary: {
      pages: pages.length,
      textElements: allTextElements.length,
      arabicElements: arabicCount,
      autoOps: auto.length,
      manualFindings: folded.manual.length + designLevel.length,
      blockedByResponsive: blocked.length,
    },
    numerals: numerals.censusNumerals(allTexts.join('\n')),
    design: designLevel,
    auto,
    batches: batchByPage(auto),
    preview,
    manual: folded.manual,
    blocked,
    mirror,
    next: 'أرسل batches بـ finalize: "keep_open"، ثم مرّر استجابة edit-design على `from-read` ثم `reflow`.',
  };
}

/**
 * A finding that fires on nearly everything is a property of the design, not of
 * any one element. Fourteen identical "font-unknown" lines told the reader
 * nothing; one line saying "all 14 elements" tells them the whole story.
 */
function foldNoise(manual, total) {
  if (total < FOLD_MIN) return { manual, design: [] };

  const counts = new Map();
  for (const f of manual) counts.set(f.rule, (counts.get(f.rule) || 0) + 1);

  const foldable = new Set(
    [...counts.entries()]
      .filter(([, n]) => n >= FOLD_MIN && n / total > FOLD_RATIO)
      .map(([rule]) => rule)
  );
  if (foldable.size === 0) return { manual, design: [] };

  const design = [...foldable].map((rule) => {
    const hits = manual.filter((f) => f.rule === rule);
    return {
      rule,
      severity: hits[0].severity,
      scope: 'design',
      count: hits.length,
      of: total,
      elements: hits.map((f) => f.locator_id).filter(Boolean),
      message: `${hits[0].message} — على ${hits.length} من ${total} عنصرًا، أي التصميم كلّه. `
        + 'طُويت إلى ملاحظة واحدة؛ عالجها مرة على مستوى التصميم.',
    };
  });

  return { manual: manual.filter((f) => !foldable.has(f.rule)), design };
}

// ---------------------------------------------------------------------------
// Pass 2 — measured geometry
// ---------------------------------------------------------------------------

/** Arabic must not shrink below this, whatever the box says. */
const MIN_SIZE = typography.MIN_ARABIC_FONT_SIZE;

/**
 * The text box narrowed to stop short of a badge at one end of it, or null when
 * the covering shape is not that. An array when the box must also move.
 */
function clearOf(text, veil, gap = 12) {
  if (!text || !veil || !(veil.width < text.width * 0.3)) return null;
  const round = (n) => Math.round(n * 100) / 100;
  const middle = text.left + text.width / 2;
  if (veil.left >= middle) {
    const width = round(veil.left - gap - text.left);
    return width > 0 ? { type: 'resize_element', locator_id: text.locator_id, width } : null;
  }
  if (veil.left + veil.width <= middle) {
    const left = round(veil.left + veil.width + gap);
    const width = round(text.left + text.width - left);
    return width > 0
      ? [{ type: 'position_element', locator_id: text.locator_id, top: text.top, left },
        { type: 'resize_element', locator_id: text.locator_id, width }]
      : null;
  }
  return null;
}

function reflow(measured, options = {}) {
  const opts = { ...options };
  const pages = measured.pages || [];
  const findings = [];
  const auto = [];

  for (const page of pages) {
    const elements = page.elements || [];
    const byId = new Map(elements.map((e) => [e.locator_id, e]));
    const locked = page.is_editable === false || page.is_responsive === true;

    const escapes = detect.findEscapes(elements);
    // A text crossing its own container is one problem, not two: the escape
    // already names it, with the amount and a remedy. Reporting the same pair
    // again as a bare overlap is the noise this version exists to cut.
    const escapePairs = new Set(escapes.map((e) => [e.locator_id, e.container].sort().join('|')));

    // Overlaps are reported with a suggestion but never queued: moving one
    // element out of another's way can push it into a third, and there is no
    // third pass to catch that. The human decides from the measured numbers.
    for (const issue of detect.findOverlaps(elements)) {
      if (escapePairs.has([...issue.elements].sort().join('|'))) continue;
      const [a, b] = issue.elements.map((id) => byId.get(id));
      const lower = a.top >= b.top ? a : b;
      const upper = lower === a ? b : a;
      const push = Math.round((upper.top + upper.height - lower.top) * 100) / 100;
      findings.push({
        ...issue,
        page: page.index,
        // A veil is a layering fault, so the remedy is layering — shrinking the
        // type would only make the hidden line smaller. Unless the veil is a
        // small shape at one end of the line: a number badge is part of the
        // design, and the text box merely runs under it. Brought to the front,
        // the words would print over the badge; the box has to stop short.
        suggestion: issue.kind === 'occlusion'
          ? clearOf(byId.get(issue.occludedText), byId.get(issue.veil))
            || { type: 'layer_element', locator_id: issue.occludedText, position: 'front' }
          : push > 0
            ? { type: 'position_element', locator_id: lower.locator_id, left: lower.left, top: Math.round((lower.top + push) * 100) / 100 }
            : null,
        note: 'لم تُدرَج تلقائيًا: إزاحة عنصر أو تغيير طبقته قد يكشف عنصرًا ثالثًا. قرّر من الأرقام المقيسة.',
      });
    }

    if (elements.some((e) => hasRect(e)) && elements.some((e) => typeof e.z !== 'number')) {
      findings.push({
        rule: 'layer-order-unknown', severity: 'info', page: page.index,
        message: 'ترتيب الطبقات غير معروف لبعض العناصر، فكل تقاطع مع شكل يُبلَّغ عنه. '
          + 'مرّر الاستجابة على from-read ليُشتقّ z من ترتيب الرسم.',
      });
    }

    for (const issue of escapes) {
      findings.push({ ...issue, page: page.index });
      if (locked) continue;

      const text = byId.get(issue.locator_id);
      const container = byId.get(issue.container);
      const op = escapeRemedy(text, container, issue.past);
      if (op) auto.push({ page: page.index, reason: issue.message, op });
    }
  }

  return {
    summary: {
      pages: pages.length,
      overlaps: findings.filter((f) => f.rule === 'overlap').length,
      escapes: findings.filter((f) => f.rule === 'container-escape').length,
      autoOps: auto.length,
    },
    findings,
    auto,
    batches: batchByPage(auto),
  };
}

/**
 * One operation that puts an escaped text back inside its container, derived
 * from the measured rectangles alone.
 *
 * Horizontal escape means the box is simply too wide — narrow it. Vertical
 * escape means the text reflowed taller than the container; slide it up if the
 * slack above is enough, otherwise scale the point size by exactly the ratio
 * the measurement gives, never below the Arabic minimum.
 */
function escapeRemedy(text, container, past) {
  if (!text || !container) return null;

  if (past.left > 0 || past.right > 0) {
    const width = Math.floor(container.width - Math.max(0, text.left - container.left) * 2);
    if (width > 0) return { type: 'resize_element', locator_id: text.locator_id, width };
  }

  if (past.bottom > 0) {
    const slack = text.top - container.top;
    if (slack >= past.bottom) {
      return {
        type: 'position_element',
        locator_id: text.locator_id,
        left: text.left,
        top: Math.round((text.top - past.bottom) * 100) / 100,
      };
    }
    const size = text.style && text.style.font_size;
    if (typeof size === 'number') {
      const available = container.height - slack;
      const scaled = Math.floor(size * (available / text.height));
      if (scaled >= MIN_SIZE && scaled < size) {
        return { type: 'format_text', locator_id: text.locator_id, formatting: { font_size: scaled } };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------

/** Group operations by page — edit-design takes one page_index per call. */
function batchByPage(auto) {
  const byPage = new Map();
  for (const entry of auto) {
    if (!byPage.has(entry.page)) byPage.set(entry.page, []);
    byPage.get(entry.page).push(entry.op);
  }
  return [...byPage.entries()].map(([page_index, operations]) => ({ page_index, operations }));
}

// ---------------------------------------------------------------------------
// make — an outline becomes a page that is ready to publish
// ---------------------------------------------------------------------------

/**
 * Say what is wrong with an outline in words, before anything is composed.
 * A missing `items` on a list layout otherwise surfaces as a stack trace.
 */
function checkOutline(outline, layout) {
  const problems = [];
  if (!outline || typeof outline !== 'object') return ['المخطّط ليس كائنًا.'];
  if (!outline.title) problems.push('ينقص `title` — العنوان.');

  const needsItems = layout === 'list' || layout === undefined;
  if (needsItems && !Array.isArray(outline.items)) {
    problems.push('ينقص `items` — مصفوفة النقاط، كل نقطة {title, body}.');
  }
  for (const [i, item] of (outline.items || []).entries()) {
    if (!item.title) problems.push(`النقطة ${i + 1}: ينقص \`title\`.`);
  }
  if (outline.iconName && !ICON_NAMES.includes(outline.iconName)) {
    problems.push(`أيقونة غير معروفة «${outline.iconName}». المتاح: ${ICON_NAMES.join('، ')}.`);
  }
  for (const [key, table] of [['palette', recipes.PALETTES], ['pairing', recipes.PAIRINGS], ['format', recipes.FORMATS]]) {
    if (outline[key] && !table[outline[key]]) {
      problems.push(`${key} غير معروف «${outline[key]}». المتاح: ${Object.keys(table).join('، ')}.`);
    }
  }
  return problems;
}

const ICON_NAMES = Object.keys(require('./patterns').ICONS);

/**
 * outline + a choice of look -> the finished page and where it goes.
 *
 * One call replaces hand-writing a spec: the recipe library picks the blocks,
 * the composer runs the copy through the checks, the lint holds it to what the
 * importer accepts, and the publish target names the URL Canva will fetch.
 */
function make(outline, choice = {}, options = {}) {
  const layout = choice.layout || (outline.items ? 'list' : 'cover');
  const problems = checkOutline(outline, choice.reel ? 'list' : layout);
  if (problems.length) return { ok: false, problems };

  const spec = choice.reel
    ? recipes.reel(choice, outline, { perPage: choice.perPage || 3 })
    : recipes.recipe({ ...choice, layout }, outline);

  const built = composer.compose(spec, options);
  const lint = composer.lintForImport(built.html);

  const target = choice.repo
    ? composer.publishTarget({
      owner: choice.repo.split('/')[0],
      repo: choice.repo.split('/')[1],
      branch: choice.branch || 'main',
      html: built.html,
    })
    : null;

  // The caption is assembled from the same outline the design came from, so
  // the two can never say different things. Then everything the reader will
  // see — frames and caption — goes through the same copy checks.
  const draft = copy.caption(outline);
  const frames = [outline.title, outline.lead, outline.closing, outline.question,
    ...(outline.items || []).flatMap((i) => [i.title, i.body])].filter(Boolean).join('\n');
  const frameCopy = copy.lintCopy(frames, { surface: 'frame' });
  const captionCopy = copy.lintCopy(draft, { surface: 'caption' });
  const bait = [...frameCopy.bait, ...captionCopy.bait];

  return {
    ok: lint.length === 0 && !built.issues.some((i) => i.severity === 'error') && bait.length === 0,
    html: built.html,
    bytes: Buffer.byteLength(built.html, 'utf8'),
    pages: built.pages,
    look: {
      format: choice.format || 'post',
      palette: choice.palette || 'paper',
      pairing: choice.pairing || 'modern',
      pattern: choice.pattern || 'none',
      layout: choice.reel ? 'reel' : layout,
    },
    lint,
    issues: built.issues,
    notes: built.notes,
    caption: draft,
    copy: {
      spine: copy.checkSpine(outline),
      tells: [...frameCopy.tells, ...captionCopy.tells],
      bait,
      // The same line sits on a frame AND in the caption, so the same finding
      // arrives twice. One per rule and phrase.
      warnings: [...frameCopy.warnings, ...captionCopy.warnings]
        .filter((w, i, all) => all.findIndex((x) => x.rule === w.rule && x.found === w.found) === i),
    },
    publish: target && { path: target.page.path, url: target.page.url },
  };
}


// ===========================================================================
// speak — narration for the reel, and render — the reel as a real video
// ===========================================================================

/**
 * Read a media file with ffprobe.
 *
 * Returns null when ffprobe is not on this machine, and the callers turn that
 * into `unverified` with the reason rather than into a guess. A duration that
 * nobody measured is not a duration.
 */
function probeMedia(file) {
  const { spawnSync } = require('child_process');
  const run = spawnSync('ffprobe', [
    '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file,
  ], { encoding: 'utf8', timeout: 60000 });
  if (run.error || run.status !== 0) {
    return { ok: false, reason: run.error && run.error.code === 'ENOENT' ? 'ffprobe غير مثبّت' : (run.stderr || '').trim() };
  }
  let data;
  try { data = JSON.parse(run.stdout); } catch (e) { return { ok: false, reason: 'ffprobe أرجع ما لا يُقرأ' }; }
  const streams = data.streams || [];
  const video = streams.find((x) => x.codec_type === 'video');
  const audio = streams.find((x) => x.codec_type === 'audio');
  const rate = video && video.avg_frame_rate && video.avg_frame_rate !== '0/0'
    ? Number(video.avg_frame_rate.split('/')[0]) / Number(video.avg_frame_rate.split('/')[1] || 1)
    : null;
  return {
    ok: true,
    exists: true,
    duration: data.format && data.format.duration ? Number(data.format.duration) : null,
    seconds: data.format && data.format.duration ? Math.round(Number(data.format.duration) * 1000) / 1000 : null,
    width: video ? video.width : null,
    height: video ? video.height : null,
    codec: video ? video.codec_name : (audio ? audio.codec_name : null),
    fps: rate ? Math.round(rate * 1000) / 1000 : null,
    hasAudio: Boolean(audio),
    sampleRate: audio && audio.sample_rate ? Number(audio.sample_rate) : null,
    channels: audio ? audio.channels : null,
  };
}

/** Is this command on the PATH and does it answer? */
function probeEngine(id) {
  const { spawnSync } = require('child_process');
  const probe = speech.probeCommand(id);
  if (!probe) return false;
  const run = spawnSync(probe.command, probe.args, { encoding: 'utf8', timeout: 120000 });
  return !run.error && run.status === 0;
}

function speakCommand(input, flags, flag) {
  const path = require('path');
  const outDir = flag('out', 'voice');
  const dialect = (flag('dialect', 'MSA') || 'MSA').toUpperCase();
  const wanted = flag('engine');

  const installed = flags.includes('--no-probe')
    ? null
    : Object.keys(speech.ENGINES).filter((id) => probeEngine(id));

  const script = speech.scriptFromReel(input, {
    dialect,
    installed: wanted ? [wanted] : installed,
    use: flags.includes('--commercial') ? 'commercial' : null,
    handles: flag('handles'),
    harakat: flags.includes('--no-harakat') ? 'strip' : 'keep',
    maxChars: Number(flag('max-chars', 300)),
  });
  if (!script.ok) return { ok: false, ...script };

  fs.mkdirSync(outDir, { recursive: true });

  // One command per scene, written out whether or not they can be run here, so
  // the creator can take them to a machine with a GPU.
  const jobs = script.scenes.map((scene) => speech.synthCommand(script.engine, {
    text: scene.text,
    dialect: script.dialect,
    variant: script.variant,
    out: scene.file,
    outDir,
    refAudio: flag('ref-audio'),
    refText: flag('ref-text'),
    device: flag('device'),
    removeSilence: flags.includes('--remove-silence'),
    driver: path.join(outDir, 'namaa_tts.py'),
  }));

  const blocked = jobs.find((j) => !j.ok);
  for (const job of jobs) {
    if (job.ok && job.writes) {
      for (const [file, body] of Object.entries(job.writes)) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, body);
        fs.chmodSync(file, 0o755);
      }
    }
  }

  const shown = jobs.filter((j) => j.ok).map((j) => speech.show(j));
  fs.writeFileSync(path.join(outDir, 'script.json'), `${JSON.stringify(script, null, 2)}\n`);
  if (shown.length) {
    fs.writeFileSync(
      path.join(outDir, 'synth.sh'),
      `#!/usr/bin/env bash\n# ${script.name} — ${script.dialectAr}\nset -euo pipefail\n\n${shown.join('\n')}\n`
    );
    fs.chmodSync(path.join(outDir, 'synth.sh'), 0o755);
  }

  // --run only ever runs what is already installed, and every wav it makes is
  // then read back off the disk. An exit code is not a sound.
  const files = [];
  let ran = false;
  if (flags.includes('--run') && !blocked && installed !== null && installed.includes(script.engine)) {
    const { spawnSync } = require('child_process');
    ran = true;
    for (const job of jobs) {
      const run = spawnSync(job.command, job.args, { encoding: 'utf8', timeout: 900000, stdio: ['ignore', 'pipe', 'inherit'] });
      if (run.error || run.status !== 0) { files.push({ exists: false, error: (run.error && run.error.message) || `exit ${run.status}` }); continue; }
      const made = path.join(outDir, job.args[job.args.indexOf('--output_file') + 1] || '');
      const target = job.engine === 'habibi' ? made : job.args[job.args.indexOf('--out') + 1];
      const probed = fs.existsSync(target) ? probeMedia(target) : { ok: false, reason: 'لم يُكتب الملف' };
      files.push(probed.ok ? { ...probed, file: target } : { exists: false, file: target, error: probed.reason });
    }
  }

  return {
    ok: true,
    script: path.join(outDir, 'script.json'),
    commands: shown,
    ...(blocked && { blocked: blocked.reason }),
    installed,
    ran,
    status: speech.voiceStatus(script, { files }),
    engine: { ...speech.ENGINES[script.engine], quirks: speech.ENGINES[script.engine].quirks || [] },
  };
}

/**
 * Fetch each slot's `arabic` slice from Google once, into the project.
 *
 * Node reaches the network here; the headless browser at render time may well
 * not — behind a proxy it does not inherit, in CI, on an air-gapped box. So the
 * files are vendored now and the render stays offline and reproducible.
 *
 * Each slot walks its ladder until a weight answers. The eight pairing faces
 * ship different weights (Amiri has 400 and 700 and nothing else), so asking
 * every family for 900 is an HTTP 400 for half of them. The weight that
 * answered is recorded and the project names THAT one — a weight the file
 * lacks is not an error in the browser, it is a synthesised bold, and on
 * Arabic that smears the joins.
 *
 * Google's css2 answer is ordered by subset and each block is labelled
 * (`/* arabic *\/`). Tajawal has no latin-ext, Amiri has, and the order is not
 * promised — so the block is found by its label and by a unicode-range that
 * actually contains U+0600, never by position.
 *
 * Returns ok:false when a slot exhausts its ladder, and the caller falls back
 * to the Google path with that reason written into the status and the
 * project's README.
 */
async function fetchArabicFonts(wanted, dir) {
  const path = require('path');
  const video = require('./video');
  const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
  const got = [];
  const onDisk = new Map();   // family|weight -> file, so Cairo 700 is fetched once

  for (const slot of wanted) {
    let resolved = null;
    const tried = [];
    for (const weight of slot.ladder) {
      const key = `${slot.family}|${weight}`;
      if (onDisk.has(key)) { resolved = { weight, file: onDisk.get(key) }; break; }

      const css = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(slot.family)}:wght@${weight}`;
      const sheet = await fetch(css, { headers: { 'User-Agent': UA } });
      // 400 means this face does not ship this weight — walk on, do not fail.
      if (!sheet.ok) { tried.push(`${weight}:HTTP ${sheet.status}`); continue; }
      const body = await sheet.text();

      const blocks = body.split('@font-face');
      const arabic = blocks.find((b) => /unicode-range:[^;]*U\+0600/i.test(b));
      const url = arabic && /src:\s*url\((https:[^)]+\.woff2)\)/.exec(arabic);
      if (!url) { tried.push(`${weight}:لا شريحة عربية`); continue; }

      const file = await fetch(url[1], { headers: { 'User-Agent': UA } });
      if (!file.ok) { tried.push(`${weight}:تنزيل HTTP ${file.status}`); continue; }
      const bytes = Buffer.from(await file.arrayBuffer());
      // A woff2 starts with 'wOF2'. A proxy error page does not.
      if (bytes.length < 1024 || bytes.subarray(0, 4).toString('latin1') !== 'wOF2') {
        tried.push(`${weight}:ليس woff2`);
        continue;
      }
      const rel = video.fontFile(slot.family, weight);
      const target = path.join(dir, 'public', rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, bytes);
      onDisk.set(key, rel);
      resolved = { weight, file: rel };
      break;
    }

    if (!resolved) {
      return { ok: false, reason: `${slot.family} (${slot.slot}): لا وزن من ${slot.ladder.join('/')} — ${tried.join('، ')}` };
    }
    got.push({ slot: slot.slot, role: slot.role, family: slot.family, ...resolved });
  }
  return { ok: true, assets: got };
}

async function renderCommandRun(input, flags, flag) {
  const path = require('path');
  const dir = flag('out', 'reel-video');
  const voiceFile = flag('voice');
  const voice = voiceFile ? JSON.parse(fs.readFileSync(voiceFile, 'utf8')) : null;
  const wantLocal = flag('fonts', 'local') !== 'google';

  const options = { palette: flag('palette'), pairing: flag('pairing'), name: flag('name'), voice };
  const probe = video.projectFiles(input, { ...options, fonts: 'google' });
  fs.mkdirSync(dir, { recursive: true });

  let fontAssets = null;
  let fontFallback = null;
  if (wantLocal) {
    const fetched = await fetchArabicFonts(probe.fonts.wanted, dir).catch((e) => ({ ok: false, reason: e.message }));
    if (fetched.ok) fontAssets = fetched.assets;
    else fontFallback = `${fetched.reason} — رجع المشروع إلى خطوط Google، وهذا يحتاج شبكة من داخل المتصفّح وقت التركيب.`;
  }

  // Narration belongs in public/: staticFile() resolves there and nowhere else.
  // Copied BEFORE the composition is written, because the composition must
  // only reference the clips that actually arrived.
  fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
  const copied = [];
  const missing = [];
  if (voice) {
    const from = path.dirname(voiceFile);
    for (const clip of probe.audio) {
      const src = path.join(from, clip);
      if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(dir, 'public', clip)); copied.push(clip); }
      else missing.push(clip);
    }
  }

  const built = video.projectFiles(input, {
    ...options,
    fonts: fontAssets ? 'local' : 'google',
    fontAssets,
    audioAvailable: voice ? copied : null,
  });

  for (const [rel, body] of Object.entries(built.files)) {
    const target = path.join(dir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body);
  }

  const cmds = video.renderCommand({ dir, out: flag('file', 'out/reel.mp4'), browser: flag('browser'), concurrency: flag('concurrency') });
  let installed = null;
  let rendered = null;
  if (flags.includes('--run')) {
    const { spawnSync } = require('child_process');
    const install = spawnSync(cmds.install.command, cmds.install.args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'] });
    installed = !install.error && install.status === 0;
    if (installed) {
      const run = spawnSync(cmds.render.command, cmds.render.args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
      const file = path.join(dir, flag('file', 'out/reel.mp4'));
      rendered = !run.error && run.status === 0 && fs.existsSync(file) ? file : null;
    }
  } else {
    installed = fs.existsSync(path.join(dir, 'node_modules'));
  }

  const probed = rendered ? probeMedia(rendered) : null;
  return {
    ok: true,
    project: dir,
    files: Object.keys(built.files).length,
    fonts: {
      mode: built.fonts.mode,
      files: [...new Set(built.fonts.assets.map((f) => f.file))],
      // A slot that did not get its first choice is said, not swallowed: with
      // Reem Kufi the huge number and the title are both 700, because the face
      // ships nothing heavier, and the hierarchy between them flattens.
      ...(built.fonts.settled.length && { settled: built.fonts.settled }),
      ...(fontFallback && { fallback: fontFallback }),
    },
    audio: { copied, missing, dir: path.join(dir, built.audioDir) },
    next: [speech.show(cmds.install), speech.show(cmds.render)],
    status: video.videoStatus(input, {
      timeline: built.timeline,
      projectDir: dir,
      installed,
      voice,
      path: rendered,
      file: probed && probed.ok ? probed : null,
    }),
    ...(probed && !probed.ok && { probe: probed.reason }),
  };
}

function verifyVideo(file, flags, flag) {
  const plan = JSON.parse(fs.readFileSync(flag('plan'), 'utf8'));
  const voiceFile = flag('voice');
  const voice = voiceFile ? JSON.parse(fs.readFileSync(voiceFile, 'utf8')) : null;
  const probed = probeMedia(file);
  return {
    ok: probed.ok,
    file,
    ...(probed.ok ? { measured: probed } : { probe: probed.reason }),
    status: video.videoStatus(plan, { file: probed.ok ? probed : null, voice, path: file }),
  };
}

function main(argv) {
  const args = argv.slice(2);
  const command = args.find((a) => !a.startsWith('--'));
  const flags = args.filter((a) => a.startsWith('--'));
  const file = args.filter((a) => !a.startsWith('--'))[1];
  const flag = (name, fallback) => {
    const hit = flags.find((f) => f.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : fallback;
  };

  if (!['plan', 'reflow', 'make', 'speak', 'render', 'voices'].includes(command)) {
    process.stderr.write(
      'usage: cli.js plan|reflow [file.json] [--numerals=…] [--no-spelling] [--align=end|start] [--no-align]\n'
      + '                            [--expect=lines.txt]\n'
      + '       cli.js make outline.json [--reel] [--format=reel|post|square|story|carousel|cover]\n'
      + '                                [--palette=…] [--pairing=…] [--pattern=…] [--layout=…]\n'
      + '                                [--per-page=3] [--repo=owner/name] [--branch=main]\n'
      + '                                [--out=page.html] [--numerals=arabic-indic]\n'
      + '       cli.js voices [--dialect=EGY] [--commercial]\n'
      + '       cli.js speak reel.json  [--dialect=MSA|EGY|SAU|…] [--engine=habibi|namaa-egyptian]\n'
      + '                               [--ref-audio=clip.wav --ref-text=…] [--out=voice] [--run]\n'
      + '                               [--commercial] [--handles=keep] [--no-harakat] [--device=cpu]\n'
      + '       cli.js render reel.json [--out=reel-video] [--voice=voice/script.json] [--run]\n'
      + '                               [--palette=…] [--pairing=…] [--file=out/reel.mp4] [--browser=…]\n'
      + '                               [--fonts=local|google]\n'
      + '       cli.js render --verify=out/reel.mp4 --plan=reel.json [--voice=voice/script.json]\n'
      + `       palettes: ${Object.keys(recipes.PALETTES).join(' ')}\n`
      + `       pairings: ${Object.keys(recipes.PAIRINGS).join(' ')}\n`
      + `       patterns: ${recipes.PATTERNS.join(' ')}\n`
      + `       layouts:  ${Object.keys(recipes.LAYOUTS).join(' ')}\n`
      + `       dialects: ${Object.keys(speech.DIALECTS).join(' ')}\n`
    );
    process.exit(2);
  }

  // voices answers from the tables alone: which engine, which licence, which
  // register — no plan, no file, nothing read.
  if (command === 'voices') {
    const dialects = flag('dialect') ? [flag('dialect').toUpperCase()] : Object.keys(speech.DIALECTS);
    const use = flags.includes('--commercial') ? 'commercial' : null;
    process.stdout.write(`${JSON.stringify({
      engines: Object.values(speech.ENGINES).map((e) => ({
        id: e.id, name: e.name, ar: e.ar, model: e.model, install: e.install,
        dialects: e.dialects, reference: e.reference, sampleRate: e.sampleRate,
        licence: e.licence, quirks: e.quirks || [], cliBlocked: e.cliBlocked,
      })),
      routing: dialects.map((d) => speech.pickEngine({ dialect: d, use })),
    }, null, 2)}\n`);
    return;
  }

  // render --verify reads a finished file; it needs no plan on stdin.
  if (command === 'render' && flag('verify')) {
    if (!flag('plan')) {
      process.stderr.write('render --verify=… يحتاج --plan=reel.json للمقارنة.\n');
      process.exit(2);
    }
    const verdict = verifyVideo(flag('verify'), flags, flag);
    process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`);
    if (!verdict.ok) process.exit(1);
    return;
  }

  const numeralFlag = flags.find((f) => f.startsWith('--numerals='));
  const align = flag('align');
  const expect = flag('expect');
  const options = {
    numerals: numeralFlag ? numeralFlag.split('=')[1] : null,
    spelling: !flags.includes('--no-spelling'),
    align: flags.includes('--no-align') ? false : align || null,
    expect: expect ? fs.readFileSync(expect, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean) : null,
  };
  if (options.align && !['end', 'start'].includes(options.align)) {
    process.stderr.write(`--align takes end or start, not «${options.align}»\n`);
    process.exit(2);
  }
  if (options.numerals && !numerals.SYSTEMS[options.numerals]) {
    process.stderr.write(`unknown numeral system: ${options.numerals}\n`);
    process.exit(2);
  }

  const raw = file ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
  // make takes the post as the creator writes it, or an outline already in
  // JSON. The other commands only ever read Canva's JSON.
  const input = command === 'make' && !raw.trimStart().startsWith('{')
    ? withBreaks(parseOutline(raw))
    : JSON.parse(raw);

  if (command === 'speak' || command === 'render') {
    const done = (result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (!result.ok) process.exit(1);
    };
    if (command === 'speak') { done(speakCommand(input, flags, flag)); return; }
    return renderCommandRun(input, flags, flag).then(done, (e) => {
      process.stderr.write(`${e.stack || e.message}\n`);
      process.exit(1);
    });
  }

  if (command === 'make') {
    const choice = {
      reel: flags.includes('--reel'),
      format: flag('format', input.format),
      palette: flag('palette', input.palette),
      pairing: flag('pairing', input.pairing),
      pattern: flag('pattern', input.pattern),
      layout: flag('layout', input.layout),
      perPage: Number(flag('per-page', 3)),
      repo: flag('repo'),
      branch: flag('branch', 'main'),
    };
    const result = make(input, choice, options);

    if (!result.ok) {
      process.stderr.write(`${JSON.stringify({
        problems: result.problems, lint: result.lint, issues: result.issues,
        bait: result.copy && result.copy.bait,
      }, null, 2)}\n`);
      process.exit(1);
    }
    const out = flag('out');
    if (out) {
      fs.mkdirSync(require('path').dirname(out), { recursive: true });
      fs.writeFileSync(out, result.html);
    }
    const { html, ...summary } = result;
    process.stdout.write(`${JSON.stringify({ ...summary, file: out || null }, null, 2)}\n`);
    return;
  }

  const result = command === 'plan' ? plan(input, options) : reflow(input, options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) main(process.argv);

module.exports = {
  plan, reflow, make, checkOutline, foldNoise, batchByPage, escapeRemedy, wordEdits, clearOf, RESPONSIVE_OPS,
};
