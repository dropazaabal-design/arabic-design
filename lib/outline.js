'use strict';

/**
 * outline.js — the text a creator already writes, turned into an outline.
 *
 * Nobody drafts a post as JSON. They write a title, a hook, numbered points
 * with a colon between the point and its explanation, a closing line, a
 * question, a handle — and often the caption underneath. This reads exactly
 * that shape, in either digit system, with or without labels.
 *
 * It also authors the line breaks. Canva lays an imported page out in one font
 * and then substitutes its own, so a line the layout measured as fitting can
 * overflow afterwards; the only defence is a break written into the text. The
 * breaks here fall where a person would put them — at the mark nearest the
 * middle of the line — and anything already broken by hand is left alone.
 */

const LABELS = [
  [/^(?:العنوان|عنوان)$/, 'title'],
  [/^(?:الهوك|الخطّ?اف|المقدّ?مة|التمهيد|الافتتاحية)$/, 'lead'],
  [/^(?:الخاتمة|الختام|الخلاصة)$/, 'closing'],
  [/^(?:السؤال|سؤال|الدعوة|الطلب)$/, 'question'],
  [/^(?:العلامة|التوقيع|الحساب|الهاندل)$/, 'brand'],
  [/^(?:التمهيد\s+العلوي|القسم|السلسلة)$/, 'kicker'],
  [/^(?:النقاط|القائمة|البنود)$/, 'items'],
  [/^(?:الكابشن|الكابتشن|النص\s+المرافق|الوصف)$/, 'caption'],
  [/^(?:الوسوم|الهاشتاغ|الهاشتاقات|هاشتاغ)$/, 'hashtags'],
];

// A numbered point needs its mark after the digit — «1.» «١)» «٣ -». Without
// it, «9 قواعد للهيبة» is a title that happens to start with a number, and a
// creator's titles almost all do.
const ITEM_RE = /^\s*(?:[0-9٠-٩]{1,2}\s*[.)ـ:\-]|[•●▪◦–—])\s*(.+)$/;
const LABEL_RE = /^\s*([^\s:：][^:：]{0,24}?)\s*[:：]\s*(.*)$/;
const HASHTAG_LINE_RE = /^(?:\s*#[\p{L}\p{N}_]+)+\s*$/u;

function labelOf(word) {
  const w = word.trim();
  for (const [re, key] of LABELS) if (re.test(w)) return key;
  return null;
}

/** Split «title: body» at the first colon, dash or em dash. */
function splitItem(text) {
  const m = text.match(/^(.+?)\s*(?:[:：]|\s[—–-]\s)\s*(.+)$/);
  return m ? { title: m[1].trim(), body: m[2].trim() } : { title: text.trim(), body: '' };
}

// ---------------------------------------------------------------------------
// Authored line breaks
// ---------------------------------------------------------------------------

/** A line longer than this gets broken for a 1080px frame at body sizes. */
const BREAK_AT = 34;
const BREAK_MARKS = /[،؛,;]|\.\./g;

/**
 * Break one line where a person would: at the punctuation mark nearest the
 * middle, else at the space nearest it. Existing breaks are respected.
 */
function breakLine(text, limit = BREAK_AT) {
  const src = String(text || '');
  if (src.includes('\n') || src.length <= limit) return src;

  const middle = src.length / 2;
  let best = -1;
  let m;
  BREAK_MARKS.lastIndex = 0;
  while ((m = BREAK_MARKS.exec(src)) !== null) {
    const at = m.index + m[0].length;
    if (at < src.length * 0.25 || at > src.length * 0.8) continue;
    if (best === -1 || Math.abs(at - middle) < Math.abs(best - middle)) best = at;
  }
  if (best === -1) {
    for (let d = 0; d < src.length / 2; d++) {
      for (const i of [Math.floor(middle) - d, Math.floor(middle) + d]) {
        if (src[i] === ' ') { best = i; break; }
      }
      if (best !== -1) break;
    }
  }
  if (best <= 0) return src;
  return `${src.slice(0, best).trimEnd()}\n${src.slice(best).trimStart()}`;
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

/**
 * @param {string} text  a post as the creator writes it
 * @returns {object} an outline for make() — plus `captionText` when a caption
 *                   section was present, and `unparsed` for anything it could
 *                   not place, so nothing is silently dropped.
 */
function parseOutline(text) {
  const outline = { items: [] };
  const unparsed = [];
  const caption = [];
  let mode = null;

  const lines = String(text || '').replace(/\r/g, '').split('\n');

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (mode === 'caption') {
      if (HASHTAG_LINE_RE.test(line)) {
        outline.hashtags = line.match(/#[\p{L}\p{N}_]+/gu).map((t) => t.slice(1));
      } else {
        caption.push(line);
      }
      continue;
    }

    if (HASHTAG_LINE_RE.test(line)) {
      outline.hashtags = line.match(/#[\p{L}\p{N}_]+/gu).map((t) => t.slice(1));
      continue;
    }

    const item = line.match(ITEM_RE);
    if (item) {
      const parts = splitItem(item[1]);
      outline.items.push({ title: parts.title, body: parts.body });
      mode = 'items';
      continue;
    }

    const labelled = line.match(LABEL_RE);
    const key = labelled && labelOf(labelled[1]);
    if (key) {
      const value = labelled[2].trim();
      if (key === 'items') { mode = 'items'; continue; }
      if (key === 'caption') { mode = 'caption'; if (value) caption.push(value); continue; }
      if (key === 'hashtags') {
        outline.hashtags = (value.match(/#?[\p{L}\p{N}_]+/gu) || []).map((t) => t.replace(/^#/, ''));
        continue;
      }
      if (value) outline[key] = value;
      mode = key;
      continue;
    }

    // Unlabelled prose: before the points it is the title, then the lead;
    // after the points it is the closing.
    if (!outline.title) { outline.title = line; continue; }
    if (!outline.items.length && !outline.lead) { outline.lead = line; continue; }
    if (outline.items.length && !outline.closing) { outline.closing = line; continue; }
    unparsed.push(line);
  }

  if (!outline.items.length) delete outline.items;
  if (caption.length) outline.captionText = caption.join('\n');
  if (unparsed.length) outline.unparsed = unparsed;
  return outline;
}

/**
 * Put the authored breaks in. Separate from parsing so a caller that already
 * broke its lines by hand can skip it.
 */
function withBreaks(outline) {
  const out = { ...outline };
  // A title is display type: two short lines read faster than one long one,
  // and «..» is where the creator already paused.
  if (out.title && !out.title.includes('\n')) {
    out.title = out.title.includes('..')
      ? out.title.replace(/\.\.\s*/, '..\n')
      : breakLine(out.title, 22);
  }
  for (const key of ['lead', 'closing', 'question']) {
    if (out[key]) out[key] = breakLine(out[key]);
  }
  if (out.items) out.items = out.items.map((i) => ({ ...i, body: breakLine(i.body) }));
  return out;
}

module.exports = { parseOutline, withBreaks, breakLine, splitItem, LABELS };
