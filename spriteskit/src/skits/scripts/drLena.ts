/**
 * "Dr. Lena Park: Mobile Game Stores" — 90s educational monologue, the
 * first video in the Dr. Lena Park recurring-character franchise.
 *
 * Format: TED-talk-style single-character explainer. Lena delivers a
 * fact-dense, research-cited breakdown of how mobile game stores are
 * engineered to convert <2% of players into 50%+ of revenue.
 *
 * Franchise bookends (must be preserved verbatim across all Lena videos):
 *   Opening: "Hi. I'm Lena. Today: [topic]. Stay with me."
 *   Closing: "...so. That's why. See you next time."
 *
 * Beats (from the approved script):
 *   0:00–0:09   HOOK (bookend open)
 *   0:09–0:25   Frame: <2% generate 50%+ of revenue; the store is the weapon
 *   0:25–0:50   REVEAL 1 — the red dot (Visual Prominence, ACM 2024)
 *   0:50–1:13   REVEAL 2 — three bundles (Decoy Effect, Huber 1981)
 *   1:13–1:37   REVEAL 3 — friends as bait (Parasocial Pressure, ACM 2024)
 *   1:37–1:45   BUTTON ("you opened the app voluntarily")
 *   1:45–1:50   SIGN-OFF (bookend close)
 *
 * All factual claims are verified (see LEARNINGS / the research pass in
 * conversation). No fabricated sources.
 */

import type { Skit, Action } from '../types';
import { VOICE_IDS } from '../../services/voiceIds';
import { randomBlinks } from '../eyeSequences';

const FLOOR = 1500;
const SPEAKER_X = 540; // skit-pixel x = world 0

// ----- Camera choreography -----
// TED talks read better with restrained camera moves. Mostly hard cuts
// between medium, slow push-ins on the three REVEALs, profile shots for
// dry asides, pullback on the BUTTON. No Dutch tilts (too "music video"
// for the earnest researcher vibe).
const cameraTimeline: Action[] = [
  // 0:00 OPEN — eye-level medium, slight 3/4 from the right.
  { type: 'camera', to: { position: [0.6, 1.65, 4.4], lookAt: [0, 1.55, 0], fov: 30 }, startSec: 0.0, endSec: 0.05 },

  // 0:09 HARD CUT — full wide for the framing beat. Shows whole stage.
  { type: 'camera', to: { position: [0, 1.55, 5.4], lookAt: [0, 1.3, 0], fov: 36 }, startSec: 9.0, endSec: 9.05 },

  // 0:17 SLOW 5s PUSH — into a medium close as Lena lands the whale stat.
  { type: 'camera', to: { position: [0, 1.7, 3.0], lookAt: [0, 1.65, 0], fov: 28 }, startSec: 17.0, endSec: 22.0 },

  // 0:25 HARD CUT — into REVEAL 1. 3/4 from the left, leaning in.
  { type: 'camera', to: { position: [-0.7, 1.7, 3.3], lookAt: [0, 1.6, 0], fov: 28 }, startSec: 25.0, endSec: 25.05 },

  // 0:32 SLOW 4s PUSH — into a tight head-and-shoulders. "It has a name."
  { type: 'camera', to: { position: [-0.4, 1.78, 2.4], lookAt: [0, 1.75, 0], fov: 24 }, startSec: 32.0, endSec: 36.0 },

  // 0:40 HARD CUT — profile shot from the right. Dry "it does not mean..."
  { type: 'camera', to: { position: [3.0, 1.65, 0.0], lookAt: [0, 1.6, 0], fov: 28 }, startSec: 40.0, endSec: 40.05 },

  // 0:50 HARD CUT — REVEAL 2 opens. Centered medium head-and-shoulders.
  { type: 'camera', to: { position: [0, 1.7, 3.0], lookAt: [0, 1.65, 0], fov: 28 }, startSec: 50.0, endSec: 50.05 },

  // 1:00 HARD CUT — slight low-angle for "Decoy Effect" authority moment.
  { type: 'camera', to: { position: [0, 1.0, 3.3], lookAt: [0, 1.65, 0], fov: 30 }, startSec: 60.0, endSec: 60.05 },

  // 1:08 HARD CUT — back to centered medium. "You're not picking a bundle."
  { type: 'camera', to: { position: [0, 1.72, 2.8], lookAt: [0, 1.7, 0], fov: 26 }, startSec: 68.0, endSec: 68.05 },

  // 1:13 HARD CUT — REVEAL 3 opens. 3/4 from right again, fresh angle.
  { type: 'camera', to: { position: [0.8, 1.7, 3.2], lookAt: [0, 1.65, 0], fov: 28 }, startSec: 73.0, endSec: 73.05 },

  // 1:22 SLOW 4s PUSH — onto Lena's face for the parasocial reveal.
  { type: 'camera', to: { position: [0.3, 1.78, 2.4], lookAt: [0, 1.75, 0], fov: 24 }, startSec: 82.0, endSec: 86.0 },

  // 1:33 HARD CUT — PULLBACK for BUTTON. Full body, neutral framing.
  { type: 'camera', to: { position: [0, 1.55, 5.0], lookAt: [0, 1.3, 0], fov: 36 }, startSec: 93.0, endSec: 93.05 },

  // 1:45 HARD CUT — return to OPENING framing for the bookend close.
  { type: 'camera', to: { position: [0.6, 1.65, 4.4], lookAt: [0, 1.55, 0], fov: 30 }, startSec: 105.0, endSec: 105.05 },
];

