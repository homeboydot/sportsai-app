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
//     All three datasets are fetched together, in parallel, under this
//     same single guard — there is still only ever one fetch "in
//     flight" from the hook's perspective at any time.
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
  // (auto or manual), a new one is skipped rather than started. This is
  // the exact same single guard as before — now covering all three
  // datasets fetched together as one unit, so there is still no way to
  // have more than one fetch in flight at a time.
  const isFetchingRef = useRef(false);

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
      setLoading(true);
      setError(null);

      // All three datasets are fetched in parallel under the same
      // isFetchingRef guard and the same loading/error state as before
      // — this does not create any additional overlap risk, since it's
      // still exactly one "fetch operation" from the hook's perspective.
      return Promise.all([
        getLiveMatches({ limit }),
        getTodayFixtures(),
        getFinishedMatches(),
      ])
        .then(([live, upcoming, finished]) => {
          if (isMountedRef.current) {
            setLiveMatches(live);
            setTodayFixtures(upcoming);
            setFinishedMatches(finished);
          }
        })
        .catch((err) => {
          if (isMountedRef.current) {
            setError(err instanceof Error ? err : new Error('Failed to load matches'));
          }
        })
        .finally(() => {
          isFetchingRef.current = false;
          if (isMountedRef.current) {
            setLoading(false);
          }
        });
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