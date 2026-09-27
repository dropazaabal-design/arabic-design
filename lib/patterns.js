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

const round = (n) => Math.round(n * 10) / 10;

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
  const { cell = 120, stroke = '#C9A227', weight = 1.1 } = options;
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

const PATTERNS = { girih, zellij, rays };

/** @param {'girih'|'zellij'|'rays'} kind */
function pattern(kind, width, height, options) {
  const make = PATTERNS[kind];
  if (!make) throw new Error(`unknown pattern: ${kind}`);
  return make(width, height, options);
}

module.exports = { pattern, girih, zellij, rays, PATTERNS };
