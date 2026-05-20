/**
 * Catalogues of the named meshes and animation clips inside
 * public/models/Character_Talking.fbx (from the Lips-Pack). Use these
 * unions to drive outfit visibility toggles and the `animate` action's
 * clip name.
 *
 * Source of truth: ran FBXLoader against the file and dumped names.
 */

/**
 * Animation clip names. Sourced from two FBXs:
 *
 * 1. Lips-Pack `Character_Talking.fbx` (the base rig) — 17 talking-head
 *    clips: `Walk_Loop`, the `React_*` reaction set, `0TPose`.
 * 2. Characters-Pack `Character_All.fbx` — 39 additional cafe-vocab
 *    clips harvested at startup and merged into the rig's clip map
 *    (same skeleton, verified by bone name). `Walk_Loop`/`0TPose`/
 *    `Stand_Pose`/`Wait_Pose` are dropped from the Characters-Pack
 *    harvest to avoid duplicates with the base rig.
 *
 * Note `'TallChair_Glass_Drink _Loop'` has a space before `_Loop` —
 * that's the actual exported name in the FBX. Don't "fix" it.
 */
export type ClipName =
  // --- Lips-Pack base rig (17) ---
  | 'Walk_Loop'
  | 'React_Stand_Discussion_1'
  | 'React_Stand_Discussion_2'
  | 'React_Stand_ListeningNod'
  | 'React_Stand_Thinking'
  | 'React_Stand_YES'
  | 'React_Stand_NO'
  | 'React_ThumbsUp'
  | 'React_WaveHello'
  | 'React_WaveBye'
  | 'React_CrossArms'
  | 'React_CrossArms_NodYES'
  | 'React_CrossArms_ShakeNO'
  | 'React_CrossedArms_Thinking'
  | 'React_Handshake'
  | 'React_Jump_Joy'
  | '0TPose'
  // --- Characters-Pack cafe vocabulary (39 ambient + 2 freeze poses) ---
  // Long ambient idles
  | 'Idle_Wardrobe'
  | 'Wait_Shifting'
  | 'Wait_Choosy'
  // Single-frame freeze poses (~33ms). Schedule with loop:false to
  // hold the pose for a deliberate still beat — the cross-fade system
  // smooths entry/exit, and one-shot fallback won't reach for these
  // since they're shorter than any beat.
  | 'Wait_Pose'
  | 'Stand_Pose'
  // Sofa (sit on a couch, drink, eat, pick up items)
  | 'Sofa_Sit'
  | 'Sofa_Sit_RootMotion'
  | 'Sofa_Served'
  | 'Sofa_Cup_Pickup'
  | 'Sofa_Cup_Drink_Idle'
  | 'Sofa_Cup_Drink_Loop'
  | 'Sofa_Glass_Pickup'
  | 'Sofa_Glass_Drink_Loop'
  | 'Sofa_Food_Pickup'
  | 'Sofa_Food_Eat_Loop'
  // Floor (sit on the floor / a cushion)
  | 'Floor_Sit'
  | 'Floor_Sit_RootMotion'
  | 'Floor_GetUp'
  | 'Floor_GetUp_RootMotion'
  | 'Floor_Cup_Pickup'
  | 'Floor_Cup_Drink_Loop'
  | 'Floor_Glass_Pickup'
  | 'Floor_Glass_Drink_Loop'
  | 'Floor_Food_Pickup'
  | 'Floor_Food_Eat_Loop'
  // TallChair (counter stool)
  | 'TallChair_Sit'
  | 'TallChair_Sit_RootMotion'
  | 'TallChair_Wait_Idle1'
  | 'TallChair_Wait_Idle2'
  | 'TallChair_Cup_Pickup'
  | 'TallChair_Cup_Drink_Loop'
  | 'TallChair_Glass_Drink _Loop' // sic — space in name
  | 'TallChair_Food_Pickup'
  | 'TallChair_Food_Eat_Loop'
  | 'TallChair_Served_Happy'
  // Tray service (waitstaff)
  | 'Tray_Pickup'
  | 'Tray_Walk'
  | 'Tray_Serve_Tall'
  | 'Tray_Serve_Short'
  // Bar (handling plated food at a counter)
  | 'Bar_Plated_Pickup'
  | 'Bar_Walk_Plated';

