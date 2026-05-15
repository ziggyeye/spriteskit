# AGENTS.md

Instructions for AI coding agents (Claude Code and compatible tools) working in
this repo. Keep this file concise and current — it's the first thing the agent
reads.

## What this project is

A Remotion-based engine for producing short, **TikTok-style 3D-character
skits**. The design principle: **skits are data, not code.** A skit is a
single TypeScript object (background + actors + timeline) that the generic
`SkitComp` in `src/skits/Skit.tsx` renders. Adding a new skit should require
zero changes to the rendering pipeline.

The character is a rigged FBX from the Cozy Cafe asset pack (Lips-Pack
variant), animated via three.js + `@react-three/fiber`, composited inside a
Remotion `<ThreeCanvas>`. Face expression (eyes + mouth) is driven by
swapping textures on dedicated face submeshes per frame.

## Setup

```bash
npm install
npm start       # Remotion Studio live preview at http://localhost:3000
npm run build   # renders the default skit to out/ai-taking-my-job.mp4
```

First render downloads a headless Chrome (~150 MB). Requires network access.
Node 18+ (22 tested).

## Repo map

- `src/index.ts` — Remotion entry; just calls `registerRoot`.
- `src/Root.tsx` — **registers skits as Compositions**. Add every new skit to
  the `skits` array here.
- `src/skits/types.ts` — **the authoritative schema.** Read this before
  authoring a skit or extending the engine. All public-facing types live here.
- `src/skits/assets.ts` — **typed catalogues of every animation clip name,
  outfit mesh name, viseme, and eye sprite.** This is the contract between
  the FBX and the skit author — use the unions to author skits with
  type-safe asset references.
- `src/skits/legacyOutfits.ts` — maps legacy 2D `SpriteId`s
  (`dave`/`alex`/`boss`/`janitor`/`intern`) to default 3D `Outfit` configs so
  pre-3D skits still render.
- `src/skits/Skit.tsx` — generic renderer. Walks the timeline, computes
  per-actor state at time `sec`, renders the 3D scene + DOM overlays
  (background, bubbles, popups, flash, shake). No skit-specific logic here.
- `src/skits/withVisemes.ts` — runtime helper that merges generated viseme
  tracks (from the voice generator) into a skit's `speak` actions.
- `src/skits/scripts/*.ts` — one file per skit, exporting a `Skit` object.
- `src/components/Character3D.tsx` — loads the shared FBX once, clones the
  rig per actor via `SkeletonUtils`, drives `AnimationMixer` deterministically
  from Remotion's frame clock, toggles outfit visibility, and swaps
  `Body_Mouth` / `Body_Eye_L/R` materials per frame.
- `src/components/SpeechBubble.tsx` — pop-in bubble, typewriter text, spring
  in/out, name badge above.
- `src/components/PopupText.tsx` — big meme caption.
- `src/components/Background.tsx` — animated gradient with sparkle layer.
- `src/services/voiceService.ts` — ElevenLabs `/with-timestamps` integration
  that produces MP3 + viseme JSON.
- `src/scripts/generateVoices.ts` — pre-renders voices for each skit and
  emits a `{skitName}.visemes.ts` module.
- `public/models/Character_Talking.fbx` — the active character rig (from
  Lips-Pack). Sitting alongside it are the texture PNGs the FBX references.
- `public/sprites/eyes/*.png`, `public/sprites/lips_simple/*.png`,
  `public/sprites/lips/*.png` — face overlay sprites swapped per frame.

## 3D engine architecture

### Coordinate spaces (read this before touching positioning)

- **Skit-pixel space**: 1080×1920 portrait, origin at top-left, Y down.
  Skits author here. A character's `(x, y)` is **center-bottom** — where
  the feet land.
- **World space**: standard three.js. Y up, X right, Z out of the screen.
  Mapped from skit-pixel via `PIXELS_PER_UNIT = 480` in `Skit.tsx`:
  - `worldX = (skitX - width/2) / PIXELS_PER_UNIT`
  - `worldY = (height - skitY) / PIXELS_PER_UNIT`
  - `worldZ = 0` (the canvas plane).
