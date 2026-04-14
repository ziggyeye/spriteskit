---
name: new-skit
description: Create a new SpritesKit TikTok skit from a concept or prompt. Use when the user wants to make a new skit, scene, or video.
---

# Create a New SpritesKit Skit

The user wants to create a new skit. Their concept/prompt: **$ARGUMENTS**

## Project Context

This is a Remotion-based TikTok skit engine. Skits are pure data objects — no rendering code needed. The engine handles animation, speech bubbles, typewriter text, spring physics, and audio sync automatically.

- Composition: 1080x1920 (portrait), 30 fps
- Sprites: `'male'` or `'female'`
- All times in seconds
- Character position `(x, y)` = center-x, feet-baseline-y
- Common floor baseline: `const FLOOR = 1500`

## Steps

### 1. Write the Script

Create `spriteskit/src/skits/scripts/<camelCaseName>.ts` with a `Skit` export.

**Imports:**
```ts
import { staticFile } from 'remotion';
import type { Skit } from '../types';
import { VOICE_IDS } from '../../services/voiceIds';
```

**Skit shape:**
```ts
export const mySkitName: Skit = {
  id: 'MySkitName',            // PascalCase — becomes the Remotion composition ID
  title: 'My Skit Name',
  durationInSeconds: 30,       // 15–60s typical for TikTok
  fps: 30,
  width: 1080,
  height: 1920,
  background: { kind: 'gradient', colors: ['#ff6ec7', '#7873f5'] },
  // musicUrl: staticFile('music/funk.mp3'),
  // musicVolume: 0.4,
  actors: [ /* ... */ ],
  timeline: [ /* ... */ ],
};
```

**Actor definition:**
```ts
{
  id: string,
  sprite: 'male' | 'female',
  name?: string,            // shown on speech bubble badge
  start: { x: number, y: number },
  facing?: 'down' | 'left' | 'right' | 'up',
  scale?: number,           // 1 = default, 1.2 = 20% bigger
  hidden?: boolean,         // true = starts offscreen, walks in
}
```

**Available timeline actions:**

| Type | Key Fields | Notes |
|------|-----------|-------|
| `walk` | `actorId, to: {x,y}, startSec, endSec, facing?` | Moves actor; auto-infers facing from direction |
| `face` | `actorId, direction, atSec` | Snap facing direction |
| `speak` | `actorId, text, startSec, endSec, emoji?, voiceId?, audioUrl?, side?, tint?` | Speech bubble + optional voice audio |
| `emote` | `actorId, emoji, startSec, endSec` | Floating emoji above head |
| `popupText` | `text, startSec, endSec, y?, color?, rotate?, size?` | Big TikTok-style caption (y: 0=top, 1=bottom) |
| `shake` | `startSec, endSec, intensity?` | Camera shake (default 20) |
| `flash` | `startSec, endSec, color?` | Full-screen flash (default white) |
| `tint` | `actorId, color, startSec, endSec` | Color glow on character |

**Available voices (use `VOICE_IDS.<name>`):**
- Male: adam, bill, brian, callum, charlie, chris, daniel, eric, george, harry, liam, roger, will
- Female: alice, bella, belle, ivy, jessica, laura, lily, lulu, matilda, sarah
- Neutral: river

Pick voices that match the character's personality. Always use male voices for male sprites and female voices for female sprites.

### 2. Register in Root.tsx

Add the import and push to the skits array in `spriteskit/src/Root.tsx`:
```ts
import { mySkitName } from './skits/scripts/mySkitName';
const skits: Skit[] = [aiTakingMyJob, mySkitName];
```

### 3. Generate Voices

For each `speak` action that has a `voiceId`, add a corresponding `audioUrl` using `staticFile()`. Then update `spriteskit/src/scripts/generateVoices.ts` to import the new skit and run:
```bash
npm run generate-voices
```
After generation, add the output filenames as `audioUrl: staticFile('voices/<hash>.mp3')` on each speak action.

### 4. Preview

```bash
npm start
```
Open the Remotion Studio and select the new composition to preview.

## Guidelines

- Start with a strong visual hook in the first 2–3 seconds (popupText or dramatic entrance)
- Keep dialogue punchy — short lines, not paragraphs
- Use emotes and popupText to add energy between dialogue beats
- End with a call-to-action ("follow for pt 2") or punchline
- Stagger speech bubbles so they don't overlap — only one actor should speak at a time
- Use `shake` + `flash` + `popupText` combos for dramatic moments
- Actors that enter from offscreen should use `hidden: true` with a `walk` action
- Leave ~0.2s gaps between speech actions for natural pacing
