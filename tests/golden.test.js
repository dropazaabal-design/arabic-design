'use strict';

/**
 * Golden tests. Every transform is pinned to an exact input -> expected output.
 * No test framework beyond what ships with Node: `node --test tests/`.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const bidi = require('../lib/bidi');
const numerals = require('../lib/numerals');
const typography = require('../lib/typography');
const detect = require('../lib/detect');
const spelling = require('../lib/spelling');

const { RLE, PDF, LRI, PDI, RLM, LRM } = bidi.CONTROLS;

/** Shorthand: run the full pipeline and return just the text. */
const fix = (s, o) => bidi.fixText(s, o).text;

// ===========================================================================
// bidi — direction
// ===========================================================================

test('bidi: pure Arabic is wrapped in RLE…PDF', () => {
  assert.equal(fix('مرحبا بالعالم'), RLE + 'مرحبا بالعالم' + PDF);
});

test('bidi: pure Latin is left completely untouched', () => {
  assert.equal(fix('Hello, world?'), 'Hello, world?');
});

test('bidi: an empty string stays empty', () => {
  assert.equal(fix(''), '');
});

test('bidi: each line of a multi-line text is wrapped on its own', () => {
  const input = 'العنوان\nHello\nالخاتمة';
  const expected = [RLE + 'العنوان' + PDF, 'Hello', RLE + 'الخاتمة' + PDF].join('\n');
  assert.equal(fix(input), expected);
});

test('bidi: blank lines inside Arabic text are not wrapped', () => {
  assert.equal(fix('سطر\n\nسطر'), RLE + 'سطر' + PDF + '\n\n' + RLE + 'سطر' + PDF);
});

test('bidi: RLM alone is never emitted — it does not work in Canva', () => {
  assert.ok(!fix('مرحبا 2024').includes(bidi.CONTROLS.RLM));
});

test('bidi: output is always balanced', () => {
  const samples = [
    'مرحبا Claude',
    'السعر 100 ريال',
    'راسلنا ali@example.com اليوم',
    'مرحبا\nHello\nالعالم',
  ];
  for (const s of samples) assert.ok(bidi.controlsBalanced(fix(s)), s);
});

// ===========================================================================
// bidi — isolation of LTR runs
// ===========================================================================

test('bidi: a Latin word inside Arabic is isolated with LRI…PDI', () => {
  assert.equal(
    fix('مرحبا Claude كيف حالك'),
    RLE + 'مرحبا ' + LRI + 'Claude' + PDI + ' كيف حالك' + PDF
  );
});

test('bidi: consecutive Latin words become one isolate, not two', () => {
  assert.equal(
    fix('نستعمل Claude Code هنا'),
    RLE + 'نستعمل ' + LRI + 'Claude Code' + PDI + ' هنا' + PDF
  );
});

test('bidi: a number is isolated', () => {
  assert.equal(
    fix('السعر 100 ريال'),
    RLE + 'السعر ' + LRI + '100' + PDI + ' ريال' + PDF
  );
});

test('bidi: a number and the unit after it form a single isolate', () => {
  assert.equal(
    fix('المساحة 5 GB فقط'),
    RLE + 'المساحة ' + LRI + '5 GB' + PDI + ' فقط' + PDF
  );
});

test('bidi: a decimal with a thousands separator stays intact', () => {
  assert.equal(
    fix('المبلغ 1,234.50 ريال'),
    RLE + 'المبلغ ' + LRI + '1,234.50' + PDI + ' ريال' + PDF
  );
});

test('bidi: a currency symbol stays glued to its number', () => {
  assert.equal(
    fix('التكلفة $99 فقط'),
    RLE + 'التكلفة ' + LRI + '$99' + PDI + ' فقط' + PDF
  );
});

test('bidi: a percentage keeps its sign inside the isolate', () => {
  assert.equal(
    fix('زيادة 25% هذا العام'),
    RLE + 'زيادة ' + LRI + '25%' + PDI + ' هذا العام' + PDF
  );
});

test('bidi: a URL is isolated whole and its punctuation is not Arabicised', () => {
  assert.equal(
    fix('زوروا https://example.com/a?b=1 اليوم'),
    RLE + 'زوروا ' + LRI + 'https://example.com/a?b=1' + PDI + ' اليوم' + PDF
  );
});

test('bidi: a sentence comma after a URL stays outside the isolate', () => {
  assert.equal(
    fix('زوروا www.example.com, ثم عودوا'),
    RLE + 'زوروا ' + LRI + 'www.example.com' + PDI + '، ثم عودوا' + PDF
  );
});

test('bidi: an email address is isolated whole', () => {
  assert.equal(
    fix('راسلنا على ali@example.com للمزيد'),
    RLE + 'راسلنا على ' + LRI + 'ali@example.com' + PDI + ' للمزيد' + PDF
  );
});

test('bidi: a phone number keeps its + on the correct side', () => {
  assert.equal(
    fix('اتصل على +966 50 123 4567 الآن'),
    RLE + 'اتصل على ' + LRI + '+966 50 123 4567' + PDI + ' الآن' + PDF
  );
});

test('bidi: two separate numbers get two separate isolates', () => {
  assert.equal(
    fix('من 5 إلى 10 أيام'),
    RLE + 'من ' + LRI + '5' + PDI + ' إلى ' + LRI + '10' + PDI + ' أيام' + PDF
  );
});

test('bidi: isolation uses LRI/PDI, never LRE/PDF', () => {
  const out = fix('مرحبا Claude');
  assert.ok(out.includes(LRI) && out.includes(PDI));
  assert.ok(!out.includes('‪'));
});

// ===========================================================================
// bidi — Arabic punctuation
// ===========================================================================

test('punctuation: comma, semicolon and question mark are Arabicised', () => {
  assert.equal(fix('مرحبا, كيف حالك? بخير; شكرا'), RLE + 'مرحبا، كيف حالك؟ بخير؛ شكرا' + PDF);
});

test('punctuation: straight quotes become guillemets', () => {
  assert.equal(fix('قال "مرحبا" لنا'), RLE + 'قال «مرحبا» لنا' + PDF);
});

test('punctuation: curly quotes become guillemets', () => {
  assert.equal(fix('قال “مرحبا” لنا'), RLE + 'قال «مرحبا» لنا' + PDF);
});

test('punctuation: unbalanced quotes are reported, not half-converted', () => {
  const res = bidi.fixText('قال "مرحبا لنا');
  assert.ok(res.text.includes('"'));
  assert.ok(res.changes.some((c) => c.rule === 'quotes-unbalanced'));
});

test('punctuation: nothing is Arabicised inside a code span', () => {
  assert.equal(
    fix('نفّذ `a, b?` ثم توقف'),
    RLE + 'نفّذ ' + LRI + '`a, b?`' + PDI + ' ثم توقف' + PDF
  );
});

test('punctuation: nothing is Arabicised inside a Latin run', () => {
  assert.equal(
    fix('اقرأ Hello, World ثم ارجع'),
    RLE + 'اقرأ ' + LRI + 'Hello, World' + PDI + ' ثم ارجع' + PDF
  );
});

test('punctuation: a decimal comma inside a number is preserved', () => {
  assert.ok(fix('الناتج 3,14 تقريبا').includes('3,14'));
});

// ===========================================================================
// bidi — brackets
// ===========================================================================

test('brackets: a correctly ordered pair is never swapped (the renderer mirrors it)', () => {
  assert.equal(fix('مرحبا (بالعالم) هنا'), RLE + 'مرحبا (بالعالم) هنا' + PDF);
});

test('brackets: a hand-mirrored pair is restored to logical order', () => {
  assert.equal(fix('مرحبا )بالعالم( هنا'), RLE + 'مرحبا (بالعالم) هنا' + PDF);
});

test('brackets: square and curly pairs are restored too', () => {
  assert.equal(fix('نص ]مرجع[ آخر'), RLE + 'نص [مرجع] آخر' + PDF);
  assert.equal(fix('نص }مرجع{ آخر'), RLE + 'نص {مرجع} آخر' + PDF);
});

test('brackets: a reversed pair with no Arabic inside is left alone', () => {
  assert.equal(
    fix('نص )abc( هنا'),
    RLE + 'نص )' + LRI + 'abc' + PDI + '( هنا' + PDF
  );
});

test('brackets: unbalanced brackets are reported', () => {
  const issues = bidi.findBracketIssues('مرحبا (بالعالم هنا');
  assert.deepEqual(issues, [{ pair: '()', opened: 1, closed: 0 }]);
});

// ===========================================================================
// bidi — idempotency and hygiene
// ===========================================================================

test('idempotency: running the pipeline twice changes nothing the second time', () => {
  const samples = [
    'مرحبا بالعالم',
    'مرحبا Claude كيف حالك',
    'السعر 1,234.50 ريال, شامل',
    'زوروا https://example.com اليوم',
    'العنوان\nHello\nالخاتمة',
    'مرحبا )بالعالم( هنا',
  ];
  for (const s of samples) {
    const once = fix(s);
    assert.equal(fix(once), once, s);
  }
});

test('hygiene: pre-existing controls are stripped before reprocessing', () => {
  const dirty = '‮' + 'مرحبا' + '‬';
  assert.equal(fix(dirty), RLE + 'مرحبا' + PDF);
});

test('hygiene: visibleLength ignores control characters', () => {
  assert.equal(bidi.visibleLength(fix('مرحبا')), 5);
});

test('hygiene: escapeControls makes a preview readable', () => {
  assert.equal(bidi.escapeControls(fix('مرحبا')), '<RLE>مرحبا<PDF>');
});

test('hygiene: text is never stored in visual order', () => {
  const out = fix('مرحبا بالعالم');
  assert.equal(bidi.stripBidiControls(out), 'مرحبا بالعالم');
});

// ===========================================================================
// bidi — script helpers and truncation
// ===========================================================================

test('helpers: base direction follows the first strong character', () => {
  assert.equal(bidi.baseDirection('مرحبا Hello'), 'rtl');
  assert.equal(bidi.baseDirection('Hello مرحبا'), 'ltr');
  assert.equal(bidi.baseDirection('123 — '), 'neutral');
  assert.equal(bidi.baseDirection(RLE + 'Hello'), 'ltr');
});

test('helpers: arabicRatio measures letters only', () => {
  assert.equal(bidi.arabicRatio('مرحبا'), 1);
  assert.equal(bidi.arabicRatio('Hello'), 0);
  assert.equal(bidi.arabicRatio('12345'), 0);
});

test('truncate: the ellipsis stays last in logical order', () => {
  assert.equal(bidi.truncate('مرحبا بالعالم الجميل', 12), 'مرحبا…');
});

test('truncate: short text is returned unchanged', () => {
  assert.equal(bidi.truncate('مرحبا', 12), 'مرحبا');
});

test('truncate: never leaves a dangling control character', () => {
  const cut = bidi.truncate(fix('مرحبا بالعالم الجميل جدا'), 14);
  assert.equal(cut, 'مرحبا بالعالم…');
  assert.ok(!bidi.hasBidiControls(cut));
  assert.ok(bidi.controlsBalanced(fix(cut)));
});

test('truncate: a trailing Arabic comma is trimmed before the ellipsis', () => {
  assert.equal(bidi.truncate('مرحبا، بالعالم الجميل', 12), 'مرحبا…');
});

// ===========================================================================
// numerals
// ===========================================================================

test('numerals: mixing three digit systems is detected', () => {
  const census = numerals.censusNumerals('عام 2024 و ٥ أشهر و ۷ أيام');
  assert.equal(census.mixed, true);
  assert.deepEqual(census.systems.sort(), ['arabic-indic', 'persian', 'western']);
});

test('numerals: a single system is not flagged as mixed', () => {
  assert.equal(numerals.censusNumerals('عام ٢٠٢٤ و ٥ أشهر').mixed, false);
});

test('numerals: conversion to Arabic-Indic', () => {
  assert.equal(numerals.convertNumerals('عام 2024', 'arabic-indic').text, 'عام ٢٠٢٤');
});

test('numerals: conversion to Western', () => {
  assert.equal(numerals.convertNumerals('عام ٢٠٢٤', 'western').text, 'عام 2024');
});

test('numerals: Persian digits are normalised to the target too', () => {
  assert.equal(numerals.convertNumerals('۵ و ٥ و 5', 'western').text, '5 و 5 و 5');
});

test('numerals: URLs, emails and phone numbers keep Western digits', () => {
  const input = 'زوروا https://a.com/2024 أو راسلوا a1@b.com أو اتصلوا +966 50 123 4567 عام 2024';
  const out = numerals.convertNumerals(input, 'arabic-indic').text;
  assert.ok(out.includes('https://a.com/2024'));
  assert.ok(out.includes('a1@b.com'));
  assert.ok(out.includes('+966 50 123 4567'));
  assert.ok(out.includes('عام ٢٠٢٤'));
});

test('numerals: digits inside a Latin product name are left alone', () => {
  assert.equal(numerals.convertNumerals('جهاز iPhone 15 جديد', 'arabic-indic').text, 'جهاز iPhone 15 جديد');
});

test('numerals: digits inside a code span are left alone', () => {
  assert.equal(numerals.convertNumerals('نفّذ `x = 10` هنا', 'arabic-indic').text, 'نفّذ `x = 10` هنا');
});

test('numerals: the percent sign can follow the digits', () => {
  assert.equal(numerals.convertNumerals('نسبة 25%', 'arabic-indic', { percent: true }).text, 'نسبة ٢٥٪');
  assert.equal(numerals.convertNumerals('نسبة 25%', 'arabic-indic').text, 'نسبة ٢٥%');
});

test('numerals: dates are located with their era marker', () => {
  const found = numerals.findDates('تاريخ 1445هـ يوافق 2024م و 12/05/2023');
  assert.deepEqual(found.map((d) => d.calendar), ['hijri', 'gregorian', 'unmarked']);
});

test('numerals: a design mixing Hijri and Gregorian without markers is flagged', () => {
  const issues = numerals.checkDates(['الموعد 1445', 'الموعد 2024م']);
  assert.ok(issues.some((i) => i.rule === 'date-calendar-ambiguous'));
});

