import React, {useEffect, useRef, useState} from "react";
import ReactDOMServer from "react-dom/server";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type {LightIntensity, MapProps, Weather, WeatherApiResponse, WeatherMode,} from "../interfaces/IMap";
import pinUrl from "../assets/marker.svg";
import {forwardGeocode, reverseGeocode} from "../lib/geocoding";
import {useNavigateToSky} from "../hooks/useNavigateToSky.ts";
import {usePositionHistory} from "../hooks/usePositionHistory.ts";
import {apiClient} from "../api/client.ts";
import MarkerHoverCard from "./spots/MarkerHoverCard.tsx";
import type {SpotRead} from "../interfaces/ISpotRead";
import CreateSpotButton from "./spots/CreateSpotButton.tsx";
import type {KyResponse} from "ky";

const TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;
const WEATHER_API_BASE = import.meta.env.VITE_API_URL as string | undefined;

async function getSpots(): Promise<SpotRead[]> {
  const res = await apiClient.get<SpotRead[]>("spots").json();
    return res;
}

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

function createSpotMarkers(spot: SpotRead, map: mapboxgl.Map): mapboxgl.Marker {
  const el = document.createElement("div");
  el.id = "marker";

  const hoverMarker = new mapboxgl.Marker(el)
    .setLngLat([spot.longitude, spot.latitude])
    .addTo(map);

  const hoverPopup = new mapboxgl.Popup({
    offset: 25,
    closeButton: false,
    closeOnClick: false,
    anchor: "bottom",
    maxWidth: "220px",
    className: "rounded-2xl popup-anim",
  }).setDOMContent(
    document
      .createRange()
      .createContextualFragment(
        ReactDOMServer.renderToStaticMarkup(MarkerHoverCard(spot))
      )
  );

  hoverMarker.setPopup(hoverPopup);
  const hoverEl = hoverMarker.getElement();
  hoverEl.addEventListener("mouseenter", () => {
    if (!hoverPopup.isOpen()) hoverMarker.togglePopup();
  });
  hoverEl.addEventListener("mouseleave", () => {
    if (!hoverPopup.isOpen()) return;
    const elPopup = hoverPopup.getElement();
    if (elPopup) {
      elPopup.classList.add("popup-anim-out");
      setTimeout(() => {
        if (hoverPopup.isOpen()) hoverMarker.togglePopup();
        elPopup.classList.remove("popup-anim-out");
      }, 150);
    } else {
      hoverMarker.togglePopup();
    }
  });

  return hoverMarker;
}

function minutesDiff(a: Date, b: Date) {
    return (a.getTime() - b.getTime()) / 60000;
}

function deriveLightFromSunTimes(
    currentIso: string,
    sunriseIso?: string,
    sunsetIso?: string
): LightIntensity {
    try {
        if (!sunriseIso || !sunsetIso) {
            return currentIso ? ("Day" as LightIntensity) : "Day";
        }

        const now = new Date(currentIso);
        const sunrise = new Date(sunriseIso);
        const sunset = new Date(sunsetIso);

        const WINDOW = 45;
        const minsFromSunrise = minutesDiff(now, sunrise);
        const minsToSunset = minutesDiff(sunset, now);

        if (minsFromSunrise < -WINDOW || minsToSunset < -WINDOW) {
            return "Night";
        }
        if (Math.abs(minsFromSunrise) <= WINDOW && minsFromSunrise >= -WINDOW) {
            return "Dawn";
        }
        if (Math.abs(minsToSunset) <= WINDOW && minsToSunset >= -WINDOW) {
            return "Dusk";
        }
        return "Day";
    } catch {
        return "Day";
    }
}

function isCameraClose(
    map: mapboxgl.Map,
    targetLng: number,
    targetLat: number,
    targetZoom: number
): boolean {
    const {lng, lat} = map.getCenter();
    const z = map.getZoom();
    const closePos =
        Math.abs(lng - targetLng) < 0.0005 && Math.abs(lat - targetLat) < 0.0005;
    const closeZoom = z >= targetZoom - 0.05;
    return closePos && closeZoom;
}

