'use strict';

/**
 * spelling.js — a light Arabic proofreader for the mistakes generators make.
 *
 * Precision over recall, deliberately. Every rule here is one a human editor
 * would accept without thinking; anything that needs morphology or context is
 * either reported without a fix or left out entirely. A proofreader that cries
 * wolf on `علي` (a name) is worse than one that stays quiet.
 */

const { hasArabic } = require('./bidi');

const ARABIC_WORD_RE = /[ء-ْٰـ]+/g;

// ---------------------------------------------------------------------------
// Character-level rules
// ---------------------------------------------------------------------------

const CHAR_RULES = [
  {
    rule: 'tanween-order',
    // Correct order is base letter + fathatan + alef: شكرًا, not شكراً.
    pattern: /([ء-ي])اً/g,
    replace: '$1ًا',
    message: 'التنوين مكتوب بعد الألف. الترتيب الصحيح: الحرف ثم التنوين ثم الألف (شكرًا لا شكراً).',
  },
  {
    rule: 'persian-yeh',
    // U+06CC FARSI YEH inside Arabic copy — a Farsi keyboard or font fallback.
    pattern: /ی/g,
    replace: 'ي',
    message: 'ياء فارسية (U+06CC) داخل نص عربي — استبدلها بالياء العربية ي.',
  },
  {
    rule: 'persian-keheh',
    pattern: /ک/g,
    replace: 'ك',
    message: 'كاف فارسية (U+06A9) داخل نص عربي — استبدلها بالكاف العربية ك.',
  },
  {
    rule: 'space-before-punctuation',
    pattern: /[ \t]+([،؛؟!.:])/g,
    replace: '$1',
    message: 'مسافة قبل علامة الترقيم.',
  },
  {
    rule: 'missing-space-after-punctuation',
    pattern: /([،؛؟])(?=[^\s،؛؟!.:…»)\]}])/g,
    replace: '$1 ',
    message: 'علامة ترقيم بلا مسافة بعدها.',
  },
  {
    rule: 'double-space',
    pattern: /  +/g,
    replace: ' ',
    message: 'مسافات متكررة.',
  },
];

// ---------------------------------------------------------------------------
// Word-level rules
// ---------------------------------------------------------------------------

/** Wrong spelling -> right spelling. Prefixes are handled separately. */
const HAMZA = {
  انشاء: 'إنشاء', انتاج: 'إنتاج', انجاز: 'إنجاز', ارسال: 'إرسال', اضافة: 'إضافة',
  اعداد: 'إعداد', اعلان: 'إعلان', الغاء: 'إلغاء', امكانية: 'إمكانية', انترنت: 'إنترنت',
  ادارة: 'إدارة', اجراء: 'إجراء', احصائيات: 'إحصائيات', ابداع: 'إبداع', اصدار: 'إصدار',
  افضل: 'أفضل', اكبر: 'أكبر', اصغر: 'أصغر', اسرع: 'أسرع', اسهل: 'أسهل',
  اكثر: 'أكثر', اقل: 'أقل', اول: 'أول', اهم: 'أهم', اقوى: 'أقوى',
  انواع: 'أنواع', اسعار: 'أسعار', اهداف: 'أهداف', افكار: 'أفكار', اعمال: 'أعمال',
  ادوات: 'أدوات', اخبار: 'أخبار', اسئلة: 'أسئلة', اماكن: 'أماكن', ايضا: 'أيضًا',
  انت: 'أنت', انتم: 'أنتم', انا: 'أنا', اخرى: 'أخرى', اثناء: 'أثناء',
};

/** Words wrongly ending in ه that must end in ة. */
const TA_MARBUTA = {
  حياه: 'حياة', جميله: 'جميلة', شركه: 'شركة', خدمه: 'خدمة', مدرسه: 'مدرسة',
  صفحه: 'صفحة', مده: 'مدة', قيمه: 'قيمة', فكره: 'فكرة', نتيجه: 'نتيجة',
  طريقه: 'طريقة', حمله: 'حملة', علامه: 'علامة', جوده: 'جودة', سرعه: 'سرعة',
  خبره: 'خبرة', تجربه: 'تجربة', رساله: 'رسالة', سياسه: 'سياسة', منصه: 'منصة',
  واجهه: 'واجهة', بدايه: 'بداية', نهايه: 'نهاية', كميه: 'كمية', مجموعه: 'مجموعة',
  سنه: 'سنة', ساعه: 'ساعة', دقيقه: 'دقيقة', مره: 'مرة', نسخه: 'نسخة',
  مجانيه: 'مجانية', خاصه: 'خاصة', عامه: 'عامة', كامله: 'كاملة', جديده: 'جديدة',
  قديمه: 'قديمة', كبيره: 'كبيرة', صغيره: 'صغيرة', سريعه: 'سريعة', سهله: 'سهلة',
  رائعه: 'رائعة', مميزه: 'مميزة', متاحه: 'متاحة', مختلفه: 'مختلفة', اضافيه: 'إضافية',
  محدوده: 'محدودة', متوفره: 'متوفرة', مستمره: 'مستمرة', موثوقه: 'موثوقة',
  معتمده: 'معتمدة', مضمونه: 'مضمونة', محترفه: 'محترفة', شامله: 'شاملة',
  متكامله: 'متكاملة', فوريه: 'فورية', يوميه: 'يومية', شهريه: 'شهرية',
  سنويه: 'سنوية', اسبوعيه: 'أسبوعية', نهائيه: 'نهائية', رسميه: 'رسمية',
  اصليه: 'أصلية', حصريه: 'حصرية', آمنه: 'آمنة', مرنه: 'مرنة', قويه: 'قوية',
};

