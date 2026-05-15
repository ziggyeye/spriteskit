# spriteskit

A data-driven **Remotion** engine for producing short, TikTok-style **3D-character**
skits. Skits are pure data — a background, a cast, a timeline of actions. The
generic renderer turns them into 1080×1920 portrait video at 30 fps.

Built on Remotion + three.js + `@react-three/fiber`, with rigged FBX characters
from the Cozy Cafe asset pack and ElevenLabs voice/SFX generation.

## Quick start

```bash
npm install            # installs Remotion + React + three.js (~2 min first time)
npm start              # opens Remotion Studio — live preview in your browser
npm run build          # renders AiTakingMyJob → out/ai-taking-my-job.mp4
```

Output: **1080 × 1920** (TikTok portrait), **30 fps**, variable duration per skit.

> The first render downloads Chrome Headless Shell (~150 MB). It's cached.

## Project layout

```
spriteskit/
├── public/
│   ├── models/                       Character_Talking.fbx + texture swatches
│   ├── sprites/eyes/                 16 eye sprites (Default, Blink, Hearts, …)
│   ├── sprites/lips_simple/          20 simplified mouth visemes + emotions
│   ├── sprites/lips/                 30 detailed mouth shapes
│   ├── music/                        humming SFX, background tracks
│   └── voices/                       generated narrator MP3s + viseme JSONs
├── src/
│   ├── index.ts                      Remotion entry
│   ├── Root.tsx                      registers every skit as a Composition
│   ├── components/
│   │   ├── Background.tsx            animated gradient + sparkles
│   │   ├── Character3D.tsx           FBX loader, per-actor materials, animation
│   │   ├── SpeechBubble.tsx          pop-in bubble w/ typewriter + tail
│   │   └── PopupText.tsx             big TikTok meme caption
│   ├── services/
│   │   ├── voiceService.ts           ElevenLabs voice generation w/ viseme alignment
│   │   └── voiceIds.ts               named voice constants
│   ├── scripts/
│   │   ├── generateVoices.ts         pre-render skit narration → MP3 + viseme JSON
│   │   └── generateHumming.ts        ElevenLabs Sound Effects → ambient hums
│   └── skits/
│       ├── types.ts                  Skit schema — start here when authoring
│       ├── assets.ts                 typed catalogues (clip names, eye/mouth sprites)
│       ├── eyeSequences.ts           helpers: eyeBlinkAt / eyeStarryLoopAt / …
│       ├── legacyOutfits.ts          maps legacy sprite IDs to 3D outfits
│       ├── withVisemes.ts            attaches generated viseme tracks at runtime
│       ├── Skit.tsx                  interprets a Skit object into video
│       └── scripts/
│           ├── aiTakingMyJob.ts
│           ├── aiTakingMyJobPt2.ts
│           └── lastSongRemembered.ts (cinematic 75s example)
├── AGENTS.md                         architecture reference for AI agents
├── LEARNINGS.md                      gotchas + non-obvious things discovered
└── package.json
```

## Authoring a new skit

A Skit is just data — you write no rendering code.

1. Create `src/skits/scripts/myNewSkit.ts`, exporting a `Skit`.
2. Add it to the `skits` array in `src/Root.tsx`.
3. `npm start` to preview, `npx remotion render MyNewSkit out/mine.mp4` to render.

Minimal example:

```ts
import type { Skit } from '../types';

export const myNewSkit: Skit = {
  id: 'MyNewSkit',
  title: 'My new skit',
  durationInSeconds: 15,
  background: { kind: 'gradient', colors: ['#222', '#08f'] },
  actors: [
    {
      id: 'dave',
      sprite: 'dave',
      name: 'DAVE',
      start: { x: 320, y: 1500 },
      facing: 'down',
      outfit: { top: 'Clothes_Top_Tshirt', bottom: 'Clothes_Legs_Pants_Long', hair: 'Hair_Short' },
    },
    {
      id: 'alex',
      sprite: 'alex',
      name: 'ALEX',
      start: { x: 900, y: 1500 },
      facing: 'down',
      outfit: {
        top: 'Clothes_Top_Tshirt',
        bottom: 'Clothes_Legs_Pants_Long',
        hair: 'Hair_Ponytail',
        skinTone: 'Skintone_4',
        hairColor: 'Haircolour_03',
        topColor: 'Cushion_Orange',
      },
    },
  ],
  timeline: [
    { type: 'speak', actorId: 'dave', text: 'hi alex', startSec: 1, endSec: 3 },
    { type: 'speak', actorId: 'alex', text: 'hi dave', startSec: 3, endSec: 5 },
  ],
};
```

