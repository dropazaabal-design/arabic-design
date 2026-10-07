'use strict';

/**
 * speech.js — Arabic text as a voice has to say it.
 *
 * A design text and a narration script are not the same string. What a reel
 * frame shows is laid out; what a TTS model reads is spoken, and four things
 * that are correct on screen are wrong in the ear:
 *
 *   1. BiDi controls. Every string that came back through the Canva gate
 *      carries RLM/LRM/RLE/PDF. They are invisible to a reader and they are
 *      characters to a character-level model. They are stripped, always.
 *   2. Digits. NAMAA-Egyptian-TTS says so itself: "Numbers are sometimes not
 *      uttered correctly." Habibi inherits F5-TTS's character vocabulary and
 *      reads digits the way its training data happened to. The fix is not to
 *      hope: the digits are spelled out as words before the text is sent.
 *   3. Handles, URLs and e-mails. "@kitabwbs" is read letter by letter or
 *      skipped. A voiceover says «تابعنا», not an at-sign. They come out, and
 *      what came out is reported — never dropped silently.
 *   4. Tatweel. ـــ is a typographic stretch, not a sound.
 *
 * Two engines, measured from their own sources, not from their marketing:
 *
 *   Habibi-TTS         github.com/SWivid/Habibi-TTS — F5-TTS, 12 dialect ids,
 *                      zero-shot cloning from a reference clip + its transcript,
 *                      no diacritization needed, 24 kHz out (vocos-mel-24khz).
 *   NAMAA-Egyptian-TTS huggingface.co/NAMAA-Space/NAMAA-Egyptian-TTS —
 *                      Chatterbox Multilingual, Egyptian only, reference audio
 *                      optional, MIT (commercial use allowed).
 *
 * This module is pure: it decides, it rewrites, it builds the command line. It
 * never spawns anything and never touches the disk. The driver that does both
 * is `lib/cli.js speak`.
 */

const { stripBidiControls, TATWEEL, hasArabic } = require('./bidi');
const { toNumber, ANY_DIGIT_RE } = require('./numerals');

// ---------------------------------------------------------------------------
// Engines
// ---------------------------------------------------------------------------

/**
 * The twelve dialect ids Habibi ships, plus UNK (infer the dialect from the
 * reference clip). `specialized` is the subset with its own checkpoint;
 * `cliBlocked` is measured from infer_cli.py, not guessed — see ENGINES.habibi.
 */
const DIALECTS = {
  UNK: { ar: 'غير محدّد', note: 'اللهجة تُستنتج من المقطع المرجعي' },
  MSA: { ar: 'الفصحى', specialized: true, step: 200000, licence: 'Apache-2.0' },
  SAU: { ar: 'السعودية (نجدي)', specialized: true, step: 200000, licence: 'CC-BY-NC-SA-4.0' },
  UAE: { ar: 'الإماراتية', specialized: true, step: 100000, licence: 'CC-BY-NC-SA-4.0' },
  ALG: { ar: 'الجزائرية', specialized: true, step: 100000, licence: 'Apache-2.0' },
  IRQ: { ar: 'العراقية', specialized: true, step: 100000, licence: 'Apache-2.0' },
  EGY: { ar: 'المصرية', specialized: true, step: 100000, licence: 'Apache-2.0' },
  MAR: { ar: 'المغربية', specialized: false, licence: 'Apache-2.0' },
  OMN: { ar: 'العُمانية', specialized: false },
  TUN: { ar: 'التونسية', specialized: false },
  LEV: { ar: 'الشامية', specialized: false },
  SDN: { ar: 'السودانية', specialized: false },
  LBY: { ar: 'الليبية', specialized: false },
};

/** Dialects whose numerals are read in the Egyptian register. */
const EGY_REGISTER = new Set(['EGY']);

