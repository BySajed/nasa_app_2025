import * as THREE from "three";
import { type ThreeElements } from "@react-three/fiber";
import { useState } from "react";
import { scalePosition, sizeFromMagnitude } from "./utils";
import type { Star } from "../../api/stars";

export function Stars({ stars }: { stars: Star[] }) {
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const selectedConstellation = selectedStar?.constellation ?? null;

  return stars.map((star, i) => (
    <StarRender
      key={i}
      position={scalePosition([star.x, star.y, star.z])}
      onClick={() => {
        setSelectedStar(star);
      }}
      size={sizeFromMagnitude(star.magnitude)}
      color={star.color}
      isConstellationSelected={
        !!selectedConstellation && star.constellation === selectedConstellation
      }
    />
  ));
}

export function StarRender({
  size,
  color,
  isConstellationSelected,
  map,
  ...props
}: ThreeElements["mesh"] & {
  size: number;
  color: string;
  isConstellationSelected: boolean;
  map?: THREE.Texture | null;
}) {
  const emissiveColor = new THREE.Color(color);

  return (
    <mesh {...props}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        color={color}
        map={map ?? undefined}
        emissive={
          isConstellationSelected ? emissiveColor : new THREE.Color(0x000000)
        }
        emissiveIntensity={isConstellationSelected ? 1.5 : 0}
      />

      {isConstellationSelected && (
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

