import type { SceneData } from "./types";
import { sceneFrames } from "./timing";

// Consecutive scenes with the same `chapter` share one 3D world (one ThreeCanvas).
// A scene without `chapter` is its own chapter.
export type Chapter = {
  scenes: SceneData[];
  firstIndex: number; // index of the chapter's first scene in storyboard.scenes
  offsets: number[]; // start frame of each scene inside the chapter
  frames: number; // chapter length in frames
};

export const groupChapters = (scenes: SceneData[], fps: number): Chapter[] => {
  const out: Chapter[] = [];
  scenes.forEach((scene, i) => {
    const last = out[out.length - 1];
    if (last && scene.chapter && scene.chapter === last.scenes[0].chapter) {
      last.offsets.push(last.frames);
      last.scenes.push(scene);
      last.frames += sceneFrames(scene.duration, fps);
    } else {
      out.push({
        scenes: [scene],
        firstIndex: i,
        offsets: [0],
        frames: sceneFrames(scene.duration, fps),
      });
    }
  });
  return out;
};
