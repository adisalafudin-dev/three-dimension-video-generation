import type { SceneData, Storyboard } from "./types";

export const sceneFrames = (duration: number, fps: number) =>
  Math.round(duration * fps);

// Frames of the entry transition of scene i (0 = hard cut)
export const enterFrames = (scenes: SceneData[], i: number, fps: number) =>
  i > 0 && scenes[i].transition !== "none"
    ? sceneFrames(scenes[i].transitionDuration, fps)
    : 0;

// total = sum(scene frames) - sum(transition frames)
export const totalFrames = (sb: Storyboard) =>
  Math.max(
    1,
    sb.scenes.reduce(
      (sum, s, i) =>
        sum +
        sceneFrames(s.duration, sb.fps) -
        enterFrames(sb.scenes, i, sb.fps),
      0,
    ),
  );