/**
 * Per-clip animation metadata: actual clip duration (measured from
 * the FBX) AND a "linger" hold time. When a one-shot clip finishes
 * inside its scheduled window, the engine HOLDS its end pose for
 * `lingerSec` before falling back to the idle. This makes characters
 * read as "did the gesture, then paused in it" — natural human
 * behavior — rather than snapping immediately to the next clip.
 *
 * Tuning principles for lingerSec:
 * - **Long ambient idles** (Idle_Wardrobe, Wait_Choosy, Wait_Shifting):
 *   short linger (~0.3s). These flow into the next clip; not meant to
 *   sustain a held pose.
 * - **Authority / punch poses** (CrossArms, CrossedArms_Thinking,
 *   CrossArms_NodYES, CrossArms_ShakeNO): long linger (1.5-2.5s). The
 *   character commits to the pose.
 * - **Reaction beats** (Stand_Thinking, Stand_YES, Stand_NO, ThumbsUp,
 *   Jump_Joy, Wave*): medium linger (0.8-1.2s). Held briefly so the
 *   gesture reads.
 * - **Talking gestures** (Discussion_1, Discussion_2, ListeningNod):
 *   short linger (~0.4s). These are meant to flow.
 * - **Locomotion** (Walk_Loop): zero linger (no held end pose).
 * - **Freeze poses** (Wait_Pose, Stand_Pose, 0TPose): the
 *   FREEZE_POSE_MAX_DURATION rule already holds them forever;
 *   lingerSec irrelevant.
 * - **Cafe-vocab clips**: medium linger (~1.0s) — they're
 *   scene-establishing positions like "sat down on the sofa."
 */
