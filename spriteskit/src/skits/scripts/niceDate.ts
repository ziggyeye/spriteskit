/**
 * "The Nice Date" — 46s two-character dinner-scene skit.
 *
 * Faithful spriteskit adaptation of the viral restaurant confrontation
 * from the 2026 horror film "Obsession" (Curry Barker / Focus Features
 * / Blumhouse). Boyfriend (Liam) asks if her dad actually has cancer,
 * girlfriend (Mia) goes through an escalating "no no no" meltdown,
 * boyfriend capitulates, then her smile snaps INSTANTLY back to default
 * like nothing happened.
 *
 * The horror lives in the contrast: cute stylized characters + warm
 * restaurant lighting + the calmest possible Default eye sprite
 * snapping back at the end.
 *
 * Beats (per asset-utilizer + script-editor briefs):
 *   0:00–0:04   Establishing wide, both calm
 *   0:04–0:09   Liam pivots; Mia: "Mhm?"
 *   0:09–0:13.5 Liam: "Does your dad actually have cancer?"
 *   0:13.5–0:16.5  THE HOLD — 3 silent seconds; smile freezes
 *   0:16.5–0:30 THE BARRAGE — 1/1/3/1/5/1 cadence of "no"s
 *   0:30–0:36   TANTRUM — Discussion_2 gesture + shake + flash + "ENOUGH." caption
 *   0:36–0:42   Liam capitulates ("Okay." / "Okay." / "I won't ask again. I'm sorry.")
 *   0:42–0:45.5 SNAP-BACK — Mia: "So! How's your pasta?"
 *   0:45.5–0:46 Hard cut to black
 *
 * Voice casting: Liam=VOICE_IDS.eric (Smooth/Trustworthy),
 * Mia=VOICE_IDS.jessica (Playful/Bright/Warm). Both eleven_flash_v2_5
 * — lip-sync is load-bearing for both characters; eleven_v3 audio
 * tags can't be used.
 *
 * Mia was originally cast as `lulu` (Sweet & Bubbly Girl) — too
 * chipmunky for the trailer's grounded young-adult voice. Switched
 * to `jessica` (same voice used in `areYouOkay` for a tonally-
 * adjacent deadpan-couple skit). If `jessica` still reads too
 * cheerful in audition, try `laura` (Quirky Attitude) next.
 *
 * Asymmetric blinks: Liam blinks normal human rate throughout. Mia
 * blinks only in the calm opening (0–13.5s) and a sparse mid-window
 * during the tantrum (30–42s) — explicitly NO blinks during the hold,
 * the barrage, or the snap-back. The unblinking stare IS the dread.
 */

import type { Skit, Action } from '../types';
import { VOICE_IDS } from '../../services/voiceIds';
import { randomBlinks } from '../eyeSequences';

// Position the characters so their FEET land on the restaurant floor
// (world Y=0). FLOOR=1920 puts their origin at world Y=0.
const FLOOR = 1920;
// Bar high-top table is a 0.4m-radius disc at world center. Stand the
// characters offset to either side of it — far enough apart that the
// table fits cleanly between them, close enough that they read as
// "at the same table together." World x=±0.7 = skit pixel x=204/876.
const LIAM_X = 204;
const MIA_X = 876;
// X-coord Mia steps back to during the silent hold: further from the
// table (away from Liam, toward the right edge of the frame).
const MIA_STEP_BACK_X = 1020;

