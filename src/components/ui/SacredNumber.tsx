import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';

interface SacredNumberProps {
  percent: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function SacredNumber({
  percent,
  label = "of the Qur'an you understand",
  style,
}: SacredNumberProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const displayPercent = `${Math.round(percent * 100)}%`;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.value}>{displayPercent}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  value: {
    color: theme.sacred.sacred,
    fontSize: 52,
    fontWeight: '900',
  },
  label: {
    color: theme.text.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});