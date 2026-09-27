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

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

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
// Lexicon and single-edit correction
// ---------------------------------------------------------------------------

/**
 * Norvig's corrector, with an Arabic alphabet and one addition that matters far
 * more here than the algorithm: a gate.
 *
 * Every error reported from two real designs — أستيقط, بدفيقة, المبتدي, تتقته —
 * is one edit away from a real word, so the method fits. But so is كايزن, which
 * is one deletion away from كاين, and غامان, which is one substitution away from
 * بأمان. Correcting a transliterated name is worse than leaving a typo, so the
 * gate below decides what may be applied without a human, and it is deliberately
 * hard to pass.
 */

/** Frequency floor of the shipped list. See lib/lexicon/README.md. */
const CUTOFF = 20;

/** At or above this the word is accepted as written. The corpus holds typos
 *  below it — أستيقط appears 44 times — so the line sits above them. */
const KNOWN_MIN = 50;

/** A unique-enough candidate still has to be a real, common word. */
const AUTO_MIN_FREQ = 300;

/** ...and it has to beat the runner-up by this much. المبتدي splits 591/572
 *  between the wrong word and the right one; nothing that close is automatic. */
const AUTO_DOMINANCE = 15;

const ALPHABET = 'ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوي';

const NORMALIZE = { أ: 'ا', إ: 'ا', آ: 'ا', ٱ: 'ا', ى: 'ي', ة: 'ه' };

/** Strip the marks, then fold the spelling variants that carry no information. */
function normalizeWord(word) {
  let out = '';
  for (const ch of stripMarks(word).replace(/ـ/g, '')) out += NORMALIZE[ch] || ch;
  return out;
}

/**
 * Letters sharing a rasm — the same skeleton, a different number or placement
 * of dots. Typists and text generators confuse these and essentially nothing
 * else; a foreign name is not a dotting error. Requiring the edit to be one of
 * these is what keeps كايزن and غامان intact.
 */
const CONFUSABLE = [
  'بتثنيئ', 'جحخ', 'دذ', 'رز', 'سش', 'صض', 'طظ', 'عغ', 'فق', 'وؤ', 'اء',
].map((group) => new Set(group));

function isConfusablePair(a, b) {
  return a !== b && CONFUSABLE.some((group) => group.has(a) && group.has(b));
}

/**
 * True when `candidate` differs from `word` by one dotting confusion or one
 * adjacent swap. Insertions, deletions and unrelated substitutions are not.
 */
function isTypoEdit(word, candidate) {
  if (word.length !== candidate.length) return false;

  const at = [];
  for (let i = 0; i < word.length; i++) if (word[i] !== candidate[i]) at.push(i);

  if (at.length === 1) return isConfusablePair(word[at[0]], candidate[at[0]]);
  if (at.length === 2 && at[1] === at[0] + 1) {
    return word[at[0]] === candidate[at[1]] && word[at[1]] === candidate[at[0]];
  }
  return false;
}

/**
 * Arabic glues its conjunctions, prepositions and article to the front of a word
 * and its pronouns to the back, so no word list holds every surface form. A
 * frequency list built from running text has سعر but not وسعر, and flagging
 * وسعر as a misspelling makes the checker useless on ordinary prose.
 *
 * Stripping these is only ever used to answer "is this a real word" — never to
 * build a correction, which stays anchored to what the writer actually wrote.
 */
const PROCLITICS = ['وال', 'فال', 'بال', 'كال', 'ولل', 'فلل', 'ال', 'لل', 'و', 'ف', 'ب', 'ك', 'ل', 'س'];
const ENCLITICS = ['هما', 'كما', 'هم', 'هن', 'كم', 'كن', 'ها', 'نا', 'ه', 'ك', 'ي'];

const MIN_STEM = 3;

function stemKnown(key, lex) {
  const known = (w) => w.length >= MIN_STEM && (lex.get(w) || { freq: 0 }).freq >= KNOWN_MIN;

  for (const prefix of PROCLITICS) {
    if (!key.startsWith(prefix)) continue;
    const stem = key.slice(prefix.length);
    if (known(stem)) return true;
    for (const suffix of ENCLITICS) {
      if (stem.endsWith(suffix) && known(stem.slice(0, -suffix.length))) return true;
    }
  }
  for (const suffix of ENCLITICS) {
    if (key.endsWith(suffix) && known(key.slice(0, -suffix.length))) return true;
  }
  return false;
}

let LEXICON = null;

/** Loaded on first use: nothing that does not proofread Arabic pays for it. */
function lexicon() {
  if (LEXICON) return LEXICON;
  LEXICON = new Map();
  const file = path.join(__dirname, 'lexicon', 'ar.txt.gz');
  if (!fs.existsSync(file)) return LEXICON;

  for (const line of zlib.gunzipSync(fs.readFileSync(file)).toString('utf8').split('\n')) {
    const cut = line.lastIndexOf(' ');
    if (cut < 1) continue;
    const surface = line.slice(0, cut);
    const key = normalizeWord(surface);
    if (!LEXICON.has(key)) LEXICON.set(key, { surface, freq: Number(line.slice(cut + 1)) });
  }
  return LEXICON;
}