test('numerals: currency is located and its placement judged', () => {
  const found = numerals.findCurrency('التكلفة $99 أو 350 ر.س');
  assert.deepEqual(found.map((c) => c.code), ['USD', 'SAR']);
});

// ===========================================================================
// typography
// ===========================================================================

test('typography: letter spacing on Arabic is a manual finding, not an auto fix', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: { letter_spacing: 2 } });
  assert.ok(res.auto.every((o) => !('letter_spacing' in o.formatting)));
  assert.ok(res.manual.some((f) => f.rule === 'letter-spacing'));
});

test('typography: letter spacing is always listed for manual verification', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: {} });
  assert.ok(res.manual.some((f) => f.rule === 'letter-spacing-unknown'));
});

test('typography: fake italic on Arabic is auto-fixable via format_text', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: { font_style: 'italic' } });
  const op = res.auto.find((o) => o.formatting && o.formatting.font_style);
  assert.equal(op.type, 'format_text');
  assert.equal(op.formatting.font_style, 'normal');
});

test('typography: italic on a Latin element is left alone', () => {
  const res = typography.checkElement({ text: 'Hello', style: { font_style: 'italic' } });
  assert.equal(res.auto.length, 0);
});

test('typography: uppercase transform is reported as manual — no API for it', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: { text_transform: 'uppercase' } });
  assert.ok(res.auto.every((o) => !('text_transform' in o.formatting)));
  assert.ok(res.manual.some((f) => f.rule === 'text-transform'));
});

test('typography: a tight line height is raised to the Arabic minimum', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: { line_height: 1.1 } });
  const op = res.auto.find((o) => o.formatting && o.formatting.line_height);
  assert.equal(op.formatting.line_height, 1.6);
});

test('typography: harakat demand the taller line height', () => {
  const res = typography.checkElement({ text: 'مَرْحَبًا', style: { line_height: 1.6 } });
  const op = res.auto.find((o) => o.formatting && o.formatting.line_height);
  assert.equal(op.formatting.line_height, 1.8);
});

test('typography: an adequate line height produces no operation', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: { line_height: 1.7 } });
  assert.ok(!res.auto.some((o) => o.formatting && o.formatting.line_height));
});

test('typography: text below the Arabic minimum size is raised', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: { font_size: 10 } });
  const op = res.auto.find((o) => o.formatting && o.formatting.font_size);
  assert.equal(op.formatting.font_size, 14);
});

test('typography: the Arabic optical size sits 15% above its Latin neighbour', () => {
  assert.equal(typography.opticalSize(20), 23);
  assert.equal(typography.opticalSize(20, 0.1), 22);
});

test('typography: tatweel used as filler is stripped', () => {
  const res = typography.stripTatweel('مرحبـــا بالعالم');
  assert.equal(res.text, 'مرحبا بالعالم');
  assert.equal(res.removed, 3);
});

test('typography: a single tatweel is reported but not removed', () => {
  const res = typography.checkElement({ text: 'مرحبـا' });
  assert.ok(res.manual.some((f) => f.rule === 'tatweel-single'));
});

test('typography: a hyphen breaking an Arabic line is reported — Arabic does not hyphenate', () => {
  const res = typography.checkElement({ text: 'الكلمة الطويـ-\nلة هنا' });
  assert.ok(res.manual.some((f) => f.rule === 'hyphenation'));
});

test('typography: every auto operation is a real Canva edit-design operation', () => {
  const res = typography.checkElement({
    text: 'مرحبا',
    style: { font_style: 'italic', line_height: 1.0, font_size: 9 },
  });
  for (const op of res.auto) {
    assert.equal(op.type, 'format_text');
    for (const key of Object.keys(op.formatting)) {
      assert.ok(typography.FORMAT_TEXT_FIELDS.includes(key), key);
    }
  }
});

// ===========================================================================
// detect
// ===========================================================================

test('detect: a font with no Arabic coverage is flagged with substitutes', () => {
  const res = detect.checkFont('Montserrat');
  assert.equal(res.arabicCapable, false);
  assert.ok(res.suggestions.length > 0);
});

test('detect: a known Arabic font passes', () => {
  assert.equal(detect.checkFont('Tajawal').arabicCapable, true);
  assert.equal(detect.checkFont('IBM Plex Sans Arabic').arabicCapable, true);
});

test('detect: an unknown font is uncertain, not a false accusation', () => {
  assert.equal(detect.checkFont('Some Custom Face').arabicCapable, null);
});

test('detect: a Latin weight maps onto the nearest Arabic weight', () => {
  assert.equal(detect.mapWeight('Tajawal', 250), 200);
  assert.equal(detect.mapWeight('Almarai', 500), 400);
});

test('detect: tofu and replacement characters are caught', () => {
  assert.ok(detect.findGlyphFailures('مرحبا �').some((f) => f.rule === 'replacement-char'));
  assert.ok(detect.findGlyphFailures('مرحبا ').some((f) => f.rule === 'private-use'));
});

test('detect: text stored as Arabic presentation forms is caught', () => {
  assert.ok(detect.findGlyphFailures('ﻟﺎ').some((f) => f.rule === 'presentation-forms'));
});

test('detect: scattered fonts across one design are flagged', () => {
  const issues = detect.fontCensus([
    { font_family: 'Tajawal' }, { font_family: 'Cairo' },
    { font_family: 'Almarai' }, { font_family: 'Noto Kufi Arabic' },
  ]);
  assert.ok(issues.some((i) => i.rule === 'font-sprawl'));
});

test('detect: two fonts in one design are fine', () => {
  const issues = detect.fontCensus([{ font_family: 'Tajawal' }, { font_family: 'Cairo' }]);
  assert.equal(issues.length, 0);
});

test('geometry: crossing rectangles are an overlap', () => {
  const issues = detect.findOverlaps([
    { locator_id: 'title', text: 'العنوان', left: 100, top: 96, width: 880, height: 214 },
    { locator_id: 'sub', text: 'الفرعي', left: 100, top: 225, width: 880, height: 120 },
  ]);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].rule, 'overlap');
  assert.deepEqual(issues[0].elements, ['title', 'sub']);
});

test('geometry: rectangles that only touch are not an overlap', () => {
  assert.deepEqual(detect.findOverlaps([
    { locator_id: 'a', text: 'أ', left: 0, top: 0, width: 100, height: 100 },
    { locator_id: 'b', text: 'ب', left: 0, top: 100, width: 100, height: 100 },
  ]), []);
});

test('geometry: separated rectangles are not an overlap', () => {
  assert.deepEqual(detect.findOverlaps([
    { locator_id: 'a', text: 'أ', left: 0, top: 0, width: 100, height: 100 },
    { locator_id: 'b', text: 'ب', left: 0, top: 400, width: 100, height: 100 },
  ]), []);
});

test('geometry: a text inside its card is containment, not overlap', () => {
  assert.deepEqual(detect.findOverlaps([
    { locator_id: 'card', left: 0, top: 0, width: 400, height: 200 },
    { locator_id: 'txt', text: 'نص', left: 20, top: 20, width: 360, height: 160 },
  ]), []);
});

test('geometry: two decorations crossing each other are not reported', () => {
  assert.deepEqual(detect.findOverlaps([
    { locator_id: 'sh1', left: 0, top: 0, width: 100, height: 100 },
    { locator_id: 'sh2', left: 50, top: 50, width: 100, height: 100 },
  ]), []);
});

test('geometry: text grown past its card is an escape, with the amount', () => {
  const issues = detect.findEscapes([
    { locator_id: 'card', left: 0, top: 0, width: 400, height: 120 },
    { locator_id: 'txt', text: 'نص', left: 20, top: 20, width: 360, height: 128.17 },
  ]);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].rule, 'container-escape');
  assert.equal(issues[0].container, 'card');
  assert.deepEqual(issues[0].past, { bottom: 28.17 });
});

test('geometry: text still inside its card is no escape', () => {
  assert.deepEqual(detect.findEscapes([
    { locator_id: 'card', left: 0, top: 0, width: 400, height: 200 },
    { locator_id: 'txt', text: 'نص', left: 20, top: 20, width: 360, height: 160 },
  ]), []);
});

test('geometry: text with no container around it is no escape', () => {
  assert.deepEqual(detect.findEscapes([
    { locator_id: 'txt', text: 'نص', left: 20, top: 20, width: 360, height: 160 },
    { locator_id: 'far', left: 900, top: 900, width: 50, height: 50 },
  ]), []);
});

test('geometry: the smallest holding rectangle is the container', () => {
  const issues = detect.findEscapes([
    { locator_id: 'page-bg', left: 0, top: 0, width: 1080, height: 1350 },
    { locator_id: 'card', left: 0, top: 0, width: 400, height: 120 },
    { locator_id: 'txt', text: 'نص', left: 20, top: 20, width: 360, height: 128.17 },
  ]);
  assert.equal(issues[0].container, 'card');
});

test('geometry: the estimator is gone — nothing guesses a layout any more', () => {
  for (const name of ['estimateOverflow', 'estimateTextWidth', 'refitFontSize']) {
    assert.equal(detect[name], undefined, name);
  }
});

test('detect: contrast ratio follows WCAG', () => {
  assert.equal(detect.contrastRatio('#000000', '#FFFFFF'), 21);
  assert.equal(detect.contrastRatio('#FFFFFF', '#FFFFFF'), 1);
});

test('detect: body text below 4.5:1 fails', () => {
  const res = detect.checkContrast({ color: '#777777', background: '#FFFFFF', fontSize: 16 });
  assert.equal(res.pass, false);
  assert.equal(res.required, 4.5);
});

test('detect: a light weight gets the stricter Arabic advisory', () => {
  const res = detect.checkContrast({
    color: '#767676', background: '#FFFFFF', fontSize: 16, fontWeight: 200,
  });
  assert.ok(res.advisory);
});

test('detect: large bold text only needs 3:1', () => {
  const res = detect.checkContrast({
    color: '#949494', background: '#FFFFFF', fontSize: 30, fontWeight: 700,
  });
  assert.equal(res.required, 3);
});

test('detect: an arrow is a mirror candidate, a logo is not', () => {
  assert.equal(detect.shouldMirror({ type: 'shape', alt_text: 'arrow pointing right' }), true);
  assert.equal(detect.shouldMirror({ type: 'image', alt_text: 'company logo' }), false);
  assert.equal(detect.shouldMirror({ type: 'image', alt_text: 'play button icon' }), false);
  assert.equal(detect.shouldMirror({ type: 'image', alt_text: 'photo of a team meeting' }), false);
});

test('detect: an unclassifiable element asks rather than guesses', () => {
  assert.equal(detect.shouldMirror({ type: 'image', alt_text: '' }), null);
});

test('detect: mirroring an element across the page keeps it inside the page', () => {
  assert.deepEqual(detect.mirrorX({ left: 100, width: 200 }, 1000), { left: 700 });
});

test('detect: reading order is judged from element positions', () => {
  const issues = detect.checkReadingOrder([
    { id: 'a', left: 40, top: 40, width: 100, height: 40, text: 'الخطوة ١' },
    { id: 'b', left: 400, top: 40, width: 100, height: 40, text: 'الخطوة ٢' },
  ]);
  assert.ok(issues.some((i) => i.rule === 'reading-order'));
});

// ===========================================================================
// spelling
// ===========================================================================

test('spelling: tanween placed after the alef is corrected', () => {
  assert.equal(spelling.autofix('شكراً').text, 'شكرًا');
});

test('spelling: Persian yeh and keheh inside Arabic text are corrected', () => {
  assert.equal(spelling.autofix('العربی').text, 'العربي');
  assert.equal(spelling.autofix('کتاب').text, 'كتاب');
});

test('spelling: a space before punctuation is removed', () => {
  assert.equal(spelling.autofix('مرحبا ، كيف حالك').text, 'مرحبا، كيف حالك');
});

test('spelling: a doubled space is collapsed', () => {
  assert.equal(spelling.autofix('مرحبا  بالعالم').text, 'مرحبا بالعالم');
});

test('spelling: a missing space after a comma is added', () => {
  assert.equal(spelling.autofix('مرحبا،كيف حالك').text, 'مرحبا، كيف حالك');
});

test('spelling: clean text produces no findings', () => {
  assert.deepEqual(spelling.check('مرحبا بالعالم الجميل'), []);
});

// --- the ten errors found in a real design ------------------------------

test('spelling: fabricated harakat are stripped', () => {
  assert.equal(spelling.autofix('استفَزازاتٌ').text, 'استفزازات');
  assert.equal(spelling.autofix('ينتقدَك').text, 'ينتقدك');
});

test('spelling: a fatha on a final ya means alef maqsura', () => {
  assert.equal(spelling.autofix('أقويَ').text, 'أقوى');
});

test('spelling: a spurious tanween is removed but its shadda is only flagged', () => {
  const res = spelling.autofix('يجادّلٌ');
  assert.equal(res.text, 'يجادّل');
  assert.ok(res.changes.some((c) => c.rule === 'shadda-suspect'));
});

test('spelling: a haraka left on a letter-substitution error is still stripped', () => {
  assert.equal(spelling.autofix('يستفرُك').text, 'يستفرك');
});

test('spelling: deliberate vocalisation on the opening letter is left alone', () => {
  for (const word of ['يُقلّل', 'مَن', 'مِن', 'يقلّل', 'مدرّس', 'خاصّة']) {
    assert.equal(spelling.autofix(word).text, word, word);
  }
});

test('spelling: fully vocalised text is never stripped', () => {
  const ayah = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
  assert.equal(spelling.autofix(ayah).text, ayah);
});

test('spelling: مَن before a noun is flagged as the preposition, and never rewritten', () => {
  const res = spelling.autofix('مَن يُقلّل مَن إنجازك');
  assert.equal(res.text, 'مَن يُقلّل مَن إنجازك');
  const hits = res.changes.filter((c) => c.rule === 'man-vs-min');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].suggestion, 'من');
});

