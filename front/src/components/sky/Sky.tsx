import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Star } from "../../api/sky";
import { Stars } from "./Star";
import { useCamera } from "./useCamera";

export function Sky({ stars }: { stars: Star[] }) {
  const { canvasProps, cameraProps, rotation, zoom } = useCamera();

  return (
    <div className="w-screen h-screen">
      <Canvas
        {...canvasProps}
        scene={{
          background: new THREE.Color(0x000000),
        }}
        camera={cameraProps}
      >
        <CameraController rotation={rotation} zoom={zoom} />
        <ambientLight />
        <Stars stars={stars} />
      </Canvas>
    </div>
  );
}

function CameraController({
  rotation,
  zoom,
}: {
  rotation: [number, number, number];
  zoom: number;
}) {
  const { camera } = useThree();
  useFrame(() => {
    camera.rotation.set(...rotation);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  });
  return null;
}
