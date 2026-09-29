#!/usr/bin/env node
'use strict';

/**
 * from-read.js — Canva response in, cli.js payload out.
 *
 * Copying eighteen elements by hand out of a read-design response and into the
 * payload shape is pure mechanical translation, and it is the step most likely
 * to go wrong. This does it.
 *
 *   node lib/from-read.js read.json > payload.json
 *
 * It takes the response from `read-design` (opened with a transaction) or from
 * `edit-design` — both carry the same element shape, the second with the real
 * post-reflow geometry — and walks the tree rather than following a fixed path,
 * because the nesting differs between fixed and responsive pages.
 *
 * It never invents a value. A field Canva did not return is left absent, so it
 * surfaces downstream as "verify by hand" instead of as a confident wrong fix.
 * The summary on stderr says what it found, so an under-collection is visible
 * immediately rather than three steps later.
 */

const fs = require('fs');

const LOCATOR_KEYS = ['locator_id', 'locatorId', 'locator'];
const PAGE_KEYS = ['page_id', 'pageId'];

const firstOf = (node, keys) => keys.map((k) => node[k]).find((v) => v !== undefined);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

/** camelCase and snake_case both appear in Canva payloads. Accept either. */
function pick(source, ...names) {
  for (const name of names) {
    if (source && source[name] !== undefined && source[name] !== null) return source[name];
  }
  return undefined;
}

/** left/top/width/height, wherever this element happens to keep them. */
function rectOf(node) {
  const box = node.bounds || node.rect || node.box || node;
  const size = node.size || box;
  const pos = node.position || box;
  return {
    left: num(pick(pos, 'left', 'x')),
    top: num(pick(pos, 'top', 'y')),
    width: num(pick(size, 'width', 'w')),
    height: num(pick(size, 'height', 'h')),
  };
}

/**
 * Canva reports the typeface as an opaque reference such as "YAFdJrN-O4g,0".
 * If the response carries a font table anywhere, resolve it to a real name;
 * a name drives font substitution advice, a reference drives nothing.
 */
function buildFontTable(root) {
  const table = new Map();
  walk(root, (node) => {
    const ref = pick(node, 'fontRef', 'font_ref', 'ref', 'id');
    const name = pick(node, 'fontFamily', 'font_family', 'family', 'name', 'displayName');
    if (typeof ref === 'string' && typeof name === 'string' && ref !== name && /[,\-_]/.test(ref)) {
      table.set(ref, name);
    }
  });
  return table;
}

/** formatting -> the style block cli.js reads. Absent stays absent. */
function styleOf(node, fonts) {
  const regions = node.textRegions || node.text_regions;
  const formatting = (Array.isArray(regions) && regions[0] && regions[0].formatting)
    || node.formatting || node.style || {};

  const ref = pick(formatting, 'fontRef', 'font_ref');
  const family = pick(formatting, 'fontFamily', 'font_family')
    || (typeof ref === 'string' ? fonts.get(ref) || ref : undefined);

  const style = {
    font_family: family,
    font_size: num(pick(formatting, 'fontSize', 'font_size')),
    line_height: num(pick(formatting, 'lineHeight', 'line_height')),
    letter_spacing: num(pick(formatting, 'letterSpacing', 'letter_spacing')),
    font_weight: num(pick(formatting, 'fontWeight', 'font_weight')),
    font_style: pick(formatting, 'fontStyle', 'font_style'),
    text_align: pick(formatting, 'textAlign', 'text_align'),
    text_transform: pick(formatting, 'textTransform', 'text_transform'),
    color: pick(formatting, 'color', 'fontColor', 'font_color'),
    background: pick(formatting, 'background', 'backgroundColor', 'background_color'),
  };
  for (const key of Object.keys(style)) if (style[key] === undefined) delete style[key];
  return style;
}

/** The element's text, whether it is flat or split across regions. */
function textOf(node) {
  if (typeof node.text === 'string') return node.text;
  const regions = node.textRegions || node.text_regions;
  if (Array.isArray(regions)) {
    // A live read (2026-09) keeps each region's text under `characters`.
    const joined = regions.map((r) => (typeof r.text === 'string' ? r.text
      : typeof r.characters === 'string' ? r.characters : '')).join('');
    if (joined !== '') return joined;
  }
  return undefined;
}

function walk(node, visit, depth = 0) {
  if (node === null || typeof node !== 'object' || depth > 40) return;
  if (!Array.isArray(node)) visit(node);
  for (const value of Array.isArray(node) ? node : Object.values(node)) {
    walk(value, visit, depth + 1);
  }
}

