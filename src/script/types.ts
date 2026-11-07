export type Vec3 = [number, number, number];

export type SceneData = {
  title: string;
  duration: number; // seconds
  shape: "box" | "sphere" | "torus" | "model";
  model?: string; // path under public/ (used from Phase 2)
  color: string;
  rotationSpeed: number; // radians per second
  camera: Vec3;
  background: string;
  caption: string;
};

export type Storyboard = {
  title: string;
  fps: number;
  width: number;
  height: number;
  scenes: SceneData[];
};
