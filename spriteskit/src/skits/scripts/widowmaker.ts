/**
 * "WIDOWMAKER" — 70s noir action-trailer skit.
 *
 * Two operatives across a table. Only one is leaving alive — and
 * neither has drawn a weapon. Trailer language: dramatic VO + sharp
 * cuts + escalating tension + poisoned-coffee reveal + title slam.
 *
 * Cast:
 *   VESPER — the predator (Ivy)
 *   KESSLER — the mark (Callum)
 *   MARIN — the handler at her console (Matilda) [comms]
 *   NARRATOR — off-screen VO (Brian on eleven_v3 for audio tags)
 *
 * Beats:
 *   0:00–0:10  HOOK — ECU on Vesper's eye, whispered VO.
 *   0:10–0:30  ESCALATION — alternating two-shot cuts + Marin at console.
 *   0:30–0:45  REVEAL — poisoned coffee. POISONED card + white flash.
 *   0:45–0:55  TITLE SLAM — black frame, WIDOWMAKER burns in.
 *   0:55–0:70  RELEASE STAMP — tagline + "COMING — WINTER".
 */

import type { Skit, Action } from '../types';
import { VOICE_IDS } from '../../services/voiceIds';

const FLOOR = 1500;
// World-x positions: Vesper sits stage-left of the table, Kessler stage-right.
// Marin is in a separate location (the console) — placed off-axis far back
// so cuts to her register as a different room.
const VESPER_X = 380;
const KESSLER_X = 700;
const MARIN_X = 540;

// === CAMERA LANGUAGE ===
// We use distinct "spaces" by camera lookAt:
//   - The TABLE (lookAt y=1.55 between Vesper + Kessler)
//   - The CONSOLE (lookAt y=1.7 on Marin alone)
// Cuts to Marin push the camera way off to her side so she fills the frame
// solo — visually a different room.

const cam = (
  position: [number, number, number],
  lookAt: [number, number, number],
  fov: number,
  startSec: number,
  up?: [number, number, number]
): Action => ({
  type: 'camera',
  to: { position, lookAt, fov, ...(up ? { up } : {}) },
  startSec,
  endSec: startSec + 0.05,
});

const camTween = (
  fromSec: number,
  toSec: number,
  to: { position: [number, number, number]; lookAt: [number, number, number]; fov: number; up?: [number, number, number] }
): Action => ({ type: 'camera', to, startSec: fromSec, endSec: toSec });

