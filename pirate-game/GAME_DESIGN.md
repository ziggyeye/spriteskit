# DEAD RECKONING
### A pirate roguelike of sail, powder, and tide — inspired by FTL, not skinned from it
*Working title. Alternates: Powder & Tide, Letters of Marque, The Wine-Dark Deep.*

**Platform:** Mobile (iOS / Android), portrait orientation
**Engine:** Godot 4.x
**Combat:** Real-time with tactical pause
**Run length:** 30–60 minutes, permadeath, meta-unlocks between runs
**Status:** Design document (pre-production)

---

## 1. Pitch

You are a pirate captain with a stolen ship, a restless crew, and a rumor of a
treasure that ended every captain who chased it. Sail across five archipelagos,
fight the Royal Navy, plunder merchantmen, bargain with smugglers, and survive
the things that live under the waterline — while the Admiralty's hunting fleet
sweeps the sea behind you and hurricane season closes in ahead.

Every fight is a knife-edge of decisions: which shot to load, whether to close
and board or stand off and dismast, which flooding deck to save and which to
seal off. You will die. Then you'll die smarter.

## 2. Design pillars

1. **Situational tools, not bigger numbers.** Like FTL's weapon variety, every
   weapon and ammo type has enemies it's great against and enemies it's useless
   against. Mastery is knowing which, and having the right thing loaded.
2. **The sea is the second enemy.** Wind, weather, flooding, and morale are
   systems FTL never had. They're what makes this a pirate game and not a
   re-theme.
3. **Hard, then learnable.** Early runs end in the second archipelago. The
   game never gets easier — the player gets better. Knowledge (enemy tells,
   ammo economy, route reading) is the real progression.
4. **Many ways to win a fight.** Sink them, dismast and pound them, burn them,
   board them, scare them into striking their colors, or set a powder barrel
   adrift on the wind and sail away.
5. **Touch-first.** Every combat decision works with a thumb. Pause is free,
   always available, and never feels like cheating.

## 3. Explicitly *not* a re-theme — the translation table

We adopt FTL's *feelings*, not its mechanics. Where a mechanic maps 1:1, we
either replace it or push it somewhere FTL couldn't go.

| FTL concept | What we do instead |
|---|---|
| Beacon jump graph | **Open sea charts** with fog of war, plotted courses, wind, and currents. You sail *through* space, not between dots. |
| Rebel fleet advancing | **The Admiralty's Hunt** (a hunting fleet sweeping the chart) *plus* **hurricane season** — two different pressures that squeeze from different directions. |
| Shields | No energy bubble. Defense is **the weather gage** (wind advantage → evasion), **range**, **hull timbers**, and **angle** — earned by sailing, not powered by a reactor. |
| Reactor power allocation | **Crew stations.** Your power is people. A cannon deck with 4 crew reloads twice as fast as one with 2. Moving people *is* moving power — and people can die. |
| Oxygen / fire | **Fire and flooding**, with vertical logic: fire climbs *up* the decks, water fills from the *bottom*. They interact — and yes, you can flood a burning deck on purpose. |
| Top-down room grid | **Side-view ship cross-section** — stacked decks, perfect for a portrait phone screen. |
| Fixed weapon loadout | Weapon *mounts* are semi-fixed; **ammunition is a per-shot tactical choice** drawn from a finite stockpile. |
| Drones | **Things set adrift**: powder barrels, fire rafts, decoy launches — carried by wind and current, not AI. |
| Crew races | **Crew roles + morale.** A pressed navy gunner and a freed galley slave have different skills *and* different mutiny risk. |
| Store beacons | **Ports** with reputation-based prices, rumors (which reveal map intel), recruitment, and careening (out-of-combat repair that costs *time* — and time is the Hunt closing in). |

## 4. Core loop

