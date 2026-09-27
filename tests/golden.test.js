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

const { RLE, PDF, LRI, PDI } = bidi.CONTROLS;

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
  assert.equal(res.auto.length, 0);
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
  assert.equal(res.auto.length, 0);
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

test('detect: Arabic is narrower than Latin but taller', () => {
  const ar = detect.estimateTextWidth('مرحبا بالعالم', 20);
  const en = detect.estimateTextWidth('hello worldxx', 20);
  assert.ok(ar < en);
});

test('detect: overflow is estimated against the box', () => {
  const res = detect.estimateOverflow({
    text: 'نص طويل جدا يتجاوز عرض الصندوق المتاح بكل تأكيد ولا يتسع أبدا',
    fontSize: 40, width: 100, height: 50, lineHeight: 1.6,
  });
  assert.equal(res.overflows, true);
  assert.equal(res.confidence, 'estimate');
});

test('detect: a comfortable box does not overflow', () => {
  const res = detect.estimateOverflow({
    text: 'مرحبا', fontSize: 16, width: 400, height: 200, lineHeight: 1.6,
  });
  assert.equal(res.overflows, false);
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
  const res = spelling.check('شكراً جزيلاً');
  assert.ok(res.some((f) => f.rule === 'tanween-order'));
  assert.equal(spelling.autofix('شكراً').text, 'شكرًا');
});

test('spelling: Persian yeh inside Arabic text is caught', () => {
  assert.ok(spelling.check('العربی').some((f) => f.rule === 'persian-yeh'));
  assert.equal(spelling.autofix('العربی').text, 'العربي');
});

test('spelling: Persian keheh inside Arabic text is caught', () => {
  assert.equal(spelling.autofix('کتاب').text, 'كتاب');
});

test('spelling: common hamza mistakes are caught', () => {
  assert.ok(spelling.check('انشاء الموقع').some((f) => f.rule === 'hamza'));
  assert.equal(spelling.autofix('انشاء الموقع').text, 'إنشاء الموقع');
});

test('spelling: ta marbuta written as ha is caught on known words', () => {
  assert.equal(spelling.autofix('الحياه جميله').text, 'الحياة جميلة');
});

test('spelling: alef maqsura written as ya is caught on known words', () => {
  assert.equal(spelling.autofix('الي اللقاء').text, 'إلى اللقاء');
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

test('spelling: autofix is idempotent', () => {
  const once = spelling.autofix('شكراً  جزيلا ، الي اللقاء').text;
  assert.equal(spelling.autofix(once).text, once);
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

const { analyze, batchByPage } = require('../lib/cli');

/** One fixed page holding one element, with the style fields a test cares about. */
const onePage = (element, page = {}) => ({
  pages: [{ index: 1, width: 1080, height: 1080, elements: [element], ...page }],
});

test('cli: the text chain runs spelling, then numerals, then tatweel, then bidi', () => {
  const res = analyze(
    onePage({ locator_id: 'L1', text: 'شكراً, زوروا www.example.com عام 2024' }),
    { numerals: 'arabic-indic' }
  );
  const op = res.auto.find((a) => a.op.type === 'replace_text').op;
  assert.equal(
    op.text,
    RLE + 'شكرًا، زوروا ' + LRI + 'www.example.com' + PDI + ' عام ٢٠٢٤' + PDF
  );
});

test('cli: a responsive page gets find_and_replace_text, never replace_text', () => {
  const res = analyze(
    onePage({ locator_id: 'L1', text: 'مرحبا بالعالم' }, { is_responsive: true })
  );
  const op = res.auto[0].op;
  assert.equal(op.type, 'find_and_replace_text');
  assert.equal(op.find_text, 'مرحبا بالعالم');
  assert.equal(op.replace_text, RLE + 'مرحبا بالعالم' + PDF);
});

test('cli: a responsive page cannot take format_text, so it is blocked', () => {
  const res = analyze(
    onePage(
      { locator_id: 'L1', text: 'مرحبا', style: { font_style: 'italic', letter_spacing: 0 } },
      { is_responsive: true }
    )
  );
  assert.ok(!res.auto.some((a) => a.op.type === 'format_text'));
  assert.equal(res.blocked[0].op.type, 'format_text');
});

test('cli: a page that is not editable queues nothing at all', () => {
  const res = analyze(
    onePage(
      { locator_id: 'L1', text: 'مرحبا', style: { font_style: 'italic', letter_spacing: 0 } },
      { is_editable: false }
    )
  );
  assert.equal(res.auto.length, 0);
  assert.ok(res.blocked.length > 0);
  assert.ok(res.blocked.every((b) => /is_editable/.test(b.reason)));
});

test('cli: overflow is judged against the line height this pass is about to set', () => {
  // Fits at 1.1, overflows once the Arabic minimum of 1.6 is applied.
  const element = {
    locator_id: 'L1', text: 'سطر أول\nسطر ثان\nسطر ثالث\nسطر رابع',
    left: 0, top: 0, width: 400, height: 150,
    style: { font_size: 24, line_height: 1.1, letter_spacing: 0 },
  };
  assert.equal(
    detect.estimateOverflow({ text: element.text, fontSize: 24, width: 400, height: 150, lineHeight: 1.1 }).overflows,
    false
  );
  const res = analyze(onePage(element));
  assert.ok(res.auto.some((a) => /فيض/.test(a.reason)));
});

test('cli: a Latin-only element produces no text operation', () => {
  const res = analyze(onePage({ locator_id: 'L1', text: 'Hello, world' }));
  assert.equal(res.auto.length, 0);
  assert.equal(res.preview.length, 0);
});

test('cli: an already-fixed design is a no-op on the second pass', () => {
  const design = onePage({ locator_id: 'L1', text: 'مرحبا Claude، عام ٢٠٢٤', style: { letter_spacing: 0 } });
  const first = analyze(design, { numerals: 'arabic-indic' });
  const fixed = onePage(
    { locator_id: 'L1', text: first.auto[0].op.text, style: { letter_spacing: 0 } }
  );
  assert.equal(analyze(fixed, { numerals: 'arabic-indic' }).auto.length, 0);
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
  const res = analyze(
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
