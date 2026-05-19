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

So for the face system, we MUST use the Lips-Pack rig. But for outfit
variety, we want the Characters-Pack's 60+ extra meshes. The fix is
the parts-attach trick below — no rig swap needed.

### Parts FBXs share the base rig's skeleton — attach via bone rebind

The Characters-Pack ships standalone parts FBXs:

- `Hair_All.fbx` — 17 hair styles + 2 beards
- `Clothes_All.fbx` — 8 tops, 4 bottoms, 2 aprons
- `Accessories_All.fbx` — glasses, 5 headphone colours, headband
- `Items_All.fbx` — 17 held items (trays, cups, plates, food, drinks)

**Critically: all four share the same 53-bone skeleton as the
Lips-Pack `Character_Talking.fbx` rig (verified by name).** So we
can attach a parts SkinnedMesh to our rig by:

1. Loading the parts FBX and harvesting each `SkinnedMesh` into a
   module-level `partsCache` map.
2. At rig-clone time, for each cached part: `partMesh = source.clone()`,
   then **`partMesh.bind(new Skeleton(remappedBones, source.skeleton.boneInverses), partMesh.matrixWorld)`**
   where `remappedBones` is the source's bones mapped through
   `cloneBones.get(boneName)` to use OUR clone's bones.
3. `root.add(partMesh)` and set `visible = false` by default; the
   existing outfit-visibility loop turns the right ones on per actor.

See the parts attach block in [Character3D.tsx](src/components/Character3D.tsx).
**The skeleton rebind is the key trick.** Without it, the part still
references the source FBX's bones and animates with a phantom rig.

### Freeze-pose clips need explicit clamp-end, not idle fallback

The engine's one-shot-finished rule says "if a clip's duration is
shorter than its scheduled window, fall back to Idle_Wardrobe for
the remainder." This is right for reactions (React_ThumbsUp 0.73s
in a 3s window: hold thumbs-up briefly, return to idle). It is
WRONG for **freeze poses** like `Wait_Pose` and `Stand_Pose`, which
are 0.033s single-keyframe poses that authors schedule specifically
because they want the pose held forever for a deliberate stillness
beat (a dread-hold, a post-impact freeze, a frozen smile).

When we treated them like normal one-shots, scheduling `Wait_Pose`
for a 1.5s "freeze stare" window actually produced: 33ms of pose
→ 1.47s of Idle_Wardrobe. The character was idling, not frozen.
And every freeze beat had a hidden cross-fade between the pose
and the idle that read as a snap.

Fix: in `resolveClipAndTime` in Character3D.tsx, if `requested.duration
<= FREEZE_POSE_MAX_DURATION (0.2s)`, hold the end pose forever
instead of falling back to idle. The threshold is set just above
the cross-fade window (0.18s) so any clip too short to even
register as an animation is treated as a sculpted pose.

This also fixed a separate-looking bug: "animations not tweening"
on Liam. The hard snaps were actually NodYES (1.2s) → Wait_Pose
(0.033s) → Idle_Wardrobe cascades happening in <0.2s. With
Wait_Pose now clamping, the cross-fade NodYES → Wait_Pose lands
cleanly without the Idle_Wardrobe interruption.

If we add more single-frame pose clips later, the threshold catches
them automatically. If we ever schedule a longer freeze (say a 1s
deliberate freeze made by chaining Wait_Pose for slot-fill),
authors should know that Wait_Pose's end pose is what gets held —
which is what they wanted anyway.

### Prev clip time during cross-fade must be HELD at the transition instant, not advanced

Subtle bug discovered debugging Liam's "pop" at sec=10.733 (one-shot
`React_CrossedArms_Thinking` → `Wait_Choosy`). The math/state both
looked correct, the prev clip object differed from current, weights
were right, yet the body still snapped between frames 322 and 323.

What was happening: in Skit.tsx, `prevClipTime` was being set to
`past.clipTime + TRANSITION_WINDOW_SEC` — the idea was that during
the 0.18s fade, prev keeps "playing" forward in time. But for
one-shots that ended right at the transition (CrossedArms_Thinking
in window 9-10.73 = duration 1.73s, window length 1.73s), advancing
the time by another 0.18s pushed it PAST the clip's duration.

Then in Character3D.tsx's `resolveClipAndTime`, the one-shot-finished
fallback fired: clip duration > FREEZE_POSE_MAX_DURATION, so it fell
back to `Idle_Wardrobe`. **The prev clip object was swapped from
CrossedArms_Thinking → Idle_Wardrobe during the cross-fade.** Instead
of blending the crossed-arms end pose into the new hip stance, we
blended Idle_Wardrobe's start pose into the hip stance — both look
like neutral standing, so visually it appeared as a hard cut.

