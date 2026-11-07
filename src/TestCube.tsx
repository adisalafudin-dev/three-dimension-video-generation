import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";

export const TestCube: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Deterministic: rotation is a pure function of the frame number
  const t = frame / fps; // seconds

  return (
    <AbsoluteFill
      style={{
        background: "#0b1020"
      }}
    >
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 1, 5], fov: 50, near: 0.1, far: 100 }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <mesh rotation={[t * 0.6, t * 1.2, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial
            color="#ff6b6b"
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
