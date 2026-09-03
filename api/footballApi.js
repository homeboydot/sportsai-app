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
// CACHING (added after real-world testing showed the free-tier daily
// quota — 100 requests/day — getting exhausted quickly): every
// successful real response is saved on-device via AsyncStorage, keyed
// per dataset, and reused for a while before the next real request is
// attempted. Critically, if a real request ever fails for ANY reason
// (network error, or the quota genuinely running out), and there's
// previously-saved data for that dataset — even if it's past its normal
// reuse window — that saved data is served instead of throwing. This
// means running out of quota degrades gracefully into "showing
// slightly older real data" rather than an error or an empty screen.
// Only when there's truly no saved data at all does this throw, which
// is what lets api/providerManager.js correctly fall through to
// football-data.org next.
//
// If a request fails AND there's no cached data to fall back on, each
// function throws — matchesService.js, the hook, and providerManager
// handle that by trying the next provider, exactly as documented in
// api/providers/providerContract.js.

import AsyncStorage from '@react-native-async-storage/async-storage';
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
const SIMULATE_FAILURE = false; // <-- set to false to test real API-FOOTBALL requests
// Give up on a stalled/slow real request after this long and fall back
// to mock data, rather than leaving the UI's loading state hanging.
const REQUEST_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------
// On-device caching
// ---------------------------------------------------------------------
// Reuse windows, per dataset. Live matches get a shorter window since
// they genuinely change; today's/finished fixtures barely change
// minute-to-minute, so a longer window costs nothing in freshness but
// saves real quota. These numbers are deliberately conservative given
// the 100-requests/day free-tier budget — with a 30s poll interval,
// unadjusted polling would burn the entire daily quota in well under
// 20 minutes of continuous use.
const CACHE_TTL_MS = {
  live: 5 * 60 * 1000, // 5 minutes
  today: 15 * 60 * 1000, // 15 minutes
  finished: 15 * 60 * 1000, // 15 minutes
};

const CACHE_KEY_PREFIX = 'footballApi:cache:';

// In-memory copy of whatever's been read from/written to AsyncStorage
// this session, so repeated calls within the same app run don't need
// to round-trip through AsyncStorage every time.
const memoryCache = new Map();

async function readCache(dataset) {
  if (memoryCache.has(dataset)) return memoryCache.get(dataset);
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY_PREFIX + dataset);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    memoryCache.set(dataset, entry);
    return entry;
  } catch (err) {
    if (__DEV__) console.warn(`[footballApi] readCache(${dataset}) failed:`, err.message);
    return null;
  }
}

async function writeCache(dataset, data) {
  const entry = { data, savedAt: Date.now() };
  memoryCache.set(dataset, entry);
  try {
    await AsyncStorage.setItem(CACHE_KEY_PREFIX + dataset, JSON.stringify(entry));
  } catch (err) {
    if (__DEV__) console.warn(`[footballApi] writeCache(${dataset}) failed:`, err.message);
  }
}

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
/**
 * Maps API-FOOTBALL's own status.short code onto the same status
 * vocabulary football-data.org uses (IN_PLAY / PAUSED / FINISHED /
 * SCHEDULED) — so downstream code (e.g. TicketMatchRow.js's isLive
 * check) works the same regardless of which provider a match came
 * from. Previously this field was omitted entirely here, which meant
 * anything checking match.status silently failed for every
 * API-FOOTBALL-sourced match, even genuinely live ones.
 *
 * Reference: API-FOOTBALL's documented short codes are TBD, NS, 1H,
 * HT, 2H, ET, BT, P, SUSP, INT, FT, AET, PEN, PST, CANC, ABD, AWD, WO,
 * LIVE.
 */
