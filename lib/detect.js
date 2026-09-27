'use strict';

/**
 * detect.js — fonts, glyph failures, box fit, contrast and layout mirroring.
 *
 * Canva's MCP surface has no operation that changes a typeface, so every font
 * problem found here lands in the manual report with a named substitute. The
 * overflow numbers are estimates from an advance-width model, not measurements:
 * they are labelled as such and the skills confirm them against a thumbnail.
 */

const { stripBidiControls, hasArabic, ARABIC_LETTER_RE, LATIN_LETTER_RE, HARAKAT_RE } = require('./bidi');
const { toNumber } = require('./numerals');

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

/** Faces known to ship Arabic coverage. */
const ARABIC_FONTS = [
  'Tajawal', 'Cairo', 'Almarai', 'IBM Plex Sans Arabic', 'Noto Kufi Arabic',
  'Noto Naskh Arabic', 'Noto Sans Arabic', 'Amiri', 'Lateef', 'Scheherazade New',
  'Changa', 'El Messiri', 'Harmattan', 'Mada', 'Markazi Text', 'Reem Kufi',
  'Aref Ruqaa', 'Kufam', 'Readex Pro', 'Alexandria', 'Baloo Bhaijaan 2',
  'Dubai', 'Arial', 'Tahoma', 'Times New Roman', 'Segoe UI', 'Noto Sans',
];

/** Faces known to have no Arabic coverage at all — these produce tofu. */
const LATIN_ONLY_FONTS = [
  'Montserrat', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Inter', 'Nunito',
  'Oswald', 'Raleway', 'Playfair Display', 'Bebas Neue', 'Anton', 'Merriweather',
  'Quicksand', 'Josefin Sans', 'Abril Fatface', 'Pacifico', 'Lobster',
  'Dancing Script', 'Great Vibes', 'League Spartan', 'Archivo Black',
  'Futura', 'Century Gothic', 'Brush Script', 'Garamond', 'Didot', 'Bodoni',
];

/** What to reach for when a Latin face has to be replaced. */
const SUBSTITUTES = [
  [/montserrat|poppins|raleway|futura|century gothic|josefin|quicksand/i,
    ['Tajawal', 'Almarai', 'Alexandria']],
  [/playfair|merriweather|garamond|didot|bodoni|times/i,
    ['Amiri', 'Noto Naskh Arabic', 'Markazi Text']],
  [/oswald|bebas|anton|archivo black|league spartan/i,
    ['Reem Kufi', 'Noto Kufi Arabic', 'Changa']],
  [/pacifico|lobster|dancing|great vibes|brush/i,
    ['Aref Ruqaa', 'El Messiri']],
];

const DEFAULT_SUBSTITUTES = ['Tajawal', 'Cairo', 'IBM Plex Sans Arabic'];

/** Weights each Arabic face actually ships. Arabic families are thinner on top. */
const FONT_WEIGHTS = {
  Tajawal: [200, 300, 400, 500, 700, 800, 900],
  Cairo: [200, 300, 400, 500, 600, 700, 800, 900, 1000],
  Almarai: [300, 400, 700, 800],
  'IBM Plex Sans Arabic': [100, 200, 300, 400, 500, 600, 700],
  'Noto Kufi Arabic': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'Noto Naskh Arabic': [400, 500, 600, 700],
  'Noto Sans Arabic': [100, 200, 300, 400, 500, 600, 700, 800, 900],
  Amiri: [400, 700],
  Changa: [200, 300, 400, 500, 600, 700, 800],
  'Reem Kufi': [400, 500, 600, 700],
  'El Messiri': [400, 500, 600, 700],
  Alexandria: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  'Readex Pro': [200, 300, 400, 500, 600, 700],
  Mada: [200, 300, 400, 500, 600, 700, 900],
};

const normalise = (name) => String(name || '').trim().toLowerCase();

/**
 * @returns {{name, arabicCapable: true|false|null, suggestions: string[], note: string}}
 *   arabicCapable === null means "unknown face, verify visually" — we do not
 *   accuse a font we have never heard of.
 */
function checkFont(name) {
  const n = normalise(name);
  const known = (list) => list.some((f) => normalise(f) === n);

  if (n === '') {
    return { name, arabicCapable: null, suggestions: DEFAULT_SUBSTITUTES, note: 'اسم الخط غير معروف من القراءة.' };
  }
  if (known(ARABIC_FONTS) || /arabic|kufi|naskh|ruqaa|thuluth|diwani/.test(n)) {
    return { name, arabicCapable: true, suggestions: [], note: 'خط يدعم العربية.' };
  }
  if (known(LATIN_ONLY_FONTS)) {
    return {
      name, arabicCapable: false,
      suggestions: suggestFonts(name),
      note: 'خط لاتيني بلا تغطية عربية — الحروف ستظهر مربّعات (tofu) أو منفصلة.',
    };
  }
  return {
    name, arabicCapable: null,
    suggestions: suggestFonts(name),
    note: 'خط غير مصنّف. تحقّق بصريًا من اتصال الحروف قبل التسليم.',
  };
}