Fix in Skit.tsx (~line 606): when a transition is happening,
re-resolve prev at the transition instant (minus a tiny epsilon),
and use that resolved clipTime as `prevClipTime`. This holds prev
at the exact pose it had at the moment the transition began, which
is what the cross-fade should fade FROM. Don't let it advance past
the clip's end during the fade.

```ts
let prevTimeAtTransition = past.clipTime;
if (clipChanged) {
  const transitionAtSec = findTransitionInstant(...);
  blendT = ...;
  const prevAtTransition = resolveActorClip(skit, actor, Math.max(0, transitionAtSec - 0.001));
  prevTimeAtTransition = prevAtTransition.clipTime;
}
// ...later:
prevClipTime: prevTimeAtTransition,  // not past.clipTime + TRANSITION_WINDOW_SEC
```

Two-bug compound: this fix together with the earlier T-pose-ghosting
fix (no-prev-with-currentWeight<1) is what finally made cross-fades
visibly smooth. Either bug alone made transitions look snappy.

### A weight=blendT current with no prev action blends the character toward T-pose

This one cost us a full debugging session because the visible symptom
("cross-fade doesn't work") had nothing to do with the actual bug.

The setup: cross-fade math computes `blendT` between two clip windows
(prev and current). Then the renderer plays both with weights
`(1 - blendT)` and `blendT`. If `prev` and `current` resolve to the
SAME `AnimationClip` object (e.g. both fall through to `Idle_Wardrobe`
via the one-shot-finished fallback), we correctly skip wiring up the
second action — but the OLD code still set `currentAction.weight =
blendT < 1`.

What happens next is the trap. three.js's `PropertyMixer.apply()`
fills any remaining weight (`1 - cumulativeWeight`) with the
binding's **original** value, which is the **bind-pose** captured at
action activation (essentially T-pose for our rig after the Y-up
rotation correction). So with one action at weight 0.4 and no second
contributor, every bone got 0.4 × Idle_Wardrobe + 0.6 × T-pose. The
character "ghosted" toward T-pose during cross-fade windows —
arms drifting outward, posture slightly off, head tilting back. Not a
broken cross-fade, a *correctly executing* blend toward bind-pose.

The fix is in [Character3D.tsx:523-538](src/components/Character3D.tsx):
hoist the same-clip detection BEFORE choosing the current weight.
If no real prev exists, use `currentWeight = 1` so the action fully
drives bindings with no T-pose contribution.

```ts
const prevCandidate =
  blendT < 1 ? resolveClipAndTime(prevClip, prevClipTime, prevClipLoop) : null;
// Only treat it as a real prev if the clip is genuinely different —
// otherwise the second action would be redundant and we'd accidentally
// reduce current's weight, blending toward T-pose for the missing fraction.
const prev =
  prevCandidate && prevCandidate.clipObj !== current?.clipObj ? prevCandidate : null;
const currentWeight = prev ? blendT : 1;
```

**Diagnostic gotcha**: at known transitions (clip A → clip B with
distinct AnimationClip objects) the cross-fade WAS working correctly.
The "snap" perception came from face textures (eyes, mouth) hard-cut
at the exact same instant the body started blending — the body
interpolated cleanly underneath but the face change made it look
like everything snapped. Verifying by dumping per-bone quaternions
right after `mixer.update(0)` confirms the cross-fade body pose is
correct. If you ever doubt cross-fade is working, do a bone-level
diff between adjacent frames before assuming the mixer is broken.

**To use this knowledge in skits**: face texture changes (eyes,
mouth) can be scheduled ~0.18s earlier than animation transitions
if you want them to land mid-blend instead of at the body's snap
point. Most beats benefit from the simultaneous snap (the smile-
drops moment in niceDate, for instance, is more powerful as a
hard face cut than as a fade); but for ambient transitions where
the character isn't supposed to be "changing", stagger them.

### Cross-fading clips in a frame-by-frame renderer

Remotion renders each frame as an isolated React tree — there is no
mixer state carried across frames, and frames are not even rendered
sequentially. That breaks the usual three.js cross-fade flow
(`prevAction.crossFadeTo(nextAction, 0.3)` — which relies on the
mixer maintaining the fade over wall-clock time).

Solution: **resolve the blend weight purely from `sec`**, then on
every frame play TWO actions on the mixer with explicit weights
summing to 1.0.

