/**
 * Pre-generate ElevenLabs voice audio for a skit.
 *
 * Usage:
 *   npx tsx src/scripts/generateVoices.ts
 *
 * Requires ELEVENLABS_API_KEY in .env (or exported in shell).
 * Outputs MP3 files to public/voices/{hash}.mp3
 */

import 'dotenv/config';
import { generateVoice } from '../services/voiceService';
import { aiTakingMyJob } from '../skits/scripts/aiTakingMyJob';
import { aiTakingMyJobPt2 } from '../skits/scripts/aiTakingMyJobPt2';
import type { Skit } from '../skits/types';

async function generateVoicesForSkit(skit: Skit) {
  const speakActions = skit.timeline.filter(
    (a) => a.type === 'speak' && a.voiceId
  ) as Array<Extract<(typeof skit.timeline)[number], { type: 'speak' }>>;

  if (speakActions.length === 0) {
    console.log(`No speak actions with voiceId found in "${skit.title}".`);
    return;
  }

  console.log(
    `Generating ${speakActions.length} voice(s) for "${skit.title}"...\n`
  );

  for (const sp of speakActions) {
    const actor = skit.actors.find((a) => a.id === sp.actorId);
    const label = actor?.name ?? sp.actorId;
    console.log(`  ${label}: "${sp.text.replace(/\n/g, ' ')}"`);

    try {
      const url = await generateVoice({
        voiceId: sp.voiceId!,
        text: sp.text,
      });
      console.log(`    -> ${url}\n`);
    } catch (err) {
      console.error(`    ✗ Failed:`, err, '\n');
    }
  }

  console.log('Done! Voice files saved to public/voices/');
}

async function main() {
  await generateVoicesForSkit(aiTakingMyJob);
  await generateVoicesForSkit(aiTakingMyJobPt2);
}

main();
