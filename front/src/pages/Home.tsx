import Map from "../components/Map";
import SearchBar from "../components/SearchBar";
import { useState } from "react";
import type { Position } from "../interfaces/IPosition";
import { usePositionHistory } from "../hooks/usePositionHistory";
import CardHistoryPosition from "../components/CardHistoryPosition";
import { useNavigateToSky } from "../hooks/useNavigateToSky.ts";
import Avatar from "../components/Avatar.tsx";
import DialogLogin from "../components/DialogLogin.tsx";
import { useAuth } from "../contexts/useAuthContext";
import DialogRegister from "../components/DialogRegister";

function Home() {
  const [selectedVille, setSelectedVille] = useState<string | null>(null);
  const { positions } = usePositionHistory();
  const navigateToSky = useNavigateToSky();
  const { isAuthenticated, logout, username } = useAuth();

  function handleClick(pos: Position) {
    console.log(pos);
    navigateToSky(pos.lng, pos.lat);
  }

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
      <DialogLogin />
      <DialogRegister />
    </div>
  );
}

export default Home;
