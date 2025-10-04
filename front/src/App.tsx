import { usePositionHistory } from './hooks/usePositionHistory'
import './App.css'

function App() {
  const { positions, addPosition } = usePositionHistory()

  // Exemple d'ajout d'une position (à appeler lors d'un clic sur carte, etc.)
  const handleAddPosition = () => {
    // Exemple avec des coordonnées NASA
    addPosition(
      28.5618, 
      -80.577, 
      'Kennedy Space Center',
      'Centre spatial Kennedy, Floride'
    ),
    addPosition(
      34.6328, 
      -120.6108,
      'Vandenberg Space Force Base',
      'Base de lancement de Vandenberg, Californie'
    ),
    addPosition(
      51.885,
      -176.6403,
      'McMurdo Station',
      'Station McMurdo, Antarctique'
    ),
    addPosition(
      29.5597,
      -95.0831,
      'Johnson Space Center',
      'Centre spatial Johnson, Texas'
    ),
    addPosition(
      37.4143,
      -122.0574,
      'NASA Ames Research Center',
      'Centre de recherche Ames de la NASA, Californie'
    ),
    addPosition(
      40.4292,
      -86.9141,
      'Lunar Reconnaissance Orbiter',
      'Orbiteur de reconnaissance lunaire'
    ),
    addPosition(
      34.2007,
      -118.1719,
      'NASA Jet Propulsion Laboratory',
      'Laboratoire de propulsion par réaction de la NASA, Californie'
    )
  }

  return (
    <div className="drawer">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />
      
      <div className="drawer-content">
        <label
          htmlFor="app-drawer"
          className="fab-btn btn btn-square bg-base-200 text-base-content shadow-none rounded-none hover:bg-base-300 border-l-0 border-r border-base-300 focus-visible:outline-none"
          aria-label="Ouvrir le menu"
        >
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
          </svg>
        </label>
        
        {/* Bouton de test pour ajouter une position */}
        <div className="p-4">
          <button 
            onClick={handleAddPosition}
            className="btn btn-primary"
          >
            Ajouter position test
          </button>
        </div>
      </div>

      <div className="drawer-side">
        <label htmlFor="app-drawer" aria-label="close sidebar" className="drawer-overlay"></label>

        <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4">
          <li><a href="#">Home</a></li>
          <li><a href="#">Map</a></li>

          <li>
            <details open>
              <summary>History ({positions.length})</summary>
              <ul className="space-y-2 p-0">
                {positions.length === 0 ? (
                  <li className="text-sm opacity-60 p-2">Aucune position visitée</li>
                ) : (
                  positions.map((pos) => (
                    <li key={pos.id} className="!p-0">
                      <div className="card bg-base-100 shadow-sm">
                        <div className="card-body p-3">
                          <h3 className="card-title text-sm">
                            {pos.title || `Position ${pos.id.slice(0, 8)}`}
                          </h3>
                          <p className="text-xs opacity-70">
                            {pos.description || 'Position visitée'}
                          </p>
                          <div className="text-xs font-mono opacity-60">
                            {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
                          </div>
                          <div className="text-xs opacity-50">
                            {new Date(pos.timestamp).toLocaleString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </details>
          </li>

          <li><a href="#">Settings</a></li>
        </ul>
      </div>
    </div>
  )
}

export default App
