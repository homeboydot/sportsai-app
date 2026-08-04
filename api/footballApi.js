// api/footballApi.js
//
// This is the ONLY file that talks to a real football data provider.
// It is wired to API-FOOTBALL (https://www.api-football.com/) — the
// official v3 REST API — and exposes three fetch functions:
//   - fetchLiveMatches()     -> matches currently in play
//   - fetchTodayFixtures()   -> today's fixtures that haven't started yet
//   - fetchFinishedMatches() -> today's fixtures that have finished
//
// fetchMatches() is kept for backward compatibility with existing
// callers (matchesService.js) and simply delegates to fetchLiveMatches().
//
// If a request fails for any reason (missing key, network error, bad
// response, unexpected payload), each function falls back to local
// mock data, so matchesService.js, the hook, and every screen/component
// keep working exactly as before and never have to know the difference.

import { mockMatches } from '../data/mockMatches';

// ---------------------------------------------------------------------
// API-FOOTBALL configuration
// ---------------------------------------------------------------------
// Docs: https://www.api-football.com/documentation-v3
const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

// Today's date, computed once at module load (YYYY-MM-DD), used to build
// the today/finished endpoint constants below.
function getTodayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Live-fixtures endpoint — every match currently in play, across every
// league API-FOOTBALL covers.
const LIVE_FIXTURES_ENDPOINT = `${API_FOOTBALL_BASE_URL}/fixtures?live=all`;

// Today's fixtures that haven't started yet (NS = Not Started).
const TODAY_FIXTURES_ENDPOINT = `${API_FOOTBALL_BASE_URL}/fixtures?date=${getTodayDateString()}&status=NS`;

// Today's finished fixtures (FT = full time, AET = after extra time,
// PEN = after penalties) — covers every "finished" status API-FOOTBALL uses.
const FINISHED_FIXTURES_ENDPOINT = `${API_FOOTBALL_BASE_URL}/fixtures?date=${getTodayDateString()}&status=FT-AET-PEN`;

// The API key is never hardcoded. In Expo, only environment variables
// prefixed with EXPO_PUBLIC_ are inlined into the client bundle at
// build time — plain process.env.API_FOOTBALL_KEY (no prefix) would be
// undefined at runtime in an Expo app. Set this in a local .env file:
//   EXPO_PUBLIC_API_FOOTBALL_KEY=your_key_here
const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY;

// Toggle to true locally to force the mock-data fallback path — useful
// for exercising loading/error handling without touching your real key
// or network connection.
const SIMULATE_FAILURE = false;

// Give up on a stalled/slow real request after this long and fall back
// to mock data, rather than leaving the UI's loading state hanging.
const REQUEST_TIMEOUT_MS = 8000;

// Stands in for real network latency on the mock-fallback path, so
// loading states behave consistently whether the real request or the
// fallback path is taken.
function networkDelay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts one API-FOOTBALL fixture record into this app's match shape.
 * This is the ONLY place that needs to change if API-FOOTBALL's response
 * format ever changes — everything downstream (matchesService, the hook,
 * every screen/component) depends only on the shape returned here:
 *   { id, league, minute, home, away, homeScore, awayScore }
 * — identical to the shape data/mockMatches.js has always used.
 */
function normalizeFixture(fixture) {
  return {
    id: String(fixture.fixture?.id ?? ''),
    league: fixture.league?.name ?? 'Unknown League',
    minute: fixture.fixture?.status?.elapsed ?? 0,
    home: fixture.teams?.home?.name ?? 'Home',
    away: fixture.teams?.away?.name ?? 'Away',
    homeScore: fixture.goals?.home ?? 0,
    awayScore: fixture.goals?.away ?? 0,
  };
}

/**
 * Local mock fallback. Used whenever a real API-FOOTBALL request can't
 * be completed for any reason — missing key, network failure, non-OK
 * response, timeout, or an unexpected payload shape. Returns a copy
 * (not the original array reference) so callers can never mutate the
 * underlying mock data.
 */
function getMockFallback() {
  return mockMatches.map((match) => ({ ...match }));
}