```
CHART (strategic layer)
  Plot a course → weather/wind decide real cost → arrive at a point of interest
    ├─ Battle (real-time w/ pause)
    ├─ Island landing (expedition event — pick a shore party, risk vs reward)
    ├─ Port (trade, repair, recruit, rumors)
    └─ Event (text event with skill/crew/cargo checks)
  Spend loot → repair, ammo, rum, crew
  The Hunt advances; the storm front advances
  → next course, until the region's exit passage
FIVE REGIONS → final approach → endgame boss
```

**Session shape for mobile:** the game saves continuously and resumes
mid-battle. A run is 30–60 minutes but is designed to be played in 5-minute
bites without punishment.

---

## 5. The strategic layer: sailing and exploration

### 5.1 The chart
Each region is a hand-drawn nautical chart, mostly fogged. Points of interest
(POIs) surface through: line-of-sight sailing, buying rumors in taverns,
captured charts from prizes, and lookout events. You never see the whole map —
route planning is a bet made with partial information.

### 5.2 Wind and current
- A prevailing wind arrow per region, shifting every few days (turns).
- Sailing with the wind: fast, cheap. Beating against it: slow, consumes extra
  supplies, crew fatigue.
- Currents are visible ribbons on the chart — free speed if your route uses
  them, a trap if a fight breaks out inside one (they carry you toward hazards).
- **This is the exploration skill:** a good captain reads the chart and gets
  three POIs for the supplies a bad captain spends on one.

### 5.3 The two pressures
- **The Admiralty's Hunt:** a fleet marker sweeping the region a few days
  behind you. POIs it passes are looted/burned (worse rewards). Lingering =
  fighting hunter-killer patrols with no plunder worth taking.
- **Hurricane season:** a storm front that closes the region's *rear* exits
  and eventually the region itself. The Hunt pushes you *forward*, the storm
  denies *backtracking*. Sometimes the right play is to sail *into* the
  storm's edge — hunters won't follow, but masts, morale, and men are at risk.

### 5.4 Islands and landings
Islands are the second exploration verb. A landing is a compact
choose-your-party expedition:
- Pick 2–4 crew for the shore party (their roles matter: a surgeon survives the
  fever swamp, a brute wins the cannibal standoff).
- 2–3 branching event beats with visible odds influenced by party + items.
- Rewards: buried caches, fresh water (morale), rare recruits, treasure-map
  fragments, occult curios.
- Risks: crew death, curses, delays (the Hunt gains a day).

### 5.5 Supplies, rum, and morale
- **Supplies** (food/water) tick down with distance sailed. Empty = starvation,
  morale collapse.
- **Rum** is a spendable morale valve: ration it after defeats, before
  boarding actions (courage bonus), or hoard it and risk grumbling.
- **Morale** is a run-level meter fed by victories, plunder shares, rum, and
  rest; drained by deaths, starvation, retreats, and cursed cargo. At low
  morale: work-slow penalties → desertions at port → **mutiny** (a boarding
  battle *on your own ship* — a run-ender you always saw coming three bad
  decisions ago).

---

## 6. The battle system

### 6.1 The screen (portrait)
- **Top half:** enemy ship, side-view cross-section. Decks and stations become
  visible as you gain intel (spyglass officer, or closing range).
- **Bottom half:** your ship, side-view cross-section, crew visible at
  stations.
- **Between them:** the water gap — a **range band track** and wind arrow.
- Floating hazards (powder barrels, debris, swimmers, sharks) live in the gap.

### 6.2 Range bands and helm stances (the positioning layer)
Combat happens across four range bands: **Long — Medium — Close — Grappled.**
You don't steer directly; you set a **helm stance** (one thumb tap):

| Stance | Effect |
|---|---|
| **Close In** | Move down one band over time. Faster with the weather gage. |
| **Hold Station** | Keep range. Best gunnery accuracy. |
| **Break Away** | Open range / attempt disengage (escape = FTL-style flee, needs intact sails). |
| **Come About** | Swap broadside — brings your *other* (loaded) battery to bear. Brief vulnerability while turning. |

