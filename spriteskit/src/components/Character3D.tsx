import React, { useEffect, useMemo, useState } from 'react';
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  AnimationClip,
  AnimationMixer,
  Bone,
  Color,
  DoubleSide,
  Group,
  LoopRepeat,
  MeshPhongMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { ClipName, EyeSprite, Outfit, Viseme } from '../skits/assets';

// ---- Shared FBX + texture cache ----
let fbxSource: Group | null = null;
let fbxPromise: Promise<Group> | null = null;
let fbxHandle: number | null = null;

/**
 * Per-parts catalog of pre-loaded SkinnedMeshes. Built once at startup
 * from the Characters-Pack parts FBXs (Hair_All, Clothes_All,
 * Accessories_All, Items_All). All four FBXs share the same skeleton
 * as Character_Talking.fbx (verified: 53 bones, identical names), so
 * we just clone each mesh and rebind its skeleton to the rig clone at
 * actor-creation time.
 */
let partsCache: Map<string, SkinnedMesh> = new Map();
const PARTS_FBXS = [
  'models/Hair_All.fbx',
  'models/Clothes_All.fbx',
  'models/Accessories_All.fbx',
  'models/Items_All.fbx',
];

/**
 * Extra animation clips harvested from Character_All.fbx (Characters-Pack).
 * Targets the same 53-bone skeleton as the base Lips-Pack rig — verified
 * by name. Tracks that target the 'Armature' parent group are filtered
 * out; clips that duplicate Lips-Pack's `Walk_Loop` / `0TPose` / etc. are
 * also dropped to avoid name collision.
 *
 * Cafe vocabulary: Sofa_Sit, Floor_Sit, TallChair_Sit, Tray_Walk,
 * Tray_Pickup, Tray_Serve_*, Sofa_/Floor_/TallChair_ *_Drink/Eat/Pickup
 * (sitting, eating, drinking, serving, carrying — 43 clips total).
 */
let extraAnimations: Map<string, AnimationClip> = new Map();
const EXTRA_ANIMATIONS_FBX = 'models/Character_All.fbx';
/**
 * Clip names that exist in both Character_All.fbx AND the base Lips-Pack
 * rig. We use the base rig's version (it's identical) and drop the
 * Character_All copy to avoid ambiguity.
 */
// Wait_Pose and Stand_Pose are single-frame "freeze pose" clips
// (~33ms, one keyframe). Useful with loop:false to hold a deliberate
// still pose for a short window. Walk_Loop is provided by the base
// Lips-Pack rig already; 0TPose is the T-pose fallback we explicitly
// don't want as a chosen clip.
const SKIP_EXTRA_CLIPS = new Set(['Walk_Loop', '0TPose']);

const textureCache = new Map<string, Texture>();
function loadTexture(url: string): Texture {
  let t = textureCache.get(url);
  if (!t) {
    t = new TextureLoader().load(url);
    t.colorSpace = SRGBColorSpace;
    textureCache.set(url, t);
  }
  return t;
}

function visemeUrl(v: Viseme): string {
  // Detailed mouth set (30 frames). See Lips_Legend.png in the asset
  // pack for the phoneme → frame mapping.
  return staticFile(`sprites/lips/${v}.png`);
}
function eyeUrl(e: EyeSprite): string {
  return staticFile(`sprites/eyes/${e}.png`);
}

/**
 * Textures the Character3D component needs assigned to FBX materials.
 * Preloaded alongside the model so each Character3D instance can bind
 * them synchronously after the FBX lands.
 */
const SKIN_TONES = ['Skintone_1', 'Skintone_2', 'Skintone_3', 'Skintone_4', 'Skintone_5', 'Skintone_6'];
const HAIR_COLOURS = Array.from({ length: 16 }, (_, i) => `Haircolour_${String(i + 1).padStart(2, '0')}`);
const CLOTHING_SWATCHES = [
  'Amber', 'Cappuccino', 'Cushion_Blue', 'Cushion_Orange', 'Cushion_Red',
  'Espresso', 'Glass', 'Green_Cactus', 'Green_Leaves', 'Grey', 'Honey_Milk',
  'Latte', 'Machine_Black', 'Matcha', 'Milkshake_Strawberry', 'Olive_Sofa',
  'Paper', 'Porcelain_Blue', 'Porcelain_Orange', 'Silver', 'Whipped_Cream',
];

