import { apiClient } from "./client";

export async function getVisibleStars(
  lon: number,
  lat: number
): Promise<Star[]> {
  const res = await apiClient
    .get<{ stars: Star[] }>("sky/stars", {
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
  color: string
  constellation: string | null
  temperature_kelvin: number | null
};


export async function getPlanets(
  lon: number,
  lat: number,
): Promise<Planet[]> {
  const res = await apiClient
    .get<{ planets: Planet[] }>("sky/solar-system", {
      searchParams: { lat, lon },
    })
    .json();

  return res.planets;
}

export type Planet = {
  name: string;
  x: number;
  y: number;
  z: number;
  magnitude: number;
  is_visible: boolean;
}