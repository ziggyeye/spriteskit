import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

type Props = {
  text: string;
  y?: number;
  color?: string;
  rotate?: number;
  size?: number;
  localFrame: number;
  durationFrames: number;
};

/** TikTok-caption-style pop-up text. Rubber-bands in, wobbles, then snaps out. */
export const PopupText: React.FC<Props> = ({
  text,
  y = 0.2,
  color = '#FFEE00',
  rotate = -4,
  size = 140,
  localFrame,
  durationFrames,
}) => {
  const { fps } = useVideoConfig();
  const popIn = spring({ fps, frame: localFrame, config: { damping: 8, stiffness: 220, mass: 0.6 } });
  const popOut = spring({
    fps,
    frame: Math.max(0, localFrame - (durationFrames - 8)),
    config: { damping: 14, stiffness: 260, mass: 0.4 },
  });
  const scale = popIn * (1 - popOut * 0.95);
  const wobble = Math.sin(localFrame * 0.4) * 2;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${y * 100}%`,
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate + wobble * 0.2}deg)`,
        width: '100%',
        textAlign: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          fontFamily: 'Impact, "Arial Black", system-ui, sans-serif',
          fontWeight: 900,
          fontSize: size,
          color,
          letterSpacing: 2,
          textTransform: 'uppercase',
          WebkitTextStroke: '8px #111',
          textShadow:
            '0 0 0 #111, 14px 14px 0 #111, 0 0 40px rgba(255,230,0,0.5)',
          padding: '0 24px',
        }}
      >
        {text}
      </div>
    </div>
  );
};
