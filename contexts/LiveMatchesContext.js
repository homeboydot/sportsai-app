// contexts/LiveMatchesContext.js
//
// Wraps hooks/useLiveMatches.js in a single React Context provider so
// the ENTIRE APP has exactly one active poller and one shared set of
// match data, instead of every screen that needs match data starting
// its own independent 30s poll.
//
// Why this exists: this app uses a bottom tab navigator
// (@react-navigation/bottom-tabs), which keeps tab screens mounted in
// the background rather than unmounting them when you switch tabs. So
// once you've visited both the Home tab (LiveMatchesSection) and the
// Matches tab (MatchesScreen), BOTH were separately calling
// useLiveMatches() directly — two independent polling loops, two
// independent local React states, both hitting the same shared
// football-data.org rate limiter/cache in
// api/providers/footballDataOrgProvider.js at different, unsynchronized
// times. That's what caused the two screens to show different match
// counts that drifted over time: they were two different polls landing
// at two different moments, not one source of truth. It also silently
// doubled the app's real request volume against the free-tier budget.
//
// Fetching once here and having every screen read from this context
// fixes both problems at once: one poll, one true state, and the
// request volume matches what the rate limiter was actually designed
// to pace.
//
// limit is intentionally NOT passed to useLiveMatches() here — this
// provider always fetches the FULL lists. Any screen that wants a
// shorter preview (e.g. the Home rail showing 4 matches) slices the
// full array locally rather than requesting a separately-limited fetch,
// since services/matchesService.js's `limit` option only does a local
// .slice() over already-fetched data anyway (see matchesService.js) —
// so there's no cost to always fetching the full list once and slicing
// per-consumer.
//
// STEP 3 & 4 (Match Intelligence roadmap) — useMatchEvents (which
// internally uses useMatchHistory) is wired in here so every screen
// has access to "what did this match look like last poll"
// (getMatchHistory) and "what just objectively changed" (recentEvents)
// without each needing its own tracking. Step 4 only detects real,
// verifiable changes (a score changed, a status changed) — it doesn't
// interpret or narrate anything. That's Step 5.

import React, { createContext, useContext, useMemo } from 'react';
import useLiveMatches from '../hooks/useLiveMatches';
import useMatchEvents from '../hooks/useMatchEvents';

const LiveMatchesContext = createContext(null);

/**
 * Mount this ONCE, near the root of the app (see App.js) — above
 * whatever navigator renders your screens — so every screen shares the
 * same underlying poll and state rather than each starting its own.
 */
export function LiveMatchesProvider({ children }) {
  const liveMatchesValue = useLiveMatches();
  const { getMatchHistory, recentEvents } = useMatchEvents(liveMatchesValue.liveMatches);

  const value = useMemo(
    () => ({
      ...liveMatchesValue,
      getMatchHistory,
      recentEvents,
    }),
    [liveMatchesValue, getMatchHistory, recentEvents]
  );

  return (
    <LiveMatchesContext.Provider value={value}>
      {children}
    </LiveMatchesContext.Provider>
  );
}

/**
 * @returns {{
 *   matches: Array, liveMatches: Array, todayFixtures: Array, finishedMatches: Array,
 *   loading: boolean, error: Error|null, refresh: () => void,
 *   getMatchHistory: (matchId: string) => { previous: object|null, current: object|null },
 *   recentEvents: Array<{ type: string, matchId: string, description: string, at: number }>,
 * }} the same shape useLiveMatches() returns, plus Step 3/4's
 *   getMatchHistory and recentEvents.
 */
export function useLiveMatchesContext() {
  const ctx = useContext(LiveMatchesContext);

  if (!ctx) {
    throw new Error(
      'useLiveMatchesContext() was called outside of a <LiveMatchesProvider>. ' +
        'Make sure App.js wraps the navigator in <LiveMatchesProvider>.'
    );
  }

  return ctx;
}