export type ClipInfo = { duration: number; lingerSec: number };
export const CLIP_INFO: Record<ClipName, ClipInfo> = {
  // --- Lips-Pack ---
  Walk_Loop: { duration: 0.800, lingerSec: 0 },
  React_Stand_Discussion_1: { duration: 6.100, lingerSec: 0.4 },
  React_Stand_Discussion_2: { duration: 5.467, lingerSec: 0.4 },
  React_Stand_ListeningNod: { duration: 5.300, lingerSec: 0.4 },
  React_Stand_Thinking: { duration: 1.333, lingerSec: 1.0 },
  React_Stand_YES: { duration: 1.467, lingerSec: 1.0 },
  React_Stand_NO: { duration: 1.667, lingerSec: 1.0 },
  React_ThumbsUp: { duration: 0.733, lingerSec: 1.2 },
  React_WaveHello: { duration: 1.467, lingerSec: 0.8 },
  React_WaveBye: { duration: 2.200, lingerSec: 0.8 },
  React_CrossArms: { duration: 0.800, lingerSec: 2.0 },
  React_CrossArms_NodYES: { duration: 1.200, lingerSec: 1.8 },
  React_CrossArms_ShakeNO: { duration: 1.467, lingerSec: 1.8 },
  React_CrossedArms_Thinking: { duration: 1.733, lingerSec: 2.0 },
  React_Handshake: { duration: 1.900, lingerSec: 0.5 },
  React_Jump_Joy: { duration: 0.867, lingerSec: 0.8 },
  '0TPose': { duration: 0.033, lingerSec: 0 },
  // --- Characters-Pack ambient idles ---
  Idle_Wardrobe: { duration: 6.800, lingerSec: 0.3 },
  Wait_Shifting: { duration: 5.033, lingerSec: 0.3 },
  Wait_Choosy: { duration: 6.000, lingerSec: 0.3 },
  Wait_Pose: { duration: 0.033, lingerSec: 0 },
  Stand_Pose: { duration: 0.033, lingerSec: 0 },
  // --- Sofa ---
  Sofa_Sit: { duration: 0.867, lingerSec: 1.5 },
  Sofa_Sit_RootMotion: { duration: 0.867, lingerSec: 1.5 },
  Sofa_Served: { duration: 1.667, lingerSec: 1.0 },
  Sofa_Cup_Pickup: { duration: 0.867, lingerSec: 1.0 },
  Sofa_Cup_Drink_Idle: { duration: 3.533, lingerSec: 0.5 },
  Sofa_Cup_Drink_Loop: { duration: 1.800, lingerSec: 0.5 },
  Sofa_Glass_Pickup: { duration: 0.867, lingerSec: 1.0 },
  Sofa_Glass_Drink_Loop: { duration: 2.000, lingerSec: 0.5 },
  Sofa_Food_Pickup: { duration: 0.867, lingerSec: 1.0 },
  Sofa_Food_Eat_Loop: { duration: 2.133, lingerSec: 0.5 },
  // --- Floor ---
  Floor_Sit: { duration: 1.067, lingerSec: 1.5 },
  Floor_Sit_RootMotion: { duration: 1.067, lingerSec: 1.5 },
  Floor_GetUp: { duration: 0.867, lingerSec: 0.5 },
  Floor_GetUp_RootMotion: { duration: 0.867, lingerSec: 0.5 },
  Floor_Cup_Pickup: { duration: 1.267, lingerSec: 1.0 },
  Floor_Cup_Drink_Loop: { duration: 1.667, lingerSec: 0.5 },
  Floor_Glass_Pickup: { duration: 0.733, lingerSec: 1.0 },
  Floor_Glass_Drink_Loop: { duration: 2.333, lingerSec: 0.5 },
  Floor_Food_Pickup: { duration: 1.000, lingerSec: 1.0 },
  Floor_Food_Eat_Loop: { duration: 1.733, lingerSec: 0.5 },
  // --- TallChair ---
  TallChair_Sit: { duration: 0.733, lingerSec: 1.5 },
  TallChair_Sit_RootMotion: { duration: 0.733, lingerSec: 1.5 },
  TallChair_Wait_Idle1: { duration: 2.800, lingerSec: 0.5 },
  TallChair_Wait_Idle2: { duration: 2.167, lingerSec: 0.5 },
  TallChair_Cup_Pickup: { duration: 1.133, lingerSec: 1.0 },
  TallChair_Cup_Drink_Loop: { duration: 1.467, lingerSec: 0.5 },
  'TallChair_Glass_Drink _Loop': { duration: 2.967, lingerSec: 0.5 },
  TallChair_Food_Pickup: { duration: 0.500, lingerSec: 1.0 },
  TallChair_Food_Eat_Loop: { duration: 1.800, lingerSec: 0.5 },
  TallChair_Served_Happy: { duration: 2.133, lingerSec: 0.8 },
  // --- Tray service ---
  Tray_Pickup: { duration: 1.467, lingerSec: 0.8 },
  Tray_Walk: { duration: 0.800, lingerSec: 0 },
  Tray_Serve_Tall: { duration: 1.400, lingerSec: 0.8 },
  Tray_Serve_Short: { duration: 1.533, lingerSec: 0.8 },
  // --- Bar ---
  Bar_Plated_Pickup: { duration: 0.933, lingerSec: 1.0 },
  Bar_Walk_Plated: { duration: 0.800, lingerSec: 0 },
};

/**
 * Convenience accessor — returns just the duration for backward
 * compatibility with callers that don't need linger info.
 */
export const CLIP_DURATIONS: Record<ClipName, number> = Object.fromEntries(
  Object.entries(CLIP_INFO).map(([k, v]) => [k, v.duration]),
) as Record<ClipName, number>;

/**
 * The clip name used as the universal fallback idle when a scheduled
 * one-shot finishes inside its window. Imported by Skit.tsx so its
 * `resolveActorClip` can return the same fallback as Character3D's
 * renderer-side resolveClipAndTime, keeping the two layers in sync.
 */
export const FALLBACK_IDLE_CLIP: ClipName = 'Idle_Wardrobe';

/**
 * Clips with duration <= this threshold are treated as deliberate
 * freeze poses (single-keyframe sculptural beats) rather than
 * animations. When they "end" inside their scheduled window, we hold
 * the end pose forever instead of falling back to Idle_Wardrobe.
 * Matches FREEZE_POSE_MAX_DURATION in Character3D.tsx.
 */
