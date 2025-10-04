import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Sky from "./pages/Sky";
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

const App = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sky" element={<Sky />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </BrowserRouter>
);

export default App;
