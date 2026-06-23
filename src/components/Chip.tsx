import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { mushafPalette } from '../theme/palette';
import { AppIcon, IconName } from './AppIcon';
import { display } from '../theme/typography';

export interface ChipProps {
  icon?: IconName;
  label: string;
  dark?: boolean;
}

export const Chip: React.FC<ChipProps> = ({ icon, label, dark = false }) => {
  return (
    <View
      style={[
        styles.container,
        dark ? styles.darkVariant : styles.lightVariant,
      ]}
    >
      {icon && (
        <AppIcon
          name={icon}
          size={15}
          color={dark ? '#e9dcb6' : mushafPalette.goldDeep}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            color: dark ? '#e9dcb6' : mushafPalette.ink2,
            fontFamily: display.semibold,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    fontSize: 13,
  },
  lightVariant: {
    backgroundColor: mushafPalette.paper,
    borderWidth: 1,
    borderColor: mushafPalette.goldLine,
  },
  darkVariant: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