const PRELOAD_TEXTURE_URLS = [
  ...SKIN_TONES.map((s) => `models/${s}.png`),
  ...HAIR_COLOURS.map((h) => `models/${h}.png`),
  ...CLOTHING_SWATCHES.map((c) => `models/${c}.png`),
  'sprites/eyes/Eye_0_Default.png',
  'sprites/lips/Lips_00.png',
];

export function ensureFbxLoaded(): Promise<Group> {
  if (fbxSource) return Promise.resolve(fbxSource);
  if (!fbxPromise) {
    fbxHandle = delayRender('Loading Character_Talking.fbx + parts + textures');
    fbxPromise = new Promise((resolve, reject) => {
      const texPromises = PRELOAD_TEXTURE_URLS.map(
        (rel) =>
          new Promise<void>((res) => {
            const t = new TextureLoader().load(
              staticFile(rel),
              () => res(),
              undefined,
              () => res(),
            );
            t.colorSpace = SRGBColorSpace;
            textureCache.set(staticFile(rel), t);
          }),
      );
      const fbxLoadPromise = new Promise<Group>((res, rej) => {
        new FBXLoader().load(staticFile('models/Character_Talking.fbx'), res, undefined, rej);
      });
      // Load each parts FBX in parallel and harvest its SkinnedMeshes
      // into partsCache (keyed by mesh name). All parts share the
      // base rig's skeleton, so we just need to clone + rebind later.
      const partsLoadPromise = Promise.all(
        PARTS_FBXS.map(
          (rel) =>
            new Promise<Group>((res, rej) => {
              new FBXLoader().load(staticFile(rel), res, undefined, rej);
            }),
        ),
      ).then((groups) => {
        for (const g of groups) {
          g.traverse((o) => {
            const m = o as SkinnedMesh;
            if (m.isSkinnedMesh) {
              partsCache.set(m.name, m);
            }
          });
        }
      });

      // Load Character_All.fbx purely to harvest its 43 cafe animation
      // clips. We don't use its meshes — its `Body_Head` has baked-in
      // face UVs that conflict with our face-submesh pipeline.
      const extraAnimsPromise = new Promise<void>((res, rej) => {
        new FBXLoader().load(
          staticFile(EXTRA_ANIMATIONS_FBX),
          (g) => {
            for (const clip of g.animations) {
              if (SKIP_EXTRA_CLIPS.has(clip.name)) continue;
              // Strip any tracks targeting 'Armature' (the FBX parent
              // group) — that bone doesn't exist on our rig and Three
              // would silently no-op the track, but cleaner to remove.
              const filtered = clip.clone();
              filtered.tracks = filtered.tracks.filter(
                (t) => !t.name.startsWith('Armature.'),
              );
              extraAnimations.set(clip.name, filtered);
            }
            // eslint-disable-next-line no-console
            console.log('[Character3D] extra animations:', extraAnimations.size);
            res();
          },
          undefined,
          rej,
        );
      });

      Promise.all([fbxLoadPromise, Promise.all(texPromises), partsLoadPromise, extraAnimsPromise]).then(
        ([g]) => {
          fbxSource = g;
          if (fbxHandle !== null) continueRender(fbxHandle);
          resolve(g);
        },
        (err) => {
          if (fbxHandle !== null) continueRender(fbxHandle);
          reject(err);
        },
      );
    });
  }
  return fbxPromise;
}

/** React hook that holds rendering until the FBX has loaded. */
export function useCharacterFbx(): Group | null {
  const [g, setG] = useState<Group | null>(fbxSource);
  useEffect(() => {
    if (g) return;
    let cancelled = false;
    ensureFbxLoaded().then((src) => {
      if (!cancelled) setG(src);
    });
    return () => {
      cancelled = true;
    };
  }, [g]);
  return g;
}

// ---- Outfit visibility ----

