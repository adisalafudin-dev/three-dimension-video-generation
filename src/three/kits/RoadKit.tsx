import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { random, useCurrentFrame, useVideoConfig } from "remotion";

const ROAD_LENGTH = 16;
const RAIN_DROPS = 400;
const RAIN_HEIGHT = 6;
const WHEEL_R = 0.22;

// Rain: seeded random positions + a fall that is a pure function of time (same video every render)
const RainField: React.FC<{ intensity: number }> = ({ intensity }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const drops = useMemo(
    () =>
      Array.from({ length: RAIN_DROPS }, (_, i) => ({
        x: (random(`rain-x-${i}`) - 0.5) * 14,
        z: (random(`rain-z-${i}`) - 0.5) * 8,
        speed: 7 + random(`rain-s-${i}`) * 4,
        phase: random(`rain-p-${i}`) * RAIN_HEIGHT,
      })),
    [],
  );
  const count = Math.round(RAIN_DROPS * Math.max(0, Math.min(1, intensity)));

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const d = drops[i];
      dummy.position.set(
        d.x,
        RAIN_HEIGHT - ((d.phase + t * d.speed) % RAIN_HEIGHT),
        d.z,
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, drops, t]);

  if (count === 0) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, RAIN_DROPS]}>
      <boxGeometry args={[0.012, 0.35, 0.012]} />
      <meshBasicMaterial color="#aee1ff" transparent opacity={0.7} />
    </instancedMesh>
  );
};

const Wheel: React.FC<{ x: number; z: number; carX: number }> = ({
  x,
  z,
  carX,
}) => (
  // spins with the distance driven (pure function of the car position)
  <group position={[x, WHEEL_R, z]} rotation={[0, 0, -carX / WHEEL_R]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.16, 20]} />
      <meshStandardMaterial color="#1b1b1f" roughness={0.8} />
    </mesh>
    <mesh>
      <boxGeometry args={[0.34, 0.06, 0.18]} />
      <meshStandardMaterial color="#adb5bd" />
    </mesh>
  </group>
);

const Car: React.FC<{ color: string; x: number }> = ({ color, x }) => (
  <group position={[x, 0, -0.8]}>
    <mesh position={[0, 0.42, 0]}>
      <boxGeometry args={[1.7, 0.4, 0.8]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.3} />
    </mesh>
    <mesh position={[-0.1, 0.78, 0]}>
      <boxGeometry args={[0.9, 0.34, 0.7]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.3} />
    </mesh>
    <mesh position={[-0.1, 0.78, 0]}>
      <boxGeometry args={[0.92, 0.2, 0.72]} />
      <meshStandardMaterial color="#9bd1ff" roughness={0.1} metalness={0.6} />
    </mesh>
    {[0.58, -0.58].map((wx) =>
      [0.42, -0.42].map((wz) => (
        <Wheel key={`${wx}${wz}`} x={wx} z={wz} carX={x} />
      )),
    )}
    {[0.3, -0.3].map((hz) => (
      <mesh key={hz} position={[0.86, 0.45, hz]}>
        <boxGeometry args={[0.04, 0.1, 0.18]} />
        <meshStandardMaterial
          color="#fff3bf"
          emissive="#fff3bf"
          emissiveIntensity={0.8}
        />
      </mesh>
    ))}
  </group>
);

// Road along the x axis, centred on the origin (y up, ground at y = 0).
// The car drives along x (default start x = -5); rain falls between y = 0 and y = 6.
export const RoadKit: React.FC<{
  rain: number;
  car?: { color: string; x: number };
}> = ({ rain, car }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[ROAD_LENGTH, 4.8]} />
      <meshStandardMaterial color="#2b2d31" roughness={0.9} />
    </mesh>
    {Array.from({ length: 9 }, (_, i) => (
      <mesh
        key={i}
        position={[-7 + i * 1.75, 0.006, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.9, 0.09]} />
        <meshStandardMaterial color="#e9ecef" />
      </mesh>
    ))}
    {[3.5, -3.5].map((z) => (
      <mesh key={z} position={[0, 0.06, z]}>
        <boxGeometry args={[ROAD_LENGTH, 0.12, 2.2]} />
        <meshStandardMaterial color="#495057" roughness={0.9} />
      </mesh>
    ))}
    {car ? <Car color={car.color} x={car.x} /> : null}
    <RainField intensity={rain} />
  </group>
);
