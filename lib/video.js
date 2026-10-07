'use strict';

/**
 * video.js — a reel plan becomes a Remotion project, and the project becomes
 * a file that is then measured.
 *
 * Canva's connector has no motion, no transition, no per-page duration and no
 * audio operation. `arabic-reels` has always said so and handed the user a list
 * of manual steps. Remotion closes that gap the only honest way: it does not
 * animate the Canva design, it renders a second artefact from the same plan,
 * frame by frame, with the timing and the motion the plan already carries.
 *
 * Two artefacts from one plan is a fact to state, not to hide:
 *   Canva design  — editable, no motion, the client's file.
 *   Remotion MP4  — animated with real timing and voice, flat, not editable.
 * Neither replaces the other, and `videoStatus` reports them apart.
 *
 * What Remotion gives that an MP4 export of static pages cannot: motion per
 * element at a known frame, a transition of a known length, a scene that lasts
 * exactly what the plan says, and a narration track aligned to the scene it
 * belongs to. Those are the seven rows `arabic-reels` §4 could only ever mark
 * `not applied`.
 *
 * Arabic in a browser renderer is not free. Four rules are built into every
 * project this module writes, because each of them has already broken a real
 * design:
 *
 *   1. No letter-by-letter animation. Splitting a word into per-character spans
 *      breaks the joining: «مرحبا» becomes «م ر ح ب ا». Motion is per element,
 *      exactly as the reel plan stores it.
 *   2. The font is loaded and awaited, per weight and with the `arabic` subset.
 *      A render that starts before the font arrives falls back to a Latin face
 *      and draws tofu or unjoined glyphs — and it does it silently.
 *   3. `direction: rtl` on every text container, not `text-align` alone.
 *      Alignment moves the block; direction decides where a trailing «.» goes.
 *   4. The plan's digits are rendered verbatim. The design already decided
 *      between ٠١٢ and 012; a renderer that "helpfully" converts them ships a
 *      video that disagrees with the carousel it came from.
 *
 * Pure module: it returns the project's files as strings and the commands as
 * arrays. `lib/cli.js render` is what writes and runs them.
 *
 * Licence, said plainly because this repository is MIT and Remotion is not:
 * Remotion is free for individuals, non-profits and for-profit companies with
 * up to 3 employees. A company with 4 or more needs a paid licence from
 * remotion.pro. Nothing here grants it. See `remotion-dev/remotion/LICENSE.md`.
 */

const recipes = require('./recipes');
const speech = require('./speech');

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

/** 9:16 safe zones: the UI of every app eats these bands. */
const SAFE = { top: 220, bottom: 320, side: 72 };

const REMOTION_VERSION = '4.0.533';

const LICENCE = {
  name: 'Remotion',
  spdx: null,
  free: 'أفراد، وجمعيات غير ربحية، وشركات ربحية حتى ٣ موظفين',
  paid: 'شركة بأربعة موظفين فأكثر تحتاج Company License من remotion.pro',
  url: 'https://github.com/remotion-dev/remotion/blob/main/LICENSE.md',
  note: 'هذا المستودع MIT؛ ريموشن ليست كذلك. التثبيت وحده لا يمنح ترخيصًا.',
};

/** The repo's pairings as @remotion/google-fonts module names. */
const FONT_MODULES = {
  Cairo: 'Cairo',
  Tajawal: 'Tajawal',
  Amiri: 'Amiri',
  Almarai: 'Almarai',
  Alexandria: 'Alexandria',
  'Reem Kufi': 'ReemKufi',
  'Readex Pro': 'ReadexPro',
  'Noto Kufi Arabic': 'NotoKufiArabic',
};

/**
 * The four type slots a scene uses, each with the weights to try in order.
 *
 * A ladder, not a number, because the eight faces in `recipes.PAIRINGS` do not
 * ship the same weights — measured from Google, not assumed:
 *
 *     Cairo, Alexandria, Noto Kufi Arabic   300…900
 *     Tajawal                               300–500, 700–900   (no 600)
 *     Readex Pro, Reem Kufi                 400–700            (no 800/900)
 *     Almarai                               300, 400, 700, 800 (no 500/900)
 *     Amiri                                 400, 700           only
 *
 * Asking Amiri for 900 is an HTTP 400 from Google and, worse, asking the
 * BROWSER for a weight the face lacks is silent: Chrome synthesises it. On
 * Latin that is a passable faux-bold; on Arabic it thickens the strokes
 * unevenly and smears the joins — the same defect this plugin already refuses
 * for fake italic. So every weight the project names is one the file actually
 * holds, and `Scene.tsx` reads them from `fonts.ts` instead of writing numbers.
 */
const WEIGHT_LADDER = {
  displayHeavy: ['900', '800', '700'],
  displayStrong: ['700', '600', '500', '400'],
  bodyMedium: ['500', '400'],
  bodyRegular: ['400', '300'],
};

