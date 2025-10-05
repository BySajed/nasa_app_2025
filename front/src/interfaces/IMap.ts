export interface SearchBarProps {
    searchCity?: boolean;
    setCity?: (city: string) => void;
}

export interface MapProps {
    selectedCity: string | null
}

export type Weather = "off" | "rain" | "snow";
export type LightIntensity = "Dawn" | "Dusk" | "Day" | "Night";

export type WeatherMode = "off" | "rain" | "snow";

export type WeatherApiResponse = {
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
};
