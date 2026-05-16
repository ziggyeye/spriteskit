/**
 * "TED Talk: How I Made This Video" — 75s meta-monologue.
 *
 * A single 3D character (Marcus) on an implied TED stage gives an
 * earnest, technically-specific talk about the spriteskit engine
 * that's animating him.
 *
 * Beats (v5):
 *   0:00–0:11  HOOK — name + premise.
 *   0:11–0:25  Feature 1: characters & wardrobe ("53 bones, 300 outfits").
 *   0:25–0:35  Feature 2: animation library ("17 motion clips").
 *   0:35–0:50  Feature 3: cinematic camera. Rule-of-three on wide/close/profile.
 *              Dutch tilt + bird/worm beat. "FOV, position, roll — independently."
 *   0:50–0:60  Feature 4: voice & sync — synthesized voice, phoneme alignment.
 *   0:60–0:67  THE NUMBER. "20 minutes" punch + flash, held silence.
 *   0:67–0:75  Thesis: short-form video used to need a crew. Now: laptop + idea.
 *              Fourth-wall break: "Wait. Did I just rehearse this?"
 */

import type { Skit, Action } from '../types';
import { VOICE_IDS } from '../../services/voiceIds';

const FLOOR = 1500;
const SPEAKER_X = 540; // skit-pixel → world x = 0

