/**
 * "Why don't we milk pigs?" — Dr. Lena Park daily episode (E2 of the
 * Lena franchise, first episode of the "daily Lena" pipeline).
 *
 * Format: 85-second TED-talk-style explainer. Single character, same
 * outfit/voice/stage as `drLena.ts`. The franchise bookends are
 * preserved verbatim:
 *   Opening: "Hi. I'm Lena. Today: [topic]. Stay with me."
 *   Closing: "...so. That's why. See you next time."
 *
 * The episode answers an ELI5-style question with three explicit
 * economic reveals (yield / speed / bottom line) and a synthesis
 * button. Every claim was fact-checked — no fabricated sources, no
 * casu-marzu reference (that's sheep milk, not pig).
 *
 * Beats:
 *   0:00–0:09   HOOK (bookend open)
 *   0:09–0:20   FRAME — plant the answer ("it doesn't pay")
 *   0:20–0:38   REVEAL 1 — YIELD MATH (4 teats vs 14, 30L vs 6L, can't breed while lactating)
 *   0:38–0:58   REVEAL 2 — SPEED MATH (10-min cow session vs 20-second sow window after 2-min oxytocin trigger)
 *   0:58–1:18   REVEAL 3 — SYNTHESIS (one sow cycle ≈ week of cow; Erik Stegink's 40-hour cheese)
 *   1:18–1:25   BUTTON ("math doesn't work. The pigs win.")
 *   1:25–1:30   SIGN-OFF (bookend close)
 */

import type { Skit, Action } from '../types';
import { VOICE_IDS } from '../../services/voiceIds';
import { randomBlinks } from '../eyeSequences';

const FLOOR = 1500;
const SPEAKER_X = 540;

// ----- Camera choreography -----
// TED-style restraint: mostly hard cuts, slow push-ins on the three
// reveals. The "First / Second / Third" cadence is matched with
// camera angle changes so the structure is felt, not just heard.
const cameraTimeline: Action[] = [
  // 0:00 OPEN — medium 3/4 from the right (matches drLena establishing).
  { type: 'camera', to: { position: [0.6, 1.65, 4.4], lookAt: [0, 1.55, 0], fov: 30 }, startSec: 0.0, endSec: 0.05 },

  // 0:09 HARD CUT — full wide for the FRAME beat (showcases the stage).
  { type: 'camera', to: { position: [0, 1.55, 5.4], lookAt: [0, 1.3, 0], fov: 36 }, startSec: 9.0, endSec: 9.05 },

  // 0:17 HARD CUT — medium close for "The answer is: it doesn't pay." Lock-in moment.
  { type: 'camera', to: { position: [0.3, 1.72, 2.8], lookAt: [0, 1.65, 0], fov: 28 }, startSec: 17.0, endSec: 17.05 },

  // 0:20 HARD CUT — 3/4 from the left for REVEAL 1 ("First: yield").
  { type: 'camera', to: { position: [-0.7, 1.7, 3.3], lookAt: [0, 1.6, 0], fov: 28 }, startSec: 20.0, endSec: 20.05 },

  // 0:28 SLOW PUSH — over 5s as the numbers land.
  { type: 'camera', to: { position: [-0.4, 1.78, 2.4], lookAt: [0, 1.75, 0], fov: 24 }, startSec: 28.0, endSec: 33.0 },

  // 0:38 HARD CUT — centered medium for REVEAL 2 ("Second: speed").
  { type: 'camera', to: { position: [0, 1.7, 3.0], lookAt: [0, 1.65, 0], fov: 28 }, startSec: 38.0, endSec: 38.05 },

  // 0:46 SLOW PUSH — tightening into the centerpiece (20-second window line).
  { type: 'camera', to: { position: [0, 1.75, 2.2], lookAt: [0, 1.72, 0], fov: 24 }, startSec: 46.0, endSec: 53.0 },

  // 0:53 HARD CUT — wider for the "you cannot automate that" landing.
  { type: 'camera', to: { position: [0.5, 1.7, 3.2], lookAt: [0, 1.6, 0], fov: 30 }, startSec: 53.0, endSec: 53.05 },

  // 0:58 HARD CUT — slight low-angle for REVEAL 3 authority ("Third: the bottom line").
  { type: 'camera', to: { position: [0, 1.1, 3.3], lookAt: [0, 1.65, 0], fov: 30 }, startSec: 58.0, endSec: 58.05 },

  // 1:08 HARD CUT — profile from right for "A Dutch farmer named Erik Stegink".
  { type: 'camera', to: { position: [3.0, 1.65, 0.0], lookAt: [0, 1.6, 0], fov: 28 }, startSec: 68.0, endSec: 68.05 },

  // 1:13 HARD CUT — back to medium for "40 hours per batch" landing.
  { type: 'camera', to: { position: [0, 1.72, 2.8], lookAt: [0, 1.7, 0], fov: 26 }, startSec: 73.0, endSec: 73.05 },

  // 1:18 HARD CUT — PULLBACK for BUTTON. Full body, neutral framing.
  { type: 'camera', to: { position: [0, 1.55, 5.0], lookAt: [0, 1.3, 0], fov: 36 }, startSec: 78.0, endSec: 78.05 },

  // 1:25 HARD CUT — return to opening framing for the bookend close.
  { type: 'camera', to: { position: [0.6, 1.65, 4.4], lookAt: [0, 1.55, 0], fov: 30 }, startSec: 85.0, endSec: 85.05 },
];