test('spelling: the lexicon reaches letter substitutions the old rules could not', () => {
  assert.equal(spelling.autofix('الخقيقة').text, 'الحقيقة');
  for (const word of ['يعزج', 'جانزته']) {
    const hit = spelling.check(word).find((f) => f.rule === 'spelling-ambiguous');
    assert.ok(hit, word);
  }
  assert.ok(spelling.check('يعزج')[0].candidates.some((c) => c.startsWith('يزعج')));
  assert.ok(spelling.check('جانزته')[0].candidates.some((c) => c.startsWith('جائزته')));
});

test('spelling: clitics do not turn ordinary prose into findings', () => {
  const prose = [
    'نحن نقدم لكم أفضل الخدمات في مجال التصميم والطباعة بجودة عالية وسعر مناسب',
    'تعلم كيف تبني عادات يومية تدوم معك مدى الحياة وتغير مسار عملك',
    'احجز مقعدك الآن واستفد من الخصم المحدود قبل انتهاء العرض',
  ];
  for (const line of prose) assert.deepEqual(spelling.check(line), [], line);
});

test('spelling: every fix is idempotent', () => {
  const samples = ['استفَزازاتٌ', 'أقويَ', 'يجادّلٌ', 'شكراً  جزيلا ، العربی', 'ونقدُّ اعتراف'];
  for (const s of samples) {
    const once = spelling.autofix(s).text;
    assert.equal(spelling.autofix(once).text, once, s);
  }
});

test('spelling: register mixing across a design is reported', () => {
  const issues = spelling.checkRegister(['نحن نقدم لكم أفضل الخدمات', 'عشان كده احنا الأفضل']);
  assert.ok(issues.some((i) => i.rule === 'register-mix'));
});

test('spelling: a consistently formal design is not flagged', () => {
  const issues = spelling.checkRegister(['نحن نقدم لكم أفضل الخدمات', 'خدماتنا هي الأفضل']);
  assert.deepEqual(issues, []);
});

// ===========================================================================
// pipeline order: spelling -> numerals -> bidi
// ===========================================================================

test('pipeline: spelling, numerals and bidi compose without fighting', () => {
  const raw = 'شكراً, زوروا www.example.com عام 2024';
  const spelled = spelling.autofix(raw).text;
  const numbered = numerals.convertNumerals(spelled, 'arabic-indic').text;
  const out = bidi.fixText(numbered).text;

  assert.equal(
    out,
    RLE + 'شكرًا، زوروا ' + LRI + 'www.example.com' + PDI + ' عام ٢٠٢٤' + PDF
  );
  assert.ok(bidi.controlsBalanced(out));
  assert.equal(bidi.fixText(out).text, out);
});

// ===========================================================================
// cli — the bridge the skills actually call
// ===========================================================================

const { plan, reflow, foldNoise, batchByPage } = require('../lib/cli');
const fromRead = require('../lib/from-read');

/** One fixed page holding one element, with the style fields a test cares about. */
const onePage = (element, page = {}) => ({
  pages: [{ index: 1, width: 1080, height: 1080, elements: [element], ...page }],
});

test('cli: the text chain runs spelling, then numerals, then tatweel, then bidi', () => {
  const res = plan(
    onePage({ locator_id: 'L1', text: 'شكراً, زوروا www.example.com عام 2024' }),
    { numerals: 'arabic-indic' }
  );
  // Word edits, not a rewrite: spelling and punctuation on the first word,
  // the numeral conversion and the line's closing anchor on the last.
  assert.deepEqual(res.auto.filter((a) => a.op.type === 'find_and_replace_text').map((a) => [a.op.find_text, a.op.replace_text]), [
    ['شكراً,', 'شكرًا،'],
    ['2024', '٢٠٢٤' + RLM],
  ]);
  assert.ok(!res.auto.some((a) => a.op.type === 'replace_text'));
});

test('cli: a responsive page gets find_and_replace_text, never replace_text', () => {
  const res = plan(
    onePage({ locator_id: 'L1', text: 'شكراً للجميع' }, { is_responsive: true })
  );
  const op = res.auto[0].op;
  assert.equal(op.type, 'find_and_replace_text');
  assert.equal(op.find_text, 'شكراً');
  assert.equal(op.replace_text, 'شكرًا');
});

test('cli: pure Arabic that Canva already lays out right is left untouched', () => {
  // The old plan wrapped every line in RLE…PDF with replace_text. Canva ignores
  // the RLE, and the rewrite turned the box left-to-right (measured).
  const res = plan(onePage({ locator_id: 'L1', text: 'التربية لا تظهر في الكلام الكبير', style: { letter_spacing: 0, line_height: 1.6 } }));
  assert.deepEqual(res.auto, []);
});

test('cli: every text change is a word edit, so direction and styles survive', () => {
  const res = plan(onePage({ locator_id: 'L1', text: 'تنتظر حتى ينهي المتحدث كلامه @kitabwbs.', style_runs: 2 }));
  const ops = res.auto.filter((a) => a.op.type !== 'format_text').map((a) => a.op);
  assert.ok(ops.length > 0);
  assert.ok(ops.every((o) => o.type === 'find_and_replace_text'), 'never a whole-text rewrite');
  assert.deepEqual(ops.map((o) => [o.find_text, o.replace_text]), [['@kitabwbs.', LRM + '@kitabwbs' + LRM + '.' + RLM]]);
});

test('cli: when only a rewrite will do, it brings the alignment with it', () => {
  // A repeated word that does not change is no obstacle: only changed words
  // must be unique.
  const res = plan(onePage({ locator_id: 'L1', text: 'شكراً في في البيت' }));
  assert.deepEqual(res.auto.filter((a) => a.op.type !== 'format_text').map((a) => a.op.type), ['find_and_replace_text']);

  // The rewrite resets the box to left-to-right (measured), where `end` is the
  // right edge — so the alignment goes out with it.

  // «شكراً» twice, and both change: no word edit can name just one of them.
  const forced = plan(onePage({ locator_id: 'L2', text: 'شكراً لك شكراً.' }));
  assert.ok(forced.auto.some((a) => a.op.type === 'replace_text'));
  assert.ok(forced.auto.some((a) => a.op.type === 'format_text' && a.op.formatting.text_align === 'end'));
});

test('cli: a two-style box that cannot be edited word by word is reported, never rewritten', () => {
  const res = plan(onePage({ locator_id: 'L1', text: 'شكراً لك شكراً.', style_runs: 2 }));
  assert.ok(!res.auto.some((a) => a.op.type === 'replace_text'));
  assert.ok(res.manual.some((m) => m.rule === 'multi-style-edit'));
});

test('cli: a responsive page cannot take format_text, so it is blocked', () => {
  const res = plan(
    onePage(
      { locator_id: 'L1', text: 'مرحبا', style: { font_style: 'italic', letter_spacing: 0 } },
      { is_responsive: true }
    )
  );
  assert.ok(!res.auto.some((a) => a.op.type === 'format_text'));
  assert.equal(res.blocked[0].op.type, 'format_text');
});

test('cli: a page that is not editable queues nothing at all', () => {
  const res = plan(
    onePage(
      { locator_id: 'L1', text: 'مرحبا', style: { font_style: 'italic', letter_spacing: 0 } },
      { is_editable: false }
    )
  );
  assert.equal(res.auto.length, 0);
  assert.ok(res.blocked.length > 0);
  assert.ok(res.blocked.every((b) => /is_editable/.test(b.reason)));
});

test('cli: a Latin-only element produces no text operation', () => {
  const res = plan(onePage({ locator_id: 'L1', text: 'Hello, world' }));
  assert.equal(res.auto.length, 0);
  assert.equal(res.preview.length, 0);
});

/** What Canva does with the text operations, applied to a string. */
function applyOps(text, ops) {
  return ops.reduce((t, op) => (op.type === 'replace_text' ? op.text
    : op.type === 'find_and_replace_text' ? t.replace(op.find_text, op.replace_text) : t), text);
}

test('cli: an already-fixed design is a no-op on the second pass', () => {
  const design = onePage({ locator_id: 'L1', text: 'مرحبا Claude، عام 2024', style: { letter_spacing: 0 } });
  const first = plan(design, { numerals: 'arabic-indic' });
  assert.ok(first.auto.length > 0, 'the first pass has work to do');
  const fixed = onePage({
    locator_id: 'L1', text: applyOps('مرحبا Claude، عام 2024', first.auto.map((a) => a.op)), style: { letter_spacing: 0 },
  });
  assert.equal(plan(fixed, { numerals: 'arabic-indic' }).auto.length, 0);
});

test('cli: operations are batched one entry per page', () => {
  const batches = batchByPage([
    { page: 1, op: { type: 'replace_text' } },
    { page: 2, op: { type: 'replace_text' } },
    { page: 1, op: { type: 'format_text' } },
  ]);
  assert.deepEqual(batches.map((b) => [b.page_index, b.operations.length]), [[1, 2], [2, 1]]);
});

test('cli: every queued operation is one Canva accepts on that page', () => {
  const res = plan(
    onePage({
      locator_id: 'L1', text: 'انشاء موقع, بسرعه', left: 0, top: 0, width: 300, height: 60,
      style: { font_style: 'italic', line_height: 1.0, font_size: 9, letter_spacing: 0 },
    }),
    { numerals: 'arabic-indic' }
  );
  const allowed = new Set(['replace_text', 'find_and_replace_text', 'format_text', 'resize_element']);
  for (const entry of res.auto) assert.ok(allowed.has(entry.op.type), entry.op.type);
  for (const entry of res.auto) assert.equal(entry.op.locator_id, 'L1');
});

// ===========================================================================
// alignment
// ===========================================================================

test('align: reported, not changed — the same "start" is right in one box and left in another', () => {
  // Measured: `end` in a box Canva made for Arabic painted the paragraph flush left.
  const res = typography.checkElement({ text: 'مرحبا', style: { text_align: 'start', letter_spacing: 0 } });
  assert.ok(!res.auto.some((o) => 'text_align' in o.formatting));
  assert.ok(res.manual.some((f) => f.rule === 'alignment-direction' && f.current === 'start'));
});

test('align: --align=end applies it once the thumbnail showed a left-to-right box', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: { text_align: 'start', letter_spacing: 0 } }, { align: 'end' });
  assert.equal(res.auto.find((o) => o.formatting.text_align).formatting.text_align, 'end');
});

test('align: a deliberately centred box is left centred', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: { text_align: 'center', letter_spacing: 0 } });
  assert.ok(!res.auto.some((o) => 'text_align' in o.formatting));
});

test('align: already end means no operation', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: { text_align: 'end', letter_spacing: 0 } });
  assert.ok(!res.auto.some((o) => 'text_align' in o.formatting));
});

test('align: with --align, an unknown alignment is set too', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: { letter_spacing: 0 } }, { align: 'end' });
  assert.equal(res.auto.find((o) => o.formatting.text_align).formatting.text_align, 'end');
});

test('align: the rule can be switched off', () => {
  const res = typography.checkElement({ text: 'مرحبا', style: { letter_spacing: 0 } }, { align: false });
  assert.ok(!res.auto.some((o) => 'text_align' in o.formatting));
});

test('align: Latin text is never realigned', () => {
  assert.deepEqual(typography.checkElement({ text: 'Hello', style: { text_align: 'start' } }).auto, []);
});

// ===========================================================================
// report folding
// ===========================================================================

test('folding: a finding on nearly every element becomes one design note', () => {
  const manual = Array.from({ length: 14 }, (_, i) => ({
    rule: 'font-unknown', severity: 'info', locator_id: `L${i}`, message: 'لا اسم خط',
  }));
  const res = foldNoise(manual, 14);
  assert.equal(res.manual.length, 0);
  assert.equal(res.design.length, 1);
  assert.equal(res.design[0].count, 14);
  assert.equal(res.design[0].scope, 'design');
});

test('folding: a finding on a minority of elements stays per-element', () => {
  const manual = [
    { rule: 'contrast', severity: 'error', locator_id: 'L1', message: 'x' },
    { rule: 'contrast', severity: 'error', locator_id: 'L2', message: 'x' },
  ];
  const res = foldNoise(manual, 14);
  assert.equal(res.manual.length, 2);
  assert.deepEqual(res.design, []);
});

test('folding: a tiny design never folds — two of two is not a pattern', () => {
  const manual = [
    { rule: 'font-unknown', severity: 'info', locator_id: 'L1', message: 'x' },
    { rule: 'font-unknown', severity: 'info', locator_id: 'L2', message: 'x' },
  ];
  assert.deepEqual(foldNoise(manual, 2).design, []);
});

test('folding: the loud rule folds and the rare one survives beside it', () => {
  const manual = [
    ...Array.from({ length: 10 }, (_, i) => ({ rule: 'harakat-clipping', severity: 'warning', locator_id: `L${i}`, message: 'x' })),
    { rule: 'contrast', severity: 'error', locator_id: 'L11', message: 'y' },
  ];
  const res = foldNoise(manual, 11);
  assert.deepEqual(res.manual.map((f) => f.rule), ['contrast']);
  assert.deepEqual(res.design.map((f) => f.rule), ['harakat-clipping']);
});

test('folding: a real design stops repeating font-unknown fourteen times', () => {
  const elements = Array.from({ length: 14 }, (_, i) => ({
    locator_id: `L${i}`, text: `النص رقم ${i}`, style: { letter_spacing: 0, line_height: 1.6 },
  }));
  const res = plan({ pages: [{ index: 1, width: 1080, height: 1350, elements }] });
  assert.equal(res.manual.filter((f) => f.rule === 'font-unknown').length, 0);
  assert.equal(res.design.filter((f) => f.rule === 'font-unknown').length, 1);
});

// ===========================================================================
// reflow — pass two, on measured geometry
// ===========================================================================

// Canva returns elements in draw order; from-read turns that into z. Fixtures
// get the same treatment unless they set z themselves.
const measured = (elements) => ({
  pages: [{ index: 1, width: 1080, height: 1350, elements: elements.map((e, i) => ({ z: i, ...e })) }],
});

