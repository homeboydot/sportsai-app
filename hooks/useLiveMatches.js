// hooks/useLiveMatches.js
//
// Single reusable hook for consuming match data: live matches, today's
// upcoming fixtures, and today's finished fixtures. Wraps
// services/matchesService.js with loading/error state, automatic
// polling, and a manual refresh().
//
// Backward compatibility: the hook still returns `matches` (identical
// to `liveMatches`) so existing screens/components that destructure
// `{ matches, loading, error, refresh }` continue to work exactly as
// before, unmodified. New consumers can use `liveMatches`,
// `todayFixtures`, and `finishedMatches` directly.
//
// Polling behavior (unchanged from before):
//   - Fetches immediately on mount.
//   - Automatically refetches every POLL_INTERVAL_MS (30s).
//   - Exactly one interval is ever active per hook instance — it is
//     always cleared on unmount (and defensively cleared before a new
//     one is created, in case the effect re-runs).
//   - Overlapping requests are prevented: if a fetch (auto or manual)
//     is already in flight, a new one is skipped rather than queued.
//
// Live/today/finished are now fetched SEQUENTIALLY (not via
// Promise.all) within one load() call. Each of the three can trigger
// its own football-data.org fallback chain (global endpoint + up to 6
// competition requests) — running them concurrently let three
// independent fallback chains race each other and collectively exceed
// football-data.org's free-tier rate limit (HTTP 429). Awaiting them
// one at a time guarantees at most one fallback chain is ever in
// flight, without changing loading/error semantics or the guards above.
//
// Usage:
//   const { matches, liveMatches, todayFixtures, finishedMatches, loading, error, refresh } = useLiveMatches({ limit: 4 });

import { useCallback, useEffect, useRef, useState } from 'react';
import { getLiveMatches, getTodayFixtures, getFinishedMatches } from '../services/matchesService';

// How often the hook automatically refetches while mounted.
const POLL_INTERVAL_MS = 30000;

/**
 * @param {Object} [options]
 * @param {number} [options.limit] - passed straight through to matchesService,
 *   applied to the live-matches dataset only (preserves existing behavior).
 * @param {boolean} [options.enabled=true] - set to false to skip fetching
 *   and polling entirely (e.g. when a caller supplies its own data via props).
 * @returns {{
 *   matches: Array, liveMatches: Array, todayFixtures: Array, finishedMatches: Array,
 *   loading: boolean, error: Error|null, refresh: () => void
 * }}
 */
export default function useLiveMatches({ limit, enabled = true } = {}) {
  const [liveMatches, setLiveMatches] = useState([]);
  const [todayFixtures, setTodayFixtures] = useState([]);
  const [finishedMatches, setFinishedMatches] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  // Guards against setting state after unmount (e.g. navigating away
  // from a screen while a fetch is still in flight).
  const isMountedRef = useRef(true);

  // Guards against overlapping requests: if a fetch is already running
  // (auto or manual), a new one is skipped rather than started.
  const isFetchingRef = useRef(false);

  // True until the first load attempt (success or failure) has
  // completed. Used so routine background auto-refreshes don't flip
  // `loading` back to true once there's already data on screen — only
  // the very first load (nothing to show yet) or an explicit manual
  // refresh should show a loading state. Without this, every 30s poll
  // would hide the already-loaded matches behind "Loading…" text for
  // the duration of the fetch, which is especially jarring now that a
  // fetch can occasionally take tens of seconds under football-data.org
  // rate-limit pacing.
  const isInitialLoadRef = useRef(true);

  // Holds the single active polling interval id, so it can always be
  // cleared — both on unmount and defensively before a new one starts.
  const intervalRef = useRef(null);

  /**
   * @param {'auto'|'manual'} trigger - only used for diagnostics, to
   *   distinguish an automatic (mount/interval) fetch from an
   *   explicit refresh() call.
   */
  const load = useCallback(
    (trigger = 'auto') => {
      if (!enabled) return Promise.resolve();

      if (isFetchingRef.current) {
        // A request is already in flight — skip rather than overlap.
        return Promise.resolve();
      }

      if (__DEV__) {
        console.log(trigger === 'manual' ? '[useLiveMatches] Manual refresh' : '[useLiveMatches] Auto refresh');
      }

      isFetchingRef.current = true;

      // Only surface a loading state for the first-ever load or an
      // explicit manual refresh — a routine background auto-refresh
      // keeps showing whatever's already on screen while it fetches.
      if (isInitialLoadRef.current || trigger === 'manual') {
        setLoading(true);
      }
      setError(null);

      // Sequential, not Promise.all — see file header comment for why.
      // Each dataset's state is set as soon as it resolves, rather than
      // waiting for all three, so the UI can populate progressively.
      return (async () => {
        try {
          const live = await getLiveMatches({ limit });
          if (isMountedRef.current) {
            setLiveMatches(live);
          }

          const upcoming = await getTodayFixtures();
          if (isMountedRef.current) {
            setTodayFixtures(upcoming);
          }

          const finished = await getFinishedMatches();
          if (isMountedRef.current) {
            setFinishedMatches(finished);
          }
        } catch (err) {
          if (isMountedRef.current) {
            setError(err instanceof Error ? err : new Error('Failed to load matches'));
          }
        } finally {
          isFetchingRef.current = false;
          isInitialLoadRef.current = false;
          if (isMountedRef.current) {
            setLoading(false);
          }
        }
      })();
    },
    [limit, enabled]
  );

  // Exposed refresh() keeps its existing no-arg external contract —
  // it just tags the call as 'manual' for diagnostics under the hood.
  const refresh = useCallback(() => load('manual'), [load]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return () => {
        isMountedRef.current = false;
      };
    }

    // Fetch immediately on mount.
    load('auto');

    // Defensive: clear any pre-existing interval before creating a new
    // one, so this hook instance can never end up with more than one
    // active interval at a time.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      load('auto');
    }, POLL_INTERVAL_MS);

    if (__DEV__) {
      console.log('[useLiveMatches] Polling started');
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (__DEV__) {
        console.log('[useLiveMatches] Polling stopped');
      }
    };
  }, [enabled, load]);

  return {
    // `matches` is preserved as an alias for `liveMatches` so existing
    // screens/components that destructure `{ matches }` keep working
    // exactly as before, with zero changes required on their end.
    matches: liveMatches,
    liveMatches,
    todayFixtures,
    finishedMatches,
    loading,
    error,
    refresh,
  };
}