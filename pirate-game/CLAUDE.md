# Dead Reckoning — project context for Claude

FTL-inspired pirate exploration roguelike for mobile. This folder is a
**standalone project** inside the `ziggyeye/spriteskit` repo (shares nothing
with the `spriteskit/` Remotion engine one level up). Active branch:
`claude/pirate-exploration-game-78xto0`.

## Read these first
- `GAME_DESIGN.md` — the full design doc. Source of truth for every mechanic.
- `godot/README.md` — how to run the M1 prototype.
- `tools/README.md` — the local FAL asset generator.

## Current state (handoff from the web session)
- **Design:** complete (`GAME_DESIGN.md`).
- **M1 combat grey-box:** built in `godot/` (Godot 4.3+). Pure-data 10 Hz sim
  (`src/battle_sim.gd`) fully separated from a disposable grey-box touch UI
  (`src/battle_view.gd`); content as plain dictionaries in `src/defs.gd`.
  Three engagements: merchant brig, navy sloop, navy frigate.
- The web build environment could not run Godot or reach FAL (network policy),
  so the code was validated with gdtoolkit's parser but is being debugged
  in-engine locally. One type-inference error has been fixed
  (`battle_sim.gd` accuracy base). **Expect more first-run wrinkles** — run
  it, fix what the compiler/runtime reports.
- **Assets:** none generated yet. `tools/generate_assets.py` runs locally with
  `FAL_KEY` set. Art is intentionally deferred until the grey-box feels good.

## How to run / verify
- Play: `godot --path godot` (from this folder) — mouse emulates touch.
- Headless sim check: `godot --headless --path godot --script tests/sim_smoke.gd`
  (plays scripted captains vs all three enemies; fails only if a battle never
  ends). Use this to catch runtime errors fast and to sanity-check balance.

## Guardrails
- Keep the sim engine-agnostic: no node/UI code in `battle_sim.gd`. This is
  what makes headless balancing and future save/resume work.
- All content lives in `defs.gd` as data — add ships/weapons there, not in code.
- **Never commit the FAL key or any secret.** The generator reads `FAL_KEY`
  from the environment only.

## Next steps (in priority order)
1. Get the prototype running clean in-engine; fix any remaining compile/runtime
   errors. Run the smoke test.
2. Playtest the three fights. The M1 question from the design doc: *is the
   range-band + ammo + crew loop fun with rectangles?* If not, redesign before
   adding anything.
3. Tune enemy balance (target: hard-but-fair; see GAME_DESIGN §9).
4. Only then: generate art via `tools/generate_assets.py` and wire one ship
   image into the battle view as a pipeline proof-of-concept.

## Open design questions (from GAME_DESIGN §16)
Tone/occult timing, crew attachment depth, combat camera (side-view vs
top-down), whether the Fear economy ships in v1, and monetization (design
assumes premium, no IAP).