// ----- Dialogue -----
// 20 lines, ~188 words, ~83s spoken. All using `alice` voice with
// flash_v2_5 for lip-sync. Volumes 2.0 to match prior Lena skits.
const dialogue: Action[] = [
  // Lines 1-2: OPENING BOOKEND
  { type: 'speak', actorId: 'lena', text: "Hi. I'm Lena.", voiceId: VOICE_IDS.alice, startSec: 0.4, endSec: 2.4, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: "Today: why don't we milk pigs? Stay with me.", voiceId: VOICE_IDS.alice, startSec: 2.6, endSec: 8.8, volume: 2.0 },

  // Lines 3-5: FRAME — plant the answer
  { type: 'speak', actorId: 'lena', text: 'Pigs make milk. They have fourteen teats. Cows have four.', voiceId: VOICE_IDS.alice, startSec: 9.2, endSec: 13.0, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: "So why isn't pig-milk a thing?", voiceId: VOICE_IDS.alice, startSec: 13.2, endSec: 16.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: "The answer is: it doesn't pay.", voiceId: VOICE_IDS.alice, startSec: 17.0, endSec: 19.8, volume: 2.0 },

  // Lines 6-9: REVEAL 1 — YIELD
  { type: 'speak', actorId: 'lena', text: 'First: yield.', voiceId: VOICE_IDS.alice, startSec: 20.2, endSec: 22.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'A cow gives thirty litres a day, for ten months.', voiceId: VOICE_IDS.alice, startSec: 23.0, endSec: 27.8, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'A sow gives six litres a day, for three weeks.', voiceId: VOICE_IDS.alice, startSec: 28.0, endSec: 32.8, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: "And she can't get pregnant while lactating. So each cycle blocks the next litter too.", voiceId: VOICE_IDS.alice, startSec: 33.0, endSec: 37.8, volume: 2.0 },

  // Lines 10-13: REVEAL 2 — SPEED (centerpiece)
  { type: 'speak', actorId: 'lena', text: 'Second: speed.', voiceId: VOICE_IDS.alice, startSec: 38.2, endSec: 40.8, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'Cow milking: ten minutes. Twice a day. Machine does it.', voiceId: VOICE_IDS.alice, startSec: 41.2, endSec: 45.8, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'Sow milking: a twenty-second window. Once an hour. After the piglets nuzzle her for two full minutes.', voiceId: VOICE_IDS.alice, startSec: 46.2, endSec: 52.8, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'To trigger oxytocin. You cannot automate that.', voiceId: VOICE_IDS.alice, startSec: 53.2, endSec: 57.5, volume: 2.0 },

  // Lines 14-17: REVEAL 3 — SYNTHESIS
  { type: 'speak', actorId: 'lena', text: 'Third: the bottom line.', voiceId: VOICE_IDS.alice, startSec: 58.2, endSec: 60.8, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: "One sow's entire lactation cycle equals about a week of one cow.", voiceId: VOICE_IDS.alice, startSec: 61.2, endSec: 67.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'A Dutch farmer named Erik Stegink tried anyway.', voiceId: VOICE_IDS.alice, startSec: 68.0, endSec: 72.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'His pig-milk cheese took forty hours per batch.', voiceId: VOICE_IDS.alice, startSec: 73.0, endSec: 77.5, volume: 2.0 },

  // Lines 18-19: BUTTON
  { type: 'speak', actorId: 'lena', text: "So: we don't milk pigs because the math doesn't work.", voiceId: VOICE_IDS.alice, startSec: 78.0, endSec: 82.5, volume: 2.0 },
  { type: 'speak', actorId: 'lena', text: 'The pigs win.', voiceId: VOICE_IDS.alice, startSec: 82.8, endSec: 84.8, volume: 2.0 },

  // Line 20: CLOSING BOOKEND
  { type: 'speak', actorId: 'lena', text: "...so. That's why. See you next time.", voiceId: VOICE_IDS.alice, startSec: 85.2, endSec: 89.5, volume: 2.0 },
];

