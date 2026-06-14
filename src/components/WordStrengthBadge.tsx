import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WordStrength, STRENGTH_LABELS } from '../services/wordStrengthService';
import { colors } from '../theme/colors';

const STRENGTH_COLORS: Record<WordStrength, string> = {
  new: colors.textMuted,
  shaky: colors.warning,
  strong: colors.primary,
  mastered: colors.success,
};

interface WordStrengthBadgeProps {
  strength: WordStrength;
}

export function WordStrengthBadge({ strength }: WordStrengthBadgeProps) {
  const color = STRENGTH_COLORS[strength];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.label, { color }]}>{STRENGTH_LABELS[strength]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
