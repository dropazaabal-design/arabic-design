'use strict';

/**
 * numerals.js — digit systems, dates and currency inside Arabic designs.
 *
 * Three digit systems routinely collide in one Canva file:
 *   western       0123456789   U+0030..U+0039
 *   arabic-indic  ٠١٢٣٤٥٦٧٨٩   U+0660..U+0669   (Arabic "Hindi" digits)
 *   persian       ۰۱۲۳۴۵۶۷۸۹   U+06F0..U+06F9   (Extended Arabic-Indic)
 *
 * Persian digits in an Arabic design are almost always an accident — a font
 * fallback or a copy-paste from a Farsi source.
 *
 * Digits are NEVER converted inside a URL, an email address, a phone number, a
 * code span, or a Latin product name: "iPhone ١٥" and "https://a.com/٢٠٢٤" are
 * both broken.
 */

const { scanProtectedSpans, stripBidiControls } = require('./bidi');

const WESTERN = '0123456789';
const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

const SYSTEMS = {
  western: WESTERN,
  'arabic-indic': ARABIC_INDIC,
  persian: PERSIAN,
};

/** Spans whose digits must never be touched. A bare 'number' span is fair game. */
const FROZEN_KINDS = new Set(['code', 'url', 'email', 'phone', 'latin', 'mixed']);

const ANY_DIGIT_RE = /[0-9٠-٩۰-۹]/;
const ANY_DIGIT_GLOBAL = /[0-9٠-٩۰-۹]/g;

function systemOf(ch) {
  if (WESTERN.includes(ch)) return 'western';
  if (ARABIC_INDIC.includes(ch)) return 'arabic-indic';
  if (PERSIAN.includes(ch)) return 'persian';
  return null;
}

function digitValue(ch) {
  const sys = systemOf(ch);
  return sys === null ? null : SYSTEMS[sys].indexOf(ch);
}

/** Plain integer value of a digit string in any of the three systems. */
function toNumber(str) {
  let out = '';
  for (const ch of String(str)) {
    const v = digitValue(ch);
    if (v === null) return NaN;
    out += v;
  }
  return out === '' ? NaN : Number(out);
}

/**
 * Which digit systems appear, and whether they are mixed.
 *
 * Only counts digits that convertNumerals would actually convert. A phone
 * number or a URL keeps Western digits by design, so counting those would
 * report every Arabic design as "mixed" and never stop reporting it.
 */
function censusNumerals(text) {
  const counts = { western: 0, 'arabic-indic': 0, persian: 0 };

  for (const line of stripBidiControls(text).split('\n')) {
    const frozen = new Array(line.length).fill(false);
    for (const span of scanProtectedSpans(line)) {
      if (!FROZEN_KINDS.has(span.kind)) continue;
      for (let i = span.start; i < span.end; i++) frozen[i] = true;
    }
    for (let i = 0; i < line.length; i++) {
      if (frozen[i]) continue;
      const sys = systemOf(line[i]);
      if (sys) counts[sys]++;
    }
  }

  const systems = Object.keys(counts).filter((k) => counts[k] > 0);
  return { counts, systems, mixed: systems.length > 1 };
}

/** Census across every text in a design. */
function censusDesign(texts) {
  const joined = texts.join('\n');
  const census = censusNumerals(joined);
  return census.mixed
    ? [{
        rule: 'numeral-mixing',
        severity: 'error',
        systems: census.systems,
        counts: census.counts,
        message: `تعدد أنظمة الأرقام في التصميم الواحد: ${census.systems.join(' + ')}`,
      }]
    : [];
}

/**
 * Convert every convertible digit to one system.
 * @param {string} text
 * @param {'western'|'arabic-indic'|'persian'} target
 * @param {{percent?: boolean}} [options] percent: also swap % <-> ٪
 */
function convertNumerals(text, target, options = {}) {
  const table = SYSTEMS[target];
  if (!table) throw new Error(`unknown numeral system: ${target}`);

  const src = String(text == null ? '' : text);
  const changes = [];

  const out = src
    .split('\n')
    .map((line) => {
      const frozen = new Array(line.length).fill(false);
      for (const span of scanProtectedSpans(line)) {
        if (!FROZEN_KINDS.has(span.kind)) continue;
        for (let i = span.start; i < span.end; i++) frozen[i] = true;
      }

      let result = '';
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (frozen[i]) { result += ch; continue; }

        const value = digitValue(ch);
        if (value !== null) {
          const replacement = table[value];
          if (replacement !== ch) bump(changes, 'numerals', `${ch} → ${replacement}`);
          result += replacement;
          continue;
        }
        if (options.percent) {
          if (target !== 'western' && ch === '%') { result += '٪'; bump(changes, 'percent', '% → ٪'); continue; }
          if (target === 'western' && ch === '٪') { result += '%'; bump(changes, 'percent', '٪ → %'); continue; }
        }
        result += ch;
      }
      return result;
    })
    .join('\n');

  return { text: out, changed: out !== src, changes };
}