// ----- Camera choreography -----
// 9 hard cuts + 1 slow push (the dread-pull at 13.5). Restrained for
// the calm beats; accelerates through the barrage; locks down on the
// snap-back so nothing competes with the punchline.
// Camera Y values tuned for FLOOR=1920 (feet at world Y=0, head ~1.45).
// Character positions: Liam at world x=-0.7, Mia at world x=+0.7 (or
// +1.1 after the step-back). Bar table at world (0, 1.1, 0).
// Cameras are pulled back further than the first pass — wider framings
// read better at TikTok scale.
const cameraTimeline: Action[] = [
  // 0:00 OPEN — wide two-shot establishing. Pulled back to ~6m to fit
  // both characters comfortably plus the bar table.
  { type: 'camera', to: { position: [0, 1.15, 6.0], lookAt: [0, 0.95, 0], fov: 36 }, startSec: 0.0, endSec: 0.05 },

  // 0:04 HARD CUT — over-the-shoulder from behind Mia, framing Liam.
  { type: 'camera', to: { position: [1.8, 1.3, 2.6], lookAt: [-0.7, 1.2, 0], fov: 32 }, startSec: 4.0, endSec: 4.05 },

  // 0:09 HARD CUT — reverse OTS, now framing Mia for the question.
  { type: 'camera', to: { position: [-1.8, 1.3, 2.6], lookAt: [0.7, 1.2, 0], fov: 32 }, startSec: 9.0, endSec: 9.05 },

  // 0:13.5 SLOW PUSH on Mia (3s tween). THE dread-pull. From medium OTS
  // into a 3/4 ECU. Pulled further back than v1 so her full upper-body
  // is in frame.
  { type: 'camera', to: { position: [-0.4, 1.35, 2.8], lookAt: [0.7, 1.2, 0], fov: 32 }, startSec: 13.5, endSec: 16.5 },

  // 0:16.5 HARD CUT — wide two-shot. Both visible as the barrage opens.
  { type: 'camera', to: { position: [0, 1.2, 5.0], lookAt: [0.2, 0.95, 0], fov: 34 }, startSec: 16.5, endSec: 16.55 },

  // 0:18.5 HARD CUT — medium on Mia. She's at world x≈+1.1.
  { type: 'camera', to: { position: [-0.2, 1.35, 3.4], lookAt: [1.1, 1.25, 0], fov: 30 }, startSec: 18.5, endSec: 18.55 },

  // 0:22.0 HARD CUT — tighter on Mia for "Why are you asking me this?"
  // — slight angle change so it doesn't feel like a static zoom.
  { type: 'camera', to: { position: [0.0, 1.4, 2.6], lookAt: [1.1, 1.3, 0], fov: 28 }, startSec: 22.0, endSec: 22.05 },

  // 0:24.0 HARD CUT — pushed in close on Mia for the SCREAM peak.
  // Tightest of the barrage shots; her face fills the frame.
  { type: 'camera', to: { position: [0.3, 1.4, 2.2], lookAt: [1.1, 1.3, 0], fov: 28 }, startSec: 24.0, endSec: 24.05 },

  // 0:26.5 HARD CUT — quick reaction on Liam (he's at world x=-0.7).
  // Single short cut, half the previous Liam-shot duration.
  { type: 'camera', to: { position: [1.0, 1.35, 3.4], lookAt: [-0.7, 1.25, 0], fov: 30 }, startSec: 26.5, endSec: 26.55 },

  // 0:28.0 HARD CUT — back to Mia for "I thought we were having a nice
  // night" + the final low "No." Profile from the other side.
  { type: 'camera', to: { position: [-0.4, 1.35, 2.8], lookAt: [1.1, 1.3, 0], fov: 30 }, startSec: 28.0, endSec: 28.05 },

  // 0:30 HARD CUT — LOW-ANGLE 3/4 on Mia (still at world x≈+1.1). She looms.
  { type: 'camera', to: { position: [0.2, 0.6, 2.6], lookAt: [1.1, 1.25, 0], fov: 32 }, startSec: 30.0, endSec: 30.05 },

  // 0:33.5 HARD CUT — high-angle iso down on the table aftermath.
  { type: 'camera', to: { position: [1.6, 3.0, 4.6], lookAt: [0, 0.5, 0], fov: 38 }, startSec: 33.5, endSec: 33.55 },

  // 0:36 HARD CUT — OTS from behind Mia onto Liam (her looming silhouette).
  { type: 'camera', to: { position: [1.5, 1.3, 2.6], lookAt: [-0.7, 1.2, 0], fov: 32 }, startSec: 36.0, endSec: 36.05 },

  // 0:42 HARD CUT — medium on Mia for the punchline. NOTE: by 42s the
  // step-back happened, so she's at world x=+1.1. Frame her face but
  // include just a hint of the bar table for context.
  { type: 'camera', to: { position: [0.4, 1.3, 3.0], lookAt: [1.1, 1.25, 0], fov: 30 }, startSec: 42.0, endSec: 42.05 },
];