test('reflow: a measured overlap is reported with a suggestion, never queued', () => {
  const res = reflow(measured([
    { locator_id: 'title', text: 'العنوان', left: 100, top: 96, width: 880, height: 214 },
    { locator_id: 'sub', text: 'الفرعي', left: 100, top: 225, width: 880, height: 120 },
  ]));
  assert.equal(res.summary.overlaps, 1);
  assert.equal(res.auto.length, 0);
  assert.equal(res.findings[0].suggestion.type, 'position_element');
  assert.equal(res.findings[0].suggestion.locator_id, 'sub');
});

test('reflow: a text grown out of its card is moved up when there is slack', () => {
  const res = reflow(measured([
    { locator_id: 'card', left: 0, top: 0, width: 400, height: 200 },
    { locator_id: 'txt', text: 'نص', left: 20, top: 60, width: 360, height: 160 },
  ]));
  assert.equal(res.summary.escapes, 1);
  assert.deepEqual(res.auto[0].op, { type: 'position_element', locator_id: 'txt', left: 20, top: 40 });
});

test('reflow: with no slack the point size scales by the measured ratio', () => {
  const res = reflow(measured([
    { locator_id: 'card', left: 0, top: 0, width: 400, height: 120 },
    { locator_id: 'txt', text: 'نص', left: 20, top: 0, width: 360, height: 160, style: { font_size: 40 } },
  ]));
  assert.equal(res.auto[0].op.type, 'format_text');
  assert.equal(res.auto[0].op.formatting.font_size, 30); // 40 × 120/160
});

test('reflow: the Arabic minimum floors the scaling — no 9px rescue', () => {
  const res = reflow(measured([
    { locator_id: 'card', left: 0, top: 0, width: 400, height: 40 },
    { locator_id: 'txt', text: 'نص', left: 20, top: 0, width: 360, height: 400, style: { font_size: 40 } },
  ]));
  assert.equal(res.auto.length, 0);
  assert.equal(res.findings[0].rule, 'container-escape');
});

test('reflow: a box wider than its card is narrowed', () => {
  const res = reflow(measured([
    { locator_id: 'card', left: 0, top: 0, width: 400, height: 300 },
    { locator_id: 'txt', text: 'نص', left: 20, top: 20, width: 500, height: 100 },
  ]));
  assert.equal(res.auto[0].op.type, 'resize_element');
  assert.equal(res.auto[0].op.width, 360);
});

test('reflow: a clean measured page yields nothing', () => {
  const res = reflow(measured([
    { locator_id: 'card', left: 0, top: 0, width: 400, height: 300 },
    { locator_id: 'txt', text: 'نص', left: 20, top: 20, width: 360, height: 100 },
  ]));
  assert.deepEqual(res.findings, []);
  assert.deepEqual(res.auto, []);
});

test('reflow: a responsive page reports but queues nothing', () => {
  const design = measured([
    { locator_id: 'card', left: 0, top: 0, width: 400, height: 120 },
    { locator_id: 'txt', text: 'نص', left: 20, top: 60, width: 360, height: 160 },
  ]);
  design.pages[0].is_responsive = true;
  const res = reflow(design);
  assert.equal(res.findings.length, 1);
  assert.equal(res.auto.length, 0);
});

test('reflow: pass one no longer touches geometry at all', () => {
  const res = plan(measured([
    { locator_id: 'txt', text: 'نص عربي طويل جدا', left: 0, top: 0, width: 10, height: 10, style: { letter_spacing: 0, font_size: 40 } },
  ]));
  assert.ok(!res.auto.some((a) => a.op.type === 'resize_element'));
  assert.ok(!JSON.stringify(res).includes('estimate'));
});

// ===========================================================================
// from-read — the hand-copying step, gone
// ===========================================================================

test('from-read: a read-design response becomes a payload', () => {
  const { pages } = fromRead.convert({
    document: {
      pages: [{
        page_id: 'PB1', index: 1, type: 'fixed', width: 1080, height: 1350,
        children: [{
          locatorId: 'PB1-LB1', type: 'text',
          bounds: { left: 100, top: 96, width: 880, height: 214 },
          textRegions: [{ text: 'العنوان', formatting: { fontRef: 'YAFdJrN-O4g,0', fontSize: 64, lineHeight: 1.2, textAlign: 'start' } }],
        }],
      }],
    },
  });
  assert.equal(pages.length, 1);
  assert.equal(pages[0].is_responsive, false);
  assert.deepEqual(pages[0].elements[0], {
    locator_id: 'PB1-LB1', type: 'text',
    left: 100, top: 96, width: 880, height: 214,
    text: 'العنوان',
    style: { font_family: 'YAFdJrN-O4g,0', font_size: 64, line_height: 1.2, text_align: 'start' },
    z: 0,
  });
});

test('from-read: an opaque fontRef resolves when the response carries a font table', () => {
  const { pages } = fromRead.convert({
    fonts: [{ ref: 'YAFdJrN-O4g,0', name: 'Cairo' }],
    pages: [{
      page_id: 'PB1', index: 1, type: 'fixed',
      children: [{ locatorId: 'PB1-LB1', text: 'نص', formatting: { fontRef: 'YAFdJrN-O4g,0' } }],
    }],
  });
  assert.equal(pages[0].elements[0].style.font_family, 'Cairo');
});

test('from-read: a responsive page is marked as one', () => {
  const { pages } = fromRead.convert({
    pages: [{ page_id: 'PB2', index: 2, type: 'responsive', children: [] }],
  });
  assert.equal(pages[0].is_responsive, true);
});

test('from-read: a field Canva did not return stays absent, never guessed', () => {
  const { pages } = fromRead.convert({
    pages: [{ page_id: 'PB1', index: 1, children: [{ locatorId: 'L1', text: 'نص', formatting: { fontSize: 20 } }] }],
  });
  const { style } = pages[0].elements[0];
  assert.deepEqual(Object.keys(style), ['font_size']);
  assert.ok(!('letter_spacing' in style));
});

test('from-read: an element is collected once, however deep it nests', () => {
  const { pages } = fromRead.convert({
    pages: [{
      page_id: 'PB1', index: 1,
      children: [{ type: 'group', children: [{ type: 'group', children: [{ locatorId: 'L1', text: 'نص' }] }] }],
    }],
  });
  assert.equal(pages[0].elements.filter((e) => e.locator_id === 'L1').length, 1);
});

test('from-read: its output feeds plan() directly', () => {
  const payload = fromRead.convert({
    pages: [{
      page_id: 'PB1', index: 1, type: 'fixed', width: 1080, height: 1350,
      children: [{
        locatorId: 'L1', type: 'text', bounds: { left: 0, top: 0, width: 400, height: 100 },
        textRegions: [{ text: 'مرحبا, بالعالم', formatting: { fontSize: 24, letterSpacing: 0, lineHeight: 1.6 } }],
      }],
    }],
  });
  const res = plan(payload);
  const op = res.auto.find((a) => a.op.type === 'find_and_replace_text').op;
  assert.deepEqual([op.find_text, op.replace_text], ['مرحبا,', 'مرحبا،']);
});

test('from-read: an unrecognised shape yields no pages rather than junk', () => {
  assert.deepEqual(fromRead.convert({ someOtherShape: { blocks: [{ id: 'x', content: 'مرحبا' }] } }), { pages: [] });
});

// ===========================================================================
// layering — a highlight bar and a veil are the same rectangles
// ===========================================================================

const bar = { locator_id: 'bar', left: 90, top: 200, width: 500, height: 60 };
const heading = { locator_id: 'head', text: 'العنوان', left: 100, top: 190, width: 480, height: 90 };

test('layering: a shape drawn behind text is a highlight, and stays silent', () => {
  assert.deepEqual(detect.findOverlaps([{ ...bar, z: 0 }, { ...heading, z: 1 }]), []);
});

test('layering: the same shape drawn in front of the text is a veil', () => {
  const issues = detect.findOverlaps([{ ...heading, z: 0 }, { ...bar, z: 1 }]);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].kind, 'occlusion');
  assert.equal(issues[0].occludedText, 'head');
  assert.equal(issues[0].veil, 'bar');
});

test('layering: a veil is answered with layer_element, never a smaller font', () => {
  const res = reflow({ pages: [{ index: 1, elements: [{ ...heading, z: 0 }, { ...bar, z: 1 }] }] });
  assert.deepEqual(res.findings[0].suggestion, {
    type: 'layer_element', locator_id: 'head', position: 'front',
  });
  assert.ok(!res.findings.some((f) => f.suggestion && f.suggestion.type === 'format_text'));
});

test('layering: two crossing texts are reported whatever the draw order', () => {
  const pair = [
    { locator_id: 'a', text: 'أول', left: 0, top: 0, width: 200, height: 100 },
    { locator_id: 'b', text: 'ثان', left: 0, top: 50, width: 200, height: 100 },
  ];
  assert.equal(detect.findOverlaps(pair.map((e, i) => ({ ...e, z: i }))).length, 1);
  assert.equal(detect.findOverlaps(pair.map((e, i) => ({ ...e, z: 1 - i }))).length, 1);
});

test('layering: with no z the detector keeps reporting, and says why', () => {
  assert.equal(detect.findOverlaps([bar, heading]).length, 1);
  const res = reflow({ pages: [{ index: 1, elements: [bar, heading] }] });
  assert.ok(res.findings.some((f) => f.rule === 'layer-order-unknown'));
});

test('layering: from-read derives z from the order Canva returned', () => {
  const { pages } = fromRead.convert({
    pages: [{
      page_id: 'PB1', index: 1,
      children: [{ locatorId: 'back' }, { locatorId: 'middle' }, { locatorId: 'front' }],
    }],
  });
  assert.deepEqual(pages[0].elements.map((e) => [e.locator_id, e.z]), [['back', 0], ['middle', 1], ['front', 2]]);
});

// ===========================================================================
// latin orphans — a heading whose Arabic half was dropped
// ===========================================================================

const heading18 = (text) => ({ locator_id: text, text, style: { font_size: 48, color: '#111111' } });

test('latin-orphan: the four truncated headings are found, the complete one is not', () => {
  const issues = detect.findLatinOrphans([
    heading18('إيكيغاي (Ikigai)'),
    heading18('(Kaizen)'), heading18('(Shoshin)'),
    heading18('(Ganbaru)'), heading18('(Gaman)'),
  ]);
  assert.deepEqual(issues.map((i) => i.found), ['(Kaizen)', '(Shoshin)', '(Ganbaru)', '(Gaman)']);
  assert.ok(issues.every((i) => i.severity === 'error'));
});

test('latin-orphan: with no bilingual sibling it is a question, not a verdict', () => {
  const issues = detect.findLatinOrphans([
    { locator_id: 'a', text: 'العنوان الأول', style: { font_size: 48 } },
    { locator_id: 'b', text: 'النص الثاني', style: { font_size: 20 } },
    { locator_id: 'c', text: 'Kaizen', style: { font_size: 48 } },
  ]);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].severity, 'warning');
});

test('latin-orphan: an all-Latin design reports nothing', () => {
  assert.deepEqual(detect.findLatinOrphans([
    heading18('Kaizen'), heading18('Shoshin'), heading18('Ganbaru'),
  ]), []);
});

test('latin-orphan: URLs, emails, tags, versions and filenames are not orphans', () => {
  const arabic = [
    { locator_id: 'x1', text: 'العنوان الأول' }, { locator_id: 'x2', text: 'العنوان الثاني' },
    { locator_id: 'x3', text: 'العنوان الثالث' }, { locator_id: 'x4', text: 'العنوان الرابع' },
    { locator_id: 'x5', text: 'العنوان الخامس' }, { locator_id: 'x6', text: 'العنوان السادس' },
  ];
  for (const technical of ['https://example.com', 'www.example.com', 'ali@example.com', '#hashtag', '@handle', 'v2.1.0', 'logo.png']) {
    assert.deepEqual(detect.findLatinOrphans([...arabic, { locator_id: 't', text: technical }]), [], technical);
  }
});

test('latin-orphan: a single Latin letter is not a heading', () => {
  const arabic = Array.from({ length: 5 }, (_, i) => ({ locator_id: `a${i}`, text: `العنوان ${i}` }));
  assert.deepEqual(detect.findLatinOrphans([...arabic, { locator_id: 'b', text: 'A' }]), []);
});

test('latin-orphan: plan() surfaces them in the manual report', () => {
  const res = plan({ pages: [{ index: 1, elements: [
    { locator_id: 'a', text: 'إيكيغاي (Ikigai)', style: { font_size: 48, color: '#111111', letter_spacing: 0 } },
    { locator_id: 'b', text: '(Kaizen)', style: { font_size: 48, color: '#111111', letter_spacing: 0 } },
    { locator_id: 'c', text: 'العنوان', style: { font_size: 20, letter_spacing: 0 } },
  ] }] });
  const hit = res.manual.find((f) => f.rule === 'latin-orphan');
  assert.equal(hit.found, '(Kaizen)');
  assert.equal(hit.severity, 'error');
});

// ===========================================================================
// lexicon spelling — single-edit correction behind a gate
// ===========================================================================

// Every row of the second design's error table. The split is not arbitrary:
// a word the corpus does not know can be corrected; a word it knows perfectly
// well, used in the wrong place, cannot be — not by any lexicon.

test('lexicon: a dotting error one edit from a common word is corrected', () => {
  assert.equal(spelling.autofix('أستيقط').text, 'أستيقظ');
  assert.equal(spelling.autofix('بدفيقة').text, 'بدقيقة');
});

test('lexicon: the writer\'s own hamza survives the correction', () => {
  assert.equal(spelling.autofix('أستيقط').text, 'أستيقظ');   // not استيقظ
  assert.equal(spelling.autofix('استيقط').text, 'استيقظ');   // not أستيقظ
});

test('lexicon: harakat are carried onto the corrected word', () => {
  assert.equal(spelling.autofix('بَدفيقة').text, 'بَدقيقة');
});

test('lexicon: a near-tie is never applied — المعتدي outranks المبتدئ', () => {
  const res = spelling.autofix('المبتدي');
  assert.equal(res.text, 'المبتدي');
  const hit = res.changes.find((c) => c.rule === 'spelling-ambiguous');
  assert.ok(hit.candidates.some((c) => c.startsWith('المبتدئ')));
});

