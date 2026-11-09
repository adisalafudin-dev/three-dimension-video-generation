import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import { buildCameraPoints } from "../script/camera";
import type { CameraPoint } from "../script/camera";
import type { Chapter } from "../script/chapters";
import { sceneFrames } from "../script/timing";
import type { SceneData } from "../script/types";
import { CameraRig } from "../three/CameraRig";

import { BeatLayer } from "../ui/beats/BeatLayer";
import { Caption } from "../ui/Caption";
import { KaraokeCaption } from "../ui/KaraokeCaption";
import { WorldMesh } from "../three/WorldMesh"; // gantikan import ShapeMesh
// import { ShapeMesh } from "../three/ShapeMesh";
import { buildActionTracks } from "../script/actions";
import { Background } from "./Background";
import type { MotionAction } from "../script/types";
import { EnvironmentRig } from "../three/environment/EnvironmentRig";
import { environmentFor } from "../three/environment/environmentFor";

// Audio, beats and caption of one scene. Runs inside the scene's own <Sequence>,
// so useCurrentFrame() is local to the scene.
const SceneOverlay: React.FC<{
  scene: SceneData;
  cam: { points: CameraPoint[]; offset: number; motion?: MotionAction[] };
}> = ({ scene, cam }) => (
  <AbsoluteFill>
    {scene.audio ? (
      <Audio src={staticFile(scene.audio)} volume={scene.audioVolume} />
    ) : null}
    {scene.beats && scene.beats.length > 0 ? (
      <BeatLayer beats={scene.beats} cam={cam} />
    ) : null}
    {scene.words && scene.words.length > 0 ? (
      <KaraokeCaption words={scene.words} />
    ) : (
      <Caption text={scene.caption} />
    )}
  </AbsoluteFill>
);

// One 3D world (one ThreeCanvas) for every scene of the chapter. The world comes from the
// first scene; the camera path runs across all scenes. A scene without `chapter` is a chapter of one.
export const ChapterView: React.FC<{ chapter: Chapter }> = ({ chapter }) => {
  const { width, height, fps } = useVideoConfig();
  const world = chapter.scenes[0];
  const points = useMemo(() => buildCameraPoints(chapter, fps), [chapter, fps]);
  const tracks = useMemo(() => buildActionTracks(chapter, fps), [chapter, fps]);
  const motionTracks = useMemo(() => chapter.scenes.flatMap((scene, j) => scene.motion.map((m) => ({ ...m, start: chapter.offsets[j] / fps + m.start, end: chapter.offsets[j] / fps + m.end }))), [chapter, fps]);
  const poseTracks = useMemo(() => chapter.scenes.flatMap((scene, j) => scene.poses.map((p) => ({ ...p, start: chapter.offsets[j] / fps + p.start, end: chapter.offsets[j] / fps + p.end }))), [chapter, fps]);
  const environment = world.theme ? environmentFor(world.theme, world.time, world.weather, world.themeDetail) : null;

  return (
    <AbsoluteFill>
      <Background scene={world} />
      <ThreeCanvas
        width={width}
        height={height}
        shadows={environment?.shadows ?? false}
        camera={{ position: world.camera, fov: 50, near: 0.1, far: 100 }}
      >
        <CameraRig points={points} />
        {environment ? <EnvironmentRig scene={world} reuseRoadRain={world.theme === "highway" && world.kit === "road"} /> : <><ambientLight intensity={0.6} /><directionalLight position={[5, 5, 5]} intensity={1.5} /></>}
        {/* <ShapeMesh scene={world} /> */}
        <WorldMesh scene={world} tracks={tracks} motionTracks={motionTracks} poseTracks={poseTracks} />
      </ThreeCanvas>
      {chapter.scenes.map((scene, j) => (
        <Sequence
          key={j}
          from={chapter.offsets[j]}
          durationInFrames={sceneFrames(scene.duration, fps)}
          name={scene.title}
          layout="none"
        >
          <SceneOverlay
            scene={scene}
            cam={{ points, offset: chapter.offsets[j], motion: scene.motion }}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
