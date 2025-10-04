export interface SearchBarProps {
    searchCity?: boolean;
    setCity?: (city: string) => void;
}

export interface MapProps {
    selectedCity: string | null
}