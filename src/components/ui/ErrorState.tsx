import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';
import { Button } from './Button';

interface StateAction {
  label: string;
  onPress: () => void;
}

interface ErrorStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: StateAction;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({
  icon = '!',
  title,
  message,
  action,
  style,
}: ErrorStateProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action ? (
        <Button label={action.label} onPress={action.onPress} style={styles.action} />
      ) : null}
    </View>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    color: theme.feedback.error,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
  },
  title: {
    color: theme.feedback.error,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: theme.text.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  action: {
    marginTop: 22,
    minWidth: 180,
  },
});