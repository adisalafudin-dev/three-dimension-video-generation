import { AbsoluteFill, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import type { SceneData } from "../script/types";
import { CameraRig } from "../three/CameraRig";
import { ShapeMesh } from "../three/ShapeMesh";
import { Caption } from "../ui/Caption";

export const SceneView: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: scene.background }}>
      {scene.audio ? (
        <Audio src={staticFile(scene.audio)} volume={scene.audioVolume} />
      ) : null}
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: scene.camera, fov: 50, near: 0.1, far: 100 }}
      >
        <CameraRig
          from={scene.camera}
          to={scene.cameraTo}
          ease={scene.cameraEase}
        />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <ShapeMesh scene={scene} />
      </ThreeCanvas>
      <Caption text={scene.caption} />
    </AbsoluteFill>
  );
};
