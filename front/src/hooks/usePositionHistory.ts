import {useState, useEffect, useCallback} from 'react'
import type {Position} from "../interfaces/IPosition.ts";

const STORAGE_KEY = 'position_history'
const MAX_HISTORY = 5

export function usePositionHistory() {
  const [positions, setPositions] = useState<Position[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setPositions(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
    }
  }, [])

  // Sauvegarder automatiquement à chaque changement
  useEffect(() => {
    if (positions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
    }
  }, [positions])

  const addPosition = (lat: number, lng: number, title?: string, description?: string) => {
    const newPosition: Position = {
      id: crypto.randomUUID(),
      lat,
      lng,
      timestamp: new Date().toISOString(),
      title,
      description
    }

    setPositions(prev => {
      // Vérifier si cette position existe déjà (même lat/lng)
      const exists = prev.find(p => 
        Math.abs(p.lat - lat) < 0.00001 && Math.abs(p.lng - lng) < 0.00001
      )
      
      if (exists) return prev
      
      // Ajouter en tête et garder seulement les MAX_HISTORY dernières
      return [newPosition, ...prev.slice(0, MAX_HISTORY - 1)]
    })
  }

  const addMany = useCallback((items: Position[]) => {
    setPositions(prev => {
      const seen = new Set(prev.map(p => p.id));
      const toAdd = items.filter(p => !seen.has(p.id));
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });
  }, []);

  const removeLastElement = () => setPositions(prev => prev.slice(0, -1));

  const clearHistory = () => {
    setPositions([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    positions,
    addPosition,
    clearHistory,
    addMany,
    removeLastElement
  }
}
