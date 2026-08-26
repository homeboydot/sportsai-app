// screens/MatchesScreen.js
import React, { useState } from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenHeader from '../components/ScreenHeader';
import LiveMatchCard from '../components/LiveMatchCard';
import CoverageNote from '../components/CoverageNote';
import { useLiveMatchesContext } from '../contexts/LiveMatchesContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { colors, type, spacing, radius, gradients } from '../theme/tokens';

export default function MatchesScreen() {
  const { matches, loading, error, refresh } = useLiveMatchesContext();
  const { hasFavorites, isFavoriteMatch } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const displayedMatches = showFavoritesOnly ? matches.filter(isFavoriteMatch) : matches;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />
      <LinearGradient colors={gradients.ambient} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenHeader
          eyebrow="Right now"
          title="Live Matches"
          subtitle="Scores update roughly every few minutes — not instant, but real."
        />

        <CoverageNote />

        {hasFavorites && (
          <View style={styles.toggleRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[styles.toggleButton, !showFavoritesOnly && styles.toggleButtonActive]}
              onPress={() => setShowFavoritesOnly(false)}
            >
              <Text style={[styles.toggleText, !showFavoritesOnly && styles.toggleTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.75}
              style={[styles.toggleButton, showFavoritesOnly && styles.toggleButtonActive]}
              onPress={() => setShowFavoritesOnly(true)}
            >
              <Text style={[styles.toggleText, showFavoritesOnly && styles.toggleTextActive]}>Favorites</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <Text style={styles.statusText}>Loading live matches…</Text>
        )}

        {!loading && error && (
          <View style={styles.errorBlock}>
            <Text style={styles.statusTextError}>Couldn't load live matches.</Text>
            <TouchableOpacity onPress={refresh} activeOpacity={0.7}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <View style={styles.list}>
            {displayedMatches.length === 0 ? (
              <Text style={styles.emptyText}>
                {showFavoritesOnly
                  ? 'None of your favorites are live right now.'
                  : 'Nothing live right now in the leagues above — check back shortly.'}
              </Text>
            ) : (
              displayedMatches.map((m) => (
                <LiveMatchCard key={m.id} match={m} style={styles.fullWidthCard} />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  list: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.emerald,
  },
  toggleText: {
    ...type.bodyMedium,
    color: colors.textTertiary,
    fontSize: 12.5,
  },
  toggleTextActive: {
    color: colors.textOnEmerald,
  },
  // Overrides LiveMatchCard's default fixed 172px rail width so it
  // reads correctly stacked full-width in a vertical list.
  fullWidthCard: {
    width: '100%',
    marginRight: 0,
    marginBottom: spacing.md,
  },
  statusText: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13.5,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  emptyText: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  errorBlock: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  statusTextError: {
    ...type.body,
    color: colors.live,
    fontSize: 13.5,
    marginBottom: spacing.sm,
  },
  retryText: {
    ...type.bodySemiBold,
    color: colors.emerald,
    fontSize: 13,
  },
});