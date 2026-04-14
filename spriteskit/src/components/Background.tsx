import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Background as Bg } from '../skits/types';

/**
 * Animated TikTok-style background. Gradients slowly hue-shift so the scene
 * always feels alive.
 */
export const Background: React.FC<{ bg: Bg }> = ({ bg }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shift = Math.sin((frame / fps) * 0.6) * 10;

  const gradient =
    bg.kind === 'gradient'
      ? `linear-gradient(${135 + shift}deg, ${bg.colors[0]}, ${bg.colors[1]})`
      : bg.kind === 'radial'
      ? `radial-gradient(circle at 50% ${40 + shift}%, ${bg.colors[0]}, ${bg.colors[1]})`
      : bg.color;

  return (
    <AbsoluteFill style={{ background: gradient }}>
      {/* Subtle sparkle dots — pure CSS, frame-animated */}
      <SparkleLayer />
    </AbsoluteFill>
  );
};

const SparkleLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = React.useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        x: (i * 97) % 100,
        y: (i * 53) % 100,
        size: 4 + ((i * 7) % 10),
        speed: 0.5 + ((i * 3) % 7) / 5,
      })),
    []
  );
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {dots.map((d, i) => {
        const opacity = 0.15 + 0.35 * Math.abs(Math.sin(frame * 0.05 * d.speed + i));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.size,
              height: d.size,
              borderRadius: '50%',
              background: 'white',
              opacity,
              boxShadow: '0 0 20px rgba(255,255,255,0.5)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
