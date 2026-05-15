import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Loop,
  Sequence,
} from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Background } from '../components/Background';
import { Character3D, directionToYaw } from '../components/Character3D';
import { SpeechBubble } from '../components/SpeechBubble';
import { PopupText } from '../components/PopupText';
import type {
  Action,
  CameraState,
  Direction,
  Position,
  Skit,
} from './types';
import type { ClipName, EyeSprite, Viseme } from './assets';
import { LEGACY_OUTFITS } from './legacyOutfits';

// --- Coordinate space ---
// Skits author in 2D pixel space (1080×1920). We project each (x, y) onto a
// fixed world Z=0 plane and place a perspective camera so that plane fills
// the canvas. PIXELS_PER_UNIT is chosen so the FBX character (~1.45 units
// tall) renders at ~36% of the canvas height when drawn at its full scale.
const PIXELS_PER_UNIT = 480;

/**
 * Character height in pixel space. Used to position speech bubbles / emotes
 * above the head. Derived from the Lips-Pack FBX bbox: 1.45 world units ×
 * PIXELS_PER_UNIT ≈ 696 px. If you swap the model for a different rig,
 * update this constant accordingly.
 */
const CHARACTER_HEIGHT_PX = 700;

function pixelToWorld(x: number, y: number, width: number, height: number): [number, number, number] {
  const wx = (x - width / 2) / PIXELS_PER_UNIT;
  // Three.js Y is up; skit Y is down. Translate so y=height maps to the floor.
  const wy = (height - y) / PIXELS_PER_UNIT;
  return [wx, wy, 0];
}

/** A default camera that frames the full 1080×1920 portrait. */
function defaultCameraForCanvas(width: number, height: number): CameraState {
  const fov = 35;
  const worldH = height / PIXELS_PER_UNIT;
  const dist = (worldH / 2) / Math.tan((fov / 2) * (Math.PI / 180));
  return {
    position: [0, worldH / 2, dist],
    lookAt: [0, worldH / 2, 0],
    fov,
  };
}