1. Refactor clip resolution into a pure helper:
   `resolveActorClip(skit, actor, sec) -> { clip, clipTime, clipLoop }`.
2. Call it twice — once at `sec`, once at `sec - TRANSITION_WINDOW_SEC`.
3. If the two return different clips, binary-search the window for the
   exact transition instant (~12 iterations gets sub-ms precision).
4. `blendT = (sec - transitionInstant) / TRANSITION_WINDOW_SEC`,
   clamped to [0, 1].
5. In the renderer: `mixer.stopAllAction()`,
   `currentAction.weight = blendT`, `prevAction.weight = 1 - blendT`,
   both `.play()`, then `mixer.update(0)` to evaluate the weighted
   skeleton pose. Use `action.time = ...` (per-action) NOT
   `mixer.setTime(...)` (global) so each action can be at its own
   local time independently.

Picking `TRANSITION_WINDOW_SEC = 0.18` (~5 frames at 30fps): fast
enough not to delay choreography, long enough to hide the snap.

The binary-search step matters: if the clip switch happened 0.05s
ago and the window is 0.18s, blendT should be 0.27 — not 0 or 1.
Without the search we'd only see the blend on the exact frame the
transition started, which is still a snap.

### Don't try to port Mixamo (or any foreign-skeleton) animations at runtime

We spent a chunk of time trying to drop in Mixamo's animation
library (2000+ free humanoid clips) via a runtime bone-name remap.
It didn't work — pulled out the whole pipeline.

**What we tried, in order**:

1. Wrote a bone-name remap (`mixamorig:Hips → spine_pelvis`, etc.)
   so Mixamo's tracks would target our bones. Necessary but
   insufficient.
2. Discovered the `mixamorig:` prefix sometimes loses its colon
   (`mixamorigHips`) — FBXLoader version variance. Accepted both.
3. Discovered Mixamo's skeleton is ~180 world units tall vs our
   ~1.5 units. Raw `.position` keyframes teleported the character
   out of frame. Tried dropping `.position` tracks entirely — the
   dance lost its hip bounce and looked stiff.
4. Tried scaling + rebasing position tracks
   (`(mixamoKey.y - mixamoHipsRest) * 0.01 + ourPelvisRest`).
   Important gotcha here: animation tracks set `bone.position`
   directly, which is a LOCAL value relative to parent. Use the
   bone's local rest, NOT world rest, when rebasing. We initially
   used world rest (0.417) and the character floated because the
   parent transform was double-applied.
5. After all of that, the dance still looked bad — limbs going
   through the body, weight on the wrong foot, "off" in ways that
   are hard to pin down.

**Why it ultimately doesn't work**: bone NAMES matching is just
the entry ticket. The math of "apply this rotation keyframe to
this bone" only produces a correct pose if the source and target
rigs also share **bone lengths**, **rest poses** (joint
orientations at frame 0), and **hierarchy depth**. Mixamo's rig
has `Hips → Spine → Spine1 → Spine2 → Neck → Head` (6 joints
of spine + neck); ours has `spine_pelvis → spine_belly →
spine_chest → head` (4 joints). When we drop the Spine2 and Neck
rotations, the rotations that were supposed to distribute across
those joints collapse onto fewer bones — the head ends up rotated
wrong, even after every other bone is correct. Same for bone
lengths: Mixamo's upper arm is proportionally longer than ours,
so a "raise hand to head" rotation in Mixamo overshoots on us.

**The path that would work** if we ever need it: retarget the
animation in Blender (Rokoko plugin or hand-authored bone
constraints), which re-bakes the rotations against OUR rig's
actual bone lengths and rest poses. Then export the result as a
plain FBX and drop it in `public/models/` like any other clip.
That's a one-time Blender pass per clip, not a runtime trick.

**For now we have 56 clips that work perfectly** — 17 talking-head
plus 39 cafe-vocab, both authored against our exact skeleton.
That's deeper than most indie animation libraries; lean on it.

### Animations are portable across same-skeleton rigs — no rebind needed

Once we'd done the parts skeleton-rebind, we wondered if we could
also unlock the Characters-Pack's 43 cafe animations
(`Sofa_Sit`, `Tray_Walk`, `Floor_Cup_Drink_Loop`, etc) which lived in
`Character_All.fbx`.

It turned out **even simpler than parts**: animation clips reference
bones by NAME via `track.name = 'bonename.property'`. As long as the
target rig has the same bone names, the clip plays directly. No
clone, no rebind, no skeleton remap — just `mixer.clipAction(clip)`.

