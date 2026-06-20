/**
 * grudge-studio/fleet — ONE TRUTH wiring for the Grudge Studio fleet.
 *
 *   import { wireGrudgeFleet, loginWithGrudgeId } from 'grudge-studio/fleet';
 *   const sdk = await wireGrudgeFleet();
 *   await sdk.createCharacter({ name, raceId, classId });
 */

import {
  AUTH_GATEWAY,
  GAME_API,
  GAME_DATA_RAILWAY,
  ASSETS_CDN,
  AI_GATEWAY,
  OBJECTSTORE,
  GRUDGE_FLEET,
  CROSSMINT_CHARACTER_COLLECTION,
  CROSSMINT_ISLAND_COLLECTION,
  fleetApiBase,
  fleetApi,
  buildSsoLoginUrl,
  VERCEL_FLEET_REWRITES,
} from './config.js';

import {
  getToken,
  setToken,
  isAuthenticated,
  authHeaders,
  bridgeGrudgeLaunchToken,
  pickupSsoFromUrl,
} from './auth.js';

import { GrudgeAccountSDK } from './GrudgeAccountSDK.js';

export {
  AUTH_GATEWAY,
  GAME_API,
  GAME_DATA_RAILWAY,
  ASSETS_CDN,
  AI_GATEWAY,
  OBJECTSTORE,
  GRUDGE_FLEET,
  CROSSMINT_CHARACTER_COLLECTION,
  CROSSMINT_ISLAND_COLLECTION,
  fleetApiBase,
  fleetApi,
  buildSsoLoginUrl,
  VERCEL_FLEET_REWRITES,
  getToken,
  setToken,
  isAuthenticated,
  authHeaders,
  bridgeGrudgeLaunchToken,
  pickupSsoFromUrl,
  GrudgeAccountSDK,
};

/**
 * Wire a Grudge game to the fleet in one call.
 * @param {object} [opts]
 * @param {'standalone'|'embedded'} [opts.mode]
 * @param {string} [opts.apiBase]
 * @param {boolean} [opts.skipAuthPickup]
 */
export async function wireGrudgeFleet(opts = {}) {
  const { mode = 'standalone', apiBase, skipAuthPickup = false } = opts;

  if (!skipAuthPickup && typeof window !== 'undefined') {
    pickupSsoFromUrl();
    const params = new URLSearchParams(window.location.search);
    const launchToken = params.get('grudge_token');
    if (launchToken && !isAuthenticated()) {
      await bridgeGrudgeLaunchToken(launchToken);
    }
  }

  if (mode === 'embedded') {
    GrudgeAccountSDK.initEmbedded();
  } else {
    await GrudgeAccountSDK.init(apiBase ?? fleetApiBase());
  }

  return GrudgeAccountSDK;
}

/** Redirect user to Grudge ID login; returns to /auth/callback on this origin */
export function loginWithGrudgeId(returnPath = '/auth/callback') {
  if (typeof window === 'undefined') return;
  window.location.href = buildSsoLoginUrl(`${window.location.origin}${returnPath}`);
}