const cameraTimeline: Action[] = [
  // 0:00 HARD CUT — wide-medium eye-level, slight 3/4 (+x side). Establish.
  { type: 'camera', to: { position: [1.2, 1.6, 4.6], lookAt: [0, 1.55, 0], fov: 32 }, startSec: 0.0, endSec: 0.05 },

  // 0:02.2 HARD CUT — mirror 3/4 (-x side). "I don't exist."
  { type: 'camera', to: { position: [-1.2, 1.6, 4.6], lookAt: [0, 1.55, 0], fov: 32 }, startSec: 2.2, endSec: 2.25 },

  // 0:06 SLOW 4s PUSH — "rendered this morning, in twenty minutes."
  { type: 'camera', to: { position: [-0.7, 1.65, 3.2], lookAt: [0, 1.65, 0], fov: 32 }, startSec: 6.0, endSec: 10.0 },

  // 0:10 HARD CUT — centered medium head-and-shoulders. "show you how."
  { type: 'camera', to: { position: [0, 1.75, 2.7], lookAt: [0, 1.7, 0], fov: 26 }, startSec: 10.0, endSec: 10.05 },

  // 0:11.5 HARD CUT — full body wide. "Start with me." Shows the wardrobe.
  { type: 'camera', to: { position: [0, 1.4, 5.4], lookAt: [0, 1.2, 0], fov: 38 }, startSec: 11.5, endSec: 11.55 },

  // 0:13.5 SLOW 4s PUSH onto torso — "53 bones, shared across every outfit"
  { type: 'camera', to: { position: [0, 1.5, 3.2], lookAt: [0, 1.4, 0], fov: 30 }, startSec: 13.5, endSec: 17.5 },

  // 0:18 HARD CUT — 3/4 medium. "Hair, glasses, shirt, trousers — 300 combinations."
  { type: 'camera', to: { position: [0.9, 1.6, 3.4], lookAt: [0, 1.5, 0], fov: 30 }, startSec: 18.0, endSec: 18.05 },

  // 0:22.5 HARD CUT — closer medium. "Swap any of it, the animation still fits."
  { type: 'camera', to: { position: [-0.5, 1.78, 2.4], lookAt: [0, 1.72, 0], fov: 28 }, startSec: 22.5, endSec: 22.55 },

  // 0:25 HARD CUT — wider, eye level. "Speaking of which —"
  { type: 'camera', to: { position: [0, 1.7, 3.6], lookAt: [0, 1.6, 0], fov: 30 }, startSec: 25.0, endSec: 25.05 },

  // 0:26.5 HARD CUT — medium 3/4 mirror. "17 motion clips drive everything I do."
  { type: 'camera', to: { position: [-0.9, 1.7, 3.0], lookAt: [0, 1.65, 0], fov: 30 }, startSec: 26.5, endSec: 26.55 },

  // 0:30.5 HARD CUT — low-angle hero. "Discussion. Thinking. Yes. Thumbs up."
  { type: 'camera', to: { position: [0, 0.5, 3.4], lookAt: [0, 1.6, 0], fov: 32 }, startSec: 30.5, endSec: 30.55 },

  // 0:33.5 HARD CUT — high 3/4 overhead lean. "All composed on a timeline — to the frame."
  { type: 'camera', to: { position: [1.2, 2.8, 3.2], lookAt: [0, 1.5, 0], fov: 30 }, startSec: 33.5, endSec: 33.55 },

  // 0:41.7 HARD CUT — centered medium head-and-shoulders. "Now look at the camera."
  { type: 'camera', to: { position: [0, 1.78, 2.5], lookAt: [0, 1.75, 0], fov: 26 }, startSec: 41.7, endSec: 41.75 },

  // 0:43.6 HARD CUT — behind-the-shoulder reverse. "It is never still."
  { type: 'camera', to: { position: [-0.6, 1.95, -1.6], lookAt: [0.2, 1.83, 0.8], fov: 30 }, startSec: 43.6, endSec: 43.65 },

  // 0:45.1 HARD CUT on "Wide!" — full body + headroom.
  { type: 'camera', to: { position: [0, 1.6, 5.2], lookAt: [0, 1.4, 0], fov: 38 }, startSec: 45.1, endSec: 45.15 },

  // 0:46.0 HARD CUT on "Close!" — head-and-shoulders close, centered.
  { type: 'camera', to: { position: [0, 1.83, 2.2], lookAt: [0, 1.83, 0], fov: 22 }, startSec: 46.0, endSec: 46.05 },

  // 0:46.9 HARD CUT on "Profile!" — true side-on (+x).
  { type: 'camera', to: { position: [3.4, 1.6, 0], lookAt: [0, 1.55, 0], fov: 30 }, startSec: 46.9, endSec: 46.95 },

  // 0:47.8 HARD CUT — BIRD'S-EYE.
  { type: 'camera', to: { position: [0, 5.2, 0.01], lookAt: [0, 0.875, 0], fov: 32 }, startSec: 47.8, endSec: 47.85 },

  // 0:48.7 HARD CUT — WORM'S-EYE, near floor.
  { type: 'camera', to: { position: [0, 0.2, 1.6], lookAt: [0, 1.9, 0], fov: 38 }, startSec: 48.7, endSec: 48.75 },

  // 0:49.7 HARD CUT — DUTCH TILT.
  { type: 'camera', to: { position: [0.3, 1.83, 1.9], lookAt: [0, 1.83, 0], fov: 28, up: [0.31, 0.95, 0] }, startSec: 49.7, endSec: 49.75 },

  // 0:50.6 SLOW 3.9s DOLLY-ZOOM — push in while widening fov.
  // Demonstrates "FOV, position, roll — all tween independently."
  { type: 'camera', to: { position: [0, 1.78, 1.8], lookAt: [0, 1.75, 0], fov: 40, up: [0, 1, 0] }, startSec: 50.6, endSec: 54.5 },

  // 0:54.6 HARD CUT — 3/4 medium emotional close. "Every shot — chosen — for you."
  { type: 'camera', to: { position: [-0.6, 1.83, 2.0], lookAt: [0, 1.78, 0], fov: 28 }, startSec: 54.6, endSec: 54.65 },

  // 0:57.6 HARD CUT — mouth-focused ECU. "And this voice?"
  // Portrait math: d=2.0, fov 18° → visible horizontal ≈ 0.36 — mouth fills frame.
  { type: 'camera', to: { position: [0, 1.72, 2.0], lookAt: [0, 1.72, 0], fov: 18 }, startSec: 57.6, endSec: 57.65 },

  // 0:58.6 HOLD on mouth — "Synthesized. Aligned to my mouth by phoneme." (visemes carry the shot.)

  // 0:62 SLOW 2s PULL BACK to wide-medium — calm before the punch.
  { type: 'camera', to: { position: [0, 1.7, 3.4], lookAt: [0, 1.6, 0], fov: 32 }, startSec: 62.0, endSec: 64.0 },

  // 0:65.6 HARD CUT — head-and-shoulders close. "All of this — took twenty minutes."
  { type: 'camera', to: { position: [0, 1.83, 2.4], lookAt: [0, 1.8, 0], fov: 24 }, startSec: 65.6, endSec: 65.65 },

  // 0:67 HARD CUT — wide. The "20 MINUTES" card lands here.
  { type: 'camera', to: { position: [0, 1.6, 4.6], lookAt: [0, 1.5, 0], fov: 32 }, startSec: 67.0, endSec: 67.05 },

  // 0:69.1 HARD CUT — HELD WIDE for thesis. "Short-form video used to take..."
  { type: 'camera', to: { position: [0, 1.5, 5.4], lookAt: [0, 1.3, 0], fov: 38 }, startSec: 69.1, endSec: 69.15 },

  // 0:72.6 HARD CUT — slight low-angle medium. "Now? A laptop. And a good idea."
  { type: 'camera', to: { position: [0, 1.2, 3.0], lookAt: [0, 1.7, 0], fov: 32 }, startSec: 72.6, endSec: 72.65 },

  // 0:74 SLOW 1s PUSH — emotional landing.
  { type: 'camera', to: { position: [0, 1.3, 2.4], lookAt: [0, 1.7, 0], fov: 30 }, startSec: 74.0, endSec: 75.0 },
];

