// components/ScreenHeader.js
// Shared heading block for every non-Home screen (AI Analyst, Live
// Matches, Ticket Builder, Profile). Keeps the same eyebrow + big
// Space Grotesk title pattern GreetingHeader established on Home, so
// switching tabs never feels like switching apps.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, type, spacing } from '../theme/tokens';

export default function ScreenHeader({ eyebrow, title, subtitle, right }) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  textBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  eyebrow: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 2,
  },
  title: {
    ...type.displaySemiBold,
    color: colors.textPrimary,
    fontSize: 26,
  },
  subtitle: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  right: {
    marginLeft: spacing.md,
  },
});
