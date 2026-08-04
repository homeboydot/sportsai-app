// api/providers/providerContract.js
//
// This file documents the contract every football data provider module
// should follow. It contains no runtime logic of its own — it exists so
// that adding a new provider later (ESPN, OpenFootball, etc.) means
// writing one file that follows this shape, rather than inventing a new
// pattern each time.
//
// This layer is currently standalone: nothing in the app imports from
// api/providers/ yet. api/footballApi.js (API-FOOTBALL) remains the
// live, active data source and is untouched. Wiring a provider from
// this layer into the app is a separate, future decision.
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
//   3. Fall back to local mock data on any failure — missing key,
//      network error, non-OK response, timeout, or malformed payload —
//      so a caller never has to handle a rejected promise.
//   4. Never throw. Every exported function always resolves to an array.
//
// This mirrors exactly how api/footballApi.js already behaves for
// API-FOOTBALL, so any future provider feels consistent with the one
// already in use.