- **Character height**: ~1.45 world units (~700 pixels rendered). The
  head bone is at ~0.71 world units above feet; eye line at ~0.95.
  `CHARACTER_HEIGHT_PX = 700` in `Skit.tsx` drives speech bubble + emote
  Y placement. If you change the rig, update that constant.
- **Default camera**: positioned at world `(0, 2.0, 6.4)`, looking at
  `(0, 2.0, 0)`, fov 35° — frames the full portrait with a character at
  feet-y ≈ 1500.

### Render pipeline

1. `<SkitComp>` walks the timeline, computes per-actor state at time `sec`,
   computes interpolated camera state.
2. Inside a `<ThreeCanvas>`: ambient + directional lights, perspective
   camera driven by `<SceneCamera>`, and one `<Character3D>` per visible
   actor.
3. `Character3D` clones the cached FBX, applies outfit visibility, steps
   its `AnimationMixer` to `mixer.setTime(clipTime)` deterministically each
   frame, and swaps `Body_Mouth` / `Body_Eye_L/R` material maps to reflect
   the current viseme + eye state.
4. DOM overlays (speech bubbles, popups, emotes, flash) render on top of
   the canvas via `<AbsoluteFill>`.

### FBX rig (Character_Talking.fbx + parts)

- **Base rig**: `public/models/Character_Talking.fbx` (Lips-Pack).
  Provides skeleton, animations, and the face submeshes
  (`Body_Head`, `Body_Eye_L`, `Body_Eye_R`, `Body_Mouth`).
- **Parts**: `Hair_All.fbx`, `Clothes_All.fbx`, `Accessories_All.fbx`,
  `Items_All.fbx` (also in `public/models/`). Each shares the **exact
  same 53-bone skeleton** as the base rig (verified by name). The
  runtime harvests every SkinnedMesh from each parts FBX into a
  `partsCache` map at startup. When each actor's rig is built, every
  cached part is cloned and its skeleton reference **rebound** to the
  clone's bones (matched by name). Result: the parts animate with the
  actor's mixer.
- The skeleton-rebind is the key trick — see `loadParts()` block in
  [Character3D.tsx](src/components/Character3D.tsx). `partMesh.bind(new
  Skeleton(remappedBones, originalBoneInverses), partMesh.matrixWorld)`.
- The FBX-default materials are MeshPhongMaterials. We clone them per
  actor instance so per-actor swaps (skin tone, hair colour, face
  texture) don't bleed across characters.
- `frustumCulled = false` on every SkinnedMesh — cloned bounding spheres
  reflect rest pose, not animated pose, and would otherwise be culled.
- FBXLoader applies a `-π/2` X rotation on the root for Z-up → Y-up. We
  bake that into the JSX wrapper inside the yaw group so per-actor yaw
  applies to an already-upright rig.

### Face expression system

- **Body_Mouth**: material `M_Mouth`, UVs span 0..1 of the texture.
  Default-bound to `sprites/lips/Lips_00.png` (closed mouth). Each
  speak action's viseme track swaps `.map` to the current
  `Lips_NN.png` per frame.
- **Body_Eye_L / Body_Eye_R**: material `M_Eyes` on each. Default-bound
  to `sprites/eyes/Eye_0_Default.png`. The `eyes` action swaps both
  per frame.
- All three use `alphaTest = 0.5` + `polygonOffset` to punch the black
  shape through the transparent background without z-fighting against
  `Body_Head`.
- **Lip-sync pipeline** (`voiceService.ts`): ElevenLabs character-level
  alignment → tokenize words → CMU dictionary lookup (ARPAbet phonemes)
  → distribute audio duration across phonemes → map each phoneme via
  `ARPABET_TO_VISEME` (derived from Lips_Legend.png) to a detailed
  mouth frame. Words not in the dictionary fall back to a per-letter
  heuristic.

## Asset catalogue

### Animations (17, on the base Lips-Pack rig)