export const FREEZE_POSE_MAX_DURATION = 0.2;

/**
 * Outfit slots. The base rig is `Character_Talking.fbx` (Lips-Pack)
 * which natively ships with: 1 top (Tshirt), 1 bottom (Pants_Long),
 * 2 hair styles, 2 beards.
 *
 * Additional meshes are loaded from the Characters-Pack PARTS FBXs
 * (`Hair_All.fbx`, `Clothes_All.fbx`, `Accessories_All.fbx`,
 * `Items_All.fbx`) and attached to the same skeleton at runtime
 * — see `loadParts()` in `src/components/Character3D.tsx`.
 *
 * Every mesh in this union exists in one of those FBXs. The renderer
 * picks meshes by name and toggles visibility per actor.
 */

/** Top clothing (Lips-Pack ships Tshirt; rest come from Clothes_All.fbx). */
export type TopMesh =
  | 'Clothes_Top_Tshirt'
  | 'Clothes_Top_Tshirt_V'
  | 'Clothes_Top_Hoodie'
  | 'Clothes_Top_Sweater_TurtleNeck'
  | 'Clothes_Top_CollarShirt_Long'
  | 'Clothes_Top_CollarShirt_Tucked'
  | 'Clothes_Top_CollarBlouse_Long'
  | 'Clothes_Top_CollarBlouse_Short';

/** Bottoms — pants/skirts (Lips-Pack ships Pants_Long). */
export type BottomMesh =
  | 'Clothes_Legs_Pants_Long'
  | 'Clothes_Legs_Pants_Short_Pockets'
  | 'Clothes_Legs_Skirt'
  | 'Clothes_Legs_Skirt_Long';

/** Hair styles — 18 options from Hair_All.fbx + 2 from Lips-Pack. */
export type HairMesh =
  | null
  | 'Hair_Short'
  | 'Hair_ShortBob'
  | 'Hair_ShortSpiky'
  | 'Hair_SideSweep'
  | 'Hair_Long'
  | 'Hair_Ponytail'
  | 'Hair_Ponytail_Tight'
  | 'Hair_Pigtails'
  | 'Hair_Bun_Big'
  | 'Hair_Bun_Small'
  | 'Hair_Hijab'
  | 'Hair_Senior_A'
  | 'Hair_Senior_B'
  | 'Hair_Shave_AfroTop'
  | 'Hair_Shave_BuzzAfro'
  | 'Hair_Shave_Buzzcut'
  | 'Hair_Shave_Swept';

/** Beards. */
export type BeardMesh = null | 'Beard_Full' | 'Beard_Lower';

/** Aprons (over the top). */
export type ApronMesh = null | 'Clothes_Apron_Short' | 'Clothes_Apron_Long';

/** Head accessories (glasses, headphones, headband). */
export type AccessoryMesh =
  | null
  | 'Accessory_Glasses'
  | 'Accessory_Headphones_black'
  | 'Accessory_Headphones_blue'
  | 'Accessory_Headphones_pink'
  | 'Accessory_Headphones_red'
  | 'Accessory_Headphones_yellow'
  | 'Hair_Acc_Band';

/** Held items / props attached to the hand. */
export type HeldMesh =
  | null
  | 'held_Tray'
  | 'held_Cupcake_Bubblegum'
  | 'held_Cupcake_Matcha'
  | 'held_Cupcake_Orange'
  | 'held_Cupcake_RedVelvet'
  | 'held_Coffee_Full'
  | 'held_Coffee_Whip'
  | 'held_Milkshake_Chocolate'
  | 'held_Milkshake_Empty'
  | 'held_Milkshake_Matcha'
  | 'held_Milkshake_Strawberry'
  | 'held_set_1_Cup'
  | 'held_set_2_Cup'
  | 'held_set_3_Cup'
  | 'held_set_1_Plate'
  | 'held_set_2_Plate'
  | 'held_set_3_Plate';

/**
 * Skin tone swatches from `assets/Lips-Pack/Textures/Skintones/`.
 * Each maps to the corresponding PNG copied into `public/models/`.
 */
