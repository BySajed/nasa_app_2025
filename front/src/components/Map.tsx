import React, { useEffect, useRef } from "react";
import ReactDOMServer from "react-dom/server";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapProps } from "../interfaces/IMap";
import pinUrl from "../assets/marker.svg";
import { forwardGeocode, reverseGeocode } from "../lib/geocoding";
import { useNavigateToSky } from "../hooks/useNavigateToSky.ts";
import { usePositionHistory } from "../hooks/usePositionHistory.ts";
import { apiClient } from "../api/client.ts";
import MarkerHoverCard from "./spots/MarkerHoverCard.tsx";
import type { SpotRead } from "../interfaces/ISpotRead";
import CreateSpotButton from "./spots/CreateSpotButton.tsx";

const TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;

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

function isCameraClose(
  map: mapboxgl.Map,
  targetLng: number,
  targetLat: number,
  targetZoom: number
): boolean {
  const { lng, lat } = map.getCenter();
  const z = map.getZoom();
  const closePos =
    Math.abs(lng - targetLng) < 0.0005 && Math.abs(lat - targetLat) < 0.0005;
  const closeZoom = z >= targetZoom - 0.05;
  return closePos && closeZoom;
}

const Map: React.FC<MapProps> = ({ selectedCity }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const navigateToSky = useNavigateToSky();
  const { addPosition } = usePositionHistory();

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
          closeOnClick: false,
          focusAfterOpen: false,
          anchor: "bottom",
          maxWidth: "260px",
          className: "rounded-2xl",
        }).setDOMContent(wrapper)
      )
      .togglePopup();
    const createSpotDiv = document.createElement("div");
    createSpotDiv.innerHTML = ReactDOMServer.renderToString(
      <CreateSpotButton lng={lng} lat={lat} />
    );
    buttonWrapper.appendChild(createSpotDiv.firstChild as Node);
  }

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

    getSpots().then((spots) => {
      spots.forEach((spot: SpotRead) => {
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
      });
    });

    mapRef.current = map;

    map.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      ensureMarker(lng, lat);
      const address = await reverseGeocode(lng, lat);
      attachMarkerPopup(lng, lat, address);
    });

    return () => {
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
      ref={mapContainerRef}
      style={{ height: "100%", width: "100%", position: "relative" }}
      className="map-container rounded-2xl"
    />
  );
};

export default Map;
