# 🎤🎵 Voice & Music Integration Checklist

## Quick Setup (5 minutes)

### Step 1: ElevenLabs Voice Setup ✓ DONE
Your `.env` file already has `ELEVENLABS_API_KEY` set.

**What this enables:**
- Text-to-speech generation for character dialogue
- Multiple voice options (male, female, neutral)
- Automatic caching of voice files

### Step 2: Get Music from Pixabay 📥

1. Open https://pixabay.com/music
2. Search for mood/style:
   - Comedy skits: "funny", "upbeat", "quirky"
   - Dramatic reveals: "cinematic", "tension", "plot twist"
   - Calm intros: "ambient", "lo-fi", "chillhop"
3. Download MP3 files (all free, CC0 license)
4. Create folder: `public/music/`
5. Save files there (e.g., `public/music/funny-moment.mp3`)

**Recommended 30-second tracks:**
- "Comedy Moment" by (any creator with 30s version)
- "Retro Fun" (80s synth vibes)
- "Ambient Background"
- "Plot Twist" (dramatic)

### Step 3: Create Your First Skit with Voice+Music 🎬

Copy this template into `src/skits/scripts/myNewSkit.ts`:

```typescript
import type { Skit } from '../types';

const FLOOR = 1500;
const CENTER = 540;

export const myNewSkit: Skit = {
  id: 'MyNewSkit',
  title: 'My First Voice Skit',
  durationInSeconds: 15,
  background: { kind: 'solid', color: '#667eea' },
  
  // 🎵 Add background music
  musicUrl: '/music/funny-moment.mp3',
  musicVolume: 0.4,
  
  actors: [
    {
      id: 'char1',
      sprite: 'male',
      name: 'Alex',
      start: { x: CENTER, y: FLOOR },
    },
  ],
  
  timeline: [
    // 🎤 Add voice dialogue
    {
      type: 'speak',
      actorId: 'char1',
      text: 'Hello! This video has voice!',
      voiceId: 'IZSifFFbIucDmqV5ClJK', // Charlie voice
      startSec: 0,
      endSec: 3,
      emoji: '🎤',
    },
  ],
};
```

### Step 4: Register Your Skit 📋

Edit `src/Root.tsx`:

```typescript
import { myNewSkit } from './skits/scripts/myNewSkit';

export const Root = () => (
  <Composition
    id="MyNewSkit"
    component={SkitComp}
    durationInFrames={450} // 15 seconds * 30 fps
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ skit: myNewSkit }}
  />
);
```

### Step 5: Test & Render 🎬

```bash
# Preview in Remotion Studio
npm start

# Render your video
npm run render MyNewSkit out/my-skit.mp4
```

---

## Voice ID Cheat Sheet 🎤

### Popular Male Voices
| Name | ID | Style |
|------|----|----|
| Charlie | `IZSifFFbIucDmqV5ClJK` | Enthusiastic, energetic |
| Adam | `4ZDaoj2FNzJ0ejT0xNB3` | Warm, natural |
| Antoni | `ErXwobaYp0GQe50TxIAJ` | Professional, calm |
| Liam | `9gAHnUSQy59RI4zzn8y4` | Youthful, friendly |

### Popular Female Voices
| Name | ID | Style |
|------|----|----|
| Sarah | `EXAVITQu4vr4xnSDxMaL` | Clear, friendly |
| Gigi | `jBpfuIE2acCO8z3wKNLl` | Upbeat, youthful |
| Rachel | `21m00Tcm4ijLg7aMgO69` | Warm, expressive |
| Lily | `5q0chYQQje4E7z3f5HeV` | Smooth, natural |

Full list: See `src/services/voiceService.ts`

---

## Dialogue Types 📝

### 1. ElevenLabs Generated Voice (TTS)
```typescript
{
  type: 'speak',
  actorId: 'character1',
  text: 'Hello world!',
  voiceId: 'IZSifFFbIucDmqV5ClJK', // ← TTS will auto-generate
  startSec: 0,
  endSec: 3,
}
```

### 2. Pre-Recorded Audio
```typescript
{
  type: 'speak',
  actorId: 'character1',
  text: 'Using my own recording',
  audioUrl: '/voices/my-recording.mp3', // ← Your own MP3
  startSec: 0,
  endSec: 3,
}
```

### 3. No Voice
```typescript
{
  type: 'speak',
  actorId: 'character1',
  text: 'Silent dialogue',
  // No voiceId or audioUrl = text bubble only
  startSec: 0,
  endSec: 3,
}
```

---

## Music Tips 🎵

### Finding the Right Track
- Go to https://pixabay.com/music
- Filter: "Emotional" + "Upbeat" = comedy
- Filter: "Cinematic" + "Dark" = tension/drama
- Filter: "Chill" + "Lo-Fi" = relaxed intros

### Adding to Skit
```typescript
export const mySkitwithMusic: Skit = {
  // ... other config ...
  musicUrl: '/music/track-name.mp3',
  musicVolume: 0.4, // 0 = silent, 1 = full volume
  // Recommended: 0.3–0.5 so voice stands out
};
```

### File Organization
```
public/
├── music/
│   ├── funny-moment.mp3
│   ├── cinematic-drama.mp3
│   ├── ambient-chill.mp3
│   └── plot-twist.mp3
└── voices/
    ├── auto-generated-hashes.mp3
    └── custom-recordings.mp3
```

---

## Troubleshooting 🔧

### "API Key not found"
```
❌ Error: ELEVENLABS_API_KEY not set
```
**Fix:** Add to `.env`:
```
ELEVENLABS_API_KEY=sk_...your_key...
```

### Voice not playing in render
- Ensure `audioUrl` field is set in speak action
- Check file exists: `public/voices/...`
- Try with pre-recorded audio first: `audioUrl: '/music/test.mp3'`

### Music doesn't appear in video
- Verify `musicUrl` points to valid MP3
- Check `musicVolume` isn't 0
- Ensure file exists in `public/music/`

### Audio out of sync
- Make sure `startSec` / `endSec` match audio duration
- Remotion uses frame-based timing: `frame / fps = seconds`

---

## Next Steps 🚀

1. **Download 2-3 music tracks** from Pixabay
2. **Update your skit** with voice + music
3. **Test in Remotion Studio:** `npm start`
4. **Render:** `npm run render SkitId out/video.mp4`
5. **Enjoy!** 🎉

---

## Resources 📚

- **ElevenLabs:** https://elevenlabs.io/docs/speech-synthesis
- **Pixabay Music:** https://pixabay.com/music
- **Remotion Audio:** https://www.remotion.dev/docs/audio
- **Voice IDs:** See `src/services/voiceService.ts`