| Clip | Duration | Use |
| --- | --- | --- |
| `Walk_Loop` | 0.80s | Auto-played during `walk` actions |
| `0TPose` | 0.03s | Fallback only — don't use intentionally |
| `React_Stand_Discussion_1` | 6.10s | Long ambient dialogue idle |
| `React_Stand_Discussion_2` | 5.47s | Alternate dialogue idle |
| `React_Stand_ListeningNod` | 5.30s | Listening with subtle nods |
| `React_Stand_Thinking` | 1.33s | Quick thinking beat |
| `React_CrossedArms_Thinking` | 1.73s | Crossed-arms thinking |
| `React_Stand_YES` | 1.47s | Affirmative nod |
| `React_Stand_NO` | 1.67s | Head shake |
| `React_CrossArms` | 0.80s | Cross arms |
| `React_CrossArms_NodYES` | 1.20s | Crossed arms + nod yes |
| `React_CrossArms_ShakeNO` | 1.47s | Crossed arms + shake no |
| `React_ThumbsUp` | 0.73s | Quick thumbs up |
| `React_WaveHello` | 1.47s | Wave hello |
| `React_WaveBye` | 2.20s | Wave goodbye |
| `React_Handshake` | 1.90s | Two-character handshake — underused |
| `React_Jump_Joy` | 0.87s | High-impact joy beat — save for finale |

**Note:** No sit/eat/drink/run/dance animations on this rig. The
Characters-Pack `Character_All.fbx` has 43 cafe animations
(`Sofa_*`, `Floor_*`, `TallChair_*`, `Tray_*`, `Bar_*`) but we don't
load that FBX. To get those clips we'd have to swap the base rig
entirely; not worth it for most skits.

### Face sprites

- **Eye sprites** (`public/sprites/eyes/`) — 16 total: `Eye_0_Default`,
  `Eye_Angry`, `Eye_Blink1/2/3`, `Eye_Closed`, `Eye_Flat`,
  `Eye_Frustrated`, `Eye_Hearts1/2/3/4`, `Eye_Kawaii`, `Eye_Sad Cry`,
  `Eye_Starry1/2`.
- **Mouth simplified** (`public/sprites/lips_simple/`) — 20 total:
  - Visemes: `Lips_s00_Default` (closed), `s01_sh-ch`, `s02_a-i`,
    `s03_ah-i`, `s04_th`, `s05_e-k-r`, `s06_s-z`, `s07_m-b-p`, `s08_f-v`,
    `s09_L`, `s10_oh`, `s11_o-u-w`.
  - Emotions: `s12_Upset`, `s13_Sad`, `s14_Angry`, `s15_Thinking`,
    `s16_Cheeky`, `s17_Cute`, `s18_Surprised`, `s19_Confused`.
- **Mouth detailed** (`public/sprites/lips/`) — 30 total (`Lips_00`–
  `Lips_29`), same idea but finer-grained. Use only if simplified is too
  coarse.

### Outfit mesh catalogue (all loaded via `loadParts()`)

Every mesh below is available on the active rig. Pick per actor via
the `Outfit` object on the actor definition. Mesh names match the
typed unions in `src/skits/assets.ts`.

**Tops (8)** — `Clothes_Top_Tshirt`, `Clothes_Top_Tshirt_V`,
`Clothes_Top_Hoodie`, `Clothes_Top_Sweater_TurtleNeck`,
`Clothes_Top_CollarShirt_Long`, `Clothes_Top_CollarShirt_Tucked`,
`Clothes_Top_CollarBlouse_Long`, `Clothes_Top_CollarBlouse_Short`.

**Bottoms (4)** — `Clothes_Legs_Pants_Long`,
`Clothes_Legs_Pants_Short_Pockets`, `Clothes_Legs_Skirt`,
`Clothes_Legs_Skirt_Long`.

**Aprons (2, over the top)** — `Clothes_Apron_Short`,
`Clothes_Apron_Long`.

