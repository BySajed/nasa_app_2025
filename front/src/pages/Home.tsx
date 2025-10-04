import Map from '../components/Map';
import SearchBar from '../components/SearchBar';
import { useState } from 'react';
import type { Position } from "../interfaces/IPosition.ts";
import {usePositionHistory} from "../hooks/usePositionHistory.ts";
import CardHistoryPosition from "../components/CardHistoryPosition";
import {navigateToSky} from "../lib/nav.ts";

const positionsPlaceholder: Position[] = [
    {
        id: '1',
        lat: 28.5618,
        lng: -80.577,
        timestamp: new Date().toISOString(),
        title: 'Kennedy Space Center',
    },
    {
        id: '2',
        lat: 34.6328,
        lng: -120.6108,
        timestamp: new Date().toISOString(),
        title: 'Vandenberg Space Force Base',
    },
    {
        id: '3',
        lat: 51.885,
        lng: -176.6403,
        timestamp: new Date().toISOString(),
        title: 'McMurdo Station',
    },
    {
        id: '4',
        lat: 29.5597,
        lng: -95.0831,
        timestamp: new Date().toISOString(),
        title: 'Johnson Space Center',
    },
    {
        id: '5',
        lat: 37.4143,
        lng: -122.0574,
        timestamp: new Date().toISOString(),
        title: 'NASA Ames Research Center',
    },
    {
        id: '6',
        lat: 40.4292,
        lng: -86.9141,
        timestamp: new Date().toISOString(),
        title: 'Lunar Reconnaissance Orbiter',
    },
    {
        id: '7',
        lat: 34.2007,
        lng: -118.1719,
        timestamp: new Date().toISOString(),
        title: 'NASA Jet Propulsion Laboratory',
    }
];
function Home() {
    const [selectedVille, setSelectedVille] = useState<string | null>(null);
    const { positions , addPosition } = usePositionHistory();

    positionsPlaceholder.forEach(pos => {
        if (!positions.find(p => p.id === pos.id)) {
            addPosition(pos.lat, pos.lng, pos.title, pos.description);
        }
    })

    function handleClick(Pos: Position) {
        navigateToSky(Pos.lng, Pos.lat);
    }

    return (
        <div className="w-full min-h-screen grid grid-cols-3 grid-rows-1 gap-2 bg-neutral">
            <div className={"flex flex-col items-center p-4"}>
                <SearchBar searchCity={true} setCity={setSelectedVille} />
                <div className="flex flex-col gap-4 my-4 w-full">
                    {
                        positions.map (pos => {
                            return <CardHistoryPosition key={pos.id} {...pos} onClick={() => handleClick(pos)}/>
                        })
                    }
                </div>
            </div>
            <div className=" w-full h-full col-span-2 ">
                <Map selectedCity={selectedVille} />
            </div>
        </div>
    )
}

export default Home
