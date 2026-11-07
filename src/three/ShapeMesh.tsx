import { useMemo } from "react";
import * as THREE from "three";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useGLTF } from "@react-three/drei";
import type { SceneData } from "../script/types";

const MODEL_TARGET_SIZE = 2.5; // every model is scaled so its largest side is this big

type Rotation = [number, number, number];

// No <Suspense> here on purpose: ThreeCanvas has its own boundary that holds the
// frame until the model has loaded. A local Suspense with fallback={null} would
// let Remotion capture an empty frame.
const Model: React.FC<{ path: string; rotation: Rotation }> = ({
  path,
  rotation,
}) => {
  const { scene } = useGLTF(staticFile(path));

  // Center the model at the origin and normalize its size
  const { object, scale, offset } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return {
      object: clone,
      scale: MODEL_TARGET_SIZE / maxDim,
      offset: center.multiplyScalar(-1),
    };
  }, [scene]);

  return (
    <group rotation={rotation} scale={scale}>
      <primitive object={object} position={offset} />
    </group>
  );
};

export const ShapeMesh: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Deterministic: rotation is a pure function of the frame number
  const t = frame / fps;

  if (scene.shape === "model" && scene.model) {
    // Models spin like a turntable (Y axis only), so they never end up upside down
    return (
      <Model path={scene.model} rotation={[0, t * scene.rotationSpeed, 0]} />
    );
  }

  const rotation: Rotation = [
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
