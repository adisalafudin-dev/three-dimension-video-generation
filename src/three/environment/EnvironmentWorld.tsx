import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneData } from "../../script/types";
import { environmentFor } from "./environmentFor";

const City: React.FC<{ night: boolean; lamps: boolean; wet: boolean; detail: "low" | "high" }> = ({ night, lamps, wet, detail }) => {
  const count = detail === "high" ? 15 : 9;
  const buildings = useMemo(() => {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: "#394657", roughness: 0.9 }), count);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1, row = Math.floor(i / 2);
      const x = side * (5.5 + random(i + 16) * 4), z = -4 - row * 5;
      const h = 4 + random(i * 11 + 51) * 7;
      matrix.compose(new THREE.Vector3(x, h / 2 - 2, z), new THREE.Quaternion(), new THREE.Vector3(2.6 + random(i * 19 + 63), h, 3));
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true; return mesh;
  }, [count]);
  const windows = useMemo(() => {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.17, 0.24, 0.035), new THREE.MeshStandardMaterial({ color: "#ffdb87", emissive: night ? "#ffb545" : "#000000", emissiveIntensity: night ? 1.5 : 0 }), count * 12);
    const matrix = new THREE.Matrix4(); let index = 0;
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1, row = Math.floor(i / 2), x = side * (5.5 + random(i + 16) * 4), z = -4 - row * 5;
      const h = 4 + random(i * 11 + 51) * 7, w = 2.6 + random(i * 19 + 63);
      for (let y = 0; y < 3; y++) for (let c = 0; c < 4; c++) {
        const faceX = x - side * w / 2;
        matrix.compose(new THREE.Vector3(faceX + side * 0.025, -2 + (y + 0.6) * h / 4, z - 1 + c * 0.48), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
        mesh.setMatrixAt(index++, matrix);
      }
    }
    mesh.count = index; mesh.instanceMatrix.needsUpdate = true; return mesh;
  }, [count, night]);
  return <group>
    <primitive object={buildings} /><primitive object={windows} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, -20]}><planeGeometry args={[9, 70]} /><meshStandardMaterial color="#282a30" roughness={wet ? 0.2 : 0.84} metalness={wet ? 0.22 : 0.03} /></mesh>
    {[-1.4, 1.4].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, -2.06, -20]}><planeGeometry args={[0.09, 70]} /><meshBasicMaterial color="#e9c76b" /></mesh>)}
    {(lamps ? [-7, 7] : []).map((x) => <group key={x} position={[x, -2, -6]}><mesh position={[0, 2.4, 0]}><cylinderGeometry args={[0.045, 0.06, 4.8, 7]} /><meshStandardMaterial color="#39424a" /></mesh><mesh position={[0.28, 4.72, 0]}><sphereGeometry args={[0.2, 10, 8]} /><meshBasicMaterial color="#ffc768" /></mesh><pointLight position={[0.28, 4.7, 0]} color="#ffbd70" intensity={18} distance={10} /></group>)}
  </group>;
};

const Ocean: React.FC<{ detail: "low" | "high"; roughness: number }> = ({ detail, roughness }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const geometry = useMemo(() => new THREE.PlaneGeometry(120, 100, detail === "high" ? 48 : 28, detail === "high" ? 48 : 28), [detail]);
  useLayoutEffect(() => {
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < attr.count; i++) {
      const x = attr.getX(i), y = attr.getY(i);
      attr.setZ(i, Math.sin(x * 0.16 + frame / fps * 1.2) * 0.11 + Math.cos(y * 0.21 + frame / fps * 0.8) * 0.08);
    }
    attr.needsUpdate = true; geometry.computeVertexNormals();
  }, [fps, frame, geometry]);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.8, -24]} geometry={geometry}><meshStandardMaterial color="#167ca0" roughness={roughness} metalness={0.17} /></mesh>
    <mesh position={[0, -3.1, -67]}><boxGeometry args={[150, 0.25, 0.25]} /><meshBasicMaterial color="#c4e6e5" transparent opacity={0.35} /></mesh>
  </group>;
};

const Forest: React.FC<{ detail: "low" | "high"; shafts: boolean }> = ({ detail, shafts }) => {
  const count = detail === "high" ? 58 : 30;
  const trees = useMemo(() => {
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.16, 1.5, 6), new THREE.MeshStandardMaterial({ color: "#62432d" }), count);
    const canopy = new THREE.InstancedMesh(new THREE.ConeGeometry(1.05, 3.3, 7), new THREE.MeshStandardMaterial({ color: "#2d6844", roughness: 0.9 }), count);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1, x = side * (3.5 + random(i * 7 + 44) * 5), z = -3 - Math.floor(i / 2) * 1.7;
      const scale = 0.75 + random(i * 13 + 61) * 0.7;
      matrix.compose(new THREE.Vector3(x, 0.1, z), new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale)); trunk.setMatrixAt(i, matrix);
      matrix.compose(new THREE.Vector3(x, 2.25 * scale, z), new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale)); canopy.setMatrixAt(i, matrix);
    }
    trunk.instanceMatrix.needsUpdate = true; canopy.instanceMatrix.needsUpdate = true; return [trunk, canopy];
  }, [count]);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, -12]}><planeGeometry args={[70, 90]} /><meshStandardMaterial color="#345b38" roughness={0.95} /></mesh>
    {trees.map((tree, i) => <primitive key={i} object={tree} />)}
    {shafts ? [-5, 0, 5].map((x) => <mesh key={x} position={[x, 4, -7]} rotation={[0, 0, x * 0.025]}><planeGeometry args={[1.2, 12]} /><meshBasicMaterial color="#fff0be" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>) : null}
  </group>;
};

