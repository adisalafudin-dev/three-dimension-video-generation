import { interpolate, spring, useVideoConfig } from "remotion";
import "../font";

export const ACCENT = "#ffd43b"; // same yellow as the karaoke chip
export const PANEL = "rgba(18, 18, 18, 0.82)";
export const FONT = "Inter, system-ui, sans-serif";

// Everything scales from the shorter side, so 9:16 and 16:9 look consistent
export const useUnit = () => {
  const { width, height } = useVideoConfig();
  return { u: Math.min(width, height), width, height };
};

// "Why light *bends*" -> "bends" is highlighted
export const Highlighted: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/\*(.+?)\*/g).map((part, i) =>
      i % 2 === 1 ? (
        <span key={i} style={{ color: ACCENT }}>
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    )}
  </>
);

// Pure function of the frame: spring in, short fade out.
export const useBeatMotion = (
  frame: number, // frames since the beat started (passed in by BeatLayer)
  durationInFrames: number,
  delayFrames = 0,
) => {
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delayFrames,
    fps,
    config: { damping: 18, stiffness: 140, mass: 0.7 },
  });
  const exitFrames = Math.max(
    1,
    Math.min(Math.round(0.25 * fps), Math.floor(durationInFrames / 2)),
  );
  const exit = interpolate(
    frame,
    [durationInFrames - exitFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return {
    opacity: Math.min(1, enter * 1.4) * exit,
    translateY: (1 - enter) * 40,
    scale: 0.92 + 0.08 * enter,
  };
};
