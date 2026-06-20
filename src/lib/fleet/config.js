/**
 * Grudge Studio fleet — canonical service URLs and Vercel rewrite template.
 * TypeScript source of truth: GrudgeBuilder/client/src/lib/grudgeFleet.ts
 */

export const AUTH_GATEWAY = 'https://id.grudge-studio.com';
export const GAME_API = 'https://api.grudge-studio.com';
export const GAME_DATA_RAILWAY = 'https://grudge-builder-production.up.railway.app';
export const ASSETS_CDN = 'https://assets.grudge-studio.com';
export const AI_GATEWAY = 'https://ai.grudge-studio.com';
export const OBJECTSTORE = 'https://objectstore.grudge-studio.com/api/v1';

export const CROSSMINT_CHARACTER_COLLECTION = '5061318d-ff65-4893-ac4b-9b28efb18ace';
export const CROSSMINT_ISLAND_COLLECTION = 'a8f3e2d1-4b5c-6d7e-8f9a-0b1c2d3e4f5a';

export const GRUDGE_FLEET = {
  auth: AUTH_GATEWAY,
  identityApi: GAME_API,
  gameData: GAME_DATA_RAILWAY,
  assets: ASSETS_CDN,
  ai: AI_GATEWAY,
  objectStore: OBJECTSTORE,
  account: `${GAME_DATA_RAILWAY}/api/account`,
  characters: `${GAME_DATA_RAILWAY}/api/characters`,
  wallet: `${GAME_DATA_RAILWAY}/api/wallet`,
  nfts: `${GAME_DATA_RAILWAY}/api/nfts`,
  crossmint: {
    characterCollection: CROSSMINT_CHARACTER_COLLECTION,
    islandCollection: CROSSMINT_ISLAND_COLLECTION,
  },
};

/** API base for browser fetch — empty string = same-origin /api via Vercel rewrites. */
export function fleetApiBase() {
  if (typeof window === 'undefined') return GAME_DATA_RAILWAY;
  return '';
}

export function fleetApi(path) {
  const base = fleetApiBase();
  const clean = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${clean}` : clean;
}

export function buildSsoLoginUrl(returnOrigin) {
  const origin = returnOrigin
    || (typeof window !== 'undefined' ? window.location.origin : 'https://grudgewarlords.com');
  const redirectUri = `${origin}/auth/callback`;
  return `${AUTH_GATEWAY}/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/** Copy into vercel.json BEFORE the SPA catch-all. Order matters. */
export const VERCEL_FLEET_REWRITES = [
  { source: '/api/assets/:path*', destination: `${ASSETS_CDN}/:path*` },
  { source: '/api/characters', destination: `${GAME_DATA_RAILWAY}/api/characters` },
  { source: '/api/characters/:path*', destination: `${GAME_DATA_RAILWAY}/api/characters/:path*` },
  { source: '/api/wallet/:path*', destination: `${GAME_DATA_RAILWAY}/api/wallet/:path*` },
  { source: '/api/nfts/:path*', destination: `${GAME_DATA_RAILWAY}/api/nfts/:path*` },
  { source: '/api/island/:path*', destination: `${GAME_DATA_RAILWAY}/api/island/:path*` },
  { source: '/api/islands/:path*', destination: `${GAME_DATA_RAILWAY}/api/islands/:path*` },
  { source: '/api/account', destination: `${GAME_DATA_RAILWAY}/api/account` },
  { source: '/api/account/:path*', destination: `${GAME_DATA_RAILWAY}/api/account/:path*` },
  { source: '/api/inventory/:path*', destination: `${GAME_DATA_RAILWAY}/api/inventory/:path*` },
  { source: '/api/party/:path*', destination: `${GAME_DATA_RAILWAY}/api/party/:path*` },
  { source: '/api/auth/puter', destination: `${GAME_DATA_RAILWAY}/api/auth/puter` },
  { source: '/api/auth/login', destination: `${GAME_DATA_RAILWAY}/api/auth/login` },
  { source: '/api/auth/register', destination: `${GAME_DATA_RAILWAY}/api/auth/register` },
  { source: '/api/auth/me', destination: `${GAME_DATA_RAILWAY}/api/auth/me` },
  { source: '/api/auth/verify', destination: `${GAME_DATA_RAILWAY}/api/auth/verify` },
  { source: '/api/auth/session/exchange', destination: `${GAME_API}/api/auth/session/exchange` },
  { source: '/api/auth/:path*', destination: `${AUTH_GATEWAY}/auth/:path*` },
  { source: '/api/ai/:path*', destination: `${AI_GATEWAY}/:path*` },
  { source: '/api/:path*', destination: `${GAME_API}/api/:path*` },
];