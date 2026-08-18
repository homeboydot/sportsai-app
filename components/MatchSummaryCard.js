// components/MatchSummaryCard.js
// A single, glanceable read on "what matters tonight" — not a betting
// slip. Framed as a briefing, the way an assistant would summarize a day.
//
// Previously this card took headline/subline/stats as props with
// hardcoded fake defaults ("12 matches, 6 leagues, 4 key games", a
// fabricated "Merseyside derby" headline) — it never actually reflected
// what was happening. Now it reads the same shared match data every
// other real screen uses (contexts/LiveMatchesContext.js) and computes
// real counts. "Key games" was dropped rather than kept as a fake
// stat — there's no real signal in the data for match "importance,"
// so making one up would just be a different kind of fake number. It's
// replaced with "Live now", which is a real, honestly-computable count.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import { useLiveMatchesContext } from '../contexts/LiveMatchesContext';
import { colors, type, spacing, radius } from '../theme/tokens';

export default function MatchSummaryCard() {
  const { liveMatches, todayFixtures, finishedMatches, loading } = useLiveMatchesContext();

  const liveCount = liveMatches.length;
  const totalToday = liveCount + todayFixtures.length + finishedMatches.length;

  const leagueCount = new Set(
    [...liveMatches, ...todayFixtures, ...finishedMatches]
      .map((m) => m.league)
      .filter(Boolean)
  ).size;

  // Only show the true first-load "nothing yet" state before any data
  // has ever arrived — once there's been at least one successful load,
  // keep showing real (possibly zero) numbers rather than flashing back
  // to a loading message on background refreshes (same reasoning as
  // hooks/useLiveMatches.js's isInitialLoadRef).
  const isFirstLoad = loading && totalToday === 0;

  let headline;
  let subline;

  if (isFirstLoad) {
    headline = "Loading today's matches…";
    subline = 'Pulling in fixtures now.';
  } else if (liveCount > 0) {
    headline = `${liveCount} match${liveCount === 1 ? '' : 'es'} live right now`;
    subline = `${totalToday} total today across ${leagueCount} league${leagueCount === 1 ? '' : 's'}.`;
  } else if (totalToday > 0) {
    headline = `${totalToday} match${totalToday === 1 ? '' : 'es'} today`;
    subline = `Across ${leagueCount} league${leagueCount === 1 ? '' : 's'} — none live at the moment.`;
  } else {
    headline = 'No matches today';
    subline = 'Nothing scheduled in covered leagues right now — check back later.';
  }

  const stats = [
    { label: 'Matches', value: String(totalToday) },
    { label: 'Leagues', value: String(leagueCount) },
    { label: 'Live now', value: String(liveCount) },
  ];

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