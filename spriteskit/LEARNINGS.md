# LEARNINGS.md

Non-obvious things discovered while building this engine. Keep this current
when you hit something that bites you twice — future you and future agents
will appreciate the warning.

## FBX rig and three.js

### Cloned `SkinnedMesh`es get aggressively frustum-culled

When `cloneSkinned` (from `SkeletonUtils`) produces a per-actor rig, each
`SkinnedMesh`'s bounding sphere is computed from the **rest pose**. Once the
animation mixer moves vertices outside that sphere, three.js culls them.
Symptom: the character is loaded, lights are on, camera is pointed at the
right spot — and nothing renders.

**Fix:** set `frustumCulled = false` on every `SkinnedMesh` after cloning.
The cost is negligible because the rig is small.

### FBXLoader's root has `-π/2` X rotation

FBX is Z-up; three.js is Y-up. FBXLoader applies a `-π/2` X rotation on the
imported root to convert. If you then put the rig inside a yaw-rotated
parent group (e.g. `rotation={[0, yaw, 0]}`), the yaw applies AFTER the
X-correction in matrix multiplication order — yawing an already-rotated
character spins them around their own depth axis, not their up axis.

**Fix:** clear the root's rotation after cloning, and apply the X-correction
in the JSX wrapper INSIDE the yaw group:

```tsx
<group position={position} rotation={[0, yawRad, 0]} scale={[s, s, s]}>
  <group rotation={[-Math.PI / 2, 0, 0]}>
    <primitive object={rig.root} />
  </group>
</group>
```

### Characters loaded with `<Audio>`/FBX feel quiet because cached materials need amplification

The FBX-default materials are MeshPhongMaterials. They need real lights to
render anything but black. `<ThreeCanvas flat linear>` darkens them
significantly — drop those props, use tone-mapped output, and brighten the
ambient + directional lights. Also tag every diffuse `map` as `SRGBColorSpace`
explicitly — otherwise it double-gammas and looks muddy.

### Per-actor materials must be CLONED at the rig level

If multiple `Character3D` instances share a material instance, changing the
texture on one (per-actor outfit colour, fade opacity, tint emissive) bleeds
across all of them. Always `material.clone()` after the rig clone, in the
traverse pass.

Same applies for textures with `.repeat` / `.offset` overrides — those are
per-material state, not per-mesh.

### `Body_Eye_L`, `Body_Eye_R`, `Body_Mouth` exist only in `Character_Talking.fbx`

The full Characters-Pack `Character_All.fbx` has no separate mouth submesh.
Its `Body_Head` has `M_Skin` + `M_Eyes` material slots with UVs already
hand-mapped to specific sprite regions of `T_EyesTexture.png`. Those UVs
span `u=[0, 0.25], v=[0.75, 1.0]` — a single closed-eye cell.

If you switch back to `Character_All.fbx` for outfit variety, you'll need
bone-remapping (Lips-Pack ships a Unity helper for this; would need a
three.js port) to attach the face meshes to the larger rig.

## Async loading + Remotion's `delayRender`

### Module-level caches don't trigger React re-renders

If you cache an asynchronously-loaded FBX in a module variable and return
`null` until it's ready, React will keep returning `null` even after the
load completes — because the component never knows to re-render.

**Fix:** use `useState` + `useEffect` so a state update triggers re-render
after the cache fills. Combined with `delayRender`/`continueRender`,
Remotion will wait for the load before capturing the frame:

```ts
export function useCharacterFbx(): Group | null {
  const [g, setG] = useState<Group | null>(fbxSource);
  useEffect(() => {
    if (g) return;
    ensureFbxLoaded().then(setG);
  }, [g]);
  return g;
}
```

### FBXLoader fires `onLoad` BEFORE its texture sub-fetches complete

FBXLoader resolves its main promise once the FBX itself is parsed, but it
kicks off a separate `TextureLoader` request per referenced image. Those
texture fetches resolve asynchronously after `onLoad`. If you start the
render at that point, you'll see characters with `noImg, -1x-1` textures
that pop in mid-frame.

