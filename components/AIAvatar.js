// components/AIAvatar.js
// SIGNATURE ELEMENT
// This orb is the one thing the whole app is built around. Instead of a
// bot mascot or a chat bubble icon, the assistant is represented as a
// calm, breathing light — it pulses gently at rest (idle/listening) and
// speeds up + brightens when it's "thinking" (isActive). It reappears at
// smaller sizes in the header and the AI Insight card so the same
// presence follows the user through the product.

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/tokens';

export default function AIAvatar({ size = 64, isActive = false }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = isActive ? 900 : 2200;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const coreScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });

  return (
    <View style={[styles.container, { width: size * 1.8, height: size * 1.8 }]}>
      {/* Outer breathing ring — the "alive" signal */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: (size * 1.6) / 2,
            borderColor: colors.emerald,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      {/* Core orb */}
      <Animated.View style={{ transform: [{ scale: coreScale }] }}>
        <LinearGradient
          colors={gradients.avatarCore}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[
            styles.core,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <View style={[styles.innerHighlight, { width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2 }]} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 12,
  },
  innerHighlight: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    position: 'absolute',
    top: '12%',
    left: '18%',
  },
});
