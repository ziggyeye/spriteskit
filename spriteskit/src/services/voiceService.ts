/**
 * Voice synthesis + lip-sync alignment via ElevenLabs.
 *
 * Usage:
 * - Set ELEVENLABS_API_KEY in your .env file.
 * - Call generateVoice() to generate audio + viseme JSON for one line.
 * - At skit-author time, read the viseme JSON and attach it to the `visemes`
 *   field on the matching speak action.
 *
 * For each unique (voiceId, text) pair we write:
 *   public/voices/{hash}.mp3
 *   public/voices/{hash}.visemes.json
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import {
  LETTER_TO_VISEME,
  type Viseme,
  type VisemeFrame,
} from '../skits/assets';

export interface VoiceConfig {
  voiceId: string;
  text: string;
  stability?: number; // 0-1, default 0.5
  similarityBoost?: number; // 0-1, default 0.75
}

export type GenerateVoiceResult = {
  audioUrl: string;
  visemesUrl: string;
  visemes: VisemeFrame[];
};

/**
 * Generate voice audio + character-level alignment, then convert alignment to
 * a viseme keyframe track. Returns public-relative URLs for both files plus
 * the in-memory viseme track (useful for tests / direct embedding).
 */
export async function generateVoice(config: VoiceConfig): Promise<GenerateVoiceResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ELEVENLABS_API_KEY not set in .env. Get one from https://elevenlabs.io'
    );
  }

  const { voiceId, text, stability = 0.5, similarityBoost = 0.75 } = config;

  // Hash combines voice + text so the same line in different voices doesn't collide.
  const hash = Buffer.from(`${voiceId}:${text}`).toString('base64')
    .replace(/[/+=]/g, '_')
    .slice(0, 24);
  const voicesDir = path.join(process.cwd(), 'public', 'voices');
  if (!fs.existsSync(voicesDir)) fs.mkdirSync(voicesDir, { recursive: true });

  const audioPath = path.join(voicesDir, `${hash}.mp3`);
  const visemePath = path.join(voicesDir, `${hash}.visemes.json`);

  if (fs.existsSync(audioPath) && fs.existsSync(visemePath)) {
    const visemes = JSON.parse(fs.readFileSync(visemePath, 'utf8')) as VisemeFrame[];
    return {
      audioUrl: `/voices/${hash}.mp3`,
      visemesUrl: `/voices/${hash}.visemes.json`,
      visemes,
    };
  }

  // The `/with-timestamps` endpoint returns audio_base64 + character alignment.
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: { stability, similarity_boost: similarityBoost },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const payload = (await response.json()) as {
    audio_base64: string;
    alignment?: {
      characters: string[];
      character_start_times_seconds: number[];
      character_end_times_seconds: number[];
    };
  };

  fs.writeFileSync(audioPath, Buffer.from(payload.audio_base64, 'base64'));

  const visemes = payload.alignment
    ? alignmentToVisemes(payload.alignment)
    : [];
  fs.writeFileSync(visemePath, JSON.stringify(visemes));

  console.log(`✓ Voice + ${visemes.length} visemes: ${path.basename(audioPath)}`);
  return {
    audioUrl: `/voices/${hash}.mp3`,
    visemesUrl: `/voices/${hash}.visemes.json`,
    visemes,
  };
}

/**
 * Convert ElevenLabs character-level timings into a viseme keyframe track.
 * One frame per character; viseme picked by LETTER_TO_VISEME, with a closed
 * mouth inserted at the end of each word and at the very end of the line.
 */
function alignmentToVisemes(alignment: {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}): VisemeFrame[] {
  const frames: VisemeFrame[] = [];
  const closed: Viseme = 'Lips_s00_Default';
  let lastViseme: Viseme | null = null;

  for (let i = 0; i < alignment.characters.length; i++) {
    const ch = alignment.characters[i];
    const start = alignment.character_start_times_seconds[i];
    const end = alignment.character_end_times_seconds[i];
    const lower = ch.toLowerCase();
    const v = LETTER_TO_VISEME[lower];

    if (v) {
      if (v !== lastViseme) frames.push({ startSec: start, viseme: v });
      lastViseme = v;
    } else {
      // Whitespace/punctuation → close mouth at this boundary.
      if (lastViseme !== closed) frames.push({ startSec: start, viseme: closed });
      lastViseme = closed;
    }
    // After the very last character, return to closed at its end-time.
    if (i === alignment.characters.length - 1 && lastViseme !== closed) {
      frames.push({ startSec: end, viseme: closed });
    }
  }
  return frames;
}

/** @deprecated Use generateVoice() — it always produces visemes too. */
export async function preGenerateVoices(
  dialogueLines: Array<{ text: string; voiceId: string }>
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const line of dialogueLines) {
    try {
      const { audioUrl } = await generateVoice({
        voiceId: line.voiceId,
        text: line.text,
      });
      result[line.text] = audioUrl;
    } catch (e) {
      console.error(`✗ Failed: "${line.text}"`, e);
    }
  }
  return result;
}

export { VOICE_IDS } from './voiceIds';
