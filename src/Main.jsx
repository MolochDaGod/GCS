import { Web3Provider } from "@ethersproject/providers"
import { Web3ReactProvider } from "@web3-react/core"
import React, { Suspense } from "react"
import ReactDOM from "react-dom/client"
import { AudioProvider } from "./context/AudioContext"

import { AccountProvider } from "./context/AccountContext"
import { SceneProvider } from "./context/SceneContext"
import { ViewProvider } from "./context/ViewContext"

import { SoundProvider } from "./context/SoundContext"

// import i18n (needs to be bundled ;))
import "./lib/localization/i18n"

import App from "./App"
import { LanguageProvider } from "./context/LanguageContext"
import { wireGrudgeFleet } from "./lib/fleet"

wireGrudgeFleet({ skipAuthPickup: true }).catch(() => {})

// ── Grudge Unified Auth consume (matches launcher + Nexus Nemesis exactly) ──
// Supports: direct launch from Hydra with ?grudge_token=... , popup postMessage from id.grudge-studio.com/api/auth/page
// Stores to the keys grudgeAPI.js + AccountContext already read.
;(function consumeGrudgeAuth() {
  try {
    const sp = new URLSearchParams(location.search)
    const hs = new URLSearchParams((location.hash || '').replace(/^#/, ''))
    const token = sp.get('grudge_token') || sp.get('token') || hs.get('token') || hs.get('grudge_token')
    if (token) {
      localStorage.setItem('grudge_auth_token', token)
      localStorage.setItem('access_token', token)
      const grudgeId = sp.get('grudgeId') || hs.get('grudgeId') || sp.get('gid') || hs.get('gid') || ''
      const name = sp.get('name') || hs.get('name') || sp.get('username') || hs.get('username') || 'Player'
      if (grudgeId) localStorage.setItem('grudge_id', grudgeId)
      localStorage.setItem('grudge_username', name)
      localStorage.setItem('user_data', JSON.stringify({ username: name, grudgeId: grudgeId || undefined }))
      // Clean URL
      let cleanSearch = location.search
      if (cleanSearch) {
        const params = new URLSearchParams(cleanSearch)
        ;['token', 'grudge_token', 'grudgeId', 'gid', 'name'].forEach(k => params.delete(k))
        cleanSearch = params.toString() ? '?' + params.toString() : ''
      }
      const cleanHash = (location.hash && !location.hash.includes('token')) ? location.hash : ''
      window.history.replaceState(null, '', location.pathname + cleanSearch + cleanHash)
    }
  } catch (e) {}
})()

// ── Global postMessage listener for Grudge ID SSO popup handoff (from launcher or direct) ──
if (typeof window !== 'undefined' && !(window).__grudgeSsoListenerInstalled) {
  ;(window).__grudgeSsoListenerInstalled = true
  window.addEventListener('message', (event) => {
    const origin = event.origin || ''
    if (!/id\.grudge-studio\.com$/.test(origin) && !/grudge-studio\.com$/.test(origin) && !/localhost/.test(origin)) return
    const data = event.data || {}
    const t = data.type
    if (t !== 'grudge:auth:success' && t !== 'grudge-auth:success') return
    const token = data.token || data.access_token || (data.user && (data.user.token || data.user.access_token))
    if (!token) return
    try {
      localStorage.setItem('grudge_auth_token', token)
      localStorage.setItem('access_token', token)
      const gUser = data.user || data.player || {}
      const gid = gUser.grudgeId || gUser.id || data.grudgeId || ''
      if (gid) localStorage.setItem('grudge_id', gid)
      const uname = gUser.username || gUser.displayName || gUser.name || 'Player'
      localStorage.setItem('grudge_username', uname)
      localStorage.setItem('user_data', JSON.stringify({ ...gUser, username: uname, grudgeId: gid || undefined }))
      try {
        const w = window
        if (w.__grudgePopup && !w.__grudgePopup.closed) w.__grudgePopup.close()
      } catch {}
      // Force AccountContext + grudgeAPI consumers to see it
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('grudge-auth-updated'))
        // Refresh to ensure providers re-mount with new localStorage state
        if (!location.search.includes('reloaded')) {
          const sep = location.search ? '&' : '?'
          window.location.href = location.pathname + location.search + sep + 'reloaded=1' + location.hash
        }
      }, 60)
    } catch (e) {}
  })
}

// ── Helper to open canonical Grudge ID page (rich popup with providers + connections) ──
;(window).openGrudgeSSO = function openGrudgeSSO() {
  try {
    const env = (import.meta && import.meta.env) || {}
    const authBase = env.VITE_GRUDGE_AUTH_URL || env.VITE_AUTH_GATEWAY || 'https://id.grudge-studio.com'
    const appParam = 'gcs'
    const audience = 'gcs-character-studio'
    const origin = window.location.origin
    const url = `${authBase}/api/auth/page?app=${appParam}&audience=${audience}&origin=${encodeURIComponent(origin)}`
    const popup = window.open(url, 'grudge-sso', 'width=480,height=720,popup=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes')
    ;(window).__grudgePopup = popup
    if (!popup) {
      window.location.href = url
      return
    }
    setTimeout(() => {
      try { popup.postMessage({ type: 'grudge-auth:init', origin: window.location.origin }, authBase) } catch {}
    }, 450)
    const iv = setInterval(() => {
      if (!popup || popup.closed) { clearInterval(iv); (window).__grudgePopup = null }
    }, 800)
    setTimeout(() => clearInterval(iv), 45000)
  } catch (e) {
    const authBase = 'https://id.grudge-studio.com'
    window.location.href = `${authBase}/api/auth/page?app=gcs`
  }
}

const getLibrary = (provider) => {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <AccountProvider>
        <LanguageProvider>
          <AudioProvider>
            <ViewProvider>
              <SceneProvider>
                <SoundProvider>
                  <Suspense>
                    <App />
                  </Suspense>
                </SoundProvider>
              </SceneProvider>
            </ViewProvider>
          </AudioProvider>
        </LanguageProvider>
      </AccountProvider>
    </Web3ReactProvider>
  </React.StrictMode>,
)