// ----- Mia's step-back -----
// Between the silent hold (13.5-16.5) and the barrage starting (16.5),
// Mia takes a half-step backward — toward the right edge of the frame
// since she's on the right side of the table. Reads as "she pushed
// her chair back / rose to her feet." The walk auto-plays Walk_Loop
// during the move, then she settles into the no-barrage from her new
// position. Camera ECUs are tuned for this new offset.
const stepBack: Action[] = [
  { type: 'walk', actorId: 'mia', to: { x: MIA_STEP_BACK_X, y: FLOOR }, startSec: 15.5, endSec: 16.3, facing: 'down-left' },
];

// ----- Dialogue -----
// 13 lines. The 6-window no-barrage cadence is 1/1/3/1/5/1 — escalation
// with a feint single between the triplet and the 5-no peak. Tight gaps
// (0.2-0.7s) sell panic without ElevenLabs audio tags.
const dialogue: Action[] = [
  // Line 1: Liam's setup question
  { type: 'speak', actorId: 'liam', text: 'Hey. Can I ask you something?', voiceId: VOICE_IDS.eric, startSec: 4.5, endSec: 7.0, volume: 2.0 },
  // Line 2: Mia, sweet "Mhm?"
  { type: 'speak', actorId: 'mia', text: 'Mhm?', voiceId: VOICE_IDS.jessica, startSec: 7.5, endSec: 8.2, volume: 2.0 },
  // Line 3: THE QUESTION — bare, no Ian-framing
  { type: 'speak', actorId: 'liam', text: 'Does your dad actually have cancer?', voiceId: VOICE_IDS.eric, startSec: 9.5, endSec: 12.8, volume: 2.0 },

  // (13.5-16.5: silent hold — no speak action)

  // Lines 4-12: THE BARRAGE — escalating with interjected protest
  // lines (the deflection-and-redirect pattern). Original lines in
  // the same emotional shape as the source film's beat without
  // reproducing any specific dialogue. Pattern is:
  //   no -> double-no -> "don't do this." -> rapid no-burst ->
  //   "why are you asking me this?" -> peak SCREAM -> guilt-trip ->
  //   definitive low no
  { type: 'speak', actorId: 'mia', text: 'No.', voiceId: VOICE_IDS.jessica, startSec: 16.5, endSec: 17.4, volume: 2.0 },
  { type: 'speak', actorId: 'mia', text: 'No no!', voiceId: VOICE_IDS.jessica, startSec: 17.6, endSec: 18.5, volume: 2.0 },
  // Protest 1: deflection
  { type: 'speak', actorId: 'mia', text: "Don't do this.", voiceId: VOICE_IDS.jessica, startSec: 18.7, endSec: 20.0, volume: 2.0 },
  { type: 'speak', actorId: 'mia', text: 'No no no no no!', voiceId: VOICE_IDS.jessica, startSec: 20.2, endSec: 22.0, volume: 2.0 },
  // Protest 2: appeal
  { type: 'speak', actorId: 'mia', text: 'Why are you asking me this?', voiceId: VOICE_IDS.jessica, startSec: 22.2, endSec: 24.0, volume: 2.0 },
  // PEAK scream
  { type: 'speak', actorId: 'mia', text: 'NO NO NO NO NO!', voiceId: VOICE_IDS.jessica, startSec: 24.2, endSec: 26.5, volume: 2.0 },
  // Protest 3: guilt-trip
  { type: 'speak', actorId: 'mia', text: 'I thought we were having a nice night.', voiceId: VOICE_IDS.jessica, startSec: 26.7, endSec: 28.8, volume: 2.0 },
  // Definitive low final no
  { type: 'speak', actorId: 'mia', text: 'No.', voiceId: VOICE_IDS.jessica, startSec: 29.0, endSec: 30.0, volume: 2.0 },

  // (30-36: silent tantrum + "ENOUGH." popupText)

  // Lines 10-12: Liam capitulates
  { type: 'speak', actorId: 'liam', text: 'Okay.', voiceId: VOICE_IDS.eric, startSec: 36.5, endSec: 37.2, volume: 2.0 },
  { type: 'speak', actorId: 'liam', text: 'Okay.', voiceId: VOICE_IDS.eric, startSec: 37.5, endSec: 38.2, volume: 2.0 },
  { type: 'speak', actorId: 'liam', text: "I won't ask again. I'm sorry.", voiceId: VOICE_IDS.eric, startSec: 38.8, endSec: 41.5, volume: 2.0 },

  // Line 13: THE BUTTON — Mia snap-back, bright sing-song
  { type: 'speak', actorId: 'mia', text: "So! How's your pasta?", voiceId: VOICE_IDS.jessica, startSec: 42.5, endSec: 45.0, volume: 2.0 },
];

