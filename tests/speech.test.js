'use strict';

/**
 * Golden tests for the voice and video layers. Same contract as golden.test.js:
 * an exact input, an exact expected output, no framework beyond node:test.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const speech = require('../lib/speech');
const video = require('../lib/video');
const bidi = require('../lib/bidi');

const say = (s, o) => speech.speakable(s, o).text;
const msa = (n) => speech.numberToWords(n);
const egy = (n) => speech.numberToWords(n, { register: 'egy' });

// ===========================================================================
// speech — numbers as words
// ===========================================================================

test('numbers: the single digits, both registers', () => {
  assert.equal(msa(0), 'صفر');
  assert.equal(msa(2), 'اثنان');
  assert.equal(msa(8), 'ثمانية');
  assert.equal(egy(2), 'اتنين');
  assert.equal(egy(8), 'تمانية');
});

test('numbers: the teens are a table, not a formula', () => {
  assert.equal(msa(11), 'أحد عشر');
  assert.equal(msa(12), 'اثنا عشر');
  assert.equal(msa(19), 'تسعة عشر');
  assert.equal(egy(11), 'حداشر');
  assert.equal(egy(12), 'اتناشر');
  assert.equal(egy(19), 'تسعتاشر');
});

test('numbers: the unit comes before the ten and is joined with و', () => {
  assert.equal(msa(21), 'واحد وعشرون');
  assert.equal(msa(99), 'تسعة وتسعون');
  assert.equal(egy(21), 'واحد وعشرين');
  assert.equal(egy(99), 'تسعة وتسعين');
});

test('numbers: hundreds', () => {
  assert.equal(msa(100), 'مئة');
  assert.equal(msa(200), 'مئتان');
  assert.equal(msa(300), 'ثلاثمئة');
  assert.equal(msa(905), 'تسعمئة وخمسة');
  assert.equal(egy(300), 'تلتمية');
  assert.equal(egy(200), 'ميتين');
});

test('numbers: thousands take the counting form at 3–10 and the full one above', () => {
  assert.equal(msa(1000), 'ألف');
  assert.equal(msa(2000), 'ألفان');
  assert.equal(msa(3000), 'ثلاثة آلاف');
  assert.equal(msa(11000), 'أحد عشر ألفًا');
  assert.equal(egy(2000), 'ألفين');
  assert.equal(egy(3000), 'تلات آلاف');
  assert.equal(egy(10000), 'عشر آلاف');
});

test('numbers: a year reads as one number, not four digits', () => {
  assert.equal(msa(2024), 'ألفان وأربعة وعشرون');
  assert.equal(egy(2024), 'ألفين وأربعة وعشرين');
});

test('numbers: millions', () => {
  assert.equal(msa(1000000), 'مليون');
  assert.equal(msa(2000000), 'مليونان');
  assert.equal(msa(3000000), 'ثلاثة ملايين');
  assert.equal(egy(2000000), 'مليونين');
  assert.equal(egy(3000000), 'تلات ملايين');
});

test('numbers: negatives, and a refusal above 999,999,999', () => {
  assert.equal(msa(-5), 'ناقص خمسة');
  assert.equal(msa(1000000000), null);
  assert.equal(msa(999999999), 'تسعمئة وتسعة وتسعون مليونًا وتسعمئة وتسعة وتسعون ألفًا وتسعمئة وتسعة وتسعون');
});

test('numbers: the Egyptian counting form fires only before a counted noun', () => {
  assert.equal(speech.countingForm('٣', ' ساعات', 'egy'), 'تلات');
  assert.equal(speech.countingForm('٣', ' إلى ٥', 'egy'), null);   // a particle counts nothing
  assert.equal(speech.countingForm('٣', '.', 'egy'), null);        // nothing follows
  assert.equal(speech.countingForm('٢', ' ساعات', 'egy'), null);   // only 3–10
  assert.equal(speech.countingForm('٣', ' ساعات', 'msa'), null);   // MSA needs the noun's gender
});

// ===========================================================================
// speech — speakable text
// ===========================================================================

test('speakable: BiDi controls never reach the model', () => {
  const { RLE, PDF, RLM } = bidi.CONTROLS;
  const dressed = `${RLE}مرحبا بالعالم${RLM}${PDF}`;
  assert.equal(say(dressed), 'مرحبا بالعالم');
  assert.ok(speech.speakable(dressed).changes.includes('bidi-controls'));
});

test('speakable: tatweel is a stretch, not a sound', () => {
  assert.equal(say('ســـلام'), 'سلام');
});

test('speakable: digits become words, in the dialect’s register', () => {
  assert.equal(say('٧ قوانين'), 'سبعة قوانين');
  assert.equal(say('٧ قوانين', { register: 'egy' }), 'سبع قوانين');
  assert.equal(say('80%'), 'ثمانون في المئة');
  assert.equal(say('٨٠٪', { register: 'egy' }), 'تمانين في المية');
});

test('speakable: decimals and ranges', () => {
  assert.equal(say('٣٫٥'), 'ثلاثة فاصلة خمسة');
  assert.equal(say('3-5'), 'من ثلاثة إلى خمسة');
  assert.equal(say('3-5', { register: 'egy' }), 'من تلاتة لخمسة');
});

test('speakable: a handle, a URL and an e-mail come out, and are reported', () => {
  const out = speech.speakable('تابعنا @kitabwbs على https://x.com أو a@b.com');
  assert.equal(out.text, 'تابعنا على أو');
  assert.deepEqual(out.dropped.map((d) => d.kind).sort(), ['email', 'handle', 'url']);
});

test('speakable: --handles=keep keeps the handle it would otherwise drop', () => {
  const out = speech.speakable('تابعنا @kitabwbs', { handles: 'keep' });
  assert.equal(out.text, 'تابعنا @kitabwbs');
  assert.deepEqual(out.dropped, []);
});

test('speakable: a digit inside a URL is never read as a number', () => {
  assert.equal(say('زُر https://a.com/2024 اليوم'), 'زُر اليوم');
});

test('speakable: ellipsis, dash and newline all become one pause', () => {
  assert.equal(say('أولًا… ثانيًا — ثالثًا\nرابعًا'), 'أولًا، ثانيًا، ثالثًا، رابعًا');
});

test('speakable: repeated punctuation is said once', () => {
  assert.equal(say('حقًا؟؟؟'), 'حقًا؟');
});

test('speakable: shadda is spelling, not voweling — it raises no warning', () => {
  assert.deepEqual(speech.speakable('تغيّر يومك المدرّس').warnings, []);
});

test('speakable: half-voweled text is reported and left alone', () => {
  const out = speech.speakable('الْكِتَابُ الجديد هنا');
  assert.equal(out.text, 'الْكِتَابُ الجديد هنا');
  assert.equal(out.warnings[0].code, 'harakat.partial');
});

test('speakable: --no-harakat drops the vowels and keeps the shadda', () => {
  const out = speech.speakable('الْكِتَابُ المدرّس', { harakat: 'strip' });
  assert.equal(out.text, 'الكتاب المدرّس');
  assert.ok(out.changes.includes('harakat'));
});

test('speakable: running it twice is running it once', () => {
  const once = say('٧ قوانين تغيّر ٨٠٪ — تابعنا @kitabwbs');
  assert.equal(say(once), once);
});

test('speakable: an empty string stays empty', () => {
  assert.equal(say(''), '');
  assert.equal(say(null), '');
});

// ===========================================================================
// speech — engines
// ===========================================================================

test('engines: Egyptian goes to NAMAA when it is there, Habibi when it is not', () => {
  assert.equal(speech.pickEngine({ dialect: 'EGY', installed: ['namaa-egyptian', 'habibi'] }).engine, 'namaa-egyptian');
  assert.equal(speech.pickEngine({ dialect: 'EGY', installed: ['habibi'] }).engine, 'habibi');
  assert.equal(speech.pickEngine({ dialect: 'LEV', installed: ['namaa-egyptian', 'habibi'] }).engine, 'habibi');
});

test('engines: only EGY reads its numerals in the Egyptian register', () => {
  assert.equal(speech.pickEngine({ dialect: 'EGY' }).register, 'egy');
  assert.equal(speech.pickEngine({ dialect: 'MSA' }).register, 'msa');
  assert.equal(speech.pickEngine({ dialect: 'LEV' }).register, 'msa');
});

test('engines: a dialect with its own checkpoint gets Specialized, the rest Unified', () => {
  assert.equal(speech.pickEngine({ dialect: 'MSA' }).variant, 'Specialized');
  assert.equal(speech.pickEngine({ dialect: 'IRQ' }).variant, 'Specialized');
  assert.equal(speech.pickEngine({ dialect: 'LEV' }).variant, 'Unified');
});

test('engines: --commercial refuses a CC-BY-NC weight and says which', () => {
  const nc = speech.pickEngine({ dialect: 'SAU', use: 'commercial' });
  assert.equal(nc.licence, 'CC-BY-NC-SA-4.0');
  assert.equal(nc.commercialOk, false);
  assert.match(nc.warnings.join(' '), /غير تجاري/);

  const ok = speech.pickEngine({ dialect: 'EGY', installed: ['namaa-egyptian'], use: 'commercial' });
  assert.equal(ok.commercialOk, true);
  assert.deepEqual(ok.warnings, []);
});

test('engines: MAR is reported as blocked by the CLI, not quietly passed', () => {
  const mar = speech.pickEngine({ dialect: 'MAR' });
  assert.match(mar.warnings.join(' '), /يرفض MAR/);
  assert.equal(mar.variant, 'Unified');
  // …and the command leaves the flag out rather than inventing one.
  const cmd = speech.synthCommand('habibi', { text: 'سلام', dialect: 'MAR', refAudio: 'r.wav', refText: 'نص' });
  assert.ok(!cmd.args.includes('--dialect'));
  assert.match(cmd.note, /MAR/);
});

test('engines: an unknown dialect is refused with the list', () => {
  const out = speech.pickEngine({ dialect: 'XYZ' });
  assert.equal(out.ok, false);
  assert.ok(out.known.includes('MSA'));
});

// ===========================================================================
// speech — commands
// ===========================================================================

test('command: Habibi needs the reference clip AND its transcript', () => {
  assert.equal(speech.synthCommand('habibi', { text: 'سلام', dialect: 'MSA' }).ok, false);
  assert.equal(speech.synthCommand('habibi', { text: 'سلام', dialect: 'MSA', refAudio: 'r.wav' }).ok, false);
  assert.equal(speech.synthCommand('habibi', { text: 'سلام', dialect: 'MSA', refAudio: 'r.wav', refText: 'ن' }).ok, true);
});

test('command: the Habibi line is exactly the flags infer_cli.py defines', () => {
  const cmd = speech.synthCommand('habibi', {
    text: 'سلام', dialect: 'EGY', refAudio: 'ref.mp3', refText: 'نص المرجع', out: 's1.wav', outDir: 'voice',
  });
  assert.equal(speech.show(cmd),
    "habibi-tts_infer-cli --model Specialized --dialect EGY --ref_audio ref.mp3 --ref_text 'نص المرجع' "
    + "--gen_text 'سلام' --output_dir voice --output_file s1.wav");
  assert.equal(cmd.sampleRate, 24000);
});

test('command: --speed and --fix_duration are refused, and say why', () => {
  const cmd = speech.synthCommand('habibi', { text: 'س', dialect: 'MSA', refAudio: 'r.wav', refText: 'ن' });
  assert.deepEqual(cmd.refused, ['--speed', '--fix_duration']);
  assert.ok(!speech.show(cmd).includes('--speed'));
  assert.match(cmd.refusedWhy, /احذف كلمات|اقطع|احذف/);
});

test('command: NAMAA ships its own driver, loading the checkpoint the card names', () => {
  const cmd = speech.synthCommand('namaa-egyptian', { text: 'ازيك', out: 's1.wav', outDir: 'voice' });
  assert.equal(cmd.command, 'python3');
  const driver = cmd.writes['namaa_tts.py'];
  assert.match(driver, /NAMAA-Space\/NAMAA-Egyptian-TTS/);
  assert.match(driver, /t3_mtl23ls_v2\.safetensors/);
  assert.match(driver, /ChatterboxMultilingualTTS/);
  assert.match(driver, /language_id/);
});

test('command: an unknown engine and an empty text are both refused', () => {
  assert.equal(speech.synthCommand('nope', { text: 'س' }).ok, false);
  assert.equal(speech.synthCommand('habibi', { text: '   ' }).ok, false);
});

// ===========================================================================
// speech — a reel becomes a script
// ===========================================================================

const reel = {
  kind: 'reel-plan',
  title: 'سبعة قوانين',
  totalSeconds: 9.6,
  scenes: [
    { n: 1, role: 'hook', content: { title: '٧ قوانين تغيّر ٨٠٪ من يومك' }, seconds: 2.4, motion: [], transition: { type: 'push', seconds: 0.3 } },
    { n: 2, role: 'point', composition: 'numbered', content: { number: '١', title: 'ابدأ بالأصعب', subtitle: '٢٥ دقيقة' }, seconds: 4.2, motion: [{ target: 'number', effect: 'pop', at: 0, duration: 0.3 }], transition: { type: 'fade', seconds: 0.3 } },
    { n: 3, role: 'cta', content: { title: 'احفظه', actions: ['تابعنا @kitabwbs'] }, seconds: 3, motion: [], transition: null },
  ],
};

test('script: one line per scene, in reading order, with a file name', () => {
  const s = speech.scriptFromReel(reel, { dialect: 'EGY', installed: ['namaa-egyptian'] });
  assert.equal(s.ok, true);
  assert.equal(s.engine, 'namaa-egyptian');
  assert.equal(s.scenes.length, 3);
  assert.equal(s.scenes[0].text, 'سبع قوانين تغيّر تمانين في المية من يومك');
  assert.equal(s.scenes[1].text, 'واحد، ابدأ بالأصعب، خمسة وعشرين دقيقة');
  assert.equal(s.scenes[0].file, 'scene-01.wav');
});

test('script: a plan with no scenes is refused, not half-answered', () => {
  assert.equal(speech.scriptFromReel({ scenes: [] }, {}).ok, false);
  assert.equal(speech.scriptFromReel(null, {}).ok, false);
});

test('script: a scene the voice overruns asks for fewer words, never a faster voice', () => {
  const tight = {
    scenes: [{ n: 1, role: 'point', content: { title: 'كلمة كلمة كلمة كلمة كلمة كلمة كلمة كلمة كلمة كلمة' }, seconds: 1, motion: [] }],
  };
  const s = speech.scriptFromReel(tight, { dialect: 'MSA' });
  assert.equal(s.scenes[0].fit, 'overflow');
  const warning = s.warnings.find((w) => w.code === 'voice.overflow');
  assert.match(warning.ar, /احذف نحو \d+ كلمات/);     // 3–10 takes the plural
  assert.match(warning.ar, /لا تسرّع الصوت/);
});

test('counted: a warning counts the way Arabic counts', () => {
  const words = { one: 'كلمة واحدة', two: 'كلمتين', few: 'كلمات', many: 'كلمة' };
  assert.equal(speech.counted(1, words), 'كلمة واحدة');
  assert.equal(speech.counted(2, words), 'كلمتين');
  assert.equal(speech.counted(4, words), '4 كلمات');
  assert.equal(speech.counted(10, words), '10 كلمات');
  assert.equal(speech.counted(11, words), '11 كلمة');
});

test('script: the closing chips are not narrated — they are read off the screen', () => {
  const s = speech.scriptFromReel(reel, { dialect: 'MSA' });
  assert.equal(s.scenes[2].text, 'احفظه');
  assert.deepEqual(s.dropped, []);
});

test('script: a handle inside a line that IS narrated is dropped, against its scene', () => {
  const withHandle = {
    scenes: [{ n: 1, role: 'cta', content: { title: 'تابعنا @kitabwbs اليوم' }, seconds: 3, motion: [] }],
  };
  const s = speech.scriptFromReel(withHandle, { dialect: 'MSA' });
  assert.equal(s.scenes[0].text, 'تابعنا اليوم');
  assert.deepEqual(s.dropped, [{ kind: 'handle', text: '@kitabwbs', scene: 1 }]);
});

test('status: an estimate is never reported as a measurement', () => {
  const s = speech.scriptFromReel(reel, { dialect: 'MSA' });
  const idle = speech.voiceStatus(s, { files: [] });
  assert.equal(idle.files.state, 'not-synthesised');
  assert.equal(idle.duration.state, 'unverified');
  assert.match(idle.script.note, /تقدير/);

  const measured = speech.voiceStatus(s, {
    files: [
      { exists: true, sampleRate: 24000, seconds: 2.2 },
      { exists: true, sampleRate: 24000, seconds: 5.0 },
      { exists: true, sampleRate: 24000, seconds: 2.0 },
    ],
  });
  assert.equal(measured.files.state, 'synthesised');
  assert.deepEqual(measured.sampleRate, { state: 'verified', rate: 24000 });
  assert.equal(measured.duration.state, 'measured');
  assert.equal(measured.perScene[0].state, 'fits');
  assert.equal(measured.perScene[1].state, 'over-scene');   // 5.0 s in a 4.2 s scene
  assert.equal(measured.perScene[1].over, 0.8);
});

test('status: a partial batch is partial, and a wrong rate is a mismatch', () => {
  const s = speech.scriptFromReel(reel, { dialect: 'MSA' });
  const out = speech.voiceStatus(s, { files: [{ exists: true, sampleRate: 16000, seconds: 2 }] });
  assert.deepEqual(out.files, { state: 'partial', made: 1, wanted: 3 });
  assert.deepEqual(out.sampleRate, { state: 'mismatch', found: 16000, expected: 24000 });
});

// ===========================================================================
// video — the timeline
// ===========================================================================

test('timeline: seconds become frames at 30fps', () => {
  const tl = video.timeline(reel);
  assert.equal(tl.fps, 30);
  assert.equal(tl.width, 1080);
  assert.equal(tl.height, 1920);
  assert.deepEqual(tl.scenes.map((s) => s.durationInFrames), [72, 126, 90]);
});

test('timeline: a transition overlaps its two scenes rather than sitting between them', () => {
  const tl = video.timeline(reel);
  assert.deepEqual(tl.scenes.map((s) => s.from), [0, 63, 180]);
  // 9.6 s of scenes minus 0.6 s of transitions.
  assert.equal(tl.durationInFrames, 270);
});

test('timeline: narration is attached by scene number, and only when the file is there', () => {
  const voice = { scenes: [{ n: 1, file: 'scene-01.wav' }, { n: 3, file: 'scene-03.wav' }] };
  const all = video.timeline(reel, { voice });
  assert.deepEqual(all.scenes.map((s) => (s.audio ? s.audio.file : null)), ['scene-01.wav', null, 'scene-03.wav']);

  const some = video.timeline(reel, { voice, audioAvailable: ['scene-01.wav'] });
  assert.deepEqual(some.scenes.map((s) => (s.audio ? s.audio.file : null)), ['scene-01.wav', null, null]);
});

// ===========================================================================
// video — the project
// ===========================================================================

test('project: the files a Remotion project needs, and no stray ones', () => {
  const built = video.projectFiles(reel, { palette: 'midnight', pairing: 'civic' });
  assert.deepEqual(Object.keys(built.files).sort(), [
    'README.md', 'package.json', 'plan.json', 'render.mjs',
    'src/Reel.tsx', 'src/Root.tsx', 'src/Scene.tsx', 'src/fonts.ts',
    'src/index.ts', 'src/motion.ts', 'src/theme.ts', 'src/timeline.json',
    'tsconfig.json',
  ]);
});

test('project: the palette and the faces come from lib/recipes, not from a copy', () => {
  const recipes = require('../lib/recipes');
  const built = video.projectFiles(reel, { palette: 'midnight', pairing: 'civic' });
  assert.ok(built.files['src/theme.ts'].includes(recipes.PALETTES.midnight.accent));
  assert.equal(built.theme.display.name, 'Cairo');
  assert.equal(built.theme.body.name, 'Tajawal');
});

test('project: every pairing maps to a font module that exists', () => {
  const recipes = require('../lib/recipes');
  for (const pairing of Object.keys(recipes.PAIRINGS)) {
    const th = video.theme({}, { pairing });
    for (const role of ['display', 'body']) {
      assert.ok(video.FONT_MODULES[th[role].name], `${pairing}.${role}: ${th[role].name}`);
    }
  }
});

test('project: each slot asks for the arabic slice, down a ladder of weights', () => {
  const plan = video.fontPlan(video.theme({}, { pairing: 'civic' }));
  assert.deepEqual(plan.map((f) => `${f.slot}:${f.family}`), [
    'displayHeavy:Cairo', 'displayStrong:Cairo',
    'bodyMedium:Tajawal', 'bodyRegular:Tajawal',
  ]);
  assert.ok(plan.every((f) => f.subset === 'arabic'));
  assert.deepEqual(plan[0].ladder, ['900', '800', '700']);
});

test('project: every ladder ends on a weight all eight pairing faces ship', () => {
  const recipes = require('../lib/recipes');
  // Measured from Google: only 400 and 700 are common to all eight. Amiri has
  // nothing else at all, so a ladder that bottomed out at 500 would 400 there.
  for (const pairing of Object.keys(recipes.PAIRINGS)) {
    for (const slot of video.fontPlan(video.theme({}, { pairing }))) {
      assert.equal(slot.fallback, video.UNIVERSAL[slot.role], `${pairing}.${slot.slot}`);
      assert.ok(['400', '700'].includes(slot.fallback));
      assert.ok(slot.ladder.includes(slot.fallback), `${pairing}.${slot.slot} ladder misses its fallback`);
    }
  }
});

test('project: with no driver to probe, a slot still names a real weight and file', () => {
  const built = video.projectFiles(reel, { pairing: 'editorial' });   // Amiri + Tajawal
  assert.equal(built.fonts.mode, 'local');
  assert.ok(built.fonts.assets.every((a) => a.weight && a.file));
  assert.ok(!built.files['src/fonts.ts'].includes('undefined'));
  assert.match(built.files['src/fonts.ts'], /staticFile\("fonts\/amiri-700\.woff2"\)/);
});

test('project: local fonts are vendored, and the Google path names its cost', () => {
  const local = video.projectFiles(reel, { pairing: 'civic' });
  assert.equal(local.fonts.mode, 'local');
  assert.match(local.files['src/fonts.ts'], /@remotion\/fonts/);
  assert.match(local.files['src/fonts.ts'], /staticFile\("fonts\/cairo-700\.woff2"\)/);

  const google = video.projectFiles(reel, { pairing: 'civic', fonts: 'google' });
  assert.equal(google.fonts.mode, 'google');
  assert.match(google.files['src/fonts.ts'], /subsets: \['arabic'\]/);
  assert.match(google.files['src/fonts.ts'], /AT RENDER TIME/);
  // It cannot probe, so it asks only for the universal pair.
  assert.match(google.files['src/fonts.ts'], /weights: \['700'\]/);
  assert.match(google.files['src/fonts.ts'], /weights: \['400'\]/);
});

test('project: a resolved weight is used, and a driver-reported one overrides it', () => {
  const built = video.projectFiles(reel, {
    pairing: 'civic',
    fontAssets: [
      { slot: 'displayHeavy', role: 'display', family: 'Cairo', weight: '900', file: 'fonts/cairo-900.woff2' },
      { slot: 'displayStrong', role: 'display', family: 'Cairo', weight: '700', file: 'fonts/cairo-700.woff2' },
      { slot: 'bodyMedium', role: 'body', family: 'Tajawal', weight: '500', file: 'fonts/tajawal-500.woff2' },
      { slot: 'bodyRegular', role: 'body', family: 'Tajawal', weight: '400', file: 'fonts/tajawal-400.woff2' },
    ],
  });
  const fonts = built.files['src/fonts.ts'];
  assert.match(fonts, /export const displayHeavy = 900;/);
  assert.match(fonts, /export const bodyMedium = 500;/);
});

test('project: no scene writes a font weight as a number of its own', () => {
  const scene = video.projectFiles(reel, {}).files['src/Scene.tsx'];
  // A literal here would survive a face that does not ship it, and Chrome
  // would synthesise the weight — a smeared bold on joined Arabic.
  assert.ok(!/fontWeight:\s*\d/.test(scene));
  assert.match(scene, /fontWeight: displayHeavy/);
  assert.match(scene, /fontWeight: bodyRegular/);
});

test('project: motion is a plain function, so a scene may animate any number of elements', () => {
  const built = video.projectFiles(reel, {});
  const motion = built.files['src/motion.ts'];
  assert.match(motion, /export const motionStyle = \(/);
  // Nothing hook-shaped: a per-element hook would be called a different number
  // of times per scene and break the rules of hooks.
  assert.ok(!/\buse[A-Z]/.test(motion.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')));
});

test('project: every text container carries direction, not alignment alone', () => {
  const scene = video.projectFiles(reel, {}).files['src/Scene.tsx'];
  assert.match(scene, /direction: "rtl"/);
  assert.match(scene, /unicodeBidi: "plaintext"/);
});

test('project: the composition is pinned to the plan, not to a default length', () => {
  const built = video.projectFiles(reel, {});
  assert.match(built.files['src/Root.tsx'], /durationInFrames=\{timeline\.durationInFrames\}/);
  assert.equal(JSON.parse(built.files['src/timeline.json']).durationInFrames, 270);
});

// ===========================================================================
// video — status
// ===========================================================================

test('status: with no file, nothing is verified and motion is not claimed', () => {
  const out = video.videoStatus(reel, {});
  assert.equal(out.render.state, 'not-rendered');
  assert.equal(out.size.state, 'unverified');
  assert.equal(out.motion.state, 'unverified');
  assert.equal(out.audio.state, 'none');
});

test('status: a measured file verifies size and duration, and explains the overlap', () => {
  const out = video.videoStatus(reel, {
    file: { width: 1080, height: 1920, duration: 9.0, codec: 'h264', hasAudio: false },
  });
  assert.equal(out.size.state, 'verified');
  assert.equal(out.duration.state, 'verified');
  assert.equal(out.duration.planSeconds, 9.6);
  assert.match(out.duration.note, /الانتقالات/);
  assert.equal(out.motion.state, 'rendered-from-plan');
  assert.equal(out.sceneTiming.state, 'verified-by-construction');
});

test('status: a size or duration that disagrees is a mismatch, with the numbers', () => {
  const small = video.videoStatus(reel, { file: { width: 720, height: 1280, duration: 9.0 } });
  assert.deepEqual(small.size, { state: 'mismatch', found: '720×1280', expected: '1080×1920' });

  const long = video.videoStatus(reel, { file: { width: 1080, height: 1920, duration: 12 } });
  assert.equal(long.duration.state, 'mismatch');
  assert.equal(long.duration.drift, 3);
  assert.equal(long.sceneTiming.state, 'unverified');
});

test('status: planned narration missing from the file is said, not assumed', () => {
  const voice = { name: 'NAMAA-Egyptian-TTS', scenes: [{ n: 1, file: 'scene-01.wav' }] };
  const absent = video.videoStatus(reel, { voice, file: { width: 1080, height: 1920, duration: 9, hasAudio: false } });
  assert.equal(absent.audio.state, 'absent-in-file');

  const present = video.videoStatus(reel, { voice, file: { width: 1080, height: 1920, duration: 9, hasAudio: true } });
  assert.equal(present.audio.state, 'present-in-file');
});

test('status: the Remotion licence travels with every verdict', () => {
  const out = video.videoStatus(reel, {});
  assert.match(out.licence.free, /٣ موظفين/);
  assert.match(out.licence.paid, /Company License/);
  assert.match(out.licence.note, /MIT/);
});
