import { useEffect, useState } from "react";
import { getVisibleStars, type Star } from "../api/stars";
import { Sky } from "../components/sky/Sky";
import nasaLogo from "../assets/NASA_logo.svg";
import { useLocation } from "react-router-dom";
import { getSatellites, type SatelliteObject } from "../api/satellites";

export function SkyPage() {
  const [stars, setStars] = useState<Star[]>([]);
  const [satellites, setSatellites] = useState<SatelliteObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const lat = parseFloat(searchParams.get("latitude") || "0");
    const lon = parseFloat(searchParams.get("longitude") || "0");
    const alt_m = 35; // default observer altitude (sync with backend settings)

    setLoading(true);
    setError(null);

    Promise.all([
      getVisibleStars(lon, lat),
      getSatellites({ lat, lon, alt_m, limit: 30, trackMode: "none" }),
    ])
      .then(([starsRes, satsRes]) => {
        setStars(starsRes);
        setSatellites(satsRes);
      })
      .catch((e) => {
        setError(e.message || "Failed loading sky data");
      })
      .finally(() => setLoading(false));
  }, [location.search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <img src={nasaLogo} alt="NASA Logo" className="spin-twice" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center h-screen w-full text-center text-white bg-black">
        <img src={nasaLogo} alt="NASA Logo" className="w-32 opacity-60" />
        <p className="text-red-300 text-sm max-w-sm">{error}</p>
        <button
          className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <Sky
      stars={stars}
      satellites={satellites}
      observer={{
        lat: parseFloat(new URLSearchParams(location.search).get("latitude") || "0"),
        lon: parseFloat(new URLSearchParams(location.search).get("longitude") || "0"),
        alt_m: 35,
      }}
    />
  );
}
