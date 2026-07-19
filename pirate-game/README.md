# Dead Reckoning (working title)

An FTL-inspired pirate exploration roguelike for mobile. Godot 4, portrait,
real-time combat with tactical pause, 30–60 minute permadeath runs.

**Start here:** [GAME_DESIGN.md](GAME_DESIGN.md)

## Status

M1 in progress — the design document is complete and the grey-box combat
prototype lives in [`godot/`](godot/) (Godot 4.3+, see its README to run it).
Three enemy engagements, full range-band/ammo/crew/fire-flood/boarding loop.

## Note on this folder

This is a **standalone project** that happens to live in this repository for
convenience. It shares no code or assets with the `spriteskit/` Remotion
engine. When it grows a Godot project, it can be split into its own
repository with full history via `git subtree split --prefix=pirate-game`.

Planned layout:

```
pirate-game/
├── GAME_DESIGN.md     full design document
├── godot/             Godot 4 project — M1 combat grey-box
└── assets/            FAL-generated art (M3+, not yet created)
```