/** The slot's role, so a ladder knows which face it belongs to. */
const SLOT_ROLE = {
  displayHeavy: 'display',
  displayStrong: 'display',
  bodyMedium: 'body',
  bodyRegular: 'body',
};

/**
 * The pair every one of the eight ships. The Google fallback uses only these:
 * that path cannot probe, and a weight it guesses wrong throws at render time.
 */
const UNIVERSAL = { display: '700', body: '400' };

/**
 * Which font files the project wants, so the driver can fetch them once.
 *
 * Only the `arabic` slice of each face: Google splits a family into subsets and
 * the latin slice has no Arabic codepoints in it at all. Ask for the wrong one
 * and the render succeeds, the font "loads", and every letter is tofu.
 */
function fontPlan(th) {
  return Object.keys(WEIGHT_LADDER).map((slot) => {
    const role = SLOT_ROLE[slot];
    return {
      slot,
      role,
      family: th[role].name,
      ladder: WEIGHT_LADDER[slot],
      fallback: UNIVERSAL[role],
      subset: 'arabic',
    };
  });
}

/** Where a resolved weight lands in the project. */
function fontFile(family, weight) {
  return `fonts/${family.replace(/\s+/g, '-').toLowerCase()}-${weight}.woff2`;
}

function fontModule(name) {
  return FONT_MODULES[name] || 'Cairo';
}

const seconds = (n) => Math.max(1, Math.round(Number(n || 0) * FPS));

// ---------------------------------------------------------------------------
// Plan -> composition data
// ---------------------------------------------------------------------------

/**
 * Flatten the reel plan into the shape the composition reads: frames instead of
 * seconds, one entry per scene, motion resolved to a start frame and a length.
 *
 * Transitions overlap the two scenes they join, so a transition of 0.3 s does
 * not add 0.3 s to the reel — the second scene starts that much earlier. Adding
 * them would make every verified duration disagree with the plan by the sum of
 * the transitions, and the mismatch would be ours, not the renderer's.
 */
function timeline(plan, options = {}) {
  const scenes = Array.isArray(plan && plan.scenes) ? plan.scenes : [];
  const voice = options.voice || null;
  // A clip the project does not actually hold is not a clip. Remotion resolves
  // staticFile() at render time and a missing wav is a hard failure three
  // frames in, not a silent gap — so a scene whose narration never landed in
  // public/ is written out without audio, and the caller reports it missing.
  const available = options.audioAvailable ? new Set(options.audioAvailable) : null;
  const voiceByScene = new Map();
  if (voice && Array.isArray(voice.scenes)) {
    for (const v of voice.scenes) {
      if (available && !available.has(v.file)) continue;
      voiceByScene.set(v.n, v);
    }
  }

  let frame = 0;
  const out = scenes.map((scene, i) => {
    const length = seconds(scene.seconds);
    const transition = scene.transition || null;
    const narration = voiceByScene.get(scene.n || i + 1) || null;
    const entry = {
      n: scene.n || i + 1,
      role: scene.role || 'point',
      composition: scene.composition || 'plain',
      variant: scene.variant || null,
      content: scene.content || {},
      from: frame,
      durationInFrames: length,
      seconds: Number(scene.seconds) || length / FPS,
      motion: (scene.motion || []).map((m) => ({
        target: m.target,
        effect: m.effect,
        from: Math.round(Number(m.at || 0) * FPS),
        durationInFrames: seconds(m.duration || 0.3),
      })),
      transition: transition ? { type: transition.type, durationInFrames: seconds(transition.seconds) } : null,
      audio: narration && narration.file ? { file: narration.file, estimateSeconds: narration.estimateSeconds } : null,
    };
    // The next scene starts under the tail of this one's transition.
    frame += length - (transition ? seconds(transition.seconds) : 0);
    return entry;
  });

  const last = out[out.length - 1];
  const durationInFrames = last ? last.from + last.durationInFrames : FPS;
  return { scenes: out, durationInFrames, fps: FPS, width: WIDTH, height: HEIGHT };
}

/** The palette and the two faces, from the plan or from the chosen recipe. */
function theme(plan, options = {}) {
  const paletteName = options.palette || (plan && plan.palette) || 'paper';
  const pairingName = options.pairing || (plan && plan.pairing) || 'civic';
  const palette = recipes.PALETTES[paletteName] || recipes.PALETTES.paper;
  const pairing = recipes.PAIRINGS[pairingName] || recipes.PAIRINGS.civic;
  return {
    paletteName,
    pairingName,
    colors: palette,
    display: { name: pairing.display, module: fontModule(pairing.display) },
    body: { name: pairing.body, module: fontModule(pairing.body) },
    safe: SAFE,
  };
}

// ---------------------------------------------------------------------------
// The project's files
// ---------------------------------------------------------------------------