We did one inspection pass to confirm:

- 43 clips × 162 tracks each, targeting 54 unique bone names.
- 53 of 54 match the Lips-Pack rig exactly. The 54th is `Armature`
  (the FBX parent group), which we filter out — its tracks were
  root-motion translations we don't want anyway.

Implementation: load `Character_All.fbx` purely to harvest its
`animations[]`, drop tracks matching `Armature.*`, filter out names
that collide with the base rig (`Walk_Loop`, `0TPose`,
`Stand_Pose`, `Wait_Pose`), merge into the per-actor `clips` map.
Smoke-tested with `Sofa_Sit`: actor lands in the seated pose
exactly as if a sofa were under them.

This is the cheaper analogue of the parts skeleton-rebind — works
whenever two FBX rigs share bone names, which is common for asset
packs from the same family. Worth checking before assuming you need
to rebuild or remap anything.

### Held items need their bones reparented to a hand

The Lips-Pack rig has `held_item_tray`, `held_item_plate`,
`held_item_drink_food` bones — but they're parented directly to
`Root` at world origin, not to a hand. The Characters-Pack expects
its cafe animations (Tray_Walk, Sofa_Cup_Pickup, etc.) to keyframe
those bones. We don't have those animations on the Lips-Pack rig.

**Fix at clone time:** find the held_item_* bones in the cloned
skeleton and **reparent them to `hand_palmR`**:

```ts
const rightPalm = cloneBones.get('hand_palmR');
for (const name of ['held_item_tray', 'held_item_plate', 'held_item_drink_food']) {
  const bone = cloneBones.get(name);
  if (rightPalm && bone) {
    rightPalm.attach(bone);   // preserves world transform
    bone.position.set(0, 0, 0);
    bone.rotation.set(0, 0, 0);
  }
}
```

Result: held items follow the right hand for free, without needing
the cafe animation library. Position fidelity is "decent, not
perfect" — the items sit at the palm in a fixed orientation. Good
enough for most skits; if you need precise pickup/serve motion,
borrow the actual cafe animation clips from `Character_All.fbx`.

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

