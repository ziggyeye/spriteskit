/**
 * Reusable skit types.
 *
 * Every skit is just a data object: a background + a cast of actors + a timeline
 * of actions. The Skit component below turns that data into a Remotion video.
 *
 * To author a new skit, drop a new file in src/skits/scripts/ that exports a
 * `Skit` object, then register it in Root.tsx. No rendering code required.
 */

export type SpriteId = 'dave' | 'alex' | 'boss' | 'janitor' | 'intern';

export type Direction = 'down' | 'left' | 'right' | 'up';

export type Background =
  | { kind: 'gradient'; colors: [string, string] }
  | { kind: 'solid'; color: string }
  | { kind: 'radial'; colors: [string, string] };

export type Position = { x: number; y: number };

export type Actor = {
  id: string;
  sprite: SpriteId;
  /** Display name shown over the speech bubble */
  name?: string;
  /** Starting position (center-x, bottom-y in 1080x1920 coordinate space) */
  start: Position;
  /** Starting facing direction */
  facing?: Direction;
  /** Draw scale multiplier (1 = 4x sprite scale baseline) */
  scale?: number;
  /** If true, character starts offscreen and walks in */
  hidden?: boolean;
};

/** A step on the skit timeline. All times are in seconds. */
export type Action =
  | {
      type: 'walk';
      actorId: string;
      to: Position;
      startSec: number;
      endSec: number;
      /** Optional: force facing during the walk. Otherwise inferred from dx. */
      facing?: Direction;
    }
  | {
      type: 'face';
      actorId: string;
      direction: Direction;
      atSec: number;
    }
  | {
      type: 'speak';
      actorId: string;
      text: string;
      /** Optional emoji rendered beside the bubble */
      emoji?: string;
      startSec: number;
      endSec: number;
      /** 'auto' places bubble above the actor; 'left'/'right' shifts it */
      side?: 'auto' | 'left' | 'right';
      /** bubble tail color + bubble fg color override */
      tint?: string;
      /** ElevenLabs voice ID for TTS (e.g., 'IZSifFFbIucDmqV5ClJK' for Charlie) */
      voiceId?: string;
      /** Path to pre-recorded audio or generated voice file (overrides voiceId if provided) */
      audioUrl?: string;
    }
  | {
      type: 'popupText';
      text: string;
      startSec: number;
      endSec: number;
      /** y-position as fraction of height (0 top, 1 bottom). Default 0.2 */
      y?: number;
      color?: string;
      rotate?: number;
      /** Size in pixels. Default 140 */
      size?: number;
    }
  | {
      type: 'shake';
      startSec: number;
      endSec: number;
      intensity?: number;
    }
  | {
      type: 'flash';
      startSec: number;
      endSec: number;
      color?: string;
    }
  | {
      type: 'emote';
      actorId: string;
      emoji: string;
      startSec: number;
      endSec: number;
    }
  | {
      type: 'tint';
      actorId: string;
      color: string;
      startSec: number;
      endSec: number;
    };

export type Skit = {
  id: string;
  title: string;
  durationInSeconds: number;
  fps?: number;
  width?: number;
  height?: number;
  background: Background;
  actors: Actor[];
  timeline: Action[];
  /** Optional background music track (Pixabay URL or local file path) */
  musicUrl?: string;
  /** Volume for music (0-1, default 0.5) */
  musicVolume?: number;
};
