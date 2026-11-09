import { useMemo } from "react";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useGLTF } from "@react-three/drei";
import type { MotionAction, PoseAction, SceneData } from "../script/types";
import { motionAt } from "../script/motion";

const MODEL_TARGET_SIZE = 2.5;
type Rotation = [number, number, number];

const Model: React.FC<{ path: string; rotation: Rotation; animation?: string | number; frame: number; fps: number; speed: number; pose?: PoseAction; drive: boolean; opacity: number }> = ({ path, rotation, animation, frame, fps, speed, pose, drive, opacity }) => {
  const { scene, animations: clips } = useGLTF(staticFile(path));
  const { object, scale, offset } = useMemo(() => {
    const clone = cloneSkeleton(scene);
    clone.traverse((node) => { if ((node as THREE.Mesh).isMesh) { const mesh = node as THREE.Mesh; mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone(); } });
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3()); const center = box.getCenter(new THREE.Vector3());
    return { object: clone, scale: MODEL_TARGET_SIZE / (Math.max(size.x, size.y, size.z) || 1), offset: center.multiplyScalar(-1) };
  }, [scene]);
  const baseRotations = useMemo(() => {
    const rotations = new Map<string, THREE.Euler>();
    object.traverse((node) => rotations.set(node.uuid, node.rotation.clone()));
    return rotations;
  }, [object]);
  const mixer = useMemo(() => {
    if (animation === undefined) return null;
    const index = typeof animation === "number" ? animation : clips.findIndex((clip) => clip.name === animation);
    if (!clips[index]) return null;
    const m = new THREE.AnimationMixer(object); m.clipAction(clips[index]).play(); return m;
  }, [animation, clips, object]);
  if (mixer && animation !== undefined) {
    const index = typeof animation === "number" ? animation : clips.findIndex((clip) => clip.name === animation);
    const duration = clips[index]?.duration ?? 0;
    mixer.setTime(duration ? (((frame / fps * speed) % duration) + duration) % duration : 0);
  }
  object.traverse((node) => {
    if (!node.name) return;
    const base = baseRotations.get(node.uuid);
    if (!mixer && base) node.rotation.copy(base);
    if (/wheel|tire/i.test(node.name)) { if (drive) node.rotation.x += frame / fps * 8; return; }
    if (!pose) return;
    if (!/arm|leg|hand|foot|shoulder|hip|knee/i.test(node.name)) return;
    const swing = Math.sin(frame / fps * (pose.style === "float" ? 1.2 : 5) + node.name.length) * pose.amount;
    if (/arm|hand|shoulder/i.test(node.name)) node.rotation.z = swing * (pose.style === "wave" ? 0.9 : 0.45);
    if (/leg|foot|hip|knee/i.test(node.name)) node.rotation.x = swing * (pose.style === "run" ? 0.7 : 0.35);
  });
  object.traverse((node) => { if ((node as THREE.Mesh).isMesh) { const materials = (node as THREE.Mesh).material; for (const material of Array.isArray(materials) ? materials : [materials]) { material.transparent = opacity < 1; material.opacity = opacity; } } });
  return <group rotation={rotation} scale={scale}><primitive object={object} position={offset} /></group>;
};

export const ShapeMesh: React.FC<{ scene: SceneData; motionTracks?: MotionAction[]; poseTracks?: PoseAction[] }> = ({ scene, motionTracks, poseTracks }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const motion = motionAt(motionTracks ?? scene.motion, frame, fps);
  const pose = (poseTracks ?? scene.poses).find((p) => t >= p.start && t < p.end);
  const bodyPose: [number, number, number] = [
    motion.rotation[0] + (pose?.fallbackTumble ? Math.sin(t * 1.7) * pose.amount * 0.35 : 0),
    motion.rotation[1],
    motion.rotation[2] + (pose?.fallbackTumble ? Math.cos(t * 1.3) * pose.amount * 0.5 : 0),
  ];
  if (scene.shape === "model" && scene.model) return <group position={motion.position} rotation={bodyPose} scale={motion.scale}>
    <Model path={scene.model} rotation={scene.modelRotate && !motion.active ? [0, t * scene.rotationSpeed, 0] : [0, 0, 0]} animation={scene.animation} frame={frame} fps={fps} speed={scene.animationSpeed} pose={pose} drive={motion.preset === "drive"} opacity={motion.opacity} />
    {motion.flame > 0 ? <mesh position={[0, -1.8, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.22 * motion.flame, 0.9 * motion.flame, 12]} /><meshBasicMaterial color="#ff7918" /></mesh> : null}
  </group>;
  const rotation: Rotation = motion.active ? motion.rotation : [t * scene.rotationSpeed * 0.5, t * scene.rotationSpeed, 0];
  return <group position={motion.position} rotation={rotation} scale={motion.scale}><mesh>
    {scene.shape === "sphere" ? <sphereGeometry args={[1.4, 48, 48]} /> : scene.shape === "torus" ? <torusGeometry args={[1.2, 0.45, 32, 100]} /> : <boxGeometry args={[2, 2, 2]} />}
    <meshStandardMaterial color={scene.color} roughness={0.35} metalness={0.2} transparent opacity={motion.opacity} />
  </mesh></group>;
};