```text
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

### Diagonal facing reads better for two-character dialogue

We started with 4-direction facing (`down` / `up` / `left` / `right`).
For dialogue:

- `down` (head-on to camera) reads as "staring into the void" — fine
  for solo monologue, weird for a conversation.
- Cardinal `left` / `right` shows the actor in pure profile, ignoring
  the camera entirely. Reads as "in their own world".

The schema now supports 8 directions including diagonals. **Use
`down-left` for the actor on the right side of frame and `down-right`
for the actor on the left.** Both face camera-friendly AND turn
slightly toward the other actor. Reads as natural conversation.

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

### ElevenLabs alignment is character-level; we need phoneme-level for real lip-sync

ElevenLabs `/with-timestamps` returns `alignment.characters[]` —
each letter of the spoken text with start/end timing. Mapping
letters → visemes (e.g. `s → Lips_14`) is **wrong** because spoken
English doesn't pronounce letters one-to-one. "She" is `/ʃiː/` — two
phonemes (`SH`, `IY`), three characters (`s`, `h`, `e`). Letter
mapping puts `s` then `h` then `e` shapes on the mouth; phoneme
mapping puts `SH` then `IY` shapes. The second is visibly more
accurate.

**Fix** (`voiceService.ts:alignmentToVisemes`):

1. Tokenize text into words.
2. For each word, look up phonemes in `cmu-pronouncing-dictionary`
   (134k entries, returns ARPAbet like `HH AH0 L OW1` for "hello").
3. Strip CMU's stress digits (0/1/2).
4. Distribute the word's audio duration proportionally across its
   phonemes.
5. Map each phoneme through `ARPABET_TO_VISEME` (derived from
   `Lips_Legend.png`) to a `Lips_NN.png` frame.

Words not in the dictionary fall back to the letter heuristic.

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

### ALWAYS get user approval of dialogue before `npm run generate-voices`

ElevenLabs charges API credits per line. Generating voices on un-approved
dialogue wastes money and forces a regeneration after the inevitable
rewrite. Hard rule: when the script-editor agent (or any other source)
produces dialogue, the main agent pauses and shows the script for
explicit approval BEFORE calling the voice generator.

Mentioned again in [.claude/agents/skit-script-editor.md](.claude/agents/skit-script-editor.md)
and AGENTS.md so subagents and future runs see it.

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

### Never hardcode `audioUrl` on `speak` actions

The skit source file should NEVER have `audioUrl: staticFile('voices/...')`
baked in. The voice generator owns the filename — its hashing scheme can
change (and has: from truncated-base64 → SHA-256 partway through this
project). Old hardcoded paths become 404s that surface as
`NotSupportedError` in the renderer (Remotion's `<Audio>` throws when it
can't decode what the fetch returned).

**Fix:** let `withVisemes(skit, visemes)` inject the `audioUrl` from the
generated `.visemes.ts` module. The skit author only writes `voiceId` and
`text` on each speak action — never `audioUrl`.

### `face` actions are instant, not tweened

The `face` action snaps direction at `atSec`. There's no smooth rotation
tween. If you need a turn over 0.5s, you'd need a new action variant. So
far we haven't needed it; characters either face the camera (`down`) or
face each other in dialogue, and instant snaps look fine on TikTok.

### `animate` with `loop: true` restarts every clip-length and looks like a glitch

Most FBX clips on the Lips-Pack rig are 0.8–1.7 seconds long. With
`loop: true` on a 10-second window, the clip restarts 6+ times — each
restart is a hard pose jump that reads as the actor twitching.

### One-shot `animate` with `loop: false` falls back to IDLE, not a frozen pose

Originally we let `loop: false` clamp the mixer at the clip's last
frame — but that left actors frozen mid-gesture. Worse, three.js's
mixer without `clampWhenFinished = true` collapses to bind pose
(near-T-pose) once `clipTime > duration`.

**The renderer now implements a continuous fallback:**

- If `clipTime <= clipObj.duration`, play the requested clip at that
  time (works for both looping and one-shot).
- If a one-shot clip has finished, **automatically switch to the
  looping idle** (`React_Stand_Discussion_1`) and advance its
  `clipTime` by the time since the clip ended (modulo the idle's
  duration).
- Set `action.clampWhenFinished = true` defensively in case we
  ever fall through with no idle clip available.

Result: actors never freeze, never T-pose. Use `loop: true` for
ambient idles that should keep playing forever (Discussion idles).
Use `loop: false` for one-shot gestures (Wave, ThumbsUp, Handshake) —
the engine smoothly returns to idle afterward. See the mixer step
block in [Character3D.tsx](src/components/Character3D.tsx).

### Remaining limit: animation library

After the parts-attach work, we have the full Characters-Pack mesh
library (8 tops, 4 bottoms, 17 hair, 2 beards, 2 aprons, 7
accessories, 17 held props) running on the Lips-Pack rig's face +
lip-sync system.

The remaining limit is the **animation library** — we still only have
the Lips-Pack's 17 talking-head clips. The Characters-Pack's 43 cafe
animations (sit/eat/drink/serve/Tray_Walk/Sofa_Cup_Pickup) live in
`Character_All.fbx` which we don't load. To unlock those, harvest
`AnimationClip` objects from a loaded Characters-Pack FBX and push
them onto the Lips-Pack mixer:

```ts
const cafeFbx = await new FBXLoader().loadAsync(staticFile('models/Character_All.fbx'));
for (const clip of cafeFbx.animations) {
  if (!ourClips[clip.name]) ourClips[clip.name] = clip;
}
```

The skeletons are bone-compatible so the clips drive the Lips-Pack
rig's bones directly. Not done yet — flag it when a skit really
needs sit/eat/drink motion.

### Every skit should look DIFFERENT from the last

The "safe" formula — *medium two-shot → push on A → cut to push on B
→ ECU on B → back to two-shot → push on A* — is the engine's path
of least resistance, and it produces skits that all feel the same.

Cinematic comedy demands **angle variety**. Before authoring a new
skit, audit the previous skit's angle vocabulary (eye-level / Dutch /
push / cut). Then deliberately commit to a DIFFERENT palette: high
isometric, worm's-eye, bird's-eye, behind-shoulder, hard cuts
between extreme angles, etc.

The brainstorm agents (`cinematic-shot-designer.md`) now bake this
in — but the principle is: **the engine is 3D, the camera is free,
use it**. Don't default to eye-level.

## Subagents

### Project-level `.claude/agents/*.md` files aren't auto-routed

The Agent tool's `subagent_type` parameter only knows built-in agent types
(`general-purpose`, `Explore`, `Plan`, etc.). Custom Markdown agent
definitions at `.claude/agents/<name>.md` are NOT auto-discovered as
selectable subagent types in this environment.

**Workaround:** spawn `general-purpose` agents and prepend `"Read
.claude/agents/<name>.md for your role brief"` to the prompt. The agent reads
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
