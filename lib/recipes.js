'use strict';

/**
 * recipes.js — variety without a template library.
 *
 * A content creator needs many designs a week, and the obvious way to get them
 * is to import a pile of templates. It is the wrong way here: every template
 * worth having is laid out left to right, sized for Latin x-heights, and picks
 * its fonts from faces with no Arabic coverage. Importing one means repeating
 * the whole repair pass on somebody else's decisions.
 *
 * So the variety is generated. Palettes × type pairings × layouts × patterns
 * multiply into thousands of distinct designs, and every one is Arabic-native,
 * contrast-checked before it is drawn, and built from the same blocks the rest
 * of this plugin already verifies.
 */

const { icon } = require('./patterns');

// ---------------------------------------------------------------------------
// Formats — what a Facebook creator actually posts
// ---------------------------------------------------------------------------

const FORMATS = {
  reel: { width: 1080, height: 1920, safeArea: { top: 80, bottom: 250 } },
  story: { width: 1080, height: 1920, safeArea: { top: 80, bottom: 250 } },
  post: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  carousel: { width: 1080, height: 1350 },
  cover: { width: 1640, height: 856 },
};

// ---------------------------------------------------------------------------
// Palettes — every one passes contrast before it ships
// ---------------------------------------------------------------------------

/**
 * Each of these is verified against every format before it ships — a palette
 * that fails contrast is a defect, not a style. Two shipped shades had to be
 * darkened to get here: #64748b on #f1f5f9 measured 4.34:1 and #6B7358 on
 * #F2F4EC measured 4.49:1, both under the 4.5:1 floor for body text.
 */
const PALETTES = {
  midnight: { bg: '#0B1F2A', card: '#13303D', ink: '#F5EFE0', body: '#D8CEB8', muted: '#9FB3BC', accent: '#C9A227', closing: '#E4C866' },
  paper: { bg: '#f1f5f9', card: '#ffffff', ink: '#111827', body: '#1f2937', muted: '#5e6e85', accent: '#059669', closing: '#047857' },
  sand: { bg: '#F6F1E7', card: '#FFFFFF', ink: '#2B2118', body: '#4A3B2C', muted: '#7A6A57', accent: '#B4552D', closing: '#8C3D1C' },
  ink: { bg: '#111111', card: '#1C1C1C', ink: '#FAFAFA', body: '#D4D4D4', muted: '#9A9A9A', accent: '#E8B931', closing: '#F2CE63' },
  sea: { bg: '#062A3A', card: '#0C3C50', ink: '#EAF6FA', body: '#C2DEE7', muted: '#8FB3BF', accent: '#3FB6C8', closing: '#6FD3E1' },
  olive: { bg: '#F2F4EC', card: '#FFFFFF', ink: '#1E2415', body: '#39412C', muted: '#687055', accent: '#4A6B22', closing: '#3B5618' },
  plum: { bg: '#1A0F1E', card: '#2A1A30', ink: '#F7EFF8', body: '#DCC9E0', muted: '#A791AC', accent: '#C77DBB', closing: '#D89FCD' },
  clay: { bg: '#FBF3EE', card: '#FFFFFF', ink: '#2A1C16', body: '#453026', muted: '#7C6154', accent: '#A8432A', closing: '#83301C' },
  steel: { bg: '#0F172A', card: '#1E293B', ink: '#F8FAFC', body: '#CBD5E1', muted: '#94A3B8', accent: '#38BDF8', closing: '#7DD3FC' },
  mint: { bg: '#ECFDF5', card: '#FFFFFF', ink: '#052E1B', body: '#14532D', muted: '#4B7C62', accent: '#047857', closing: '#065F46' },
  // Flat infographic: near-white ground, one blue, and a text grey that is a
  // solid stand-in for #222831 at 65% — an opacity does not survive the import
  // as a colour, and a solid value is what the contrast check can read.
  focus: {
    bg: '#F8FAFC', card: '#FFFFFF', ink: '#222831', body: '#222831', muted: '#6D7278',
    accent: '#2E7BC5', closing: '#222831', fill: '#E6EDF3', rule: '#D2D4D7',
    // Used on the step numbers, which are display-sized: #2E7BC5 measures
    // 4.22:1 here and #E63946 3.98:1, both over the 3:1 large-text floor and
    // both under 4.5:1, so neither is ever set on body copy. The brief's
    // #10B981 measures 2.42:1 — under even the large floor — so the green
    // that ships is #059669 at 3.6:1.
    alert: '#E63946', success: '#059669',
  },
};