// ----- Eye choreography -----
// Liam: Default → Flat (locked in from the question onward). His
// Eye_Flat for the entire meltdown carries the dread.
// Mia: Default → Flat (mid-hold) → Frustrated → Angry → SNAP back to
// Default (instant cut at 42.0). The Default-to-Default sandwich on her
// bookend lines is the visual punchline.
const eyes: Action[] = [
  // Liam
  { type: 'eyes', actorId: 'liam', eyes: 'Eye_0_Default', startSec: 0, endSec: 13.5 },
  { type: 'eyes', actorId: 'liam', eyes: 'Eye_Flat', startSec: 13.5, endSec: 42.0 },
  { type: 'eyes', actorId: 'liam', eyes: 'Eye_Flat', startSec: 42.0, endSec: 45.5 }, // he has NOT recovered

  // Mia
  { type: 'eyes', actorId: 'mia', eyes: 'Eye_0_Default', startSec: 0, endSec: 15.2 },
  { type: 'eyes', actorId: 'mia', eyes: 'Eye_Flat', startSec: 15.2, endSec: 18.0 }, // mid-hold change — smile body, flat eyes
  { type: 'eyes', actorId: 'mia', eyes: 'Eye_Frustrated', startSec: 18.0, endSec: 22.0 }, // building
  { type: 'eyes', actorId: 'mia', eyes: 'Eye_Angry', startSec: 22.0, endSec: 42.0 }, // peak + held
  { type: 'eyes', actorId: 'mia', eyes: 'Eye_0_Default', startSec: 42.0, endSec: 45.5 }, // INSTANT SNAP-BACK
];

// ----- Tint cue -----
// Removed the mid-barrage tint — visually it read as a continuity
// error (suddenly changes color at 22s for no clear reason). The eye
// sprites + voice cadence carry the menace already. Empty array keeps
// the timeline spread structure consistent.
const tint: Action[] = [];

// ----- Shake + flash (the slam) -----
// Shake at the table-slam moment (~31.5). White flash a single frame
// on impact. White flash again at 41.98 to MASK the eye-state cut
// (so Mia's switch from Eye_Angry to Eye_0_Default reads as an instant
// snap, not a smooth fade). Black flash at 45.5 = hard cut to black.
const effects: Action[] = [
  { type: 'shake', intensity: 8, startSec: 31.4, endSec: 32.0 },
  { type: 'flash', color: '#ffffff', startSec: 31.5, endSec: 31.65 },
  { type: 'flash', color: '#ffffff', startSec: 41.98, endSec: 42.05 },
  { type: 'flash', color: '#000000', startSec: 45.5, endSec: 46.0 },
];

// ----- popupText -----
// The "ENOUGH." caption at the slam — single big-caption moment,
// meme-bait. Positioned mid-frame so it dominates during the tantrum.
const popups: Action[] = [
  { type: 'popupText', text: 'ENOUGH.', startSec: 31.6, endSec: 33.5, y: 0.4, color: '#f4f4f4', size: 180, rotate: -2 },
];