function packageJson(name) {
  return `${JSON.stringify({
    name: name || 'arabic-reel',
    version: '0.0.0',
    private: true,
    description: 'ريل عربي ٩:١٦ يُركَّب من خطّة المشاهد — أنشأته arabic-design.',
    scripts: {
      studio: 'remotion studio',
      render: 'node render.mjs',
    },
    dependencies: {
      '@remotion/bundler': `^${REMOTION_VERSION}`,
      '@remotion/cli': `^${REMOTION_VERSION}`,
      '@remotion/fonts': `^${REMOTION_VERSION}`,
      '@remotion/google-fonts': `^${REMOTION_VERSION}`,
      '@remotion/renderer': `^${REMOTION_VERSION}`,
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      remotion: `^${REMOTION_VERSION}`,
    },
    devDependencies: {
      '@types/react': '^18.3.1',
      typescript: '^5.5.4',
    },
  }, null, 2)}\n`;
}

function tsconfig() {
  return `${JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      lib: ['ES2020', 'DOM'],
      jsx: 'react-jsx',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      noEmit: true,
      resolveJsonModule: true,
    },
    include: ['src'],
  }, null, 2)}\n`;
}

function indexTs() {
  return [
    "import {registerRoot} from 'remotion';",
    "import {Root} from './Root';",
    '',
    'registerRoot(Root);',
    '',
  ].join('\n');
}

function rootTsx(tl) {
  return [
    "import type {FC} from 'react';",
    "import {Composition} from 'remotion';",
    "import {Reel} from './Reel';",
    "import timeline from './timeline.json';",
    '',
    '// Size, fps and length all come from the plan. Nothing here is a default:',
    '// a reel that is 31.2 s in the plan is 936 frames here, and the verifier',
    '// compares the rendered file against the same number.',
    'export const Root: FC = () => (',
    '  <Composition',
    `    id="${tl.id || 'reel'}"`,
    '    component={Reel}',
    '    durationInFrames={timeline.durationInFrames}',
    '    fps={timeline.fps}',
    '    width={timeline.width}',
    '    height={timeline.height}',
    '  />',
    ');',
    '',
  ].join('\n');
}

function themeTs(th) {
  return [
    '// Palette and faces come from lib/recipes.js — the same two tables the',
    '// carousel and the Canva route draw from, so the video cannot drift from',
    '// the design it was built beside.',
    `export const colors = ${JSON.stringify(th.colors, null, 2)} as const;`,
    '',
    `export const safe = ${JSON.stringify(th.safe)} as const;`,
    '',
    `export const paletteName = ${JSON.stringify(th.paletteName)};`,
    `export const pairingName = ${JSON.stringify(th.pairingName)};`,
    '',
  ].join('\n');
}

function fontsTs(th, mode, assets) {
  if (mode === 'local') {
    const lines = [
      '// Loaded from public/fonts — the render never reaches the network.',
      '//',
      '// A font fetched at render time is a render that fails on a firewalled',
      '// box, in CI, or behind a proxy the headless browser does not know',
      "// about. In Arabic the failure is not a missing flourish: it is tofu, or",
      '// a fallback face that draws the letters unjoined. The files are',
      '// vendored and the render is reproducible.',
      '//',
      '// loadFont() blocks the render until each face is in, so frame 0 is never',
      '// drawn in a fallback. Every weight below is one this face actually',
      '// ships — asking for one it lacks makes Chrome synthesise it, and a',
      '// synthesised bold smears Arabic joins.',
      "import {loadFont} from '@remotion/fonts';",
      "import {staticFile} from 'remotion';",
      '',
    ];
    const seen = new Set();
    for (const asset of assets) {
      if (seen.has(asset.file)) continue;
      seen.add(asset.file);
      lines.push(
        'loadFont({',
        `  family: ${JSON.stringify(asset.family)},`,
        `  url: staticFile(${JSON.stringify(asset.file)}),`,
        `  weight: ${JSON.stringify(asset.weight)},`,
        "  format: 'woff2',",
        '});',
        ''
      );
    }
    lines.push(
      `export const displayFamily = ${JSON.stringify(th.display.name)};`,
      `export const bodyFamily = ${JSON.stringify(th.body.name)};`,
      ''
    );
    for (const slot of Object.keys(WEIGHT_LADDER)) {
      const hit = assets.find((a) => a.slot === slot);
      lines.push(`export const ${slot} = ${Number(hit ? hit.weight : UNIVERSAL[SLOT_ROLE[slot]])};`);
    }
    lines.push('');
    return lines.join('\n');
  }

  const same = th.display.module === th.body.module;
  const lines = [
    '// Loaded from Google with an explicit weight list AND the arabic subset.',
    '//',
    '// Without `subsets: ["arabic"]` Google serves the latin slice, the Arabic',
    '// codepoints miss the face entirely, and Chrome falls back — tofu, or',
    '// worse, a fallback that draws the letters unjoined. loadFont() blocks the',
    "// render until the file is in, so this is also what stops a frame 0 that",
    '// is drawn in the wrong face.',
    '//',
    '// This path needs the network AT RENDER TIME, from inside the headless',
    '// browser — not from Node. Re-scaffold with --fonts=local to vendor them.',
    '//',
    '// 400 and 700 only. This path cannot probe what the face ships, and the',
    '// eight pairing faces disagree above 700 (Amiri has nothing but these two).',
    '// A weight guessed wrong throws at render time, so the heavy and the medium',
    '// slots collapse onto the pair every one of them has.',
    `import {loadFont as loadDisplay} from '@remotion/google-fonts/${th.display.module}';`,
  ];
  if (!same) lines.push(`import {loadFont as loadBody} from '@remotion/google-fonts/${th.body.module}';`);
  lines.push(
    '',
    `const display = loadDisplay('normal', {weights: ['${UNIVERSAL.display}'], subsets: ['arabic']});`,
    same
      ? `const body = loadDisplay('normal', {weights: ['${UNIVERSAL.body}'], subsets: ['arabic']});`
      : `const body = loadBody('normal', {weights: ['${UNIVERSAL.body}'], subsets: ['arabic']});`,
    '',
    'export const displayFamily = display.fontFamily;',
    'export const bodyFamily = body.fontFamily;',
    '',
  );
  for (const slot of Object.keys(WEIGHT_LADDER)) {
    lines.push(`export const ${slot} = ${Number(UNIVERSAL[SLOT_ROLE[slot]])};`);
  }
  lines.push('');
  return lines.join('\n');
}

