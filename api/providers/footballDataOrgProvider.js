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
// In-memory cache
// ---------------------------------------------------------------------
// Shared across all three exported fetch functions below. Keyed by
// request status ("status:LIVE" / "status:SCHEDULED" / "status:FINISHED")
// rather than by function name, so the key reflects the actual query
// being cached — not which function happened to call it.
//
// Only real results are cached — including a legitimate empty array,
// which is still valid data, not a failure. Mock fallback results are
// deliberately NOT cached, so if the real API recovers mid-outage, the
// very next call picks that up immediately rather than being masked by
// a stale mock entry for up to CACHE_TTL_MS.

const CACHE_TTL_MS = 60 * 1000; // 60s — roughly 2x useLiveMatches.js's 30s poll interval

const cache = new Map();

/**
 * Returns the cached data for `cacheKey` if present and still within
 * CACHE_TTL_MS, or null on a miss/expiration. Logs which of the three
 * outcomes (hit / miss / expired) occurred.
 */
function getCached(cacheKey) {
  const entry = cache.get(cacheKey);

  if (!entry) {
    if (__DEV__) {
      console.log(`[footballDataOrgProvider] cache miss: ${cacheKey}`);
    }
    return null;
  }

  const age = Date.now() - entry.timestamp;

  if (age > CACHE_TTL_MS) {
    if (__DEV__) {
      console.log(`[footballDataOrgProvider] cache expired: ${cacheKey} (age ${age}ms > TTL ${CACHE_TTL_MS}ms)`);
    }
    cache.delete(cacheKey);
    return null;
  }

  if (__DEV__) {
    console.log(`[footballDataOrgProvider] cache hit: ${cacheKey} (age ${age}ms)`);
  }

  return entry.data;
}

function setCached(cacheKey, data) {
  cache.set(cacheKey, { data, timestamp: Date.now() });
}

// ---------------------------------------------------------------------
// Endpoint builders
// ---------------------------------------------------------------------
// Built per-call (not frozen at module load) so "today" is always
// accurate even if the app stays open across midnight.