const cameraTimeline: Action[] = [
  // 0:00 ECU on Vesper's eye — the ONE permitted ECU at the open.
  // Sets predator-stare tone, then breathes immediately.
  cam([-1.5, 1.85, 1.6], [-1.0, 1.85, 0], 16, 0.0),

  // 0:04 PULL BACK to wide two-shot establish — orient the audience.
  camTween(4.0, 6.0, { position: [0, 1.9, 5.6], lookAt: [0, 1.5, 0], fov: 36 }),

  // 0:06.5 HARD CUT to Kessler medium 3/4 — "you found me."
  cam([2.6, 1.85, 3.4], [1.0, 1.75, 0], 30, 6.5),

  // 0:08 HARD CUT to Vesper medium 3/4 (mirror) — "I never lost you."
  cam([-2.6, 1.85, 3.4], [-1.0, 1.75, 0], 30, 8.0),

  // 0:10 HARD CUT to WIDE 2-shot establish — VO line over both.
  cam([0, 1.9, 6.0], [0, 1.5, 0], 36, 10.0),

  // 0:13.8 HARD CUT to Kessler medium — "how long..."
  cam([2.4, 1.7, 3.6], [1.0, 1.7, 0], 30, 13.8),

  // 0:17 HARD CUT to Vesper medium — "Six months."
  cam([-2.4, 1.7, 3.6], [-1.0, 1.7, 0], 30, 17.0),

  // 0:19 HARD CUT to Marin (different space) — comms shot, medium.
  cam([3.6, 1.8, 3.0], [1.8, 1.7, 0], 32, 19.0),

  // 0:21.5 HARD CUT to Kessler medium with slight Dutch — tension rising.
  cam([2.6, 1.85, 3.2], [1.0, 1.75, 0], 30, 21.5, [0.08, 0.997, 0]),

  // 0:24 HARD CUT to Vesper mirror, slight Dutch other way.
  cam([-2.6, 1.85, 3.2], [-1.0, 1.75, 0], 30, 24.0, [-0.08, 0.997, 0]),

  // 0:26 HARD CUT to Marin — wider this time, full upper body.
  cam([3.2, 1.6, 4.0], [1.8, 1.5, 0], 34, 26.0),

  // 0:29 HARD CUT to Kessler 3/4 close (NOT ECU) — fear surfacing.
  cam([2.0, 1.85, 2.8], [1.0, 1.78, 0], 26, 29.0),

  // 0:30.5 HARD CUT to WIDE two-shot — VO three-beat over both, breathe.
  cam([0, 1.7, 5.8], [0, 1.5, 0], 36, 30.5),

  // 0:33.5 SLOW 3s PUSH on the two-shot — gentle creep, not aggressive.
  camTween(33.5, 36.5, { position: [0, 1.7, 4.6], lookAt: [0, 1.5, 0], fov: 34 }),

  // 0:36.5 HARD CUT to Vesper 3/4 with Dutch — the predator's calm.
  cam([-2.2, 1.85, 3.0], [-1.0, 1.78, 0], 28, 36.5, [-0.1, 0.995, 0]),

  // 0:39 HARD CUT to wide two-shot for the POISONED slam — the reveal
  // card lives on the wide so both faces are visible when it lands.
  cam([0, 1.7, 5.4], [0, 1.5, 0], 34, 39.0),

  // 0:41 HARD CUT to Kessler ECU — the realization. PERMITTED ECU #2.
  cam([1.6, 1.88, 1.8], [1.0, 1.85, 0], 18, 41.0),

  // 0:43.5 HARD CUT to Vesper 3/4 close — "I know." Medium-tight, not ECU.
  cam([-2.0, 1.85, 2.6], [-1.0, 1.78, 0], 26, 43.5),

  // 0:45.5 HARD CUT to Marin medium — flat comms.
  cam([3.2, 1.8, 3.4], [1.8, 1.7, 0], 30, 45.5),

  // 0:48 HARD CUT — VERY WIDE, both characters small in frame.
  cam([0, 1.8, 7.6], [0, 1.4, 0], 40, 48.0),

  // 0:51 HARD CUT to Vesper medium — alone, frontal.
  cam([-1.4, 1.78, 3.4], [-1.0, 1.75, 0], 30, 51.0),

  // 0:54 HARD CUT to wide held for title slam (actors fade out here).
  cam([0, 1.7, 6.4], [0, 1.4, 0], 36, 54.0),

  // 0:55.5 SLOW 3s PULL BACK for tagline VO.
  camTween(55.5, 58.5, { position: [0, 1.7, 8.0], lookAt: [0, 1.4, 0], fov: 40 }),

  // 0:59 HARD CUT to Vesper medium — composed, "she pours one."
  cam([-2.2, 1.78, 3.4], [-1.0, 1.75, 0], 30, 59.0),

  // 1:03 HARD CUT to wide held — release card lands.
  cam([0, 1.6, 6.8], [0, 1.3, 0], 38, 63.0),

  // 1:06 HARD CUT to Vesper ECU final — PERMITTED ECU #3. Closing stare.
  cam([-1.5, 1.85, 1.6], [-1.0, 1.85, 0], 16, 66.0),
];

