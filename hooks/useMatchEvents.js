// hooks/useMatchEvents.js
//
// Step 4 of the Match Intelligence roadmap, wired into React: combines
// hooks/useMatchHistory.js's memory (Step 3) with utils/matchEvents.js's
// pure detection logic to produce a running list of real events as they
// happen — a goal, kick-off, half-time, full-time.
//
// This still isn't the "Match Story" UI (Step 5) — no card, no
// narrative sentence beyond a plain factual label. In __DEV__ it logs
// every detected event so it can be verified against real match
// testing before any UI gets built on top of it.

import { useRef, useState, useEffect } from 'react';
import useMatchHistory from './useMatchHistory';
import { detectMatchEvents, describeMatchEvent } from '../utils/matchEvents';

const MAX_RECENT_EVENTS = 20;

/**
 * @param {Array} liveMatches - the current liveMatches array, typically
 *   passed straight from contexts/LiveMatchesContext.js.
 * @returns {{
 *   getMatchHistory: (matchId: string) => { previous: object|null, current: object|null },
 *   recentEvents: Array<{ type: string, matchId: string, description: string, at: number }>,
 * }}
 *   recentEvents is newest-first, capped at MAX_RECENT_EVENTS.
 */
export default function useMatchEvents(liveMatches) {
  const { getHistory } = useMatchHistory(liveMatches);
  const [recentEvents, setRecentEvents] = useState([]);

  // Tracks which (matchId, eventType, scoreline) combinations have
  // already been recorded, so an effect re-run (e.g. React StrictMode's
  // deliberate double-invoke in dev) can't log the same real event
  // twice. Keyed loosely enough that re-detecting the exact same
  // already-known state is a no-op, but a genuinely new goal (new
  // scoreline) still gets through.
  const loggedRef = useRef(new Set());

  useEffect(() => {
    if (!liveMatches || liveMatches.length === 0) return;

    const newlyDetected = [];

    for (const match of liveMatches) {
      const { previous, current } = getHistory(match.id);
      const events = detectMatchEvents(previous, current);

      for (const event of events) {
        const dedupeKey = `${match.id}:${event.type}:${match.homeScore}-${match.awayScore}`;
        if (loggedRef.current.has(dedupeKey)) continue;
        loggedRef.current.add(dedupeKey);

        const description = describeMatchEvent(event, match);
        const record = { ...event, matchId: match.id, description, at: Date.now() };
        newlyDetected.push(record);

        if (__DEV__) {
          console.log(`[useMatchEvents] ${description}`);
        }
      }
    }

    if (newlyDetected.length > 0) {
      setRecentEvents((prev) => [...newlyDetected, ...prev].slice(0, MAX_RECENT_EVENTS));
    }
  }, [liveMatches]);

  return { getMatchHistory: getHistory, recentEvents };
}