import React from 'react';
import { Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Direction, SpriteId } from '../skits/types';

const SPRITE_SIZE = 72;
const FRAMES_PER_ROW = 4;

const SPRITE_FILES: Record<SpriteId, string> = {
  dave: 'Character_024_Idle.png',
  alex: 'Character_035_Idle.png',
  boss: 'FD_Character_001_Idle.png',
  janitor: 'FD_Character_003_Idle.png',
  intern: 'FD_Character_016_Idle.png',
};

const DIRECTION_ROWS: Record<Direction, number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

type Props = {
  sprite: SpriteId;
  direction: Direction;
  /** center-x, bottom-y in composition pixels */
  x: number;
  y: number;
  /** Multiplier over the 4x baseline */
  scale?: number;
  /** Idle animation speed (frames per sprite frame). Default 10 */
  idleSpeed?: number;
  tint?: string;
  squash?: number;
};

/**
 * Sprite character that automatically plays the 4-frame idle loop for the
 * current direction. Positioning: (x, y) is the CENTER-BOTTOM of the sprite
 * (so "y" is where the feet land).
 */
export const Character: React.FC<Props> = ({
  sprite,
  direction,
  x,
  y,
  scale = 1,
  idleSpeed = 10,
  tint,
  squash = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps: _fps } = useVideoConfig();
  const row = DIRECTION_ROWS[direction];
  const col = Math.floor(frame / idleSpeed) % FRAMES_PER_ROW;

  const baseScale = 4 * scale; // 72 * 4 = 288px — readable on TikTok canvas
  const displaySize = SPRITE_SIZE * baseScale;

  // Subtle breathing bob
  const bob = Math.sin(frame * 0.2) * 2 * scale + squash;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - displaySize / 2,
        top: y - displaySize + bob,
        width: displaySize,
        height: displaySize,
        overflow: 'hidden',
        imageRendering: 'pixelated',
        filter: tint ? `drop-shadow(0 0 30px ${tint})` : undefined,
      }}
    >
      <Img
        src={staticFile(SPRITE_FILES[sprite])}
        style={{
          position: 'absolute',
          left: -col * displaySize,
          top: -row * displaySize,
          width: displaySize * FRAMES_PER_ROW,
          height: displaySize * FRAMES_PER_ROW,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