function mapStatus(shortCode) {
  switch (shortCode) {
    case 'HT':
      return 'PAUSED';
    case '1H':
    case '2H':
    case 'ET':
    case 'BT':
    case 'P':
    case 'LIVE':
      return 'IN_PLAY';
    case 'FT':
    case 'AET':
    case 'PEN':
      return 'FINISHED';
    case 'NS':
    case 'TBD':
    case 'PST':
      return 'SCHEDULED';
    default:
      // SUSP, INT, CANC, ABD, AWD, WO, or anything unrecognized — none
      // of these are "live" in a meaningful sense, so they intentionally
      // fall outside IN_PLAY/PAUSED/SCHEDULED/FINISHED rather than being
      // force-mapped to one.
      return shortCode ?? 'UNKNOWN';
  }
}

function normalizeFixture(fixture) {
  return {
    id: String(fixture.fixture?.id ?? ''),
    league: fixture.league?.name ?? 'Unknown League',
    // Needed to tell apart leagues that share a generic name across
    // countries (e.g. "Premier League" is used by England, Ukraine,
    // Hong Kong, and others) — see contexts/FavoritesContext.js, which
    // uses this to avoid matching a favorited "Premier League" (English)
    // against an unrelated Ukrainian or Hong Kong match of the same name.
    country: fixture.league?.country ?? null,
    minute: fixture.fixture?.status?.elapsed ?? 0,
    home: fixture.teams?.home?.name ?? 'Home',
    away: fixture.teams?.away?.name ?? 'Away',
    homeScore: fixture.goals?.home ?? 0,
    awayScore: fixture.goals?.away ?? 0,
    status: mapStatus(fixture.fixture?.status?.short),
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
 * Wraps requestFixtures() with the on-device cache + stale-fallback
 * behavior described at the top of this file.
 *
 * @param {string} dataset - 'live' | 'today' | 'finished' — cache key
 *   and TTL lookup.
 * @param {string} endpoint - the full API-FOOTBALL endpoint URL.
 * @returns {Promise<Array>}
 */
async function fetchWithCache(dataset, endpoint) {
  const cached = await readCache(dataset);
  const ttl = CACHE_TTL_MS[dataset];

  if (cached && Date.now() - cached.savedAt < ttl) {
    if (__DEV__) {
      console.log(`[footballApi] ${dataset}: serving cached data (age ${Date.now() - cached.savedAt}ms, within ${ttl}ms window)`);
    }
    return cached.data;
  }

  try {
    const data = await requestFixtures(endpoint);
    await writeCache(dataset, data);
    return data;
  } catch (err) {
    if (cached) {
      if (__DEV__) {
        console.warn(
          `[footballApi] ${dataset}: real request failed (${err.message}) — serving stale cached data (age ${Date.now() - cached.savedAt}ms) instead of failing`
        );
      }
      return cached.data;
    }
    // No cached data at all to fall back on — let this propagate up so
    // providerManager.js can try the next provider.
    throw err;
  }
}

/**
 * Fetch all matches currently live.
 * Endpoint: GET {API_FOOTBALL_BASE_URL}/fixtures?live=all
 * @returns {Promise<Array>}
 */
export async function fetchLiveMatches() {
  return fetchWithCache('live', LIVE_FIXTURES_ENDPOINT);
}

/**
 * Fetch today's fixtures that haven't started yet ("upcoming").
 * Endpoint: GET {API_FOOTBALL_BASE_URL}/fixtures?date=YYYY-MM-DD&status=NS
 * @returns {Promise<Array>}
 */
export async function fetchTodayFixtures() {
  return fetchWithCache('today', TODAY_FIXTURES_ENDPOINT);
}

/**
 * Fetch today's fixtures that have finished (FT / AET / PEN).
 * Endpoint: GET {API_FOOTBALL_BASE_URL}/fixtures?date=YYYY-MM-DD&status=FT-AET-PEN
 * @returns {Promise<Array>}
 */
export async function fetchFinishedMatches() {
  return fetchWithCache('finished', FINISHED_FIXTURES_ENDPOINT);
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