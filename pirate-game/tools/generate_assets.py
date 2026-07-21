#!/usr/bin/env python3
"""Generate Dead Reckoning art via FAL, locally.

This environment's network policy blocks FAL, so asset generation runs on
YOUR machine. Usage:

    export FAL_KEY="xxxxxxxx:yyyyyyyy"        # never commit this
    python3 tools/generate_assets.py           # all assets
    python3 tools/generate_assets.py ships      # one group
    python3 tools/generate_assets.py --list     # show groups, generate nothing

Outputs land in pirate-game/assets/<group>/<name>.png (gitignored by default).
Only the Python standard library is used — no pip install required.

Model + style follow GAME_DESIGN.md §13: painted storybook-meets-woodcut,
inky linework, paper grain, a fixed seed so a set stays visually coherent.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

# flux/schnell is fast and cheap — right for iterating on a look. Swap to
# "fal-ai/flux/dev" for higher fidelity once the style is dialed in.
MODEL = "fal-ai/flux/schnell"
QUEUE = "https://queue.fal.run"
SEED = 20260721  # fixed so re-runs and sibling assets stay consistent

STYLE = (
    "painted storybook illustration crossed with old woodcut engraving, "
    "inky hand-drawn linework, limited muted palette, visible paper grain, "
    "dramatic golden-age-of-piracy mood, no text, no watermark, "
    "clean flat background for a game asset"
)

OUT = Path(__file__).resolve().parent.parent / "assets"

# Each asset: (filename, size, prompt). Sizes are FAL enum strings.
# This is a focused M1 set — the three enemies, the player ship, and a sea
# backdrop — not the full 8-category manifest. Add entries freely.
GROUPS = {
    "ships": [
        ("player_reckless_cutaway", "portrait_16_9",
         "side-view cross-section cutaway of a small three-masted pirate "
         "brigantine showing three interior decks stacked vertically — weather "
         "deck, gun deck with cannon, and hold with barrels — weathered dark "
         "timber, patched sails, a black flag"),
        ("enemy_merchant_brig", "portrait_16_9",
         "side-view cutaway of a fat slow merchant sailing brig low in the "
         "water heavy with cargo crates, plain honest lines, billowing white "
         "sails, no guns to speak of"),
        ("enemy_navy_sloop", "portrait_16_9",
         "side-view cutaway of a fast sleek royal navy sloop-of-war, crisp "
         "white and blue paint, red-coated marines on deck, boarding grapnels, "
         "taut clean rigging"),
        ("enemy_navy_frigate", "portrait_16_9",
         "side-view cutaway of a large menacing royal navy frigate bristling "
         "with a full gun deck of cannon, smoke curling from a galley furnace "
         "chimney, imposing and heavy"),
    ],
    "backgrounds": [
        ("sea_open", "landscape_16_9",
         "empty open sea horizon under a dramatic cloudy sky, painterly, "
         "muted teal and grey, gentle swell, no ships"),
        ("sea_storm", "landscape_16_9",
         "stormy sea horizon, dark bruised clouds, whitecaps, rain squall in "
         "the distance, ominous, no ships"),
    ],
    "ui": [
        ("wood_panel", "square",
         "seamless weathered ship deck wood plank texture with brass rivets, "
         "top-down, for a game UI panel background"),
        ("parchment", "square",
         "aged parchment paper texture, water-stained edges, empty, for a "
         "nautical chart UI background"),
    ],
}


def fal_key() -> str:
    key = os.environ.get("FAL_KEY", "").strip()
    if not key:
        sys.exit("FAL_KEY is not set. Run:  export FAL_KEY=\"id:secret\"")
    return key


def _post(url: str, key: str, payload: dict) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Key {key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def _get(url: str, key: str) -> dict:
    req = urllib.request.Request(url, headers={"Authorization": f"Key {key}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def generate(name: str, size: str, prompt: str, key: str, dest: Path) -> None:
    full_prompt = f"{prompt}. {STYLE}"
    submit = _post(f"{QUEUE}/{MODEL}", key, {
        "prompt": full_prompt,
        "image_size": size,
        "num_images": 1,
        "seed": SEED,
        "enable_safety_checker": True,
    })
    status_url = submit["status_url"]
    result_url = submit["response_url"]
    # Poll the queue until the render finishes.
    for _ in range(120):
        st = _get(status_url, key)
        state = st.get("status")
        if state == "COMPLETED":
            break
        if state in ("FAILED", "ERROR"):
            raise RuntimeError(f"FAL job {state}: {st}")
        time.sleep(1.5)
    else:
        raise TimeoutError("FAL job did not finish in time")

    result = _get(result_url, key)
    img_url = result["images"][0]["url"]
    dest.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(img_url, dest)
    print(f"  saved {dest.relative_to(OUT.parent)}")


def main() -> None:
    args = [a for a in sys.argv[1:]]
    if "--list" in args:
        for g, items in GROUPS.items():
            print(f"{g}: {', '.join(n for n, _, _ in items)}")
        return
    wanted = args or list(GROUPS.keys())
    key = fal_key()
    for group in wanted:
        if group not in GROUPS:
            print(f"skip unknown group '{group}' (see --list)")
            continue
        print(f"[{group}]")
        for name, size, prompt in GROUPS[group]:
            dest = OUT / group / f"{name}.png"
            if dest.exists():
                print(f"  {dest.name} exists, skipping")
                continue
            try:
                generate(name, size, prompt, key, dest)
            except (urllib.error.URLError, RuntimeError, TimeoutError) as e:
                print(f"  FAILED {name}: {e}")
    print("done.")


if __name__ == "__main__":
    main()
