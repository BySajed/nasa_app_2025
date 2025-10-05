import { apiClient } from "./client";

export interface SatelliteOrbitInfo {
  period_min: number | null;
  inclination_deg: number | null;
  type: string | null; // LEO/MEO/GEO/HIGH
}

export interface SatelliteMiniTrackPoint {
  t: string;
  az: number;
  el: number;
  x: number;
  y: number;
  z: number;
  subLon: number;
  subLat: number;
}

export interface SatelliteProps {
  norad_id: number;
  category?: string | null;
  orbit?: SatelliteOrbitInfo | null;
  tle_age_hours?: number | null;
  altitude_km: number;
  speed_kms: number;
  range_km: number;
  range_rate_kms: number;
  mini_track?: SatelliteMiniTrackPoint[] | null;
}

export interface SatelliteObject {
  kind: "satellite";
  name: string;
  az_deg: number;
  el_deg: number;
  x: number; // ENU km
  y: number; // ENU km
  z: number; // ENU km
  geometry: { type: "Point"; coordinates: [number, number] };
  props: SatelliteProps;
}

export interface AboveResponse {
  observer: {
    lat: number;
    lon: number;
    alt_m: number;
    time_utc: string;
  };
  paging: {
    limit: number;
    offset: number;
    total_estimated: number;
  };
  objects: SatelliteObject[];
}

export async function getSatellites(params: {
  lat: number;
  lon: number;
  alt_m?: number;
  limit?: number;
  offset?: number;
  trackMode?: "none" | "point" | "triad";
  trackStepSec?: number;
}): Promise<SatelliteObject[]> {
  const { lat, lon, alt_m, limit, offset, trackMode, trackStepSec } = params;
  const res = await apiClient
    .get<AboveResponse>("sky/satellite", {
      searchParams: {
        lat,
        lon,
        ...(alt_m !== undefined ? { alt_m } : {}),
        ...(limit !== undefined ? { limit } : {}),
        ...(offset !== undefined ? { offset } : {}),
        ...(trackMode ? { trackMode } : {}),
        ...(trackStepSec ? { trackStepSec } : {}),
      },
    })
    .json();
  return res.objects;
}

export interface SatelliteDetailsResponse {
  object_id: string;
  kind: string; // satellite
  name: string;
  info: {
    orbit?: SatelliteOrbitInfo | null;
    tle_age_hours?: number | null;
    timeline: Array<{
      t: string;
      az: number;
      el: number;
      range_km: number;
      subLon: number;
      subLat: number;
    }>;
    groundtrack: { type: "LineString"; coordinates: [number, number][] };
  };
}

export async function getSatelliteDetails(norad_id: number, params: {
  lat: number;
  lon: number;
  alt_m?: number;
  time_from?: string; // ISO
  time_to?: string; // ISO
  stepSec?: number;
}): Promise<SatelliteDetailsResponse> {
  const { lat, lon, alt_m, time_from, time_to, stepSec } = params;
  const res = await apiClient
    .get<SatelliteDetailsResponse>(`objects/satellite/${norad_id}/details`, {
      searchParams: {
        lat,
        lon,
        ...(alt_m !== undefined ? { alt_m } : {}),
        ...(time_from ? { time_from } : {}),
        ...(time_to ? { time_to } : {}),
        ...(stepSec ? { stepSec } : {}),
      },
    })
    .json();
  return res;
}

