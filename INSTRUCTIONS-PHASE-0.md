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
Keys: duration (seconds), shape (box | sphere | torus | model), model (path under public/, required when shape is model), color (ignored for models), rotationSpeed (rad/s), camera ("x, y, z" start position), cameraTo ("x, y, z" optional end position), cameraEase (linear | ease-in | ease-out | ease-in-out, default ease-in-out, only with cameraTo), background, plus `>` lines for the caption.
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

## Current status

Phase -1 (planning docs) is DONE. Next action: Phase 0 (create the project, run the 3 spikes).
Update this section when a phase completes.

## Working rules

- Present a short plan first, then build. Do not jump into code before I confirm the plan.
- Give code directly in the reply, with the file path above each block. Do not produce .patch / git-patch files.
- I run `git push` myself. Never push to my repos.
- Keep answers short and structured. Say what to run, what to expect, and how to verify.
- If something I ask conflicts with the rules above, say so and propose an alternative instead of silently complying.
- Reply in the language I write in.

## Current status

Phases -1, 0, 1 and 2 are DONE.
Pipeline: storyboard/\*.md -> parse (Zod-validated, fails with readable errors and exit 1) -> ScriptVideo -> out/video.mp4.
Demo storyboard: 4 scenes, 14s (box, torus, sphere, duck .glb with camera dolly), captions in every scene.
Implemented: Zod schema (strict keys, hex colors, vec3, even width/height, model file existence check), duplicate-key and unreadable-line detection, CameraRig (cameraTo + cameraEase, always looks at origin, no useFrame), .glb support with bounding-box auto-fit (no local Suspense; ThreeCanvas holds the frame until the model loads), turntable (Y-only) rotation for models.
Rules learned: zod runs only in the parser (src/script/schema.ts is never imported by React code); Root.tsx types calculateMetadata with CalculateMetadataFunction<Props>; caption lines may be indented.
Environment: Windows, Git Bash in VS Code, Node v24.18.1, angle GL, AMD Radeon 840M.
Spikes folder: src/spikes/ (TestCube, TestModel).
Next action: Phase 3 (transitions between scenes with @remotion/transitions, per-scene audio/voiceover).
Update this section when a phase completes.
