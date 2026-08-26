// screens/TicketBuilderScreen.js
//
// This used to describe an "AI Analyst" process ("scans form, injuries,
// weighs by model confidence...") that didn't exist anywhere in the
// code — the "Create Analysis" button did nothing. There's no AI/stats
// backend behind this app yet (see contexts/LiveMatchesContext.js and
// the project notes for why), so rather than keep faking that, this is
// now a real, working, zero-cost feature: pick matches from today's
// actual data, copy them as a plain-text list, then paste that list
// into whichever betting app you actually use to place picks manually.
// No predictions, no confidence scores — just real matches you choose.

import React, { useState } from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

import ScreenHeader from '../components/ScreenHeader';
import TicketMatchRow from '../components/TicketMatchRow';
import BuildTicketButton from '../components/BuildTicketButton';
import { useLiveMatchesContext } from '../contexts/LiveMatchesContext';
import { colors, type, spacing, gradients } from '../theme/tokens';

function formatTicketText(selectedMatches) {
  const lines = selectedMatches.map((m, i) => {
    const isLive = m.status === 'IN_PLAY' || m.status === 'PAUSED';
    const scoreSuffix = isLive ? ` — LIVE ${m.minute}' (${m.homeScore}-${m.awayScore})` : '';
    return `${i + 1}. ${m.home} vs ${m.away} (${m.league})${scoreSuffix}`;
  });
  return `My Ticket — ${selectedMatches.length} pick${selectedMatches.length === 1 ? '' : 's'}\n${lines.join('\n')}`;
}

export default function TicketBuilderScreen() {
  const { liveMatches, todayFixtures, loading } = useLiveMatchesContext();
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [justCopied, setJustCopied] = useState(false);

  // Live matches first (most relevant/urgent), then today's upcoming
  // fixtures. Finished matches are intentionally excluded — nothing to
  // pick there.
  const allMatches = [...liveMatches, ...todayFixtures];

  const toggleMatch = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setJustCopied(false);
  };

  const selectedMatches = allMatches.filter((m) => selectedIds.has(m.id));
  const hasSelection = selectedMatches.length > 0;

  const handleCopy = async () => {
    if (!hasSelection) return;
    await Clipboard.setStringAsync(formatTicketText(selectedMatches));
    setJustCopied(true);
  };

  const isFirstLoad = loading && allMatches.length === 0;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={gradients.ambient} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenHeader
          eyebrow="Your picks, your way"
          title="Ticket Builder"
          subtitle="Tap matches from today's real card to build a list, then copy it to paste into your betting app."
        />

        <View style={styles.listBlock}>
          {isFirstLoad ? (
            <Text style={styles.statusText}>Loading today's matches…</Text>
          ) : allMatches.length === 0 ? (
            <Text style={styles.statusText}>No matches on today's card right now.</Text>
          ) : (
            allMatches.map((match) => (
              <TicketMatchRow
                key={match.id}
                match={match}
                selected={selectedIds.has(match.id)}
                onToggle={toggleMatch}
              />
            ))
          )}
        </View>

        <BuildTicketButton
          title={justCopied ? 'Copied!' : 'Copy My Ticket'}
          subtitle={
            hasSelection
              ? `${selectedMatches.length} match${selectedMatches.length === 1 ? '' : 'es'} selected`
              : 'Select matches above to build your ticket'
          }
          icon={justCopied ? 'check' : 'copy'}
          onPress={handleCopy}
          style={!hasSelection && styles.buttonDisabled}
        />

        <Text style={styles.footnote}>
          This copies a plain list of your picks — nothing is placed automatically, and this
          doesn't connect to any betting platform directly. Paste it wherever you place bets.
        </Text>
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
  listBlock: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  statusText: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footnote: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginHorizontal: spacing.xxl,
    lineHeight: 16,
  },
});