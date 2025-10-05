import type { Planet } from "../../api/sky";
import { StarRender } from "./Star";
import { scalePosition, sizeFromMagnitude } from "./utils";
import { useMemo } from "react";
import * as THREE from "three";

export function Planets({ planets }: { planets: Planet[] }) {
  return (
    <>
      {planets.map((planet) => (
        <PlanetRender key={planet.name} planet={planet} />
      ))}
    </>
  );
}

function PlanetRender({ planet }: { planet: Planet }) {
  const baseColor = colorFromPlanet(planet.name);

  const texture = useMemo(() => {
    // Create a canvas and draw procedural patterns based on planet name
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Fill base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // Simple seeded pseudo-random
    let seed = 0;
    for (let i = 0; i < planet.name.length; i++) seed = (seed * 31 + planet.name.charCodeAt(i)) | 0;
    function rand() {
      seed = (seed * 1664525 + 1013904223) | 0;
      return ((seed >>> 0) % 1000) / 1000;
    }

    // Draw bands or spots depending on planet type (gas giants get bands)
    const isGas = ["jupiter", "saturn", "uranus", "neptune"].includes(
      planet.name.toLowerCase()
    );

    if (isGas) {
      // Draw horizontal bands
      const bandCount = 6 + Math.floor(rand() * 6);
      for (let b = 0; b < bandCount; b++) {
        const y = (b / bandCount) * size;
        const bandHeight = size / bandCount * (0.6 + rand() * 1.2);
        ctx.fillStyle = mixColor(baseColor, shadeHex(baseColor, (rand() - 0.5) * 0.2));
        ctx.globalAlpha = 0.8 - rand() * 0.5;
        ctx.fillRect(0, y, size, bandHeight);
      }
    } else {
      // Draw spots/texture noise for rocky planets
      const spots = 200 + Math.floor(rand() * 300);
      for (let s = 0; s < spots; s++) {
        const x = Math.floor(rand() * size);
        const y = Math.floor(rand() * size);
        const r = 1 + Math.floor(rand() * (size * 0.02));
        ctx.beginPath();
        ctx.fillStyle = mixColor(baseColor, shadeHex(baseColor, (rand() - 0.5) * 0.3));
        ctx.globalAlpha = 0.6 - rand() * 0.5;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // subtle cloud/atmosphere overlay
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(rand() * size, rand() * size, size * 0.6 * rand(), size * 0.2 * rand(), rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [planet.name, baseColor]);

  return (
    <StarRender
      position={scalePosition([planet.x, planet.y, planet.z])}
      size={sizeFromMagnitude(planet.magnitude)}
      color={baseColor}
      isConstellationSelected={false}
      map={texture}
    />
  );
}

function colorFromPlanet(planetName: string): string {
  switch (planetName.toLowerCase()) {
    case "mercury":
      return "#b1b1b1"; // Gray
    case "venus":
      return "#f5deb3"; // Wheat
    case "earth":
      return "#1f8eed"; // Blue
    case "mars":
      return "#ff4500"; // OrangeRed
    case "jupiter":
      return "#d2b48c"; // Tan
    case "saturn":
      return "#f4a460"; // SandyBrown
    case "uranus":
      return "#afeeee"; // PaleTurquoise
    case "neptune":
      return "#4169e1"; // RoyalBlue
    case "moon":
      return "#d3d3d3"; // LightGray
    default:
      return "#ffffff"; // Default to white
  }
}

// Helpers for procedural color variation
function hexToRgb(hex: string) {
  const cleaned = hex.replace("#", "");
  const num = parseInt(cleaned, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1)
  );
}

function shadeHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + amount * 255, g + amount * 255, b + amount * 255);
}

function mixColor(a: string, b: string, t = 0.5) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.r * (1 - t) + B.r * t, A.g * (1 - t) + B.g * t, A.b * (1 - t) + B.b * t);
}
