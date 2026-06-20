/**
 * Grudge fleet auth — token storage, SSO pickup, launch-token bridge.
 */

const AUTH_TOKEN_KEY = 'grudge_auth_token';
const LEGACY_SESSION_TOKEN_KEY = 'grudge_session_token';

export function getToken() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_SESSION_TOKEN_KEY);
}

export function setToken(token) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(LEGACY_SESSION_TOKEN_KEY, token);
}

export function isAuthenticated() {
  return !!getToken();
}

export function authHeaders() {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'X-Session-Token': token }
    : {};
}

function storeSsoProfile(ssoToken, grudgeId, username) {
  setToken(ssoToken);
  if (typeof localStorage === 'undefined') return;
  if (grudgeId) {
    localStorage.setItem('grudge_id', grudgeId);
    localStorage.setItem('grudge_account_id', grudgeId);
  }
  if (username) localStorage.setItem('grudge_username', username);
}

/** Bridge id.grudge-studio.com launch token → Railway Bearer JWT via /api/auth/puter */
export async function bridgeGrudgeLaunchToken(launchToken) {
  try {
    const exchange = await fetch('https://api.grudge-studio.com/api/auth/session/exchange', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: launchToken,
        audience: typeof window !== 'undefined' ? window.location.origin : undefined,
      }),
    });
    if (!exchange.ok) return false;
    const profile = await exchange.json();

    const bridge = await fetch('/api/auth/puter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puterId: `grudge_${profile.grudgeId}`,
        puterUuid: `grudge_${profile.grudgeId}`,
        displayName: profile.displayName || profile.username,
      }),
    });
    if (!bridge.ok) return false;

    const data = await bridge.json();
    const token = data.sessionToken || data.token;
    if (!token) return false;
    setToken(token);
    if (profile.grudgeId) {
      localStorage.setItem('grudge_id', profile.grudgeId);
      localStorage.setItem('grudge_account_id', profile.grudgeId);
    }
    if (profile.username) localStorage.setItem('grudge_username', profile.username);
    return true;
  } catch {
    return false;
  }
}

/** Pick up sso_token or grudge_token from URL on page load. */
export function pickupSsoFromUrl() {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const launchToken = params.get('grudge_token');
    if (launchToken && !isAuthenticated()) {
      params.delete('grudge_token');
      const clean = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (clean ? `?${clean}` : '') + window.location.hash);
      bridgeGrudgeLaunchToken(launchToken).catch(() => {});
      return;
    }
    const ssoToken = params.get('sso_token');
    if (ssoToken) {
      storeSsoProfile(
        ssoToken,
        params.get('grudge_id') || params.get('grudgeId') || '',
        params.get('grudge_username') || params.get('username') || '',
      );
      ['sso_token', 'grudge_id', 'grudgeId', 'grudge_username', 'username'].forEach((k) => params.delete(k));
      const clean = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (clean ? `?${clean}` : '') + window.location.hash);
    }
  } catch { /* SSR guard */ }
}