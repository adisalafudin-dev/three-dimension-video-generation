import type { Caption } from "@remotion/captions";

export type Vec3 = [number, number, number];

export type CameraEase = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export type TransitionType = "none" | "fade" | "slide" | "wipe";

export type SceneData = {
  title: string;
  duration: number; // seconds
  shape: "box" | "sphere" | "torus" | "model";
  model?: string; // path under public/, required when shape is 'model'
  color: string; // ignored for models (they keep their own materials)
  rotationSpeed: number; // radians per second
  camera: Vec3; // start position (always looks at the origin)
  cameraTo?: Vec3; // optional end position; the camera moves there over the scene
  cameraEase: CameraEase; // easing used for the camera move
  transition: TransitionType; // how this scene enters from the previous one
  transitionDuration: number; // seconds, only meaningful when transition !== "none"
  audio?: string; // path under public/, e.g. audio/intro.mp3
  audioVolume: number; // 0..1
  background: string;
  caption: string;
  words?: Caption[]; // word timings for karaoke captions (inlined by the parser)
};

export type Storyboard = {
  title: string;
  fps: number;
  width: number;
  height: number;
  scenes: SceneData[];
};
