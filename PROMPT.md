# PROMPT.md: topic -> storyboard

Paste this whole file into Claude/Gemini and fill the INPUT block. The answer must pass `npm run check -- <file>.md` on the first try. If it does not, paste the error list back with: "Fix these errors. Output the full corrected storyboard only."

## INPUT

- TOPIC: {{TOPIC}}
- TARGET_SECONDS: {{TARGET_SECONDS}} (default 40)
- FORMAT: {{FORMAT}} (vertical = 1080x1920, landscape = 1920x1080; default vertical)
- VOICE: {{VOICE}} (default en-US-GuyNeural; Indonesian: id-ID-ArdiNeural)
- AVAILABLE_MODELS: {{AVAILABLE_MODELS}} (default: none; only list real files, e.g. models/duck.glb)
- MODELS: recommend

## TASK

Write ONE storyboard for TOPIC. Output exactly one markdown code block and nothing else. Use ONLY the keys below. Audio and word timings are generated later from `narration`, so never write `audio` or `words`.

## FILE FORMAT

- Frontmatter, then one `## Scene title` per scene.
- Settings: `- key: value`, one per line. Beats and kit lines are indented two spaces under the scene, then the `>` caption.
- Unknown keys, duplicate keys, inline comments (`# ...`) are errors.

### Frontmatter

`title`, `fps` (30), `width`, `height` (even; vertical 1080x1920), `voice`.

### Scene keys (all optional)

