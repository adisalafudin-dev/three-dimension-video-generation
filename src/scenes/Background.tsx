import { AbsoluteFill, Img, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneData } from "../script/types";

export const Background: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const bg = scene.background;
  if (scene.theme === "space") return <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #24134b 0%, #090819 48%, #02030b 100%)" }}>
    {Array.from({ length: scene.themeDetail === "high" ? 220 : 90 }, (_, i) => {
      const x = random(i * 3 + 17) * 100, y = random(i * 5 + 29) * 100;
      const size = 1 + random(i * 7 + 41) * (scene.themeDetail === "high" ? 2.5 : 1.5);
      const opacity = 0.35 + random(i * 13 + Math.floor(frame / 8)) * 0.65;
      return <i key={i} style={{ position: "absolute", left: `${(x + frame * (0.001 + (i % 4) * 0.0004)) % 100}%`, top: `${y}%`, width: size, height: size, borderRadius: "50%", background: "white", opacity, boxShadow: "0 0 8px #b8c9ff" }} />;
    })}
  </AbsoluteFill>;
  if (scene.theme === "farm") return <AbsoluteFill style={{ overflow: "hidden", background: "linear-gradient(#8bd6ff 0%, #d6f5ff 54%, #84c944 54%, #39752a 100%)" }}>
    <div style={{ position: "absolute", width: "18%", aspectRatio: "1", borderRadius: "50%", background: "#ffe58a", top: "9%", right: "14%", boxShadow: "0 0 70px #fff3b0" }} />
    {[0, 1, 2].map((i) => <div key={i} style={{ position: "absolute", left: `${(i * 39 + frame * (0.004 + i * 0.001)) % 120 - 10}%`, top: `${12 + i * 10}%`, width: `${15 + i * 3}%`, height: `${3 + i * 0.4}%`, borderRadius: 999, background: "rgba(255,255,255,.7)", filter: "blur(5px)" }} />)}
    <div style={{ position: "absolute", inset: "48% -10% -12%", borderRadius: "50% 50% 0 0", background: "linear-gradient(#6fb54a,#244c27)" }} />
    <div style={{ position: "absolute", inset: "62% -10% -12%", background: "repeating-linear-gradient(170deg, transparent 0 26px, rgba(33,76,27,.55) 28px 34px)" }} />
  </AbsoluteFill>;
  if (bg.startsWith("image(")) return <Img src={staticFile(bg.slice(6, -1))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  const gradient = bg.match(/^gradient\((#[0-9a-fA-F]+),\s*(#[0-9a-fA-F]+),\s*([\d.]+)deg\)$/);
  if (gradient) return <AbsoluteFill style={{ background: `linear-gradient(${gradient[3]}deg, ${gradient[1]}, ${gradient[2]})` }} />;
  return <AbsoluteFill style={{ background: bg || "#000000", width, height }} />;
};