// ----- Animation clips -----
// Variety per the upgraded asset-utilizer brief. Idle_Wardrobe /
// Wait_Shifting / Wait_Choosy as the calm baseline. React_Stand_*
// reserved for genuinely emphatic moments. Discussion_1/2 used
// exactly twice across the whole skit — both during Mia's barrage
// peak/slam — and only because those beats ARE arm-emphatic.
// Animation timeline rewritten to MINIMIZE Idle_Wardrobe fallback
// leak. Previous version had ~16s of Idle_Wardrobe playing per actor
// from one-shot clips finishing inside their windows. New strategy:
//
// 1. Chain a SECOND clip to fill any window-time after the primary
//    clip ends — avoids the engine falling back to Idle_Wardrobe.
// 2. Use Idle_Wardrobe explicitly only at the start (warm establishing)
//    and on Mia's snap-back (the visual punchline depends on that
//    specific calm idle returning).
// 3. Schedule windows that match clip durations (1.3-1.7s reactions
//    don't get 4s windows anymore).
//
// All clip durations referenced inline so future edits know the
// window-fit math.
const animations: Action[] = [
  // ---- Liam ----
  // Beat 0 (0-4): establishing. Idle_Wardrobe 6.8s clip > 4s window,
  // so it just plays its first 4 seconds before next clip takes over.
  { type: 'animate', actorId: 'liam', clip: 'Idle_Wardrobe', startSec: 0, endSec: 4, loop: false },
  // Beat 1 (4-9): setup pivot. Wait_Shifting 5.0s clip = window. Clean.
  { type: 'animate', actorId: 'liam', clip: 'Wait_Shifting', startSec: 4, endSec: 9, loop: false },
  // Beat 2 (9-13.5): question. CrossedArms_Thinking 1.73s, then chain
  // Wait_Choosy (6.0s) for the remaining 2.77s.
  { type: 'animate', actorId: 'liam', clip: 'React_CrossedArms_Thinking', startSec: 9, endSec: 10.73, loop: false },
  { type: 'animate', actorId: 'liam', clip: 'Wait_Choosy', startSec: 10.73, endSec: 13.5, loop: false },
  // Beat 3 (13.5-16.5): THE HOLD. Wait_Pose freezes for 3s. Wait_Pose
  // is a single keyframe (0.03s) and the engine clamps end-pose for
  // the rest of the window — that's the deliberate freeze effect.
  { type: 'animate', actorId: 'liam', clip: 'Wait_Pose', startSec: 13.5, endSec: 16.5, loop: false },
  // Beat 4a (16.5-20): first wave of barrage. ListeningNod 5.3s > 3.5s.
  { type: 'animate', actorId: 'liam', clip: 'React_Stand_ListeningNod', startSec: 16.5, endSec: 20.0, loop: false },
  // Beat 4b (20-23): back-pedal. Thinking 1.33s, then Wait_Shifting
  // 5.03s clip (truncated to 1.67s here).
  { type: 'animate', actorId: 'liam', clip: 'React_Stand_Thinking', startSec: 20.0, endSec: 21.33, loop: false },
  { type: 'animate', actorId: 'liam', clip: 'Wait_Shifting', startSec: 21.33, endSec: 23.0, loop: false },
  // Beat 4c (23-27): shrinks into crossed arms. CrossArms is 0.8s — it
  // holds the end pose forever via clampWhenFinished, which is the
  // intended "locked into the pose" behavior. Don't chain another
  // clip; the held end-pose IS the look.
  { type: 'animate', actorId: 'liam', clip: 'React_CrossArms', startSec: 23.0, endSec: 27.0, loop: false },
  // Beat 4d (27-30): small head-shake "I shouldn't have asked".
  // ShakeNO 1.47s, then Wait_Pose to freeze.
  { type: 'animate', actorId: 'liam', clip: 'React_CrossArms_ShakeNO', startSec: 27.0, endSec: 28.47, loop: false },
  { type: 'animate', actorId: 'liam', clip: 'Wait_Pose', startSec: 28.47, endSec: 30.0, loop: false },
  // Beat 5 (30-33.5): TANTRUM aftermath, frozen in shock.
  { type: 'animate', actorId: 'liam', clip: 'Wait_Pose', startSec: 30.0, endSec: 33.5, loop: false },
  // Beat 5b (33.5-36): starts to recover, considers.
  { type: 'animate', actorId: 'liam', clip: 'Wait_Choosy', startSec: 33.5, endSec: 36.0, loop: false },
  // Beat 6a (36-37.5): defeated nod. NodYES 1.2s nearly fills 1.5s.
  { type: 'animate', actorId: 'liam', clip: 'React_CrossArms_NodYES', startSec: 36.0, endSec: 37.2, loop: false },
  // Bridge to next beat — Wait_Pose freezes the "I just agreed" pose.
  { type: 'animate', actorId: 'liam', clip: 'Wait_Pose', startSec: 37.2, endSec: 37.5, loop: false },
  // Beat 6b (37.5-42): shifting uncomfortably. Wait_Shifting 5.03s.
  { type: 'animate', actorId: 'liam', clip: 'Wait_Shifting', startSec: 37.5, endSec: 42.0, loop: false },
  // Beat 7 (42-45.5): snap-back. Wait_Choosy fits 6s > 3.5s window.
  { type: 'animate', actorId: 'liam', clip: 'Wait_Choosy', startSec: 42.0, endSec: 45.5, loop: false },

  // ---- Mia ----
  // Beat 0 (0-4): establishing — considering. Wait_Choosy 6.0s > 4s.
  { type: 'animate', actorId: 'mia', clip: 'Wait_Choosy', startSec: 0, endSec: 4, loop: false },
  // Beat 1 (4-9): listening. ListeningNod 5.3s ≈ 5s window.
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_ListeningNod', startSec: 4, endSec: 9, loop: false },
  // Beat 2 (9-13.5): disarming stillness. Idle_Wardrobe 6.8s > 4.5s.
  // (One of only TWO explicit Idle_Wardrobe schedulings — character
  // is supposed to be disarmingly still and warm here.)
  { type: 'animate', actorId: 'mia', clip: 'Idle_Wardrobe', startSec: 9, endSec: 13.5, loop: false },
  // Beat 3 (13.5-15.5): THE HOLD. Wait_Pose freeze.
  { type: 'animate', actorId: 'mia', clip: 'Wait_Pose', startSec: 13.5, endSec: 15.5, loop: false },
  // 15.5-16.3 = walk (overrides). 16.3-16.5 bridge with Wait_Pose.
  { type: 'animate', actorId: 'mia', clip: 'Wait_Pose', startSec: 16.3, endSec: 16.5, loop: false },
  // Beat 4a (16.5-18.5): "No." x2. React_Stand_NO 1.67s; chain
  // CrossArms_ShakeNO for the remaining 0.33s.
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_NO', startSec: 16.5, endSec: 18.17, loop: false },
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms_ShakeNO', startSec: 18.17, endSec: 18.5, loop: false },
  // Beat 4b (18.5-20.5): "Don't do this." Discussion_1 6.1s > 2s.
  // First of TWO allowed Discussion uses.
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_Discussion_1', startSec: 18.5, endSec: 20.5, loop: false },
  // Beat 4c (20.5-22.5): "No no no no no!" CrossArms_ShakeNO 1.47s,
  // chain React_Stand_NO 1.67s (truncated to 0.53s).
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms_ShakeNO', startSec: 20.5, endSec: 21.97, loop: false },
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_NO', startSec: 21.97, endSec: 22.5, loop: false },
  // Beat 4d (22.5-24.5): "Why are you asking me this?" — Discussion_2
  // 5.47s > 2s. Second and last Discussion use.
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_Discussion_2', startSec: 22.5, endSec: 24.5, loop: false },
  // Beat 4e (24.5-27.0): NO NO NO PEAK. CrossArms_ShakeNO 1.47s, then
  // chain React_Stand_NO for the remaining 1.03s (intense head shake).
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms_ShakeNO', startSec: 24.5, endSec: 25.97, loop: false },
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_NO', startSec: 25.97, endSec: 27.0, loop: false },
  // Beat 4f (27-29): "I thought we were having a nice night." — appeal.
  // React_CrossArms_NodYES 1.2s, chain Wait_Pose for the remaining 0.8s.
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms_NodYES', startSec: 27.0, endSec: 28.2, loop: false },
  { type: 'animate', actorId: 'mia', clip: 'Wait_Pose', startSec: 28.2, endSec: 29.0, loop: false },
  // Beat 4g (29-30): final low "No." — CrossArms 0.8s, end-pose holds.
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms', startSec: 29.0, endSec: 30.0, loop: false },
  // Beat 5 (30-32): tantrum slam — React_Stand_Thinking 1.33s, chain
  // Wait_Pose for the freeze.
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_Thinking', startSec: 30.0, endSec: 31.33, loop: false },
  { type: 'animate', actorId: 'mia', clip: 'Wait_Pose', startSec: 31.33, endSec: 32.0, loop: false },
  // Beat 5b (32-36): post-slam stone. CrossArms held end-pose.
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms', startSec: 32.0, endSec: 36.0, loop: false },
  // Beat 6 (36-42): she's still stone, daring him. CrossArms held —
  // but break it at 39 with a small head shake so it doesn't feel
  // dead for 6 seconds.
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms_ShakeNO', startSec: 36.0, endSec: 37.47, loop: false },
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms', startSec: 37.47, endSec: 42.0, loop: false },
  // Beat 7 (42-45.5): SNAP-BACK to warm Idle_Wardrobe. THE punchline
  // depends on this specific warm idle returning (per Liveness item
  // about preserving meaningful eye/clip states across the cut).
  { type: 'animate', actorId: 'mia', clip: 'Idle_Wardrobe', startSec: 42.0, endSec: 45.5, loop: false },
];

