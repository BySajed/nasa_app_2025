import React, {useEffect, useRef} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type {LightIntensity, MapProps, Weather, WeatherApiResponse, WeatherMode} from "../interfaces/IMap";
import pinUrl from "../assets/marker.svg";
import {forwardGeocode, reverseGeocode} from "../lib/geocoding";
import {useNavigateToSky} from "../hooks/useNavigateToSky.ts";
import {usePositionHistory} from "../hooks/usePositionHistory.ts";

const TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;
const WEATHER_API_BASE = import.meta.env.VITE_WEATHER_API_BASE as string | undefined;

type Particle = {
    x: number;
    y: number;
    vy: number;
    vx: number;
    len: number;
    size: number;
};

function createMarkerElement(): HTMLElement {
    const el = document.createElement("div");
    el.style.width = "36px";
    el.style.height = "36px";
    el.style.backgroundImage = `url(${pinUrl})`;
    el.style.backgroundSize = "contain";
    el.style.backgroundRepeat = "no-repeat";
    el.style.backgroundPosition = "center";
    el.style.transform = "translateY(-6px)";
    return el;
}

function isCameraClose(
    map: mapboxgl.Map,
    targetLng: number,
    targetLat: number,
    targetZoom: number
): boolean {
    const {lng, lat} = map.getCenter();
    const z = map.getZoom();
    const closePos = Math.abs(lng - targetLng) < 0.0005 && Math.abs(lat - targetLat) < 0.0005;
    const closeZoom = z >= targetZoom - 0.05;
    return closePos && closeZoom;
}