**Hair (17)** — `Hair_Short`, `Hair_ShortBob`, `Hair_ShortSpiky`,
`Hair_SideSweep`, `Hair_Long`, `Hair_Ponytail`, `Hair_Ponytail_Tight`,
`Hair_Pigtails`, `Hair_Bun_Big`, `Hair_Bun_Small`, `Hair_Hijab`,
`Hair_Senior_A`, `Hair_Senior_B`, `Hair_Shave_AfroTop`,
`Hair_Shave_BuzzAfro`, `Hair_Shave_Buzzcut`, `Hair_Shave_Swept`.

**Beards (2)** — `Beard_Full`, `Beard_Lower`.

**Head accessories (7)** — `Accessory_Glasses`, `Accessory_Headphones_black`,
`Accessory_Headphones_blue`, `Accessory_Headphones_pink`,
`Accessory_Headphones_red`, `Accessory_Headphones_yellow`,
`Hair_Acc_Band`.

**Held props (17)** — `held_Tray`, `held_Cupcake_Bubblegum`,
`held_Cupcake_Matcha`, `held_Cupcake_Orange`, `held_Cupcake_RedVelvet`,
`held_Coffee_Full`, `held_Coffee_Whip`, `held_Milkshake_Chocolate`,
`held_Milkshake_Empty`, `held_Milkshake_Matcha`,
`held_Milkshake_Strawberry`, `held_set_1_Cup`, `held_set_2_Cup`,
`held_set_3_Cup`, `held_set_1_Plate`, `held_set_2_Plate`,
`held_set_3_Plate`.

> **Caveat on held items:** their bones (`held_item_tray`,
> `held_item_plate`, `held_item_drink_food`) are parented to `Root`
> in the rig and rely on the Characters-Pack cafe animations
> (Tray_Walk, Sofa_Cup_Pickup, etc.) to keyframe their position.
> Those animations live in `Character_All.fbx` which we don't load.
> The engine works around this by reparenting the held_item_* bones
> to `hand_palmR` at clone time, so held items follow the right hand
> for free. Visual fidelity is "decent, not perfect" — items sit at
> the palm in a fixed orientation. Good enough for casual skits;
> if a skit really needs precise pickup motion, harvest the cafe
> clips from `Character_All.fbx` (see LEARNINGS.md).

### Per-actor texture overrides

In addition to mesh choice, each outfit slot supports a colour swatch
override. All are optional; defaults are sensible.

- **Skin tone** — `skinTone: Skintone_1` … `Skintone_6` (6 options).
- **Hair colour** — `hairColor: Haircolour_01` … `Haircolour_16` (16
  options). The palette is **not** ordered light-to-dark — it's
  blonde/gold/ginger/brown/black/pink/blue/etc.
- **Clothing colours** (top / legs / shoes / apron) — pick from 21
  swatches: `Amber`, `Cappuccino`, `Cushion_Blue`, `Cushion_Orange`,
  `Cushion_Red`, `Espresso`, `Glass`, `Green_Cactus`, `Green_Leaves`,
  `Grey`, `Honey_Milk`, `Latte`, `Machine_Black`, `Matcha`,
  `Milkshake_Strawberry`, `Olive_Sofa`, `Paper`, `Porcelain_Blue`,
  `Porcelain_Orange`, `Silver`, `Whipped_Cream`.

Accessories and held items use `T_CatCafe_Atlas.png` and their colours
are baked into UV regions (e.g. each headphone colour is a different
mesh, not a colour swatch override).

## Adding a new skit (the common task)

1. Create `src/skits/scripts/<camelCaseName>.ts` exporting a `Skit` object.
2. Import it in `src/Root.tsx` and append to the `skits` array.
3. Preview with `npm start`; iterate on the timeline.
4. Render with `npx remotion render <CompositionId> out/<name>.mp4`.

The `Skit.id` becomes the Remotion composition id. Use PascalCase.

Positioning uses composition pixel space (1080×1920 by default). A character's
`(x, y)` is **center-bottom** — i.e. where the feet land. The `FLOOR` pattern
in `aiTakingMyJob.ts` (a shared y-value for all actors) is a good default.

