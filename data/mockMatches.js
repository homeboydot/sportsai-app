// data/mockMatches.js
// Single source of match data. Previously this same shape was hardcoded
// twice — DEFAULT_MATCHES in components/LiveMatchesSection.js and
// MATCHES in screens/MatchesScreen.js — and would have silently drifted
// out of sync the moment either one was edited.
//
// This is intentionally just a plain array for now. When a real matches
// API is wired in, only services/matchesService.js needs to change —
// nothing that imports the service has to know the difference.

export const mockMatches = [
  { id: '1', league: 'Premier League', minute: 67, home: 'Liverpool', away: 'Everton', homeScore: 2, awayScore: 1 },
  { id: '2', league: 'La Liga', minute: 34, home: 'Real Madrid', away: 'Sevilla', homeScore: 1, awayScore: 0 },
  { id: '3', league: 'Serie A', minute: 78, home: 'Inter', away: 'Roma', homeScore: 0, awayScore: 0 },
  { id: '4', league: 'Bundesliga', minute: 12, home: 'Dortmund', away: 'Leipzig', homeScore: 0, awayScore: 1 },
  { id: '5', league: 'Ligue 1', minute: 55, home: 'PSG', away: 'Marseille', homeScore: 3, awayScore: 1 },
];
