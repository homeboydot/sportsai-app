// services/matchesService.js
// Data-access layer for matches. Every screen/component that needs match
// data should go through this file rather than importing mockMatches
// directly — that's the seam where a real API call replaces the mock
// later without any consumer code changing.

import { mockMatches } from '../data/mockMatches';

// Simulates the shape of a real network call (a Promise) so consumers
// already write their fetch/loading logic the way they will need to
// once this is backed by a live endpoint.
function simulateNetworkDelay(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch live matches.
 * @param {Object} [options]
 * @param {number} [options.limit] - if provided, returns only the first N matches.
 * @returns {Promise<Array>}
 */
export async function getLiveMatches({ limit } = {}) {
  await simulateNetworkDelay();
  return typeof limit === 'number' ? mockMatches.slice(0, limit) : mockMatches;
}
