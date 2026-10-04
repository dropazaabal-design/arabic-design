'use strict';

/**
 * verbatim.js — does the design say what the creator wrote?
 *
 * Canva's generator rewrites. Asked to draw «٦ تصرّفات صغيرة.. تكشف أنك تربّيت
 * جيدًا», it drew «تصرّفات صغيرة.. تكشف أنك ترتّيت جيدًا» — the number gone, one
 * dot moved (measured 2026-09-29). The spell checker sees ترتّيت as an unknown
 * word with three candidates and rightly will not choose. Here there is nothing
 * to choose: the creator's own line is the answer.
 *
 *   - A word the design changed by its harakat, by one letter, or by moving a
 *     handle's @ to the wrong end is put back — word for word, in the element
 *     that holds it, because the right text is known.
 *   - A word the design dropped is reported. Where it goes back is a layout
 *     decision, not a spelling one.
 *   - A digit in the other numeral system is not a change; unifying digits is
 *     the numerals pass's job. Emoji and bare punctuation are not compared:
 *     the generator often draws 👇 as a graphic.
 *
 * The expected lines are the ones the brief asked Canva to draw, verbatim —
 * not the whole post. What went to the caption is not missing from the design.
 */

const { stripBidiControls } = require('./bidi');

const HARAKAT_RE = /[ً-ْٰ]/g;
const EDGE_RE = /^[\s«»"'“”‘’()[\]{}.,:;!?،؛؟…\-–—]+|[\s«»"'“”‘’()[\]{}.,:;!?،؛؟…\-–—]+$/g;
const WORDLIKE_RE = /[\p{L}\p{N}]/u;

/** The word itself: no direction marks, no tatweel, no punctuation at its edges. */
const core = (token) => stripBidiControls(token).replace(/ـ/g, '').replace(EDGE_RE, '');
/** For comparison only: one digit system, so ٦ and 6 are the same word. */
const key = (word) => word.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
  .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
const bare = (word) => key(word).replace(HARAKAT_RE, '');

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = next;
    }
  }
  return row[b.length];
}

function words(text) {
  return String(text || '').split(/\s+/).map(core).filter((w) => WORDLIKE_RE.test(w));
}

/** How the design's word differs from the creator's, or null when it is not a slip of theirs. */
function slip(found, wanted) {
  if (bare(found) === bare(wanted)) return 'harakat';
  // «kitabwbs@» for «@kitabwbs»: a handle typed in visual order.
  if (found.length > 1 && (found === wanted.slice(1) + wanted[0] || found === wanted.slice(-1) + wanted.slice(0, -1))) {
    return 'visual-order';
  }
  if (bare(wanted).length >= 3 && distance(bare(found), bare(wanted)) === 1) return 'letter';
  return null;
}

/**
 * A dropped word goes back beside its neighbour from the same line — the word
 * after it, else the one before — when that neighbour occurs exactly once in
 * the whole design. Offered, not applied: the line may no longer fit its box.
 */
function reinsert(word, line, found) {
  const own = words(line);
  const at = own.indexOf(word);
  for (const [neighbour, before] of [[own[at + 1], true], [own[at - 1], false]]) {
    if (!neighbour) continue;
    const hits = found.filter((f) => key(f.word) === key(neighbour));
    if (hits.length !== 1) continue;
    const anchor = hits[0].word;
    return {
      type: 'find_and_replace_text', locator_id: hits[0].locator_id,
      find_text: anchor, replace_text: before ? `${word} ${anchor}` : `${anchor} ${word}`,
    };
  }
  return null;
}

/**
 * @param {string[]} expected   lines the brief asked the design to carry
 * @param {Array<{locator_id: string, text: string}>} elements  the design's text
 * @returns {{restore: Array, missing: Array}}
 *   restore — {locator_id, find, replace, kind, line}: put the creator's word back
 *   missing — {word, line, candidates?, suggestion?}: absent, or too ambiguous
 *             to put back; `suggestion` re-inserts it beside a unique neighbour
 */
function compare(expected, elements) {
  const found = [];
  for (const element of elements) {
    if (typeof element.text !== 'string') continue;
    for (const word of words(element.text)) found.push({ locator_id: element.locator_id, word });
  }
  const designKeys = new Set(found.map((f) => key(f.word)));
  const wanted = expected.flatMap((line) => words(line).map((word) => ({ word, line })));
  const wantedKeys = new Set(wanted.map((w) => key(w.word)));

  const restore = [];
  const missing = [];
  for (const { word, line } of wanted) {
    if (designKeys.has(key(word))) continue;
    // Only a design word the brief does not account for can be the slip.
    const candidates = found.filter((f) => !wantedKeys.has(key(f.word)) && slip(f.word, word));
    const distinct = [...new Set(candidates.map((c) => c.word))];
    if (distinct.length !== 1) {
      const entry = distinct.length ? { word, line, candidates: distinct } : { word, line };
      const put = distinct.length ? null : reinsert(word, line, found);
      missing.push(put ? { ...entry, suggestion: put } : entry);
      continue;
    }
    for (const c of candidates) {
      if (!restore.some((r) => r.locator_id === c.locator_id && r.find === c.word)) {
        const kind = slip(c.word, word);
        // Put back in logical order and pinned with an LRM, so it reads right
        // whichever way the box runs (see bidi.anchorLatinLine).
        const replace = kind === 'visual-order' && /^[@#]/.test(word) ? `\u200e${word}` : word;
        restore.push({ locator_id: c.locator_id, find: c.word, replace, kind, line });
      }
    }
  }
  return { restore, missing };
}

module.exports = { compare, words, slip, distance };
