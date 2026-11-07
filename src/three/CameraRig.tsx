import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { CameraEase, Vec3 } from "../script/types";

const EASINGS: Record<CameraEase, (t: number) => number> = {
  linear: Easing.linear,
  "ease-in": Easing.in(Easing.cubic),
  "ease-out": Easing.out(Easing.cubic),
  "ease-in-out": Easing.inOut(Easing.cubic),
};

export const CameraRig: React.FC<{
  from: Vec3;
  to?: Vec3;
  ease: CameraEase;
}> = ({ from, to, ease }) => {
  const camera = useThree((state) => state.camera);
  const frame = useCurrentFrame(); // local to the scene's <Sequence>
  const { durationInFrames } = useVideoConfig(); // the scene's own length

  // 0 -> 1 across the scene, a pure function of the frame (no useFrame)
  const progress = to
    ? interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
        easing: EASINGS[ease],
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const target = to ?? from;
  const x = from[0] + (target[0] - from[0]) * progress;
  const y = from[1] + (target[1] - from[1]) * progress;
  const z = from[2] + (target[2] - from[2]) * progress;

  useLayoutEffect(() => {
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0); // always look at the origin
    camera.updateMatrixWorld();
  }, [camera, x, y, z]);

  return null;
};
