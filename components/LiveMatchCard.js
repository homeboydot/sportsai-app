// components/LiveMatchCard.js
// One tile in the horizontal "Live Now" rail. Deliberately data-forward
// (mono numerals, clean team rows) rather than odds-forward — this reads
// like a scoreboard, not a betting slip.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import GlassCard from './GlassCard';
import { colors, type, spacing, radius } from '../theme/tokens';

export default function LiveMatchCard({ match, style }) {
  const { league, minute, home, away, homeScore, awayScore } = match;

  return (
    <TouchableOpacity activeOpacity={0.85}>
      <GlassCard style={[styles.card, style]} intensity={22}>
        <View style={styles.topRow}>
          <Text style={styles.league} numberOfLines={1}>{league}</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{minute}'</Text>
          </View>
        </View>

        <View style={styles.teamRow}>
          <Text style={styles.teamName} numberOfLines={1}>{home}</Text>
          <Text style={styles.score}>{homeScore}</Text>
        </View>
        <View style={styles.teamRow}>
          <Text style={styles.teamName} numberOfLines={1}>{away}</Text>
          <Text style={styles.score}>{awayScore}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 172,
    marginRight: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  league: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 11,
    flex: 1,
    marginRight: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,90,95,0.12)',
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.live,
    marginRight: 4,
  },
  liveText: {
    ...type.mono,
    color: colors.live,
    fontSize: 10,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  teamName: {
    ...type.bodyMedium,
    color: colors.textPrimary,
    fontSize: 13,
    flex: 1,
    marginRight: 6,
  },
  score: {
    ...type.mono,
    color: colors.textPrimary,
    fontSize: 15,
  },
});
