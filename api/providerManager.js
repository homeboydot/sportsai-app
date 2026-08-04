// api/providerManager.js
//
// Single entry point for all football data providers. This is
// scaffolding only — nothing in the app currently imports from this
// file yet. api/footballApi.js remains directly imported by
// services/matchesService.js for now; wiring this manager in as the
// app's actual data-access path is a separate, future decision.
//
// Phase 7 fallback flow:
//   1. Try API-Football (api/footballApi.js).
//      - If it succeeds, return its data.
//      - If it throws (network error, timeout, quota/API error,
//        malformed response — any real failure), go to step 2.
//   2. Try football-data.org (api/providers/footballDataOrgProvider.js).
//      - If it succeeds, return its data.
//      - If it also throws, go to step 3.
//   3. Return local mock data (data/mockMatches.js) as the last resort,
//      so a caller of this manager never has to handle a rejected
//      promise.
//
// This is now possible because api/footballApi.js no longer catches
// failures internally and silently returns mock data (Phase 7) — it
// throws instead, so this manager can actually tell success from
// failure and is now the ONLY place responsible for provider failover
// and mock-data fallback.
//
// A legitimate empty result (e.g. zero live matches right now) is NOT
// a failure — api/footballApi.js already resolves normally (with an
// empty array) in that case, so this manager's plain try/catch never
// mistakes "no matches" for "provider is broken."
//
// KNOWN LIMITATION: api/providers/footballDataOrgProvider.js was not
// modified this phase and still catches its own failures internally,
// returning its own mock fallback rather than throwing. That means the
// "if football-data.org also throws -> return mockMatches" branch
// below is implemented and ready, but currently unreachable in
// practice — football-data.org will always appear to succeed from this
// manager's point of view, even on a real failure. Giving
// footballDataOrgProvider.js the same throw-on-failure treatment
// api/footballApi.js just received is the natural next step to make
// this 3-tier flow fully functional end-to-end.
//
// Not modified to build this file:
//   - hooks/useLiveMatches.js
//   - services/matchesService.js
//   - api/providers/footballDataOrgProvider.js
//   - any screen, component, navigation, or theme file

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