const Desert: React.FC = () => <group>
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, -18]}><planeGeometry args={[100, 100]} /><meshStandardMaterial color="#c38b55" roughness={0.95} /></mesh>
  {[-1, 1].map((side) => <group key={side}>{[0, 1, 2].map((i) => <mesh key={i} position={[side * (4.5 + i * 2.3), -1.8 + i * 0.25, -9 - i * 13]} scale={[7, 1.4 + i * 0.25, 6]}><sphereGeometry args={[1, 18, 12]} /><meshStandardMaterial color={i % 2 ? "#bd8150" : "#d09a64"} roughness={0.98} /></mesh>)}</group>)}
  <mesh position={[0, 8, -38]}><sphereGeometry args={[1.2, 16, 12]} /><meshBasicMaterial color="#ffd38b" /></mesh>
</group>;

const Indoor: React.FC<{ time: SceneData["time"]; sky: string }> = ({ time, sky }) => <group>
  <mesh position={[0, 4, -9]}><boxGeometry args={[22, 16, 0.5]} /><meshStandardMaterial color="#8b796b" roughness={0.9} /></mesh>
  <mesh position={[0, -3.5, -1]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[22, 24]} /><meshStandardMaterial color="#51483f" roughness={0.78} /></mesh>
  <mesh position={[-5, 2.7, -8.65]}><planeGeometry args={[4.5, 4]} /><meshBasicMaterial color={sky} /></mesh>
  <mesh position={[-5, 2.7, -8.6]}><boxGeometry args={[4.9, 0.14, 0.18]} /><meshStandardMaterial color="#c5b9a4" /></mesh>
  <mesh position={[-5, 2.7, -8.6]}><boxGeometry args={[0.14, 4.3, 0.18]} /><meshStandardMaterial color="#c5b9a4" /></mesh>
  <pointLight position={[4, 5, 0]} color={time === "night" ? "#ffbf72" : "#ffe1b6"} intensity={32} distance={22} />
</group>;

const Lab: React.FC = () => <group>
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.3, -5]}><planeGeometry args={[28, 50]} /><meshStandardMaterial color="#e2ebf2" roughness={0.45} metalness={0.08} /></mesh>
  <mesh position={[-7, 1, -9]}><boxGeometry args={[0.3, 8, 26]} /><meshStandardMaterial color="#b7d7eb" emissive="#1c4d70" emissiveIntensity={0.12} /></mesh>
  <mesh position={[7, 1, -9]}><boxGeometry args={[0.3, 8, 26]} /><meshStandardMaterial color="#b7d7eb" emissive="#1c4d70" emissiveIntensity={0.12} /></mesh>
  <mesh position={[0, -1.6, -7]}><boxGeometry args={[5.5, 0.25, 3.2]} /><meshStandardMaterial color="#f4f8fc" metalness={0.24} roughness={0.28} /></mesh>
</group>;

const Highway: React.FC<{ wet: boolean; hasRoadKit: boolean }> = ({ wet, hasRoadKit }) => <group>
  {!hasRoadKit ? <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.05, -22]}><planeGeometry args={[8, 80]} /><meshStandardMaterial color="#303238" roughness={wet ? 0.18 : 0.85} metalness={wet ? 0.25 : 0.02} /></mesh>
    {[-3.8, 3.8].map((x) => <mesh key={x} position={[x, -1.45, -22]}><boxGeometry args={[0.18, 0.95, 80]} /><meshStandardMaterial color="#b8bec2" roughness={0.6} /></mesh>)}
    {[-0.12, 0.12].map((x) => <group key={x}>{Array.from({ length: 20 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -2.01, -i * 4]}><planeGeometry args={[0.055, 1.8]} /><meshBasicMaterial color="#f5e8ba" /></mesh>)}</group>)}
  </> : null}
  {[-7, 7].map((x) => <mesh key={x} position={[x, 1.2, -17]}><boxGeometry args={[0.4, 0.18, 70]} /><meshStandardMaterial color="#9daab2" metalness={0.35} roughness={0.52} /></mesh>)}
</group>;

export const EnvironmentWorld: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const env = environmentFor(scene.theme ?? "lab", scene.time, scene.weather, scene.themeDetail);
  if (scene.theme === "city") return <City night={scene.time === "night"} lamps={scene.time === "night" || scene.time === "dusk"} wet={scene.weather === "rain"} detail={scene.themeDetail} />;
  if (scene.theme === "ocean") return <Ocean detail={scene.themeDetail} roughness={env.groundRoughness} />;
  if (scene.theme === "forest") return <Forest detail={scene.themeDetail} shafts={scene.time === "dawn" || scene.time === "dusk"} />;
  if (scene.theme === "desert") return <Desert />;
  if (scene.theme === "indoor") return <Indoor time="day" sky={env.sky[0]} />;
  if (scene.theme === "lab") return <Lab />;
  if (scene.theme === "highway") return scene.kit === "road" ? null : <Highway wet={scene.weather === "rain"} hasRoadKit={false} />;
  return null;
};