**Fix:** preload your required textures explicitly in parallel with the FBX
load, wrap both in a single `Promise.all`, and only resolve the
`delayRender` handle when ALL are ready. See `PRELOAD_TEXTURE_URLS` in
[Character3D.tsx](src/components/Character3D.tsx).

### Skit-pixel-space → world-space Y has an offset

`worldY = (height - skitY) / PIXELS_PER_UNIT` puts the actor's feet at
world y=0.875, not y=0. The character mesh extends from feet to head_top,
so the eye line is around y=1.83 (elder at scale 1.0).

When framing a face close-up, point `lookAt` at `y≈1.83`, NOT `y=0`. Got
this wrong twice — the camera was pointed at chest height and we kept
seeing torso + legs instead of face.

## Camera math

### `fov` is VERTICAL, not horizontal, and portrait aspect MAKES IT WORSE

Three.js `PerspectiveCamera.fov` is the vertical field of view. On a
landscape canvas (aspect > 1), horizontal fov is WIDER than vertical. On a
**portrait** canvas (1080×1920, aspect 0.5625), horizontal fov is
**NARROWER**.

Formula for visible horizontal width at distance `d`:

```
horizontalVisible = 2 * d * tan(fovV / 2) * (W / H)
                  = 2 * d * tan(fovV / 2) * 0.5625    [for 1080×1920]
```

So a `fov 30°, d 3.0` shot that fits one actor in landscape will only show
a sliver of one actor in portrait. We hit this on the first two-shot —
both actors were lined up perfectly in 3D but the camera saw neither
because the portrait crop excluded everything past ±0.3 world units of the
look-at axis.

**Rule of thumb for 1080×1920:** for a two-shot of two actors ~1.2 units
apart, use `fov 35°, d 5.5+`. For a single-actor close-up filling the
frame, `fov 22°, d 1.5`.

### Lerping FOV and position simultaneously creates dolly-zoom

If a `camera` action tweens BOTH position (toward subject) AND fov (wider
or narrower) over the same window, you get an accidental Hitchcock
vertigo effect. It looks queasy. Tween one at a time, or use it
intentionally for a surreal beat.

### Dutch tilt needs a custom `up` vector

`camera.lookAt(target)` always uses the camera's `up` vector to orient the
horizon. Default `up = [0, 1, 0]` keeps horizons level. To roll the camera,
set `cam.up.set(x, y, z)` BEFORE the `lookAt` call. We added an optional
`up` field on `CameraState` for this.

## Animation timing

### Default `clipTime: 0` freezes the actor

If you ship a runtime state with `clipTime: 0` for the looping idle (and
only update `clipTime` when an explicit `animate` action covers `sec`), the
actor freezes on frame 0 of `React_Stand_Discussion_1`. Symptom: the
character appears posed but never moves, never breathes, looks dead.

**Fix:** default `clipTime: sec` in the runtime state, so the idle loops
continuously off the global clock.

### Periodic blinks need ~80ms per frame

Real human blinks last 100-400ms. The asset pack's blink sequence is
7 frames (Default → Blink1 → 2 → 3 → 2 → 1 → Default) — at 80ms each that's
560ms, which reads as natural. Faster than 60ms looks twitchy; slower than
120ms looks sleepy.

Space blinks every 4-6 seconds for a calm scene, 2-3 seconds for an alert one.

## ElevenLabs API gotchas

### `Buffer.from(...).toString('base64').slice(0, 24)` collides on long shared prefixes

The original `visemeKey` hashed `${voiceId}:${text}` with base64 then sliced
to 24 chars. ElevenLabs voiceIds are 22 chars; their base64 encoding takes
~30 chars. So `slice(0, 24)` was returning JUST the voiceId prefix — every
line for the same voice got the same key, and the cache returned the FIRST
line's audio for every subsequent line.

Symptom: only the first line of a skit's narration generates correctly; the
rest silently reuse it.

**Fix:** use `${voiceId}::${text}` as the exact key (no truncation, no
hashing). For the filesystem path we now use SHA-256 in `voiceService.ts`.

