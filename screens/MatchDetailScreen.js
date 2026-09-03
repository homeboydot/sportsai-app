// screens/MatchDetailScreen.js
//
// Step 5 of the Match Intelligence roadmap: Match Story. This is the
// first VISIBLE feature built on Steps 3/4's plumbing (match history +
// event detection) — a real timeline of what's actually happened in a
// specific match, built entirely from real, detected events.
//
// IMPORTANT — what this deliberately is NOT: there is no narrative
// sentence generation, no "why is this team dominating" interpretation,
// no AI involved anywhere on this screen. Every line in the timeline
// comes directly from utils/matchEvents.js's plain factual descriptions
// (see describeMatchEvent()) — a goal, a kickoff, a half-time, a
// full-time, each tied to the real score at that moment. That
// narrative/interpretation layer is Step 6, and only becomes honest to
// build once a real AI backend exists (it doesn't yet — see
// screens/AIChatScreen.js's "coming soon" state for why).
//
// Navigation: expects a `route.params.matchId` to know which match to
// show, and looks that match up from the shared live/today/finished
// arrays already in contexts/LiveMatchesContext.js — no separate fetch,
// no new API calls.

import React from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import GlassCard from '../components/GlassCard';
import { useLiveMatchesContext } from '../contexts/LiveMatchesContext';
import { colors, type, spacing, radius, gradients } from '../theme/tokens';

function findMatchById(matchId, { liveMatches, todayFixtures, finishedMatches }) {
  return (
    liveMatches.find((m) => m.id === matchId) ||
    todayFixtures.find((m) => m.id === matchId) ||
    finishedMatches.find((m) => m.id === matchId) ||
    null
  );
}

function EventIcon({ type }) {
  const iconByType = {
    GOAL_HOME: 'target',
    GOAL_AWAY: 'target',
    KICK_OFF: 'play-circle',
    HALF_TIME: 'pause-circle',
    SECOND_HALF: 'play-circle',
    FULL_TIME: 'check-circle',
  };
  return <Feather name={iconByType[type] ?? 'circle'} size={14} color={colors.emerald} />;
}

export default function MatchDetailScreen({ route, navigation }) {
  const matchId = route?.params?.matchId;
  const { liveMatches, todayFixtures, finishedMatches, recentEvents } = useLiveMatchesContext();

  const match = findMatchById(matchId, { liveMatches, todayFixtures, finishedMatches });

  // Oldest-first, so the timeline reads top-to-bottom as "how the
  // match unfolded" rather than newest-first like a notification feed.
  const timeline = recentEvents.filter((e) => e.matchId === matchId).slice().reverse();

  const isLive = match && (match.status === 'IN_PLAY' || match.status === 'PAUSED');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />
      <LinearGradient colors={gradients.ambient} style={StyleSheet.absoluteFill} />

      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!match ? (
          <Text style={styles.notFoundText}>
            Couldn't find this match — it may have moved out of today's data since you tapped it.
          </Text>
        ) : (
          <>
            <View style={styles.scoreBlock}>
              <Text style={styles.league}>{match.league}</Text>
              <View style={styles.teamsRow}>
                <Text style={styles.teamName} numberOfLines={1}>{match.home}</Text>
                <Text style={styles.score}>{match.homeScore} - {match.awayScore}</Text>
                <Text style={styles.teamName} numberOfLines={1}>{match.away}</Text>
              </View>
              <View style={styles.statusRow}>
                {isLive ? <View style={styles.liveDot} /> : null}
                <Text style={styles.statusText}>
                  {isLive
                    ? `${match.minuteIsEstimated ? '~' : ''}${match.minute}' — ${match.status === 'PAUSED' ? 'Half-time' : 'Live'}`
                    : match.status === 'FINISHED'
                      ? 'Full-time'
                      : 'Scheduled today'}
                </Text>
              </View>
            </View>

            <GlassCard style={styles.storyCard}>
              <Text style={styles.storyTitle}>Match Story</Text>

              {timeline.length === 0 ? (
                <Text style={styles.emptyStoryText}>
                  {isLive || match.status === 'FINISHED'
                    ? "Nothing detected yet — events appear here as they're picked up between refreshes."
                    : "This match hasn't kicked off yet — the story starts once it does."}
                </Text>
              ) : (
                timeline.map((event, i) => (
                  <View key={`${event.matchId}-${event.type}-${event.at}`} style={styles.timelineRow}>
                    <View style={styles.timelineIconCol}>
                      <EventIcon type={event.type} />
                      {i !== timeline.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <Text style={styles.timelineText}>{event.description}</Text>
                  </View>
                ))
              )}
            </GlassCard>

            <Text style={styles.footnote}>
              Every line above reflects a real change in this match's actual score or status — nothing here is
              predicted or AI-generated.
            </Text>
          </>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  notFoundText: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: spacing.xxl,
    marginHorizontal: spacing.xl,
  },
  scoreBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  league: {
    ...type.bodyMedium,
    color: colors.textTertiary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    ...type.bodySemiBold,
    color: colors.textPrimary,
    fontSize: 16,
    flexShrink: 1,
    maxWidth: 120,
    textAlign: 'center',
  },
  score: {
    ...type.displaySemiBold,
    color: colors.textPrimary,
    fontSize: 28,
    marginHorizontal: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.live,
    marginRight: 6,
  },
  statusText: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 12.5,
  },
  storyCard: {
    marginHorizontal: spacing.xl,
  },
  storyTitle: {
    ...type.bodySemiBold,
    color: colors.textPrimary,
    fontSize: 14.5,
    marginBottom: spacing.md,
  },
  emptyStoryText: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    minHeight: 16,
    backgroundColor: colors.borderGlass,
    marginTop: 4,
  },
  timelineText: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
    marginLeft: spacing.sm,
    marginTop: -1,
  },
  footnote: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginHorizontal: spacing.xxl,
    lineHeight: 15,
  },
});