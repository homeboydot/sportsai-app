// api/providerManager.js
//
// Single entry point for all football data providers, and the ONLY
// place responsible for provider failover and mock-data fallback.
// services/matchesService.js imports from this file (not directly from
// api/footballApi.js) — an earlier version of this comment said
// otherwise; that was stale and caused real confusion in a past
// debugging session, so this has been corrected to describe what the
// code actually does.
//
// Fallback flow:
//   1. Try API-Football (api/footballApi.js).
//      - If it succeeds, return its data.
//      - If it throws (network error, timeout, quota/API error,
//        malformed response — any real failure), go to step 2.
//   2. Try football-data.org (api/providers/footballDataOrgProvider.js).
//      - If it succeeds, return its data.
//      - If it also throws, go to step 3.
//   3. Return local mock data (data/mockMatches.js) as the true last
//      resort, so a caller of this manager never has to handle a
//      rejected promise.
//
// A legitimate empty result (e.g. zero live matches right now) is NOT
// a failure — both providers already resolve normally (with an empty
// array) in that case, so this manager's plain try/catch never
// mistakes "no matches" for "provider is broken."
//
// CURRENT BEHAVIOR NOTE: api/providers/footballDataOrgProvider.js
// handles its own total failure internally by resolving with its own
// mock fallback rather than throwing — so in practice it always
// resolves successfully from this file's point of view, even when
// every real request it tried has failed. That means step 3's mock
// fallback below is implemented and will run correctly if it's ever
// reached, but in the app's current, real behavior it's effectively
// unreachable — football-data.org's own internal fallback gets there
// first. Left in place deliberately as a defensive last resort rather
// than removed, in case that provider's internal behavior ever
// changes.

import * as footballApi from './footballApi';
import * as footballDataOrgProvider from './providers/footballDataOrgProvider';
import { mockMatches } from '../data/mockMatches';

/**
 * Local mock fallback — the last resort, used only if BOTH providers
 * fail. Returns a copy (not the original array reference) so callers
 * can never mutate the underlying mock data.
 */
function getMockFallback() {
  return mockMatches.map((match) => ({ ...match }));
}

/**
 * Tries the primary provider (API-Football) first, falls back to the
 * secondary provider (football-data.org) if the primary throws, and
 * finally falls back to local mock data if the secondary also throws.
 * This is the ONLY place in the app responsible for provider failover
 * and mock fallback.
 *
 * @param {() => Promise<Array>} primaryFn
 * @param {() => Promise<Array>} fallbackFn
 * @param {string} label - short name for diagnostics (e.g. "fetchLiveMatches").
 * @returns {Promise<Array>}
 */
async function withProviderFallback(primaryFn, fallbackFn, label) {
  try {
    const result = await primaryFn();
    if (__DEV__) {
      console.log(`[providerManager] ${label}: API-Football succeeded (${result.length} results)`);
    }
    return result;
  } catch (primaryErr) {
    if (__DEV__) {
      console.warn(
        `[providerManager] ${label}: API-Football failed (${primaryErr.message}) — trying football-data.org`
      );
    }

    try {
      const fallbackResult = await fallbackFn();
      if (__DEV__) {
        console.log(`[providerManager] ${label}: football-data.org succeeded (${fallbackResult.length} results)`);
      }
      return fallbackResult;
    } catch (fallbackErr) {
      if (__DEV__) {
        console.warn(
          `[providerManager] ${label}: football-data.org also failed (${fallbackErr.message}) — using mock data`
        );
      }
      return getMockFallback();
    }
  }
}

/**
 * Fetch all matches currently live.
 * @returns {Promise<Array>}
 */
export async function fetchLiveMatches() {
  return withProviderFallback(
    footballApi.fetchLiveMatches,
    footballDataOrgProvider.fetchLiveMatches,
    'fetchLiveMatches'
  );
}

/**
 * Fetch today's fixtures that haven't started yet ("upcoming").
 * @returns {Promise<Array>}
 */
export async function fetchTodayFixtures() {
  return withProviderFallback(
    footballApi.fetchTodayFixtures,
    footballDataOrgProvider.fetchTodayFixtures,
    'fetchTodayFixtures'
  );
}

/**
 * Fetch today's fixtures that have finished.
 * @returns {Promise<Array>}
 */
export async function fetchFinishedMatches() {
  return withProviderFallback(
    footballApi.fetchFinishedMatches,
    footballDataOrgProvider.fetchFinishedMatches,
    'fetchFinishedMatches'
  );
}