function suggestFonts(name) {
  for (const [pattern, list] of SUBSTITUTES) {
    if (pattern.test(String(name || ''))) return list;
  }
  return DEFAULT_SUBSTITUTES;
}

/** Nearest weight the Arabic face actually has. Ties round down. */
function mapWeight(arabicFont, latinWeight) {
  const weights = FONT_WEIGHTS[arabicFont];
  if (!weights) return latinWeight;
  return weights.reduce((best, w) =>
    Math.abs(w - latinWeight) < Math.abs(best - latinWeight) ? w : best, weights[0]);
}

/** More than two families in one design reads as an accident. */
function fontCensus(elements) {
  const families = [...new Set(
    elements.map((e) => e.font_family).filter(Boolean).map((f) => String(f).trim())
  )];
  if (families.length <= 2) return [];
  return [{
    rule: 'font-sprawl',
    severity: 'warning',
    families,
    message: `${families.length} خطوط مختلفة في تصميم واحد: ${families.join('، ')}. اقتصر على خطّين.`,
  }];
}

// ---------------------------------------------------------------------------
// Glyph failures
// ---------------------------------------------------------------------------

const PRESENTATION_FORMS_RE = /[ﭐ-﷿ﹰ-﻿]/;

/** Signs the text itself is already broken, before anything is rendered. */
function findGlyphFailures(text) {
  const src = String(text || '');
  const out = [];
  if (src.includes('�')) {
    out.push({ rule: 'replacement-char', severity: 'error', message: 'يحتوي النص على محرف بديل (U+FFFD) — تلف في الترميز.' });
  }
  if (/[-]/.test(src)) {
    out.push({ rule: 'private-use', severity: 'error', message: 'محارف من نطاق الاستعمال الخاص — أيقونة خط ستظهر مربّعًا عند التصدير.' });
  }
  if (PRESENTATION_FORMS_RE.test(src)) {
    out.push({
      rule: 'presentation-forms', severity: 'error',
      message: 'النص مخزَّن بأشكال العرض العربية (Presentation Forms) بدل الحروف الأساسية — غير قابل للبحث ولا للتشكيل السليم. أعِد كتابته بالحروف العادية.',
    });
  }
  if (/​/.test(src)) {
    out.push({ rule: 'zero-width-space', severity: 'warning', message: 'مسافات صفرية العرض داخل النص — تكسر اتصال الحروف.' });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Box fit
// ---------------------------------------------------------------------------

/**
 * Arabic runs roughly 25% narrower than the same English copy, and taller once
 * line height is raised for descenders and marks. The refit skill uses both.
 */
const ARABIC_TO_LATIN_WIDTH = 0.75;

/** Average advance width per character, in em. */
const ADVANCE = { arabic: 0.42, latin: 0.52, digit: 0.55, space: 0.26, mark: 0, other: 0.45 };

function advanceOf(ch) {
  if (HARAKAT_RE.test(ch)) return ADVANCE.mark;
  if (ch === ' ' || ch === '\t') return ADVANCE.space;
  if (ARABIC_LETTER_RE.test(ch)) return ADVANCE.arabic;
  if (LATIN_LETTER_RE.test(ch)) return ADVANCE.latin;
  if (/[0-9٠-٩۰-۹]/.test(ch)) return ADVANCE.digit;
  return ADVANCE.other;
}

/** Estimated rendered width in pixels. An estimate, never a measurement. */
function estimateTextWidth(text, fontSize) {
  let em = 0;
  for (const ch of stripBidiControls(text)) em += advanceOf(ch);
  return Math.round(em * fontSize * 100) / 100;
}

/**
 * Greedy word wrap against the box.
 * @returns {{overflows, lines, neededHeight, widestWord, confidence:'estimate'}}
 */
function estimateOverflow({ text, fontSize, width, height, lineHeight = 1.6 }) {
  const src = stripBidiControls(text);
  const spaceWidth = ADVANCE.space * fontSize;

  let lines = 0;
  let widestWord = 0;
  for (const paragraph of src.split('\n')) {
    const words = paragraph.split(/[ \t]+/).filter(Boolean);
    if (words.length === 0) { lines += 1; continue; }
    let used = 0;
    lines += 1;
    for (const word of words) {
      const w = estimateTextWidth(word, fontSize);
      widestWord = Math.max(widestWord, w);
      if (used === 0) used = w;
      else if (used + spaceWidth + w <= width) used += spaceWidth + w;
      else { lines += 1; used = w; }
    }
  }

  const neededHeight = Math.round(lines * fontSize * lineHeight * 100) / 100;
  return {
    overflows: neededHeight > height || widestWord > width,
    lines,
    neededHeight,
    widestWord,
    confidence: 'estimate',
  };
}

/** Font size that would make the text fit, or null when it already fits. */
function refitFontSize({ text, fontSize, width, height, lineHeight = 1.6, min = 14 }) {
  for (let size = fontSize; size >= min; size -= 1) {
    if (!estimateOverflow({ text, fontSize: size, width, height, lineHeight }).overflows) {
      return size === fontSize ? null : size;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Contrast
// ---------------------------------------------------------------------------

function channel(v) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * WCAG AA. The advisory flag carries the Arabic-specific part: thin Arabic
 * strokes lose their edge long before a Latin face of the same weight does, so
 * a bare pass at light weight still deserves a warning.
 */
function checkContrast({ color, background, fontSize = 16, fontWeight = 400 }) {
  const ratio = contrastRatio(color, background);
  const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
  const required = isLarge ? 3 : 4.5;
  const pass = ratio >= required;
  const advisory = pass && fontWeight < 300 && ratio < 7
    ? 'الخطوط العربية الرفيعة تفقد التباين أسرع من اللاتينية — ارفع النسبة إلى 7:1 أو زد الوزن.'
    : null;
  return { ratio, required, pass, advisory };
}

// ---------------------------------------------------------------------------
// Layout mirroring
// ---------------------------------------------------------------------------

const NEVER_MIRROR = /\b(logo|brand|wordmark|photo|photograph|portrait|headshot|play|pause|record|clock|watch|map|flag|signature|qr|barcode|avatar|face|person|product\s?shot)\b/i;
const MIRROR_ME = /\b(arrow|chevron|caret|pointer|next|previous|prev|back|forward|progress|timeline|step|stage|axis|chart|graph|bullet|swipe|slider|quote\s?mark|breadcrumb|flow)\b/i;

/**
 * @returns {true|false|null} null means "cannot tell — ask a human".
 */
function shouldMirror(element = {}) {
  const hay = [element.alt_text, element.name, element.title, element.type]
    .filter(Boolean).join(' ');
  if (hay.trim() === '') return null;
  if (NEVER_MIRROR.test(hay)) return false;
  if (MIRROR_ME.test(hay)) return true;
  return null;
}

/** New left edge for an element mirrored across the page. */
function mirrorX(element, pageWidth) {
  return { left: pageWidth - (element.left + element.width) };
}

const ORDINAL_WORDS = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];
const DIGIT_RUN_RE = /[0-9٠-٩۰-۹]+/;

function sequenceNumber(text) {
  const src = stripBidiControls(text || '');
  const m = src.match(DIGIT_RUN_RE);
  if (m) return toNumber(m[0]);
  const idx = ORDINAL_WORDS.findIndex((w) => src.includes(w));
  return idx === -1 ? null : idx + 1;
}

function sameRow(a, b) {
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.top + a.height, b.top + b.height);
  const overlap = bottom - top;
  return overlap > 0.5 * Math.min(a.height, b.height);
}

/**
 * Arabic reads right to left, so step 1 belongs on the RIGHT. Flags any row of
 * numbered elements whose sequence climbs to the left-to-right.
 */
function checkReadingOrder(elements) {
  const arabic = elements.filter((e) => hasArabic(e.text || ''));
  const issues = [];
  const seen = new Set();

  for (let i = 0; i < arabic.length; i++) {
    if (seen.has(i)) continue;
    const row = [i];
    for (let j = i + 1; j < arabic.length; j++) {
      if (!seen.has(j) && sameRow(arabic[i], arabic[j])) { row.push(j); seen.add(j); }
    }
    if (row.length < 2) continue;

    const members = row.map((k) => ({
      ...arabic[k],
      order: sequenceNumber(arabic[k].text),
      index: k,
    }));
    const numbered = members.filter((m) => m.order !== null);
    const ranked = (numbered.length === members.length ? numbered : members)
      .slice()
      .sort((a, b) => (a.order ?? a.index) - (b.order ?? b.index));

    const climbsRight = ranked.every((m, k) => k === 0 || m.left > ranked[k - 1].left);
    if (climbsRight) {
      issues.push({
        rule: 'reading-order',
        severity: 'error',
        elements: ranked.map((m) => ({ id: m.locator_id || m.id, left: m.left, text: m.text })),
        message: 'تسلسل عناصر عربية يتقدّم من اليسار إلى اليمين. في RTL يبدأ التسلسل من اليمين — اعكس مواضعها بـ position_element.',
      });
    }
  }
  return issues;
}

module.exports = {
  ARABIC_FONTS,
  LATIN_ONLY_FONTS,
  FONT_WEIGHTS,
  ARABIC_TO_LATIN_WIDTH,
  checkFont,
  suggestFonts,
  mapWeight,
  fontCensus,
  findGlyphFailures,
  estimateTextWidth,
  estimateOverflow,
  refitFontSize,
  contrastRatio,
  checkContrast,
  shouldMirror,
  mirrorX,
  checkReadingOrder,
};