test('lexicon: a candidate too rare to trust is offered, not applied', () => {
  const res = spelling.autofix('تتقته');
  assert.equal(res.text, 'تتقته');
  assert.ok(res.changes[0].candidates.some((c) => c.startsWith('تتقنه')));
});

test('lexicon: short words have too many neighbours to auto-correct', () => {
  for (const word of ['فعم', 'فع']) {
    const res = spelling.autofix(word);
    assert.equal(res.text, word, word);
    assert.equal(res.changes[0].rule, 'spelling-ambiguous');
  }
});

test('lexicon: a real word used wrongly is beyond any lexicon, and is left alone', () => {
  // غدد (glands) for غدًا, الملا for الملل, الحقيقة for الحقيقية, بأتي for يأتي.
  // Each is a correctly spelled Arabic word; only meaning separates them.
  for (const word of ['غدد', 'الملا', 'الحقيقة', 'بأتي', 'أحم']) {
    const res = spelling.autofix(word);
    assert.equal(res.text, word, word);
    assert.deepEqual(res.changes, [], word);
  }
});

test('lexicon: transliterated names pass through untouched', () => {
  for (const name of ['كايزن', 'شوشين', 'غانبارو', 'غامان', 'إيكيغاي']) {
    const res = spelling.autofix(name);
    assert.equal(res.text, name, name);
    assert.ok(!res.changes.some((c) => c.rule === 'spelling'), name);
  }
});

test('lexicon: a name with no near neighbour is not even mentioned', () => {
  for (const name of ['غانبارو', 'إيكيغاي']) {
    assert.deepEqual(spelling.check(name), [], name);
  }
});

test('lexicon: ordinary Arabic prose is left entirely alone', () => {
  const prose = 'نحن نقدم لكم أفضل الخدمات في مجال التصميم والطباعة بجودة عالية وسعر مناسب';
  assert.equal(spelling.autofix(prose).text, prose);
  assert.deepEqual(spelling.check(prose), []);
});

test('lexicon: correction is idempotent', () => {
  for (const word of ['أستيقط', 'بدفيقة', 'المبتدي', 'كايزن', 'بَدفيقة']) {
    const once = spelling.autofix(word).text;
    assert.equal(spelling.autofix(once).text, once, word);
  }
});

test('lexicon: only a dotting swap or an adjacent transposition may auto-apply', () => {
  assert.ok(spelling.isTypoEdit('استيقط', 'استيقظ'));   // ط/ظ — same skeleton
  assert.ok(spelling.isTypoEdit('فعم', 'فمع'));         // adjacent swap
  assert.ok(!spelling.isTypoEdit('كايزن', 'كاين'));     // a deletion
  assert.ok(!spelling.isTypoEdit('غامان', 'بامان'));    // غ/ب share no skeleton
  assert.ok(!spelling.isTypoEdit('فعم', 'نعم'));        // ف/ن share no skeleton
});

test('lexicon: normalisation folds the variants that carry no information', () => {
  assert.equal(spelling.normalizeWord('إِلَى'), 'الي');
  assert.equal(spelling.normalizeWord('مَدْرَسَةٌ'), 'مدرسه');
  assert.equal(spelling.normalizeWord('مـــدرسة'), 'مدرسه');
  assert.notEqual(spelling.normalizeWord('المبتدي'), spelling.normalizeWord('المبتدئ'));
});

test('lexicon: the gate thresholds sit above the corpus\'s own typos', () => {
  assert.ok(spelling.KNOWN_MIN > spelling.CUTOFF);
  assert.equal(spelling.suggest('أستيقط').status, 'auto');
  assert.equal(spelling.suggest('مدرسة').status, 'known');
  assert.equal(spelling.suggest('غانبارو').status, 'unknown');
  assert.equal(spelling.suggest('المبتدي').status, 'ambiguous');
});

// ===========================================================================
// compose — a concept becomes a page Canva's importer accepts
// ===========================================================================

const compose = require('../lib/compose');
const patterns = require('../lib/patterns');

const SPEC = {
  title: 'الجمال في التفصيل',
  size: { width: 1080, height: 1350 },
  palette: { bg: '#0B1F2A', ink: '#F5EFE0', body: '#D8CEB8', muted: '#BDB49F', accent: '#C9A227' },
  fonts: { display: 'Tajawal', body: 'Amiri' },
  pattern: { kind: 'girih', opacity: 0.14 },
  blocks: [
    { role: 'eyebrow', text: 'سلسلة الإتقان' },
    { role: 'title', text: 'الجمالُ\nفي التفصيل' },
    { role: 'body', text: 'التصميمُ العربيُّ لا يُترجَم, بل يُبنى من حروفه.' },
    { role: 'cards', items: [{ num: '01', label: 'الحرف المتّصل' }, { num: '02', label: 'الفراغ الحيّ' }] },
    { role: 'footer', start: '2026', end: 'استوديو أزابال' },
  ],
};

test('compose: the page passes its own import lint', () => {
  const { html } = compose.compose(SPEC);
  assert.deepEqual(compose.lintForImport(html), []);
});

test('compose: the page stays small enough for the importer', () => {
  const { html } = compose.compose(SPEC);
  assert.ok(Buffer.byteLength(html) < compose.MAX_PAGE_BYTES);
});

test('compose: fonts are linked, never embedded', () => {
  const { html } = compose.compose(SPEC);
  assert.ok(html.includes('fonts.googleapis.com'));
  assert.ok(!html.includes('@font-face'));
  assert.ok(!html.includes('data:font'));
});

test('compose: the pattern is one inlined image, not a tiled background', () => {
  const { html } = compose.compose(SPEC);
  // raw.githubusercontent serves every file as text/plain, and a browser will
  // not draw an SVG served that way — the first live import came back with no
  // pattern at all. A data URI has no content type to get wrong.
  assert.ok(html.includes('data:image/svg+xml,'));
  assert.ok(html.includes('background-size:cover'));
  assert.ok(!/background-repeat\s*:\s*repeat/.test(html));
  assert.ok(!html.includes('pattern.svg'));
});

test('compose: the inlined pattern still leaves the page well under the ceiling', () => {
  const { html } = compose.compose(SPEC);
  assert.ok(Buffer.byteLength(html) < compose.MAX_PAGE_BYTES, Buffer.byteLength(html));
});

test('compose: the paragraph width is in pixels, not ch', () => {
  // ch resolves against whichever font is loaded when the importer lays the
  // page out; with the webfont still pending it ran off the canvas.
  const { html } = compose.compose(SPEC);
  assert.ok(/max-width:\d+px/.test(html));
  assert.ok(!html.includes('19ch'));
});

test('compose: copy is spell-checked and bidi-wrapped before it is drawn', () => {
  const { html } = compose.compose({
    ...SPEC,
    blocks: [{ role: 'body', text: 'زوروا www.example.com, شكراً' }],
  });
  assert.ok(html.includes(RLE));
  assert.ok(html.includes(LRI + 'www.example.com' + PDI));
  assert.ok(html.includes('شكرًا'));   // spelling ran
  assert.ok(html.includes('،'));       // Arabic punctuation ran
});

test('compose: numerals are unified when asked', () => {
  const { html } = compose.compose(SPEC, { numerals: 'arabic-indic' });
  assert.ok(html.includes('٠١'));
  assert.ok(html.includes('٢٠٢٦'));
});

test('compose: the type scale never goes below the Arabic minimum', () => {
  const scale = compose.typeScale(400, 'نص');
  for (const key of ['eyebrow', 'body', 'num', 'label', 'footer']) {
    assert.ok(scale[key] >= typography.MIN_ARABIC_FONT_SIZE, `${key}=${scale[key]}`);
  }
});

test('compose: harakat in the copy raise the line height', () => {
  assert.equal(compose.typeScale(1350, 'مَرْحَبًا').lead, typography.LINE_HEIGHT_HARAKAT);
  assert.equal(compose.typeScale(1350, 'مرحبا').lead, typography.LINE_HEIGHT_DEFAULT);
});

test('compose: a failing palette is caught before anything is drawn', () => {
  const issues = compose.checkPalette(
    { bg: '#FFFFFF', ink: '#EEEEEE', accent: '#DDDDDD' },
    compose.typeScale(1350, '')
  );
  assert.ok(issues.some((i) => i.rule === 'palette-contrast'));
});

test('compose: a sound palette raises nothing', () => {
  assert.deepEqual(compose.compose(SPEC).issues, []);
});

// --- the lint encodes what the real importer actually rejected -------------

test('lint: an embedded font is refused — it is what made the 845KB page fail', () => {
  const html = '<html dir="rtl"><style>@font-face{src:url(data:font/ttf;base64,AA)}</style>'
    + '<div data-document-role="page"></div></html>';
  assert.ok(compose.lintForImport(html).some((p) => p.rule === 'embedded-font'));
});

test('lint: a tiled background is refused — it came back as 200 rectangles', () => {
  const html = '<html dir="rtl"><style>.p{background-repeat:repeat}</style>'
    + '<div data-document-role="page"></div></html>';
  assert.ok(compose.lintForImport(html).some((p) => p.rule === 'tiled-background'));
});

test('lint: a page with no page role is refused', () => {
  assert.ok(compose.lintForImport('<html dir="rtl"><body></body></html>')
    .some((p) => p.rule === 'no-page-role'));
});

test('lint: an oversized page is refused with its measured size', () => {
  const html = `<html dir="rtl"><div data-document-role="page">${'x'.repeat(200000)}</div></html>`;
  const hit = compose.lintForImport(html).find((p) => p.rule === 'page-too-large');
  assert.ok(hit.bytes > compose.MAX_PAGE_BYTES);
});

// --- publishing -----------------------------------------------------------

test('publish: the target is a plain raw.githubusercontent URL, no proxy', () => {
  const t = compose.publishTarget({ owner: 'me', repo: 'pub', html: '<a>', assets: [] });
  assert.match(t.page.url, /^https:\/\/raw\.githubusercontent\.com\/me\/pub\/main\/p\/[a-z0-9]+\/index\.html$/);
});

test('publish: the path carries a content hash, so a new page is a new URL', () => {
  const a = compose.publishTarget({ owner: 'me', repo: 'pub', html: '<a>' });
  const b = compose.publishTarget({ owner: 'me', repo: 'pub', html: '<b>' });
  assert.notEqual(a.page.url, b.page.url);
  assert.equal(a.page.url, compose.publishTarget({ owner: 'me', repo: 'pub', html: '<a>' }).page.url);
});

test('publish: assets sit beside the page and get their own URLs', () => {
  const t = compose.publishTarget({
    owner: 'me', repo: 'pub', html: '<a>', assets: [{ name: 'pattern.svg', content: '<svg/>' }],
  });
  assert.equal(t.assets[0].path, `${t.dir}/pattern.svg`);
  assert.ok(t.assets[0].url.endsWith('/pattern.svg'));
});

// --- patterns -------------------------------------------------------------

test('patterns: each one is a single full-canvas SVG', () => {
  for (const kind of Object.keys(patterns.PATTERNS)) {
    const svg = patterns.pattern(kind, 1080, 1350, {});
    assert.match(svg, /^<svg[^>]*width="1080"[^>]*height="1350"/, kind);
    assert.ok(svg.endsWith('</svg>'), kind);
  }
});

test('patterns: an unknown pattern is an error, not an empty page', () => {
  assert.throws(() => patterns.pattern('nope', 100, 100), /unknown pattern/);
});

test('patterns: the pattern takes the palette accent, so it belongs to the design', () => {
  assert.ok(patterns.girih(200, 200, { stroke: '#FF0000' }).includes('#FF0000'));
});

test('compose: every text rule carries an explicit line height', () => {
  // The footer once inherited `normal`, came back at 1.17, and clipped its own
  // descenders — the composer breaking the rule the rest of the plugin enforces.
  const { html } = compose.compose(SPEC);
  const css = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
  for (const rule of ['.eyebrow', 'h1', 'p', '.num', '.lbl', 'footer']) {
    // Anchored at a rule boundary: a plain indexOf for "p{" found ".step{"
    // once the steps layout landed, and checked the wrong rule.
    const at = css.search(new RegExp(`(^|[}\\n])${rule.replace('.', '\\.')}\\{`, 'm'));
    assert.ok(at >= 0, `${rule} missing`);
    const block = css.slice(at);
    assert.match(block.slice(0, block.indexOf('}')), /line-height:/, rule);
  }
});

test('compose: no line height anywhere falls under the display minimum', () => {
  const { html } = compose.compose(SPEC);
  for (const [, value] of html.matchAll(/line-height:([\d.]+)/g)) {
    assert.ok(Number(value) >= 1.18, `line-height ${value}`);
  }
});

test('compose: body line breaks are authored, never left to measurement', () => {
  // Canva lays out in one font then substitutes its own; a line that fitted
  // during layout overflowed after substitution and ran off the canvas.
  const { html } = compose.compose({ ...SPEC, blocks: [{ role: 'body', text: 'سطر أول\nسطر ثان' }] });
  assert.ok(html.includes('<br>'));
});

test('bidi: a social handle keeps its @ — the sigil belongs to the name', () => {
  // Left outside the isolate, "@kitabwbs" rendered as "kitabwbs@" with the @
  // stranded at the opposite edge of the line.
  assert.equal(
    fix('تابعنا @kitabwbs اليوم'),
    RLE + 'تابعنا ' + LRI + '@kitabwbs' + PDI + ' اليوم' + PDF
  );
});

test('bidi: a hashtag keeps its # too', () => {
  assert.equal(fix('وسم #design هنا'), RLE + 'وسم ' + LRI + '#design' + PDI + ' هنا' + PDF);
});

test('bidi: an email is still matched whole, not split at the @', () => {
  assert.equal(
    fix('راسلنا ali@example.com شكرا'),
    RLE + 'راسلنا ' + LRI + 'ali@example.com' + PDI + ' شكرا' + PDF
  );
});