/** Every string one deletion, transposition, substitution or insertion away. */
function edits1(word) {
  const out = new Set();
  for (let i = 0; i < word.length; i++) {
    out.add(word.slice(0, i) + word.slice(i + 1));
    for (const ch of ALPHABET) out.add(word.slice(0, i) + ch + word.slice(i + 1));
  }
  for (let i = 0; i < word.length - 1; i++) {
    out.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
  }
  for (let i = 0; i <= word.length; i++) {
    for (const ch of ALPHABET) out.add(word.slice(0, i) + ch + word.slice(i));
  }
  return out;
}

/**
 * Apply only the letters that actually differ, onto the writer's own spelling.
 *
 * The candidate carries the corpus's preferred surface form, and the corpus
 * prefers استيقظ over أستيقظ. Substituting it wholesale fixes the ظ and quietly
 * drops the hamza — a second error in payment for the first. Since the two
 * differ at exactly the positions the normalised forms differ, every other
 * position keeps whatever the writer chose.
 */
function projectCorrection(bare, surface) {
  if (bare.length !== surface.length) return surface;
  let out = '';
  for (let i = 0; i < bare.length; i++) {
    out += normalizeWord(bare[i]) === normalizeWord(surface[i]) ? bare[i] : surface[i];
  }
  return out;
}

/**
 * Carry the original vocalisation onto a correction.
 *
 * Only when the two are the same length, which covers a dotting fix and a swap —
 * the two edits the gate lets through. For anything else the marks have no
 * position to land on, and inventing one is worse than dropping them.
 */
function reapplyHarakat(original, corrected) {
  const letters = [];
  const marks = [];
  for (const ch of original) {
    if (MARK_RE_ALL.test(ch)) marks[letters.length - 1] = (marks[letters.length - 1] || '') + ch;
    else letters.push(ch);
  }
  if (letters.length !== corrected.length || marks.length === 0) return corrected;

  let out = '';
  for (let i = 0; i < corrected.length; i++) out += corrected[i] + (marks[i] || '');
  return out;
}

const MARK_RE_ALL = /[ً-ٰٕ]/;

/**
 * @returns {{status:'known'|'unknown'|'auto'|'ambiguous', correction?, candidates}}
 *   'known'     — in the lexicon at or above KNOWN_MIN; left alone.
 *   'unknown'   — no candidate at all. A transliterated name lands here, and so
 *                 does anything else the corpus never saw. Silent.
 *   'auto'      — one candidate clears every bar. Safe to apply.
 *   'ambiguous' — candidates exist but none is safe. Human decides.
 */
function suggest(word) {
  const bare = stripHarakat(word).replace(/ـ/g, '');
  const key = normalizeWord(bare);
  const lex = lexicon();
  if (lex.size === 0) return { status: 'unknown', candidates: [] };

  const own = lex.get(key);
  if (own && own.freq >= KNOWN_MIN) return { status: 'known', candidates: [] };
  if (stemKnown(key, lex)) return { status: 'known', candidates: [] };

  const found = new Map();
  for (const edit of edits1(bare)) {
    const editKey = normalizeWord(edit);
    if (editKey === key) continue;
    const entry = lex.get(editKey);
    if (entry && entry.freq >= CUTOFF) found.set(editKey, entry);
  }
  const candidates = [...found.values()].sort((a, b) => b.freq - a.freq);
  if (candidates.length === 0) return { status: 'unknown', candidates };

  const best = candidates[0];
  const runnerUp = candidates[1] ? candidates[1].freq : 0;
  // Compared normalised, so a hamza the writer chose is not counted as an edit.
  const safe = isTypoEdit(key, normalizeWord(best.surface))
    && best.freq >= AUTO_MIN_FREQ
    && best.freq >= AUTO_DOMINANCE * Math.max(runnerUp, own ? own.freq : 0);

  return safe
    ? { status: 'auto', correction: reapplyHarakat(word, projectCorrection(bare, best.surface)), candidates }
    : { status: 'ambiguous', candidates: candidates.slice(0, 3) };
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

  out = out.replace(ARABIC_WORD_RE, (word) => {
    const verdict = suggest(word);
    if (verdict.status === 'known' || verdict.status === 'unknown') return word;

    if (verdict.status === 'auto') {
      findings.push({
        rule: 'spelling', severity: 'warning',
        found: word, suggestion: verdict.correction,
        message: `«${word}» ← «${verdict.correction}»: مسافة تحرير واحدة عن كلمة `
          + `تردّدها ${verdict.candidates[0].freq}، والتعديل التباس نقاط أو تبديل موضعين.`,
      });
      return verdict.correction;
    }

    findings.push({
      rule: 'spelling-ambiguous', severity: 'info', reportOnly: true,
      found: word,
      candidates: verdict.candidates.map((c) => `${c.surface} (${c.freq})`),
      message: `«${word}» ليست في المعجم. أقرب ما إليها: `
        + `${verdict.candidates.map((c) => c.surface).join('، ')}. `
        + 'لم تُغيَّر — لا مرشّح منها واضح بما يكفي.',
    });
    return word;
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
  CUTOFF,
  KNOWN_MIN,
  normalizeWord,
  isTypoEdit,
  suggest,
  DIALECT_MARKERS,
  isSparselyVocalised,
  stripHarakat,
  stripMarks,
  check,
  autofix,
  checkRegister,
};
