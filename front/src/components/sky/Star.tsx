import * as THREE from "three";
import { type ThreeElements } from "@react-three/fiber";
import { scalePosition, sizeFromMagnitude } from "./utils";
import type { Star } from "../../api/stars";

type StarsProps = {
  stars: Star[];
  selectedStar?: Star | null;
  onSelect?: (star: Star) => void;
};

export function Stars({ stars, selectedStar = null, onSelect }: StarsProps) {
  const selectedConstellation = selectedStar?.constellation ?? null;

  return stars.map((star, i) => (
    <StarRender
      key={i}
      position={scalePosition([star.x, star.y, star.z])}
      onClick={() => {
        onSelect?.(star);
      }}
      size={sizeFromMagnitude(star.magnitude)}
      color={star.color}
      isConstellationSelected={
        !!selectedConstellation && star.constellation === selectedConstellation
      }
    />
  ));
}

type StarDetailsPanelProps = {
  star: Star;
  onClose: () => void;
};

export function StarDetailsPanel({ star, onClose }: StarDetailsPanelProps) {
  return (
    <div className="absolute top-4 right-4 w-80 max-h-[80vh] overflow-auto bg-black/80 text-white p-4 rounded shadow-xl border border-white/20 backdrop-blur">
      <div className="flex justify-between items-start mb-2 gap-2">
        <h2 className="font-semibold leading-tight">
          {star.constellation && (
            <span className="block opacity-60 font-normal">
              Constellation {star.constellation}
            </span>
          )}
        </h2>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20"
        >
          Close
        </button>
      </div>

      <div className="text-xs space-y-1">
        <p>
          Magnitude:{" "}
          <span className="font-medium">{star.magnitude.toFixed(2)}</span>
        </p>
        {typeof star.temperature_kelvin === "number" && (
          <p>Temperature: {Math.round(star.temperature_kelvin)} K</p>
        )}
        {typeof star.earth_distance_ly === "number" && (
          <p>Distance: {star.earth_distance_ly.toFixed(2)} Light-years</p>
        )}
        <div className="pt-2 border-t border-white/10 space-y-1">
          <p className="opacity-70 text-[11px] leading-tight">
            Click on another item to display its information.
          </p>
        </div>
      </div>
    </div>
  );
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