Times are in **seconds** (not frames). The renderer converts using the skit's
`fps` (default 30).

### Actor facing — 8 cardinal/diagonal directions

`Direction` is `'down' | 'down-left' | 'down-right' | 'left' | 'right'
| 'up' | 'up-left' | 'up-right'`. Maps to yaw:

- `down` → 0°  (faces camera dead-on)
- `down-right` → 45°
- `right` → 90°
- `up-right` → 135°
- `up` → 180° (away from camera)
- `up-left` → -135°
- `left` → -90°
- `down-left` → -45°

**Use diagonals for two-character dialogue.** A character on the right
side of frame should face `down-left` so they read as both
camera-friendly AND turned toward the other actor. A character on the
left should face `down-right`. Head-on `down` reads as "staring into
the void"; cardinal `left`/`right` reads as "in profile, ignoring
camera". Diagonals are the sweet spot for dialogue scenes.

### Action vocabulary (`src/skits/types.ts`)

| Action | What it does |
| --- | --- |
| `walk` | Move actor from current position to `to` over time. Auto-plays `Walk_Loop`. |
| `face` | Snap an actor's facing direction at a given time (uses `Direction`). |
| `speak` | Pop-in speech bubble + ElevenLabs audio + lip-sync. Hidden actors get audio only. `volume?` 0..1+ (amplification allowed via `allowAmplificationDuringRender`). |
| `animate` | Play a named FBX clip on an actor for a time window. `loop?: boolean` — default `true`, but use `false` for long windows to hold the end pose (avoids visible loop resets). |
| `eyes` | Swap an actor's eye sprite for a time window. Use `EyeSprite` union. |
| `tint` | Apply a rim-glow emissive colour to an actor's body. |
| `fade` | Tween an actor's opacity `fromOpacity → toOpacity` over a window. Dissolves. |
| `emote` | Float an emoji above an actor's head. |
| `camera` | Tween camera position / lookAt / fov / `up` (Dutch tilt) over a window. Hard cuts: tiny duration (~0.05s). |
| `sfx` | Schedule an audio clip. Optional `loop` + `loopClipSec` for ambient beds. |
| `popupText` | Big meme caption that springs in and wobbles. |
| `shake` | Camera shake for comedic emphasis. |
| `flash` | Full-frame colour overlay. |

## Adding a new character (visual variety)

Define an `Actor` with an inline `Outfit` object. Pick meshes from each
slot (`top`, `bottom`, optional `hair`, `beard`, `apron`, `accessory`,
`held`) using the typed unions in `src/skits/assets.ts`. Add colour
overrides via `skinTone`, `hairColor`, `topColor`, `legColor`,
`shoesColor`, `apronColor`. Sprite ID (`'dave'`/`'alex'`/etc.) is
purely for legacy compatibility — the renderer picks meshes from
`outfit`, not `sprite`, when both are present.

## Adding a new timeline action type

Invasive change — touches the schema and the renderer:

1. Add the variant to the `Action` union in `src/skits/types.ts`.
2. Handle it in `src/skits/Skit.tsx`:
   - If it affects actor state (position / direction / tint / clip / eyes
     / viseme), update the `computeActorStates` loop.
   - If it affects camera, update `computeCameraState`.
   - If it adds a visual overlay, filter for it by `type` at the top of
     `SkitComp` (mirroring how `activePopups` / `activeShakes` etc. are
     done) and render inside the shake-wrapped `AbsoluteFill`.
3. If it consumes asset names, add a typed union to `src/skits/assets.ts`.
4. Document it in the README's action reference table.

Keep the renderer pure and data-driven — resist adding skit-specific branches.

## Voiced skits + lip-sync

1. Author the skit normally with `voiceId` on each `speak` action (no
   `visemes` field needed).
2. Run `npm run generate-voices` — calls ElevenLabs `/with-timestamps`,
   writes `public/voices/{hash}.mp3` and `.visemes.json` for each line,
   and emits `src/skits/scripts/{skitName}.visemes.ts` exporting a
   `VisemeMap`.
