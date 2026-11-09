import { Easing, random } from "remotion";
import type { MotionAction, Vec3 } from "./types";

export type MotionState = { position: Vec3; rotation: Vec3; scale: Vec3; opacity: number; active: boolean; flame: number; preset?: MotionAction["preset"] };
const easeMap = {
  linear: Easing.linear,
  "ease-in": Easing.in(Easing.cubic),
  "ease-out": Easing.out(Easing.cubic),
  "ease-in-out": Easing.inOut(Easing.cubic),
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const vecMix = (a: Vec3, b: Vec3, t: number): Vec3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export const motionAt = (tracks: MotionAction[], frame: number, fps: number): MotionState => {
  const empty: MotionState = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], opacity: 1, active: false, flame: 0 };
  let completed: MotionAction | undefined;
  let selected: MotionAction | undefined;
  let progress = 0;
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    const f0 = Math.round(track.start * fps), f1 = Math.max(f0 + 1, Math.round(track.end * fps));
    if (frame < f0) break;
    if (frame >= f1) {
      const next = tracks[i + 1];
      if (track.loop && (!next || frame < Math.round(next.start * fps))) {
        selected = track;
        progress = ((frame - f0) % (f1 - f0)) / (f1 - f0);
        break;
      }
      completed = track;
      continue;
    }
    selected = track;
    progress = (frame - f0) / (f1 - f0);
    break;
  }
  if (selected) {
    const track = selected;
    const phase = Math.min(1, progress);
    const t = track.preset === "drive" ? phase : easeMap[track.preset === "fall-into" ? "ease-in" : track.ease](phase);
    const from = track.from ?? (track.preset === "drive" ? [-5, 0, 0] : [0, 0, 0]);
    const target = track.target ?? (track.preset === "launch" ? [0, 8, 0] : track.preset === "drive" ? [5, 0, 0] : [0, 0, 0]);
    const p: Vec3 = vecMix(from, target, t);
    let rotation: Vec3 = [0, 0, 0], scale: Vec3 = [1, 1, 1], opacity = 1;
    if (track.preset === "fall-into") {
      const a = phase * Math.PI * 2 * track.turns;
      const r = mix(1, 0.1, t);
      p[0] += Math.cos(a) * r; p[2] += Math.sin(a) * r;
      const stretch = 1 + Math.max(0, (t - 0.72) / 0.28) * 3;
      scale = [mix(1, 0.1, t), mix(1, 0.1, t) * stretch, mix(1, 0.1, t)];
      rotation = [0, a, track.tumble * phase * Math.PI * 2];
      opacity = t > 0.94 ? 1 - (t - 0.94) / 0.06 : 1;
    } else if (track.preset === "launch") {
      p[0] += Math.sin(phase * Math.PI) * 0.35;
      rotation = [0, 0, Math.atan2(0.35 * Math.PI * Math.cos(phase * Math.PI), Math.max(0.1, target[1] - from[1]))];
      return { position: p, rotation, scale, opacity, active: true, flame: 0.65 + 0.35 * random(frame + 913), preset: track.preset };
    } else if (track.preset === "fly-to") {
      p[1] += Math.sin(Math.PI * phase) * 0.3;
      rotation = [0, Math.atan2(target[0] - from[0], target[2] - from[2]), 0];
    } else if (track.preset === "drive") {
      p[1] += Math.sin(frame / fps * 9) * 0.04;
      rotation = [Math.sin(frame / fps * 9) * 0.015, Math.PI / 2, 0];
    } else if (track.preset === "orbit") {
      const a = phase * Math.PI * 2 * track.turns;
      const radius = Math.hypot(from[0] - target[0], from[2] - target[2]) || 4;
      p[0] = target[0] + Math.cos(a) * radius; p[1] = target[1] + from[1] * (1 - t); p[2] = target[2] + Math.sin(a) * radius;
      rotation = [0, -a, 0];
    } else if (track.preset === "float") {
      const sec = frame / fps;
      p[0] += Math.sin(sec * 0.45) * 0.35; p[1] += Math.sin(sec * 0.8) * 0.24; p[2] += Math.cos(sec * 0.32) * 0.18;
      rotation = [Math.sin(sec * 0.38) * track.tumble, 0, Math.cos(sec * 0.3) * track.tumble];
    }
    return { position: p, rotation, scale, opacity, active: true, flame: 0, preset: track.preset };
  }
  if (completed) {
    const final = motionAt([completed], Math.round(completed.end * fps) - 1, fps);
    return { ...final, active: false, flame: 0, preset: undefined };
  }
  return empty;
};
