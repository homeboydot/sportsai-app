// screens/ProfileScreen.js
//
// Previously every control on this screen was decorative — the edit
// button, both "+" add-chip buttons, and all three "AI Preferences"
// rows had no onPress at all. Favorite teams/leagues and preferences
// now genuinely save on-device (AsyncStorage — free, no backend
// needed) and persist across app restarts.
//
// AI Preferences remain honestly scoped: there's no AI backend yet
// (see screens/AIChatScreen.js), so these are real, saved settings
// that don't affect anything YET — the note under that section says so
// plainly, rather than implying they're already steering a live AI.

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import GlassCard from '../components/GlassCard';
import TagChip from '../components/TagChip';
import PromptModal from '../components/PromptModal';
import { useFavorites } from '../contexts/FavoritesContext';
import { colors, type, spacing, radius, gradients } from '../theme/tokens';

const STORAGE_KEY = 'profile:v1';

const DEFAULT_PROFILE = {
  name: 'Feranmi',
  aiPreferences: {
    tone: 'Data-first',
    risk: 'Balanced',
    alertsOn: true,
  },
};

const TONE_OPTIONS = ['Data-first', 'Balanced', 'Bold'];
const RISK_OPTIONS = ['Conservative', 'Balanced', 'Aggressive'];

function cycleOption(current, options) {
  const nextIndex = (options.indexOf(current) + 1) % options.length;
  return options[nextIndex];
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ProfileScreen() {
  const { favoriteTeams, favoriteLeagues, addTeam, removeTeam: removeFavoriteTeam, addLeague, removeLeague: removeFavoriteLeague } = useFavorites();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [promptConfig, setPromptConfig] = useState(null); // { title, placeholder, onSubmit }

  // Load any previously saved profile once on mount. If nothing's been
  // saved yet (first-ever launch), DEFAULT_PROFILE stays as-is.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setProfile(JSON.parse(raw));
      } catch (err) {
        if (__DEV__) console.warn('[ProfileScreen] failed to load saved profile:', err.message);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Persist on every change, once initial load has completed (avoids
  // overwriting a saved profile with DEFAULT_PROFILE during the brief
  // window before the load above finishes).
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile)).catch((err) => {
      if (__DEV__) console.warn('[ProfileScreen] failed to save profile:', err.message);
    });
  }, [profile, loaded]);

  const updateProfile = useCallback((updater) => {
    setProfile((prev) => updater(prev));
  }, []);

  const handleAddTeam = (name) => {
    addTeam(name);
    setPromptConfig(null);
  };

  const handleAddLeague = (name) => {
    addLeague(name);
    setPromptConfig(null);
  };

  const saveName = (name) => {
    updateProfile((prev) => ({ ...prev, name }));
    setPromptConfig(null);
  };

  const removeTeam = (name) => {
    Alert.alert('Remove team?', `Remove ${name} from your favorites?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFavoriteTeam(name) },
    ]);
  };

  const removeLeague = (name) => {
    Alert.alert('Remove league?', `Remove ${name} from your favorites?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFavoriteLeague(name) },
    ]);
  };

  const cycleTone = () => {
    updateProfile((prev) => ({
      ...prev,
      aiPreferences: { ...prev.aiPreferences, tone: cycleOption(prev.aiPreferences.tone, TONE_OPTIONS) },
    }));
  };

  const cycleRisk = () => {
    updateProfile((prev) => ({
      ...prev,
      aiPreferences: { ...prev.aiPreferences, risk: cycleOption(prev.aiPreferences.risk, RISK_OPTIONS) },
    }));
  };

  const toggleAlerts = () => {
    updateProfile((prev) => ({
      ...prev,
      aiPreferences: { ...prev.aiPreferences, alertsOn: !prev.aiPreferences.alertsOn },
    }));
  };

  const aiPreferenceRows = [
    { id: 'tone', icon: 'sliders', label: 'Analysis style', value: profile.aiPreferences.tone, onPress: cycleTone },
    { id: 'risk', icon: 'shield', label: 'Risk appetite', value: profile.aiPreferences.risk, onPress: cycleRisk },
    { id: 'alerts', icon: 'bell', label: 'Insight alerts', value: profile.aiPreferences.alertsOn ? 'On' : 'Off', onPress: toggleAlerts },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />
      <LinearGradient colors={gradients.ambient} style={StyleSheet.absoluteFill} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Identity block */}
        <View style={styles.identityRow}>
          <LinearGradient
            colors={['#3CFFC4', '#0B9E6D']}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.identityText}>
            <Text style={styles.name}>{profile.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.75}
            onPress={() =>
              setPromptConfig({
                title: 'Your name',
                placeholder: 'Enter your name',
                initialValue: profile.name,
                onSubmit: saveName,
              })
            }
          >
            <Feather name="edit-2" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Section title="Favorite Teams">
          <View style={styles.chipRow}>
            {favoriteTeams.map((t) => (
              <TouchableOpacity key={t} onPress={() => removeTeam(t)} activeOpacity={0.7}>
                <TagChip label={t} emphasis />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addChip}
              activeOpacity={0.75}
              onPress={() =>
                setPromptConfig({ title: 'Add a favorite team', placeholder: 'e.g. Manchester City', onSubmit: handleAddTeam })
              }
            >
              <Feather name="plus" size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="Favorite Leagues">
          <View style={styles.chipRow}>
            {favoriteLeagues.map((l) => (
              <TouchableOpacity key={l} onPress={() => removeLeague(l)} activeOpacity={0.7}>
                <TagChip label={l} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addChip}
              activeOpacity={0.75}
              onPress={() =>
                setPromptConfig({ title: 'Add a favorite league', placeholder: 'e.g. Serie A', onSubmit: handleAddLeague })
              }
            >
              <Feather name="plus" size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>Tap a chip to remove it. These now filter Home and Matches too.</Text>
        </Section>

        <Section title="AI Preferences">
          <GlassCard noPadding>
            {aiPreferenceRows.map((pref, i) => (
              <TouchableOpacity
                key={pref.id}
                activeOpacity={0.7}
                onPress={pref.onPress}
                style={[styles.prefRow, i !== aiPreferenceRows.length - 1 && styles.prefDivider]}
              >
                <View style={styles.prefIcon}>
                  <Feather name={pref.icon} size={15} color={colors.emerald} />
                </View>
                <Text style={styles.prefLabel}>{pref.label}</Text>
                <View style={styles.prefValuePill}>
                  <Text style={styles.prefValueText}>{pref.value}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </GlassCard>
          <Text style={styles.hintText}>
            Saved now — these will take effect once AI Chat is live. Tap a row to change it.
          </Text>
        </Section>
      </ScrollView>

      {promptConfig && (
        <PromptModal
          visible
          title={promptConfig.title}
          placeholder={promptConfig.placeholder}
          initialValue={promptConfig.initialValue}
          onCancel={() => setPromptConfig(null)}
          onSubmit={promptConfig.onSubmit}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  scrollContent: {
    paddingBottom: 160,
    paddingHorizontal: spacing.xl,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...type.displaySemiBold,
    color: colors.textOnEmerald,
    fontSize: 22,
  },
  identityText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    ...type.displaySemiBold,
    color: colors.textPrimary,
    fontSize: 20,
  },
  handle: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 12.5,
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    ...type.bodyMedium,
    color: colors.textTertiary,
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  hintText: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  addChip: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  prefDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  prefIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.emeraldFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  prefLabel: {
    ...type.bodyMedium,
    color: colors.textPrimary,
    fontSize: 13.5,
    flex: 1,
  },
  prefValuePill: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  prefValueText: {
    ...type.bodyMedium,
    color: colors.textSecondary,
    fontSize: 11.5,
  },
});