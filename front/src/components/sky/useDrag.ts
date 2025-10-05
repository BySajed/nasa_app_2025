import * as React from "react";
import { useState } from "react";

export const FOV_ANGLE = 60; // degrees
export const FOV_RAD = (FOV_ANGLE * Math.PI) / 180; // radians

export const useDrag = (listener: (dx: number, dy: number) => void) => {
  const [isDragging, setIsDragging] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  const onMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    setLastX(event.clientX);
    setLastY(event.clientY);
  };

  const onMouseMove = (event: React.MouseEvent) => {
    if (isDragging) {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      listener(dx, dy);
      setLastX(event.clientX);
      setLastY(event.clientY);
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };
  return { onMouseDown, onMouseMove, onMouseUp, onMouseLeave };
};

export const baseRotation: [number, number, number] = [Math.PI, 0, 0];
export function updateCameraRotation(
  previousRotation: [number, number, number],
  dx: number,
  dy: number
): [number, number, number] {
  const minX = Math.PI / 2 + FOV_RAD / 2;
  const maxX = (3 * Math.PI) / 2 - FOV_RAD / 2;
  const minY = -Math.PI / 2 + FOV_RAD / 2;
  const maxY = Math.PI / 2 - FOV_RAD / 2;
  let newX = previousRotation[0] + dy * 0.0015;
  let newY = previousRotation[1] + dx * 0.0015;
  newX = Math.max(minX, Math.min(maxX, newX));
  newY = Math.max(minY, Math.min(maxY, newY));

  return [newX, newY, previousRotation[2]];
}
