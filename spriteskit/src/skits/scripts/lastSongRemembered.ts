/**
 * "The Last Person Who Remembers The Song" — 75s earnest cinematic skit.
 *
 * Beats:
 *   0:00–0:03  Hook: elder humming in a dim room. Caption establishes premise.
 *   0:03–0:10  Slow orbit around the elder mid-hum.
 *   0:10–0:18  Push to ECU on his mouth as he hums.
 *   0:18–0:25  Pull back to two-shot; the child walks in from the right.
 *   0:25–0:32  OTS over the elder onto the listening child (child faces camera).
 *   0:32–0:42  Teaching the four notes (very slow push-in on the two of them).
 *   0:42–0:55  The child mirrors back; warm tint transfers from elder → child.
 *   0:55–1:02  Elder at peace, eyes closed; camera dollies back.
 *   0:58–1:08  Elder dissolves (opacity fade to 0).
 *   1:02–1:09  Camera drifts right onto the girl as the elder fades.
 *   1:09–1:15  Tight on the girl alone. Closing line: "Some songs only end when we stop singing them."
 *
 * Spacing math (see AGENTS.md "Coordinate spaces" section):
 *   - Character width ≈ 1.365 world units = ~655 px at scale 1.0.
 *   - Elder at scale 1.0: half-width 0.683 units (328 px).
 *   - Child at scale 0.7: half-width 0.478 units (230 px).
 *   - Minimum centre-to-centre to avoid mesh intersection: 1.161 units (557 px).
 *   - We use 580 px → 1.21 world units (~4% breathing room).
 */

import { staticFile } from 'remotion';
import type { Skit, Action } from '../types';
import { eyeBlinkAt, eyeStarryLoopAt } from '../eyeSequences';
import { VOICE_IDS } from '../../services/voiceIds';

const FLOOR = 1500;
const ELDER_X = 320; // skit-pixel; world x ≈ -0.46
const CHILD_X = 900; // skit-pixel; world x ≈ +0.75. centre-to-centre = 580 px.
const CHILD_OFFSCREEN_X = 1280; // offscreen-right start point

/**
 * Camera framing math reference (1080×1920 portrait canvas, aspect 0.5625):
 *
 *   Three.js fov is VERTICAL. Horizontal visible width =
 *     2 * d * tan(fovV / 2) * (W/H) = 1.125 * d * tan(fovV/2).
 *
 *   ACTOR Y POSITIONS — actors have skit-pixel y=1500 → world feet at
 *   y=0.875. Elder at scale 1.0: feet 0.875, head top 2.327, eye line
 *   ≈ 1.825, mouth ≈ 1.73, body centre ≈ 1.6.
 *   Child at scale 0.7: feet 0.875, head top ≈ 1.89, eye line ≈ 1.54,
 *   mouth ≈ 1.47, body centre ≈ 1.38.
 *
 *   Two-actor span: -0.46 to +0.75 plus widths gives ≈1.42 units. For
 *   a comfortable two-shot need horizontal-visible ≈ 2.0 units.
 *     fov 35°, d = 5.6 → visible-horiz ≈ 2.0 ✓
 *
 *   For a face close-up: visible-vertical ≈ 0.6 (head fills frame).
 *     fov 22°, d = 1.55 ✓
 *
 *   Camera Y should match the subject's eye line for natural framing.
 *   LookAt Y also at eye line, so face sits at vertical centre.
 */