// ---------------------------------------------------------------------------
// Type pairings — display face and reading face
// ---------------------------------------------------------------------------

const PAIRINGS = {
  editorial: { display: 'Amiri', body: 'Tajawal' },
  modern: { display: 'Tajawal', body: 'Tajawal' },
  civic: { display: 'Cairo', body: 'Tajawal' },
  kufic: { display: 'Reem Kufi', body: 'Almarai' },
  clean: { display: 'Alexandria', body: 'Readex Pro' },
  classic: { display: 'Noto Kufi Arabic', body: 'Amiri' },
};

const PATTERNS = ['none', 'girih', 'zellij', 'rays'];

// ---------------------------------------------------------------------------
// Layouts — each turns content into blocks
// ---------------------------------------------------------------------------

/**
 * Each layout takes the same shape of content and returns page blocks, so one
 * outline can be re-cut into a different design without rewriting the copy.
 *
 * content: { kicker, title, lead, items[{title, body}], closing, question, brand, iconName }
 */
const LAYOUTS = {
  /** The hook frame that opens a reel. */
  cover: (c, p) => [
    ...(c.iconName ? [{ role: 'topbar', height: 340, bg: p.ink, rule: 8, icon: icon(c.iconName, { stroke: p.bg, size: 96 }) }] : []),
    ...(c.kicker ? [{ role: 'eyebrow', text: c.kicker }] : []),
    { role: 'title', text: c.title },
    ...(c.lead ? [{ role: 'body', text: c.lead }] : []),
    ...(c.brand ? [{ role: 'brand', text: c.brand }] : []),
  ],

  /** Numbered points, the workhorse of list content. */
  list: (c) => [
    ...(c.title ? [{ role: 'title', text: c.title }] : []),
    { role: 'list', items: c.items.map((item, i) => ({ num: item.num ?? ARABIC_ORDINALS[i], title: item.title, body: item.body })) },
    ...(c.closing ? [{ role: 'closing', text: c.closing }] : []),
    ...(c.question ? [{ role: 'question', text: c.question }] : []),
    ...(c.brand ? [{ role: 'brand', text: c.brand }] : []),
  ],

  /** A method in numbered steps: the flat infographic a how-to post wants. */
  steps: (c, p) => [
    ...(c.kicker ? [{ role: 'eyebrow', text: c.kicker, sub: c.kickerSub }] : []),
    ...(c.title ? [{ role: 'title', text: c.title }] : []),
    ...(c.lead ? [{ role: 'body', text: c.lead, sub: c.note }] : []),
    {
      role: 'steps',
      items: c.items.map((item, i) => ({
        num: item.num ?? ARABIC_ORDINALS[i],
        title: item.title,
        body: item.body,
        color: item.color,
        icon: item.iconName
          ? icon(item.iconName, { stroke: item.color || p.accent, size: c.iconSize || 44, weight: 2.6 })
          : null,
      })),
    },
    ...(c.closing ? [{ role: 'closing', text: c.closing }] : []),
    ...(c.question ? [{ role: 'question', text: c.question }] : []),
    ...(c.brand ? [{ role: 'brand', text: c.brand }] : []),
  ],

  /** One sentence, given the whole frame. */
  quote: (c, p) => [
    ...(c.iconName ? [{ role: 'topbar', height: 300, bg: p.ink, rule: 6, icon: icon(c.iconName, { stroke: p.accent, size: 84 }) }] : []),
    { role: 'closing', text: c.title },
    ...(c.lead ? [{ role: 'question', text: c.lead }] : []),
    ...(c.brand ? [{ role: 'brand', text: c.brand }] : []),
  ],

  /** One number carrying the point. */
  stat: (c) => [
    ...(c.kicker ? [{ role: 'eyebrow', text: c.kicker }] : []),
    { role: 'title', text: c.title },
    ...(c.lead ? [{ role: 'body', text: c.lead }] : []),
    ...(c.items ? [{ role: 'cards', items: c.items.map((i, n) => ({ num: i.num ?? ARABIC_ORDINALS[n], label: i.title })) }] : []),
    ...(c.brand ? [{ role: 'brand', text: c.brand }] : []),
  ],

  /** The frame that asks for the comment. */
  closing: (c) => [
    ...(c.closing ? [{ role: 'closing', text: c.closing }] : []),
    { role: 'question', text: c.question },
    ...(c.brand ? [{ role: 'brand', text: c.brand }] : []),
  ],
};

