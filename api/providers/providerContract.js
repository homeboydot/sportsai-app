// api/providers/providerContract.js
//
// This file documents the contract every football data provider module
// should follow. It contains no runtime logic of its own — it exists so
// that adding a new provider later (ESPN, OpenFootball, etc.) means
// writing one file that follows this shape, rather than inventing a new
// pattern each time.
//
// api/footballApi.js (API-FOOTBALL, primary) and
// api/providers/footballDataOrgProvider.js (football-data.org,
// fallback) are both wired in via api/providerManager.js — see that
// file for the actual failover flow.
//
// -----------------------------------------------------------------
// Normalized match shape
// -----------------------------------------------------------------
// Every provider function that returns matches must return an array of
// objects in exactly this shape, regardless of what the underlying
// provider's raw API response looks like:
//
// @typedef {Object} NormalizedMatch
// @property {string} id          - Unique match identifier (as a string).
// @property {string} league      - Competition/league display name.
// @property {string} home        - Home team display name.
// @property {string} away        - Away team display name.
// @property {number} homeScore   - Home team's current score.
// @property {number} awayScore   - Away team's current score.
// @property {number} minute      - Match clock in minutes (0 if not applicable/known).
// @property {string} status      - Provider-reported match status
//                                   (e.g. "LIVE", "FINISHED", "SCHEDULED").
//
// -----------------------------------------------------------------
// Required provider functions
// -----------------------------------------------------------------
// A provider module should export three async functions, matching the
// naming already established by api/footballApi.js:
//
//   fetchLiveMatches():     Promise<NormalizedMatch[]>
//   fetchTodayFixtures():   Promise<NormalizedMatch[]>  (today's fixtures
//                           that haven't started yet — "upcoming")
//   fetchFinishedMatches(): Promise<NormalizedMatch[]>  (today's
//                           completed fixtures)
//
// -----------------------------------------------------------------
// Expected behavior
// -----------------------------------------------------------------
// Each provider function should, on its own, without relying on any
// other file:
//   1. Read its own API key from an EXPO_PUBLIC_-prefixed env var
//      (never hardcoded).
//   2. Time out a stalled request rather than hang indefinitely.
//   3. THROW on any real failure — missing key, network error, non-OK
//      response, timeout, or malformed payload. This is what lets
//      api/providerManager.js actually detect failure and fall
//      through to the next provider; a provider that silently
//      swallows its own failures and resolves with mock data instead
//      would make that fallback chain never trigger, since
//      providerManager would see a "successful" result and never try
//      the next provider. (An earlier version of this file said the
//      opposite — "never throw" — which was the contract before
//      providerManager.js's real 3-tier fallback existed; that's now
//      stale and has been corrected.)
//   4. A provider MAY still keep its own internal mock-data fallback
//      as an absolute last resort after every real option it knows
//      about has failed (api/providers/footballDataOrgProvider.js
//      does this) — that's a valid design choice, just note that it
//      means providerManager.js's own outer mock fallback won't be
//      reached through that provider in practice.
//
// api/footballApi.js is the reference implementation of this contract.