const cameraTimeline: Action[] = [
  // 0:00 wide establishing — slightly LOW angle (camera y=1.0, looking
  // up at the elder y=1.6). Low angle reads as reverent / monumental.
  {
    type: 'camera',
    to: { position: [-0.46, 1.0, 6.4], lookAt: [-0.46, 1.6, 0], fov: 38 },
    startSec: 0,
    endSec: 0.05,
  },
  // 0:03 orbit start — a 3D arc, not a flat circle. Camera dips DOWN
  // as it sweeps from left to right, then back up. Combined with a
  // subtle Dutch tilt that resolves to level, this reads as the song
  // settling. d≈3.2 fov 36.
  {
    type: 'camera',
    to: {
      position: [-1.8, 2.4, 3.0],
      lookAt: [-0.46, 1.83, 0],
      fov: 36,
      up: [-0.12, 1, 0], // slight Dutch tilt at orbit start
    },
    startSec: 3.0,
    endSec: 3.05,
  },
  {
    type: 'camera',
    to: {
      position: [1.0, 1.4, 3.0],
      lookAt: [-0.46, 1.83, 0],
      fov: 36,
      up: [0.08, 1, 0], // tilt resolves to opposite side as we arc
    },
    startSec: 3.05,
    endSec: 10.0,
  },
  // 0:10–0:18 push to ECU on the elder's face. Camera comes in from
  // a SIDE angle (positive X), not square-on. d=0.9 fov 22.
  {
    type: 'camera',
    to: { position: [0.05, 1.83, 0.85], lookAt: [-0.46, 1.83, 0], fov: 22 },
    startSec: 10.0,
    endSec: 18.0,
  },
  // 0:18–0:21 pull back to medium two-shot, slightly HIGH angle
  // (camera at y=2.0 looking down to y=1.5). High angle reads as
  // contemplative / observing-from-above.
  {
    type: 'camera',
    to: { position: [0.145, 2.0, 5.6], lookAt: [0.145, 1.5, 0], fov: 35 },
    startSec: 18.0,
    endSec: 21.0,
  },
  // 0:25–0:30 OTS over the elder onto the child. Camera at her eye
  // line, slightly past elder. The diagonal X-offset gives a 3/4 angle
  // on the child's face (more dimensional than straight-on).
  {
    type: 'camera',
    to: { position: [0.35, 1.54, 1.6], lookAt: [0.75, 1.54, 0], fov: 26 },
    startSec: 25.0,
    endSec: 30.0,
  },
  // 0:32 hard-cut to two-shot. LOW angle now (camera y=1.0 looking up
  // to 1.7) so the actors loom — emotionally elevates them during the
  // teaching beat. Slow push-in over 10s.
  {
    type: 'camera',
    to: { position: [0.145, 1.0, 5.6], lookAt: [0.145, 1.7, 0], fov: 35 },
    startSec: 32.0,
    endSec: 32.05,
  },
  {
    type: 'camera',
    to: { position: [0.145, 1.1, 4.2], lookAt: [0.145, 1.7, 0], fov: 32 },
    startSec: 32.05,
    endSec: 42.0,
  },
  // 0:50–0:55 push to ECU on the child's face. Diagonal approach
  // (offset on x AND z) so we get a 3/4 face shot. d≈1.4 fov 24.
  {
    type: 'camera',
    to: { position: [0.95, 1.54, 1.25], lookAt: [0.75, 1.54, 0], fov: 24 },
    startSec: 50.0,
    endSec: 55.0,
  },
  // 0:55–0:60 pull back from the child ECU to a wide two-shot so the
  // elder is fully in frame as he begins to fade.
  {
    type: 'camera',
    to: { position: [0.145, 1.6, 5.6], lookAt: [0.145, 1.5, 0], fov: 35 },
    startSec: 55.0,
    endSec: 60.0,
  },
  // 0:60–0:68 hold the wide two-shot through the elder's dissolve.
  // (No camera action = the previous state holds.)

  // 1:08–1:13 drift in onto the girl alone for the closing line. By
  // now the elder is fully transparent, so framing on her position
  // (world x=0.75) puts her dead-centre with the empty hearth glow
  // beside her.
  {
    type: 'camera',
    to: { position: [0.75, 1.55, 2.4], lookAt: [0.75, 1.55, 0], fov: 28 },
    startSec: 68.0,
    endSec: 72.0,
  },
];

