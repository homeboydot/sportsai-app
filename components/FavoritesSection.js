// components/FavoritesSection.js
// Shows live/today matches involving the person's favorite teams or
// leagues (set in ProfileScreen, shared via contexts/FavoritesContext.js).
// Hidden entirely if no favorites are set at all — nothing to filter by
// yet, so there's nothing useful to show. If favorites ARE set but none
// match today's card, says so honestly rather than just disappearing,
// so it doesn't look broken.

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import LiveMatchCard from './LiveMatchCard';
import { useFavorites } from '../contexts/FavoritesContext';
import { useLiveMatchesContext } from '../contexts/LiveMatchesContext';
import { colors, type, spacing } from '../theme/tokens';

export default function FavoritesSection({ onSeeAll }) {
  const { hasFavorites, isFavoriteMatch } = useFavorites();
  const { liveMatches, todayFixtures, loading } = useLiveMatchesContext();

  if (!hasFavorites) return null;

  // Live matches first (most relevant), then today's upcoming fixtures
  // for favorite teams/leagues that haven't kicked off yet.
  const favoriteMatches = [...liveMatches, ...todayFixtures].filter(isFavoriteMatch);

  const isFirstLoad = loading && liveMatches.length === 0 && todayFixtures.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>For You</Text>
        {onSeeAll && favoriteMatches.length > 0 && (
          <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {isFirstLoad ? (
        <Text style={styles.statusText}>Loading your teams…</Text>
      ) : favoriteMatches.length === 0 ? (
        <Text style={styles.statusText}>No matches for your favorites today.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {favoriteMatches.map((m) => (
            <LiveMatchCard key={m.id} match={m} style={styles.card} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  title: {
    ...type.displaySemiBold,
    color: colors.textPrimary,
    fontSize: 17,
  },
  seeAll: {
    ...type.bodyMedium,
    color: colors.textTertiary,
    fontSize: 12.5,
  },
  statusText: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 12.5,
    paddingHorizontal: spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  card: {
    marginRight: spacing.md,
    width: 200,
  },
});