// ----- Dialogue -----
// 32 lines, all spoken by Lena using `alice` voice (warm-precise educator).
// Bookends are preserved verbatim. Timing matches the approved script's
// audit. volume: 2.0 to match the other voiced skits' levels.
const dialogue: Action[] = [
  // Lines 1–4: OPENING BOOKEND (0:00–0:09).
  { type: 'speak', actorId: 'lena', text: "Hi. I'm Lena.", voiceId: VOICE_IDS.alice, startSec: 0.4, endSec: 2.4, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'Today: why two percent of mobile game players.', voiceId: VOICE_IDS.alice, startSec: 2.6, endSec: 6.4, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'Make fifty percent of the revenue.', voiceId: VOICE_IDS.alice, startSec: 6.5, endSec: 9.0, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'Stay with me.', voiceId: VOICE_IDS.alice, startSec: 9.2, endSec: 10.6, volume: 2.0 },

  // Lines 5–8: FRAME (0:11–0:25).
  { type: 'speak', actorId: 'lena', text: 'Free-to-play mobile games.', voiceId: VOICE_IDS.alice, startSec: 11.5, endSec: 13.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'Less than two percent of players ever pay.', voiceId: VOICE_IDS.alice, startSec: 13.8, endSec: 17.4, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'Those two percent fund the whole industry.', voiceId: VOICE_IDS.alice, startSec: 17.6, endSec: 22.2, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'The store is the weapon.', voiceId: VOICE_IDS.alice, startSec: 22.5, endSec: 25.0, volume: 2.0 },

  // Lines 9–15: REVEAL 1 — the red dot (0:25–0:50).
  { type: 'speak', actorId: 'lena', text: "Let's start with the red dot.", voiceId: VOICE_IDS.alice, startSec: 25.5, endSec: 28.3, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'You know the one. On the shop icon.', voiceId: VOICE_IDS.alice, startSec: 28.5, endSec: 32.0, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'A 2024 study looked at fourteen hundred games.', voiceId: VOICE_IDS.alice, startSec: 32.2, endSec: 36.2, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'It has a name. Visual Prominence.', voiceId: VOICE_IDS.alice, startSec: 36.4, endSec: 40.0, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'The dot is engineered.', voiceId: VOICE_IDS.alice, startSec: 40.4, endSec: 43.0, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'It does not mean you have something to claim.', voiceId: VOICE_IDS.alice, startSec: 43.3, endSec: 47.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'It means: open the shop.', voiceId: VOICE_IDS.alice, startSec: 47.8, endSec: 50.0, volume: 2.0 },

  // Lines 16–22: REVEAL 2 — the three bundles (0:50–1:13).
  { type: 'speak', actorId: 'lena', text: 'Now. The three bundles.', voiceId: VOICE_IDS.alice, startSec: 50.5, endSec: 53.0, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'Four ninety-nine. Nineteen ninety-nine. Forty-nine ninety-nine.', voiceId: VOICE_IDS.alice, startSec: 53.2, endSec: 59.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'This is the Decoy Effect.', voiceId: VOICE_IDS.alice, startSec: 59.7, endSec: 62.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'Marketing researchers proved it in 1981.', voiceId: VOICE_IDS.alice, startSec: 62.8, endSec: 66.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'The middle one exists to sell the top one.', voiceId: VOICE_IDS.alice, startSec: 66.8, endSec: 70.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: "You're not picking a bundle.", voiceId: VOICE_IDS.alice, startSec: 70.8, endSec: 72.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: "You're picking a middle.", voiceId: VOICE_IDS.alice, startSec: 72.6, endSec: 74.5, volume: 2.0 },

  // Lines 23–27: REVEAL 3 — friends as bait (1:13–1:37).
  { type: 'speak', actorId: 'lena', text: 'Last one. Your friends.', voiceId: VOICE_IDS.alice, startSec: 75.0, endSec: 77.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'When a friend buys a skin.', voiceId: VOICE_IDS.alice, startSec: 77.8, endSec: 80.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'The notification routes to the shop page.', voiceId: VOICE_IDS.alice, startSec: 80.8, endSec: 84.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'It has a name too. Parasocial Pressure.', voiceId: VOICE_IDS.alice, startSec: 84.8, endSec: 88.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'They are using your social bonds.', voiceId: VOICE_IDS.alice, startSec: 88.8, endSec: 92.5, volume: 2.0 },

  // Lines 28–30: BUTTON (1:33–1:45).
  { type: 'speak', actorId: 'lena', text: 'These are not accidents.', voiceId: VOICE_IDS.alice, startSec: 93.5, endSec: 96.0, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'This is decades of behavioral research. Weaponized.', voiceId: VOICE_IDS.alice, startSec: 96.3, endSec: 101.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'And you opened the app.', voiceId: VOICE_IDS.alice, startSec: 101.8, endSec: 105.0, volume: 2.0 },

  // Lines 31–32: CLOSING BOOKEND (1:45–1:50).
  { type: 'speak', actorId: 'lena', text: "...so. That's why.", voiceId: VOICE_IDS.alice, startSec: 105.5, endSec: 108.0, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'See you next time.', voiceId: VOICE_IDS.alice, startSec: 108.2, endSec: 110.0, volume: 2.0 },
];