/** Anything the walk finds that looks like a page: it has a page id or a type. */
function isPage(node) {
  if (firstOf(node, PAGE_KEYS) !== undefined) return true;
  return node.type === 'responsive' || node.type === 'fixed' || node.type === 'page';
}

function convert(response) {
  const fonts = buildFontTable(response);
  const pages = [];
  const seen = new Set();

  walk(response, (node) => {
    if (!isPage(node)) return;
    const page = {
      index: num(pick(node, 'index', 'pageIndex', 'page_index')) ?? pages.length + 1,
      width: num(pick(node, 'width', 'pageWidth')) ?? num(pick(node.dimensions, 'width')),
      height: num(pick(node, 'height', 'pageHeight')) ?? num(pick(node.dimensions, 'height')),
      is_responsive: node.type === 'responsive' || node.is_responsive === true,
      is_editable: pick(node, 'isEditable', 'is_editable'),
      elements: [],
    };
    if (page.is_editable === undefined) delete page.is_editable;
    if (page.width === undefined) delete page.width;
    if (page.height === undefined) delete page.height;

    walk(node, (child) => {
      if (child === node) return;           // the page carries a locator too
      const locator = firstOf(child, LOCATOR_KEYS);
      if (typeof locator !== 'string' || seen.has(locator)) return;
      seen.add(locator);

      const text = textOf(child);
      const element = {
        locator_id: locator,
        type: pick(child, 'type', 'elementType', 'element_type'),
        ...rectOf(child),
      };
      if (text !== undefined) {
        element.text = text;
        element.style = styleOf(child, fonts);
        // More than one run is more than one style in the box — a coloured
        // word in a title. Replacing the whole text flattens every run to the
        // first one's style (measured), so the planner has to know.
        const runs = child.textRegions || child.text_regions;
        if (Array.isArray(runs) && runs.length > 1) element.style_runs = runs.length;
      }
      const alt = pick(child, 'alt_text', 'altText', 'name', 'title');
      if (alt !== undefined) element.alt_text = alt;

      // Canva returns elements in draw order, so the array index IS the stacking
      // order. Without it a highlight bar behind a heading and a veil covering
      // one are the same pair of rectangles.
      element.z = page.elements.length;

      for (const key of Object.keys(element)) if (element[key] === undefined) delete element[key];
      page.elements.push(element);
    });

    pages.push(page);
  });

  return { pages };
}

function summarise(payload, fonts) {
  const elements = payload.pages.flatMap((p) => p.elements);
  const texts = elements.filter((e) => typeof e.text === 'string');
  const missing = (field) => texts.filter((e) => !e.style || e.style[field] === undefined).length;
  return [
    `pages: ${payload.pages.length}`,
    `elements: ${elements.length} (text: ${texts.length})`,
    `fonts resolved: ${fonts}`,
    `missing font_family: ${missing('font_family')}`,
    `missing line_height: ${missing('line_height')}`,
    `missing letter_spacing: ${missing('letter_spacing')}`,
    `with geometry: ${elements.filter((e) => typeof e.height === 'number').length}`,
  ].join(' · ');
}

/**
 * What the walk actually saw, with no content in it.
 *
 * This converter was first written against the shape Canva documents; the
 * `characters` and `dimensions` keys came from a live read. When it mis-reads
 * a response again, the fix needs the
 * key names, not the design — so `--keys` prints the keys alone. Nothing here
 * carries text, a locator, a colour or a font name.
 */
function keyCensus(response) {
  const counts = new Map();
  walk(response, (node) => {
    for (const key of Object.keys(node)) counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, n]) => `${key}×${n}`)
    .join(' ');
}

function main(argv) {
  const args = argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  const response = JSON.parse(file ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8'));

  if (args.includes('--keys')) {
    process.stdout.write(`${keyCensus(response)}\n`);
    return;
  }

  const payload = convert(response);
  const texts = payload.pages.flatMap((p) => p.elements).filter((e) => typeof e.text === 'string');

  if (payload.pages.length === 0 || texts.length === 0) {
    process.stderr.write(
      `from-read: found ${payload.pages.length} page(s) and ${texts.length} text element(s) — `
      + 'that is a shape this converter does not recognise.\n'
      + 'Run it again with --keys and share that line: it prints key names only, no design content.\n'
    );
    process.exit(1);
  }
  process.stderr.write(`from-read: ${summarise(payload, buildFontTable(response).size)}\n`);
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

if (require.main === module) main(process.argv);

module.exports = { convert, buildFontTable };