export type SkinTone =
  | 'Skintone_1'
  | 'Skintone_2'
  | 'Skintone_3'
  | 'Skintone_4'
  | 'Skintone_5'
  | 'Skintone_6';

/**
 * Hair colour swatches from `assets/Lips-Pack/Textures/Haircolour/`.
 * 16 options, from dark to light tones. Same swatch is also used on
 * the beard mesh because it shares the M_Hair material.
 */
export type HairColor =
  | 'Haircolour_01'
  | 'Haircolour_02'
  | 'Haircolour_03'
  | 'Haircolour_04'
  | 'Haircolour_05'
  | 'Haircolour_06'
  | 'Haircolour_07'
  | 'Haircolour_08'
  | 'Haircolour_09'
  | 'Haircolour_10'
  | 'Haircolour_11'
  | 'Haircolour_12'
  | 'Haircolour_13'
  | 'Haircolour_14'
  | 'Haircolour_15'
  | 'Haircolour_16';

/**
 * Clothing colour swatches from `assets/Characters-Pack/Textures/Swatch Colours/`.
 * Same set is used for top, legs, and shoes — pick any swatch per slot.
 */
export type ClothingColor =
  | 'Amber'
  | 'Cappuccino'
  | 'Cushion_Blue'
  | 'Cushion_Orange'
  | 'Cushion_Red'
  | 'Espresso'
  | 'Glass'
  | 'Green_Cactus'
  | 'Green_Leaves'
  | 'Grey'
  | 'Honey_Milk'
  | 'Latte'
  | 'Machine_Black'
  | 'Matcha'
  | 'Milkshake_Strawberry'
  | 'Olive_Sofa'
  | 'Paper'
  | 'Porcelain_Blue'
  | 'Porcelain_Orange'
  | 'Silver'
  | 'Whipped_Cream';

/** Every visibility-controlled outfit slot on the character, plus
 * optional per-actor texture swatches that override the engine defaults. */
export type Outfit = {
  top: TopMesh;
  apron?: ApronMesh;
  bottom: BottomMesh;
  hair?: HairMesh;
  beard?: BeardMesh;
  accessory?: AccessoryMesh;
  held?: HeldMesh;
  /** Skin colour swatch. Defaults to Skintone_2. */
  skinTone?: SkinTone;
  /** Hair/beard colour swatch. Defaults to Haircolour_08. */
  hairColor?: HairColor;
  /** Top clothing swatch. Defaults to Cushion_Red. */
  topColor?: ClothingColor;
  /** Legs/pants clothing swatch. Defaults to Cushion_Blue. */
  legColor?: ClothingColor;
  /** Shoes clothing swatch. Defaults to Espresso. */
  shoesColor?: ClothingColor;
  /** Apron clothing swatch. Defaults to Whipped_Cream. Only relevant if `apron` is set. */
  apronColor?: ClothingColor;
  /**
   * Accessory colour as a flat CSS-style hex string (e.g. `'#1a1a1a'`
   * for black glasses, `'#cc0000'` for red headphones). Accessories
   * render as solid-coloured meshes — the asset pack's atlas-UV
   * trick looks broken outside the cafe context, so we override with
   * a clean colour. Defaults to dark charcoal `#1a1a1a`.
   */
  accessoryColor?: string;
  /**
   * Held item colour as a flat CSS-style hex string. Defaults to a
   * warm brown `#8a5a3b` (works for trays, cups, plates). For
   * specific items like coffee or cupcakes, override per actor.
   */
  heldColor?: string;
};

/**
 * The 30 mouth shapes from the Lips-Pack `Mouth_Sprites` (detailed) set.
 * Names match the filenames in `public/sprites/lips/`. Frames 00–20 are
 * phoneme visemes — see Lips_Legend.png in the asset pack. Frames 21–29
 * are emotion mouths used independently of speech.
 *
 * Phoneme mapping (legend):
 *   00 — closed/rest                01 — æ, ə, ʌ     02 — a, aɪ
 *   03 — ɔ                          04 — ɛ, ʊ        05 — ɝ
 *   06 — j, i, ɪ                    07 — w, u        08 — o
 *   09 — aʊ                         10 — ɔɪ          11 — h
 *   12 — ɹ                          13 — L           14 — s, z
 *   15 — ʃ, tʃ, dʒ, ʒ               16 — ð           17 — f, v
 *   18 — d, t, n, θ                 19 — k, g, ŋ     20 — p, b, m
 */
