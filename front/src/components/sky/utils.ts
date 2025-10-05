import { Vector3 } from "three";

export function scalePosition([x, y, z]: [number, number, number]): Vector3 {
  const vec = new Vector3(x, y, z);
  return vec.divideScalar(1000);
}
