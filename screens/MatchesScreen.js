// screens/MatchesScreen.js
import React from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenHeader from '../components/ScreenHeader';
import LiveMatchCard from '../components/LiveMatchCard';
import useLiveMatches from '../hooks/useLiveMatches';
import { colors, type, spacing, gradients } from '../theme/tokens';

export default function MatchesScreen() {
  const { matches, loading, error, refresh } = useLiveMatches();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={gradients.ambient} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenHeader
          eyebrow="Right now"
          title="Live Matches"
          subtitle="Every match your assistant is tracking, updated in real time."
        />

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
            {matches.map((m) => (
              <LiveMatchCard key={m.id} match={m} style={styles.fullWidthCard} />
            ))}
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
