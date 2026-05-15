/**
 * Maps the legacy 2D sprite IDs (dave/alex/boss/janitor/intern) to default
 * 3D outfits on the Character_Talking.fbx rig. That FBX only has one top,
 * one bottom, and 2 hair / 2 beard meshes, so all five legacy IDs map to
 * variations of the same outfit, differentiated by hair + beard.
 */

import type { Outfit } from './assets';
import type { SpriteId } from './types';

export const LEGACY_OUTFITS: Record<SpriteId, Outfit> = {
  dave: {
    top: 'Clothes_Top_Tshirt',
    bottom: 'Clothes_Legs_Pants_Long',
    hair: 'Hair_Short',
  },
  alex: {
    top: 'Clothes_Top_Tshirt',
    bottom: 'Clothes_Legs_Pants_Long',
    hair: 'Hair_Ponytail',
  },
  boss: {
    top: 'Clothes_Top_Tshirt',
    bottom: 'Clothes_Legs_Pants_Long',
    hair: 'Hair_Short',
    beard: 'Beard_Full',
  },
  janitor: {
    top: 'Clothes_Top_Tshirt',
    bottom: 'Clothes_Legs_Pants_Long',
    hair: 'Hair_Short',
    beard: 'Beard_Lower',
  },
  intern: {
    top: 'Clothes_Top_Tshirt',
    bottom: 'Clothes_Legs_Pants_Long',
    hair: 'Hair_Ponytail',
  },
};
