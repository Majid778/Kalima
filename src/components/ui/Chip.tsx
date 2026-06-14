import React, { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';

export type ChipTone = 'neutral' | 'mastery' | 'learning' | 'due' | 'sacred';

interface ChipProps {
  children: ReactNode;
  tone?: ChipTone;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Chip({ children, tone = 'neutral', style, testID }: ChipProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.chip, styles[`${tone}Chip`], style]} testID={testID}>
      <Text style={[styles.label, styles[`${tone}Label`]]}>{children}</Text>
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  chip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.surfaces.surface,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  neutralChip: {
    borderColor: theme.surfaces.border,
  },
  neutralLabel: {
    color: theme.text.textSecondary,
  },
  masteryChip: {
    borderColor: theme.learningState.mastery,
  },
  masteryLabel: {
    color: theme.learningState.mastery,
  },
  learningChip: {
    borderColor: theme.learningState.learning,
  },
  learningLabel: {
    color: theme.learningState.learning,
  },
  dueChip: {
    borderColor: theme.learningState.due,
  },
  dueLabel: {
    color: theme.learningState.due,
  },
  sacredChip: {
    borderColor: theme.sacred.sacred,
  },
  sacredLabel: {
    color: theme.sacred.sacred,
  },
});