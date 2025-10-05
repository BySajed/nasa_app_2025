import { Vector3 } from "three";

const SHRINK_FACTOR = 1000;

export function scalePosition([x, y, z]: [number, number, number]): Vector3 {
  const vec = new Vector3(x, y, z);
  return vec.divideScalar(SHRINK_FACTOR);
}

export function scaleSize(size: number): number {
  return size / SHRINK_FACTOR;
}

export function sizeFromMagnitude(magnitude: number): number {
  return Math.pow(2.512, -magnitude) * 20;
}
