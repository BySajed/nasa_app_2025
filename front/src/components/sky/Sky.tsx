import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, StarDetailsPanel } from "./Star";
import { SatelliteDetailsPanel, SatellitesLayer } from "./Satellite";
import type { SatelliteObject } from "../../api/satellites";
import { useMemo, useState } from "react";
import { scalePosition } from "./utils";
import { useCamera } from "./useCamera";
import { Planets } from "./Planet";
import type { Planet, Star } from "../../api/stars";

export function Sky({
  stars,
  satellites,
  planets,
  observer,
}: {
  stars: Star[];
  satellites: SatelliteObject[];
  planets: Planet[];
  observer?: { lat: number; lon: number; alt_m?: number } | null;
}) {
  const { canvasProps, cameraProps, rotation, zoom } = useCamera();

  const [selectedSatellite, setSelectedSatellite] =
    useState<SatelliteObject | null>(null);

  const [selectedStar, setSelectedStar] =
    useState<Star | null>(null);

  const skySphereRadius = useMemo(() => {
    const sample = stars.find((star) => !!star);
    if (!sample) {
      return 400;
    }
    const [sx, sy, sz] = scalePosition([sample.x, sample.y, sample.z]);
    return Math.sqrt(sx * sx + sy * sy + sz * sz) || 400;
  }, [stars]);

  function handleSelectSatellite(sat: SatelliteObject) {
    setSelectedSatellite(sat);
    setSelectedStar(null);
  }

  function handleSelectStar(star: Star) {
    setSelectedStar(star);
    setSelectedSatellite(null);
  }

  return (
    <div className="w-screen h-screen relative">
      <Canvas
        {...canvasProps}
        scene={{
          background: new THREE.Color(0x000000),
        }}
        camera={cameraProps}
      >
        <CameraController rotation={rotation} zoom={zoom} />
        <ambientLight />
        <Stars
          stars={stars}
          selectedStar={selectedStar}
          onSelect={handleSelectStar}
        />
        <SatellitesLayer
          satellites={satellites}
          displayRadius={skySphereRadius}
          onSelect={handleSelectSatellite}
        />
        <Planets planets={planets} />
      </Canvas>

      {selectedSatellite && observer && (
        <SatelliteDetailsPanel
          satellite={selectedSatellite}
          observer={observer}
          onClose={() => setSelectedSatellite(null)}
        />
      )}

      {selectedStar && (
        <StarDetailsPanel
          star={selectedStar}
          onClose={() => setSelectedStar(null)}
        />
      )}
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
