import * as THREE from "three";
import type { KitPart } from "../../script/types";

type Layer = Extract<KitPart, { type: "layer" }>;

const WIDTH = 4;
const DEPTH = 3;
const EXPLODE_GAP = 0.6; // vertical gap per unit of "explode" between neighbouring layers

// Cross-section: slabs stacked top to bottom, centred on the origin (y up).
// Unexploded, the top surface is at y = +total/2. Explode pushes the top layer up and the bottom one down.
export const LayersKit: React.FC<{
  layers: Layer[];
  explode: number;
  highlight: { layer: string | null; amount: number };
}> = ({ layers, explode, highlight }) => {
  const total = layers.reduce((sum, l) => sum + l.thickness, 0);
  let above = 0;

  return (
    <group rotation={[0, -0.5, 0]}>
      {layers.map((layer, i) => {
        const y =
          total / 2 -
          above -
          layer.thickness / 2 +
          ((layers.length - 1) / 2 - i) * explode * EXPLODE_GAP;
        above += layer.thickness;

        const isLit = highlight.layer === layer.name;
        const dim = highlight.layer && !isLit ? 1 - 0.6 * highlight.amount : 1;
        const color = new THREE.Color(layer.color).multiplyScalar(dim);

        return (
          <mesh key={layer.name} position={[0, y, 0]}>
            <boxGeometry args={[WIDTH, layer.thickness, DEPTH]} />
            <meshStandardMaterial
              color={color}
              emissive={layer.color}
              emissiveIntensity={isLit ? 0.5 * highlight.amount : 0}
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
};
