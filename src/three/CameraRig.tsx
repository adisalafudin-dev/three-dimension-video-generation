import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import { cameraAt } from "../script/camera";
import type { CameraPoint } from "../script/camera";

// Chapter-local frame in, camera position out. Always looks at the origin. No useFrame.
export const CameraRig: React.FC<{ points: CameraPoint[] }> = ({ points }) => {
  const camera = useThree((state) => state.camera);
  const frame = useCurrentFrame();
  const [x, y, z] = cameraAt(points, frame);

  useLayoutEffect(() => {
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  }, [camera, x, y, z]);

  return null;
};
