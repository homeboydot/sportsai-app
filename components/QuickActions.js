// components/QuickActions.js
// Secondary navigation into the assistant's core capabilities. Icons +
// short verbs, matched one-to-one so every action names exactly what it
// does (per the product's plain-language voice).

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, type, spacing, radius } from '../theme/tokens';

const ACTIONS = [
  { id: 'ask', icon: 'message-circle', label: 'Ask AI' },
  { id: 'compare', icon: 'bar-chart-2', label: 'Compare Teams' },
  { id: 'stats', icon: 'trending-up', label: 'Player Stats' },
  { id: 'saved', icon: 'bookmark', label: 'Saved Tickets' },
];

export default function QuickActions({ onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.grid}>
        {ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.id}
            activeOpacity={0.75}
            style={styles.item}
            onPress={() => onSelect && onSelect(a.id)}
          >
            <View style={styles.iconWrap}>
              <Feather name={a.icon} size={18} color={colors.emerald} />
            </View>
            <Text style={styles.label}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...type.displaySemiBold,
    color: colors.textPrimary,
    fontSize: 17,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    width: '48%',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.emeraldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    ...type.bodySemiBold,
    color: colors.textPrimary,
    fontSize: 13,
  },
});
