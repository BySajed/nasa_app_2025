import * as THREE from "three";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeElements,
} from "@react-three/fiber";
import { useEffect, useState } from "react";
import { baseRotation, updateCameraRotation, useDrag } from "./useDrag";

export function Sky() {
  const [rotation, setRotation] = useState(baseRotation);
  function onDrag(dx: number, dy: number) {
    console.log("lala", dx, dy);
    setRotation((prev) => updateCameraRotation(prev, dx, dy));
  }

  useEffect(() => {
    console.log("rotation", rotation);
  }, [rotation]);

  const canvasProps = useDrag(onDrag);
  return (
    <Canvas
      {...canvasProps}
      scene={{
        background: new THREE.Color(0x000000),
      }}
      camera={{
        isPerspectiveCamera: true,
        rotation,
        position: [0, 0, 0],
      }}
    >
      <CameraController rotation={rotation} />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Star position={[-2, -2, 5]} />
      <Star position={[2, 2, 5]} />
    </Canvas>
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

function Star(props: ThreeElements["mesh"]) {
  return (
    <mesh {...props}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color={"orange"} />
    </mesh>
  );
}