function motionTs() {
  return [
    "import {interpolate, spring} from 'remotion';",
    '',
    'export type Effect = "pop" | "rise" | "fade";',
    'export type Style = {opacity: number; transform: string};',
    '',
    'export const still: Style = {opacity: 1, transform: "none"};',
    '',
    '/**',
    ' * One element, one effect, one start frame.',
    ' *',
    ' * Never a character, never a word. Arabic letters join to their neighbours,',
    ' * and a per-character animation has to wrap each one in its own box, which',
    ' * cuts every join: «مرحبا» renders as «م ر ح ب ا». There is no transform',
    ' * that puts them back. The reel plan stores motion per element for exactly',
    ' * this reason and this file keeps the promise.',
    ' *',
    ' * A plain function, not a hook: a scene has a different number of animated',
    ' * elements from the scene before it, so anything hook-shaped here would be',
    ' * called a different number of times per render and break the rules of',
    ' * hooks. `fps` is read once by the caller and passed down.',
    ' */',
    'export const motionStyle = (',
    '  frame: number,',
    '  fps: number,',
    '  effect: Effect,',
    '  from: number,',
    '  durationInFrames: number,',
    '): Style => {',
    '  const local = frame - from;',
    '  const progress = durationInFrames <= 0 ? 1 : Math.min(Math.max(local / durationInFrames, 0), 1);',
    '  const opacity = interpolate(progress, [0, 1], [0, 1]);',
    '',
    '  if (effect === "fade") return {opacity, transform: "none"};',
    '',
    '  if (effect === "rise") {',
    '    const y = interpolate(progress, [0, 1], [48, 0], {easing: (t) => 1 - (1 - t) ** 3});',
    '    return {opacity, transform: `translateY(${y}px)`};',
    '  }',
    '',
    '  const scale = spring({frame: local, fps, config: {damping: 14, mass: 0.6}, from: 0.86, to: 1});',
    '  return {opacity, transform: `scale(${scale})`};',
    '};',
    '',
  ].join('\n');
}