function bump(changes, rule, sample) {
  const hit = changes.find((c) => c.rule === rule && c.sample === sample);
  if (hit) hit.count++;
  else changes.push({ rule, sample, count: 1 });
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const D = '[0-9٠-٩۰-۹]';
const FULL_DATE_RE = new RegExp(`${D}{1,4}\\s?[/.\\u2013-]\\s?${D}{1,2}\\s?[/.\\u2013-]\\s?${D}{1,4}`, 'g');
const YEAR_RE = new RegExp(`${D}{3,4}\\s?(هـ|هجري(?:ة)?|م|ميلادي(?:ة)?|AH|CE|AD)?`, 'g');

const HIJRI_MARKERS = /^(هـ|هجري(?:ة)?|AH)$/;
const GREGORIAN_MARKERS = /^(م|ميلادي(?:ة)?|CE|AD)$/;

/** Plausible Hijri year range — used only to warn about ambiguity. */
const HIJRI_RANGE = [1300, 1500];

/**
 * Locate dates and say which calendar each one declares.
 * calendar is 'hijri', 'gregorian' or 'unmarked'.
 */
function findDates(text) {
  const src = stripBidiControls(text);
  const taken = new Array(src.length).fill(false);
  const found = [];

  FULL_DATE_RE.lastIndex = 0;
  let m;
  while ((m = FULL_DATE_RE.exec(src)) !== null) {
    for (let i = m.index; i < m.index + m[0].length; i++) taken[i] = true;
    found.push({ text: m[0], index: m.index, calendar: 'unmarked', kind: 'full-date' });
  }

  YEAR_RE.lastIndex = 0;
  while ((m = YEAR_RE.exec(src)) !== null) {
    if (taken[m.index]) continue;
    const marker = m[1];
    const calendar = !marker ? 'unmarked' : HIJRI_MARKERS.test(marker) ? 'hijri'
      : GREGORIAN_MARKERS.test(marker) ? 'gregorian' : 'unmarked';
    found.push({ text: m[0], index: m.index, calendar, kind: 'year', year: toNumber(m[0].replace(/\D/g, '') || m[0]) });
  }

  return found.sort((a, b) => a.index - b.index);
}

/**
 * Report-only. An unmarked year that could be read as Hijri is ambiguous, and a
 * design that carries both calendars without saying so is a reader trap.
 */
function checkDates(texts) {
  const issues = [];
  const calendars = new Set();

  texts.forEach((text, i) => {
    for (const date of findDates(text)) {
      if (date.calendar !== 'unmarked') calendars.add(date.calendar);
      const year = toNumber(date.text.replace(/[^0-9٠-٩۰-۹]/g, '').slice(0, 4));
      if (date.calendar === 'unmarked' && year >= HIJRI_RANGE[0] && year <= HIJRI_RANGE[1]) {
        issues.push({
          rule: 'date-calendar-ambiguous',
          severity: 'warning',
          textIndex: i,
          found: date.text,
          message: `«${date.text}» سنة بلا علامة تقويم؛ تقع في نطاق التقويم الهجري. أضف «هـ» أو «م».`,
        });
      }
    }
  });

  if (calendars.has('hijri') && calendars.has('gregorian')) {
    issues.push({
      rule: 'date-calendar-mixed',
      severity: 'info',
      message: 'التصميم يستعمل التقويمين الهجري والميلادي معًا. تأكد أن ذلك مقصود وأن كل تاريخ معلَّم.',
    });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

const CURRENCIES = [
  ['$', 'USD'], ['€', 'EUR'], ['£', 'GBP'], ['¥', 'JPY'], ['﷼', 'SAR'],
  ['ر.س', 'SAR'], ['SAR', 'SAR'], ['د.إ', 'AED'], ['AED', 'AED'],
  ['ج.م', 'EGP'], ['EGP', 'EGP'], ['د.ك', 'KWD'], ['KWD', 'KWD'],
  ['ر.ق', 'QAR'], ['QAR', 'QAR'], ['د.ب', 'BHD'], ['ل.س', 'SYP'],
  ['د.أ', 'JOD'], ['د.ع', 'IQD'], ['د.ت', 'TND'], ['د.ج', 'DZD'],
  ['د.م', 'MAD'], ['USD', 'USD'], ['EUR', 'EUR'],
];

/**
 * Locate currency amounts and say whether the symbol leads or trails.
 *
 * In an RTL paragraph a leading Latin symbol ("$99") only stays glued to its
 * number when the whole run is isolated — which bidi.fixText already does. This
 * function exists so the audit can say which amounts depend on that isolate.
 */
function findCurrency(text) {
  const src = stripBidiControls(text);
  const found = [];

  for (const [token, code] of CURRENCIES) {
    let from = 0;
    for (;;) {
      const at = src.indexOf(token, from);
      if (at === -1) break;
      from = at + token.length;

      const before = src.slice(Math.max(0, at - 12), at);
      const after = src.slice(at + token.length, at + token.length + 12);
      const trailsNumber = new RegExp(`${D}[\\s]?$`).test(before);
      const leadsNumber = new RegExp(`^[\\s]?${D}`).test(after);
      if (!trailsNumber && !leadsNumber) continue;

      if (found.some((f) => at >= f.index && at < f.index + f.token.length)) continue;
      found.push({
        token, code, index: at,
        placement: leadsNumber ? 'before' : 'after',
        needsIsolate: /^[A-Za-z$€£¥]/.test(token),
      });
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

module.exports = {
  SYSTEMS,
  WESTERN,
  ARABIC_INDIC,
  PERSIAN,
  ANY_DIGIT_RE,
  ANY_DIGIT_GLOBAL,
  systemOf,
  digitValue,
  toNumber,
  censusNumerals,
  censusDesign,
  convertNumerals,
  findDates,
  checkDates,
  findCurrency,
  CURRENCIES,
};
