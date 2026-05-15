/**
 * Catalogues of the named meshes and animation clips inside
 * public/models/Character_Talking.fbx (from the Lips-Pack). Use these
 * unions to drive outfit visibility toggles and the `animate` action's
 * clip name.
 *
 * Source of truth: ran FBXLoader against the file and dumped names.
 */

export type ClipName =
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
  | '0TPose';

/** The Character_Talking FBX has a much smaller outfit set than the
 * full Characters-Pack. Only one top, one bottom, two hair styles, two
 * beards. */
export type TopMesh = 'Clothes_Top_Tshirt';
export type BottomMesh = 'Clothes_Legs_Pants_Long';
export type HairMesh = null | 'Hair_Short' | 'Hair_Ponytail';
export type BeardMesh = null | 'Beard_Full' | 'Beard_Lower';

// These slots are kept in the type for source-compatibility with the
// older Characters-Pack outfit schema, but the talking model has no
// meshes for them. Setting them is a no-op.
export type ApronMesh = null;
export type AccessoryMesh = null;
export type HeldMesh = null;

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
};

/**
 * The 20 mouth shapes from the Lips-Pack `Mouth_Simplified` set.
 * Names match the filenames so we can build the texture URL directly.
 */
export type Viseme =
  | 'Lips_s00_Default'
  | 'Lips_s01_sh-ch'
  | 'Lips_s02_a-i'
  | 'Lips_s03_ah-i'
  | 'Lips_s04_th'
  | 'Lips_s05_e-k-r'
  | 'Lips_s06_s-z'
  | 'Lips_s07_m-b-p'
  | 'Lips_s08_f-v'
  | 'Lips_s09_L'
  | 'Lips_s10_oh'
  | 'Lips_s11_o-u-w'
  | 'Lips_s12_Upset'
  | 'Lips_s13_Sad'
  | 'Lips_s14_Angry'
  | 'Lips_s15_Thinking'
  | 'Lips_s16_Cheeky'
  | 'Lips_s17_Cute'
  | 'Lips_s18_Surprised'
  | 'Lips_s19_Confused';

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
 * Letter → simplified viseme. Used by the voice generator to convert
 * ElevenLabs character-level alignment into a viseme track. Lowercase only.
 * Anything not in the map falls back to Lips_s00_Default (mouth closed).
 */
export const LETTER_TO_VISEME: Record<string, Viseme> = {
  m: 'Lips_s07_m-b-p',
  b: 'Lips_s07_m-b-p',
  p: 'Lips_s07_m-b-p',
  f: 'Lips_s08_f-v',
  v: 'Lips_s08_f-v',
  c: 'Lips_s01_sh-ch',
  t: 'Lips_s04_th',
  d: 'Lips_s04_th',
  s: 'Lips_s06_s-z',
  z: 'Lips_s06_s-z',
  l: 'Lips_s09_L',
  e: 'Lips_s05_e-k-r',
  k: 'Lips_s05_e-k-r',
  r: 'Lips_s05_e-k-r',
  a: 'Lips_s02_a-i',
  i: 'Lips_s02_a-i',
  h: 'Lips_s03_ah-i',
  o: 'Lips_s10_oh',
  u: 'Lips_s11_o-u-w',
  w: 'Lips_s11_o-u-w',
  n: 'Lips_s05_e-k-r',
  g: 'Lips_s05_e-k-r',
  j: 'Lips_s01_sh-ch',
  q: 'Lips_s11_o-u-w',
  x: 'Lips_s06_s-z',
  y: 'Lips_s02_a-i',
};

/** A single viseme keyframe — show `viseme` from `startSec` until the next entry's start. */
export type VisemeFrame = { startSec: number; viseme: Viseme };
