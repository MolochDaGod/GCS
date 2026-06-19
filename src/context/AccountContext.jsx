import React, { createContext, useState, useEffect } from "react"
import {
  isAuthenticated, buildLoginUrl, logout as apiLogout,
  getGrudgeId, getAccountId, getAuthToken, getCharacters,
} from "../services/grudgeAPI"

export const AccountContext = createContext()

export const AccountProvider = (props) => {
  const [grudgeId, setGrudgeId] = useState(getGrudgeId())
  const [accountId, setAccountId] = useState(getAccountId())
  const [connected, setConnected] = useState(isAuthenticated())
  const [characters, setCharacters] = useState([])
  const [activeCharacterId, setActiveCharacterId] = useState(
    localStorage.getItem('grudge_active_character') || null
  )

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

  // Load characters when connected
  useEffect(() => {
    if (connected) {
      getCharacters().then(chars => {
        setCharacters(chars)
        if (chars.length > 0 && !activeCharacterId) {
          setActiveCharacterId(chars[0].id)
          localStorage.setItem('grudge_active_character', chars[0].id)
        }
      })
    }
  }, [connected])

  // React to launcher / popup auth handoff (grudge-auth-updated custom event or storage)
  useEffect(() => {
    const refreshAuth = () => {
      const hasToken = !!localStorage.getItem('grudge_auth_token')
      setConnected(hasToken)
      setGrudgeId(getGrudgeId() || '')
      if (hasToken) {
        getCharacters().then(chars => setCharacters(chars)).catch(() => {})
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

  const selectCharacter = (id) => {
    setActiveCharacterId(id)
    localStorage.setItem('grudge_active_character', id)
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
