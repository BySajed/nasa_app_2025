import * as React from "react";
import { useState } from "react";

export const useDrag = (listener: (dx: number, dy: number) => void) => {
  const [isDragging, setIsDragging] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  const onMouseDown = (event: React.MouseEvent) => {
    if (event.button !== 0) return; // only left click
    setIsDragging(true);
    setLastX(event.clientX);
    setLastY(event.clientY);
  };

  const onMouseMove = (event: React.MouseEvent) => {
    if (event.button !== 0) return; // only left click
    if (isDragging) {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      listener(dx, dy);
      setLastX(event.clientX);
      setLastY(event.clientY);
    }
  };

  const onMouseUp = (event: React.MouseEvent) => {
    if (event.button !== 0) return; // only left click
    setIsDragging(false);
  };

  const onMouseLeave = (event: React.MouseEvent) => {
    if (event.button !== 0) return; // only left click
    setIsDragging(false);
  };
  return { onMouseDown, onMouseMove, onMouseUp, onMouseLeave };
};
