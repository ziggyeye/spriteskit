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
// +1.1 after the step-back). Cocktail table at world (0, 0.55, 0).
// Cameras are pulled back further than v1; lookAt Y values centered
// around chest (0.95-1.15) to avoid cropping heads even when pushing
// in tight. FOVs bumped up where shots were chopping.
const cameraTimeline: Action[] = [
  // 0:00 OPEN — wide two-shot establishing. ~6m back to fit both
  // characters + the table comfortably.
  { type: 'camera', to: { position: [0, 1.15, 6.0], lookAt: [0, 0.95, 0], fov: 36 }, startSec: 0.0, endSec: 0.05 },

  // 0:04 HARD CUT — over-the-shoulder from behind Mia, framing Liam.
  // STAYS on Liam through BOTH his setup line AND the question
  // ("Hey. Can I ask you something?" → "Does your dad actually have
  // cancer?"). Her "Mhm?" interjection happens off-screen — keeping
  // the camera on the speaker is the right convention for dialogue.
  { type: 'camera', to: { position: [1.6, 1.25, 3.2], lookAt: [-0.7, 1.05, 0], fov: 34 }, startSec: 4.0, endSec: 4.05 },

  // 0:13.0 HARD CUT — to Mia just as Liam's question lands (his line
  // ends at 12.8). She gets ~0.5s of silent reaction in this medium
  // before the hold beat extends from 13.5. Wide two-shot showing
  // both characters so the step-back at 15.5 reads cleanly.
  { type: 'camera', to: { position: [0, 1.2, 5.0], lookAt: [0.2, 0.95, 0], fov: 34 }, startSec: 13.0, endSec: 13.05 },

  // 0:16.0 SLOW PUSH on Mia — HORROR-MOVIE ZOOM. Starts at medium
  // distance (3.6m), pushes in over 3.5s to closer-medium (2.6m).
  // Crosses her unblinking-stare freeze (16.0-17.5) AND the first
  // "No." (17.5-18.4). FOV stays at 32 — generous headroom prevents
  // cropping during the push.
  { type: 'camera', to: { position: [0.2, 1.25, 2.6], lookAt: [1.1, 1.05, 0], fov: 32 }, startSec: 16.0, endSec: 19.5 },

  // 0:21.0 HARD CUT — slight angle change so it doesn't feel like
  // an endless static zoom. Same tightness, mirror vantage.
  { type: 'camera', to: { position: [-0.2, 1.25, 2.6], lookAt: [1.1, 1.05, 0], fov: 32 }, startSec: 21.0, endSec: 21.05 },

  // 0:25.0 SLOW PUSH on Mia for the SCREAM peak. Tightens from
  // medium to a closer 3/4 over 2.5s — but stays loose enough to
  // keep her head fully in frame (lookAt Y=1.0, FOV=30).
  { type: 'camera', to: { position: [0.3, 1.3, 2.1], lookAt: [1.1, 1.0, 0], fov: 30 }, startSec: 25.0, endSec: 27.5 },

  // 0:27.6 HARD CUT — quick reaction on Liam (world x=-0.7).
  // Wider framing — Liam's reaction beat shouldn't compete.
  { type: 'camera', to: { position: [0.8, 1.25, 3.6], lookAt: [-0.7, 1.05, 0], fov: 32 }, startSec: 27.6, endSec: 27.65 },

  // 0:28.5 HARD CUT — back to Mia for the guilt-trip line + final low
  // "No." Profile from the other side, fresh angle.
  { type: 'camera', to: { position: [-0.4, 1.25, 3.0], lookAt: [1.1, 1.05, 0], fov: 32 }, startSec: 28.5, endSec: 28.55 },

  // 0:30 HARD CUT — LOW-ANGLE 3/4 on Mia (still at world x≈+1.1). She
  // looms. Pulled back slightly + wider FOV so we don't crop her head.
  { type: 'camera', to: { position: [0.2, 0.55, 3.0], lookAt: [1.1, 1.1, 0], fov: 34 }, startSec: 30.0, endSec: 30.05 },

  // 0:33.5 HARD CUT — high-angle iso down on the table aftermath.
  { type: 'camera', to: { position: [1.6, 3.0, 4.6], lookAt: [0, 0.5, 0], fov: 38 }, startSec: 33.5, endSec: 33.55 },

  // 0:36 HARD CUT — OTS from behind Mia onto Liam (her looming silhouette).
  // Pulled back to 3.2 + FOV 34 for full upper-body on Liam.
  { type: 'camera', to: { position: [1.4, 1.25, 3.2], lookAt: [-0.7, 1.05, 0], fov: 34 }, startSec: 36.0, endSec: 36.05 },

  // 0:42 HARD CUT — medium on Mia for the punchline. She's at world
  // x=+1.1. Loose enough to show face + hint of table.
  { type: 'camera', to: { position: [0.4, 1.25, 3.4], lookAt: [1.1, 1.05, 0], fov: 32 }, startSec: 42.0, endSec: 42.05 },
];

