import './App.css'

function App() {
  return (
    <div className="drawer">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content relative">
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



      </div>

      <div className="drawer-side">
        <label htmlFor="app-drawer" aria-label="close sidebar" className="drawer-overlay"></label>

        <ul className="menu bg-base-200 text-base-content min-h-full w-80 p-4">
          <li><a href='#'>Home</a></li>

          <li>
            <a href='#'>Map</a>
          </li>

          <li>
            <details>
              <summary>History</summary>
              <ul>
                {/* Add history items here */}
                <li><a href='#'>Show more...</a></li>
              </ul>
            </details>
          </li>

          <li><a href='#'>Settings</a></li>
        </ul>
      </div>
    </div>
  )
}

export default App
