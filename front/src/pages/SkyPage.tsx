import { useEffect, useState } from "react";
import { getVisibleStars, type Star } from "../api/sky";
import { Sky } from "../components/sky/Sky";

export function SkyPage() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    getVisibleStars(0, 0).then((stars) => {
      console.log("stars", stars);
      return setStars(stars);
    });
  }, []);

  if (stars.length === 0) {
    return <div className="loading loading-spinner loading-md"></div>;
  }

  return <Sky stars={stars} />;
}
