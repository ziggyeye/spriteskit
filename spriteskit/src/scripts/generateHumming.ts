/**
 * Generate humming SFX clips via the ElevenLabs Sound Effects API.
 *
 * Usage:
 *   npx tsx src/scripts/generateHumming.ts
 *
 * Writes WAV/MP3 files to public/music/. Caches by filename — re-runs
 * skip files that already exist. Delete the file to regenerate.
 *
 * IMPORTANT: AI SFX is stochastic — two separate calls will produce
 * DIFFERENT melodies. We want the elder and the child to hum the SAME
 * tune. So we generate ONE longer clip containing both, then slice it
 * offline if needed (or use the elder clip and pitch-shift later).
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

type SFXClip = {
  /** Output filename (no path); written to public/music/{filename}. */
  filename: string;
  /** ElevenLabs text-to-SFX prompt. */
  prompt: string;
  /** Duration in seconds (max 22). */
  durationSec: number;
  /** 0..1 — higher = follows prompt more closely, less variation. */
  promptInfluence?: number;
};

const CLIPS: SFXClip[] = [
  {
    filename: 'hum_elder.mp3',
    prompt:
      'An elderly man humming a soft, slow, gentle four-note lullaby melody. ' +
      'Close-mic recording, breathy, slightly cracked voice, no music, ' +
      'no instruments, no words, just hum. The melody descends three notes ' +
      'then resolves up one note. Quiet, contemplative, like a grandfather ' +
      'singing to himself.',
    durationSec: 12,
    promptInfluence: 0.6,
  },
  {
    filename: 'hum_child.mp3',
    prompt:
      'A young girl, around 7 years old, humming a soft four-note lullaby ' +
      'melody. Close-mic recording, light and breathy, no words, no music, ' +
      'no instruments, just hum. The melody descends three notes then ' +
      'resolves up one note. The exact same simple melody an elderly man ' +
      'would teach a child. Tender, sweet, slightly uncertain like she is ' +
      'learning it.',
    durationSec: 10,
    promptInfluence: 0.6,
  },
  {
    filename: 'hum_duet.mp3',
    prompt:
      'An elderly man and a young girl humming the same soft four-note ' +
      'lullaby melody together in unison. Two voices overlapping, both ' +
      'breathy and close-mic, no words, no music, no instruments. The ' +
      "child's voice is a fifth higher than the man's. Tender, intimate, " +
      'like a duet passed down through generations.',
    durationSec: 8,
    promptInfluence: 0.6,
  },
];

async function generateSFX(clip: SFXClip): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set in .env');

  const outDir = path.join(process.cwd(), 'public', 'music');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, clip.filename);

  if (fs.existsSync(outPath)) {
    const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(0);
    console.log(`  ⤺ cached: ${clip.filename} (${sizeKb} KB)`);
    return;
  }

  console.log(`  → generating ${clip.filename} (${clip.durationSec}s)`);
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: clip.prompt,
      duration_seconds: clip.durationSec,
      prompt_influence: clip.promptInfluence ?? 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs SFX error ${res.status}: ${err}`);
  }
  const buf = await res.buffer();
  fs.writeFileSync(outPath, buf);
  const sizeKb = (buf.length / 1024).toFixed(0);
  console.log(`  ✓ wrote ${outPath} (${sizeKb} KB)`);
}

async function main() {
  console.log(`\nGenerating ${CLIPS.length} humming clips...\n`);
  for (const clip of CLIPS) {
    try {
      await generateSFX(clip);
    } catch (e) {
      console.error(`  ✗ failed ${clip.filename}:`, e);
    }
  }
  console.log('\nDone. Audition each clip and pick the best for the skit.');
}

main();