const dialogue: Action[] = [
  // === BEAT 1 — HOOK (0:00–0:10) ===
  // Brian VO on eleven_v3 with audio tags.
  { type: 'speak', actorId: 'narrator', text: '[whispers] She knew the second he sat down.', voiceId: VOICE_IDS.brian, voiceModel: 'eleven_v3', startSec: 1.0, endSec: 4.5, volume: 1.6 },

  { type: 'speak', actorId: 'kessler', text: 'You found me.', voiceId: VOICE_IDS.callum, startSec: 5.5, endSec: 7.5, volume: 2.0 },
  { type: 'speak', actorId: 'vesper', text: 'I never lost you.', voiceId: VOICE_IDS.ivy, startSec: 8.0, endSec: 10.0, volume: 2.0 },

  // === BEAT 2 — ESCALATION (0:10–0:30) ===
  { type: 'speak', actorId: 'narrator', text: '[grim] Two operatives. One table. One exit.', voiceId: VOICE_IDS.brian, voiceModel: 'eleven_v3', startSec: 10.5, endSec: 13.8, volume: 1.6 },

  { type: 'speak', actorId: 'kessler', text: 'How long have you been sitting on me?', voiceId: VOICE_IDS.callum, startSec: 14.0, endSec: 16.8, volume: 2.0 },
  { type: 'speak', actorId: 'vesper', text: 'Six months.', voiceId: VOICE_IDS.ivy, startSec: 17.0, endSec: 18.5, volume: 2.0 },
  { type: 'speak', actorId: 'marin', text: 'Vitals climbing. He is reading you.', voiceId: VOICE_IDS.matilda, startSec: 19.0, endSec: 21.5, volume: 2.0 },
  { type: 'speak', actorId: 'kessler', text: 'There were rules, Vesper.', voiceId: VOICE_IDS.callum, startSec: 21.7, endSec: 23.8, volume: 2.0 },
  { type: 'speak', actorId: 'vesper', text: 'There were. Past tense.', voiceId: VOICE_IDS.ivy, startSec: 24.0, endSec: 25.8, volume: 2.0 },
  { type: 'speak', actorId: 'marin', text: 'Hold position. Two minutes.', voiceId: VOICE_IDS.matilda, startSec: 26.0, endSec: 28.5, volume: 2.0 },
  { type: 'speak', actorId: 'kessler', text: 'Two minutes for what?', voiceId: VOICE_IDS.callum, startSec: 29.0, endSec: 30.5, volume: 2.0 },

  // === BEAT 3 — REVEAL (0:30–0:45) ===
  { type: 'speak', actorId: 'narrator', text: '[ominous] She came for one thing.', voiceId: VOICE_IDS.brian, voiceModel: 'eleven_v3', startSec: 30.7, endSec: 33.0, volume: 1.6 },
  { type: 'speak', actorId: 'narrator', text: '[whispers] She will leave with another.', voiceId: VOICE_IDS.brian, voiceModel: 'eleven_v3', startSec: 33.5, endSec: 36.3, volume: 1.6 },
  { type: 'speak', actorId: 'narrator', text: '[dark] And you will not see her until it is done.', voiceId: VOICE_IDS.brian, voiceModel: 'eleven_v3', startSec: 36.5, endSec: 39.5, volume: 1.6 },

  // 0:39.5–0:41 silent — POISONED card + white flash live here.

  { type: 'speak', actorId: 'kessler', text: 'The coffee...', voiceId: VOICE_IDS.callum, startSec: 41.0, endSec: 43.0, volume: 2.0 },
  { type: 'speak', actorId: 'vesper', text: 'I know.', voiceId: VOICE_IDS.ivy, startSec: 43.5, endSec: 44.8, volume: 2.0 },

  // === BEAT 4 — TITLE SLAM (0:45–0:55) ===
  { type: 'speak', actorId: 'marin', text: 'Target confirmed. Bring her home.', voiceId: VOICE_IDS.matilda, startSec: 45.5, endSec: 47.8, volume: 2.0 },

  { type: 'speak', actorId: 'narrator', text: '[grim] Some marks are killed.', voiceId: VOICE_IDS.brian, voiceModel: 'eleven_v3', startSec: 48.0, endSec: 50.5, volume: 1.6 },
  { type: 'speak', actorId: 'narrator', text: '[whispers] Others are kept company.', voiceId: VOICE_IDS.brian, voiceModel: 'eleven_v3', startSec: 51.0, endSec: 53.8, volume: 1.6 },

  // 0:54–0:55 silent — TITLE SLAM happens here.

  // === BEAT 5 — RELEASE STAMP (0:55–0:70) ===
  { type: 'speak', actorId: 'narrator', text: '[deep] Widowmaker.', voiceId: VOICE_IDS.brian, voiceModel: 'eleven_v3', startSec: 55.5, endSec: 58.5, volume: 1.6 },
  { type: 'speak', actorId: 'narrator', text: '[ominous] She does not pull a trigger. She pours one.', voiceId: VOICE_IDS.brian, voiceModel: 'eleven_v3', startSec: 59.0, endSec: 62.8, volume: 1.6 },
  { type: 'speak', actorId: 'narrator', text: '[whispers] This winter. The last drink you will ever order.', voiceId: VOICE_IDS.brian, voiceModel: 'eleven_v3', startSec: 63.0, endSec: 67.5, volume: 1.6 },
];

