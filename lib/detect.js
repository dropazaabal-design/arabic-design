'use strict';

/**
 * detect.js — fonts, glyph failures, box fit, contrast and layout mirroring.
 *
 * Canva's MCP surface has no operation that changes a typeface, so every font
 * problem found here lands in the manual report with a named substitute. The
 * overflow numbers are estimates from an advance-width model, not measurements:
 * they are labelled as such and the skills confirm them against a thumbnail.
 */

const { stripBidiControls, hasArabic } = require('./bidi');
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
// Measured geometry
// ---------------------------------------------------------------------------

/**
 * Nothing here predicts a layout — it reads one back.
 *
 * Canva grows text boxes on its own: raising line height on a 110.77px element
 * took it to 128.17px with no resize operation sent. Any model that assumes a
 * fixed box is therefore wrong before it starts, and an estimator built on
 * character advance widths fired on 14 of 14 elements in a real design, which
 * is the same as saying nothing.
 *
 * So the fix flow sends text and style first, reads the real geometry out of
 * the edit-design response, and only then decides. These two detectors work on
 * that measured geometry: they compare rectangles, and they report only when
 * two of them genuinely intersect or one has genuinely escaped its container.
 */

/** Sub-pixel slack: rectangles that merely touch are not overlapping. */
const EPSILON = 0.5;

const hasRect = (e) => ['left', 'top', 'width', 'height']
  .every((k) => typeof e[k] === 'number' && Number.isFinite(e[k]));

const right = (e) => e.left + e.width;
const bottom = (e) => e.top + e.height;
const area = (e) => e.width * e.height;

/** Overlapping area in px², 0 when they only touch or miss. */
function intersectionArea(a, b) {
  const w = Math.min(right(a), right(b)) - Math.max(a.left, b.left);
  const h = Math.min(bottom(a), bottom(b)) - Math.max(a.top, b.top);
  return w > EPSILON && h > EPSILON ? w * h : 0;
}

/** True when `outer` fully holds `inner`. */
function contains(outer, inner) {
  return inner.left >= outer.left - EPSILON
    && inner.top >= outer.top - EPSILON
    && right(inner) <= right(outer) + EPSILON
    && bottom(inner) <= bottom(outer) + EPSILON;
}

const isText = (e) => typeof e.text === 'string' && e.text !== '';

/**
 * Elements whose rectangles genuinely cross.
 *
 * Containment is not overlap — a caption sitting inside its card is the design
 * working, not failing. That case belongs to findEscapes.
 */
function findOverlaps(elements) {
  const placed = elements.filter(hasRect);
  const issues = [];

  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      if (!isText(a) && !isText(b)) continue;      // decoration behind decoration
      const overlap = intersectionArea(a, b);
      if (overlap === 0) continue;
      if (contains(a, b) || contains(b, a)) continue;

      // A shape crossing text is two different things depending on draw order.
      // Behind the text it is a highlight bar or a card — the design working as
      // intended. In front of it, it is a veil hiding a line of the copy. The
      // rectangles are identical; only z tells them apart.
      const mixed = isText(a) !== isText(b);
      const zKnown = typeof a.z === 'number' && typeof b.z === 'number';
      const text = isText(a) ? a : b;
      const shape = isText(a) ? b : a;
      if (mixed && zKnown && shape.z < text.z) continue;

      const occlusion = mixed && zKnown && shape.z > text.z;
      const smaller = Math.min(area(a), area(b));
      issues.push({
        rule: 'overlap',
        severity: 'error',
        kind: occlusion ? 'occlusion' : 'collision',
        elements: [a.locator_id, b.locator_id],
        ...(occlusion ? { occludedText: text.locator_id, veil: shape.locator_id } : {}),
        zKnown,
        overlapArea: Math.round(overlap),
        overlapRatio: Math.round((overlap / smaller) * 100) / 100,
        message: occlusion
          ? `${shape.locator_id} مرسوم فوق النص ${text.locator_id} ويحجب منه `
            + `${Math.round(overlap)}px². العلّة في ترتيب الطبقات لا في حجم الخط.`
          : `تراكب مقيس بين ${a.locator_id} و${b.locator_id}: `
            + `${Math.round(overlap)}px² (${Math.round((overlap / smaller) * 100)}٪ من الأصغر).`,
      });
    }
  }
  return issues;
}

/**
 * Text that has grown out of the card, bar or shape holding it.
 *
 * The container is inferred from the measured state rather than remembered.
 * Judging it by how much of the text's AREA sits inside fails exactly when it
 * matters: a box that grew to ten times its card's height has only a tenth of
 * itself inside, so the worst escapes would go unseen. Two stable signals
 * instead — the text box is anchored at its top-left corner and grows down
 * from there, so that corner still lies in the container; and growth is
 * vertical, so the container still spans the text's width. The smallest
 * rectangle satisfying both is the one the text belongs to.
 */
