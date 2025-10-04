import Map from "../components/Map";
import SearchBar from "../components/SearchBar";
import { useState } from "react";
import type { Position } from "../interfaces/IPosition";
import { usePositionHistory } from "../hooks/usePositionHistory";
import CardHistoryPosition from "../components/CardHistoryPosition";
import { useNavigateToSky } from "../hooks/useNavigateToSky.ts";

function Home() {
  const [selectedVille, setSelectedVille] = useState<string | null>(null);
  const { positions } = usePositionHistory();
  const navigateToSky = useNavigateToSky();

  function handleClick(pos: Position) {
    console.log(pos);
    navigateToSky(pos.lng, pos.lat);
  }

  return (
    <div className="w-full min-h-screen grid grid-cols-3 grid-rows-1 bg-[#131517]">
      <div className="flex flex-col items-center py-4 pl-4">
        <SearchBar searchCity={true} setCity={setSelectedVille} />
        <div className="flex flex-col gap-4 my-4 w-full">
          <ul className="flex flex-col gap-2 overflow-y-hidden">
            {positions.map((pos) => (
              <CardHistoryPosition
                key={pos.id}
                {...pos}
                onClick={() => handleClick(pos)}
              />
            ))}
          </ul>
        </div>
      </div>

      <div className="w-full h-full col-span-2 overflow-hidden p-4">
        <Map selectedCity={selectedVille} />
      </div>
    </div>
  );
}

export default Home;
