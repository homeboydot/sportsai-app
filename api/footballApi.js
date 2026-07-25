// api/footballApi.js
//
// This is the ONLY file that talks to a real football data provider.
// It is wired to API-FOOTBALL (https://www.api-football.com/) — the
// official v3 REST API. If a request fails for any reason (missing
// key, network error, bad response, unexpected payload), this file
// falls back to local mock data, so matchesService.js, the hook, and
// every screen/component keep working exactly as before and never
// have to know the difference.

import { mockMatches } from '../data/mockMatches';

// ---------------------------------------------------------------------
// API-FOOTBALL configuration
// ---------------------------------------------------------------------
// Docs: https://www.api-football.com/documentation-v3
const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

// Live-fixtures endpoint — every match currently in play, across every
// league API-FOOTBALL covers. This is the single endpoint used here.
const LIVE_FIXTURES_ENDPOINT = `${API_FOOTBALL_BASE_URL}/fixtures?live=all`;

// The API key is never hardcoded. In Expo, only environment variables
// prefixed with EXPO_PUBLIC_ are inlined into the client bundle at
// build time — plain process.env.API_FOOTBALL_KEY (no prefix) would be
// undefined at runtime in an Expo app. Set this in a local .env file:
//   EXPO_PUBLIC_API_FOOTBALL_KEY=your_key_here
const API_KEY = process.env.EXPO_PUBLIC_API_FOOTBALL_KEY;

// Toggle to true locally to force the mock-data fallback path — useful
// for exercising loading/error handling without touching your real key
// or network connection.
const FORCE_MOCK_FALLBACK = false;

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
 * Local mock fallback. Used whenever the real API-FOOTBALL request
 * can't be completed for any reason — missing key, network failure,
 * non-OK response, timeout, or an unexpected payload shape. Returns a
 * copy (not the original array reference) so callers can never mutate
 * the underlying mock data.
 */
function getMockFallback() {
  return mockMatches.map((match) => ({ ...match }));
}

/**
 * Fetch all live/today matches.
 *
 * Tries the real API-FOOTBALL live-fixtures endpoint first; on any
 * failure, falls back to mock data so the rest of the app never has to
 * handle a rejected promise for this reason.
 *
 * -----------------------------------------------------------------
 * TEMPORARY DEV DIAGNOSTICS
 * -----------------------------------------------------------------
 * Gated behind __DEV__ so these logs never run in a production
 * build — they only report facts about the request/response, they
 * do not change any control flow, timing, or return value below.
 * Safe to delete once real-API integration is confirmed stable.
 *
 * @returns {Promise<Array>} matches shaped as:
 *   { id, league, minute, home, away, homeScore, awayScore }
 */
export async function fetchMatches() {
  if (__DEV__) {
    console.group('[footballApi] fetchMatches');
    console.log('API key present:', Boolean(API_KEY));
  }

  if (FORCE_MOCK_FALLBACK) {
    if (__DEV__) {
      console.log('Data source: MOCK (FORCE_MOCK_FALLBACK is true)');
      console.groupEnd();
    }
    await networkDelay();
    return getMockFallback();
  }

  if (!API_KEY) {
    // No key configured — go straight to mock data rather than issuing
    // a request we already know the provider will reject.
    console.warn(
      'footballApi: EXPO_PUBLIC_API_FOOTBALL_KEY is not set — falling back to mock match data.'
    );
    if (__DEV__) {
      console.log('Data source: MOCK (no API key configured)');
      console.groupEnd();
    }
    return getMockFallback();
  }

  if (__DEV__) {
    console.log('Endpoint:', LIVE_FIXTURES_ENDPOINT);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // --- Real API-FOOTBALL request -------------------------------------
    // Endpoint: GET {API_FOOTBALL_BASE_URL}/fixtures?live=all
    // Header:   x-apisports-key: <API_KEY>
    const response = await fetch(LIVE_FIXTURES_ENDPOINT, {
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
    // Any failure here — network error, timeout, bad status, malformed
    // payload — falls back to mock data rather than surfacing an error
    // all the way up to the UI. Keeps the app visually identical and
    // fully functional even when the real API is unreachable.
    console.warn('footballApi: falling back to mock data —', err.message);
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