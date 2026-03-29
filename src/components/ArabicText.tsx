import React from 'react';
import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';
import { fonts, arabicFontSizes, arabicLineHeights, ArabicFontSize } from '../theme/typography';
import { colors } from '../theme/colors';

interface ArabicTextProps extends Omit<TextProps, 'style'> {
  children: string;
  style?: TextStyle;
  size?: ArabicFontSize;
  color?: string;
}

export function ArabicText({
  children,
  style,
  size = 'medium',
  color,
  ...textProps
}: ArabicTextProps) {
  return (
    <Text
      style={[
        styles.arabic,
        {
          fontSize: arabicFontSizes[size],
          lineHeight: arabicLineHeights[size],
        },
        color ? { color } : null,
        style,
      ]}
      allowFontScaling={false}
      {...textProps}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  arabic: {
    fontFamily: fonts.arabic,     // 'KFGQPC-Uthmanic-Script-HAFS' per D-03
    writingDirection: 'rtl',       // Per-component RTL only (D-10, ARAB-02)
    textAlign: 'right',            // D-10
    color: colors.text,            // Default white; override via color prop
  },
});
