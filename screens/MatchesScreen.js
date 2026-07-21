// screens/MatchesScreen.js
import React from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenHeader from '../components/ScreenHeader';
import LiveMatchCard from '../components/LiveMatchCard';
import { colors, spacing, gradients } from '../theme/tokens';

// Reuses the exact same match shape LiveMatchesSection uses on Home, so
// this screen and the Home rail can eventually share one data source.
const MATCHES = [
  { id: '1', league: 'Premier League', minute: 67, home: 'Liverpool', away: 'Everton', homeScore: 2, awayScore: 1 },
  { id: '2', league: 'La Liga', minute: 34, home: 'Real Madrid', away: 'Sevilla', homeScore: 1, awayScore: 0 },
  { id: '3', league: 'Serie A', minute: 78, home: 'Inter', away: 'Roma', homeScore: 0, awayScore: 0 },
  { id: '4', league: 'Bundesliga', minute: 12, home: 'Dortmund', away: 'Leipzig', homeScore: 0, awayScore: 1 },
  { id: '5', league: 'Ligue 1', minute: 55, home: 'PSG', away: 'Marseille', homeScore: 3, awayScore: 1 },
];

export default function MatchesScreen() {
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

        <View style={styles.list}>
          {MATCHES.map((m) => (
            <LiveMatchCard key={m.id} match={m} style={styles.fullWidthCard} />
          ))}
        </View>
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
});
