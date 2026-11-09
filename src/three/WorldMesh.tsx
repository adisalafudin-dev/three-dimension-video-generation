import { useCurrentFrame, useVideoConfig } from "remotion";
import { highlightAt, trackValue } from "../script/actions";
import type { ActionTracks } from "../script/actions";
import type { SceneData } from "../script/types";
import { LayersKit } from "./kits/LayersKit";
import { RoadKit } from "./kits/RoadKit";
import { ShapeMesh } from "./ShapeMesh";
import { ThemeProps } from "./ThemeProps";
import type { MotionAction, PoseAction } from "../script/types";
import { EnvironmentWorld } from "./environment/EnvironmentWorld";

const CAR_START_X = -5;

// The chapter's 3D world: a procedural kit, or the single shape of the first scene
export const WorldMesh: React.FC<{
  scene: SceneData;
  tracks: ActionTracks;
  motionTracks?: MotionAction[];
  poseTracks?: PoseAction[];
}> = ({ scene, tracks, motionTracks, poseTracks }) => {
  const frame = useCurrentFrame(); // chapter-local
  const { fps } = useVideoConfig();
  const parts = scene.kitParts ?? [];

  if (scene.kit === "layers") {
      return (
      <>
      <LayersKit
        layers={parts.flatMap((p) => (p.type === "layer" ? [p] : []))}
        explode={trackValue(tracks.explode, 0, frame)}
        highlight={highlightAt(tracks.highlights, frame, fps)}
      />
      <ThemeProps scene={scene} />
      <EnvironmentWorld scene={scene} />
      </>
    );
  }

  if (scene.kit === "road") {
    const rainPart = parts.find((p) => p.type === "rain");
    const carPart = parts.find((p) => p.type === "car");
      return (
      <>
      <RoadKit
        rain={trackValue(
          tracks.rain,
          rainPart && rainPart.type === "rain" ? rainPart.intensity : scene.theme === "highway" && scene.weather === "rain" ? 0.55 : 0,
          frame,
        )}
        car={
          carPart && carPart.type === "car"
            ? {
                color: carPart.color,
                x: trackValue(tracks.drive, CAR_START_X, frame),
              }
            : undefined
        }
      />
      <ThemeProps scene={scene} />
      <EnvironmentWorld scene={scene} />
      </>
    );
  }

  return <><ShapeMesh scene={scene} motionTracks={motionTracks} poseTracks={poseTracks} /><ThemeProps scene={scene} /><EnvironmentWorld scene={scene} /></>;
};
