/**
 * "Are You Okay?" — 45s deadpan comedy skit.
 *
 * A two-shot. Jenna has been watching Marcus zone out for nine minutes.
 * She quietly panics. He's been thinking about whether a hot dog is a
 * sandwich.
 *
 * Beats:
 *   0:00–0:01.5  HOOK two-shot + caption "he's been like this for nine minutes."
 *   0:01.5–0:04  Jenna: "...babe?"
 *   0:04–0:10    Slow push on Marcus (dead air, one blink).
 *   0:10–0:13    Jenna: "Are you mad at me?"
 *   0:13–0:14    Marcus: "No." (monotone)
 *   0:15.5–0:22  Slow push on Jenna's face, 4-emotion flicker.
 *   0:22–0:28    ECU on Jenna: "What are you thinking about." (whispered)
 *   0:28.5       DUTCH-TILT SNAP to ECU on Marcus. Shake + flash.
 *   0:29.5–0:33  Marcus: "If a hot dog is a sandwich." (deadpan)
 *   0:35         Cut back to level two-shot. Jenna: React_Jump_Joy + "RELIEF".
 *   0:42–0:44.5  Marcus: "I've decided it isn't." (still monotone)
 *   0:44.8       Flash to black.
 */

import type { Skit, Action } from '../types';
import { eyeBlinkAt, eyeStarryLoopAt } from '../eyeSequences';
import { VOICE_IDS } from '../../services/voiceIds';

const FLOOR = 1500;
// Spacing math: characters are ~655 px wide at scale 1.0. Minimum
// center-to-centre to avoid intersection is ~557 px. We use 640 px for
// breathing room, which puts each actor near a side of the frame and
// leaves the negative space between them readable as awkward distance.
const MARCUS_X = 860; // skit-pixel; world x ≈ +0.667
const JENNA_X = 220; // skit-pixel; world x ≈ -0.667. Centre-to-centre 640 px.

/**
 * Camera framing math reference (1080×1920 portrait, aspect 0.5625):
 *   horizontal-visible = 1.125 * d * tan(fovV/2).
 *   Eye line ≈ 1.83 world units. lookAt y for face shots = 1.83.
 *
 *   Actors at world x = ±0.667 (640 px apart). Two-shot needs
 *   horiz-visible ≈ 2.5 units → fov 35°, d ≈ 7.0 ✓
 *
 *   ECU face: visible-vertical ≈ 0.55 → fov 22°, d 1.5 ✓
 *
 *   180° line: Jenna on screen-left, Marcus on screen-right. Camera
 *   stays on the +Z side throughout — never crosses.
 *
 *   This skit leans hard into ANGLE variety to feel cinematic instead
 *   of stage-play. Shots include high-angle isometric, low-angle
 *   3/4, over-the-shoulder, and one extreme worm's-eye on the punch.
 */
