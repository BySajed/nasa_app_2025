import { useCallback } from "react";
import { createSearchParams, useNavigate } from "react-router-dom";

export function useNavigateToSky() {
    const navigate = useNavigate();
    return useCallback((latitude: number, longitude: number) => {
        navigate({
            pathname: "/sky",
            search: `?${createSearchParams({
                latitude: String(latitude),
                longitude: String(longitude),
            })}`,
        });
    }, [navigate]);
}
