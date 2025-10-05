import * as THREE from "three";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeElements,
} from "@react-three/fiber";
import { useState } from "react";
import {
  baseRotation,
  FOV_ANGLE,
  updateCameraRotation,
  useDrag,
} from "./useDrag";
import type { Star } from "../../api/sky";

export function Sky({ stars }: { stars: Star[] }) {
  const [rotation, setRotation] = useState(baseRotation);

  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const selectedConstellation = selectedStar?.constellation ?? null;
  function onDrag(dx: number, dy: number) {
    setRotation((prev) => updateCameraRotation(prev, dx, dy));
  }

  const canvasProps = useDrag(onDrag);

  return (
    <div className="w-screen h-screen">
      <Canvas
        {...canvasProps}
        scene={{
          background: new THREE.Color(0x000000),
        }}
        camera={{
          fov: FOV_ANGLE,
          isPerspectiveCamera: true,
          rotation,
          position: [0, 0, 0],
        }}
      >
        <CameraController rotation={rotation} />
        <ambientLight />
        {stars.map((star, i) => (
          <Star
            key={i}
            position={scalePosition([star.x, star.y, star.z])}
            onClick={() => {
              setSelectedStar(star);
            }}
            size={sizeFromMagnitude(star.magnitude)}
            color={star.color}
            constellation={star.constellation ?? null}
            selectedConstellation={selectedConstellation}
          />
        ))}
      </Canvas>
    </div>
  );
}

function CameraController({
  rotation,
}: {
  rotation: [number, number, number];
}) {
  const { camera } = useThree();
  useFrame(() => {
    camera.rotation.set(...rotation);
  });
  return null;
}

function Star({
  size,
  color,
  constellation,
  selectedConstellation,
  ...props
}: ThreeElements["mesh"] & {
  size: number;
  color: string;
  constellation: string | null;
  selectedConstellation: string | null;
}) {
  const isSelected =
    constellation &&
    selectedConstellation &&
    constellation === selectedConstellation;

  // Convert hex or named color to THREE.Color
  const emissiveColor = new THREE.Color(color);

  return (
    <mesh {...props}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={isSelected ? emissiveColor : new THREE.Color(0x000000)}
        emissiveIntensity={isSelected ? 1.5 : 0}
      />

      {isSelected && (
        <sprite scale={[size * 6, size * 6, 1]}>
          <spriteMaterial
            attach="material"
            map={makeSpriteTexture(color)}
            transparent
            opacity={0.6}
            depthWrite={false}
          />
        </sprite>
      )}
    </mesh>
  );
}

function scalePosition([x, y, z]: [number, number, number]): [
  number,
  number,
  number
] {
  return [x / 1000, y / 1000, z / 1000];
}

function sizeFromMagnitude(magnitude: number): number {
  return Math.pow(2.512, -magnitude) * 20;
}

function makeSpriteTexture(color: string) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
