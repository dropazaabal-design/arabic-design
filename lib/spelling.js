'use strict';

/**
 * spelling.js — structural Arabic proofreading. No lexicon.
 *
 * The previous version carried word lists for hamza, ta marbuta and alef
 * maqsura. Run against a real design they caught nothing: the actual errors
 * were الخقيقة for الحقيقة, يعزج for يعجز, جانزته for جائزته. Those are letter
 * substitutions, and no rule can know which of two real-looking words was meant
 * without a dictionary of Arabic. The lists were dead weight, so they are gone.
 *
 * What remains needs no dictionary and is therefore reliable: errors that are
 * wrong on their face, whatever the intended word.
 *
 * The largest of those, and the signature of generated Arabic, is **fabricated
 * vocalisation** — a stray fatha or damma scattered through otherwise bare
 * text: استفَزازاتٌ, ينتقدَك, يجادّلٌ. Real Arabic is either vocalised or it is
 * not; a long word wearing one or two marks was never vocalised by a human.
 * That is measurable without knowing the word, so that is what we measure.
 *
 * What this cannot do is stated plainly in PROOFREADING_NOTE and belongs in
 * every report: letter-level substitutions need a human reader.
 */

const { hasArabic } = require('./bidi');

const ARABIC_WORD_RE = /[ء-ٰٕـ]+/g;
const LETTER_RE = /[ء-غف-يٰ]/;
/**
 * Harakat only. Shadda is deliberately NOT one of these: it is an orthographic
 * mark, not vocalisation, and it appears in otherwise bare text on purpose —
 * يقلّل, مدرّس, خاصّة. Counting it would hide real fabrication, and stripping it
 * would damage correct input, which is the worse of the two errors.
 */
const HARAKA_RE = /[ً-ِْ]/;
const HARAKA_GLOBAL = new RegExp(HARAKA_RE.source, 'g');
const SHADDA = 'ّ';
const FATHATAN = 'ً';

/**
 * Count the harakat that are actually vocalisation.
 *
 * A fathatan carrying an alef (شكرًا) is orthography, not vocalisation — it is
 * how the word is spelled, in bare text as much as in a vocalised Quran. Count
 * it and شكرًا reads as fabricated; strip it and the spelling breaks.
 */
function countHarakat(word) {
  let n = 0;
  for (let i = 0; i < word.length; i++) {
    if (!HARAKA_RE.test(word[i])) continue;
    if (word[i] === FATHATAN && word[i + 1] === 'ا') continue;
    n++;
  }
  return n;
}

/** Long words carrying only a mark or two were never vocalised on purpose. */
const MIN_LETTERS_FOR_VOCALISATION_CHECK = 4;
/**
 * Fully vocalised Arabic is nowhere near one mark per letter: the alef of ال,
 * long vowels and the pausal last letter all carry none. اللَّهِ sits at 0.50 and
 * الرَّحِيمِ at 0.50, while every fabricated case measured 0.25 or less. The
 * threshold goes between them, not in the middle of the vocalised band.
 */
const MAX_SPARSE_MARK_RATIO = 0.35;

