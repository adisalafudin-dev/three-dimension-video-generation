import type { Caption } from "@remotion/captions";

export type Vec3 = [number, number, number];

export type CameraEase = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export type TransitionType = "none" | "fade" | "slide" | "wipe";

export type CameraKey = { time: number; pos: Vec3; ease: CameraEase };

export type KitName = "layers" | "road";
export type ThemeName = "space" | "farm" | "city" | "ocean" | "forest" | "desert" | "indoor" | "lab" | "highway";
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";
export type Weather = "clear" | "rain" | "fog" | "snow" | "dust";
export type MotionPreset = "fall-into" | "launch" | "fly-to" | "drive" | "orbit" | "float";
export type MotionAction = { start: number; end: number; preset: MotionPreset; target?: Vec3; from?: Vec3; ease: CameraEase; turns: number; tumble: number; loop: boolean };
export type PoseAction = { start: number; end: number; style: "flail" | "float" | "run" | "wave"; amount: number; fallbackTumble: boolean };
export type SceneProp = { type: "planet"; color: string; radius: number; pos: Vec3; ring: boolean } | { type: "blackhole"; radius: number; pos: Vec3 };

// Static parts of a kit ("+ layer name=... color=... thickness=...")
export type KitPart =
  | { type: "layer"; name: string; color: string; thickness: number }
  | { type: "rain"; intensity: number }
  | { type: "car"; color: string };

// Timed kit action ("@ <s> explode amount=1.2 for=1.5"); start/end in seconds from the scene start
export type KitAction = { start: number; end: number } & (
  | { type: "explode"; amount: number }
  | { type: "highlight"; layer: string }
  | { type: "drive"; to: number }
  | { type: "rain"; intensity: number }
);

export type BeatType =
  | "title"
  | "tag"
  | "badge"
  | "quote"
  | "stat"
  | "checklist"
  | "callout";

// Timed overlay inside a scene. start/end are seconds from the scene start (end is resolved by the parser).
export type Beat = { start: number; end: number } & (
  | { type: "title"; eyebrow?: string; text: string }
  | { type: "tag"; text: string }
  | { type: "badge"; text: string }
  | { type: "quote"; text: string; by?: string }
  | { type: "stat"; value: string; label: string }
  | { type: "checklist"; items: string[] }
  | { type: "callout"; text: string; x?: number; y?: number; at?: Vec3 } // x/y = screen %, at = 3D point
);

export type SceneData = {
  title: string;
  chapter?: string;
  duration: number | "auto"; // seconds
  shape: "box" | "sphere" | "torus" | "model";
  model?: string; // path under public/, required when shape is 'model'
  animation?: string | number; // embedded clip name or zero-based index
  animationSpeed: number;
  modelRotate: boolean;
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
  // in SceneData, after words?:
  beats?: Beat[]; // timed overlays (title, cards, callouts)
  cameraKeys?: CameraKey[];
  kit?: KitName; // procedural 3D world instead of a single shape
  kitParts?: KitPart[];
  kitActions?: KitAction[];
  theme?: ThemeName;
  themeDetail: "low" | "high";
  time: TimeOfDay;
  weather: Weather;
  motion: MotionAction[];
  poses: PoseAction[];
  props: SceneProp[];
};

export type Storyboard = {
  title: string;
  fps: number;
  width: number;
  height: number;
  scenes: SceneData[];
};
