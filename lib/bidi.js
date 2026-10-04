'use strict';

/**
 * bidi.js — Minimal BiDi control-character engine tuned for Canva's text engine.
 *
 * Canva's MCP surface exposes no text-direction parameter. The only lever is
 * control characters in the text itself — and which ones work depends on how
 * the text reaches Canva. Measured 2026-09-29, one variable at a time:
 *
 *   Editing a design (edit-design) — anchorText():
 *   - RLE/PDF and LRI/PDI are stored and IGNORED. An isolated «@kitabwbs» still
 *     painted kitabwbs@; an RLE-wrapped line still put its period on the right.
 *   - LRM and RLM WORK. They are strong characters, and the implicit rules —
 *     the only ones Canva runs — resolve the neutrals beside them. They set no
 *     box direction (an RLM at the start moved no alignment); they anchor.
 *   - replace_text resets a box to left-to-right; find_and_replace_text keeps
 *     it. That is the planner's concern (cli.js), not this file's.
 *
 *   Importing a page (import-design-from-url) — fixText():
 *   - The importer gives each box its direction from the content, so the RLE
 *     and LRI marks below ride along inert and the result reads right: checked
 *     on an imported reel, where «@kitabwbs · www.kitabwbs.com», «تلبسه،» and
 *     «عليك؟» all sit where they should. That route is left exactly as it was.
 *
 *   - U+202B RLE + U+202C PDF around a line  -> the import route's line wrap.
 *   - U+2066 LRI + U+2069 PDI around a run   -> the import route's isolates.
 *
 * Isolates (LRI/PDI) are used rather than embeddings (LRE/PDF) for inline runs
 * because an isolate is opaque to the surrounding resolution pass: neutrals on
 * either side of it resolve against the Arabic paragraph, not against the Latin
 * run. That is the whole point — an embedding leaks, an isolate does not.
 *
 * Text is ALWAYS stored in logical order. We never reorder characters: a
 * visually-ordered string is uneditable and uncopyable inside Canva. Control
 * characters only.
 */

// ---------------------------------------------------------------------------
// Control characters
// ---------------------------------------------------------------------------

const CONTROLS = {
  RLE: '‫', // RIGHT-TO-LEFT EMBEDDING  — paragraph direction
  PDF: '‬', // POP DIRECTIONAL FORMATTING
  LRI: '⁦', // LEFT-TO-RIGHT ISOLATE    — inline Latin/number runs
  PDI: '⁩', // POP DIRECTIONAL ISOLATE
  RLM: '‏', // right-to-left mark — anchors neutrals; sets no box direction
  LRM: '‎',
};

const { RLE, PDF, LRI, PDI } = CONTROLS;

/** Every bidi formatting character we ever emit or need to strip. */
const BIDI_CONTROL_RE = /[‪-‮⁦-⁩‎‏؜]/g;

const CONTROL_NAMES = {
  '‪': 'LRE', '‫': 'RLE', '‬': 'PDF',
  '‭': 'LRO', '‮': 'RLO',
  '⁦': 'LRI', '⁧': 'RLI', '⁨': 'FSI', '⁩': 'PDI',
  '‎': 'LRM', '‏': 'RLM', '؜': 'ALM',
};

// ---------------------------------------------------------------------------
// Script detection
// ---------------------------------------------------------------------------