const dialogue: Action[] = [
  // === Beat 1: Hook & premise (0:00–0:11) ===
  { type: 'speak', actorId: 'speaker', text: 'Good evening!', voiceId: VOICE_IDS.brian, startSec: 0.4, endSec: 2.2, volume: 2.0 },
  { type: 'popupText', text: 'Good evening!', startSec: 0.5, endSec: 2.6, y: 0.85, color: '#e8dccc', size: 60 },

  { type: 'speak', actorId: 'speaker', text: "My name is Marcus — and I don't exist!", voiceId: VOICE_IDS.brian, startSec: 2.2, endSec: 6.0, volume: 2.0 },
  { type: 'popupText', text: "My name is Marcus —\nand I don't exist!", startSec: 2.4, endSec: 6.4, y: 0.85, color: '#e8dccc', size: 54 },

  { type: 'speak', actorId: 'speaker', text: 'I was rendered, this morning, in twenty minutes.', voiceId: VOICE_IDS.brian, startSec: 6.0, endSec: 10.0, volume: 2.0 },
  { type: 'popupText', text: 'I was rendered, this morning,\nin twenty minutes.', startSec: 6.2, endSec: 10.4, y: 0.85, color: '#e8dccc', size: 50 },

  { type: 'speak', actorId: 'speaker', text: 'And I would love to show you how.', voiceId: VOICE_IDS.brian, startSec: 10.0, endSec: 13.5, volume: 2.0 },
  { type: 'popupText', text: 'And I would love\nto show you how.', startSec: 10.2, endSec: 13.7, y: 0.85, color: '#e8dccc', size: 52 },

  // Title card after hook.
  { type: 'popupText', text: 'How I Made\nThis Video', startSec: 9.5, endSec: 13.0, y: 0.18, color: '#ffd76b', size: 110, rotate: -2 },

  // === Beat 2: Characters & wardrobe (0:11.5–0:25) ===
  { type: 'speak', actorId: 'speaker', text: 'Start with me.', voiceId: VOICE_IDS.brian, startSec: 13.5, endSec: 15.0, volume: 2.0 },
  { type: 'popupText', text: 'Start with me.', startSec: 13.7, endSec: 15.2, y: 0.85, color: '#e8dccc', size: 60 },

  { type: 'speak', actorId: 'speaker', text: 'I am one rig — fifty-three bones — shared across every outfit.', voiceId: VOICE_IDS.brian, startSec: 15.0, endSec: 19.5, volume: 2.0 },
  { type: 'popupText', text: 'One rig.\nFifty-three bones.\nEvery outfit.', startSec: 15.2, endSec: 19.7, y: 0.82, color: '#e8dccc', size: 50 },

  // Feature label card.
  { type: 'popupText', text: '53 BONES', startSec: 16.0, endSec: 19.0, y: 0.12, color: '#ffd76b', size: 130 },

  { type: 'speak', actorId: 'speaker', text: 'Hair, glasses, shirt, trousers — three hundred combinations.', voiceId: VOICE_IDS.brian, startSec: 19.7, endSec: 24.5, volume: 2.0 },
  { type: 'popupText', text: 'Hair. Glasses. Shirt. Trousers.\n300 combinations.', startSec: 19.9, endSec: 24.7, y: 0.82, color: '#e8dccc', size: 50 },

  // Feature label card on outfit beat.
  { type: 'popupText', text: '300 OUTFITS', startSec: 20.5, endSec: 24.0, y: 0.12, color: '#ffd76b', size: 120 },

  { type: 'speak', actorId: 'speaker', text: 'Swap any of it, and the animation still fits.', voiceId: VOICE_IDS.brian, startSec: 24.7, endSec: 28.5, volume: 2.0 },
  { type: 'popupText', text: 'Swap any of it.\nThe animation still fits.', startSec: 24.9, endSec: 28.7, y: 0.85, color: '#e8dccc', size: 50 },

  // === Beat 3: Animation library (0:28.5–0:35.5) ===
  { type: 'speak', actorId: 'speaker', text: 'Speaking of which —', voiceId: VOICE_IDS.brian, startSec: 28.7, endSec: 30.3, volume: 2.0 },
  { type: 'popupText', text: 'Speaking of which —', startSec: 28.9, endSec: 30.5, y: 0.85, color: '#e8dccc', size: 56 },

  { type: 'speak', actorId: 'speaker', text: 'seventeen motion clips drive everything I do.', voiceId: VOICE_IDS.brian, startSec: 30.3, endSec: 34.0, volume: 2.0 },
  { type: 'popupText', text: '17 motion clips\ndrive everything I do.', startSec: 30.5, endSec: 34.2, y: 0.82, color: '#e8dccc', size: 50 },

  // Feature label.
  { type: 'popupText', text: '17 CLIPS', startSec: 30.8, endSec: 33.8, y: 0.12, color: '#ffd76b', size: 130 },

  { type: 'speak', actorId: 'speaker', text: 'Discussion. Thinking. Yes. Thumbs up.', voiceId: VOICE_IDS.brian, startSec: 34.0, endSec: 37.5, volume: 2.0 },
  { type: 'popupText', text: 'Discussion. Thinking.\nYes. Thumbs up.', startSec: 34.2, endSec: 37.7, y: 0.82, color: '#e8dccc', size: 50 },

  { type: 'speak', actorId: 'speaker', text: 'All composed on a timeline — to the frame.', voiceId: VOICE_IDS.brian, startSec: 37.7, endSec: 41.5, volume: 2.0 },
  { type: 'popupText', text: 'All composed on a timeline\n— to the frame.', startSec: 37.9, endSec: 41.7, y: 0.82, color: '#e8dccc', size: 48 },

  // === Beat 4: Cinematic camera (0:41.5–0:50) — compressed to fit ===
  { type: 'speak', actorId: 'speaker', text: 'Now look at the camera.', voiceId: VOICE_IDS.brian, startSec: 41.7, endSec: 43.5, volume: 2.0 },
  { type: 'popupText', text: 'Now look at the camera.', startSec: 41.9, endSec: 43.7, y: 0.85, color: '#e8dccc', size: 56 },

  { type: 'speak', actorId: 'speaker', text: 'It is never still.', voiceId: VOICE_IDS.brian, startSec: 43.6, endSec: 45.0, volume: 2.0 },
  { type: 'popupText', text: 'It is never still.', startSec: 43.7, endSec: 45.0, y: 0.85, color: '#e8dccc', size: 60 },

  // Rule-of-three. Each word fires on its matching shot.
  { type: 'speak', actorId: 'speaker', text: 'Wide!', voiceId: VOICE_IDS.brian, startSec: 45.1, endSec: 45.9, volume: 2.0 },
  { type: 'popupText', text: 'Wide!', startSec: 45.0, endSec: 45.9, y: 0.85, color: '#e8dccc', size: 84 },

  { type: 'speak', actorId: 'speaker', text: 'Close!', voiceId: VOICE_IDS.brian, startSec: 46.0, endSec: 46.8, volume: 2.0 },
  { type: 'popupText', text: 'Close!', startSec: 45.9, endSec: 46.8, y: 0.85, color: '#e8dccc', size: 84 },

  { type: 'speak', actorId: 'speaker', text: 'Profile!', voiceId: VOICE_IDS.brian, startSec: 46.9, endSec: 47.7, volume: 2.0 },
  { type: 'popupText', text: 'Profile!', startSec: 46.8, endSec: 47.7, y: 0.85, color: '#e8dccc', size: 84 },

  { type: 'speak', actorId: 'speaker', text: "Bird's eye. Worm's eye. Dutch tilt.", voiceId: VOICE_IDS.brian, startSec: 47.8, endSec: 50.5, volume: 2.0 },
  { type: 'popupText', text: "Bird's eye. Worm's eye.\nDutch tilt.", startSec: 47.9, endSec: 50.7, y: 0.82, color: '#e8dccc', size: 50 },

  // Feature label on Dutch shot.
  { type: 'popupText', text: 'DUTCH', startSec: 43.8, endSec: 45.0, y: 0.12, color: '#ffd76b', size: 130 },

  { type: 'speak', actorId: 'speaker', text: 'Field of view, position, roll — all tween independently.', voiceId: VOICE_IDS.brian, startSec: 50.6, endSec: 54.5, volume: 2.0 },
  { type: 'popupText', text: 'FOV. Position. Roll.\nAll tween — independently.', startSec: 50.8, endSec: 54.7, y: 0.82, color: '#e8dccc', size: 48 },

  { type: 'speak', actorId: 'speaker', text: 'Every shot was chosen — for you.', voiceId: VOICE_IDS.brian, startSec: 54.6, endSec: 57.5, volume: 2.0 },
  { type: 'popupText', text: 'Every shot — chosen — for you.', startSec: 54.8, endSec: 57.7, y: 0.85, color: '#e8dccc', size: 50 },

  // === Beat 5: Voice & sync (0:57.5–0:62) ===
  { type: 'speak', actorId: 'speaker', text: 'And this voice?', voiceId: VOICE_IDS.brian, startSec: 57.6, endSec: 58.5, volume: 2.0 },
  { type: 'popupText', text: 'And this voice?', startSec: 57.7, endSec: 58.7, y: 0.85, color: '#e8dccc', size: 58 },

  { type: 'speak', actorId: 'speaker', text: 'Synthesized. Aligned to my mouth by phoneme.', voiceId: VOICE_IDS.brian, startSec: 58.6, endSec: 62.5, volume: 2.0 },
  { type: 'popupText', text: 'Synthesized.\nAligned by phoneme.', startSec: 58.8, endSec: 62.7, y: 0.82, color: '#e8dccc', size: 52 },

  // === Beat 6: The number — "20 minutes" punch (0:62.5–0:67.5) ===
  { type: 'speak', actorId: 'speaker', text: "Here's the part that breaks people.", voiceId: VOICE_IDS.brian, startSec: 62.7, endSec: 65.5, volume: 2.0 },
  { type: 'popupText', text: "Here's the part\nthat breaks people.", startSec: 62.9, endSec: 65.7, y: 0.82, color: '#e8dccc', size: 50 },

  { type: 'speak', actorId: 'speaker', text: 'All of this — took twenty minutes.', voiceId: VOICE_IDS.brian, startSec: 65.6, endSec: 69.0, volume: 2.0 },
  { type: 'popupText', text: 'All of this —\ntook twenty minutes.', startSec: 65.8, endSec: 69.2, y: 0.82, color: '#e8dccc', size: 50 },

  // The headline number — big card + flash on the punchline.
  { type: 'popupText', text: '20 MINUTES', startSec: 67.0, endSec: 70.0, y: 0.12, color: '#ffd76b', size: 160 },
  { type: 'flash', startSec: 67.0, endSec: 67.2, color: '#ffebc7' },

  // === Beat 7: Thesis + fourth-wall break (0:69–0:75) ===
  { type: 'speak', actorId: 'speaker', text: 'Short-form video used to take a team. A shoot day. A budget.', voiceId: VOICE_IDS.brian, startSec: 69.1, endSec: 72.5, volume: 2.0 },
  { type: 'popupText', text: 'A team. A shoot day.\nA budget.', startSec: 69.3, endSec: 72.5, y: 0.82, color: '#e8dccc', size: 50 },

  { type: 'speak', actorId: 'speaker', text: 'Now? A laptop. And a good idea.', voiceId: VOICE_IDS.brian, startSec: 72.6, endSec: 75.5, volume: 2.0 },
  { type: 'popupText', text: 'A laptop.\nAnd a good idea.', startSec: 72.8, endSec: 75.5, y: 0.82, color: '#e8dccc', size: 52 },

  // Big landing card.
  { type: 'popupText', text: '"A laptop.\nA good idea."', startSec: 73.5, endSec: 75.0, y: 0.18, color: '#ffd76b', size: 100, rotate: -1 },
];

