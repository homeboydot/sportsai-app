// screens/MatchesScreen.js
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenHeader from '../components/ScreenHeader';
import LiveMatchCard from '../components/LiveMatchCard';
import { getLiveMatches } from '../services/matchesService';
import { colors, spacing, gradients } from '../theme/tokens';

export default function MatchesScreen() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    let isMounted = true;
    getLiveMatches().then((data) => {
      if (isMounted) setMatches(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
          {matches.map((m) => (
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