// Competitions used as the per-competition fallback data source. All
// available on the football-data.org Tier One plan. Queried
// sequentially, one at a time, stopping at the first competition that
// returns matches, or immediately on a 429 — see requestCompetitionFallback().
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
 * On a non-OK response, the thrown Error carries a `.status` property
 * with the HTTP status code, so callers (specifically the per-
 * competition fallback loop) can detect a 429 specifically.
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
      const err = new Error(`footballDataOrgProvider: ${label} request failed with status ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const json = await response.json();

    if (__DEV__) {
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
// Per-competition fallback
// ---------------------------------------------------------------------
// Used whenever the global endpoint doesn't give a real, trustworthy
// non-empty result — whether that's because it legitimately returned
// zero, OR because the global request itself failed outright. A
// competition-specific endpoint can succeed even when the global one
// times out or errors, so a global failure should NOT skip straight to
// mock data — it should still get a real chance via these per-
// competition requests first.

/**
 * Fetches one competition's matches for the given status, scoped to
 * today's date range. Never throws — if this competition's request
 * fails, it's logged and reported back via `succeeded`/`rateLimited` so
 * the caller can track whether it got any real signal at all, and
 * whether to stop the loop early.
 *
 * @returns {Promise<{ matches: Array, succeeded: boolean, rateLimited: boolean }>}
 */
async function requestCompetitionMatches(code, status, label) {
  const endpoint = buildCompetitionMatchesUrl(code, status);
  try {
    const rawMatches = await performRequest(endpoint, `${label}:${code}`);
    return { matches: rawMatches.map(normalizeMatch), succeeded: true, rateLimited: false };
  } catch (err) {
    if (__DEV__) {
      console.warn(`[footballDataOrgProvider] ${label}: competition ${code} failed —`, err.message);
    }
    return { matches: [], succeeded: false, rateLimited: err.status === 429 };
  }
}

/**
 * Queries FALLBACK_COMPETITIONS one at a time, in order, stopping as
 * soon as a competition returns matches, OR as soon as a competition is
 * rate-limited (HTTP 429).
 *
 * @param {string} status - 'LIVE' | 'SCHEDULED' | 'FINISHED'
 * @param {string} label - short name for diagnostics.
 * @returns {Promise<{ matches: Array, anySucceeded: boolean }>}
 *   anySucceeded is true if at least one competition request completed
 *   successfully (even with 0 matches) — meaning the result, even if
 *   empty, reflects a real answer from football-data.org, not a total
 *   communication failure.
 */
async function requestCompetitionFallback(status, label) {
  if (__DEV__) {
    console.log(
      `[footballDataOrgProvider] ${label}: trying per-competition fallback sequentially (${FALLBACK_COMPETITIONS.join(', ')})`
    );
  }

  let anySucceeded = false;

  for (const code of FALLBACK_COMPETITIONS) {
    const { matches, succeeded, rateLimited } = await requestCompetitionMatches(code, status, label);

    if (succeeded) {
      anySucceeded = true;
    }

    if (matches.length > 0) {
      if (__DEV__) {
        console.log(
          `[footballDataOrgProvider] ${label}: competition ${code} returned ${matches.length} matches — stopping fallback here`
        );
      }
      return { matches, anySucceeded };
    }

    if (rateLimited) {
      if (__DEV__) {
        console.warn(
          `[footballDataOrgProvider] ${label}: competition ${code} was rate limited (429) — stopping fallback early instead of trying the remaining competitions`
        );
      }
      break;
    }

    if (__DEV__) {
      console.log(`[footballDataOrgProvider] ${label}: competition ${code} returned 0 — trying next competition`);
    }
  }

  if (__DEV__) {
    console.log(`[footballDataOrgProvider] ${label}: fallback finished with 0 matches (anySucceeded: ${anySucceeded})`);
  }

  return { matches: [], anySucceeded };
}

// ---------------------------------------------------------------------
// Top-level orchestrator
// ---------------------------------------------------------------------
// Order: cache -> global endpoint -> per-competition fallback -> mock
// data as the TRUE last resort. Critically, a global-endpoint FAILURE
// (not just a legitimate empty result) no longer skips straight to
// mock — it still tries the competition fallback first. Mock data is
// only used when NOTHING succeeded anywhere: the global request failed
// AND every competition request also failed.

/**
 * @param {() => string} buildUrl - builds the global endpoint URL.
 * @param {string} status - 'LIVE' | 'SCHEDULED' | 'FINISHED', used for
 *   the per-competition fallback URLs and as this request's cache key.
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

  const cacheKey = `status:${status}`;

  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  let globalMatches = [];
  let globalSucceeded = false;

  try {
    globalMatches = await requestGlobalMatches(buildUrl, label);
    globalSucceeded = true;
  } catch (err) {
    // Global endpoint failed outright — do NOT go straight to mock.
    // Fall through to the competition fallback below and give it a
    // real chance, since a competition-specific request can succeed
    // even when the global one times out or errors.
    if (__DEV__) {
      console.warn(
        `[footballDataOrgProvider] ${label}: global endpoint failed (${err.message}) — trying per-competition fallback before considering mock data`
      );
    }
  }

  if (globalSucceeded && globalMatches.length > 0) {
    if (__DEV__) {
      console.log(`[footballDataOrgProvider] ${label}: Data source: REAL football-data.org (global endpoint)`);
    }
    setCached(cacheKey, globalMatches);
    return globalMatches;
  }

  const { matches: fallbackMatches, anySucceeded } = await requestCompetitionFallback(status, label);

  if (globalSucceeded || anySucceeded) {
    // Real signal exists — either the global endpoint itself
    // legitimately returned zero, or at least one competition request
    // completed successfully (even with zero results). Either way this
    // is a trustworthy real answer, not a failure state.
    if (__DEV__) {
      console.log(
        `[footballDataOrgProvider] ${label}: Data source: REAL football-data.org (${fallbackMatches.length} matches)`
      );
    }
    setCached(cacheKey, fallbackMatches);
    return fallbackMatches;
  }

  // Genuinely nothing worked: the global endpoint failed AND every
  // competition request also failed. This is the true last resort.
  console.warn(`footballDataOrgProvider: ${label} falling back to mock data — global endpoint and all competitions failed`);
  if (__DEV__) {
    console.log(`[footballDataOrgProvider] ${label}: Data source: MOCK (fallback due to error)`);
  }
  return getMockFallback();
}

// ---------------------------------------------------------------------
// Exported provider functions — same names/shape as api/footballApi.js,
// per the shared contract in api/providers/providerContract.js
// ---------------------------------------------------------------------

/**
 * Fetch all matches currently live.
 * @returns {Promise<Array>}
 */
export async function fetchLiveMatches() {
  return requestMatches(buildLiveMatchesUrl, 'LIVE', 'fetchLiveMatches');
}

/**
 * Fetch today's fixtures that haven't started yet ("upcoming").
 * @returns {Promise<Array>}
 */
export async function fetchTodayFixtures() {
  return requestMatches(buildTodayFixturesUrl, 'SCHEDULED', 'fetchTodayFixtures');
}

/**
 * Fetch today's fixtures that have finished.
 * @returns {Promise<Array>}
 */
export async function fetchFinishedMatches() {
  return requestMatches(buildFinishedMatchesUrl, 'FINISHED', 'fetchFinishedMatches');
}