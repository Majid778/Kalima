import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { display } from '../theme/typography';

export interface CountBoxProps {
  label: string;
  value: string | number;
  color: string;
}

export const CountBox: React.FC<CountBoxProps> = ({ label, value, color }) => {
  return (
    <View style={[styles.container, { borderColor: color }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
      <Text style={[styles.value, { color, fontFamily: display.extrabold }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 3,
  },
  value: {
    fontSize: 19,
  },
});