function sceneTsx() {
  return [
    "import type {FC} from 'react';",
    "import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';",
    "import {colors, safe} from './theme';",
    "import {bodyFamily, bodyMedium, bodyRegular, displayFamily, displayHeavy, displayStrong} from './fonts';",
    "import {motionStyle, still, type Effect, type Style} from './motion';",
    '',
    'type Motion = {target: string; effect: Effect; from: number; durationInFrames: number};',
    'type Content = Record<string, unknown>;',
    'export type SceneData = {',
    '  n: number;',
    '  role: string;',
    '  composition: string;',
    '  content: Content;',
    '  durationInFrames: number;',
    '  motion: Motion[];',
    '  audio: {file: string} | null;',
    '};',
    '',
    'const str = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);',
    '',
    '// Weights come from fonts.ts, never written as numbers here: they are the',
    '// ones this face actually ships. Name a weight the file lacks and Chrome',
    '// synthesises it — on Arabic that thickens the strokes unevenly and smears',
    '// the joins, the same defect fake italic causes.',
    '/**',
    ' * Every text box is `direction: rtl`.',
    ' *',
    ' * textAlign alone is not enough and the difference shows on one character:',
    ' * with direction ltr and textAlign right, a line that ends in «.» puts the',
    ' * dot on the right — the wrong end of an Arabic sentence. Direction decides',
    ' * where the trailing neutral goes; alignment only moves the block.',
    ' * `unicode-bidi: plaintext` then lets a line that is wholly Latin (a handle,',
    ' * a URL) take its own direction without dragging the Arabic with it.',
    ' */',
    'const rtl = {direction: "rtl", textAlign: "right", unicodeBidi: "plaintext"} as const;',
    '',
    'export const Scene: FC<{scene: SceneData}> = ({scene}) => {',
    '  // Both hooks run once, unconditionally, before anything branches.',
    '  const frame = useCurrentFrame();',
    '  const {fps} = useVideoConfig();',
    '  const motionOf = (target: string): Style => {',
    '    const m = scene.motion.find((x) => x.target === target);',
    '    return m ? motionStyle(frame, fps, m.effect, m.from, m.durationInFrames) : still;',
    '  };',
    '',
    '  const kicker = str(scene.content.kicker);',
    '  const number = str(scene.content.number);',
    '  const title = str(scene.content.title) ?? str(scene.content.quote);',
    '  const subtitle = str(scene.content.subtitle);',
    '  const actions = Array.isArray(scene.content.actions)',
    '    ? (scene.content.actions as unknown[]).map(str).filter((x): x is string => Boolean(x))',
    '    : [];',
    '',
    '  const hero = scene.role === "hook" || scene.composition === "numbered";',
    '',
    '  return (',
    '    <AbsoluteFill style={{backgroundColor: colors.bg}}>',
    '      <AbsoluteFill',
    '        style={{',
    '          ...rtl,',
    '          paddingTop: safe.top,',
    '          paddingBottom: safe.bottom,',
    '          paddingInline: safe.side,',
    '          display: "flex",',
    '          flexDirection: "column",',
    '          justifyContent: "center",',
    '          gap: 36,',
    '        }}',
    '      >',
    '        {kicker ? (',
    '          <div style={{...motionOf("kicker"), fontFamily: bodyFamily, fontSize: 44, fontWeight: bodyMedium, color: colors.muted}}>',
    '            {kicker}',
    '          </div>',
    '        ) : null}',
    '',
    '        {number ? (',
    '          <div style={{...motionOf("number"), fontFamily: displayFamily, fontSize: 320, lineHeight: 1, fontWeight: displayHeavy, color: colors.accent}}>',
    '            {number}',
    '          </div>',
    '        ) : null}',
    '',
    '        {title ? (',
    '          <div',
    '            style={{',
    '              ...motionOf("title"),',
    '              fontFamily: displayFamily,',
    '              fontSize: hero ? 108 : 92,',
    '              fontWeight: displayStrong,',
    '              color: colors.ink,',
    '              // Display type is left tight on purpose: 1.8 on a 108px line',
    '              // pushes the subtitle off a 1920-tall frame. Above 60px the',
    "              // line height is the designer's call, not a global rule.",
    '              lineHeight: 1.22,',
    '            }}',
    '          >',
    '            {title}',
    '          </div>',
    '        ) : null}',
    '',
    '        {subtitle ? (',
    '          <div style={{...motionOf("subtitle"), fontFamily: bodyFamily, fontSize: 52, fontWeight: bodyRegular, color: colors.body, lineHeight: 1.7}}>',
    '            {subtitle}',
    '          </div>',
    '        ) : null}',
    '',
    '        {actions.length ? (',
    '          <div style={{...motionOf("actions"), display: "flex", flexDirection: "row-reverse", gap: 24}}>',
    '            {actions.map((label) => (',
    '              <span',
    '                key={label}',
    '                style={{fontFamily: bodyFamily, fontSize: 44, fontWeight: bodyMedium, color: colors.closing, backgroundColor: colors.card, padding: "18px 36px", borderRadius: 999}}',
    '              >',
    '                {label}',
    '              </span>',
    '            ))}',
    '          </div>',
    '        ) : null}',
    '      </AbsoluteFill>',
    '',
    '      {scene.audio ? <Audio src={staticFile(scene.audio.file)} /> : null}',
    '    </AbsoluteFill>',
    '  );',
    '};',
    '',
  ].join('\n');
}

function reelTsx() {
  return [
    "import type {FC, ReactNode} from 'react';",
    "import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';",
    "import {Scene, type SceneData} from './Scene';",
    "import timeline from './timeline.json';",
    '',
    'type Entry = SceneData & {',
    '  from: number;',
    '  transition: {type: string; durationInFrames: number} | null;',
    '};',
    '',
    'const scenes = timeline.scenes as unknown as Entry[];',
    '',
    '/**',
    ' * A transition belongs to the scene that is arriving, and it overlaps the',
    ' * one it replaces — which is why `from` in the timeline is already pulled',
    ' * back by the transition length. Add it instead of overlapping it and the',
    ' * rendered file runs long by the sum of every transition, and the duration',
    ' * check against the plan fails for a reason that is ours.',
    ' */',
    'const Enter: FC<{entry: Entry; children: ReactNode}> = ({entry, children}) => {',
    '  const frame = useCurrentFrame();',
    '  const t = entry.transition;',
    '  if (!t || t.type === "cut") return <>{children}</>;',
    '',
    '  const progress = interpolate(frame, [0, t.durationInFrames], [0, 1], {',
    '    extrapolateLeft: "clamp",',
    '    extrapolateRight: "clamp",',
    '  });',
    '',
    '  if (t.type === "fade") return <AbsoluteFill style={{opacity: progress}}>{children}</AbsoluteFill>;',
    '',
    '  // push: the new scene arrives from the right, because the reel reads RTL.',
    '  const x = interpolate(progress, [0, 1], [100, 0]);',
    '  return <AbsoluteFill style={{transform: `translateX(${x}%)`}}>{children}</AbsoluteFill>;',
    '};',
    '',
    'export const Reel: FC = () => (',
    '  <AbsoluteFill>',
    '    {scenes.map((entry) => (',
    '      <Sequence key={entry.n} from={entry.from} durationInFrames={entry.durationInFrames} name={`مشهد ${entry.n}`}>',
    '        <Enter entry={entry}>',
    '          <Scene scene={entry} />',
    '        </Enter>',
    '      </Sequence>',
    '    ))}',
    '  </AbsoluteFill>',
    ');',
    '',
  ].join('\n');
}

