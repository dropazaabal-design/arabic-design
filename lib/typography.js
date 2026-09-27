'use strict';

/**
 * typography.js — the silent-failure rules.
 *
 * Everything here answers one question: can Canva's `format_text` operation
 * actually carry this fix? `format_text` accepts exactly the fields in
 * FORMAT_TEXT_FIELDS. Anything outside that list — letter spacing above all —
 * is a manual finding, never an auto fix. We do not claim repairs the API
 * cannot make.
 */

const { hasArabic, hasHarakat, TATWEEL } = require('./bidi');

/** Every field Canva's format_text operation accepts. Nothing else is fixable. */
const FORMAT_TEXT_FIELDS = [
  'color', 'decoration', 'font_size', 'font_style', 'font_weight',
  'line_height', 'link', 'list_level', 'list_marker', 'strikethrough', 'text_align',
];

/** Arabic needs more point size than Latin: its letterforms are harder to tell apart. */
const MIN_ARABIC_FONT_SIZE = 14;
const MIN_LATIN_FONT_SIZE = 12;

/** Arabic descends further and carries marks above; 1.2 line height clips both. */
const LINE_HEIGHT_MIN = 1.5;
const LINE_HEIGHT_DEFAULT = 1.6;
const LINE_HEIGHT_HARAKAT = 1.8;

/** Arabic reads visually smaller than Latin at equal point size. */
const OPTICAL_BUMP = 0.15; // within the 10–20% range

/**
 * The Arabic point size that looks the same weight as a Latin size beside it.
 * @param {number} latinSize
 * @param {number} [bump] 0.10–0.20
 */
function opticalSize(latinSize, bump = OPTICAL_BUMP) {
  return Math.round(latinSize * (1 + bump));
}

/** Remove tatweel used as justification filler (runs of two or more). */
function stripTatweel(text) {
  const src = String(text || '');
  let removed = 0;
  const out = src.replace(new RegExp(`${TATWEEL}{2,}`, 'g'), (run) => {
    removed += run.length;
    return '';
  });
  return { text: out, removed, changed: removed > 0 };
}

function finding(rule, severity, message, extra = {}) {
  return { rule, severity, message, ...extra };
}

/**
 * Audit one text element.
 *
 * @param {{text: string, style?: object, locator_id?: string, page?: number}} element
 * @returns {{auto: Array, manual: Array}}
 *   auto   — ready-to-send edit-design operations
 *   manual — findings a human must act on in the Canva editor
 */