### Sound Effects API can't be conditioned on previous audio

Two separate `/v1/sound-generation` calls produce two DIFFERENT melodies
even with identical prompts. There's no audio-conditioning. So "elder
humming a melody" + "child humming the same melody" produces two unrelated
tunes.

**Workarounds:**
1. Single longer prompt with both parts ("an old man hums, then a young
   girl hums the same melody back") — one API call.
2. Generate the elder hum, pitch-shift it offline for the child via ffmpeg.
3. Accept it and design around it (overlapping loops naturally blend).

We went with option 3 for this project.

### Voice TTS is much louder than Sound Effects

ElevenLabs voice TTS comes out hot (peaks near -3 dBFS); their SFX comes out
quiet (peaks near -20 to -30 dBFS). Setting `volume: 1.0` on both makes the
SFX inaudible under the voice.

**Fixes (in order of preference):**
1. **Drop the voice** to ~0.5 and **amplify the SFX** with `volume > 1.0`
   plus `allowAmplificationDuringRender` on the `<Audio>` component.
   Default Remotion clamps volume to 1.0; the prop unlocks > 1.
2. Run the SFX clips through `ffmpeg -af "volume=8dB"` offline to bake the
   amplification into the file.
3. Use the ElevenLabs Music API instead of Sound Effects — music clips
   come out hotter.

## Schema design

### Hidden actors are useful for narrators

Narrator voiceover needs audio + lip-sync tracks but no 3D body and no
speech bubble. Solution: cast a `hidden: true` actor and skip rendering
the speech bubble when `actor.visible === false`. The speak action still
fires audio because the audio sequence iterates `allSpeaks` regardless of
visibility.

### `staticFile()` is needed at audio bind time

`Remotion <Audio src=>` doesn't auto-resolve root-relative paths against
the bundled `public/` dir. `audioUrl: '/voices/foo.mp3'` → 404. Wrap with
`staticFile(...)` (strip the leading `/` first) in `withVisemes` so all
generated URLs resolve to the bundled location.

### `face` actions are instant, not tweened

The `face` action snaps direction at `atSec`. There's no smooth rotation
tween. If you need a turn over 0.5s, you'd need a new action variant. So
far we haven't needed it; characters either face the camera (`down`) or
face each other in dialogue, and instant snaps look fine on TikTok.

## Subagents

### Project-level `.claude/agents/*.md` files aren't auto-routed

The Agent tool's `subagent_type` parameter only knows built-in agent types
(`general-purpose`, `Explore`, `Plan`, etc.). Custom Markdown agent
definitions at `.claude/agents/<name>.md` are NOT auto-discovered as
selectable subagent types in this environment.

**Workaround:** spawn `general-purpose` agents and prepend "Read
.claude/agents/<name>.md for your role brief" to the prompt. The agent reads
the brief and follows it. Slightly less ergonomic; same effect.

## Process

### Brainstorm in two phases

A productive brainstorm flow is:

1. **Divergent (parallel):** strategist generates concepts; asset-utilizer
   audits underused systems. Don't merge — run them as independent
   parallel agents.
2. **Convergent (sequential):** once a concept is picked, asset-utilizer
   produces beat blocking → shot-designer produces camera JSON →
   script-editor (if voiced) tightens dialogue.

Running everything sequentially or merging the divergent phase loses the
"two perspectives can disagree about the right concept" value.

### Render stills before MP4s

A full 75-second render takes 3-5 minutes. A single still at frame N takes
~15 seconds. When iterating on camera positions / actor opacity / tint
colours, render 4-6 keyframe stills first, audit them, THEN do the full
MP4. Cut the iteration loop from ~5 min to ~30 sec.

### Render with verbose logs the first time

`npx remotion render <id> out/foo.mp4 --log=verbose` surfaces every
`console.log` from inside the browser bundle. Critical for debugging
texture 404s and timing issues. Without it the renderer silently swallows
asset failures and you see "characters look black but no error".
