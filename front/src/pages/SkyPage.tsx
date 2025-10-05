import { useEffect, useState } from "react";
import { getVisibleStars, type Star } from "../api/sky";
import { Sky } from "../components/sky/Sky";
import nasaLogo from "../assets/NASA_logo.svg";
import { useLocation } from "react-router-dom";

export function SkyPage() {
  const [stars, setStars] = useState<Star[]>([]);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const lat = parseFloat(searchParams.get("latitude") || "0");
    const lon = parseFloat(searchParams.get("longitude") || "0");
    getVisibleStars(lon, lat).then((stars) => setStars(stars));
  }, []);

  if (stars.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <img src={nasaLogo} alt="NASA Logo" className="spin-twice" />
      </div>
    );
  }

  return <Sky stars={stars} />;
}