const Map: React.FC<MapProps> = ({selectedCity}) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const weatherModeRef = useRef<WeatherMode>("off");
    const lightRef = useRef<LightIntensity>("Day");
    const lastWeatherFetchTimer = useRef<number | null>(null);

    const navigateToSky = useNavigateToSky();
    const {addPosition} = usePositionHistory();

    function ensureMarker(lng: number, lat: number) {
        if (!mapRef.current) return;
        if (!markerRef.current) {
            markerRef.current = new mapboxgl.Marker({
                element: createMarkerElement(),
                anchor: "bottom",
            })
                .setLngLat([lng, lat])
                .addTo(mapRef.current);
        } else {
            markerRef.current.setLngLat([lng, lat]);
        }
    }

    async function getWeatherFromData(
        lat: number,
        lng: number
    ): Promise<[Weather, LightIntensity, number]> {
        if (!WEATHER_API_BASE) return ["off", "Day", 0];
        const url = `${WEATHER_API_BASE}weather?latitude=${lat}&longitude=${lng}`;
        try {
            const res = await fetch(url, {headers: {accept: "application/json"}});
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: WeatherApiResponse = await res.json();

            const c = data.current;
            if (!c) return ["off", "Day", 0];

            const hasSnow = (c.snowfall ?? 0) > 0;
            const hasRain = (c.rain ?? 0) > 0 || (c.showers ?? 0) > 0 || (c.precipitation ?? 0) > 0.2;

            const weather: Weather = hasSnow ? "snow" : hasRain ? "rain" : "off";
            const light: LightIntensity = c.is_day === 1 ? "Day" : "Night";
            const clouds = Math.max(0, Math.min(100, c.cloud_cover ?? 0));

            return [weather, light, clouds];
        } catch (e) {
            console.error("getWeatherFromData :" + e);
            return ["off", "Day", 0];
        }
    }

    function getWeatherHeuristic(): [Weather, LightIntensity] {
        if (!mapRef.current) return ["off", "Day"];
        const zoom = mapRef.current.getZoom();

        let weather: Weather = "off";
        if (zoom > 10) weather = "rain";
        else if (zoom < 4) weather = "snow";

        const light: LightIntensity = zoom >= 6 ? "Day" : "Night";
        return [weather, light];
    }

    function flyToAndNavigate(lng: number, lat: number, zoom = 13.5) {
        const map = mapRef.current;
        if (!map) return;

        map.stop();
        addPosition(lat, lng, selectedCity || undefined, undefined);

        if (isCameraClose(map, lng, lat, zoom)) {
            navigateToSky(lat, lng);
            return;
        }

        map.once("moveend", () => navigateToSky(lat, lng));
        map.flyTo({
            center: [lng, lat],
            zoom,
            speed: 0.8,
            curve: 1.4,
            duration: 1200,
            essential: true,
        });
    }

    function attachMarkerPopup(lng: number, lat: number, address?: string | null) {
        if (!markerRef.current) return;
        const btn = document.createElement("button");
        btn.className = "btn btn-primary text-white font-semibold px-4 py-2 rounded-md";
        btn.textContent = "Voir le ciel ici";
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            flyToAndNavigate(lng, lat);
        };

        const wrapper = document.createElement("div");
        wrapper.className = "flex flex-col items-center";
        if (address) {
            const p = document.createElement("p");
            p.className = "text-neutral font-semibold mb-2 align-center text-md";
            p.textContent = address;
            wrapper.appendChild(p);
        }
        wrapper.appendChild(btn);

        markerRef.current
            .setPopup(
                new mapboxgl.Popup({
                    offset: 16,
                    closeOnClick: false,
                    focusAfterOpen: false,
                    anchor: "bottom",
                    maxWidth: "260px",
                    className: "rounded-2xl",
                }).setDOMContent(wrapper)
            )
            .togglePopup();
    }

    function updateOverlay(
        lng: number,
        lat: number,
        zoom: number,
        weather?: Weather,
        light?: LightIntensity
    ) {
        if (!overlayRef.current) return;
        const parts = [`Lng: ${lng.toFixed(5)}`, `Lat: ${lat.toFixed(5)}`, `Zoom: ${zoom.toFixed(2)}`];
        if (weather) parts.push(`Weather: ${weather}`);
        if (light) parts.push(`Light: ${light}`);
        overlayRef.current.textContent = parts.join("  •  ");
    }

    function applyVisuals(light: LightIntensity, cloudsPct: number) {
        if (wrapperRef.current) {
            const base = light === "Night" ? 0.75 : 1;
            const cloudFactor = 1 - Math.min(0.2, (cloudsPct / 100) * 0.2);
            wrapperRef.current.style.filter = `brightness(${(base * cloudFactor).toFixed(2)})`;
        }
    }

    async function handleZoomLevel(zoom: number, center: {lng: number; lat: number}) {
        updateOverlay(center.lng, center.lat, zoom);

        if (lastWeatherFetchTimer.current) {
            window.clearTimeout(lastWeatherFetchTimer.current);
            lastWeatherFetchTimer.current = null;
        }
        lastWeatherFetchTimer.current = window.setTimeout(async () => {
            const [weather, light, clouds] = await getWeatherFromData(center.lat, center.lng);

            let finalWeather = weather;
            let finalLight = light;
            if (weather === "off" && light === "Day") {
                const [w2, l2] = getWeatherHeuristic();
                finalWeather = w2;
                finalLight = l2;
            }

            weatherModeRef.current = finalWeather;
            lightRef.current = finalLight;
            applyVisuals(finalLight, clouds);
            updateOverlay(center.lng, center.lat, zoom, finalWeather, finalLight);
        }, 300);
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            if (!wrapperRef.current) return;
            canvas.width = wrapperRef.current.clientWidth;
            canvas.height = wrapperRef.current.clientHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        function initParticles(mode: WeatherMode) {
            if (!ctx || !canvas) return;

            particlesRef.current = [];
            const count = mode === "rain" ? 200 : mode === "snow" ? 100 : 0;
            for (let i = 0; i < count; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vy: mode === "rain" ? 6 + Math.random() * 4 : 0.5 + Math.random() * 1.5,
                    vx: mode === "rain" ? 0 : -0.5 + Math.random() * 1,
                    len: mode === "rain" ? 10 + Math.random() * 10 : 1 + Math.random() * 3,
                    size: mode === "snow" ? 1 + Math.random() * 3 : 0,
                });
            }
        }

        function tick() {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const mode = weatherModeRef.current;
            if (mode !== "off") {
                if (particlesRef.current.length === 0) {
                    initParticles(mode);
                }
                if (mode === "rain") {
                    ctx.strokeStyle = "rgba(174,194,224,0.6)";
                    ctx.lineWidth = 1;
                    for (const p of particlesRef.current) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p.x + p.vx * p.len, p.y + p.vy * p.len);
                        ctx.stroke();
                        p.x += p.vx;
                        p.y += p.vy;
                        if (p.y > canvas.height) {
                            p.y = -20;
                            p.x = Math.random() * canvas.width;
                        }
                    }
                } else if (mode === "snow") {
                    ctx.fillStyle = "rgba(255,255,255,0.9)";
                    for (const p of particlesRef.current) {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fill();
                        p.x += p.vx;
                        p.y += p.vy;
                        if (p.y > canvas.height) {
                            p.y = -10;
                            p.x = Math.random() * canvas.width;
                        }
                    }
                }
            } else {
                particlesRef.current = [];
            }

            animationFrameRef.current = requestAnimationFrame(tick);
        }

        animationFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            window.removeEventListener("resize", resize);
        };
    }, []);

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current || !TOKEN) return;

        mapboxgl.accessToken = TOKEN;
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/standard",
            center: [2.3522, 48.8566],
            zoom: 2.3,
        });
        map.addControl(new mapboxgl.NavigationControl());

        mapRef.current = map;

        map.on("load", () => {
            const c = map.getCenter();
            handleZoomLevel(map.getZoom(), {lng: c.lng, lat: c.lat});
        });

        map.on("move", () => {
            const c = map.getCenter();
            const z = map.getZoom();
            updateOverlay(c.lng, c.lat, z, weatherModeRef.current, lightRef.current);
        });

        map.on("moveend", () => {
            const c = map.getCenter();
            const z = map.getZoom();
            handleZoomLevel(z, {lng: c.lng, lat: c.lat});
        });

        map.on("click", async (e) => {
            const {lng, lat} = e.lngLat;
            ensureMarker(lng, lat);
            const address = await reverseGeocode(lng, lat);
            attachMarkerPopup(lng, lat, address);
        });

        return () => {
            if (lastWeatherFetchTimer.current) {
                window.clearTimeout(lastWeatherFetchTimer.current);
                lastWeatherFetchTimer.current = null;
            }
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!selectedCity || !mapRef.current) return;

        forwardGeocode(selectedCity).then((coords) => {
            if (!coords) return;
            const [lng, lat] = coords;
            ensureMarker(lng, lat);
            flyToAndNavigate(lng, lat, 12.5);
        });
    }, [selectedCity]);

    return (
        <div
            ref={wrapperRef}
            style={{height: "100%", width: "100%", position: "relative"}}
            className="map-wrapper rounded-2xl overflow-hidden"
        >
            <div
                ref={mapContainerRef}
                style={{height: "100%", width: "100%"}}
                className="map-container"
            />
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    mixBlendMode: "screen",
                }}
            />
            <div
                ref={overlayRef}
                style={{
                    position: "absolute",
                    left: 12,
                    bottom: 12,
                    padding: "8px 12px",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 13,
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                }}
            />
        </div>
    );
};

export default Map;
