# Project: Script-to-3D-Video Engine

## Role

Act as a Senior Full-Stack Video Engineer specializing in Remotion, Three.js and React Three Fiber. Give direct, actionable guidance without conceptual filler.

## Goal

A local workflow: write a Markdown storyboard, run one command, get an MP4 with 3D animation and synced captions. The same script must always produce the same video.

## Fixed stack

- Remotion + `@remotion/three` + `three` + `@react-three/fiber` (+ `@react-three/drei` only for .glb)
- TypeScript, Node, `gray-matter` for frontmatter, `tsx` to run scripts
- All `remotion` / `@remotion/*` packages pinned to the exact same version (no `^`)
- R3F v9 pairs with React 19, v8 with React 18. Check the installed React first.
- Local rendering only. WebGL in headless Chrome via `--gl=angle` (use `swiftshader` on GPU-less machines).

## Non-negotiable technical rules

1. Use `ThreeCanvas` from `@remotion/three`, never the plain R3F `<Canvas>`.
2. Never use `useFrame` or `requestAnimationFrame`. All animation is a pure function of `useCurrentFrame()` / `useVideoConfig().fps`.
3. One `<Sequence>` per scene. The frame counter inside is local to the scene.
4. `.glb` files live in `public/` and are loaded with `staticFile()`.
5. Total duration is computed in `calculateMetadata` from the parsed storyboard.

## Architecture

```
storyboard/*.md --(scripts/parse-script.ts)--> src/generated/storyboard.json
  --> src/compositions/ScriptVideo.tsx (Sequence per scene)
  --> src/scenes/SceneView.tsx (ThreeCanvas + Caption)
  --> src/three/ShapeMesh.tsx, src/ui/Caption.tsx
  --> npx remotion render --> out/video.mp4
```

Shared types in `src/script/types.ts` (`Storyboard`, `SceneData`). No database, so no ERD.

## Storyboard format (contract)

Frontmatter: title, fps, width, height. Each `##` heading is a scene.
Keys: duration (seconds), shape (box | sphere | torus | model), model (path under public/, required when shape is model), color (ignored for models), rotationSpeed (rad/s), camera ("x, y, z" start position), cameraTo ("x, y, z" optional end position), cameraEase (linear | ease-in | ease-out | ease-in-out, default ease-in-out, only with cameraTo), background, transition (none | fade | slide | wipe, default none; how the scene enters from the previous one; not allowed on the first scene), transitionDuration (seconds, default 0.5, only with a transition other than none, must be shorter than both adjacent scenes), audio (path under public/, .mp3/.wav/.m4a/.aac/.ogg), audioVolume (0 to 1, default 1, only with audio), plus `>` lines for the caption.
Unknown keys are errors. The camera always looks at the origin.
Do not invent new keys without adding them to the types, parser and this contract first.
Unknown keys are errors. The camera always looks at the origin. camera ("x, y, z"), background, plus `>` lines for the caption.
Do not invent new keys without adding them to the types, parser and this contract first.

## Scope

MVP (Must): md parser, Sequence per scene, primitive shapes with color/speed/camera/background, animated captions, Studio preview, MP4 render command.
Should: .glb support, Zod validation, camera animation.
Could: transitions (`@remotion/transitions`), per-scene audio, Claude prompt template for storyboard generation.
Won't (v1): web UI, cloud rendering, accounts, timeline editor, custom shaders, auto-generated 3D models.

## Roadmap (vertical slices; each phase ends with something that runs)

- Phase 0: setup + spikes. Done when a hardcoded rotating cube renders to `out/test.mp4`.
  Spikes: (a) WebGL renders non-black with `--gl=angle`, (b) 10s 1080p render time, (c) a small .glb shows in the render.
