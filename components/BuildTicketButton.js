// components/BuildTicketButton.js
// The single most important tap target on the screen. Framed around
// what the assistant DOES (builds a personalized ticket / plan from
// analysis) rather than "place bet" language — this is the clearest
// signal that the product is an analyst, not a bookmaker.

import React, { useRef } from 'react';
import { Text, StyleSheet, Animated, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { colors, type, spacing, radius, shadow, gradients } from '../theme/tokens';

export default function BuildTicketButton({
  onPress,
  title = 'Build My Ticket',
  subtitle = "AI-assembled from tonight's data",
  icon = 'cpu',
  style,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.wrapper, style]}>
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        <LinearGradient
          colors={gradients.cta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, shadow.glowEmerald]}
        >
          <View style={styles.iconCircle}>
            <Feather name={icon} size={16} color={colors.textOnEmerald} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <Feather name="arrow-up-right" size={20} color={colors.textOnEmerald} />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  button: {
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(2,18,12,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textBlock: { flex: 1 },
  title: {
    ...type.displaySemiBold,
    color: colors.textOnEmerald,
    fontSize: 16,
  },
  subtitle: {
    ...type.bodyMedium,
    color: 'rgba(2,18,12,0.65)',
    fontSize: 11.5,
    marginTop: 1,
  },
});