test('spelling: conservative mode reports the judgement calls and applies none', () => {
  // تفصيلٌ was typed with that tanween on purpose. Authored copy is not found copy.
  const res = spelling.autofix('تفصيلٌ بسيط', { conservative: true });
  assert.equal(res.text, 'تفصيلٌ بسيط');
  assert.ok(res.changes.some((c) => c.rule === 'fabricated-harakat' && c.reportOnly));
});

test('spelling: conservative mode still applies what is wrong under every reading', () => {
  assert.equal(spelling.autofix('شكراً العربی', { conservative: true }).text, 'شكرًا العربي');
});

test('spelling: conservative mode never auto-corrects a word', () => {
  assert.equal(spelling.autofix('أستيقط', { conservative: true }).text, 'أستيقط');
  assert.equal(spelling.autofix('أستيقط').text, 'أستيقظ');
});

test('compose: authored copy keeps the vocalisation its author chose', () => {
  const { html, notes } = compose.compose({ ...SPEC, blocks: [{ role: 'body', text: 'تفصيلٌ بسيط' }] });
  assert.ok(html.includes('تفصيلٌ'));
  assert.ok(notes.some((n) => n.rule === 'fabricated-harakat'));
});

test('compose: a Latin-only line inside an Arabic page is isolated', () => {
  // fixText leaves it alone — correct for a standalone Latin design, wrong
  // inside an RTL page, where "@kitabwbs" came out as "kitabwbs@".
  const { text } = compose.prepareCopy('@kitabwbs · www.kitabwbs.com');
  assert.ok(text.startsWith(LRI));
  assert.ok(text.endsWith(PDI));
});

test('compose: an Arabic line is wrapped RTL, not isolated LTR', () => {
  const { text } = compose.prepareCopy('مرحبا بالعالم');
  assert.equal(text, RLE + 'مرحبا بالعالم' + PDF);
});

test('icons: each one is a self-contained SVG in the palette colour', () => {
  for (const name of Object.keys(patterns.ICONS)) {
    const svg = patterns.icon(name, { stroke: '#059669' });
    assert.match(svg, /^<svg[^>]*viewBox="0 0 64 64"/, name);
    assert.ok(svg.includes('#059669'), name);
    assert.ok(svg.endsWith('</svg>'), name);
  }
});

test('icons: an unknown icon is an error, not a blank square', () => {
  assert.throws(() => patterns.icon('nope'), /unknown icon/);
});

// ===========================================================================
// recipes — variety that is generated, not imported
// ===========================================================================

const recipes = require('../lib/recipes');

const OUTLINE = {
  kicker: 'سلسلة الوعي',
  title: '٦ تصرّفات صغيرة\nتكشف أنك تربّيت جيدًا',
  lead: 'التربية لا تظهر في الكلام الكبير،\nبل في تفاصيل صغيرة.',
  iconName: 'tree',
  items: [
    { title: 'تشكر على أبسط خدمة', body: 'كلمة شكر للنادل والسائق\nتقول عنك أكثر من ألقابك.' },
    { title: 'تنتظر حتى ينهي المتحدّث', body: 'المقاطعة تكشف العجلة،\nوالإنصات يكشف الاحترام.' },
    { title: 'لا تنظر في شاشة غيرك', body: 'ما يخصّ الناس ليس لعينيك،\nولو كان مكشوفًا.' },
    { title: 'تحفظ السرّ دون أن يُطلب', body: 'الأمانة أن تكتم ما سمعته،\nحتى لو لم يُطلب منك.' },
  ],
  closing: 'الأخلاق لا تُقاس بالمواقف الكبرى،\nبل بما تفعله حين لا ينتبه أحد.',
  question: 'ما التصرّف الذي يكشف لك\nأن الشخص تربّى جيدًا؟ 👇',
  brand: '@kitabwbs · www.kitabwbs.com',
};

test('recipes: every shipped palette passes contrast at every text size', () => {
  // A palette that fails contrast is not a style choice, it is a defect. None
  // of them ships without proving it first.
  for (const [name, palette] of Object.entries(recipes.PALETTES)) {
    for (const format of Object.values(recipes.FORMATS)) {
      const scale = compose.typeScale(format.height, 'نص');
      const issues = compose.checkPalette(palette, scale)
        .filter((i) => i.severity === 'error');
      assert.deepEqual(issues, [], `${name} @ ${format.height}`);
    }
  }
});

test('recipes: every layout composes into a page that passes the import lint', () => {
  for (const layout of Object.keys(recipes.LAYOUTS)) {
    const spec = recipes.recipe({ format: 'post', palette: 'paper', pairing: 'civic', layout }, OUTLINE);
    const { html, issues } = compose.compose(spec);
    assert.deepEqual(compose.lintForImport(html), [], layout);
    assert.deepEqual(issues.filter((i) => i.severity === 'error'), [], layout);
  }
});

test('recipes: every palette × pairing × pattern combination composes clean', () => {
  for (const palette of Object.keys(recipes.PALETTES)) {
    for (const pairing of Object.keys(recipes.PAIRINGS)) {
      for (const pattern of recipes.PATTERNS) {
        const spec = recipes.recipe({ format: 'reel', palette, pairing, pattern, layout: 'list' }, OUTLINE);
        const { html } = compose.compose(spec);
        assert.deepEqual(compose.lintForImport(html), [], `${palette}/${pairing}/${pattern}`);
      }
    }
  }
});

test('recipes: a reel is a cover, the points split across frames, and a closing', () => {
  const spec = recipes.reel({ format: 'reel', palette: 'paper', pairing: 'civic' }, OUTLINE, { perPage: 3 });
  assert.deepEqual(spec.pages.map((p) => p.label), ['الغلاف', 'النقاط 1–3', 'النقاط 4–4', 'الخاتمة']);
  const { html, pages } = compose.compose(spec);
  assert.equal(pages, 4);
  assert.deepEqual(compose.lintForImport(html), []);
});

test('recipes: numbering runs on across the frames, it does not restart', () => {
  const spec = recipes.reel({ format: 'reel', palette: 'paper' }, OUTLINE, { perPage: 2 });
  const nums = spec.pages
    .flatMap((p) => p.blocks)
    .filter((b) => b.role === 'list')
    .flatMap((b) => b.items.map((i) => i.num));
  assert.deepEqual(nums, ['١', '٢', '٣', '٤']);
});

test('recipes: the same outline re-cuts into a different design without touching the copy', () => {
  const a = recipes.recipe({ format: 'post', palette: 'midnight', pairing: 'editorial', layout: 'quote' }, OUTLINE);
  const b = recipes.recipe({ format: 'post', palette: 'mint', pairing: 'kufic', layout: 'list' }, OUTLINE);
  assert.notDeepEqual(a.palette, b.palette);
  assert.notDeepEqual(a.blocks.map((x) => x.role), b.blocks.map((x) => x.role));
});

test('recipes: the library is big enough to stop repeating itself', () => {
  assert.ok(recipes.combinations() >= 1000, recipes.combinations());
});

test('compose: only the page with a top bar loses its padding', () => {
  // The CSS is written once for every page, so keying the bleed off "any page
  // has a bar" stripped the padding from the frames that do not, and their copy
  // sat on the top edge.
  const { html } = compose.compose({
    ...SPEC,
    pages: [
      { label: 'أ', blocks: [{ role: 'topbar', height: 200 }, { role: 'title', text: 'عنوان' }] },
      { label: 'ب', blocks: [{ role: 'title', text: 'عنوان' }] },
    ],
  });
  assert.ok(html.includes('class="page has-bar"'));
  assert.ok(html.includes('class="page"'));
  assert.ok(html.includes('.page.has-bar{padding:0 0'));
});

// ===========================================================================
// make — the one call that turns an outline into a publishable page
// ===========================================================================

const { make, checkOutline } = require('../lib/cli');

test('make: an outline becomes a page that passes its own lint', () => {
  const res = make(OUTLINE, { format: 'post', palette: 'paper', pairing: 'civic', layout: 'list' });
  assert.equal(res.ok, true);
  assert.deepEqual(res.lint, []);
  assert.equal(res.pages, 1);
  assert.ok(res.bytes > 0);
});

test('make: --reel splits the same outline into cover, points and closing', () => {
  const res = make(OUTLINE, { reel: true, format: 'reel', palette: 'midnight', perPage: 2 });
  assert.equal(res.ok, true);
  assert.equal(res.pages, 4);           // cover + 2 point frames + closing
  assert.equal(res.look.layout, 'reel');
});

test('make: the chosen look is reported back, so a design can be reproduced', () => {
  const res = make(OUTLINE, { format: 'square', palette: 'sand', pairing: 'editorial', pattern: 'zellij', layout: 'quote' });
  assert.deepEqual(res.look, {
    format: 'square', palette: 'sand', pairing: 'editorial', pattern: 'zellij', layout: 'quote',
  });
});

test('make: a repo turns into the exact URL Canva will fetch', () => {
  const res = make(OUTLINE, { format: 'post', repo: 'me/pub', branch: 'main' });
  assert.match(res.publish.url, /^https:\/\/raw\.githubusercontent\.com\/me\/pub\/main\/p\/[a-z0-9]+\/index\.html$/);
  assert.ok(res.publish.path.endsWith('/index.html'));
});

test('make: with no repo there is no publish target, and that is not an error', () => {
  const res = make(OUTLINE, { format: 'post' });
  assert.equal(res.publish, null);
  assert.equal(res.ok, true);
});

test('make: a broken outline is refused in words, not a stack trace', () => {
  const res = make({ items: [{ body: 'x' }], iconName: 'dragon' }, { layout: 'list' });
  assert.equal(res.ok, false);
  assert.ok(res.problems.some((p) => p.includes('title')));
  assert.ok(res.problems.some((p) => p.includes('dragon')));
});

test('make: an unknown palette is named with the ones that exist', () => {
  const problems = checkOutline({ title: 'x', items: [{ title: 'y' }], palette: 'neon' }, 'list');
  assert.ok(problems.some((p) => p.includes('neon') && p.includes('midnight')));
});

test('make: the same outline and look give the same URL every time', () => {
  const look = { format: 'reel', palette: 'ink', repo: 'me/pub' };
  assert.equal(make(OUTLINE, look).publish.url, make(OUTLINE, look).publish.url);
});

test('make: a different look gives a different URL, so nothing is overwritten', () => {
  const a = make(OUTLINE, { format: 'reel', palette: 'ink', repo: 'me/pub' });
  const b = make(OUTLINE, { format: 'reel', palette: 'sea', repo: 'me/pub' });
  assert.notEqual(a.publish.url, b.publish.url);
});

test('make: copy notes reach the caller so the author can settle them', () => {
  const res = make({ ...OUTLINE, closing: 'تفصيلٌ بسيط يكشف الكثير.' }, { format: 'post' });
  assert.ok(res.notes.some((n) => n.rule === 'fabricated-harakat'));
  assert.ok(res.ok, 'a reported judgement call is not a failure');
});

// ===========================================================================
// copy — the words around the design
// ===========================================================================

const copyLib = require('../lib/copy');

test('copy: a clean human caption raises no tells and no bait', () => {
  const human = 'التربية لا تظهر في الكلام الكبير.. بل في تفاصيل صغيرة.\n'
    + 'ما التصرّف الذي يكشف لك أن الشخص تربّى جيدًا؟ 👇';
  const r = copyLib.lintCopy(human, { surface: 'caption' });
  assert.deepEqual(r.tells, []);
  assert.deepEqual(r.bait, []);
});

test('copy: the Arabic generator tells are caught', () => {
  const ai = 'في عالمنا المتسارع، لا شكّ أنّ التنظيم يلعب دورًا محوريًا. دعونا نتعمّق في سرّ النجاح.';
  const found = copyLib.lintCopy(ai).tells.map((t) => t.found);
  for (const phrase of ['في عالمنا المتسارع', 'لا شكّ أنّ', 'دعونا نتعمّق', 'يلعب دورًا محوريًا', 'سرّ النجاح']) {
    assert.ok(found.some((f) => f.includes(phrase.split(' ')[0])), phrase);
  }
});

test('copy: literal translations of English clichés are caught', () => {
  for (const [text, phrase] of [
    ['هذه الأداة تغيير قواعد اللعبة', 'game-changer'],
    ['ارتقِ بعملك إلى مستوى آخر', 'next level'],
    ['هل تساءلت يومًا لماذا؟', 'wondered'],
  ]) {
    assert.ok(copyLib.lintCopy(text).tells.length > 0, phrase);
  }
});

test('copy: each kind of Facebook engagement bait is named', () => {
  const cases = {
    'comment-bait': 'اكتب نعم إذا وافقت',
    'share-bait': 'شارك إن كنت توافق',
    'tag-bait': 'منشن صديقك الذي يحتاج هذا',
    'react-bait': 'اضغط لايك إذا أعجبك',
  };
  for (const [kind, text] of Object.entries(cases)) {
    const r = copyLib.lintCopy(text);
    assert.ok(r.bait.some((b) => b.rule === kind), `${kind}: ${text}`);
    assert.ok(r.bait.every((b) => b.severity === 'error'), kind);
  }
});

test('copy: a real open question is not bait', () => {
  const r = copyLib.lintCopy('ما التصرّف الصغير الذي يكشف لك أن الشخص تربّى جيدًا؟ أضفه 👇');
  assert.deepEqual(r.bait, []);
  assert.deepEqual(r.warnings, []);
});

test('copy: asking for a number is a warning, not a refusal', () => {
  const r = copyLib.lintCopy('أيّ قاعدة أصعب عليك؟ اكتب رقمها 👇');
  assert.deepEqual(r.bait, []);
  assert.equal(r.warnings[0].rule, 'number-answer');
});

test('copy: a hook that runs past the fold is flagged with its length', () => {
  const long = 'هذا سطر أول طويل جدًا '.repeat(8);
  const w = copyLib.lintCopy(long, { surface: 'caption' }).warnings.find((x) => x.rule === 'hook-past-fold');
  assert.ok(w.chars > copyLib.FOLD_CHARS);
});

test('copy: more hashtags than Facebook needs is a note, not an error', () => {
  const r = copyLib.lintCopy('نص\n#أ #ب #ج #د #هـ #و', { surface: 'caption' });
  const w = r.warnings.find((x) => x.rule === 'hashtag-count');
  assert.equal(w.count, 6);
  assert.equal(w.severity, 'info');
});