// === LOWER-THIRD CAPTIONS (subtitles for spoken lines) ===
// Subtitles repeat the spoken text without audio tags. Caption styling
// (size < 90) is auto-detected by PopupText for lower-third look.
const captions: Action[] = [
  { type: 'popupText', text: 'She knew the second he sat down.', startSec: 1.2, endSec: 4.7, y: 0.85, color: '#e8dccc', size: 48 },
  { type: 'popupText', text: 'You found me.', startSec: 5.7, endSec: 7.6, y: 0.85, color: '#e8dccc', size: 54 },
  { type: 'popupText', text: 'I never lost you.', startSec: 8.2, endSec: 10.0, y: 0.85, color: '#e8dccc', size: 54 },
  { type: 'popupText', text: 'Two operatives.\nOne table. One exit.', startSec: 10.7, endSec: 13.9, y: 0.82, color: '#e8dccc', size: 50 },
  { type: 'popupText', text: 'How long have you\nbeen sitting on me?', startSec: 14.2, endSec: 16.9, y: 0.82, color: '#e8dccc', size: 50 },
  { type: 'popupText', text: 'Six months.', startSec: 17.2, endSec: 18.6, y: 0.85, color: '#e8dccc', size: 60 },
  { type: 'popupText', text: 'Vitals climbing.\nHe is reading you.', startSec: 19.2, endSec: 21.6, y: 0.82, color: '#a8e8ff', size: 46 },
  { type: 'popupText', text: 'There were rules, Vesper.', startSec: 21.9, endSec: 23.9, y: 0.85, color: '#e8dccc', size: 50 },
  { type: 'popupText', text: 'There were. Past tense.', startSec: 24.2, endSec: 25.9, y: 0.85, color: '#e8dccc', size: 52 },
  { type: 'popupText', text: 'Hold position. Two minutes.', startSec: 26.2, endSec: 28.6, y: 0.85, color: '#a8e8ff', size: 46 },
  { type: 'popupText', text: 'Two minutes for what?', startSec: 29.2, endSec: 30.6, y: 0.85, color: '#e8dccc', size: 52 },

  { type: 'popupText', text: 'She came for one thing.', startSec: 30.9, endSec: 33.1, y: 0.85, color: '#e8dccc', size: 52 },
  { type: 'popupText', text: 'She will leave\nwith another.', startSec: 33.7, endSec: 36.4, y: 0.82, color: '#e8dccc', size: 52 },
  { type: 'popupText', text: 'And you will not see her\nuntil it is done.', startSec: 36.7, endSec: 39.6, y: 0.82, color: '#e8dccc', size: 48 },

  { type: 'popupText', text: 'The coffee...', startSec: 41.2, endSec: 43.1, y: 0.85, color: '#e8dccc', size: 56 },
  { type: 'popupText', text: 'I know.', startSec: 43.7, endSec: 44.9, y: 0.85, color: '#e8dccc', size: 64 },

  { type: 'popupText', text: 'Target confirmed.\nBring her home.', startSec: 45.7, endSec: 47.9, y: 0.82, color: '#a8e8ff', size: 48 },
  { type: 'popupText', text: 'Some marks are killed.', startSec: 48.2, endSec: 50.6, y: 0.85, color: '#e8dccc', size: 52 },
  { type: 'popupText', text: 'Others are kept company.', startSec: 51.2, endSec: 53.9, y: 0.85, color: '#e8dccc', size: 52 },

  { type: 'popupText', text: 'She does not pull a trigger.\nShe pours one.', startSec: 59.2, endSec: 62.9, y: 0.82, color: '#e8dccc', size: 50 },
  { type: 'popupText', text: 'This winter.\nThe last drink you will ever order.', startSec: 63.2, endSec: 67.6, y: 0.82, color: '#e8dccc', size: 44 },
];

