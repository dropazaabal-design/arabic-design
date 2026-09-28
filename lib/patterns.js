'use strict';

/**
 * patterns.js — Islamic geometry, constructed rather than collected.
 *
 * These are built from their actual construction rules, so any size, density
 * and stroke weight is available and nothing is a stock asset someone else's
 * design is also using.
 *
 * Each returns ONE full-canvas SVG string. That is not a stylistic choice: a
 * tiled CSS background (`background-repeat`) survives Canva's HTML importer as
 * one rectangle PER TILE — a 96px tile over a 1080×1350 page came back as some
 * two hundred separate elements. A single image comes back as a single element.
 */

// Integers only: the pattern is inlined into the page as a data URI, and one
// decimal place across a few hundred polygons is several kilobytes of budget.
const round = (n) => Math.round(n);

function svg(width, height, body, { stroke, weight, fill }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" `
    + `viewBox="0 0 ${width} ${height}">`
    + `<g fill="${fill || 'none'}" stroke="${stroke}" stroke-width="${weight}" `
    + `stroke-linejoin="round">${body}</g></svg>`;
}

/**
 * The eight-pointed star — the most common figure in Islamic ornament, built
 * from two squares at 45° with an octagon inscribed between their points.
 */
function girih(width, height, options = {}) {
  const { cell = 135, stroke = '#C9A227', weight = 1.1 } = options;
  const parts = [];

  for (let y = -cell; y < height + cell; y += cell) {
    for (let x = -cell; x < width + cell; x += cell) {
      const cx = x + cell / 2;
      const cy = y + cell / 2;
      const outer = cell * 0.46;
      const inner = outer * 0.4142;          // tan(22.5°) — the octagon's waist

      const star = [];
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i;
        const b = a + Math.PI / 8;
        star.push(`${round(cx + outer * Math.cos(a))},${round(cy + outer * Math.sin(a))}`);
        star.push(`${round(cx + inner * Math.cos(b))},${round(cy + inner * Math.sin(b))}`);
      }
      parts.push(`<polygon points="${star.join(' ')}"/>`);

      const half = outer * 0.3;
      parts.push(`<rect x="${round(cx - half)}" y="${round(cy - half)}" `
        + `width="${round(half * 2)}" height="${round(half * 2)}" `
        + `transform="rotate(45 ${round(cx)} ${round(cy)})"/>`);
    }
  }
  return svg(width, height, parts.join(''), { stroke, weight });
}

/**
 * Zellij strapwork: octagons on a square grid with the squares between them
 * turned 45°, the north-African tile pattern reduced to its skeleton.
 */
function zellij(width, height, options = {}) {
  const { cell = 140, stroke = '#C9A227', weight = 1.1 } = options;
  const parts = [];
  const r = cell * 0.34;
  const k = r * 0.4142;

  for (let y = -cell; y < height + cell; y += cell) {
    for (let x = -cell; x < width + cell; x += cell) {
      const cx = x + cell / 2;
      const cy = y + cell / 2;

      const oct = [];
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i + Math.PI / 8;
        oct.push(`${round(cx + r * Math.cos(a))},${round(cy + r * Math.sin(a))}`);
      }
      parts.push(`<polygon points="${oct.join(' ')}"/>`);

      const d = cell / 2;
      parts.push(`<polygon points="${round(cx + d)},${round(cy)} `
        + `${round(cx + d + k)},${round(cy - k)} ${round(cx + d + k * 2)},${round(cy)} `
        + `${round(cx + d + k)},${round(cy + k)}"/>`);
    }
  }
  return svg(width, height, parts.join(''), { stroke, weight });
}

/**
 * Concentric arcs radiating from one corner — a quieter ground for pages whose
 * type is already busy.
 */
function rays(width, height, options = {}) {
  const { stroke = '#C9A227', weight = 1, count = 18, from = 'top-right' } = options;
  const ox = from.includes('right') ? width : 0;
  const oy = from.includes('bottom') ? height : 0;
  const max = Math.hypot(width, height);
  const parts = [];
  for (let i = 1; i <= count; i++) {
    parts.push(`<circle cx="${ox}" cy="${oy}" r="${round((max / count) * i)}"/>`);
  }
  return svg(width, height, parts.join(''), { stroke, weight });
}

/**
 * Line icons, drawn rather than fetched — a flat design needs one clean mark,
 * not a stock illustration. Stroke colour and weight come from the palette so
 * the icon belongs to the design instead of sitting on top of it.
 */
/**
 * Line icons, drawn rather than fetched — a flat design needs one clean mark,
 * not a stock illustration. Stroke colour and weight come from the palette so
 * the icon belongs to the design instead of sitting on top of it.
 *
 * Each is a body of SVG shapes, not a single path: a tree built from one path
 * read as a balloon on a stick, and a circle is a circle.
 */
const ICONS = {
  tree: '<path d="M32 58V32"/><path d="M32 42l-8-7M32 48l8-7"/>'
    + '<circle cx="32" cy="18" r="11"/><circle cx="21" cy="28" r="8"/><circle cx="43" cy="28" r="8"/>',
  rose: '<path d="M32 58V34"/><path d="M26 48c-5 0-9-4-9-9 5 0 9 4 9 9Z"/>'
    + '<circle cx="32" cy="22" r="10"/><path d="M32 22a6 6 0 0 1 6-6M32 22a6 6 0 0 0-6 6"/>',
  hand: '<path d="M18 36V22a4 4 0 0 1 8 0v10M26 32V16a4 4 0 0 1 8 0v16M34 32V20a4 4 0 0 1 8 0v12"/>'
    + '<path d="M42 32v-6a4 4 0 0 1 8 0v16c0 10-8 18-18 18s-18-8-18-18v-6"/>',
  spark: '<path d="M32 8v14M32 42v14M8 32h14M42 32h14"/>'
    + '<path d="M16 16l10 10M38 38l10 10M48 16L38 26M26 38 16 48"/>',
  quote: '<path d="M26 40c-7 0-12-5-12-12s5-12 12-12v10a6 6 0 0 0 0 12v2Z"/>'
    + '<path d="M50 40c-7 0-12-5-12-12s5-12 12-12v10a6 6 0 0 0 0 12v2Z"/>',
};

/**
 * @param {'tree'|'rose'|'hand'|'spark'|'quote'} name
 * @returns {string} a 64×64 SVG, sized by the caller.
 */
function icon(name, { stroke = '#FFFFFF', weight = 2.4, size = 64 } = {}) {
  const body = ICONS[name];
  if (!body) throw new Error(`unknown icon: ${name}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `
    + `viewBox="0 0 64 64" fill="none" stroke="${stroke}" stroke-width="${weight}" `
    + `stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

const PATTERNS = { girih, zellij, rays };

/** @param {'girih'|'zellij'|'rays'} kind */
function pattern(kind, width, height, options) {
  const make = PATTERNS[kind];
  if (!make) throw new Error(`unknown pattern: ${kind}`);
  return make(width, height, options);
}

module.exports = { pattern, girih, zellij, rays, PATTERNS, icon, ICONS };
