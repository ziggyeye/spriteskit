# Dead Reckoning — M1 Combat Grey-box

The first playable slice from [GAME_DESIGN.md](../GAME_DESIGN.md): one ship,
three enemy engagements, the full combat loop in grey rectangles. **If this
isn't fun with rectangles, we redesign before building anything else.**

## Running it

1. Install [Godot 4.3+](https://godotengine.org/download) (standard build, no
   .NET needed).
2. Open Godot → **Import** → select this folder's `project.godot`.
3. Press **F5** (Run Project). The window is portrait 1080×1920 — resize
   freely, it scales.

On a phone: Godot → Project → Export → Android/iOS. No plugins required.

Mouse clicks emulate touch (`emulate_touch_from_mouse` is on), so it plays
identically on desktop for iteration.

## What's in the slice

- **Three engagements** that demand different weapons (the point of M1):
  - **Merchant Brig** — flees. Round shot sinks the loot; chain her sails,
    then break her resolve or board.
  - **Navy Sloop** — fast marine-heavy boarder. Refuse the grapple, grape her
    exposed crew, man your swivels.
  - **Navy Frigate** — out-guns you 3:1 at medium range. Dismast her or rush
    to grapple before the math kills you.
- **Range bands** (Long/Medium/Close/Grappled) driven by helm stances, with a
  contested **weather gage** (wind advantage) affecting speed and evasion.
- **Ammo as a decision**: round / chain / grape / heated per broadside, plus a
  mortar. Heated shot needs the galley furnace lit.
- **Crew stations**: tap a crewman, tap a station. Idle hands automatically
  fight fires, plug breaches, then patch stations.
- **Fire climbs up, water rises from below.** Breaches flood the hold; pumps
  and carpenters fight it; a hot magazine over a hold fire ends conversations.
- **Boarding**: grapple at Close, muster a party, board, capture — or get
  boarded. Lines can be cut; boarders can be stranded.
- **Surrender**: enemy resolve breaks from casualties, fire, and flooding.
  Captured > surrendered > sunk, in plunder terms.
- **Pause is free** — selecting a crewman auto-pauses; every order can be
  given while paused. x2 speed toggle for the quiet stretches.

## Architecture (matches the design doc, §12)

```
src/defs.gd         all content as plain Dictionaries (ships, crew, weapons)
src/battle_sim.gd   pure simulation, fixed 10 Hz tick, no engine nodes
src/battle_view.gd  grey-box UI: renders sim state, turns taps into orders
src/Main.gd         harbor menu / engagement picker
tests/sim_smoke.gd  headless AI-vs-scripted-captain battles
```

The sim never touches nodes or rendering, so it can run headless for
balancing and will serialize for mid-battle save/resume later.

## Headless smoke test

```bash
godot --headless --script tests/sim_smoke.gd
```

Runs scripted policies against all three enemies, three seeds each, and
prints outcomes. Fails only if a battle never terminates.

> Written in a cloud session where the Godot binary couldn't be downloaded
> (network policy): all scripts are syntax-validated with `gdtoolkit`'s
> Godot-4 parser, but the project has not yet been executed in-engine.
> Expect first-run wrinkles; the smoke test above is the fastest way to
> shake them out.

## Deliberately not in M1

Off-ship strategy (chart, wind routes, the Hunt), ports/economy, morale &
mutiny, Come About / port-vs-starboard batteries, powder barrels & fire
rafts, monsters/forts/ghost ships, meta-progression, art, audio, save/resume.