const ARABIC_ORDINALS = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠'];

// ---------------------------------------------------------------------------
// Assembling a spec
// ---------------------------------------------------------------------------

/**
 * @param {object} choice  { format, palette, pairing, pattern, layout }
 * @param {object} content see LAYOUTS
 */
function recipe(choice, content) {
  const format = FORMATS[choice.format] || FORMATS.post;
  const palette = PALETTES[choice.palette] || PALETTES.paper;
  const fonts = PAIRINGS[choice.pairing] || PAIRINGS.modern;
  const layout = LAYOUTS[choice.layout] || LAYOUTS.list;

  return {
    title: content.title,
    size: { width: format.width, height: format.height },
    safeArea: format.safeArea,
    flow: 'spread',
    titleAlign: choice.layout === 'list' ? 'center' : 'start',
    palette,
    fonts,
    pattern: { kind: choice.pattern || 'none' },
    blocks: layout(content, palette),
  };
}

/**
 * One outline becomes a whole reel: a cover frame, the points split across as
 * many frames as they need, and a closing frame that asks for the comment.
 *
 * Splitting is the honest answer to a frame that will not hold the copy —
 * shrinking the type below the Arabic minimum is not. `perPage` is how many
 * points sit on one frame; three is what fits a 1080×1920 with a heading.
 */
function reel(choice, content, { perPage = 3 } = {}) {
  const spec = recipe({ ...choice, layout: 'list' }, content);
  const palette = spec.palette;
  const pages = [];

  pages.push({ label: 'الغلاف', blocks: LAYOUTS.cover(content, palette) });

  for (let i = 0; i < content.items.length; i += perPage) {
    // The running number is set BEFORE the layout runs. Fixing it afterwards
    // does nothing: the layout has already filled num from the slice-local
    // index, so every frame restarted at ١.
    const slice = content.items
      .slice(i, i + perPage)
      .map((item, k) => ({ ...item, num: item.num ?? ARABIC_ORDINALS[i + k] }));
    pages.push({
      label: `النقاط ${i + 1}–${i + slice.length}`,
      blocks: LAYOUTS.list({ ...content, title: null, closing: null, question: null, brand: null, items: slice }, palette),
    });
  }

  pages.push({ label: 'الخاتمة', blocks: LAYOUTS.closing(content, palette) });

  delete spec.blocks;
  spec.pages = pages;
  return spec;
}

/** Every distinct look this library can produce. */
function combinations() {
  return Object.keys(PALETTES).length
    * Object.keys(PAIRINGS).length
    * PATTERNS.length
    * Object.keys(LAYOUTS).length;
}

module.exports = {
  FORMATS, PALETTES, PAIRINGS, PATTERNS, LAYOUTS, ARABIC_ORDINALS,
  recipe, reel, combinations,
};
