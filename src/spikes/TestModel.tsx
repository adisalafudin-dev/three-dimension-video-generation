import { Suspense, useMemo } from "react";
import {
  AbsoluteFill,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const Duck: React.FC<{ rotationY: number }> = ({ rotationY }) => {
  const { scene } = useGLTF(staticFile("models/duck.glb"));

  // Normalize any model to ~2.5 units and center it at the origin
  const { object, scale, offset } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return {
      object: clone,
      scale: 2.5 / maxDim,
      offset: center.multiplyScalar(-1),
    };
  }, [scene]);

  return (
    <group rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={object} position={offset} />
    </group>
  );
};

export const TestModel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ background: "#0b1020" }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 1, 5], fov: 50, near: 0.1, far: 100 }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <Suspense fallback={null}>
          <Duck rotationY={t * 1.2} />
        </Suspense>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
