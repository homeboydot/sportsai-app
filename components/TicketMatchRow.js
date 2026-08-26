// components/TicketMatchRow.js
// A single tappable match row used by screens/TicketBuilderScreen.js to
// let the user select real matches for their own manual ticket. Shows
// only real data (league, teams, live score/minute when applicable) —
// no predictions, no confidence scores, no invented stats.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, type, spacing, radius } from '../theme/tokens';

export default function TicketMatchRow({ match, selected, onToggle }) {
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.row, selected && styles.rowSelected]}
      onPress={() => onToggle(match.id)}
    >
      <View style={[styles.checkbox, !selected && styles.checkboxEmpty]}>
        {selected ? <Feather name="check" size={13} color={colors.textOnEmerald} /> : null}
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.teams} numberOfLines={1}>
          {match.home} vs {match.away}
        </Text>
        <Text style={styles.league} numberOfLines={1}>
          {match.league}
        </Text>
      </View>

      {isLive ? (
        <View style={styles.liveTag}>
          <Text style={styles.liveTagText}>
            {match.homeScore}-{match.awayScore} · {match.minute}'
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    backgroundColor: colors.bgCard,
    marginBottom: spacing.sm,
  },
  rowSelected: {
    borderColor: 'rgba(18,225,155,0.4)',
    backgroundColor: colors.emeraldFaint,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.emerald,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxEmpty: {
    backgroundColor: 'transparent',
    borderColor: colors.borderGlassStrong,
  },
  textBlock: {
    flex: 1,
  },
  teams: {
    ...type.bodySemiBold,
    color: colors.textPrimary,
    fontSize: 13.5,
  },
  league: {
    ...type.body,
    color: colors.textTertiary,
    fontSize: 11.5,
    marginTop: 2,
  },
  liveTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,90,95,0.12)',
    marginLeft: spacing.sm,
  },
  liveTagText: {
    ...type.mono,
    color: colors.live,
    fontSize: 10.5,
  },
});