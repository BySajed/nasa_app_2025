import { useState } from "react";
import { useDrag } from "./useDrag";

export function useCamera() {
  const [rotation, setRotation] = useState(baseRotation);
  const [zoom, setZoom] = useState(baseZoom);
  function onDrag(dx: number, dy: number) {
    setRotation((previousRotation) =>
      updateCameraRotation({ previousRotation, dx, dy, zoom })
    );
  }
  function onWheel(event: React.WheelEvent) {
    setZoom((prev) => updateZoom(prev, event.deltaY));
    setRotation((previousRotation) =>
      updateCameraRotation({ previousRotation, dx: 0, dy: 0, zoom })
    );
  }

  const canvasProps = {
    ...useDrag(onDrag),
    onWheel,
  };

  const cameraProps = {
    fov: FOV_ANGLE,
    position: [0, 0, 0] as const,
    rotation: rotation,
    zoom,
    isPerspectiveCamera: true as const,
  };

  return { canvasProps, cameraProps, rotation, zoom };
}

const baseZoom = 1;
const FOV_ANGLE = 60; // degrees
const FOV_RAD = (FOV_ANGLE * Math.PI) / 180; // radians
const baseRotation: [number, number, number] = [Math.PI, 0, 0];

function updateCameraRotation({
  previousRotation,
  dx,
  dy,
  zoom,
}: {
  previousRotation: [number, number, number];
  dx: number;
  dy: number;
  zoom: number;
}): [number, number, number] {
  const visionAngle = FOV_RAD / zoom;
  const minX = Math.PI / 2 + visionAngle / 2;
  const maxX = (3 * Math.PI) / 2 - visionAngle / 2;
  const minY = -Math.PI / 2 + visionAngle / 2;
  const maxY = Math.PI / 2 - visionAngle / 2;

  let newX = previousRotation[0] + dy * 0.0015 * (1 / zoom);
  let newY = previousRotation[1] + dx * 0.0015 * (1 / zoom);
  newX = Math.max(minX, Math.min(maxX, newX));
  newY = Math.max(minY, Math.min(maxY, newY));

  return [newX, newY, previousRotation[2]];
}

function updateZoom(previousZoom: number, delta: number): number {
  const newZoom = previousZoom * (1 - delta * 0.001);
  return Math.max(0.5, Math.min(10, newZoom));
}
