import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneData } from "../../script/types";
import { environmentFor } from "./environmentFor";

const WeatherParticles: React.FC<{ kind: "rain" | "snow" | "dust"; count: number; color: string; speed: number }> = ({ kind, count, color, speed }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const mesh = useMemo(() => {
    const geometry = kind === "rain" ? new THREE.BoxGeometry(0.018, 0.34, 0.018) : kind === "snow" ? new THREE.IcosahedronGeometry(0.045, 0) : new THREE.SphereGeometry(0.025, 5, 4);
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: kind === "rain" ? 0.48 : 0.68 });
    return new THREE.InstancedMesh(geometry, material, count);
  }, [color, count, kind]);
  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4(); const pos = new THREE.Vector3();
    const rot = new THREE.Quaternion(); const scale = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < count; i++) {
      const seedX = random(i * 17 + 101), seedY = random(i * 23 + 211), seedZ = random(i * 31 + 307);
      const cycle = (frame / fps * speed + seedY * 22) % 22;
      let x = (seedX - 0.5) * 26 + (kind === "rain" ? -cycle * 0.15 : cycle * 0.025);
      const y = 12 - cycle;
      const z = (seedZ - 0.5) * 32 - 2;
      if (Math.abs(x) < 2.2 && y > -1 && y < 4) x = x < 0 ? -2.4 : 2.4;
      pos.set(x, y, z);
      if (kind === "rain") rot.setFromEuler(new THREE.Euler(0, 0, -0.16));
      else rot.identity();
      const size = kind === "snow" ? 0.7 + seedZ * 0.7 : kind === "dust" ? 0.65 + seedZ : 1;
      scale.set(size, kind === "rain" ? 1 : size, size);
      matrix.compose(pos, rot, scale);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, fps, frame, kind, mesh, speed]);
  return <primitive object={mesh} />;
};

export const EnvironmentRig: React.FC<{ scene: SceneData; reuseRoadRain?: boolean }> = ({ scene, reuseRoadRain }) => {
  const env = environmentFor(scene.theme ?? "lab", scene.time, scene.weather, scene.themeDetail);
  return <>
    <fog attach="fog" args={[env.fog.color, env.fog.near, env.fog.far]} />
    <ambientLight color={env.ambient.color} intensity={env.ambient.intensity} />
    <directionalLight color={env.key.color} intensity={env.key.intensity} position={env.key.position} castShadow={env.shadows} />
    <directionalLight color={env.fill.color} intensity={env.fill.intensity} position={env.fill.position} />
    {env.particles.kind && !(reuseRoadRain && env.particles.kind === "rain") ? <WeatherParticles {...env.particles} kind={env.particles.kind} /> : null}
  </>;
};
