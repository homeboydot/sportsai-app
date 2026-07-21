// components/GreetingHeader.js
// Top-of-screen greeting. Copy is time-aware and written the way an
// assistant would actually talk — plain, warm, no exclamation-mark energy.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AIAvatar from './AIAvatar';
import { colors, type, spacing } from '../theme/tokens';

export default function GreetingHeader({ name = 'Feranmi', greeting = 'Good Evening' }) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.eyebrow}>{greeting}</Text>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.statusRow}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>Your assistant is watching 6 leagues tonight</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.8} style={styles.avatarTouch}>
        <AIAvatar size={44} />
        <View style={styles.bellBadge}>
          <Feather name="bell" size={12} color={colors.textPrimary} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 14,
    marginBottom: 2,
  },
  name: {
    ...type.displaySemiBold,
    color: colors.textPrimary,
    fontSize: 28,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald,
    marginRight: 6,
  },
  statusText: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 12.5,
  },
  avatarTouch: {
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
