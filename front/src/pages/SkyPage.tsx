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
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <img
          src="NASA_logo.svg"
          alt="NASA Logo"
          className="spin-twice"
        />
      </div>
    );
  }


  return <Sky stars={stars} />;
}
