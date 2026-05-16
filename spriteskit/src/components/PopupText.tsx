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

  // Lower-third subtitles (small) get a legibility-first style; big meme
  // cards keep the chunky Impact-uppercase-yellow-glow look.
  const isCaption = size < 90;
  const stroke = isCaption ? Math.max(2, Math.round(size / 18)) : 8;
  const dropOffset = isCaption ? Math.max(2, Math.round(size / 22)) : 14;
  const textShadow = isCaption
    ? `${dropOffset}px ${dropOffset}px 0 #111, 0 0 ${Math.round(size / 4)}px rgba(0,0,0,0.85)`
    : '0 0 0 #111, 14px 14px 0 #111, 0 0 40px rgba(255,230,0,0.5)';

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
          fontFamily: isCaption
            ? '"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif'
            : 'Impact, "Arial Black", system-ui, sans-serif',
          fontWeight: isCaption ? 700 : 900,
          fontSize: size,
          color,
          letterSpacing: isCaption ? 0 : 2,
          lineHeight: isCaption ? 1.15 : 1.0,
          textTransform: isCaption ? 'none' : 'uppercase',
          WebkitTextStroke: `${stroke}px #111`,
          textShadow,
          padding: '0 24px',
          whiteSpace: 'pre-line',
        }}
      >
        {text}
      </div>
    </div>
  );
};
