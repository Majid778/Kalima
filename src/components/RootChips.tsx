import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArabicText } from './ArabicText';
import { normalizeArabic } from '../services/arabicNormalize';
import type { WordStrength } from '../services/wordStrengthService';
import { colors } from '../theme/colors';

type RootChipSibling = {
  id: number;
  arabic: string;
  meaning: string;
};

interface RootChipsProps {
  root: string | null;
  siblings: RootChipSibling[];
  knownMap?: Map<string, WordStrength>;
  onSelectWord?: (wordId: number) => void;
}

const strengthColors: Record<WordStrength, string> = {
  mastered: colors.success,
  strong: colors.success,
  shaky: colors.warning,
  new: colors.warning,
};

function arabicColorForSibling(
  sibling: RootChipSibling,
  knownMap?: Map<string, WordStrength>,
): string {
  const strength = knownMap?.get(normalizeArabic(sibling.arabic));
  return strength ? strengthColors[strength] : colors.textMuted;
}

export function RootChips({
  root,
  siblings,
  knownMap,
  onSelectWord,
}: RootChipsProps) {
  if (siblings.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Same root · {root}</Text>

      <View style={styles.chipRow}>
        {siblings.map((sibling) => {
          const chipContent = (
            <>
              <ArabicText
                size="small"
                color={arabicColorForSibling(sibling, knownMap)}
                style={styles.chipArabic}
              >
                {sibling.arabic}
              </ArabicText>
              <Text style={styles.chipMeaning}>{sibling.meaning}</Text>
            </>
          );

          if (onSelectWord) {
            return (
              <Pressable
                key={sibling.id}
                testID="root-chip"
                accessibilityRole="button"
                onPress={() => onSelectWord(sibling.id)}
                style={({ pressed }) => [
                  styles.chip,
                  pressed && styles.chipPressed,
                ]}
              >
                {chipContent}
              </Pressable>
            );
          }

          return (
            <View key={sibling.id} testID="root-chip" style={styles.chip}>
              {chipContent}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
  header: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  chipRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    writingDirection: 'rtl',
  },
  chip: {
    maxWidth: '100%',
    minHeight: 40,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipPressed: {
    opacity: 0.72,
  },
  chipArabic: {
    textAlign: 'right',
  },
  chipMeaning: {
    color: colors.textSecondary,
    fontSize: 12,
    flexShrink: 1,
  },
});