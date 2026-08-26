// components/CoverageNote.js
//
// A small, honest disclosure of exactly which leagues this app actually
// covers. Added after real confusion during testing: matches from
// leagues football-data.org's free tier doesn't track (e.g. Zambian
// football, Asian club competitions) looked like a bug ("no ongoing
// matches") when the app was actually working correctly — it just had
// no way to know those leagues existed. Rather than let that keep
// looking like a broken app, this makes the real scope visible so a
// missing match reads as "not covered yet," not "something's wrong."
//
// The league list intentionally matches FALLBACK_COMPETITIONS in
// api/providers/footballDataOrgProvider.js exactly — if that list ever
// changes, update both places together.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import TagChip from './TagChip';
import { colors, type, spacing } from '../theme/tokens';

const COVERED_LEAGUES = [
  'Premier League',
  'La Liga',
  'Bundesliga',
  'Serie A',
  'Ligue 1',
  'Eredivisie',
  'Primeira Liga',
  'Championship',
  'Brazilian Serie A',
  'Champions League',
  'World Cup',
  'Euros',
];

export default function CoverageNote() {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Feather name="info" size={13} color={colors.textTertiary} />
        <Text style={styles.headerText}>
          Covering these {COVERED_LEAGUES.length} competitions — other leagues aren't tracked yet
        </Text>
      </View>
      <View style={styles.chipRow}>
        {COVERED_LEAGUES.map((league) => (
          <TagChip key={league} label={league} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerText: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 11.5,
    marginLeft: 6,
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});