// ----- Eye sprite choreography -----
// Default for explaining, Flat for dry asides + term drops, Kawaii for
// the "wild, right?" beats. Returns to Default for the bookends so the
// franchise opens/closes warm.
const eyes: Action[] = [
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_0_Default', startSec: 0, endSec: 36 },
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_Flat', startSec: 36, endSec: 50 }, // "Visual Prominence" + "It does not mean..."
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_0_Default', startSec: 50, endSec: 66 },
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_Kawaii', startSec: 66, endSec: 75 }, // "the middle one exists to sell..." + "you're picking a middle"
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_0_Default', startSec: 75, endSec: 85 },
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_Flat', startSec: 85, endSec: 93 }, // "Parasocial Pressure" + "using your social bonds"
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_0_Default', startSec: 93, endSec: 110 },
];

// ----- Popup text overlays -----
// Three citation popups for the three REVEALs. Each appears with the
// term-drop and stays visible for 4-5s — long enough to screenshot.
// Positioned at y=0.75 (lower-third) so they don't fight Lena's face.
const popups: Action[] = [
  { type: 'popupText', text: 'Visual Prominence', startSec: 37, endSec: 42, y: 0.75, color: '#ffd76b', size: 64, rotate: 0 },
  { type: 'popupText', text: 'Decoy Effect • 1981', startSec: 60, endSec: 66, y: 0.75, color: '#ffd76b', size: 64, rotate: 0 },
  { type: 'popupText', text: 'Parasocial Pressure', startSec: 85, endSec: 90, y: 0.75, color: '#ffd76b', size: 64, rotate: 0 },
];

