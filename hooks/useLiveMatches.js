// hooks/useLiveMatches.js
//
// Single reusable hook for consuming live match data. Wraps
// services/matchesService.js with loading/error state and a manual
// refresh() so screens/components stop hand-rolling their own
// useEffect + useState fetch boilerplate (which is what
// LiveMatchesSection.js and MatchesScreen.js were each doing
// separately before this).
//
// Usage:
//   const { matches, loading, error, refresh } = useLiveMatches({ limit: 4 });

import { useCallback, useEffect, useRef, useState } from 'react';
import { getLiveMatches } from '../services/matchesService';

/**
 * @param {Object} [options]
 * @param {number} [options.limit] - passed straight through to matchesService.
 * @param {boolean} [options.enabled=true] - set to false to skip fetching
 *   entirely (e.g. when a caller supplies its own data via props).
 * @returns {{ matches: Array, loading: boolean, error: Error|null, refresh: () => void }}
 */
export default function useLiveMatches({ limit, enabled = true } = {}) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  // Guards against setting state after unmount (e.g. navigating away
  // from a screen while a fetch is still in flight).
  const isMountedRef = useRef(true);

  const load = useCallback(() => {
    if (!enabled) return Promise.resolve();

    setLoading(true);
    setError(null);

    return getLiveMatches({ limit })
      .then((data) => {
        if (isMountedRef.current) {
          setMatches(data);
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Failed to load matches'));
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setLoading(false);
        }
      });
  }, [limit, enabled]);

  useEffect(() => {
    isMountedRef.current = true;
    load();
    return () => {
      isMountedRef.current = false;
    };
  }, [load]);

  return { matches, loading, error, refresh: load };
}