**The weather gage** (being upwind) is a contested buff: +evasion, faster
stance changes, and your fire rafts/powder barrels drift *toward* the enemy.
Some enemies fight for it aggressively; sailing crew quality decides who wins
it.

Range gates everything: mortars only fire at Long/Medium, grapeshot only at
Close, boarding only when Grappled. **Choosing and forcing the range you want
is the core tactical skill** — a dimension FTL's static ships never had.

### 6.3 Weapons and ammunition — the situational toolkit
Weapon **mounts** are your loadout (found, bought, captured). **Ammo** is a
stockpile you spend per shot — so every trigger pull is an economic decision.

**Broadside cannon** fire one of four shot types (switch anytime; takes one
reload cycle):

| Shot | Great against | Useless against | Notes |
|---|---|---|---|
| **Round shot** | Hull, subsystems | — | The default. But sinking a prize means sinking its *loot*. |
| **Chain shot** | Sails, masts, rigging | Forts, sea beasts | Stops fleeing merchants, strips evasion, disables Break Away. |
| **Grapeshot** | Exposed crew, boarders massing on deck | Skeleton crews, armored gun decks, anything at range | Close band only. Softens a ship before you board. |
| **Heated shot** | Starting fires, powder magazines | Ghost-fog ships (fires gutter out) | Requires the galley furnace lit (a crewed station); a hit on *your* furnace deck while it's lit is very bad news. |

**Mounted weapons** (2–4 mounts depending on hull):

| Weapon | Role | Counterplay it demands |
|---|---|---|
| **Mortar** | Long-range arcing siege. The *only* thing that outranges a fort. | Scatters badly vs moving ships — dismast them first, then mortars can't miss. |
| **Harpoon ballista** | Anti-beast (cannons overpenetrate blubber for scratch damage; harpoons wound). Also tethers fleeing ships. | Short arms, slow reload. |
| **Swivel guns** | Auto-fire defensive station vs enemy boarders and swimmers. | Does nothing to hulls. Needs a crewman manning it. |
| **Powder barrels** | Your "bomb": set adrift, drifts on the wind into the enemy — *if* you hold the weather gage. Huge hull + fire damage. | Enemy sharpshooters can detonate it early; drifts back at you if you lose the gage. |
| **Fire raft** | Slow drifting area-denial; panics enemy crew (they fight the fire instead of shooting you). | Same wind rules. |
| **Blessed / silver shot** *(rare ammo)* | The answer to ghost ships and certain beasts. | Scarce; carrying occult ammo unsettles pious crew (morale). |

### 6.4 Your ship: decks, stations, crew
Side-view cross-section, 3 layers:

- **Weather deck (top):** helm, swivel guns, rigging access. Exposed to
  grapeshot and sharpshooters.
- **Gun deck (middle):** cannon batteries (port/starboard), mortar mount.
- **Hold (bottom):** powder magazine, bilge pumps, cargo, sickbay, galley.

Crew are dragged between stations (tap crewman → tap station; auto-pause on
selection). Stations scale with hands: more gunners = faster reloads, more
riggers = faster stance changes, surgeon in sickbay = wounded recover instead
of die. Crew have roles (Gunner, Rigger, Carpenter, Surgeon, Brute, Occultist)
granting station bonuses — your "crew races," but recruitable, mortal, and
opinionated (see morale).

### 6.5 Damage, fire, flooding, and repair
Three enemy-facing damage tracks — **Hull**, **Rigging/Sails**, **Crew** — and
the same three on you. No regenerating shield: damage stays until someone
fixes it, and *someone* is a crewman who is therefore not doing his job.

- **Hull breaches** below the waterline flood the hold *upward*. Bilge pumps
  (crewed) fight intake; carpenters patch breaches. Flooded stations stop
  working; flood past the gun deck and you're sinking on a timer.
