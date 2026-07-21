// screens/AIChatScreen.js
import React from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import AIAvatar from '../components/AIAvatar';
import ChatBubble from '../components/ChatBubble';
import SuggestionChip from '../components/SuggestionChip';
import { colors, type, spacing, gradients } from '../theme/tokens';

const SUGGESTIONS = [
  { id: 'analyze', label: 'Analyze today\u2019s games', icon: 'activity' },
  { id: 'build', label: 'Build a ticket', icon: 'cpu' },
  { id: 'explain', label: 'Explain this match', icon: 'help-circle' },
];

export default function AIChatScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={gradients.ambient} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header: avatar front and center — this screen is the most
            direct expression of "AI assistant," so the orb gets the
            largest, most prominent placement in the whole app. */}
        <View style={styles.header}>
          <AIAvatar size={56} isActive />
          <Text style={styles.title}>AI Sports Analyst</Text>
          <Text style={styles.subtitle}>Ask me anything about today's matches.</Text>
        </View>

        <View style={styles.conversation}>
          <ChatBubble
            from="user"
            text="What's the safest pick on tonight's card?"
          />
          <ChatBubble
            from="ai"
            text="Arsenal at home have the strongest underlying numbers tonight — high shot volume, low goals conceded. I'd weight that above anything with a bigger headline."
          />
        </View>

        <View style={styles.suggestionsBlock}>
          <Text style={styles.suggestionsLabel}>Try asking</Text>
          <View style={styles.chipRow}>
            {SUGGESTIONS.map((s) => (
              <SuggestionChip key={s.id} label={s.label} icon={s.icon} onPress={() => {}} />
            ))}
          </View>
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
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
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
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13.5,
    marginTop: 6,
    textAlign: 'center',
  },
  conversation: {
    marginBottom: spacing.lg,
  },
  suggestionsBlock: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  suggestionsLabel: {
    ...type.bodyMedium,
    color: colors.textTertiary,
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
