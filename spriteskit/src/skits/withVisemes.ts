/**
 * Merges generated viseme tracks into a skit's speak actions at runtime.
 *
 * Flow:
 *   1. Author the skit normally (no visemes on speak actions).
 *   2. Run `npm run generate-voices` — this writes audio MP3s and a viseme
 *      sidecar JSON for each (voiceId, text) pair.
 *   3. At render time, call `withVisemes(skit, visemeMap)` to attach the
 *      tracks. The map is keyed by the same `${voiceId}:${text}` hash used
 *      in voiceService.
 */

import type { VisemeFrame } from './assets';
import type { Skit } from './types';

export type VisemeMap = Record<string, VisemeFrame[]>;

export function visemeKey(voiceId: string, text: string): string {
  return Buffer.from(`${voiceId}:${text}`).toString('base64')
    .replace(/[/+=]/g, '_')
    .slice(0, 24);
}

/** Browser-safe variant of `visemeKey` that doesn't require Node's `Buffer`. */
export function visemeKeyBrowser(voiceId: string, text: string): string {
  const raw = btoa(`${voiceId}:${text}`);
  return raw.replace(/[/+=]/g, '_').slice(0, 24);
}

export function withVisemes(skit: Skit, map: VisemeMap): Skit {
  return {
    ...skit,
    timeline: skit.timeline.map((a) => {
      if (a.type !== 'speak' || !a.voiceId) return a;
      const key = typeof Buffer !== 'undefined'
        ? visemeKey(a.voiceId, a.text)
        : visemeKeyBrowser(a.voiceId, a.text);
      const visemes = map[key];
      return visemes ? { ...a, visemes } : a;
    }),
  };
}
