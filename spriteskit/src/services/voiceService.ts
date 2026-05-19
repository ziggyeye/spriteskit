/**
 * Voice synthesis + lip-sync alignment via ElevenLabs.
 *
 * Pipeline:
 *   1. ElevenLabs `/with-timestamps` → audio + character-level alignment.
 *   2. Tokenize the spoken text into words.
 *   3. Look up each word's phoneme sequence in the CMU Pronouncing
 *      Dictionary (ARPAbet).
 *   4. Distribute the word's audio duration proportionally across its
 *      phonemes.
 *   5. Map each phoneme through ARPABET_TO_VISEME (derived from
 *      Lips_Legend.png) to get a detailed mouth-frame timeline.
 *
 * Words not in the dictionary fall back to a letter-by-letter heuristic.
 *
 * Outputs (per unique (voiceId, text) pair):
 *   public/voices/{hash}.mp3
 *   public/voices/{hash}.visemes.json
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { dictionary as cmuDictionary } from 'cmu-pronouncing-dictionary';
import {
  ARPABET_TO_VISEME,
  LETTER_TO_VISEME,
  type Viseme,
  type VisemeFrame,
} from '../skits/assets';

export interface VoiceConfig {
  voiceId: string;
  text: string;
  stability?: number; // 0-1, default 0.5
  similarityBoost?: number; // 0-1, default 0.75
  /**
   * ElevenLabs model. Default `eleven_flash_v2_5` (fast + alignment, no
   * audio tags). Use `eleven_v3` for expressive `[whispers]`/`[sighs]`
   * audio tags — but v3 alignment data is uncertain, so v3 lines skip
   * lip-sync generation. Use v3 ONLY for off-screen narrator/VO lines
   * where the speaker has no visible mouth.
   */
  model?: 'eleven_flash_v2_5' | 'eleven_v3';
}

export type GenerateVoiceResult = {
  audioUrl: string;
  visemesUrl: string;
  visemes: VisemeFrame[];
};

// Lips_20 is the true neutral closed-mouth rest pose (a flat line).
// Was Lips_00 (a smile) — that made every gap-between-words flash a
// grin, which is wrong for almost every line. Lips_20 is the correct
// "mouth closed, no expression" rest state.
const REST_VISEME: Viseme = 'Lips_20';

export async function generateVoice(config: VoiceConfig): Promise<GenerateVoiceResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ELEVENLABS_API_KEY not set in .env. Get one from https://elevenlabs.io'
    );
  }

  const { voiceId, text, stability = 0.5, similarityBoost = 0.75, model = 'eleven_flash_v2_5' } = config;
  // v3 supports audio tags but its alignment shape is uncertain; we use
  // the standard /text-to-speech endpoint (no alignment, no visemes).
  const isV3 = model === 'eleven_v3';

  // Cache key includes model so flash vs v3 don't collide.
  const hash = crypto
    .createHash('sha256')
    .update(`${voiceId}:${model}:${text}`)
    .digest('base64')
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

  const endpoint = isV3
    ? `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
    : `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: { stability, similarity_boost: similarityBoost },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  let visemes: VisemeFrame[] = [];
  if (isV3) {
    // Standard endpoint returns raw audio bytes (mp3), not JSON.
    const audioBuf = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(audioPath, audioBuf);
  } else {
    const payload = (await response.json()) as {
      audio_base64: string;
      alignment?: {
        characters: string[];
        character_start_times_seconds: number[];
        character_end_times_seconds: number[];
      };
    };
    fs.writeFileSync(audioPath, Buffer.from(payload.audio_base64, 'base64'));
    if (payload.alignment) visemes = alignmentToVisemes(text, payload.alignment);
  }
  fs.writeFileSync(visemePath, JSON.stringify(visemes));

  const label = isV3 ? `Voice (${model}, no visemes)` : `Voice + ${visemes.length} visemes`;
  console.log(`✓ ${label}: ${path.basename(audioPath)}`);
  return {
    audioUrl: `/voices/${hash}.mp3`,
    visemesUrl: `/voices/${hash}.visemes.json`,
    visemes,
  };
}

/**
 * Convert ElevenLabs character-level alignment into a detailed viseme
 * keyframe track using CMU phoneme lookup.
 *
 * For each word in the spoken text:
 *   - Find the character span in the alignment data.
 *   - Look up the word's phoneme sequence (ARPAbet) in CMU.
 *   - Distribute the audio duration proportionally across the phonemes.
 *   - Emit a viseme frame per phoneme.
 *
 * Punctuation / whitespace gaps emit a closed-mouth (Lips_00) frame.
 */
function alignmentToVisemes(
  text: string,
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  }
): VisemeFrame[] {
  const frames: VisemeFrame[] = [];
  const emitIfChanged = (startSec: number, viseme: Viseme) => {
    const last = frames[frames.length - 1];
    if (!last || last.viseme !== viseme) {
      frames.push({ startSec, viseme });
    }
  };

  // Tokenize the original text (preserve sentence-level spacing). We
  // walk through the character array and accumulate per-word spans.
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;

  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (!ch || !/[a-zA-Z']/.test(ch)) {
      // Non-letter — close mouth at this boundary.
      emitIfChanged(starts[i] ?? 0, REST_VISEME);
      i++;
      continue;
    }
    // Start of a word — collect until next non-letter.
    const wordStartIdx = i;
    let wordEndIdx = i;
    while (wordEndIdx < chars.length && /[a-zA-Z']/.test(chars[wordEndIdx])) {
      wordEndIdx++;
    }
    const word = chars.slice(wordStartIdx, wordEndIdx).join('');
    const wordStartSec = starts[wordStartIdx];
    const wordEndSec = ends[wordEndIdx - 1];
    const wordDur = Math.max(0.01, wordEndSec - wordStartSec);

    const phonemes = lookupPhonemes(word);
    if (phonemes && phonemes.length > 0) {
      const slice = wordDur / phonemes.length;
      for (let p = 0; p < phonemes.length; p++) {
        const phoneme = stripStress(phonemes[p]);
        const viseme = ARPABET_TO_VISEME[phoneme] ?? REST_VISEME;
        emitIfChanged(wordStartSec + slice * p, viseme);
      }
    } else {
      // No dictionary entry — fall back to per-letter heuristic, evenly
      // distributed across the word's audio span.
      const letters = word.toLowerCase().replace(/'/g, '').split('');
      const slice = wordDur / Math.max(1, letters.length);
      for (let p = 0; p < letters.length; p++) {
        const viseme = LETTER_TO_VISEME[letters[p]] ?? REST_VISEME;
        emitIfChanged(wordStartSec + slice * p, viseme);
      }
    }

    i = wordEndIdx;
  }

  // Close on the last character's end time.
  const lastEnd = ends[ends.length - 1];
  if (typeof lastEnd === 'number') {
    emitIfChanged(lastEnd, REST_VISEME);
  }

  return frames;
}

/**
 * Look up a word's ARPAbet phoneme sequence in the CMU Pronouncing
 * Dictionary. Returns null if not found. The dictionary stores entries
 * lowercase with space-separated phonemes (e.g. "hello" → "HH AH0 L OW1").
 */
function lookupPhonemes(word: string): string[] | null {
  const key = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!key) return null;
  const entry = (cmuDictionary as Record<string, string | undefined>)[key];
  if (!entry) return null;
  return entry.split(/\s+/);
}

/** Strip the CMU stress digit (0/1/2) suffix from an ARPAbet phoneme. */
function stripStress(phoneme: string): string {
  return phoneme.replace(/[012]$/, '');
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
