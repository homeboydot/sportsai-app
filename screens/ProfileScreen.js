// screens/ProfileScreen.js
import React from 'react';
import { StyleSheet, ScrollView, StatusBar, SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import GlassCard from '../components/GlassCard';
import TagChip from '../components/TagChip';
import { colors, type, spacing, radius, gradients } from '../theme/tokens';

const FAVORITE_TEAMS = ['Arsenal', 'Real Madrid', 'Inter Miami'];
const FAVORITE_LEAGUES = ['Premier League', 'Champions League', 'La Liga'];
const AI_PREFERENCES = [
  { id: 'tone', icon: 'sliders', label: 'Analysis style', value: 'Data-first' },
  { id: 'risk', icon: 'shield', label: 'Risk appetite', value: 'Balanced' },
  { id: 'alerts', icon: 'bell', label: 'Insight alerts', value: 'On' },
];

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
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
            <Text style={styles.avatarInitial}>F</Text>
          </LinearGradient>
          <View style={styles.identityText}>
            <Text style={styles.name}>Feranmi</Text>
            <Text style={styles.handle}>Member since 2026</Text>
          </View>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.75}>
            <Feather name="edit-2" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Section title="Favorite Teams">
          <View style={styles.chipRow}>
            {FAVORITE_TEAMS.map((t) => (
              <TagChip key={t} label={t} emphasis />
            ))}
            <TouchableOpacity style={styles.addChip} activeOpacity={0.75}>
              <Feather name="plus" size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="Favorite Leagues">
          <View style={styles.chipRow}>
            {FAVORITE_LEAGUES.map((l) => (
              <TagChip key={l} label={l} />
            ))}
            <TouchableOpacity style={styles.addChip} activeOpacity={0.75}>
              <Feather name="plus" size={13} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="AI Preferences">
          <GlassCard noPadding>
            {AI_PREFERENCES.map((pref, i) => (
              <View
                key={pref.id}
                style={[styles.prefRow, i !== AI_PREFERENCES.length - 1 && styles.prefDivider]}
              >
                <View style={styles.prefIcon}>
                  <Feather name={pref.icon} size={15} color={colors.emerald} />
                </View>
                <Text style={styles.prefLabel}>{pref.label}</Text>
                <View style={styles.prefValuePill}>
                  <Text style={styles.prefValueText}>{pref.value}</Text>
                </View>
              </View>
            ))}
          </GlassCard>
        </Section>
      </ScrollView>
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