// ----- Random blinks (asymmetric) -----
// Liam blinks at normal human rate across the whole skit. Mia blinks
// only during the calm opening + a sparse mid-window during the
// tantrum aftermath — EXPLICITLY NO BLINKS during the hold (13.5-16.5),
// the barrage (16.5-30), or the snap-back (42-45.5). The asymmetry IS
// the horror grammar: he's human, she's not.
const blinks: Action[] = [
  ...randomBlinks('liam', 0, 46, { seed: 7 }),
  ...randomBlinks('mia', 0, 13.5, { seed: 42 }),
  ...randomBlinks('mia', 30.0, 42.0, { seed: 99, minGapSec: 3.5, maxGapSec: 7.0 }),
];

export const niceDate: Skit = {
  id: 'NiceDate',
  title: 'The Nice Date',
  durationInSeconds: 46,
  fps: 30,
  width: 1080,
  height: 1920,
  hideSpeechBubbles: true,
  background: { kind: 'restaurant' },
  defaultCamera: {
    position: [0, 1.15, 6.0],
    lookAt: [0, 0.95, 0],
    fov: 36,
  },
  actors: [
    // LIAM — boyfriend. Asks the question; capitulates.
    {
      id: 'liam',
      sprite: 'dave',
      name: 'Liam',
      start: { x: LIAM_X, y: FLOOR },
      facing: 'down-right', // facing inward toward Mia
      scale: 1.0,
      outfit: {
        top: 'Clothes_Top_CollarShirt_Long',
        bottom: 'Clothes_Legs_Pants_Long',
        hair: 'Hair_Short',
        // No beard — clean-shaven for a cleaner read at TikTok size.
        skinTone: 'Skintone_4',
        hairColor: 'Haircolour_03',
        topColor: 'Cushion_Blue',
        legColor: 'Machine_Black',
        shoesColor: 'Espresso',
      },
    },
    // MIA — girlfriend. Soft pink, long hair. The horror IS the cuteness.
    {
      id: 'mia',
      sprite: 'alex',
      name: 'Mia',
      start: { x: MIA_X, y: FLOOR },
      facing: 'down-left', // facing inward toward Liam
      scale: 1.0,
      outfit: {
        top: 'Clothes_Top_CollarBlouse_Short',
        bottom: 'Clothes_Legs_Skirt',
        hair: 'Hair_Long',
        skinTone: 'Skintone_2',
        hairColor: 'Haircolour_07',
        topColor: 'Milkshake_Strawberry',
        legColor: 'Honey_Milk',
        shoesColor: 'Paper',
      },
    },
  ],
  timeline: [
    ...cameraTimeline,
    ...stepBack,
    ...dialogue,
    ...eyes,
    ...blinks,
    ...tint,
    ...effects,
    ...popups,
    ...animations,
  ],
};