function renderMjs(tl) {
  return [
    '#!/usr/bin/env node',
    "// Render the reel. Written by arabic-design; safe to edit and re-run.",
    '//',
    '// ensureBrowser() first: @remotion/renderer needs a Chrome Headless Shell,',
    '// and on a machine that already has one, REMOTION_BROWSER_EXECUTABLE (or',
    '// --browser=<path>) points at it instead of downloading a second copy.',
    "import {bundle} from '@remotion/bundler';",
    "import {ensureBrowser, renderMedia, selectComposition} from '@remotion/renderer';",
    "import path from 'node:path';",
    "import {fileURLToPath} from 'node:url';",
    '',
    'const here = path.dirname(fileURLToPath(import.meta.url));',
    'const arg = (name, fallback) => {',
    '  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));',
    '  return hit ? hit.slice(name.length + 3) : fallback;',
    '};',
    '',
    'const out = path.resolve(arg("out", "out/reel.mp4"));',
    'const browserExecutable = arg("browser", process.env.REMOTION_BROWSER_EXECUTABLE) ?? null;',
    'const concurrency = arg("concurrency", null);',
    '',
    'await ensureBrowser({browserExecutable});',
    '',
    'const serveUrl = await bundle({entryPoint: path.join(here, "src/index.ts")});',
    `const composition = await selectComposition({serveUrl, id: ${JSON.stringify(tl.id || 'reel')}});`,
    '',
    'await renderMedia({',
    '  composition,',
    '  serveUrl,',
    '  codec: "h264",',
    '  outputLocation: out,',
    '  browserExecutable,',
    '  ...(concurrency ? {concurrency: Number(concurrency)} : {}),',
    '  onProgress: ({progress}) => {',
    '    process.stderr.write(`\\r${Math.round(progress * 100)}%`);',
    '  },',
    '});',
    '',
    'process.stderr.write("\\n");',
    '// The numbers the verifier will check this against. Printed, not trusted:',
    '// run `node lib/cli.js render --verify <file> --plan plan.json` next.',
    'process.stdout.write(`${JSON.stringify({',
    '  file: out,',
    '  durationInFrames: composition.durationInFrames,',
    '  fps: composition.fps,',
    '  size: `${composition.width}x${composition.height}`,',
    '  seconds: Math.round((composition.durationInFrames / composition.fps) * 1000) / 1000,',
    '}, null, 2)}\\n`);',
    '',
  ].join('\n');
}

