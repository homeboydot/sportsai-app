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

// Competitions used as the per-competition fallback data source, when
// the global /matches endpoint legitimately returns zero results for
// today's date range (a known football-data.org behavior — the global
// endpoint is often sparse even when individual competitions have
// plenty of fixtures). All available on the football-data.org Tier One
// plan. Queried sequentially, one at a time, stopping at the first
// competition that returns matches — see requestCompetitionFallback().
const FALLBACK_COMPETITIONS = [
  'PL',   // Premier League
  'PD',   // La Liga
  'SA',   // Serie A
  'BL1',  // Bundesliga
  'FL1',  // Ligue 1
  'BSA',  // Brazilian Serie A
];

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

// Per-competition endpoint used by the fallback path below. Scoped to
// today's date range — without dateFrom/dateTo this endpoint returns
// the entire season (e.g. 380 matches) instead of today's fixtures.
function buildCompetitionMatchesUrl(code, status) {
  const today = getTodayDateString();
  return `${FOOTBALL_DATA_ORG_BASE_URL}/competitions/${code}/matches?status=${status}&dateFrom=${today}&dateTo=${today}`;
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
// Shared low-level request core
// ---------------------------------------------------------------------

/**
 * Performs the raw HTTP request against football-data.org and returns
 * the parsed `matches` array from the response, or throws. Contains no
 * fallback logic of its own — both the global-endpoint path and the
 * per-competition fallback path call this, so the fetch/timeout/header/
 * response-shape handling only exists in one place.
 *
 * @param {string} endpoint
 * @param {string} label - short name used in diagnostics/warnings.
 * @returns {Promise<Array>} raw (not yet normalized) match records.
 * @throws {Error} on a non-OK response, malformed payload, or timeout.
 */
async function performRequest(endpoint, label) {
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
      console.log(`[footballDataOrgProvider] ${label} response status:`, response.status);
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
      // past debugging session.
      console.log(`[footballDataOrgProvider] ${label} errors field:`, json?.errors);
      console.log(`[footballDataOrgProvider] ${label} resultSet.count:`, json?.resultSet?.count);
    }

    if (!Array.isArray(json?.matches)) {
      throw new Error(`footballDataOrgProvider: ${label} unexpected response shape from football-data.org`);
    }

    return json.matches;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------
// Global-endpoint request (first attempt)
// ---------------------------------------------------------------------

/**
 * Tries the global /matches endpoint. Returns a normalized array on
 * success (which may legitimately be empty), or throws on a real
 * failure. No mock fallback here — that decision belongs to the caller.
 */
async function requestGlobalMatches(buildUrl, label) {
  const endpoint = buildUrl();

  if (__DEV__) {
    console.group(`[footballDataOrgProvider] ${label}`);
    console.log('API key present:', Boolean(API_KEY));
    console.log('Endpoint:', endpoint);
  }

  try {
    const rawMatches = await performRequest(endpoint, label);
    const matches = rawMatches.map(normalizeMatch);

    if (__DEV__) {
      console.log('Matches returned:', matches.length);
      console.groupEnd();
    }

    return matches;
  } catch (err) {
    if (__DEV__) {
      console.log('Global endpoint failed:', err.message);
      console.groupEnd();
    }
    throw err;
  }
}

// ---------------------------------------------------------------------
// Per-competition fallback (used only when the global endpoint
// legitimately returns zero results)
// ---------------------------------------------------------------------

/**
 * Fetches one competition's matches for the given status, scoped to
 * today's date range. Never throws — if this competition's request
 * fails, it's logged and an empty array is returned, so one bad
 * competition can't take down the sequential fallback loop.
 */
async function requestCompetitionMatches(code, status, label) {
  const endpoint = buildCompetitionMatchesUrl(code, status);
  try {
    const rawMatches = await performRequest(endpoint, `${label}:${code}`);
    return rawMatches.map(normalizeMatch);
  } catch (err) {
    if (__DEV__) {
      console.warn(`[footballDataOrgProvider] ${label}: competition ${code} failed —`, err.message);
    }
    return [];
  }
}

/**
 * Queries FALLBACK_COMPETITIONS one at a time, in order, stopping as
 * soon as a competition returns matches. Used when the global endpoint
 * succeeds but legitimately returns zero matches for today. Sequential
 * (not parallel) so a typical "some competition has matches" case only
 * costs a handful of requests instead of always querying every
 * competition — important on football-data.org's free-plan rate limit.
 *
 * @param {string} status - 'LIVE' | 'SCHEDULED' | 'FINISHED'
 * @param {string} label - short name for diagnostics.
 * @returns {Promise<Array>} normalized matches from the first
 *   competition with results, or an empty array if none have any.
 */
async function requestCompetitionFallback(status, label) {
  if (__DEV__) {
    console.log(
      `[footballDataOrgProvider] ${label}: global endpoint returned 0 — trying per-competition fallback sequentially (${FALLBACK_COMPETITIONS.join(', ')})`
    );
  }

  for (const code of FALLBACK_COMPETITIONS) {
    const matches = await requestCompetitionMatches(code, status, label);

    if (matches.length > 0) {
      if (__DEV__) {
        console.log(
          `[footballDataOrgProvider] ${label}: competition ${code} returned ${matches.length} matches — stopping fallback here`
        );
      }
      return matches;
    }

    if (__DEV__) {
      console.log(`[footballDataOrgProvider] ${label}: competition ${code} returned 0 — trying next competition`);
    }
  }

  if (__DEV__) {
    console.log(`[footballDataOrgProvider] ${label}: all competitions returned 0 matches`);
  }

  return [];
}

// ---------------------------------------------------------------------
// Top-level orchestrator — global endpoint, then competition fallback
// on legitimate zero, then mock data as the last resort on real failure
// ---------------------------------------------------------------------

/**
 * @param {() => string} buildUrl - builds the global endpoint URL.
 * @param {string} status - 'LIVE' | 'SCHEDULED' | 'FINISHED', used for
 *   the per-competition fallback URLs.
 * @param {string} label - short name used in diagnostics/warnings.
 * @returns {Promise<Array>} matches shaped per the shared provider contract.
 */
async function requestMatches(buildUrl, status, label) {
  if (!API_KEY) {
    console.warn(
      `footballDataOrgProvider: EXPO_PUBLIC_FOOTBALL_DATA_ORG_KEY is not set — ${label} falling back to mock match data.`
    );
    return getMockFallback();
  }

  try {
    const matches = await requestGlobalMatches(buildUrl, label);

    if (matches.length > 0) {
      if (__DEV__) {
        console.log(`[footballDataOrgProvider] ${label}: Data source: REAL football-data.org (global endpoint)`);
      }
      return matches;
    }

    // Global endpoint succeeded but legitimately returned zero — try
    // the per-competition fallback. If that's also empty, it's still a
    // real (not mock) empty result, per the same "empty isn't failure"
    // rule already used in api/footballApi.js.
    const fallbackMatches = await requestCompetitionFallback(status, label);

    if (__DEV__) {
      console.log(
        `[footballDataOrgProvider] ${label}: Data source: REAL football-data.org (competition fallback, ${fallbackMatches.length} matches)`
      );
    }

    return fallbackMatches;
  } catch (err) {
    // A real failure — network error, bad status, malformed payload,
    // or timeout, from the global endpoint itself. Falls back to mock
    // data, unchanged from before.
    console.warn(`footballDataOrgProvider: ${label} falling back to mock data —`, err.message);
    if (__DEV__) {
      console.log(`[footballDataOrgProvider] ${label}: Data source: MOCK (fallback due to error)`);
      console.log(`[footballDataOrgProvider] ${label}: Fallback reason:`, err.message);
    }
    return getMockFallback();
  }
}

// ---------------------------------------------------------------------
// Exported provider functions — same names/shape as api/footballApi.js,
// per the shared contract in api/providers/providerContract.js
// ---------------------------------------------------------------------

/**
 * Fetch all matches currently live.
 * Endpoint: GET {FOOTBALL_DATA_ORG_BASE_URL}/matches?status=LIVE
 * Falls back to per-competition LIVE queries (sequential) if the global
 * endpoint legitimately returns zero.
 * @returns {Promise<Array>}
 */
export async function fetchLiveMatches() {
  return requestMatches(buildLiveMatchesUrl, 'LIVE', 'fetchLiveMatches');
}

/**
 * Fetch today's fixtures that haven't started yet ("upcoming").
 * Endpoint: GET {FOOTBALL_DATA_ORG_BASE_URL}/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&status=SCHEDULED
 * Falls back to per-competition SCHEDULED queries (sequential) if the
 * global endpoint legitimately returns zero.
 * @returns {Promise<Array>}
 */
export async function fetchTodayFixtures() {
  return requestMatches(buildTodayFixturesUrl, 'SCHEDULED', 'fetchTodayFixtures');
}

/**
 * Fetch today's fixtures that have finished.
 * Endpoint: GET {FOOTBALL_DATA_ORG_BASE_URL}/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&status=FINISHED
 * Falls back to per-competition FINISHED queries (sequential) if the
 * global endpoint legitimately returns zero.
 * @returns {Promise<Array>}
 */
export async function fetchFinishedMatches() {
  return requestMatches(buildFinishedMatchesUrl, 'FINISHED', 'fetchFinishedMatches');
}