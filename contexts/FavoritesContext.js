// contexts/FavoritesContext.js
//
// Favorite teams/leagues used to live entirely inside ProfileScreen's
// own local state — saved, but invisible to every other screen. This
// makes favorites a shared, app-wide concern (same pattern as
// contexts/LiveMatchesContext.js) so Home and Matches can actually
// filter/highlight by them too, not just display them on a profile
// page that nothing else reads from.
//
// Persisted on-device via AsyncStorage — no backend involved.

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'favorites:v1';

const DEFAULT_FAVORITES = {
  teams: ['Arsenal', 'Real Madrid', 'Inter Miami'],
  leagues: ['Premier League', 'Champions League', 'La Liga'],
};

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(DEFAULT_FAVORITES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setFavorites(JSON.parse(raw));
      } catch (err) {
        if (__DEV__) console.warn('[FavoritesContext] failed to load saved favorites:', err.message);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)).catch((err) => {
      if (__DEV__) console.warn('[FavoritesContext] failed to save favorites:', err.message);
    });
  }, [favorites, loaded]);

  const addTeam = useCallback((name) => {
    setFavorites((prev) => (prev.teams.includes(name) ? prev : { ...prev, teams: [...prev.teams, name] }));
  }, []);

  const removeTeam = useCallback((name) => {
    setFavorites((prev) => ({ ...prev, teams: prev.teams.filter((t) => t !== name) }));
  }, []);

  const addLeague = useCallback((name) => {
    setFavorites((prev) => (prev.leagues.includes(name) ? prev : { ...prev, leagues: [...prev.leagues, name] }));
  }, []);

  const removeLeague = useCallback((name) => {
    setFavorites((prev) => ({ ...prev, leagues: prev.leagues.filter((l) => l !== name) }));
  }, []);

  // True if a match involves a favorite team (home or away) OR is in a
  // favorite league. Matching is case-insensitive and uses substring
  // containment (e.g. favorite "Real Madrid" matches a match record
  // naming the team "Real Madrid CF") since the exact team-name
  // spelling in the data won't always exactly match what the person
  // typed as a favorite.
  const isFavoriteMatch = useCallback(
    (match) => {
      const home = (match.home ?? '').toLowerCase();
      const away = (match.away ?? '').toLowerCase();
      const league = (match.league ?? '').toLowerCase();

      const teamHit = favorites.teams.some((t) => {
        const needle = t.toLowerCase();
        return home.includes(needle) || away.includes(needle) || needle.includes(home) || needle.includes(away);
      });
      if (teamHit) return true;

      return favorites.leagues.some((l) => league.includes(l.toLowerCase()));
    },
    [favorites]
  );

  const value = useMemo(
    () => ({
      favoriteTeams: favorites.teams,
      favoriteLeagues: favorites.leagues,
      addTeam,
      removeTeam,
      addLeague,
      removeLeague,
      isFavoriteMatch,
      hasFavorites: favorites.teams.length > 0 || favorites.leagues.length > 0,
    }),
    [favorites, addTeam, removeTeam, addLeague, removeLeague, isFavoriteMatch]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites() was called outside of a <FavoritesProvider>. Check App.js.');
  }
  return ctx;
}