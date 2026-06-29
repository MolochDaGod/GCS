import React from "react"
import { normalizeGameEra, readEraFromUrl } from "../lib/gameEras"

export const CameraMode = {
  NORMAL: "NORMAL",
  AR: "AR",
  AR_FRONT: "AR_FRONT",
  VR: "VR",
}

export const ViewMode = {
  LANDING: "LANDING",
  CREATE: "CREATE",
  CLAIM: "CLAIM",
  LOAD: "LOAD",
  APPEARANCE: "APPEARANCE",
  BATCHDOWNLOAD: "BATCHDOWNLOAD",
  SAVE: "SAVE",
  MINT: "MINT",
  OPTIMIZER: "OPTIMIZER",
  BATCHMANIFEST: "BATCHMANIFEST",
  WALLET: "WALLET"
}

export const ViewContext = React.createContext()

export const ViewProvider = (props) => {
  const [currentCameraMode, setCurrentCameraMode] = React.useState(CameraMode.NORMAL)
  const initialViewMode = () => {
    if (typeof window === 'undefined') return ViewMode.LANDING
    const mode = new URLSearchParams(window.location.search).get('mode')
    if (mode === 'create') return ViewMode.CREATE
    return ViewMode.LANDING
  }

  const [viewMode, setViewMode] = React.useState(initialViewMode)
  const [isLoading, setIsLoading] = React.useState(false)
  const [mouseIsOverUI, setMouseIsOverUI] = React.useState(false)
  const [gameEra, setGameEraState] = React.useState(() => {
    const stored = localStorage.getItem('gcs_game_era')
    return normalizeGameEra(stored || readEraFromUrl())
  })

  const setGameEra = React.useCallback((era) => {
    const normalized = normalizeGameEra(era)
    setGameEraState(normalized)
    localStorage.setItem('gcs_game_era', normalized)
    const url = new URL(window.location.href)
    url.searchParams.set('era', normalized)
    window.history.replaceState({}, '', url.pathname + url.search)
  }, [])

  return (
    <ViewContext.Provider value={{
      viewMode, setViewMode,
      isLoading, setIsLoading,
      mouseIsOverUI, setMouseIsOverUI,
      currentCameraMode, setCurrentCameraMode,
      gameEra, setGameEra,
    }}>
      {props.children}
    </ViewContext.Provider>
  )
}