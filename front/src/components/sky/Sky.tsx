// front/src/components/sky/Sky.tsx
import * as THREE from "three";
import {Canvas, useFrame, useThree, useLoader} from "@react-three/fiber";
import {Stars, StarDetailsPanel} from "./Star";
import {SatelliteDetailsPanel, SatellitesLayer} from "./Satellite";
import type {SatelliteObject} from "../../api/satellites";
import {useMemo, useState} from "react";
import {scalePosition} from "./utils";
import {useCamera} from "./useCamera";
import {Planets, PlanetDetailsPanel} from "./Planet";
import type {Planet, Star} from "../../api/stars";
import GrassBlock from "../../assets/grass.png?url";

export function Sky({stars, satellites, planets, observer,}: {
    stars: Star[];
    satellites: SatelliteObject[];
    planets: Planet[];
    observer?: { lat: number; lon: number; alt_m?: number } | null;
}) {
    const {canvasProps, cameraProps, rotation, zoom} = useCamera();

    const [selectedSatellite, setSelectedSatellite] =
        useState<SatelliteObject | null>(null);

    const [selectedStar, setSelectedStar] = useState<Star | null>(null);

    const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);

    const skySphereRadius = useMemo(() => {
        const sample = stars.find((star) => !!star);
        if (!sample) {
            return 400;
        }
        const [sx, sy, sz] = scalePosition([sample.x, sample.y, sample.z]);
        return Math.sqrt(sx * sx + sy * sy + sz * sz) || 400;
    }, [stars]);

    function handleSelectSatellite(sat: SatelliteObject) {
        setSelectedSatellite(sat);
        setSelectedStar(null);
        setSelectedPlanet(null);
    }

    function handleSelectStar(star: Star) {
        setSelectedStar(star);
        setSelectedSatellite(null);
        setSelectedPlanet(null);
    }

    function handleSelectPlanet(planet: Planet) {
        setSelectedPlanet(planet);
        setSelectedSatellite(null);
        setSelectedStar(null);
    }

    return (
        <div className="w-screen h-screen relative">
            button to go the /
            <a href={"/"} className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded hover:bg-black/70">
                Back Home
            </a>
            <Canvas
                {...canvasProps}
                shadows
                scene={{
                    background: new THREE.Color(0x000000),
                }}
                camera={cameraProps}
            >
                <CameraController rotation={rotation} zoom={zoom}/>

                <directionalLight
                    intensity={0.8}
                    position={[100, 200, 100]}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                <ambientLight intensity={0.6}/>

                <Stars
                    stars={stars}
                    selectedStar={selectedStar}
                    onSelect={handleSelectStar}
                />
                <SatellitesLayer
                    satellites={satellites}
                    displayRadius={skySphereRadius}
                    onSelect={handleSelectSatellite}
                />
                <Planets
                    planets={planets}
                    selectedPlanet={selectedPlanet}
                    onSelect={handleSelectPlanet}
                />

                <EarthFloor radius={skySphereRadius} textureUrl={GrassBlock}/>
            </Canvas>

            {selectedSatellite && observer && (
                <SatelliteDetailsPanel
                    satellite={selectedSatellite}
                    observer={observer}
                    onClose={() => setSelectedSatellite(null)}
                />
            )}

            {selectedStar && (
                <StarDetailsPanel
                    star={selectedStar}
                    onClose={() => setSelectedStar(null)}
                />
            )}

            {selectedPlanet && (
                <PlanetDetailsPanel
                    planet={selectedPlanet}
                    onClose={() => setSelectedPlanet(null)}
                />
            )}
        </div>
    );
}

function CameraController({rotation, zoom,}: { rotation: [number, number, number]; zoom: number; }) {
    const {camera} = useThree();
    useFrame(() => {
        camera.rotation.set(...rotation);
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
    });
    return null;
}

function EarthFloor({ radius, textureUrl }: { radius: number; textureUrl: string; }) {
    const texture = useLoader(THREE.TextureLoader, textureUrl);

    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(100, 100);

    const size = Math.max(1000, radius * 6);

    return (
        <mesh
            position={[0, 0, -20]}
            receiveShadow
        >
            <planeGeometry args={[size, size]} />
            <meshStandardMaterial map={texture} side={THREE.DoubleSide} />
        </mesh>
    );
}
