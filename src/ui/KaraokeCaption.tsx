import { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption } from "@remotion/captions";

// Local font so every machine renders the same glyphs (file: public/fonts/Inter-Bold.woff2)
loadFont({
  family: "Inter",
  url: staticFile("fonts/Inter-Bold.woff2"),
  weight: "700",
});

const COMBINE_MS = 1200; // how many words share one on-screen line (higher = longer lines)
const CENTER_Y = 0.68; // vertical position as a fraction of the frame height (clear of the Shorts UI)
const ACTIVE_BG = "#ffd43b";

export const KaraokeCaption: React.FC<{ words: Caption[] }> = ({ words }) => {
  const frame = useCurrentFrame(); // local to the scene, same clock as the scene's audio
  const { fps, width, height } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions: words,
        combineTokensWithinMilliseconds: COMBINE_MS,
      }),
    [words],
  );

  // A page is visible from its start until the next page starts (or its own length, whichever is first)
  let page: (typeof pages)[number] | null = null;
  for (let i = 0; i < pages.length; i++) {
    const end = Math.min(
      pages[i + 1]?.startMs ?? Infinity,
      pages[i].startMs + pages[i].durationMs,
    );
    if (nowMs >= pages[i].startMs && nowMs < end) {
      page = pages[i];
      break;
    }
  }
  if (!page) return null;

  // Active word = the last word that has started
  let active = -1;
  page.tokens.forEach((t, i) => {
    if (nowMs >= t.fromMs) active = i;
  });

  const fontSize = Math.round(width * 0.062);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height * CENTER_Y,
          transform: "translateY(-50%)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: width * 0.88,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: `${fontSize * 0.1}px ${fontSize * 0.08}px`,
            padding: `${fontSize * 0.32}px ${fontSize * 0.45}px`,
            background: "rgba(18, 18, 18, 0.82)",
            borderRadius: fontSize * 0.55,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 700,
            fontSize,
            lineHeight: 1.15,
          }}
        >
          {page.tokens.map((t, i) => {
            const state =
              i < active ? "spoken" : i === active ? "active" : "upcoming";
            // small "pop" when the word starts (deterministic: based on the frame)
            const pop =
              state === "active"
                ? interpolate(nowMs - t.fromMs, [0, 120], [0.9, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })
                : 1;
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  padding: `0 ${fontSize * 0.2}px`,
                  borderRadius: fontSize * 0.3,
                  background: state === "active" ? ACTIVE_BG : "transparent",
                  color:
                    state === "active"
                      ? "#141414"
                      : state === "spoken"
                        ? "#ffffff"
                        : "rgba(255,255,255,0.45)",
                  transform: `scale(${pop})`,
                }}
              >
                {t.text.trim()}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
