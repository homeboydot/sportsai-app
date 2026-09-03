// utils/matchEvents.js
//
// Step 4 of the Match Intelligence roadmap: detect meaningful changes.
// Pure functions, no React, no side effects — takes two snapshots (the
// shape hooks/useMatchHistory.js produces) and returns what objectively
// changed between them, if anything.
//
// Every event here is a direct, verifiable fact derived from real
// score/status data that was already being fetched — nothing is
// inferred, predicted, or narrated. Turning these into an actual
// readable sentence/story is Step 5's job, deliberately kept separate
// so this step stays simple, testable, and impossible to accidentally
// dress up as more than it is.

export const MATCH_EVENT_TYPES = {
  GOAL_HOME: 'GOAL_HOME',
  GOAL_AWAY: 'GOAL_AWAY',
  KICK_OFF: 'KICK_OFF',
  HALF_TIME: 'HALF_TIME',
  SECOND_HALF: 'SECOND_HALF',
  FULL_TIME: 'FULL_TIME',
};

// Status vocabulary matches what both providers now normalize to (see
// api/footballApi.js's mapStatus() and
// api/providers/footballDataOrgProvider.js) — 'SCHEDULED', 'IN_PLAY',
// 'PAUSED', 'FINISHED', plus whatever unrecognized code either provider
// passes through as-is for edge cases (postponed, cancelled, etc.),
// which intentionally don't match any transition below.
const LIVE_STATUSES = ['IN_PLAY'];
const PAUSED_STATUSES = ['PAUSED'];
const FINISHED_STATUSES = ['FINISHED'];
const NOT_STARTED_STATUSES = ['SCHEDULED'];

/**
 * @param {{homeScore:number, awayScore:number, status:string}|null} previous
 * @param {{homeScore:number, awayScore:number, status:string}|null} current
 * @returns {Array<{type: string}>} zero or more events detected between
 *   `previous` and `current`. Empty if this is the first time seeing
 *   the match (no previous snapshot yet) or if nothing changed.
 */
export function detectMatchEvents(previous, current) {
  if (!previous || !current) return [];

  const events = [];

  if (current.homeScore > previous.homeScore) {
    events.push({ type: MATCH_EVENT_TYPES.GOAL_HOME });
  }
  if (current.awayScore > previous.awayScore) {
    events.push({ type: MATCH_EVENT_TYPES.GOAL_AWAY });
  }

  if (previous.status !== current.status) {
    if (NOT_STARTED_STATUSES.includes(previous.status) && LIVE_STATUSES.includes(current.status)) {
      events.push({ type: MATCH_EVENT_TYPES.KICK_OFF });
    } else if (LIVE_STATUSES.includes(previous.status) && PAUSED_STATUSES.includes(current.status)) {
      events.push({ type: MATCH_EVENT_TYPES.HALF_TIME });
    } else if (PAUSED_STATUSES.includes(previous.status) && LIVE_STATUSES.includes(current.status)) {
      events.push({ type: MATCH_EVENT_TYPES.SECOND_HALF });
    } else if (
      (LIVE_STATUSES.includes(previous.status) || PAUSED_STATUSES.includes(previous.status)) &&
      FINISHED_STATUSES.includes(current.status)
    ) {
      events.push({ type: MATCH_EVENT_TYPES.FULL_TIME });
    }
  }

  return events;
}

/**
 * A short, plain, factual label for an event — deliberately unembellished.
 * This is NOT the "Match Story" narrative (Step 5) — just enough to
 * log or display that something real happened, in the match's own
 * real numbers.
 *
 * @param {{type: string}} event
 * @param {{home:string, away:string, homeScore:number, awayScore:number}} match
 */
export function describeMatchEvent(event, match) {
  const scoreline = `${match.home} ${match.homeScore}-${match.awayScore} ${match.away}`;

  switch (event.type) {
    case MATCH_EVENT_TYPES.GOAL_HOME:
      return `Goal — ${match.home} now ${match.homeScore}-${match.awayScore}`;
    case MATCH_EVENT_TYPES.GOAL_AWAY:
      return `Goal — ${match.away} now ${match.homeScore}-${match.awayScore}`;
    case MATCH_EVENT_TYPES.KICK_OFF:
      return `Kicked off — ${match.home} vs ${match.away}`;
    case MATCH_EVENT_TYPES.HALF_TIME:
      return `Half-time — ${scoreline}`;
    case MATCH_EVENT_TYPES.SECOND_HALF:
      return `Second half underway — ${scoreline}`;
    case MATCH_EVENT_TYPES.FULL_TIME:
      return `Full-time — ${scoreline}`;
    default:
      return null;
  }
}