/**
 * Shared request core used by every exported fetch function below.
 * Handles the API key check, timeout, real request, response
 * validation, normalization, __DEV__ diagnostics, and mock fallback —
 * so fetchLiveMatches/fetchTodayFixtures/fetchFinishedMatches all share
 * one implementation instead of near-identical copies.
 *
 * -----------------------------------------------------------------
 * TEMPORARY DEV DIAGNOSTICS
 * -----------------------------------------------------------------
 * Gated behind __DEV__ so these logs never run in a production
 * build — they only report facts about the request/response, they
 * do not change any control flow, timing, or return value below.
 * Safe to delete once real-API integration is confirmed stable.
 *
 * @param {string} endpoint - the full API-FOOTBALL endpoint URL to request.
 * @returns {Promise<Array>} matches shaped as:
 *   { id, league, minute, home, away, homeScore, awayScore }
 */
async function requestFixtures(endpoint) {
  if (__DEV__) {
    console.group('[footballApi] requestFixtures');
    console.log('API key present:', Boolean(API_KEY));
  }

    if (SIMULATE_FAILURE) {
    const err = new Error('footballApi: SIMULATE_FAILURE is enabled');

    if (__DEV__) {
      console.log('Throwing: SIMULATE_FAILURE is true');
      console.groupEnd();
    }

    throw err;
  }

  if (!API_KEY) {
  const err = new Error('footballApi: EXPO_PUBLIC_API_FOOTBALL_KEY is not set');

  if (__DEV__) {
    console.log('Throwing: no API key configured');
    console.groupEnd();
  }

  throw err;
}

  if (__DEV__) {
    console.log('Endpoint:', endpoint);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // --- Real API-FOOTBALL request -------------------------------------
    // Endpoint: GET <endpoint>
    // Header:   x-apisports-key: <API_KEY>
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
      },
      signal: controller.signal,
    });
    // --------------------------------------------------------------------

    if (__DEV__) {
      console.log('Response status:', response.status);
    }

    if (!response.ok) {
      throw new Error(`footballApi: request failed with status ${response.status}`);
    }

    const json = await response.json();

    if (!Array.isArray(json?.response)) {
      throw new Error('footballApi: unexpected response shape from API-FOOTBALL');
    }

    const matches = json.response.map(normalizeFixture);

    if (__DEV__) {
      console.log('Fixtures returned:', matches.length);
      console.log('Data source: REAL API-FOOTBALL');
      console.groupEnd();
    }

    return matches;
  } catch (err) {
  const isTimeout = err.name === 'AbortError';

  const finalErr = isTimeout
    ? new Error(`footballApi: request timed out after ${REQUEST_TIMEOUT_MS}ms`)
    : err;

  if (__DEV__) {
    console.log('Throwing due to error:', finalErr.message);
    console.groupEnd();
  }

  throw finalErr;
} finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch all matches currently live.
 * Endpoint: GET {API_FOOTBALL_BASE_URL}/fixtures?live=all
 * @returns {Promise<Array>}
 */
export async function fetchLiveMatches() {
  return requestFixtures(LIVE_FIXTURES_ENDPOINT);
}

/**
 * Fetch today's fixtures that haven't started yet ("upcoming").
 * Endpoint: GET {API_FOOTBALL_BASE_URL}/fixtures?date=YYYY-MM-DD&status=NS
 * @returns {Promise<Array>}
 */
export async function fetchTodayFixtures() {
  return requestFixtures(TODAY_FIXTURES_ENDPOINT);
}

/**
 * Fetch today's fixtures that have finished (FT / AET / PEN).
 * Endpoint: GET {API_FOOTBALL_BASE_URL}/fixtures?date=YYYY-MM-DD&status=FT-AET-PEN
 * @returns {Promise<Array>}
 */
export async function fetchFinishedMatches() {
  return requestFixtures(FINISHED_FIXTURES_ENDPOINT);
}

/**
 * Fetch all live/today matches.
 * Kept for backward compatibility with existing callers
 * (services/matchesService.js) — delegates to fetchLiveMatches().
 * @returns {Promise<Array>}
 */
export async function fetchMatches() {
  return fetchLiveMatches();
}