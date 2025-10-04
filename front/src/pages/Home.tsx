import Map from "../components/Map";
import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";
import type { Position } from "../interfaces/IPosition";
import { usePositionHistory } from "../hooks/usePositionHistory";
import CardHistoryPosition from "../components/CardHistoryPosition";
import { navigateToSky } from "../lib/nav";

const positionsPlaceholder: Position[] = [
    { id: "1", lat: 28.5618, lng: -80.577,   timestamp: new Date().toISOString(), title: "Kennedy Space Center" },
    { id: "2", lat: 34.6328, lng: -120.6108, timestamp: new Date().toISOString(), title: "Vandenberg Space Force Base" },
    { id: "3", lat: 51.885,  lng: -176.6403, timestamp: new Date().toISOString(), title: "McMurdo Station" },
    { id: "4", lat: 29.5597, lng: -95.0831,  timestamp: new Date().toISOString(), title: "Johnson Space Center" },
];

function Home() {
    const [selectedVille, setSelectedVille] = useState<string | null>(null);
    const { positions, addMany } = usePositionHistory();

    useEffect(() => {
        addMany(positionsPlaceholder);
    }, [addMany]);

    function handleClick(pos: Position) {
        navigateToSky(pos.lng, pos.lat);
    }

    return (
        <div className="w-full min-h-screen grid grid-cols-3 grid-rows-1 gap-2 bg-neutral">
            <div className="flex flex-col items-center p-4">
                <SearchBar searchCity={true} setCity={setSelectedVille} />
                <div className="flex flex-col gap-4 my-4 w-full">
                    {positions.map((pos) => (
                        <CardHistoryPosition key={pos.id} {...pos} onClick={() => handleClick(pos)} />
                    ))}
                </div>
            </div>

            <div className="w-full h-full col-span-2">
                <Map selectedCity={selectedVille} />
            </div>
        </div>
    );
}

export default Home;
