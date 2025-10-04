import { apiClient } from "./client";

export async function getVisibleStars(
  lon: number,
  lat: number
): Promise<Star[]> {
  const res = await apiClient
    .get<{ stars: Star[] }>("/sky/stars", {
      searchParams: { lat, lon },
    })
    .json();

  return res.stars;
}

export type Star = {
  source_id: string;
  magnitude: number;
  x: number;
  y: number;
  z: number;
  earth_distance_ly: number | null;
};
