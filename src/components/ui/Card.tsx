import React, { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';

interface CardProps {
  children: ReactNode;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Card({ children, elevated = false, style, testID }: CardProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.card, elevated ? styles.elevated : null, style]} testID={testID}>
      {children}
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  card: {
    backgroundColor: theme.surfaces.surface,
    borderColor: theme.surfaces.border,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  elevated: {
    backgroundColor: theme.surfaces.surfaceElevated,
  },
});