// === BIG MEME-CARD STYLE TYPOGRAPHY (size ≥ 90) ===
const bigCards: Action[] = [
  // POISONED slam at the reveal moment.
  { type: 'popupText', text: 'POISONED', startSec: 39.7, endSec: 41.2, y: 0.5, color: '#ff3a3a', size: 200, rotate: -3 },

  // TITLE SLAM.
  { type: 'popupText', text: 'WIDOWMAKER', startSec: 54.0, endSec: 58.5, y: 0.45, color: '#ffd76b', size: 170, rotate: 0 },

  // RELEASE DATE.
  { type: 'popupText', text: 'COMING\nWINTER', startSec: 67.5, endSec: 70.0, y: 0.45, color: '#ffd76b', size: 140, rotate: 0 },
];

export const widowmaker: Skit = {
  id: 'Widowmaker',
  title: 'WIDOWMAKER (Trailer)',
  durationInSeconds: 70,
  fps: 30,
  width: 1080,
  height: 1920,
  hideSpeechBubbles: true,
  background: {
    // Cold-blue interrogation noir.
    kind: 'radial',
    colors: ['#1a1d24', '#020306'],
  },
  defaultCamera: {
    position: [-1.5, 1.85, 1.6],
    lookAt: [-1.0, 1.85, 0],
    fov: 16,
  },
  actors: [
    // VESPER — the predator (Ivy).
    {
      id: 'vesper',
      sprite: 'alex',
      name: 'Vesper',
      start: { x: VESPER_X, y: FLOOR },
      // Faces right (toward Kessler).
      facing: 'down-right',
      scale: 1.0,
      outfit: {
        top: 'Clothes_Top_CollarBlouse_Short',
        bottom: 'Clothes_Legs_Skirt_Long',
        hair: 'Hair_ShortBob',
        skinTone: 'Skintone_2',
        hairColor: 'Haircolour_09',
        topColor: 'Machine_Black',
        legColor: 'Machine_Black',
        shoesColor: 'Machine_Black',
      },
    },
    // KESSLER — the mark (Callum).
    {
      id: 'kessler',
      sprite: 'dave',
      name: 'Kessler',
      start: { x: KESSLER_X, y: FLOOR },
      // Faces left (toward Vesper).
      facing: 'down-left',
      scale: 1.0,
      outfit: {
        top: 'Clothes_Top_CollarShirt_Long',
        bottom: 'Clothes_Legs_Pants_Long',
        hair: 'Hair_SideSweep',
        beard: 'Beard_Lower',
        accessory: 'Accessory_Glasses',
        accessoryColor: '#1a1a1a',
        skinTone: 'Skintone_4',
        hairColor: 'Haircolour_07',
        topColor: 'Grey',
        legColor: 'Olive_Sofa',
        shoesColor: 'Machine_Black',
      },
    },
    // MARIN — the handler (Matilda). Placed far stage-right and slightly
    // back, so when the camera cuts to her side it reads as a different
    // space (her console / not at the table).
    {
      id: 'marin',
      sprite: 'boss',
      name: 'Marin',
      start: { x: MARIN_X + 800, y: FLOOR }, // pushed offscreen-right
      facing: 'down',
      scale: 0.95,
      outfit: {
        top: 'Clothes_Top_Sweater_TurtleNeck',
        bottom: 'Clothes_Legs_Pants_Short_Pockets',
        hair: 'Hair_Shave_Buzzcut',
        accessory: 'Accessory_Headphones_black',
        accessoryColor: '#1a1a1a',
        skinTone: 'Skintone_5',
        hairColor: 'Haircolour_08',
        topColor: 'Cushion_Red',
        legColor: 'Olive_Sofa',
        shoesColor: 'Machine_Black',
      },
    },
    // NARRATOR — invisible. Lives offscreen, used only as the audio source
    // for VO speak actions. We hide them with `hidden: true` (engine still
    // plays audio but doesn't render the character).
    {
      id: 'narrator',
      sprite: 'dave',
      name: 'Narrator',
      start: { x: -2000, y: FLOOR },
      facing: 'down',
      scale: 0.01,
      hidden: true,
    },
  ],
  timeline: [
    ...cameraTimeline,
    ...dialogue,
    ...captions,
    ...bigCards,

    // === FLASH on the POISONED reveal ===
    { type: 'flash', startSec: 39.7, endSec: 40.0, color: '#ffffff' },
    { type: 'flash', startSec: 40.3, endSec: 40.5, color: '#ffffff' },

    // === SHAKE during the reveal ===
    { type: 'shake', startSec: 39.7, endSec: 41.2, intensity: 25 },

    // === TITLE SLAM black-out: fade actors to invisible 54.0–55.0 ===
    { type: 'fade', actorId: 'vesper', fromOpacity: 1, toOpacity: 0, startSec: 54.0, endSec: 55.0 },
    { type: 'fade', actorId: 'kessler', fromOpacity: 1, toOpacity: 0, startSec: 54.0, endSec: 55.0 },
    { type: 'fade', actorId: 'marin', fromOpacity: 1, toOpacity: 0, startSec: 54.0, endSec: 55.0 },
    // Bring Vesper back at 59 for the closing shot.
    { type: 'fade', actorId: 'vesper', fromOpacity: 0, toOpacity: 1, startSec: 58.5, endSec: 59.0 },
    // Final fade-out at end.
    { type: 'fade', actorId: 'vesper', fromOpacity: 1, toOpacity: 0, startSec: 67.5, endSec: 69.0 },

    // === ANIMATIONS ===
    // All `loop: false`. When a one-shot ends, the engine falls back to
    // the default looping idle (React_Stand_Discussion_1) automatically.
    // For long "calm idle" stretches we issue NO animate action at all —
    // the default idle is already the desired behaviour.

    // VESPER — held composure. Fire CrossArms once at the reveal beat
    // for "she always knew." Otherwise default idle carries her.
    { type: 'animate', actorId: 'vesper', clip: 'React_CrossArms', startSec: 30, endSec: 33, loop: false },

    // KESSLER — three one-shot beats: questioning gesture at 14s,
    // headshake denial at 22s, hard NO on the realization at 39s.
    { type: 'animate', actorId: 'kessler', clip: 'React_Stand_Discussion_2', startSec: 14, endSec: 17, loop: false },
    { type: 'animate', actorId: 'kessler', clip: 'React_CrossArms_ShakeNO', startSec: 22, endSec: 25, loop: false },
    { type: 'animate', actorId: 'kessler', clip: 'React_Stand_NO', startSec: 39, endSec: 42, loop: false },

    // MARIN — single CrossArms gesture at the comms moment. Otherwise
    // she's not on screen long enough to need explicit choreography.
    { type: 'animate', actorId: 'marin', clip: 'React_CrossArms', startSec: 19, endSec: 22, loop: false },
    { type: 'animate', actorId: 'marin', clip: 'React_CrossArms', startSec: 45, endSec: 48, loop: false },

    // === EYES ===
    // VESPER — Eye_Flat throughout (predator's unreadable stare).
    { type: 'eyes', actorId: 'vesper', eyes: 'Eye_Flat', startSec: 0, endSec: 70 },

    // KESSLER — default through opening, frustrated mid, angry on realization.
    { type: 'eyes', actorId: 'kessler', eyes: 'Eye_Frustrated', startSec: 22, endSec: 29 },
    { type: 'eyes', actorId: 'kessler', eyes: 'Eye_Angry', startSec: 39, endSec: 44 },

    // MARIN — Eye_Flat (focused operator).
    { type: 'eyes', actorId: 'marin', eyes: 'Eye_Flat', startSec: 0, endSec: 70 },
  ],
};