- **Fire** climbs *decks upward*, damages stations, and terrifies crew. Fought
  by crew with buckets — or by **deliberately opening a breach** to flood the
  burning deck. Trading a flooding problem for a fire problem is peak
  desperation gameplay, and it rules.
- **Powder magazine** hit while fire is adjacent → catastrophic explosion.
  Yours *or theirs* — magazine-sniping with heated shot is a legitimate
  (risky, loot-destroying) win condition.
- **Masts** are hit-locations: lose one, lose stance speed; lose all, you're
  dead in the water (can't close, can't flee — pray your guns settle it).
- **The repair triangle:** every fight ends with a bill. Timber and canvas are
  finite; careening at a friendly cove fully repairs but costs *days* (the
  Hunt closes). "Do I fix the hull or buy chain shot?" is the FTL
  scrap-tension, made of wood and cloth.

### 6.6 Boarding
Grapple at Close band (contested by enemy axes-men cutting lines, your
swivel guns covering). When **Grappled**:
- Choose a boarding party; they fight deck-by-deck melee against enemy crew —
  auto-resolving brawls you influence by *where* you send them (take the helm
  to stop their maneuvers, the magazine to threaten scuttling, the gun deck to
  silence the broadside).
- Enemy can board *you* — leave the weather deck empty at your peril.
- Win by wiping crew or forcing **surrender** (see below). A captured ship
  intact = maximum plunder + option to press crew + rare hull mods.

### 6.7 Surrender, plunder, and the black flag
Enemy ships have a hidden **resolve** meter (crew losses, fires, captain
dead, your *reputation*). Broken resolve → they strike colors. Then choose:
- **Plunder & release** → +Merchant/Navy reputation stays tolerable.
- **Press crew & take everything** → better loot, reputation cost, morale
  risk (pressed men are mutiny fuel).
- **Burn it** → +Fear. Fear is a currency: high Fear makes future merchants
  surrender *early* (whole fights skipped), but ports raise prices and navy
  hunters get meaner. A build axis of its own.

### 6.8 Pause and touch UI
- **Pause is free and unlimited** — tapping any crewman, weapon, or the ammo
  drawer auto-pauses. A big thumb-side ⏸/▶ toggles.
- While paused: queue crew moves, stance change, ammo switches, and targeting
  (tap enemy deck/station to target — larger tap zones at closer range).
- One-handed play target: all combat inputs reachable in the bottom 60% of the
  screen; enemy targeting is the only top-screen touch.
- No timing-execution demands: skill is decisions, not reflexes. (Tunable
  "auto-pause on: breach / fire / boarders / weapon ready" settings, FTL-style.)

---

## 7. Enemy design — the reason weapons matter

Each enemy is a puzzle with 2+ valid solutions and 1+ trap solution.