const ENGINES = {
  habibi: {
    id: 'habibi',
    name: 'Habibi-TTS',
    ar: 'حبيبي',
    model: 'SWivid/Habibi-TTS',
    home: 'https://github.com/SWivid/Habibi-TTS',
    paper: 'arXiv:2601.13802',
    install: 'pip install habibi-tts',
    bin: 'habibi-tts_infer-cli',
    gui: 'habibi-tts_infer-gradio',
    sampleRate: 24000,              // vocos-mel-24khz
    dialects: Object.keys(DIALECTS),
    // Zero-shot cloning: the reference clip AND its transcript are both needed.
    reference: 'required',
    diacritics: 'not-needed',       // the paper synthesises undiacritized text
    codeSwitch: true,               // AR+EN / AR+FR demonstrated
    licence: { code: 'MIT', weights: 'per-dialect — see DIALECTS[…].licence' },
    // Measured in src/habibi_tts/infer/infer_cli.py: the assert that guards
    // --dialect lists IRQ twice and omits MAR, so the CLI rejects MAR although
    // dialect_id_map defines it. The Gradio GUI accepts it. Reported, not
    // worked around: a flag we invent would break on the next release.
    cliBlocked: ['MAR'],
  },
  'namaa-egyptian': {
    id: 'namaa-egyptian',
    name: 'NAMAA-Egyptian-TTS',
    ar: 'نماء المصرية',
    model: 'NAMAA-Space/NAMAA-Egyptian-TTS',
    home: 'https://huggingface.co/NAMAA-Space/NAMAA-Egyptian-TTS',
    base: 'ResembleAI/chatterbox — Multilingual',
    install: 'pip install chatterbox-tts torchaudio huggingface-hub safetensors',
    bin: 'python3',
    checkpoint: 't3_mtl23ls_v2.safetensors',
    languageId: 'ar',
    sampleRate: 24000,              // model.sr — chatterbox S3Gen
    dialects: ['EGY'],
    reference: 'optional',
    diacritics: 'not-needed',
    codeSwitch: false,
    licence: { code: 'MIT', weights: 'MIT' },
    cliBlocked: [],
    // From the model card, verbatim in substance: these are the three the
    // authors name. The first two have a mitigation here; the third does not.
    quirks: [
      { code: 'qaf', ar: 'قد تسقط «ق» في النطق المصري.', mitigation: null },
      { code: 'numbers', ar: 'الأرقام تُنطق خطأً أحيانًا.', mitigation: 'digits-to-words' },
      { code: 'prompt-drift', ar: 'قد يفترق الصوت عن النص حسب المقطع المرجعي.', mitigation: null },
    ],
  },
};

/**
 * Choose the engine for a dialect.
 *
 * EGY has two: NAMAA is purpose-built for it and MIT throughout, so it wins
 * when it is installed. Everything else is Habibi's. `use: 'commercial'`
 * refuses the three Habibi checkpoints whose weights are CC-BY-NC-SA-4.0
 * (Unified, SAU, UAE) — restricted by the SADA and Mixat corpora — rather than
 * letting a monetised reel ship on non-commercial weights.
 */
