// components/AIInsightCard.js
// This card is doing the most important brand work in the app: it has to
// feel like a genuine, specific observation — not a generic promo banner.
// The small avatar + "Insight" label + confidence tag together read as
// "an analyst just told me something," which is the whole product thesis.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import AIAvatar from './AIAvatar';
import { colors, type, spacing, radius } from '../theme/tokens';

export default function AIInsightCard({
  insight = "Arsenal have scored in 14 of their last 15 home league matches — their attack has looked sharper than the table suggests.",
  confidence = 'High confidence',
  onExplain,
}) {
  return (
    <GlassCard style={{ marginHorizontal: spacing.xl, marginTop: spacing.lg }}>
      <View style={styles.header}>
        <AIAvatar size={26} isActive />
        <View style={styles.headerText}>
          <Text style={styles.title}>AI Insight</Text>
          <Text style={styles.confidence}>{confidence}</Text>
        </View>
        <View style={styles.liveTag}>
          <Text style={styles.liveTagText}>NEW</Text>
        </View>
      </View>

      <Text style={styles.body}>{insight}</Text>

      <TouchableOpacity activeOpacity={0.7} style={styles.explainRow} onPress={onExplain}>
        <Text style={styles.explainText}>Ask why</Text>
        <Feather name="chevron-right" size={14} color={colors.emerald} />
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    ...type.bodySemiBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  confidence: {
    ...type.body,
    color: colors.emerald,
    fontSize: 11,
    marginTop: 1,
  },
  liveTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.emeraldFaint,
  },
  liveTagText: {
    ...type.mono,
    color: colors.emerald,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  body: {
    ...type.body,
    color: colors.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
  },
  explainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  explainText: {
    ...type.bodySemiBold,
    color: colors.emerald,
    fontSize: 13,
    marginRight: 2,
  },
});
