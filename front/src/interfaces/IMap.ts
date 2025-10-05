export interface SearchBarProps {
  searchCity?: boolean;
  setCity?: (city: string) => void;
}

export interface MapProps {
  selectedCity: string | null;
  externalTarget?: { lng: number; lat: number; zoom?: number } | null;
  onSpotCreated?: () => void;
}

export type Weather = "off" | "rain" | "snow";
export type LightIntensity = "Dawn" | "Dusk" | "Day" | "Night";

export type WeatherMode = "off" | "rain" | "snow";

export type WeatherApiResponse = {
    timezone?: string;
    utc_offset_seconds?: number;
  current?: {
    time: string;
    temperature_2m: number;
    rain: number;
    is_day: 0 | 1;
    relative_humidity_2m: number;
    precipitation: number;
    cloud_cover: number;
    snowfall: number;
    showers: number;
  };
    daily?: {
        time: string[];
        sunrise: string[];
        sunset: string[];
    };
};