/** Words wrongly ending in ي that must end in ى. */
const ALEF_MAQSURA = {
  الي: 'إلى', حتي: 'حتى', متي: 'متى', اولي: 'أولى', اخري: 'أخرى',
  مستشفي: 'مستشفى', مبني: 'مبنى', معني: 'معنى', اعلي: 'أعلى', ادني: 'أدنى',
  مدي: 'مدى', لدي: 'لدى', هدي: 'هدى', غني: 'غنى',
};

/** Too ambiguous to fix — a name as often as a preposition. */
const AMBIGUOUS_MAQSURA = new Set(['علي', 'يحي', 'سلمي', 'ليلي', 'نجوي']);

const WORD_MAPS = [
  ['hamza', HAMZA],
  ['ta-marbuta', TA_MARBUTA],
  ['alef-maqsura', ALEF_MAQSURA],
];

/** Longest first, so وال is tried before و. */
const PREFIXES = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل', 'ك'];

function correctWord(word, map) {
  if (Object.prototype.hasOwnProperty.call(map, word)) return map[word];
  for (const prefix of PREFIXES) {
    if (!word.startsWith(prefix) || word.length <= prefix.length) continue;
    const rest = word.slice(prefix.length);
    if (Object.prototype.hasOwnProperty.call(map, rest)) return prefix + map[rest];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

function apply(text) {
  let out = String(text == null ? '' : text);
  const findings = [];

  if (!hasArabic(out)) return { text: out, findings };

  for (const { rule, pattern, replace, message } of CHAR_RULES) {
    pattern.lastIndex = 0;
    const hits = out.match(pattern);
    if (!hits) continue;
    out = out.replace(pattern, replace);
    findings.push({ rule, severity: 'warning', count: hits.length, found: hits[0], message });
  }

  out = out.replace(ARABIC_WORD_RE, (word) => {
    for (const [rule, map] of WORD_MAPS) {
      const fixed = correctWord(word, map);
      if (fixed && fixed !== word) {
        findings.push({
          rule, severity: 'warning', found: word, suggestion: fixed,
          message: `«${word}» ← «${fixed}»`,
        });
        return fixed;
      }
    }
    return word;
  });

  // Report-only: never auto-changed.
  for (const word of String(text).match(ARABIC_WORD_RE) || []) {
    if (AMBIGUOUS_MAQSURA.has(word)) {
      findings.push({
        rule: 'alef-maqsura-ambiguous', severity: 'info', found: word,
        message: `«${word}» قد تكون اسم عَلَم أو كلمة تنتهي بألف مقصورة. راجعها يدويًا — لم تُغيَّر.`,
      });
    }
  }

  return { text: out, findings };
}

/** Findings only; changes nothing. */
function check(text) {
  return apply(text).findings;
}

/** Findings applied. Idempotent. */
function autofix(text) {
  const { text: out, findings } = apply(text);
  return { text: out, changed: out !== String(text == null ? '' : text), changes: findings };
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

const DIALECT_MARKERS = [
  'عشان', 'كده', 'دلوقتي', 'ليش', 'وش', 'شلون', 'بدي', 'مش', 'احنا', 'إحنا',
  'إزاي', 'ازاي', 'يلا', 'خلاص', 'دي', 'ده', 'بتاع', 'كمان', 'برضه', 'هسه',
  'شنو', 'وين', 'هاد', 'هاي', 'زي ما', 'عايز', 'عاوز', 'بكرة', 'دحين',
];

const WORD_BOUNDARY = /[\s،؛؟!.:«»()[\]{}"']/;

function hasDialect(text) {
  const padded = ` ${String(text || '')} `;
  return DIALECT_MARKERS.filter((marker) => {
    let from = 0;
    for (;;) {
      const at = padded.indexOf(marker, from);
      if (at === -1) return false;
      from = at + marker.length;
      const before = padded[at - 1];
      const after = padded[at + marker.length];
      if (WORD_BOUNDARY.test(before || ' ') && WORD_BOUNDARY.test(after || ' ')) return true;
    }
  });
}

/**
 * Formal and colloquial Arabic in the same design reads as two authors.
 * Consistent dialect throughout is a choice, not a mistake — say so separately.
 */
function checkRegister(texts) {
  const arabicTexts = texts.filter((t) => hasArabic(t));
  if (arabicTexts.length < 2) return [];

  const withDialect = [];
  const withoutDialect = [];
  for (const text of arabicTexts) {
    const markers = hasDialect(text);
    if (markers.length) withDialect.push({ text, markers });
    else withoutDialect.push(text);
  }

  if (withDialect.length === 0) return [];
  if (withoutDialect.length === 0) {
    return [{
      rule: 'register-dialect', severity: 'info',
      message: 'التصميم كلّه بالعامية. متسق — تأكد فقط أنه المقصود.',
    }];
  }
  return [{
    rule: 'register-mix', severity: 'warning',
    markers: [...new Set(withDialect.flatMap((d) => d.markers))],
    message: `خلط بين الفصحى والعامية في التصميم الواحد. كلمات عامية: ${[...new Set(withDialect.flatMap((d) => d.markers))].join('، ')}`,
  }];
}

module.exports = {
  HAMZA,
  TA_MARBUTA,
  ALEF_MAQSURA,
  DIALECT_MARKERS,
  check,
  autofix,
  checkRegister,
};