export type Viseme =
  | 'Lips_00'
  | 'Lips_01'
  | 'Lips_02'
  | 'Lips_03'
  | 'Lips_04'
  | 'Lips_05'
  | 'Lips_06'
  | 'Lips_07'
  | 'Lips_08'
  | 'Lips_09'
  | 'Lips_10'
  | 'Lips_11'
  | 'Lips_12'
  | 'Lips_13'
  | 'Lips_14'
  | 'Lips_15'
  | 'Lips_16'
  | 'Lips_17'
  | 'Lips_18'
  | 'Lips_19'
  | 'Lips_20'
  | 'Lips_21_Upset'
  | 'Lips_22_Sad'
  | 'Lips_23_Angry'
  | 'Lips_24_Thinking'
  | 'Lips_25_Cheeky'
  | 'Lips_26_Smiley'
  | 'Lips_27_Cute'
  | 'Lips_28_Suprized'
  | 'Lips_29_Confused';

export type EyeSprite =
  | 'Eye_0_Default'
  | 'Eye_Angry'
  | 'Eye_Blink1'
  | 'Eye_Blink2'
  | 'Eye_Blink3'
  | 'Eye_Closed'
  | 'Eye_Flat'
  | 'Eye_Frustrated'
  | 'Eye_Hearts1'
  | 'Eye_Hearts2'
  | 'Eye_Hearts3'
  | 'Eye_Hearts4'
  | 'Eye_Kawaii'
  | 'Eye_Sad Cry'
  | 'Eye_Starry1'
  | 'Eye_Starry2';

/**
 * Multi-frame eye-sprite sequences for common animated expressions.
 *
 * Skit authors: don't try to invent your own ordering — these are the
 * canonical sequences the asset pack was designed for. Pair each frame
 * with a short-duration `eyes` action (~80ms per frame works well for
 * blinks; ~150ms for starry sparkle).
 *
 * Example usage in a skit timeline:
 *
 *   ...eyeBlinkAt('dave', 12.0),          // single blink at 12s
 *   ...eyeStarryLoopAt('alex', 8.0, 4.0), // 4-second starry loop from 8s
 */

/**
 * One complete blink: Default → Blink1 → Blink2 → Blink3 → Blink2 → Blink1
 * → Default. The asset pack expects this exact symmetric sequence —
 * eyelids open, close, open. ~80ms per frame ≈ 480ms total blink.
 */
export const EYE_BLINK_SEQUENCE: readonly EyeSprite[] = [
  'Eye_0_Default',
  'Eye_Blink1',
  'Eye_Blink2',
  'Eye_Blink3',
  'Eye_Blink2',
  'Eye_Blink1',
  'Eye_0_Default',
] as const;

/**
 * Sparkly eye loop: Starry1 ↔ Starry2 alternation. The asset pack's
 * Starry sprites are designed to pulse against each other to read as
 * twinkling. ~150ms per frame for a soft sparkle; faster (~80ms) for
 * an excited "hype" energy.
 */
export const EYE_STARRY_LOOP: readonly EyeSprite[] = [
  'Eye_Starry1',
  'Eye_Starry2',
  'Eye_Starry1',
  'Eye_Starry2',
  'Eye_Starry1',
  'Eye_Starry2',
] as const;

/**
 * Hearts pulse loop: cycles Hearts1 → Hearts2 → Hearts3 → Hearts4 →
 * Hearts3 → Hearts2 → Hearts1. The 4 sprites are a growing-then-
 * shrinking heart, so the symmetric round-trip gives a "heartbeat"
 * pulse rather than a hard reset.
 */
export const EYE_HEARTS_PULSE: readonly EyeSprite[] = [
  'Eye_Hearts1',
  'Eye_Hearts2',
  'Eye_Hearts3',
  'Eye_Hearts4',
  'Eye_Hearts3',
  'Eye_Hearts2',
  'Eye_Hearts1',
] as const;

