import React, { useMemo } from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  StyleProp,
  Text,
  ViewStyle,
} from 'react-native';
import { hapticLight } from '../../theme/motion';
import { ThemeTokens } from '../../theme/theme';
import { useTheme } from '../../theme/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;
    void hapticLight();
    onPress?.(event);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled ? styles[`${variant}Pressed`] : null,
        disabled ? styles.disabled : null,
        style,
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel,
          disabled ? styles.disabledLabel : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (theme: ThemeTokens) => StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primary: {
    backgroundColor: theme.action.action,
    borderColor: theme.action.action,
  },
  primaryPressed: {
    backgroundColor: theme.action.actionPressed,
    borderColor: theme.action.actionPressed,
  },
  secondary: {
    backgroundColor: theme.surfaces.surface,
    borderColor: theme.surfaces.border,
  },
  secondaryPressed: {
    backgroundColor: theme.surfaces.surfaceElevated,
  },
  ghost: {
    backgroundColor: theme.surfaces.background,
    borderColor: theme.surfaces.background,
  },
  ghostPressed: {
    backgroundColor: theme.surfaces.surfaceElevated,
    borderColor: theme.surfaces.surfaceElevated,
  },
  disabled: {
    backgroundColor: theme.action.actionDisabled,
    borderColor: theme.action.actionDisabled,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryLabel: {
    color: theme.text.onAction,
  },
  secondaryLabel: {
    color: theme.text.textPrimary,
  },
  disabledLabel: {
    color: theme.text.textMuted,
  },
});