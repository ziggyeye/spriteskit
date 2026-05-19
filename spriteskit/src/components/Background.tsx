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

  if (bg.kind === 'tedStage') {
    return <TedStageBackdrop />;
  }

  if (bg.kind === 'restaurant') {
    return <RestaurantBackdrop />;
  }

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

/**
 * TED-talk stage backdrop. Deep navy stage with vertical curtain
 * texture, oversized red "TED" letters offset to the upper-left
 * (deliberately cropped — the real TED brand does this too — "ED" is
 * fully visible, "T" trails off the left edge), and audience-head
 * silhouettes along the bottom edge. The red circular rug under the
 * speaker is rendered inside the 3D scene (Skit.tsx) so it scales
 * naturally with the camera.
 */
const TedStageBackdrop: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#0d1a2e' }}>
      {/* Vertical stage-curtain striping — subtle */}
      <AbsoluteFill
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0 4px, transparent 4px 14px)',
        }}
      />

      {/* Soft spotlight glow centered on stage */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 65%, rgba(255,220,180,0.18), transparent 70%)',
        }}
      />

      {/* The big red TED letters, cropped left-offset. Positioned so
          the speaker (centered in lower-right third of frame) has visual
          breathing room; "T" trails off the left edge, "ED" visible.
          Matches real TED-stage thumbnails. */}
      <div
        style={{
          position: 'absolute',
          left: '-25%',
          top: '8%',
          fontFamily: '"Helvetica Neue", Helvetica, Arial Black, sans-serif',
          fontWeight: 900,
          fontSize: 520,
          color: '#e62b1e',
          letterSpacing: -16,
          lineHeight: 1,
          textShadow: '0 8px 24px rgba(0,0,0,0.4)',
          userSelect: 'none',
        }}
      >
        TED
      </div>

      {/* Audience-head silhouettes along bottom 15% */}
      <AudienceSilhouettes />
    </AbsoluteFill>
  );
};

/**
 * Bottom-edge audience silhouettes. Generates a row of randomly-sized
 * dark blobs to suggest blurred-out heads in the front rows.
 */
const AudienceSilhouettes: React.FC = () => {
  const heads = React.useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        x: -5 + i * 8 + ((i * 11) % 4),
        size: 130 + ((i * 37) % 70),
        y: 92 + ((i * 7) % 6),
      })),
    []
  );
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {heads.map((h, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: h.size,
            height: h.size,
            borderRadius: '50% 50% 45% 45%',
            background: 'radial-gradient(ellipse at 50% 40%, #000 60%, transparent 75%)',
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/**
 * Restaurant interior backdrop. Warm amber-to-dark radial gradient
 * suggests overhead pendant lighting; soft bokeh dots at lower-third
 * height represent other diners' candle / pendant lights at distance;
 * faint horizontal stripe at the back wall hints at booth seating.
 * The 3D table + wine glasses are rendered inside the ThreeCanvas
 * (see Skit.tsx) so they sit in the same 3D space as the characters.
 */
const RestaurantBackdrop: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#1a0d08' }}>
      {/* Warm pendant-light glow centered on the dining area. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(255,180,90,0.32), rgba(255,140,60,0.10) 50%, transparent 80%)',
        }}
      />

      {/* Faint booth-back wall behind the diners (mid-frame horizon). */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '55%',
          height: '8%',
          background:
            'linear-gradient(to bottom, rgba(60,30,15,0.4), rgba(40,20,10,0.6))',
          borderTop: '2px solid rgba(80,45,25,0.5)',
          borderBottom: '2px solid rgba(20,10,5,0.6)',
        }}
      />

      {/* Bokeh dots representing other tables' candles in the distance. */}
      <RestaurantBokeh />

      {/* Subtle vignette to push focus to the center. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.45) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Static bokeh dots for the restaurant backdrop. Warm pinpricks at
 * varying sizes scattered across the mid-back of the frame — reads
 * as "other tables exist somewhere over there." Deterministic
 * positioning (no animation) so it doesn't pull focus.
 */
const RestaurantBokeh: React.FC = () => {
  const dots = React.useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        // Spread evenly across the horizontal back of the frame.
        x: 4 + (i * 92) / 21 + (((i * 17) % 7) - 3),
        // Concentrate in the upper-back zone (y 25-50%), behind where
        // the characters' heads will be.
        y: 25 + ((i * 13) % 25),
        size: 10 + ((i * 7) % 22),
        opacity: 0.25 + ((i * 11) % 30) / 100,
      })),
    []
  );
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            borderRadius: '50%',
            background: '#ffb456',
            opacity: d.opacity,
            boxShadow: `0 0 ${d.size * 1.8}px ${d.size / 2}px rgba(255,180,90,0.55)`,
          }}
        />
      ))}
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