## Coordinate system

Skits author in **2D pixel space** (1080 × 1920). The renderer projects each
`(x, y)` onto a 3D plane and frames it with a perspective camera:

- A character's `(x, y)` is **center-bottom** — where the feet land.
- A character rendered at full scale is **~700 pixels tall** (constant
  `CHARACTER_HEIGHT_PX` in [Skit.tsx](src/skits/Skit.tsx)) — speech bubbles auto-anchor above the head.
- Minimum spacing between two adult actors so they don't intersect: **~560 px center-to-center**;
  comfortable: ~720 px. Less and the meshes overlap.
- Times are always in **seconds** (not frames). The renderer converts via `skit.fps`.

If you need cinematic camera control, see [Skit.tsx](src/skits/Skit.tsx) for
`PIXELS_PER_UNIT` and the world-coordinate math in the `camera` action.

## Timeline action reference

All times in **seconds**. All positions in composition pixels.

| Action       | What it does                                                                       |
| ------------ | ---------------------------------------------------------------------------------- |
| `walk`       | Move actor from current position to `to` over time. Auto-plays `Walk_Loop`.        |
| `face`       | Snap an actor's facing direction at a given time.                                  |
| `speak`      | Pop-in speech bubble + ElevenLabs audio + lip-sync. Hidden actors get audio only.  |
| `animate`    | Play a named FBX clip on an actor for a window. Use `ClipName` for autocomplete.   |
| `eyes`       | Swap an actor's eye sprite (Default, Hearts, Sad Cry, Starry, …).                  |
| `tint`       | Apply a rim-glow emissive colour to an actor's body (e.g. warm amber on a reveal). |
| `fade`       | Tween an actor's opacity 0→1 or 1→0 over a window. Use for dissolves.              |
| `emote`      | Float an emoji above an actor's head.                                              |
| `camera`     | Tween camera position/lookAt/fov (+ optional `up` for Dutch tilt) between states.  |
| `sfx`        | Schedule a sound effect / music clip on the timeline. Supports `loop`.             |
| `popupText`  | Big springy TikTok meme caption.                                                   |
| `shake`      | Camera shake.                                                                      |
| `flash`      | Full-frame colour overlay (good for transitions / impact frames).                  |

See [src/skits/types.ts](src/skits/types.ts) for the full schema including all optional fields.

## Eye sprite sequences

Eye sprites can be sequenced for animation. Helpers in [eyeSequences.ts](src/skits/eyeSequences.ts):

```ts
import { eyeBlinkAt, eyeStarryLoopAt, eyeHeartsPulseAt } from '../eyeSequences';

timeline: [
  ...eyeBlinkAt('dave', 12.0),              // single ~480ms blink at 12s
  ...eyeStarryLoopAt('alex', 8.0, 4.0),     // 4s of Starry1↔Starry2 sparkle
  ...eyeHeartsPulseAt('alex', 18.0, 6.0),   // 6s of heart-pulse loop
]
```

The asset pack's intended sequences:

- **Blink:** Default → Blink1 → Blink2 → Blink3 → Blink2 → Blink1 → Default (symmetric, ~80ms/frame)
- **Starry:** Starry1 ↔ Starry2 alternation (~150ms/frame for soft sparkle)
- **Hearts:** Hearts1 → 2 → 3 → 4 → 3 → 2 → 1 (heartbeat pulse, ~120ms/frame)

## Voiced skits + lip-sync

ElevenLabs voice generation + viseme-driven mouth animation:

1. Author speak actions with `voiceId: VOICE_IDS.<name>` (see [voiceIds.ts](src/services/voiceIds.ts)).
2. Run `npm run generate-voices` — calls ElevenLabs `/v1/text-to-speech/.../with-timestamps`,
   writes MP3s + per-line viseme tracks to `public/voices/`, and emits a
   `{skitName}.visemes.ts` module per skit.
