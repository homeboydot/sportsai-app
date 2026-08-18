// components/AIInsightCard.js
// This card is doing the most important brand work in the app: it has to
// feel like a genuine, specific observation — not a generic promo banner.
//
// It previously showed a hardcoded, fabricated statistical claim
// ("Arsenal have scored in 14 of their last 15 home matches") labeled
// "AI Insight" with a fake "High confidence" score — a specific,
// invented stat presented as real analysis, with no actual stats/
// prediction engine behind it. In a betting-adjacent app that's worth
// taking seriously: someone could genuinely factor a fabricated
// "high confidence" claim into a real decision. There's no real
// analysis engine to wire this up to yet, so rather than swap in a
// different fake stat, this now surfaces something true — a live spot-
// light pulled from the same real match data every other screen uses
// (contexts/LiveMatchesContext.js) — labeled honestly as what it is
// (a live score, not an AI prediction) rather than dressed up as
// analysis it isn't.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import AIAvatar from './AIAvatar';
import { useLiveMatchesContext } from '../contexts/LiveMatchesContext';
import { colors, type, spacing, radius } from '../theme/tokens';

export default function AIInsightCard({ onExplain }) {
  const { liveMatches, todayFixtures, loading } = useLiveMatchesContext();

  // Prefer the live match with the most goals scored so far (most
  // "eventful" at a glance) as the spotlight; fall back to the next
  // fixture on today's card if nothing is live yet.
  const spotlightLive = liveMatches.length
    ? [...liveMatches].sort((a, b) => (b.homeScore + b.awayScore) - (a.homeScore + a.awayScore))[0]
    : null;
  const spotlightUpcoming = !spotlightLive && todayFixtures.length ? todayFixtures[0] : null;

  const isFirstLoad = loading && !spotlightLive && !spotlightUpcoming;

  let tagText = 'TODAY';
  let title = 'Match Spotlight';
  let body;

  if (isFirstLoad) {
    title = 'Match Spotlight';
    tagText = '—';
    body = 'Pulling in today\u2019s matches\u2026';
  } else if (spotlightLive) {
    tagText = 'LIVE';
    body = `${spotlightLive.home} ${spotlightLive.homeScore}-${spotlightLive.awayScore} ${spotlightLive.away} — ${spotlightLive.minute}' in the ${spotlightLive.league}.`;
  } else if (spotlightUpcoming) {
    body = `${spotlightUpcoming.home} vs ${spotlightUpcoming.away} is on today's card in the ${spotlightUpcoming.league}.`;
  } else {
    tagText = '—';
    body = 'No matches on today\u2019s card in your covered leagues right now.';
  }

  return (
    <GlassCard style={{ marginHorizontal: spacing.xl, marginTop: spacing.lg }}>
      <View style={styles.header}>
        <AIAvatar size={26} isActive />
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.liveTag}>
          <Text style={styles.liveTagText}>{tagText}</Text>
        </View>
      </View>

      <Text style={styles.body}>{body}</Text>

      <TouchableOpacity activeOpacity={0.7} style={styles.explainRow} onPress={onExplain}>
        <Text style={styles.explainText}>Ask AI about this</Text>
        <Feather name="chevron-right" size={14} color={colors.emerald} />
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    ...type.bodySemiBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  confidence: {
    ...type.body,
    color: colors.emerald,
    fontSize: 11,
    marginTop: 1,
  },
  liveTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.emeraldFaint,
  },
  liveTagText: {
    ...type.mono,
    color: colors.emerald,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  body: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
  },
  explainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  explainText: {
    ...type.bodySemiBold,
    color: colors.emerald,
    fontSize: 13,
    marginRight: 2,
  },
});