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
  function onDrag(dx: number, dy: number) {
    setRotation((prev) => updateCameraRotation(prev, dx, dy));
  }

  const canvasProps = useDrag(onDrag);

  console.log(stars.map((s) => s.color + "\n"));
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
              console.log(star);
            }}
            size={sizeFromMagnitude(star.magnitude)}
            color={star.color}
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

function Star(props: ThreeElements["mesh"] & { size: number; color: string }) {
  return (
    <mesh {...props}>
      <sphereGeometry args={[props.size, 32, 32]} />
      <meshStandardMaterial color={props.color} />
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