function checkElement(element = {}) {
  const text = String(element.text || '');
  const style = element.style || {};
  const locator_id = element.locator_id;
  const auto = [];
  const manual = [];

  if (!hasArabic(text)) return { auto, manual };

  const where = { locator_id, page: element.page, sample: text.slice(0, 40) };
  const format = (formatting) => auto.push({ type: 'format_text', locator_id, formatting });

  // -- 1. Letter spacing. The one rule that matters most and the API cannot fix.
  if (typeof style.letter_spacing === 'number' && style.letter_spacing !== 0) {
    manual.push(finding(
      'letter-spacing', 'error',
      `تباعد الأحرف ${style.letter_spacing} على نص عربي — يفكّ اتصال الحروف. صفّره يدويًا في Canva (Text → Spacing → Letter spacing = 0). لا يوجد معامل لتباعد الأحرف في format_text.`,
      where
    ));
  } else if (style.letter_spacing === undefined) {
    manual.push(finding(
      'letter-spacing-unknown', 'warning',
      'تحقّق يدويًا أن تباعد الأحرف = 0 على هذا العنصر. الواجهة لا تقرأ القيمة ولا تكتبها.',
      where
    ));
  }

  // -- 2. Fake italic. Arabic has no italic; the renderer just shears the glyphs.
  if (style.font_style === 'italic') {
    format({ font_style: 'normal' });
  }

  // -- 3. Uppercase. Arabic has no letter case; the transform only mangles any
  //       Latin sitting in the same box. No API field for it.
  if (style.text_transform && style.text_transform !== 'none') {
    manual.push(finding(
      'text-transform', 'error',
      `تحويل الحالة «${style.text_transform}» مطبَّق على نص عربي — لا حالة أحرف في العربية. أزِله يدويًا (Text → Aa).`,
      where
    ));
  }

  // -- 4. Line height.
  const lineTarget = hasHarakat(text) ? LINE_HEIGHT_HARAKAT : LINE_HEIGHT_DEFAULT;
  if (typeof style.line_height === 'number') {
    if (style.line_height < lineTarget) {
      format({ line_height: lineTarget });
      if (hasHarakat(text) && style.line_height < LINE_HEIGHT_HARAKAT) {
        manual.push(finding(
          'harakat-clipping', 'warning',
          'النص يحمل حركات وارتفاع السطر أقل من 1.8 — تحقّق من القصّ أعلى السطر في معاينة التصدير.',
          where
        ));
      }
    }
  } else {
    manual.push(finding(
      'line-height-unknown', 'warning',
      `ارتفاع السطر غير معروف. العربية تحتاج ${LINE_HEIGHT_MIN}–${LINE_HEIGHT_HARAKAT}؛ افتراضيات Canva أقلّ من ذلك عادةً.`,
      where
    ));
  }

  // -- 5. Minimum size.
  if (typeof style.font_size === 'number' && style.font_size < MIN_ARABIC_FONT_SIZE) {
    format({ font_size: MIN_ARABIC_FONT_SIZE });
  }

  // -- 6. Tatweel as filler. Reported here, removed by the text pass — this
  //       function only ever emits format_text, never a text rewrite.
  const tatweel = stripTatweel(text);
  if (tatweel.changed) {
    manual.push(finding(
      'tatweel-filler', 'warning',
      `${tatweel.removed} محرف تمطيط مستعمل حشوًا للمحاذاة؛ ستزيله مرحلة النص. العربية تُبرَّر بتباعد الكلمات لا بالتمطيط.`,
      where
    ));
  } else if (text.includes(TATWEEL)) {
    manual.push(finding(
      'tatweel-single', 'info',
      'يوجد محرف تمطيط مفرد. إن لم يكن زخرفيًا مقصودًا فاحذفه.',
      where
    ));
  }

  // -- 7. Hyphenation.
  if (/-[ \t]*\n/.test(text)) {
    manual.push(finding(
      'hyphenation', 'error',
      'سطر عربي مقطوع بشرطة. العربية لا تُقسَّم بالشرطة — وسّع الصندوق أو صغّر الحجم بدل القطع.',
      where
    ));
  }

  return { auto, manual };
}

/**
 * Arabic beside Latin in the same design: is the Arabic big enough to match?
 * Returns an auto operation when it is not.
 */
function balanceWithLatin({ arabic, latin, bump = OPTICAL_BUMP }) {
  if (!arabic || !latin || typeof latin.font_size !== 'number' || typeof arabic.font_size !== 'number') {
    return null;
  }
  const target = opticalSize(latin.font_size, bump);
  if (arabic.font_size >= target) return null;
  return {
    op: { type: 'format_text', locator_id: arabic.locator_id, formatting: { font_size: target } },
    message: `النص العربي ${arabic.font_size}px بجانب لاتيني ${latin.font_size}px — ارفعه إلى ${target}px ليتساوى بصريًا.`,
  };
}

module.exports = {
  FORMAT_TEXT_FIELDS,
  MIN_ARABIC_FONT_SIZE,
  MIN_LATIN_FONT_SIZE,
  LINE_HEIGHT_MIN,
  LINE_HEIGHT_DEFAULT,
  LINE_HEIGHT_HARAKAT,
  OPTICAL_BUMP,
  opticalSize,
  stripTatweel,
  checkElement,
  balanceWithLatin,
};
