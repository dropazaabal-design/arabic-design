# reels/motion — Baseera's motion layer

طبقة حركة واحدة فوق Remotion. GSAP يحرّك العناصر، ومسارات Remotion الرسمية ترسم الخطوط وتنقل الأشياء على المسار، وRive يحرّك الشخصيات المرسومة. كلها تقرأ ساعة واحدة هي إطار Remotion، فيُرسم أي إطار وحده، وبأي ترتيب، بـ 30 أو 60 إطارًا/ث.

Imported by reels as `@motion/…`. See `reels/idea-flight` for a reel that uses all of it.

## The one rule: one clock

Remotion's frame is the only clock. Everything else is a pure function of `t = frame / fps` (seconds).

| Layer | Drives | How it reads the clock |
|---|---|---|
| **GSAP** (`gsap` 3.15 via the official `@remotion/gsap` 4.0.534) | Element choreography: camera, shakes, hops, pops, pulses, HTML titles | `useGsapTimeline` builds one paused timeline and seeks it to `frame / fps` each frame. It refuses `play()`, callbacks, tickers, random values and plain-object targets |
| **`@remotion/paths`** 4.0.534 | Line drawing, trails, motion along a path, shape morphs, hand-drawn highlights | Pure functions of a 0..1 progress (`drawn`, `alongPath`, `morph`, `scribbleLoop`) |
| **Rive** (`@rive-app/canvas-advanced` 2.31.5) | Optional character rigs with state machines | `RiveActor` draws every frame from scratch at `t` (see below) |
| **TSX rigs** (`reels/mukarram` Person + IK) | The main characters: poses, faces, hands that hold and reach | Numbers from `t` via `tween`/`keys` (GSAP eases) or the mukarram tracks (`f30`) |

Author scenes in **seconds**, never in frame counts. `reels/idea-flight` renders pixel-identical stills at 30 and 60 fps at the same second (`tools/render-tests.mjs`).

## API

```ts
import { clock, ease, tween, keys,                     // clock.ts
         popIn, hop, swing, shake, pulse, camera,     // moves.ts   (GSAP, inside useGsapTimeline builders)
         GsapCamera, DrawPath,                        // components.tsx
         alongPath, drawn, morph, scribbleLoop,       // paths.ts   (@remotion/paths)
         RiveActor,                                   // rive.tsx
         useGsapTimeline, gsap } from '@motion/index';
```

- `clock(frame, fps)` returns `{t, f30}`. `f30` is the same instant on a 30-fps grid, for the mukarram helpers that count 30-fps frames: `Shot` boil, `poseTrack`, `exprTrack`, and `blinkAt` (floor it).
- `ease('back.out(1.7)')` is any GSAP ease as a pure function; unknown names throw. `tween(t, t0, t1, a, b, ease)` and `keys(t, [[t, v, ease?]…])` are Remotion `interpolate` on seconds with GSAP eases. Rig numbers and GSAP elements share one easing vocabulary.
- **GSAP moves** add to a builder's paused timeline at `at` seconds and return their end time, so they chain or overlap:
  - `popIn`: overshoot.
  - `hop`: anticipation, stretch, squash on landing, settle.
  - `swing`: damped follow-through.
  - `shake`: decaying, deterministic.
  - `pulse`: emphasis.
  - `camera`: zoom and pan groups.

  For SVG, pass the pivot as `svgOrigin: "x y"` so it never depends on a measured bounding box.
- `<GsapCamera width height start moves>` is the world under a GSAP camera. It uses the same transform as mukarram's `Shot`: `translate(W/2,H/2)·scale(zoom)·translate(−cx,−cy)`.
- `<DrawPath d p from?>` reveals a path to progress `p`; `from` erases its start, which makes a travelling trail.
- `alongPath(d, p)` returns `{x, y, angle}` on the path. Props, planes and cameras follow it, and a hand can use its point as an IK target.
- `morph(p, a, b)` uses `interpolatePath`. `scribbleLoop(cx, cy, rx, ry, {seed})` is a seeded hand-drawn circle; it uses no `Math.random`.
- `<RiveActor src artboard (animation | stateMachine inputs=[{at, name, value?}]) width height fallback?>`:
  - Inside an SVG world, wrap it in `<foreignObject>` so the camera moves it.
  - `value` omitted means a trigger fires.
  - A load failure draws `fallback`, which is a TSX/SVG stand-in. Without a fallback, the render fails; it never goes silently blank.