export const lastSongRemembered: Skit = {
  id: 'LastSongRemembered',
  title: 'The Last Person Who Remembers The Song',
  durationInSeconds: 75,
  fps: 30,
  width: 1080,
  height: 1920,
  background: {
    // Warm hearth glow in the centre fading to near-black edges. Reads
    // like a dim quiet room without needing a real environment mesh.
    kind: 'radial',
    colors: ['#3a3530', '#0e0c0a'],
  },
  actors: [
    {
      id: 'elder',
      sprite: 'dave',
      name: 'HE',
      start: { x: ELDER_X, y: FLOOR },
      facing: 'down',
      scale: 1.0,
      outfit: {
        top: 'Clothes_Top_Tshirt',
        bottom: 'Clothes_Legs_Pants_Long',
        hair: 'Hair_Short',
        beard: 'Beard_Full',
        skinTone: 'Skintone_2',
        // Haircolour_01 is the palest cream in the palette — reads as
        // light/elderly hair against the dim hearth glow.
        hairColor: 'Haircolour_01',
        topColor: 'Cappuccino',
        legColor: 'Espresso',
      },
    },
    {
      id: 'child',
      sprite: 'intern',
      name: 'SHE',
      start: { x: CHILD_OFFSCREEN_X, y: FLOOR },
      facing: 'left',
      scale: 0.7,
      hidden: true,
      outfit: {
        top: 'Clothes_Top_Tshirt',
        bottom: 'Clothes_Legs_Pants_Long',
        hair: 'Hair_Ponytail',
        skinTone: 'Skintone_4',
        hairColor: 'Haircolour_03',
        topColor: 'Cushion_Orange',
        legColor: 'Porcelain_Blue',
      },
    },
    {
      // Unseen narrator. Stays hidden so no 3D body renders and no
      // speech bubble appears; `speak` actions on this actor produce
      // ElevenLabs audio only. Captions for those lines are authored
      // separately as popupText so they read in mute.
      id: 'narrator',
      sprite: 'dave',
      start: { x: -9999, y: -9999 },
      hidden: true,
      outfit: {
        top: 'Clothes_Top_Tshirt',
        bottom: 'Clothes_Legs_Pants_Long',
      },
    },
  ],
  timeline: [
    // Camera shot list.
    ...cameraTimeline,

    // --- HUMMING SFX (generated via npm run generate-humming) ---
    // The elder hums continuously from the hook until he fades out
    // (~0:05 → 0:68). The clip is short (12s) so we set loop=true
    // and supply loopClipSec so Remotion repeats it cleanly across
    // the long window.
    // Volumes are >1.0 — ElevenLabs SFX comes out much quieter than
    // its voice TTS, so we amplify. The renderer enables
    // `allowAmplificationDuringRender` on every sfx track.
    {
      type: 'sfx',
      audioUrl: staticFile('music/hum_elder.mp3'),
      startSec: 4.5,
      endSec: 68.0,
      volume: 8.0,
      loop: true,
      loopClipSec: 12,
    },
    // The child starts humming when she catches the tune (0:42) and
    // keeps humming through the closing line. She continues alone
    // after the elder fades — "she carries it forward".
    {
      type: 'sfx',
      audioUrl: staticFile('music/hum_child.mp3'),
      startSec: 42.0,
      endSec: 73.0,
      volume: 8.0,
      loop: true,
      loopClipSec: 10,
    },

    // --- HOOK (0:00–0:04): narrator line 1 + caption ---
    {
      type: 'speak',
      actorId: 'narrator',
      text: 'He is the last who remembers it.',
      voiceId: VOICE_IDS.george,
      volume: 0.5,
      startSec: 1.0,
      endSec: 4.0,
    },
    { type: 'popupText', text: 'He is the last\nwho remembers it.', startSec: 1.0, endSec: 4.0, y: 0.18, color: '#e8dccc', size: 70 },

    // Elder blinks at human cadence so he reads alive even when no
    // explicit `animate` is firing.
    ...eyeBlinkAt('elder', 2.8),
    ...eyeBlinkAt('elder', 8.2),
    ...eyeBlinkAt('elder', 15.0),
    ...eyeBlinkAt('elder', 21.4),
    ...eyeBlinkAt('elder', 27.0),
    ...eyeBlinkAt('elder', 33.5),
    ...eyeBlinkAt('elder', 40.0),
    ...eyeBlinkAt('elder', 46.2),

    // The child also blinks naturally, less often (she's looking
    // intently at the elder).
    ...eyeBlinkAt('child', 30.5),
    ...eyeBlinkAt('child', 44.0),
    ...eyeBlinkAt('child', 58.0),
    ...eyeBlinkAt('child', 67.0),

    // --- HUM LOOP A (0:05–0:09): onomatopoeic caption only ---
    // Real humming SFX should play under (TODO: source SFX file; see
    // brief at the bottom of this file). Captions read in mute as the
    // ambient texture.
    // Subtle caption for muted viewers — sound-on viewers hear the
    // actual hum SFX and can ignore this.
    { type: 'popupText', text: '♪ mmm… mm-mm…', startSec: 6, endSec: 10, y: 0.83, color: '#a89882', size: 42 },

    // --- HUM LOOP B → ECU PUSH (0:12–0:16) ---
    { type: 'popupText', text: '♪ …hmm-mmm…', startSec: 13, endSec: 16.5, y: 0.83, color: '#a89882', size: 42 },

    // --- NARRATOR LINE 2 (0:18–0:22): child enters frame ---
    {
      type: 'speak',
      actorId: 'narrator',
      text: 'The song is older than he is.',
      voiceId: VOICE_IDS.george,
      volume: 0.5,
      startSec: 18.5,
      endSec: 21.5,
    },
    { type: 'popupText', text: 'The song is older\nthan he is.', startSec: 18.5, endSec: 22.0, y: 0.18, color: '#e8dccc', size: 64 },

    // --- CHILD ENTERS (0:18–0:24) ---
    // Walks from offscreen right toward the elder, stops at CHILD_X
    // (580 px to the right of the elder — enough spacing to avoid
    // mesh intersection).
    {
      type: 'walk',
      actorId: 'child',
      to: { x: CHILD_X, y: FLOOR },
      startSec: 18,
      endSec: 24,
      facing: 'left',
    },

    // --- CHILD NOTICES (0:25–0:32) ---
    // Brief thinking beat, then settles into listening. Crucially: at
    // 0:25 she turns to face DOWN (toward camera) so her face is
    // visible during the OTS-on-child shot. She'll stay facing-camera
    // for the rest of the skit so emotion beats read.
    { type: 'face', actorId: 'child', direction: 'down', atSec: 25 },
    { type: 'animate', actorId: 'child', clip: 'React_Stand_Thinking', startSec: 25, endSec: 27 },
    { type: 'animate', actorId: 'child', clip: 'React_Stand_ListeningNod', startSec: 27, endSec: 42, loop: true },
    { type: 'eyes', actorId: 'child', eyes: 'Eye_Kawaii', startSec: 25, endSec: 32 },

    // --- TEACHING THE NOTES (0:32–0:42) ---
    // Elder opens up — Discussion_2 reads as gentle teaching gesture.
    { type: 'animate', actorId: 'elder', clip: 'React_Stand_Discussion_2', startSec: 32, endSec: 42 },
    // Warm amber rim tint on the elder while teaching.
    { type: 'tint', actorId: 'elder', color: '#ffb37a', startSec: 34, endSec: 48 },
    // Child's eyes pulse starry as the lesson sinks in (~5s sparkle loop).
    ...eyeStarryLoopAt('child', 38, 5, 0.18),

    // --- NARRATOR LINE 3 (0:33–0:36): the teaching moment ---
    {
      type: 'speak',
      actorId: 'narrator',
      text: 'Some things only pass by ear.',
      voiceId: VOICE_IDS.george,
      volume: 0.5,
      startSec: 33.0,
      endSec: 36.0,
    },
    { type: 'popupText', text: 'Some things\nonly pass by ear.', startSec: 33.0, endSec: 36.5, y: 0.18, color: '#e8dccc', size: 60 },

    // --- MIRROR BACK (0:42–0:55) ---
    { type: 'eyes', actorId: 'child', eyes: 'Eye_0_Default', startSec: 43, endSec: 55 },
    // A single natural blink on the elder as he yields the song.
    ...eyeBlinkAt('elder', 47.5),
    // Elder shifts to listening — now SHE is the singer.
    { type: 'animate', actorId: 'elder', clip: 'React_Stand_ListeningNod', startSec: 48, endSec: 60, loop: true },
    // Tint transfer: warm fades on the elder, blooms on the child.
    { type: 'tint', actorId: 'child', color: '#ffc488', startSec: 46, endSec: 65 },
    { type: 'tint', actorId: 'elder', color: '#9aa8b5', startSec: 48, endSec: 58 },
    // Elder closes his eyes at peace.
    { type: 'eyes', actorId: 'elder', eyes: 'Eye_Closed', startSec: 52, endSec: 75 },

    // --- NARRATOR LINE 4 (0:45–0:48): the song lives in her now ---
    {
      type: 'speak',
      actorId: 'narrator',
      text: 'She knows it too.',
      voiceId: VOICE_IDS.george,
      volume: 0.5,
      startSec: 45.0,
      endSec: 47.5,
    },
    { type: 'popupText', text: 'She knows it too.', startSec: 45.0, endSec: 48.0, y: 0.18, color: '#e8dccc', size: 68 },

    // --- NARRATOR LINE 5 (0:50–0:54): the song lives on ---
    {
      type: 'speak',
      actorId: 'narrator',
      text: 'And the song goes on.',
      voiceId: VOICE_IDS.george,
      volume: 0.5,
      startSec: 50.0,
      endSec: 53.5,
    },
    { type: 'popupText', text: 'And the song\ngoes on.', startSec: 50.0, endSec: 54.0, y: 0.18, color: '#e8dccc', size: 60 },

    // --- ELDER DISSOLVES (0:58–1:08) ---
    // Slow opacity fade on the elder. He's already at peace (eyes
    // closed, cool blue-grey tint); now he dissolves into the dim
    // hearth glow. By 1:08 he's gone from the scene; only the girl
    // remains for the closing line.
    {
      type: 'fade',
      actorId: 'elder',
      fromOpacity: 1,
      toOpacity: 0,
      startSec: 58.0,
      endSec: 68.0,
    },

    // --- AT PEACE (0:55–1:10) ---
    // Camera dollies back, then drifts right onto the girl as the
    // elder fades. No narration through this beat — let the frame
    // breathe and the realization land before the closing line.

    // --- NARRATOR LINE 6 + LANDING (1:10–1:14) ---
    // Line lands on a tight shot of the girl alone. "we" pulls the
    // viewer into the lineage — they're now part of the song too.
    {
      type: 'speak',
      actorId: 'narrator',
      text: 'Some songs only end when we stop singing them.',
      voiceId: VOICE_IDS.george,
      volume: 0.5,
      startSec: 69.5,
      endSec: 73.5,
    },
    { type: 'popupText', text: 'Some songs only end\nwhen we stop singing them.', startSec: 69.5, endSec: 75, y: 0.18, color: '#e8dccc', size: 56 },
  ],
};

/**
 * Humming SFX brief (sourcing TODO):
 *
 * Style: unaccompanied solo male hum, close-mic'd, breathy and slightly
 * cracked — a real old voice, not a polished vocalist. Room tone audible;
 * small intakes of breath between phrases.
 *
 * Reference: opening hum of "Spirited Away" (Joe Hisaishi, One Summer's
 * Day) or wordless lullaby motifs in The Wild Robot. Diatonic, no
 * vibrato, no reverb tail.
 *
 * Melody: four-note motif, descending then resolving up a step
 * (e.g. A–G–E–F). Simple enough that a child could echo it back.
 * Loop the motif twice for the elder solo (0:05–0:18), once for
 * the teaching demo (0:32–0:42), then once for the child's mirror
 * (0:42–0:55). Place via Audio component in Skit.tsx or set as
 * skit.musicUrl at lower volume.
 */
