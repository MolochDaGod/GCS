/** Safe post-save redirect back to a fleet app (Warlords, RTS, etc.). */

const RETURN_HOST_RE =
  /(^|\.)grudge-studio\.com$|(^|\.)grudgewarlords\.com$|\.vercel\.app$/i;

export function readReturnToFromUrl() {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('returnTo');
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!RETURN_HOST_RE.test(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * After a character is saved + activated, send the player back to the
 * calling game if returnTo was provided on launch.
 */
export function redirectAfterCharacterSave(characterId) {
  const returnTo = readReturnToFromUrl();
  if (!returnTo) return false;
  const url = new URL(returnTo);
  url.searchParams.set('characterId', characterId);
  url.searchParams.set('from', 'gcs');
  window.location.assign(url.href);
  return true;
}