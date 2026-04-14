import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Sequence,
} from 'remotion';
import { Background } from '../components/Background';
import { Character } from '../components/Character';
import { SpeechBubble } from '../components/SpeechBubble';
import { PopupText } from '../components/PopupText';
import type { Action, Direction, Position, Skit } from './types';

/** Renders any Skit data object into a Remotion video. */
export const SkitComp: React.FC<{ skit: Skit }> = ({ skit }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const sec = frame / fps;

  // Compute per-actor state by walking the timeline up to `sec`.
  const actorStates = computeActorStates(skit, sec);

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

  // Compute camera shake
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
            <Audio src={sp.audioUrl} />
          </Sequence>
        );
      })}

      <Background bg={skit.background} />
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        {/* Ground shadow per actor */}
        {skit.actors.map((actor) => {
          const s = actorStates[actor.id];
          if (!s.visible) return null;
          return (
            <GroundShadow
              key={`shadow-${actor.id}`}
              x={s.x}
              y={s.y}
              scale={actor.scale ?? 1}
            />
          );
        })}

        {/* Actors */}
        {skit.actors.map((actor) => {
          const s = actorStates[actor.id];
          if (!s.visible) return null;
          return (
            <Character
              key={actor.id}
              sprite={actor.sprite}
              direction={s.direction}
              x={s.x}
              y={s.y}
              scale={actor.scale ?? 1}
              tint={s.tint}
            />
          );
        })}

        {/* Emotes above heads */}
        {activeEmotes.map((e, i) => {
          const actor = skit.actors.find((a) => a.id === e.actorId);
          const s = actorStates[e.actorId];
          if (!actor || !s || !s.visible) return null;
          const localFrame = frame - Math.floor(e.startSec * fps);
          const bob = Math.sin(localFrame * 0.3) * 10;
          const headY = s.y - 72 * 4 * (actor.scale ?? 1) - 40 + bob;
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

        {/* Speech bubbles */}
        {activeSpeaks.map((sp, i) => {
          const actor = skit.actors.find((a) => a.id === sp.actorId);
          const s = actorStates[sp.actorId];
          if (!actor || !s) return null;
          const duration = Math.round((sp.endSec - sp.startSec) * fps);
          const localFrame = frame - Math.round(sp.startSec * fps);
          const headY = s.y - 72 * 4 * (actor.scale ?? 1);
          // Place bubble above actor's head; offset left/right so it doesn't overlap
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

const GroundShadow: React.FC<{ x: number; y: number; scale: number }> = ({
  x,
  y,
  scale,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y - 12,
      transform: 'translate(-50%, -50%)',
      width: 160 * scale,
      height: 30 * scale,
      borderRadius: '50%',
      background: 'rgba(0,0,0,0.35)',
      filter: 'blur(6px)',
    }}
  />
);

// --- Timeline interpretation ---

type ActorRuntimeState = {
  x: number;
  y: number;
  direction: Direction;
  visible: boolean;
  tint?: string;
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
    };

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
    }

    out[actor.id] = state;
  }

  return out;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
