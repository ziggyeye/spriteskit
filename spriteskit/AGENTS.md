# AGENTS.md

Instructions for AI coding agents (Claude Code and compatible tools) working in
this repo. Keep this file concise and current — it's the first thing the agent
reads.

## What this project is

A Remotion-based engine for producing short, TikTok-style skits starring 72×72
sprite characters. The design principle: **skits are data, not code.** A skit is
a single TypeScript object (background + actors + timeline) that the generic
`SkitComp` in `src/skits/Skit.tsx` renders. Adding a new skit should require
zero changes to the rendering pipeline.

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
- `src/Root.tsx` — **registers skits as Compositions**. Add every new skit to the
  `skits` array here.
- `src/skits/types.ts` — **the authoritative schema.** Read this before
  authoring a skit or extending the engine. All public-facing types live here.
- `src/skits/Skit.tsx` — generic renderer. Walks the timeline, computes per-actor
  state at time `sec`, renders background + shadows + characters + bubbles +
  popups + flash + shake. No skit-specific logic here.
- `src/skits/scripts/*.ts` — one file per skit, exporting a `Skit` object.
- `src/components/Character.tsx` — sprite-sheet animator. Reads 4×4 grids of
  72-px frames from `public/`. Row = direction, column = idle frame.
- `src/components/SpeechBubble.tsx` — pop-in bubble, typewriter text, spring
  in/out, name badge above.
- `src/components/PopupText.tsx` — big meme caption.
- `src/components/Background.tsx` — animated gradient with sparkle layer.
- `public/Character_024_Idle.png` — `male` sprite (288×288).
- `public/Character_035_Idle.png` — `female` sprite (288×288).

## Sprite sheet format (do not change without reason)

288×288 PNG, 4 columns × 4 rows of 72×72 frames. Rows, top to bottom:
**down, left, right, up**. Each row is a 4-frame idle loop.

Hard-coded constants are in `src/components/Character.tsx`:
`SPRITE_SIZE = 72`, `FRAMES_PER_ROW = 4`. If the user supplies a sheet with
different dimensions, update these constants and verify rendering before
committing.

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

## Adding a new character sprite

1. Drop a 288×288 sheet in `public/` matching the row layout above.
2. Add a key to `SPRITE_FILES` in `src/components/Character.tsx`.
3. Add the id to the `SpriteId` union in `src/skits/types.ts`.

## Adding a new timeline action type

This is the invasive change — touches the schema and the renderer:

1. Add the variant to the `Action` union in `src/skits/types.ts`.
2. Handle it in `src/skits/Skit.tsx`:
   - If it affects actor state (position / direction / tint), update the
     `computeActorStates` loop.
   - If it adds a visual overlay, filter for it by `type` at the top of
     `SkitComp` (mirroring how `activePopups` / `activeShakes` etc. are done)
     and render inside the shake-wrapped `AbsoluteFill`.
3. Document it in the README's action reference table.

Keep the renderer pure and data-driven — resist adding skit-specific branches.

## Conventions

- **TypeScript strict mode** is on. No `any` without a comment explaining why.
- **Times in seconds, positions in pixels.** Don't mix frames into skit scripts.
- **No CSS modules, no Tailwind** — inline styles in components are fine and keep
  each component self-contained for the Remotion bundler.
- **Never reference `@remotion/*` internals** that aren't in the public API.
- **Don't commit `out/` or `node_modules/`.** Renders are artifacts, not source.

## Verification before shipping changes

- `npx tsc --noEmit` — must pass.
- `npm start` and visually check the affected skit (Remotion Studio supports
  hot reload; scrub the timeline).
- If you added a new skit, render it end-to-end once to confirm it produces a
  valid MP4.

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

## Non-goals

- This is not a general animation library. Scope stays at: sprite characters,
  speech bubbles, meme captions, camera effects. Resist feature creep.
- Not a web app. Don't add routing, state management libraries, or UI
  frameworks beyond what Remotion needs.