test('spine: a bare topic word on frame one is a label, not a hook', () => {
  assert.ok(copyLib.checkSpine({ title: 'الأخلاق', items: [{}, {}, {}], question: 'x؟' })
    .some((i) => i.rule === 'hook-is-a-label'));
  assert.deepEqual(copyLib.checkSpine({ title: '٦ تصرّفات صغيرة', items: [{}, {}, {}], question: 'x؟' }), []);
});

test('spine: a sequence with no ask at the end is flagged', () => {
  assert.ok(copyLib.checkSpine({ title: '٥ قواعد', items: [{}, {}, {}] })
    .some((i) => i.rule === 'no-ask'));
});

test('spine: more than ten points should be two posts', () => {
  assert.ok(copyLib.checkSpine({ title: '١٢ خطأ', items: Array(12).fill({}), question: 'x؟' })
    .some((i) => i.rule === 'too-many-points'));
});

test('caption: built from the same outline as the design, so they cannot drift', () => {
  const text = copyLib.caption({ ...OUTLINE, hashtags: ['أخلاق', '#وعي', 'تطوير الذات', 'زائد'] });
  assert.ok(text.startsWith('التربية لا تظهر'));
  assert.ok(text.includes('١. تشكر على أبسط خدمة'));
  assert.ok(text.includes('#أخلاق #وعي #تطوير_الذات'));
  assert.ok(!text.includes('#زائد'), 'capped at three tags');
});

test('caption: carries no bidi control characters — it is pasted, not imported', () => {
  const text = copyLib.caption(OUTLINE);
  assert.ok(!bidi.hasBidiControls(text));
});

test('make: returns a caption and the copy checks alongside the design', () => {
  const res = make(OUTLINE, { format: 'reel', reel: true });
  assert.equal(typeof res.caption, 'string');
  assert.ok(res.caption.length > 0);
  assert.ok(Array.isArray(res.copy.spine));
  assert.ok(Array.isArray(res.copy.tells));
});

test('make: engagement bait stops the build — it costs reach', () => {
  const res = make({ ...OUTLINE, question: 'اكتب نعم إذا وافقت 👇' }, { format: 'post' });
  assert.equal(res.ok, false);
  assert.ok(res.copy.bait.some((b) => b.rule === 'comment-bait'));
});

test('make: the same warning on a frame and in the caption is reported once', () => {
  const res = make({ ...OUTLINE, question: 'أيّ تصرّف تمارسه؟ اكتب رقمه 👇' }, { format: 'post' });
  assert.equal(res.copy.warnings.filter((w) => w.rule === 'number-answer').length, 1);
});

// ===========================================================================
// outline — the post as the creator writes it
// ===========================================================================

const outlineLib = require('../lib/outline');

// Verbatim from the creator's own message in this project.
const POST_B = `🌿 6 تصرّفات صغيرة.. تكشف أنك تربّيت جيداً
الهوك: التربية لا تظهر في الكلام الكبير، بل في ستّ تفاصيل صغيرة لا ينتبه لها إلا الراقي.

1. تشكر على أبسط خدمة: كلمة "شكراً" للنادل والسائق وعامل النظافة، تقول عنك أكثر من كل ألقابك.
2. تنتظر حتى ينهي المتحدّث كلامه: المقاطعة تكشف العجلة، والإنصات حتى النهاية يكشف الاحترام.
3. لا تنظر في شاشة غيرك: ما يخصّ الناس ليس لعينيك، ولو كان أمامك مكشوفاً.
الأخلاق لا تُقاس بالمواقف الكبرى، بل بما تفعله حين تظنّ أن لا أحد ينتبه لها.
السؤال: ما التصرّف الصغير الذي يكشف لك أن الشخص تربّى جيداً؟ أضفه 👇
الكابشن:
التربية لا تظهر في الكلام الكبير.. بل في تفاصيل صغيرة.
#أخلاق #وعي #تطوير_الذات`;

test('outline: the creator\'s own post parses into every part', () => {
  const o = outlineLib.parseOutline(POST_B);
  assert.equal(o.title, '🌿 6 تصرّفات صغيرة.. تكشف أنك تربّيت جيداً');
  assert.match(o.lead, /^التربية لا تظهر/);
  assert.equal(o.items.length, 3);
  assert.deepEqual(o.items[0], {
    title: 'تشكر على أبسط خدمة',
    body: 'كلمة "شكراً" للنادل والسائق وعامل النظافة، تقول عنك أكثر من كل ألقابك.',
  });
  assert.match(o.closing, /^الأخلاق لا تُقاس/);
  assert.match(o.question, /أضفه 👇$/);
  assert.deepEqual(o.hashtags, ['أخلاق', 'وعي', 'تطوير_الذات']);
});

test('outline: the caption section is kept aside, never drawn on the design', () => {
  const o = outlineLib.parseOutline(POST_B);
  assert.match(o.captionText, /^التربية لا تظهر في الكلام الكبير\.\./);
  assert.ok(!o.items.some((i) => i.title.includes('الكابشن')));
});

test('outline: a title that starts with a number is not mistaken for a point', () => {
  // «9 قواعد للهيبة» has no mark after the digit — it is a title, and nearly
  // every one of this creator's titles starts with a number.
  const o = outlineLib.parseOutline('9 قواعد للهيبة والكاريزما\n\n1. التقدير الداخلي: الهيبة تبدأ من احترامك.');
  assert.equal(o.title, '9 قواعد للهيبة والكاريزما');
  assert.equal(o.items.length, 1);
});

test('outline: Arabic-Indic numbering and bullets both read as points', () => {
  const o = outlineLib.parseOutline('العنوان: عنوان\n١. أول: شرح\n٢) ثان: شرح\n• ثالث: شرح');
  assert.deepEqual(o.items.map((i) => i.title), ['أول', 'ثان', 'ثالث']);
});

test('outline: a line it cannot place is reported, never silently dropped', () => {
  const o = outlineLib.parseOutline('عنوان\nمقدمة\n1. نقطة: شرح\nخاتمة\nسطر زائد لا مكان له');
  assert.deepEqual(o.unparsed, ['سطر زائد لا مكان له']);
});

test('breaks: a title breaks where the creator paused, at «..»', () => {
  const o = outlineLib.withBreaks(outlineLib.parseOutline(POST_B));
  assert.equal(o.title, '🌿 6 تصرّفات صغيرة..\nتكشف أنك تربّيت جيداً');
});

test('breaks: a long line breaks at the comma nearest its middle', () => {
  assert.equal(
    outlineLib.breakLine('كلمة "شكراً" للنادل والسائق وعامل النظافة، تقول عنك أكثر من كل ألقابك.'),
    'كلمة "شكراً" للنادل والسائق وعامل النظافة،\nتقول عنك أكثر من كل ألقابك.'
  );
});

test('breaks: a hand-broken line and a short line are left exactly as written', () => {
  assert.equal(outlineLib.breakLine('سطر\nمكسور يدويًا بالفعل وطويل جدًا جدًا جدًا'), 'سطر\nمكسور يدويًا بالفعل وطويل جدًا جدًا جدًا');
  assert.equal(outlineLib.breakLine('قصير'), 'قصير');
});

test('make: plain text in, a finished page out — no JSON to write', () => {
  const res = make(outlineLib.withBreaks(outlineLib.parseOutline(POST_B)), { reel: true, format: 'reel' });
  assert.equal(res.ok, true);
  assert.equal(res.pages, 3);            // cover + one frame of three points + closing
  assert.ok(res.html.includes('جيدًا'), 'tanween order corrected on the way');
});

test('caption: the creator\'s own caption is used as written, every tag kept', () => {
  const o = outlineLib.parseOutline(`${POST_B} #رابع #خامس`);
  const text = copyLib.caption(o);
  assert.ok(text.startsWith('التربية لا تظهر في الكلام الكبير.. بل في تفاصيل صغيرة.'));
  assert.ok(!text.includes('📌'), 'no skeleton lines added to a written caption');
  assert.ok(text.endsWith('#أخلاق #وعي #تطوير_الذات #رابع #خامس'));
  // Five is too many for Facebook, and the lint says so — the words stay theirs.
  assert.ok(copyLib.lintCopy(text, { surface: 'caption' }).warnings.some((w) => w.rule === 'hashtag-count'));
});

// ===========================================================================
// anchoring — what Canva's editor honours (measured 2026-09-29)
// ===========================================================================

test('anchor: an RLM where an Arabic line ends in something that is not a letter', () => {
  assert.equal(bidi.anchorText('لا تنظر في شاشة غيرك.').text, 'لا تنظر في شاشة غيرك.' + RLM);
  assert.equal(bidi.anchorText('أيّ قاعدة أصعب عليك؟').text, 'أيّ قاعدة أصعب عليك؟' + RLM);
  assert.equal(bidi.anchorText('«شكرًا» للنادل').text, RLM + '«شكرًا» للنادل');
});

test('anchor: an Arabic-Indic digit at the edge is anchored — it is not a letter', () => {
  // It sits in the Arabic block, which is why a block test missed it.
  assert.equal(bidi.anchorText('٦ تصرّفات صغيرة..').text, RLM + '٦ تصرّفات صغيرة..' + RLM);
});

test('anchor: a line that begins and ends in letters is left exactly as it is', () => {
  assert.equal(bidi.anchorText('التربية لا تظهر في الكلام الكبير').changed, false);
  assert.equal(bidi.anchorText('تابعني على www.kitabwbs.com').changed, false);
});

test('anchor: a handle inside Arabic gets an LRM on each side', () => {
  // Measured: LRI…PDI left it painted as kitabwbs@; LRM painted @kitabwbs.
  assert.equal(bidi.anchorText('تابعني على @kitabwbs يوميًا').text, 'تابعني على ' + LRM + '@kitabwbs' + LRM + ' يوميًا');
});

test('anchor: a phone number keeps its plus', () => {
  assert.ok(bidi.anchorText('اتصل على +966 55 123 4567').text.includes(LRM + '+966 55 123 4567' + LRM));
});

test('anchor: a Latin line with a loose edge is held left-to-right; a clean one is not touched', () => {
  assert.equal(bidi.anchorText('@kitabwbs').text, LRM + '@kitabwbs');
  assert.equal(bidi.anchorText('Hello, world').changed, false);
  assert.equal(bidi.anchorText('1.').changed, false);
});

test('anchor: a handle typed in visual order is never pinned that way round', () => {
  assert.equal(bidi.anchorText('kitabwbs@').changed, false);
  const res = plan(onePage({ locator_id: 'L1', text: 'kitabwbs@' }));
  const finding = res.manual.find((m) => m.rule === 'visual-order-handle');
  assert.equal(finding.suggestion.replace_text, LRM + '@kitabwbs');
});

test('anchor: idempotent, and it replaces the old RLE/LRI marks', () => {
  const once = bidi.anchorText('كلامه @kitabwbs.').text;
  assert.equal(bidi.anchorText(once).text, once);
  const old = RLE + 'لا تنظر في شاشة غيرك.' + PDF;
  assert.equal(bidi.anchorText(old).text, 'لا تنظر في شاشة غيرك.' + RLM);
});

test('anchor: the import route is unchanged — fixText still wraps for import-design-from-url', () => {
  // An imported reel with these marks reads right (checked); that route stays.
  assert.equal(bidi.fixText('مرحبا').text, RLE + 'مرحبا' + PDF);
});

// ===========================================================================
// verbatim — the creator's words are the answer
// ===========================================================================

const verbatim = require('../lib/verbatim');

// The live case, 2026-09-29: asked for these lines, Canva drew these.
const ASKED = ['٦ تصرّفات صغيرة.. تكشف أنك تربّيت جيدًا', '٢. تنتظر حتى ينهي المتحدّث كلامه', '@kitabwbs', 'ما التصرّف؟ 👇'];
const DRAWN = [
  { locator_id: 'T1', text: 'تصرّفات صغيرة..', style_runs: 2 },
  { locator_id: 'T2', text: 'تكشف أنك ترتّيت جيدًا' },
  { locator_id: 'I2', text: 'تنتظر حتى ينهي المتحدث كلامه' },
  { locator_id: 'B2', text: '2.' },
  { locator_id: 'H', text: 'kitabwbs@' },
  { locator_id: 'Q', text: 'ما التصرّف؟' },
];

test('verbatim: a word one letter off is put back from the creator\'s line', () => {
  const { restore } = verbatim.compare(ASKED, DRAWN);
  assert.ok(restore.some((r) => r.locator_id === 'T2' && r.find === 'ترتّيت' && r.replace === 'تربّيت' && r.kind === 'letter'));
});

test('verbatim: dropped harakat come back — the writer chose them', () => {
  const { restore } = verbatim.compare(ASKED, DRAWN);
  assert.ok(restore.some((r) => r.find === 'المتحدث' && r.replace === 'المتحدّث' && r.kind === 'harakat'));
});

test('verbatim: a handle drawn in visual order comes back logical and pinned', () => {
  const { restore } = verbatim.compare(ASKED, DRAWN);
  assert.ok(restore.some((r) => r.find === 'kitabwbs@' && r.replace === LRM + '@kitabwbs' && r.kind === 'visual-order'));
});

test('verbatim: a dropped word is reported with a re-insert beside its neighbour', () => {
  const { missing } = verbatim.compare(ASKED, DRAWN);
  const six = missing.find((m) => m.word === '٦');
  assert.deepEqual(six.suggestion, { type: 'find_and_replace_text', locator_id: 'T1', find_text: 'تصرّفات', replace_text: '٦ تصرّفات' });
});

test('verbatim: the other digit system, emoji and punctuation are not changes', () => {
  const { restore, missing } = verbatim.compare(ASKED, DRAWN);
  assert.ok(!missing.some((m) => m.word === '٢' || m.word === '👇'), JSON.stringify(missing));
  assert.ok(!restore.some((r) => r.find === '2'));
});