// Eye blinks: ~every 5 seconds in default-eye windows. Each blink is a
// 4-frame Eye_2_Blink (~130ms at 30fps). Skip windows where (a) other
// eye sprites are playing (kawaii 54.6–56.5, starry 73.0–73.9), or
// (b) the camera is on the mouth (57.6–62 mouth ECU).
const blinks: Action[] = [
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 2.5, endSec: 2.63 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 6.8, endSec: 6.93 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 12.0, endSec: 12.13 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 16.5, endSec: 16.63 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 21.0, endSec: 21.13 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 26.0, endSec: 26.13 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 32.0, endSec: 32.13 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 39.5, endSec: 39.63 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 44.0, endSec: 44.13 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 53.5, endSec: 53.63 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 64.0, endSec: 64.13 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 67.5, endSec: 67.63 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 70.0, endSec: 70.13 },
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Blink2', startSec: 72.0, endSec: 72.13 },
  // Restore default after final blink.
  { type: 'eyes', actorId: 'speaker', eyes: 'Eye_0_Default', startSec: 72.13, endSec: 73.0 },
];

export const tedTalk: Skit = {
  id: 'TedTalk',
  title: 'TED Talk: How I Made This Video',
  durationInSeconds: 75,
  fps: 30,
  width: 1080,
  height: 1920,
  // TED talks use lower-third subtitles, not bubbles.
  hideSpeechBubbles: true,
  background: {
    // Warm spotlight pool fading to near-black — implied TED stage.
    kind: 'radial',
    colors: ['#3a2614', '#050302'],
  },
  actors: [
    {
      id: 'speaker',
      sprite: 'dave',
      name: 'Marcus',
      start: { x: SPEAKER_X, y: FLOOR },
      facing: 'down',
      scale: 1.0,
      outfit: {
        top: 'Clothes_Top_CollarShirt_Tucked',
        bottom: 'Clothes_Legs_Pants_Long',
        hair: 'Hair_Short',
        accessory: 'Accessory_Glasses',
        skinTone: 'Skintone_3',
        hairColor: 'Haircolour_04',
        topColor: 'Cushion_Blue',
        legColor: 'Espresso',
        shoesColor: 'Machine_Black',
        // Glasses get a clean dark frame instead of the broken atlas UV.
        accessoryColor: '#1a1a1a',
      },
    },
  ],
  timeline: [
    ...cameraTimeline,
    ...dialogue,

    // --- Speaker animation choreography (v5) ---
    // All non-looping — they hold end-pose and engine falls back to
    // looping idle (React_Stand_Discussion_1).
    // Beats: hook 0-13.5, wardrobe 13.5-28.5, motion 28.5-41.5,
    // camera 41.5-57.5, voice 57.5-62.5, number 62.5-69, thesis 69-75.
    { type: 'animate', actorId: 'speaker', clip: 'React_Stand_Discussion_1', startSec: 0, endSec: 6, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_Stand_Discussion_2', startSec: 6, endSec: 13.5, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_Stand_Discussion_1', startSec: 13.5, endSec: 22, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_Stand_Discussion_2', startSec: 22, endSec: 28.5, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_Stand_YES', startSec: 28.5, endSec: 30, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_Stand_Discussion_1', startSec: 30, endSec: 37, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_ThumbsUp', startSec: 37, endSec: 38, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_Stand_Discussion_2', startSec: 38, endSec: 50, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_Stand_Thinking', startSec: 50, endSec: 53, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_Stand_Discussion_1', startSec: 53, endSec: 62, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_CrossedArms_Thinking', startSec: 62, endSec: 66, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_CrossArms', startSec: 66, endSec: 69, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_Stand_Discussion_2', startSec: 69, endSec: 72.5, loop: false },
    { type: 'animate', actorId: 'speaker', clip: 'React_Stand_YES', startSec: 72.5, endSec: 75, loop: false },

    // --- Eyes: passionate sparkle on the emotional peaks, blinks throughout. ---
    // Kawaii on "Every shot — chosen — for you."
    { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Kawaii', startSec: 54.6, endSec: 56.5 },
    // Starry sparkle on "A laptop. And a good idea."
    { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Starry1', startSec: 73.0, endSec: 73.3 },
    { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Starry2', startSec: 73.3, endSec: 73.6 },
    { type: 'eyes', actorId: 'speaker', eyes: 'Eye_Starry1', startSec: 73.6, endSec: 73.9 },
    { type: 'eyes', actorId: 'speaker', eyes: 'Eye_0_Default', startSec: 73.9, endSec: 75 },

    ...blinks,
  ],
};
