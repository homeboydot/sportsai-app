// components/LiveMatchesSection.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import LiveMatchCard from './LiveMatchCard';
import useLiveMatches from '../hooks/useLiveMatches';
import { colors, type, spacing } from '../theme/tokens';

// Home's rail has always shown 4 matches (it's a preview, not the full
// list) — that limit is preserved here exactly as it was when the data
// was a local DEFAULT_MATCHES array.
const HOME_RAIL_LIMIT = 4;

export default function LiveMatchesSection({ matches: matchesOverride }) {
  // If a `matches` prop is explicitly passed in, use it as-is and skip
  // fetching entirely — preserves the component's existing override
  // behavior for any caller that wants to supply custom data.
  const shouldFetch = !matchesOverride;
  const { matches: fetchedMatches, loading, error } = useLiveMatches({
    limit: HOME_RAIL_LIMIT,
    enabled: shouldFetch,
  });

  const displayedMatches = matchesOverride || fetchedMatches;


  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Live Now</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {shouldFetch && loading && (
        <Text style={styles.statusText}>Loading live matches…</Text>
      )}

      {shouldFetch && !loading && error && (
        <Text style={styles.statusTextError}>Couldn't load live matches.</Text>
      )}

      {(!shouldFetch || (!loading && !error)) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {displayedMatches.map((m) => (
            <LiveMatchCard key={m.id} match={m} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  title: {
    ...type.displaySemiBold,
    color: colors.textPrimary,
    fontSize: 17,
  },
  seeAll: {
    ...type.bodyMedium,
    color: colors.textSecondary,
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  // Loading/error text reuses the same tokens as the rest of the app's
  // secondary copy (e.g. MatchSummaryCard's subline) — no new colors,
  // sizes, or visual language introduced for these states.
  statusText: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13,
    paddingHorizontal: spacing.xl,
  },
  statusTextError: {
    ...type.body,
    color: colors.live,
    fontSize: 13,
    paddingHorizontal: spacing.xl,
  },
});
