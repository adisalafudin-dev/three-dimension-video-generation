import { useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneData } from "../script/types";

export const ShapeMesh: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Deterministic: rotation is a pure function of the frame number
  const t = frame / fps;
  const rotation: [number, number, number] = [
    t * scene.rotationSpeed * 0.5,
    t * scene.rotationSpeed,
    0,
  ];

  return (
    <mesh rotation={rotation}>
      {scene.shape === "sphere" ? (
        <sphereGeometry args={[1.4, 48, 48]} />
      ) : scene.shape === "torus" ? (
        <torusGeometry args={[1.2, 0.45, 32, 100]} />
      ) : (
        // 'box', and 'model' until .glb support lands in Phase 2
        <boxGeometry args={[2, 2, 2]} />
      )}
      <meshStandardMaterial
        color={scene.color}
        roughness={0.35}
        metalness={0.2}
      />
    </mesh>
  );
};
