import React, { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';
import { ChipTone } from './Chip';

interface BadgeProps {
  children: ReactNode;
  tone?: ChipTone | 'error';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Badge({ children, tone = 'neutral', style, testID }: BadgeProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.badge, styles[`${tone}Badge`], style]} testID={testID}>
      <Text style={[styles.label, styles[`${tone}Label`]]}>{children}</Text>
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    minHeight: 22,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
  },
  neutralBadge: {
    backgroundColor: theme.surfaces.surfaceElevated,
  },
  neutralLabel: {
    color: theme.text.textSecondary,
  },
  masteryBadge: {
    backgroundColor: theme.learningState.mastery,
  },
  masteryLabel: {
    color: theme.text.onAction,
  },
  learningBadge: {
    backgroundColor: theme.learningState.learning,
  },
  learningLabel: {
    color: theme.text.onSacred,
  },
  dueBadge: {
    backgroundColor: theme.learningState.due,
  },
  dueLabel: {
    color: theme.text.onAction,
  },
  sacredBadge: {
    backgroundColor: theme.sacred.sacred,
  },
  sacredLabel: {
    color: theme.text.onSacred,
  },
  errorBadge: {
    backgroundColor: theme.feedback.error,
  },
  errorLabel: {
    color: theme.text.onAction,
  },
});