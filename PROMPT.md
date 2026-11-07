# PROMPT.md: topic -> storyboard

Paste this whole file into Claude and fill the INPUT block. Output must pass `npm run parse` on the first try.

## INPUT

- TOPIC: {{TOPIC}}
- TARGET_SECONDS: {{TARGET_SECONDS}} (final video length, default 30)
- FORMAT: {{FORMAT}} (landscape = 1920x1080, vertical = 1080x1920; default landscape)
- AVAILABLE_MODELS: {{AVAILABLE_MODELS}} (default: models/duck.glb)
- AVAILABLE_AUDIO: {{AVAILABLE_AUDIO}} (default: none; list real files only, e.g. audio/scene1.mp3)

## TASK

Write a storyboard for TOPIC and a narration script. Use ONLY the keys below. Output exactly two code blocks and nothing else:

1. `storyboard`: the .md file.
2. `narration`: one numbered line per scene, written to be spoken aloud, about 2.5 words per second.

## FILE FORMAT

- Start with frontmatter, then one `## Scene title` per scene.
- Each setting is one line: `- key: value`.
- Caption is one or more lines starting with `>` (shown on screen).
- No inline comments (`# ...` would become part of the value). No blank-key lines. No duplicate keys in a scene.
- Any unknown key is an error.

### Frontmatter (all optional)

| Key           | Rule                                                         |
| ------------- | ------------------------------------------------------------ |
| title         | text                                                         |
| fps           | integer 1-120, default 30                                    |
| width, height | even integers. Landscape: 1920 / 1080. Vertical: 1080 / 1920 |

### Scene keys (all optional; defaults in brackets)

| Key                | Rule                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| duration           | seconds, >= 0.1 [3]                                                                                                          |
| shape              | box, sphere, torus, model [box]                                                                                              |
| model              | path under public/, .glb or .gltf. Required when shape is model. Not allowed otherwise. Only use files from AVAILABLE_MODELS |
| color              | hex like #ff6b6b [#ffffff]. Ignored for models                                                                               |
| rotationSpeed      | number, radians per second [1]                                                                                               |
| camera             | "x, y, z" start position, 3 numbers [0, 0, 5]. Camera always looks at the origin                                             |
| cameraTo           | "x, y, z" end position. The camera moves there over the whole scene                                                          |
| cameraEase         | linear, ease-in, ease-out, ease-in-out [ease-in-out]. Only allowed with cameraTo                                             |
| background         | hex like #0b1020 [#000000]                                                                                                   |
| transition         | none, fade, slide, wipe [none]. How THIS scene enters from the previous one. Not allowed on the first scene                  |
| transitionDuration | seconds, >= 0.1 [0.5]. Only allowed when transition is not none                                                              |
| audio              | path under public/, .mp3 .wav .m4a .aac .ogg. Only use files from AVAILABLE_AUDIO                                            |
| audioVolume        | 0 to 1 [1]. Only allowed with audio                                                                                          |

## HARD RULES (the parser rejects violations)

1. First scene has no `transition` and no `transitionDuration`.
2. `transitionDuration` must be shorter than the previous scene AND the scene itself.
3. A scene's entry transition + the next scene's entry transition must be shorter than the scene.
4. `cameraEase` only with `cameraTo`. `transitionDuration` only with a transition other than none. `audioVolume` only with `audio`.
5. `shape: model` requires `model`; `model` requires `shape: model`.
6. Never invent keys, shapes, transitions or files.

## TIMING

- Video length = sum(scene durations) - sum(transitionDurations). Hit TARGET_SECONDS within about 1 second.
- Use 5 to 7 scenes for 30s, 3 to 4 seconds minimum per scene.
- With audio: `duration` >= clip length + NEXT scene's transitionDuration + 0.2. Without clips, estimate clip length as words / 2.5.

## STYLE

- Only primitives (box, sphere, torus) and the listed models. No text objects, lights or particles exist.
- Caption: at most 8 words per line, at most 2 lines. It is not the narration.
- Vary shape, color, background, camera and transition between scenes. Keep text readable: dark background with a bright shape.
- Camera distance: z between 4 and 8 for all shapes and models. For vertical, use z 6 to 9.
- Use `camera` + `cameraTo` for a dolly or orbit move on 1 to 2 scenes at most.
- Mix transitions; do not use the same one on every scene.

## EXAMPLE (valid)

```markdown
---
title: Demo
fps: 30
width: 1920
height: 1080
---

## Intro

- duration: 5
- shape: box
- color: #51cf66
- rotationSpeed: 1.2
- camera: 0, 1, 5
- audio: audio/{{topic}}/scene1.mp3
- background: #0b1020
  > Written as a plain text script

## Spin Faster

- duration: 5
- transition: fade
- shape: torus
- color: #4dabf7
- rotationSpeed: 3
- camera: 3, 2, 4
- audio: audio/{{topic}}/scene2.mp3
- background: #101a30
  > Change a value, change the scene

## Meet the Duck

- duration: 5
- transition: wipe
- shape: model
- model: models/duck.glb
- rotationSpeed: 1
- camera: 0, 1, 8
- cameraTo: 0, 1, 4
- cameraEase: ease-in-out
- audio: audio/{{topic}}/scene3.mp3
- background: #1a1030
  > Your own 3D models
```

## SELF-CHECK BEFORE ANSWERING

- [ ] Only listed keys, values in range, hex colors
- [ ] No transition on scene 1
- [ ] Every transitionDuration shorter than both neighbours
- [ ] Total length matches TARGET_SECONDS
- [ ] Every model and audio path comes from the INPUT lists
- [ ] Exactly two code blocks: storyboard, narration