3. In `Root.tsx`, wrap the skit with `withVisemes(skit, visemes)` — auto-attaches
   `audioUrl` + viseme tracks to each speak action.
4. The renderer drives `Body_Mouth` material textures per frame to lip-sync.

Hidden actors (e.g. `narrator`) get audio but no speech bubble — useful for VO.

## Humming / ambient SFX

Generate ambient SFX via the ElevenLabs Sound Effects API:

```bash
npm run generate-humming  # edits src/scripts/generateHumming.ts to add/change clips
```

Wire them into the skit with the `sfx` action:

```ts
{ type: 'sfx', audioUrl: staticFile('music/hum_elder.mp3'),
  startSec: 4.5, endSec: 68, volume: 8.0,
  loop: true, loopClipSec: 12 },
```

Note: ElevenLabs SFX comes out much quieter than its voice TTS. Use `volume > 1`
to amplify (the renderer enables `allowAmplificationDuringRender` automatically
for sfx). If still soft, lower the narrator's volume on each speak action.

## 3D character rig

Base model: `public/models/Character_Talking.fbx` (Lips-Pack). Mesh
variety comes from four parts FBXs (`Hair_All.fbx`, `Clothes_All.fbx`,
`Accessories_All.fbx`, `Items_All.fbx`) whose meshes are rebound onto
the base skeleton at startup via `loadParts()`. See [AGENTS.md](AGENTS.md)
for the full inventory:

- **17 animations** (`Walk_Loop`, `React_Stand_Discussion_1/2`, `React_Handshake`, …)
- **Outfit slots** (all available on the active rig):
  - 8 tops, 4 bottoms, 2 aprons, 17 hair styles, 2 beards
  - 7 head accessories (glasses, 5 headphone colours, headband)
  - 17 held props (tray, cupcakes, coffees, milkshakes, cup/plate sets)
- **Per-actor texture overrides**: skinTone (6 options), hairColor (16),
  topColor / legColor / shoesColor / apronColor (21 swatches each)
- **Face submeshes**: `Body_Eye_L`, `Body_Eye_R`, `Body_Mouth` — independently swappable per frame
  - 16 eye sprites • 30 mouth shapes (20 ARPAbet-mapped phonemes + 9 emotion mouths)
- **8-direction facing**: `down` / `down-left` / `down-right` / `left` /
  `right` / `up-left` / `up-right` / `up`. Use diagonals for dialogue.

## Brainstorm subagents

Read-only research specialists for skit ideation, defined under
[.claude/agents/](.claude/agents/). Spawn via the Agent tool with `subagent_type`:

- `tiktok-virality-strategist` — concept generation + virality verdicts.
- `skit-asset-utilizer` — concept → asset-level blocking (clips, eyes, tints, cameras).
- `cinematic-shot-designer` — beat list → camera action JSON.
- `skit-script-editor` — dialogue tightening for voiced skits.

Typical brainstorm: divergent phase runs strategist + asset-utilizer in parallel,
convergent phase chains shot-designer then script-editor.

## Included skits

- **AiTakingMyJob** (30s) — Dave panics about AI replacing coworkers; Alex reveals *she's* the AI.
- **AiTakingMyJobPt2** (30s) — Dave seeks reassurance; everyone's an AI except him.
- **LastSongRemembered** (75s) — earnest cinematic piece. An elder hums a tune,
  a child learns it, the elder dissolves, the child carries the song forward.
  Showcases: voiced narration, looped humming SFX, dissolve via `fade`, camera
  push-ins and Dutch tilts, per-actor colour overrides, eye-sprite sequences.

Render any composition by id:

```bash
npx remotion render <CompositionId> out/<name>.mp4
```

## Requirements

- Node 18+ (tested on Node 22).
- An internet connection on first render (for the one-time Chrome Headless Shell download).
- `ELEVENLABS_API_KEY` in `.env` if you want to use `generate-voices` or `generate-humming`.

## Further reading

- [AGENTS.md](AGENTS.md) — full engine architecture, asset catalogue, coordinate spaces.
- [LEARNINGS.md](LEARNINGS.md) — gotchas + non-obvious things discovered during development.
