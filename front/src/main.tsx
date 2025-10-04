import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LunarCalendar from './components/LunarCalendar.tsx'
import './style.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LunarCalendar />
    <App />
  </StrictMode>,
)