| Enemy | The puzzle | Good answers | Trap |
|---|---|---|---|
| **Merchant brig** | It runs. Sinking it wastes the loot. | Chain shot the sails; harpoon tether; high Fear = instant surrender | Round shot (your prize is on the seafloor) |
| **Navy sloop** | Fast, upwind knife-fighter; wins the gage constantly | Grapeshot the exposed crew; swivels + board it | Mortars (never hits), stern chase (it's faster) |
| **Navy frigate** | Out-guns you badly at Medium | Dismast at Long with luck, or rush to Grapple before the third broadside; magazine-snipe with heated shot | Slugging it out at Medium (you lose the math) |
| **Coastal fort** | Stationary, huge guns, outranges cannon | Mortars from Long; or night event to cut out the harbor prize without a fight | Closing in (murder) |
| **Pirate hunter** | Mirror of you: boards, burns, chases the gage | Deny grapple (axes + swivels), fight the wind, fire rafts | Letting them pick the range |
| **Ghost ship** | Grapeshot passes through crew; fires gutter in its fog | Blessed shot; board with the Occultist; flee (no shame) | Heated shot, grapeshot (nothing happens — a lesson that costs a hull) |
| **Leviathan / kraken** | No hull; cannons overpenetrate; grabs crew off the deck | Harpoons; grapeshot the tentacles *on your own deck*; feed it a powder barrel | Boarding (there is nothing to stand on), fleeing downwind (it's faster underwater) |
| **Fire ship** | A suicide bomb under sail | Dismast at Long *fast*, or hard Break Away with the gage | Grapeshot/boarding (it's already lit) |

Regional escalation re-asks the questions: region 1 teaches chain-vs-runner,
region 3 fields sloop+frigate *pairs* (who to dismast first?), region 5
mixes occult and navy in the same fight.

## 8. Playstyles / builds (emergent, not classes)

- **The Boarder:** brutes, rum, grapples, swivel cover. Wins intact prizes,
  starves without crew bodies.
- **The Stand-off Gunner:** chain → dismast → mortar execution. Ammo-hungry;
  helpless if forced to Close.
- **The Arsonist:** heated shot, fire rafts, Fear stacking. Rich in
  surrenders, hated in every port.
- **The Ghost:** weather-gage sailing, evasion, powder barrels set adrift,
  picks fights only on treasure intel. Exploration-maximalist.
- **The Dread Pirate:** Fear economy end-state — most fights end before the
  first broadside. Getting there is the hard part.

Ship hulls + captains (meta-unlocks) *bias* toward styles without locking
them, exactly like FTL's ships: the whaler starts with harpoons and a rendering
furnace; the smuggler's xebec is fast but thin-skinned; the cursed galleon
starts feared — and haunted.

## 9. Run structure and difficulty

- **Five regions:** The Shallows (tutorial-by-death) → Merchant Lanes → The
  Navy Cordon → The Drowned Isles (occult) → The Maelstrom Approach.
- **Endgame:** the treasure is real and guarded — a final multi-phase fight
  vs the Admiralty flagship *at anchor inside a storm*, with a choice mid-fight
  that decides which of two endings (and two unlock tracks) you get.
- **Difficulty philosophy (the FTL curve):** brutally fair. Fixed rules,
  readable tells (a frigate *shows* its heated-shot furnace smoke two reloads
  early), and an economy that punishes greed. Target win rates: new player
  <5%, 20-run veteran ~40%, on Normal. Easy (more loot drops) and Hard
  (the Hunt starts closer) at launch.
- **Death screen** always shows cause-of-death chain ("Mutiny ← morale ← 
  starved ← overreached into region 3 with 4 supplies") — the game teaches at
  the moment of maximum attention.

## 10. Meta-progression (unlocks, never power)

- **New hulls** (6 at launch target) and **captains** (paired, FTL-style, via
  in-run achievement quests: *win a fight without firing a gun* unlocks the
  Dread Pirate's flag, etc.)
- **The Logbook:** bestiary + event codex, filled by encountering things.
  Pure knowledge, which in this genre *is* power.
- **No stat upgrades between runs.** Run 1 and run 100 play by identical
  rules. (Non-negotiable pillar; it's why FTL stays sharp.)

## 11. Economy summary

Five currencies, each with one job: **Gold** (buy), **Supplies** (move),
**Timber/Canvas** (repair), **Ammo stockpiles** (fight), **Rum** (feelings).
Reputation (Navy / Merchants / Brethren) and **Fear** are slower dials that
reprice everything else. Design rule: every windfall must pose a spending
dilemma; if the player can afford everything, the region was tuned too rich.

## 12. Godot technical plan

- **Godot 4.x, 2D, portrait 1080×1920** (safe-area aware). GDScript.
- **Scene architecture:**
  - `Run` (autoload `RunState`): chart scene, POI graph, Hunt/storm timers.
  - `Battle`: two `ShipView` scenes (data-driven from `ShipDef`), a
    `RangeTrack`, `WindSystem`, and a command layer that's 100% pause-safe
    (all orders are queued intents; simulation ticks consume them).
  - `Event` / `Landing` / `Port`: one data-driven dialog-tree scene.
- **Data-driven content:** ships, weapons, ammo, crew roles, events, and
  regions as Godot `Resource` (`.tres`) files — designers (and future Claude
  sessions) add content without touching code. Mirrors how `spriteskit`
  treats skits as pure data.
- **Simulation determinism:** battle sim ticks at fixed 10 Hz decoupled from
  rendering — makes pause trivial, replays/balancing harnesses possible, and
  mid-battle save/resume exact.
- **Save system:** serialize `RunState` + battle sim state every tick batch;
  resume-anywhere is a launch requirement, not a feature.
- **Balancing harness:** headless Godot script that auto-fights AI-vs-AI
  battles in bulk and prints win/TTK tables per matchup — tune the enemy
  table in §7 with data.
- **Ports:** iOS + Android export templates; no network features at v1.

## 13. Art direction & FAL asset plan

**Style target:** painted storybook-meets-woodcut — inky linework, limited
palette per region (Shallows = turquoise/sand, Drowned Isles = bile-green/
black), paper-grain texture. Deliberately *not* FTL's clean pixel art.

Asset manifest for FAL generation (all with consistent style prompt + seed):
1. **Ship cross-sections** — each hull needs: exterior side view, 3-deck
   interior cutaway, damage-state overlays (breach, fire, flood), sail states.
2. **Crew sprites** — 6 roles × idle/work/fight/dead, small (they're ~80 px).
3. **Enemy set** — the §7 table, same cutaway treatment; monsters need
   part-based rigs (tentacles as separate sprites).
4. **Chart art** — parchment sea tiles, POI icons, wind/current ribbons,
   storm front, the Hunt's fleet marker.
5. **Event illustrations** — ~80 half-screen paintings (the FTL text-event
   feel, but illustrated; FAL makes this affordable).
6. **UI kit** — wood/brass/rope frames, ammo drawer icons, stance wheel.
7. **VFX sheets** — cannon smoke, splashes, fire, ghost-fog.
8. **Portraits** — captains + notable recruits, ~40.

## 14. v1 content scope

| Content | Launch target |
|---|---|
| Regions | 5 (+ endgame) |
| Enemy ships / monsters / forts | 12 / 3 / 2 |
| Weapon mounts / ammo types | 8 / 6 |
| Text events + landings | 80 |
| Player hulls / captains | 3 at launch, 6 unlockable |
| Crew roles | 6 |
| Run length / difficulty modes | 30–60 min / Easy, Normal, Hard |

## 15. Milestones

- **M1 — Combat grey-box (the whole bet):** one fight, grey rectangles, full
  range-band + ammo + crew-station + fire/flood loop, on a phone. *If this
  isn't fun with rectangles, stop and redesign here.*
- **M2 — Strategic loop:** chart, wind, Hunt/storm pressure, ports, events;
  one full region playable.
- **M3 — Vertical slice:** region 1 with real FAL art + 3 enemy types + save/
  resume + death screen.
- **M4 — Full run:** all 5 regions, endgame, 3 hulls, balancing harness tuned.
- **M5 — Ship it:** meta-unlocks, Logbook, difficulty modes, store builds.

## 16. Open questions (for the next session)

1. **Tone:** grounded Golden-Age piracy with occult creeping in region 4+ (as
   written), or supernatural from minute one?
2. **Crew attachment:** named crew with tiny persistent quirks (heavier
   mutiny/story systems), or lighter FTL-style interchangeability?
3. **Combat camera:** committed side-view cutaways as designed — but worth a
   paper-prototype check against a top-down deck view before M1?
4. **Fear system scope:** launch feature or v1.1? It's the most novel economy
   but also the biggest tuning risk.
5. **Monetization:** premium ($4.99, FTL-style) vs free demo region + unlock.
   The design assumes **premium, no IAP** — permadeath roguelikes and IAP
   poison each other.
