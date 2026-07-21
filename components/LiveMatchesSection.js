// components/LiveMatchesSection.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import LiveMatchCard from './LiveMatchCard';
import { getLiveMatches } from '../services/matchesService';
import { colors, type, spacing } from '../theme/tokens';

// Home's rail has always shown 4 matches (it's a preview, not the full
// list) — that limit is preserved here exactly as it was when the data
// was a local DEFAULT_MATCHES array.
const HOME_RAIL_LIMIT = 4;

export default function LiveMatchesSection({ matches }) {
  const [fetchedMatches, setFetchedMatches] = useState(matches || []);

  useEffect(() => {
    // If a `matches` prop is explicitly passed in, respect it and skip
    // fetching — this keeps the component's existing override behavior
    // intact for any future caller that wants custom data.
    if (matches) return;

    let isMounted = true;
    getLiveMatches({ limit: HOME_RAIL_LIMIT }).then((data) => {
      if (isMounted) setFetchedMatches(data);
    });
    return () => {
      isMounted = false;
    };
  }, [matches]);

  const displayedMatches = matches || fetchedMatches;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Live Now</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayedMatches.map((m) => (
          <LiveMatchCard key={m.id} match={m} />
        ))}
      </ScrollView>
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
});