/** Always present in a report: the gap this module does not cover. */
const PROOFREADING_NOTE = {
  rule: 'proofreading-human',
  severity: 'info',
  scope: 'design',
  message: 'تبديل الحروف المتشابهة (الخقيقة/الحقيقة، يعزج/يعجز، جانزته/جائزته) '
    + 'لا يُكشف بلا معجم عربي، وهذه الإضافة لا تحمل معجمًا. اقرأ النص بعين بشرية قبل التسليم.',
};

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
    rule: 'final-ya-harakat',
    // A word-final ya wearing a bare fatha is alef maqsura mis-typed: أقويَ.
    pattern: /([ء-ي])يَ(?![ء-ٕ])/g,
    replace: '$1ى',
    message: 'ياء نهائية عليها فتحة — الصواب ألف مقصورة (أقوى لا أقويَ).',
  },
  {
    rule: 'doubled-mark',
    // Two harakat stacked on one letter is always a typo.
    pattern: /([ً-ِْ])[ً-ِْ]+/g,
    replace: '$1',
    message: 'حركتان على حرف واحد.',
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
// Fabricated vocalisation
// ---------------------------------------------------------------------------

function countMatches(word, re) {
  let n = 0;
  for (const ch of word) if (re.test(ch)) n++;
  return n;
}

/**
 * True when a word wears too few marks to have been vocalised deliberately.
 *
 * Fully vocalised Arabic runs near one mark per letter. A nine-letter word
 * with two marks was not vocalised — a generator sprinkled them. Short words
 * are exempt: مَن and مِن are vocalised on purpose all the time.
 */
function isSparselyVocalised(word) {
  const letters = countMatches(word, LETTER_RE);
  const marks = countHarakat(word);
  if (letters < MIN_LETTERS_FOR_VOCALISATION_CHECK || marks === 0) return false;

  // A single haraka on the opening letter is deliberate disambiguation —
  // يُقلّل against يَقلّل. Fabricated marks land in the middle or at the end.
  if (marks === 1 && HARAKA_RE.test(word[1] || '')) return false;

  return marks / letters <= MAX_SPARSE_MARK_RATIO;
}

/** Drop the vocalisation, keep shadda and the hamza marks. */
const stripHarakat = (word) => word.replace(HARAKA_GLOBAL, (mark, at) =>
  (mark === FATHATAN && word[at + 1] === 'ا' ? mark : ''));

/** Bare skeleton, for comparing one word against another. */
const stripMarks = (word) => word.replace(/[ً-ٰٕ]/g, '');

// ---------------------------------------------------------------------------
// مَن / من
// ---------------------------------------------------------------------------

/** An imperfect verb opens with ي ت ن أ and runs to at least four letters. */
const IMPERFECT_RE = /^[يتنأا][ء-ٕ]{3,}$/;

/**
 * مَن is the relative pronoun, من the preposition. Which one is meant is a
 * syntax question, so this never rewrites — it points, and says which reading
 * the following word suggests.
 */
function checkMan(text) {
  const findings = [];
  const words = String(text).split(/\s+/);
  words.forEach((word, i) => {
    if (stripMarks(word).replace(/[^ء-ي]/g, '') !== 'من') return;
    if (!/َ/.test(word)) return;                 // bare من — nothing to judge
    const next = words[i + 1] || '';
    const looksRelative = IMPERFECT_RE.test(stripMarks(next).replace(/[^ء-ي]/g, ''));
    if (looksRelative) return;                        // مَن يُقلّل — correct as written
    findings.push({
      rule: 'man-vs-min',
      severity: 'warning',
      reportOnly: true,
      found: word,
      suggestion: 'من',
      message: `«${word}» تليها «${next}» وليست فعلًا مضارعًا، فالأرجح أنها حرف الجرّ «من» بلا فتحة. `
        + 'راجعها — لم تُغيَّر.',
    });
  });
  return findings;
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

function apply(text) {
  let out = String(text == null ? '' : text);
  const findings = [];

  if (!hasArabic(out)) return { text: out, findings };

  findings.push(...checkMan(out));

  for (const { rule, pattern, replace, message } of CHAR_RULES) {
    pattern.lastIndex = 0;
    const hits = out.match(pattern);
    if (!hits) continue;
    out = out.replace(pattern, replace);
    findings.push({ rule, severity: 'warning', count: hits.length, found: hits[0], message });
  }

  out = out.replace(ARABIC_WORD_RE, (word) => {
    if (!isSparselyVocalised(word)) return word;
    const bare = stripHarakat(word);
    findings.push({
      rule: 'fabricated-harakat',
      severity: 'warning',
      found: word,
      suggestion: bare,
      message: `«${word}» ← «${bare}»: حركات متناثرة على كلمة غير مشكولة — علامة مولّد نصّ.`,
    });
    if (bare.includes(SHADDA)) {
      findings.push({
        rule: 'shadda-suspect',
        severity: 'info',
        reportOnly: true,
        found: bare,
        message: `«${bare}» بقيت فيها شدّة بعد حذف الحركات المفبركة. الشدّة لا تُحذف آليًا `
          + 'لأن حذفها من كلمة سليمة أسوأ من إبقائها في كلمة خاطئة — راجعها بنفسك.',
      });
    }
    return bare;
  });

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
  'إزاي', 'ازاي', 'يلا', 'خلاص', 'بتاع', 'كمان', 'برضه', 'هسه',
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
      if (WORD_BOUNDARY.test(padded[at - 1] || ' ') && WORD_BOUNDARY.test(padded[at + marker.length] || ' ')) {
        return true;
      }
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
  const markers = [...new Set(withDialect.flatMap((d) => d.markers))];
  return [{
    rule: 'register-mix', severity: 'warning', markers,
    message: `خلط بين الفصحى والعامية في التصميم الواحد. كلمات عامية: ${markers.join('، ')}`,
  }];
}

module.exports = {
  PROOFREADING_NOTE,
  DIALECT_MARKERS,
  isSparselyVocalised,
  stripHarakat,
  stripMarks,
  check,
  autofix,
  checkRegister,
};
