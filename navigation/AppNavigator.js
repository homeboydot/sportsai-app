// navigation/AppNavigator.js
// Wires the five screens into a real bottom tab navigator. The visual
// tab bar itself lives in components/BottomNav.js (passed as `tabBar`
// below) so the floating glass pill design is fully reusable and not
// tied to navigation internals.
//
// STEP 5 (Match Intelligence roadmap) — wrapped the tab navigator in a
// stack navigator so MatchDetailScreen can be pushed on top of the tabs
// (covering the tab bar, like a normal "drill into detail" screen)
// rather than being just another tab. Tapping a match anywhere in the
// app (see components/LiveMatchCard.js) navigates to "MatchDetail" with
// a matchId param; the tabs themselves are unaffected.

import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import AIChatScreen from '../screens/AIChatScreen';
import MatchesScreen from '../screens/MatchesScreen';
import TicketBuilderScreen from '../screens/TicketBuilderScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import BottomNav from '../components/BottomNav';
import { colors } from '../theme/tokens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Extend React Navigation's DarkTheme with our own tokens so any
// default chrome (e.g. screen transition backgrounds) matches the
// matte black + emerald identity instead of RN's stock dark theme.
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bgBase,
    card: colors.bgBase,
    border: 'transparent',
    text: colors.textPrimary,
    primary: colors.emerald,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        // Keeps tab switches instant/premium rather than a slide —
        // matches the "Linear" feel of snapping between sections.
        animation: 'shift',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AIChat" component={AIChatScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="TicketBuilder" component={TicketBuilderScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}