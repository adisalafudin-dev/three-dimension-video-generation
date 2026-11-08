import { Easing } from "remotion";
import type { Chapter } from "./chapters";

// Kit actions on the chapter timeline (chapter-local frames)
export type Seg = { f0: number; f1: number; to: number }; // moves to `to` between f0 and f1, then holds
export type Highlight = { f0: number; f1: number; layer: string };
export type ActionTracks = {
  explode: Seg[];
  drive: Seg[];
  rain: Seg[];
  highlights: Highlight[];
};

export const buildActionTracks = (
  chapter: Chapter,
  fps: number,
): ActionTracks => {
  const tracks: ActionTracks = {
    explode: [],
    drive: [],
    rain: [],
    highlights: [],
  };
  chapter.scenes.forEach((scene, j) => {
    for (const a of scene.kitActions ?? []) {
      const f0 = chapter.offsets[j] + Math.round(a.start * fps);
      const f1 = Math.max(f0 + 1, chapter.offsets[j] + Math.round(a.end * fps));
      if (a.type === "explode") tracks.explode.push({ f0, f1, to: a.amount });
      else if (a.type === "drive") tracks.drive.push({ f0, f1, to: a.to });
      else if (a.type === "rain") tracks.rain.push({ f0, f1, to: a.intensity });
      else tracks.highlights.push({ f0, f1, layer: a.layer });
    }
  });
  tracks.explode.sort((a, b) => a.f0 - b.f0);
  tracks.drive.sort((a, b) => a.f0 - b.f0);
  tracks.rain.sort((a, b) => a.f0 - b.f0);
  return tracks;
};

const ease = Easing.inOut(Easing.cubic);

// Value of a track at a frame: starts at `initial`, eases to each target in turn, then holds
export const trackValue = (
  segs: Seg[],
  initial: number,
  frame: number,
): number => {
  let v = initial;
  for (const s of segs) {
    if (frame < s.f0) break;
    if (frame >= s.f1) {
      v = s.to;
      continue;
    }
    return v + (s.to - v) * ease((frame - s.f0) / (s.f1 - s.f0));
  }
  return v;
};

// The highlighted layer (last active highlight wins) with a short fade in and out
export const highlightAt = (
  highlights: Highlight[],
  frame: number,
  fps: number,
): { layer: string | null; amount: number } => {
  let active: Highlight | null = null;
  for (const h of highlights) if (frame >= h.f0 && frame < h.f1) active = h;
  if (!active) return { layer: null, amount: 0 };
  const fade = Math.max(1, Math.round(0.2 * fps));
  const amount = Math.max(
    0,
    Math.min(1, (frame - active.f0 + 1) / fade, (active.f1 - frame) / fade),
  );
  return { layer: active.layer, amount };
};
