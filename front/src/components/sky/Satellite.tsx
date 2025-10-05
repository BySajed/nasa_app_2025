import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";

import type {
    SatelliteDetailsResponse,
    SatelliteObject,
} from "../../api/satellites";
import { getSatelliteDetails } from "../../api/satellites";
import satelliteIcon from "../../assets/satellite.svg";

type Observer = { lat: number; lon: number; alt_m?: number };

type SatellitesLayerProps = {
    satellites: SatelliteObject[];
    displayRadius: number;
    onSelect?: (satellite: SatelliteObject) => void;
};

export function SatellitesLayer({
    satellites,
    displayRadius,
    onSelect,
}: SatellitesLayerProps) {
    return (
        <>
            {satellites.map((satellite) => (
                <SatelliteSprite
                    key={satellite.props.norad_id}
                    object={satellite}
                    displayRadius={displayRadius}
                    onClick={() => onSelect?.(satellite)}
                />
            ))}
        </>
    );
}

type SatelliteSpriteProps = {
    object: SatelliteObject;
    displayRadius: number;
    onClick: () => void;
};

function SatelliteSprite({ object, displayRadius, onClick }: SatelliteSpriteProps) {
    const texture = useLoader(THREE.TextureLoader, satelliteIcon);
    const spriteRef = useRef<THREE.Sprite>(null);

    useEffect(() => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.needsUpdate = true;
    }, [texture]);

    const position = useMemo(
        () => projectSatellitePosition([object.x, object.y, object.z], displayRadius),
        [displayRadius, object.x, object.y, object.z]
    );

    const distanceKm = useMemo(
        () => Math.sqrt(object.x ** 2 + object.y ** 2 + object.z ** 2),
        [object.x, object.y, object.z]
    );

    useFrame(({ camera, size }) => {
        const sprite = spriteRef.current;
        if (!sprite) return;

        const perspective = camera as THREE.PerspectiveCamera;
        const distanceToCamera = displayRadius;
        const vFov = (perspective.fov * Math.PI) / 180;
        const worldHeight = 2 * Math.tan(vFov / 2) * distanceToCamera;
        const worldPerPixel = worldHeight / size.height;

        const desiredPixels = THREE.MathUtils.clamp(
            10 + Math.log10(distanceKm + 1) * 1.5,
            8,
            18
        );
        const worldSize = Math.max(6, desiredPixels * worldPerPixel);
        sprite.scale.set(worldSize, worldSize, 1);
    });

    return (
        <group position={position} renderOrder={25}>
            <sprite
                ref={spriteRef}
                onClick={(event) => {
                    event.stopPropagation();
                    onClick();
                }}
            >
                <spriteMaterial
                    map={texture}
                    transparent
                    depthWrite={false}
                    depthTest={false}
                    toneMapped={false}
                    opacity={0.98}
                />
            </sprite>
        </group>
    );
}

type SatelliteDetailsPanelProps = {
    satellite: SatelliteObject;
    observer: Observer;
    onClose: () => void;
};

export function SatelliteDetailsPanel({
    satellite,
    observer,
    onClose,
}: SatelliteDetailsPanelProps) {
    const [details, setDetails] = useState<SatelliteDetailsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setDetails(null);
        getSatelliteDetails(satellite.props.norad_id, {
            lat: observer.lat,
            lon: observer.lon,
            alt_m: observer.alt_m,
            stepSec: 60,
        })
            .then((data) => {
                if (!cancelled) setDetails(data);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || "Fetch error");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [satellite.props.norad_id, observer.lat, observer.lon, observer.alt_m]);

    const orbitType =
        satellite.props.orbit?.type || details?.info.orbit?.type || "?";

    return (
        <div className="absolute top-4 right-4 w-80 max-h-[80vh] overflow-auto bg-black/80 text-white p-4 rounded shadow-xl border border-white/20 backdrop-blur">
            <div className="flex justify-between items-start mb-2 gap-2">
                <h2 className="font-semibold text-sm leading-tight">
                    {satellite.name}
                    <span className="block text-[10px] opacity-60 font-normal mt-0.5">
                        NORAD {satellite.props.norad_id}
                    </span>
                </h2>
                <button
                    onClick={onClose}
                    className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20"
                >
                    Close
                </button>
            </div>
            <div className="text-xs space-y-1">
                <p>
                    Orbit: <span className="font-medium">{orbitType}</span>
                </p>
                <p>
                    Altitude: {satellite.props.altitude_km.toFixed(0)} km | Range: {" "}
                    {satellite.props.range_km.toFixed(0)} km
                </p>
                <p>Speed: {satellite.props.speed_kms.toFixed(2)} km/s</p>
                {satellite.props.tle_age_hours && (
                    <p>
                        TLE age: {satellite.props.tle_age_hours.toFixed(1)} h
                    </p>
                )}
                {loading && <p className="opacity-70">Loading details…</p>}
                {error && <p className="text-red-300">{error}</p>}
                {details && (
                    <div className="pt-2 border-t border-white/10 space-y-1">
                        {details.info.orbit?.period_min && (
                            <p>Period: {details.info.orbit.period_min.toFixed(1)} min</p>
                        )}
                        <p>
                            Timeline points: {details.info.timeline.length} (step 60s)
                        </p>
                        <div>
                            <p className="font-medium mt-2 mb-1">Next points (az/el):</p>
                            <ul className="space-y-0.5 max-h-32 overflow-auto pr-1">
                                {details.info.timeline.slice(0, 5).map((point) => (
                                    <li key={point.t} className="opacity-80">
                                        {new Date(point.t).toLocaleTimeString(undefined, {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                        })}
                                        : {point.az.toFixed(0)}° / {point.el.toFixed(0)}°
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function projectSatellitePosition(
    coords: [number, number, number],
    displayRadius: number
): [number, number, number] {
    const [x, y, z] = scaleSatellitePosition(coords);
    const vec = new THREE.Vector3(x, y, z);
    if (vec.lengthSq() === 0) {
        return [0, 0, 0];
    }
    return vec.normalize().multiplyScalar(displayRadius).toArray() as [
        number,
        number,
        number
    ];
}

function scaleSatellitePosition(
    coords: [number, number, number]
): [number, number, number] {
    return [coords[0] / 1000, coords[1] / 1000, coords[2] / 1000];
}
