import Map from './components/Map';
import SearchBar from './components/SearchBar';
import { useState } from 'react';
function App() {
  const [selectedVille, setSelectedVille] = useState<string | null>(null);

  return (
    <div className="w-full min-h-screen grid grid-cols-3 grid-rows-1 gap-2 bg-neutral">
      <div className={"flex flex-col items-center p-4"}>
        <SearchBar searchCity={true} setCity={setSelectedVille} />
        <div className="flex flex-col gap-4 my-4 w-full">

        </div>
      </div>
      <div className=" w-full h-full col-span-2 ">
        <Map selectedCity={selectedVille} />
      </div>
    </div>
  )
}

export default App
