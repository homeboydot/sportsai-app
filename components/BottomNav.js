// components/BottomNav.js
// Custom tabBar for @react-navigation/bottom-tabs.
//
// Visual identity is unchanged from the original static prototype:
// floating glass pill, dark background, emerald active state. What's
// new is that it's wired to real navigation state (state/descriptors/
// navigation from React Navigation) instead of local component state,
// plus a sliding active-indicator animation and a per-icon glow/scale
// bounce on focus — this is the "smooth animation" and "active icon
// glow" the upgrade asked for, without turning into a stock Android
// tab bar.

import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors, radius, shadow } from '../theme/tokens';

// Maps React Navigation route names to Feather icons. Keep this in sync
// with the screen names registered in navigation/AppNavigator.js.
const ROUTE_ICONS = {
  Home: 'home',
  AIChat: 'message-circle',
  Matches: 'activity',
  TicketBuilder: 'layers',
  Profile: 'user',
};

function TabIcon({ name, focused }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.18 : 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Feather name={name} size={20} color={focused ? colors.emerald : colors.textTertiary} />
    </Animated.View>
  );
}

export default function BottomNav({ state, descriptors, navigation }) {
  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabCount = state.routes.length;
  const tabSlot = barWidth / tabCount;

  useEffect(() => {
    if (!barWidth) return;
    Animated.spring(indicatorX, {
      toValue: state.index * tabSlot,
      useNativeDriver: true,
      speed: 22,
      bounciness: 7,
    }).start();
  }, [state.index, barWidth]);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        style={[styles.bar, shadow.card]}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Sliding active-tab indicator, positioned under whichever
            icon is focused. Renders once we know the bar's width. */}
        {barWidth > 0 && (
          <Animated.View
            style={[
              styles.activePill,
              {
                width: tabSlot,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          >
            <View style={styles.activePillInner} />
          </Animated.View>
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconName = ROUTE_ICONS[route.name] || 'circle';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              style={styles.tab}
              activeOpacity={0.7}
              onPress={onPress}
            >
              <TabIcon name={iconName} focused={isFocused} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingBottom: 24,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: '88%',
    justifyContent: 'space-between',
  },
  tab: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  activePill: {
    position: 'absolute',
    top: 10,
    left: 0,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activePillInner: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.emeraldFaint,
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
});