3. In `src/Root.tsx`, wrap the skit with `withVisemes(skit, visemes)` so
   the renderer attaches viseme tracks at runtime.
4. At render time, `Character3D` reads the active speak action's visemes
   and swaps `Body_Mouth` per frame for lip-sync.

## Conventions

- **TypeScript strict mode** is on. No `any` without a comment explaining why.
- **Times in seconds, positions in pixels.** Don't mix frames into skit scripts.
- **No CSS modules, no Tailwind** — inline styles in components are fine and keep
  each component self-contained for the Remotion bundler.
- **Never reference `@remotion/*` internals** that aren't in the public API.
- **Don't commit `out/` or `node_modules/`.** Renders are artifacts, not source.
- **Use the typed unions in `src/skits/assets.ts`** (`ClipName`, `EyeSprite`,
  `Viseme`, mesh names) when authoring skits — they're the contract between
  the FBX and the skit data.

## Verification before shipping changes

- `npx tsc --noEmit` — must pass.
- `npm start` and visually check the affected skit (Remotion Studio supports
  hot reload; scrub the timeline).
- If you added a new skit, render it end-to-end once with
  `npx remotion render <CompositionId> out/<name>.mp4` to confirm it
  produces a valid MP4.
- For UI-affecting changes, render a single still mid-timeline with
  `npx remotion still <CompositionId> out/check.png --frame=<N>` and
  visually verify before doing a full render.

## Known quirks / gotchas

- Sandboxed environments (like Cowork) may block Chrome downloads, preventing
  renders. The project itself is fine; render on a machine with outbound
  network access.
- `staticFile(...)` paths are relative to `public/` and case-sensitive on Linux.
- Speech bubble `side: 'auto'` picks left/right based on actor x-position. Two
  actors speaking at the same time on the same half of the screen will
  overlap — use explicit `side` or stagger their `startSec`.
- The background gradient hue-shifts each frame; if the user asks for a
  perfectly-static background, remove the `shift` math in `Background.tsx`.
- FBX textures referenced by the model load from
  `public/models/` relative to the FBX path. If you swap the model, also
  copy any new texture filenames it references.
- The FBX's MeshPhongMaterials need real lights — `flat linear` on
  `<ThreeCanvas>` darkens everything. Current setup uses tone-mapped
  output + brighter ambient/directional lights (see `Skit.tsx`).
- M_Eyes and M_Mouth UVs span 0..1 of their textures, so single-sprite
  PNGs (one shape filling the image) drop in cleanly. Multi-cell atlases
  need explicit `texture.repeat` / `texture.offset`.

## Non-goals

- This is not a general animation library. Scope stays at: 3D-character
  skits, speech bubbles, meme captions, camera effects. Resist feature creep.
- Not a web app. Don't add routing, state management libraries, or UI
  frameworks beyond what Remotion needs.
- Not a real-time game engine. Determinism (Remotion's frame-locked clock)
  matters more than performance.

## Brainstorm subagents (`.claude/agents/`)

Four read-only research specialists for skit ideation. Spawn them via the
Agent tool with `subagent_type: <name>`. They do NOT write to the
codebase — they return structured analysis you (or the user) implement.

- `tiktok-virality-strategist` — evaluates whether a concept will pop on
  TikTok. Use proactively when brainstorming new skit ideas, picking
  between candidates, or generating hook variants.
- `skit-asset-utilizer` — maps a chosen concept onto specific FBX
  animations, eye/mouth sprites, and underused engine systems (camera,
  tint, popupText). Use after a concept is picked.
- `cinematic-shot-designer` — turns the asset blocking into camera
  action JSON with shot list, framing, and cutting rhythm. Use after the
  asset-utilizer.
- `skit-script-editor` — tightens dialogue for short-form video and
  lip-sync. Use only for voiced skits.

Typical flow for a new skit: divergent phase runs `tiktok-virality-strategist`
and `skit-asset-utilizer` in parallel; convergent phase chains
`cinematic-shot-designer` then `skit-script-editor` sequentially.
