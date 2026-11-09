import * as THREE from "three";
import type { ThemeName, TimeOfDay, Weather } from "../../script/types";

export type Environment = {
  sky: [string, string];
  ground: string;
  fog: { color: string; near: number; far: number };
  ambient: { color: string; intensity: number };
  key: { color: string; intensity: number; position: [number, number, number] };
  fill: { color: string; intensity: number; position: [number, number, number] };
  shadows: boolean;
  particles: { kind: "rain" | "snow" | "dust" | null; count: number; color: string; speed: number };
  groundRoughness: number;
};

type Palette = { sky: Record<TimeOfDay, [string, string]>; ground: string; key: string; fill: string };
const palettes: Record<ThemeName, Palette> = {
  space: { sky: { dawn: ["#090819", "#02030b"], day: ["#090819", "#02030b"], dusk: ["#090819", "#02030b"], night: ["#090819", "#02030b"] }, ground: "#11121d", key: "#b7a0ff", fill: "#4f75b5" },
  farm: { sky: { dawn: ["#efaa8c", "#9acbe4"], day: ["#8bd6ff", "#d6f5ff"], dusk: ["#dc8068", "#f4c28a"], night: ["#172544", "#34476a"] }, ground: "#4e8b34", key: "#ffe0a0", fill: "#a2c9e8" },
  city: { sky: { dawn: ["#8a718e", "#f5b68a"], day: ["#5498c7", "#d3e9ec"], dusk: ["#362c56", "#e78365"], night: ["#10182b", "#25354c"] }, ground: "#30343b", key: "#ffe0bd", fill: "#7899bb" },
  ocean: { sky: { dawn: ["#526e94", "#f2b68a"], day: ["#2585bd", "#b9e5e9"], dusk: ["#263b66", "#e98f73"], night: ["#07152e", "#1c3f5d"] }, ground: "#15536f", key: "#ffe0bc", fill: "#73c4dd" },
  forest: { sky: { dawn: ["#879b9b", "#f0bf8b"], day: ["#5693a0", "#c6e4c4"], dusk: ["#394e61", "#d08e72"], night: ["#101d2a", "#1d352d"] }, ground: "#345b38", key: "#f5e5c1", fill: "#91b7a0" },
  desert: { sky: { dawn: ["#8d7b9a", "#f5b879"], day: ["#4f9abf", "#f3d9a2"], dusk: ["#59456a", "#f28d59"], night: ["#17192e", "#3d3652"] }, ground: "#b9824a", key: "#ffe0a1", fill: "#d0b891" },
  indoor: { sky: { dawn: ["#675f64", "#ddac82"], day: ["#839eb3", "#d9e6e8"], dusk: ["#594d63", "#d88c6b"], night: ["#20243a", "#34384a"] }, ground: "#564d44", key: "#ffd39a", fill: "#a5b4c7" },
  lab: { sky: { dawn: ["#365574", "#d5e8f4"], day: ["#3f6e91", "#e7f5ff"], dusk: ["#33465e", "#d1b8aa"], night: ["#18283e", "#b2cadc"] }, ground: "#d9e4ec", key: "#e9f6ff", fill: "#95c7ed" },
  highway: { sky: { dawn: ["#736d88", "#edaf82"], day: ["#5596bd", "#d8e9e8"], dusk: ["#342b51", "#e77d5e"], night: ["#11182a", "#243044"] }, ground: "#303238", key: "#ffe1c0", fill: "#8199ad" },
};

const timeIntensity: Record<TimeOfDay, { ambient: number; key: number; position: [number, number, number] }> = {
  dawn: { ambient: 0.9, key: 1.25, position: [-8, 5, -3] },
  day: { ambient: 1.05, key: 1.55, position: [6, 10, 5] },
  dusk: { ambient: 0.82, key: 1.2, position: [8, 4, -4] },
  night: { ambient: 0.48, key: 0.72, position: [-4, 5, 2] },
};

export const environmentFor = (theme: ThemeName, time: TimeOfDay, weather: Weather, detail: "low" | "high" = "low"): Environment => {
  const fixed = theme === "space" || theme === "lab" || theme === "indoor";
  const tod = fixed ? "day" : time;
  const activeWeather: Weather = fixed ? "clear" : weather;
  const sky = palettes[theme].sky[tod];
  const wet = activeWeather === "rain";
  // Weather should tint the scene without crushing its midtones. Rain and fog
  // stay atmospheric while keeping the subject, ground, and set pieces legible.
  const dim = activeWeather === "rain" ? 0.92 : activeWeather === "fog" ? 0.88 : activeWeather === "snow" ? 0.96 : activeWeather === "dust" ? 0.92 : 1;
  const particleKind = fixed ? null : activeWeather === "clear" || activeWeather === "fog" ? null : activeWeather;
  const legacyThemeDefault = theme === "space" || (theme === "farm" && time === "day" && weather === "clear");
  const count = detail === "high" ? 260 : 96;
  const fogColor = new THREE.Color(sky[1]).lerp(new THREE.Color(palettes[theme].ground), activeWeather === "fog" ? 0.22 : 0.08).getStyle();
  return {
    sky,
    ground: palettes[theme].ground,
    fog: { color: fogColor, near: activeWeather === "fog" ? 20 : 42, far: activeWeather === "fog" ? 105 : 180 },
    ambient: { color: legacyThemeDefault ? "#ffffff" : theme === "lab" ? "#dcecff" : sky[1], intensity: legacyThemeDefault ? 0.6 : (theme === "lab" ? 0.82 : theme === "indoor" ? 0.58 : timeIntensity[tod].ambient) * dim },
    key: { color: legacyThemeDefault ? "#ffffff" : tod === "night" ? "#b2c9f2" : tod === "dawn" || tod === "dusk" ? "#ffc58a" : palettes[theme].key, intensity: legacyThemeDefault ? 1.5 : (theme === "lab" ? 1.05 : theme === "indoor" ? 0.95 : timeIntensity[tod].key) * dim, position: legacyThemeDefault ? [5, 5, 5] : timeIntensity[tod].position },
    fill: { color: palettes[theme].fill, intensity: legacyThemeDefault || theme === "lab" ? 0 : theme === "indoor" ? 0.35 : 0.52, position: [-5, 4, -4] },
    shadows: !legacyThemeDefault && theme !== "lab",
    particles: { kind: particleKind, count, color: activeWeather === "snow" ? "#e8f5ff" : activeWeather === "dust" ? "#d9b17b" : "#b7d8e8", speed: activeWeather === "rain" ? 8 : activeWeather === "snow" ? 1.8 : 0.8 },
    groundRoughness: wet ? 0.2 : activeWeather === "fog" ? 0.92 : activeWeather === "snow" ? 0.88 : activeWeather === "dust" ? 0.9 : 1,
  };
};
