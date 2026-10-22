# How a shot is built

This is the reference for writing the shots, in `src/scenes/bN.tsx`. Batch N covers shots 20N−19 … 20N.

`src/scenes/b1.tsx` is the worked example. Read it before writing a batch: it uses every tool below.

## 1. Time

Every shot is a pure function of its own local frame: `(c: Ctx) => ReactNode`.

The timeline is in `src/film/engine.tsx`:
- Each shot lasts for one narration line. Line 86 is split into shots 86 and 87.
- Each cut lands at most 0.22 s before the voice starts.
- `c.dur` is the shot length in frames. The film runs at 60 fps.

| | |
|---|---|
| `c.f`, `c.t` | Local frame, and local time in seconds. |
| `c.at('word')` | Local frame where the first spoken word containing that text starts. Hamza, ta marbuta and diacritics are ignored. `c.at(w, true)` gives the word's end; `c.at(w, false, 1)` gives the second match. **Every key action is placed on a word.** |
| `c.sp` | `[speech start, speech end]` in local frames. |
| `c.p(from, len = 18, ease)` | A 0..1 ramp. |
| `k(f, [[frame, value], …])` | Eased keys. |
| `settle(f, from)` | A spring from 0 to 1. |
| `ease.inOut` / `ease.out` / `ease.back` / `ease.lin` | Easing curves. |
| `poseAt(f, [[frame, pose, blendFrames?], …])` | Pose track. A key can be a pose name, `{ p, hands }`, or a bare `Pose`. |
| `faceAt(f, [[frame, expression or Face, blend?], …])` | Face track. |
| `nod(f, at, n, amp)`, `shake(f, at, len, amp)` | Head nods, and a shake that dies away (in `scenes/common.tsx`). |
| `walkTo(f, f0, f1, x0, x1, scale)` | Returns `{ x, facing, p }`. The step phase follows the distance, so feet don't slide. |

`timing/shots.json` gives each shot's `from`, `to`, its `key` preview frame and its 3 review frames.

The words and their times for any line are in `timing/words.json` (`line`, `i`, `word`, `start`, `end`, in seconds of film time).

## 2. Space

The world is 1920×1080. `Stage` takes a camera `cam(x, y, z)` (from `scenes/common.tsx`), which clamps so it never shows past the world edges.
- `CAM0` is the full frame.
- Overlays go in `Stage`'s `over` prop as HTML in screen pixels.
- `toScreen(cam, [wx, wy])` converts a world point to the screen.

Standing feet are at y 860 in the places. Back walls meet the floor at y 820.

## 3. Characters

All characters use one rig: `src/kit/characters/`. See `CHARACTER_BIBLE.md` and `characters/sheets/*.png`.

```tsx
<Actor f={c.f} seed={41} who="salim" x={…} y={feetY} s={1.45} facing={1 | -1}
  pose={poseAt(c.f, …)} face={faceAt(c.f, …)} say={[from, to]}
  hands={{ R, L }} hold={{ R: <Phone w={28}/> }} upright={{ R: true }} o={opacity} />
```

