// services/matchesService.js
// Data-access layer for matches. Every screen/component that needs match
// data should go through this file rather than talking to api/footballApi.js
// (or any data source) directly.
//
// Layering:
//   screens/components -> hooks/useLiveMatches -> services/matchesService -> api/footballApi
//
// This file owns app-level shaping/business rules on top of raw API data
// (e.g. limiting how many matches a preview rail shows). It intentionally
// knows nothing about mock data, fetch(), or network details — that all
// lives behind footballApi.js, which is the only file that changes when
// a real football API is wired in.

import {
  fetchLiveMatches as fetchMatches,
  fetchTodayFixtures,
  fetchFinishedMatches,
} from '../api/providerManager';

/**
 * Fetch live matches.
 * Unchanged from before — preserved exactly so existing
 * screens/components keep working without modification.
 * @param {Object} [options]
 * @param {number} [options.limit] - if provided, returns only the first N matches.
 * @returns {Promise<Array>}
 */
export async function getLiveMatches({ limit } = {}) {
  const matches = await fetchMatches();
  return typeof limit === 'number' ? matches.slice(0, limit) : matches;
}

/**
 * Fetch today's fixtures that haven't started yet ("upcoming").
 * @param {Object} [options]
 * @param {number} [options.limit] - if provided, returns only the first N fixtures.
 * @returns {Promise<Array>}
 */
export async function getTodayFixtures({ limit } = {}) {
  const fixtures = await fetchTodayFixtures();
  return typeof limit === 'number' ? fixtures.slice(0, limit) : fixtures;
}

/**
 * Fetch today's fixtures that have finished.
 * @param {Object} [options]
 * @param {number} [options.limit] - if provided, returns only the first N matches.
 * @returns {Promise<Array>}
 */
export async function getFinishedMatches({ limit } = {}) {
  const matches = await fetchFinishedMatches();
  return typeof limit === 'number' ? matches.slice(0, limit) : matches;
}