/**
 * ARPAbet phoneme → detailed viseme frame, derived from the asset pack's
 * Lips_Legend.png. ARPAbet is the CMU Pronouncing Dictionary's ASCII
 * notation (each phoneme is 1-3 uppercase letters; stress digits 0/1/2
 * are stripped before lookup).
 *
 * The voice generator pipeline:
 *   1. ElevenLabs returns character-level audio timing.
 *   2. We look up each word's phoneme sequence via cmu-pronouncing-dictionary.
 *   3. We proportionally split the word's audio time among its phonemes.
 *   4. We map each phoneme through this table to a `Lips_NN` frame.
 *
 * Words not in the CMU dictionary fall back to a heuristic letter-by-
 * letter mapping (see voiceService.ts).
 */
export const ARPABET_TO_VISEME: Record<string, Viseme> = {
  // 01 — æ, ə, ʌ
  AE: 'Lips_01',
  AH: 'Lips_01',
  UH: 'Lips_01',
  // 02 — a, aɪ
  AA: 'Lips_02',
  AY: 'Lips_02',
  // 03 — ɔ
  AO: 'Lips_03',
  // 04 — ɛ, ʊ  (we collapse ʊ here even though ARPAbet UH already → 01;
  // EH gets its own frame which differentiates the 'bed' shape.)
  EH: 'Lips_04',
  // 05 — ɝ (er)
  ER: 'Lips_05',
  // 06 — j, i, ɪ
  Y: 'Lips_06',
  IY: 'Lips_06',
  IH: 'Lips_06',
  // 07 — w, u
  W: 'Lips_07',
  UW: 'Lips_07',
  // 08 — o
  OW: 'Lips_08',
  // 09 — aʊ
  AW: 'Lips_09',
  // 10 — ɔɪ
  OY: 'Lips_10',
  // 11 — h
  HH: 'Lips_11',
  // 12 — ɹ
  R: 'Lips_12',
  // 13 — L
  L: 'Lips_13',
  // 14 — s, z
  S: 'Lips_14',
  Z: 'Lips_14',
  // 15 — ʃ, tʃ, dʒ, ʒ
  SH: 'Lips_15',
  CH: 'Lips_15',
  JH: 'Lips_15',
  ZH: 'Lips_15',
  // 16 — ð
  DH: 'Lips_16',
  // 17 — f, v
  F: 'Lips_17',
  V: 'Lips_17',
  // 18 — d, t, n, θ
  D: 'Lips_18',
  T: 'Lips_18',
  N: 'Lips_18',
  TH: 'Lips_18',
  // 19 — k, g, ŋ
  K: 'Lips_19',
  G: 'Lips_19',
  NG: 'Lips_19',
  // 20 — p, b, m
  P: 'Lips_20',
  B: 'Lips_20',
  M: 'Lips_20',
};

/**
 * Fallback letter → viseme map for words not in the CMU dictionary.
 * Used when the G2P lookup fails. Less accurate than the ARPAbet path
 * but better than dropping the line.
 */
export const LETTER_TO_VISEME: Record<string, Viseme> = {
  m: 'Lips_20', b: 'Lips_20', p: 'Lips_20',
  f: 'Lips_17', v: 'Lips_17',
  s: 'Lips_14', z: 'Lips_14', x: 'Lips_14',
  c: 'Lips_19', k: 'Lips_19', g: 'Lips_19', q: 'Lips_19',
  t: 'Lips_18', d: 'Lips_18', n: 'Lips_18',
  l: 'Lips_13',
  r: 'Lips_12',
  h: 'Lips_11',
  j: 'Lips_15',
  w: 'Lips_07', u: 'Lips_07',
  o: 'Lips_08',
  i: 'Lips_06', y: 'Lips_06',
  a: 'Lips_02',
  e: 'Lips_04',
};

/** A single viseme keyframe — show `viseme` from `startSec` until the next entry's start. */
export type VisemeFrame = { startSec: number; viseme: Viseme };