**Cast** (`who`):
- `salim` (seed 41).
- `jaser` (seed 13, default face `smug`).
- `mona` (team lead).
- `reem` (Salim's sister, seed 23).
- `hadi` (glasses).
- `att1`, `att2`, `att3` (colleagues).
- `mother`.

**Pose:**
- Character space: feet at y = 0, up is −y, +x is forward. `facing = -1` mirrors the character.
- Bones at scale 1: head r 48, torso 98, upper arm 60, forearm 56, thigh 66, shin 64. The shoulders are at about (−18 / +16, −218).
- A standing hand can reach about 116 px from the shoulder.
- Build a pose with `pose({ lean, bob, sit, head, turn, body, R: { hand: [x, y] } | { sh, el }, L, footR, footL, breath })`.
- `sit: 1` lowers the hip to 112 above the feet.
- Seated, the shoulders are at about y −210 and the table top is at about y −156 (see `atTable()`).

**Named poses** (`POSES`): `stand`, `standFront`, `walk`, `sit`, `sitTense`, `sitType`, `armsCrossed`, `handsOnHips`, `point`, `explain`, `handOnChest`, `phone`, `breathe`, `headInHands`, `stop`, `slump`, `shrug`, `stepBack`, `listen`, `write`.

**Expressions:** `neutral`, `calm`, `smile`, `forcedSmile`, `irritated`, `angry`, `hurt`, `sad`, `anxious`, `surprised`, `thinking`, `relieved`, `determined`, `embarrassed`, `listening`, `smug`, `contempt`, `shout`.
- Or pass a `Face` object: `{ ...EXPRESSIONS.calm, look: [x, y], tight, blush, … }`.

**Hands:** `open`, `relaxed`, `fist`, `point`, `pen`, `grip`, `stop`, `two`, `cup`, `chop`.
- A held prop (`hold`) is drawn between the palm and the fingers, so it is really held.
- Pass `upright` for things that are read, like a phone.
- A phone held in a hand uses `<Phone w={28}/>`.

**Scale:** use 1.45 for standing medium shots and 1.3 for the meeting table. Use 1.6–2.0 when the character carries a diagram on paper.

## 4. Places (`src/kit/places/`)

| Component | Anchors |
|---|---|
| `MeetingBack({ t })` → seated characters → `MeetingTableFront()` | `MEETING.seats` x 430, 642, 854, 1066, 1278, 1490.<br>Seated: `y = MEET_FEET`, `s = 1.3`.<br>Presenter: `standAt` (1700, 860).<br>`Meeting({ f, seats, extra, front })` in `common.tsx` does the layering.<br>Salim's chair is seat 5. |
| `UnderTable()` | The centre is free for a big hand. |
| `Street({ pan, eve })` | Walking at y 880.<br>`pan` 0→1 scrolls; a rising `pan` means walking right.<br>Bus stop at near-x 1880 (screen x = 1880 − pan·1400). |
| `HomeLiving({ door, night, room, hall })` | Front door at x 1500 (`door` 0..1).<br>Bedroom door at x 200–400 (`room` 0..1; `hall` is drawn inside it).<br>Sofa seat: x 840, feet at 860, s 1.45. |
| `Bedroom({ lamp, night })` | `BEDROOM.bedSeat` x 930 (feet 860).<br>`nightstand` (540, 690).<br>Window at x 1075–1435. |
| `DiningBack()` → seated → `DiningTableFront({ food })` | `DINING.seats` x 640 and 860 facing +1, x 1060 and 1280 facing −1.<br>Seated: `y = DINING.feetY`, `s = 1.3`, hands on the table with `atTable()`. |
| `DeskBack({ screen })` → character → `DeskFront({ screen, mug })` | `DESK.seat` x 700 (feet 860, s 1.45, facing +1).<br>Monitor `DESK.screen` {x 1060, y 360, w 440, h 248}.<br>`deskTop` 646. |
| `CoffeeCorner()` | `COFFEE.left.x` 760, `right.x` 1160, y 860, high table top 628. |
| `Corridor({ pan })` | Walking at y 860. |
| `parts.tsx` | `Door`, `Window`, `Plant`, `Clock`, `Glow`, `Rect`, `Poly`, `Arabic`, `Ghost` (far figures), `NightSky`. |

## 5. Props (`src/kit/props`, all exported from `index.ts`)

- **Phone:** `Phone({ w, screen, glow, faceDown, buzz, t })`. The screen is drawn into 360×720.
  - `ChatScreen({ name, messages: [{ from: 'me' | 'them', text, time }], typing, draft, draftCaret, erase, header: 'day' | 'night', t })`. Their bubbles are on the right, mine on the left.
  - `PostScreen({ author, text, comments: [{ name, text, hostile }], reply, menu, blocked, time })`.
  - `LockScreen({ time, date })` and `NotificationBanner({ name, text, time, o })`.
- **Desk and paper:**
  - `Notebook({ open, lines, written, w })`. Lines are revealed from their right end.
  - `Pen({ click })`.
  - `Paper({ crumple })`, `Folder()`, `Calendar({ day })`.
  - `Laptop({ open, screen })`, `Lamp({ on })`.
- **Room and tableware:** `Mug({ steam, t })`, `Glass({ fill })`, `Plate()`, `Clock({ hours, minutes })`, `Plant({ sway })`, `Chair({ facing, kind })`.
- **Bubbles:**
  - `SpeechBubble({ w, h, tail: [x, y], kind: 'say' | 'think' | 'shout', children })`. Its origin is the bubble centre. A string child is set as RTL Arabic.
  - `ThoughtCloud`. b1's `Replay` puts a tiny scene inside one.
- **Icons:** `IconThought`, `IconHeart`, `IconFlame`, `IconBody`, `IconEar`, `IconClock`, `IconShield`, `IconDoor`, `IconPause`, `IconBreath`, `IconEye`, `IconCheck`. Each takes `{ s, accent }`.

## 6. Metaphors (`src/kit/metaphors`)

Each metaphor is a full-frame `<svg>`, so it can be dropped into a `Stage`.

| Metaphor | Props and anchors | Free for words |
|---|---|---|
| `Lake` | `{ t, current, cut, boat, storm }` | Sky top-left. |
| `Pot` | `{ t, boil, flame, press, steamOut, knob }`; `POT` | y < 300; sides x < 560 or x > 1360. |
| `Doors` | `{ t, open: [a, b, c], glow }`; `DOORS.xs` 520, 960, 1400; labels at y 300 | |
| `SingleDoor` | `{ t, open, knock }` | |
| `Tree` | `{ t, wind, roots }` | Top-left. |
| `Wave` | `{ t, phase, size }`; phase: rise to 0.45, crest, settle | y < 280. |
| `Loop` | `{ t, active: 0..3, entries }`; `LOOP_NODES`: thought, emotion, body, each with a label slot | |
| `Storm` | `{ t, intensity }` | y > 900. |
| `Plan` | `{ t, written }`; a note pinned to the wall and drawn with marks | |
| `Gap` | `{ t, open }`; `gapLayout(open)` gives stone centres and label slots; Salim stands in the gap from open ≈ 0.66 | |

## 7. Words on screen

| Helper | Use |
|---|---|
| `Cap({ text, o, top, size, x, w, pill, color })` | A short title or caption (HTML, RTL). |
| `Say({ text, to, o, above, size, think })` | A dialogue bubble. Its tail points at `to` in screen pixels; anchor it on the speaker's head. |
| `Tag({ text, at, o, bg })` | A label chip. |
| `WLabel({ x, y, text, size, color, bg, o })` | A label in world coordinates, inside the SVG. |
| `ChestSwirl({ x, y, r, t, amount, color })` | The felt feeling inside the chest. This is the film's recurring sign. |
| `Arrow({ from, to, bend, p, color })` | An arrow that draws itself. |
| `Floor`, `Paper` | Ground and paper backgrounds for diagram scenes. |

## 8. Rules (from the brief)

- **Arabic only on screen.** Use Western digits 0–9. Keep text short (one to five words), at least 40 px, and never English.
- **No yellow, orange or gold.** `node tools/palette.mjs` must report `banned: []`. Use `PAL` colours.
- **Motion needs a narrative cause.** Use anticipation and easing. No constant shaking. No pose jumps (blend keys over 10–20 frames). Limbs never stretch.
- **No static stretch longer than 3 s.** Something meaningful must move: a gesture, a head turn, a prop, a metaphor element.
- **Variety comes from content, not crops.** Change place, action, staging or metaphor. Don't just zoom into the same picture.
- **Keep figures readable.**
  - No tiny characters in empty space.
  - Hands touch what they hold.
  - Bubbles have tails to their speaker.
  - Nothing important is cut off by the frame edge unintentionally.
- **Salim is the only one in green; Jaser is the only one in wine red.**
- **Bubbles and labels are clean.** They must not overlap faces and must stay inside the frame.
- **A dissolve or fade into the next shot** comes from the `cut` field of `narrative/shotlist.json`. `Film.tsx` handles it, so don't add your own fade.

## 9. Sound

Add cues in `audio/sfx/bN.json`: `{ "shot", "at": word or seconds into the shot, "sfx", "gain" (0.3–0.6), "offset"? }`.

Effects: `buzz`, `ding`, `door`, `latch`, `knock`, `tap`, `bang`, `type`, `erase`, `pen`, `page`, `whoosh`, `rewind`, `pop`, `stamp`, `boil`, `wind`, `water`, `wave`, `breath_in`, `breath_out`, `heart`, `steps`, `chair`, `chime`, `click`, `swish`, `rumble`, `laugh`.

Keep them light: 1–3 per shot, only on visible actions.

## 10. Checking a batch

```sh
npx tsc --noEmit -p .                                   # types
node tools/palette.mjs                                  # colours
node tools/shots.mjs review 21-40                       # 3 frames per shot → previews/review/NNN-{a,b,c}.png
python3 tools/strip.py 21-27 previews/review/b2a.jpg     # contact strips to look at (7 rows each)
node tools/shots.mjs key 21-40                          # the deliverable preview per shot → previews/shots/NNN.png
```

`tools/shots.py` rewrites `timing/shots.json` if the shot list ever changes.