function readmeMd(plan, th, tl, voice, fonts) {
  const secs = Math.round((tl.durationInFrames / FPS) * 10) / 10;
  return [
    `# ${(plan && plan.title) || 'ريل'} — مشروع ريموشن`,
    '',
    'أنشأته `arabic-design` من خطّة المشاهد. المصدر الوحيد للحقيقة هو',
    '`src/timeline.json`؛ غيّر الخطّة وأعد التوليد، أو عدّل هنا واعلم أنّ إعادة',
    'التوليد تكتب فوقه.',
    '',
    '| | |',
    '|---|---|',
    `| المشاهد | ${tl.scenes.length} |`,
    `| المقاس | ${WIDTH}×${HEIGHT} |`,
    `| الإطارات | ${tl.durationInFrames} إطارًا عند ${FPS}f/s = ${secs}ث |`,
    `| اللوحة | ${th.paletteName} |`,
    `| الخطوط | ${th.display.name} للعناوين، ${th.body.name} للمتن |`,
    `| مصدر الخطوط | ${fonts === 'local' ? 'public/fonts (بلا شبكة وقت التركيب)' : 'Google (يحتاج شبكة من داخل المتصفّح)'} |`,
    `| الصوت | ${voice ? `${voice.scenes.length} مقطعًا في public/ — ${voice.name} (${voice.dialectAr})` : 'لا تعليق صوتي'} |`,
    '',
    '## التشغيل',
    '',
    '```bash',
    'npm install',
    'npm run studio            # معاينة ومونتاج في المتصفح',
    'npm run render            # out/reel.mp4',
    'node render.mjs --out=out/reel.mp4 --browser=/path/to/chrome',
    '```',
    '',
    'ثم — ولا تتخطَّ هذه — قِس الملف ولا تصدّق الأمر:',
    '',
    '```bash',
    'node lib/cli.js render --verify out/reel.mp4 --plan plan.json',
    '```',
    '',
    '## الترخيص',
    '',
    `ريموشن **ليست** MIT. مجانية لـ${LICENCE.free}؛ ${LICENCE.paid}.`,
    '',
    `${LICENCE.note} التفاصيل: ${LICENCE.url}`,
    '',
    '## العربية هنا',
    '',
    '- الحركة **على العنصر لا على الحرف**: تقطيع الكلمة إلى حروف متحرّكة يكسر',
    '  الوصل فتصير «مرحبا» ← «م ر ح ب ا»، ولا transform يعيدها.',
    '- الخطّ يُحمَّل بـ`subsets: ["arabic"]` ويُنتظر قبل أوّل إطار.',
    '- كل صندوق نصّ `direction: rtl`، لا محاذاة وحدها.',
    '- الأرقام تُرسَم كما في الخطّة: لا تحويل بين ٠١٢ و012 هنا.',
    `- المناطق الآمنة: ${SAFE.top}px أعلى و${SAFE.bottom}px أسفل و${SAFE.side}px جانبًا.`,
    '',
  ].join('\n');
}

/**
 * Every file of the project, keyed by its path. Nothing is written here.
 *
 * `plan.json` travels with the project on purpose: the file that produced the
 * video sits beside it, so the verifier can be pointed at the pair later
 * without the session that made them.
 */
function projectFiles(plan, options = {}) {
  const th = theme(plan, options);
  const tl = { id: 'reel', ...timeline(plan, options) };
  const voice = options.voice || null;
  const wanted = fontPlan(th);
  // 'local' is the default and the driver downloads the files; it falls back to
  // 'google' and says so when it cannot reach them.
  const mode = options.fonts === 'google' || options.fontAssets === null ? 'google' : 'local';
  // Without a driver's resolved list — projectFiles called on its own — each
  // ladder collapses to the weight every pairing face ships. A slot is never
  // left without a real weight and a real file name.
  const assets = mode !== 'local' ? []
    : options.fontAssets || wanted.map((slot) => ({
      slot: slot.slot,
      role: slot.role,
      family: slot.family,
      weight: slot.fallback,
      file: fontFile(slot.family, slot.fallback),
    }));

  const files = {
    'package.json': packageJson(options.name),
    'tsconfig.json': tsconfig(),
    'render.mjs': renderMjs(tl),
    'README.md': readmeMd(plan, th, tl, voice, mode),
    'plan.json': `${JSON.stringify(plan, null, 2)}\n`,
    'src/index.ts': indexTs(),
    'src/Root.tsx': rootTsx(tl),
    'src/Reel.tsx': reelTsx(),
    'src/Scene.tsx': sceneTsx(),
    'src/motion.ts': motionTs(),
    'src/theme.ts': themeTs(th),
    'src/fonts.ts': fontsTs(th, mode, assets),
    'src/timeline.json': `${JSON.stringify(tl, null, 2)}\n`,
  };
  if (voice) files['voice.json'] = `${JSON.stringify(voice, null, 2)}\n`;

  return {
    files,
    timeline: tl,
    theme: th,
    // public/ is Remotion's staticFile() root: the narration wavs belong there.
    audioDir: 'public',
    audio: tl.scenes.filter((s) => s.audio).map((s) => s.audio.file),
    fonts: {
      mode,
      wanted,
      assets,
      // Slots whose face had nothing as heavy (or as light) as the first ask.
      settled: assets
        .map((a) => {
          const slot = wanted.find((w) => w.slot === a.slot);
          return slot && slot.ladder[0] !== String(a.weight)
            ? { slot: a.slot, family: a.family, asked: slot.ladder[0], got: String(a.weight) }
            : null;
        })
        .filter(Boolean),
    },
    licence: LICENCE,
  };
}

/** `npm install`, then the render. Pure — the driver runs them. */
function renderCommand(options = {}) {
  const args = ['render.mjs'];
  if (options.out) args.push(`--out=${options.out}`);
  if (options.browser) args.push(`--browser=${options.browser}`);
  if (options.concurrency) args.push(`--concurrency=${options.concurrency}`);
  return {
    install: { command: 'npm', args: ['install'], cwd: options.dir || '.' },
    render: { command: 'node', args, cwd: options.dir || '.' },
  };
}

// ---------------------------------------------------------------------------
// Honest status
// ---------------------------------------------------------------------------