const CONTAINER_WIDTH_SHARE = 0.6;

function isContainerOf(candidate, text) {
  const cornerInside = text.left >= candidate.left - EPSILON
    && text.left <= right(candidate) + EPSILON
    && text.top >= candidate.top - EPSILON
    && text.top <= bottom(candidate) + EPSILON;
  if (!cornerInside) return false;

  const shared = Math.min(right(candidate), right(text)) - Math.max(candidate.left, text.left);
  return shared / text.width >= CONTAINER_WIDTH_SHARE;
}

function findEscapes(elements) {
  const containers = elements.filter((e) => hasRect(e) && !isText(e));
  const issues = [];

  for (const text of elements.filter((e) => hasRect(e) && isText(e))) {
    const holding = containers
      .filter((c) => isContainerOf(c, text))
      .sort((a, b) => area(a) - area(b))[0];
    if (!holding || contains(holding, text)) continue;

    const past = {
      left: Math.round((holding.left - text.left) * 100) / 100,
      top: Math.round((holding.top - text.top) * 100) / 100,
      right: Math.round((right(text) - right(holding)) * 100) / 100,
      bottom: Math.round((bottom(text) - bottom(holding)) * 100) / 100,
    };
    const escaped = Object.fromEntries(Object.entries(past).filter(([, v]) => v > EPSILON));

    issues.push({
      rule: 'container-escape',
      severity: 'error',
      locator_id: text.locator_id,
      container: holding.locator_id,
      past: escaped,
      message: `النص ${text.locator_id} خرج من حاويته ${holding.locator_id} بمقدار `
        + `${Object.entries(escaped).map(([side, v]) => `${side} ${v}px`).join('، ')}.`,
    });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Latin headings with no Arabic beside them
// ---------------------------------------------------------------------------

/** Below this share of Arabic, a Latin string is just part of a Latin design. */
const ARABIC_PAGE_SHARE = 0.6;

/** Things that are supposed to be Latin and carry no Arabic counterpart. */
const TECHNICAL_RE = /^(?:https?:\/\/|www\.)|@|^[#@]|^v?\d+(?:\.\d+)+$|\.(?:com|net|org|io|ai|co|pdf|png|jpe?g|svg|mp4)$/i;

const countLatin = (text) => (String(text).match(/[A-Za-z]/g) || []).length;

/**
 * A Canva generator produced (Kaizen), (Shoshin), (Ganbaru) and (Gaman) after
 * dropping their Arabic names, leaving إيكيغاي (Ikigai) as the only complete one.
 * Four truncated headings in an Arabic design, and nothing noticed.
 *
 * So: on a page that is mostly Arabic, a text element carrying Latin letters and
 * no Arabic at all is suspect. When a sibling at the same size and colour holds
 * both scripts, the pattern is visible in the design itself and the orphan is
 * near-certainly missing its other half — that one is an error, not a question.
 */
function findLatinOrphans(textElements) {
  const texts = textElements.filter((e) => typeof e.text === 'string' && e.text.trim() !== '');
  if (texts.length === 0) return [];

  const arabicShare = texts.filter((e) => hasArabic(e.text)).length / texts.length;

  const styleKey = (e) => `${(e.style || {}).font_size}|${(e.style || {}).color}`;
  const bilingual = new Set(
    texts.filter((e) => hasArabic(e.text) && countLatin(e.text) >= 2).map(styleKey)
  );

  // The share test alone defeats itself: when four of five headings have lost
  // their Arabic, the page stops looking Arabic by that measure — exactly the
  // case this rule exists for. A bilingual sibling settles it on its own,
  // because it shows what the whole set was meant to look like.
  if (arabicShare <= ARABIC_PAGE_SHARE && bilingual.size === 0) return [];

  return texts
    .filter((e) => !hasArabic(e.text) && countLatin(e.text) >= 2 && !TECHNICAL_RE.test(e.text.trim()))
    .filter((e) => arabicShare > ARABIC_PAGE_SHARE || bilingual.has(styleKey(e)))
    .map((e) => {
      const paired = bilingual.has(styleKey(e));
      return {
        rule: 'latin-orphan',
        severity: paired ? 'error' : 'warning',
        locator_id: e.locator_id,
        found: e.text,
        message: paired
          ? `«${e.text}» لاتيني وحده، بينما عنصر شقيق بنفس المقاس واللون يحمل العربية واللاتينية معًا. `
            + 'المقابل العربي ساقط شبه مؤكّد — أضفه.'
          : `«${e.text}» نص لاتيني معزول في تصميم عربي — هل سقط مقابله العربي؟`,
      };
    });
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
  checkFont,
  suggestFonts,
  mapWeight,
  fontCensus,
  findGlyphFailures,
  findLatinOrphans,
  intersectionArea,
  contains,
  findOverlaps,
  findEscapes,
  contrastRatio,
  checkContrast,
  shouldMirror,
  mirrorX,
  checkReadingOrder,
};