/** Renders any Skit data object into a Remotion video. */
export const SkitComp: React.FC<{ skit: Skit }> = ({ skit }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const sec = frame / fps;

  // Compute per-actor state by walking the timeline up to `sec`.
  const actorStates = computeActorStates(skit, sec);
  const camera = computeCameraState(skit, sec, width, height);

  // All speak actions (for audio scheduling)
  const allSpeaks = skit.timeline.filter(
    (a) => a.type === 'speak'
  ) as Extract<Action, { type: 'speak' }>[];

  // Active speak actions keyed by actor
  const activeSpeaks = skit.timeline.filter(
    (a) => a.type === 'speak' && sec >= a.startSec && sec < a.endSec
  ) as Extract<Action, { type: 'speak' }>[];

  const activePopups = skit.timeline.filter(
    (a) => a.type === 'popupText' && sec >= a.startSec && sec < a.endSec
  ) as Extract<Action, { type: 'popupText' }>[];

  const activeShakes = skit.timeline.filter(
    (a) => a.type === 'shake' && sec >= a.startSec && sec < a.endSec
  ) as Extract<Action, { type: 'shake' }>[];

  const activeFlashes = skit.timeline.filter(
    (a) => a.type === 'flash' && sec >= a.startSec && sec < a.endSec
  ) as Extract<Action, { type: 'flash' }>[];

  const activeEmotes = skit.timeline.filter(
    (a) => a.type === 'emote' && sec >= a.startSec && sec < a.endSec
  ) as Extract<Action, { type: 'emote' }>[];

  // Compute camera shake (applied to the canvas wrapper in DOM).
  let shakeX = 0;
  let shakeY = 0;
  for (const s of activeShakes) {
    const intensity = s.intensity ?? 20;
    shakeX += Math.sin(frame * 2.3) * intensity;
    shakeY += Math.cos(frame * 2.7) * intensity;
  }

  return (
    <AbsoluteFill>
      {/* Background music */}
      {skit.musicUrl && (
        <Audio
          src={skit.musicUrl}
          volume={skit.musicVolume ?? 0.5}
        />
      )}

      {/* Character voice audio tracks */}
      {allSpeaks.map((sp) => {
        if (!sp.audioUrl) return null;
        const fromFrame = Math.round(sp.startSec * fps);
        const durationFrames = Math.round((sp.endSec - sp.startSec) * fps);
        return (
          <Sequence
            key={`voice-${sp.actorId}-${sp.startSec}`}
            from={fromFrame}
            durationInFrames={durationFrames}
          >
            <Audio src={sp.audioUrl} volume={sp.volume ?? 1} allowAmplificationDuringRender />
          </Sequence>
        );
      })}

      {/* SFX tracks — humming, ambient sound, layered music. Looped
          clips wrap in <Loop> so a short hum can fill a long window.
          ElevenLabs sound-generation clips come out QUIET compared
          to its voice TTS output, so we enable
          `allowAmplificationDuringRender` to let volume exceed 1.0
          for SFX (default Remotion clamp would cap at 1). */}
      {(skit.timeline.filter((a) => a.type === 'sfx') as Extract<Action, { type: 'sfx' }>[]).map((s, i) => {
        const fromFrame = Math.round(s.startSec * fps);
        const durationFrames = Math.round((s.endSec - s.startSec) * fps);
        if (s.loop && s.loopClipSec) {
          const clipFrames = Math.max(1, Math.round(s.loopClipSec * fps));
          return (
            <Sequence
              key={`sfx-${i}-${s.startSec}`}
              from={fromFrame}
              durationInFrames={durationFrames}
            >
              <Loop durationInFrames={clipFrames}>
                <Audio src={s.audioUrl} volume={s.volume ?? 1} allowAmplificationDuringRender />
              </Loop>
            </Sequence>
          );
        }
        return (
          <Sequence
            key={`sfx-${i}-${s.startSec}`}
            from={fromFrame}
            durationInFrames={durationFrames}
          >
            <Audio src={s.audioUrl} volume={s.volume ?? 1} allowAmplificationDuringRender />
          </Sequence>
        );
      })}

      <Background bg={skit.background} />

      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        {/* 3D scene */}
        <ThreeCanvas width={width} height={height}>
          <SceneCamera camera={camera} />
          <ambientLight intensity={1.4} />
          <directionalLight position={[3, 5, 4]} intensity={1.6} />
          <directionalLight position={[-3, 2, -2]} intensity={0.5} />

          {skit.actors.map((actor) => {
            const s = actorStates[actor.id];
            if (!s.visible) return null;
            const outfit = actor.outfit ?? LEGACY_OUTFITS[actor.sprite];
            const world = pixelToWorld(s.x, s.y, width, height);
            return (
              <Character3D
                key={actor.id}
                outfit={outfit}
                position={world}
                yawRad={directionToYaw(s.direction)}
                scale={actor.scale ?? 1}
                clip={s.clip}
                clipTime={s.clipTime}
                clipLoop={s.clipLoop}
                viseme={s.viseme}
                eyes={s.eyes}
                tint={s.tint}
                opacity={s.opacity}
              />
            );
          })}
        </ThreeCanvas>

        {/* DOM overlays on top of the 3D canvas */}

        {/* Emotes above heads */}
        {activeEmotes.map((e, i) => {
          const actor = skit.actors.find((a) => a.id === e.actorId);
          const s = actorStates[e.actorId];
          if (!actor || !s || !s.visible) return null;
          const localFrame = frame - Math.floor(e.startSec * fps);
          const bob = Math.sin(localFrame * 0.3) * 10;
          const headY = s.y - CHARACTER_HEIGHT_PX * (actor.scale ?? 1) - 40 + bob;
          return (
            <div
              key={`emote-${i}`}
              style={{
                position: 'absolute',
                left: s.x,
                top: headY,
                transform: 'translate(-50%, -100%)',
                fontSize: 110,
                filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.4))',
              }}
            >
              {e.emoji}
            </div>
          );
        })}

        {/* Speech bubbles. Hidden actors (e.g. narrator) suppress their
            bubble; their audio still plays via the Audio sequence above,
            and the skit author uses a parallel popupText for the
            on-screen caption. */}
        {activeSpeaks.map((sp, i) => {
          const actor = skit.actors.find((a) => a.id === sp.actorId);
          const s = actorStates[sp.actorId];
          if (!actor || !s) return null;
          if (!s.visible) return null;
          const duration = Math.round((sp.endSec - sp.startSec) * fps);
          const localFrame = frame - Math.round(sp.startSec * fps);
          const headY = s.y - CHARACTER_HEIGHT_PX * (actor.scale ?? 1);
          const side: 'left' | 'right' =
            sp.side === 'auto' || !sp.side
              ? s.x < width / 2
                ? 'left'
                : 'right'
              : (sp.side as 'left' | 'right');
          const bubbleX = s.x + (side === 'left' ? 120 : -120);
          return (
            <SpeechBubble
              key={`speak-${i}`}
              text={sp.text}
              emoji={sp.emoji}
              tint={sp.tint}
              name={actor.name}
              x={bubbleX}
              y={headY - 40}
              side={side}
              localFrame={localFrame}
              durationFrames={duration}
            />
          );
        })}

        {/* Popup text */}
        {activePopups.map((p, i) => {
          const duration = Math.round((p.endSec - p.startSec) * fps);
          const localFrame = frame - Math.round(p.startSec * fps);
          return (
            <PopupText
              key={`pop-${i}`}
              text={p.text}
              y={p.y}
              color={p.color}
              rotate={p.rotate}
              size={p.size}
              localFrame={localFrame}
              durationFrames={duration}
            />
          );
        })}

        {/* Flash overlay */}
        {activeFlashes.map((f, i) => {
          const localSec = sec - f.startSec;
          const dur = f.endSec - f.startSec;
          const opacity = interpolate(localSec, [0, dur * 0.3, dur], [0.8, 0.2, 0], {
            extrapolateRight: 'clamp',
          });
          return (
            <AbsoluteFill
              key={`flash-${i}`}
              style={{
                background: f.color ?? 'white',
                opacity,
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Drives the R3F default perspective camera from skit camera state. Uses
 * useThree so the camera ref is the canvas's actual default — works without
 * @react-three/drei.
 */
const SceneCamera: React.FC<{ camera: CameraState }> = ({ camera }) => {
  // Lazy require so the hook is only invoked inside Canvas.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useThree } = require('@react-three/fiber');
  const { camera: cam } = useThree();
  cam.position.set(camera.position[0], camera.position[1], camera.position[2]);
  cam.fov = camera.fov ?? 35;
  cam.near = 0.1;
  cam.far = 5000;
  // Apply per-shot "up" direction (Dutch tilt) before lookAt so the
  // resulting view is rolled. Default is world up [0,1,0].
  const up = camera.up ?? [0, 1, 0];
  cam.up.set(up[0], up[1], up[2]);
  cam.updateProjectionMatrix();
  cam.lookAt(camera.lookAt[0], camera.lookAt[1], camera.lookAt[2]);
  return null;
};

// --- Timeline interpretation ---

type ActorRuntimeState = {
  x: number;
  y: number;
  direction: Direction;
  visible: boolean;
  tint?: string;
  /** 0..1. Defaults to 1. Use the `fade` action to tween across windows. */
  opacity: number;
  clip: ClipName;
  clipTime: number;
  clipLoop: boolean;
  viseme: Viseme;
  eyes: EyeSprite;
};

function computeActorStates(
  skit: Skit,
  sec: number
): Record<string, ActorRuntimeState> {
  const out: Record<string, ActorRuntimeState> = {};

  for (const actor of skit.actors) {
    const state: ActorRuntimeState = {
      x: actor.start.x,
      y: actor.start.y,
      direction: actor.facing ?? 'down',
      visible: !actor.hidden,
      opacity: 1,
      // Default to a looping idle so actors keep moving even when no
      // explicit `animate` action is firing. The clipTime tracks the
      // global `sec` so the idle loop runs continuously and the actor
      // never freezes.
      clip: 'React_Stand_Discussion_1',
      clipTime: sec,
      clipLoop: true,
      viseme: 'Lips_00',
      eyes: 'Eye_0_Default',
    };

    // Track whether the actor is currently walking — drives Walk_Loop clip.
    let walking = false;

    // Apply timeline actions that affect this actor, in order
    for (const action of skit.timeline) {
      if (action.type === 'walk' && action.actorId === actor.id) {
        if (sec < action.startSec) continue;
        if (sec >= action.startSec) {
          state.visible = true;
        }
        const from: Position = { x: state.x, y: state.y };
        const t = Math.min(
          1,
          (sec - action.startSec) / Math.max(0.001, action.endSec - action.startSec)
        );
        const eased = easeInOut(t);
        state.x = from.x + (action.to.x - from.x) * eased;
        state.y = from.y + (action.to.y - from.y) * eased;
        if (t > 0 && t < 1) {
          const dx = action.to.x - from.x;
          const dy = action.to.y - from.y;
          state.direction =
            action.facing ??
            (Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? 'right'
                : 'left'
              : dy > 0
              ? 'down'
              : 'up');
          walking = true;
          state.clip = 'Walk_Loop';
          state.clipTime = (sec - action.startSec) % 0.8; // clip is 0.8s
          state.clipLoop = true;
        } else if (t >= 1) {
          state.x = action.to.x;
          state.y = action.to.y;
        }
      }

      if (action.type === 'face' && action.actorId === actor.id) {
        if (sec >= action.atSec) {
          state.direction = action.direction;
        }
      }

      if (action.type === 'tint' && action.actorId === actor.id) {
        if (sec >= action.startSec && sec < action.endSec) {
          state.tint = action.color;
        }
      }

      if (action.type === 'fade' && action.actorId === actor.id) {
        if (sec >= action.endSec) {
          state.opacity = action.toOpacity;
        } else if (sec >= action.startSec) {
          const t = (sec - action.startSec) / Math.max(0.001, action.endSec - action.startSec);
          const eased = easeInOut(t);
          state.opacity =
            action.fromOpacity + (action.toOpacity - action.fromOpacity) * eased;
        }
      }

      if (action.type === 'animate' && action.actorId === actor.id) {
        if (sec >= action.startSec && sec < action.endSec && !walking) {
          state.clip = action.clip;
          const loop = action.loop ?? true;
          state.clipLoop = loop;
          state.clipTime = sec - action.startSec;
        }
      }

      if (action.type === 'eyes' && action.actorId === actor.id) {
        if (sec >= action.startSec && sec < action.endSec) {
          state.eyes = action.eyes;
        }
      }

      if (action.type === 'speak' && action.actorId === actor.id) {
        if (sec >= action.startSec && sec < action.endSec) {
          state.viseme = resolveViseme(action, sec);
        }
      }
    }

    out[actor.id] = state;
  }

  return out;
}

function resolveViseme(
  speak: Extract<Action, { type: 'speak' }>,
  sec: number
): Viseme {
  if (speak.visemes && speak.visemes.length > 0) {
    const local = sec - speak.startSec;
    let current: Viseme = 'Lips_00';
    for (const f of speak.visemes) {
      if (f.startSec <= local) current = f.viseme;
      else break;
    }
    return current;
  }
  // Procedural fallback (no generated visemes): cycle a few open shapes
  // at ~12Hz so the mouth still moves while the actor "speaks".
  const cycle: Viseme[] = [
    'Lips_02',
    'Lips_08',
    'Lips_06',
    'Lips_07',
  ];
  const idx = Math.floor((sec - speak.startSec) * 12) % cycle.length;
  return cycle[idx];
}

function computeCameraState(
  skit: Skit,
  sec: number,
  width: number,
  height: number
): CameraState {
  const base = skit.defaultCamera ?? defaultCameraForCanvas(width, height);
  // Find the most recent camera action with startSec ≤ sec.
  const cams = skit.timeline.filter((a) => a.type === 'camera') as Extract<
    Action,
    { type: 'camera' }
  >[];
  let prev = base;
  for (const c of cams) {
    if (sec >= c.endSec) {
      prev = c.to;
      continue;
    }
    if (sec >= c.startSec) {
      const t = (sec - c.startSec) / Math.max(0.001, c.endSec - c.startSec);
      const eased = easeInOut(t);
      return lerpCamera(prev, c.to, eased);
    }
  }
  return prev;
}

function lerpCamera(a: CameraState, b: CameraState, t: number): CameraState {
  const aUp = a.up ?? [0, 1, 0];
  const bUp = b.up ?? [0, 1, 0];
  return {
    position: [
      a.position[0] + (b.position[0] - a.position[0]) * t,
      a.position[1] + (b.position[1] - a.position[1]) * t,
      a.position[2] + (b.position[2] - a.position[2]) * t,
    ],
    lookAt: [
      a.lookAt[0] + (b.lookAt[0] - a.lookAt[0]) * t,
      a.lookAt[1] + (b.lookAt[1] - a.lookAt[1]) * t,
      a.lookAt[2] + (b.lookAt[2] - a.lookAt[2]) * t,
    ],
    fov: (a.fov ?? 35) + ((b.fov ?? 35) - (a.fov ?? 35)) * t,
    up: [
      aUp[0] + (bUp[0] - aUp[0]) * t,
      aUp[1] + (bUp[1] - aUp[1]) * t,
      aUp[2] + (bUp[2] - aUp[2]) * t,
    ],
  };
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