const OUTFIT_PREFIXES = ['Clothes_', 'Hair_', 'Beard_', 'Accessory_', 'held_'];
function isOutfitMesh(name: string): boolean {
  return OUTFIT_PREFIXES.some((p) => name.startsWith(p));
}
function visibleMeshes(outfit: Outfit): Set<string> {
  const s = new Set<string>();
  s.add(outfit.top);
  s.add(outfit.bottom);
  if (outfit.apron) s.add(outfit.apron);
  if (outfit.hair) s.add(outfit.hair);
  if (outfit.beard) s.add(outfit.beard);
  if (outfit.accessory) s.add(outfit.accessory);
  if (outfit.held) s.add(outfit.held);
  return s;
}

type Props = {
  outfit: Outfit;
  position: [number, number, number];
  yawRad: number;
  scale?: number;
  clip: ClipName;
  clipTime: number;
  clipLoop: boolean;
  /**
   * For cross-fading between consecutive animation clips. When
   * `blendT < 1`, the renderer plays both `prevClip` (weight
   * `1 - blendT`) and `clip` (weight `blendT`) so the pose smoothly
   * interpolates per-bone. When `blendT === 1` or `prevClip === clip`
   * there is no blend; only the current action plays.
   */
  prevClip: ClipName;
  prevClipTime: number;
  prevClipLoop: boolean;
  blendT: number;
  viseme: Viseme;
  eyes: EyeSprite;
  /**
   * Optional rim-glow colour applied to every body material's emissive
   * channel for the lifetime of a `tint` action. Pass `undefined` for no
   * tint.
   */
  tint?: string;
  /**
   * Per-frame opacity 0..1. Default 1. Drives the `fade` action — set
   * below 1 to dissolve the character into the background. Applied to
   * every body and face material.
   */
  opacity?: number;
};

/**
 * One 3D character. Each instance clones the cached FBX, owns an
 * AnimationMixer and per-instance materials, and toggles outfit + face
 * textures every render. Returns `null` until the FBX is loaded
 * (delayRender keeps Remotion from capturing the frame meanwhile).
 */
