/**
 * Voice synthesis service using ElevenLabs API.
 * 
 * Usage:
 * - Set ELEVEN_LABS_API_KEY in your .env file
 * - Call generateVoice() to generate audio files for dialogue
 * 
 * Voice IDs available:
 * - 'Adam', 'Antoni', 'Arnold', 'Charlie', 'Clyde', 'Domi', 'Fin',
 * - 'George', 'Grace', 'Gigi', 'Glinda', 'Grace', 'Lily', ...
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

export interface VoiceConfig {
  voiceId: string;
  text: string;
  stability?: number; // 0-1, default 0.5
  similarityBoost?: number; // 0-1, default 0.75
}

/**
 * Generate voice audio using ElevenLabs API
 * Saves MP3 file to public/voices/{hash}.mp3
 */
export async function generateVoice(config: VoiceConfig): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ELEVENLABS_API_KEY not set in .env. Get one from https://elevenlabs.io'
    );
  }

  const { voiceId, text, stability = 0.5, similarityBoost = 0.75 } = config;

  // Create hash of text to use as filename (so same text reuses same file)
  const hash = Buffer.from(text).toString('base64').slice(0, 16);
  const voicesDir = path.join(process.cwd(), 'public', 'voices');

  // Ensure voices directory exists
  if (!fs.existsSync(voicesDir)) {
    fs.mkdirSync(voicesDir, { recursive: true });
  }

  const filePath = path.join(voicesDir, `${hash}.mp3`);

  // Return cached file if already generated
  if (fs.existsSync(filePath)) {
    return `/voices/${hash}.mp3`;
  }

  // Call ElevenLabs API
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  // Save audio file
  const buffer = await response.buffer();
  fs.writeFileSync(filePath, buffer);

  console.log(`✓ Voice generated: ${filePath}`);
  return `/voices/${hash}.mp3`;
}

/**
 * Pre-generate voices for a skit's dialogue.
 * Run this once before rendering to populate public/voices/
 */
export async function preGenerateVoices(
  dialogueLines: Array<{ text: string; voiceId: string }>
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  for (const line of dialogueLines) {
    try {
      const audioUrl = await generateVoice({
        voiceId: line.voiceId,
        text: line.text,
      });
      result[line.text] = audioUrl;
      console.log(`✓ Generated voice for: "${line.text}"`);
    } catch (e) {
      console.error(`✗ Failed to generate voice for: "${line.text}"`, e);
    }
  }

  return result;
}

export { VOICE_IDS } from './voiceIds';
