// components/GlassCard.js
// The base glass surface used everywhere: match summary, insight card,
// live match cards, quick actions. Keeping it in one place means the
// "glass" feel is perfectly consistent across the whole app.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, gradients } from '../theme/tokens';

export default function GlassCard({ children, style, intensity = 28, noPadding }) {
  return (
    <View style={[styles.wrapper, shadow.card, style]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={gradients.cardSheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.inner, !noPadding && styles.padding]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGlass,
    backgroundColor: colors.bgCard,
  },
  inner: {
    width: '100%',
  },
  padding: {
    padding: 18,
  },
});