// ----- Mia's step-back -----
// Between the silent hold (13.5-16.5) and the barrage starting (16.5),
// Mia takes a half-step backward — toward the right edge of the frame
// since she's on the right side of the table. Reads as "she pushed
// her chair back / rose to her feet." The walk auto-plays Walk_Loop
// during the move, then she settles into the no-barrage from her new
// position. Camera ECUs are tuned for this new offset.
// Faster walk (0.5s instead of 0.8s) so the freeze-stare beat that
// follows has room to breathe within the existing 16.5s "start of
// barrage" anchor. After the walk ends at 16.0, Mia STARES at Liam
// without animation or blinks for 1.5 seconds — that frozen
// unblinking moment is the horror beat.
const stepBack: Action[] = [
  { type: 'walk', actorId: 'mia', to: { x: MIA_STEP_BACK_X, y: FLOOR }, startSec: 15.5, endSec: 16.0, facing: 'down-left' },
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
  // lines (the deflection-and-redirect pattern). Starts at 17.5
  // (after the 1.5s freeze-stare beat at 16.0-17.5). Original lines
  // in the same emotional shape as the source film's beat without
  // reproducing any specific dialogue. Pattern is:
  //   no -> double-no -> "don't do this." -> rapid no-burst ->
  //   "why are you asking me this?" -> peak SCREAM -> guilt-trip ->
  //   definitive low no
  { type: 'speak', actorId: 'mia', text: 'No.', voiceId: VOICE_IDS.jessica, startSec: 17.5, endSec: 18.4, volume: 2.0 },
  { type: 'speak', actorId: 'mia', text: 'No no!', voiceId: VOICE_IDS.jessica, startSec: 18.6, endSec: 19.5, volume: 2.0 },
  // Protest 1: deflection
  { type: 'speak', actorId: 'mia', text: "Don't do this.", voiceId: VOICE_IDS.jessica, startSec: 19.7, endSec: 21.0, volume: 2.0 },
  { type: 'speak', actorId: 'mia', text: 'No no no no no!', voiceId: VOICE_IDS.jessica, startSec: 21.2, endSec: 23.0, volume: 2.0 },
  // Protest 2: appeal
  { type: 'speak', actorId: 'mia', text: 'Why are you asking me this?', voiceId: VOICE_IDS.jessica, startSec: 23.2, endSec: 25.0, volume: 2.0 },
  // PEAK scream
  { type: 'speak', actorId: 'mia', text: 'NO NO NO NO NO!', voiceId: VOICE_IDS.jessica, startSec: 25.2, endSec: 27.4, volume: 2.0 },
  // Protest 3: guilt-trip
  { type: 'speak', actorId: 'mia', text: 'I thought we were having a nice night.', voiceId: VOICE_IDS.jessica, startSec: 27.6, endSec: 29.0, volume: 2.0 },
  // Definitive low final no
  { type: 'speak', actorId: 'mia', text: 'No.', voiceId: VOICE_IDS.jessica, startSec: 29.2, endSec: 30.0, volume: 2.0 },

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

  // Mia — eye states ride the dramatic curve:
  // 0-15.2: Default (warm, normal date energy)
  // 15.2-17.5: Eye_Flat — through the hold + step-back + freeze-stare.
  //   Flat eyes WHILE the smile is still on her face IS the horror beat.
  // 17.5-19.5: Eye_Frustrated — building as the no's start
  // 19.5-42: Eye_Angry — sustained meltdown, held through capitulation
  // 42-45.5: Eye_0_Default — INSTANT SNAP-BACK, the visual punchline
  { type: 'eyes', actorId: 'mia', eyes: 'Eye_0_Default', startSec: 0, endSec: 15.2 },
  { type: 'eyes', actorId: 'mia', eyes: 'Eye_Flat', startSec: 15.2, endSec: 17.5 },
  { type: 'eyes', actorId: 'mia', eyes: 'Eye_Frustrated', startSec: 17.5, endSec: 19.5 },
  { type: 'eyes', actorId: 'mia', eyes: 'Eye_Angry', startSec: 19.5, endSec: 42.0 },
  { type: 'eyes', actorId: 'mia', eyes: 'Eye_0_Default', startSec: 42.0, endSec: 45.5 },
];

