# Phase -1: Script-to-3D-Video Engine

> Template + filled example. Copy this file for each new project and replace the content.
> Timebox: 1-2 sittings. If it takes longer than building the MVP, it's too heavy.

---

## 1. Problem & Goal One-Pager

**Problem**
Making short 3D explainer videos by hand (After Effects / Blender) is slow and not repeatable. Changing one caption or color means re-editing and re-exporting manually.

**Goal**
Write a Markdown storyboard, run one command, get an MP4 with 3D animation and synced captions. Same script always gives the same video.

**Primary user**
Me (solo creator/developer), running everything locally.

**Success criteria (how I know it's done)**

- [ ] `npm run render` turns `storyboard/*.md` into `out/video.mp4` with no manual steps
- [ ] A 30s / 1080p / 30fps video renders in under 10 minutes on my machine (to be verified in the spike)
- [ ] Changing a color, rotation speed, or caption in the `.md` changes the video without touching React code
- [ ] I can write a new storyboard in under 10 minutes using only the documented keys

**Non-goals (will NOT build)**

- No web UI or hosted service (CLI + Remotion Studio only)
- No user accounts, database, or cloud rendering
- No visual timeline editor
- No custom shaders / physics / complex animation rigs in v1
- No automatic 3D model generation

**Constraints**

- Runs on my local machine (WebGL in headless Chrome, may need `--gl=angle` or `swiftshader`)
- Stack fixed: Remotion, `@remotion/three`, React Three Fiber, TypeScript
- Deterministic rendering: all animation derived from `useCurrentFrame()`, never `useFrame`

---

## 2. PRD-lite

### User stories

| ID   | As a... | I want to...                                                   | So that...                          |
| ---- | ------- | -------------------------------------------------------------- | ----------------------------------- |
| US1  | creator | write scenes in Markdown with a duration per scene             | I control timing without code       |
| US2  | creator | set shape, color, rotation speed, camera, background per scene | each scene looks different          |
| US3  | creator | add caption text per scene that fades in/out                   | the video is readable without audio |
| US4  | creator | preview with hot reload before rendering                       | I iterate quickly                   |
| US5  | creator | render to MP4 with one command                                 | I get a shareable file              |
| US6  | creator | load my own `.glb` model                                       | I'm not limited to primitives       |
| US7  | creator | animate the camera (orbit/dolly)                               | scenes feel cinematic               |
| US8  | creator | add transitions between scenes                                 | cuts don't feel abrupt              |
| US9  | creator | attach audio/voiceover per scene                               | the video has narration             |
| US10 | creator | get clear errors for invalid storyboard keys                   | I don't debug silent failures       |
| US11 | creator | have Claude generate a storyboard from a topic                 | I skip writing from scratch         |

### Storyboard format (contract)

```md
---
title: Demo
fps: 30
width: 1920
height: 1080
---

## Scene title

- duration: 3 # seconds
- shape: box # box | sphere | torus | model
- color: #ff6b6b
- rotationSpeed: 1.2 # rad/s
- camera: 0, 1, 5
- background: #0b1020
  > Caption text
```

### Architecture (short decisions)

| Decision      | Choice                                | Why                                            |
| ------------- | ------------------------------------- | ---------------------------------------------- |
| Script format | Markdown + frontmatter                | Easy for me and Claude to write; diff-friendly |
| Parser        | Node script, md -> JSON at build step | Deterministic, testable, keeps React pure      |
| Scene timing  | One `<Sequence>` per scene            | Local frame counter per scene                  |
| 3D            | `ThreeCanvas` from `@remotion/three`  | Frame-synced with Remotion renderer            |
| Animation     | Pure functions of frame               | Reproducible renders                           |
| Data model    | JSON files, no database               | Nothing to persist beyond files                |

(No ERD needed: the "data model" is the `Storyboard` / `SceneData` TypeScript types.)

### Risks / spikes (do before Phase 1)

| Risk                           | Spike                                           | Pass condition                   |
| ------------------------------ | ----------------------------------------------- | -------------------------------- |
| WebGL fails in headless render | Render 1 rotating cube to MP4 with `--gl=angle` | Non-black MP4                    |
| Render too slow                | Time a 10s 1080p render                         | Extrapolates to < 10 min for 30s |
| `.glb` loading in render       | Render one scene with a small model             | Model visible in the MP4         |

---

## 3. Feature Prioritization (MoSCoW)

| Priority       | Feature                                             | Stories       | Notes                       |
| -------------- | --------------------------------------------------- | ------------- | --------------------------- |
| **Must**       | md -> JSON parser                                   | US1, US2, US3 | Core of the pipeline        |
| **Must**       | Sequence per scene + durations                      | US1           |                             |
| **Must**       | Primitive shapes with color/speed/camera/background | US2           |                             |
| **Must**       | Animated captions                                   | US3           |                             |
| **Must**       | Studio preview + MP4 render command                 | US4, US5      |                             |
| **Should**     | `.glb` model support                                | US6           | Spike first                 |
| **Should**     | Parser validation + readable errors                 | US10          | Zod schema                  |
| **Should**     | Camera animation                                    | US7           | `interpolate` / `spring`    |
| **Could**      | Transitions between scenes                          | US8           | `@remotion/transitions`     |
| **Could**      | Audio/voiceover per scene                           | US9           |                             |
| **Could**      | Claude prompt template for storyboard generation    | US11          | Just a markdown prompt file |
| **Won't (v1)** | Web UI, cloud rendering, timeline editor, shaders   |               | See non-goals               |

**MVP = all Must items.**

---

## 4. Phase Roadmap (vertical slices)

Each phase ends with a runnable result.

### Phase 0: Setup + spike

- Init Remotion project (TypeScript), install `three`, `@react-three/fiber`, `@remotion/three`
- Folder structure + `remotion.config.ts` (`angle` GL)
- Run the three spikes above
- **Done when:** a hardcoded rotating cube renders to `out/test.mp4`

### Phase 1: MVP pipeline

- `types.ts`, `parse-script.ts`, `storyboard.json` output
- `ScriptVideo` -> `<Sequence>` per scene -> `SceneView`
- `ShapeMesh` (box/sphere/torus), `Caption`
- `npm run dev` and `npm run render`
- **Done when:** the 3-scene demo `.md` renders to MP4 with correct timing and captions

### Phase 2: Richer scenes

- Validation (Zod) with clear error messages
- `.glb` model support
- Camera animation keys (e.g. `cameraTo`, `cameraEase`)
- **Done when:** a scene with a custom model and moving camera renders correctly

### Phase 3: Polish and audio

- Transitions between scenes
- Per-scene audio / voiceover
- **Done when:** a 30s video with transitions and narration renders in one command

### Phase 4: Claude-assisted workflow

- `PROMPT.md` template: topic -> storyboard using only allowed keys
- Optional: batch render multiple storyboards, render-time notes
- **Done when:** topic in, MP4 out, with only review/edit by me

### Phase 5 (optional, only if needed)

- Output presets (vertical 9:16 for Shorts, 16:9 for YouTube)
- Reusable scene presets

---

## Next action

1. Create the Remotion project.
2. Run the 3 spikes (Phase 0).
3. Only then start Phase 1.
