import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const Caption: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame(); // local to the scene's <Sequence>
  const { durationInFrames, fps } = useVideoConfig(); // also the scene's own duration

  if (!text) return null;

  // Keep the fade inside short scenes: interpolate needs strictly increasing inputs
  const fade = Math.max(
    1,
    Math.min(Math.round(0.4 * fps), Math.floor(durationInFrames / 2) - 1),
  );

  const opacity = interpolate(
    frame,
    [0, fade, durationInFrames - fade, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const translateY = interpolate(frame, [0, fade], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 90,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          color: "white",
          fontSize: 56,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          textAlign: "center",
          textShadow: "0 4px 24px rgba(0,0,0,0.6)",
          whiteSpace: "pre-line",
          maxWidth: "80%",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
