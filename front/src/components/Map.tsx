import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { MapProps } from '../interfaces/IMap';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined;


const Map: React.FC<MapProps> = ({ selectedCity }) => {


    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);

    async function fetchCityGpsCoordinates(city: string) {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${MAPBOX_ACCESS_TOKEN}`)
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.features[0].geometry.coordinates;
    }

    // UseEffect pour initialiser la carte
    useEffect(() => {
        if (mapRef.current) return;
        if (!mapContainerRef.current) return;

        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current as HTMLDivElement,
            center: [2.3522, 48.8566],
            zoom: 2.5,
        });
    }, []);

    //UseEffect du flyTo
    useEffect(() => {
        if (!selectedCity || !mapRef.current) return;

        fetchCityGpsCoordinates(selectedCity).then((coordinates) => {
            console.log(coordinates);
            mapRef.current?.flyTo({
                center: coordinates,
                zoom: 12.5,
                speed: 0.8,
                curve: 2,
                easing(t) {
                    return t;
                }
            });
        });
    }, [selectedCity]);

    if (!MAPBOX_ACCESS_TOKEN) {
        console.error('MAPBOX_ACCESS_TOKEN is not defined');
    }


    return (
        <div
            style={{ height: '100%', width: "100%", position: 'relative' }}
            ref={mapContainerRef}
            className="map-container"
        />
    );
};

export default Map;