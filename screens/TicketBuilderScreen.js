// screens/TicketBuilderScreen.js
import React from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import ScreenHeader from '../components/ScreenHeader';
import GlassCard from '../components/GlassCard';
import BuildTicketButton from '../components/BuildTicketButton';
import { colors, type, spacing, radius, gradients } from '../theme/tokens';

const STEPS = [
  { id: 1, icon: 'search', text: 'Scans form, injuries, and matchup data across every league you follow' },
  { id: 2, icon: 'cpu', text: 'Weighs selections by model confidence, not by hunches or hype' },
  { id: 3, icon: 'file-text', text: 'Hands you a clear, explainable set of picks — never a guess' },
];

export default function TicketBuilderScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={gradients.ambient} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenHeader
          eyebrow="Powered by your AI Analyst"
          title="AI Ticket Builder"
          subtitle="Build intelligent match selections using AI analysis."
        />

        <GlassCard style={styles.stepsCard}>
          {STEPS.map((step, i) => (
            <View key={step.id} style={[styles.stepRow, i !== STEPS.length - 1 && styles.stepDivider]}>
              <View style={styles.stepIcon}>
                <Feather name={step.icon} size={15} color={colors.emerald} />
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </GlassCard>

        <BuildTicketButton
          title="Create Analysis"
          subtitle="Your assistant will build this from live data"
          icon="sliders"
          onPress={() => {}}
        />

        <Text style={styles.footnote}>
          No selections are placed automatically — you always review before anything is saved.
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
  stepsCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  stepDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.emeraldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 1,
  },
  stepText: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    flex: 1,
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
