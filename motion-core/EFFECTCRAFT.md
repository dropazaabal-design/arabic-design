# EffectCraft + Remotion — optional VFX bridge

This integration adds **EffectCraft as a secondary effects engine**; Remotion remains the authoritative 60fps/30fps frame clock, editor and final MP4 renderer. It does not change existing reels or install external software.

## 1. Install EffectCraft locally

Official downloads: https://getartcraft.com/apps/effectcraft
Source and CLI docs: https://github.com/storytold/effectcraft/blob/main/docs/agents.md

EffectCraft is alpha software; preserve the Remotion-only path as a fallback. On Windows the installed CLI is normally at `C:\\Program Files\\EffectCraft\\effectcraft-cli.exe` and is not automatically in PATH.

```powershell
cd motion-core
$env:EFFECTCRAFT_CLI = "C:\\Program Files\\EffectCraft\\effectcraft-cli.exe"
npm run effectcraft:doctor
```

For Claude Code MCP, register the official headless server (execute once on your machine):

```powershell
claude mcp add effectcraft -- "C:\\Program Files\\EffectCraft\\effectcraft-cli.exe" mcp --autosave
```

Use `effectcraft-cli mcp --autosave` to retain headless edits; MCP connection is independent of this rendering bridge. Confirm commands with `claude mcp list`.

## 2. Create an effects-only composition

- In EffectCraft, make a transparent-background composition at the **same width, height, duration and fps** as the overlay clip used by Remotion. Use 1080x1920 at 60fps for vertical reels.
- Put only graphics/effects in this comp; **no baked captions, no full scene background, no narration**. Arabic text and final audio stay in Remotion.
- Save as an `.ecproj` file. Example: `assets/fx/intro.ecproj`.
- Effects must comply with the brand palette; no glow or warm colors unless specifically requested.

## 3. Pre-render an RGBA sequence

```powershell
cd motion-core
npm run effectcraft:render -- --project assets/fx/intro.ecproj --comp IntroFX --id intro-fx --frames 120 --fps 60 --width 1080 --height 1920 --public ./public
```

The bridge calls the **actual EffectCraft CLI** to render PNG RGBA, validates exact frame count and dimensions, normalizes names to `000000.png`, and atomically publishes:

```text
motion-core/public/effectcraft/intro-fx/
  manifest.json
  frames/000000.png
  frames/000001.png
  ...
```

It refuses to overwrite an existing overlay; use a fresh ID per version or back up/remove the old export deliberately. This design prevents an incomplete render from appearing in the Remotion public folder. Requires enough local disk space for lossless PNG frames.

## 4. Composite with Remotion

```tsx
import {Sequence} from 'remotion';
import {EffectCraftOverlay} from './src/EffectCraftOverlay';

// In a 60fps Remotion composition (120 frames = 2 seconds):
<Sequence from={300} durationInFrames={120}>
  <EffectCraftOverlay id="intro-fx" frameCount={120} />
</Sequence>
```

The overlay images have alpha; Remotion handles subtitles, all other animation and final MP4 generation. Keep the same fps, and use `manifest.json` as the frame-count source. If no overlay is requested, do not render or mount the component.

## 5. Checks

```sh
cd motion-core
node --test tests/effectcraft-bridge.test.mjs
npm test
npm run typecheck
```

The first test uses a **mock CLI**, not actual EffectCraft. For production approval, render one real 2-second alpha overlay, inspect frames 0/60/119, test a Remotion preview and verify the final MP4 with the existing audio/RTL/60fps QA gates. A successful mock test does **not** establish a successful EffectCraft GPU render.
