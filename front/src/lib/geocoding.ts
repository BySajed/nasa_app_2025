const TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

function guardToken() {
    if (!TOKEN) throw new Error("VITE_MAPBOX_ACCESS_TOKEN manquant");
}

export async function forwardGeocode(query: string): Promise<[number, number] | null> {
    guardToken();
    const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
        `${encodeURIComponent(query)}.json?` +
        new URLSearchParams({
            access_token: TOKEN!,
            language: "fr",
            limit: "1",
        }).toString();

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.features?.[0]?.geometry?.coordinates ?? null; // [lng, lat]
}

export async function reverseGeocode(lng: number, lat: number): Promise<string | null> {
    guardToken();
    const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
        `${lng},${lat}.json?` +
        new URLSearchParams({
            access_token: TOKEN!,
            language: "fr",
            types: "address,place,locality,neighborhood,poi",
            limit: "1",
        }).toString();

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const f = data?.features?.[0];
    return f?.properties?.place_formatted || f?.place_name || null;
}
