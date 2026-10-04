#!/usr/bin/env node
'use strict';

/**
 * build-lexicon.js — rebuild lib/lexicon/ar.txt.gz from a frequency list.
 *
 *   node tools/build-lexicon.js ar_full.txt lib/lexicon/ar.txt.gz
 *
 * Input is `word count` per line. See lib/lexicon/README.md for the source,
 * its licence, and why the cutoff sits where it does.
 */

const fs = require('fs');
const zlib = require('zlib');
const { normalizeWord, stripHarakat, CUTOFF } = require('../lib/spelling');

const ARABIC_ONLY = /^[ء-ْ]+$/;

function main([, , input, output]) {
  if (!input || !output) {
    process.stderr.write('usage: build-lexicon.js <freq.txt> <out.txt.gz>\n');
    process.exit(2);
  }

  const best = new Map(); // key -> { surface, top, total }
  for (const line of fs.readFileSync(input, 'utf8').split('\n')) {
    const [word, count] = line.split(' ');
    if (!word || !ARABIC_ONLY.test(word)) continue;
    const n = Number(count);
    if (!Number.isFinite(n)) continue;

    const surface = stripHarakat(word).replace(/ـ/g, '');
    if (surface.length < 2) continue;

    const key = normalizeWord(word);
    const entry = best.get(key) || { surface, top: 0, total: 0 };
    entry.total += n;
    if (n > entry.top) { entry.top = n; entry.surface = surface; }
    best.set(key, entry);
  }

  const rows = [...best.values()]
    .filter((e) => e.total >= CUTOFF)
    .sort((a, b) => b.total - a.total)
    .map((e) => `${e.surface} ${e.total}\n`)
    .join('');

  fs.writeFileSync(output, zlib.gzipSync(Buffer.from(rows, 'utf8'), { level: 9 }));
  process.stderr.write(`build-lexicon: ${best.size} keys in, ${rows.split('\n').length - 1} written, `
    + `${(fs.statSync(output).size / 1048576).toFixed(2)} MB gzipped\n`);
}

if (require.main === module) main(process.argv);