export const Character3D: React.FC<Props> = ({
  outfit,
  position,
  yawRad,
  scale = 1,
  clip,
  clipTime,
  clipLoop,
  prevClip,
  prevClipTime,
  prevClipLoop,
  blendT,
  viseme,
  eyes,
  tint,
  opacity = 1,
}) => {
  const source = useCharacterFbx();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rig = useMemo(() => {
    if (!source) return null;
    const root = cloneSkinned(source) as Group;
    const mixer = new AnimationMixer(root);
    const clips: Record<string, AnimationClip> = {};
    for (const c of source.animations) clips[c.name] = c;
    // Merge the cafe-vocab clips harvested from Character_All.fbx.
    // Same skeleton (verified by name), so they play directly on our
    // mixer. The base rig's clips take precedence on name collision
    // (we filtered duplicates during harvest above).
    for (const [name, clip] of extraAnimations) {
      if (!clips[name]) clips[name] = clip;
    }

    // Find head bone (kept for future use — eg. pointing speech bubbles).
    let head: Bone | null = null;
    root.traverse((o) => {
      if (!head && (o as Bone).isBone && o.name === 'head') head = o as Bone;
    });

    // ---- ATTACH PARTS FROM CHARACTERS-PACK ----
    // The parts FBXs (Hair_All, Clothes_All, Accessories_All, Items_All)
    // share the SAME skeleton as the base Lips-Pack rig (verified: 53
    // bones, identical names). For each cached part mesh we clone it,
    // then rebind its skeleton reference to use OUR clone's bones
    // (matched by name). This makes the part animate with our rig.
    const cloneBones = new Map<string, Bone>();
    root.traverse((o) => {
      if ((o as Bone).isBone) cloneBones.set(o.name, o as Bone);
    });

    // Re-parent the held-item bones to the right hand. The asset pack
    // ships them as children of `Root` (parked at world origin) and
    // relies on cafe animations (Tray_Walk, Sofa_Cup_Pickup, etc) to
    // animate their position. Lips-Pack has no such animations, so
    // we manually attach them to the right palm so any held mesh
    // follows the hand for free.
    const rightPalm = cloneBones.get('hand_palmR');
    const HELD_BONES = ['held_item_tray', 'held_item_plate', 'held_item_drink_food'];
    for (const boneName of HELD_BONES) {
      const heldBone = cloneBones.get(boneName);
      if (rightPalm && heldBone && heldBone.parent !== rightPalm) {
        // Use Object3D.attach (preserves world transform), then zero
        // out local position so the held item sits at the palm.
        rightPalm.attach(heldBone);
        heldBone.position.set(0, 0, 0);
        heldBone.rotation.set(0, 0, 0);
        heldBone.updateMatrixWorld(true);
      }
    }

    for (const [name, sourceMesh] of partsCache.entries()) {
      const partMesh = sourceMesh.clone() as SkinnedMesh;
      partMesh.name = name;
      // The cloned mesh still references the SOURCE part's skeleton.
      // Remap to use OUR clone's bones (by name) so it animates with
      // our mixer.
      const remappedBones = sourceMesh.skeleton.bones.map(
        (b) => cloneBones.get(b.name) ?? b,
      );
      partMesh.bind(
        new Skeleton(remappedBones, sourceMesh.skeleton.boneInverses),
        partMesh.matrixWorld,
      );
      // Materials get cloned by the traverse pass below — for now just
      // attach the mesh to root.
      partMesh.frustumCulled = false;
      partMesh.visible = false; // outfit-visibility logic turns these on
      root.add(partMesh);
    }

    // Per-actor material refs. We capture every named body material
    // instance (multiple meshes may share an FBX material name — each
    // gets its own clone) so the per-frame update block below can swap
    // their `.map` (driven by Outfit fields) and `.emissive` (driven by
    // the tint prop) without re-traversing the scene graph.
    const bodyMaterials: Record<string, MeshPhongMaterial[]> = {};
    let mouthMaterial: MeshPhongMaterial | null = null;
    let eyeMaterialL: MeshPhongMaterial | null = null;
    let eyeMaterialR: MeshPhongMaterial | null = null;

    root.traverse((o) => {
      const m = o as SkinnedMesh;
      if (!m.isSkinnedMesh) return;
      m.frustumCulled = false;

      const mats = Array.isArray(m.material) ? m.material : [m.material];
      const cloned = mats.map((mm) => {
        if (!mm) return mm;
        const c = (mm as MeshPhongMaterial).clone();
        c.name = mm.name;
        return c;
      });
      m.material = Array.isArray(m.material) ? cloned : cloned[0];

      for (const mat of cloned) {
        if (!mat) continue;
        const phong = mat as MeshPhongMaterial;
        // Capture every body-colour material instance so per-frame
        // outfit / tint updates can mutate them directly. Includes the
        // parts-FBX materials (M_Apron, M_Accessories, M_CatCafe_Atlas)
        // so accessories + held items get their own swatch defaults.
        if (
          mat.name === 'M_Skin' ||
          mat.name === 'M_Hair' ||
          mat.name === 'M_Clothes_Top' ||
          mat.name === 'M_Clothes_Legs' ||
          mat.name === 'M_Clothes_Shoes' ||
          mat.name === 'M_Apron' ||
          mat.name === 'M_Accessories' ||
          mat.name === 'M_CatCafe_Atlas'
        ) {
          if (!bodyMaterials[mat.name]) bodyMaterials[mat.name] = [];
          bodyMaterials[mat.name].push(phong);
        }
        if ('specular' in phong && phong.specular) phong.specular.setHex(0x111111);
        phong.shininess = 8;
        // Face submeshes: transparent textures with alphaTest so the
        // black eye/mouth shapes punch through their white background
        // without z-fighting against the head skin.
        if (m.name === 'Body_Eye_L' || m.name === 'Body_Eye_R' || m.name === 'Body_Mouth') {
          // Face submesh: a flat quad whose UVs span 0..1 of the texture.
          // The face PNG has a black shape on a transparent background;
          // alphaTest cleanly punches out the background.
          const faceTex =
            m.name === 'Body_Mouth'
              ? loadTexture(staticFile('sprites/lips/Lips_00.png'))
              : loadTexture(staticFile('sprites/eyes/Eye_0_Default.png'));
          phong.map = faceTex;
          phong.alphaMap = null;
          phong.transparent = true;
          phong.alphaTest = 0.5;
          phong.depthWrite = true;
          phong.side = DoubleSide;
          phong.color.setHex(0xffffff);
          phong.polygonOffset = true;
          phong.polygonOffsetFactor = -1;
          phong.polygonOffsetUnits = -1;
          if (m.name === 'Body_Eye_L') eyeMaterialL = phong;
          else if (m.name === 'Body_Eye_R') eyeMaterialR = phong;
          else mouthMaterial = phong;
        }
        phong.needsUpdate = true;
      }
    });

    // FBXLoader's root has a -π/2 X rotation for Z-up → Y-up. We bake
    // that out and apply it in JSX (around the yaw) so the standing
    // character rotates correctly when we apply our own yaw.
    root.rotation.set(0, 0, 0);
    root.scale.set(1, 1, 1);
    root.position.set(0, 0, 0);

    return {
      root,
      mixer,
      clips,
      head,
      mouthMaterial,
      eyeMaterialL,
      eyeMaterialR,
      bodyMaterials,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  // Apply outfit visibility every render.
  if (rig) {
    const visible = visibleMeshes(outfit);
    rig.root.traverse((o) => {
      const sm = o as SkinnedMesh;
      if (sm.isSkinnedMesh && isOutfitMesh(sm.name)) {
        sm.visible = visible.has(sm.name);
      }
    });
  }

  // Step the animation mixer deterministically.
  //
  // Two-action cross-fade: between consecutive `animate` actions (or
  // between an animate and the fallback idle), we play BOTH the prev
  // and current clip with weights summing to 1.0 for a short window
  // (TRANSITION_WINDOW_SEC, see Skit.tsx). Three's mixer blends pose
  // contributions per-bone, so the visible pose smoothly interpolates
  // without a snap.
  //
  // One-shot fallback rule (still applies inside the resolver): if a
  // one-shot clip has finished, we automatically fall back to the
  // looping IDLE so the actor never freezes on a posed end-frame.
  if (rig) {
    // Idle_Wardrobe (6.8s, Characters-Pack) is the universal fallback —
    // a calm ambient stand-and-shift that reads as natural body language.
    // It replaced React_Stand_Discussion_1 (which over-gestures and made
    // every long-form video look samey). React_Stand_Discussion_1 +
    // 0TPose remain as second/third fallbacks for older asset packs.
    // Last-resort fallback only if the author scheduled an unknown
    // ClipName. Skit.tsx's resolveActorClip now keeps the clip name
    // stable across the window (hold end pose, no idle fallback), so
    // this only fires on misconfigured skits.
    const idleClip =
      rig.clips['Idle_Wardrobe'] ??
      rig.clips['React_Stand_Discussion_1'] ??
      rig.clips['0TPose'];

    const resolveClipAndTime = (
      name: ClipName,
      time: number,
      loop: boolean
    ): { clipObj: AnimationClip; localTime: number } | null => {
      const requested = rig.clips[name];
      if (!requested) {
        // Unknown clip name — fall through to the bind-pose idle if we
        // have one. This is a last-resort path; authors should always
        // schedule valid ClipName values.
        if (!idleClip) return null;
        return { clipObj: idleClip, localTime: time % idleClip.duration };
      }
      if (loop) return { clipObj: requested, localTime: time % requested.duration };
      // One-shot: play through duration, then HOLD the end pose for
      // the rest of the window. No idle fallback at the renderer
      // level either — Skit.tsx's resolveActorClip already holds the
      // clip name across the window, so this renderer path just
      // needs to clamp time to duration when we overshoot.
      return {
        clipObj: requested,
        localTime: Math.min(time, requested.duration),
      };
    };

    const current = resolveClipAndTime(clip, clipTime, clipLoop);
    // Only set up a prev action when (a) we're inside the transition window
    // AND (b) the prev resolves to a DIFFERENT AnimationClip than current.
    // If both resolve to the same clip (e.g. both fell back to Idle_Wardrobe),
    // there's no blend to perform — and crucially we must NOT down-weight
    // currentAction, otherwise PropertyMixer.apply blends bones toward
    // bind-pose by (1 - blendT) and the character ghosts toward a T-pose.
    const prevCandidate =
      blendT < 1 ? resolveClipAndTime(prevClip, prevClipTime, prevClipLoop) : null;
    const prev =
      prevCandidate && prevCandidate.clipObj !== current?.clipObj ? prevCandidate : null;
    const currentWeight = prev ? blendT : 1;

    if (current) {
      rig.mixer.stopAllAction();

      // Current clip: weight = blendT (1 when no blend in progress, or
      // when prev resolves to the same clip as current).
      const currentAction = rig.mixer.clipAction(current.clipObj);
      currentAction.setLoop(LoopRepeat, Infinity);
      currentAction.clampWhenFinished = true;
      currentAction.reset();
      currentAction.time = Math.max(0, current.localTime);
      currentAction.setEffectiveWeight(currentWeight);
      currentAction.play();

      // Prev clip (only when blending and clips differ): weight = 1 - blendT.
      if (prev) {
        const prevAction = rig.mixer.clipAction(prev.clipObj);
        prevAction.setLoop(LoopRepeat, Infinity);
        prevAction.clampWhenFinished = true;
        prevAction.reset();
        prevAction.time = Math.max(0, prev.localTime);
        prevAction.setEffectiveWeight(1 - blendT);
        prevAction.play();
      }

      // Advance mixer by 0 to evaluate weighted contributions onto
      // the skeleton without changing action.time again.
      rig.mixer.update(0);
    }
  }

  // Per-frame face texture swaps + outfit colour overrides + tint.
  if (rig) {
    // Mouth (viseme).
    const mouthTex = loadTexture(visemeUrl(viseme));
    if (rig.mouthMaterial && (rig.mouthMaterial as MeshPhongMaterial).map !== mouthTex) {
      (rig.mouthMaterial as MeshPhongMaterial).map = mouthTex;
      (rig.mouthMaterial as MeshPhongMaterial).needsUpdate = true;
    }
    // Eyes.
    const eyeTex = loadTexture(eyeUrl(eyes));
    for (const m of [rig.eyeMaterialL, rig.eyeMaterialR]) {
      if (m && (m as MeshPhongMaterial).map !== eyeTex) {
        (m as MeshPhongMaterial).map = eyeTex;
        (m as MeshPhongMaterial).needsUpdate = true;
      }
    }
    // Body colour swatches — driven by outfit fields, with defaults.
    const skinTex = loadTexture(staticFile(`models/${outfit.skinTone ?? 'Skintone_2'}.png`));
    const hairTex = loadTexture(staticFile(`models/${outfit.hairColor ?? 'Haircolour_08'}.png`));
    const topTex = loadTexture(staticFile(`models/${outfit.topColor ?? 'Cushion_Red'}.png`));
    const legsTex = loadTexture(staticFile(`models/${outfit.legColor ?? 'Cushion_Blue'}.png`));
    const shoesTex = loadTexture(staticFile(`models/${outfit.shoesColor ?? 'Espresso'}.png`));
    // Apron still uses a clothing swatch (it's a fabric).
    const apronTex = loadTexture(staticFile(`models/${outfit.apronColor ?? 'Whipped_Cream'}.png`));
    const colourBindings: Array<[string, Texture]> = [
      ['M_Skin', skinTex],
      ['M_Hair', hairTex],
      ['M_Clothes_Top', topTex],
      ['M_Clothes_Legs', legsTex],
      ['M_Clothes_Shoes', shoesTex],
      ['M_Apron', apronTex],
    ];
    for (const [name, tex] of colourBindings) {
      const mats = rig.bodyMaterials[name] || [];
      for (const mat of mats) {
        if (mat.map !== tex) {
          mat.map = tex;
          mat.color.setHex(0xffffff);
          mat.needsUpdate = true;
        }
      }
    }

    // Accessories + held items: render as FLAT-COLOURED meshes (no
    // texture map). The asset pack's UV atlas mapping looks broken
    // outside the original cafe context — clean solid colour reads
    // better. We resolve the colour PER MESH so e.g. glasses can be
    // black while a held coffee is brown. The per-mesh material
    // clones (done in the traverse pass above) ensure colour changes
    // don't bleed across mesh types that share the source material.
    const accessoryHex = outfit.accessoryColor ?? '#1a1a1a';
    const heldHex = outfit.heldColor ?? '#8a5a3b';
    rig.root.traverse((o) => {
      const m = o as SkinnedMesh;
      if (!m.isSkinnedMesh) return;
      const isAccessory = m.name.startsWith('Accessory_') || m.name === 'Hair_Acc_Band';
      const isHeld = m.name.startsWith('held_');
      if (!isAccessory && !isHeld) return;
      const hex = isAccessory ? accessoryHex : heldHex;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        if (!mat) continue;
        const phong = mat as MeshPhongMaterial;
        phong.map = null; // strip atlas — flat colour only
        phong.color.set(hex);
        phong.needsUpdate = true;
      }
    });
    // Tint: apply as emissive on every body material for a soft rim
    // glow. Reset to black when no tint is active.
    const emissive = tint ? new Color(tint) : new Color(0x000000);
    const emissiveIntensity = tint ? 0.55 : 0;
    const TINT_TARGETS = ['M_Skin', 'M_Hair', 'M_Clothes_Top', 'M_Clothes_Legs', 'M_Clothes_Shoes', 'M_Apron', 'M_Accessories', 'M_CatCafe_Atlas'];
    for (const name of TINT_TARGETS) {
      const mats = rig.bodyMaterials[name] || [];
      for (const mat of mats) {
        mat.emissive.copy(emissive);
        // MeshPhongMaterial doesn't expose emissiveIntensity, but
        // scaling the colour gives the same effect.
        mat.emissive.multiplyScalar(emissiveIntensity);
        mat.needsUpdate = true;
      }
    }

    // Opacity: tween all body + face materials together. We use
    // material.transparent + material.opacity. Note: setting
    // transparent=true unconditionally is fine — three.js still
    // optimizes opaque pixels.
    const clamped = Math.max(0, Math.min(1, opacity));
    for (const name of ['M_Skin', 'M_Hair', 'M_Clothes_Top', 'M_Clothes_Legs', 'M_Clothes_Shoes']) {
      const mats = rig.bodyMaterials[name] || [];
      for (const mat of mats) {
        mat.transparent = true;
        mat.opacity = clamped;
        mat.needsUpdate = true;
      }
    }
    // Face submeshes (eyes/mouth) — already transparent for alphaTest,
    // so we just modulate opacity. At opacity 0 they're invisible
    // alongside the body.
    for (const m of [rig.mouthMaterial, rig.eyeMaterialL, rig.eyeMaterialR]) {
      if (m) {
        (m as MeshPhongMaterial).opacity = clamped;
        (m as MeshPhongMaterial).needsUpdate = true;
      }
    }
  }

  void frame;
  void fps;

  if (!rig) return null;

  return (
    <group
      position={position}
      rotation={[0, yawRad, 0]}
      scale={[scale, scale, scale]}
    >
      {/* FBX → Y-up correction (Z-up to Y-up) applied inside the yaw
          so the character stands upright before being yawed. */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={rig.root} />
      </group>
    </group>
  );
};

import type { Direction } from '../skits/types';

/**
 * Maps a Direction to a yaw angle in radians (rotation around world Y).
 *
 *   down (0)  → faces camera
 *   right     → +π/2
 *   up        → π (faces away)
 *   left      → -π/2
 *
 *   Diagonals are 45° offsets toward the named corner. So `down-right`
 *   is half-way between facing the camera (down) and facing right —
 *   the natural posture for an actor on the LEFT half of frame who's
 *   talking to someone on the right.
 */
export function directionToYaw(dir: Direction): number {
  const PI = Math.PI;
  switch (dir) {
    case 'down': return 0;
    case 'down-right': return PI / 4;
    case 'right': return PI / 2;
    case 'up-right': return (3 * PI) / 4;
    case 'up': return PI;
    case 'up-left': return -(3 * PI) / 4;
    case 'left': return -PI / 2;
    case 'down-left': return -PI / 4;
  }
}