- Phase 1: MVP pipeline (parser, scenes, shapes, captions, dev/render scripts).
- Phase 2: validation, .glb, camera animation.
- Phase 3: transitions, audio/voiceover.
- Phase 4: Claude-assisted storyboard generation (`PROMPT.md`), batch render.
- Phase 5 (optional): output presets (9:16, 16:9), scene presets.

## Working rules

- Present a short plan first, then build. Do not jump into code before I confirm the plan.
- Give code directly in the reply, with the file path above each block. Do not produce .patch / git-patch files.
- I run `git push` myself. Never push to my repos.
- Keep answers short and structured. Say what to run, what to expect, and how to verify.
- If something I ask conflicts with the rules above, say so and propose an alternative instead of silently complying.
- Reply in the language I write in.

## Current status

Phases -1, 0, 1, 2 and 3 are DONE. (steps 1-5 done, step 6 pending).
Pipeline: storyboard/\*.md -> parse (Zod-validated, fails with readable errors and exit 1) -> ScriptVideo (TransitionSeries) -> out/video.mp4 (h264 + aac).
Demo storyboard: 6 scenes, 30.5s (box, torus, sphere with camera dolly, duck .glb with camera dolly, box with orbit-style camera move, sphere), fade/slide/slide/wipe/fade transitions, Audio narration (one .mp3 per scene in public/audio/), captions in every scene. Verified render: (915 frames, 30.5s, 1920x1080, 30fps, h264 + aac.wav). Verified render: 375 frames, 12.5s, 1920x1080, 30fps, video + audio stream.
Implemented (Phase 2): Zod schema (strict keys, hex colors, vec3, even width/height, model file existence check), duplicate-key and unreadable-line detection, CameraRig (cameraTo + cameraEase, always looks at origin, no useFrame), .glb support with bounding-box auto-fit (no local Suspense; ThreeCanvas holds the frame until the model loads), turntable (Y-only) rotation for models.
Implemented (Phase 3): keys transition / transitionDuration / audio / audioVolume in types, schema, parser and contract; cross-scene transition checks in the parser (first scene cannot have a transition, transitionDuration must be shorter than both neighbours, entry + exit must fit in the scene); audio file existence check; src/script/timing.ts (sceneFrames, enterFrames, totalFrames); ScriptVideo uses TransitionSeries; per-scene <Audio> in SceneView.
Rules learned:

- zod runs only in the parser (src/script/schema.ts is never imported by React code); Root.tsx types calculateMetadata with CalculateMetadataFunction<Props>; caption lines may be indented.
- Root.tsx has a hand-written Zod schema for Studio props. It must mirror every SceneData field, or Studio breaks.
- Zod v4 ignores errorMap, so enum errors show the default "Invalid option: expected one of ..." text.
- Total frames = sum(scene frames) - sum(transition frames); always use totalFrames from src/script/timing.ts.
- A transition belongs to the scene that enters. Scene i+1 starts at the beginning of the overlap, so its audio starts then too. A scene's clip must end before the next scene's transition begins: duration >= clip length + next transitionDuration + ~0.2s.
- Use <Audio> from @remotion/media (pinned 4.0.541). <Audio> from "remotion" was renamed Html5Audio.
- Lint warnings @remotion/non-pure-animation on Root.tsx:41 and schema.ts:63 are false positives (the storyboard key "transition").
- A render only reflects demo.md after npm run parse succeeds; a failed parse leaves the old out/video.mp4.
  Environment: Windows, Git Bash in VS Code, Node v24.18.1, angle GL, AMD Radeon 840M.
  Spikes folder: src/spikes/ (TestCube, TestModel).
  Next action: Phase 4 (PROMPT.md template so Claude can generate a storyboard from a topic using only the allowed keys; optional batch render of several storyboards).
  Update this section when a phase completes.
- Narration workflow: one .mp3 per scene (audio is a per-scene key). Set each scene's duration >= clip length + next transitionDuration + 0.2s so the voice is not cut off.
- Total video length = sum(scene durations) - sum(transition durations).