const cameraTimeline: Action[] = [
  // 0:00 HOOK — HIGH-ANGLE ISOMETRIC. Camera up & offset, looking down
  // diagonally on both actors. Reads as "we are watching this scene
  // from outside, like a surveillance camera". Eye-level shots feel
  // domestic; this feels observational.
  {
    type: 'camera',
    to: { position: [2.4, 3.6, 5.6], lookAt: [0, 1.4, 0], fov: 32 },
    startSec: 0,
    endSec: 0.05,
  },

  // 4.0–10.0 SLOW PUSH to LOW-ANGLE 3/4 on Marcus. Camera below his
  // eye line, offset to his right. He looms in frame. Position-only
  // tween from the iso opening — the camera "moves through space"
  // into the shot, not just zooms.
  {
    type: 'camera',
    to: { position: [1.6, 0.9, 2.0], lookAt: [0.667, 1.6, 0], fov: 32 },
    startSec: 4.0,
    endSec: 10.0,
  },

  // 10.0 HARD CUT to OVER-THE-SHOULDER from behind Marcus, framing
  // Jenna. Marcus's silhouette occupies foreground left; Jenna's
  // face on the right-third. Camera positioned just past Marcus's
  // shoulder height.
  {
    type: 'camera',
    to: { position: [1.2, 1.65, 1.4], lookAt: [-0.667, 1.7, 0], fov: 34 },
    startSec: 10.0,
    endSec: 10.05,
  },

  // 15.5–22.0 SLOW PUSH to LOW-ANGLE on Jenna. Camera drops below
  // her eye line and pushes in — her panic escalating reads as
  // "looming over us". Different angle than the OTS we cut from.
  {
    type: 'camera',
    to: { position: [-1.5, 0.8, 1.8], lookAt: [-0.667, 1.6, 0], fov: 30 },
    startSec: 15.5,
    endSec: 22.0,
  },

  // 22.0–28.0 CONTINUED push to a 3/4 ECU on Jenna. Camera offset on
  // both X and Z so we see her face dimensionally, not flat. Held
  // through the whispered "what are you thinking about".
  {
    type: 'camera',
    to: { position: [-1.0, 1.83, 1.2], lookAt: [-0.667, 1.83, 0], fov: 24 },
    startSec: 22.0,
    endSec: 28.0,
  },

  // 28.5 THE DUTCH SNAP — hard cut to ECU on Marcus's face with ~14°
  // roll. The KEY shot. Camera on his side at eye level.
  {
    type: 'camera',
    to: {
      position: [0.667, 1.83, 2.2],
      lookAt: [0.667, 1.83, 0],
      fov: 24,
      up: [0.25, 1, 0],
    },
    startSec: 28.5,
    endSec: 28.55,
  },

  // 35.0 HARD CUT back to HIGH-ANGLE ISOMETRIC (echoes the open).
  // Horizon restored. Reads as "we're observing them from outside
  // again" — perfect frame for Jenna's joy-jump as a sight gag.
  {
    type: 'camera',
    to: {
      position: [2.4, 3.6, 5.6],
      lookAt: [0, 1.4, 0],
      fov: 32,
      up: [0, 1, 0],
    },
    startSec: 35.0,
    endSec: 35.05,
  },

  // 42.0–44.5 PUSH to EXTREME LOW-ANGLE / worm's-eye on Marcus. Camera
  // near the floor, looking up at his deadpan face. He's monumentally
  // unbothered. Final shot of the bit.
  {
    type: 'camera',
    to: { position: [0.667, 0.3, 1.8], lookAt: [0.667, 1.83, 0], fov: 38 },
    startSec: 42.0,
    endSec: 44.5,
  },
];

