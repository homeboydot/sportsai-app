// api/footballApi.js
//
// This is the ONLY file that should ever know about a real football data
// provider (e.g. API-Football, SportRadar, football-data.org). Right now
// it returns mock data shaped exactly like a real API response would be
// after normalization, so that swapping the internals later — adding an
// endpoint URL, an API key, request headers — never requires touching
// matchesService.js, any hook, or any screen/component.
//
// Contract: every exported function here returns a Promise and can
// reject. Callers (matchesService.js) are responsible for deciding what
// to do with a rejection — this file just talks to "the network."

import { mockMatches } from '../data/mockMatches';

// Toggle this to true locally to exercise error-handling UI paths
// (loading/error states in useLiveMatches) without needing a real
// failing endpoint yet.
const SIMULATE_FAILURE = false;

// Stands in for real network latency so consumers already handle
// loading states correctly before a live endpoint exists.
function networkDelay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch all live/today matches from the football data provider.
 *
 * Real-implementation sketch (for the future):
 *   const res = await fetch(`${BASE_URL}/fixtures?live=all`, {
 *     headers: { Authorization: `Bearer ${API_KEY}` },
 *   });
 *   if (!res.ok) throw new Error(`footballApi: ${res.status}`);
 *   const json = await res.json();
 *   return normalizeFixtures(json);
 *
 * @returns {Promise<Array>} raw match records
 */
export async function fetchMatches() {
  await networkDelay();

  if (SIMULATE_FAILURE) {
    throw new Error('footballApi: failed to reach football data provider');
  }

  // Mock data doubles as "the provider's response" for now. Returning a
  // copy (not the original array reference) keeps this honest about
  // being a network boundary — callers should never be able to mutate
  // the underlying mock by mutating what they got back.
  return mockMatches.map((match) => ({ ...match }));
}
