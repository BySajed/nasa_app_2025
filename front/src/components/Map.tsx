/*"use client";
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { centerOfMass } from "@turf/turf";
import osmtogeojson from 'osmtogeojson';

const NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface MapProps {
    selectedCity: string | null
}

const Map: React.FC<MapProps> = ({ selectedCity }) => {


    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [districts, setDistricts] = useState<FeatureCollection<Polygon> | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [districtsInformation, setDistrictsInformation] = useState<{ uuid: string, city: string, name: string }[]>([]);

    async function fetchGeoJsonData(city: string) {
        const query = `
        [out:json];
        relation
          ["name"="${city}"]
          ["boundary"="administrative"]
          ["type"="boundary"]
          ["admin_level"~"^(6|8)$"];
        out geom;
    `;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }

    async function fetchCityGpsCoordinates(city: string) {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`)
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.features[0].geometry.coordinates;
    }

    const createMarkerJoinInterface = (name: string) => {
        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
                        <div class="card w-fit card-xs">
                          <div class="card-body">
                            <h2 class="card-title">${name}</h2>
                            <div class="card-actions">
                              <button class="btn btn-primary popup-button" data-id="${name}">Rejoindre le quartier</button>
                            </div>
                          </div>
                        </div>
                    `);

        popup.on('open', () => {
            if (popup.getElement() !== undefined) {
                // @ts-expect-error c'est pas un bug
                const button = popup.getElement().querySelector('.popup-button') as HTMLElement;
                if (button) {
                    button.addEventListener('click', async () => {
                        if (!selectedCity) return;
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const joinAndRedirect = async (city: string, districtName: string) => {
                            const districtUuid = await join(selectedCity, name);
                            return districtUuid.data.uuid
                        }
                        const uuid = await joinAndRedirect(selectedCity, name);
                        window.location.href = `/districts/${uuid}`;
                    });
                }
            }
        })
        return popup
    }

    const getDistrictUuid = async (city: string, name: string) => {
        if (!selectedCity) return null;
        const district = districtsInformation.find((district) => district.name === name);
        if (!district) return null;
        return {
            uuid: district.uuid,
            city: district.city,
            name: district.name
        };
    }

    const createMarkerEditInterface = async (name: string) => {
        if (!selectedCity) return;

        const districtInfo = await getDistrictUuid(selectedCity, name);

        const content = districtInfo != null ? `
        <div class="card w-fit card-xs">
          <div class="card-body">
            <h2 class="card-title">${name}</h2>
            <div class="card-actions">
              <button class="btn btn-primary popup-button" data-id="${name}">Éditer le quartier</button>
            </div>
          </div>
        </div>
    ` : `
        <div class="card w-fit card-xs">
          <div class="card-body">
            <h2 class="card-title">${name}</h2>
            <p class="text-sm text-gray-500">Ce quartier n’a pas encore été créé.</p>
          </div>
        </div>
    `;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(content);

        popup.on('open', () => {
            const popupElement = popup.getElement();
            if (!popupElement) return;

            const button = popupElement.querySelector('.popup-button') as HTMLElement | null;
            if (!button) return;

            button.addEventListener('click', () => {
                if (!districtInfo) return;
                window.location.href = `/backoffice/districts/${districtInfo.uuid}`;
            });
        });


        return popup;
    };

    const clearMarkers = () => {
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
    };

    async function createMarkers(districts: FeatureCollection<Polygon>) {
        clearMarkers();
        for (const feature of districts.features) {
            const center = centerOfMass(feature).geometry.coordinates;
            const name = feature.properties?.name || "Quartier";

            if (center && !isNaN(center[0]) && !isNaN(center[1])) {
                const popup = manageDistricts
                    ? await createMarkerEditInterface(name)
                    : createMarkerJoinInterface(name);

                const markerElement = document.createElement('div');
                markerElement.style.backgroundImage = "url('/icons/marker.svg')";
                markerElement.style.backgroundSize = 'cover';
                markerElement.style.width = '48px';
                markerElement.style.height = '48px';
                markerElement.style.borderRadius = '50%';
                markerElement.style.cursor = 'pointer';
                markerElement.style.animation = 'pulse 1.5s infinite';
                markerElement.classList.add('marker');

                const marker = new mapboxgl.Marker({ element: markerElement })
                    .setLngLat([center[0], center[1]])
                    .setPopup(popup!)
                    .addTo(mapRef.current as mapboxgl.Map);

                markersRef.current.push(marker);
            } else {
                console.error("Invalid coordinates for feature:", feature);
            }
        }
    }


    async function generateDistricts(selectedCity: string) {

        const geoJsonDataResponse = await fetchGeoJsonData(selectedCity);
        const geoJsonData = osmtogeojson(geoJsonDataResponse);

        if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0 || !geoJsonData.features[0].geometry) {
            throw new Error('Invalid GeoJSON data');
        }
        return await createDistrictMap(geoJsonData.features[0] as Feature<Polygon>, selectedCity);
    }

    async function loadDistricts(city: string) {

        const districtsResponse = await getDistrictsByCityName(city);
        let districts = districtsResponse.data[0]?.districts;

        if (!districtsResponse || districtsResponse.data.length === 0) {
            districts = await generateDistricts(city) as Neighborhood[];
            storeGeneratedDistricts(city, districts)
        }

        return districts as Neighborhood[];
    }

    // UseEffect pour gérer la création des districts
    useEffect(() => {
        if (!mapRef.current || !districts) return;

        //if (manageDistricts && districtsInformation.length === 0) return;

        const renderMarkers = async () => {
            await createMarkers(districts);
        };

        renderMarkers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [districts, selectedCity, districtsInformation, manageDistricts]);

    useEffect(() => {
        clearMarkers();
    }, [selectedCity]);



    // UseEffect pour charger les informations des districts
    useEffect(() => {
        if (!selectedCity || !manageDistricts) return;

        const loadDistrictsInformation = async () => {
            const districtInfoResponse = await getDistrictsInformationByCity(selectedCity);
            setDistrictsInformation(districtInfoResponse?.data ?? []);
        };

        loadDistrictsInformation();
    }, [selectedCity, manageDistricts]);

    // UseEffect pour charger les districts
    useEffect(() => {
        if (!selectedCity) return;
        const run = async () => {

            const districts = await loadDistricts(selectedCity);

            setDistricts({ type: "FeatureCollection", features: districts as Neighborhood[] });

        };
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCity]);

    // UseEffect pour initialiser la carte
    useEffect(() => {
        if (mapRef.current) return;
        if (!mapContainerRef.current) return;

        mapboxgl.accessToken = NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current as HTMLDivElement,
            center: [2.3522, 48.8566],
            zoom: 12
        });
    }, []);

    // UseEffect pour mettre à jour la carte avec les districts
    useEffect(() => {
        if (!mapRef.current || !districts) return;

        if (mapRef.current.getSource('districts')) {
            (mapRef.current.getSource('districts') as mapboxgl.GeoJSONSource).setData(districts);
        } else {
            mapRef.current.addSource('districts', {
                type: 'geojson',
                data: districts
            });

            mapRef.current.addLayer({
                id: 'districts-layer',
                type: 'fill',
                source: 'districts',
                paint: {
                    'fill-color': '#88C7BC',
                    'fill-opacity': 0.5
                }
            });

            mapRef.current.addLayer({
                id: 'districts-name',
                type: 'symbol',
                source: 'districts',
                layout: {
                    'text-field': ['get', 'name'],
                    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                    'text-size': 12
                },
                paint: {
                    'text-color': '#000000'
                }
            });

            mapRef.current.addLayer({
                id: 'districts-border',
                type: 'line',
                source: 'districts',
                paint: {
                    'line-color': '#017679',
                    'line-width': 2
                }
            });

            //mapRef.current.setLayoutProperty('country-label', 'text-field', ['get', 'name_fr']);
        }
    }, [districts, selectedCity]);

    //UseEffect du flyTo
    useEffect(() => {
        if (!selectedCity || !mapRef.current) return;

        fetchCityGpsCoordinates(selectedCity).then((coordinates) => {
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

    if (!NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
        console.error('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is not defined');
    }


    return (
        <div
            style={{ height: '100%', width: "100%", position: 'relative' }}
            ref={mapContainerRef}
            className="map-container"
        />
    );
};

export default Map;*/