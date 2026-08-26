// screens/HomeScreen.js
import React from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import GreetingHeader from '../components/GreetingHeader';
import MatchSummaryCard from '../components/MatchSummaryCard';
import BuildTicketButton from '../components/BuildTicketButton';
import AIInsightCard from '../components/AIInsightCard';
import LiveMatchesSection from '../components/LiveMatchesSection';
import FavoritesSection from '../components/FavoritesSection';
import QuickActions from '../components/QuickActions';
import { colors, gradients } from '../theme/tokens';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

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
        <BuildTicketButton onPress={() => navigation.navigate('TicketBuilder')} />
        <AIInsightCard onExplain={() => navigation.navigate('AIChat')} />
        <FavoritesSection onSeeAll={() => navigation.navigate('Matches')} />
        <LiveMatchesSection />
        <QuickActions
          onSelect={(actionId) => {
            // 'compare' (Compare Teams) and 'stats' (Player Stats) don't
            // have a destination screen yet — intentionally left as a
            // no-op rather than pointing them somewhere misleading.
            // See project notes for what's still pending here.
            if (actionId === 'ask') {
              navigation.navigate('AIChat');
            } else if (actionId === 'saved') {
              navigation.navigate('TicketBuilder');
            }
          }}
        />
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