function pickEngine(options = {}) {
  const dialect = String(options.dialect || 'MSA').toUpperCase();
  const installed = options.installed || null;     // null = unknown, don't filter
  const commercial = options.use === 'commercial';
  const has = (id) => installed === null || installed.includes(id);
  const warnings = [];
  const notes = [];

  if (!DIALECTS[dialect]) {
    return { ok: false, dialect, reason: `لهجة غير معروفة: ${dialect}`, known: Object.keys(DIALECTS) };
  }

  const candidates = [];
  if (dialect === 'EGY') candidates.push('namaa-egyptian', 'habibi');
  else candidates.push('habibi');

  const engineId = candidates.find(has) || candidates[0];
  const engine = ENGINES[engineId];
  const available = has(engineId);

  if (!available) warnings.push(`${engine.name} غير مثبّت: ${engine.install}`);
  if (dialect === 'EGY' && engineId === 'habibi' && installed) {
    notes.push('نماء المصرية غير مثبّتة، فالمصرية على حبيبي.');
  }

  // Which Habibi checkpoint, and may it be used for money?
  let variant = null;
  let licence = engine.licence.weights;
  if (engineId === 'habibi') {
    const spec = DIALECTS[dialect];
    const blocked = engine.cliBlocked.includes(dialect);
    if (blocked) {
      warnings.push(
        `سطر أوامر حبيبي يرفض ${dialect} اليوم (assert في infer_cli.py يُسقطها ويكرّر IRQ). `
        + `استعمل ${engine.gui} أو مرّر --dialect UNK مع مقطع مرجعي ${dialect}.`
      );
    }
    variant = spec.specialized && !blocked ? 'Specialized' : 'Unified';
    licence = variant === 'Specialized' ? spec.licence : 'CC-BY-NC-SA-4.0';
    if (variant === 'Unified' && spec.specialized === false) {
      notes.push(`لا نسخة متخصّصة لـ${dialect}؛ النموذج الموحّد يغطّيها.`);
    }
  }

  const nonCommercial = typeof licence === 'string' && licence.startsWith('CC-BY-NC');
  if (commercial && nonCommercial) {
    warnings.push(
      `وزن ${engineId === 'habibi' ? variant : engine.name} تحت ${licence}: غير تجاري. `
      + (dialect === 'EGY'
        ? 'استعمل نماء المصرية (MIT).'
        : 'النسخ المتخصّصة بـApache-2.0 (MSA، ALG، IRQ، EGY) تصلح للتجاري.')
    );
  }

  return {
    ok: true,
    engine: engineId,
    name: engine.name,
    dialect,
    dialectAr: DIALECTS[dialect].ar,
    variant,
    licence,
    commercialOk: !nonCommercial,
    installed: available,
    sampleRate: engine.sampleRate,
    reference: engine.reference,
    register: EGY_REGISTER.has(dialect) ? 'egy' : 'msa',
    warnings,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Numbers as words
// ---------------------------------------------------------------------------

const ONES = {
  msa: ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'],
  egy: ['صفر', 'واحد', 'اتنين', 'تلاتة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'تمانية', 'تسعة'],
};
const TEENS = {
  msa: ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'],
  egy: ['عشرة', 'حداشر', 'اتناشر', 'تلاتاشر', 'أربعتاشر', 'خمستاشر', 'ستاشر', 'سبعتاشر', 'تمنتاشر', 'تسعتاشر'],
};
const TENS = {
  msa: [null, null, 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'],
  egy: [null, null, 'عشرين', 'تلاتين', 'أربعين', 'خمسين', 'ستين', 'سبعين', 'تمانين', 'تسعين'],
};
const HUNDREDS = {
  msa: [null, 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة'],
  egy: [null, 'مية', 'ميتين', 'تلتمية', 'أربعمية', 'خمسمية', 'ستمية', 'سبعمية', 'تمنمية', 'تسعمية'],
};
/** The counting form before a plural: «تلات آلاف», not «تلاتة آلاف». */
const EGY_COUNT = [null, null, null, 'تلات', 'أربع', 'خمس', 'ست', 'سبع', 'تمن', 'تسع', 'عشر'];

function sub100(n, reg) {
  if (n < 10) return ONES[reg][n];
  if (n < 20) return TEENS[reg][n - 10];
  const unit = n % 10;
  const ten = TENS[reg][Math.floor(n / 10)];
  return unit ? `${ONES[reg][unit]} و${ten}` : ten;
}

function sub1000(n, reg) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (hundred) parts.push(HUNDREDS[reg][hundred]);
  if (rest) parts.push(sub100(rest, reg));
  return parts.join(' و');
}

/** «ثلاثة آلاف» / «تلات آلاف»: 3–10 take the counting form, 11+ the full one. */
function scaled(n, reg, one, two, plural, singular) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n <= 10) return `${reg === 'egy' ? EGY_COUNT[n] : ONES[reg][n]} ${plural}`;
  return `${sub1000(n, reg)} ${singular}`;
}

/**
 * «تلات ساعات», not «تلاتة ساعات».
 *
 * Egyptian 3–10 standing directly before the thing it counts takes a shortened
 * form, and the form is invariant — one table covers every noun. MSA has the
 * same position and a harder rule: the number agrees in gender with what it
 * counts, inverted («ثلاث ساعات» but «ثلاثة أيام»), and the gender is a
 * property of the noun this module does not know. So this fires for the
 * Egyptian register only. MSA keeps the citation form, which is understood and
 * wrong in gender rather than guessed and wrong in gender.
 *
 * Returns null when it does not apply, and the caller reads the full number.
 */
const COUNTED_NEXT_RE = /^[ \u00a0]+([\u0621-\u064A][\u0621-\u064A\u064B-\u0652]*)/;

/**
 * A particle is not a thing to count. «٣ إلى ٥» is a range and «٣ ساعات» is
 * three hours, and only the second takes the shortened form.
 */
const NOT_COUNTED = new Set([
  'إلى', 'الى', 'او', 'أو', 'ثم', 'في', 'من', 'على', 'عن', 'مع', 'حتى',
  'أن', 'إن', 'لا', 'ما', 'هو', 'هي', 'هم', 'لكن', 'بس', 'يعني', 'كمان',
  'فقط', 'تقريبًا', 'تقريبا', 'كل', 'أي', 'بين', 'قبل', 'بعد', 'عند',
]);

function countingForm(digits, after, register) {
  if (register !== 'egy') return null;
  const n = toNumber(digits);
  if (!Number.isInteger(n) || n < 3 || n > 10) return null;
  const next = COUNTED_NEXT_RE.exec(String(after || ''));
  if (!next || NOT_COUNTED.has(next[1])) return null;
  return EGY_COUNT[n];
}

const MAX_SPOKEN = 999999999;

/**
 * An integer as Arabic words, in the MSA or the Egyptian register.
 *
 * The two registers differ from the first digit up: ٢ is «اثنان» and «اتنين»,
 * ٣٠٠ is «ثلاثمئة» and «تلتمية». Only EGY uses the Egyptian register; the other
 * eleven dialects read MSA numerals here. That is a decision, not a claim that
 * every dialect says them so — the Levant has its own forms, and when a
 * measured reading says they are worth splitting out, they get their own table.
 *
 * Returns null above 999,999,999: a number that long is not spoken in a reel,
 * and a wrong reading is worse than the digits.
 */
function numberToWords(value, options = {}) {
  const reg = options.register === 'egy' ? 'egy' : 'msa';
  let n = Number(value);
  if (!Number.isFinite(n)) return null;
  const negative = n < 0;
  n = Math.abs(Math.trunc(n));
  if (n > MAX_SPOKEN) return null;
  if (n === 0) return negative ? 'ناقص صفر' : 'صفر';

  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const rest = n % 1000;
  const parts = [];

  if (millions) {
    parts.push(scaled(millions, reg,
      'مليون', reg === 'egy' ? 'مليونين' : 'مليونان', 'ملايين', reg === 'egy' ? 'مليون' : 'مليونًا'));
  }
  if (thousands) {
    parts.push(scaled(thousands, reg,
      'ألف', reg === 'egy' ? 'ألفين' : 'ألفان', 'آلاف', reg === 'egy' ? 'ألف' : 'ألفًا'));
  }
  if (rest) parts.push(sub1000(rest, reg));

  const words = parts.join(' و');
  return negative ? `ناقص ${words}` : words;
}

/**
 * Count a thing the way Arabic counts it: «كلمة واحدة»، «كلمتان»، «أربع كلمات»،
 * «أربع عشرة كلمة». A warning that says «احذف 4 كلمة» is a warning written by
 * something that does not read Arabic, and this file's whole subject is the
 * opposite of that.
 */
function counted(n, forms) {
  const count = Math.abs(Math.round(Number(n) || 0));
  if (count === 1) return forms.one;
  if (count === 2) return forms.two;
  return `${count} ${count >= 3 && count <= 10 ? forms.few : forms.many}`;
}

const WORDS = { one: 'كلمة واحدة', two: 'كلمتين', few: 'كلمات', many: 'كلمة' };

// ---------------------------------------------------------------------------
// Speakable text
// ---------------------------------------------------------------------------

/**
 * Short vowels, tanwin, sukun and the dagger alef — but NOT shadda (U+0651).
 * `bidi.HARAKAT_RE` groups them all, which is right for spotting fabricated
 * diacritics on a design. It is wrong here: «تغيّر» and «مدرّس» are ordinary
 * unvoweled spellings that happen to carry a shadda, and counting them as
 * voweled makes every second line look half-diacritized. Stripping is split the
 * same way — a dropped shadda loses the gemination the model can hear.
 */
const VOWEL_RE = /[\u064B-\u0650\u0652\u0670]/;
const VOWEL_GLOBAL = new RegExp(VOWEL_RE.source, 'g');

/**
 * Runs a voice cannot read. These are scanned here and not with
 * `bidi.scanProtectedSpans`: that scanner merges neighbours on purpose, because
 * BiDi isolation wants «5 GB» as one run. Speech wants the opposite — each run
 * judged on its own, so a handle can go and the brand name beside it can stay.
 */
const SPEECH_SPANS = [
  ['url', /(?:https?:\/\/|www\.)[^\s؀-ۿ]+/gi],
  ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
  ['handle', /[@#][A-Za-z0-9._؀-ۿ-]+/g],
  ['phone', /\+\d[\d  ()-]{4,}\d/g],
  ['code', /`[^`\n]*`/g],
];

/** Emoji and the pictographic blocks a TTS front-end has no sound for. */
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

const PERCENT = { msa: 'في المئة', egy: 'في المية' };
const DECIMAL = { msa: 'فاصلة', egy: 'فاصلة' };
const RANGE = { msa: ['من', 'إلى '], egy: ['من', 'ل'] };   // «إلى خمسة» but «لخمسة»

function readDigits(raw, reg) {
  const n = toNumber(raw);
  return Number.isNaN(n) ? null : numberToWords(n, { register: reg });
}

/**
 * Rewrite one line the way the engine should receive it.
 *
 * Order matters: controls first (they sit inside words and would break every
 * pattern after them), spans second (so a digit inside a URL is never read),
 * numbers last.
 *
 * Returns the text plus a full account of what changed — nothing is removed
 * without a line in `dropped` naming it.
 */
function speakable(input, options = {}) {
  const reg = options.register === 'egy' ? 'egy' : 'msa';
  const keepHandles = options.handles === 'keep';
  const keepHarakat = options.harakat !== 'strip';
  const dropped = [];
  const changes = [];
  const warnings = [];

  let text = String(input == null ? '' : input);

  if (text !== stripBidiControls(text)) changes.push('bidi-controls');
  text = stripBidiControls(text);

  if (text.includes(TATWEEL)) {
    changes.push('tatweel');
    text = text.split(TATWEEL).join('');
  }

  if (!keepHarakat && VOWEL_RE.test(text)) {
    changes.push('harakat');
    text = text.replace(VOWEL_GLOBAL, '');
  } else if (keepHarakat) {
    // Partly-voweled text is the signature of a generator, and a wrong fatha is
    // a wrong vowel in the ear. Said, not silently fixed: they are the author's.
    const words = text.split(/\s+/).filter((w) => hasArabic(w));
    const voweled = words.filter((w) => VOWEL_RE.test(w)).length;
    const some = counted(voweled, WORDS);
    if (voweled && voweled < words.length) {
      warnings.push({
        code: 'harakat.partial',
        ar: `${some} من ${words.length} مشكولة والباقي لا. حبيبي ونماء لا يحتاجان الشكل؛ `
          + 'شكلٌ ناقص يُنطق كما كُتب. وحّدها أو أزلها بـ --no-harakat.',
      });
    }
  }

  if (EMOJI_RE.test(text)) {
    changes.push('emoji');
    text = text.replace(EMOJI_RE, ' ');
  }

  // --- spans ---------------------------------------------------------------
  const spans = [];
  SPEECH_SPANS.forEach(([kind, re]) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m[0] === '') { re.lastIndex += 1; continue; }
      spans.push({ start: m.index, end: m.index + m[0].length, kind, raw: m[0] });
    }
  });
  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept = [];
  for (const span of spans) {
    const last = kept[kept.length - 1];
    if (last && span.start < last.end) continue;
    kept.push(span);
  }
  for (let i = kept.length - 1; i >= 0; i -= 1) {
    const span = kept[i];
    const keep = span.kind === 'handle' && keepHandles;
    if (keep) continue;
    dropped.push({ kind: span.kind, text: span.raw });
    text = `${text.slice(0, span.start)} ${text.slice(span.end)}`;
  }

  // --- numbers -------------------------------------------------------------
  if (ANY_DIGIT_RE.test(text)) {
    const D = '[0-9٠-٩۰-۹]';
    const before = text;
    // ٨٠٪ / 80%
    text = text.replace(new RegExp(`(${D}+)\\s*[%٪]`, 'g'),
      (m, d) => { const w = readDigits(d, reg); return w ? `${w} ${PERCENT[reg]}` : m; });
    // 3.5 / ٣٫٥
    text = text.replace(new RegExp(`(${D}+)\\s*[.٫]\\s*(${D}+)`, 'g'),
      (m, a, b) => { const x = readDigits(a, reg); const y = readDigits(b, reg); return x && y ? `${x} ${DECIMAL[reg]} ${y}` : m; });
    // 3-5 / ٣–٥
    text = text.replace(new RegExp(`(${D}+)\\s*[-–—]\\s*(${D}+)`, 'g'),
      (m, a, b) => { const x = readDigits(a, reg); const y = readDigits(b, reg); return x && y ? `${RANGE[reg][0]} ${x} ${RANGE[reg][1]}${y}` : m; });
    // what is left standing on its own
    text = text.replace(new RegExp(`${D}+`, 'g'), (m, offset, whole) => {
      const counted = countingForm(m, whole.slice(offset + m.length), reg);
      if (counted) return counted;
      const w = readDigits(m, reg);
      if (w) return w;
      warnings.push({ code: 'number.too-long', ar: `الرقم «${m}» أطول من أن يُقرأ كلمات؛ تُرك كما هو.` });
      return m;
    });
    if (text !== before) changes.push('digits-to-words');
  }

  // --- pauses and whitespace ----------------------------------------------
  text = text
    .replace(/…/g, '،')                    // … → ، (a breath, not three dots)
    .replace(/\s*[–—]\s*/g, '، ')     // – — → ، 
    .replace(/([!؟?.])\1+/g, '$1')                   // !!! → !
    .replace(/\n+/g, '، ')                      // a line break inside a scene is a pause
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s+([،؛.!؟?])/g, '$1')
    .replace(/([،؛])\1+/g, '$1')
    .trim()
    .replace(/^[،؛.\s]+/, '')
    .trim();

  return { text, dropped, changes, warnings };
}

// ---------------------------------------------------------------------------
// Pacing
// ---------------------------------------------------------------------------

/**
 * Seconds a narration line is likely to take, read at reel pace.
 *
 * 2.6 words a second is the working figure for Arabic narration, plus a breath
 * at each full stop. It is an ESTIMATE and it is labelled one everywhere it is
 * used: the only true duration is the one ffprobe reads off the rendered file.
 */
const WORDS_PER_SECOND = 2.6;
const BREATH = 0.25;

function estimateSeconds(text) {
  const clean = String(text || '').trim();
  if (!clean) return 0;
  const words = clean.split(/\s+/).length;
  const stops = (clean.match(/[،؛.!؟?]/g) || []).length;
  return Math.round((words / WORDS_PER_SECOND + stops * BREATH) * 10) / 10;
}

/**
 * Split a long line at sentence ends so a model that degrades on long inputs
 * gets whole sentences. Never splits mid-sentence: a cut between two clauses is
 * audible as a swallowed word.
 */
function segment(text, options = {}) {
  const max = Number(options.maxChars) || 300;
  const clean = String(text || '').trim();
  if (!clean) return [];
  if (clean.length <= max) return [clean];

  const pieces = clean.split(/(?<=[.!؟?،؛])\s+/);
  const out = [];
  let buffer = '';
  for (const piece of pieces) {
    if (!buffer) buffer = piece;
    else if (`${buffer} ${piece}`.length <= max) buffer += ` ${piece}`;
    else { out.push(buffer); buffer = piece; }
  }
  if (buffer) out.push(buffer);
  return out;
}

// ---------------------------------------------------------------------------
// A reel plan becomes a script
// ---------------------------------------------------------------------------

/**
 * Slots that belong in the voiceover, in reading order.
 *
 * `actions` is deliberately absent. The chips on a closing scene («احفظه»,
 * «تابعنا @kitabwbs») are read off the screen, and a voice that also says them
 * repeats the title it just said and then spells out a handle. They stay
 * visual. `art` and `assets` are not text at all.
 */
const SPOKEN_SLOTS = ['kicker', 'number', 'title', 'subtitle', 'quote'];

function sceneLine(scene) {
  const content = scene.content || {};
  const parts = [];
  for (const slot of SPOKEN_SLOTS) {
    const value = content[slot];
    if (typeof value === 'string' && value.trim()) parts.push(value.trim());
  }
  if (!parts.length && Array.isArray(scene.text)) {
    for (const t of scene.text) if (t && typeof t.text === 'string') parts.push(t.text.trim());
  }
  return parts.join('، ');
}

/**
 * Turn a reel plan (`kind: "reel-plan"` from canva_build_reel) into one
 * narration line per scene, each with the verdict that matters: does the voice
 * fit the scene the plan already timed?
 *
 * The verdict never proposes speeding the voice up. Habibi has `--speed` and
 * `--fix_duration` and both are refused here for the same reason the reel rules
 * refuse shrinking type: a scene that does not fit has too many words in it.
 * Cut words.
 */
function scriptFromReel(plan, options = {}) {
  const choice = pickEngine(options);
  if (!choice.ok) return { ok: false, ...choice };

  const scenes = Array.isArray(plan && plan.scenes) ? plan.scenes : [];
  if (!scenes.length) {
    return { ok: false, reason: 'الخطة بلا مشاهد: مرّر ملف reel-plan من canva_build_reel.' };
  }

  const out = [];
  const warnings = [];
  const dropped = [];

  scenes.forEach((scene, i) => {
    const raw = sceneLine(scene);
    const said = speakable(raw, { register: choice.register, handles: options.handles, harakat: options.harakat });
    const estimate = estimateSeconds(said.text);
    const budget = Number(scene.seconds) || 0;
    // A scene is tight when the voice leaves under a quarter-second of air.
    const slack = Math.round((budget - estimate) * 10) / 10;
    const fit = !budget ? 'unknown' : slack < 0 ? 'overflow' : slack < 0.25 ? 'tight' : 'fits';

    if (fit === 'overflow') {
      warnings.push({
        code: 'voice.overflow',
        scene: scene.n || i + 1,
        ar: `المشهد ${scene.n || i + 1}: التعليق ${estimate}ث تقديرًا والمشهد ${budget}ث. `
          + `احذف نحو ${counted(Math.ceil(Math.abs(slack) * WORDS_PER_SECOND), WORDS)} — لا تسرّع الصوت.`,
      });
    }
    said.warnings.forEach((w) => warnings.push({ ...w, scene: scene.n || i + 1 }));
    said.dropped.forEach((d) => dropped.push({ ...d, scene: scene.n || i + 1 }));

    out.push({
      n: scene.n || i + 1,
      role: scene.role || null,
      source: raw,
      text: said.text,
      chunks: segment(said.text, options),
      changes: said.changes,
      estimateSeconds: estimate,
      sceneSeconds: budget || null,
      slack: budget ? slack : null,
      fit,
      file: `scene-${String(scene.n || i + 1).padStart(2, '0')}.wav`,
    });
  });

  const estimated = Math.round(out.reduce((s, x) => s + x.estimateSeconds, 0) * 10) / 10;
  return {
    ok: true,
    kind: 'voice-script',
    version: 1,
    engine: choice.engine,
    name: choice.name,
    dialect: choice.dialect,
    dialectAr: choice.dialectAr,
    variant: choice.variant,
    licence: choice.licence,
    commercialOk: choice.commercialOk,
    register: choice.register,
    sampleRate: choice.sampleRate,
    reference: choice.reference,
    title: (plan && plan.title) || null,
    scenes: out,
    estimatedSeconds: estimated,
    planSeconds: (plan && plan.totalSeconds) || null,
    dropped,
    warnings: [...choice.warnings.map((ar) => ({ code: 'engine', ar })), ...warnings],
    notes: choice.notes,
  };
}

// ---------------------------------------------------------------------------
// Command lines
// ---------------------------------------------------------------------------

/** Shell-quote one argument for the copyable command the skill prints. */
function quote(arg) {
  return /^[A-Za-z0-9_@%+=:,./-]+$/.test(arg) ? arg : `'${String(arg).split("'").join(`'\\''`)}'`;
}

function show(command) {
  return [command.command, ...command.args].map(quote).join(' ');
}

/**
 * The exact command for one line of narration. Pure — it builds the array, it
 * does not run it.
 *
 * Habibi: zero-shot cloning, so ref_audio AND ref_text are both required; the
 * model reads the pair as context. Without the transcript the clone drifts.
 * NAMAA has no CLI, so the driver script below is written out and run.
 */
function synthCommand(engineId, job = {}) {
  const engine = ENGINES[engineId];
  if (!engine) return { ok: false, reason: `محرّك غير معروف: ${engineId}` };
  const text = String(job.text || '');
  if (!text.trim()) return { ok: false, reason: 'لا نصّ.' };
  const outFile = job.out || 'voice.wav';
  const outDir = job.outDir || '.';

  if (engineId === 'habibi') {
    const dialect = String(job.dialect || 'MSA').toUpperCase();
    if (!job.refAudio || !job.refText) {
      return {
        ok: false,
        reason: 'حبيبي يستنسخ من مقطع مرجعي: مرّر --ref-audio ونصّه --ref-text معًا. '
          + 'بلا النصّ ينحرف الاستنساخ. عيّنات جاهزة في src/habibi_tts/assets.',
      };
    }
    const blocked = engine.cliBlocked.includes(dialect);
    const args = [
      '--model', job.variant || (DIALECTS[dialect] && DIALECTS[dialect].specialized && !blocked ? 'Specialized' : 'Unified'),
      ...(blocked ? [] : ['--dialect', dialect]),
      '--ref_audio', job.refAudio,
      '--ref_text', job.refText,
      '--gen_text', text,
      '--output_dir', outDir,
      '--output_file', outFile,
    ];
    if (job.removeSilence) args.push('--remove_silence');
    if (job.device) args.push('--device', job.device);
    return {
      ok: true,
      engine: engineId,
      command: engine.bin,
      args,
      sampleRate: engine.sampleRate,
      // Said out loud so nobody reaches for them to make a long scene fit.
      refused: ['--speed', '--fix_duration'],
      refusedWhy: 'تسريع الصوت ليس علاجًا لمشهد طويل: احذف كلمات.',
      ...(blocked && { note: `--dialect ${dialect} محذوفة: سطر الأوامر يرفضها اليوم؛ الاستنساخ يحمل اللهجة من المقطع المرجعي.` }),
    };
  }

  // namaa-egyptian
  const args = [job.driver || 'namaa_tts.py', '--text', text, '--out', `${outDir}/${outFile}`];
  if (job.refAudio) args.push('--ref', job.refAudio);
  if (job.device) args.push('--device', job.device);
  return {
    ok: true,
    engine: engineId,
    command: engine.bin,
    args,
    sampleRate: engine.sampleRate,
    writes: { [job.driver || 'namaa_tts.py']: namaaDriver() },
    refused: [],
  };
}

/**
 * The Python driver for NAMAA. The model card's own snippet, with three
 * additions it needs to be run from a script rather than a notebook: argv, the
 * device falling back when CUDA is absent, and the sample rate printed so the
 * caller verifies against the file instead of trusting a constant.
 */
function namaaDriver() {
  const engine = ENGINES['namaa-egyptian'];
  return [
    '#!/usr/bin/env python3',
    '# -*- coding: utf-8 -*-',
    '"""NAMAA-Egyptian-TTS — one line of Arabic in, one wav out.',
    '',
    `Model: ${engine.model} (${engine.licence.weights})`,
    `Base:  ${engine.base}`,
    `Install: ${engine.install}`,
    '"""',
    'import argparse',
    '',
    'import torch',
    'import torchaudio as ta',
    'from huggingface_hub import snapshot_download',
    'from safetensors.torch import load_file as load_safetensors',
    'from chatterbox import mtl_tts',
    '',
    'p = argparse.ArgumentParser()',
    'p.add_argument("--text", required=True)',
    'p.add_argument("--out", required=True)',
    'p.add_argument("--ref", default=None, help="reference wav for voice/style")',
    'p.add_argument("--device", default=None)',
    'a = p.parse_args()',
    '',
    'device = a.device or ("cuda" if torch.cuda.is_available()',
    '                      else "mps" if torch.backends.mps.is_available() else "cpu")',
    '',
    `ckpt_dir = snapshot_download(repo_id="${engine.model}", repo_type="model", revision="main")`,
    'model = mtl_tts.ChatterboxMultilingualTTS.from_pretrained(device=device)',
    `state = load_safetensors(f"{ckpt_dir}/${engine.checkpoint}", device=device)`,
    'model.t3.load_state_dict(state)',
    'model.t3.to(device).eval()',
    '',
    'kwargs = {"language_id": "' + engine.languageId + '"}',
    'if a.ref:',
    '    kwargs["audio_prompt_path"] = a.ref',
    '',
    'wav = model.generate(a.text, **kwargs)',
    'ta.save(a.out, wav, model.sr)',
    '# Printed, not assumed: the caller checks the file against this.',
    'print(f"{a.out}\\t{model.sr}\\t{wav.shape[-1] / model.sr:.3f}")',
    '',
  ].join('\n');
}

/** How to find out whether an engine is actually on this machine. */
function probeCommand(engineId) {
  const engine = ENGINES[engineId];
  if (!engine) return null;
  if (engineId === 'habibi') return { command: engine.bin, args: ['--help'] };
  return { command: 'python3', args: ['-c', 'import chatterbox, torchaudio; print(chatterbox.__name__)'] };
}

// ---------------------------------------------------------------------------
// Honest status
// ---------------------------------------------------------------------------

/**
 * One row per thing that can be true or false about a narration, each with the
 * evidence behind it. A row is never "done" because a command exited 0 — a wav
 * exists, has a rate, has a length, and each is read off the file.
 */
function voiceStatus(script, evidence = {}) {
  const files = evidence.files || [];
  const wanted = (script && script.scenes) ? script.scenes.length : 0;
  const made = files.filter((f) => f && f.exists).length;
  const rates = [...new Set(files.filter((f) => f && f.sampleRate).map((f) => f.sampleRate))];
  const expected = script && script.sampleRate;

  const measured = files.filter((f) => f && typeof f.seconds === 'number');
  const total = measured.length
    ? Math.round(measured.reduce((s, f) => s + f.seconds, 0) * 10) / 10
    : null;

  const perScene = (script && script.scenes || []).map((scene, i) => {
    const file = files[i];
    if (!file || !file.exists || typeof file.seconds !== 'number') {
      return { n: scene.n, state: 'unmeasured' };
    }
    const budget = scene.sceneSeconds;
    if (!budget) return { n: scene.n, state: 'measured', seconds: file.seconds };
    const over = Math.round((file.seconds - budget) * 10) / 10;
    return {
      n: scene.n,
      state: over > 0.1 ? 'over-scene' : 'fits',
      seconds: file.seconds,
      sceneSeconds: budget,
      over: over > 0.1 ? over : 0,
    };
  });

  return {
    engine: script
      ? { state: script.engine, name: script.name, dialect: script.dialect, variant: script.variant, licence: script.licence }
      : { state: 'unchosen' },
    script: script ? { state: 'written', scenes: wanted, estimatedSeconds: script.estimatedSeconds, note: 'تقدير من عدد الكلمات، لا من ملف.' } : { state: 'none' },
    files: !wanted ? { state: 'none' }
      : made === 0 ? { state: 'not-synthesised' }
        : made < wanted ? { state: 'partial', made, wanted }
          : { state: 'synthesised', made },
    sampleRate: !rates.length ? { state: 'unverified' }
      : rates.length > 1 ? { state: 'mixed', rates }
        : expected && rates[0] !== expected ? { state: 'mismatch', found: rates[0], expected }
          : { state: 'verified', rate: rates[0] },
    duration: total === null ? { state: 'unverified', note: 'لا مدّة مقروءة من ملف: شغّل ffprobe على كل مقطع.' }
      : { state: 'measured', seconds: total, estimated: script ? script.estimatedSeconds : null },
    perScene,
    // The one thing a file can never prove.
    lipSync: { state: 'not-applicable', note: 'لا وجوه في الهوية؛ المزامنة مع ظهور النص تُضبط في التركيب.' },
  };
}

module.exports = {
  DIALECTS,
  ENGINES,
  EGY_REGISTER,
  WORDS_PER_SECOND,
  pickEngine,
  numberToWords,
  counted,
  countingForm,
  speakable,
  segment,
  estimateSeconds,
  sceneLine,
  scriptFromReel,
  synthCommand,
  probeCommand,
  namaaDriver,
  voiceStatus,
  quote,
  show,
};
