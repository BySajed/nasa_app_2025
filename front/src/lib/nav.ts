export function navigateToSky(latitude: number, longitude: number) {
    const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) });
    window.location.assign(`/sky?${params.toString()}`);
}