/** Arabic *letters* only — excludes Arabic digits and Arabic punctuation. */
const ARABIC_LETTER_RE =
  /[ء-يٮ-ۓەۺ-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

const LATIN_LETTER_RE = /[A-Za-zÀ-ɏ]/;

/** Arabic combining marks (harakat, shadda, sukun, tanween). */
const HARAKAT_RE = /[ً-ْٰۖ-ۭ]/;

const TATWEEL = 'ـ';

function hasArabic(text) {
  return ARABIC_LETTER_RE.test(String(text || ''));
}

function hasLatin(text) {
  return LATIN_LETTER_RE.test(String(text || ''));
}

function hasHarakat(text) {
  return HARAKAT_RE.test(String(text || ''));
}

/** Share of letters that are Arabic, 0..1. Returns 0 when there are no letters. */
function arabicRatio(text) {
  const s = String(text || '');
  let arabic = 0;
  let latin = 0;
  for (const ch of s) {
    if (ARABIC_LETTER_RE.test(ch)) arabic++;
    else if (LATIN_LETTER_RE.test(ch)) latin++;
  }
  const total = arabic + latin;
  return total === 0 ? 0 : arabic / total;
}

/** Unicode P2/P3: direction of the first strong character. */
function baseDirection(text) {
  for (const ch of stripBidiControls(String(text || ''))) {
    if (ARABIC_LETTER_RE.test(ch) || /[֐-׿]/.test(ch)) return 'rtl';
    if (LATIN_LETTER_RE.test(ch)) return 'ltr';
  }
  return 'neutral';
}

// ---------------------------------------------------------------------------
// Control-character hygiene
// ---------------------------------------------------------------------------

function stripBidiControls(text) {
  return String(text || '').replace(BIDI_CONTROL_RE, '');
}

function hasBidiControls(text) {
  BIDI_CONTROL_RE.lastIndex = 0;
  return BIDI_CONTROL_RE.test(String(text || ''));
}

/** Length as a reader sees it — control characters do not occupy space. */
function visibleLength(text) {
  return Array.from(stripBidiControls(text)).length;
}

/** Render control characters visibly, for previews and diffs. */
function escapeControls(text) {
  return String(text || '').replace(BIDI_CONTROL_RE, (ch) => `<${CONTROL_NAMES[ch] || 'CTL'}>`);
}

/** True when every RLE/LRI has its matching PDF/PDI, correctly nested. */
function controlsBalanced(text) {
  const stack = [];
  for (const ch of String(text || '')) {
    if (ch === '‪' || ch === RLE || ch === '‭' || ch === '‮') stack.push('PDF');
    else if (ch === LRI || ch === '⁧' || ch === '⁨') stack.push('PDI');
    else if (ch === PDF) { if (stack.pop() !== 'PDF') return false; }
    else if (ch === PDI) { if (stack.pop() !== 'PDI') return false; }
  }
  return stack.length === 0;
}

// ---------------------------------------------------------------------------
// Protected spans: runs that must stay LTR and must not be "Arabicised"
// ---------------------------------------------------------------------------

const SPAN_PATTERNS = [
  ['code', /`[^`\n]*`/g],
  ['url', /(?:https?:\/\/|www\.)[^\s؀-ۿ؜]+/gi],
  ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
  ['phone', /\+\d[\d  ()\-]{4,}\d/g],
  // A Latin phrase may carry its own ASCII punctuation between words
  // ("Hello, World") — that comma belongs to the English, not to the Arabic.
  // A leading @ or # belongs to the handle it marks: left outside the isolate,
  // "@kitabwbs" renders as "kitabwbs@" with the sigil stranded at the far edge.
  ['latin', /[@#]?[A-Za-zÀ-ɏ][A-Za-z0-9À-ɏ._'&/+-]*(?:[,;:]? [A-Za-z0-9À-ɏ][A-Za-z0-9À-ɏ._'&/+-]*)*/g],
  ['number', /[+-]?[$€£¥]?\d+(?:[.,:/-]\d+)*%?/g],
];

/** Trailing characters that belong to the sentence, not to the run. */
const TRAILING_JUNK_RE = /[.,;:!?'"-]+$/;

/**
 * Find the runs inside one line that must be isolated from the Arabic around
 * them. Spans never overlap; two spans separated by a single space are merged
 * so that "5 GB" becomes one isolate rather than two.
 */
function scanProtectedSpans(line) {
  const src = String(line || '');
  const found = [];

  SPAN_PATTERNS.forEach(([kind, re], rank) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      if (m[0] === '') { re.lastIndex++; continue; }
      let start = m.index;
      let end = start + m[0].length;
      if (kind !== 'code') {
        const trimmed = src.slice(start, end).replace(TRAILING_JUNK_RE, '');
        end = start + trimmed.length;
      }
      if (end > start) found.push({ start, end, kind, rank });
    }
  });

  // Longest match at a given start wins; ties break by pattern order.
  found.sort((a, b) => a.start - b.start || b.end - a.end || a.rank - b.rank);

  const kept = [];
  for (const span of found) {
    const last = kept[kept.length - 1];
    if (last && span.start < last.end) continue; // overlapped by an earlier win
    kept.push({ start: span.start, end: span.end, kind: span.kind });
  }

  const merged = [];
  for (const span of kept) {
    const last = merged[merged.length - 1];
    const joinable = last && last.kind !== 'code' && span.kind !== 'code';
    if (joinable && span.start - last.end === 1 && src[last.end] === ' ') {
      last.end = span.end;
      last.kind = 'mixed';
      continue;
    }
    merged.push({ ...span });
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Change log
// ---------------------------------------------------------------------------

function bump(changes, rule, sample) {
  if (!changes) return;
  const hit = changes.find((c) => c.rule === rule && c.sample === sample);
  if (hit) hit.count++;
  else changes.push({ rule, sample, count: 1 });
}

// ---------------------------------------------------------------------------
// 1. Arabic punctuation
// ---------------------------------------------------------------------------

const PUNCT_MAP = { ',': '،', ';': '؛', '?': '؟' };

/**
 * ASCII punctuation -> Arabic punctuation, skipping protected spans so that
 * "1,234", "a,b" inside `code`, and "?q=1" in a URL are left alone.
 *
 * Straight double quotes become guillemets «…». If they are unbalanced we make
 * no change and record the problem instead of emitting a stray «.
 */
function arabicPunctuation(line, changes) {
  const src = String(line || '');
  const spans = scanProtectedSpans(src);
  const protectedAt = new Array(src.length).fill(false);
  for (const s of spans) for (let i = s.start; i < s.end; i++) protectedAt[i] = true;

  let straightQuotes = 0;
  for (let i = 0; i < src.length; i++) {
    if (!protectedAt[i] && src[i] === '"') straightQuotes++;
  }
  const quotesBalanced = straightQuotes % 2 === 0;
  if (!quotesBalanced) bump(changes, 'quotes-unbalanced', `${straightQuotes} × "`);

  let out = '';
  let expectOpening = true;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (protectedAt[i]) { out += ch; continue; }

    if (PUNCT_MAP[ch]) {
      out += PUNCT_MAP[ch];
      bump(changes, 'punctuation', `${ch} → ${PUNCT_MAP[ch]}`);
      continue;
    }
    if (ch === '“' || ch === '”') {
      const rep = ch === '“' ? '«' : '»';
      out += rep;
      bump(changes, 'quotes', `${ch} → ${rep}`);
      continue;
    }
    if (ch === '"' && quotesBalanced) {
      const rep = expectOpening ? '«' : '»';
      expectOpening = !expectOpening;
      out += rep;
      bump(changes, 'quotes', `" → ${rep}`);
      continue;
    }
    out += ch;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. Mirrored brackets
// ---------------------------------------------------------------------------

const BRACKET_PAIRS = [['(', ')'], ['[', ']'], ['{', '}'], ['<', '>']];

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Unicode rule L4 mirrors brackets at RENDER time: once the paragraph resolves
 * RTL, a stored "(" is painted as ")". So rewriting "(" to ")" in the source
 * would mirror twice and break the design. We therefore never swap a correctly
 * ordered pair.
 *
 * What we do fix is the pair a human already mirrored by hand — ")نص(" — which
 * is stored backwards and renders backwards once RTL is forced. We restore it
 * to logical order and let the renderer do the mirroring.
 */
function fixBracketOrder(line, changes) {
  let out = String(line || '');
  for (const [open, close] of BRACKET_PAIRS) {
    const re = new RegExp(
      `${escapeRe(close)}([^${escapeRe(open)}${escapeRe(close)}]*)${escapeRe(open)}`,
      'g'
    );
    out = out.replace(re, (whole, inner) => {
      if (!ARABIC_LETTER_RE.test(inner)) return whole;
      bump(changes, 'bracket-order', `${close}…${open} → ${open}…${close}`);
      return open + inner + close;
    });
  }
  return out;
}

/** Report-only: brackets that never close (or close without opening). */
function findBracketIssues(text) {
  const src = stripBidiControls(text);
  const issues = [];
  for (const [open, close] of BRACKET_PAIRS) {
    if (open === '<') continue; // < and > are too often arithmetic to count
    const opened = (src.match(new RegExp(escapeRe(open), 'g')) || []).length;
    const closed = (src.match(new RegExp(escapeRe(close), 'g')) || []).length;
    if (opened !== closed) {
      issues.push({ pair: `${open}${close}`, opened, closed });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// 3. Isolating LTR runs
// ---------------------------------------------------------------------------

/** Wrap every Latin / digit / URL / email / phone run in LRI … PDI. */
function isolateLTRRuns(line, changes) {
  const src = String(line || '');
  const spans = scanProtectedSpans(src);
  if (spans.length === 0) return src;

  let out = '';
  let cursor = 0;
  for (const span of spans) {
    const run = src.slice(span.start, span.end);
    out += src.slice(cursor, span.start) + LRI + run + PDI;
    cursor = span.end;
    bump(changes, 'isolate', run);
  }
  return out + src.slice(cursor);
}

// ---------------------------------------------------------------------------
// 4. Forcing the paragraph direction
// ---------------------------------------------------------------------------

function wrapRTL(line) {
  const src = String(line || '');
  if (src === '') return src;
  return RLE + src + PDF;
}

// ---------------------------------------------------------------------------
// The pipeline
// ---------------------------------------------------------------------------

const DEFAULT_OPTIONS = {
  punctuation: true,
  brackets: true,
  isolate: true,
  rtl: true,
};

/**
 * Full logical-order repair for one text element.
 *
 * Runs line by line. Lines with no Arabic letters are returned untouched — a
 * pure-Latin caption inside an Arabic design must stay LTR.
 *
 * Idempotent: existing bidi controls are stripped before anything else, so
 * running this twice produces the same string as running it once.
 *
 * @returns {{text: string, changed: boolean, changes: Array}}
 */
function fixText(input, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const original = String(input == null ? '' : input);
  const plain = stripBidiControls(original);
  const changes = [];

  if (plain !== original) bump(changes, 'reset-controls', 'stripped existing bidi controls');

  const out = plain
    .split('\n')
    .map((line) => {
      if (!hasArabic(line)) return line;
      let s = line;
      if (opts.punctuation) s = arabicPunctuation(s, changes);
      if (opts.brackets) s = fixBracketOrder(s, changes);
      if (opts.isolate) s = isolateLTRRuns(s, changes);
      if (opts.rtl && s.trim() !== '') {
        s = wrapRTL(s);
        bump(changes, 'rtl-wrap', 'RLE…PDF');
      }
      return s;
    })
    .join('\n');

  return { text: out, changed: out !== original, changes };
}

// ---------------------------------------------------------------------------
// 5. Anchoring — what Canva's editor honours
// ---------------------------------------------------------------------------

// A letter resolves itself; anything else at a line's edge — a digit, «؟»,
// «،», a quote, an emoji — takes its side from its neighbours. The Arabic
// block holds digits and punctuation too, so the test is "letter", not block.
const LETTER_RE = /\p{L}/u;
const LETTER_OR_DIGIT_RE = /[\p{L}\p{Nd}]/u;
const { RLM, LRM } = CONTROLS;

/**
 * A line with no Arabic in it — a handle, a link — in a box Canva set
 * right-to-left paints «@kitabwbs» as kitabwbs@, which is why Canva's own
 * generator stores such lines in visual order. An LRM against a loose edge
 * holds it left-to-right in either kind of box.
 */
/** «kitabwbs@»: a handle typed in the order it is seen. Nothing ends in @. */
const VISUAL_HANDLE_RE = /(?:^|\s)[\p{L}\p{Nd}_.]+[@#](?=\s|$)/u;

function anchorLatinLine(line, changes) {
  // Anchoring a visual-order handle would pin it the wrong way round for good.
  // It is reported instead (cli.js), with the logical form ready.
  if (VISUAL_HANDLE_RE.test(line)) return line;
  const lead = line.length - line.trimStart().length;
  const tail = line.trimEnd().length;
  if (tail <= lead) return line;
  const body = Array.from(line.slice(lead, tail));
  const open = LETTER_OR_DIGIT_RE.test(body[0]) ? '' : LRM;
  const close = LETTER_OR_DIGIT_RE.test(body[body.length - 1]) ? '' : LRM;
  if (open || close) bump(changes, 'anchor-run', line.slice(lead, tail));
  return line.slice(0, lead) + open + line.slice(lead, tail) + close + line.slice(tail);
}

/**
 * Text for an existing Canva design: logical order, and a strong mark only where
 * a neutral would otherwise resolve against the wrong side.
 *
 *   - An RLM at each end of an Arabic line whose edge is not a letter — a
 *     period, «؟», a quote, a digit, an emoji. In a right-to-left box it changes
 *     nothing; in a box Canva turned left-to-right it keeps «غيرك.» reading
 *     with the period on the left (measured).
 *   - An LRM on each side of a Latin, number, handle or link run that starts or
 *     ends with something other than a letter or digit: «@kitabwbs» paints
 *     whole instead of as kitabwbs@ (measured), «+966…» keeps its plus.
 *
 * Idempotent: every existing control is stripped first.
 */
function anchorText(input) {
  const original = String(input == null ? '' : input);
  const plain = stripBidiControls(original);
  const changes = [];
  if (plain !== original) bump(changes, 'reset-controls', 'stripped existing bidi controls');

  const out = plain
    .split('\n')
    .map((line) => {
      if (!hasArabic(line)) return hasLatin(line) ? anchorLatinLine(line, changes) : line;
      let s = arabicPunctuation(line, changes);
      s = fixBracketOrder(s, changes);

      let built = '';
      let cursor = 0;
      for (const span of scanProtectedSpans(s)) {
        const run = s.slice(span.start, span.end);
        const chars = Array.from(run);
        const loose = !LETTER_OR_DIGIT_RE.test(chars[0]) || !LETTER_OR_DIGIT_RE.test(chars[chars.length - 1]);
        built += s.slice(cursor, span.start) + (loose ? LRM + run + LRM : run);
        if (loose) bump(changes, 'anchor-run', run);
        cursor = span.end;
      }
      s = built + s.slice(cursor);

      // The marks go against the first and last visible characters, not outside
      // the line's spaces, so each one stays part of a word.
      const lead = s.length - s.trimStart().length;
      const tail = s.trimEnd().length;
      if (tail <= lead) return s;
      const body = Array.from(s.slice(lead, tail));
      const first = body[0];
      const last = body[body.length - 1];
      const open = LETTER_RE.test(first) ? '' : RLM;
      const close = LETTER_RE.test(last) ? '' : RLM;
      if (open) bump(changes, 'anchor-line', first);
      if (close) bump(changes, 'anchor-line', last);
      return s.slice(0, lead) + open + s.slice(lead, tail) + close + s.slice(tail);
    })
    .join('\n');

  return { text: out, changed: out !== original, changes };
}

// ---------------------------------------------------------------------------
// Truncation
// ---------------------------------------------------------------------------

/**
 * Truncate by visible length, never inside a bidi control pair.
 *
 * Works on the plain string and returns a plain string: the caller re-runs
 * fixText() afterwards so the ellipsis ends up inside the RLE…PDF wrapper. In
 * an RTL paragraph the ellipsis stays last in logical order, which paints it on
 * the LEFT — the correct side. Putting "…" first in the source would be a
 * visual-order hack and is exactly what we refuse to do.
 */
function truncate(text, maxChars, ellipsis = '…') {
  const plain = stripBidiControls(text);
  const chars = Array.from(plain);
  if (chars.length <= maxChars) return plain;

  const budget = Math.max(0, maxChars - Array.from(ellipsis).length);
  let cut = chars.slice(0, budget).join('');

  // Arabic letters join, so a mid-word cut leaves a dangling connected form.
  // Fall back to the last word boundary unless that throws away most of the box.
  const next = chars[budget];
  if (next !== undefined && !/\s/.test(next)) {
    const lastSpace = cut.lastIndexOf(' ');
    if (lastSpace > 0 && lastSpace >= budget * 0.4) cut = cut.slice(0, lastSpace);
  }
  return cut.replace(/[\s،،؛,;:]+$/, '') + ellipsis;
}

module.exports = {
  CONTROLS,
  ARABIC_LETTER_RE,
  LATIN_LETTER_RE,
  HARAKAT_RE,
  TATWEEL,
  hasArabic,
  hasLatin,
  hasHarakat,
  arabicRatio,
  baseDirection,
  stripBidiControls,
  hasBidiControls,
  visibleLength,
  escapeControls,
  controlsBalanced,
  scanProtectedSpans,
  arabicPunctuation,
  fixBracketOrder,
  findBracketIssues,
  isolateLTRRuns,
  wrapRTL,
  fixText,
  anchorText,
  VISUAL_HANDLE_RE,
  truncate,
};
