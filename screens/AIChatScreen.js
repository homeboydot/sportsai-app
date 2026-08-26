// screens/AIChatScreen.js
//
// This used to show a hardcoded, fabricated exchange (styled to look
// like a real AI response, including a specific invented stat) with no
// actual text input anywhere on screen — there was no way to type a
// message at all. There's no AI backend behind this app yet (a real
// chat needs a server-side API call, not something safe to do directly
// from the app — see project notes), so rather than keep faking a
// conversation, this now honestly says the feature isn't live yet.

import React from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import AIAvatar from '../components/AIAvatar';
import { colors, type, spacing, gradients } from '../theme/tokens';

export default function AIChatScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={gradients.ambient} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <AIAvatar size={56} isActive={false} />
          <Text style={styles.title}>AI Sports Analyst</Text>
          <Text style={styles.subtitle}>Coming soon</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.bodyText}>
            Real match chat isn't connected yet — this needs a live AI backend, which isn't
            built into the app yet. Live scores and the Ticket Builder both work with real data
            today; this screen will too once that's in place.
          </Text>
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
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    ...type.displaySemiBold,
    color: colors.textPrimary,
    fontSize: 22,
    marginTop: spacing.md,
  },
  subtitle: {
    ...type.bodyMedium,
    color: colors.textTertiary,
    fontSize: 12.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  body: {
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.md,
  },
  bodyText: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
  },
});