## Rive: why not `@remotion/rive`

The official `@remotion/rive` 4.0.534 was installed, read, and **not used**:

1. **Order-dependent.** It advances the animation by `frame − previously rendered frame`, so a frame's pose depends on render order. Parallel tabs and out-of-order seeks break.
2. **Network at render time.** It fetches `rive.wasm` from unpkg during the render.
3. **No state machines.** It plays linear animations only.

`RiveActor` uses the same runtime package and version (`@rive-app/canvas-advanced` 2.31.5, the one `@remotion/rive` pins), with these differences:

- **Bundled WASM.** It loads `rive.wasm` from the reel's own bundle through `new URL(…, import.meta.url)`, so there is no network.
- **Cached.** The runtime and `.riv` files are cached per render tab.
- **Fresh state every frame:**
  - A linear animation is a fresh instance advanced from 0 to `t`.
  - A state machine is a fresh instance replayed from 0 to `t` in fixed 1/120 s steps, applying each scheduled input once (`rive-steps.ts`). The step grid does not depend on fps.
- **Cleanup.** Per-frame instances are `delete()`d after drawing.

The cost is that the replay is O(t) per frame. A 14-second shot does 1,680 cheap steps per frame. For long Rive shots, put the actor in a `<Sequence>` so `t` restarts.

**Assets.** No Baseera `.riv` exists yet; a rig has to be authored in the Rive editor. `reels/idea-flight` uses `birb.riv` from Rive's MIT-licensed runtime repository (`rive-app/rive-wasm`, attribution in its `asset_manifest.json`) to validate the layer in a real render. It is not an original Baseera character. The TSX rigs stay the default; use Rive where a state-machine rig materially beats a TSX one.

## Decisions on overlap

- **MotionLab: nothing to keep, adapt or remove.** There is no MotionLab code, package or reference in this repository. `git grep -i "motionlab|motion-lab|motion_lab|motion lab"` across all 28 remote branches returns nothing, and no `package.json` or lockfile names it. It was not added: its stated uses (timelines, eases, path motion, character states) are covered here by GSAP, `@remotion/paths` and Rive.
- **`motion-core/` on `claude/wonderful-lamport-ep2m3e`** (the repository's default branch) is a prototype on the same official packages (`@remotion/gsap`, `@remotion/paths`). It is not on this branch and no reel uses it. Its word-anchored `compileMotionPlan` overlaps the reels' `storyboard.json` and `wordAt` anchors. This module does not port it. When the branches meet, keep one: this module is the one exercised by a rendered reel and render tests.
- **One library per job:**
  - Paths come from `@remotion/paths` only. GSAP's MotionPath and DrawSVG plugins are not used.
  - Eases come from GSAP only, through `ease()`. There is no second easing table.
  - Timing comes from Remotion only. There is no other timeline.

## Tests

```sh
cd reels/motion && npm ci && npm test        # unit: eases, tweens, GSAP seek order, paths, Rive step plan (8 tests)
cd reels/idea-flight && npm ci && node tools/render-tests.mjs   # headless renders (12 checks; see that reel)
```

## Licences

| Package | Licence |
|---|---|
| `gsap` | GSAP Standard "no charge" licence: free for commercial use, except tools that compete with Webflow |
| `@remotion/*` | Remotion licence: a company licence is needed for companies over 3 people, the same as the rest of `reels/` |
| `@rive-app/canvas-advanced` | MIT |
| `birb.riv` | MIT, © Rive |
