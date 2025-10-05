import { useEffect, useState } from "react";
import { getVisibleStars, type Star } from "../api/stars";
import { getPlanets, type Planet } from "../api/sky";
import { Sky } from "../components/sky/Sky";
import nasaLogo from "../assets/NASA_logo.svg";
import { useLocation } from "react-router-dom";
import { getSatellites, type SatelliteObject } from "../api/satellites";

export function SkyPage() {
  const [stars, setStars] = useState<Star[]>([]);
  const [satellites, setSatellites] = useState<SatelliteObject[]>([]);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const lat = parseFloat(searchParams.get("latitude") || "0");
    const lon = parseFloat(searchParams.get("longitude") || "0");
    const alt_m = 35; // default observer altitude (sync with backend settings)
    Promise.all([
      getVisibleStars(lon, lat),
      getPlanets(lon, lat),
      getSatellites({ lat, lon, alt_m, limit: 30, trackMode: "none" }),
    ])
      .then(([stars, planets, satellites]) => {
        setStars(stars);
        setPlanets(planets);
        setSatellites(satellites);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load sky data.");
        setIsLoading(false);
      });
  }, [location.search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <img src={nasaLogo} alt="NASA Logo" className="spin-twice" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full text-center p-4">
        <p className="text-red-500 text-lg">{error}</p>
        <p className="mt-4">Sorry...</p>
      </div>
    );
  }

  return (
    <Sky
      stars={stars}
      satellites={satellites}
      planets={planets}
      observer={{
        lat: parseFloat(
          new URLSearchParams(location.search).get("latitude") || "0"
        ),
        lon: parseFloat(
          new URLSearchParams(location.search).get("longitude") || "0"
        ),
        alt_m: 35,
      }}
    />
  );
}
