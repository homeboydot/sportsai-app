// screens/HomeScreen.js
import React from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import GreetingHeader from '../components/GreetingHeader';
import MatchSummaryCard from '../components/MatchSummaryCard';
import BuildTicketButton from '../components/BuildTicketButton';
import AIInsightCard from '../components/AIInsightCard';
import LiveMatchesSection from '../components/LiveMatchesSection';
import QuickActions from '../components/QuickActions';
import { colors, gradients } from '../theme/tokens';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Ambient background wash — a very subtle emerald-tinted glow at
          the top of the screen, fading to matte black. This is what
          keeps flat black from feeling dead. */}
      <LinearGradient colors={gradients.ambient} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <GreetingHeader name="Feranmi" greeting="Good Evening" />
        <MatchSummaryCard />
        <BuildTicketButton onPress={() => {}} />
        <AIInsightCard onExplain={() => {}} />
        <LiveMatchesSection />
        <QuickActions onSelect={() => {}} />
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
    paddingBottom: 140, // clears the floating bottom nav rendered by the tab navigator
  },
});