| Key                  | Rule                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| narration            | quoted text spoken aloud, max 400 chars, about 12 to 25 words                                                                 |
| duration             | seconds >= 0.1, or `auto` (needs narration; = voice length + 0.4s + next transition). Always use `auto` when narration exists |
| chapter              | name (letters, digits, - \_). Consecutive scenes with the same name share ONE 3D world and a continuous camera                |
| shape                | box, sphere, torus, model [box]                                                                                               |
| model                | .glb/.gltf path; required when shape is model; only from AVAILABLE_MODELS                                                     |
| animation            | embedded clip name or zero-based index; model only; name must match a clip in the GLB                                        |
| animationSpeed       | positive playback multiplier [1]; requires animation                                                                         |
| modelRotate          | on/off [on]; model only; off disables the Y-axis turntable                                                                      |
| theme                | space or farm; chapter background/theme from its first scene                                                                    |
| themeDetail          | low/high [low]; only with theme                                                                                                 |
| kit                  | layers or road (replaces shape/model/color/rotationSpeed, which are then forbidden)                                           |
| color                | hex [#ffffff]; rotationSpeed rad/s [1]; background hex [#000000]                                                              |
| camera               | "x, y, z" start position [0, 0, 5]; always looks at the origin                                                                |
| cameraTo, cameraEase | end position over the whole scene; ease linear, ease-in, ease-out, ease-in-out. cameraEase only with cameraTo                 |
| transition           | none, fade, slide, wipe [none]; how THIS scene enters. Not on the first scene, and only on the FIRST scene of a chapter       |
| transitionDuration   | seconds [0.5]; only with a transition                                                                                         |
| audioVolume          | 0 to 1; only with narration                                                                                                   |

`background` also accepts `gradient(#05060f, #1b1040, 180deg)` and `image(images/bg.jpg)` (file must exist under `public/`). `theme` cannot be combined with `background`.

Inside a chapter, scenes after the first must NOT set shape, model, animation, animationSpeed, modelRotate, color, background, theme, themeDetail, rotationSpeed, kit, camera, transition or `+` lines. They inherit the world and continue the camera.

### Beats: timed overlays, one line each

`@ <seconds> <type> key="value" ... [for=<seconds>]` (seconds from the scene start; beat must end inside the scene; no `for` = until the scene end). `*word*` inside text is highlighted yellow. Values with spaces need double quotes.

| Type      | Fields                                                               | Slot      |
| --------- | -------------------------------------------------------------------- | --------- |
| title     | eyebrow (optional), text                                             | top       |
| tag       | text                                                                 | top-left  |
| badge     | text                                                                 | top-right |
| quote     | text, by (optional)                                                  | card      |
| stat      | value, label                                                         | card      |
| checklist | items="a \| b \| c" (1 to 5)                                         | card      |
| callout   | text + (x, y in screen % OR at="x, y, z" 3D point)                   | free      |
| camera    | pos="x, y, z", ease (optional): camera arrives at pos at that second | camera    |

Beats in the same slot (title, tag, badge, card) must not overlap in time. camera beats must be in increasing time order and cannot be combined with `cameraTo` in the same scene.

### Motion and pose actions

- `@ 0 motion preset=fall-into from="0,0,0" target="0,0,-6" for=4 turns=2 ease=ease-in` (also `launch`, `fly-to`, `drive`, `orbit`, `float`). Motion lines in a scene must not overlap; use multiple non-overlapping lines for a sequence. `fall-into`, `fly-to`, and `orbit` require `target`. Optional values: `from="x,y,z"`, `ease=linear|ease-in|ease-out|ease-in-out`, `turns=0..20`, `tumble=0..1`, `loop=on|off`.
- `@ 0 pose style=flail for=3 amount=0.8` (styles: `flail`, `float`, `run`, `wave`). Named limb nodes in GLB files are posed procedurally. Models without named limb nodes emit a warning and use whole-body tumble.
- `+ planet color=#c1440e radius=2 pos="6,3,-10" ring=on` or `+ blackhole radius=1.2 pos="0,0,-6"` are supported with `theme: space`.

### Kits

- `kit: layers`: needs 2 to 8 lines `+ layer name="Tile" color=#e9ecef thickness=0.15` (top to bottom, thickness 0.05 to 1, unique names). Actions: `@ 2 explode amount=1.2 for=1.5` (amount 0 to 3), `@ 4 highlight layer="Tile" for=2` (layer must exist). World: 4 wide x 3 deep, centred; suggested camera `5, 3.5, 11`.
- `kit: road`: optional `+ rain intensity=0.7` and `+ car color=#ff6b6b` (one each). Actions: `@ 0.5 drive to=5 for=4` (x from -8 to 8, car starts at -5), `@ 4 rain intensity=1 for=1.5`. Suggested camera `-10, 2.5, -1.6` (looks along the road).
- `+` lines only on the first scene of a chapter; kit actions can be on any scene of it.

## HARD RULES

1. Never invent keys, shapes, beat types, kits, transitions or files.
2. First scene: no transition. `transitionDuration` shorter than both neighbours.
3. Every scene with narration uses `duration: auto`; never write `audio` or `words`.
4. Beat times and camera beats must fit inside the scene. With `duration: auto`, estimate scene length as words / 2.5 + 0.4 seconds.
5. `at="x, y, z"` callouts must point near the object (sphere radius 1.4, box 2, torus 1.65, layers within +-2 x, +-1 y, +-1.5 z).
6. Match motion to narration: falling -> `fall-into`, rocket -> `launch`, car -> `drive`; use `theme: space` for space stories and `theme: farm` for farming.

## STYLE (vertical 9:16)

- Scene count about TARGET_SECONDS / 6. Each scene = one idea.
- Camera distance z 8 to 12 for shapes (vertical needs about 1.5x the landscape distance). Keep objects centred; the bottom 20% and the caption area (about 68% height) stay clear.
- Open with a `title` beat (eyebrow + one highlighted word). Use at most 2 beats per scene, and one card per scene.
- Group 2 to 4 related scenes into a chapter with camera beats for a continuous move; otherwise vary shape, color, background and transition.
- Dark background, bright object. `>` caption is optional (it defaults to the narration).

## EXAMPLE (valid)

```markdown
---
title: How a Rainbow Forms
fps: 30
width: 1080
height: 1920
voice: en-US-GuyNeural
---

## Sunlight

- duration: auto
- shape: sphere
- color: #ffd43b
- rotationSpeed: 0.5
- camera: 0, 0, 9
- background: #0b1020
- narration: "Sunlight looks white, but it secretly hides every single color inside."
  @ 0.3 title eyebrow="KITA BEDAH" text="How a _rainbow_ forms" for=3
  @ 0 tag text="Physics"

## Into the Drop

- chapter: drop
- duration: auto
- transition: fade
- shape: sphere
- color: #74c0fc
- camera: 0, 0, 10.5
- background: #0b1a33
- narration: "When a ray enters a raindrop, it slows down and starts to bend."
  @ 3.5 camera pos="4, 2, 8"
  @ 0.4 callout text="Light _slows down_" at="0.8, 0.8, 0.9" for=3

## Bending

- chapter: drop
- duration: auto
- narration: "Water bends the light because it travels slower than it does in air."
  @ 3.5 camera pos="-4, 1.5, 8"
  @ 0.5 quote text="Light takes the _fastest_ path, not the shortest." by="Fermat" for=3
```

## SELF-CHECK BEFORE ANSWERING

- [ ] Exactly one code block; only listed keys; hex colors
- [ ] Every narrated scene has `duration: auto`, no `audio`/`words`
- [ ] No transition on scene 1; chapter scenes after the first have no world keys, camera or transition
- [ ] Every beat ends inside its scene; same-slot beats do not overlap
- [ ] Highlighted layer names exist; kit actions match the kit
- [ ] Models only from AVAILABLE_MODELS; animation names exist in the selected GLB
- [ ] Motion actions fit the scene and do not overlap; theme and background are not combined