// ----- Mouth choreography -----
// The rest-mouth state used when characters are silent. While a speak
// action is active, its viseme track drives the mouth for lip-sync —
// these `mouth` overrides only apply during silent windows + between
// dialogue gaps. The default rest is Lips_20 (neutral flat); we
// override it here to give each character their emotional mouth.
//
// Liam: stays Lips_20 (neutral) the entire skit — he's not smiling,
// he's not making faces, he's just reacting. Default works for him.
//
// Mia: warm Smiley during the date phase, smile HELD through the
// freeze beat (smile + flat eyes = the horror), Angry during the
// meltdown so gap-frames between no's stay angry, Upset for the
// post-tantrum stone, then INSTANT SNAP BACK to Smiley for the punch.
const mouths: Action[] = [
  // Mia mouth arc — see Eye_Default → Smiley → Angry → Upset → Smiley
  { type: 'mouth', actorId: 'mia', mouth: 'Lips_26_Smiley', startSec: 0, endSec: 17.5 },
  { type: 'mouth', actorId: 'mia', mouth: 'Lips_23_Angry', startSec: 17.5, endSec: 30.0 },
  { type: 'mouth', actorId: 'mia', mouth: 'Lips_21_Upset', startSec: 30.0, endSec: 42.0 },
  { type: 'mouth', actorId: 'mia', mouth: 'Lips_26_Smiley', startSec: 42.0, endSec: 45.5 },

  // Liam — slight confused mouth during the meltdown, otherwise default neutral.
  { type: 'mouth', actorId: 'liam', mouth: 'Lips_29_Confused', startSec: 16.5, endSec: 30.0 },
  { type: 'mouth', actorId: 'liam', mouth: 'Lips_21_Upset', startSec: 30.0, endSec: 42.0 },
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
  // Beat 3 (13.5-15.5): THE HOLD. Wait_Pose freeze, smile still on.
  { type: 'animate', actorId: 'mia', clip: 'Wait_Pose', startSec: 13.5, endSec: 15.5, loop: false },
  // 15.5-16.0 = walk (overrides). After it ends, MIA FREEZES from
  // 16.0-17.5 — Wait_Pose held without animation, blinks excluded
  // from this window, just an unblinking stare at Liam. THIS is the
  // moment the smile drops and the horror reads.
  { type: 'animate', actorId: 'mia', clip: 'Wait_Pose', startSec: 16.0, endSec: 17.5, loop: false },
  // Beat 4a (17.5-18.7): first "No." React_Stand_NO 1.67s nearly fills.
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_NO', startSec: 17.5, endSec: 18.6, loop: false },
  // Beat 4b (18.7-19.9): "No no!" — CrossArms_ShakeNO 1.47s.
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms_ShakeNO', startSec: 18.7, endSec: 19.9, loop: false },
  // Beat 4c (19.9-21.4): "Don't do this." — Discussion_1 (1st of 2 allowed)
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_Discussion_1', startSec: 19.9, endSec: 21.4, loop: false },
  // Beat 4d (21.4-23.4): "No no no no no!" head-shake.
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms_ShakeNO', startSec: 21.4, endSec: 22.87, loop: false },
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_NO', startSec: 22.87, endSec: 23.4, loop: false },
  // Beat 4e (23.4-25.4): "Why are you asking me this?" Discussion_2
  // (2nd and last allowed Discussion use).
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_Discussion_2', startSec: 23.4, endSec: 25.4, loop: false },
  // Beat 4f (25.4-27.9): NO NO NO PEAK. ShakeNO + chain Stand_NO.
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms_ShakeNO', startSec: 25.4, endSec: 26.87, loop: false },
  { type: 'animate', actorId: 'mia', clip: 'React_Stand_NO', startSec: 26.87, endSec: 27.9, loop: false },
  // Beat 4g (27.9-29.2): "I thought we were having a nice night."
  // appeal posture — NodYES 1.2s, then bridge Wait_Pose.
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms_NodYES', startSec: 27.9, endSec: 29.1, loop: false },
  { type: 'animate', actorId: 'mia', clip: 'Wait_Pose', startSec: 29.1, endSec: 29.2, loop: false },
  // Beat 4h (29.2-30): final low "No." CrossArms 0.8s.
  { type: 'animate', actorId: 'mia', clip: 'React_CrossArms', startSec: 29.2, endSec: 30.0, loop: false },
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
    // mouths BEFORE dialogue so speak actions' per-frame visemes
    // override the rest-mouth during talking windows.
    ...mouths,
    ...dialogue,
    ...eyes,
    ...blinks,
    ...tint,
    ...effects,
    ...popups,
    ...animations,
  ],
};
