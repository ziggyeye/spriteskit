# spriteskit

A small, data-driven **Remotion** engine for making TikTok-style sprite-character
skits. Ships with one 30-second skit ("AI Taking My Job"); adding a new skit
means writing one data file and one line in `Root.tsx` — no render code.

## Quick start

```bash
npm install            # installs Remotion + React (~1 min, one-time)
npm start              # opens Remotion Studio — live preview in your browser
npm run build          # renders AiTakingMyJob → out/ai-taking-my-job.mp4
```

Output: **1080 × 1920** (TikTok portrait), **30 fps**, 30 seconds.

> The first render downloads Chrome Headless Shell (~150 MB). It's cached, so
> subsequent renders are fast.

## Project layout

```
spriteskit/
├── public/                          static files served to the video runtime
│   ├── Character_024_Idle.png       male sprite sheet (288×288, 4×4 frames)
│   └── Character_035_Idle.png       female sprite sheet
├── src/
│   ├── index.ts                     Remotion entry
│   ├── Root.tsx                     registers every skit as a Composition
│   ├── components/
│   │   ├── Background.tsx           animated gradient + sparkles
│   │   ├── Character.tsx            sprite-sheet animator, 4-dir idle
│   │   ├── SpeechBubble.tsx         pop-in bubble w/ typewriter + tail
│   │   └── PopupText.tsx            big TikTok meme caption
│   └── skits/
│       ├── types.ts                 Skit schema — start here when authoring
│       ├── Skit.tsx                 interprets a Skit object into video
│       └── scripts/
│           └── aiTakingMyJob.ts     the first skit
├── package.json
├── tsconfig.json
└── remotion.config.ts
```

## Sprite sheets

Each sheet is **288 × 288**, a 4 × 4 grid of **72 × 72** frames.

Row order:

1. facing down
2. facing left
3. facing right
4. facing up

Each row is a 4-frame idle loop, auto-played by `Character.tsx`.

**To add a new character:**

1. Drop the PNG in `public/`.
2. Extend `SPRITE_FILES` in `src/components/Character.tsx`.
3. Add the id to the `SpriteId` union in `src/skits/types.ts`.

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
    { id: 'dave', sprite: 'male',   name: 'DAVE', start: { x: 300, y: 1500 }, facing: 'right' },
    { id: 'alex', sprite: 'female', name: 'ALEX', start: { x: 780, y: 1500 }, facing: 'left'  },
  ],
  timeline: [
    { type: 'speak', actorId: 'dave', text: 'hi alex', startSec: 1, endSec: 3 },
    { type: 'speak', actorId: 'alex', text: 'hi dave', startSec: 3, endSec: 5 },
  ],
};
```

## Timeline action reference

All times in **seconds**. All positions in composition pixels (1080 × 1920 by
default). A character's `(x, y)` is **center-bottom** — where the feet land.

| Action       | What it does                                                        |
| ------------ | ------------------------------------------------------------------- |
| `walk`       | Move actor from current position to `to` over time. Auto-faces dx.  |
| `face`       | Snap an actor's facing direction at a given time.                   |
| `speak`      | Pop-in speech bubble with typewriter reveal. Supports emoji + tint. |
| `emote`      | Float an emoji above an actor's head.                               |
| `popupText`  | TikTok-style huge caption that springs in and wobbles.              |
| `shake`      | Camera shake for comedic emphasis.                                  |
| `flash`      | Full-frame color flash (good for reveals).                          |
| `tint`       | Glow-tint an actor ("they were evil the whole time").               |

See `src/skits/types.ts` for the full schema including all optional fields.

## The included skit

**AiTakingMyJob** (30s) — Dave runs in panicking, Alex walks in calmly, Dave
lists who's been replaced by AI, Alex reveals *she's* been the AI all along.
Plot-twist finale with camera shake and a giant caption.

```bash
npm run build
# → out/ai-taking-my-job.mp4
```

Render any other composition by id:

```bash
npx remotion render <CompositionId> out/<name>.mp4
```

## Requirements

- Node 18+ (tested on Node 22)
- An internet connection on first render (for the one-time Chrome Headless Shell download)
