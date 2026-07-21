# Asset tools

## generate_assets.py

Generates placeholder-replacement art via FAL. **Run it locally** — the cloud
build environment can't reach the FAL API (network policy), so this script is
built to run on your own machine.

```bash
export FAL_KEY="your-id:your-secret"     # from fal.ai dashboard; never commit
python3 tools/generate_assets.py --list  # see what it makes
python3 tools/generate_assets.py         # generate everything
python3 tools/generate_assets.py ships   # just one group
```

- No dependencies — pure Python 3 standard library.
- Output: `pirate-game/assets/<group>/<name>.png` (gitignored — treat FAL as
  the source of truth, regenerate rather than commit binaries).
- Already-generated files are skipped; delete a PNG to re-roll it.
- Style, model, and a fixed seed live at the top of the script so a whole set
  stays visually coherent. Start with `flux/schnell` (fast/cheap); switch the
  `MODEL` constant to `flux/dev` once the look is locked.

This is a deliberately small M1 set (4 ships, 2 seas, 2 UI textures) so a full
run costs pennies. Wiring these into the grey-box UI comes after the art
direction feels right — see GAME_DESIGN.md §13 for the full asset manifest.

## Security

The FAL key is read from the `FAL_KEY` environment variable only. It is never
written to disk or committed. If you ever paste a key somewhere it could be
logged, rotate it in the FAL dashboard.
