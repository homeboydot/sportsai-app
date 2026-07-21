// components/ChatBubble.js
// A single message in the AI Analyst conversation. Two variants —
// 'ai' (glass, left-aligned, avatar) and 'user' (solid emerald-tinted,
// right-aligned) — reused wherever chat transcripts show up later.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from './GlassCard';
import AIAvatar from './AIAvatar';
import { colors, type, spacing, radius } from '../theme/tokens';

export default function ChatBubble({ from = 'ai', text }) {
  if (from === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiRow}>
      <View style={styles.avatarSlot}>
        <AIAvatar size={22} />
      </View>
      <GlassCard style={styles.aiBubble} intensity={22}>
        <Text style={styles.aiText}>{text}</Text>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  avatarSlot: {
    width: 30,
    alignItems: 'center',
    marginRight: 4,
    marginTop: 2,
  },
  aiBubble: {
    flex: 1,
    borderTopLeftRadius: radius.sm,
  },
  aiText: {
    ...type.body,
    color: colors.textPrimary,
    fontSize: 13.5,
    lineHeight: 20,
  },
  userRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  userBubble: {
    backgroundColor: colors.emeraldFaint,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: radius.md,
    borderTopRightRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '80%',
  },
  userText: {
    ...type.bodyMedium,
    color: colors.textPrimary,
    fontSize: 13.5,
    lineHeight: 19,
  },
});
