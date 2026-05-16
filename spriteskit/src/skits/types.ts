/**
 * Reusable skit types.
 *
 * Every skit is just a data object: a background + a cast of actors + a timeline
 * of actions. The Skit component below turns that data into a Remotion video.
 *
 * To author a new skit, drop a new file in src/skits/scripts/ that exports a
 * `Skit` object, then register it in Root.tsx. No rendering code required.
 */

import type { ClipName, EyeSprite, Outfit, VisemeFrame } from './assets';

/**
 * Legacy 2D sprite IDs. Kept for backwards-compat with the old 2D engine —
 * old skits still author with these and the renderer auto-maps each one to a
 * default 3D outfit (see `legacyOutfit` in Skit.tsx).
 */
export type SpriteId = 'dave' | 'alex' | 'boss' | 'janitor' | 'intern';

/**
 * Discrete actor facing direction. Cardinal directions snap to 0/90/180/270°
 * yaw; the diagonal directions are 45° offsets toward the named corner.
 *
 * Use diagonals when two actors are talking — `down-left` for the actor
 * on the right, `down-right` for the actor on the left, so each faces
 * the camera-friendly side AND angles toward the other actor.
 */
export type Direction =
  | 'down'
  | 'down-left'
  | 'down-right'
  | 'left'
  | 'right'
  | 'up'
  | 'up-left'
  | 'up-right';

export type Background =
  | { kind: 'gradient'; colors: [string, string] }
  | { kind: 'solid'; color: string }
  | { kind: 'radial'; colors: [string, string] };

export type Position = { x: number; y: number };

export type Actor = {
  id: string;
  /** Legacy sprite slot — picks the default 3D outfit if `outfit` is omitted. */
  sprite: SpriteId;
  /** Per-actor 3D outfit. Overrides the legacy-sprite default. */
  outfit?: Outfit;
  /** Display name shown over the speech bubble */
  name?: string;
  /** Starting position (center-x, bottom-y in 1080x1920 coordinate space) */
  start: Position;
  /** Starting facing direction */
  facing?: Direction;
  /** Draw scale multiplier (1 = the engine's default 3D character size) */
  scale?: number;
  /** If true, character starts offscreen and walks in */
  hidden?: boolean;
};

/** 3D camera state used to project the scene onto the 1080×1920 canvas. */
export type CameraState = {
  /** World-space camera position. */
  position: [number, number, number];
  /** World-space point the camera looks at. */
  lookAt: [number, number, number];
  /** Vertical field of view in degrees. Default 35. */
  fov?: number;
  /**
   * World-space "up" vector for the camera. Defaults to [0, 1, 0]
   * (horizon level). Set to e.g. [0.2, 1, 0] for a Dutch tilt — the
   * horizon rolls slightly. Use sparingly; non-default `up` reads as
   * "unsettled" or "off-balance".
   */
  up?: [number, number, number];
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
      /**
       * ElevenLabs TTS model. Default `eleven_flash_v2_5` — fast, with
       * character-level alignment for lip-sync. Use `eleven_v3` for
       * expressive audio tags like `[whispers]`, `[sighs]`, `[laughs]`
       * — but v3 alignment is uncertain so v3 lines skip viseme
       * generation. Use v3 ONLY on off-screen narrator/VO lines whose
       * speaker has no visible mouth.
       */
      voiceModel?: 'eleven_flash_v2_5' | 'eleven_v3';
      /** Path to pre-recorded audio or generated voice file (overrides voiceId if provided) */
      audioUrl?: string;
      /**
       * Viseme track for lip-sync, times relative to `startSec`. Populated by
       * the voice generator from ElevenLabs alignment data.
       * If omitted, the mouth flaps procedurally for the speak duration.
       */
      visemes?: VisemeFrame[];
      /**
       * Volume 0..1 for the spoken audio. Default 1. Use lower values
       * for narrator / VO lines that need to sit under SFX or music.
       */
      volume?: number;
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
    }
  | {
      /**
       * Fade an actor's opacity from `fromOpacity` to `toOpacity` over the
       * window. Use to dissolve a character out of the scene (or fade
       * one in). At opacity 0 the character is invisible but the actor
       * is still considered "visible" for state purposes — use `hidden`
       * on the Actor for a hard cut to invisible.
       */
      type: 'fade';
      actorId: string;
      fromOpacity: number;
      toOpacity: number;
      startSec: number;
      endSec: number;
    }
  | {
      /** Play a named FBX animation clip on an actor for a time window. */
      type: 'animate';
      actorId: string;
      clip: ClipName;
      startSec: number;
      endSec: number;
      /** Loop the clip across the window. Default true. */
      loop?: boolean;
    }
  | {
      /** Override the actor's eye sprite for a time window. */
      eyes: EyeSprite;
      type: 'eyes';
      actorId: string;
      startSec: number;
      endSec: number;
    }
  | {
      /**
       * Tween the camera from its previous state to `to` over the window.
       * Before any camera action fires, the skit-level `defaultCamera` is used.
       */
      type: 'camera';
      to: CameraState;
      startSec: number;
      endSec: number;
    }
  | {
      /**
       * Play a sound effect / music clip during a time window. The audio
       * is mixed with any other audio (music, voiceover). Use for
       * humming, ambient SFX, layered tracks.
       */
      type: 'sfx';
      /** Path to the audio file. Use `staticFile('music/foo.mp3')` for bundled assets. */
      audioUrl: string;
      startSec: number;
      endSec: number;
      /** Volume 0..1. Default 1. */
      volume?: number;
      /**
       * If true, the clip auto-repeats until `endSec`. Use for short
       * humming loops or ambient beds that need to fill a long window.
       * The clip's duration must be known to Remotion at bundle time —
       * supply `loopClipSec` (in seconds) so the renderer knows how
       * long one repetition lasts.
       */
      loop?: boolean;
      /** Duration of one repetition of the clip, in seconds. Required when `loop` is true. */
      loopClipSec?: number;
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
  /** Initial camera state. If omitted, a sensible TikTok-portrait default is used. */
  defaultCamera?: CameraState;
  /**
   * Suppress the per-speak speech bubble. Useful for skits that prefer
   * lower-third captions (TED-talk style) via parallel popupText
   * actions. Default false. Audio still plays.
   */
  hideSpeechBubbles?: boolean;
};
