import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { mushafPalette } from '../theme/palette';
import { AppIcon, IconName } from './AppIcon';
import { display } from '../theme/typography';

export interface StatCardProps {
  icon: IconName;
  value: string;
  label: string;
  valueColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, value, label, valueColor = mushafPalette.ink }) => {
  return (
    <View style={[styles.card, { borderColor: mushafPalette.goldLine }]}>
      <View style={styles.row}>
        <AppIcon name={icon} size={22} color={mushafPalette.goldDeep} />
        <Text style={[styles.value, { color: valueColor, fontFamily: display.bold }]}>{value}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: mushafPalette.paper,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    shadowColor: 'rgba(120, 90, 30, 0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  value: {
    fontSize: 27,
    marginLeft: 12,
  },
  label: {
    fontSize: 11,
    color: mushafPalette.muted,
  },
});
