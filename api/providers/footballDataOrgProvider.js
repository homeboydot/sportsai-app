// api/providers/footballDataOrgProvider.js
//
// Provider implementation for football-data.org (https://www.football-data.org/).
// Follows the shared contract documented in api/providers/providerContract.js.
//
// STATUS: this file is standalone. Nothing in the app currently imports
// it — api/footballApi.js (API-FOOTBALL) remains the active, live data
// source and has not been modified. This provider exists so a future,
// explicit decision to switch (or add a provider-selection layer) has
// a working implementation ready to plug in, without having to touch
// any UI, screen, navigation, hook, or existing app behavior today.
//
// football-data.org v4 API docs: https://www.football-data.org/documentation/quickstart

const FOOTBALL_DATA_ORG_BASE_URL = 'https://api.football-data.org/v4';

// The API key is never hardcoded. In Expo, only environment variables
// prefixed with EXPO_PUBLIC_ are inlined into the client bundle at
// build time — plain process.env.FOOTBALL_DATA_ORG_KEY (no prefix)
// would be undefined at runtime in an Expo app. Set this in a local
// .env file:
//   EXPO_PUBLIC_FOOTBALL_DATA_ORG_KEY=your_key_here
const API_KEY = process.env.EXPO_PUBLIC_FOOTBALL_DATA_ORG_KEY;

// Give up on a stalled/slow real request after this long and fall back
// to mock data, rather than leaving a caller's loading state hanging.
// Matches the timeout already used in api/footballApi.js for consistency.
const REQUEST_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------
// Endpoint builders
// ---------------------------------------------------------------------
// Built per-call (not frozen at module load) so "today" is always
// accurate even if the app stays open across midnight.

function getTodayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// LIVE is a combined status football-data.org resolves to in-play +
// paused matches — the equivalent of API-FOOTBALL's `live=all`.
function buildLiveMatchesUrl() {
  return `${FOOTBALL_DATA_ORG_BASE_URL}/matches?status=LIVE`;
}

// Today's fixtures that haven't started yet ("upcoming").
function buildTodayFixturesUrl() {
  const today = getTodayDateString();
  return `${FOOTBALL_DATA_ORG_BASE_URL}/matches?dateFrom=${today}&dateTo=${today}&status=SCHEDULED`;
}

// Today's fixtures that have finished.
function buildFinishedMatchesUrl() {
  const today = getTodayDateString();
  return `${FOOTBALL_DATA_ORG_BASE_URL}/matches?dateFrom=${today}&dateTo=${today}&status=FINISHED`;
}

// ---------------------------------------------------------------------
// Mock fallback
// ---------------------------------------------------------------------
// Reuses the app's existing shared mock dataset (data/mockMatches.js is
// NOT modified). Since that dataset predates the `status` field this
// provider's contract requires, a status is synthesized here per match
// based on its minute — purely inside this provider, so the shared mock
// file itself stays untouched.

import { mockMatches } from '../../data/mockMatches';

function getMockFallback() {
  return mockMatches.map((match) => ({
    ...match,
    status: match.minute > 0 ? 'LIVE' : 'SCHEDULED',
  }));
}

// ---------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------

/**
 * Converts one football-data.org match record into this app's shared
 * normalized match shape. This is the only place that needs to change
 * if football-data.org's response format ever changes.
 */
function normalizeMatch(match) {
  return {
    id: String(match.id ?? ''),
    league: match.competition?.name ?? 'Unknown League',
    minute: match.minute ?? 0,
    home: match.homeTeam?.name ?? 'Home',
    away: match.awayTeam?.name ?? 'Away',
    homeScore: match.score?.fullTime?.home ?? 0,
    awayScore: match.score?.fullTime?.away ?? 0,
    status: match.status ?? 'UNKNOWN',
  };
}

// ---------------------------------------------------------------------
// Shared request core
// ---------------------------------------------------------------------

/**
 * Shared request core used by all three exported fetch functions below.
 * Handles the API key check, timeout, real request, response
 * validation, normalization, __DEV__ diagnostics, and mock fallback —
 * mirroring the pattern already established in api/footballApi.js so
 * this provider behaves consistently with the one currently in use.
 *
 * @param {() => string} buildUrl - builds the endpoint URL for this request.
 * @param {string} label - short name used in diagnostics/warnings.
 * @returns {Promise<Array>} matches shaped per the shared provider contract.
 */
async function requestMatches(buildUrl, label) {
  if (!API_KEY) {
    console.warn(
      `footballDataOrgProvider: EXPO_PUBLIC_FOOTBALL_DATA_ORG_KEY is not set — ${label} falling back to mock match data.`
    );
    return getMockFallback();
  }

  const endpoint = buildUrl();

  if (__DEV__) {
    console.group(`[footballDataOrgProvider] ${label}`);
    console.log('API key present:', Boolean(API_KEY));
    console.log('Endpoint:', endpoint);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // --- Real football-data.org request --------------------------------
    // Endpoint: GET <endpoint>
    // Header:   X-Auth-Token: <API_KEY>
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'X-Auth-Token': API_KEY,
      },
      signal: controller.signal,
    });
    // --------------------------------------------------------------------

    if (__DEV__) {
      console.log('Response status:', response.status);
    }

    if (!response.ok) {
      throw new Error(`footballDataOrgProvider: ${label} request failed with status ${response.status}`);
    }

    const json = await response.json();

    if (__DEV__) {
      // football-data.org reports request-level problems (quota,
      // plan restrictions, etc.) inside the JSON body rather than via
      // HTTP status — surfacing this proactively, since a similar gap
      // in api/footballApi.js's diagnostics was the root cause of a
      // recent debugging session.
      console.log('Errors field:', json?.errors);
      console.log('Result set count:', json?.resultSet?.count);
    }

    if (!Array.isArray(json?.matches)) {
      throw new Error(`footballDataOrgProvider: ${label} unexpected response shape from football-data.org`);
    }

    const matches = json.matches.map(normalizeMatch);

    if (__DEV__) {
      console.log('Matches returned:', matches.length);
      console.log('Data source: REAL football-data.org');
      console.groupEnd();
    }

    return matches;
  } catch (err) {
    console.warn(`footballDataOrgProvider: ${label} falling back to mock data —`, err.message);
    if (__DEV__) {
      console.log('Data source: MOCK (fallback due to error)');
      console.log('Fallback reason:', err.message);
      console.groupEnd();
    }
    return getMockFallback();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------
// Exported provider functions — same names/shape as api/footballApi.js,
// per the shared contract in api/providers/providerContract.js
// ---------------------------------------------------------------------

/**
 * Fetch all matches currently live.
 * Endpoint: GET {FOOTBALL_DATA_ORG_BASE_URL}/matches?status=LIVE
 * @returns {Promise<Array>}
 */
export async function fetchLiveMatches() {
  return requestMatches(buildLiveMatchesUrl, 'fetchLiveMatches');
}

/**
 * Fetch today's fixtures that haven't started yet ("upcoming").
 * Endpoint: GET {FOOTBALL_DATA_ORG_BASE_URL}/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&status=SCHEDULED
 * @returns {Promise<Array>}
 */
export async function fetchTodayFixtures() {
  return requestMatches(buildTodayFixturesUrl, 'fetchTodayFixtures');
}

/**
 * Fetch today's fixtures that have finished.
 * Endpoint: GET {FOOTBALL_DATA_ORG_BASE_URL}/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&status=FINISHED
 * @returns {Promise<Array>}
 */
export async function fetchFinishedMatches() {
  return requestMatches(buildFinishedMatchesUrl, 'fetchFinishedMatches');
}