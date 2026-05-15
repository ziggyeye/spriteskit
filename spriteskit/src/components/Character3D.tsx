import React, { useEffect, useMemo, useState } from 'react';
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  AnimationClip,
  AnimationMixer,
  Bone,
  Color,
  DoubleSide,
  Group,
  LoopOnce,
  LoopRepeat,
  MeshPhongMaterial,
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
  return staticFile(`sprites/lips_simple/${v}.png`);
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
  'sprites/lips_simple/Lips_s00_Default.png',
];

export function ensureFbxLoaded(): Promise<Group> {
  if (fbxSource) return Promise.resolve(fbxSource);
  if (!fbxPromise) {
    fbxHandle = delayRender('Loading Character_Talking.fbx + textures');
    const url = staticFile('models/Character_Talking.fbx');
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
        new FBXLoader().load(url, res, undefined, rej);
      });
      Promise.all([fbxLoadPromise, Promise.all(texPromises)]).then(
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
        // outfit / tint updates can mutate them directly.
        if (
          mat.name === 'M_Skin' ||
          mat.name === 'M_Hair' ||
          mat.name === 'M_Clothes_Top' ||
          mat.name === 'M_Clothes_Legs' ||
          mat.name === 'M_Clothes_Shoes'
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
              ? loadTexture(staticFile('sprites/lips_simple/Lips_s00_Default.png'))
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
  if (rig) {
    const clipObj = rig.clips[clip] ?? rig.clips['Walk_Loop'] ?? rig.clips['0TPose'];
    if (clipObj) {
      rig.mixer.stopAllAction();
      const action = rig.mixer.clipAction(clipObj);
      action.setLoop(clipLoop ? LoopRepeat : LoopOnce, Infinity);
      action.reset().play();
      const t = clipLoop ? clipTime % clipObj.duration : Math.min(clipTime, clipObj.duration);
      rig.mixer.setTime(Math.max(0, t));
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
    const colourBindings: Array<[string, Texture]> = [
      ['M_Skin', skinTex],
      ['M_Hair', hairTex],
      ['M_Clothes_Top', topTex],
      ['M_Clothes_Legs', legsTex],
      ['M_Clothes_Shoes', shoesTex],
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
    for (const name of ['M_Skin', 'M_Hair', 'M_Clothes_Top', 'M_Clothes_Legs', 'M_Clothes_Shoes']) {
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

export function directionToYaw(dir: 'down' | 'left' | 'right' | 'up'): number {
  switch (dir) {
    case 'down':
      return 0;
    case 'up':
      return Math.PI;
    case 'left':
      return -Math.PI / 2;
    case 'right':
      return Math.PI / 2;
  }
}
