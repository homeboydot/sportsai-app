// components/TagChip.js
// Small static tag — favorite teams, leagues, preferences on Profile.
// Deliberately non-interactive by default (display, not navigation).

import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { colors, type, spacing, radius } from '../theme/tokens';

export default function TagChip({ label, emphasis = false }) {
  return (
    <View style={[styles.chip, emphasis && styles.chipEmphasis]}>
      <Text style={[styles.label, emphasis && styles.labelEmphasis]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipEmphasis: {
    backgroundColor: colors.emeraldFaint,
    borderColor: 'rgba(18,225,155,0.25)',
  },
  label: {
    ...type.bodyMedium,
    color: colors.textSecondary,
    fontSize: 12.5,
  },
  labelEmphasis: {
    color: colors.emerald,
  },
});
