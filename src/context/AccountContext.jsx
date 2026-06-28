import React, { createContext, useState, useEffect } from "react"
import {
  isAuthenticated, buildLoginUrl, logout as apiLogout,
  getGrudgeId, getAccountId, getAuthToken,
  getCharactersEnvelope, activateCharacter as apiActivateCharacter,
} from "../services/grudgeAPI"
import { mergeEraSlots, ERA_META } from "../lib/gameEras"

export const AccountContext = createContext()

export const AccountProvider = (props) => {
  const [grudgeId, setGrudgeId] = useState(getGrudgeId())
  const [accountId, setAccountId] = useState(getAccountId())
  const [connected, setConnected] = useState(isAuthenticated())
  const [characters, setCharacters] = useState([])
  const [eraSlots, setEraSlots] = useState(() => mergeEraSlots())
  const [gameEra, setGameEra] = useState(
    () => localStorage.getItem('gcs_game_era') || 'warlords'
  )
  const [activeCharacterId, setActiveCharacterId] = useState(
    localStorage.getItem('grudge_active_character') || null
  )

  const loadRoster = async (era = gameEra) => {
    const envelope = await getCharactersEnvelope(era)
    const slots = mergeEraSlots(envelope.eraSlots)
    setEraSlots(slots)
    setCharacters(envelope.characters || [])
    const activeId = slots[era]?.activeCharacterId
      || envelope.characters?.find(c => c.activeForEra)?.id
      || envelope.characters?.[0]?.id
      || null
    if (activeId) {
      setActiveCharacterId(activeId)
      localStorage.setItem('grudge_active_character', activeId)
    }
    return envelope
  }

  // Check for SSO callback token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ssoToken = params.get('sso_token')
    const ssoGrudgeId = params.get('grudge_id')
    const ssoUsername = params.get('grudge_username')

    if (ssoToken) {
      localStorage.setItem('grudge_auth_token', ssoToken)
      if (ssoGrudgeId) localStorage.setItem('grudge_id', ssoGrudgeId)
      if (ssoUsername) localStorage.setItem('grudge_username', ssoUsername)
      setGrudgeId(ssoGrudgeId || '')
      setConnected(true)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Load era roster when connected or era changes
  useEffect(() => {
    if (connected) {
      loadRoster(gameEra).catch(() => {})
    }
  }, [connected, gameEra])

  // React to launcher / popup auth handoff (grudge-auth-updated custom event or storage)
  useEffect(() => {
    const refreshAuth = () => {
      const hasToken = !!localStorage.getItem('grudge_auth_token')
      setConnected(hasToken)
      setGrudgeId(getGrudgeId() || '')
      if (hasToken) {
        loadRoster(gameEra).catch(() => {})
      }
    }
    window.addEventListener('grudge-auth-updated', refreshAuth)
    // Also catch storage events (cross-tab) and focus
    const onStorage = (e) => { if (e.key && e.key.includes('grudge')) refreshAuth() }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', refreshAuth)
    return () => {
      window.removeEventListener('grudge-auth-updated', refreshAuth)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', refreshAuth)
    }
  }, [])

  const login = () => {
    // Prefer the rich popup flow used by the Grudge Launcher / Hydra (id.grudge-studio.com/api/auth/page)
    // Falls back to redirect if popup helper not present.
    if (typeof window !== 'undefined' && window.openGrudgeSSO) {
      window.openGrudgeSSO()
      return
    }
    window.location.href = buildLoginUrl(window.location.href)
  }

  const logout = () => {
    apiLogout()
    setConnected(false)
    setGrudgeId('')
    setCharacters([])
    setActiveCharacterId(null)
  }

  const selectCharacter = async (id) => {
    setActiveCharacterId(id)
    localStorage.setItem('grudge_active_character', id)
    if (connected && id) {
      try {
        const result = await apiActivateCharacter(id, gameEra)
        if (result?.eraSlots) setEraSlots(mergeEraSlots(result.eraSlots))
      } catch {
        // non-blocking — local selection still works offline
      }
    }
  }

  const switchEra = (era) => {
    setGameEra(era)
    localStorage.setItem('gcs_game_era', era)
  }

  return (
    <AccountContext.Provider
      value={{
        // Auth state
        grudgeId,
        accountId,
        connected,
        login,
        logout,
        // Character state
        characters,
        setCharacters,
        activeCharacterId,
        selectCharacter,
        gameEra,
        setGameEra: switchEra,
        eraSlots,
        eraMeta: ERA_META,
        refreshRoster: () => loadRoster(gameEra),
        // Legacy compat (some components may reference these)
        walletAddress: grudgeId,
        setWalletAddress: setGrudgeId,
        ensName: null,
        setEnsName: () => {},
        setConnected,
        OTTokens: [],
        setOTTokens: () => {},
      }}
    >
      {props.children}
    </AccountContext.Provider>
  )
}