// ----- Eye choreography -----
// Default warmth across the explainer, Eye_Flat on the dry data drops,
// Eye_Kawaii on "The pigs win." for the tiny warmth at the button.
const eyes: Action[] = [
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_0_Default', startSec: 0, endSec: 17 },
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_Flat', startSec: 17, endSec: 19.8 },        // "it doesn't pay" — dry delivery
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_0_Default', startSec: 19.8, endSec: 33 },
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_Flat', startSec: 33, endSec: 38 },          // the breeding-blocked compound cost
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_0_Default', startSec: 38, endSec: 53 },
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_Flat', startSec: 53, endSec: 58 },          // "you cannot automate that" — earned
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_0_Default', startSec: 58, endSec: 78 },
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_Flat', startSec: 78, endSec: 82.8 },        // BUTTON — "the math doesn't work"
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_Kawaii', startSec: 82.8, endSec: 85 },      // "The pigs win." — tiny smile-in-eyes
  { type: 'eyes', actorId: 'lena', eyes: 'Eye_0_Default', startSec: 85, endSec: 90 },     // closing bookend warm
];

// ----- Mouth (rest-mouth state during silences/gaps) -----
// Default neutral Lips_20; smile during the warm bookends and the
// closing button tag. Lena's "earnest researcher" reads as neutral by
// default — smile only on the human-warm beats.
const mouths: Action[] = [
  { type: 'mouth', actorId: 'lena', mouth: 'Lips_20', startSec: 0, endSec: 82.8 },
  { type: 'mouth', actorId: 'lena', mouth: 'Lips_26_Smiley', startSec: 82.8, endSec: 90 },
];

// ----- Popup text overlays -----
// Numeric callouts at the data-drop moments. Each appears just as the
// line lands; held ~4s for screenshot. Lower-third positioning so they
// don't fight Lena's face.
const popups: Action[] = [
  { type: 'popupText', text: 'Cow: 30 L/day × 10 months', startSec: 24.0, endSec: 28.0, y: 0.78, color: '#ffd76b', size: 56, rotate: 0 },
  { type: 'popupText', text: 'Sow: 6 L/day × 3 weeks', startSec: 29.0, endSec: 33.0, y: 0.78, color: '#ffd76b', size: 56, rotate: 0 },
  { type: 'popupText', text: '20-second window', startSec: 47.5, endSec: 51.5, y: 0.78, color: '#ffd76b', size: 64, rotate: 0 },
  { type: 'popupText', text: '1 sow cycle ≈ 1 week of cow', startSec: 62.0, endSec: 67.0, y: 0.78, color: '#ffd76b', size: 56, rotate: 0 },
  { type: 'popupText', text: 'Erik Stegink · 40 hrs/batch', startSec: 73.5, endSec: 78.0, y: 0.78, color: '#ffd76b', size: 52, rotate: 0 },
];