test('verbatim: two candidates for one word — nothing is guessed', () => {
  const { restore, missing } = verbatim.compare(['قلب'], [{ locator_id: 'A', text: 'قلم' }, { locator_id: 'B', text: 'قلت' }]);
  assert.equal(restore.length, 0);
  assert.deepEqual(missing[0].candidates.sort(), ['قلت', 'قلم']);
});

test('verbatim: plan --expect sends the restorations as word edits and reports the gap', () => {
  const res = plan({ pages: [{ index: 1, elements: DRAWN.map((e) => ({ ...e, style: { letter_spacing: 0 } })) }] }, { expect: ASKED });
  const edits = res.auto.filter((a) => a.op.type === 'find_and_replace_text').map((a) => [a.op.find_text, a.op.replace_text]);
  assert.ok(edits.some(([f, r]) => f === 'ترتّيت' && r === 'تربّيت'));
  assert.ok(edits.some(([f, r]) => f === 'kitabwbs@' && r === LRM + '@kitabwbs'));
  assert.ok(res.design.some((d) => d.rule === 'copy-missing' && d.word === '٦' && d.suggestion));
  assert.ok(!res.auto.some((a) => a.op.type === 'replace_text'));
});

// ===========================================================================
// display type and badges — what Canva's generator produces
// ===========================================================================

test('typography: display type keeps its leading — 1.8 pushed a title into the next line', () => {
  const res = typography.checkElement({ text: 'تصرّفات صغيرة', style: { font_size: 110, line_height: 1.15, letter_spacing: 0 } });
  assert.ok(!res.auto.some((o) => 'line_height' in o.formatting));
  assert.ok(!res.manual.some((f) => f.rule === 'harakat-clipping'));
});

test('typography: display leading tight enough to collide is reported', () => {
  const res = typography.checkElement({ text: 'تصرّفات صغيرة', style: { font_size: 110, line_height: 0.95, letter_spacing: 0 } });
  assert.ok(res.manual.some((f) => f.rule === 'display-leading-tight'));
});

test('typography: body text is still brought up to Arabic leading', () => {
  const res = typography.checkElement({ text: 'التربية لا تظهر', style: { font_size: 34, line_height: 1.5, letter_spacing: 0 } });
  assert.equal(res.auto.find((o) => 'line_height' in o.formatting).formatting.line_height, 1.6);
});

const { clearOf } = require('../lib/cli');

test('reflow: a number badge over the start of a line — the box stops short of it', () => {
  // The generated post: badge 954→1018 over a text box 522→1015.
  const text = { locator_id: 'T', left: 522.72, top: 902.9, width: 492.48, height: 38.8 };
  const badge = { locator_id: 'B', left: 954.7, top: 900, width: 63.6, height: 54.7 };
  assert.deepEqual(clearOf(text, badge), { type: 'resize_element', locator_id: 'T', width: 419.98 });
});

test('reflow: a badge on the left end moves the box and narrows it', () => {
  const ops = clearOf({ locator_id: 'T', left: 100, top: 10, width: 500, height: 40 }, { locator_id: 'B', left: 90, top: 5, width: 60, height: 50 });
  assert.deepEqual(ops, [
    { type: 'position_element', locator_id: 'T', top: 10, left: 162 },
    { type: 'resize_element', locator_id: 'T', width: 438 },
  ]);
});

test('reflow: a large veil is still a layering fault', () => {
  assert.equal(clearOf({ locator_id: 'T', left: 0, top: 0, width: 400, height: 100 }, { locator_id: 'V', left: 0, top: 0, width: 400, height: 100 }), null);
  const res = reflow({ pages: [{ index: 1, elements: [
    { locator_id: 'T', text: 'مرحبا', left: 0, top: 0, width: 400, height: 100, z: 0 },
    { locator_id: 'V', left: 50, top: 20, width: 380, height: 90, z: 1 },
  ] }] });
  assert.equal(res.findings.find((f) => f.kind === 'occlusion').suggestion.type, 'layer_element');
});

// ===========================================================================
// from-read — the live read shape
// ===========================================================================

test('from-read: a live read — text under `characters`, size under `dimensions`, style runs counted', () => {
  const payload = fromRead.convert({
    design_content: { pages: [{
      type: 'fixed', id: 'PB1', locator_id: 'PB1', dimensions: { width: 1080, height: 1440 },
      elements: [{
        id: 'LB1', locator_id: 'PB1-LB1', type: 'text', top: 90, left: 522, width: 492, height: 258,
        textRegions: [
          { characters: 'تصرّفات ', formatting: { fontSize: 110, color: '#222222', lineHeight: 1.15 } },
          { characters: 'صغيرة..', formatting: { fontSize: 110, color: '#824f24', lineHeight: 1.15 } },
        ],
      }],
    }] },
  });
  const page = payload.pages[0];
  assert.equal(page.width, 1080);
  assert.equal(page.elements.length, 1, 'the page itself is not an element');
  assert.equal(page.elements[0].text, 'تصرّفات صغيرة..');
  assert.equal(page.elements[0].style_runs, 2);
});

// ===========================================================================
// taste — what the creator said they like
// ===========================================================================

const taste = require('../lib/taste');
const PREF = {
  id: 'reel-image-weight', scope: 'format:reel', instruction: 'اجعل الصورة أكبر من المتن في الريلز.',
  evidence: 'في الريلز أحب الصور أكثر من النص', recorded_at: '2026-09-29',
};

test('taste: nothing is kept without the creator\'s words as evidence', () => {
  assert.throws(() => taste.put(taste.EMPTY(), { ...PREF, evidence: '' }));
  assert.throws(() => taste.put(taste.EMPTY(), { id: 'x', scope: 'global', instruction: 'y', recorded_at: '2026-09-29' }));
});

test('taste: a campaign-only wish stays in its project; scopes are checked', () => {
  assert.throws(() => taste.put(taste.EMPTY(), { ...PREF, scope: 'campaign' }));
  const { profile } = taste.put(taste.EMPTY(), { ...PREF, id: 'black', scope: 'project:رمضان', instruction: 'أسود' });
  assert.deepEqual(taste.applicable(profile, { format: 'reel' }), []);
  assert.equal(taste.applicable(profile, { format: 'post', project: 'رمضان' }).length, 1);
});

test('taste: applied global, then format, then project — the narrow one last', () => {
  let p = taste.EMPTY();
  p = taste.put(p, { ...PREF, id: 'p', scope: 'project:x' }).profile;
  p = taste.put(p, { ...PREF, id: 'g', scope: 'global' }).profile;
  p = taste.put(p, { ...PREF, id: 'f', scope: 'format:reel' }).profile;
  assert.deepEqual(taste.applicable(p, { format: 'reel', project: 'x' }).map((e) => e.id), ['g', 'f', 'p']);
});

test('taste: every change keeps what it replaced; a signed link is refused', () => {
  const first = taste.put(taste.EMPTY(), PREF).profile;
  const second = taste.put(first, { ...PREF, instruction: 'صورة كبيرة دائمًا في الريلز.' });
  assert.equal(second.changed, true);
  assert.equal(second.profile.history.length, 2);
  assert.equal(second.profile.history[1].before.instruction, PREF.instruction);
  assert.equal(taste.put(second.profile, second.profile.preferences[0]).changed, false);
  assert.throws(() => taste.put(first, { ...PREF, design_url: 'https://www.canva.com/d/abc?token=secret' }));
});

test('taste: removal needs the creator\'s words and leaves a trace', () => {
  const p = taste.put(taste.EMPTY(), PREF).profile;
  assert.throws(() => taste.remove(p, { id: PREF.id, scope: PREF.scope, evidence: ' ', recorded_at: '2026-09-29' }));
  const gone = taste.remove(p, { id: PREF.id, scope: PREF.scope, evidence: 'لم أعد أريد ذلك', recorded_at: '2026-09-30' });
  assert.equal(gone.preferences.length, 0);
  assert.equal(gone.history.pop().action, 'remove');
});

test('taste: the seed profile holds only the creator\'s own recorded words', () => {
  const seed = taste.load(taste.profilePath());
  assert.ok(seed.preferences.length >= 3);
  for (const pref of seed.preferences) assert.ok(pref.evidence.trim().length > 0);
});

// ===========================================================================
// steps — the flat infographic layout
// ===========================================================================

const STEPS_CONTENT = {
  kicker: 'كتاب وبس',
  kickerSub: 'إضافة الوعي قبل استهلاك الوقت',
  title: 'كيف تُنجز مهامك اليومية\nفي نصف الوقت؟',
  lead: 'لا تعمل أكثر… أنجِز المهمة بتركيز.',
  note: 'جرّبها ليومين.',
  items: [
    { num: '01', iconName: 'checklist', color: '#2E7BC5', title: 'اكتب قائمة مهامك', body: 'حدِّد أهم ثلاث مهام.' },
    { num: '02', iconName: 'timer', color: '#2E7BC5', title: 'طبّق قاعدة 25 دقيقة', body: 'ركِّز على مهمة واحدة.' },
    { num: '03', iconName: 'hand', color: '#E63946', title: 'قُل «لا»', body: 'اعتذر بأدب.' },
  ],
  closing: 'أولويات واضحة + تركيز عميق',
  question: 'ما أول مهمة ستبدأ بها؟',
  brand: '@kitabwbs',
};

const stepsSpec = (extra = {}) => ({
  title: 'خطوات',
  size: { width: 1080, height: 1350 },
  palette: recipes.PALETTES.focus,
  fonts: recipes.PAIRINGS.modern,
  pattern: { kind: 'none' },
  blocks: recipes.LAYOUTS.steps(STEPS_CONTENT, recipes.PALETTES.focus),
  ...extra,
});

test('steps: flat rows parted by a rule — no card, no shadow', () => {
  const { html } = compose.compose(stepsSpec({ divider: '#D2D4D7' }));
  assert.match(html, /\.step\{[^}]*border-top:1px solid #D2D4D7/);
  assert.match(html, /\.step:first-child\{border-top:0/);
  // The brief that drove this layout says no shadows; .item (the card list)
  // has one, so the two must not share a rule.
  const stepBlock = html.match(/\.step\{[^}]*\}/)[0];
  assert.ok(!/box-shadow/.test(stepBlock), stepBlock);
  assert.ok(!/border-radius/.test(stepBlock), stepBlock);
});

test('steps: the number keeps its own colour, and the icon takes it too', () => {
  const { html } = compose.compose(stepsSpec());
  assert.match(html, /<div class="step-num" style="color:#2E7BC5">01<\/div>/);
  assert.match(html, /<div class="step-num" style="color:#E63946">03<\/div>/);
  assert.equal((html.match(/class="step-icon"/g) || []).length, 3);
  assert.match(html, /stroke="#E63946"/);
});

test('steps: the copy still goes through the checks on its way in', () => {
  const built = compose.compose(stepsSpec(), { numerals: 'arabic-indic' });
  assert.match(built.html, /٢٥/, 'numerals convert inside a step body');
  assert.ok(!/<script/i.test(built.html));
});

test('palette focus: every colour it sets on text passes at the size it is used', () => {
  const { issues } = compose.compose(stepsSpec({
    sizes: { stepNum: 38, stepTitle: 24, stepBody: 18, title: 44, body: 25, eyebrow: 26 },
  }));
  assert.deepEqual(issues, []);
});

test('palette focus: its blue and red are large-text colours, never body colours', () => {
  const p = recipes.PALETTES.focus;
  for (const color of [p.accent, p.alert]) {
    const big = detect.checkContrast({ color, background: p.bg, fontSize: 38, fontWeight: 700 });
    const small = detect.checkContrast({ color, background: p.bg, fontSize: 18, fontWeight: 400 });
    assert.equal(big.pass, true, `${color} at 38px bold`);
    assert.equal(small.pass, false, `${color} at 18px — must never be body copy`);
  }
  // The brief's own green measured 2.42:1, under even the large-text floor.
  assert.equal(detect.checkContrast({ color: '#10B981', background: p.bg, fontSize: 38, fontWeight: 700 }).pass, false);
  assert.equal(detect.checkContrast({ color: p.success, background: p.bg, fontSize: 38, fontWeight: 700 }).pass, true);
});

test('compose: an explicit margin replaces the computed one, safe areas adding to it', () => {
  const { html } = compose.compose(stepsSpec({ pad: 80, safeArea: { top: 20, bottom: 40 } }));
  assert.match(html, /padding:100px 80px 120px/);
});

test('compose: the colour-check square is the page background, in the corner', () => {
  const { html } = compose.compose(stepsSpec({ checkSquare: '#F8FAFC' }));
  assert.match(html, /\.check\{position:absolute;left:0;bottom:0;width:10px;height:10px;background:#F8FAFC\}/);
  assert.match(html, /<div class="check"><\/div>/);
  assert.ok(!compose.compose(stepsSpec()).html.includes('class="check"'));
});

test('compose: a brand lockup keeps its own edge when the head is centred', () => {
  const { html } = compose.compose(stepsSpec({ titleAlign: 'center', eyebrowAlign: 'start' }));
  assert.match(html, /\.head\{position:relative;text-align:center\}/);
  assert.match(html, /\.eyebrow\{[^}]*text-align:start\}/);
});

test('icons: every name the steps layout uses draws a real SVG', () => {
  for (const name of ['checklist', 'timer', 'arrow', 'plane', 'review', 'hand']) {
    const svg = patterns.icon(name, { stroke: '#2E7BC5', size: 42 });
    assert.match(svg, /^<svg [^>]*width="42"/);
    assert.match(svg, /stroke="#2E7BC5"/);
    assert.ok(svg.includes('<path') || svg.includes('<circle'), name);
    // Every drawn coordinate inside the 64×64 box — one outside it clips.
    const geometry = [...svg.matchAll(/(?:\sd="([^"]+)"|c[xy]="([\d.]+)"|\sr="([\d.]+)")/g)]
      .flatMap((m) => (m[1] || m[2] || m[3]).match(/[\d.]+/g) || []);
    assert.ok(geometry.length > 3, name);
    for (const n of geometry.map(Number)) assert.ok(n >= 0 && n <= 64, `${name}: ${n}`);
  }
});