// ----- Animation clips -----
// Variety is the point. Earlier drafts leaned on Discussion_1/2 too
// hard — the same gesture loop on repeat reads as "samey" in
// short-form video. The rule now: never use the same clip in two
// adjacent windows, and use the long ambient idles (Idle_Wardrobe,
// Wait_Shifting, Wait_Choosy) as the natural baseline for
// "standing-and-talking" beats — they're FAR less arm-waving than
// React_Stand_Discussion_* and read as natural-presenter body
// language. React_Stand_* clips are saved for moments that actually
// warrant a directed gesture.
//
// Vibe map:
//  - Idle_Wardrobe (6.8s): warm, alive, baseline-natural
//  - Wait_Shifting (5.0s): foot-shift, light fidget, transitional
//  - Wait_Choosy (6.0s): weighing/considering — perfect for setups
//  - CrossArms (0.8s) → holds the crossed-arms end-pose: authority
//  - CrossedArms_Thinking (1.7s): authority + thought
//  - Discussion_1/2: now used SPARINGLY for arm-emphatic beats only
const animations: Action[] = [
  // 0:00–0:09 OPENING BOOKEND — warm ambient idle, not "listening" (she's talking)
  { type: 'animate', actorId: 'lena', clip: 'Idle_Wardrobe', startSec: 0, endSec: 9, loop: false },

  // 0:09–0:17 FRAME — natural fidget while setting up the premise
  { type: 'animate', actorId: 'lena', clip: 'Wait_Shifting', startSec: 9, endSec: 17, loop: false },

  // 0:17–0:25 Whale stat — considering / weighing the number
  { type: 'animate', actorId: 'lena', clip: 'Wait_Choosy', startSec: 17, endSec: 25, loop: false },

  // 0:25–0:32 REVEAL 1 open — "Let's start with the red dot" — picking up new topic
  { type: 'animate', actorId: 'lena', clip: 'Wait_Choosy', startSec: 25, endSec: 32, loop: false },

  // 0:32–0:43 "Visual Prominence" term drop — natural delivery
  { type: 'animate', actorId: 'lena', clip: 'Idle_Wardrobe', startSec: 32, endSec: 43, loop: false },

  // 0:43–0:50 "It does not mean..." dry beat — the "let me explain" pose
  { type: 'animate', actorId: 'lena', clip: 'React_CrossArms', startSec: 43, endSec: 50, loop: false },

  // 0:50–0:60 REVEAL 2 open — light shift, transitioning topics
  { type: 'animate', actorId: 'lena', clip: 'Wait_Shifting', startSec: 50, endSec: 60, loop: false },

  // 0:60–0:66 "Decoy Effect" authority + thought
  { type: 'animate', actorId: 'lena', clip: 'React_CrossedArms_Thinking', startSec: 60, endSec: 66, loop: false },

  // 0:66–0:75 "You're picking a middle" Kawaii beat — natural delivery
  { type: 'animate', actorId: 'lena', clip: 'Idle_Wardrobe', startSec: 66, endSec: 75, loop: false },

  // 0:75–0:85 REVEAL 3 open — considering the social beat
  { type: 'animate', actorId: 'lena', clip: 'Wait_Choosy', startSec: 75, endSec: 85, loop: false },

  // 0:85–0:93 "Parasocial Pressure" — slight tension on the social-bonds reveal
  { type: 'animate', actorId: 'lena', clip: 'Wait_Shifting', startSec: 85, endSec: 93, loop: false },

  // 0:93–1:05 BUTTON — crossed arms for "these are not accidents" authority
  { type: 'animate', actorId: 'lena', clip: 'React_CrossArms', startSec: 93, endSec: 105, loop: false },

  // 1:05–1:10 CLOSING BOOKEND — warm sign-off
  { type: 'animate', actorId: 'lena', clip: 'Idle_Wardrobe', startSec: 105, endSec: 110, loop: false },
];

export const drLena: Skit = {
  id: 'DrLena',
  title: "Dr. Lena Park: How Mobile Game Stores Take Your Money",
  durationInSeconds: 110,
  fps: 30,
  width: 1080,
  height: 1920,
  // TED-talk format: rendered text overlays only, no chat bubbles.
  hideSpeechBubbles: true,
  background: { kind: 'tedStage' },
  defaultCamera: {
    position: [0.6, 1.65, 4.4],
    lookAt: [0, 1.55, 0],
    fov: 30,
  },
  actors: [
    {
      id: 'lena',
      sprite: 'alex',
      name: 'Lena',
      start: { x: SPEAKER_X, y: FLOOR },
      facing: 'down',
      scale: 1.0,
      outfit: {
        // Bookish-but-warm professional. Collared blouse + bob + glasses.
        top: 'Clothes_Top_CollarBlouse_Long',
        bottom: 'Clothes_Legs_Pants_Long',
        hair: 'Hair_ShortBob',
        accessory: 'Accessory_Glasses',
        skinTone: 'Skintone_3',
        hairColor: 'Haircolour_07',
        topColor: 'Latte',
        legColor: 'Machine_Black',
        shoesColor: 'Machine_Black',
        accessoryColor: '#1a1a1a',
      },
    },
  ],
  timeline: [
    ...cameraTimeline,
    ...dialogue,
    ...eyes,
    // Random blinks overlay the main eye state — last-match-wins per
    // frame, so blinks fire during their ~480ms windows then the
    // underlying Eye_Default/Flat/Kawaii window re-asserts. Seeded so
    // re-renders produce identical timing.
    ...randomBlinks('lena', 0, 110, { seed: 42 }),
    ...popups,
    ...animations,
  ],
};
