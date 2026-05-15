/**
 * Helpers that turn the canonical eye-sprite sequences from assets.ts
 * into ready-to-spread arrays of `eyes` actions.
 *
 * Skit authors use these instead of inlining the per-frame eye sprites
 * manually — they encode the asset pack's intended sequence ordering
 * (e.g. a blink is symmetric: open → close → open, not a hard cut).
 *
 * Example:
 *
 *   timeline: [
 *     ...eyeBlinkAt('dave', 12.0),               // a single blink at 12s
 *     ...eyeStarryLoopAt('alex', 8.0, 4.0, 0.15), // 4s of sparkle from 8s
 *     ...eyeHeartsPulseAt('dave', 18.0, 6.0),     // 6s of heart-pulse from 18s
 *   ]
 */

import {
  EYE_BLINK_SEQUENCE,
  EYE_HEARTS_PULSE,
  EYE_STARRY_LOOP,
  type EyeSprite,
} from './assets';
import type { Action } from './types';

/** Expand a sequence into N back-to-back `eyes` actions. */
function expand(
  actorId: string,
  startSec: number,
  frames: readonly EyeSprite[],
  frameSec: number,
): Action[] {
  return frames.map((sprite, i) => ({
    type: 'eyes',
    actorId,
    eyes: sprite,
    startSec: startSec + i * frameSec,
    endSec: startSec + (i + 1) * frameSec,
  }));
}

/** Repeat a sequence until it fills `totalSec`. */
function loop(
  actorId: string,
  startSec: number,
  totalSec: number,
  frames: readonly EyeSprite[],
  frameSec: number,
): Action[] {
  const loopDuration = frames.length * frameSec;
  const repeats = Math.ceil(totalSec / loopDuration);
  const out: Action[] = [];
  for (let i = 0; i < repeats; i++) {
    out.push(...expand(actorId, startSec + i * loopDuration, frames, frameSec));
  }
  return out;
}

/**
 * One blink (~480ms). 7-frame symmetric sequence: Default → Blink1 →
 * Blink2 → Blink3 → Blink2 → Blink1 → Default. The 80ms-per-frame
 * default reads as a natural blink.
 */
export function eyeBlinkAt(
  actorId: string,
  startSec: number,
  frameSec = 0.08,
): Action[] {
  return expand(actorId, startSec, EYE_BLINK_SEQUENCE, frameSec);
}

/**
 * Starry-eye sparkle for `totalSec` seconds. Alternates Starry1 ↔
 * Starry2 to pulse. ~150ms/frame is soft; ~80ms is excited.
 */
export function eyeStarryLoopAt(
  actorId: string,
  startSec: number,
  totalSec: number,
  frameSec = 0.15,
): Action[] {
  return loop(actorId, startSec, totalSec, EYE_STARRY_LOOP, frameSec);
}

/**
 * Heart-pulse loop for `totalSec` seconds. 7-frame growing-then-
 * shrinking heart sequence — reads as a heartbeat rather than a flicker.
 */
export function eyeHeartsPulseAt(
  actorId: string,
  startSec: number,
  totalSec: number,
  frameSec = 0.12,
): Action[] {
  return loop(actorId, startSec, totalSec, EYE_HEARTS_PULSE, frameSec);
}
