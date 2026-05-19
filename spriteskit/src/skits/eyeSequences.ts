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
 * Tiny deterministic PRNG (mulberry32). Same seed always produces the
 * same sequence — required because Remotion renders frames out of
 * order. Non-seeded Math.random() would desync between frames.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Schedule random natural-rate blinks across a window.
 *
 * Humans blink ~15-20 times per minute, with most inter-blink
 * intervals in the 2-6 second range. This helper emits a sequence of
 * full blinks (each = 7 short eyes-actions, ~480ms total) at jittered
 * intervals so the character feels alive without you scheduling each
 * blink by hand.
 *
 * **Layering**: the blinks emit short overrides on the eyes state.
 * The Skit.tsx eye-resolution rule is last-match-wins per frame, so
 * call this AFTER your main `eyes` actions in the timeline — the
 * blinks will fire during their ~480ms windows, then the underlying
 * eye state (Default / Flat / Kawaii / etc.) re-asserts when the
 * blink completes.
 *
 * **Determinism**: uses a seeded PRNG so re-renders produce identical
 * blink timing. Change the seed if you want a different pattern.
 *
 * Example:
 *
 *   timeline: [
 *     ...mainEyeActions,                          // explicit Eye_* windows
 *     ...randomBlinks('lena', 0, 110, { seed: 7 }), // overlay blinks
 *   ]
 */
export function randomBlinks(
  actorId: string,
  startSec: number,
  endSec: number,
  opts: {
    /** PRNG seed. Different seeds → different blink patterns. */
    seed?: number;
    /** Min gap between blinks in seconds. Default 1.8s. */
    minGapSec?: number;
    /** Max gap between blinks in seconds. Default 5.5s. */
    maxGapSec?: number;
    /** Per-blink duration knob (frame interval). Default 80ms. */
    frameSec?: number;
    /** Occasional double-blink probability (0..1). Default 0.12. */
    doubleBlinkProb?: number;
  } = {},
): Action[] {
  const {
    seed = 1,
    minGapSec = 1.8,
    maxGapSec = 5.5,
    frameSec = 0.08,
    doubleBlinkProb = 0.12,
  } = opts;
  const rng = mulberry32(seed);
  const blinkSpanSec = EYE_BLINK_SEQUENCE.length * frameSec;

  const out: Action[] = [];
  // Start at startSec + a small jitter so the first blink isn't at t=0
  let t = startSec + minGapSec + rng() * (maxGapSec - minGapSec);
  while (t + blinkSpanSec <= endSec) {
    out.push(...expand(actorId, t, EYE_BLINK_SEQUENCE, frameSec));
    // Occasional double-blink (humans cluster blinks).
    if (rng() < doubleBlinkProb) {
      const nextT = t + blinkSpanSec + 0.05 + rng() * 0.15;
      if (nextT + blinkSpanSec <= endSec) {
        out.push(...expand(actorId, nextT, EYE_BLINK_SEQUENCE, frameSec));
        t = nextT;
      }
    }
    t += blinkSpanSec + minGapSec + rng() * (maxGapSec - minGapSec);
  }
  return out;
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