export const areYouOkay: Skit = {
  id: 'AreYouOkay',
  title: 'Are You Okay?',
  durationInSeconds: 45,
  fps: 30,
  width: 1080,
  height: 1920,
  background: {
    // Dim teal kitchen at 1am, pooling into near-black corners.
    kind: 'radial',
    colors: ['#1a2030', '#070910'],
  },
  actors: [
    {
      id: 'a',
      sprite: 'dave',
      name: 'Marcus',
      start: { x: MARCUS_X, y: FLOOR },
      // Both actors face the camera (down) the whole skit. He's
      // staring into space, not at her — the deadpan reads when his
      // face is visible. She's facing the audience too, eyes on him
      // implied via animation pose.
      facing: 'down',
      scale: 1.0,
      outfit: {
        top: 'Clothes_Top_Tshirt',
        bottom: 'Clothes_Legs_Pants_Long',
        hair: 'Hair_Short',
        beard: 'Beard_Lower',
        skinTone: 'Skintone_4',
        hairColor: 'Haircolour_03',
        topColor: 'Grey',
        legColor: 'Machine_Black',
        shoesColor: 'Espresso',
      },
    },
    {
      id: 'b',
      sprite: 'alex',
      name: 'Jenna',
      start: { x: JENNA_X, y: FLOOR },
      facing: 'down',
      scale: 1.0,
      outfit: {
        top: 'Clothes_Top_Tshirt',
        bottom: 'Clothes_Legs_Pants_Long',
        hair: 'Hair_Ponytail',
        skinTone: 'Skintone_2',
        hairColor: 'Haircolour_07',
        topColor: 'Milkshake_Strawberry',
        legColor: 'Porcelain_Blue',
        shoesColor: 'Paper',
      },
    },
  ],
  timeline: [
    ...cameraTimeline,

    // --- HOOK (0:00–0:01.5) ---
    { type: 'popupText', text: "he's been like this\nfor nine minutes.", startSec: 0.2, endSec: 1.5, y: 0.12, color: '#e8e8e8', size: 70 },

    // Marcus is zoned out for the entire skit until the reveal. We
    // play the clip once and FREEZE on its end pose — loop: false on
    // a long window holds the last frame. Result: he visibly settles
    // into the thinking pose, then stops moving entirely. Reads
    // exactly like "dissociated".
    { type: 'animate', actorId: 'a', clip: 'React_Stand_Thinking', startSec: 0, endSec: 28.5, loop: false },
    { type: 'eyes', actorId: 'a', eyes: 'Eye_Flat', startSec: 0, endSec: 28.5 },

    // Cool blue tint on Marcus reads as "mentally gone." Fades on the
    // Dutch snap when he comes back online.
    { type: 'tint', actorId: 'a', color: '#3a5d8a', startSec: 0, endSec: 28.5 },

    // The lone blink that's the only sign of life during the dead-air push.
    ...eyeBlinkAt('a', 7.2),

    // Jenna's worried baseline. Chain distinct non-looped clips so she
    // visibly moves through phases of concern instead of looping the
    // same gesture. CrossedArms_Thinking is 1.7s — it lands a beat, we
    // hold the end pose for a couple of seconds, then switch.
    { type: 'animate', actorId: 'b', clip: 'React_CrossedArms_Thinking', startSec: 0, endSec: 4.0, loop: false },
    { type: 'animate', actorId: 'b', clip: 'React_Stand_Thinking', startSec: 4.0, endSec: 8.0, loop: false },
    { type: 'animate', actorId: 'b', clip: 'React_CrossArms', startSec: 8.0, endSec: 10.0, loop: false },

    // --- BEAT 1a (1.5–4.0): "...babe?" ---
    {
      type: 'speak',
      actorId: 'b',
      text: '...babe?',
      voiceId: VOICE_IDS.jessica,
      startSec: 2.0,
      endSec: 3.0,
      volume: 2.0,
    },

    // --- BEAT 1b (4.0–10.0): dead air, slow push on Marcus ---
    { type: 'eyes', actorId: 'b', eyes: 'Eye_Frustrated', startSec: 6.0, endSec: 10.0 },

    // --- BEAT 2a (10.0–13.0): "Are you mad at me?" ---
    // Hold crossed arms for the line + the no-response silence.
    { type: 'animate', actorId: 'b', clip: 'React_CrossArms', startSec: 10.0, endSec: 15.5, loop: false },
    { type: 'eyes', actorId: 'b', eyes: 'Eye_Sad Cry', startSec: 10.0, endSec: 15.5 },
    {
      type: 'speak',
      actorId: 'b',
      text: 'Are you mad at me?',
      voiceId: VOICE_IDS.jessica,
      startSec: 10.2,
      endSec: 12.2,
      volume: 2.0,
    },

    // --- BEAT 2b (13.0–15.5): "No." ---
    {
      type: 'speak',
      actorId: 'a',
      text: 'No.',
      voiceId: VOICE_IDS.daniel,
      startSec: 13.5,
      endSec: 14.2,
      volume: 2.0,
    },

    // --- BEAT 2c (15.5–22.0): Jenna's 4-emotion flicker, then hold ---
    { type: 'animate', actorId: 'b', clip: 'React_CrossArms_ShakeNO', startSec: 17.2, endSec: 18.7 },
    // Sub-second eye + mouth swaps — 4 emotions in quick succession.
    { type: 'eyes', actorId: 'b', eyes: 'Eye_Sad Cry', startSec: 16.0, endSec: 16.6 },
    { type: 'eyes', actorId: 'b', eyes: 'Eye_Frustrated', startSec: 16.6, endSec: 17.2 },
    { type: 'eyes', actorId: 'b', eyes: 'Eye_0_Default', startSec: 17.2, endSec: 17.8 },
    { type: 'eyes', actorId: 'b', eyes: 'Eye_Sad Cry', startSec: 17.8, endSec: 28.5 },

    // After her flicker, settle on crossed arms for the whisper.
    // Chain another distinct beat at 23s so she's not visibly stuck.
    { type: 'animate', actorId: 'b', clip: 'React_CrossArms', startSec: 18.7, endSec: 23.0, loop: false },
    { type: 'animate', actorId: 'b', clip: 'React_CrossedArms_Thinking', startSec: 23.0, endSec: 28.5, loop: false },

    // --- BEAT 3a (22.0–28.0): "What are you thinking about." ---
    {
      type: 'speak',
      actorId: 'b',
      text: 'What are you thinking about.',
      voiceId: VOICE_IDS.jessica,
      startSec: 22.5,
      endSec: 25.0,
      // Whispered — relative to other dialogue at vol 2.0, this still
      // reads as quieter while remaining audible.
      volume: 1.3,
    },

    // --- BEAT 3b (28.0–35.0): THE REVEAL ---
    // Marcus finally moves — uncrosses out of zone-out, comes back online.
    { type: 'animate', actorId: 'a', clip: 'React_CrossArms', startSec: 28.5, endSec: 35.0, loop: false },
    { type: 'eyes', actorId: 'a', eyes: 'Eye_0_Default', startSec: 28.5, endSec: 45 },
    // Subtle white pop on the Dutch snap.
    { type: 'flash', startSec: 28.9, endSec: 29.1, color: '#ffffff' },
    // Camera shake on the snap impact.
    { type: 'shake', startSec: 28.8, endSec: 29.2, intensity: 6 },

    {
      type: 'speak',
      actorId: 'a',
      text: 'If a hot dog is a sandwich.',
      voiceId: VOICE_IDS.daniel,
      startSec: 29.5,
      endSec: 33.0,
      volume: 2.0,
    },

    // --- PUNCHLINE (35.0–42.0): Jenna's relief ---
    { type: 'animate', actorId: 'b', clip: 'React_Jump_Joy', startSec: 35.2, endSec: 36.1 },
    // After the jump, freeze her on the joy pose.
    { type: 'eyes', actorId: 'b', eyes: 'Eye_Starry1', startSec: 35.2, endSec: 45 },
    ...eyeStarryLoopAt('b', 35.2, 2.5, 0.15),
    { type: 'popupText', text: 'RELIEF', startSec: 35.5, endSec: 37.0, y: 0.14, color: '#ffd76b', size: 160, rotate: -4 },
    // Marcus stays exactly as he is — back to React_Stand_Thinking-ish
    // deadpan after the punchline lands. Single play, hold end pose.
    { type: 'animate', actorId: 'a', clip: 'React_Stand_Thinking', startSec: 35.0, endSec: 45, loop: false },
    { type: 'eyes', actorId: 'a', eyes: 'Eye_Flat', startSec: 36.0, endSec: 45 },

    // --- BUTTON (42.0–44.5): "I've decided it isn't." ---
    {
      type: 'speak',
      actorId: 'a',
      text: "I've decided it isn't.",
      voiceId: VOICE_IDS.daniel,
      startSec: 42.2,
      endSec: 44.5,
      volume: 2.0,
    },

    // Cut to black on the final beat.
    { type: 'flash', startSec: 44.8, endSec: 45, color: '#000000' },
  ],
};
