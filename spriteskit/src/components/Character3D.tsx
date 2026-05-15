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
  'models/T_CatCafe_Atlas.png',
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

      Promise.all([fbxLoadPromise, Promise.all(texPromises), partsLoadPromise]).then(
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
  // Rule: if a one-shot clip has finished (clipTime > clipObj.duration),
  // we automatically fall back to the looping IDLE (React_Stand_Discussion_1)
  // so the actor never freezes on a posed end-frame or collapses to
  // T-pose. Looping idles play forever; one-shot clips give way to idle.
  if (rig) {
    const requested = rig.clips[clip];
    const idleClip = rig.clips['React_Stand_Discussion_1'] ?? rig.clips['0TPose'];
    let activeClip = requested ?? idleClip;
    let activeTime: number;

    if (!requested) {
      // Unknown clip name; fall straight to idle, advancing with sec.
      activeClip = idleClip;
      activeTime = clipTime;
    } else if (clipLoop) {
      // Looping clip — wrap clipTime onto the clip's duration.
      activeTime = clipTime % requested.duration;
    } else if (clipTime <= requested.duration) {
      // One-shot still playing.
      activeTime = clipTime;
    } else if (idleClip) {
      // One-shot finished — return to idle. Offset the idle by the
      // time since the clip ended, so the idle plays naturally.
      activeClip = idleClip;
      activeTime = (clipTime - requested.duration) % idleClip.duration;
    } else {
      // No idle available — clamp on end pose as a fallback.
      activeTime = requested.duration;
    }

    if (activeClip) {
      rig.mixer.stopAllAction();
      const action = rig.mixer.clipAction(activeClip);
      action.setLoop(LoopRepeat, Infinity);
      action.clampWhenFinished = true;
      action.reset().play();
      rig.mixer.setTime(Math.max(0, activeTime));
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
    // Parts-FBX material defaults. Apron uses a clothing swatch; the
    // cafe atlas + accessories use the multi-region T_CatCafe_Atlas
    // (which encodes their colours by UV region, not by binding).
    const apronTex = loadTexture(staticFile(`models/${outfit.apronColor ?? 'Whipped_Cream'}.png`));
    const atlasTex = loadTexture(staticFile('models/T_CatCafe_Atlas.png'));
    const accessoriesTex = loadTexture(staticFile('models/T_CatCafe_Atlas.png'));
    const colourBindings: Array<[string, Texture]> = [
      ['M_Skin', skinTex],
      ['M_Hair', hairTex],
      ['M_Clothes_Top', topTex],
      ['M_Clothes_Legs', legsTex],
      ['M_Clothes_Shoes', shoesTex],
      ['M_Apron', apronTex],
      ['M_Accessories', accessoriesTex],
      ['M_CatCafe_Atlas', atlasTex],
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
