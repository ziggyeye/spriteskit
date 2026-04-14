import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

type Props = {
  text: string;
  x: number;
  y: number;
  side?: 'left' | 'right';
  emoji?: string;
  tint?: string;
  name?: string;
  /** Frame within the speech action (0 = first frame of speaking) */
  localFrame: number;
  /** Total duration of the speech in frames */
  durationFrames: number;
};

/**
 * Pop-in TikTok-style speech bubble with a fat drop shadow and a tail.
 * Text types in character-by-character for the first ~40% of its duration.
 */
export const SpeechBubble: React.FC<Props> = ({
  text,
  x,
  y,
  side = 'left',
  emoji,
  tint,
  name,
  localFrame,
  durationFrames,
}) => {
  const { fps } = useVideoConfig();

  // Pop-in spring at start
  const popIn = spring({
    fps,
    frame: localFrame,
    config: { damping: 10, stiffness: 180, mass: 0.6 },
  });
  // Pop-out at end
  const popOut = spring({
    fps,
    frame: Math.max(0, localFrame - (durationFrames - 8)),
    config: { damping: 12, stiffness: 200, mass: 0.4 },
  });
  const scale = popIn * (1 - popOut * 0.95);

  // Typewriter — reveal text over first 40% of duration
  const typeFrames = Math.max(12, Math.floor(durationFrames * 0.4));
  const revealCount = Math.min(
    text.length,
    Math.floor(interpolate(localFrame, [4, 4 + typeFrames], [0, text.length], { extrapolateRight: 'clamp' }))
  );
  const shown = text.slice(0, revealCount);

  const wobble = Math.sin(localFrame * 0.3) * 2;

  const bubbleColor = tint ?? '#ffffff';
  const textColor = '#1a1a1a';

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -100%) scale(${scale}) rotate(${wobble * 0.15}deg)`,
        transformOrigin: side === 'left' ? '20% 100%' : '80% 100%',
        pointerEvents: 'none',
      }}
    >
      {name && (
        <div
          style={{
            position: 'absolute',
            top: -52,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#000',
            color: '#fff',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            fontWeight: 900,
            padding: '4px 14px',
            borderRadius: 999,
            fontSize: 28,
            letterSpacing: 1,
            whiteSpace: 'nowrap',
            border: '3px solid white',
          }}
        >
          {name}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          background: bubbleColor,
          color: textColor,
          padding: '28px 38px',
          borderRadius: 42,
          border: '6px solid #111',
          boxShadow: '10px 12px 0 #111, 0 0 60px rgba(255,255,255,0.2)',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          fontWeight: 900,
          fontSize: 58,
          lineHeight: 1.15,
          minWidth: 260,
          maxWidth: 760,
          textAlign: 'center',
          letterSpacing: 0.5,
        }}
      >
        {shown}
        {emoji && <span style={{ marginLeft: 12, fontSize: 64 }}>{emoji}</span>}
        {/* Tail */}
        <div
          style={{
            position: 'absolute',
            bottom: -34,
            [side === 'left' ? 'left' : 'right']: 60,
            width: 0,
            height: 0,
            borderLeft: side === 'left' ? '0 solid transparent' : '38px solid transparent',
            borderRight: side === 'right' ? '0 solid transparent' : '38px solid transparent',
            borderTop: `42px solid #111`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -22,
            [side === 'left' ? 'left' : 'right']: 68,
            width: 0,
            height: 0,
            borderLeft: side === 'left' ? '0 solid transparent' : '28px solid transparent',
            borderRight: side === 'right' ? '0 solid transparent' : '28px solid transparent',
            borderTop: `32px solid ${bubbleColor}`,
          }}
        />
      </div>
    </div>
  );
};
