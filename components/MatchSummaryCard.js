// components/MatchSummaryCard.js
// A single, glanceable read on "what matters tonight" — not a betting
// slip. Framed as a briefing, the way an assistant would summarize a day.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import { colors, type, spacing, radius } from '../theme/tokens';

export default function MatchSummaryCard({
  headline = "Tonight's slate is stacked",
  subline = '4 top-6 clashes across Europe, headlined by the Merseyside derby.',
  stats = [
    { label: 'Matches', value: '12' },
    { label: 'Leagues', value: '6' },
    { label: 'Key games', value: '4' },
  ],
}) {
  return (
    <GlassCard style={{ marginHorizontal: spacing.xl, marginTop: spacing.lg }}>
      <View style={styles.topRow}>
        <View style={styles.iconChip}>
          <Feather name="activity" size={15} color={colors.emerald} />
        </View>
        <Text style={styles.label}>Today's Briefing</Text>
      </View>

      <Text style={styles.headline}>{headline}</Text>
      <Text style={styles.subline}>{subline}</Text>

      <View style={styles.statsRow}>
        {stats.map((s, i) => (
          <View key={s.label} style={[styles.statBlock, i !== 0 && styles.statDivider]}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconChip: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.emeraldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  label: {
    ...type.bodyMedium,
    color: colors.textSecondary,
    fontSize: 12.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headline: {
    ...type.displaySemiBold,
    color: colors.textPrimary,
    fontSize: 20,
    marginBottom: 6,
  },
  subline: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderGlass,
  },
  statBlock: {
    flex: 1,
    paddingLeft: 4,
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.borderGlass,
    paddingLeft: spacing.lg,
    marginLeft: spacing.md,
  },
  statValue: {
    ...type.mono,
    color: colors.textPrimary,
    fontSize: 18,
  },
  statLabel: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 11.5,
    marginTop: 2,
  },
});
