import type { Skit } from '../types';

/**
 * Example: "Hello Voice" — shows voice and music integration (15 seconds)
 *
 * To use:
 * 1. Get ElevenLabs API key from https://elevenlabs.io
 * 2. Add to .env: ELEVEN_LABS_API_KEY=sk_...
 * 3. Pre-generate voices by running src/services/voiceService.ts
 * 4. Download music:
 *    - Visit: https://pixabay.com/music/funk-joyful-rhythm-walk-funk-513936/
 *    - Download as: public/music/joyful-rhythm.mp3
 *    (Or see MUSIC_PICKS.md for other recommendations)
 * 5. Update Root.tsx to register this skit
 */

const FLOOR = 1500;
const CENTER = 540;

export const helloVoice: Skit = {
  id: 'HelloVoice',
  title: 'Hello Voice',
  durationInSeconds: 15,
  background: {
    kind: 'gradient',
    colors: ['#667eea', '#764ba2'],
  },
  // Add background music from Pixabay (see MUSIC_PICKS.md)
  // Recommended: Joyful Rhythm
  // Download: https://pixabay.com/music/funk-joyful-rhythm-walk-funk-513936/
  // Save as: public/music/joyful-rhythm.mp3
  musicUrl: '/music/joyful-rhythm.mp3',
  musicVolume: 0.4,
  actors: [
    {
      id: 'speaker',
      sprite: 'male',
      name: 'VOICE BOY',
      start: { x: CENTER, y: FLOOR },
      facing: 'down',
    },
  ],
  timeline: [
    // Opening title card
    {
      type: 'popupText',
      text: 'Voice + Music\nIntegration',
      startSec: 0,
      endSec: 2,
      size: 120,
      color: '#ffffff',
    },
    // First dialogue with ElevenLabs voice
    {
      type: 'speak',
      actorId: 'speaker',
      text: 'Hello! This skit has voice!',
      // Voice ID: IZSifFFbIucDmqV5ClJK is "Charlie" (enthusiastic male)
      voiceId: 'IZSifFFbIucDmqV5ClJK',
      startSec: 2.5,
      endSec: 5,
      emoji: '🎤',
    },
    // Second dialogue
    {
      type: 'speak',
      actorId: 'speaker',
      text: 'And there is music in the background!',
      voiceId: 'IZSifFFbIucDmqV5ClJK',
      startSec: 5.5,
      endSec: 8.5,
      emoji: '🎵',
    },
    // Celebration
    {
      type: 'emote',
      actorId: 'speaker',
      emoji: '🎉',
      startSec: 8.5,
      endSec: 11,
    },
    // Final popup
    {
      type: 'popupText',
      text: 'AWESOME!',
      startSec: 11,
      endSec: 15,
      size: 150,
      color: '#ffff00',
      rotate: 15,
    },
  ],
};

/**
 * Example 2: Using custom recorded audio instead of TTS
 *
 * If you prefer pre-recorded audio over generated voice:
 */
export const customAudioExample: Skit = {
  id: 'CustomAudioExample',
  title: 'Custom Audio Example',
  durationInSeconds: 10,
  background: { kind: 'solid', color: '#1a1a2e' },
  musicUrl: '/music/cinematic-dramatic.mp3',
  musicVolume: 0.3,
  actors: [
    {
      id: 'narrator',
      sprite: 'female',
      name: 'NARRATOR',
      start: { x: CENTER, y: FLOOR },
    },
  ],
  timeline: [
    {
      type: 'speak',
      actorId: 'narrator',
      text: 'This uses pre-recorded audio',
      // Instead of voiceId, provide audioUrl to your own MP3
      audioUrl: '/voices/custom-narration.mp3',
      startSec: 0,
      endSec: 3,
    },
    {
      type: 'popupText',
      text: 'You can use your own recording!',
      startSec: 3,
      endSec: 10,
    },
  ],
};