// ----- Animation clips -----
// HARD RULE: each clip used at most ONCE per character per skit.
// With ~13 clips that fit Lena's TED-talk register, this gives us
// up to 13 scheduled animation windows. The linger system in
// CLIP_INFO holds each clip's end pose for an authored duration,
// so gaps between scheduled clips read as "character pausing in
// the gesture" rather than "scheduled idle filler."
//
// 12 windows used. Each clip chosen for the beat's intent:
const animations: Action[] = [
  // BOOKEND OPEN (0-9): calm warm idle. Wait_Choosy 6s + 0.3s linger
  // fills 6.3s of the 9s window before falling back to idle.
  { type: 'animate', actorId: 'lena', clip: 'Wait_Choosy', startSec: 0, endSec: 9, loop: false },

  // FRAME (9-20): natural fidget while setting up.
  { type: 'animate', actorId: 'lena', clip: 'Wait_Shifting', startSec: 9, endSec: 17, loop: false },
  // "The answer is: it doesn't pay." — slight authority moment that lingers.
  { type: 'animate', actorId: 'lena', clip: 'React_CrossedArms_Thinking', startSec: 17, endSec: 20, loop: false },

  // REVEAL 1 — YIELD (20-38)
  // "First: yield." — quick thinking beat (1.3s + 1.0s linger = 2.3s, holds well).
  { type: 'animate', actorId: 'lena', clip: 'React_Stand_Thinking', startSec: 20, endSec: 28, loop: false },
  // "A sow gives six litres..." — earnest gestural explanation. Discussion_1 is 6.1s.
  { type: 'animate', actorId: 'lena', clip: 'React_Stand_Discussion_1', startSec: 28, endSec: 38, loop: false },

  // REVEAL 2 — SPEED (38-58)
  // "Second: speed." — calm baseline idle.
  { type: 'animate', actorId: 'lena', clip: 'Idle_Wardrobe', startSec: 38, endSec: 46, loop: false },
  // 20-second-window centerpiece line — alt gestural baseline. Discussion_2 5.5s.
  { type: 'animate', actorId: 'lena', clip: 'React_Stand_Discussion_2', startSec: 46, endSec: 53, loop: false },
  // "you cannot automate that" — locked authority. CrossArms 0.8s + 2.0s linger = 2.8s
  // of held-arms-crossed pose, then crossfade into the next scheduled clip at 58.
  { type: 'animate', actorId: 'lena', clip: 'React_CrossArms', startSec: 53, endSec: 58, loop: false },

  // REVEAL 3 — SYNTHESIS (58-78)
  // "Third: the bottom line." — listening/agreeing posture as we synthesize. ListeningNod 5.3s.
  { type: 'animate', actorId: 'lena', clip: 'React_Stand_ListeningNod', startSec: 58, endSec: 68, loop: false },
  // "A Dutch farmer named Erik Stegink tried anyway." — crossed-arms thinking (denial via shake).
  // Used here as "interested-but-skeptical" gesture.
  { type: 'animate', actorId: 'lena', clip: 'React_CrossArms_ShakeNO', startSec: 68, endSec: 78, loop: false },

  // BUTTON (78-85)
  // "the math doesn't work. The pigs win." — definitive Stand_NO followed by NodYES on tag.
  { type: 'animate', actorId: 'lena', clip: 'React_Stand_NO', startSec: 78, endSec: 82.8, loop: false },
  // Final clip of the skit — extended linger (8s) so the closing
  // bookend holds the NodYES end pose all the way through "See you
  // next time." instead of falling back to Idle_Wardrobe (which
  // would re-use a clip and break the no-repeats rule).
  { type: 'animate', actorId: 'lena', clip: 'React_CrossArms_NodYES', startSec: 82.8, endSec: 90, loop: false, lingerSec: 8 },
];

// ----- Random blinks (natural human rate) -----
const blinks: Action[] = [
  ...randomBlinks('lena', 0, 90, { seed: 42 }),
];

export const dailyLenaPigs: Skit = {
  id: 'DailyLenaPigs',
  title: "Why don't we milk pigs?",
  durationInSeconds: 90,
  fps: 30,
  width: 1080,
  height: 1920,
  hideSpeechBubbles: true,
  background: { kind: 'tedStage' },
  defaultCamera: {
    position: [0.6, 1.65, 4.4],
    lookAt: [0, 1.55, 0],
    fov: 30,
  },
  actors: [
    // LENA — identical outfit to drLena.ts so the franchise reads consistent
    {
      id: 'lena',
      sprite: 'alex',
      name: 'Lena',
      start: { x: SPEAKER_X, y: FLOOR },
      facing: 'down',
      scale: 1.0,
      outfit: {
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
    ...mouths,
    ...dialogue,
    ...eyes,
    ...blinks,
    ...popups,
    ...animations,
  ],
};