const Map: React.FC<MapProps> = ({
  selectedCity,
  externalTarget,
  onSpotCreated,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const weatherModeRef = useRef<WeatherMode>("off");
  const lightRef = useRef<LightIntensity>("Day");
  const lastWeatherFetchTimer = useRef<number | null>(null);
  const styleLoadedRef = useRef<boolean>(false);
  const [spotMarkers, setSpotMarkers] = useState<mapboxgl.Marker[]>([]);

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

    async function requestForWeather(
        lat: number,
        lng: number
    ): Promise<WeatherApiResponse | null> {
        if (!WEATHER_API_BASE) return null;
        const url = `weather/?latitude=${lat}&longitude=${lng}`;
        try {
            const res : KyResponse<WeatherApiResponse> = await apiClient.get(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error("requestForWeather :", e, url);
            return null;
        }
    }

    async function getWeatherFromData(
        lat: number,
        lng: number
    ): Promise<[Weather, LightIntensity]> {
        if (!WEATHER_API_BASE) return ["off", "Day"];
        const data = await requestForWeather(lat, lng);
        if (!data) return ["off", "Day"];

        const c = data.current;
        if (!c) return ["off", "Day"];

        const hasSnow = (c.snowfall ?? 0) > 0;
        const hasRain =
            (c.rain ?? 0) > 0 ||
            (c.showers ?? 0) > 0 ||
            (c.precipitation ?? 0) > 0.2;

        const weather: Weather = hasSnow ? "snow" : hasRain ? "rain" : "off";

        let light: LightIntensity = "Day";
        const curDate = (c.time || "").slice(0, 10);
        const idx = data.daily?.time?.findIndex((d) => d === curDate) ?? -1;

        if (
            idx !== -1 &&
            data.daily?.sunrise?.[idx] &&
            data.daily?.sunset?.[idx]
        ) {
            light = deriveLightFromSunTimes(
                c.time,
                data.daily.sunrise[idx],
                data.daily.sunset[idx]
            );
        } else {
            light = c.is_day === 1 ? "Day" : "Night";
        }

        return [weather, light];
    }
    function applyLight(light: LightIntensity) {
        if (!mapRef.current || !styleLoadedRef.current) return;
        const preset = light.toLowerCase();
        mapRef.current.setConfigProperty("basemap", "lightPreset", preset);
        mapRef.current.setConfigProperty("basemap", "showPlaceLabels", true);
        mapRef.current.setConfigProperty(
            "basemap",
            "showPointOfInterestLabels",
            true
        );
        mapRef.current.setConfigProperty("basemap", "showRoadLabels", true);
        mapRef.current.setConfigProperty("basemap", "showTransitLabels", true);
    }

    function applyWeather(mode: WeatherMode) {
        if (!mapRef.current || !styleLoadedRef.current) return;
        const m = mapRef.current;

        if (mode === "rain") {
            m.setSnow({
                density: 0,
                intensity: 0,
                opacity: 0,
                color: "#FFFFFF",
                "center-thinning": 0.4,
                direction: [0, 50],
                "flake-size": 0.71,
                vignette: 0.3,
            });
            m.setRain({
                density: 1,
                intensity: 1,
                color: "#919191",
                opacity: 0.19,
                "center-thinning": 0,
                direction: [0, 50],
                "droplet-size": [1, 10],
                "distortion-strength": 0.5,
                vignette: 0.5,
            });
        } else if (mode === "snow") {
            m.setRain({
                density: 0,
                intensity: 0,
                opacity: 0,
                color: "#919191",
                "center-thinning": 0,
                direction: [0, 50],
                "droplet-size": [1, 10],
                "distortion-strength": 0.5,
                vignette: 0.5,
            });
            m.setSnow({
                density: 0.85,
                intensity: 1,
                color: "#FFFFFF",
                opacity: 1,
                "center-thinning": 0.4,
                direction: [0, 50],
                "flake-size": 0.71,
                vignette: 0.3,
            });
        } else {
            m.setRain({
                density: 0,
                intensity: 0,
                opacity: 0,
                color: "#919191",
                "center-thinning": 0,
                direction: [0, 50],
                "droplet-size": [1, 10],
                "distortion-strength": 0.5,
                vignette: 0.5,
            });
            m.setSnow({
                density: 0,
                intensity: 0,
                opacity: 0,
                color: "#FFFFFF",
                "center-thinning": 0.4,
                direction: [0, 50],
                "flake-size": 0.71,
                vignette: 0.3,
            });
        }
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

  function attachMarkerPopup(
    lng: number,
    lat: number,
    address?: string | null
  ) {
    if (!markerRef.current) return;
    const btn = document.createElement("button");
    btn.className =
      "btn btn-secondary btn-sm text-white font-semibold px-4 py-2 rounded-md";
    btn.textContent = "View the sky here";
    btn.onclick = (e) => {
      console.log("btn.onclick", lng, lat);
      e.preventDefault();
      e.stopPropagation();
      flyToAndNavigate(lng, lat);
    };
    const wrapper = document.createElement("div");
    wrapper.className = "flex flex-col items-center gap-2";
    if (address) {
      const p = document.createElement("p");
      p.className = "text-neutral font-semibold mb-2 align-center text-md";
      p.textContent = address;
      wrapper.appendChild(p);
    }
    const buttonWrapper = document.createElement("div");
    buttonWrapper.className = "w-full flex flex-row items-center gap-2";
    buttonWrapper.appendChild(btn);
    wrapper.appendChild(buttonWrapper);
    markerRef.current
      .setPopup(
        new mapboxgl.Popup({
          offset: 16,
          closeOnClick: true,
          focusAfterOpen: true,
          anchor: "bottom",
          maxWidth: "260px",
          className: "rounded-2xl",
        }).setDOMContent(wrapper)
      )
      .togglePopup();
    const createSpotDiv = document.createElement("div");
    const reactRoot = createRoot(createSpotDiv);
    reactRoot.render(
      <CreateSpotButton
        onCreated={() => {
          getSpots().then((spots) => {
            spots.forEach((spot) => {
              const marker = createSpotMarkers(spot, mapRef.current!);
              setSpotMarkers([...spotMarkers, marker]);
            });
          });
          if (onSpotCreated) {
            onSpotCreated();
          }
        }}
        lng={lng}
        lat={lat}
      />
    );
    buttonWrapper.appendChild(createSpotDiv);
  }

    function updateOverlay(
        lng: number,
        lat: number,
        zoom: number,
        weather?: Weather,
        light?: LightIntensity
    ) {
        if (!overlayRef.current) return;
        const parts = [
            `Lng: ${lng.toFixed(5)}`,
            `Lat: ${lat.toFixed(5)}`,
            `Zoom: ${zoom.toFixed(2)}`,
        ];
        if (zoom >= 15) {
            if (weather) parts.push(`Weather: ${weather}`);
            if (light) parts.push(`Light: ${light}`);
        }
        overlayRef.current.textContent = parts.join("  •  ");
    }

    async function handleZoomLevel(
        zoom: number,
        center: { lng: number; lat: number }
    ) {
        updateOverlay(center.lng, center.lat, zoom);
        if (lastWeatherFetchTimer.current) {
            window.clearTimeout(lastWeatherFetchTimer.current);
            lastWeatherFetchTimer.current = null;
        }
        lastWeatherFetchTimer.current = window.setTimeout(async () => {
            if (zoom < 15) {
                weatherModeRef.current = "off";
                lightRef.current = "Day";
                applyWeather("off");
                applyLight("Day");
                updateOverlay(center.lng, center.lat, zoom);
                return;
            }

            const [weatherFromApi, lightFromApi] = await getWeatherFromData(
                center.lat,
                center.lng
            );

            const finalWeather = weatherFromApi;
            const finalLight = lightFromApi;

            weatherModeRef.current = finalWeather;
            lightRef.current = finalLight;
            applyWeather(finalWeather);
            applyLight(finalLight);
            updateOverlay(center.lng, center.lat, zoom, finalWeather, finalLight);
        }, 300);
    }

    useEffect(() => {
        if (mapRef.current || !mapContainerRef.current || !TOKEN) return;
        mapboxgl.accessToken = TOKEN;
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/standard",
            center: [2.3522, 48.8566],
            zoom: 2.3,
            pitch: 0,
            bearing: 0,
        });
        map.addControl(new mapboxgl.NavigationControl());

    getSpots().then((spots) => {
      spots.forEach((spot) => {
        const marker = createSpotMarkers(spot, map);
        setSpotMarkers([...spotMarkers, marker]);
      });
    });
    mapRef.current = map;

        map.on("style.load", () => {
            styleLoadedRef.current = true;
            map.setConfigProperty("basemap", "lightPreset", "day");
            applyWeather("off");
            const c = map.getCenter();
            handleZoomLevel(map.getZoom(), {lng: c.lng, lat: c.lat});
        });

        map.on("move", () => {
            const c = map.getCenter();
            const z = map.getZoom();
            const show = z >= 15;
            updateOverlay(
                c.lng,
                c.lat,
                z,
                show ? weatherModeRef.current : undefined,
                show ? lightRef.current : undefined
            );
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
            styleLoadedRef.current = false;
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

  useEffect(() => {
    if (!externalTarget || !mapRef.current) return;
    const { lng, lat, zoom } = externalTarget;
    ensureMarker(lng, lat);
    flyToAndNavigate(lng, lat, zoom ?? 13.5);
  }, [externalTarget]);

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