import * as THREE from "three";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneData } from "../script/types";
import { environmentFor } from "./environment/environmentFor";

const Planet: React.FC<{ color: string; radius: number; pos: [number, number, number]; ring: boolean }> = ({ color, radius, pos, ring }) => <group position={pos}>
  <mesh><sphereGeometry args={[radius, 48, 32]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
  {ring ? <mesh rotation={[Math.PI / 2.3, 0.1, 0]}><torusGeometry args={[radius * 1.5, radius * 0.08, 8, 96]} /><meshStandardMaterial color="#cbb78a" roughness={0.6} /></mesh> : null}
</group>;

const Blackhole: React.FC<{ radius: number; pos: [number, number, number] }> = ({ radius, pos }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  return <group position={pos}>
    <mesh><sphereGeometry args={[radius * 0.72, 48, 32]} /><meshBasicMaterial color="#020106" /></mesh>
    <mesh rotation={[0.25, frame / fps * 0.28, 0]}><torusGeometry args={[radius, radius * 0.2, 12, 96]} /><meshStandardMaterial color="#ff7a22" emissive="#ff3b08" emissiveIntensity={2.4} /></mesh>
    <mesh><sphereGeometry args={[radius * 1.24, 32, 24]} /><meshBasicMaterial color="#6536ff" transparent opacity={0.08} side={THREE.BackSide} /></mesh>
  </group>;
};

const Farm: React.FC<{ detail: "low" | "high"; roughness: number }> = ({ detail, roughness }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const count = detail === "high" ? 90 : 42;
  const crops = useMemo(() => {
    const mesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.55, 1, 5), new THREE.MeshStandardMaterial({ color: "#659a3d" }), count);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 14), col = i % 14;
      const x = (col - 6.5) * 0.55 + Math.sin(frame / fps * 2.4 + i * 0.7) * 0.05;
      matrix.compose(new THREE.Vector3(x, 0.45, -row * 0.9 - 1), new THREE.Quaternion(), new THREE.Vector3(0.2, 0.55, 0.2));
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [count, frame, fps]);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -3]}><planeGeometry args={[24, 20]} /><meshStandardMaterial color="#4e8b34" roughness={roughness} metalness={roughness < 0.5 ? 0.22 : 0} /></mesh>
    <primitive object={crops} />
    <group position={[3.6, 0, -4]}><mesh position={[0, 1.1, 0]}><boxGeometry args={[2.6, 2, 2]} /><meshStandardMaterial color="#a83f2b" /></mesh><mesh position={[0, 2.35, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[1.95, 1.1, 4]} /><meshStandardMaterial color="#642820" /></mesh></group>
    {[-5, 5].map(x => <group key={x} position={[x, 0, -3]}><mesh position={[0, 2, 0]}><sphereGeometry args={[0.9, 12, 8]} /><meshStandardMaterial color="#3d7d37" /></mesh><mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.12, 0.2, 1.4, 8]} /><meshStandardMaterial color="#6b4528" /></mesh></group>)}
    <mesh position={[0, 0.4, 2]}><boxGeometry args={[14, 0.08, 0.08]} /><meshStandardMaterial color="#dfd0a0" /></mesh>
    {Array.from({ length: 15 }, (_, i) => <mesh key={i} position={[(i - 7) * 0.95, 0.2, 2]}><boxGeometry args={[0.07, 0.4, 0.07]} /><meshStandardMaterial color="#dfd0a0" /></mesh>)}
  </group>;
};

export const ThemeProps: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const env = environmentFor(scene.theme ?? "lab", scene.time, scene.weather, scene.themeDetail);
  return <>
  {scene.theme === "farm" ? <Farm detail={scene.themeDetail} roughness={env.groundRoughness} /> : null}
  {scene.props.map((prop, i) => prop.type === "planet" ? <Planet key={i} {...prop} /> : <Blackhole key={i} {...prop} />)}
</>;
};
