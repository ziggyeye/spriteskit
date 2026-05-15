/**
 * Merges generated viseme tracks into a skit's speak actions at runtime.
 *
 * Flow:
 *   1. Author the skit normally (no visemes on speak actions).
 *   2. Run `npm run generate-voices` — this writes audio MP3s and a viseme
 *      sidecar JSON for each (voiceId, text) pair, plus a generated
 *      `{skitName}.visemes.ts` module exporting a `VisemeMap`.
 *   3. At render time, call `withVisemes(skit, visemeMap)` to attach the
 *      tracks. The map is keyed by `${voiceId}::${text}` exactly — no
 *      hashing, no truncation, no collisions.
 */

import { staticFile } from 'remotion';
import type { VisemeFrame } from './assets';
import type { Skit } from './types';

/**
 * Per-line metadata produced by `npm run generate-voices`:
 *   - audioUrl: the public path to the MP3 (e.g. `/voices/{hash}.mp3`).
 *   - visemes: the lip-sync keyframe track.
 */
export type VisemeEntry = {
  audioUrl: string;
  visemes: VisemeFrame[];
};

export type VisemeMap = Record<string, VisemeEntry>;

/** Build the map key for a speak line. Safe for Node and browser. */
export function visemeKey(voiceId: string, text: string): string {
  return `${voiceId}::${text}`;
}

export function withVisemes(skit: Skit, map: VisemeMap): Skit {
  return {
    ...skit,
    timeline: skit.timeline.map((a) => {
      if (a.type !== 'speak' || !a.voiceId) return a;
      const entry = map[visemeKey(a.voiceId, a.text)];
      if (!entry) return a;
      // entry.audioUrl is stored as a root-relative path like
      // '/voices/{hash}.mp3'. Remotion's <Audio> renderer needs a
      // bundled-static URL — pass through `staticFile` so the public
      // dir maps correctly inside the bundle.
      const audioUrl = a.audioUrl ?? staticFile(entry.audioUrl.replace(/^\//, ''));
      return { ...a, audioUrl, visemes: entry.visemes };
    }),
  };
}
