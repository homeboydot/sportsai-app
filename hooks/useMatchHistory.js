// hooks/useMatchHistory.js
//
// Step 3 of the Match Intelligence roadmap: remember previous match
// data. This hook watches the live matches array and, for every match,
// remembers what its score/minute/status were the last time this hook
// saw it — so Step 4 (detecting a meaningful change, like a goal) has
// something concrete to compare the current data against.
//
// This step deliberately does NOT detect or interpret anything itself
// — it only remembers. No new API calls, no AI, no judgment calls about
// what counts as "meaningful" — that's Step 4's job, kept separate on
// purpose so this piece stays simple and easy to verify on its own.
//
// Snapshots live in memory only, not AsyncStorage — they only need to
// survive between polls within a running session (to compare "now" vs
// "last poll"), not across app restarts. There's nothing meaningful to
// "catch up on" from a previous session, since a snapshot only exists
// to be compared against the very next live poll.

import { useRef, useEffect, useState } from 'react';

/**
 * @typedef {Object} MatchSnapshot
 * @property {number} homeScore
 * @property {number} awayScore
 * @property {number} minute
 * @property {string} status
 * @property {number} seenAt - Date.now() when this snapshot was recorded.
 */

/**
 * @param {Array} liveMatches - the current liveMatches array, typically
 *   passed straight from contexts/LiveMatchesContext.js.
 * @returns {{
 *   getHistory: (matchId: string) => { previous: MatchSnapshot|null, current: MatchSnapshot|null },
 * }}
 *   `previous` is what the match looked like as of the poll before
 *   this one; `current` is the latest. Both are null if this match
 *   hasn't been seen yet. Step 4 compares the two to decide what
 *   changed — this hook only stores them.
 */
export default function useMatchHistory(liveMatches) {
  // The history map lives in a ref, not state — updating it shouldn't
  // by itself force a re-render. Consumers already re-render when
  // liveMatches itself changes (that's what feeds this hook), which is
  // the only time there's anything new to look at anyway.
  const historyRef = useRef(new Map());

  // version exists purely so a future consumer that wants to react to
  // "history was just updated" specifically (rather than piggybacking
  // on liveMatches changing) has something to subscribe to. Not used
  // by anything yet — kept minimal until Step 4 needs it.
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!liveMatches || liveMatches.length === 0) return;

    const history = historyRef.current;

    for (const match of liveMatches) {
      const existingEntry = history.get(match.id);
      const newCurrent = {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        minute: match.minute,
        status: match.status,
        seenAt: Date.now(),
      };

      history.set(match.id, {
        // Whatever "current" was a moment ago becomes "previous" now —
        // this is the actual remembering this step is responsible for.
        previous: existingEntry ? existingEntry.current : null,
        current: newCurrent,
      });
    }

    setVersion((v) => v + 1);
  }, [liveMatches]);

  const getHistory = (matchId) => {
    const entry = historyRef.current.get(matchId);
    return entry ?? { previous: null, current: null };
  };

  return { getHistory };
}