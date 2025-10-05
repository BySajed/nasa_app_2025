import Map from "../components/Map";
import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";
import { usePositionHistory } from "../hooks/usePositionHistory";
import CardHistoryPosition from "../components/CardHistoryPosition";
import Avatar from "../components/auth/Avatar.tsx";
import DialogLogin from "../components/auth/DialogLogin.tsx";
import { useAuth } from "../contexts/useAuthContext";
import DialogRegister from "../components/auth/DialogRegister.tsx";
import { apiClient } from "../api/client";
import type { SpotRead } from "../interfaces/ISpotRead";
import { Trash2Icon } from "lucide-react";

const getSpots = async () => {
  try {
    const spots = await apiClient.get<SpotRead[]>("spots");
    return spots.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

function Home() {
  const [selectedVille, setSelectedVille] = useState<string | null>(null);
  const [externalTarget, setExternalTarget] = useState<{
    lng: number;
    lat: number;
    zoom?: number;
  } | null>(null);
  const { positions } = usePositionHistory();
  const [spots, setSpots] = useState<SpotRead[]>([]);
  const [isLoadingSpots, setIsLoadingSpots] = useState<boolean>(true);

  const { isAuthenticated, logout, username } = useAuth();

  function handleClick(lng: number, lat: number) {
    console.log(lng, lat);
    setExternalTarget({ lng, lat, zoom: 13.5 });
  }

  async function handleDeleteSpot(spotId: number) {
    try {
      await apiClient.delete(`spots/${spotId}`);
      setSpots((prev) => prev.filter((s) => s.id !== spotId));
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    setIsLoadingSpots(true);
    getSpots()
      .then((spots) => {
        setSpots(spots);
      })
      .finally(() => setIsLoadingSpots(false));
  }, []);

  return (
    <div className="w-full min-h-screen grid grid-cols-3 grid-rows-1 bg-[#131517]">
      <div className="flex flex-col items-center py-4 pl-4">
        <div className="flex flex-row gap-4 w-full items-center">
          <div className="dropdown dropdown-start">
            <div
              tabIndex={0}
              role="button"
              className="transition-all hover:bg-black hover:opacity-50"
            >
              <Avatar username={isAuthenticated ? username : null} />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-white text-black rounded-box z-1 w-52 p-2 shadow-sm mt-3 gap-2"
            >
              {!isAuthenticated ? (
                <>
                  <li>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        if (document) {
                          (
                            document.getElementById(
                              "login_modal"
                            ) as HTMLFormElement
                          ).showModal();
                        }
                      }}
                    >
                      Login
                    </button>
                  </li>
                  <li>
                    <button
                      className="btn btn-soft"
                      onClick={() => {
                        if (document) {
                          (
                            document.getElementById(
                              "register_modal"
                            ) as HTMLFormElement
                          ).showModal();
                        }
                      }}
                    >
                      Sign up
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome {username} !
                  </span>
                  <li>
                    <button
                      className="btn btn-soft btn-error btn-sm"
                      onClick={logout}
                    >
                      Déconnexion
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
          <SearchBar searchCity={true} setCity={setSelectedVille} />
        </div>
        <div className="flex flex-col gap-4 my-4 w-full min-h-0 overflow-hidden">
          <ul
            className="
              flex flex-col gap-2
              overflow-y-auto overflow-x-hidden overscroll-contain
              max-h-[calc(100dvh-8rem)] 
              pr-2                       
            "
          >
            {isLoadingSpots && (
              <>
                {[...Array(3)].map((_, i) => (
                  <li key={`skeleton-${i}`} className="w-full">
                    <div className="animate-pulse flex flex-col gap-2 p-3 rounded-lg bg-white/5">
                      <div className="h-4 bg-white/20 rounded w-1/2" />
                      <div className="h-3 bg-white/10 rounded w-2/3" />
                    </div>
                  </li>
                ))}
              </>
            )}
            {positions.map((pos) => (
              <CardHistoryPosition
                key={pos.id}
                {...pos}
                onClick={() => handleClick(pos.lng, pos.lat)}
              />
            ))}
            {!isLoadingSpots &&
              spots.map((spot) => (
                <div key={spot.id} className="relative group">
                  <CardHistoryPosition
                    id={spot.id.toString()}
                    lat={spot.latitude}
                    lng={spot.longitude}
                    timestamp={spot.created_at}
                    title={`📍 Spot de ${spot.owner.username} #${spot.id}`}
                    description={`Spot enregistré`}
                    onClick={() => handleClick(spot.longitude, spot.latitude)}
                  />
                  {isAuthenticated && username === spot.owner.username && (
                    <button
                      type="button"
                      className="btn btn-error btn-xs absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSpot(spot.id);
                      }}
                      aria-label={`Delete spot #${spot.id}`}
                    >
                      <Trash2Icon className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              ))}
          </ul>
        </div>
      </div>

      <div className="w-full h-full col-span-2 overflow-hidden p-4">
        <Map
          selectedCity={selectedVille}
          externalTarget={externalTarget}
          onSpotCreated={() => {
            getSpots().then((newSpots) => setSpots(newSpots));
          }}
        />
      </div>
      <DialogLogin />
      <DialogRegister />
    </div>
  );
}

export default Home;
