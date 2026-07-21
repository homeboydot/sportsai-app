// components/LiveMatchesSection.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import LiveMatchCard from './LiveMatchCard';
import { colors, type, spacing } from '../theme/tokens';

const DEFAULT_MATCHES = [
  { id: '1', league: 'Premier League', minute: 67, home: 'Liverpool', away: 'Everton', homeScore: 2, awayScore: 1 },
  { id: '2', league: 'La Liga', minute: 34, home: 'Real Madrid', away: 'Sevilla', homeScore: 1, awayScore: 0 },
  { id: '3', league: 'Serie A', minute: 78, home: 'Inter', away: 'Roma', homeScore: 0, awayScore: 0 },
  { id: '4', league: 'Bundesliga', minute: 12, home: 'Dortmund', away: 'Leipzig', homeScore: 0, awayScore: 1 },
];

export default function LiveMatchesSection({ matches = DEFAULT_MATCHES }) {
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
        {matches.map((m) => (
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
