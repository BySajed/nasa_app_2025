export type Position = {
    id: string
    lat: number
    lng: number
    timestamp: string
    title?: string
    description?: string
}

export interface CardHistoryPosition {
    title?: string;
    id: string;
    description?: string;
    lat: number;
    lng: number;
    timestamp: number | string;
}