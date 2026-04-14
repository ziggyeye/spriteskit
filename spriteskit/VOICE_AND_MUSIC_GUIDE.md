# Voice & Music Integration Guide

## 🎤 Adding Voice with ElevenLabs

### Setup

1. **Get an API Key**
   - Visit https://elevenlabs.io
   - Sign up (free tier includes ~1,000 credits/month)
   - Go to API Keys and copy your key
   - Add to `.env`:
     ```
     ELEVEN_LABS_API_KEY=sk_...your_key...
     ```

2. **Pre-generate Voices** (Before rendering)
   ```bash
   # Create a script in the scripts folder or run from Node:
   node -e "
   import('./dist/services/voiceService.js').then(m => {
     m.preGenerateVoices([
       { text: 'AI is taking everyones job!', voiceId: 'IZSifFFbIucDmqV5ClJK' },
       { text: 'Wait, what happened?', voiceId: 'EXAVITQu4vr4xnSDxMaL' }
     ]).then(() => console.log('Done!'));
   });
   "
   ```

### Usage in Skits

Add `voiceId` to speak actions:

```typescript
{
  type: 'speak',
  actorId: 'dave',
  text: 'AI is taking my job!',
  voiceId: 'IZSifFFbIucDmqV5ClJK', // Charlie voice
  startSec: 2.5,
  endSec: 6.0,
}
```

Or use pre-recorded audio:

```typescript
{
  type: 'speak',
  actorId: 'dave',
  text: 'AI is taking my job!',
  audioUrl: '/voices/my-custom-recording.mp3',
  startSec: 2.5,
  endSec: 6.0,
}
```

### Voice IDs Cheat Sheet

**Male Voices:**
- `4ZDaoj2FNzJ0ejT0xNB3` - Adam (warm, natural)
- `IZSifFFbIucDmqV5ClJK` - Charlie (enthusiastic, energetic)
- `ErXwobaYp0GQe50TxIAJ` - Antoni (professional, calm)

**Female Voices:**
- `EXAVITQu4vr4xnSDxMaL` - Sarah (clear, friendly)
- `jBpfuIE2acCO8z3wKNLl` - Gigi (upbeat, youthful)
- `21m00Tcm4ijLg7aMgO69` - Rachel (warm, expressive)

Full list in `src/services/voiceService.ts`

---

## 🎵 Adding Background Music from Pixabay

### Finding Music on Pixabay

1. Visit https://pixabay.com/music
2. Search for style: "upbeat", "cinematic", "comedy", "energetic", etc.
3. Filter by duration (match your skit length)
4. Download the MP3 (free, no attribution needed)
5. Place in `public/music/` folder

### Example: Recommended Music

**For Comedy/Meme Skits:**
- Pixabay: "Funny Theme" (upbeat, quirky)
- Pixabay: "Comedy Moment" (light, playful)
- Pixabay: "Retro Fun" (80s vibes)

**For Dramatic Reveals:**
- Pixabay: "Cinematic Tension" (building suspense)
- Pixabay: "Plot Twist" (dramatic, surprising)
- Pixabay: "Betrayal" (dark, dramatic)

**For Calm/Intro:**
- Pixabay: "Ambient Background" (neutral, calming)
- Pixabay: "Lo-Fi Beats" (chill, modern)

### Using Music in Skits

```typescript
export const aiTakingMyJob: Skit = {
  // ...other config...
  musicUrl: '/music/comedy-moment.mp3',
  musicVolume: 0.5, // 0-1 scale
  // ...rest of skit...
}
```

---

## 🚀 Full Example: Voice + Music Integration

```typescript
import type { Skit } from '../types';

const FLOOR = 1500;

export const mySkitWithVoice: Skit = {
  id: 'MySkitVoice',
  title: 'Hello World',
  durationInSeconds: 15,
  background: { kind: 'solid', color: '#ff6ec7' },
  musicUrl: '/music/comedy-moment.mp3',
  musicVolume: 0.4,
  actors: [
    {
      id: 'character1',
      sprite: 'male',
      name: 'Alex',
      start: { x: 540, y: FLOOR },
    },
  ],
  timeline: [
    {
      type: 'speak',
      actorId: 'character1',
      text: 'Hello! This video has voice!',
      voiceId: 'IZSifFFbIucDmqV5ClJK', // ElevenLabs Charlie
      startSec: 0,
      endSec: 3,
    },
    {
      type: 'speak',
      actorId: 'character1',
      text: 'And music in the background.',
      voiceId: 'IZSifFFbIucDmqV5ClJK',
      startSec: 3.5,
      endSec: 6,
    },
  ],
};
```

---

## 📝 Notes

- Voice generation is cached: same text = same file, no re-generation
- Music files should be in `/public/music/`
- Voice files are auto-generated to `/public/voices/`
- Pixabay music is free (CC0 license) — no attribution required
- Build your videos with: `npm run build`

---

## 🔗 Links

- ElevenLabs: https://elevenlabs.io/docs/speech-synthesis/models
- Pixabay Music: https://pixabay.com/music
- Remotion Audio: https://www.remotion.dev/docs/audio
