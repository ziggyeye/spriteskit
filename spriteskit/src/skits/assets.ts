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

/** Every visibility-controlled outfit slot on the character. */
export type Outfit = {
  top: TopMesh;
  apron?: ApronMesh;
  bottom: BottomMesh;
  hair?: HairMesh;
  beard?: BeardMesh;
  accessory?: AccessoryMesh;
  held?: HeldMesh;
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
