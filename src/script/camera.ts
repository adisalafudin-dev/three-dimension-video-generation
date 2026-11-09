import { Easing } from "remotion";
import type { Chapter } from "./chapters";
import { sceneFrames } from "./timing";
import type { CameraEase, Vec3 } from "./types";

const EASINGS: Record<CameraEase, (t: number) => number> = {
  linear: Easing.linear,
  "ease-in": Easing.in(Easing.cubic),
  "ease-out": Easing.out(Easing.cubic),
  "ease-in-out": Easing.inOut(Easing.cubic),
};

// The camera is at `pos` at `frame` (chapter-local); it moves from the previous point with `ease`
export type CameraPoint = { frame: number; pos: Vec3; ease: CameraEase };

// cameraTo is shorthand for one keyframe at the end of the scene
export const buildCameraPoints = (
  chapter: Chapter,
  fps: number,
): CameraPoint[] => {
  const points: CameraPoint[] = [
    { frame: 0, pos: chapter.scenes[0].camera, ease: "linear" },
  ];
  chapter.scenes.forEach((scene, j) => {
    const keys =
      scene.cameraKeys ??
      (scene.cameraTo
        ? [
            {
              time: scene.duration === "auto" ? 3 : scene.duration ?? 3,
              pos: scene.cameraTo,
              ease: scene.cameraEase,
            },
          ]
        : []);
    const lastFrameOfScene =
      chapter.offsets[j] + sceneFrames(scene.duration, fps) - 1;
    for (const key of keys) {
      const prev = points[points.length - 1];
      const frame = Math.max(
        prev.frame + 1,
        Math.min(
          chapter.offsets[j] + Math.round(key.time * fps),
          lastFrameOfScene,
        ),
      );
      points.push({ frame, pos: key.pos, ease: key.ease });
    }
  });
  return points;
};

// Pure function of the frame (no useFrame): where the camera is at a chapter-local frame
export const cameraAt = (points: CameraPoint[], frame: number): Vec3 => {
  if (frame <= points[0].frame) return points[0].pos;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (frame <= b.frame) {
      const t = EASINGS[b.ease]((frame - a.frame) / (b.frame - a.frame));
      return [
        a.pos[0] + (b.pos[0] - a.pos[0]) * t,
        a.pos[1] + (b.pos[1] - a.pos[1]) * t,
        a.pos[2] + (b.pos[2] - a.pos[2]) * t,
      ];
    }
  }
  return points[points.length - 1].pos;
};
