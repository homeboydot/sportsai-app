// components/SuggestionChip.js
// Tappable prompt suggestion — used on AIChatScreen, and reusable
// anywhere else the assistant offers quick next actions.

import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, type, spacing, radius } from '../theme/tokens';

export default function SuggestionChip({ label, icon = 'arrow-up-right', onPress }) {
  return (
    <TouchableOpacity style={styles.chip} activeOpacity={0.75} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
      <Feather name={icon} size={13} color={colors.emerald} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    ...type.bodyMedium,
    color: colors.textPrimary,
    fontSize: 12.5,
    marginRight: 6,
  },
});