/**
 * What is true about the video, row by row, each from evidence.
 *
 * The difference from the Canva route is the whole point and it is spelled out
 * rather than implied: there, motion and per-scene timing can only ever be
 * `not-applied`, because the connector has no operation for them. Here they are
 * `rendered` — but only once a file exists and has been probed, and the rows
 * say which of the two artefacts each statement is about.
 */
function videoStatus(plan, evidence = {}) {
  const tl = evidence.timeline || timeline(plan);
  const file = evidence.file || null;         // from ffprobe: {width, height, duration, codec, hasAudio, fps}
  const expected = Math.round((tl.durationInFrames / FPS) * 100) / 100;
  const voice = evidence.voice || null;

  // The plan's own total is the sum of the scene lengths. The composition is
  // shorter by every transition, because a transition overlaps the two scenes
  // it joins instead of sitting between them. Stating the gap keeps a correct
  // render from reading as a 0.6-second bug.
  const planSeconds = plan && typeof plan.totalSeconds === 'number' ? plan.totalSeconds : null;
  const overlap = planSeconds === null ? null : Math.round((planSeconds - expected) * 100) / 100;
  const overlapNote = overlap
    ? `خطّة المشاهد ${planSeconds}ث ومجموع التركيب ${expected}ث: الفرق ${overlap}ث هو الانتقالات، وهي تتراكب على المشهدين لا تُضاف بينهما.`
    : null;

  const project = evidence.projectDir
    ? { state: 'scaffolded', dir: evidence.projectDir, scenes: tl.scenes.length }
    : { state: 'not-scaffolded' };

  const installed = evidence.installed === true ? { state: 'installed' }
    : evidence.installed === false ? { state: 'not-installed', fix: 'npm install داخل مجلّد المشروع' }
      : { state: 'unknown' };

  if (!file) {
    return {
      route: { state: 'remotion', note: 'ملف مستقلّ عن تصميم Canva: متحرّك ومؤقّت، وغير قابل للتحرير في Canva.' },
      project,
      install: installed,
      render: { state: 'not-rendered' },
      size: { state: 'unverified' },
      duration: { state: 'unverified', expected, ...(planSeconds !== null && { planSeconds }), ...(overlapNote && { note: overlapNote }) },
      motion: { state: 'unverified', note: 'الخطّة تحمل الحركة؛ الملف لم يُقَس بعد.' },
      sceneTiming: { state: 'unverified', note: 'لا ملف.' },
      audio: voice ? { state: 'planned', clips: voice.scenes.length } : { state: 'none' },
      licence: LICENCE,
    };
  }

  const sizeOk = file.width === WIDTH && file.height === HEIGHT;
  const drift = typeof file.duration === 'number' ? Math.round((file.duration - expected) * 100) / 100 : null;

  return {
    route: { state: 'remotion', note: 'ملف مستقلّ عن تصميم Canva: متحرّك ومؤقّت، وغير قابل للتحرير في Canva.' },
    project,
    install: installed,
    render: { state: 'rendered', file: evidence.path || null, codec: file.codec || null },
    size: sizeOk ? { state: 'verified', size: `${WIDTH}×${HEIGHT}` }
      : { state: 'mismatch', found: `${file.width}×${file.height}`, expected: `${WIDTH}×${HEIGHT}` },
    duration: {
      ...(drift === null ? { state: 'unverified' }
        : Math.abs(drift) <= 0.1 ? { state: 'verified', seconds: file.duration }
          : { state: 'mismatch', seconds: file.duration, drift }),
      expected,
      ...(planSeconds !== null && { planSeconds }),
      ...(overlapNote && { note: overlapNote }),
    },
    // The one row that an MP4 out of Canva could never earn.
    motion: { state: 'rendered-from-plan', elements: tl.scenes.reduce((n, s) => n + s.motion.length, 0), note: 'الحركة مؤلَّفة من الخطّة إطارًا إطارًا، لا مطبَّقة يدويًا.' },
    sceneTiming: drift !== null && Math.abs(drift) <= 0.1
      ? { state: 'verified-by-construction', note: 'كل مشهد Sequence بطول محدّد من الخطّة، والمجموع طابق الملف.' }
      : { state: 'unverified', note: 'المجموع لم يطابق: لا تَعُدّ توقيت المشاهد متحقّقًا.' },
    audio: !voice ? { state: file.hasAudio ? 'present-unplanned' : 'none' }
      : file.hasAudio ? { state: 'present-in-file', clips: voice.scenes.length, engine: voice.name }
        : { state: 'absent-in-file', clips: voice.scenes.length, note: 'المقاطع مخطّطة ولا مسار صوت في الملف: تأكّد أنّها في public/.' },
    licence: LICENCE,
  };
}

module.exports = {
  FPS,
  WIDTH,
  HEIGHT,
  SAFE,
  LICENCE,
  REMOTION_VERSION,
  FONT_MODULES,
  fontModule,
  fontPlan,
  fontFile,
  WEIGHT_LADDER,
  UNIVERSAL,
  timeline,
  theme,
  projectFiles,
  renderCommand,
  videoStatus,
};
